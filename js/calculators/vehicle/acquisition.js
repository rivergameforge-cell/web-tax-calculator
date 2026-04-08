/* ===== 자동차 취득세 계산기 (2026년 기준) ===== */
const CalcVehicleAcq = (() => {

  // 차종별 취득세율
  const RATES = {
    'passenger':       0.07,   // 비영업용 승용차 7%
    'passenger-biz':   0.04,   // 영업용 승용차 4%
    'light':           0.04,   // 경차 4%
    'truck':           0.05,   // 화물·특수차 5%
    'van9':            0.05,   // 승합(10인 이하) 5%
    'van10':           0.05,   // 승합(11인 이상) 5%
  };

  // 친환경차 감면 (2026년 기준)
  const ECO_DISCOUNT = {
    'none':            { rate: 0,    max: 0,       label: '해당 없음' },
    'hybrid':          { rate: 0,    max: 0,       label: '하이브리드 (2026년 폐지)' },
    'electric':        { rate: 1.00, max: 1_400_000, label: '전기차 (최대 140만원)' },
    'hydrogen':        { rate: 1.00, max: 1_400_000, label: '수소차 (최대 140만원)' },
  };

  // 경차 취득세 감면 (75만원 한도)
  const LIGHT_VEHICLE_DISCOUNT_MAX = 750_000;

  function calculate(params) {
    const {
      vehicleType,     // 차종
      price,           // 취득가액 (원)
      ecoType,         // 친환경차 종류
    } = params;

    if (!price || price <= 0) return null;

    const rate    = RATES[vehicleType] || 0.07;
    const acqTax  = Math.floor(price * rate);

    // 경차 감면 (75만원 한도)
    const isLight    = vehicleType === 'light';
    let lightDiscount = 0;
    if (isLight) {
      lightDiscount = Math.min(acqTax, LIGHT_VEHICLE_DISCOUNT_MAX);
    }

    // 친환경차 감면
    const eco        = ECO_DISCOUNT[ecoType] || ECO_DISCOUNT['none'];
    const ecoDiscount = Math.min(Math.floor(acqTax * eco.rate), eco.max);
    const totalDiscount = Math.max(lightDiscount, ecoDiscount); // 큰 감면 적용
    const afterDiscount = Math.max(0, acqTax - totalDiscount);

    // 지방교육세 (취득세의 20%, 경차 면제)
    const eduTax     = isLight ? 0 : Math.floor(afterDiscount * 0.20);

    // 농어촌특별세 (취득세의 10%, 경차·영업용 면제)
    const isExemptRural = isLight || vehicleType === 'passenger-biz';
    const ruralTax      = isExemptRural ? 0 : Math.floor(afterDiscount * 0.10);

    const totalTax = afterDiscount + eduTax + ruralTax;

    return {
      price, rate, acqTax,
      ecoLabel: eco.label, ecoDiscount, afterDiscount,
      eduTax, ruralTax, totalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🚗</div>
          차량 취득가액을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    container.innerHTML = `
      <div class="breakdown-title">자동차 취득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">취득가액</span>
        <span class="br-value">${UI.fmtWon(r.price)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득세율</span>
        <span class="br-value"><span class="rate-display">${(r.rate * 100).toFixed(0)}%</span></span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득세 산출</span>
        <span class="br-value">${UI.fmtWon(r.acqTax)}</span>
      </div>
      ${r.ecoDiscount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">친환경차 감면 (${r.ecoLabel})</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.ecoDiscount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득세 (감면 후)</span>
        <span class="br-value">${UI.fmtWon(r.afterDiscount)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">지방교육세 (20%)</span>
        <span class="br-value">${UI.fmtWon(r.eduTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">농어촌특별세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.ruralTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-vehicle-acquisition');
    if (!view) return;

    const resultContainer = view.querySelector('#vacq-result');
    const btnCopy  = view.querySelector('#vacq-copy');
    const btnPrint = view.querySelector('#vacq-print');
    const btnReset = view.querySelector('#vacq-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      return {
        vehicleType: view.querySelector('#vacq-type')?.value || 'passenger',
        price:       UI.parseNum((view.querySelector('#vacq-price')?.value || '').replace(/,/g, '')),
        ecoType:     view.querySelector('#vacq-eco')?.value || 'none',
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
        await UI.copyText(UI.formatResultForCopy('자동차 취득세 계산', [
          { label: '취득가액', value: UI.fmtWon(r.price) },
          { label: '취득세', value: UI.fmtWon(r.afterDiscount) },
          { label: '지방교육세', value: UI.fmtWon(r.eduTax) },
          { label: '농어촌특별세', value: UI.fmtWon(r.ruralTax) },
          { label: '최종 납부세액', value: UI.fmtWon(r.totalTax) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const typeSel = view.querySelector('#vacq-type');
        if (typeSel) typeSel.value = 'passenger';
        const ecoSel = view.querySelector('#vacq-eco');
        if (ecoSel) ecoSel.value = 'none';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
