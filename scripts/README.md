# 维护脚本

所有命令均从仓库根目录执行。日常操作优先使用 `Makefile`，避免记忆底层参数。

| 文件 | 用途 | 常用入口 |
| --- | --- | --- |
| `sync-homepage.mjs` | 生成与 `index.html` 一致的 `zh.html` 兼容页 | `make sync-homepage` |
| `check-content.mjs` | 校验网页与各简历的事实、链接和表述一致性 | `make check` |
| `check-content.test.mjs` | 内容回归测试 | `make check` |
| `check-website-star.test.mjs` | 网页 STAR 结构及展示边界回归测试 | `make check` |
| `check-cv-pdfs.mjs` | 校验通用中文 PDF 的新鲜度和关键文本 | `make check` |
| `redact-pdf-text.py` | 安全移除 PDF 指定文字、绘制马赛克并导出 PNG | `uv run scripts/redact-pdf-text.py --help` |

`redact-pdf-text.py` 使用 PEP 723 声明 PyMuPDF 依赖，建议通过 `uv run` 执行。它不会修改源 PDF；默认拒绝覆盖已有输出，并在保存后重新检查目标文字是否仍可检索。
