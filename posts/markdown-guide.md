---
title: 마크다운 문법 가이드
date: 2026-10-10
tags: [가이드, 마크다운]
---

이 글은 블로그에서 지원하는 마크다운 문법을 한곳에 모아 둔 예시입니다. 새 글을 쓸 때 참고하세요.

## 텍스트 꾸미기

**굵게**, *기울임*, ***굵은 기울임***, ~~취소선~~, 그리고 `인라인 코드`를 쓸 수 있습니다.
snake_case_이름처럼 단어 안의 밑줄은 기울임으로 바뀌지 않습니다.

줄 끝에 공백 두 칸을 넣으면  
강제로 줄을 바꿀 수 있습니다.

## 링크와 이미지

[MDN 웹 문서](https://developer.mozilla.org/ko/)처럼 외부 링크는 새 탭에서 열립니다. 자동 링크도 됩니다: <https://example.com>

![산과 해가 있는 풍경](images/sample.svg "샘플 이미지")

## 목록

- 사과
- 바나나
  - 송이바나나
  - 몽키바나나
- 체리

1. 첫 번째 단계
2. 두 번째 단계
   1. 세부 단계 A
   2. 세부 단계 B
3. 세 번째 단계

- [x] 블로그 만들기
- [ ] 글 열 개 쓰기

## 인용문

> 좋은 글은 읽기 쉬운 글이다.
>
> 인용문 안에서도 **강조**와 `코드`를 쓸 수 있습니다.

## 코드 블록

```javascript
// 마크다운 파일을 불러와 HTML로 바꿉니다.
async function loadPost(slug) {
  const res = await fetch(`posts/${slug}.md`);
  const { meta, html } = parseMarkdown(await res.text());
  return { title: meta.title, html };
}
```

```css
:root { --color-accent: #2f6fde; }
[data-theme="dark"] { --color-accent: #7aa7f5; }
```

## 표

| 문법 | 결과 | 비고 |
| :--- | :---: | ---: |
| `**굵게**` | **굵게** | 별표 두 개 |
| `*기울임*` | *기울임* | 별표 한 개 |
| `~~취소선~~` | ~~취소선~~ | 물결 두 개 |

### 작은 제목

#### 더 작은 제목

---

본문 안의 HTML 태그는 <script>alert('안전')</script> 처럼 글자 그대로 보입니다.
