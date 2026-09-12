import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import { checkContent, readSources } from './check-content.mjs';

const paths = ['index.html'];

test('deployment permits ignored files only through the explicit reviewed allowlist', () => {
  const makefile = readFileSync(new URL('../Makefile', import.meta.url), 'utf8');
  const deploy = makefile.match(/^deploy: check\n([\s\S]*?)^publish:/m)[1];
  assert.match(deploy, /git add -f -- \$\(DEPLOY_FILES\)/);
  assert.doesNotMatch(deploy, /git add[^\n]*(?:--all| -A\b|assets\/\*| -- \.\s*$)/m);
});

test('root homepage renders directly with root canonical and metadata', () => {
  const html = readSources()['index.html'];
  assert.doesNotMatch(html, /http-equiv=["']refresh|location\.(?:replace|assign)\s*\(/i);
  assert.doesNotMatch(html, /name="robots" content="noindex/i);
  assert.match(html, /rel="canonical" href="https:\/\/lixiuyin.github.io\/"/);
  assert.match(html, /property="og:url" content="https:\/\/lixiuyin.github.io\/"/);
  assert.doesNotMatch(html, /https:\/\/lixiuyin.github.io\/zh\.html/);
  assert.match(html, /<section id="projects"/);
  assert.match(html, /<script src="main\.js/);
  const sitemap = readFileSync(new URL('../sitemap.xml', import.meta.url), 'utf8');
  assert.match(sitemap, /<loc>https:\/\/lixiuyin.github.io\/<\/loc>/);
  assert.doesNotMatch(sitemap, /zh\.html/);
});

test('legacy Chinese URL directly serves the root content without navigation', () => {
  const root = readSources()['index.html'];
  const legacy = readFileSync(new URL('../zh.html', import.meta.url), 'utf8');
  assert.equal(legacy, root);
  assert.doesNotMatch(legacy, /http-equiv=["']refresh|location\.(?:replace|assign)\s*\(/i);
  assert.match(legacy, /<section id="projects"/);
  assert.match(legacy, /rel="canonical" href="https:\/\/lixiuyin.github.io\/"/);
});

test('a cached old redirect terminates at either new entry without a return hop', () => {
  const pages = {
    '/': readSources()['index.html'],
    '/zh.html': readFileSync(new URL('../zh.html', import.meta.url), 'utf8'),
  };
  const transitions = [
    ['/', "window.location.replace('zh.html' + window.location.search + window.location.hash);", '/zh.html'],
    ['/zh.html', "window.location.replace('./' + window.location.search + window.location.hash);", '/'],
  ];
  for (const suffix of ['', '?from=cv', '#projects', '?from=cv#project-webagent']) {
    for (const [from, script, expected] of transitions) {
      const initial = new URL('https://lixiuyin.github.io' + from + suffix);
      let target;
      vm.runInNewContext(script, {window: {location: {
        search: initial.search, hash: initial.hash,
        replace(value) { target = new URL(value, initial); },
      }}});
      assert.equal(target.pathname, expected);
      assert.equal(target.search + target.hash, suffix);
      // The freshly loaded destination contains the page, never a return redirect.
      assert.doesNotMatch(pages[target.pathname], /http-equiv=["']refresh|location\.(?:replace|assign)\s*\(/i);
      assert.match(pages[target.pathname], /<h1>李袖印<\/h1>/);
    }
  }
});

test('website preserves scoped results and pinned evidence', () => {
  assert.deepEqual(checkContent(readSources(), paths), []);
});

test('expanded evidence adds methodology and diagnosis without repeating headline scores', () => {
  const html = readSources()['index.html'];
  const notes = [...html.matchAll(/<details class="project-evidence">([\s\S]*?)<\/details>/g)].map(m => m[1]);
  assert.doesNotMatch(notes.join(''), /71\/72|0\.883|0\.927|22\/22/);
  assert.match(notes[0], /规划偏航/);
  assert.match(notes[1], /每例评审 3 次/);
  assert.match(notes[1], /延迟仍未达到预设门槛/);
});

test('project ordering does not mix evidence between projects', () => {
  const sources = readSources();
  const html = sources['index.html'];
  const web = html.match(/      <div class="entry" id="project-webagent">[\s\S]*?      <\/div>/)[0];
  const meeting = html.match(/      <div class="entry" id="project-meetingagent">[\s\S]*?      <\/div>/)[0];
  sources['index.html'] = html.replace(web, '__WEB__').replace(meeting, web).replace('__WEB__', meeting);
  assert.deepEqual(checkContent(sources, paths), []);
});

test('visible result cannot overstate the WebAgent run count', () => {
  const sources = readSources();
  sources['index.html'] = sources['index.html'].replace('71/72', '72/72');
  assert.ok(checkContent(sources, paths).some(error => error.includes('71/72')));
});

test('visible results retain project-level scope', () => {
  const sources = readSources();
  sources['index.html'] = sources['index.html'].replace(/(<p class="project-result">[^<]*(?:<strong>.*?<\/strong>)?)项目内评测中，/, '$1');
  assert.ok(checkContent(sources, paths).some(error => error.includes('项目内评测')));
});

test('prioritize Agent projects and retain standalone engineering experience', () => {
  const html = readSources()['index.html'];
  const projects = html.match(/<section id="projects"[\s\S]*?<\/section>/)[0];
  const titles = [...projects.matchAll(/<h3 class="entry-title">\s*<a[^>]*>(.*?)<\/a>/g)].map(match => match[1]);
  assert.ok(titles[0].startsWith('WebAgent'));
  assert.ok(titles[1].startsWith('MeetingAgent'));
  assert.ok(titles[2].startsWith('零样本图文学习'));
  assert.ok(titles[3].startsWith('图书馆管理系统'));
  assert.equal((projects.match(/href="https:\/\/github.com\/lixiuyin\/library-management-system"/g) ?? []).length, 1);
});
