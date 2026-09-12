#!/usr/bin/env -S uv run
# /// script
# requires-python = ">=3.10"
# dependencies = [
#   "pymupdf>=1.24,<2",
# ]
# ///
"""Securely redact exact text in PDFs and render the results as PNG images.

Examples:
    uv run scripts/redact-pdf-text.py \
      --text "+86 186 2815 7794" \
      --text "李袖印" \
      --dpi 600 \
      assets/cv/Agent开发/example.pdf

    uv run scripts/redact-pdf-text.py \
      --text "+86 186 2815 7794" \
      --suffix "_手机号已打码" \
      --overwrite \
      assets/cv/Agent开发/example.pdf \
      assets/cv/Agent评测/example.pdf

The source PDFs are never modified. By default, each output is written beside
its source as ``<stem>_已打码.pdf`` plus one PNG per page. Existing outputs are
not overwritten unless ``--overwrite`` is supplied.
"""

from __future__ import annotations

import argparse
import os
from pathlib import Path
import sys
import tempfile

import pymupdf as fitz


MOSAIC_COLORS = (
    (0.31, 0.33, 0.36),
    (0.43, 0.45, 0.48),
    (0.55, 0.57, 0.60),
    (0.38, 0.40, 0.43),
)


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "从 PDF 中安全移除指定文字、覆盖马赛克，并生成高清 PNG；"
            "不会修改原始文件。"
        )
    )
    parser.add_argument(
        "pdfs",
        nargs="+",
        type=Path,
        help="一个或多个输入 PDF 路径",
    )
    parser.add_argument(
        "--text",
        required=True,
        action="append",
        metavar="TEXT",
        help="需要精确查找并打码的文字；可重复传入，例如姓名和手机号",
    )
    parser.add_argument(
        "--suffix",
        default="_已打码",
        help="输出文件名后缀（默认：_已打码）",
    )
    parser.add_argument(
        "--output-dir",
        type=Path,
        help="统一输出目录；省略时输出到各源文件所在目录",
    )
    parser.add_argument(
        "--dpi",
        type=int,
        default=600,
        help="PNG 分辨率（默认：600 DPI）",
    )
    parser.add_argument(
        "--columns",
        type=int,
        default=20,
        help="马赛克横向格数（默认：20）",
    )
    parser.add_argument(
        "--rows",
        type=int,
        default=2,
        help="马赛克纵向格数（默认：2）",
    )
    parser.add_argument(
        "--overwrite",
        action="store_true",
        help="允许覆盖已存在的打码 PDF 和 PNG",
    )
    parser.add_argument(
        "--no-images",
        action="store_true",
        help="只生成打码 PDF，不导出 PNG",
    )
    return parser.parse_args()


def ensure_writable(path: Path, overwrite: bool) -> None:
    if path.exists() and not overwrite:
        raise FileExistsError(f"输出已存在（可添加 --overwrite）：{path}")


def mosaic(page: fitz.Page, rect: fitz.Rect, columns: int, rows: int) -> None:
    """Draw a deterministic gray pixel mosaic over an already-redacted area."""
    cell_width = rect.width / columns
    cell_height = rect.height / rows
    for row in range(rows):
        for column in range(columns):
            cell = fitz.Rect(
                rect.x0 + column * cell_width,
                rect.y0 + row * cell_height,
                rect.x0 + (column + 1) * cell_width,
                rect.y0 + (row + 1) * cell_height,
            )
            color = MOSAIC_COLORS[(row * columns + column * 3) % len(MOSAIC_COLORS)]
            page.draw_rect(cell, color=color, fill=color, width=0, overlay=True)


def output_paths(
    source: Path, suffix: str, output_dir: Path | None
) -> tuple[Path, Path]:
    directory = (output_dir or source.parent).expanduser().resolve()
    directory.mkdir(parents=True, exist_ok=True)
    stem = f"{source.stem}{suffix}"
    return directory / f"{stem}.pdf", directory / stem


