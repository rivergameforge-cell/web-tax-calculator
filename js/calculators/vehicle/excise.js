/* ===== 자동차 개별소비세 계산기 (2026년 기준) ===== */
const CalcVehicleExcise = (() => {

  const EXCISE_RATE = 0.05;          // 개별소비세 5%
  const EDUCATION_TAX_RATE = 0.30;   // 교육세 = 개소세의 30%
  const VAT_RATE = 0.10;             // 부가가치세 10%

  // 친환경차 개별소비세 감면
  const ECO_DISCOUNT = {
    'none':      { rate: 0,    max: 0,         label: '해당 없음' },
    'hybrid':    { rate: 1.00, max: 1_000_000, label: '하이브리드 (최대 100만원)' },
    'electric':  { rate: 1.00, max: 3_000_000, label: '전기차 (최대 300만원)' },
    'hydrogen':  { rate: 1.00, max: 4_000_000, label: '수소차 (최대 400만원)' },
  };

  function calculate(params) {
    const {
      factoryPrice,   // 출고가 (원)
      ecoType,        // 친환경차 종류
    } = params;

    if (!factoryPrice || factoryPrice <= 0) return null;

    // 1) 개별소비세 = 출고가 × 5%
    const exciseTax = Math.floor(factoryPrice * EXCISE_RATE);

    // 친환경차 감면
    const eco = ECO_DISCOUNT[ecoType] || ECO_DISCOUNT['none'];
    const ecoDiscount = Math.min(Math.floor(exciseTax * eco.rate), eco.max);
    const exciseAfter = Math.max(0, exciseTax - ecoDiscount);

    // 2) 교육세 = 개소세(감면 후) × 30%
    const educationTax = Math.floor(exciseAfter * EDUCATION_TAX_RATE);

    // 3) 부가가치세 = (출고가 + 개소세 + 교육세) × 10%
    const vatBase = factoryPrice + exciseAfter + educationTax;
    const vat = Math.floor(vatBase * VAT_RATE);

    // 최종 차량 가격
    const totalTax = exciseAfter + educationTax + vat;
    const finalPrice = factoryPrice + totalTax;

    return {
      factoryPrice, exciseTax,
      ecoLabel: eco.label, ecoDiscount, exciseAfter,
      educationTax, vat, totalTax, finalPrice,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏭</div>
          차량 출고가를 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    container.innerHTML = `
      <div class="breakdown-title">자동차 개별소비세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">출고가</span>
        <span class="br-value">${UI.fmtWon(r.factoryPrice)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">개별소비세 (5%)</span>
        <span class="br-value">${UI.fmtWon(r.exciseTax)}</span>
      </div>
      ${r.ecoDiscount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">친환경차 감면 (${r.ecoLabel})</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.ecoDiscount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">개별소비세 (감면 후)</span>
        <span class="br-value">${UI.fmtWon(r.exciseAfter)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">교육세 (개소세의 30%)</span>
        <span class="br-value">${UI.fmtWon(r.educationTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">부가가치세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.vat)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">세금 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row total" style="margin-top:8px">
        <span class="br-label">최종 차량 가격 (출고가+세금)</span>
        <span class="br-value">${UI.fmtWon(r.finalPrice)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-vehicle-excise');
    if (!view) return;

    const resultContainer = view.querySelector('#vexcise-result');
    const btnCopy  = view.querySelector('#vexcise-copy');
    const btnPrint = view.querySelector('#vexcise-print');
    const btnReset = view.querySelector('#vexcise-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      return {
        factoryPrice: UI.parseNum((view.querySelector('#vexcise-price')?.value || '').replace(/,/g, '')),
        ecoType:      view.querySelector('#vexcise-eco')?.value || 'none',
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('자동차 개별소비세 계산', [
          { label: '출고가', value: UI.fmtWon(r.factoryPrice) },
          { label: '개별소비세', value: UI.fmtWon(r.exciseAfter) },
          { label: '교육세', value: UI.fmtWon(r.educationTax) },
          { label: '부가가치세', value: UI.fmtWon(r.vat) },
          { label: '최종 차량 가격', value: UI.fmtWon(r.finalPrice) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const ecoSel = view.querySelector('#vexcise-eco');
        if (ecoSel) ecoSel.value = 'none';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
