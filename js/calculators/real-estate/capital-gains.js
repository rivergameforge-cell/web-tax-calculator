/* ===== 양도소득세 계산기 ===== */
const CalcCapitalGains = (() => {

  // 누진세율표 (2026년 기준, 과세표준 구간, 세율, 누진공제)
  const TAX_BRACKETS = [
    { limit: 14_000_000,  rate: 0.06,  deduction: 0 },
    { limit: 50_000_000,  rate: 0.15,  deduction: 1_260_000 },
    { limit: 88_000_000,  rate: 0.24,  deduction: 5_760_000 },
    { limit: 150_000_000, rate: 0.35,  deduction: 15_440_000 },
    { limit: 300_000_000, rate: 0.38,  deduction: 19_940_000 },
    { limit: 500_000_000, rate: 0.40,  deduction: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { limit: Infinity,    rate: 0.45,  deduction: 65_940_000 },
  ];

  function calcProgressiveTax(taxBase) {
    if (taxBase <= 0) return 0;
    for (const bracket of TAX_BRACKETS) {
      if (taxBase <= bracket.limit) {
        return Math.floor(taxBase * bracket.rate - bracket.deduction);
      }
    }
    return 0;
  }

  // 장기보유특별공제율 (1세대1주택 고가주택 기준)
  function getLtcRate(holdYears, residYears, isOneHousehold) {
    // 1세대1주택 고가주택: 보유+거주 각 최대 40%, 합계 최대 80%
    if (isOneHousehold) {
      // 보유기간 공제
      const holdRates = [0, 0, 0, 0.12, 0.16, 0.20, 0.24, 0.28, 0.32, 0.36, 0.40, 0.40, 0.40, 0.40, 0.40, 0.40];
      const holdRate = holdRates[Math.min(Math.floor(holdYears), 15)] || 0;

      // 거주기간 공제 (2년 이상, 연 4%, 최대 40%)
      const residYearsInt = Math.min(Math.floor(residYears), 10);
      const residRate = residYearsInt >= 2 ? Math.min(residYearsInt * 0.04, 0.40) : 0;

      return Math.min(holdRate + residRate, 0.80);
    }

    // 일반 장기보유특별공제 (3년 이상, 연 6% ~ 최대 30%)
    if (holdYears < 3) return 0;
    const rate = Math.min(Math.floor(holdYears) * 0.02, 0.30);
    return rate;
  }

  function calculate(params) {
    const {
      salePrice,
      buyPrice,
      expenses,
      holdYears,
      holdMonths,
      residYears,
      isOneHousehold, // 1세대1주택
      isHighPrice,    // 고가주택 여부 (12억 초과)
      isShortTerm,    // 단기 양도 (보유 2년 미만)
      houseCount,
      isAdjusted,
    } = params;

    if (!salePrice || !buyPrice) return null;

    const totalHoldYears = holdYears + (holdMonths / 12);
    const gain = salePrice - buyPrice - (expenses || 0);

    if (gain <= 0) {
      return { gain, taxBase: 0, taxAmount: 0, localTax: 0, total: 0, isExempt: false, params };
    }

    // 1세대1주택 비과세: 12억 이하
    if (isOneHousehold && !isHighPrice && salePrice <= 1_200_000_000 && houseCount === 1) {
      return { gain, taxBase: 0, taxAmount: 0, localTax: 0, total: 0, isExempt: true, params };
    }

    // 단기 양도세율
    let specialRate = null;
    if (totalHoldYears < 1) specialRate = 0.70;
    else if (totalHoldYears < 2) specialRate = 0.60;

    // 장기보유특별공제
    const ltcRate = getLtcRate(totalHoldYears, residYears || 0, isOneHousehold && houseCount === 1);
    // 고가주택(12억 초과) 1세대1주택: 양도차익 × (양도가액-12억)/양도가액 부분에만 적용
    let ltcApplyGain = gain;
    if (isOneHousehold && isHighPrice && houseCount === 1) {
      ltcApplyGain = Math.floor(gain * (salePrice - 1_200_000_000) / salePrice);
    }
    const ltcAmount = Math.floor(ltcApplyGain * ltcRate);
    const netGain = gain - ltcAmount;

    // 기본공제
    const basicDeduction = 2_500_000;
    const taxBase = Math.max(0, netGain - basicDeduction);

    let taxAmount;
    if (specialRate !== null) {
      taxAmount = Math.floor(taxBase * specialRate);
    } else {
      taxAmount = calcProgressiveTax(taxBase);
    }

    // 지방소득세 10%
    const localTax = Math.floor(taxAmount * 0.1);
    const total = taxAmount + localTax;

    return {
      gain,
      ltcRate,
      ltcAmount,
      netGain,
      basicDeduction,
      taxBase,
      taxAmount,
      localTax,
      total,
      specialRate,
      isExempt: false,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🏠</div>양도가액과 취득가액을 입력해주세요</div>`;
      return;
    }

    if (result.isExempt) {
      container.innerHTML = `
        <div class="breakdown-title">양도소득세 계산 결과</div>
        <div style="padding:24px 16px;text-align:center">
          <div class="exempt-badge">✅ 1세대1주택 비과세</div>
          <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">양도가액 12억 이하 1세대1주택으로 양도소득세가 비과세됩니다.</p>
        </div>`;
      return;
    }

    const { gain, ltcRate, ltcAmount, netGain, basicDeduction, taxBase, taxAmount, localTax, total, specialRate } = result;

    container.innerHTML = `
      <div class="breakdown-title">양도소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">양도차익</span>
        <span class="br-value">${UI.fmtWon(gain)}</span>
      </div>
      ${ltcRate > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">장기보유특별공제 (${(ltcRate*100).toFixed(0)}%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(ltcAmount)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">양도소득금액</span>
        <span class="br-value">${UI.fmtWon(netGain)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기본공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(basicDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">양도소득세${specialRate ? ` (${(specialRate*100).toFixed(0)}% 단기)` : ' (누진세율)'}</span>
        <span class="br-value">${UI.fmtWon(taxAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-capital-gains');
    if (!view) return;

    const btnCopy = view.querySelector('#cg-copy');
    const btnPrint = view.querySelector('#cg-print');
    const btnReset = view.querySelector('#cg-reset');
    const resultContainer = view.querySelector('#cg-result');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      const getNum = id => parseFloat(view.querySelector(`#${id}`)?.value || '0') || 0;
      const getCheck = id => view.querySelector(`#${id}`)?.checked || false;

      return {
        salePrice: getVal('cg-sale-price'),
        buyPrice: getVal('cg-buy-price'),
        expenses: getVal('cg-expenses'),
        holdYears: getNum('cg-hold-years'),
        holdMonths: getNum('cg-hold-months'),
        residYears: getNum('cg-resid-years'),
        isOneHousehold: getCheck('cg-one-household'),
        isHighPrice: getVal('cg-sale-price') > 1_200_000_000,
        houseCount: parseInt(view.querySelector('input[name="cg-house-count"]:checked')?.value || '1'),
        isAdjusted: getCheck('cg-adjusted'),
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));
    view.querySelectorAll('select').forEach(el => el.addEventListener('change', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = result.isExempt
          ? [{ label: '과세 여부', value: '1세대1주택 비과세' }]
          : [
            { label: '양도차익', value: UI.fmtWon(result.gain) },
            { label: '양도소득세', value: UI.fmtWon(result.taxAmount) },
            { label: '지방소득세', value: UI.fmtWon(result.localTax) },
            { label: '최종 납부세액', value: UI.fmtWon(result.total) },
          ];
        await UI.copyText(UI.formatResultForCopy('양도소득세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="number"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