def redact_pdf(
    source: Path,
    destination: Path,
    texts: list[str],
    columns: int,
    rows: int,
    overwrite: bool,
) -> dict[str, int]:
    ensure_writable(destination, overwrite)
    if source.resolve() == destination.resolve():
        raise ValueError("输出路径不能与源 PDF 相同，请保留非空 --suffix。")

    document = fitz.open(source)
    matches_by_page: list[list[fitz.Rect]] = []
    match_counts = dict.fromkeys(texts, 0)

    try:
        for page in document:
            matches = []
            for text in texts:
                text_matches = page.search_for(text)
                matches.extend(text_matches)
                match_counts[text] += len(text_matches)
            matches_by_page.append(matches)

        missing = [text for text, count in match_counts.items() if count == 0]
        if missing:
            raise ValueError(f"未在 PDF 中找到指定文字：{missing!r}")

        metadata = document.metadata or {}
        sanitized_metadata = {}
        for key, value in metadata.items():
            sanitized = value or ""
            for text in texts:
                sanitized = sanitized.replace(text, "已打码")
            sanitized_metadata[key] = sanitized
        document.set_metadata(sanitized_metadata)

        for page, matches in zip(document, matches_by_page, strict=True):
            # Remove clickable links that overlap the confidential text.
            for link in page.get_links():
                link_rect = fitz.Rect(link.get("from", fitz.Rect()))
                if any(link_rect.intersects(match) for match in matches):
                    page.delete_link(link)

            padded_matches: list[fitz.Rect] = []
            for match in matches:
                # A small vertical allowance covers antialiasing without reaching
                # into adjacent contact details such as the email separator.
                padded = fitz.Rect(match.x0, match.y0 - 0.8, match.x1, match.y1 + 0.8)
                padded &= page.rect
                padded_matches.append(padded)
                page.add_redact_annot(padded, fill=(1, 1, 1), cross_out=False)

            # Remove the underlying content before drawing the visible mosaic.
            page.apply_redactions(images=0, graphics=0)
            for padded in padded_matches:
                mosaic(page, padded, columns, rows)

        destination.parent.mkdir(parents=True, exist_ok=True)
        with tempfile.NamedTemporaryFile(
            prefix=f".{destination.stem}.", suffix=".pdf", dir=destination.parent,
            delete=False,
        ) as temporary:
            temporary_path = Path(temporary.name)

        try:
            document.save(
                temporary_path,
                garbage=4,
                clean=True,
                deflate=True,
            )
            document.close()

            # Reopen the serialized file: a visible overlay alone is not enough.
            with fitz.open(temporary_path) as verified:
                for text in texts:
                    remaining = sum(len(page.search_for(text)) for page in verified)
                    if remaining:
                        raise RuntimeError(
                            "安全校验失败：输出 PDF 仍可检索到 "
                            f"{remaining} 处目标文字 {text!r}。"
                        )
                    if any(text in (value or "") for value in verified.metadata.values()):
                        raise RuntimeError(
                            f"安全校验失败：PDF 元数据仍包含目标文字 {text!r}。"
                        )

            os.replace(temporary_path, destination)
        finally:
            if temporary_path.exists():
                temporary_path.unlink()
    finally:
        if not document.is_closed:
            document.close()

    return match_counts


def render_pngs(
    pdf_path: Path,
    image_prefix: Path,
    dpi: int,
    overwrite: bool,
) -> list[Path]:
    outputs: list[Path] = []
    with fitz.open(pdf_path) as document:
        page_count = document.page_count
        for page_number, page in enumerate(document, start=1):
            if page_count == 1:
                output = image_prefix.with_suffix(".png")
            else:
                output = image_prefix.parent / (
                    f"{image_prefix.name}_第{page_number:02d}页.png"
                )
            ensure_writable(output, overwrite)
            pixmap = page.get_pixmap(dpi=dpi, alpha=False, annots=True)
            pixmap.save(output)
            outputs.append(output)
    return outputs


def main() -> int:
    args = parse_args()
    texts = list(dict.fromkeys(text.strip() for text in args.text if text.strip()))
    if not texts:
        raise ValueError("--text 不能为空。")
    if not 72 <= args.dpi <= 1200:
        raise ValueError("--dpi 应在 72 到 1200 之间。")
    if args.columns < 1 or args.rows < 1:
        raise ValueError("--columns 和 --rows 必须为正整数。")

    sources = [path.expanduser().resolve() for path in args.pdfs]
    missing = [path for path in sources if not path.is_file()]
    if missing:
        raise FileNotFoundError(f"输入文件不存在：{missing[0]}")

    for source in sources:
        destination, image_prefix = output_paths(
            source, args.suffix, args.output_dir
        )
        match_counts = redact_pdf(
            source,
            destination,
            texts,
            args.columns,
            args.rows,
            args.overwrite,
        )
        summary = "、".join(
            f"{text!r} {count} 处" for text, count in match_counts.items()
        )
        print(f"[完成] {source.name}: 已安全移除 {summary}")
        print(f"       PDF: {destination}")

        if not args.no_images:
            images = render_pngs(
                destination, image_prefix, args.dpi, args.overwrite
            )
            for image in images:
                print(f"       PNG: {image}")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except (FileExistsError, FileNotFoundError, RuntimeError, ValueError) as error:
        print(f"错误：{error}", file=sys.stderr)
        raise SystemExit(2) from error
