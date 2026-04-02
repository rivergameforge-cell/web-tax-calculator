/* ===== 이자·배당소득세 계산기 (2026년 기준) ===== */
const CalcInterestDividend = (() => {

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

  const WITHHOLDING_RATE = 0.14;          // 원천징수세율 14%
  const WITHHOLDING_LOCAL = 0.014;        // 지방소득세 1.4%
  const THRESHOLD = 20_000_000;           // 금융소득종합과세 기준
  const DIVIDEND_GROSSUP_RATE = 0.11;     // 배당세액공제 (Gross-up) 11%

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
      interestAmount,    // 이자소득 (원)
      dividendAmount,    // 배당소득 (원)
      otherIncome,       // 다른 종합소득 (종합과세 시 합산)
    } = params;

    const interest = interestAmount || 0;
    const dividend = dividendAmount || 0;
    const financialTotal = interest + dividend;

    if (financialTotal <= 0) return null;

    // 원천징수세액 (금융기관에서 이미 원천징수)
    const withheldTax      = Math.floor(financialTotal * WITHHOLDING_RATE);
    const withheldLocal    = Math.floor(financialTotal * WITHHOLDING_LOCAL);
    const totalWithheld    = withheldTax + withheldLocal;

    const isComprehensive  = financialTotal > THRESHOLD;

    if (!isComprehensive) {
      // 분리과세: 원천징수로 종결
      return {
        interest, dividend, financialTotal,
        isComprehensive: false,
        withheldTax, withheldLocal, totalWithheld,
        additionalTax: 0,
        totalTax: totalWithheld,
        params,
      };
    }

    // 금융소득종합과세
    const excessAmount = financialTotal - THRESHOLD;
    // Gross-up 적용 (배당소득 초과분에 대해)
    const dividendExcess = dividend > THRESHOLD ? Math.min(dividend - THRESHOLD, excessAmount) : Math.max(0, excessAmount - Math.max(0, interest - THRESHOLD));
    const grossUp = Math.floor(dividendExcess * DIVIDEND_GROSSUP_RATE);

    // 종합과세 소득금액 = 초과 금융소득 + 배당 Gross-up + 다른 소득
    const other = otherIncome || 0;
    const compTaxBase = excessAmount + grossUp + other;

    // 종합과세 산출세액
    const compTax = calcProgressiveTax(compTaxBase);

    // 배당세액공제
    const dividendCredit = grossUp; // Gross-up 금액만큼 세액공제

    // 결정세액 (종합과세분)
    const compDetermined = Math.max(0, compTax - dividendCredit);

    // 2천만원 이하분은 원천징수 14%로 이미 납부
    const thresholdTax = Math.floor(THRESHOLD * WITHHOLDING_RATE);

    // 총 소득세
    const totalIncomeTax = thresholdTax + compDetermined;
    const totalLocalTax  = Math.floor(totalIncomeTax * 0.10);
    const totalTax       = totalIncomeTax + totalLocalTax;

    // 추가 납부세액
    const additionalTax = Math.max(0, totalTax - totalWithheld);

    return {
      interest, dividend, financialTotal,
      isComprehensive: true,
      excessAmount, grossUp, other, compTaxBase,
      compTax, dividendCredit, compDetermined,
      thresholdTax, totalIncomeTax, totalLocalTax,
      withheldTax, withheldLocal, totalWithheld,
      additionalTax, totalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💰</div>
          이자 또는 배당소득을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    if (!r.isComprehensive) {
      container.innerHTML = `
        <div class="breakdown-title">이자·배당소득세 계산 결과</div>
        <div class="breakdown-row">
          <span class="br-label">이자소득</span>
          <span class="br-value">${UI.fmtWon(r.interest)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">배당소득</span>
          <span class="br-value">${UI.fmtWon(r.dividend)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">금융소득 합계</span>
          <span class="br-value">${UI.fmtWon(r.financialTotal)}</span>
        </div>
        <div style="padding:16px;text-align:center">
          <div class="exempt-badge">✅ 분리과세 (원천징수 종결)</div>
          <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
            금융소득 2천만원 이하로 원천징수(14%)로 과세가 종결됩니다.
          </p>
        </div>
        <div class="breakdown-row">
          <span class="br-label">원천징수 소득세 (14%)</span>
          <span class="br-value">${UI.fmtWon(r.withheldTax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">원천징수 지방소득세 (1.4%)</span>
          <span class="br-value">${UI.fmtWon(r.withheldLocal)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">원천징수 합계</span>
          <span class="br-value">${UI.fmtWon(r.totalWithheld)}</span>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">이자·배당소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">금융소득 합계</span>
        <span class="br-value">${UI.fmtWon(r.financialTotal)}</span>
      </div>
      <div style="padding:8px 16px">
        <div class="notice-box" style="background:var(--danger-bg,#fff5f5);color:var(--danger,#e53e3e);font-size:13px">
          금융소득 2천만원 초과 → <strong>금융소득종합과세</strong> 대상
        </div>
      </div>
      <div class="breakdown-row">
        <span class="br-label">2천만원 이하분 (원천징수 14%)</span>
        <span class="br-value">${UI.fmtWon(r.thresholdTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">2천만원 초과분</span>
        <span class="br-value">${UI.fmtWon(r.excessAmount)}</span>
      </div>
      ${r.grossUp > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">배당 Gross-up (11%)</span>
        <span class="br-value">+ ${UI.fmtWon(r.grossUp)}</span>
      </div>` : ''}
      ${r.other > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">다른 소득 합산</span>
        <span class="br-value">+ ${UI.fmtWon(r.other)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">초과분 종합과세 산출세액</span>
        <span class="br-value">${UI.fmtWon(r.compDetermined)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">총 소득세</span>
        <span class="br-value">${UI.fmtWon(r.totalIncomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.totalLocalTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 세액</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기납부 원천징수세액</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.totalWithheld)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">추가 납부세액</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(r.additionalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-interest-dividend');
    if (!view) return;

    const resultContainer = view.querySelector('#intdiv-result');
    const btnCopy  = view.querySelector('#intdiv-copy');
    const btnPrint = view.querySelector('#intdiv-print');
    const btnReset = view.querySelector('#intdiv-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        interestAmount: getVal('intdiv-interest'),
        dividendAmount: getVal('intdiv-dividend'),
        otherIncome:    getVal('intdiv-other'),
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
        await UI.copyText(UI.formatResultForCopy('이자·배당소득세 계산', [
          { label: '금융소득 합계',   value: UI.fmtWon(r.financialTotal) },
          { label: '종합과세 여부',   value: r.isComprehensive ? '종합과세' : '분리과세' },
          { label: '최종 세액',       value: UI.fmtWon(r.totalTax) },
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
