/* ===== 손 없는 날 계산기 ===== */
const CalcNoSonDay = (() => {

  // 음력→양력 변환을 위한 간이 데이터
  // 손 없는 날: 음력 기준 매월 1일(해), 2일(해), 11일(불), 12일(불), 21일(수), 22일(수)
  // 손(煞): 이사·개업·결혼 등에 방해하는 귀신이 쉬는 날
  // 음력 날짜 끝자리: 1,2 → 동, 3,4 → 남, 5,6 → 서, 7,8 → 북, 9,0 → 없음(손 없는 날)

  // 정확한 음력-양력 변환은 복잡하므로 2026년 데이터를 하드코딩
  // 음력 매월 9, 10, 19, 20, 29, 30일이 손 없는 날

  const NO_SON_DAYS_2026 = [
    // 1월
    { solar: '2026-01-07', lunar: '11/18(음)', desc: '손 없는 날' },
    { solar: '2026-01-17', lunar: '11/28(음)', desc: '손 없는 날' },
    { solar: '2026-01-18', lunar: '11/29(음)', desc: '손 없는 날' },
    { solar: '2026-01-19', lunar: '11/30(음)', desc: '손 없는 날' },
    { solar: '2026-01-27', lunar: '12/09(음)', desc: '손 없는 날' },
    { solar: '2026-01-28', lunar: '12/10(음)', desc: '손 없는 날' },
    // 2월
    { solar: '2026-02-06', lunar: '12/19(음)', desc: '손 없는 날' },
    { solar: '2026-02-07', lunar: '12/20(음)', desc: '손 없는 날' },
    { solar: '2026-02-15', lunar: '12/28(음)', desc: '손 없는 날' },
    { solar: '2026-02-16', lunar: '12/29(음)', desc: '손 없는 날' },
    { solar: '2026-02-25', lunar: '01/09(음)', desc: '손 없는 날' },
    { solar: '2026-02-26', lunar: '01/10(음)', desc: '손 없는 날' },
    // 3월
    { solar: '2026-03-07', lunar: '01/19(음)', desc: '손 없는 날' },
    { solar: '2026-03-08', lunar: '01/20(음)', desc: '손 없는 날' },
    { solar: '2026-03-17', lunar: '01/29(음)', desc: '손 없는 날' },
    { solar: '2026-03-18', lunar: '01/30(음)', desc: '손 없는 날' },
    { solar: '2026-03-27', lunar: '02/09(음)', desc: '손 없는 날' },
    { solar: '2026-03-28', lunar: '02/10(음)', desc: '손 없는 날' },
    // 4월
    { solar: '2026-04-05', lunar: '02/19(음)', desc: '손 없는 날' },
    { solar: '2026-04-06', lunar: '02/20(음)', desc: '손 없는 날' },
    { solar: '2026-04-15', lunar: '02/29(음)', desc: '손 없는 날' },
    { solar: '2026-04-16', lunar: '02/30(음)', desc: '손 없는 날' },
    { solar: '2026-04-25', lunar: '03/09(음)', desc: '손 없는 날' },
    { solar: '2026-04-26', lunar: '03/10(음)', desc: '손 없는 날' },
    // 5월
    { solar: '2026-05-05', lunar: '03/19(음)', desc: '손 없는 날' },
    { solar: '2026-05-06', lunar: '03/20(음)', desc: '손 없는 날' },
    { solar: '2026-05-15', lunar: '03/29(음)', desc: '손 없는 날' },
    { solar: '2026-05-16', lunar: '03/30(음)', desc: '손 없는 날' },
    { solar: '2026-05-24', lunar: '04/09(음)', desc: '손 없는 날' },
    { solar: '2026-05-25', lunar: '04/10(음)', desc: '손 없는 날' },
    // 6월
    { solar: '2026-06-03', lunar: '04/19(음)', desc: '손 없는 날' },
    { solar: '2026-06-04', lunar: '04/20(음)', desc: '손 없는 날' },
    { solar: '2026-06-13', lunar: '04/29(음)', desc: '손 없는 날' },
    { solar: '2026-06-14', lunar: '04/30(음)', desc: '손 없는 날' },
    { solar: '2026-06-23', lunar: '05/09(음)', desc: '손 없는 날' },
    { solar: '2026-06-24', lunar: '05/10(음)', desc: '손 없는 날' },
    // 7월
    { solar: '2026-07-03', lunar: '05/19(음)', desc: '손 없는 날' },
    { solar: '2026-07-04', lunar: '05/20(음)', desc: '손 없는 날' },
    { solar: '2026-07-12', lunar: '05/29(음)', desc: '손 없는 날' },
    { solar: '2026-07-13', lunar: '05/30(음)', desc: '손 없는 날' },
    { solar: '2026-07-22', lunar: '06/09(음)', desc: '손 없는 날' },
    { solar: '2026-07-23', lunar: '06/10(음)', desc: '손 없는 날' },
    // 8월
    { solar: '2026-08-01', lunar: '06/19(음)', desc: '손 없는 날' },
    { solar: '2026-08-02', lunar: '06/20(음)', desc: '손 없는 날' },
    { solar: '2026-08-11', lunar: '06/29(음)', desc: '손 없는 날' },
    { solar: '2026-08-12', lunar: '06/30(음)', desc: '손 없는 날' },
    { solar: '2026-08-20', lunar: '07/09(음)', desc: '손 없는 날' },
    { solar: '2026-08-21', lunar: '07/10(음)', desc: '손 없는 날' },
    { solar: '2026-08-30', lunar: '07/19(음)', desc: '손 없는 날' },
    { solar: '2026-08-31', lunar: '07/20(음)', desc: '손 없는 날' },
    // 9월
    { solar: '2026-09-08', lunar: '07/29(음)', desc: '손 없는 날' },
    { solar: '2026-09-09', lunar: '07/30(음)', desc: '손 없는 날' },
    { solar: '2026-09-18', lunar: '08/09(음)', desc: '손 없는 날' },
    { solar: '2026-09-19', lunar: '08/10(음)', desc: '손 없는 날' },
    { solar: '2026-09-28', lunar: '08/19(음)', desc: '손 없는 날' },
    { solar: '2026-09-29', lunar: '08/20(음)', desc: '손 없는 날' },
    // 10월
    { solar: '2026-10-08', lunar: '08/29(음)', desc: '손 없는 날' },
    { solar: '2026-10-09', lunar: '08/30(음)', desc: '손 없는 날' },
    { solar: '2026-10-17', lunar: '09/09(음)', desc: '손 없는 날' },
    { solar: '2026-10-18', lunar: '09/10(음)', desc: '손 없는 날' },
    { solar: '2026-10-27', lunar: '09/19(음)', desc: '손 없는 날' },
    { solar: '2026-10-28', lunar: '09/20(음)', desc: '손 없는 날' },
    // 11월
    { solar: '2026-11-06', lunar: '09/29(음)', desc: '손 없는 날' },
    { solar: '2026-11-07', lunar: '09/30(음)', desc: '손 없는 날' },
    { solar: '2026-11-16', lunar: '10/09(음)', desc: '손 없는 날' },
    { solar: '2026-11-17', lunar: '10/10(음)', desc: '손 없는 날' },
    { solar: '2026-11-26', lunar: '10/19(음)', desc: '손 없는 날' },
    { solar: '2026-11-27', lunar: '10/20(음)', desc: '손 없는 날' },
    // 12월
    { solar: '2026-12-05', lunar: '10/29(음)', desc: '손 없는 날' },
    { solar: '2026-12-06', lunar: '10/30(음)', desc: '손 없는 날' },
    { solar: '2026-12-15', lunar: '11/09(음)', desc: '손 없는 날' },
    { solar: '2026-12-16', lunar: '11/10(음)', desc: '손 없는 날' },
    { solar: '2026-12-25', lunar: '11/19(음)', desc: '손 없는 날' },
    { solar: '2026-12-26', lunar: '11/20(음)', desc: '손 없는 날' },
  ];

  const DAY_NAMES = ['일', '월', '화', '수', '목', '금', '토'];
  // 2026년 공휴일 (설날 2/16-18, 추석 9/24-26, 대체공휴일 포함)
  const HOLIDAYS_2026 = [
    '2026-01-01',                                    // 신정
    '2026-02-16', '2026-02-17', '2026-02-18',        // 설날 (음력 1/1~1/3)
    '2026-03-01', '2026-03-02',                      // 삼일절 + 대체공휴일(월)
    '2026-05-05', '2026-05-24', '2026-05-25',        // 어린이날, 부처님오신날, 대체공휴일(월)
    '2026-06-06',                                    // 현충일
    '2026-08-15', '2026-08-17',                      // 광복절 + 대체공휴일(월)
    '2026-09-24', '2026-09-25', '2026-09-26',        // 추석 (음력 8/14~8/16)
    '2026-10-03', '2026-10-05',                      // 개천절 + 대체공휴일(월)
    '2026-10-09',                                    // 한글날
    '2026-12-25',                                    // 성탄절
  ];

  function isWeekend(dateStr) {
    const d = new Date(dateStr);
    return d.getDay() === 0 || d.getDay() === 6;
  }

  function isHoliday(dateStr) {
    return HOLIDAYS_2026.includes(dateStr);
  }

  function getDayName(dateStr) {
    const d = new Date(dateStr);
    return DAY_NAMES[d.getDay()];
  }

  function formatDate(dateStr) {
    const [y, m, d] = dateStr.split('-');
    return `${parseInt(m)}월 ${parseInt(d)}일 (${getDayName(dateStr)})`;
  }

  function getUpcoming(count) {
    const today = new Date();
    today.setHours(0,0,0,0);
    const todayStr = today.toISOString().slice(0,10);

    return NO_SON_DAYS_2026
      .filter(d => d.solar >= todayStr)
      .slice(0, count);
  }

  function getByMonth(month) {
    const prefix = `2026-${String(month).padStart(2, '0')}`;
    return NO_SON_DAYS_2026.filter(d => d.solar.startsWith(prefix));
  }

  function renderResult(container, month) {
    const days = month === 0 ? NO_SON_DAYS_2026 : getByMonth(month);
    const upcoming = getUpcoming(3);

    let upcomingHTML = '';
    if (upcoming.length > 0) {
      upcomingHTML = `
        <div class="breakdown-title" style="margin-bottom:8px">다가오는 손 없는 날</div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px">
          ${upcoming.map(d => {
            const weekend = isWeekend(d.solar);
            const holiday = isHoliday(d.solar);
            const special = weekend || holiday;
            return `<div style="background:${special ? 'var(--danger-light)' : 'var(--accent-light)'};
              border:1px solid ${special ? 'var(--danger)' : 'var(--accent-border)'};
              border-radius:10px;padding:10px 14px;font-size:14px;font-weight:600;
              color:${special ? 'var(--danger)' : 'var(--text-accent)'}">
              ${formatDate(d.solar)}${weekend ? ' (주말)' : ''}${holiday ? ' (공휴일)' : ''}
            </div>`;
          }).join('')}
        </div>
      `;
    }

    const monthLabel = month === 0 ? '전체' : `${month}월`;
    container.innerHTML = `
      ${upcomingHTML}
      <div class="breakdown-title">${monthLabel} 손 없는 날 목록</div>
      ${days.length === 0 ? '<div style="padding:20px;text-align:center;color:var(--text-muted)">해당 월에 데이터가 없습니다</div>' : `
      <table class="info-table">
        <thead>
          <tr><th>양력 날짜</th><th>음력</th><th>요일</th><th>비고</th></tr>
        </thead>
        <tbody>
          ${days.map(d => {
            const weekend = isWeekend(d.solar);
            const holiday = isHoliday(d.solar);
            const [y, m, dd] = d.solar.split('-');
            const rowStyle = weekend || holiday ? 'color:var(--danger)' : '';
            return `<tr style="${rowStyle}">
              <td>${parseInt(m)}월 ${parseInt(dd)}일</td>
              <td>${d.lunar}</td>
              <td>${getDayName(d.solar)}</td>
              <td>${weekend ? '주말' : ''}${holiday ? '공휴일' : ''}${!weekend && !holiday ? '-' : ''}</td>
            </tr>`;
          }).join('')}
        </tbody>
      </table>`}
    `;
  }

  function init() {
    const view = document.getElementById('view-other-no-son-day');
    if (!view) return;

    const resultContainer = view.querySelector('#noson-result');
    const monthSelect = view.querySelector('#noson-month');

    if (monthSelect && resultContainer) {
      monthSelect.addEventListener('change', () => {
        renderResult(resultContainer, parseInt(monthSelect.value));
      });
      // 초기 렌더링: 현재 월
      const currentMonth = new Date().getMonth() + 1;
      monthSelect.value = currentMonth;
      renderResult(resultContainer, currentMonth);
    }
  }

  return { init };
})();
