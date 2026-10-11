// 마크다운 → HTML 변환기 (외부 라이브러리 없음)
// 원문 HTML은 모두 이스케이프하므로, 결과를 innerHTML에 넣어도 안전합니다.

const ESCAPE_MAP = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };

const FENCE_RE = /^ {0,3}(`{3,}|~{3,})\s*([\w+#.-]*)/;
const HEADING_RE = /^ {0,3}(#{1,6})(?:\s+(.*?))?(?:\s+#+)?\s*$/;
const HR_RE = /^ {0,3}([-*_])(?:\s*\1){2,}\s*$/;
const QUOTE_RE = /^ {0,3}> ?/;
const LIST_RE = /^( *)([-*+]|\d{1,9}[.)])( +|$)(.*)$/;
const TABLE_SEP_RE = /^ {0,3}\|?(?:\s*:?-+:?\s*\|)+\s*(?::?-+:?\s*)?$/;
const SETEXT_RE = /^ {0,3}(=+|-+)\s*$/;
const TASK_RE = /^\[([ xX])\]\s+/;

export function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (ch) => ESCAPE_MAP[ch]);
}

// ===== front matter =====

function unquote(value) {
  const m = value.match(/^(['"])(.*)\1$/);
  return m ? m[2] : value;
}

function normalizeNewlines(text) {
  return text.replace(/^﻿/, '').replace(/\r\n?/g, '\n');
}

export function parseFrontMatter(text) {
  const source = normalizeNewlines(text);
  const match = source.match(/^---\n([\s\S]*?)\n---[ \t]*(?:\n|$)/);
  const meta = Object.create(null);
  if (!match) {
    return { meta, body: source };
  }

  const lines = match[1].split('\n');
  for (let i = 0; i < lines.length; i++) {
    const kv = lines[i].match(/^([\p{L}\p{N}_-]+)\s*:\s*(.*)$/u);
    if (!kv) continue;
    const raw = kv[2].trim();
    // Obsidian이 저장하는 여러 줄 목록 형식
    //   tags:
    //     - 일상
    if (!raw && i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
      const items = [];
      while (i + 1 < lines.length && /^\s+-\s/.test(lines[i + 1])) {
        i++;
        items.push(unquote(lines[i].replace(/^\s+-\s+/, '').trim()));
      }
      meta[kv[1]] = items.filter(Boolean);
    } else if (raw.startsWith('[') && raw.endsWith(']')) {
      meta[kv[1]] = raw
        .slice(1, -1)
        .split(',')
        .map((v) => unquote(v.trim()))
        .filter(Boolean);
    } else {
      meta[kv[1]] = unquote(raw);
    }
  }

  return { meta, body: source.slice(match[0].length) };
}

// ===== 인라인 =====

// 허용: http(s), mailto, 상대 경로, 앵커. 그 외 스킴(javascript: 등)은 막습니다.
function safeUrl(url) {
  // 브라우저는 URL의 공백·제어문자를 무시하므로 검사 전에 제거합니다.
  const normalized = url.replace(/[\u0000- ]/g, '');
  if (/^(https?:|mailto:)/i.test(normalized)) return normalized;
  if (/^[a-z][a-z0-9+.-]*:/i.test(normalized)) return '#';
  return normalized;
}

function emphasis(text) {
  return text
    .replace(/\*\*\*(?=\S)(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(?=\S)(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(^|[^\p{L}\p{N}_])__(?=\S)(.+?)__(?![\p{L}\p{N}_])/gu, '$1<strong>$2</strong>')
    .replace(/\*(?=\S)(.+?)\*/g, '<em>$1</em>')
    .replace(/(^|[^\p{L}\p{N}_])_(?=\S)(.+?)_(?![\p{L}\p{N}_])/gu, '$1<em>$2</em>')
    .replace(/~~(?=\S)(.+?)~~/g, '<del>$1</del>');
}

function renderInline(text) {
  // 코드·링크·이미지처럼 완성된 HTML은 자리표시자로 빼 두어
  // 강조 규칙이 속성값(URL의 _ 나 * 등)을 건드리지 않게 합니다.
  const tokens = [];
  const stash = (html) => `\u0000${tokens.push(html) - 1}\u0000`;
  const restore = (s) => s.replace(/\u0000(\d+)\u0000/g, (_, i) => restore(tokens[Number(i)]));

  let out = escapeHtml(text.replace(/\u0000/g, ''));

  out = out.replace(/(`+)(.+?)\1/g, (_, __, code) => stash(`<code>${code.trim()}</code>`));

  out = out.replace(/!\[([^\]]*)\]\(\s*([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, alt, src, title) => {
    const titleAttr = title ? ` title="${title}"` : '';
    return stash(`<img src="${safeUrl(src)}" alt="${alt}"${titleAttr} loading="lazy">`);
  });

  out = out.replace(/\[([^\]]+)\]\(\s*([^)\s]+)(?:\s+&quot;(.*?)&quot;)?\s*\)/g, (_, label, href, title) => {
    const url = safeUrl(href);
    const titleAttr = title ? ` title="${title}"` : '';
    const external = /^https?:/i.test(url) ? ' target="_blank" rel="noopener noreferrer"' : '';
    return stash(`<a href="${url}"${titleAttr}${external}>${emphasis(label)}</a>`);
  });

  // 자동 링크: <https://example.com>
  out = out.replace(/&lt;(https?:\/\/[^\s&]+)&gt;/g, (_, url) =>
    stash(`<a href="${url}" target="_blank" rel="noopener noreferrer">${url}</a>`)
  );

  return restore(emphasis(out));
}

