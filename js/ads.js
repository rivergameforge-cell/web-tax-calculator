/* ===== Ads Manager ===== */
const Ads = (() => {

  // Track pending interstitial
  function markExternalClick() {
    sessionStorage.setItem('tex-interstitial-pending', 'true');
  }

  function showInterstitial() {
    const overlay = document.getElementById('interstitial-overlay');
    if (!overlay) return;

    overlay.classList.add('visible');

    const closeBtn = overlay.querySelector('.interstitial-close');
    const countdownEl = overlay.querySelector('.interstitial-countdown');
    if (!closeBtn) return;

    closeBtn.disabled = true;
    let seconds = 5;

    const update = () => {
      if (countdownEl) {
        countdownEl.textContent = seconds > 0
          ? `${seconds}초 후 닫을 수 있습니다`
          : '닫기 버튼을 눌러 계속하세요';
      }
    };
    update();

    const timer = setInterval(() => {
      seconds--;
      update();
      if (seconds <= 0) {
        clearInterval(timer);
        closeBtn.disabled = false;
      }
    }, 1000);

    closeBtn.onclick = () => {
      overlay.classList.remove('visible');
      clearInterval(timer);
    };

    // Also close on overlay background click (after 5s)
    overlay.onclick = (e) => {
      if (e.target === overlay && !closeBtn.disabled) {
        overlay.classList.remove('visible');
      }
    };
  }

  function initExternalLinks() {
    // Bind external link clicks to mark interstitial pending
    document.addEventListener('click', (e) => {
      const link = e.target.closest('a[target="_blank"]');
      if (link && !link.href.startsWith(location.origin)) {
        markExternalClick();
      }
    });
  }

  function initTabVisibility() {
    document.addEventListener('visibilitychange', () => {
      if (!document.hidden) {
        const pending = sessionStorage.getItem('tex-interstitial-pending');
        if (pending) {
          sessionStorage.removeItem('tex-interstitial-pending');
          // Small delay for better UX
          setTimeout(() => showInterstitial(), 300);
        }
      }
    });
  }

  function initAnchorClose() {
    const anchorClose = document.querySelector('#ad-anchor .anchor-close');
    const anchor = document.getElementById('ad-anchor');
    if (!anchorClose || !anchor) return;

    // Don't show anchor if already closed this session
    if (sessionStorage.getItem('tex-anchor-closed')) {
      anchor.classList.add('hidden');
      document.documentElement.style.setProperty('--ad-anchor-height', '0px');
    }

    anchorClose.addEventListener('click', () => {
      anchor.classList.add('hidden');
      document.documentElement.style.setProperty('--ad-anchor-height', '0px');
      sessionStorage.setItem('tex-anchor-closed', '1');
    });
  }

  function init() {
    initExternalLinks();
    initTabVisibility();
    initAnchorClose();
  }

  return { init, markExternalClick };
})();
