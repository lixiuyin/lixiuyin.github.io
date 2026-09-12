import assert from 'node:assert/strict';
import test from 'node:test';
import { checkContent, readSources, sourcePaths, meetingReports, meetingEvidenceBase, isChineseCv } from './check-content.mjs';

const legacyPaths = sourcePaths.filter(path => !isChineseCv(path));

test('all available profiles preserve scoped evidence', () => {
  assert.deepEqual(checkContent(readSources()), []);
});

test('English CV prioritizes Agent projects while preserving research experience', () => {
  const english = readSources()['assets/CV.tex'];
  assert.ok(english.indexOf('\\section{Selected Projects}') < english.indexOf('\\section{Research Experience}'));
  assert.ok(english.indexOf('{WebAgent ---') < english.indexOf('{MeetingAgent ---'));
});

test('education retains degree dates and overall grades after removing course scores', () => {
  const sources = readSources();
  for (const path of sourcePaths.filter(isChineseCv)) {
    assert.doesNotMatch(sources[path], /2027年7月（预计）/);
    assert.match(sources[path], /2025年9月 -- 2027年7月/);
    for (const token of ['数据科学硕士', 'GPA 3.51', '均分 86.52', '均分 88.86']) {
      assert.ok(sources[path].includes(token));
    }
    assert.match(sources[path], /前30\\%/);
  }
  assert.match(sources['index.html'], /GPA 3\.51，前 30%/);
  assert.match(sources['index.html'], /统计学理学学士（均分 86\.52，前 30%）/);
  assert.doesNotMatch(sources['index.html'], /预计2027年7月获授学位/);
  assert.doesNotMatch(sources['assets/CV.tex'], /Jul 2027 \(expected\)/);
  assert.match(sources['assets/CV.tex'], /Sep 2025 -- Jul 2027/);
  assert.match(sources['assets/CV.tex'], /Top 30\\%/);
  for (const token of ['Master of Data Science', 'GPA 3.51/4.30', 'Average 86.52/100', 'Average 88.86/100']) {
    assert.ok(sources['assets/CV.tex'].includes(token));
  }
});

test('Chinese CVs keep one compact honors line without restoring an awards section', () => {
  const sources = readSources();
  for (const path of sourcePaths.filter(isChineseCv)) {
    assert.match(sources[path], /\\textbf\{荣誉：\}山东大学优秀毕业生\\textbar\{\}全国大学生数学建模竞赛山东赛区一等奖/);
    assert.doesNotMatch(sources[path], /\\section\{荣誉奖项\}|美国大学生数学建模竞赛|MCM Honorable Mention/);
  }
  for (const path of sourcePaths.filter(path => !isChineseCv(path))) {
    assert.doesNotMatch(sources[path], /荣誉奖项|Awards \\& Teaching|Selected Awards|山东大学优秀毕业生|Outstanding Graduate|全国大学生数学建模竞赛|China Undergraduate Mathematical Contest in Modeling|美国大学生数学建模竞赛|MCM Honorable Mention/);
  }
  assert.doesNotMatch(sources['index.html'], /id="awards"|awards-heading/);
});

test('line wrapping does not change architecture coverage', () => {
  const sources = readSources();
  sources['assets/CV.tex'] = sources['assets/CV.tex'].replace('atomic checkpoint', 'atomic\n    checkpoint');
  assert.deepEqual(checkContent(sources), []);
});

