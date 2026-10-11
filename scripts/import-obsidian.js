// Obsidian 볼트의 '20_블로그/글' 폴더에서 draft가 아닌 글을 블로그(posts/)로 가져옵니다.
// 실행: node scripts/import-obsidian.js [블로그 폴더 경로]
//
// - draft 체크박스가 꺼진 글(draft: false)만 가져옵니다. 켜져 있거나 draft 속성이 없으면 건너뜁니다.
// - 가져온 글은 posts/{slug}.md로 저장하고 posts/posts.json에 등록합니다.
// - 처음 올린 글에는 볼트 노트에 '게시일' 속성을 적어 둡니다.
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parseFrontMatter } from '../js/markdown.js';

const DEFAULT_VAULT_BLOG_DIR = 'C:\\Users\\user\\OneDrive\\문서\\Obsidian Vault\\20_블로그\\글';
const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const BLOG_ROOT = resolve(fileURLToPath(new URL('..', import.meta.url)));
const POSTS_DIR = join(BLOG_ROOT, 'posts');
const INDEX_FILE = join(POSTS_DIR, 'posts.json');
const sourceDir = process.argv[2] || process.env.OBSIDIAN_BLOG_DIR || DEFAULT_VAULT_BLOG_DIR;

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

function asList(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

// Obsidian 전용 문법을 일반 마크다운으로 바꿉니다.
function convertObsidianBody(body) {
  return body
    .replace(/%%[\s\S]*?%%/g, '') // Obsidian 주석
    .replace(/!\[\[[^\]]*\]\]/g, '') // 노트·이미지 임베드(블로그에서 표시 불가)
    .replace(/\[\[([^\]|]+)\|([^\]]+)\]\]/g, '$2') // [[노트|표시 이름]] → 표시 이름
    .replace(/\[\[([^\]]+)\]\]/g, '$1') // [[노트]] → 노트
    .trim();
}

function buildPost(meta, body) {
  const lines = ['---', `title: ${meta.title}`];
  if (meta.date) lines.push(`date: ${meta.date}`);
  // '유형/블로그' 같은 볼트 관리용 태그는 블로그에 싣지 않습니다.
  const tags = asList(meta.tags).filter((tag) => !tag.includes('/'));
  if (tags.length) lines.push(`tags: [${tags.join(', ')}]`);
  if (meta.description) lines.push(`description: ${meta.description}`);
  lines.push('---', '', convertObsidianBody(body), '');
  return lines.join('\n');
}

// 노트의 front matter에 속성이 없을 때만 한 줄 추가합니다. 본문은 건드리지 않습니다.
function addPropertyIfMissing(text, key, value) {
  const newline = text.includes('\r\n') ? '\r\n' : '\n';
  const match = text.match(/^(\uFEFF?---\r?\n)([\s\S]*?\r?\n)(---[ \t]*(?:\r?\n|$))/);
  if (!match) return null;
  if (new RegExp(`^${key}\\s*:`, 'm').test(match[2])) return null;
  return match[1] + match[2] + `${key}: ${value}${newline}` + match[3] + text.slice(match[0].length);
}

async function main() {
  let files;
  try {
    files = (await readdir(sourceDir)).filter((name) => name.endsWith('.md'));
  } catch (error) {
    console.error(`블로그 폴더를 읽을 수 없습니다: ${sourceDir}`);
    console.error(error.message);
    process.exitCode = 1;
    return;
  }

  const index = JSON.parse(await readFile(INDEX_FILE, 'utf8'));
  const published = [];
  const skipped = [];
  const seenSlugs = new Map();

  for (const name of files.sort()) {
    const notePath = join(sourceDir, name);
    const text = await readFile(notePath, 'utf8');
    const { meta, body } = parseFrontMatter(text);
    const draft = String(meta.draft ?? '').toLowerCase();

    if (draft === 'true') {
      skipped.push(`${name} (draft 체크됨)`);
      continue;
    }
    if (draft !== 'false') {
      skipped.push(`${name} (draft 속성 없음)`);
      continue;
    }
    if (!meta.slug || !SLUG_RE.test(meta.slug)) {
      skipped.push(`${name} (slug가 없거나 영문·숫자·-·_ 외 문자가 있음)`);
      continue;
    }
    if (seenSlugs.has(meta.slug)) {
      skipped.push(`${name} (slug '${meta.slug}'가 ${seenSlugs.get(meta.slug)}와 겹침)`);
      continue;
    }
    seenSlugs.set(meta.slug, name);

    const post = { ...meta, title: meta.title || name.replace(/\.md$/, '') };
    await writeFile(join(POSTS_DIR, `${meta.slug}.md`), buildPost(post, body), 'utf8');

    const isNew = !index.includes(meta.slug);
    if (isNew) index.unshift(meta.slug);

    const updatedNote = addPropertyIfMissing(text, '게시일', today());
    if (updatedNote !== null) await writeFile(notePath, updatedNote, 'utf8');

    published.push(`${name} → posts/${meta.slug}.md${isNew ? ' (새 글)' : ' (갱신)'}`);
  }

  await writeFile(INDEX_FILE, `${JSON.stringify(index, null, 2)}\n`, 'utf8');

  console.log(`블로그 폴더: ${sourceDir}`);
  console.log(`\n올린 글 ${published.length}개`);
  published.forEach((line) => console.log(`  ✓ ${line}`));
  console.log(`\n건너뛴 글 ${skipped.length}개`);
  skipped.forEach((line) => console.log(`  - ${line}`));
}

main();
