/* ===== 오피스텔 취득세 계산기 ===== */
const CalcOfficetelAcquisition = (() => {

  const ACQ_RATE  = 0.04;   // 취득세 4%
  const EDU_RATE  = 0.004;  // 지방교육세 0.4% (취득세의 10%)
  const RURAL_RATE = 0.002; // 농어촌특별세 0.2%
  const TOTAL_RATE = ACQ_RATE + EDU_RATE + RURAL_RATE; // 4.6%

  function calculate(price) {
    if (!price || price <= 0) return null;
    const acqTax   = Math.floor(price * ACQ_RATE);
    const eduTax   = Math.floor(price * EDU_RATE);
    const ruralTax = Math.floor(price * RURAL_RATE);
    const total    = acqTax + eduTax + ruralTax;
    return { price, acqTax, eduTax, ruralTax, total };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏢</div>
          취득가액을 입력하면 세금이 계산됩니다
        </div>`;
      return;
    }

    const { acqTax, eduTax, ruralTax, total } = result;
    container.innerHTML = `
      <div class="breakdown-title">오피스텔 취득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">취득세율</span>
        <span class="br-value"><span class="rate-display">4.00%</span></span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득세</span>
        <span class="br-value">${UI.fmtWon(acqTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방교육세 <span style="font-size:11px;color:var(--text-muted)">(취득세 × 10%)</span></span>
        <span class="br-value">${UI.fmtWon(eduTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">농어촌특별세 <span style="font-size:11px;color:var(--text-muted)">(취득가액 × 0.2%)</span></span>
        <span class="br-value">${UI.fmtWon(ruralTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액 <span style="font-size:11px;font-weight:400;color:var(--text-muted)">(합산 4.6%)</span></span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-officetel-acquisition');
    if (!view) return;

    const priceInput    = view.querySelector('#otel-price');
    const resultContainer = view.querySelector('#otel-result');
    const btnCopy       = view.querySelector('#otel-copy');
    const btnPrint      = view.querySelector('#otel-print');
    const btnReset      = view.querySelector('#otel-reset');

    if (priceInput) UI.bindNumInput(priceInput);

    const doCalc = UI.debounce(() => {
      const price = priceInput ? UI.parseNum(priceInput.value.replace(/,/g, '')) : 0;
      const result = calculate(price);
      renderResult(result, resultContainer);
    }, 200);

    if (priceInput) priceInput.addEventListener('input', doCalc);

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const price  = priceInput ? UI.parseNum(priceInput.value.replace(/,/g, '')) : 0;
        const result = calculate(price);
        if (!result) return;
        const text = UI.formatResultForCopy('오피스텔 취득세 계산', [
          { label: '취득가액',      value: UI.fmtWon(result.price) },
          { label: '취득세(4%)',    value: UI.fmtWon(result.acqTax) },
          { label: '지방교육세(0.4%)', value: UI.fmtWon(result.eduTax) },
          { label: '농어촌특별세(0.2%)', value: UI.fmtWon(result.ruralTax) },
          { label: '최종 납부세액(4.6%)', value: UI.fmtWon(result.total) },
        ]);
        await UI.copyText(text);
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (priceInput) priceInput.value = '';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init };
})();
