/* ===== 일용직 소득세 계산기 ===== */
const CalcDailyWorker = (() => {

  // 일용근로소득 공제: 15만원
  const DAILY_DEDUCTION = 150000;
  // 세율: 6%
  const TAX_RATE = 0.06;
  // 세액공제: 55%
  const TAX_CREDIT_RATE = 0.55;

  function calculate(params) {
    const { dailyWage, workDays } = params;

    if (!dailyWage || dailyWage <= 0) return null;

    // 1일 기준 계산
    const taxablePerDay = Math.max(dailyWage - DAILY_DEDUCTION, 0);
    const taxPerDay = Math.floor(taxablePerDay * TAX_RATE);
    const creditPerDay = Math.floor(taxPerDay * TAX_CREDIT_RATE);
    const incomeTaxPerDay = taxPerDay - creditPerDay;
    const localTaxPerDay = Math.floor(incomeTaxPerDay * 0.1);
    const totalTaxPerDay = incomeTaxPerDay + localTaxPerDay;
    const takeHomePerDay = dailyWage - totalTaxPerDay;

    // 월 기준 (workDays일)
    const days = workDays || 1;
    const monthlyGross = dailyWage * days;
    const monthlyTax = totalTaxPerDay * days;
    const monthlyTakeHome = monthlyGross - monthlyTax;

    return {
      dailyWage,
      workDays: days,
      deduction: DAILY_DEDUCTION,
      taxablePerDay,
      taxPerDay,
      creditPerDay,
      incomeTaxPerDay,
      localTaxPerDay,
      totalTaxPerDay,
      takeHomePerDay,
      monthlyGross,
      monthlyTax,
      monthlyTakeHome,
      effectiveRate: dailyWage > 0 ? (totalTaxPerDay / dailyWage * 100) : 0,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">👷</div>일당을 입력해주세요</div>`;
      return;
    }

    const {
      dailyWage, workDays, deduction, taxablePerDay,
      taxPerDay, creditPerDay, incomeTaxPerDay,
      localTaxPerDay, totalTaxPerDay, takeHomePerDay,
      monthlyGross, monthlyTax, monthlyTakeHome, effectiveRate,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">일용직 소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">일당</span>
        <span class="br-value">${UI.fmtWon(dailyWage)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">근로소득공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(Math.min(deduction, dailyWage))}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준 (1일)</span>
        <span class="br-value">${UI.fmtWon(taxablePerDay)}</span>
      </div>
      ${taxablePerDay > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">산출세액 (6%)</span>
        <span class="br-value">${UI.fmtWon(taxPerDay)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">근로소득세액공제 (55%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(creditPerDay)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득세 (1일)</span>
        <span class="br-value">${UI.fmtWon(incomeTaxPerDay)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(localTaxPerDay)}</span>
      </div>` : ''}
      <div class="breakdown-row" style="font-weight:600">
        <span class="br-label">1일 원천징수 합계</span>
        <span class="br-value">${UI.fmtWon(totalTaxPerDay)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">1일 실수령액</span>
        <span class="br-value">${UI.fmtWon(takeHomePerDay)}</span>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin:8px 0">
        실효세율: <strong>${effectiveRate.toFixed(2)}%</strong>
        ${taxablePerDay === 0 ? ' (일 15만원 이하 비과세)' : ''}
      </div>

      ${workDays > 1 ? `
      <div class="section-divider"><span>${workDays}일 근무 시</span></div>
      <div class="breakdown-row">
        <span class="br-label">총 급여</span>
        <span class="br-value">${UI.fmtWon(monthlyGross)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">원천징수 합계</span>
        <span class="br-value" style="color:var(--danger)">- ${UI.fmtWon(monthlyTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">실수령액</span>
        <span class="br-value">${UI.fmtWon(monthlyTakeHome)}</span>
      </div>` : ''}

      <div class="notice-box info" style="margin-top:12px">
        <strong>일용근로소득 과세 구조</strong><br>
        일당 - 15만원(공제) → × 6%(세율) → × 45%(= 55% 공제 후) → 소득세<br>
        일당 15만원 이하는 <strong>세금 없음</strong> (비과세)
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-daily-worker');
    if (!view) return;

    const resultContainer = view.querySelector('#dworker-result');

    function getParams() {
      const getNum = id => {
        const el = view.querySelector(`#${id}`);
        if (!el) return 0;
        return parseFloat(el.value.replace(/,/g, '')) || 0;
      };
      return {
        dailyWage: getNum('dworker-wage'),
        workDays: getNum('dworker-days') || 1,
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('input', doCalc));

    // 금액 포맷팅
    const wageInput = view.querySelector('#dworker-wage');
    if (wageInput) {
      wageInput.addEventListener('input', () => {
        const raw = wageInput.value.replace(/,/g, '').replace(/[^0-9]/g, '');
        if (raw) {
          const cursor = wageInput.selectionStart;
          const oldLen = wageInput.value.length;
          wageInput.value = Number(raw).toLocaleString();
          const newLen = wageInput.value.length;
          wageInput.setSelectionRange(cursor + (newLen - oldLen), cursor + (newLen - oldLen));
        }
      });
    }

    const btnCopy = view.querySelector('#dworker-copy');
    const btnReset = view.querySelector('#dworker-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '일당', value: UI.fmtWon(result.dailyWage) },
          { label: '원천징수', value: UI.fmtWon(result.totalTaxPerDay) },
          { label: '실수령액', value: UI.fmtWon(result.takeHomePerDay) },
        ];
        await UI.copyText(UI.formatResultForCopy('일용직 소득세', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.value = '');
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
