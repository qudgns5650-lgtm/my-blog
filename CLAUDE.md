# CLAUDE.md

이 파일은 Claude Code가 이 저장소에서 작업할 때 따라야 할 지침입니다.

## 프로젝트 개요

마크다운(`.md`) 파일로 작성한 글을 읽어서 블로그 웹사이트로 보여주는 정적 사이트입니다.
깔끔하고 읽기 좋은 디자인, 다크 모드, 모바일 대응이 핵심 요구사항입니다.

## 기술 제약 (반드시 지킬 것)

- **순수 HTML, CSS, JavaScript(Vanilla JS)만 사용합니다.**
- React, Vue, Svelte 등 프레임워크와 Tailwind, Bootstrap 등 CSS 프레임워크는 사용하지 않습니다.
- npm, 번들러(Webpack, Vite 등), 빌드 단계를 두지 않습니다. 파일을 그대로 정적 서버에 올리면 동작해야 합니다.
- 마크다운 파서도 외부 라이브러리 없이 `js/markdown.js`에 직접 구현합니다.
- 최신 브라우저 기준의 표준 문법(ES 모듈, `fetch`, CSS 변수 등)을 사용합니다.

## 디렉터리 구조

```
my-blog/
├── server.js           # 로컬 확인용 정적 서버 (node server.js)
├── scripts/
│   └── import-obsidian.js  # Obsidian 볼트의 블로그 글 가져오기
├── index.html          # 글 목록(홈) 페이지
├── post.html           # 글 상세 페이지 (?slug=파일명 으로 글 지정)
├── css/
│   └── style.css       # 전체 스타일 (라이트/다크 테마 변수 포함)
├── js/
│   ├── main.js         # 글 목록 렌더링
│   ├── post.js         # 글 하나를 불러와 렌더링
│   ├── markdown.js     # 마크다운 → HTML 변환기
│   ├── utils.js        # 날짜 포맷, 태그/메타 요소 생성 등 공통 도우미
│   └── theme.js        # 다크 모드 토글
├── images/             # 글에 넣는 이미지 (글에서는 images/파일명 으로 참조)
└── posts/
    ├── posts.json      # 글 목록 인덱스
    └── *.md            # 블로그 글
```

## 글 작성 방식

- 글은 `posts/` 폴더에 `.md` 파일로 추가합니다. 파일명(확장자 제외)이 slug가 됩니다. 예: `posts/hello-world.md` → `post.html?slug=hello-world`
- 각 글 상단에 front matter를 둡니다.

  ```markdown
  ---
  title: 첫 번째 글
  date: 2026-10-11
  tags: [일상, 개발]
  description: 목록에 표시될 짧은 요약
  ---

  본문 내용...
  ```

- 정적 호스팅에서는 브라우저가 폴더 목록을 읽을 수 없으므로, 새 글을 추가하면 **`posts/posts.json`에도 slug를 등록**해야 합니다. 글 목록은 날짜 내림차순으로 정렬해 보여줍니다.

## Obsidian에서 글 가져오기

글의 원본은 Obsidian 볼트의 `20_블로그/글` 폴더(`C:\Users\user\OneDrive\문서\Obsidian Vault\20_블로그\글`)입니다. 볼트 구조(대분류 → 중분류 → 지식 노트)는 볼트의 `00 시스템 가이드` 노트를 따릅니다.

```bash
node scripts/import-obsidian.js
```

- 노트 속성: `title`, `slug`(영문·숫자·`-`·`_`), `date`, `tags`, `description`, `draft`(체크박스). `tags` 중 `유형/블로그`처럼 `/`가 들어간 볼트 관리용 태그는 블로그에 싣지 않습니다. 볼트의 `90_템플릿/블로그 글.md` 템플릿을 쓰면 `draft: true`로 시작합니다.
- **`draft`가 꺼진(`false`) 글만** `posts/{slug}.md`로 저장하고 `posts.json`에 등록합니다. 체크된 글과 `draft` 속성이 없는 글은 건너뜁니다.
- 처음 올린 노트에는 `게시일` 속성을 추가합니다. 노트의 다른 부분은 수정하지 않습니다.
- `[[위키링크]]`는 일반 텍스트로, `%%주석%%`과 `![[임베드]]`는 제거합니다.
- `posts/`의 글을 직접 고치면 다음 가져오기 때 볼트 내용으로 덮어써지므로, 글은 볼트에서 고칩니다.

## 마크다운 변환기 (`js/markdown.js`)

지원해야 할 문법:

