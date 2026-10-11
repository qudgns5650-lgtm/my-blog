// 네이버 블로그용 복사 도구 (로컬 서버에서만 표시)
// 0단계 실험(B안)에서 확인한 규칙대로, 스마트에디터에 붙여도 서식이 유지되는 HTML로 바꿉니다.

// 네이버는 localhost 이미지를 가져올 수 없으므로 배포된 GitHub Pages 주소로 바꿉니다.
const PUBLIC_BASE = 'https://qudgns5650-lgtm.github.io/my-blog/';
const NAVER_WRITE_URL = 'https://blog.naver.com/grobit_?Redirect=Write';

// 붙여 넣을 곳(네이버, 흰 배경)에 맞춘 인라인 스타일입니다. 블로그 테마 변수와는 무관합니다.
const MONO = 'font-family:Consolas,monospace;';
const STYLE = {
  h1: 'font-size:24px;font-weight:bold;margin:24px 0 8px;',
  h2: 'font-size:20px;font-weight:bold;margin:24px 0 8px;',
  h3: 'font-size:17px;font-weight:bold;margin:20px 0 6px;',
  code: `${MONO}background:#f2f3f5;padding:1px 4px;`,
  pre: `${MONO}background:#f6f8fa;border:1px solid #e3e6ea;padding:12px;font-size:14px;line-height:1.5;`,
  quote: 'border-left:4px solid #d0d4d9;padding:4px 12px;color:#5f6670;',
  table: 'border-collapse:collapse;',
  cell: 'border:1px solid #d0d4d9;padding:6px 10px;',
  th: 'border:1px solid #d0d4d9;padding:6px 10px;background:#f6f7f9;font-weight:bold;',
  listItem: 'margin:0;',
  listWrap: 'margin:0 0 16px;',
};

const BULLETS = ['•', '◦', '▪'];
const NBSP = ' ';
const INDENT = NBSP.repeat(4);

// 요소 이름을 바꾸면서 자식 노드를 그대로 옮깁니다.
function retag(el, tagName, style) {
  const next = document.createElement(tagName);
  if (style) next.setAttribute('style', style);
  next.append(...el.childNodes);
  el.replaceWith(next);
  return next;
}

// 목록을 문단으로 펼칩니다. 스마트에디터는 중첩 목록을 평평하게 만들고
// 번호를 이어 붙이므로, 기호·번호·들여쓰기를 글자로 직접 넣습니다.
function flattenList(list, depth = 0, prefix = '') {
  const lines = [];
  let n = 0;
  for (const li of list.children) {
    if (li.tagName !== 'LI') continue;
    n += 1;
    const number = prefix ? `${prefix}-${n}` : String(n);
    const box = li.querySelector(':scope > input[type="checkbox"]');
    let marker;
    if (box) marker = box.checked ? '☑' : '☐';
    else if (list.tagName === 'OL') marker = `${number}.`;
    else marker = BULLETS[Math.min(depth, BULLETS.length - 1)];

    const p = document.createElement('p');
    p.setAttribute('style', STYLE.listItem);
    const sublists = [];
    for (const node of [...li.childNodes]) {
      if (node.nodeName === 'UL' || node.nodeName === 'OL') sublists.push(node);
      else if (node !== box) p.append(node);
    }
    // 항목 앞뒤의 공백·줄바꿈을 정리한 뒤 기호를 붙입니다.
    if (p.firstChild?.nodeType === Node.TEXT_NODE) p.firstChild.data = p.firstChild.data.trimStart();
    if (p.lastChild?.nodeType === Node.TEXT_NODE) p.lastChild.data = p.lastChild.data.trimEnd();
    p.prepend(`${INDENT.repeat(depth)}${marker} `);
    lines.push(p);
    for (const sub of sublists) {
      lines.push(...flattenList(sub, depth + 1, list.tagName === 'OL' ? number : ''));
    }
  }
  return lines;
}

