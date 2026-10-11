// 글 상세 페이지
import { parseMarkdown } from './markdown.js';
import { SLUG_RE, createMeta, normalizeTags, fileProtocolHint } from './utils.js';

const SITE_NAME = 'My Blog';
const article = document.getElementById('post');
const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]']);

function showError(message) {
  const text = document.createElement('p');
  text.className = 'status';
  text.textContent = message;

  const home = document.createElement('a');
  home.href = 'index.html';
  home.textContent = '홈으로 돌아가기';

  article.replaceChildren(text, home);
  document.title = `글을 찾을 수 없습니다 | ${SITE_NAME}`;
}

async function init() {
  const slug = new URLSearchParams(location.search).get('slug');
  if (!slug || !SLUG_RE.test(slug)) {
    showError('글을 찾을 수 없습니다. 주소를 다시 확인해 주세요.');
    return;
  }

  let text;
  try {
    const res = await fetch(`posts/${slug}.md`);
    if (res.status === 404) {
      showError('글을 찾을 수 없습니다. 삭제되었거나 주소가 잘못되었을 수 있습니다.');
      return;
    }
    if (!res.ok) throw new Error(`${slug}.md (${res.status})`);
    text = await res.text();
  } catch (error) {
    console.error(error);
    showError(`글을 불러오지 못했습니다.${fileProtocolHint()}`);
    return;
  }

  const { meta, html } = parseMarkdown(text);
  const title = meta.title || slug;

  const header = document.createElement('header');
  header.className = 'post-header';
  const heading = document.createElement('h1');
  heading.textContent = title;
  header.append(heading, createMeta(meta.date, normalizeTags(meta.tags)));

  const body = document.createElement('div');
  body.className = 'post-body';
  body.innerHTML = html; // markdown.js가 원문 HTML을 이스케이프한 결과입니다.

  article.replaceChildren(header, body);
  document.title = `${title} | ${SITE_NAME}`;

  // 로컬 서버에서만 네이버용 복사 도구를 붙입니다(공개 블로그에는 보이지 않음).
  if (LOCAL_HOSTS.has(location.hostname)) {
    import('./naver.js')
      .then(({ mountNaverTools }) => {
        mountNaverTools(header, { title, tags: normalizeTags(meta.tags), html });
      })
      .catch((error) => console.error('네이버 복사 도구를 불러오지 못했습니다:', error));
  }

  // 주소에 #앵커가 있으면 렌더링 후 해당 제목으로 이동합니다.
  if (location.hash) {
    const target = document.getElementById(decodeURIComponent(location.hash.slice(1)));
    if (target) target.scrollIntoView();
  }
}

init();
