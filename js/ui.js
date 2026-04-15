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

  // Format number to Korean units: 600000000 → "6억", 150000000 → "1억 5천만"
  function fmtKorean(n) {
    if (!n || n <= 0) return '';
    const jo  = Math.floor(n / 1_000_000_000_000);
    const eok = Math.floor((n % 1_000_000_000_000) / 100_000_000);
    const man = Math.floor((n % 100_000_000) / 10_000);
    let parts = [];
    if (jo  > 0) parts.push(jo  + '조');
    if (eok > 0) parts.push(eok + '억');
    if (man > 0) {
      // 1000만 단위는 "N천만"으로 표시 (예: 5000만 → 5천만)
      if (man % 1000 === 0) parts.push((man / 1000) + '천만');
      else parts.push(man + '만');
    }
    return parts.join(' ');
  }

  // Bind comma-auto-format to an input
  // If input has data-korean attribute, auto-injects a hint span showing Korean units
  function bindNumInput(input, onchange) {
    let rawValue = 0;
    let unit = 'won'; // 'won' or 'man'

    // Auto-inject Korean unit hint span if data-korean attribute present
    // Injected after num-input-wrap (or after input) as a subtle hint line
    let koreanHint = null;
    if (input.hasAttribute('data-korean')) {
      koreanHint = document.createElement('div');
      koreanHint.className = 'num-input-korean';
      const wrap = input.closest('.num-input-wrap');
      if (wrap) wrap.after(koreanHint);
      else input.after(koreanHint);
    }

    function updateKorean(val) {
      if (!koreanHint) return;
      const realVal = unit === 'man' ? val * 10000 : val;
      const hint = fmtKorean(realVal);
      koreanHint.textContent = hint ? hint : '';
    }

    input.addEventListener('input', (e) => {
      const raw = e.target.value.replace(/[^0-9]/g, '');
      rawValue = parseInt(raw) || 0;
      e.target.value = rawValue ? rawValue.toLocaleString('ko-KR') : '';
      updateKorean(rawValue);
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
      updateKorean(rawValue);
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

  // 현재 보고 있는 계산기 제목 가져오기
  function getCurrentCalcTitle() {
    const titleText = document.getElementById('page-title-text')?.textContent?.trim();
    if (titleText) return `${titleText} - 세금계산기`;
    return document.title || '세금계산기';
  }

  // Share current page (Web Share API / 링크 복사 폴백)
  async function shareCurrentPage() {
    const url = location.href;
    const title = getCurrentCalcTitle();
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch (e) { /* user cancelled or not supported */ }
    }
    await copyText(url);
    toast('링크가 복사되었습니다', 'success');
  }

  // 카카오 SDK 초기화
  const KAKAO_APP_KEY = '6daf757d5f62978679f812c72089120b';
  function initKakao() {
    if (window.Kakao && !window.Kakao.isInitialized()) {
      try { window.Kakao.init(KAKAO_APP_KEY); } catch (e) { /* noop */ }
    }
  }
  if (typeof window !== 'undefined') {
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', initKakao);
    } else {
      initKakao();
    }
  }

  // 카카오톡 공유
  function shareToKakao() {
    initKakao();
    if (!window.Kakao || !window.Kakao.Share) {
      toast('카카오 SDK 로딩 실패', 'error');
      return;
    }
    const url = location.href;
    const title = getCurrentCalcTitle();
    try {
      window.Kakao.Share.sendDefault({
        objectType: 'feed',
        content: {
          title,
          description: '2026년 기준 한국 세금 계산기 — 무료로 간편하게 계산하세요',
          imageUrl: 'https://taxcalc.co.kr/og-image.png',
          link: { mobileWebUrl: url, webUrl: url },
        },
        buttons: [{
          title: '계산기 열기',
          link: { mobileWebUrl: url, webUrl: url },
        }],
      });
    } catch (e) {
      console.error('Kakao share error:', e);
      toast('카카오톡 공유 실패', 'error');
    }
  }

  // 라인 공유
  function shareToLine() {
    const url = location.href;
    const title = getCurrentCalcTitle();
    const shareUrl = `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`;
    window.open(shareUrl, '_blank', 'width=600,height=600');
  }

  // 링크 복사
  async function shareCopyLink() {
    const url = location.href;
    const ok = await copyText(url);
    toast(ok ? '링크가 복사되었습니다' : '복사에 실패했습니다', ok ? 'success' : 'error');
  }

  // Print current calculator
  function printCalc() {
    window.print();
  }

  return {
    fmtNum, fmtWon, fmtManWon, fmtKorean, parseNum, manToWon,
    bindNumInput, makeResultRow,
    show, hide, setText,
    copyText, formatResultForCopy, toast,
    buildShareUrl, getUrlParams, shareCurrentPage,
    shareToLine, shareToKakao, shareCopyLink, getCurrentCalcTitle,
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
