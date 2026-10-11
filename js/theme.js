// 다크 모드 토글. 초기 테마는 각 HTML의 <head> 인라인 스크립트가 적용합니다.

const STORAGE_KEY = 'theme';
const root = document.documentElement;
const media = window.matchMedia('(prefers-color-scheme: dark)');

function getStoredTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === 'light' || value === 'dark' ? value : null;
  } catch (e) {
    return null;
  }
}

function storeTheme(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch (e) {
    // 저장할 수 없는 환경(사생활 보호 모드 등)에서는 이번 방문에만 적용합니다.
  }
}

function applyTheme(theme) {
  root.setAttribute('data-theme', theme);
  document.querySelectorAll('.theme-toggle').forEach((button) => {
    const isDark = theme === 'dark';
    button.setAttribute('aria-pressed', String(isDark));
    button.setAttribute('aria-label', isDark ? '라이트 모드로 전환' : '다크 모드로 전환');
  });
}

applyTheme(root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light');

document.querySelectorAll('.theme-toggle').forEach((button) => {
  button.addEventListener('click', () => {
    const next = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    storeTheme(next);
  });
});

// 사용자가 직접 고른 테마가 없으면 시스템 설정 변경을 따라갑니다.
media.addEventListener('change', (event) => {
  if (!getStoredTheme()) {
    applyTheme(event.matches ? 'dark' : 'light');
  }
});

// 푸터 연도
const year = document.getElementById('year');
if (year) {
  year.textContent = String(new Date().getFullYear());
}
