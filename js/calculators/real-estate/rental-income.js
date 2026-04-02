/* ===== 임대소득세 계산기 (2026년 기준) ===== */
const CalcRentalIncome = (() => {

  // 종합소득세 누진세율표
  const TAX_BRACKETS = [
    { limit:  14_000_000, rate: 0.06, deduction:          0 },
    { limit:  50_000_000, rate: 0.15, deduction:  1_260_000 },
    { limit:  88_000_000, rate: 0.24, deduction:  5_760_000 },
    { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
    { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
    { limit: 500_000_000, rate: 0.40, deduction: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { limit: Infinity,    rate: 0.45, deduction: 65_940_000 },
  ];

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
      rentalIncome,      // 연간 총 임대수입금액 (원)
      taxMethod,         // 'separate' (분리과세) | 'comprehensive' (종합과세)
      isRegistered,      // 임대사업자 등록 여부 (등록 시 필요경비율 60%, 미등록 50%)
      otherIncome,       // 종합과세 시 다른 소득 합산 (원)
      standardDeduction, // 기본공제 적용 여부 (분리과세 시)
    } = params;

    if (!rentalIncome || rentalIncome <= 0) return null;

    const expenseRate    = isRegistered ? 0.60 : 0.50; // 필요경비율
    const expenseAmount  = Math.floor(rentalIncome * expenseRate);
    const netIncome      = rentalIncome - expenseAmount; // 임대소득금액

    // 분리과세 (2천만원 이하 선택 가능)
    if (taxMethod === 'separate' && rentalIncome <= 20_000_000) {
      // 기본공제: 등록임대 400만원, 미등록 200만원
      const basicDed       = standardDeduction ? (isRegistered ? 4_000_000 : 2_000_000) : 0;
      const separateTaxBase = Math.max(0, netIncome - basicDed);
      const separateTax     = Math.floor(separateTaxBase * 0.14);
      const localTax        = Math.floor(separateTax * 0.10);
      const totalTax        = separateTax + localTax;

      return {
        rentalIncome, expenseRate, expenseAmount, netIncome,
        taxMethod: 'separate',
        basicDed, taxBase: separateTaxBase,
        incomeTax: separateTax, localTax, totalTax,
        params,
      };
    }

    // 종합과세
    const totalIncome = netIncome + (otherIncome || 0);
    // 종합소득공제는 단순화 (소득공제 없이 누진세 적용)
    const taxBase      = Math.max(0, totalIncome);
    const incomeTax    = calcProgressiveTax(taxBase);
    const localTax     = Math.floor(incomeTax * 0.10);
    const totalTax     = incomeTax + localTax;

    return {
      rentalIncome, expenseRate, expenseAmount, netIncome,
      taxMethod: 'comprehensive',
      otherIncome: otherIncome || 0,
      taxBase,
      incomeTax, localTax, totalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏠</div>
          연간 임대수입금액을 입력해주세요
        </div>`;
      return;
    }

    const { rentalIncome, expenseRate, expenseAmount, netIncome, taxMethod, taxBase, incomeTax, localTax, totalTax } = result;

    container.innerHTML = `
      <div class="breakdown-title">임대소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">연간 임대수입</span>
        <span class="br-value">${UI.fmtWon(rentalIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">필요경비 (${(expenseRate * 100).toFixed(0)}%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(expenseAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">임대소득금액</span>
        <span class="br-value">${UI.fmtWon(netIncome)}</span>
      </div>
      ${result.taxMethod === 'separate' && result.basicDed > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기본공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(result.basicDed)}</span>
      </div>` : ''}
      ${result.taxMethod === 'comprehensive' && result.otherIncome > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">다른 소득 합산</span>
        <span class="br-value">+ ${UI.fmtWon(result.otherIncome)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득세 ${taxMethod === 'separate' ? '(분리과세 14%)' : '(종합과세 누진)'}</span>
        <span class="br-value">${UI.fmtWon(incomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(totalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-rental-income');
    if (!view) return;

    const resultContainer = view.querySelector('#rental-result');
    const btnCopy  = view.querySelector('#rental-copy');
    const btnPrint = view.querySelector('#rental-print');
    const btnReset = view.querySelector('#rental-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        rentalIncome:      getVal('rental-income'),
        taxMethod:         [...view.querySelectorAll('input[name="rental-method"]')].find(r => r.checked)?.value || 'separate',
        isRegistered:      view.querySelector('#rental-registered')?.checked || false,
        otherIncome:       getVal('rental-other-income'),
        standardDeduction: view.querySelector('#rental-std-ded')?.checked !== false,
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 분리과세 전용 / 종합과세 전용 섹션 토글
      const sepSection   = view.querySelector('#rental-separate-section');
      const compSection  = view.querySelector('#rental-comp-section');
      const isSeparate   = params.taxMethod === 'separate';
      const canSeparate  = params.rentalIncome <= 20_000_000 && isSeparate;
      if (sepSection)  sepSection.style.display  = canSeparate ? '' : 'none';
      if (compSection) compSection.style.display = !isSeparate ? '' : 'none';
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '연간 임대수입', value: UI.fmtWon(result.rentalIncome) },
          { label: '임대소득금액', value: UI.fmtWon(result.netIncome) },
          { label: '소득세',       value: UI.fmtWon(result.incomeTax) },
          { label: '지방소득세',   value: UI.fmtWon(result.localTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.totalTax) },
        ];
        await UI.copyText(UI.formatResultForCopy('임대소득세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const firstMethod = view.querySelector('input[name="rental-method"][value="separate"]');
        if (firstMethod) firstMethod.checked = true;
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
