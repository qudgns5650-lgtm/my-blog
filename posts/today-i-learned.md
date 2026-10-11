---
title: 오늘 배운 것
date: 2026-10-11
tags: [TIL, HTML, CSS, JavaScript]
description: 클로드 코드로 블로그를 만들면서 알게 된 HTML, CSS, JavaScript의 역할을 정리했습니다.
---

오늘은 클로드 코드와 함께 이 블로그를 처음부터 만들었습니다. 프레임워크 없이 **HTML, CSS, JavaScript** 세 가지만 썼는데, 덕분에 각각이 무슨 일을 하는지 또렷하게 알 수 있었습니다.

한 문장으로 줄이면 이렇습니다.

> HTML은 **뼈대**, CSS는 **옷**, JavaScript는 **움직임**이다.

## HTML: 페이지의 뼈대

HTML은 페이지에 **무엇이 있는지**를 정합니다. 제목, 본문, 링크, 버튼 같은 내용과 구조를 담당합니다.

이 블로그에서는 `index.html`이 글 목록 페이지, `post.html`이 글 상세 페이지입니다.

```html
<header class="site-header">
  <a class="site-title" href="index.html">My Blog</a>
  <button class="theme-toggle" type="button">다크 모드</button>
</header>
<main>
  <article id="post"></article>
</main>
```

배운 점:

- `header`, `main`, `article`, `footer` 같은 **시맨틱 태그**를 쓰면 구조가 읽기 쉬워지고, 화면 낭독기 같은 보조 기술도 내용을 더 잘 이해합니다.
- `<meta name="viewport">` 한 줄이 있어야 휴대폰에서 화면이 제대로 맞춰집니다.

## CSS: 보기 좋게 꾸미는 옷

CSS는 HTML이 **어떻게 보일지**를 정합니다. 색, 글꼴, 여백, 배치가 모두 CSS의 몫입니다.

가장 인상 깊었던 건 **CSS 변수**입니다. 색상을 변수로 만들어 두면, 다크 모드는 변수 값만 바꾸면 됩니다.

```css
:root {
  --color-bg: #ffffff;
  --color-text: #1f2328;
}

[data-theme="dark"] {
  --color-bg: #121417;
  --color-text: #e6e8eb;
}

body {
  background: var(--color-bg);
  color: var(--color-text);
}
```

배운 점:

- **미디어 쿼리**(`@media (min-width: 768px)`)로 화면 크기에 따라 스타일을 바꿀 수 있습니다. 작은 화면을 먼저 만들고 큰 화면을 덧붙이는 방식을 *모바일 우선*이라고 합니다.
- 본문 너비를 700px 정도로 제한하고 줄간격을 넉넉히 주면 글이 훨씬 읽기 편해집니다.
- `word-break: keep-all`을 쓰면 한국어 단어가 줄 끝에서 어색하게 잘리지 않습니다.

## JavaScript: 페이지를 움직이는 힘

JavaScript는 페이지가 **어떻게 동작할지**를 정합니다. 사용자의 행동에 반응하고, 데이터를 불러오고, 화면 내용을 바꿉니다.

이 블로그에서 JavaScript가 하는 일은 세 가지입니다.

1. `fetch()`로 `posts/` 폴더의 마크다운 파일을 불러옵니다.
2. 마크다운을 HTML로 바꿔 화면에 넣습니다.
3. 버튼을 누르면 다크 모드와 라이트 모드를 전환하고, 선택을 기억합니다.

```javascript
button.addEventListener('click', () => {
  const next = root.dataset.theme === 'dark' ? 'light' : 'dark';
  root.dataset.theme = next;
  localStorage.setItem('theme', next);
});
```

배운 점:

- `fetch()`로 파일을 읽기 때문에 HTML 파일을 더블클릭해서 열면 동작하지 않습니다. **로컬 서버**로 열어야 합니다.
- 사용자가 쓴 글을 화면에 넣을 때는 HTML 특수문자를 **이스케이프**해야 안전합니다. 그렇지 않으면 글 속의 코드가 실행될 수 있습니다.

## 정리

| 기술 | 역할 | 이 블로그에서 |
| --- | --- | --- |
| HTML | 구조와 내용 | 헤더, 글 목록, 본문 자리 |
| CSS | 디자인과 배치 | 색상, 글꼴, 다크 모드, 모바일 화면 |
| JavaScript | 동작과 데이터 | 글 불러오기, 마크다운 변환, 테마 전환 |

세 가지가 각자 맡은 일을 나눠서 하니 코드가 깔끔하게 정리됩니다. 다음에는 태그별로 글을 모아 보는 기능에 도전해 보려고 합니다.
