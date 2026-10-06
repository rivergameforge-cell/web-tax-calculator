/* ===== 부가가치세 계산기 (2026년 기준) ===== */
const CalcVat = (() => {

  // 간이과세자 업종별 부가가치율
  const SIMPLIFIED_RATES = {
    'retail':        0.15, // 소매업, 음식업
    'manufacture':   0.20, // 제조업, 농림어업, 소화물 운송업
    'accommodation': 0.25,
    'service':       0.30, // 건설·운수창고·정보통신·기타 서비스
    'specialService': 0.40, // 간이과세 자격을 충족하는 일부 전문·지원 서비스
    'realestate':    0.40, // 부동산임대업
  };

  function calculate(params) {
    const {
      taxType,          // 'general' | 'simplified'
      salesAmount,      // 일반: 공급가액, 간이: 공급대가
      purchaseAmount = 0,   // 일반: 공급가액, 간이: 공급대가
      industryType,     // 간이과세 업종 코드
    } = params;

    if (!Number.isFinite(salesAmount) || salesAmount < 0 || !Number.isFinite(purchaseAmount) || purchaseAmount < 0) return null;
    if (salesAmount === 0 && !(purchaseAmount > 0)) return null;
    if (!['general', 'simplified'].includes(taxType)) return null;

    if (taxType === 'general') {
      // 일반과세자
      const outputTax = Math.floor(salesAmount * 0.10);      // 매출세액
      const inputTax  = Math.floor((purchaseAmount || 0) * 0.10); // 매입세액
      const vatPayable = outputTax - inputTax;

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
    // 간이과세 납부면제: 연 공급대가 4,800만원 미만
    const isExempt = salesAmount < 48_000_000;
    const vatPayable = isExempt ? 0 : Math.max(0, outputTax - inputTax);

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
          <span class="br-label">${r.vatPayable < 0 ? '환급 추정 부가가치세' : '납부할 부가가치세'}</span>
          <span class="br-value">${UI.fmtWon(Math.abs(r.vatPayable))}</span>
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
      const simplified = params.taxType === 'simplified';
      view.querySelector('label[for="vat-sales"]').textContent = simplified
        ? '연간 매출 공급대가 (부가세 포함)' : '매출 공급가액 (부가세 제외)';
      view.querySelector('label[for="vat-purchase"]').textContent = simplified
        ? '적격 매입 공급대가 (부가세 포함)' : '공제 가능한 매입 공급가액 (부가세 제외)';
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
          { label: r.vatPayable < 0 ? '환급 추정 부가가치세' : '납부할 부가가치세', value: r.isExempt ? '면제' : UI.fmtWon(Math.abs(r.vatPayable)) },
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
