/* ===== Theme Manager ===== */
const Theme = (() => {
  const STORAGE_KEY = 'tex-theme';

  function getCurrent() {
    return localStorage.getItem(STORAGE_KEY) || 'light';
  }

  function apply(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem(STORAGE_KEY, theme);
    updateBtn(theme);
  }

  function toggle() {
    apply(getCurrent() === 'dark' ? 'light' : 'dark');
  }

  function updateBtn(theme) {
    const btn = document.getElementById('btn-theme');
    if (!btn) return;
    btn.textContent = theme === 'dark' ? '☀️' : '🌙';
    btn.title = theme === 'dark' ? '라이트 모드' : '다크 모드';
  }

  function init() {
    apply(getCurrent());
    const btn = document.getElementById('btn-theme');
    if (btn) btn.addEventListener('click', toggle);
  }

  return { init, toggle, getCurrent };
})();
