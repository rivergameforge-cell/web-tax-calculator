/* ===== 종합부동산세 계산기 (2026년 기준) ===== */
const CalcComprehensive = (() => {

  // 주택 종부세 세율표 (2주택 이하 / 3주택 이상·조정2주택)
  const HOUSE_BRACKETS_GENERAL = [
    { limit:  300_000_000, rate: 0.005 },
    { limit:  600_000_000, rate: 0.007 },
    { limit: 1_200_000_000, rate: 0.010 },
    { limit: 2_500_000_000, rate: 0.014 },
    { limit: 5_000_000_000, rate: 0.020 },
    { limit: Infinity,      rate: 0.027 },
  ];

  const HOUSE_BRACKETS_HEAVY = [
    { limit:  300_000_000, rate: 0.012 },
    { limit:  600_000_000, rate: 0.016 },
    { limit: 1_200_000_000, rate: 0.022 },
    { limit: 2_500_000_000, rate: 0.036 },
    { limit: 5_000_000_000, rate: 0.050 },
    { limit: Infinity,      rate: 0.050 },
  ];

  // 토지 종부세 세율표
  const LAND_BRACKETS_GENERAL = [ // 종합합산 (나대지 등)
    { limit:  150_000_000, rate: 0.010 },
    { limit: 1_000_000_000, rate: 0.020 },
    { limit: Infinity,      rate: 0.030 },
  ];
  const LAND_BRACKETS_SPECIAL = [ // 별도합산 (상업용 토지 등)
    { limit:  200_000_000, rate: 0.005 },
    { limit: 1_400_000_000, rate: 0.006 },
    { limit: Infinity,      rate: 0.007 },
  ];

  // 공정시장가액비율 (2026년 주택: 60%)
  const FAIR_MARKET_RATIO_HOUSE = 0.60;
  const FAIR_MARKET_RATIO_LAND  = 1.00;

  function calcBracketTax(taxBase, brackets) {
    if (taxBase <= 0) return 0;
    let prev = 0;
    let tax  = 0;
    for (const b of brackets) {
      if (taxBase <= prev) break;
      const slice = Math.min(taxBase, b.limit) - prev;
      tax  += slice * b.rate;
      prev  = b.limit;
      if (taxBase <= b.limit) break;
    }
    return Math.floor(tax);
  }

  function calculate(params) {
    const {
      assetType,      // 'house' | 'land-general' | 'land-special'
      publicPrice,    // 공시가격 합산 (원)
      houseCount,     // 주택 수
      isOneHouse,     // 1세대1주택자
      isAdjusted2,    // 조정지역 2주택 여부 (중과)
      age,            // 연령 (고령자 세액공제)
      holdYears,      // 보유기간 (장기보유 세액공제)
    } = params;

    if (!publicPrice || publicPrice <= 0) return null;

    let basicDeduction  = 0;
    let brackets        = HOUSE_BRACKETS_GENERAL;
    let ruralTaxRate    = 0.20; // 농특세

    if (assetType === 'house') {
      basicDeduction = isOneHouse ? 1_200_000_000 : 900_000_000;
      const isHeavy  = houseCount >= 3 || (houseCount === 2 && isAdjusted2);
      brackets       = isHeavy ? HOUSE_BRACKETS_HEAVY : HOUSE_BRACKETS_GENERAL;
      ruralTaxRate   = 0.20;
    } else if (assetType === 'land-general') {
      basicDeduction = 500_000_000;
      brackets       = LAND_BRACKETS_GENERAL;
      ruralTaxRate   = 0.20;
    } else {
      basicDeduction = 8_000_000_000;
      brackets       = LAND_BRACKETS_SPECIAL;
      ruralTaxRate   = 0.20;
    }

    const ratio    = assetType === 'house' ? FAIR_MARKET_RATIO_HOUSE : FAIR_MARKET_RATIO_LAND;
    const adjusted = Math.floor(publicPrice * ratio); // 공정시장가액
    const taxBase  = Math.max(0, adjusted - basicDeduction);

    if (taxBase === 0) {
      return { publicPrice, basicDeduction, adjusted, taxBase, comprehensiveTax: 0, ruralTax: 0, totalTax: 0, ageDiscount: 0, holdDiscount: 0, params };
    }

    let comprehensiveTax = calcBracketTax(taxBase, brackets);

    // 1세대1주택 고령자·장기보유 세액공제 (중복 적용, 합계 80% 한도)
    let ageDiscount  = 0;
    let holdDiscount = 0;
    if (assetType === 'house' && isOneHouse) {
      // 고령자: 60~65세 20%, 65~70세 30%, 70세 이상 40%
      let ageRate = 0;
      if (age >= 70)      ageRate = 0.40;
      else if (age >= 65) ageRate = 0.30;
      else if (age >= 60) ageRate = 0.20;

      // 장기보유: 5~10년 20%, 10~15년 40%, 15년 이상 50%
      let holdRate = 0;
      if (holdYears >= 15)     holdRate = 0.50;
      else if (holdYears >= 10) holdRate = 0.40;
      else if (holdYears >= 5)  holdRate = 0.20;

      const totalRate = Math.min(ageRate + holdRate, 0.80);
      const combined  = Math.floor(comprehensiveTax * totalRate);
      ageDiscount     = Math.floor(comprehensiveTax * ageRate);
      holdDiscount    = Math.floor(comprehensiveTax * holdRate);
      comprehensiveTax = Math.max(0, comprehensiveTax - combined);
    }

    const ruralTax = Math.floor(comprehensiveTax * ruralTaxRate);
    const totalTax = comprehensiveTax + ruralTax;

    return {
      publicPrice, basicDeduction, adjusted, taxBase,
      comprehensiveTax, ruralTax, totalTax,
      ageDiscount, holdDiscount,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏠</div>
          공시가격을 입력하면 종부세가 계산됩니다
        </div>`;
      return;
    }

    const { publicPrice, basicDeduction, adjusted, taxBase, comprehensiveTax, ruralTax, totalTax, ageDiscount, holdDiscount } = result;

    if (taxBase === 0) {
      container.innerHTML = `
        <div class="breakdown-title">종합부동산세 계산 결과</div>
        <div style="padding:24px 16px;text-align:center">
          <div class="exempt-badge">✅ 종부세 비해당</div>
          <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
            공시가격 합산이 기본공제(${UI.fmtWon(basicDeduction)}) 이하이므로<br>종합부동산세 과세 대상이 아닙니다.
          </p>
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">종합부동산세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">공시가격 합산</span>
        <span class="br-value">${UI.fmtWon(publicPrice)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">공정시장가액 (60%)</span>
        <span class="br-value">${UI.fmtWon(adjusted)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기본공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(basicDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      ${ageDiscount > 0 || holdDiscount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">고령자·장기보유 세액공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(ageDiscount + holdDiscount)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">종합부동산세</span>
        <span class="br-value">${UI.fmtWon(comprehensiveTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">농어촌특별세 (20%)</span>
        <span class="br-value">${UI.fmtWon(ruralTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(totalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-comprehensive');
    if (!view) return;

    const resultContainer = view.querySelector('#comp-result');
    const btnCopy  = view.querySelector('#comp-copy');
    const btnPrint = view.querySelector('#comp-print');
    const btnReset = view.querySelector('#comp-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      const getNum = id => parseInt(view.querySelector(`#${id}`)?.value || '0') || 0;

      return {
        assetType:  [...view.querySelectorAll('input[name="comp-type"]')].find(r => r.checked)?.value || 'house',
        publicPrice: getVal('comp-price'),
        houseCount: parseInt([...view.querySelectorAll('input[name="comp-count"]')].find(r => r.checked)?.value || '1'),
        isOneHouse:  view.querySelector('#comp-one-house')?.checked || false,
        isAdjusted2: view.querySelector('#comp-adjusted2')?.checked || false,
        age:         getNum('comp-age'),
        holdYears:   getNum('comp-hold-years'),
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 주택 전용 옵션 토글
      const houseOnly = view.querySelectorAll('.comp-house-only');
      const isHouse   = params.assetType === 'house';
      houseOnly.forEach(el => el.style.display = isHouse ? '' : 'none');
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '공시가격 합산', value: UI.fmtWon(result.publicPrice) },
          { label: '과세표준', value: UI.fmtWon(result.taxBase) },
          { label: '종합부동산세', value: UI.fmtWon(result.comprehensiveTax) },
          { label: '농어촌특별세', value: UI.fmtWon(result.ruralTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.totalTax) },
        ];
        await UI.copyText(UI.formatResultForCopy('종합부동산세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const firstType = view.querySelector('input[name="comp-type"][value="house"]');
        if (firstType) firstType.checked = true;
        const firstCount = view.querySelector('input[name="comp-count"][value="1"]');
        if (firstCount) firstCount.checked = true;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
