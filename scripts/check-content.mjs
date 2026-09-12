// Offline guard for project profiles, scoped results and linked evidence.
// Checks consistency, not factual truth, upstream freshness or UI behavior.
import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Role-specific CVs are local application artifacts, not required in a fresh
// public-site checkout. Whenever present, validate them with the general CV.
export const roleCvPaths = [
  'assets/cv/Agent开发/李袖印_香港大学_Agent开发_实习时长6个月.tex',
  'assets/cv/Agent评测/李袖印_香港大学_Agent评测_实习时长6个月.tex',
];
export const sourcePaths = ['index.html', 'assets/CV_zh.tex', 'assets/CV.tex',
  ...roleCvPaths.filter(path => existsSync(resolve(root, path)))];
export const isChineseCv = path => path === 'assets/CV_zh.tex' || roleCvPaths.includes(path);
export const meetingEvidenceBase = 'https://github.com/lixiuyin/meeting-agent/blob/ad06d8a136268a9b52310488aa54329d4b5a7254/';
export const meetingReports = {
  zh: meetingEvidenceBase + 'README.zh-CN.md#' + encodeURIComponent('最新-benchmark-结果'),
  en: meetingEvidenceBase + 'README.md#latest-benchmark-results',
};
const meetingRaw = meetingEvidenceBase + 'docs/validation/latest-benchmark.json';
const webReport = 'https://github.com/lixiuyin/web-agent/blob/00e1c0ce0927e37bae63fa7647891ea3d690f102/docs/research/results/generality-campaign-2026-09-09.zh-CN.md';

export function readSources() {
  return Object.fromEntries(sourcePaths.map(path => [path, readFileSync(resolve(root, path), 'utf8')]));
}

