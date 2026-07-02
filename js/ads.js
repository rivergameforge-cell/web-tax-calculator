/* ===== Ads Manager =====
 * During AdSense review we keep only the account verification script in HTML.
 * Display, anchor, and interstitial ad behavior is intentionally disabled.
 */
const Ads = (() => {

  function markExternalClick() {
    return false;
  }

  function init() {
    document.documentElement.style.setProperty('--ad-anchor-height', '0px');
  }

  return { init, markExternalClick };
})();
