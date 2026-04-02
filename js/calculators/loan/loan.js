/* ===== 대출 계산기 ===== */
const CalcLoan = (() => {

  /**
   * 원리금균등분할 (Equal Payment / Annuity)
   * 매월 동일 금액 납부, 초반에 이자 비중 높음
   * 월납입액 = P * r * (1+r)^n / ((1+r)^n - 1)
   */
  function calcEqualPayment(principal, monthlyRate, months) {
    if (monthlyRate === 0) {
      const monthly = Math.round(principal / months);
      return { monthly, totalPayment: monthly * months, totalInterest: 0 };
    }
    const r = monthlyRate;
    const pow = Math.pow(1 + r, months);
    const monthly = Math.round(principal * r * pow / (pow - 1));
    const totalPayment = monthly * months;
    const totalInterest = totalPayment - principal;
    return { monthly, totalPayment, totalInterest };
  }

  /**
   * 원금균등분할 (Equal Principal)
   * 매월 원금은 동일, 이자는 감소
   * 첫달 납입액이 가장 크고 점점 줄어듦
   */
  function calcEqualPrincipal(principal, monthlyRate, months) {
    const principalPayment = Math.round(principal / months);
    const schedule = [];
    let remaining = principal;
    let totalInterest = 0;

    for (let i = 0; i < months; i++) {
      const interest = Math.round(remaining * monthlyRate);
      const payment = principalPayment + interest;
      totalInterest += interest;
      schedule.push({ month: i + 1, payment, principal: principalPayment, interest, remaining: remaining - principalPayment });
      remaining -= principalPayment;
    }

    const firstMonthly = schedule[0]?.payment || 0;
    const lastMonthly = schedule[months - 1]?.payment || 0;
    const totalPayment = principal + totalInterest;
    return { firstMonthly, lastMonthly, totalPayment, totalInterest, schedule };
  }

  /**
   * 만기일시상환 (Bullet / Balloon)
   * 매월 이자만 납부, 만기에 원금 전액 상환
   */
  function calcBullet(principal, monthlyRate, months) {
    const monthlyInterest = Math.round(principal * monthlyRate);
    const totalInterest = monthlyInterest * months;
    const totalPayment = principal + totalInterest;
    return { monthlyInterest, totalPayment, totalInterest };
  }

  function calculate(params) {
    const { principal, annualRate, months, method } = params;
    if (!principal || principal <= 0 || !months || months <= 0 || annualRate < 0) return null;

    const monthlyRate = annualRate / 100 / 12;

    if (method === 'equal-payment') {
      const result = calcEqualPayment(principal, monthlyRate, months);
      return { method, principal, annualRate, months, monthlyRate, ...result };
    }
    if (method === 'equal-principal') {
      const result = calcEqualPrincipal(principal, monthlyRate, months);
      return { method, principal, annualRate, months, monthlyRate, ...result };
    }
    if (method === 'bullet') {
      const result = calcBullet(principal, monthlyRate, months);
      return { method, principal, annualRate, months, monthlyRate, ...result };
    }
    return null;
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏦</div>
          대출 정보를 입력하고 계산 버튼을 눌러주세요
        </div>`;
      return;
    }

    const { method, principal, annualRate, months, totalPayment, totalInterest } = result;
    const years = Math.floor(months / 12);
    const remMonths = months % 12;
    const periodLabel = years > 0
      ? (remMonths > 0 ? `${years}년 ${remMonths}개월` : `${years}년`)
      : `${months}개월`;

    let monthlySection = '';

    if (method === 'equal-payment') {
      monthlySection = `
        <div class="breakdown-row" style="background:var(--accent-light)">
          <span class="br-label" style="font-weight:700;color:var(--accent)">월 납입액</span>
          <span class="br-value" style="font-size:22px;font-weight:800;color:var(--accent)">${UI.fmtWon(result.monthly)}</span>
        </div>`;
    } else if (method === 'equal-principal') {
      monthlySection = `
        <div class="breakdown-row" style="background:var(--accent-light)">
          <span class="br-label" style="font-weight:700;color:var(--accent)">첫달 납입액</span>
          <span class="br-value" style="font-size:22px;font-weight:800;color:var(--accent)">${UI.fmtWon(result.firstMonthly)}</span>
        </div>
        <div class="breakdown-row indent">
          <span class="br-label">마지막달 납입액</span>
          <span class="br-value">${UI.fmtWon(result.lastMonthly)}</span>
        </div>`;
    } else if (method === 'bullet') {
      monthlySection = `
        <div class="breakdown-row" style="background:var(--accent-light)">
          <span class="br-label" style="font-weight:700;color:var(--accent)">월 이자 납입액</span>
          <span class="br-value" style="font-size:22px;font-weight:800;color:var(--accent)">${UI.fmtWon(result.monthlyInterest)}</span>
        </div>
        <div class="breakdown-row indent">
          <span class="br-label">만기 원금 상환</span>
          <span class="br-value">${UI.fmtWon(principal)}</span>
        </div>`;
    }

    container.innerHTML = `
      <div class="breakdown-title">대출 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">대출금액</span>
        <span class="br-value">${UI.fmtWon(principal)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">대출기간</span>
        <span class="br-value">${periodLabel} (${months}개월)</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">연 금리</span>
        <span class="br-value"><span class="rate-display">${annualRate}%</span></span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">월 금리</span>
        <span class="br-value">${(result.monthlyRate * 100).toFixed(4)}%</span>
      </div>

      ${monthlySection}

      <div class="breakdown-row">
        <span class="br-label">총 납입금액</span>
        <span class="br-value">${UI.fmtWon(totalPayment)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">원금</span>
        <span class="br-value">${UI.fmtWon(principal)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label" style="color:var(--danger)">총 이자</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(totalInterest)}</span>
      </div>
    `;
  }

  // 상환 스케줄 테이블 (원금균등 or 원리금균등 상세)
  function renderSchedule(result, container) {
    if (!result || !result.schedule && result.method !== 'equal-payment') {
      container.innerHTML = '';
      return;
    }

    let schedule = result.schedule;

    // 원리금균등: 직접 스케줄 계산
    if (result.method === 'equal-payment') {
      schedule = [];
      let remaining = result.principal;
      for (let i = 1; i <= result.months; i++) {
        const interest = Math.round(remaining * result.monthlyRate);
        const principalPart = result.monthly - interest;
        remaining = Math.max(0, remaining - principalPart);
        schedule.push({ month: i, payment: result.monthly, principal: principalPart, interest, remaining });
      }
    }

    if (!schedule || schedule.length === 0) {
      container.innerHTML = '';
      return;
    }

    const rows = schedule.map(s => `
      <tr>
        <td style="text-align:center">${s.month}</td>
        <td style="text-align:right">${UI.fmtNum(s.payment)}</td>
        <td style="text-align:right">${UI.fmtNum(s.principal)}</td>
        <td style="text-align:right;color:var(--danger)">${UI.fmtNum(s.interest)}</td>
        <td style="text-align:right">${UI.fmtNum(s.remaining)}</td>
      </tr>
    `).join('');

    container.innerHTML = `
      <div style="margin-top:16px">
        <div class="section-divider"><span>월별 상환 스케줄</span></div>
        <div style="overflow-x:auto;max-height:320px;overflow-y:auto;border:1px solid var(--border);border-radius:var(--radius-md)">
          <table class="info-table" style="min-width:400px">
            <thead style="position:sticky;top:0;z-index:1">
              <tr>
                <th>회차</th>
                <th style="text-align:right">납입금(원)</th>
                <th style="text-align:right">원금(원)</th>
                <th style="text-align:right">이자(원)</th>
                <th style="text-align:right">잔액(원)</th>
              </tr>
            </thead>
            <tbody>${rows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-loan-calculator');
    if (!view) return;

    const resultContainer = view.querySelector('#loan-result');
    const scheduleContainer = view.querySelector('#loan-schedule');
    const btnCalc = view.querySelector('#loan-calc');
    const btnCopy = view.querySelector('#loan-copy');
    const btnPrint = view.querySelector('#loan-print');
    const btnReset = view.querySelector('#loan-reset');

    // Bind number inputs
    const principalInput = view.querySelector('#loan-amount');
    if (principalInput) UI.bindNumInput(principalInput);

    // Period toggle: 년/개월
    let periodUnit = 'year'; // 'year' or 'month'
    const periodInput = view.querySelector('#loan-period');
    const periodUnitBtns = view.querySelectorAll('.loan-period-unit-btn');
    const periodUnitLabel = view.querySelector('#loan-period-unit-label');
    periodUnitBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        periodUnit = btn.dataset.unit;
        periodUnitBtns.forEach(b => b.classList.toggle('active', b.dataset.unit === periodUnit));
        if (periodInput) periodInput.placeholder = periodUnit === 'year' ? '예: 30' : '예: 360';
        if (periodUnitLabel) periodUnitLabel.textContent = periodUnit === 'year' ? '년' : '개월';
      });
    });

    let lastResult = null;

    function getParams() {
      const principal = UI.parseNum((principalInput?.value || '').replace(/,/g, ''));
      const period = parseFloat(periodInput?.value || '0') || 0;
      const months = periodUnit === 'year' ? Math.round(period * 12) : Math.round(period);
      const rate = parseFloat(view.querySelector('#loan-rate')?.value || '0') || 0;
      const method = view.querySelector('input[name="loan-method"]:checked')?.value || 'equal-payment';
      return { principal, months, annualRate: rate, method };
    }

    function doCalc() {
      const params = getParams();
      lastResult = calculate(params);
      renderResult(lastResult, resultContainer);
      // Show schedule if method supports it and not bullet
      if (lastResult && lastResult.method !== 'bullet') {
        renderSchedule(lastResult, scheduleContainer);
      } else if (scheduleContainer) {
        scheduleContainer.innerHTML = '';
      }
    }

    if (btnCalc) btnCalc.addEventListener('click', doCalc);

    // Also auto-calc on Enter key
    view.querySelectorAll('input').forEach(el => {
      el.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') doCalc();
      });
    });

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        if (!lastResult) return;
        const rows = [
          { label: '대출금액', value: UI.fmtWon(lastResult.principal) },
          { label: '연 금리', value: lastResult.annualRate + '%' },
          { label: '대출기간', value: lastResult.months + '개월' },
        ];
        if (lastResult.method === 'equal-payment') rows.push({ label: '월 납입액', value: UI.fmtWon(lastResult.monthly) });
        if (lastResult.method === 'equal-principal') rows.push({ label: '첫달 납입액', value: UI.fmtWon(lastResult.firstMonthly) });
        if (lastResult.method === 'bullet') rows.push({ label: '월 이자', value: UI.fmtWon(lastResult.monthlyInterest) });
        rows.push({ label: '총 납입금액', value: UI.fmtWon(lastResult.totalPayment) });
        rows.push({ label: '총 이자', value: UI.fmtWon(lastResult.totalInterest) });
        await UI.copyText(UI.formatResultForCopy('대출 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
        view.querySelector('input[name="loan-method"][value="equal-payment"]').checked = true;
        renderResult(null, resultContainer);
        if (scheduleContainer) scheduleContainer.innerHTML = '';
        lastResult = null;
      });
    }
  }

  return { init, calculate };
})();
