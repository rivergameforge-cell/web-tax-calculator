/* ===== 재산세 계산기 (2026년 기준) ===== */
const CalcPropertyTax = (() => {

  // 주택 재산세 누진세율 (과세표준 기준)
  const HOUSE_BRACKETS = [
    { limit:  60_000_000, rate: 0.001 },
    { limit: 150_000_000, rate: 0.0015 },
    { limit: 300_000_000, rate: 0.0025 },
    { limit: Infinity,    rate: 0.004  },
  ];

  // 토지 종합합산과세 (나대지 등)
  const LAND_GENERAL_BRACKETS = [
    { limit:  50_000_000, rate: 0.002 },
    { limit: 100_000_000, rate: 0.003 },
    { limit: Infinity,    rate: 0.005 },
  ];

  // 토지 별도합산과세 (상업용 건물 부속토지 등)
  const LAND_SPECIAL_BRACKETS = [
    { limit:  200_000_000, rate: 0.002 },
    { limit: 1_000_000_000, rate: 0.003 },
    { limit: Infinity,     rate: 0.004 },
  ];

  // 건물(일반) 단일세율
  const BUILDING_RATE = 0.0025;
  // 도시지역분 추가 (도시계획세)
  const URBAN_RATE = 0.0014;

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
      assetType,    // 'house' | 'land-general' | 'land-special' | 'building'
      publicPrice,  // 공시가격 (원)
      isUrban,      // 도시지역 여부 (도시지역분 가산)
    } = params;

    if (!publicPrice || publicPrice <= 0) return null;

    // 공정시장가액비율
    const ratioMap = {
      'house':        0.43,  // 주택 43% (2026년 기준)
      'land-general': 0.70,
      'land-special': 0.70,
      'building':     0.70,
    };

    const ratio   = ratioMap[assetType] || 0.70;
    const taxBase = Math.floor(publicPrice * ratio);

    let propertyTax = 0;
    let brackets;

    if (assetType === 'house') {
      brackets    = HOUSE_BRACKETS;
      propertyTax = calcBracketTax(taxBase, brackets);
    } else if (assetType === 'land-general') {
      propertyTax = calcBracketTax(taxBase, LAND_GENERAL_BRACKETS);
    } else if (assetType === 'land-special') {
      propertyTax = calcBracketTax(taxBase, LAND_SPECIAL_BRACKETS);
    } else {
      // 건물
      propertyTax = Math.floor(taxBase * BUILDING_RATE);
    }

    // 지방교육세 (재산세의 20%)
    const eduTax    = Math.floor(propertyTax * 0.20);
    // 도시지역분 (도시지역인 경우, 과표 × 0.14%)
    const urbanTax  = isUrban ? Math.floor(taxBase * URBAN_RATE) : 0;

    const totalTax  = propertyTax + eduTax + urbanTax;

    return {
      publicPrice, ratio, taxBase,
      propertyTax, eduTax, urbanTax,
      totalTax, isUrban,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏠</div>
          공시가격을 입력하면 재산세가 계산됩니다
        </div>`;
      return;
    }

    const { publicPrice, ratio, taxBase, propertyTax, eduTax, urbanTax, totalTax, isUrban } = result;

    container.innerHTML = `
      <div class="breakdown-title">재산세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">공시가격</span>
        <span class="br-value">${UI.fmtWon(publicPrice)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">공정시장가액비율 (${(ratio * 100).toFixed(0)}%)</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">재산세</span>
        <span class="br-value">${UI.fmtWon(propertyTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방교육세 (재산세의 20%)</span>
        <span class="br-value">${UI.fmtWon(eduTax)}</span>
      </div>
      ${isUrban ? `
      <div class="breakdown-row">
        <span class="br-label">도시지역분 (0.14%)</span>
        <span class="br-value">${UI.fmtWon(urbanTax)}</span>
      </div>` : ''}
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(totalTax)}</span>
      </div>
      <div class="breakdown-row" style="font-size:12px;color:var(--text-muted);padding-top:4px">
        <span class="br-label">7월 납부 (1/2)</span>
        <span class="br-value">${UI.fmtWon(Math.floor(totalTax / 2))}</span>
      </div>
      <div class="breakdown-row" style="font-size:12px;color:var(--text-muted)">
        <span class="br-label">9월 납부 (1/2)</span>
        <span class="br-value">${UI.fmtWon(Math.ceil(totalTax / 2))}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-property-tax');
    if (!view) return;

    const resultContainer = view.querySelector('#ptax-result');
    const btnCopy  = view.querySelector('#ptax-copy');
    const btnPrint = view.querySelector('#ptax-print');
    const btnReset = view.querySelector('#ptax-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      return {
        assetType:   [...view.querySelectorAll('input[name="ptax-type"]')].find(r => r.checked)?.value || 'house',
        publicPrice: UI.parseNum((view.querySelector('#ptax-price')?.value || '').replace(/,/g, '')),
        isUrban:     view.querySelector('#ptax-urban')?.checked || false,
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '공시가격', value: UI.fmtWon(result.publicPrice) },
          { label: '재산세',   value: UI.fmtWon(result.propertyTax) },
          { label: '지방교육세', value: UI.fmtWon(result.eduTax) },
          { label: '도시지역분', value: UI.fmtWon(result.urbanTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.totalTax) },
        ];
        await UI.copyText(UI.formatResultForCopy('재산세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const firstType = view.querySelector('input[name="ptax-type"][value="house"]');
        if (firstType) firstType.checked = true;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
