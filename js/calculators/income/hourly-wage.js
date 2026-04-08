/* ===== 시급 계산기 ===== */
const CalcHourlyWage = (() => {

  // 2026년 최저시급
  const MIN_WAGE_2026 = 10_320;

  function calculate(params) {
    const {
      hourlyWage,
      hoursPerDay,
      daysPerWeek,
      includeWeeklyHoliday, // 주휴수당 포함
    } = params;

    if (!hourlyWage || hourlyWage <= 0) return null;

    const dailyWage = hourlyWage * hoursPerDay;
    const weeklyWorkHours = hoursPerDay * daysPerWeek;

    // 주휴수당: 주 15시간 이상 근무 시, (1일 소정근로시간) × 시급
    // 주휴시간 = (주 소정근로시간 / 40) × 8 (최대 8시간)
    let weeklyHolidayHours = 0;
    let weeklyHolidayPay = 0;
    if (includeWeeklyHoliday && weeklyWorkHours >= 15) {
      weeklyHolidayHours = Math.min((weeklyWorkHours / 40) * 8, 8);
      weeklyHolidayPay = Math.floor(hourlyWage * weeklyHolidayHours);
    }

    const weeklyWage = (hourlyWage * weeklyWorkHours) + weeklyHolidayPay;

    // 월급: 월 소정근로시간 = (주 소정근로시간 + 주휴시간) × (365/12/7)
    const weeklyTotalHours = weeklyWorkHours + weeklyHolidayHours;
    const monthlyHours = weeklyTotalHours * (365 / 12 / 7);
    const monthlyWage = Math.floor(hourlyWage * monthlyHours);

    const annualWage = monthlyWage * 12;

    const isAboveMinWage = hourlyWage >= MIN_WAGE_2026;

    return {
      hourlyWage,
      hoursPerDay,
      daysPerWeek,
      dailyWage,
      weeklyWorkHours,
      weeklyHolidayHours: Math.round(weeklyHolidayHours * 100) / 100,
      weeklyHolidayPay,
      weeklyWage,
      monthlyHours: Math.round(monthlyHours * 10) / 10,
      monthlyWage,
      annualWage,
      isAboveMinWage,
      includeWeeklyHoliday,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">⏰</div>시급을 입력해주세요</div>`;
      return;
    }

    const {
      hourlyWage, hoursPerDay, daysPerWeek, dailyWage,
      weeklyWorkHours, weeklyHolidayHours, weeklyHolidayPay,
      weeklyWage, monthlyHours, monthlyWage, annualWage,
      isAboveMinWage, includeWeeklyHoliday,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">시급 환산 결과</div>
      <div class="notice-box ${isAboveMinWage ? 'info' : 'danger'}" style="margin-bottom:12px">
        ${isAboveMinWage
          ? `2026년 최저시급 <strong>${UI.fmtNum(MIN_WAGE_2026)}원</strong> 이상입니다.`
          : `<strong>최저시급 미달!</strong> 2026년 최저시급은 <strong>${UI.fmtNum(MIN_WAGE_2026)}원</strong>입니다.`}
      </div>
      <div class="breakdown-row">
        <span class="br-label">시급</span>
        <span class="br-value">${UI.fmtWon(hourlyWage)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">일급 (${hoursPerDay}시간)</span>
        <span class="br-value">${UI.fmtWon(dailyWage)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">주 근로시간</span>
        <span class="br-value">${weeklyWorkHours}시간</span>
      </div>
      ${includeWeeklyHoliday && weeklyHolidayPay > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">주휴수당 (${weeklyHolidayHours}시간)</span>
        <span class="br-value" style="color:var(--success)">+ ${UI.fmtWon(weeklyHolidayPay)}</span>
      </div>` : ''}
      <div class="breakdown-row" style="font-weight:600">
        <span class="br-label">주급${includeWeeklyHoliday ? ' (주휴 포함)' : ''}</span>
        <span class="br-value">${UI.fmtWon(weeklyWage)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">월 환산시간</span>
        <span class="br-value">${monthlyHours}시간</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">월급${includeWeeklyHoliday ? ' (주휴 포함)' : ''}</span>
        <span class="br-value">${UI.fmtWon(monthlyWage)}</span>
      </div>
      <div class="breakdown-row total" style="margin-top:4px">
        <span class="br-label">연봉 환산</span>
        <span class="br-value">${UI.fmtWon(annualWage)}</span>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:8px">
        * 월 환산: (주 근로시간 + 주휴시간) × 365 ÷ 12 ÷ 7<br>
        * 4대보험·세금 공제 전 금액입니다
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-hourly-wage');
    if (!view) return;

    const resultContainer = view.querySelector('#hwage-result');

    function getParams() {
      const getNum = id => parseFloat(view.querySelector(`#${id}`)?.value?.replace(/,/g, '') || '0') || 0;
      const getCheck = id => view.querySelector(`#${id}`)?.checked || false;

      return {
        hourlyWage: getNum('hwage-wage'),
        hoursPerDay: getNum('hwage-hours') || 8,
        daysPerWeek: getNum('hwage-days') || 5,
        includeWeeklyHoliday: getCheck('hwage-weekly-holiday'),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    // 최저시급 버튼
    const btnMinWage = view.querySelector('#hwage-min-wage-btn');
    const wageInput = view.querySelector('#hwage-wage');
    if (btnMinWage && wageInput) {
      btnMinWage.addEventListener('click', () => {
        wageInput.value = MIN_WAGE_2026.toLocaleString();
        doCalc();
      });
    }

    // 금액 포맷팅
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

    const btnCopy = view.querySelector('#hwage-copy');
    const btnReset = view.querySelector('#hwage-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '시급', value: UI.fmtWon(result.hourlyWage) },
          { label: '월급', value: UI.fmtWon(result.monthlyWage) },
          { label: '연봉', value: UI.fmtWon(result.annualWage) },
        ];
        await UI.copyText(UI.formatResultForCopy('시급 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.value = '');
        const weeklyCheck = view.querySelector('#hwage-weekly-holiday');
        if (weeklyCheck) weeklyCheck.checked = true;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
