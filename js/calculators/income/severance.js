/* ===== 퇴직금 계산기 (2026년 기준) ===== */
const CalcSeverance = (() => {

  function calculate(params) {
    const { startDate, endDate, salary1, salary2, salary3 } = params;
    if (!startDate || !endDate || (!salary1 && !salary2 && !salary3)) return null;

    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start) || isNaN(end) || end <= start) return null;

    // 재직일수
    const totalDays = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (totalDays < 365) return { error: '1년 미만 근무 시 퇴직금 지급 대상이 아닙니다.' };

    const totalYears = totalDays / 365;

    // 최근 3개월 임금 총액
    const s1 = Math.max(0, salary1 || 0);
    const s2 = Math.max(0, salary2 || 0);
    const s3 = Math.max(0, salary3 || 0);
    const totalSalary3m = s1 + s2 + s3;

    // 최근 3개월 일수 (간이 계산: 89일 ~ 92일, 평균 91일 사용)
    // 정확한 계산을 위해 퇴직일 기준 3개월 전 일수 계산
    const threeMonthsAgo = new Date(end);
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const days3m = Math.floor((end - threeMonthsAgo) / (1000 * 60 * 60 * 24));

    // 1일 평균임금
    const dailyAvg = totalSalary3m / days3m;

    // 퇴직금 = 1일 평균임금 × 30일 × (재직일수 / 365)
    const severancePay = Math.floor(dailyAvg * 30 * totalYears);

    // 월 환산
    const monthlyEquiv = Math.floor(severancePay / (totalDays / 30));

    // 근속연수
    const years = Math.floor(totalYears);
    const months = Math.floor((totalDays % 365) / 30);
    const days = totalDays - years * 365 - months * 30;

    return {
      startDate, endDate,
      totalDays, years, months, days,
      salary1: s1, salary2: s2, salary3: s3,
      totalSalary3m,
      days3m,
      dailyAvg: Math.floor(dailyAvg),
      severancePay,
      monthlyEquiv,
    };
  }

  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💼</div>
          입사일, 퇴사일, 최근 3개월 급여를 입력해주세요
        </div>`;
      return;
    }

    if (r.error) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">⚠️</div>
          ${r.error}
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">퇴직금 계산 결과</div>

      <div class="breakdown-row">
        <span class="br-label">입사일</span>
        <span class="br-value">${r.startDate}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">퇴사일</span>
        <span class="br-value">${r.endDate}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">근속기간</span>
        <span class="br-value">${r.years}년 ${r.months}개월 ${r.days}일 (${UI.fmtNum(r.totalDays)}일)</span>
      </div>

      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 평균임금 산정</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">최근 3개월 임금 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalSalary3m)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">최근 3개월 일수</span>
        <span class="br-value">${r.days3m}일</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">1일 평균임금</span>
        <span class="br-value">${UI.fmtWon(r.dailyAvg)}</span>
      </div>

      <div class="breakdown-row total" style="margin-top:12px">
        <span class="br-label">퇴직금</span>
        <span class="br-value">${UI.fmtWon(r.severancePay)}</span>
      </div>

      <div class="notice-box" style="margin-top:16px">
        <strong>계산식:</strong> 1일 평균임금(${UI.fmtWon(r.dailyAvg)}) × 30일 × 근속연수(${(r.totalDays/365).toFixed(2)}년)
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-severance');
    if (!view) return;

    const resultContainer = view.querySelector('#severance-result');
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      return {
        startDate: view.querySelector('#sev-start')?.value || '',
        endDate: view.querySelector('#sev-end')?.value || '',
        salary1: getVal('sev-salary1'),
        salary2: getVal('sev-salary2'),
        salary3: getVal('sev-salary3'),
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

    view.querySelector('#severance-copy')?.addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r || r.error) return;
      const rows = [
        { label: '근속기간', value: `${r.years}년 ${r.months}개월 ${r.days}일` },
        { label: '1일 평균임금', value: UI.fmtWon(r.dailyAvg) },
        { label: '퇴직금', value: UI.fmtWon(r.severancePay) },
      ];
      await UI.copyText(UI.formatResultForCopy('퇴직금 계산', rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#severance-print')?.addEventListener('click', () => UI.printCalc());
    view.querySelector('#severance-reset')?.addEventListener('click', () => {
      view.querySelectorAll('input').forEach(el => el.value = '');
      renderResult(null, resultContainer);
    });

    doCalc();
  }

  return { init };
})();
