// 목록·상세 페이지가 함께 쓰는 도우미

// slug는 영문, 숫자, '-', '_'만 허용합니다(경로 조작 방지).
export const SLUG_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

const dateFormatter = new Intl.DateTimeFormat('ko-KR', { year: 'numeric', month: 'long', day: 'numeric' });

// 'YYYY-MM-DD'를 현지 날짜로 해석합니다(new Date('YYYY-MM-DD')는 UTC라 하루가 밀릴 수 있음).
export function formatDate(value) {
  const m = typeof value === 'string' && value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const date = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  if (Number.isNaN(date.getTime())) return null;
  return { iso: `${m[1]}-${m[2]}-${m[3]}`, text: dateFormatter.format(date) };
}

export function normalizeTags(value) {
  if (Array.isArray(value)) return value;
  return value ? [value] : [];
}

// 날짜와 태그를 담은 .post-meta 요소. 모든 값은 textContent로 넣습니다.
export function createMeta(dateValue, tags) {
  const meta = document.createElement('div');
  meta.className = 'post-meta';

  const date = formatDate(dateValue);
  if (date) {
    const time = document.createElement('time');
    time.dateTime = date.iso;
    time.textContent = date.text;
    meta.append(time);
  }

  if (tags.length) {
    const list = document.createElement('ul');
    list.className = 'tags';
    list.setAttribute('aria-label', '태그');
    for (const tag of tags) {
      const item = document.createElement('li');
      item.className = 'tag';
      item.textContent = tag;
      list.append(item);
    }
    meta.append(list);
  }

  return meta;
}

export function fileProtocolHint() {
  return location.protocol === 'file:'
    ? ' 파일을 직접 열면 글을 불러올 수 없습니다. 로컬 서버(python -m http.server 8000)로 실행해 주세요.'
    : '';
}
