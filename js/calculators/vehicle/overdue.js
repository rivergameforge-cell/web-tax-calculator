/* ===== 자동차세 미납 가산금 계산기 ===== */
const CalcVehicleOverdue = (() => {

  // 가산금: 납부기한 경과 즉시 3%
  const BASE_SURCHARGE_RATE = 0.03;
  // 중가산금: 매월 0.75%, 최대 60개월
  const MONTHLY_RATE = 0.0075;
  const MAX_MONTHS = 60;

  function calcMonthsDiff(dueDate, today) {
    // 체납개월: 납부기한 후 경과 월수 (1개월 미만 절사)
    const due = new Date(dueDate);
    const now = new Date(today);

    if (now <= due) return 0;

    let months = (now.getFullYear() - due.getFullYear()) * 12
               + (now.getMonth() - due.getMonth());

    // 일자가 납기일보다 이전이면 1개월 차감
    if (now.getDate() < due.getDate()) {
      months -= 1;
    }

    return Math.max(0, months);
  }

  function calculate(params) {
    const { tax, dueDate, today } = params;
    if (!tax || tax <= 0 || !dueDate || !today) return null;

    const due = new Date(dueDate);
    const now = new Date(today);

    if (now <= due) {
      return {
        tax,
        dueDate,
        today,
        overdue: false,
        months: 0,
        baseSurcharge: 0,
        additionalMonths: 0,
        additionalSurcharge: 0,
        totalSurcharge: 0,
        grandTotal: tax,
      };
    }

    const months = calcMonthsDiff(dueDate, today);
    const baseSurcharge = Math.floor(tax * BASE_SURCHARGE_RATE);

    // 중가산금: 첫 달은 가산금만, 1개월 초과 시부터 매월 0.75%
    const additionalMonths = Math.min(Math.max(0, months - 1), MAX_MONTHS);
    const additionalSurcharge = Math.floor(tax * MONTHLY_RATE * additionalMonths);

    const totalSurcharge = baseSurcharge + additionalSurcharge;
    const grandTotal = tax + totalSurcharge;

    return {
      tax,
      dueDate,
      today,
      overdue: true,
      months,
      baseSurcharge,
      additionalMonths,
      additionalSurcharge,
      totalSurcharge,
      grandTotal,
    };
  }

  function formatPeriod(months) {
    if (months <= 0) return '미체납';
    const y = Math.floor(months / 12);
    const m = months % 12;
    if (y > 0 && m > 0) return `${y}년 ${m}개월`;
    if (y > 0) return `${y}년`;
    return `${m}개월`;
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🚗</div>
          자동차세와 납부기한을 입력해주세요
        </div>`;
      return;
    }

    if (!result.overdue) {
      container.innerHTML = `
        <div class="breakdown-title">자동차세 가산금 계산 결과</div>
        <div class="breakdown-row">
          <span class="br-label">본세</span>
          <span class="br-value">${UI.fmtWon(result.tax)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">납부기한 미경과</span>
          <span class="br-value" style="color:var(--success)">가산금 없음</span>
        </div>
      `;
      return;
    }

    const {
      tax, months, baseSurcharge,
      additionalMonths, additionalSurcharge,
      totalSurcharge, grandTotal,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">자동차세 가산금 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">본세</span>
        <span class="br-value">${UI.fmtWon(tax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">체납기간</span>
        <span class="br-value">${formatPeriod(months)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">가산금 (3%)</span>
        <span class="br-value">${UI.fmtWon(baseSurcharge)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">중가산금 (${additionalMonths}개월 x 0.75%)</span>
        <span class="br-value">${UI.fmtWon(additionalSurcharge)}</span>
      </div>
      ${additionalMonths >= MAX_MONTHS ? `
      <div class="breakdown-row sub">
        <span class="br-label" style="color:var(--danger);font-size:0.85em">중가산금 상한 (60개월, 45%) 도달</span>
        <span class="br-value"></span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">총 가산금</span>
        <span class="br-value">${UI.fmtWon(totalSurcharge)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">총 납부액</span>
        <span class="br-value">${UI.fmtWon(grandTotal)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-vehicle-overdue');
    if (!view) return;

    const elTax     = view.querySelector('#vod-tax');
    const elDueDate = view.querySelector('#vod-due-date');
    const elToday   = view.querySelector('#vod-today');
    const resultContainer = view.querySelector('#vod-result');
    const btnCopy  = view.querySelector('#vod-copy');
    const btnPrint = view.querySelector('#vod-print');
    const btnReset = view.querySelector('#vod-reset');

    if (elTax) UI.bindNumInput(elTax);

    // Default today to current date
    if (elToday && !elToday.value) {
      const now = new Date();
      elToday.value = now.toISOString().slice(0, 10);
    }

    function getParams() {
      return {
        tax:     UI.parseNum((elTax?.value || '').replace(/,/g, '')),
        dueDate: elDueDate?.value || '',
        today:   elToday?.value || new Date().toISOString().slice(0, 10),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el =>
      el.addEventListener(el.type === 'date' ? 'change' : 'input', doCalc)
    );

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '본세', value: UI.fmtWon(result.tax) },
        ];
        if (result.overdue) {
          rows.push({ label: '체납기간', value: formatPeriod(result.months) });
          rows.push({ label: '가산금 (3%)', value: UI.fmtWon(result.baseSurcharge) });
          rows.push({ label: `중가산금 (${result.additionalMonths}개월 x 0.75%)`, value: UI.fmtWon(result.additionalSurcharge) });
          rows.push({ label: '총 가산금', value: UI.fmtWon(result.totalSurcharge) });
        }
        rows.push({ label: '총 납부액', value: UI.fmtWon(result.grandTotal) });
        await UI.copyText(UI.formatResultForCopy('자동차세 미납 가산금', rows));
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        if (elTax) elTax.value = '';
        if (elDueDate) elDueDate.value = '';
        if (elToday) elToday.value = new Date().toISOString().slice(0, 10);
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
