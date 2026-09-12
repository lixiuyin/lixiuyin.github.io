// The named application PDF is the sole general Chinese output. Check its
// shared input as well as its content; no duplicate PDF is needed as a baseline.
import { existsSync, statSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const combined = resolve(root, 'assets/cv/Agent开发与评测/李袖印_香港大学_Agent开发与评测_实习时长6个月.pdf');
if (existsSync(combined)) {
  const text = path => execFileSync('pdftotext', ['-layout', path, '-'], {encoding: 'utf8'}).replace(/\s+/g, '');
  if (statSync(resolve(root, 'assets/CV_zh.tex')).mtimeMs > statSync(combined).mtimeMs) {
    throw new Error('The general Chinese PDF is older than its shared source. Run make cv-zh.');
  }
  const body = text(combined);
  for (const token of ['数据科学硕士', '2027年7月', 'GPA3.51', '均分86.52', '均分88.86', '项目内小样本问答集', '文档解析与图表定位', '引用定位与版本校验', '71/72', '0.883', '0.927', '22/22']) {
    if (!body.includes(token)) throw new Error(`General Chinese PDF is missing reviewed content: ${token}`);
  }
  if (/10个(?:人工构造|合成)问答|2027年7月（预计）/.test(body)) {
    throw new Error('The general Chinese PDF contains superseded wording. Run make cv-zh.');
  }
  console.log('Named general Chinese PDF passes source freshness and content checks.');
}
