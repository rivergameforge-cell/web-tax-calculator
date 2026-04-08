/* ===== 부동산 총 비용 계산기 (집 살 때 / 집 팔 때) ===== */
const CalcTotalCost = (() => {

  // ── 취득세율 (1주택 기준, 2026년) ──
  function getAcqRate(price, houseCount, isAdjusted) {
    if (houseCount >= 3) return isAdjusted ? 0.12 : 0.08;
    if (houseCount === 2) return isAdjusted ? 0.08 : getOneHouseRate(price);
    return getOneHouseRate(price);
  }

  function getOneHouseRate(price) {
    if (price <= 600_000_000) return 0.01;
    if (price <= 900_000_000) return 0.01 + (price - 600_000_000) / 300_000_000 * 0.02;
    return 0.03;
  }

  // ── 중개보수율 (매매) ──
  const COMM_RATES = [
    { limit:  50_000_000, rate: 0.006, max:  250_000 },
    { limit: 200_000_000, rate: 0.005, max:  800_000 },
    { limit: 600_000_000, rate: 0.004, max: null },
    { limit: 900_000_000, rate: 0.005, max: null },
    { limit: 1_200_000_000, rate: 0.005, max: null },
    { limit: 1_500_000_000, rate: 0.006, max: null },
    { limit: Infinity,    rate: 0.007, max: null },
  ];

  function getCommission(price) {
    for (const b of COMM_RATES) {
      if (price <= b.limit) {
        const fee = Math.floor(price * b.rate);
        return b.max ? Math.min(fee, b.max) : fee;
      }
    }
    return 0;
  }

  // ── 인지세 ──
  function getStampTax(price) {
    if (price <= 100_000_000) return 0;
    if (price <= 1_000_000_000) return 150_000;
    return 350_000;
  }

  // ── 양도소득세 세율 (기본세율, 2026년) ──
  const INCOME_BRACKETS = [
    { limit:  14_000_000, rate: 0.06, ded:          0 },
    { limit:  50_000_000, rate: 0.15, ded:  1_260_000 },
    { limit:  88_000_000, rate: 0.24, ded:  5_760_000 },
    { limit: 150_000_000, rate: 0.35, ded: 15_440_000 },
    { limit: 300_000_000, rate: 0.38, ded: 19_940_000 },
    { limit: 500_000_000, rate: 0.40, ded: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, ded: 35_940_000 },
    { limit: Infinity,    rate: 0.45, ded: 65_940_000 },
  ];

  function calcIncomeTax(taxBase) {
    if (taxBase <= 0) return 0;
    for (const b of INCOME_BRACKETS) {
      if (taxBase <= b.limit) return Math.floor(taxBase * b.rate - b.ded);
    }
    return 0;
  }

  // ── 장기보유특별공제율 ──
  function getLongTermDeduction(years, isOneHouse) {
    if (years < 3) return 0;
    if (isOneHouse) {
      // 1주택: 보유 연 4% + 거주 연 4%, 합산 최대 80% (간이: 연 8%)
      return Math.min(years * 0.08, 0.80);
    }
    // 일반: 3년 이상, 연 2%, 최대 30%
    return Math.min(years * 0.02, 0.30);
  }

  // ===== 집 살 때 계산 =====
  function calculateBuying(params) {
    const { price, area, houseCount, isAdjusted } = params;
    if (!price || price <= 0) return null;

    const acqRate = getAcqRate(price, houseCount, isAdjusted);
    const acqTax = Math.floor(price * acqRate);

    // 지방교육세: 취득세율 2% 이하 → 10%, 초과 → 20%
    const eduRate = acqRate <= 0.02 ? 0.1 : 0.2;
    const eduTax = Math.floor(acqTax * eduRate);

    // 농어촌특별세: 85㎡ 초과 시 취득세의 10%
    const ruralTax = (area > 85) ? Math.floor(acqTax * 0.1) : 0;

    const stampTax = getStampTax(price);
    const commission = getCommission(price);
    const commVat = Math.floor(commission * 0.1);

    // 법무사 비용 (등기 대행, 근사치)
    const legalFee = price <= 300_000_000 ? 400_000 :
                     price <= 600_000_000 ? 500_000 :
                     price <= 1_000_000_000 ? 700_000 : 1_000_000;

    // 국민주택채권 매입할인비 (근사: 매매가 × 비율 × 할인율)
    const bondRate = price <= 200_000_000 ? 0.013 :
                     price <= 500_000_000 ? 0.021 :
                     price <= 1_000_000_000 ? 0.031 : 0.037;
    const bondDiscount = Math.floor(price * bondRate * 0.08); // 할인율 약 8%

    const totalTax = acqTax + eduTax + ruralTax;
    const totalCost = totalTax + stampTax + commission + commVat + legalFee + bondDiscount;

    return {
      price, acqRate, acqTax, eduTax, ruralTax, stampTax,
      commission, commVat, legalFee, bondDiscount,
      totalTax, totalCost,
    };
  }

  // ===== 집 팔 때 계산 =====
  function calculateSelling(params) {
    const { sellPrice, buyPrice, holdYears, houseCount, expenses } = params;
    if (!sellPrice || sellPrice <= 0 || !buyPrice) return null;

    const gain = sellPrice - buyPrice - (expenses || 0);
    if (gain <= 0) {
      // 양도차익 없음
      const commission = getCommission(sellPrice);
      const commVat = Math.floor(commission * 0.1);
      return {
        sellPrice, buyPrice, gain, holdYears,
        longTermDed: 0, longTermAmount: 0,
        basicDeduction: 0, taxBase: 0,
        incomeTax: 0, localTax: 0,
        commission, commVat,
        totalTax: 0, totalCost: commission + commVat,
        noGain: true,
      };
    }

    const isOneHouse = houseCount === 1;
    const longTermRate = getLongTermDeduction(holdYears, isOneHouse);
    const longTermAmount = Math.floor(gain * longTermRate);
    const basicDeduction = 2_500_000;
    const taxBase = Math.max(0, gain - longTermAmount - basicDeduction);

    // 1주택 비과세 (보유 2년+, 매도가 12억 이하)
    let incomeTax = 0;
    let exempt = false;
    if (isOneHouse && holdYears >= 2 && sellPrice <= 1_200_000_000) {
      exempt = true;
    } else {
      incomeTax = calcIncomeTax(taxBase);
    }

    const localTax = Math.floor(incomeTax * 0.1); // 지방소득세

    const commission = getCommission(sellPrice);
    const commVat = Math.floor(commission * 0.1);

    const totalTax = incomeTax + localTax;
    const totalCost = totalTax + commission + commVat;

    return {
      sellPrice, buyPrice, gain, holdYears, expenses: expenses || 0,
      longTermDed: longTermRate, longTermAmount,
      basicDeduction, taxBase,
      incomeTax, localTax,
      commission, commVat,
      totalTax, totalCost, exempt,
    };
  }

  // ===== 렌더링 =====
  function renderBuyResult(r, container) {
    if (!r) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🏠</div>매매가격을 입력해주세요</div>`;
      return;
    }
    container.innerHTML = `
      <div class="breakdown-title">집 살 때 예상 비용</div>
      <div class="breakdown-row">
        <span class="br-label">매매가격</span>
        <span class="br-value">${UI.fmtWon(r.price)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득세 (${(r.acqRate * 100).toFixed(1)}%)</span>
        <span class="br-value">${UI.fmtWon(r.acqTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">지방교육세</span>
        <span class="br-value">${UI.fmtWon(r.eduTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">농어촌특별세</span>
        <span class="br-value">${UI.fmtWon(r.ruralTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">세금 소계</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">인지세</span>
        <span class="br-value">${UI.fmtWon(r.stampTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">중개보수</span>
        <span class="br-value">${UI.fmtWon(r.commission)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">중개보수 부가세</span>
        <span class="br-value">${UI.fmtWon(r.commVat)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">법무사·등기 비용 (추정)</span>
        <span class="br-value">≈ ${UI.fmtWon(r.legalFee)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">국민주택채권 할인비 (추정)</span>
        <span class="br-value">≈ ${UI.fmtWon(r.bondDiscount)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">총 예상 부대비용</span>
        <span class="br-value">${UI.fmtWon(r.totalCost)}</span>
      </div>
    `;
  }

  function renderSellResult(r, container) {
    if (!r) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">💰</div>매도·매수 가격을 입력해주세요</div>`;
      return;
    }

    const exemptBadge = r.exempt ? `<div class="exempt-badge">✅ 1주택 비과세 대상</div>` : '';

    container.innerHTML = `
      <div class="breakdown-title">집 팔 때 예상 비용</div>
      ${exemptBadge}
      <div class="breakdown-row">
        <span class="br-label">매도가격</span>
        <span class="br-value">${UI.fmtWon(r.sellPrice)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득가격</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.buyPrice)}</span>
      </div>
      ${r.expenses > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">필요경비</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.expenses)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">양도차익</span>
        <span class="br-value">${r.noGain ? '0원 (차익 없음)' : UI.fmtWon(r.gain)}</span>
      </div>
      ${!r.noGain && !r.exempt ? `
      ${r.longTermAmount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">장기보유특별공제 (${(r.longTermDed * 100).toFixed(0)}%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.longTermAmount)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">기본공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.basicDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(r.taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">양도소득세</span>
        <span class="br-value">${UI.fmtWon(r.incomeTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">중개보수</span>
        <span class="br-value">${UI.fmtWon(r.commission)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">중개보수 부가세</span>
        <span class="br-value">${UI.fmtWon(r.commVat)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">총 예상 비용</span>
        <span class="br-value">${UI.fmtWon(r.totalCost)}</span>
      </div>
    `;
  }

  // ===== 초기화 =====
  function init() {
    const view = document.getElementById('view-real-estate-total-cost');
    if (!view) return;

    const buyPanel = view.querySelector('#tc-buy-panel');
    const sellPanel = view.querySelector('#tc-sell-panel');
    const buyResult = view.querySelector('#tc-buy-result');
    const sellResult = view.querySelector('#tc-sell-result');

    // 모드 토글
    const modeRadios = view.querySelectorAll('input[name="tc-mode"]');
    modeRadios.forEach(r => r.addEventListener('change', () => {
      const mode = view.querySelector('input[name="tc-mode"]:checked')?.value;
      if (mode === 'buy') {
        UI.show(buyPanel); UI.hide(sellPanel);
        UI.show(buyResult); UI.hide(sellResult);
      } else {
        UI.hide(buyPanel); UI.show(sellPanel);
        UI.hide(sellResult); UI.show(buyResult);
        UI.show(sellResult); UI.hide(buyResult);
      }
    }));

    // 숫자 입력 바인딩
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    const doBuyCalc = UI.debounce(() => {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      const result = calculateBuying({
        price: getVal('tc-buy-price'),
        area: parseFloat(view.querySelector('#tc-buy-area')?.value || '60'),
        houseCount: parseInt(view.querySelector('#tc-buy-houses')?.value || '1'),
        isAdjusted: view.querySelector('#tc-buy-adjusted')?.checked || false,
      });
      renderBuyResult(result, buyResult);
    }, 200);

    const doSellCalc = UI.debounce(() => {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      const result = calculateSelling({
        sellPrice: getVal('tc-sell-price'),
        buyPrice: getVal('tc-sell-buyprice'),
        holdYears: parseInt(view.querySelector('#tc-sell-years')?.value || '0'),
        houseCount: parseInt(view.querySelector('#tc-sell-houses')?.value || '1'),
        expenses: getVal('tc-sell-expenses'),
      });
      renderSellResult(result, sellResult);
    }, 200);

    // 이벤트 바인딩
    view.querySelectorAll('#tc-buy-panel input, #tc-buy-panel select').forEach(el => {
      el.addEventListener('input', doBuyCalc);
      el.addEventListener('change', doBuyCalc);
    });
    view.querySelectorAll('#tc-sell-panel input, #tc-sell-panel select').forEach(el => {
      el.addEventListener('input', doSellCalc);
      el.addEventListener('change', doSellCalc);
    });

    // 복사·인쇄·초기화
    view.querySelector('#tc-copy')?.addEventListener('click', async () => {
      const mode = view.querySelector('input[name="tc-mode"]:checked')?.value;
      let rows, title;
      if (mode === 'buy') {
        const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
        const r = calculateBuying({ price: getVal('tc-buy-price'), area: 60, houseCount: 1, isAdjusted: false });
        if (!r) return;
        title = '집 살 때 총 비용';
        rows = [
          { label: '매매가격', value: UI.fmtWon(r.price) },
          { label: '세금 소계', value: UI.fmtWon(r.totalTax) },
          { label: '총 예상 부대비용', value: UI.fmtWon(r.totalCost) },
        ];
      } else {
        const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
        const r = calculateSelling({ sellPrice: getVal('tc-sell-price'), buyPrice: getVal('tc-sell-buyprice'), holdYears: 0, houseCount: 1, expenses: 0 });
        if (!r) return;
        title = '집 팔 때 총 비용';
        rows = [
          { label: '양도차익', value: UI.fmtWon(r.gain) },
          { label: '양도소득세', value: UI.fmtWon(r.incomeTax) },
          { label: '총 예상 비용', value: UI.fmtWon(r.totalCost) },
        ];
      }
      await UI.copyText(UI.formatResultForCopy(title, rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#tc-print')?.addEventListener('click', () => UI.printCalc());
    view.querySelector('#tc-reset')?.addEventListener('click', () => {
      view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
      view.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
      view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
      renderBuyResult(null, buyResult);
      renderSellResult(null, sellResult);
    });

    // 초기 상태
    UI.show(buyPanel); UI.hide(sellPanel);
    UI.show(buyResult); UI.hide(sellResult);
    doBuyCalc();
    doSellCalc();
  }

  return { init };
})();
