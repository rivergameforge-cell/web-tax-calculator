/* ===== 자동차 할부 계산기 ===== */
const CalcVehicleInstallment = (() => {

  // 취득세 + 등록비 간이 추정율 (승용차 기준)
  const ACQ_TAX_RATE = 0.07;      // 취득세 7%
  const REG_COST_RATE = 0.02;     // 등록비(공채+수수료 등) 약 2%

  /* ── 원리금균등 ── */
  function calcEqualPayment(principal, monthlyRate, months) {
    if (monthlyRate === 0) {
      const monthly = Math.round(principal / months);
      return {
        monthly,
        totalPayment: monthly * months,
        totalInterest: 0,
        schedule: Array.from({ length: months }, (_, i) => ({
          month: i + 1,
          payment: monthly,
          principalPart: monthly,
          interest: 0,
          remaining: principal - monthly * (i + 1),
        })),
      };
    }
    const pow = Math.pow(1 + monthlyRate, months);
    const monthly = Math.round(principal * monthlyRate * pow / (pow - 1));
    let remaining = principal;
    let totalInterest = 0;
    const schedule = [];

    for (let i = 0; i < months; i++) {
      const interest = Math.round(remaining * monthlyRate);
      const principalPart = monthly - interest;
      remaining -= principalPart;
      totalInterest += interest;
      schedule.push({
        month: i + 1,
        payment: monthly,
        principalPart,
        interest,
        remaining: Math.max(0, remaining),
      });
    }

    return { monthly, totalPayment: monthly * months, totalInterest, schedule };
  }

  /* ── 원금균등 ── */
  function calcEqualPrincipal(principal, monthlyRate, months) {
    const principalPart = Math.round(principal / months);
    let remaining = principal;
    let totalInterest = 0;
    const schedule = [];

    for (let i = 0; i < months; i++) {
      const interest = Math.round(remaining * monthlyRate);
      totalInterest += interest;
      schedule.push({
        month: i + 1,
        payment: principalPart + interest,
        principalPart,
        interest,
        remaining: Math.max(0, remaining - principalPart),
      });
      remaining -= principalPart;
    }

    return {
      firstMonthly: schedule[0]?.payment || 0,
      lastMonthly: schedule[months - 1]?.payment || 0,
      totalPayment: principal + totalInterest,
      totalInterest,
      schedule,
    };
  }

  /* ── 메인 계산 ── */
  function calculate(params) {
    const { vehiclePrice, downPayment, months, annualRate, includeTax, method } = params;
    if (!vehiclePrice || vehiclePrice <= 0 || !months) return null;

    const down = Math.max(0, downPayment || 0);
    const taxCost = includeTax
      ? Math.floor(vehiclePrice * (ACQ_TAX_RATE + REG_COST_RATE))
      : 0;
    const loanBase = vehiclePrice - down;
    if (loanBase <= 0) return null;
    const principal = loanBase + taxCost;

    const monthlyRate = (annualRate || 0) / 100 / 12;

    let result;
    if (method === 'equal-principal') {
      result = calcEqualPrincipal(principal, monthlyRate, months);
    } else {
      result = calcEqualPayment(principal, monthlyRate, months);
    }

    const separateTax = includeTax ? 0 : Math.floor(vehiclePrice * (ACQ_TAX_RATE + REG_COST_RATE));
    const realCost = vehiclePrice + result.totalInterest + separateTax;

    return {
      vehiclePrice, downPayment: down, months, annualRate, includeTax, method,
      taxCost, principal, monthlyRate, realCost, separateTax,
      ...result,
    };
  }

  /* ── 결과 렌더링 ── */
  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">💳</div>차량 가격과 할부 조건을 입력해주세요</div>`;
      return;
    }

    const periodLabel = r.months >= 12
      ? `${Math.floor(r.months / 12)}년${r.months % 12 ? ` ${r.months % 12}개월` : ''}`
      : `${r.months}개월`;

    let monthlySection = '';
    if (r.method === 'equal-principal') {
      monthlySection = `
        <div class="breakdown-row" style="background:var(--accent-light);border-radius:8px;padding:12px">
          <span class="br-label" style="font-weight:700;color:var(--accent)">첫달 납입금</span>
          <span class="br-value" style="font-size:22px;font-weight:800;color:var(--accent)">${UI.fmtWon(r.firstMonthly)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">마지막달 납입금</span>
          <span class="br-value">${UI.fmtWon(r.lastMonthly)}</span>
        </div>`;
    } else {
      monthlySection = `
        <div class="breakdown-row" style="background:var(--accent-light);border-radius:8px;padding:12px">
          <span class="br-label" style="font-weight:700;color:var(--accent)">월 납입금</span>
          <span class="br-value" style="font-size:22px;font-weight:800;color:var(--accent)">${UI.fmtWon(r.monthly)}</span>
        </div>`;
    }

    container.innerHTML = `
      <div class="breakdown-title">할부 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">차량 가격</span>
        <span class="br-value">${UI.fmtWon(r.vehiclePrice)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">선수금 (계약금)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.downPayment)}</span>
      </div>
      ${r.includeTax ? `
      <div class="breakdown-row">
        <span class="br-label">취득세·등록비 (할부 포함)</span>
        <span class="br-value">+ ${UI.fmtWon(r.taxCost)}</span>
      </div>` : ''}
      <div class="breakdown-row" style="border-top:1px dashed var(--border);padding-top:8px">
        <span class="br-label" style="font-weight:600">할부 원금</span>
        <span class="br-value" style="font-weight:600">${UI.fmtWon(r.principal)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">할부 기간</span>
        <span class="br-value">${periodLabel}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">연 이자율</span>
        <span class="br-value"><span class="rate-display">${r.annualRate}%</span></span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">상환 방식</span>
        <span class="br-value">${r.method === 'equal-principal' ? '원금균등' : '원리금균등'}</span>
      </div>

      <div style="margin:12px 0 8px">${monthlySection}</div>

      <div class="breakdown-row">
        <span class="br-label">총 납입액</span>
        <span class="br-value">${UI.fmtWon(r.totalPayment)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--danger);font-weight:600">총 이자</span>
        <span class="br-value" style="color:var(--danger);font-weight:600">${UI.fmtWon(r.totalInterest)}</span>
      </div>
      ${!r.includeTax ? `
      <div class="breakdown-row" style="border-top:1px dashed var(--border);padding-top:8px;margin-top:4px">
        <span class="br-label" style="color:var(--text-muted)">취득세·등록비 (별도)</span>
        <span class="br-value" style="color:var(--text-muted)">${UI.fmtWon(r.separateTax)}</span>
      </div>` : ''}
      <div class="breakdown-row total" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label">실질 차량 비용</span>
        <span class="br-value">${UI.fmtWon(r.realCost)}</span>
      </div>
    `;
  }

  /* ── 상환 스케줄 테이블 ── */
  function renderSchedule(r, container) {
    if (!container) return;
    if (!r || !r.schedule) { container.innerHTML = ''; return; }

    const rows = r.schedule.map(s => `
      <tr>
        <td>${s.month}</td>
        <td>${UI.fmtNum(s.payment)}</td>
        <td>${UI.fmtNum(s.principalPart)}</td>
        <td>${UI.fmtNum(s.interest)}</td>
        <td>${UI.fmtNum(Math.max(0, s.remaining))}</td>
      </tr>`).join('');

    container.innerHTML = `
      <details class="schedule-details" style="margin:16px 0">
        <summary style="cursor:pointer;font-size:14px;font-weight:600;padding:12px 0;color:var(--text-secondary)">
          📋 상환 스케줄 상세 보기
        </summary>
        <div style="overflow-x:auto;margin-top:8px">
          <table class="schedule-table" style="width:100%;font-size:12px;border-collapse:collapse">
            <thead>
              <tr style="background:var(--bg-secondary);text-align:right">
                <th style="padding:8px 6px;text-align:center;width:50px">회차</th>
                <th style="padding:8px 6px">납입금</th>
                <th style="padding:8px 6px">원금</th>
                <th style="padding:8px 6px">이자</th>
                <th style="padding:8px 6px">잔액</th>
              </tr>
            </thead>
            <tbody style="text-align:right">${rows}</tbody>
          </table>
        </div>
      </details>`;
  }

  /* ── 초기화 ── */
  function init() {
    const view = document.getElementById('view-vehicle-installment');
    if (!view) return;

    const resultContainer = view.querySelector('#vinst-result');
    const scheduleContainer = view.querySelector('#vinst-schedule');

    // 금액 입력 포맷팅 바인딩
    ['vinst-price', 'vinst-down'].forEach(id => {
      const el = view.querySelector(`#${id}`);
      if (el) UI.bindNumInput(el);
    });

    function getParams() {
      return {
        vehiclePrice: UI.parseNum(view.querySelector('#vinst-price')?.value),
        downPayment: UI.parseNum(view.querySelector('#vinst-down')?.value),
        months: parseInt(view.querySelector('#vinst-months')?.value || '36', 10),
        annualRate: parseFloat(view.querySelector('#vinst-rate')?.value || '0') || 0,
        includeTax: view.querySelector('#vinst-include-tax')?.checked || false,
        method: view.querySelector('input[name="vinst-method"]:checked')?.value || 'equal-payment',
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
      renderSchedule(result, scheduleContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', doCalc);
      el.addEventListener('change', doCalc);
    });

    // 복사
    view.querySelector('#vinst-copy')?.addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r) return;
      const rows = [
        { label: '차량 가격', value: UI.fmtWon(r.vehiclePrice) },
        { label: '선수금', value: UI.fmtWon(r.downPayment) },
        { label: '할부 원금', value: UI.fmtWon(r.principal) },
        { label: '할부 기간', value: r.months + '개월' },
        { label: '연 이자율', value: r.annualRate + '%' },
      ];
      if (r.method === 'equal-payment') {
        rows.push({ label: '월 납입금', value: UI.fmtWon(r.monthly) });
      } else {
        rows.push({ label: '첫달 납입금', value: UI.fmtWon(r.firstMonthly) });
      }
      rows.push({ label: '총 이자', value: UI.fmtWon(r.totalInterest) });
      rows.push({ label: '실질 차량 비용', value: UI.fmtWon(r.realCost) });
      await UI.copyText(UI.formatResultForCopy('자동차 할부 계산', rows));
      UI.toast('복사되었습니다', 'success');
    });

    // 인쇄
    view.querySelector('#vinst-print')?.addEventListener('click', () => UI.printCalc());

    // 초기화
    view.querySelector('#vinst-reset')?.addEventListener('click', () => {
      ['vinst-price', 'vinst-down'].forEach(id => {
        const el = view.querySelector(`#${id}`);
        if (el) el.value = '';
      });
      const rateEl = view.querySelector('#vinst-rate');
      if (rateEl) rateEl.value = '5.9';
      const monthsEl = view.querySelector('#vinst-months');
      if (monthsEl) monthsEl.value = '36';
      view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
      const defaultRadio = view.querySelector('input[name="vinst-method"][value="equal-payment"]');
      if (defaultRadio) defaultRadio.checked = true;
      renderResult(null, resultContainer);
      if (scheduleContainer) scheduleContainer.innerHTML = '';
    });
  }

  return { init };
})();
