/* ===== 근로소득세·연말정산 계산기 (2026년 기준) ===== */
const CalcEmployment = (() => {

  // 종합소득세 누진세율표
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

  // 근로소득공제
  function getEarnedIncomeDeduction(totalPay) {
    if (totalPay <= 5_000_000)   return Math.floor(totalPay * 0.70);
    if (totalPay <= 15_000_000)  return 3_500_000 + Math.floor((totalPay - 5_000_000) * 0.40);
    if (totalPay <= 45_000_000)  return 7_500_000 + Math.floor((totalPay - 15_000_000) * 0.15);
    if (totalPay <= 100_000_000) return 12_000_000 + Math.floor((totalPay - 45_000_000) * 0.05);
    return 14_750_000 + Math.floor((totalPay - 100_000_000) * 0.02);
  }

  // 근로소득세액공제
  function getEarnedIncomeTaxCredit(calcTax) {
    if (calcTax <= 1_300_000) return Math.floor(calcTax * 0.55);
    return 715_000 + Math.floor((calcTax - 1_300_000) * 0.30);
  }

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
      annualPay,        // 연간 총급여 (원)
      selfCount,        // 본인 (항상 1)
      spouseDeduction,  // 배우자 공제 여부
      dependents,       // 부양가족 수
      childCount,       // 7세 이상 자녀 수 (자녀세액공제)
      insurance,        // 보험료 공제 (원)
      medical,          // 의료비 공제 (원)
      education,        // 교육비 공제 (원)
      housing,          // 주택자금 공제 (원)
      donation,         // 기부금 (원)
      paidTax,          // 기납부세액 (원천징수) (원)
    } = params;

    if (!annualPay || annualPay <= 0) return null;

    // 1) 근로소득공제
    const earnedDeduction = getEarnedIncomeDeduction(annualPay);
    const earnedIncome = annualPay - earnedDeduction; // 근로소득금액

    // 2) 인적공제
    const personalCount = (selfCount || 1) + (spouseDeduction ? 1 : 0) + (dependents || 0);
    const personalDeduction = personalCount * 1_500_000;

    // 3) 특별소득공제 (보험료 + 주택자금)
    const specialDeduction = (insurance || 0) + (housing || 0);

    // 4) 기타 소득공제
    const otherDeduction = 0;

    // 총 소득공제
    const totalDeduction = personalDeduction + specialDeduction + otherDeduction;
    const taxBase = Math.max(0, earnedIncome - totalDeduction);

    // 5) 산출세액
    const calcTax = calcProgressiveTax(taxBase);

    // 6) 세액공제
    // 근로소득세액공제
    let earnedTaxCredit = getEarnedIncomeTaxCredit(calcTax);
    // 총급여 기준 한도
    if (annualPay <= 33_000_000) earnedTaxCredit = Math.min(earnedTaxCredit, 740_000);
    else if (annualPay <= 70_000_000) earnedTaxCredit = Math.min(earnedTaxCredit, 660_000);
    else earnedTaxCredit = Math.min(earnedTaxCredit, 500_000);

    // 자녀세액공제 (7세 이상 자녀)
    let childCredit = 0;
    if (childCount === 1) childCredit = 150_000;
    else if (childCount === 2) childCredit = 350_000;
    else if (childCount >= 3) childCredit = 350_000 + (childCount - 2) * 300_000;

    // 특별세액공제 (의료비, 교육비, 기부금)
    // 의료비: (지출액 - 총급여 3%) × 15%
    let medicalCredit = 0;
    if (medical > 0) {
      const medicalExcess = Math.max(0, medical - Math.floor(annualPay * 0.03));
      medicalCredit = Math.floor(medicalExcess * 0.15);
    }
    // 교육비: × 15%
    const educationCredit = Math.floor((education || 0) * 0.15);
    // 기부금: × 15% (1천만원 초과분 30%)
    let donationCredit = 0;
    if (donation > 0) {
      if (donation <= 10_000_000) donationCredit = Math.floor(donation * 0.15);
      else donationCredit = 1_500_000 + Math.floor((donation - 10_000_000) * 0.30);
    }

    const totalCredit = earnedTaxCredit + childCredit + medicalCredit + educationCredit + donationCredit;
    const determinedTax = Math.max(0, calcTax - totalCredit);

    // 지방소득세 10%
    const localTax = Math.floor(determinedTax * 0.10);
    const totalTax = determinedTax + localTax;

    // 환급/추가납부
    const totalPaid = paidTax || 0;
    const refund = totalPaid - totalTax; // 양수면 환급, 음수면 추가납부

    return {
      annualPay, earnedDeduction, earnedIncome,
      personalDeduction, personalCount,
      specialDeduction, totalDeduction, taxBase,
      calcTax,
      earnedTaxCredit, childCredit, medicalCredit, educationCredit, donationCredit,
      totalCredit, determinedTax, localTax, totalTax,
      totalPaid, refund,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💼</div>
          연간 총급여를 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    container.innerHTML = `
      <div class="breakdown-title">근로소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">연간 총급여</span>
        <span class="br-value">${UI.fmtWon(r.annualPay)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">근로소득공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.earnedDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">근로소득금액</span>
        <span class="br-value">${UI.fmtWon(r.earnedIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">인적공제 (${r.personalCount}명 × 150만원)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.personalDeduction)}</span>
      </div>
      ${r.specialDeduction > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">특별소득공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.specialDeduction)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(r.taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">산출세액 (누진세율)</span>
        <span class="br-value">${UI.fmtWon(r.calcTax)}</span>
      </div>
      ${r.totalCredit > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">세액공제 합계</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.totalCredit)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">결정세액 (소득세)</span>
        <span class="br-value">${UI.fmtWon(r.determinedTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">총 결정세액</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      ${r.totalPaid > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기납부세액 (원천징수)</span>
        <span class="br-value">${UI.fmtWon(r.totalPaid)}</span>
      </div>
      <div class="breakdown-row total" style="margin-top:8px">
        <span class="br-label">${r.refund >= 0 ? '예상 환급액' : '추가 납부액'}</span>
        <span class="br-value" style="color:${r.refund >= 0 ? 'var(--success)' : 'var(--danger)'}">${r.refund >= 0 ? '+ ' : ''}${UI.fmtWon(Math.abs(r.refund))}</span>
      </div>` : ''}
    `;
  }

  function init() {
    const view = document.getElementById('view-income-employment');
    if (!view) return;

    const resultContainer = view.querySelector('#emp-result');
    const btnCopy  = view.querySelector('#emp-copy');
    const btnPrint = view.querySelector('#emp-print');
    const btnReset = view.querySelector('#emp-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      const getNum = id => parseInt(view.querySelector(`#${id}`)?.value || '0') || 0;
      return {
        annualPay:       getVal('emp-annual-pay'),
        selfCount:       1,
        spouseDeduction: view.querySelector('#emp-spouse')?.checked || false,
        dependents:      getNum('emp-dependents'),
        childCount:      getNum('emp-child-count'),
        insurance:       getVal('emp-insurance'),
        medical:         getVal('emp-medical'),
        education:       getVal('emp-education'),
        housing:         getVal('emp-housing'),
        donation:        getVal('emp-donation'),
        paidTax:         getVal('emp-paid-tax'),
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        const rows = [
          { label: '연간 총급여', value: UI.fmtWon(r.annualPay) },
          { label: '과세표준',   value: UI.fmtWon(r.taxBase) },
          { label: '결정세액',   value: UI.fmtWon(r.determinedTax) },
          { label: '총 결정세액', value: UI.fmtWon(r.totalTax) },
        ];
        if (r.totalPaid > 0) rows.push({ label: r.refund >= 0 ? '예상 환급액' : '추가 납부액', value: UI.fmtWon(Math.abs(r.refund)) });
        await UI.copyText(UI.formatResultForCopy('근로소득세·연말정산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
