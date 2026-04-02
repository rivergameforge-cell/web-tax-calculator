/* ===== 종합소득세 계산기 (2026년 기준) ===== */
const CalcCompIncome = (() => {

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
      earnedIncome,    // 근로소득금액
      businessIncome,  // 사업소득금액
      interestIncome,  // 이자소득금액
      dividendIncome,  // 배당소득금액
      pensionIncome,   // 연금소득금액
      otherIncome,     // 기타소득금액
      personalDed,     // 소득공제 합계
    } = params;

    const totalIncome = (earnedIncome || 0) + (businessIncome || 0) +
      (interestIncome || 0) + (dividendIncome || 0) +
      (pensionIncome || 0) + (otherIncome || 0);

    if (totalIncome <= 0) return null;

    const incomes = [
      { label: '근로소득금액',   amount: earnedIncome || 0 },
      { label: '사업소득금액',   amount: businessIncome || 0 },
      { label: '이자소득금액',   amount: interestIncome || 0 },
      { label: '배당소득금액',   amount: dividendIncome || 0 },
      { label: '연금소득금액',   amount: pensionIncome || 0 },
      { label: '기타소득금액',   amount: otherIncome || 0 },
    ].filter(i => i.amount > 0);

    const deduction = personalDed || 1_500_000;
    const taxBase   = Math.max(0, totalIncome - deduction);
    const incomeTax = calcProgressiveTax(taxBase);
    const localTax  = Math.floor(incomeTax * 0.10);
    const totalTax  = incomeTax + localTax;

    // 실효세율
    const effectiveRate = totalIncome > 0 ? totalTax / totalIncome : 0;

    return {
      incomes, totalIncome, deduction, taxBase,
      incomeTax, localTax, totalTax, effectiveRate,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💼</div>
          소득금액을 입력해주세요
        </div>`;
      return;
    }

    const r = result;
    const incomeRows = r.incomes.map(i => `
      <div class="breakdown-row">
        <span class="br-label">${i.label}</span>
        <span class="br-value">${UI.fmtWon(i.amount)}</span>
      </div>`).join('');

    container.innerHTML = `
      <div class="breakdown-title">종합소득세 계산 결과</div>
      ${incomeRows}
      <div class="breakdown-row" style="border-top:1px solid var(--border-light);padding-top:8px">
        <span class="br-label">종합소득금액</span>
        <span class="br-value">${UI.fmtWon(r.totalIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.deduction)}</span>
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
      <div class="breakdown-row" style="font-size:12px;color:var(--text-muted)">
        <span class="br-label">실효세율</span>
        <span class="br-value">${(r.effectiveRate * 100).toFixed(2)}%</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-comprehensive');
    if (!view) return;

    const resultContainer = view.querySelector('#compinc-result');
    const btnCopy  = view.querySelector('#compinc-copy');
    const btnPrint = view.querySelector('#compinc-print');
    const btnReset = view.querySelector('#compinc-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        earnedIncome:   getVal('compinc-earned'),
        businessIncome: getVal('compinc-business'),
        interestIncome: getVal('compinc-interest'),
        dividendIncome: getVal('compinc-dividend'),
        pensionIncome:  getVal('compinc-pension'),
        otherIncome:    getVal('compinc-other'),
        personalDed:    getVal('compinc-deduction'),
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
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('종합소득세 계산', [
          { label: '종합소득금액', value: UI.fmtWon(r.totalIncome) },
          { label: '과세표준',     value: UI.fmtWon(r.taxBase) },
          { label: '소득세',       value: UI.fmtWon(r.incomeTax) },
          { label: '최종 납부세액', value: UI.fmtWon(r.totalTax) },
          { label: '실효세율',     value: (r.effectiveRate * 100).toFixed(2) + '%' },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
