/* ===== 월세 세액공제 계산기 (2026년 기준) ===== */
const CalcRentCredit = (() => {

  // 총급여 기준 공제율
  // 5,500만원 이하: 17%
  // 5,500만원 초과 ~ 8,000만원 이하: 15%
  // 8,000만원 초과: 공제 불가
  // 종합소득금액 7,000만원 이하 요건
  const SALARY_LOW = 55_000_000;
  const SALARY_HIGH = 80_000_000;
  const RATE_LOW = 0.17;
  const RATE_MID = 0.15;
  const ANNUAL_LIMIT = 10_000_000; // 연 1,000만원 한도

  function calculate(params) {
    const { annualSalary, monthlyRent, months } = params;
    if (!annualSalary || annualSalary <= 0 || !monthlyRent || monthlyRent <= 0) return null;

    const annualRent = monthlyRent * months;

    // 공제 대상 여부
    if (annualSalary > SALARY_HIGH) {
      return {
        annualSalary, monthlyRent, months, annualRent,
        eligible: false,
        reason: '총급여 8,000만원 초과 시 월세 세액공제를 받을 수 없습니다.',
      };
    }

    // 공제율 결정
    const rate = annualSalary <= SALARY_LOW ? RATE_LOW : RATE_MID;
    const rateLabel = annualSalary <= SALARY_LOW ? '17%' : '15%';

    // 공제 대상액 (한도 1,000만원)
    const eligibleAmount = Math.min(annualRent, ANNUAL_LIMIT);
    const excessAmount = Math.max(0, annualRent - ANNUAL_LIMIT);

    // 세액공제
    const taxCredit = Math.floor(eligibleAmount * rate);

    // 월 환산
    const monthlyCredit = Math.floor(taxCredit / 12);

    // 최대 공제 시뮬레이션
    const maxCredit = Math.floor(ANNUAL_LIMIT * rate);

    return {
      annualSalary, monthlyRent, months, annualRent,
      eligible: true,
      rate, rateLabel,
      eligibleAmount, excessAmount,
      taxCredit, monthlyCredit,
      maxCredit,
    };
  }

  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏠</div>
          총급여와 월세를 입력해주세요
        </div>`;
      return;
    }

    if (!r.eligible) {
      container.innerHTML = `
        <div class="breakdown-title">월세 세액공제 결과</div>
        <div class="breakdown-row">
          <span class="br-label">총급여</span>
          <span class="br-value">${UI.fmtWon(r.annualSalary)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">연간 월세</span>
          <span class="br-value">${UI.fmtWon(r.annualRent)}</span>
        </div>
        <div class="notice-box" style="margin-top:16px;border-left-color:var(--danger)">
          <strong style="color:var(--danger)">공제 불가:</strong> ${r.reason}
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">월세 세액공제 결과</div>

      <div class="breakdown-row">
        <span class="br-label">총급여 (연봉)</span>
        <span class="br-value">${UI.fmtWon(r.annualSalary)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">적용 공제율</span>
        <span class="br-value" style="font-weight:700;color:var(--accent)">${r.rateLabel}</span>
      </div>

      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 월세 납입 내역</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">월 임대료</span>
        <span class="br-value">${UI.fmtWon(r.monthlyRent)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">납입 개월수</span>
        <span class="br-value">${r.months}개월</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">연간 월세 합계</span>
        <span class="br-value">${UI.fmtWon(r.annualRent)}</span>
      </div>

      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 공제 계산</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">공제 대상액 (한도 1,000만원)</span>
        <span class="br-value">${UI.fmtWon(r.eligibleAmount)}</span>
      </div>
      ${r.excessAmount > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label" style="color:var(--danger)">한도 초과 (공제 불가)</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(r.excessAmount)}</span>
      </div>` : ''}

      <div class="breakdown-row total" style="margin-top:12px">
        <span class="br-label">월세 세액공제</span>
        <span class="br-value">${UI.fmtWon(r.taxCredit)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">월 환산 절세 효과</span>
        <span class="br-value">약 ${UI.fmtWon(r.monthlyCredit)}/월</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--text-muted)">최대 공제 가능액 (1,000만원 납입 시)</span>
        <span class="br-value" style="color:var(--text-muted)">${UI.fmtWon(r.maxCredit)}</span>
      </div>

      <div class="notice-box" style="margin-top:16px">
        <strong>공제 요건:</strong> 무주택 세대주(또는 세대원), 국민주택규모(85㎡) 이하 또는 기준시가 4억원 이하 주택
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-rent-credit');
    if (!view) return;

    const resultContainer = view.querySelector('#rent-credit-result');
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      return {
        annualSalary: getVal('rc-salary'),
        monthlyRent: getVal('rc-rent'),
        months: Math.max(1, Math.min(12, parseInt(view.querySelector('#rc-months')?.value) || 12)),
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => {
      el.addEventListener('input', doCalc);
      el.addEventListener('change', doCalc);
    });

    view.querySelector('#rent-credit-copy')?.addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r || !r.eligible) return;
      const rows = [
        { label: '총급여', value: UI.fmtWon(r.annualSalary) },
        { label: '연간 월세', value: UI.fmtWon(r.annualRent) },
        { label: '공제율', value: r.rateLabel },
        { label: '월세 세액공제', value: UI.fmtWon(r.taxCredit) },
      ];
      await UI.copyText(UI.formatResultForCopy('월세 세액공제', rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#rent-credit-print')?.addEventListener('click', () => UI.printCalc());
    view.querySelector('#rent-credit-reset')?.addEventListener('click', () => {
      view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
      const monthsInput = view.querySelector('#rc-months');
      if (monthsInput) monthsInput.value = '12';
      renderResult(null, resultContainer);
    });

    doCalc();
  }

  return { init };
})();
