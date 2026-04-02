/* ===== 인지세 계산기 (2026년 기준) ===== */
const CalcStamp = (() => {

  // 부동산·선박 등 인지세 정액 구간
  // (인지세법 별표 기준)
  const REALESTATE_BRACKETS = [
    { min:           0, max:   10_000_000, tax:  50_000 },
    { min:  10_000_001, max:   30_000_000, tax: 150_000 },
    { min:  30_000_001, max:   50_000_000, tax: 200_000 },
    { min:  50_000_001, max:  100_000_000, tax: 300_000 },
    { min: 100_000_001, max:  300_000_000, tax: 350_000 },
    { min: 300_000_001, max: 1_000_000_000, tax: 350_000 }, // 수익증권·기타
    { min: 1_000_000_001, max: Infinity,   tax: 350_000 },
  ];

  // 실제 인지세법 별표 제1호 (부동산·선박 소유권 이전 계약서)
  const PROPERTY_TRANSFER_BRACKETS = [
    { min:           0, max:   10_000_000, tax:  50_000 },
    { min:  10_000_001, max:   30_000_000, tax: 150_000 },
    { min:  30_000_001, max:   50_000_000, tax: 200_000 },
    { min:  50_000_001, max:  100_000_000, tax: 300_000 },
    { min: 100_000_001, max: Infinity,     tax: 350_000 },
  ];

  function getStampTax(amount, brackets) {
    for (const b of brackets) {
      if (amount >= b.min && amount <= b.max) return b.tax;
    }
    return 350_000;
  }

  function calculate(params) {
    const {
      docType,    // 'property-transfer' | 'loan' | 'other'
      amount,     // 거래가액 또는 대출금액 (원)
    } = params;

    if (!amount || amount <= 0) return null;

    let stampTax = 0;
    let docLabel = '';

    if (docType === 'property-transfer') {
      // 부동산 소유권 이전 계약서
      stampTax = getStampTax(amount, PROPERTY_TRANSFER_BRACKETS);
      docLabel = '부동산 소유권 이전 계약서';
    } else if (docType === 'loan') {
      // 금전소비대차계약서 (대출)
      // 5천만원 이하 비과세, 초과 시 정액
      if (amount <= 50_000_000) {
        stampTax = 0;
      } else if (amount <= 100_000_000) {
        stampTax = 70_000;
      } else if (amount <= 500_000_000) {
        stampTax = 150_000;
      } else if (amount <= 1_000_000_000) {
        stampTax = 250_000;
      } else {
        stampTax = 350_000;
      }
      docLabel = '금전소비대차계약서 (대출)';
    } else {
      // 기타 계약서 (도급계약, 위임 등)
      if (amount <= 10_000_000) stampTax = 50_000;
      else if (amount <= 100_000_000) stampTax = 150_000;
      else stampTax = 200_000;
      docLabel = '기타 계약서';
    }

    return { amount, docType, docLabel, stampTax, params };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📄</div>
          거래금액을 입력해주세요
        </div>`;
      return;
    }

    const { amount, docLabel, stampTax } = result;

    container.innerHTML = `
      <div class="breakdown-title">인지세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">문서 종류</span>
        <span class="br-value" style="font-size:13px">${docLabel}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">거래(계약)금액</span>
        <span class="br-value">${UI.fmtWon(amount)}</span>
      </div>
      ${stampTax === 0 ? `
      <div style="padding:24px 16px;text-align:center">
        <div class="exempt-badge">✅ 인지세 비과세</div>
        <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">5천만원 이하 금전소비대차는 인지세가 비과세됩니다.</p>
      </div>` : `
      <div class="breakdown-row total">
        <span class="br-label">인지세 (정액)</span>
        <span class="br-value">${UI.fmtWon(stampTax)}</span>
      </div>
      <div style="padding:12px 16px">
        <div class="notice-box info">
          인지세는 계약서 작성 시 전자수입인지(e-stamp.or.kr)로 납부하며, 매도인·매수인이 <strong>50%씩</strong> 부담합니다.
          1인당 납부액: <strong>${UI.fmtWon(Math.floor(stampTax / 2))}</strong>
        </div>
      </div>`}
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-stamp');
    if (!view) return;

    const resultContainer = view.querySelector('#stamp-result');
    const btnCopy  = view.querySelector('#stamp-copy');
    const btnPrint = view.querySelector('#stamp-print');
    const btnReset = view.querySelector('#stamp-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      return {
        docType: view.querySelector('#stamp-doc-type')?.value || 'property-transfer',
        amount:  UI.parseNum((view.querySelector('#stamp-amount')?.value || '').replace(/,/g, '')),
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '계약금액', value: UI.fmtWon(result.amount) },
          { label: '인지세',   value: UI.fmtWon(result.stampTax) },
          { label: '1인당 납부', value: UI.fmtWon(Math.floor(result.stampTax / 2)) },
        ];
        await UI.copyText(UI.formatResultForCopy('인지세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const sel = view.querySelector('#stamp-doc-type');
        if (sel) sel.value = 'property-transfer';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
