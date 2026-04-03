/* ===== 4대보험 계산기 ===== */
const CalcInsurance = (() => {

  // 2026 기준 요율
  const RATES = {
    nationalPension:  0.09,    // 국민연금 전체 9%
    healthInsurance:  0.0709,  // 건강보험 전체 7.09%
    longTermCare:     0.1281,  // 장기요양: 건강보험료의 12.81%
    employment:       0.018,   // 고용보험 전체 1.8%
  };

  // 국민연금 상한 보수월액
  const PENSION_CAP = 5_900_000;

  // 건강보험 상한 보수월액
  const HEALTH_CAP = 100_000_000;

  // 산재보험 업종별 요율
  const INDUSTRIAL_RATES = {
    office:        0.007,
    retail:        0.009,
    food:          0.012,
    manufacturing: 0.016,
    construction:  0.035,
    other:         0.010,
  };

  const INDUSTRIAL_LABELS = {
    office:        '사무직 (0.7%)',
    retail:        '도소매업 (0.9%)',
    food:          '음식숙박업 (1.2%)',
    manufacturing: '제조업 (1.6%)',
    construction:  '건설업 (3.5%)',
    other:         '기타 (1.0%)',
  };

  function calculate(params) {
    const { salary, insType, industry } = params;
    if (!salary || salary <= 0) return null;

    const pensionBase = Math.min(salary, PENSION_CAP);
    const healthBase  = Math.min(salary, HEALTH_CAP);

    let items = [];

    if (insType === 'employee') {
      // 직장가입자 근로자 부담분
      const pension  = Math.floor(pensionBase * 0.045);
      const health   = Math.floor(healthBase * 0.03545);
      const longTerm = Math.floor(health * RATES.longTermCare);
      const employ   = Math.floor(salary * 0.009);

      items = [
        { label: '국민연금 (4.5%)',       amount: pension },
        { label: '건강보험 (3.545%)',     amount: health },
        { label: '장기요양보험 (12.81%)', amount: longTerm },
        { label: '고용보험 (0.9%)',       amount: employ },
      ];
    } else if (insType === 'employer') {
      // 사업주 부담분
      const pension   = Math.floor(pensionBase * 0.045);
      const health    = Math.floor(healthBase * 0.03545);
      const longTerm  = Math.floor(health * RATES.longTermCare);
      const employ    = Math.floor(salary * 0.009);
      const indRate   = INDUSTRIAL_RATES[industry] || 0.010;
      const indAmount = Math.floor(salary * indRate);

      items = [
        { label: '국민연금 (4.5%)',            amount: pension },
        { label: '건강보험 (3.545%)',          amount: health },
        { label: '장기요양보험 (12.81%)',      amount: longTerm },
        { label: '고용보험 (0.9%)',            amount: employ },
        { label: `산재보험 (${INDUSTRIAL_LABELS[industry] || industry})`, amount: indAmount },
      ];
    } else {
      // 지역가입자 전체 부담
      const pension  = Math.floor(pensionBase * 0.09);
      const health   = Math.floor(healthBase * 0.0709);
      const longTerm = Math.floor(health * RATES.longTermCare);

      items = [
        { label: '국민연금 (9%)',          amount: pension },
        { label: '건강보험 (7.09%)',       amount: health },
        { label: '장기요양보험 (12.81%)',  amount: longTerm },
      ];
    }

    const monthlyTotal = items.reduce((s, i) => s + i.amount, 0);
    const yearlyTotal  = monthlyTotal * 12;

    return { salary, insType, industry, items, monthlyTotal, yearlyTotal };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏥</div>
          월 보수를 입력하면 보험료가 계산됩니다
        </div>`;
      return;
    }

    const typeLabels = {
      employee: '직장가입자 (근로자 부담분)',
      employer: '사업주 부담분',
      self:     '지역가입자 (전체 부담)',
    };

    const rows = result.items.map(item => `
      <div class="breakdown-row">
        <span class="br-label">${item.label}</span>
        <span class="br-value">${UI.fmtWon(item.amount)}</span>
      </div>
    `).join('');

    container.innerHTML = `
      <div class="breakdown-title">4대보험료 계산 결과</div>
      <div class="breakdown-row sub">
        <span class="br-label" style="color:var(--text-muted);font-size:0.85em">${typeLabels[result.insType] || ''}</span>
        <span class="br-value"></span>
      </div>
      ${rows}
      <div class="breakdown-row total">
        <span class="br-label">월 합계</span>
        <span class="br-value">${UI.fmtWon(result.monthlyTotal)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">연간 합계</span>
        <span class="br-value">${UI.fmtWon(result.yearlyTotal)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-insurance');
    if (!view) return;

    const elSalary   = view.querySelector('#ins-salary');
    const elType     = view.querySelector('#ins-type');
    const elIndustry = view.querySelector('#ins-industry');
    const resultContainer = view.querySelector('#ins-result');
    const btnCopy  = view.querySelector('#ins-copy');
    const btnPrint = view.querySelector('#ins-print');
    const btnReset = view.querySelector('#ins-reset');

    if (elSalary) UI.bindNumInput(elSalary);

    function getParams() {
      return {
        salary:   UI.parseNum((elSalary?.value || '').replace(/,/g, '')),
        insType:  elType?.value || 'employee',
        industry: elIndustry?.value || 'office',
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      renderResult(calculate(params), resultContainer);

      // 산재보험 업종 선택은 사업주만 표시
      const industryGroup = elIndustry?.closest('.form-group') || elIndustry?.parentElement;
      if (industryGroup) {
        industryGroup.style.display = params.insType === 'employer' ? '' : 'none';
      }
    }, 200);

    view.querySelectorAll('input, select').forEach(el =>
      el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', doCalc)
    );

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = result.items.map(i => ({ label: i.label, value: UI.fmtWon(i.amount) }));
        rows.push({ label: '월 합계', value: UI.fmtWon(result.monthlyTotal) });
        rows.push({ label: '연간 합계', value: UI.fmtWon(result.yearlyTotal) });
        await UI.copyText(UI.formatResultForCopy('4대보험료', rows));
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        if (elType) elType.selectedIndex = 0;
        if (elIndustry) elIndustry.selectedIndex = 0;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