// markdown.js가 만든(이스케이프된) HTML을 네이버용 HTML로 바꿉니다. DOM으로만 가공합니다.
export function toNaverHtml(html) {
  const root = document.createElement('div');
  root.innerHTML = html;

  root.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach((h) => {
    retag(h, 'p', STYLE[h.tagName.toLowerCase()] || STYLE.h3);
  });

  root.querySelectorAll('pre').forEach((pre) => {
    const p = document.createElement('p');
    p.setAttribute('style', STYLE.pre);
    pre.textContent.replace(/\n$/, '').split('\n').forEach((line, i) => {
      if (i) p.append(document.createElement('br'));
      // 앞쪽 공백이 사라지지 않게 줄바꿈 없는 공백으로 바꿉니다.
      p.append(line.replace(/^ +/, (s) => NBSP.repeat(s.length)) || NBSP);
    });
    pre.replaceWith(p);
  });

  root.querySelectorAll('code').forEach((c) => retag(c, 'span', STYLE.code));
  root.querySelectorAll('blockquote').forEach((q) => q.setAttribute('style', STYLE.quote));
  root.querySelectorAll('table').forEach((t) => t.setAttribute('style', STYLE.table));
  root.querySelectorAll('th').forEach((c) => c.setAttribute('style', STYLE.th));
  root.querySelectorAll('td').forEach((c) => c.setAttribute('style', STYLE.cell));
  root.querySelectorAll('.table-wrap').forEach((w) => w.replaceWith(...w.childNodes));

  // 가장 바깥 목록만 골라 펼칩니다(안쪽 목록은 flattenList가 재귀로 처리).
  root.querySelectorAll('ul, ol').forEach((list) => {
    if (list.parentElement.closest('ul, ol')) return;
    const wrap = document.createElement('div');
    wrap.setAttribute('style', STYLE.listWrap);
    wrap.append(...flattenList(list));
    list.replaceWith(wrap);
  });

  root.querySelectorAll('img').forEach((img) => {
    img.src = new URL(img.getAttribute('src'), PUBLIC_BASE).href;
  });

  return root.innerHTML;
}

async function copyRich(html) {
  const plain = Object.assign(document.createElement('div'), { innerHTML: html }).innerText;
  await navigator.clipboard.write([
    new ClipboardItem({
      'text/html': new Blob([html], { type: 'text/html' }),
      'text/plain': new Blob([plain], { type: 'text/plain' }),
    }),
  ]);
}

function createButton(label, onClick) {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = 'naver-button';
  button.textContent = label;
  button.addEventListener('click', onClick);
  return button;
}

// 글 머리 아래에 [제목 복사] [본문 복사] [태그 복사] [네이버 글쓰기] 도구를 붙입니다.
export function mountNaverTools(target, { title, tags, html }) {
  const box = document.createElement('section');
  box.className = 'naver-tools';
  box.setAttribute('aria-label', '네이버 블로그용 복사');

  const label = document.createElement('p');
  label.className = 'naver-label';
  label.textContent = '네이버용 복사 · 로컬에서만 보입니다';

  const status = document.createElement('p');
  status.className = 'naver-status';
  status.setAttribute('role', 'status');

  async function run(task, message) {
    try {
      await task();
      status.textContent = message;
    } catch (error) {
      console.error(error);
      status.textContent = '복사하지 못했습니다. 브라우저의 클립보드 권한을 확인해 주세요.';
    }
  }

  const naverHtml = toNaverHtml(html);
  const buttons = document.createElement('div');
  buttons.className = 'naver-buttons';
  buttons.append(
    createButton('제목 복사', () => run(() => navigator.clipboard.writeText(title), '제목을 복사했습니다.')),
    createButton('본문 복사', () => run(() => copyRich(naverHtml), '본문을 복사했습니다. 네이버 본문에 붙여 넣으세요.')),
    createButton('태그 복사', () => run(
      () => navigator.clipboard.writeText(tags.join(' ')),
      tags.length ? `태그를 복사했습니다: ${tags.join(', ')}` : '이 글에는 태그가 없습니다.',
    )),
  );

  const write = document.createElement('a');
  write.className = 'naver-button';
  write.href = NAVER_WRITE_URL;
  write.target = '_blank';
  write.rel = 'noopener';
  write.textContent = '네이버 글쓰기 ↗';
  buttons.append(write);

  box.append(label, buttons, status);
  target.append(box);
}