// 줄 끝 공백 2개 또는 역슬래시는 강제 줄바꿈입니다.
function renderParagraphText(lines) {
  const joined = lines
    .map((l) => l.trimStart())
    .join('\n')
    .trimEnd()
    .replace(/(?: {2,}|\\)\n/g, '\u0001')
    .replace(/ +\n/g, '\n');
  return renderInline(joined).replace(/\u0001/g, '<br>\n');
}

// ===== 블록 =====

function indentOf(line) {
  return line.match(/^ */)[0].length;
}

function isOrderedMarker(marker) {
  return /\d/.test(marker);
}

function startsBlock(line) {
  return (
    FENCE_RE.test(line) ||
    HEADING_RE.test(line) ||
    HR_RE.test(line) ||
    QUOTE_RE.test(line) ||
    LIST_RE.test(line)
  );
}

function isTableStart(lines, i) {
  return lines[i].includes('|') && i + 1 < lines.length && TABLE_SEP_RE.test(lines[i + 1]);
}

function slugify(html, ctx) {
  const base =
    html
      .replace(/<[^>]+>/g, '')
      .replace(/&[#\w]+;/g, '')
      .toLowerCase()
      .trim()
      .replace(/[^\p{L}\p{N}\s-]/gu, '')
      .replace(/\s+/g, '-') || 'section';
  const count = ctx.ids.get(base) || 0;
  ctx.ids.set(base, count + 1);
  return count ? `${base}-${count}` : base;
}

function heading(level, text, ctx) {
  const inner = renderInline(text);
  return `<h${level} id="${slugify(inner, ctx)}">${inner}</h${level}>`;
}

function splitRow(line) {
  let s = line.trim();
  if (s.startsWith('|')) s = s.slice(1);
  if (s.endsWith('|') && !s.endsWith('\\|')) s = s.slice(0, -1);
  return s.split(/(?<!\\)\|/).map((cell) => cell.trim().replace(/\\\|/g, '|'));
}

function parseTable(lines, start) {
  const header = splitRow(lines[start]);
  const aligns = splitRow(lines[start + 1]).map((cell) => {
    const left = cell.startsWith(':');
    const right = cell.endsWith(':');
    if (left && right) return 'center';
    if (right) return 'right';
    if (left) return 'left';
    return '';
  });
  const cell = (tag, text, col) => {
    const align = aligns[col] ? ` style="text-align:${aligns[col]}"` : '';
    return `<${tag}${align}>${renderInline(text || '')}</${tag}>`;
  };

  let i = start + 2;
  const rows = [];
  while (i < lines.length && lines[i].trim() && lines[i].includes('|')) {
    const cells = splitRow(lines[i]);
    rows.push(`<tr>${header.map((_, col) => cell('td', cells[col], col)).join('')}</tr>`);
    i++;
  }

  const thead = `<thead><tr>${header.map((text, col) => cell('th', text, col)).join('')}</tr></thead>`;
  const tbody = rows.length ? `<tbody>${rows.join('')}</tbody>` : '';
  return { html: `<div class="table-wrap"><table>${thead}${tbody}</table></div>`, next: i };
}

function parseList(lines, start, ctx) {
  const first = lines[start].match(LIST_RE);
  const baseIndent = first[1].length;
  const ordered = isOrderedMarker(first[2]);
  const items = [];
  let loose = false;
  let i = start;

  while (i < lines.length) {
    // 항목 사이의 빈 줄: 같은 목록의 다음 항목이 이어지면 계속합니다.
    if (!lines[i].trim()) {
      let j = i;
      while (j < lines.length && !lines[j].trim()) j++;
      const next = j < lines.length ? lines[j].match(LIST_RE) : null;
      if (next && next[1].length === baseIndent && isOrderedMarker(next[2]) === ordered && !HR_RE.test(lines[j])) {
        loose = true;
        i = j;
      } else {
        break;
      }
    }

    const m = lines[i].match(LIST_RE);
    if (!m || m[1].length !== baseIndent || isOrderedMarker(m[2]) !== ordered || HR_RE.test(lines[i])) break;

    const contentIndent = baseIndent + m[2].length + Math.max(1, Math.min(m[3].length, 4));
    const itemLines = [m[4]];
    i++;

    while (i < lines.length) {
      const line = lines[i];
      if (!line.trim()) {
        let j = i;
        while (j < lines.length && !lines[j].trim()) j++;
        if (j < lines.length && indentOf(lines[j]) > baseIndent) {
          for (; i < j; i++) itemLines.push('');
          continue;
        }
        break;
      }
      const indent = indentOf(line);
      if (indent > baseIndent) {
        itemLines.push(line.slice(Math.min(indent, contentIndent)));
        i++;
        continue;
      }
      // 들여쓰기 없이 이어지는 문장(lazy continuation)
      if (itemLines[itemLines.length - 1].trim() && !startsBlock(line)) {
        itemLines.push(line.trim());
        i++;
        continue;
      }
      break;
    }

    while (itemLines.length && !itemLines[itemLines.length - 1].trim()) itemLines.pop();
    if (itemLines.some((l) => !l.trim())) loose = true;
    items.push(itemLines);
  }

  const rendered = items.map((itemLines) => {
    let task = '';
    const taskMatch = itemLines[0].match(TASK_RE);
    if (taskMatch) {
      const checked = taskMatch[1] !== ' ' ? ' checked' : '';
      task = `<input type="checkbox" disabled${checked}> `;
      itemLines[0] = itemLines[0].slice(taskMatch[0].length);
    }
    const content = parseBlocks(itemLines, ctx, !loose);
    return task ? `<li class="task">${task}${content}</li>` : `<li>${content}</li>`;
  });

  const tag = ordered ? 'ol' : 'ul';
  const startNum = parseInt(first[2], 10);
  const startAttr = ordered && startNum !== 1 ? ` start="${startNum}"` : '';
  return { html: `<${tag}${startAttr}>\n${rendered.join('\n')}\n</${tag}>`, next: i };
}

function parseBlocks(lines, ctx, tight = false) {
  const html = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      i++;
      continue;
    }

    const fence = line.match(FENCE_RE);
    if (fence) {
      const marker = fence[1];
      const closeRe = new RegExp(`^ {0,3}${marker[0] === '`' ? '`' : '~'}{${marker.length},}\\s*$`);
      const code = [];
      i++;
      while (i < lines.length && !closeRe.test(lines[i])) {
        code.push(lines[i]);
        i++;
      }
      i++; // 닫는 펜스 건너뛰기
      const cls = fence[2] ? ` class="language-${escapeHtml(fence[2])}"` : '';
      html.push(`<pre><code${cls}>${escapeHtml(code.join('\n'))}</code></pre>`);
      continue;
    }

    const head = line.match(HEADING_RE);
    if (head) {
      html.push(heading(head[1].length, head[2] || '', ctx));
      i++;
      continue;
    }

    if (HR_RE.test(line)) {
      html.push('<hr>');
      i++;
      continue;
    }

    if (QUOTE_RE.test(line)) {
      const quoted = [];
      // '>' 없이 이어지는 일반 문장도 인용문에 포함합니다(lazy continuation).
      while (i < lines.length && lines[i].trim() && (QUOTE_RE.test(lines[i]) || !startsBlock(lines[i]))) {
        quoted.push(lines[i].replace(QUOTE_RE, ''));
        i++;
      }
      html.push(`<blockquote>\n${parseBlocks(quoted, ctx)}\n</blockquote>`);
      continue;
    }

    if (LIST_RE.test(line)) {
      const list = parseList(lines, i, ctx);
      html.push(list.html);
      i = list.next;
      continue;
    }

    if (isTableStart(lines, i)) {
      const table = parseTable(lines, i);
      html.push(table.html);
      i = table.next;
      continue;
    }

    // 문단
    const para = [line];
    i++;
    while (
      i < lines.length &&
      lines[i].trim() &&
      !startsBlock(lines[i]) &&
      !SETEXT_RE.test(lines[i]) &&
      !isTableStart(lines, i)
    ) {
      para.push(lines[i]);
      i++;
    }

    // Setext 제목 (문단 바로 아래 === 또는 ---)
    const setext = i < lines.length ? lines[i].match(SETEXT_RE) : null;
    if (setext) {
      html.push(heading(setext[1][0] === '=' ? 1 : 2, para.map((l) => l.trim()).join(' '), ctx));
      i++;
      continue;
    }

    const text = renderParagraphText(para);
    html.push(tight ? text : `<p>${text}</p>`);
  }

  return html.join('\n');
}

export function markdownToHtml(markdown) {
  const lines = normalizeNewlines(markdown).replace(/\t/g, '    ').split('\n');
  return parseBlocks(lines, { ids: new Map() });
}

export function parseMarkdown(text) {
  const { meta, body } = parseFrontMatter(text);
  return { meta, html: markdownToHtml(body) };
}
