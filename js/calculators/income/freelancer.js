/* ===== 프리랜서 3.3% 세금 계산기 (2026년 기준) ===== */
const CalcFreelancer = (() => {

  // 종합소득세 세율 (8단계)
  const TAX_BRACKETS = [
    { limit: 14_000_000,    rate: 0.06, deduction: 0 },
    { limit: 50_000_000,    rate: 0.15, deduction: 1_260_000 },
    { limit: 88_000_000,    rate: 0.24, deduction: 5_760_000 },
    { limit: 150_000_000,   rate: 0.35, deduction: 15_440_000 },
    { limit: 300_000_000,   rate: 0.38, deduction: 19_940_000 },
    { limit: 500_000_000,   rate: 0.40, deduction: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { limit: Infinity,      rate: 0.45, deduction: 65_940_000 },
  ];

  // 단순경비율 (주요 업종 대표값)
  const EXPENSE_RATES = {
    'it': { label: 'IT/소프트웨어', rate: 64.1 },
    'design': { label: '디자인/영상', rate: 61.2 },
    'writing': { label: '저술/번역', rate: 72.9 },
    'consulting': { label: '경영컨설팅', rate: 62.4 },
    'education': { label: '교육/강의', rate: 72.4 },
    'custom': { label: '직접 입력', rate: 0 },
  };

  function calcIncomeTax(taxBase) {
    if (taxBase <= 0) return 0;
    for (const bracket of TAX_BRACKETS) {
      if (taxBase <= bracket.limit) {
        return Math.floor(taxBase * bracket.rate - bracket.deduction);
      }
    }
    return 0;
  }

  function getTaxBracketLabel(taxBase) {
    for (const bracket of TAX_BRACKETS) {
      if (taxBase <= bracket.limit) {
        return `${(bracket.rate * 100).toFixed(0)}%`;
      }
    }
    return '45%';
  }

  function calculate(params) {
    const { revenue, expenseType, customRate, familyCount } = params;
    if (!revenue || revenue <= 0) return null;

    // 원천징수 3.3% (소득세 3% + 지방소득세 0.3%)
    const withholdingIncome = Math.floor(revenue * 0.03);
    const withholdingLocal = Math.floor(revenue * 0.003);
    const totalWithholding = withholdingIncome + withholdingLocal;

    // 경비율
    const expenseRate = expenseType === 'custom'
      ? Math.max(0, Math.min(100, customRate || 0))
      : (EXPENSE_RATES[expenseType]?.rate || 60);
    const expenseRateLabel = EXPENSE_RATES[expenseType]?.label || '직접 입력';

    // 필요경비
    const expenses = Math.floor(revenue * expenseRate / 100);

    // 소득금액
    const income = revenue - expenses;

    // 소득공제
    const personalDeduction = Math.max(1, familyCount) * 1_500_000; // 인적공제
    const pensionDeduction = Math.floor(Math.min(income / 12, 5_900_000) * 0.045 * 12); // 국민연금 (추정)
    const standardDeduction = 70_000; // 표준세액공제

    // 과세표준
    const taxBase = Math.max(0, income - personalDeduction - pensionDeduction);

    // 산출세액
    const calculatedTax = calcIncomeTax(taxBase);
    const bracketLabel = getTaxBracketLabel(taxBase);

    // 세액공제 (표준세액공제)
    const finalTax = Math.max(0, calculatedTax - standardDeduction);

    // 지방소득세 10%
    const localTax = Math.floor(finalTax * 0.1);

    // 총 종합소득세
    const totalTax = finalTax + localTax;

    // 차액 (환급 or 추가납부)
    const diff = totalWithholding - totalTax;
    const isRefund = diff >= 0;

    // 실효세율
    const effectiveRate = revenue > 0 ? (totalTax / revenue * 100).toFixed(1) : '0.0';

    return {
      revenue,
      expenseRateLabel, expenseRate,
      expenses, income,
      personalDeduction, pensionDeduction, standardDeduction,
      taxBase, calculatedTax, bracketLabel,
      finalTax, localTax, totalTax,
      withholdingIncome, withholdingLocal, totalWithholding,
      diff: Math.abs(diff), isRefund,
      effectiveRate,
    };
  }

  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📝</div>
          연간 수입금액을 입력해주세요
        </div>`;
      return;
    }

    const diffColor = r.isRefund ? 'var(--success)' : 'var(--danger)';
    const diffLabel = r.isRefund ? '예상 환급액' : '추가 납부액';
    const diffIcon = r.isRefund ? '💰' : '⚠️';

    container.innerHTML = `
      <div class="breakdown-title">프리랜서 세금 비교</div>

      <div class="breakdown-row" style="border-bottom:2px solid var(--border);padding-bottom:12px;margin-bottom:8px">
        <span class="br-label" style="font-weight:700">📋 원천징수 (3.3%)</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">소득세 (3%)</span>
        <span class="br-value">${UI.fmtWon(r.withholdingIncome)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">지방소득세 (0.3%)</span>
        <span class="br-value">${UI.fmtWon(r.withholdingLocal)}</span>
      </div>
      <div class="breakdown-row indent" style="font-weight:700">
        <span class="br-label">원천징수 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalWithholding)}</span>
      </div>

      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 종합소득세 (5월 신고)</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">수입금액</span>
        <span class="br-value">${UI.fmtWon(r.revenue)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">필요경비 (${r.expenseRateLabel} ${r.expenseRate}%)</span>
        <span class="br-value">- ${UI.fmtWon(r.expenses)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">소득금액</span>
        <span class="br-value">${UI.fmtWon(r.income)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">인적공제</span>
        <span class="br-value">- ${UI.fmtWon(r.personalDeduction)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">국민연금 공제 (추정)</span>
        <span class="br-value">- ${UI.fmtWon(r.pensionDeduction)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(r.taxBase)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">적용 세율</span>
        <span class="br-value" style="color:var(--accent);font-weight:700">${r.bracketLabel}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">산출세액</span>
        <span class="br-value">${UI.fmtWon(r.calculatedTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">표준세액공제</span>
        <span class="br-value">- ${UI.fmtWon(r.standardDeduction)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">소득세</span>
        <span class="br-value">${UI.fmtWon(r.finalTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>
      <div class="breakdown-row indent" style="font-weight:700">
        <span class="br-label">종합소득세 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">실효세율</span>
        <span class="br-value">${r.effectiveRate}%</span>
      </div>

      <div class="breakdown-row total" style="margin-top:12px;color:${diffColor}">
        <span class="br-label">${diffIcon} ${diffLabel}</span>
        <span class="br-value">${UI.fmtWon(r.diff)}</span>
      </div>

      <div class="notice-box" style="margin-top:16px">
        <strong>비교:</strong> 원천징수 ${UI.fmtWon(r.totalWithholding)} vs 종합소득세 ${UI.fmtWon(r.totalTax)}<br>
        ${r.isRefund
          ? '원천징수가 더 많아 <strong>환급</strong>받을 수 있습니다.'
          : '종합소득세가 더 많아 <strong>추가 납부</strong>해야 합니다.'}
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-freelancer');
    if (!view) return;

    const resultContainer = view.querySelector('#freelancer-result');
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    const expenseSelect = view.querySelector('#fl-expense-type');
    const customGroup = view.querySelector('#fl-custom-rate-group');

    function updateExpenseUI() {
      if (customGroup) {
        customGroup.style.display = expenseSelect?.value === 'custom' ? '' : 'none';
      }
    }

    function getParams() {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      return {
        revenue: getVal('fl-revenue'),
        expenseType: expenseSelect?.value || 'it',
        customRate: parseFloat(view.querySelector('#fl-custom-rate')?.value) || 0,
        familyCount: Math.max(1, parseInt(view.querySelector('#fl-family')?.value) || 1),
      };
    }

    const doCalc = UI.debounce(() => {
      updateExpenseUI();
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    if (expenseSelect) expenseSelect.addEventListener('change', doCalc);
    view.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', doCalc);
      el.addEventListener('change', doCalc);
    });

    view.querySelector('#freelancer-copy')?.addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r) return;
      const rows = [
        { label: '수입금액', value: UI.fmtWon(r.revenue) },
        { label: '원천징수 (3.3%)', value: UI.fmtWon(r.totalWithholding) },
        { label: '종합소득세', value: UI.fmtWon(r.totalTax) },
        { label: r.isRefund ? '예상 환급액' : '추가 납부액', value: UI.fmtWon(r.diff) },
      ];
      await UI.copyText(UI.formatResultForCopy('프리랜서 3.3% 세금', rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#freelancer-print')?.addEventListener('click', () => UI.printCalc());
    view.querySelector('#freelancer-reset')?.addEventListener('click', () => {
      view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
      if (expenseSelect) expenseSelect.value = 'it';
      const familyInput = view.querySelector('#fl-family');
      if (familyInput) familyInput.value = '1';
      updateExpenseUI();
      renderResult(null, resultContainer);
    });

    updateExpenseUI();
    doCalc();
  }

  return { init };
})();
