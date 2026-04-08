/* ===== 자동차 개별소비세 계산기 (2026년 기준) — 역산 방식 ===== */
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

  // 출고가로부터 최종가 정방향 계산
  function forwardCalc(factoryPrice, ecoType) {
    const exciseTax = Math.floor(factoryPrice * EXCISE_RATE);
    const eco = ECO_DISCOUNT[ecoType] || ECO_DISCOUNT['none'];
    const ecoDiscount = Math.min(Math.floor(exciseTax * eco.rate), eco.max);
    const exciseAfter = Math.max(0, exciseTax - ecoDiscount);
    const educationTax = Math.floor(exciseAfter * EDUCATION_TAX_RATE);
    const vat = Math.floor((factoryPrice + exciseAfter + educationTax) * VAT_RATE);
    const totalTax = exciseAfter + educationTax + vat;
    const finalPrice = factoryPrice + totalTax;
    return { factoryPrice, exciseTax, ecoLabel: eco.label, ecoDiscount, exciseAfter, educationTax, vat, totalTax, finalPrice };
  }

  function calculate(params) {
    const { purchasePrice, ecoType } = params;
    if (!purchasePrice || purchasePrice <= 0) return null;

    // 친환경차 감면 없으면 단순 역산
    // 최종가 = 출고가 × (1 + 개소세율 + 교육세율 + VAT율)
    // 감면 없을 때: multiplier = 1 + 0.05 + 0.015 + (1+0.05+0.015)×0.1 = 1.1715
    const eco = ECO_DISCOUNT[ecoType] || ECO_DISCOUNT['none'];

    // 이진 탐색으로 역산 (감면 한도 때문에 비선형)
    let lo = 0, hi = purchasePrice;
    for (let i = 0; i < 100; i++) {
      const mid = Math.floor((lo + hi) / 2);
      const result = forwardCalc(mid, ecoType);
      if (result.finalPrice <= purchasePrice) {
        lo = mid;
      } else {
        hi = mid;
      }
      if (hi - lo <= 1) break;
    }

    // lo가 출고가 후보, 검증
    let best = forwardCalc(lo, ecoType);
    const bestHi = forwardCalc(lo + 1, ecoType);
    // 구매가격에 더 가까운 쪽 선택
    if (Math.abs(bestHi.finalPrice - purchasePrice) < Math.abs(best.finalPrice - purchasePrice)) {
      best = bestHi;
    }

    return {
      ...best,
      purchasePrice,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🚗</div>
          차량 구매가격을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    container.innerHTML = `
      <div class="breakdown-title">개별소비세 역산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">차량 구매가격 (입력)</span>
        <span class="br-value">${UI.fmtWon(r.purchasePrice)}</span>
      </div>
      <div class="breakdown-row total" style="margin-bottom:12px">
        <span class="br-label">역산 출고가</span>
        <span class="br-value" style="color:var(--accent)">${UI.fmtWon(r.factoryPrice)}</span>
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
        <span class="br-label">검증: 출고가 + 세금</span>
        <span class="br-value">${UI.fmtWon(r.finalPrice)}</span>
      </div>
      ${r.finalPrice !== r.purchasePrice ? `
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px;text-align:right">
        * 절삭(원 단위 버림) 차이: ${UI.fmtWon(Math.abs(r.purchasePrice - r.finalPrice))}
      </div>` : ''}
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
        purchasePrice: UI.parseNum((view.querySelector('#vexcise-price')?.value || '').replace(/,/g, '')),
        ecoType:       view.querySelector('#vexcise-eco')?.value || 'none',
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
        await UI.copyText(UI.formatResultForCopy('자동차 개별소비세 역산', [
          { label: '구매가격', value: UI.fmtWon(r.purchasePrice) },
          { label: '역산 출고가', value: UI.fmtWon(r.factoryPrice) },
          { label: '개별소비세', value: UI.fmtWon(r.exciseAfter) },
          { label: '교육세', value: UI.fmtWon(r.educationTax) },
          { label: '부가가치세', value: UI.fmtWon(r.vat) },
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
