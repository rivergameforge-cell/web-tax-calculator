/* ===== 해외 구매 관세 계산기 (2026년 기준) ===== */
const CalcCustoms = (() => {

  // 품목별 관세율
  const TARIFF_RATES = {
    'clothing':      { rate: 0.13,  label: '의류·잡화', excise: false },
    'shoes':         { rate: 0.13,  label: '신발·가방', excise: false },
    'electronics':   { rate: 0.08,  label: '전자제품 (일반)', excise: false },
    'phone':         { rate: 0.00,  label: '스마트폰·태블릿', excise: false },
    'cosmetics':     { rate: 0.065, label: '화장품', excise: false },
    'healthfood':    { rate: 0.08,  label: '건강기능식품', excise: false },
    'food':          { rate: 0.08,  label: '식품·커피·차', excise: false },
    'perfume':       { rate: 0.065, label: '향수', excise: true, exciseRate: 0.07 },
    'watch-luxury':  { rate: 0.08,  label: '시계 (200만원 초과)', excise: true, exciseRate: 0.20 },
    'watch':         { rate: 0.08,  label: '시계 (200만원 이하)', excise: false },
    'jewelry':       { rate: 0.08,  label: '귀금속·보석', excise: true, exciseRate: 0.20 },
    'other':         { rate: 0.08,  label: '기타', excise: false },
  };

  const DUTY_FREE_THRESHOLD_USD = 150; // 면세 기준 (미국 200달러)
  const VAT_RATE = 0.10;
  const EDUCATION_TAX_ON_EXCISE = 0.30; // 개별소비세의 30% 교육세

  function calculate(params) {
    const {
      itemType,           // 품목 코드
      priceUsd,           // 물품가격 (USD)
      shippingUsd,        // 운임 (USD)
      insuranceUsd,       // 보험료 (USD)
      exchangeRate,       // 환율 (원/USD)
      fromUs,             // 미국 직구 여부 (면세 200달러)
    } = params;

    if (!priceUsd || priceUsd <= 0 || !exchangeRate) return null;

    const freeThreshold = fromUs ? 200 : DUTY_FREE_THRESHOLD_USD;
    const totalUsd = priceUsd + (shippingUsd || 0) + (insuranceUsd || 0);
    const totalKrw = Math.floor(totalUsd * exchangeRate);

    // 면세 판단 (물품가격 기준)
    if (priceUsd <= freeThreshold) {
      return {
        totalUsd, totalKrw, isDutyFree: true,
        freeThreshold,
        customsDuty: 0, exciseTax: 0, educationTax: 0, vat: 0, totalTax: 0,
        finalPrice: totalKrw,
        params,
      };
    }

    const tariff = TARIFF_RATES[itemType] || TARIFF_RATES['other'];

    // 과세가격 = 물품가격 + 운임 + 보험료 (CIF 기준, 원화)
    const dutiableValue = totalKrw;

    // 1) 관세
    const customsDuty = Math.floor(dutiableValue * tariff.rate);

    // 2) 개별소비세 (해당 품목)
    let exciseTax = 0;
    if (tariff.excise) {
      exciseTax = Math.floor((dutiableValue + customsDuty) * tariff.exciseRate);
    }

    // 3) 교육세 (개별소비세의 30%)
    const educationTax = Math.floor(exciseTax * EDUCATION_TAX_ON_EXCISE);

    // 4) 부가가치세 10%
    const vatBase = dutiableValue + customsDuty + exciseTax + educationTax;
    const vat     = Math.floor(vatBase * VAT_RATE);

    const totalTax  = customsDuty + exciseTax + educationTax + vat;
    const finalPrice = totalKrw + totalTax;

    return {
      totalUsd, totalKrw, isDutyFree: false,
      freeThreshold,
      tariffLabel: tariff.label,
      tariffRate: tariff.rate,
      dutiableValue, customsDuty,
      exciseTax, educationTax, vat,
      totalTax, finalPrice,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📦</div>
          물품가격과 환율을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    if (r.isDutyFree) {
      container.innerHTML = `
        <div class="breakdown-title">관세 계산 결과</div>
        <div class="breakdown-row">
          <span class="br-label">총 과세가격</span>
          <span class="br-value">$${r.totalUsd.toFixed(2)} (${UI.fmtWon(r.totalKrw)})</span>
        </div>
        <div style="padding:16px;text-align:center">
          <div class="exempt-badge">✅ 면세 (${r.freeThreshold}달러 이하)</div>
          <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
            물품가격 $${r.freeThreshold} 이하로 관세·부가세가 면제됩니다.
          </p>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">예상 결제금액</span>
          <span class="br-value">${UI.fmtWon(r.finalPrice)}</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">관세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">품목</span>
        <span class="br-value" style="font-size:13px">${r.tariffLabel}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세가격 (CIF)</span>
        <span class="br-value">${UI.fmtWon(r.dutiableValue)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">관세 (${(r.tariffRate * 100).toFixed(1)}%)</span>
        <span class="br-value">${UI.fmtWon(r.customsDuty)}</span>
      </div>
      ${r.exciseTax > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">개별소비세</span>
        <span class="br-value">${UI.fmtWon(r.exciseTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">교육세 (개소세의 30%)</span>
        <span class="br-value">${UI.fmtWon(r.educationTax)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">부가가치세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.vat)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">세금 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row total" style="margin-top:8px">
        <span class="br-label">예상 총 결제금액 (물품+세금)</span>
        <span class="br-value">${UI.fmtWon(r.finalPrice)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-customs');
    if (!view) return;

    const resultContainer = view.querySelector('#customs-result');
    const btnCopy  = view.querySelector('#customs-copy');
    const btnPrint = view.querySelector('#customs-print');
    const btnReset = view.querySelector('#customs-reset');

    function getParams() {
      const getFloat = id => parseFloat(view.querySelector(`#${id}`)?.value || '0') || 0;
      return {
        itemType:     view.querySelector('#customs-item-type')?.value || 'electronics',
        priceUsd:     getFloat('customs-price'),
        shippingUsd:  getFloat('customs-shipping'),
        insuranceUsd: getFloat('customs-insurance'),
        exchangeRate: getFloat('customs-exchange'),
        fromUs:       view.querySelector('#customs-from-us')?.checked || false,
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('해외구매 관세 계산', [
          { label: '과세가격', value: UI.fmtWon(r.totalKrw) },
          { label: '면세 여부', value: r.isDutyFree ? '면세' : '과세' },
          { label: '세금 합계', value: UI.fmtWon(r.totalTax) },
          { label: '예상 총 결제금액', value: UI.fmtWon(r.finalPrice) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const sel = view.querySelector('#customs-item-type');
        if (sel) sel.value = 'electronics';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
