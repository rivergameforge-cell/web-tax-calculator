/* ===== 사업소득세 계산기 (2026년 기준) ===== */
const CalcBusiness = (() => {

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

  // 주요 업종별 단순경비율 / 기준경비율 (2026년 기준 근사값)
  const EXPENSE_RATES = {
    'retail':       { simple: 0.893, standard: 0.128, label: '소매업' },
    'food':         { simple: 0.874, standard: 0.107, label: '음식점업' },
    'service':      { simple: 0.640, standard: 0.180, label: '서비스업' },
    'freelance':    { simple: 0.641, standard: 0.191, label: '프리랜서 (인적용역)' },
    'manufacture':  { simple: 0.870, standard: 0.135, label: '제조업' },
    'construction': { simple: 0.870, standard: 0.120, label: '건설업' },
    'realestate':   { simple: 0.420, standard: 0.160, label: '부동산업' },
    'it':           { simple: 0.641, standard: 0.191, label: 'IT/소프트웨어' },
    'custom':       { simple: 0,     standard: 0,     label: '직접 입력' },
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
      revenue,         // 수입금액 (원)
      industryType,    // 업종 코드
      expenseMethod,   // 'simple' | 'standard' | 'actual'
      actualExpense,   // 실제 필요경비 (actual 방식)
      customRate,      // 직접입력 경비율
      personalDed,     // 인적공제 합계 (원)
    } = params;

    if (!revenue || revenue <= 0) return null;

    const info = EXPENSE_RATES[industryType] || EXPENSE_RATES['service'];

    // 필요경비 계산
    let expenseRate = 0;
    let expense = 0;

    if (expenseMethod === 'actual') {
      expense = actualExpense || 0;
      expenseRate = revenue > 0 ? expense / revenue : 0;
    } else if (industryType === 'custom') {
      expenseRate = (customRate || 0) / 100;
      expense = Math.floor(revenue * expenseRate);
    } else {
      expenseRate = expenseMethod === 'simple' ? info.simple : info.standard;
      expense = Math.floor(revenue * expenseRate);
    }

    const businessIncome = Math.max(0, revenue - expense); // 사업소득금액
    const totalDed = personalDed || 1_500_000; // 최소 본인 인적공제
    const taxBase = Math.max(0, businessIncome - totalDed);

    const incomeTax = calcProgressiveTax(taxBase);
    const localTax  = Math.floor(incomeTax * 0.10);
    const totalTax  = incomeTax + localTax;

    return {
      revenue, industryLabel: info.label, expenseMethod,
      expenseRate, expense, businessIncome,
      totalDed, taxBase, incomeTax, localTax, totalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💼</div>
          수입금액을 입력해주세요
        </div>`;
      return;
    }

    const r = result;
    const methodLabel = r.expenseMethod === 'simple' ? '단순경비율' : r.expenseMethod === 'standard' ? '기준경비율' : '실제 경비';

    container.innerHTML = `
      <div class="breakdown-title">사업소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">수입금액</span>
        <span class="br-value">${UI.fmtWon(r.revenue)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">${methodLabel} (${(r.expenseRate * 100).toFixed(1)}%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.expense)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">사업소득금액</span>
        <span class="br-value">${UI.fmtWon(r.businessIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.totalDed)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(r.taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득세 (누진세율)</span>
        <span class="br-value">${UI.fmtWon(r.incomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-business');
    if (!view) return;

    const resultContainer = view.querySelector('#biz-result');
    const btnCopy  = view.querySelector('#biz-copy');
    const btnPrint = view.querySelector('#biz-print');
    const btnReset = view.querySelector('#biz-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        revenue:       getVal('biz-revenue'),
        industryType:  view.querySelector('#biz-industry')?.value || 'service',
        expenseMethod: [...view.querySelectorAll('input[name="biz-expense-method"]')].find(r => r.checked)?.value || 'simple',
        actualExpense: getVal('biz-actual-expense'),
        customRate:    parseFloat(view.querySelector('#biz-custom-rate')?.value || '0') || 0,
        personalDed:   getVal('biz-personal-ded'),
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 실제 경비 입력 필드 토글
      const actualSection = view.querySelector('#biz-actual-section');
      const customSection = view.querySelector('#biz-custom-section');
      if (actualSection) actualSection.style.display = params.expenseMethod === 'actual' ? '' : 'none';
      if (customSection) customSection.style.display = params.industryType === 'custom' && params.expenseMethod !== 'actual' ? '' : 'none';
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('사업소득세 계산', [
          { label: '수입금액',     value: UI.fmtWon(r.revenue) },
          { label: '사업소득금액', value: UI.fmtWon(r.businessIncome) },
          { label: '소득세',       value: UI.fmtWon(r.incomeTax) },
          { label: '최종 납부세액', value: UI.fmtWon(r.totalTax) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
        const sel = view.querySelector('#biz-industry');
        if (sel) sel.value = 'service';
        const firstMethod = view.querySelector('input[name="biz-expense-method"][value="simple"]');
        if (firstMethod) firstMethod.checked = true;
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
