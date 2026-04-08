/* ===== 증여세 계산기 (2026년 기준) ===== */
const CalcGift = (() => {

  // 2026년 개정 증여세 세율표 (상속세와 동일, 4단계)
  const TAX_BRACKETS = [
    { limit: 200_000_000,    rate: 0.10, deduction:          0 },
    { limit: 500_000_000,    rate: 0.20, deduction: 20_000_000 },
    { limit: 1_000_000_000,  rate: 0.30, deduction: 70_000_000 },
    { limit: Infinity,       rate: 0.40, deduction: 170_000_000 },
  ];

  // 증여재산공제 한도 (10년 합산)
  const GIFT_DEDUCTIONS = {
    'spouse':    600_000_000,  // 배우자
    'lineal':     50_000_000,  // 직계존비속 (성인)
    'lineal-minor': 20_000_000, // 직계존비속 (미성년자)
    'relative':   10_000_000,  // 기타 친족 (6촌 이내 혈족, 4촌 이내 인척)
    'other':             0,   // 타인
  };

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
      reportDiscount,   // 자진신고 세액공제 (기본 3%)
    } = params;

    if (!giftAmount || giftAmount <= 0) return null;

    // 증여재산공제
    let dedKey = donorType;
    if (donorType === 'lineal' && isMinor) dedKey = 'lineal-minor';
    const maxDeduction  = GIFT_DEDUCTIONS[dedKey] ?? 0;
    // 기증여액이 이미 공제를 소진했는지 확인
    const usedDeduction = Math.min(priorGift || 0, maxDeduction);
    const remainDed     = Math.max(0, maxDeduction - usedDeduction);
    const deduction     = Math.min(giftAmount, remainDed);

    // 과세표준 = 증여가액 - 증여재산공제 + 10년 내 합산
    const totalGift = giftAmount + (priorGift || 0);
    const taxBase   = Math.max(0, totalGift - maxDeduction);

    // 합산증여에 대한 산출세액 계산 후 기증여분 세금 차감
    const totalTax     = calcProgressiveTax(taxBase);
    const priorTaxBase = Math.max(0, (priorGift || 0) - maxDeduction);
    const priorTax     = calcProgressiveTax(priorTaxBase);
    const giftTax      = Math.max(0, totalTax - priorTax);

    // 자진신고 세액공제 3%
    const discountRate   = reportDiscount ? 0.03 : 0;
    const discountAmount = Math.floor(giftTax * discountRate);
    const finalTax       = Math.max(0, giftTax - discountAmount);

    return {
      giftAmount, donorType, deduction, maxDeduction,
      priorGift: priorGift || 0,
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

    const { giftAmount, deduction, maxDeduction, priorGift, totalGift, taxBase, giftTax, discountAmount, finalTax } = result;

    const donorLabels = {
      'spouse':        '배우자',
      'lineal':        '직계존비속 (성인)',
      'lineal-minor':  '직계존비속 (미성년자)',
      'relative':      '기타 친족',
      'other':         '타인',
    };

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
        <span class="br-label">증여재산공제 (한도 ${UI.fmtWon(maxDeduction)})</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(maxDeduction)}</span>
      </div>
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
        isMinor:        view.querySelector('#gift-minor')?.checked || false,
        priorGift:      getVal('gift-prior'),
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
        const sel = view.querySelector('#gift-donor-type');
        if (sel) sel.value = 'lineal';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