export function checkContent(sources, paths = sourcePaths) {
  const errors = [];
  for (const path of paths) {
    // LaTeX escapes fragment delimiters and percent-encoded non-ASCII headings.
    const raw = (sources[path] ?? '').replace(/^\s*%.*$/gm, '').replace(/\\([#%])/g, '$1');
    // Decode numeric entities so an encoded old address cannot bypass the check.
    const text = raw.replace(/&#(x[0-9a-f]+|\d+);/gi, (_, code) =>
      String.fromCodePoint(code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code)));
    const requireText = (value, area = text) => {
      if (!area.replace(/\s+/g, ' ').includes(value)) errors.push(`${path}: missing reviewed content: ${value}`);
    };
    requireText('mailto:lixiuyin2025@163.com');
    if (text.includes('xiuyinli26@gmail.com')) errors.push(`${path}: old primary email`);
    for (const old of ['0.997', '0.932']) {
      if (text.includes(old)) errors.push(`${path}: superseded answer score ${old}`);
    }
    requireText('MeetingAgent');
    if (text.includes('Meeting Agent')) errors.push(`${path}: superseded project display name Meeting Agent`);
    if (isChineseCv(path)) {
      // Identify complete project blocks, independent of order or bold styling.
      const projects = [...text.matchAll(/\\resumeProjectHeading\s*\n[\s\S]*?\\resumeItemListEnd/g)].map(m => m[0]);
      const meeting = projects.find(entry => /\{MeetingAgent\s*---/.test(entry)) ?? '';
      const web = projects.find(entry => /\{WebAgent\s*---/.test(entry)) ?? '';
      const plain = area => area.replace(/\\(?:textbf|mbox|emph)\{/g, '').replace(/[{}]/g, '').replace(/\s+/g, '');
      const need = (token, area) => {
        if (!plain(area).includes(token.replace(/\s+/g, ''))) errors.push(`${path}: missing reviewed content: ${token}`);
      };
      for (const token of [meetingReports.zh, '项目内小样本问答集', '独立LLM裁判', '每例评审3次', '0.883', '0.927', '22/22项事件正确性检查']) need(token, meeting);
      for (const token of [webReport, '同一组36项项目内任务', '71/72次执行', '60阶段', '独立终态']) need(token, web);
      if (path.includes('Agent评测')) {
        for (const token of ['GLM36/36', 'Qwen35/36', '单项严格搜索任务', '10/10项断言', '6/6项轨迹约束检查']) need(token, web);
        for (const token of ['20次性能请求均完成且未降级', '性能瓶颈', '8项确定性策略场景检查']) need(token, meeting);
      } else {
        for (const token of ['并行', '重试', '双时态', '不可变修订', 'BM25', 'RRF']) need(token, meeting);
        for (const token of ['Playwright/CDP', '原子检查点', '受支持的浏览器状态']) need(token, web);
      }
      if (/72\/72|(?:10个(?:人工构造|合成)问答)/.test(meeting + web)) errors.push(`${path}: outdated count or overstated result`);
      need('可立即到岗', text);
      need('每周5天', text);
      need('连续实习6个月以上', text);
      need('可接受异地实习', text);
      if (/\\hfill\{\\scriptsize\\textcolor\{Gray\}/.test(text)) errors.push(`${path}: dated CV header`);
      const sectionOrder = ['项目经历', '专业技能'].map(title => text.indexOf(`\\section{${title}}`));
      if (sectionOrder.some((at, i) => at < 0 || (i > 0 && at <= sectionOrder[i - 1]))) errors.push(`${path}: inconsistent CV section order`);
      continue;
    }
    const texProjects = [...text.matchAll(/\\resumeProjectHeading\s*\n[\s\S]*?\\resumeItemListEnd/g)].map(m => m[0]);
    // HTML projects can be reordered without changing their evidence ownership.
    const entries = [...text.matchAll(/<div class="entry"(?: id="[^"]+")?>[\s\S]*?<\/div>/g)].map(match => match[0]);
    const meeting = path.endsWith('.html')
      ? entries.find(entry => /<h3\b[\s\S]*?MeetingAgent[\s\S]*?<\/h3>/.test(entry)) ?? ''
      : texProjects.find(entry => /\{MeetingAgent\b/.test(entry)) ?? '';
    const web = path.endsWith('.html')
      ? entries.find(entry => /<h3\b[\s\S]*?WebAgent[\s\S]*?<\/h3>/.test(entry)) ?? ''
      : texProjects.find(entry => /\{WebAgent\b/.test(entry)) ?? '';
    const chinese = path === 'index.html' || path === 'assets/CV_zh.tex';
    const meetingReport = meetingReports[chinese ? 'zh' : 'en'];
    for (const token of ['SSE', 'FTS5/BM25', 'RRF', meetingReport]) requireText(token, meeting);
    for (const token of ['router', 'funnel']) {
      if (!meeting.toLowerCase().includes(token)) errors.push(`${path}: missing architecture: ${token}`);
    }
    requireText(chinese ? '模块化单体' : 'modular monolith', meeting);
    requireText(chinese ? '并行' : 'in parallel', meeting);
    requireText(chinese ? '重试' : 'retries', meeting);
    requireText(chinese ? '双时态' : 'bitemporal', meeting);
    requireText(chinese ? '不可变修订' : 'immutable revisions', meeting);
    for (const token of ['Planner', 'Tool', 'AgentHook', 'Playwright/CDP', webReport]) requireText(token, web);
    requireText(chinese ? '原子检查点' : 'atomic checkpoint', web);
    requireText(chinese ? '受支持的浏览器状态' : 'supported browser state', web);

    // Preserve report URLs (which contain dates) and career dates, but keep
    // benchmark dates and snapshot scores out of the technical narrative.
    // Separately validated result summaries may expose scoped outcomes.
    const prose = (meeting + web)
      .replace(/https?:\/\/[^\s"'<>}]+/g, '')
      .replace(/<details\b[\s\S]*?<\/details>/g, '')
      .replace(/<p class="project-result">[\s\S]*?<\/p>/g, '');
    if (/\b20\d{2}-\d{2}-\d{2}\b|合成诊断|单日项目内评测|synthetic diagnostics|single-day/i.test(prose)) {
      errors.push(`${path}: benchmark date or diagnostic label in main project prose`);
    }
    if (path.endsWith('.html') && /0\.883|0\.927|71\/72|36\/36|35\/36|10\/10|6\/6/.test(prose)) {
      errors.push(`${path}: snapshot score in main project prose`);
    }
    if (path === 'assets/CV.tex') {
      for (const token of ['tel:+8618628157794', '5 days/week', '6+ months', 'open to relocation across China', 'basic C++/Java']) requireText(token);
      // English CV results now follow the same scoped STAR narrative as the
      // Chinese variants; keep methodology and task counts beside the scores.
      for (const token of ['project-level evaluation', 'independent LLM judge', 'small-sample QA', 'three times', '0.883', '0.927', '22/22 event checks']) requireText(token, meeting);
      for (const token of ['two models', '71/72 executions', 'same 36 project-level tasks', '60-stage task', 'failure traces']) requireText(token, web);
      if (/72\/72/.test(web)) errors.push(`${path}: overstated execution result`);
    }
    if (path.endsWith('.html')) {
      if (path === 'index.html') {
        const active = text.replace(/<!--[\s\S]*?-->/g, '');
        if (/href=["'][^"']*\.pdf(?:[?#][^"']*)?["']/i.test(active)) errors.push(`${path}: public CV download link must remain removed`);
        if (active.indexOf('<section id="projects"') > active.indexOf('<section id="interests"')) errors.push(`${path}: projects must precede interests`);
        requireText('可连续实习 6 个月及以上', active);
        requireText('现居成都，可赴全国异地实习', active);
        const visibleResult = area => area.match(/<p class="project-result">([\s\S]*?)<\/p>/)?.[1] ?? '';
        for (const area of [meeting, web]) requireText('项目内评测', visibleResult(area));
        requireText('小样本问答集', visibleResult(meeting));
        requireText('22/22 项事件正确性检查', visibleResult(meeting));
        requireText('两个模型在相同的 36 项任务上共通过 71/72 次执行', visibleResult(web));
      }
      requireText(meetingRaw, meeting);
      // Compact result summaries retain case counts and project-level scope;
      // detailed methodology and limitations remain in the pinned reports.
      requireText(chinese ? '小样本问答集' : '10 constructed answer cases', meeting);
      for (const area of [meeting, web]) {
        requireText(chinese ? '项目内评测' : 'project-level evaluations', area);
      }
      for (const token of ['0.883', '0.927', '22/22']) requireText(token, meeting);
      for (const token of ['71/72', '36/36', '35/36']) requireText(token, web);
      requireText(chinese ? '两个模型在相同的 36 项任务上' : 'two models each ran the same 36 tasks', web);
      requireText(chinese ? '独立 Judge' : 'independent judge', meeting.slice(meeting.indexOf('<details')));
      requireText(chinese ? '60 阶段强制恢复任务' : '60-stage forced-resume task', web);
      const evidenceHeading = chinese ? '实现与评测说明' : 'Evaluation results';
      if (text.split(`<summary>${evidenceHeading}</summary>`).length - 1 !== 2) {
        errors.push(`${path}: expected two matching evidence headings`);
      }
      requireText(path === 'index.html' ? '500 个测试样本' : '500 test samples');
      requireText('seed=42');
      if ((text.match(/<details class="project-evidence">/g) ?? []).length !== 2) {
        errors.push(`${path}: expected two expandable evidence notes`);
      }
    }
  }
  return errors;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const paths = process.argv.includes('--website') ? sourcePaths.filter(path => path.endsWith('.html')) : sourcePaths;
  const errors = checkContent(readSources(), paths);
  errors.forEach(error => console.error(error));
  if (errors.length) process.exitCode = 1;
  else console.log(`Reviewed content, evidence links and contact details match across ${paths.length} sources.`);
}