- 제목(`#` ~ `######`), 문단, 줄바꿈
- 굵게, 기울임, 취소선, 인라인 코드
- 링크, 이미지
- 순서 있는/없는 목록 (중첩 포함)
- 인용문(`>`), 수평선(`---`)
- 코드 블록(```` ``` ```` + 언어 표기 → `class="language-xxx"`)
- 표(GFM 테이블)

규칙:

- 변환 전에 HTML 특수문자(`<`, `>`, `&`, `"`)를 이스케이프해 XSS를 막습니다. 코드 블록 내용은 반드시 이스케이프합니다.
- 링크 URL은 `javascript:` 같은 위험한 스킴을 허용하지 않습니다.
- front matter 파싱도 이 모듈에서 담당하고, `{ meta, html }` 형태로 반환합니다.

## 디자인 원칙

- **가독성 우선**: 본문 최대 너비 약 `680–720px`, 본문 글자 크기 `17–18px`, 줄간격 `1.7` 내외.
- 한글 가독성을 위해 시스템 폰트 스택을 사용합니다: `-apple-system, BlinkMacSystemFont, "Apple SD Gothic Neo", "Pretendard", "Noto Sans KR", "Malgun Gothic", sans-serif`. 한국어 단어가 중간에 끊기지 않도록 `word-break: keep-all`을 적용합니다.
- 장식은 최소화하고 여백, 타이포그래피, 은은한 구분선으로 위계를 표현합니다.
- 색상, 간격, 폰트 크기는 모두 `:root`의 CSS 변수로 정의하고 하드코딩하지 않습니다.
- 링크, 버튼에는 키보드 포커스 스타일(`:focus-visible`)을 둡니다.

## 다크 모드

- 색상은 CSS 변수로 정의하고 `[data-theme="dark"]`에서 다시 정의합니다.
- 초기 테마 결정 순서: `localStorage`에 저장된 사용자 선택 → 없으면 `prefers-color-scheme`.
- 페이지 로드 시 깜빡임(FOUC)을 막기 위해, 테마를 적용하는 짧은 인라인 스크립트를 `<head>`에 넣습니다.
- 헤더에 테마 토글 버튼을 두고, 선택값을 `localStorage`에 저장합니다. `localStorage` 접근은 `try/catch`로 감쌉니다.
- 코드 블록, 인용문, 표, 이미지 테두리 등도 다크 모드에서 대비가 충분한지 확인합니다.

## 반응형 / 모바일

- 모바일 우선(mobile-first)으로 작성하고, 넓은 화면은 `min-width` 미디어 쿼리로 확장합니다.
- 모든 HTML에 `<meta name="viewport" content="width=device-width, initial-scale=1">`을 넣습니다.
- 좌우 여백은 최소 `16px`, 가로 스크롤이 생기지 않아야 합니다.
- 코드 블록과 표는 자체적으로 가로 스크롤(`overflow-x: auto`)되게 하고, 이미지는 `max-width: 100%`.
- 터치 대상(버튼, 링크)은 최소 `44px` 높이를 확보합니다.

## 로컬 실행

`fetch()`로 마크다운 파일을 읽기 때문에 `file://`로 직접 열면 동작하지 않습니다. 로컬 서버로 실행합니다.

```bash
node server.js
```

이후 브라우저에서 `http://localhost:8000` 접속.
`server.js`는 Node.js 내장 모듈만 쓰는 로컬 확인용 정적 서버입니다(설치할 패키지 없음, 배포에는 쓰지 않음).
Python이 있다면 `python -m http.server 8000`, VS Code의 Live Server 확장도 사용할 수 있습니다.

## 코딩 컨벤션

- 들여쓰기 2칸, 문자열은 작은따옴표, 세미콜론 사용.
- JS는 ES 모듈(`<script type="module">`)로 분리하고, 전역 변수를 만들지 않습니다.
- `innerHTML`에는 반드시 `markdown.js`를 거친(이스케이프된) HTML만 넣습니다. 제목, 태그 등 front matter 값은 `textContent`로 넣습니다.
- 시맨틱 태그(`header`, `main`, `article`, `nav`, `footer`, `time`)를 사용합니다.
- 글을 불러오지 못하면(404 등) 사용자에게 친절한 오류 메시지를 보여줍니다.
- 주석과 UI 문구는 한국어로 작성합니다.

## 작업 후 확인 사항

변경 후에는 다음을 확인합니다.

1. 로컬 서버에서 목록 페이지와 글 상세 페이지가 정상 표시되는지
2. 라이트/다크 모드 전환이 모든 요소에 반영되는지, 새로고침 후에도 유지되는지
3. 375px 너비(모바일)에서 가로 스크롤 없이 잘 보이는지
4. 브라우저 콘솔에 오류가 없는지
