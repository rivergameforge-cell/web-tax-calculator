/* TaxCalc page-view measurement. Keep calculator values out of analytics URLs. */
(function () {
  'use strict';

  if (!['taxcalc.co.kr', 'www.taxcalc.co.kr'].includes(window.location.hostname)) {
    return;
  }

  const measurementId = 'G-CWPH0FQTQZ';
  const pageLocation = window.location.origin + window.location.pathname;
  let pageReferrer = '';

  if (document.referrer) {
    try {
      const referrer = new URL(document.referrer);
      pageReferrer = referrer.origin + referrer.pathname;
    } catch {
      pageReferrer = '';
    }
  }

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };

  window.gtag('js', new Date());
  window.gtag('config', measurementId, {
    page_location: pageLocation,
    page_referrer: pageReferrer,
    allow_google_signals: false,
    allow_ad_personalization_signals: false
  });

  const tag = document.createElement('script');
  tag.async = true;
  tag.src = 'https://www.googletagmanager.com/gtag/js?id=' + measurementId;
  document.head.appendChild(tag);
})();
