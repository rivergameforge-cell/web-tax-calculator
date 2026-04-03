/* ===== 연봉/월급/시급 계산기 ===== */
const CalcSalary = (() => {

  // 근로소득세 간이세액 근사 계산
  function calcMonthlyIncomeTax(taxableAnnual, familyCount, childCount) {
    // 근로소득공제
    let earnedDeduction;
    if (taxableAnnual <= 5_000_000) earnedDeduction = taxableAnnual * 0.70;
    else if (taxableAnnual <= 15_000_000) earnedDeduction = 3_500_000 + (taxableAnnual - 5_000_000) * 0.40;
    else if (taxableAnnual <= 45_000_000) earnedDeduction = 7_500_000 + (taxableAnnual - 15_000_000) * 0.15;
    else if (taxableAnnual <= 100_000_000) earnedDeduction = 12_000_000 + (taxableAnnual - 45_000_000) * 0.05;
    else earnedDeduction = 14_750_000 + (taxableAnnual - 100_000_000) * 0.02;

    const earnedIncome = taxableAnnual - earnedDeduction;

    // 인적공제: 1인당 150만원
    const personalDeduction = familyCount * 1_500_000;

    // 연금보험료공제 (국민연금 연간)
    const pensionDeduction = Math.min(taxableAnnual / 12, 5_900_000) * 0.045 * 12;

    // 과세표준
    const taxBase = Math.max(0, earnedIncome - personalDeduction - pensionDeduction);

    // 기본세율 적용
    let calcTax;
    if (taxBase <= 14_000_000) calcTax = taxBase * 0.06;
    else if (taxBase <= 50_000_000) calcTax = 840_000 + (taxBase - 14_000_000) * 0.15;
    else if (taxBase <= 88_000_000) calcTax = 6_240_000 + (taxBase - 50_000_000) * 0.24;
    else if (taxBase <= 150_000_000) calcTax = 15_360_000 + (taxBase - 88_000_000) * 0.35;
    else if (taxBase <= 300_000_000) calcTax = 37_060_000 + (taxBase - 150_000_000) * 0.38;
    else if (taxBase <= 500_000_000) calcTax = 94_060_000 + (taxBase - 300_000_000) * 0.40;
    else if (taxBase <= 1_000_000_000) calcTax = 174_060_000 + (taxBase - 500_000_000) * 0.42;
    else calcTax = 384_060_000 + (taxBase - 1_000_000_000) * 0.45;

    // 근로소득 세액공제
    let taxCredit;
    if (calcTax <= 1_300_000) taxCredit = calcTax * 0.55;
    else taxCredit = 715_000 + (calcTax - 1_300_000) * 0.30;

    // 세액공제 한도
    if (taxableAnnual <= 33_000_000) taxCredit = Math.min(taxCredit, 740_000);
    else if (taxableAnnual <= 70_000_000) taxCredit = Math.min(taxCredit, 660_000);
    else taxCredit = Math.min(taxCredit, 500_000);

    // 자녀세액공제
    let childCredit = 0;
    if (childCount === 1) childCredit = 150_000;
    else if (childCount === 2) childCredit = 350_000;
    else if (childCount >= 3) childCredit = 350_000 + (childCount - 2) * 300_000;

    const annualTax = Math.max(0, calcTax - taxCredit - childCredit);
    return Math.floor(annualTax / 12);
  }

  function calculate(params) {
    const { mode, amount, familyCount, childCount, nonTaxAmount, weeklyHours } = params;

    if (!amount || amount <= 0) return null;

    // Step 1: Convert to monthly salary
    let monthlySalary;
    if (mode === 'annual') {
      monthlySalary = amount / 12;
    } else if (mode === 'monthly') {
      monthlySalary = amount;
    } else {
      // hourly: amount × weeklyHours × (365/7/12)
      monthlySalary = amount * weeklyHours * (365 / 7 / 12);
    }

    // Step 2: Taxable monthly salary
    const taxableMonthly = Math.max(0, monthlySalary - nonTaxAmount);

    // Step 3: 4대보험
    const pension = Math.floor(Math.min(taxableMonthly, 5_900_000) * 0.045);
    const health = Math.floor(taxableMonthly * 0.03545);
    const longCare = Math.floor(health * 0.1281);
    const employment = Math.floor(taxableMonthly * 0.009);
    const totalInsurance = pension + health + longCare + employment;

    // Step 4: Income tax
    const taxableAnnual = taxableMonthly * 12;
    const incomeTax = calcMonthlyIncomeTax(taxableAnnual, familyCount, childCount);
    const localIncomeTax = Math.floor(incomeTax * 0.1);

    // Step 5: Net pay
    const totalDeduction = totalInsurance + incomeTax + localIncomeTax;
    const monthlyNet = Math.floor(monthlySalary - totalDeduction);
    const annualGross = Math.floor(monthlySalary * 12);
    const annualNet = Math.floor(monthlyNet * 12);
    const hourlyRate = Math.floor(monthlySalary / (weeklyHours * (365 / 7 / 12)));

    return {
      monthlySalary: Math.floor(monthlySalary),
      annualGross,
      hourlyRate,
      pension,
      health,
      longCare,
      employment,
      totalInsurance,
      incomeTax,
      localIncomeTax,
      totalDeduction,
      monthlyNet,
      annualNet,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💰</div>
          금액을 입력하면 실수령액이 계산됩니다
        </div>`;
      return;
    }

    const r = result;
    container.innerHTML = `
      <div class="breakdown-title">급여 계산 결과</div>

      <div class="breakdown-row">
        <span class="br-label">연봉</span>
        <span class="br-value">${UI.fmtWon(r.annualGross)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">월급 (세전)</span>
        <span class="br-value">${UI.fmtWon(r.monthlySalary)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">시급 환산</span>
        <span class="br-value">${UI.fmtWon(r.hourlyRate)}</span>
      </div>

      <div class="breakdown-divider"></div>

      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">국민연금 (4.5%)</span>
        <span class="br-value">- ${UI.fmtWon(r.pension)}</span>
      </div>
      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">건강보험 (3.545%)</span>
        <span class="br-value">- ${UI.fmtWon(r.health)}</span>
      </div>
      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">장기요양보험</span>
        <span class="br-value">- ${UI.fmtWon(r.longCare)}</span>
      </div>
      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">고용보험 (0.9%)</span>
        <span class="br-value">- ${UI.fmtWon(r.employment)}</span>
      </div>
      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">4대보험 소계</span>
        <span class="br-value">- ${UI.fmtWon(r.totalInsurance)}</span>
      </div>

      <div class="breakdown-divider"></div>

      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">소득세 (근사)</span>
        <span class="br-value">- ${UI.fmtWon(r.incomeTax)}</span>
      </div>
      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">- ${UI.fmtWon(r.localIncomeTax)}</span>
      </div>

      <div class="breakdown-divider"></div>

      <div class="breakdown-row" style="color:var(--success)">
        <span class="br-label">공제 합계</span>
        <span class="br-value">- ${UI.fmtWon(r.totalDeduction)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">월 실수령액</span>
        <span class="br-value">${UI.fmtWon(r.monthlyNet)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">연 실수령액</span>
        <span class="br-value">${UI.fmtWon(r.annualNet)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-salary');
    if (!view) return;

    const modeSelect = view.querySelector('#sal-mode');
    const amountInput = view.querySelector('#sal-amount');
    const familyInput = view.querySelector('#sal-family');
    const childInput = view.querySelector('#sal-child');
    const nonTaxInput = view.querySelector('#sal-nontax');
    const hoursInput = view.querySelector('#sal-hours');
    const hoursGroup = view.querySelector('#sal-hours-group');
    const amountLabel = view.querySelector('#sal-amount-label');
    const resultContainer = view.querySelector('#salary-result');
    const btnCopy = view.querySelector('#salary-copy');
    const btnPrint = view.querySelector('#salary-print');
    const btnReset = view.querySelector('#salary-reset');

    if (amountInput) UI.bindNumInput(amountInput);
    if (nonTaxInput) UI.bindNumInput(nonTaxInput);

    function updateModeUI() {
      const mode = modeSelect ? modeSelect.value : 'annual';
      if (amountLabel) {
        if (mode === 'annual') amountLabel.textContent = '연봉';
        else if (mode === 'monthly') amountLabel.textContent = '월급';
        else amountLabel.textContent = '시급';
      }
      if (hoursGroup) {
        hoursGroup.style.display = mode === 'hourly' ? '' : 'none';
      }
    }

    function getParams() {
      return {
        mode: modeSelect ? modeSelect.value : 'annual',
        amount: amountInput ? UI.parseNum(amountInput.value) : 0,
        familyCount: familyInput ? Math.max(1, parseInt(familyInput.value) || 1) : 1,
        childCount: childInput ? Math.max(0, parseInt(childInput.value) || 0) : 0,
        nonTaxAmount: nonTaxInput ? UI.parseNum(nonTaxInput.value) : 200000,
        weeklyHours: hoursInput ? Math.max(1, parseFloat(hoursInput.value) || 40) : 40,
      };
    }

    const doCalc = UI.debounce(() => {
      updateModeUI();
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);
    }, 200);

    // Bind events
    if (modeSelect) modeSelect.addEventListener('change', doCalc);

    view.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', doCalc);
      el.addEventListener('change', doCalc);
    });

    // Copy
    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const params = getParams();
        const result = calculate(params);
        if (!result) return;
        const text = UI.formatResultForCopy('급여 계산', [
          { label: '연봉', value: UI.fmtWon(result.annualGross) },
          { label: '월급 (세전)', value: UI.fmtWon(result.monthlySalary) },
          { label: '시급 환산', value: UI.fmtWon(result.hourlyRate) },
          { label: '4대보험', value: UI.fmtWon(result.totalInsurance) },
          { label: '소득세', value: UI.fmtWon(result.incomeTax) },
          { label: '지방소득세', value: UI.fmtWon(result.localIncomeTax) },
          { label: '공제 합계', value: UI.fmtWon(result.totalDeduction) },
          { label: '월 실수령액', value: UI.fmtWon(result.monthlyNet) },
          { label: '연 실수령액', value: UI.fmtWon(result.annualNet) },
        ]);
        await UI.copyText(text);
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    // Print
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    // Reset
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (modeSelect) modeSelect.value = 'annual';
        if (amountInput) amountInput.value = '';
        if (familyInput) familyInput.value = '1';
        if (childInput) childInput.value = '0';
        if (nonTaxInput) {
          nonTaxInput.value = '200,000';
        }
        if (hoursInput) hoursInput.value = '40';
        updateModeUI();
        renderResult(null, resultContainer);
      });
    }

    // Initial UI setup
    updateModeUI();
    doCalc();
  }

  return { init };
})();