for (const path of legacyPaths) {
  const chinese = path === 'index.html' || path === 'assets/CV_zh.tex';
  for (const boundary of chinese
    ? ['模块化单体', '并行', '重试', '受支持的浏览器状态']
    : ['modular monolith', 'in parallel', 'retries', 'supported browser state']) {
    test(`retain implementation boundary ${boundary} in ${path}`, () => {
      const sources = readSources();
      sources[path] = sources[path].replaceAll(boundary, 'REMOVED');
      assert.ok(checkContent(sources).some(error => error.includes(boundary)));
    });
  }
  for (const stale of ['0.997', '0.932']) {
    test(`reject stale answer score ${stale} in ${path}`, () => {
      const sources = readSources();
      sources[path] = sources[path].replace('MeetingAgent', `MeetingAgent ${stale}`);
      assert.ok(checkContent(sources).some(error => error.includes('superseded answer score')));
    });
  }
  test(`reject a benchmark date in the project narrative of ${path}`, () => {
    const sources = readSources();
    sources[path] = sources[path].replaceAll('MeetingAgent', 'MeetingAgent 2026-09-09');
    assert.ok(checkContent(sources).some(error => error.includes('benchmark date')));
  });
  test(`retain architecture coverage in ${path}`, () => {
    const sources = readSources();
    sources[path] = sources[path].replaceAll('FTS5/BM25', 'lexical retrieval');
    assert.ok(checkContent(sources).some(error => error.includes('FTS5/BM25')));
  });
}

for (const path of ['index.html']) {
  for (const boundary of path === 'index.html'
    ? ['项目内评测', '小样本问答集', '两个模型在相同的 36 项任务上', '独立 Judge', '60 阶段强制恢复任务']
    : ['project-level evaluations', '10 constructed answer cases', 'two models each ran the same 36 tasks', 'independent judge', '60-stage forced-resume task']) {
    test(`retain result scope ${boundary} in ${path}`, () => {
      const sources = readSources();
      sources[path] = sources[path].replaceAll(boundary, 'REMOVED');
      assert.ok(checkContent(sources).some(error => error.includes(boundary)));
    });
  }
  test(`keep result summaries concise in ${path}`, () => {
    const sources = readSources();
    const notes = [...sources[path].matchAll(/<details class="project-evidence">([\s\S]*?)<\/details>/g)];
    assert.equal(notes.length, 2);
    for (const [, note] of notes) {
      // Implementation details, evaluation scope, and preserved evidence links.
      assert.equal((note.match(/<p>/g) ?? []).length, 3);
    }
  });
}

test('retain small-sample scope with the reported answer scores', () => {
  const sources = readSources();
  sources['index.html'] = sources['index.html'].replace('小样本问答集', '生产表现');
  assert.ok(checkContent(sources).some(error => error.includes('小样本问答集')));
});

test('reject drift in the WebAgent run count', () => {
  const sources = readSources();
  sources['index.html'] = sources['index.html'].replace('71/72', '72/72');
  assert.ok(checkContent(sources).some(error => error.includes('71/72')));
});

for (const boundary of ['small-sample QA', 'independent LLM judge', 'three times', 'same 36 project-level tasks', '71/72 executions', '22/22 event checks']) {
  test(`English CV retains result scope: ${boundary}`, () => {
    const sources = readSources();
    sources['assets/CV.tex'] = sources['assets/CV.tex'].replaceAll(boundary, 'REMOVED');
    assert.ok(checkContent(sources).some(error => error.includes(boundary)));
  });
}

test('decode and reject a stale HTML-encoded primary email', () => {
  const sources = readSources();
  sources['index.html'] += [...'xiuyinli26@gmail.com'].map(c => `&#${c.codePointAt(0)};`).join('');
  assert.ok(checkContent(sources).some(error => error.includes('old primary email')));
});

test('reject an unpinned replacement of the reviewed evidence link', () => {
  const sources = readSources();
  sources['assets/CV.tex'] = sources['assets/CV.tex'].replace('ad06d8a136268a9b52310488aa54329d4b5a7254', 'main');
  assert.ok(checkContent(sources).some(error => error.includes('README.md#latest-benchmark-results')));
});

