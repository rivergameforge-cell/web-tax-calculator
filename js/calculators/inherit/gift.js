/* ===== 증여세 계산기 (2026년 7월 기준) ===== */
const CalcGift = (() => {

  // 상속·증여세 기본세율표 (국세청 현행 안내 기준)
  const TAX_BRACKETS = [
    { limit: 100_000_000,    rate: 0.10, deduction:          0 },
    { limit: 500_000_000,    rate: 0.20, deduction: 10_000_000 },
    { limit: 1_000_000_000,  rate: 0.30, deduction: 60_000_000 },
    { limit: 3_000_000_000,  rate: 0.40, deduction: 160_000_000 },
    { limit: Infinity,       rate: 0.50, deduction: 460_000_000 },
  ];

  // 증여재산공제 한도 (10년 합산)
  const GIFT_DEDUCTIONS = {
    'spouse':           600_000_000, // 배우자
    'lineal':            50_000_000, // 직계존속 -> 성년 수증자
    'lineal-minor':      20_000_000, // 직계존속 -> 미성년 수증자
    'lineal-descendant': 50_000_000, // 직계비속 -> 직계존속
    'relative':          10_000_000, // 기타 친족 (4촌 이내 혈족, 3촌 이내 인척)
    'other':                     0, // 타인
  };

  const MARRIAGE_BIRTH_DEDUCTION = 100_000_000;

  function calcProgressiveTax(taxBase) {
    if (taxBase <= 0) return 0;
    for (const b of TAX_BRACKETS) {
      if (taxBase <= b.limit) {
        return Math.max(0, Math.floor(taxBase * b.rate - b.deduction));
      }
    }
    return 0;
  }

  function calculate(params) {
    const {
      giftAmount,       // 증여가액 (원)
      donorType,        // 증여자 관계
      isMinor,          // 미성년자 여부
      priorGift,        // 10년 내 동일인 기증여액 (원)
      specialEligible,  // 이번 증여의 혼인·출산 공제 적용 여부
      priorSpecialDeduction, // 과거에 사용한 혼인·출산 공제액 (평생 합산)
      priorSpecialInTenYears, // 10년 내 기증여액에 포함된 혼인·출산 공제액
      reportDiscount,   // 자진신고 세액공제 (기본 3%)
    } = params;

    if (!giftAmount || giftAmount <= 0) return null;

    // 증여재산공제
    let dedKey = donorType;
    if (donorType === 'lineal' && isMinor) dedKey = 'lineal-minor';
    const maxDeduction  = GIFT_DEDUCTIONS[dedKey] ?? 0;
    const totalGift     = giftAmount + (priorGift || 0);
    const deduction     = Math.min(totalGift, maxDeduction);

    // 혼인·출산 공제는 직계존속으로부터 받은 적격 증여에 한해 평생 1억원 한도다.
    const canUseSpecial = donorType === 'lineal' || donorType === 'lineal-minor';
    const usedSpecialLifetime = Math.min(
      Math.max(0, priorSpecialDeduction || 0),
      MARRIAGE_BIRTH_DEDUCTION,
    );
    const usedSpecialInAggregation = Math.min(
      Math.max(0, priorSpecialInTenYears || 0),
      Math.min(priorGift || 0, usedSpecialLifetime),
    );
    const remainSpecial = Math.max(0, MARRIAGE_BIRTH_DEDUCTION - usedSpecialLifetime);
    const specialDeduction = specialEligible && canUseSpecial
      ? Math.min(giftAmount, remainSpecial)
      : 0;
    const totalSpecialDeduction = usedSpecialInAggregation + specialDeduction;

    // 과세표준 = 10년 합산 증여가액 - 일반 공제 - 혼인·출산 공제
    const taxBase = Math.max(0, totalGift - maxDeduction - totalSpecialDeduction);

    // 합산증여에 대한 산출세액 계산 후 기증여분 세금 차감
    const totalTax     = calcProgressiveTax(taxBase);
    const priorTaxBase = Math.max(0, (priorGift || 0) - maxDeduction - usedSpecialInAggregation);
    const priorTax     = calcProgressiveTax(priorTaxBase);
    const giftTax      = Math.max(0, totalTax - priorTax);

    // 자진신고 세액공제 3%
    const discountRate   = reportDiscount ? 0.03 : 0;
    const discountAmount = Math.floor(giftTax * discountRate);
    const finalTax       = Math.max(0, giftTax - discountAmount);

    return {
      giftAmount, donorType, deduction, maxDeduction,
      priorGift: priorGift || 0,
      specialDeduction, usedSpecialLifetime, usedSpecialInAggregation, totalSpecialDeduction,
      totalGift, taxBase, giftTax, discountAmount, finalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🎁</div>
          증여가액을 입력해주세요
        </div>`;
      return;
    }

    const {
      giftAmount, deduction, maxDeduction, priorGift, totalGift,
      specialDeduction, usedSpecialLifetime, usedSpecialInAggregation,
      taxBase, giftTax, discountAmount, finalTax,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">증여세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">이번 증여가액</span>
        <span class="br-value">${UI.fmtWon(giftAmount)}</span>
      </div>
      ${priorGift > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">10년 내 기증여액 합산</span>
        <span class="br-value">+ ${UI.fmtWon(priorGift)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">합산 증여가액</span>
        <span class="br-value">${UI.fmtWon(totalGift)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">일반 증여재산공제 (한도 ${UI.fmtWon(maxDeduction)})</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(deduction)}</span>
      </div>
      ${usedSpecialLifetime > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">평생 추가공제 사용액</span>
        <span class="br-value">${UI.fmtWon(usedSpecialLifetime)}</span>
      </div>` : ''}
      ${usedSpecialInAggregation > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">10년 합산액에 반영된 과거 추가공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(usedSpecialInAggregation)}</span>
      </div>` : ''}
      ${specialDeduction > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">이번 혼인·출산 증여재산공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(specialDeduction)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">증여세 산출세액</span>
        <span class="br-value">${UI.fmtWon(giftTax)}</span>
      </div>
      ${discountAmount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">자진신고 세액공제 (3%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(discountAmount)}</span>
      </div>` : ''}
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(finalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-inherit-gift');
    if (!view) return;

    const resultContainer = view.querySelector('#gift-result');
    const btnCopy  = view.querySelector('#gift-copy');
    const btnPrint = view.querySelector('#gift-print');
    const btnReset = view.querySelector('#gift-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        giftAmount:     getVal('gift-amount'),
        donorType:      view.querySelector('#gift-donor-type')?.value || 'lineal',
        isMinor:        false,
        priorGift:      getVal('gift-prior'),
        specialEligible: view.querySelector('#gift-special')?.checked || false,
        priorSpecialDeduction: getVal('gift-special-prior'),
        priorSpecialInTenYears: getVal('gift-special-prior-10yr'),
        reportDiscount: view.querySelector('#gift-report-disc')?.checked !== false,
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
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '증여가액',     value: UI.fmtWon(result.giftAmount) },
          { label: '혼인·출산 공제', value: UI.fmtWon(result.specialDeduction) },
          { label: '과세표준',     value: UI.fmtWon(result.taxBase) },
          { label: '증여세 산출세액', value: UI.fmtWon(result.giftTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.finalTax) },
        ];
        await UI.copyText(UI.formatResultForCopy('증여세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const reportDisc = view.querySelector('#gift-report-disc');
        if (reportDisc) reportDisc.checked = true;
        const sel = view.querySelector('#gift-donor-type');
        if (sel) sel.value = 'lineal';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
