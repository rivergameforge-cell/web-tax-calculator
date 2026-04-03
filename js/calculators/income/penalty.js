/* ===== 종합소득세 가산세 계산기 ===== */
const CalcPenalty = (() => {

  // 신고 가산세율 (2026 기준)
  const REPORT_RATES = {
    'no-report':         0.20,  // 무신고 20%
    'no-report-fraud':   0.40,  // 부정무신고 40%
    'under-report':      0.10,  // 과소신고 10%
    'under-report-fraud': 0.40, // 부정과소신고 40%
  };

  const REPORT_LABELS = {
    'no-report':         '무신고 (20%)',
    'no-report-fraud':   '부정무신고 (40%)',
    'under-report':      '과소신고 (10%)',
    'under-report-fraud': '부정과소신고 (40%)',
  };

  // 납부지연 가산세: 일 0.022%
  const OVERDUE_DAILY_RATE = 0.00022;

  function calculate(params) {
    const { taxAmount, type, overdueDays, overdueAmount } = params;
    if (!taxAmount || taxAmount <= 0) return null;

    const reportRate = REPORT_RATES[type] || 0.20;
    const reportPenalty = Math.floor(taxAmount * reportRate);

    const safeDays = Math.max(0, overdueDays || 0);
    const safeOverdueAmt = overdueAmount || 0;
    const overduePenalty = Math.floor(safeOverdueAmt * OVERDUE_DAILY_RATE * safeDays);

    const totalPenalty = reportPenalty + overduePenalty;
    const grandTotal = taxAmount + totalPenalty;

    return {
      taxAmount,
      type,
      reportRate,
      reportLabel: REPORT_LABELS[type] || type,
      reportPenalty,
      overdueDays: safeDays,
      overdueAmount: safeOverdueAmt,
      overduePenalty,
      totalPenalty,
      grandTotal,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📋</div>
          본세를 입력하면 가산세가 계산됩니다
        </div>`;
      return;
    }

    const {
      taxAmount, reportLabel, reportPenalty,
      overdueDays, overdueAmount, overduePenalty,
      totalPenalty, grandTotal,
    } = result;

    const annualRate = (OVERDUE_DAILY_RATE * 365 * 100).toFixed(2);

    container.innerHTML = `
      <div class="breakdown-title">종합소득세 가산세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">본세</span>
        <span class="br-value">${UI.fmtWon(taxAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">신고 가산세 (${reportLabel})</span>
        <span class="br-value">${UI.fmtWon(reportPenalty)}</span>
      </div>
      ${overdueAmount > 0 && overdueDays > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">납부지연 가산세</span>
        <span class="br-value">${UI.fmtWon(overduePenalty)}</span>
      </div>
      <div class="breakdown-row sub">
        <span class="br-label" style="color:var(--text-muted);font-size:0.85em">미납세액 ${UI.fmtWon(overdueAmount)} x 0.022% x ${overdueDays}일 (연 ${annualRate}%)</span>
        <span class="br-value"></span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">총 가산세</span>
        <span class="br-value">${UI.fmtWon(totalPenalty)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">본세 + 가산세 합계</span>
        <span class="br-value">${UI.fmtWon(grandTotal)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-penalty');
    if (!view) return;

    const elTaxAmount    = view.querySelector('#pen-tax-amount');
    const elType         = view.querySelector('#pen-type');
    const elOverdueDays  = view.querySelector('#pen-overdue-days');
    const elOverdueAmt   = view.querySelector('#pen-overdue-amount');
    const resultContainer = view.querySelector('#penalty-result');
    const btnCopy  = view.querySelector('#penalty-copy');
    const btnPrint = view.querySelector('#penalty-print');
    const btnReset = view.querySelector('#penalty-reset');

    if (elTaxAmount) UI.bindNumInput(elTaxAmount);
    if (elOverdueAmt) UI.bindNumInput(elOverdueAmt);

    function getParams() {
      return {
        taxAmount:     UI.parseNum((elTaxAmount?.value || '').replace(/,/g, '')),
        type:          elType?.value || 'no-report',
        overdueDays:   parseInt(elOverdueDays?.value) || 0,
        overdueAmount: UI.parseNum((elOverdueAmt?.value || '').replace(/,/g, '')),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el =>
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', doCalc)
    );

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        await UI.copyText(UI.formatResultForCopy('종합소득세 가산세', [
          { label: '본세', value: UI.fmtWon(result.taxAmount) },
          { label: '신고 가산세', value: `${UI.fmtWon(result.reportPenalty)} (${result.reportLabel})` },
          { label: '납부지연 가산세', value: UI.fmtWon(result.overduePenalty) },
          { label: '총 가산세', value: UI.fmtWon(result.totalPenalty) },
          { label: '본세+가산세 합계', value: UI.fmtWon(result.grandTotal) },
        ]));
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        if (elOverdueDays) elOverdueDays.value = '';
        if (elType) elType.selectedIndex = 0;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