for (const path of sourcePaths) {
  const language = path === 'index.html' || isChineseCv(path) ? 'zh' : 'en';
  const reportLiteral = path.endsWith('.tex') ? meetingReports[language].replace(/[#%]/g, '\\$&') : meetingReports[language];
  test(`keep the readable, language-matched MeetingAgent report in ${path}`, () => {
    const sources = readSources();
    sources[path] = sources[path].replaceAll(reportLiteral, meetingEvidenceBase + 'docs/validation/latest-benchmark.json');
    assert.ok(checkContent(sources).some(error => error.includes(meetingReports[language])));
  });
  test(`keep the direct results-section anchor in ${path}`, () => {
    const sources = readSources();
    sources[path] = sources[path].replaceAll(reportLiteral, meetingReports[language].split('#')[0]);
    assert.ok(checkContent(sources).some(error => error.includes(meetingReports[language])));
  });
}

for (const path of ['index.html']) {
  test(`retain the raw evidence link alongside the readable report in ${path}`, () => {
    const sources = readSources();
    sources[path] = sources[path].replaceAll(meetingEvidenceBase + 'docs/validation/latest-benchmark.json', 'REMOVED');
    assert.ok(checkContent(sources).some(error => error.includes('latest-benchmark.json')));
  });
}

for (const path of sourcePaths.filter(isChineseCv)) {
  for (const token of ['项目内小样本问答集', '0.883', '0.927', '22/22项事件正确性检查', '71/72次执行', '连续实习6个月以上']) {
    test(`retain scoped CV result or availability ${token} in ${path}`, () => {
      const sources = readSources();
      sources[path] = sources[path].replaceAll(token, 'REMOVED');
      assert.ok(checkContent(sources).some(error => error.startsWith(path) && error.includes(token)));
    });
  }
  test(`CV evidence remains independent of project order in ${path}`, () => {
    const sources = readSources();
    const blocks = [...sources[path].matchAll(/\\resumeProjectHeading\s*\n[\s\S]*?\\resumeItemListEnd/g)].map(m => m[0]);
    const web = blocks.find(entry => entry.includes('{WebAgent ---'));
    const meeting = blocks.find(entry => entry.includes('{MeetingAgent ---'));
    assert.ok(web && meeting);
    sources[path] = sources[path].replace(web, '__WEB__').replace(meeting, web).replace('__WEB__', meeting);
    assert.deepEqual(checkContent(sources), []);
  });
}

test('public page does not regain a CV download link', () => {
  const sources = readSources();
  sources['index.html'] = sources['index.html'].replace('</nav>', '<a href="assets/CV_zh.pdf">简历</a></nav>');
  assert.ok(checkContent(sources).some(error => error.includes('download link')));
});

test('English internship CV preserves contact, mobility and skill level', () => {
  for (const token of ['tel:+8618628157794', '5 days/week', '6+ months', 'open to relocation across China', 'basic C++/Java']) {
    const sources = readSources();
    sources['assets/CV.tex'] = sources['assets/CV.tex'].replaceAll(token, 'REMOVED');
    assert.ok(checkContent(sources).some(error => error.includes(token)));
  }
});

test('website presents skills before interests and keeps a compact introduction', () => {
  const html = readSources()['index.html'];
  assert.ok(html.indexOf('<section id="skills"') < html.indexOf('<section id="interests"'));
  const intro = html.match(/<div class="bio">([\s\S]*?)<\/div>/)[1];
  assert.equal((intro.match(/<p>/g) ?? []).length, 2);
  assert.match(intro, /现居成都，可赴全国异地实习/);
});

test('evaluation CV describes trajectory checks without implying external certification', () => {
  const sources = readSources();
  const path = sourcePaths.find(path => path.includes('Agent评测'));
  if (!path) return;
  assert.match(sources[path], /6\/6项轨迹约束检查/);
  assert.doesNotMatch(sources[path], /项证书检查/);
  sources[path] = sources[path].replace('6/6项轨迹约束检查', '6/6项证书检查');
  assert.ok(checkContent(sources).some(error => error.includes('6/6项轨迹约束检查')));
});
