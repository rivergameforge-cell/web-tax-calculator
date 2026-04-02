/* ===== 배당소득세 계산기 (2026년 기준) ===== */
const CalcStockDividend = (() => {

  const WITHHOLDING_RATE = 0.14;       // 원천징수세율 14%
  const LOCAL_TAX_ON_WH  = 0.10;       // 지방소득세 (원천징수세의 10%)
  const GROSS_UP_RATE    = 0.11;        // 배당세액공제 Gross-up 11%
  const COMPREHENSIVE_THRESHOLD = 20_000_000; // 종합과세 기준 2천만원

  // 종합소득세율 (누진세율)
  const BRACKETS = [
    { limit: 14_000_000,   rate: 0.06 },
    { limit: 50_000_000,   rate: 0.15 },
    { limit: 88_000_000,   rate: 0.24 },
    { limit: 150_000_000,  rate: 0.35 },
    { limit: 300_000_000,  rate: 0.38 },
    { limit: 500_000_000,  rate: 0.40 },
    { limit: 1_000_000_000, rate: 0.42 },
    { limit: Infinity,     rate: 0.45 },
  ];

  function calcProgressive(taxable) {
    let tax = 0;
    let prev = 0;
    for (const b of BRACKETS) {
      const chunk = Math.min(taxable, b.limit) - prev;
      if (chunk <= 0) break;
      tax += chunk * b.rate;
      prev = b.limit;
    }
    return Math.floor(tax);
  }

  function calculate(params) {
    const {
      source,            // 'domestic' | 'foreign'
      dividendAmount,    // 배당금 총액 (원)
      otherIncome,       // 기타 종합소득 (원, 종합과세 시뮬레이션용)
      foreignTaxPaid,    // 외국납부세액 (원, 해외배당 시)
    } = params;

    if (!dividendAmount || dividendAmount <= 0) return null;

    const isDomestic = source === 'domestic';

    // 분리과세 (2천만원 이하)
    if (dividendAmount <= COMPREHENSIVE_THRESHOLD) {
      const withholdingTax = Math.floor(dividendAmount * WITHHOLDING_RATE);
      const localTax = Math.floor(withholdingTax * LOCAL_TAX_ON_WH);
      const totalTax = withholdingTax + localTax;

      return {
        dividendAmount, source,
        isSeparate: true,
        withholdingTax, localTax, totalTax,
        effectiveRate: totalTax / dividendAmount,
        netAmount: dividendAmount - totalTax,
        params,
      };
    }

    // 종합과세 (2천만원 초과)
    const grossUp = isDomestic ? Math.floor(dividendAmount * GROSS_UP_RATE) : 0;
    const dividendIncome = dividendAmount + grossUp; // Gross-up 후 배당소득
    const totalIncome = dividendIncome + (otherIncome || 0);

    // 종합소득세 산출
    const totalProgressiveTax = calcProgressive(totalIncome);

    // 배당세액공제 (Gross-up 금액 한도)
    const dividendCredit = isDomestic ? grossUp : 0;

    // 외국납부세액공제
    const foreignCredit = !isDomestic ? Math.min(foreignTaxPaid || 0, Math.floor(totalProgressiveTax * (dividendIncome / totalIncome))) : 0;

    const incomeTax = Math.max(0, totalProgressiveTax - dividendCredit - foreignCredit);
    const localTax = Math.floor(incomeTax * LOCAL_TAX_ON_WH);
    const totalTax = incomeTax + localTax;

    // 이미 원천징수된 세액
    const alreadyWithheld = Math.floor(dividendAmount * WITHHOLDING_RATE);
    const alreadyLocal = Math.floor(alreadyWithheld * LOCAL_TAX_ON_WH);
    const additionalTax = Math.max(0, totalTax - alreadyWithheld - alreadyLocal);

    const effectiveRate = dividendAmount > 0 ? totalTax / dividendAmount : 0;

    return {
      dividendAmount, source,
      isSeparate: false,
      grossUp, dividendIncome,
      otherIncome: otherIncome || 0,
      totalIncome,
      totalProgressiveTax,
      dividendCredit, foreignCredit,
      incomeTax, localTax, totalTax,
      alreadyWithheld, alreadyLocal,
      additionalTax,
      effectiveRate,
      netAmount: dividendAmount - totalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💰</div>
          배당금 총액을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    if (r.isSeparate) {
      container.innerHTML = `
        <div class="breakdown-title">배당소득세 계산 결과 (분리과세)</div>
        <div class="breakdown-row">
          <span class="br-label">배당금 총액</span>
          <span class="br-value">${UI.fmtWon(r.dividendAmount)}</span>
        </div>
        <div style="padding:12px;text-align:center">
          <div class="exempt-badge">분리과세 (2,000만원 이하)</div>
        </div>
        <div class="breakdown-row">
          <span class="br-label">원천징수세 (14%)</span>
          <span class="br-value">${UI.fmtWon(r.withholdingTax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">지방소득세 (10%)</span>
          <span class="br-value">${UI.fmtWon(r.localTax)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">세금 합계</span>
          <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">실효세율</span>
          <span class="br-value"><span class="rate-display">${(r.effectiveRate * 100).toFixed(1)}%</span></span>
        </div>
        <div class="breakdown-row total" style="margin-top:8px">
          <span class="br-label">세후 수령액</span>
          <span class="br-value">${UI.fmtWon(r.netAmount)}</span>
        </div>
      `;
      return;
    }

    // 종합과세
    container.innerHTML = `
      <div class="breakdown-title">배당소득세 계산 결과 (종합과세)</div>
      <div class="breakdown-row">
        <span class="br-label">배당금 총액</span>
        <span class="br-value">${UI.fmtWon(r.dividendAmount)}</span>
      </div>
      ${r.grossUp > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">Gross-up 가산 (11%)</span>
        <span class="br-value">${UI.fmtWon(r.grossUp)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">배당소득 금액</span>
        <span class="br-value">${UI.fmtWon(r.dividendIncome)}</span>
      </div>
      ${r.otherIncome > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기타 종합소득</span>
        <span class="br-value">${UI.fmtWon(r.otherIncome)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">종합소득 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">종합소득세 산출</span>
        <span class="br-value">${UI.fmtWon(r.totalProgressiveTax)}</span>
      </div>
      ${r.dividendCredit > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">배당세액공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.dividendCredit)}</span>
      </div>` : ''}
      ${r.foreignCredit > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">외국납부세액공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.foreignCredit)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">종합소득세</span>
        <span class="br-value">${UI.fmtWon(r.incomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">세금 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기 원천징수 세액</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.alreadyWithheld + r.alreadyLocal)}</span>
      </div>
      <div class="breakdown-row total" style="margin-top:4px">
        <span class="br-label">추가 납부세액</span>
        <span class="br-value">${UI.fmtWon(r.additionalTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">실효세율</span>
        <span class="br-value"><span class="rate-display">${(r.effectiveRate * 100).toFixed(1)}%</span></span>
      </div>
      <div class="breakdown-row total" style="margin-top:8px">
        <span class="br-label">세후 수령액</span>
        <span class="br-value">${UI.fmtWon(r.netAmount)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-stocks-dividend');
    if (!view) return;

    const resultContainer = view.querySelector('#sdiv-result');
    const btnCopy  = view.querySelector('#sdiv-copy');
    const btnPrint = view.querySelector('#sdiv-print');
    const btnReset = view.querySelector('#sdiv-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        source:         [...view.querySelectorAll('input[name="sdiv-source"]')].find(r => r.checked)?.value || 'domestic',
        dividendAmount: getVal('sdiv-amount'),
        otherIncome:    getVal('sdiv-other-income'),
        foreignTaxPaid: getVal('sdiv-foreign-tax'),
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 해외배당 전용 필드 토글
      const foreignSection = view.querySelector('#sdiv-foreign-section');
      if (foreignSection) foreignSection.style.display = params.source === 'foreign' ? '' : 'none';
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('배당소득세 계산', [
          { label: '배당금 총액', value: UI.fmtWon(r.dividendAmount) },
          { label: '과세 방식', value: r.isSeparate ? '분리과세' : '종합과세' },
          { label: '세금 합계', value: UI.fmtWon(r.totalTax) },
          { label: '세후 수령액', value: UI.fmtWon(r.netAmount) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const firstSource = view.querySelector('input[name="sdiv-source"][value="domestic"]');
        if (firstSource) firstSource.checked = true;
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
