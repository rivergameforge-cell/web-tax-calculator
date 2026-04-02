/* ===== 부가가치세 계산기 (2026년 기준) ===== */
const CalcVat = (() => {

  // 간이과세자 업종별 부가가치율
  const SIMPLIFIED_RATES = {
    'retail':        0.15, // 소매업, 음식업
    'manufacture':   0.20, // 제조업, 전기·가스·수도업
    'service':       0.30, // 서비스업
    'realestate':    0.40, // 부동산임대업
  };

  function calculate(params) {
    const {
      taxType,          // 'general' | 'simplified'
      salesAmount,      // 매출(공급)액 (원, 부가세 미포함)
      purchaseAmount,   // 매입액 (원, 부가세 미포함)
      industryType,     // 간이과세 업종 코드
    } = params;

    if (!salesAmount || salesAmount <= 0) return null;

    if (taxType === 'general') {
      // 일반과세자
      const outputTax = Math.floor(salesAmount * 0.10);      // 매출세액
      const inputTax  = Math.floor((purchaseAmount || 0) * 0.10); // 매입세액
      const vatPayable = Math.max(0, outputTax - inputTax);

      return {
        taxType, salesAmount,
        purchaseAmount: purchaseAmount || 0,
        outputTax, inputTax, vatPayable,
        params,
      };
    }

    // 간이과세자
    const bvRate   = SIMPLIFIED_RATES[industryType] || 0.30;
    const outputTax = Math.floor(salesAmount * bvRate * 0.10); // 매출세액 = 공급대가 × 부가가치율 × 10%
    // 간이과세자 매입세액 공제: 매입액 × 0.5%
    const inputTax  = Math.floor((purchaseAmount || 0) * 0.005);
    const vatPayable = Math.max(0, outputTax - inputTax);

    // 간이과세 납부면제: 연 공급대가 4,800만원 미만
    const isExempt = salesAmount < 48_000_000;

    return {
      taxType, salesAmount,
      purchaseAmount: purchaseAmount || 0,
      bvRate, outputTax, inputTax, vatPayable,
      isExempt,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💼</div>
          매출액을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    if (r.taxType === 'general') {
      container.innerHTML = `
        <div class="breakdown-title">부가가치세 계산 결과 (일반과세자)</div>
        <div class="breakdown-row">
          <span class="br-label">매출(공급)액</span>
          <span class="br-value">${UI.fmtWon(r.salesAmount)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">매출세액 (10%)</span>
          <span class="br-value">${UI.fmtWon(r.outputTax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">매입(공급)액</span>
          <span class="br-value">${UI.fmtWon(r.purchaseAmount)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">매입세액 (10%)</span>
          <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.inputTax)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">납부할 부가가치세</span>
          <span class="br-value">${UI.fmtWon(r.vatPayable)}</span>
        </div>
      `;
      return;
    }

    // 간이과세자
    container.innerHTML = `
      <div class="breakdown-title">부가가치세 계산 결과 (간이과세자)</div>
      <div class="breakdown-row">
        <span class="br-label">연간 공급대가</span>
        <span class="br-value">${UI.fmtWon(r.salesAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">부가가치율 (${(r.bvRate * 100).toFixed(0)}%)</span>
        <span class="br-value"><span class="rate-display">${(r.bvRate * 100).toFixed(0)}%</span></span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">매출세액 (공급대가 × ${(r.bvRate * 100).toFixed(0)}% × 10%)</span>
        <span class="br-value">${UI.fmtWon(r.outputTax)}</span>
      </div>
      ${r.purchaseAmount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">매입세액 공제 (매입 × 0.5%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.inputTax)}</span>
      </div>` : ''}
      ${r.isExempt ? `
      <div style="padding:16px;text-align:center">
        <div class="exempt-badge">✅ 납부 면제</div>
        <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
          연 공급대가 4,800만원 미만 간이과세자는 부가세 <strong>납부가 면제</strong>됩니다.
        </p>
      </div>` : `
      <div class="breakdown-row total">
        <span class="br-label">납부할 부가가치세</span>
        <span class="br-value">${UI.fmtWon(r.vatPayable)}</span>
      </div>`}
    `;
  }

  function init() {
    const view = document.getElementById('view-income-vat');
    if (!view) return;

    const resultContainer = view.querySelector('#vat-result');
    const btnCopy  = view.querySelector('#vat-copy');
    const btnPrint = view.querySelector('#vat-print');
    const btnReset = view.querySelector('#vat-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        taxType:        [...view.querySelectorAll('input[name="vat-tax-type"]')].find(r => r.checked)?.value || 'general',
        salesAmount:    getVal('vat-sales'),
        purchaseAmount: getVal('vat-purchase'),
        industryType:   view.querySelector('#vat-industry')?.value || 'retail',
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 간이과세 전용 섹션 토글
      const simplifiedSection = view.querySelector('#vat-simplified-section');
      if (simplifiedSection) simplifiedSection.style.display = params.taxType === 'simplified' ? '' : 'none';
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('부가가치세 계산', [
          { label: '과세유형', value: r.taxType === 'general' ? '일반과세자' : '간이과세자' },
          { label: '매출액', value: UI.fmtWon(r.salesAmount) },
          { label: '납부할 부가가치세', value: r.isExempt ? '면제' : UI.fmtWon(r.vatPayable) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const firstType = view.querySelector('input[name="vat-tax-type"][value="general"]');
        if (firstType) firstType.checked = true;
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
