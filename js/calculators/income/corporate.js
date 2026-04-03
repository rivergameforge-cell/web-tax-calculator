/* ===== 법인세 계산기 ===== */
const CalcCorporate = (() => {

  // 2026년 기준 법인세 누진 구간
  const BRACKETS = [
    { limit: 200_000_000,         rate: 0.09, deduction: 0 },
    { limit: 20_000_000_000,      rate: 0.19, deduction: 20_000_000 },
    { limit: 300_000_000_000,     rate: 0.21, deduction: 420_000_000 },
    { limit: Infinity,            rate: 0.24, deduction: 9_420_000_000 },
  ];

  const BRACKET_LABELS = ['2억 이하 (9%)', '200억 이하 (19%)', '3,000억 이하 (21%)', '3,000억 초과 (24%)'];

  // 지방소득세: 법인세의 10%
  const LOCAL_TAX_RATE = 0.10;

  function calculate(params) {
    const { income, isSme } = params;
    if (!income || income <= 0) return null;

    // 적용 구간 찾기
    let bracketIdx = 0;
    for (let i = 0; i < BRACKETS.length; i++) {
      if (income <= BRACKETS[i].limit) { bracketIdx = i; break; }
      if (i === BRACKETS.length - 1) bracketIdx = i;
    }

    const bracket = BRACKETS[bracketIdx];
    const corpTax = Math.floor(income * bracket.rate - bracket.deduction);
    const localTax = Math.floor(corpTax * LOCAL_TAX_RATE);
    const totalTax = corpTax + localTax;
    const effectiveRate = income > 0 ? totalTax / income : 0;

    return {
      income,
      isSme,
      bracketLabel: BRACKET_LABELS[bracketIdx],
      appliedRate: bracket.rate,
      corpTax,
      localTax,
      totalTax,
      effectiveRate,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏢</div>
          과세표준을 입력하면 법인세가 계산됩니다
        </div>`;
      return;
    }

    const {
      income, isSme, bracketLabel, appliedRate,
      corpTax, localTax, totalTax, effectiveRate,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">법인세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(income)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">적용 세율 구간</span>
        <span class="br-value"><span class="rate-display">${bracketLabel}</span></span>
      </div>
      ${isSme ? `
      <div class="breakdown-row sub">
        <span class="br-label" style="color:var(--text-muted);font-size:0.85em">중소기업 해당</span>
        <span class="br-value"></span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">법인세 산출세액</span>
        <span class="br-value">${UI.fmtWon(corpTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">총 납부세액</span>
        <span class="br-value">${UI.fmtWon(totalTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">실효세율</span>
        <span class="br-value"><span class="rate-display">${(effectiveRate * 100).toFixed(2)}%</span></span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-corporate');
    if (!view) return;

    const elIncome = view.querySelector('#corp-income');
    const elSme    = view.querySelector('#corp-is-sme');
    const resultContainer = view.querySelector('#corp-result');
    const btnCopy  = view.querySelector('#corp-copy');
    const btnPrint = view.querySelector('#corp-print');
    const btnReset = view.querySelector('#corp-reset');

    if (elIncome) UI.bindNumInput(elIncome);

    function getParams() {
      return {
        income: UI.parseNum((elIncome?.value || '').replace(/,/g, '')),
        isSme:  elSme?.checked || false,
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el =>
      el.addEventListener(el.type === 'checkbox' ? 'change' : 'input', doCalc)
    );

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        await UI.copyText(UI.formatResultForCopy('법인세', [
          { label: '과세표준', value: UI.fmtWon(result.income) },
          { label: '적용 세율', value: result.bracketLabel },
          { label: '법인세 산출세액', value: UI.fmtWon(result.corpTax) },
          { label: '지방소득세 (10%)', value: UI.fmtWon(result.localTax) },
          { label: '총 납부세액', value: UI.fmtWon(result.totalTax) },
          { label: '실효세율', value: (result.effectiveRate * 100).toFixed(2) + '%' },
        ]));
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (elIncome) elIncome.value = '';
        if (elSme) elSme.checked = false;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
