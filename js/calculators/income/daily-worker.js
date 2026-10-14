/* ===== 일용직 소득세 계산기 (2026년) ===== */
const CalcDailyWorker = (() => {
  const DAILY_DEDUCTION = 150000;
  const SMALL_TAX_LIMIT = 1000;
  const truncateTen = amount => Math.floor(amount / 10) * 10;

  function calculate(params) {
    const { dailyWage, workDays = 1, paymentMode = 'combined' } = params;
    if (!Number.isSafeInteger(dailyWage) || dailyWage <= 0 ||
        !Number.isInteger(workDays) || workDays < 1 || workDays > 31 ||
        !Number.isSafeInteger(dailyWage * workDays * 27) ||
        !['daily', 'combined'].includes(paymentMode)) return null;

    const taxablePerDay = Math.max(dailyWage - DAILY_DEDUCTION, 0);
    // 6% × (1 - 55%) = 2.7%. 중간의 부동소수점 오차 없이 원 미만을 버린다.
    const assessedPerDay = Math.floor(taxablePerDay * 27 / 1000);
    function withholding(days) {
      const assessed = assessedPerDay * days;
      const smallTaxExempt = assessed < SMALL_TAX_LIMIT;
      const incomeTax = smallTaxExempt ? 0 : truncateTen(assessed);
      const localTax = truncateTen(incomeTax / 10);
      return { assessed, smallTaxExempt, incomeTax, localTax, totalTax: incomeTax + localTax };
    }
    const single = withholding(1);
    const paymentDays = paymentMode === 'daily' ? 1 : workDays;
    const paymentCount = paymentMode === 'daily' ? workDays : 1;
    const payment = withholding(paymentDays);
    const monthlyGross = dailyWage * workDays;
    const monthlyTax = payment.totalTax * paymentCount;
    return {
      dailyWage, workDays, paymentMode, paymentDays, paymentCount,
      deduction: DAILY_DEDUCTION, taxablePerDay, assessedPerDay, payment,
      incomeTaxPerDay: single.incomeTax, localTaxPerDay: single.localTax,
      totalTaxPerDay: single.totalTax, takeHomePerDay: dailyWage - single.totalTax,
      monthlyGross, monthlyIncomeTax: payment.incomeTax * paymentCount,
      monthlyLocalTax: payment.localTax * paymentCount,
      monthlyTax, monthlyTakeHome: monthlyGross - monthlyTax,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = '<div class="result-empty"><div class="result-empty-icon">👷</div>일당과 근무일수(1~31일)를 입력해주세요</div>';
      return;
    }
    const r = result;
    const label = r.paymentMode === 'daily' ? '매일 따로 지급' : '입력한 근무일분 일괄 지급';
    container.innerHTML = `
      <div class="breakdown-title">일용직 소득세 계산 결과</div>
      <div class="breakdown-row"><span class="br-label">일당</span><span class="br-value">${UI.fmtWon(r.dailyWage)}</span></div>
      <div class="breakdown-row"><span class="br-label">1일 근로소득공제</span><span class="br-value">- ${UI.fmtWon(Math.min(r.deduction, r.dailyWage))}</span></div>
      <div class="breakdown-row"><span class="br-label">1일 공제 후 소득</span><span class="br-value">${UI.fmtWon(r.taxablePerDay)}</span></div>
      <div class="breakdown-row"><span class="br-label">1일 소득세 계산액 (징수 전)</span><span class="br-value">${UI.fmtWon(r.assessedPerDay)}</span></div>
      <div class="section-divider"><span>${label}</span></div>
      <div class="breakdown-row"><span class="br-label">근무일수</span><span class="br-value">${UI.fmtNum(r.workDays)}일</span></div>
      <div class="breakdown-row"><span class="br-label">총 급여</span><span class="br-value">${UI.fmtWon(r.monthlyGross)}</span></div>
      <div class="breakdown-row"><span class="br-label">원천징수 소득세 합계</span><span class="br-value">${UI.fmtWon(r.monthlyIncomeTax)}</span></div>
      <div class="breakdown-row"><span class="br-label">지방소득세 합계</span><span class="br-value">${UI.fmtWon(r.monthlyLocalTax)}</span></div>
      <div class="breakdown-row"><span class="br-label">세금 합계</span><span class="br-value">${UI.fmtWon(r.monthlyTax)}</span></div>
      <div class="breakdown-row total"><span class="br-label">세금 차감 후 수령액</span><span class="br-value">${UI.fmtWon(r.monthlyTakeHome)}</span></div>
      <div class="notice-box info" style="margin-top:12px">
        <strong>지급 단위별 소액부징수</strong><br>
        1일 공제 후 소득 × 6% × 45%로 소득세 계산액을 구합니다.<br>
        ${r.payment.smallTaxExempt ? '선택한 지급 단위의 소득세 계산액이 1,000원 미만이므로 소득세와 지방소득세를 징수하지 않습니다.' : '선택한 지급 단위의 소득세 계산액이 1,000원 이상이므로 세금을 징수합니다.'}<br>
        지급 단위의 세금은 10원 미만 끝수를 버려 추정합니다. 동일 고용주·같은 일당을 가정하며, 사회보험료·기타 공제는 제외합니다.
      </div>`;
  }

  function init() {
    const view = document.getElementById('view-income-daily-worker');
    if (!view) return;
    const resultContainer = view.querySelector('#dworker-result');
    const wageInput = view.querySelector('#dworker-wage');
    const daysInput = view.querySelector('#dworker-days');
    const modeInput = view.querySelector('#dworker-payment');
    function getParams() {
      return {
        dailyWage: Number(wageInput.value.replace(/,/g, '')),
        workDays: Number(daysInput.value),
        paymentMode: modeInput.value,
      };
    }
    const doCalc = UI.debounce(() => renderResult(calculate(getParams()), resultContainer), 200);
    view.querySelectorAll('input').forEach(el => el.addEventListener('input', doCalc));
    modeInput.addEventListener('change', doCalc);
    wageInput.addEventListener('input', () => {
      const raw = wageInput.value.replace(/[^0-9]/g, '');
      if (!raw) { wageInput.value = ''; return; }
      const cursor = wageInput.selectionStart;
      const oldLen = wageInput.value.length;
      wageInput.value = Number(raw).toLocaleString('ko-KR');
      const next = cursor + wageInput.value.length - oldLen;
      wageInput.setSelectionRange(next, next);
    });
    view.querySelector('#dworker-copy').addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r) return;
      const rows = [
        { label: '일당', value: UI.fmtWon(r.dailyWage) },
        { label: '근무일수', value: UI.fmtNum(r.workDays) + '일' },
        { label: '지급 방식', value: r.paymentMode === 'daily' ? '매일 지급' : '일괄 지급' },
        { label: '세금 합계', value: UI.fmtWon(r.monthlyTax) },
        { label: '세금 차감 후 수령액 (사회보험료 제외)', value: UI.fmtWon(r.monthlyTakeHome) },
      ];
      await UI.copyText(UI.formatResultForCopy('일용직 소득세', rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#dworker-reset').addEventListener('click', () => {
      wageInput.value = '';
      daysInput.value = '1';
      modeInput.value = 'combined';
      renderResult(null, resultContainer);
    });
    doCalc();
  }
  return { init, calculate };
})();
