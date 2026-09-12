// Keep the old public URL usable without navigation, including mixed-cache visits.
// index.html is the only authored page; zh.html is a byte-identical mirror.
import { copyFileSync, readFileSync } from 'node:fs';

const source = new URL('../index.html', import.meta.url);
const destination = new URL('../zh.html', import.meta.url);
const html = readFileSync(source, 'utf8');
if (/http-equiv=["']refresh|location\.(?:replace|assign)\s*\(/i.test(html)
    || !html.includes('<section id="projects"')
    || !html.includes('rel="canonical" href="https://lixiuyin.github.io/"')) {
  throw new Error('Refusing to mirror a redirect or an invalid root homepage.');
}
const args = process.argv.slice(2);
if (args.length === 1 && args[0] === '--write') {
  copyFileSync(source, destination);
  console.log('Updated zh.html as a redirect-free mirror of index.html.');
} else if (args.length === 0 || (args.length === 1 && args[0] === '--check')) {
  if (readFileSync(destination, 'utf8') !== html) {
    throw new Error('zh.html is stale. Run make sync-homepage before checking or publishing.');
  }
  console.log('Both homepage entries match; no redirect is needed.');
} else {
  throw new Error('Usage: node scripts/sync-homepage.mjs [--check|--write]');
}
