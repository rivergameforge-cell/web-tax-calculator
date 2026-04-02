/* ===== 증권거래세 계산기 ===== */
const CalcTransaction = (() => {

  // 2026년 세율 (단일화)
  const RATES = {
    kospi:    { rate: 0.0020, label: '코스피' },
    kosdaq:   { rate: 0.0020, label: '코스닥' },
    konex:    { rate: 0.0010, label: '코넥스' },
    unlisted: { rate: 0.0035, label: '비상장' },
  };

  function calculate(market, saleAmount) {
    if (!saleAmount || saleAmount <= 0) return null;
    const info = RATES[market] || RATES.kospi;
    const tax = Math.floor(saleAmount * info.rate);
    return { market, saleAmount, rate: info.rate, tax, label: info.label };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">📊</div>매도금액을 입력해주세요</div>`;
      return;
    }
    const { label, rate, saleAmount, tax } = result;
    container.innerHTML = `
      <div class="breakdown-title">증권거래세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">시장</span>
        <span class="br-value">${label}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">매도금액</span>
        <span class="br-value">${UI.fmtWon(saleAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">세율</span>
        <span class="br-value"><span class="rate-display">${(rate * 100).toFixed(2)}%</span></span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">증권거래세</span>
        <span class="br-value">${UI.fmtWon(tax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-stocks-transaction');
    if (!view) return;

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));
    const resultContainer = view.querySelector('#txn-result');

    function getParams() {
      const market = view.querySelector('input[name="txn-market"]:checked')?.value || 'kospi';
      const amount = UI.parseNum((view.querySelector('#txn-amount')?.value || '').replace(/,/g, ''));
      return { market, amount };
    }

    const doCalc = UI.debounce(() => {
      const { market, amount } = getParams();
      renderResult(calculate(market, amount), resultContainer);
    }, 150);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    const btnCopy = view.querySelector('#txn-copy');
    const btnReset = view.querySelector('#txn-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const { market, amount } = getParams();
        const result = calculate(market, amount);
        if (!result) return;
        await UI.copyText(UI.formatResultForCopy('증권거래세 계산', [
          { label: '시장', value: result.label },
          { label: '매도금액', value: UI.fmtWon(result.saleAmount) },
          { label: '세율', value: (result.rate * 100).toFixed(2) + '%' },
          { label: '증권거래세', value: UI.fmtWon(result.tax) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
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
