/* ===== 자동차세 계산기 ===== */
const CalcVehicleTax = (() => {

  // 비영업용 승용차 CC 구간별 세율
  function getBaseRate(cc) {
    if (cc <= 1000) return 80;
    if (cc <= 1600) return 140;
    return 200;
  }

  // 연납 할인율 (납부월에 따라)
  const ADVANCE_RATES = {
    1: 0.0457,  // 1월
    3: 0.0376,  // 3월
    6: 0.0252,  // 6월
    9: 0.0125,  // 9월
  };

  // 전기차·수소차 정액 세액
  const EV_TAX = 100000; // 연 10만원

  function calculate(params) {
    const {
      vehicleType, // 'passenger' | 'commercial' | 'truck' | 'motorcycle'
      cc,
      isEV,           // 전기차 여부
      firstRegYear,
      firstRegMonth,
      advancePay,     // 연납 여부
      advanceMonth,   // 연납 납부월
    } = params;

    // 전기차 계산
    if (isEV) {
      const evBaseTax = EV_TAX;
      const evEduTax = Math.floor(evBaseTax * 0.3);
      const evAnnualTax = evBaseTax + evEduTax;

      let advanceDiscount = 0;
      if (advancePay && advanceMonth) {
        const discRate = ADVANCE_RATES[advanceMonth] || 0;
        advanceDiscount = Math.floor(evAnnualTax * discRate);
      }

      return {
        isEV: true,
        cc: 0,
        ratePerCC: 0,
        baseTax: evBaseTax,
        elapsedYears: 0,
        reductionRate: 0,
        reducedTax: evBaseTax,
        eduTax: evEduTax,
        annualTax: evAnnualTax,
        advanceDiscount,
        finalTax: evAnnualTax - advanceDiscount,
        params,
      };
    }

    if (!cc || cc <= 0) return null;

    const currentYear = new Date().getFullYear();
    const currentMonth = new Date().getMonth() + 1;
    const elapsedYears = currentYear - firstRegYear + (firstRegMonth <= currentMonth ? 0 : -1);

    // 기본 연간 세액
    const ratePerCC = getBaseRate(cc);
    const baseTax = cc * ratePerCC;

    // 차령 경감 (3년차부터 연 5%, 최대 50%)
    let reductionRate = 0;
    if (elapsedYears >= 3) {
      reductionRate = Math.min((elapsedYears - 2) * 0.05, 0.50);
    }
    const reducedTax = Math.floor(baseTax * (1 - reductionRate));

    // 지방교육세 30%
    const eduTax = Math.floor(reducedTax * 0.3);
    const annualTax = reducedTax + eduTax;

    // 연납 할인
    let advanceDiscount = 0;
    if (advancePay && advanceMonth) {
      const discRate = ADVANCE_RATES[advanceMonth] || 0;
      advanceDiscount = Math.floor(annualTax * discRate);
    }

    const finalTax = annualTax - advanceDiscount;

    return {
      cc,
      ratePerCC,
      baseTax,
      elapsedYears,
      reductionRate,
      reducedTax,
      eduTax,
      annualTax,
      advanceDiscount,
      finalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🚗</div>배기량을 입력해주세요</div>`;
      return;
    }

    const {
      cc, ratePerCC, baseTax, elapsedYears, reductionRate,
      reducedTax, eduTax, annualTax, advanceDiscount, finalTax,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">자동차세 계산 결과</div>
      ${result.isEV ? `
      <div class="breakdown-row">
        <span class="br-label">차량 유형</span>
        <span class="br-value">⚡ 전기차·수소차</span>
      </div>` : `
      <div class="breakdown-row">
        <span class="br-label">배기량</span>
        <span class="br-value">${UI.fmtNum(cc)} cc</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">CC당 세율</span>
        <span class="br-value"><span class="rate-display">${ratePerCC}원/cc</span></span>
      </div>`}
      <div class="breakdown-row">
        <span class="br-label">기본 세액 (cc × 세율)</span>
        <span class="br-value">${UI.fmtWon(baseTax)}</span>
      </div>
      ${reductionRate > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">차령 경감 (${elapsedYears}년차, ${(reductionRate*100).toFixed(0)}%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(baseTax - reducedTax)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">경감 후 자동차세</span>
        <span class="br-value">${UI.fmtWon(reducedTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방교육세 (30%)</span>
        <span class="br-value">${UI.fmtWon(eduTax)}</span>
      </div>
      <div class="breakdown-row" style="font-weight:600">
        <span class="br-label">연간 자동차세</span>
        <span class="br-value">${UI.fmtWon(annualTax)}</span>
      </div>
      ${advanceDiscount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">연납 할인</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(advanceDiscount)}</span>
      </div>` : ''}
      <div class="breakdown-row total">
        <span class="br-label">납부세액${advanceDiscount > 0 ? ' (연납)' : ''}</span>
        <span class="br-value">${UI.fmtWon(finalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-vehicle-vehicle-tax');
    if (!view) return;

    const resultContainer = view.querySelector('#vtax-result');
    const advanceSection = view.querySelector('#vtax-advance-section');

    const ccSection = view.querySelector('#vtax-cc-section');
    const regSection = view.querySelector('#vtax-reg-year')?.closest('.form-group');
    const regDivider = regSection?.previousElementSibling; // section-divider

    function getParams() {
      const getNum = id => parseInt(view.querySelector(`#${id}`)?.value || '0') || 0;
      const getCheck = id => view.querySelector(`#${id}`)?.checked || false;

      return {
        vehicleType: view.querySelector('input[name="vtax-type"]:checked')?.value || 'passenger',
        cc: getNum('vtax-cc'),
        isEV: getCheck('vtax-ev'),
        firstRegYear: getNum('vtax-reg-year'),
        firstRegMonth: getNum('vtax-reg-month'),
        advancePay: getCheck('vtax-advance'),
        advanceMonth: getNum('vtax-advance-month'),
      };
    }

    // Show/hide EV toggle → hide cc + registration fields
    const evCheck = view.querySelector('#vtax-ev');
    if (evCheck) {
      evCheck.addEventListener('change', () => {
        const isEV = evCheck.checked;
        if (ccSection) ccSection.style.display = isEV ? 'none' : '';
        if (regSection) regSection.style.display = isEV ? 'none' : '';
        if (regDivider && regDivider.classList.contains('section-divider')) regDivider.style.display = isEV ? 'none' : '';
        doCalc();
      });
    }

    // Show/hide advance month selection
    const advanceCheck = view.querySelector('#vtax-advance');
    if (advanceCheck && advanceSection) {
      advanceCheck.addEventListener('change', () => {
        advanceSection.style.display = advanceCheck.checked ? '' : 'none';
      });
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    const btnCopy = view.querySelector('#vtax-copy');
    const btnPrint = view.querySelector('#vtax-print');
    const btnReset = view.querySelector('#vtax-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const copyRows = result.isEV
          ? [
              { label: '차량 유형', value: '전기차·수소차' },
              { label: '연간 자동차세', value: UI.fmtWon(result.annualTax) },
              { label: '납부세액', value: UI.fmtWon(result.finalTax) },
            ]
          : [
              { label: '배기량', value: UI.fmtNum(result.cc) + ' cc' },
              { label: '연간 자동차세', value: UI.fmtWon(result.annualTax) },
              { label: '납부세액', value: UI.fmtWon(result.finalTax) },
            ];
        await UI.copyText(UI.formatResultForCopy('자동차세 계산', copyRows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        if (advanceSection) advanceSection.style.display = 'none';
        if (ccSection) ccSection.style.display = '';
        if (regSection) regSection.style.display = '';
        if (regDivider && regDivider.classList.contains('section-divider')) regDivider.style.display = '';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
