/* ===== 해외주식 양도소득세 계산기 ===== */
const CalcForeignStocks = (() => {

  function calculate(params) {
    const { salePrice, buyPrice, fees, otherGains } = params;
    if (!salePrice || !buyPrice) return null;

    const gain = salePrice - buyPrice - (fees || 0);
    const totalGain = gain + (otherGains || 0);

    // 기본공제 250만원
    const basicDeduction = 2_500_000;
    const taxBase = Math.max(0, totalGain - basicDeduction);

    // 세율: 소득세 20% + 지방소득세 2% = 22%
    const taxAmount = Math.floor(taxBase * 0.20);
    const localTax = Math.floor(taxBase * 0.02);
    const total = taxAmount + localTax;

    return {
      gain,
      otherGains: otherGains || 0,
      totalGain,
      basicDeduction,
      taxBase,
      taxAmount,
      localTax,
      total,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">📈</div>양도가액과 취득가액을 입력해주세요</div>`;
      return;
    }

    const { gain, otherGains, totalGain, basicDeduction, taxBase, taxAmount, localTax, total } = result;

    container.innerHTML = `
      <div class="breakdown-title">해외주식 양도소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">이번 양도 차익</span>
        <span class="br-value ${gain >= 0 ? '' : 'negative'}">${UI.fmtWon(gain)}</span>
      </div>
      ${otherGains !== 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기타 해외주식 손익 합산</span>
        <span class="br-value ${otherGains >= 0 ? 'positive' : 'negative'}">${otherGains >= 0 ? '+' : ''}${UI.fmtWon(otherGains)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">연간 합산 차익</span>
        <span class="br-value">${UI.fmtWon(totalGain)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기본공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(basicDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">양도소득세 (20%)</span>
        <span class="br-value">${UI.fmtWon(taxAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (2%)</span>
        <span class="br-value">${UI.fmtWon(localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-stocks-foreign');
    if (!view) return;

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    const resultContainer = view.querySelector('#foreign-result');

    function getParams() {
      const getVal = id => {
        const raw = view.querySelector(`#${id}`)?.value || '';
        return UI.parseNum(raw.replace(/,/g, ''));
      };
      return {
        salePrice: getVal('foreign-sale'),
        buyPrice: getVal('foreign-buy'),
        fees: getVal('foreign-fees'),
        otherGains: getVal('foreign-other'),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('input', doCalc));

    const btnCopy = view.querySelector('#foreign-copy');
    const btnPrint = view.querySelector('#foreign-print');
    const btnReset = view.querySelector('#foreign-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        await UI.copyText(UI.formatResultForCopy('해외주식 양도소득세', [
          { label: '양도차익', value: UI.fmtWon(result.gain) },
          { label: '과세표준', value: UI.fmtWon(result.taxBase) },
          { label: '양도소득세(20%)', value: UI.fmtWon(result.taxAmount) },
          { label: '지방소득세(2%)', value: UI.fmtWon(result.localTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.total) },
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
