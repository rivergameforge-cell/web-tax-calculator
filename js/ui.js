/* ===== UI Utilities ===== */
const UI = (() => {

  // Format number with commas: 1000000 → "1,000,000"
  function fmtNum(n) {
    if (n === null || n === undefined || n === '' || isNaN(n)) return '0';
    return Math.round(Number(n)).toLocaleString('ko-KR');
  }

  // Format as currency: 1000000 → "1,000,000원"
  function fmtWon(n) {
    return fmtNum(n) + '원';
  }

  // Format as 만원: 10000000 → "1,000만원"
  function fmtManWon(n) {
    const man = Math.round(Number(n) / 10000);
    return man.toLocaleString('ko-KR') + '만원';
  }

  // Parse comma-formatted string to number
  function parseNum(str) {
    if (!str && str !== 0) return 0;
    const cleaned = String(str).replace(/[^0-9.-]/g, '');
    return parseFloat(cleaned) || 0;
  }

  // Convert man-won to won
  function manToWon(n) {
    return n * 10000;
  }

  // Bind comma-auto-format to an input
  function bindNumInput(input, onchange) {
    let rawValue = 0;
    let unit = 'won'; // 'won' or 'man'

    input.addEventListener('input', (e) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      rawValue = parseInt(raw) || 0;
      e.target.value = rawValue ? rawValue.toLocaleString('ko-KR') : '';
      if (onchange) onchange(unit === 'man' ? rawValue * 10000 : rawValue);
    });

    input.addEventListener('blur', (e) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      rawValue = parseInt(raw) || 0;
      e.target.value = rawValue ? rawValue.toLocaleString('ko-KR') : '';
    });

    input.getValue = () => unit === 'man' ? rawValue * 10000 : rawValue;
    input.setValue = (n) => {
      rawValue = unit === 'man' ? Math.round(n / 10000) : n;
      input.value = rawValue ? rawValue.toLocaleString('ko-KR') : '';
    };
    input.setUnit = (u) => { unit = u; };
    input.getUnit = () => unit;

    return input;
  }

  // Create a result row element
  function makeResultRow(label, value, type = '') {
    const row = document.createElement('div');
    row.className = `breakdown-row${type ? ' ' + type : ''}`;
    row.innerHTML = `
      <span class="br-label">${label}</span>
      <span class="br-value">${value}</span>
    `;
    return row;
  }

  // Show / hide element
  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  // Set text content safely
  function setText(selector, text) {
    const el = typeof selector === 'string' ? document.querySelector(selector) : selector;
    if (el) el.textContent = text;
  }

  // Copy text to clipboard
  async function copyText(text) {
    try {
      await navigator.clipboard.writeText(text);
      return true;
    } catch {
      const ta = document.createElement('textarea');
      ta.value = text;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      document.body.removeChild(ta);
      return true;
    }
  }

  // Format result for copy
  function formatResultForCopy(title, rows) {
    let text = `[ ${title} ]\n`;
    rows.forEach(({ label, value }) => {
      text += `${label}: ${value}\n`;
    });
    text += `\n계산일: ${new Date().toLocaleDateString('ko-KR')}`;
    text += `\n출처: 세금계산기 (${location.href})`;
    return text;
  }

  // Show toast notification
  function toast(msg, type = 'info', duration = 2500) {
    const existing = document.querySelector('.toast');
    if (existing) existing.remove();

    const el = document.createElement('div');
    el.className = `toast toast-${type}`;
    el.textContent = msg;
    el.style.cssText = `
      position: fixed;
      bottom: calc(var(--ad-anchor-height) + 16px);
      left: 50%;
      transform: translateX(-50%);
      background: ${type === 'success' ? 'var(--success)' : type === 'error' ? 'var(--danger)' : 'var(--text-primary)'};
      color: white;
      padding: 10px 20px;
      border-radius: var(--radius-full);
      font-size: 13px;
      font-weight: 600;
      z-index: 9999;
      box-shadow: var(--shadow-lg);
      animation: toastIn 200ms ease;
      white-space: nowrap;
    `;
    document.body.appendChild(el);
    setTimeout(() => {
      el.style.animation = 'toastOut 200ms ease forwards';
      setTimeout(() => el.remove(), 200);
    }, duration);
  }

  // Generate shareable URL with params
  function buildShareUrl(calcId, params) {
    const url = new URL(location.href);
    url.hash = calcId;
    const sp = new URLSearchParams(params);
    url.search = sp.toString();
    return url.toString();
  }

  // Parse URL params
  function getUrlParams() {
    return Object.fromEntries(new URLSearchParams(location.search));
  }

  // Debounce
  function debounce(fn, ms) {
    let timer;
    return (...args) => {
      clearTimeout(timer);
      timer = setTimeout(() => fn(...args), ms);
    };
  }

  // Share current page
  async function shareCurrentPage() {
    const url = location.href;
    const title = document.title;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) { /* user cancelled or not supported */ }
    }
    await copyText(url);
    toast('링크가 복사되었습니다', 'success');
  }

  // Print current calculator
  function printCalc() {
    window.print();
  }

  return {
    fmtNum, fmtWon, fmtManWon, parseNum, manToWon,
    bindNumInput, makeResultRow,
    show, hide, setText,
    copyText, formatResultForCopy, toast,
    buildShareUrl, getUrlParams, shareCurrentPage,
    debounce, printCalc,
  };
})();

// Inject toast animation style
const toastStyle = document.createElement('style');
toastStyle.textContent = `
  @keyframes toastIn { from { opacity: 0; transform: translateX(-50%) translateY(8px); } to { opacity: 1; transform: translateX(-50%) translateY(0); } }
  @keyframes toastOut { from { opacity: 1; } to { opacity: 0; } }
`;
document.head.appendChild(toastStyle);
