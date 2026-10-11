// 글 목록(홈) 페이지
import { parseFrontMatter } from './markdown.js';
import { SLUG_RE, createMeta, normalizeTags, fileProtocolHint } from './utils.js';

const list = document.getElementById('post-list');

function showStatus(message) {
  const item = document.createElement('li');
  item.className = 'status';
  item.textContent = message;
  list.replaceChildren(item);
}

// description이 없으면 본문 첫 문단으로 요약을 만듭니다.
function excerpt(body, maxLength = 120) {
  const line = body
    .split('\n')
    .map((l) => l.trim())
    .find((l) => l && !/^(#|>|```|~~~|[-*+] |\d+\. |\||!\[)/.test(l));
  if (!line) return '';
  const plain = line
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_~`]/g, '');
  return plain.length > maxLength ? `${plain.slice(0, maxLength).trim()}…` : plain;
}

async function loadPost(slug) {
  const res = await fetch(`posts/${slug}.md`);
  if (!res.ok) throw new Error(`${slug}.md (${res.status})`);
  const { meta, body } = parseFrontMatter(await res.text());
  return {
    slug,
    title: meta.title || slug,
    date: meta.date || '',
    tags: normalizeTags(meta.tags),
    description: meta.description || excerpt(body),
  };
}

function createCard(post) {
  const item = document.createElement('li');
  item.className = 'post-card';

  const link = document.createElement('a');
  link.href = `post.html?slug=${encodeURIComponent(post.slug)}`;

  const title = document.createElement('h2');
  title.textContent = post.title;
  link.append(title, createMeta(post.date, post.tags));

  if (post.description) {
    const desc = document.createElement('p');
    desc.textContent = post.description;
    link.append(desc);
  }

  item.append(link);
  return item;
}

async function init() {
  let slugs;
  try {
    const res = await fetch('posts/posts.json');
    if (!res.ok) throw new Error(`posts.json (${res.status})`);
    slugs = await res.json();
  } catch (error) {
    console.error(error);
    showStatus(`글 목록을 불러오지 못했습니다.${fileProtocolHint()}`);
    return;
  }

  const validSlugs = (Array.isArray(slugs) ? slugs : []).filter((slug) => {
    const ok = typeof slug === 'string' && SLUG_RE.test(slug);
    if (!ok) console.warn('잘못된 slug를 건너뜁니다:', slug);
    return ok;
  });

  // 글 하나를 못 불러와도 나머지는 보여줍니다.
  const results = await Promise.allSettled(validSlugs.map(loadPost));
  const posts = [];
  for (const result of results) {
    if (result.status === 'fulfilled') posts.push(result.value);
    else console.warn('글을 불러오지 못했습니다:', result.reason);
  }

  if (!posts.length) {
    showStatus('아직 작성된 글이 없습니다.');
    return;
  }

  posts.sort((a, b) => String(b.date).localeCompare(String(a.date)));
  list.replaceChildren(...posts.map(createCard));
}

init();
