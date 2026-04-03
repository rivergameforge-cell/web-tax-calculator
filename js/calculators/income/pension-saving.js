/* ===== 연금저축·IRP 세액공제 계산기 (2026년 기준) ===== */
const CalcPensionSaving = (() => {

  // 세액공제 한도
  // 연금저축: 최대 600만원 (50세 이상도 동일)
  // IRP 포함 합산 한도: 최대 900만원
  const PENSION_LIMIT = 6_000_000;
  const TOTAL_LIMIT   = 9_000_000;

  // 공제율: 총급여 5,500만원 이하 16.5%, 초과 13.2%
  const HIGH_RATE = 0.165;
  const LOW_RATE  = 0.132;
  const SALARY_THRESHOLD = 55_000_000;

  function calculate(params) {
    const { annualSalary, pensionAmount, irpAmount } = params;
    if ((!pensionAmount && !irpAmount) || annualSalary <= 0) return null;

    const pension = Math.max(0, pensionAmount || 0);
    const irp = Math.max(0, irpAmount || 0);

    // 연금저축 공제 대상: 최대 600만원
    const pensionEligible = Math.min(pension, PENSION_LIMIT);

    // IRP 공제 대상: 연금저축+IRP 합산 900만원 한도에서 연금저축분 차감
    const irpEligible = Math.min(irp, TOTAL_LIMIT - pensionEligible);

    // 합산 공제 대상액
    const totalEligible = pensionEligible + irpEligible;

    // 초과 납입액 (공제 못 받는 금액)
    const pensionExcess = pension - pensionEligible;
    const irpExcess = irp - irpEligible;
    const totalExcess = pensionExcess + irpExcess;

    // 공제율 결정
    const rate = annualSalary <= SALARY_THRESHOLD ? HIGH_RATE : LOW_RATE;
    const rateLabel = annualSalary <= SALARY_THRESHOLD ? '16.5%' : '13.2%';

    // 세액공제 금액
    const pensionCredit = Math.floor(pensionEligible * rate);
    const irpCredit = Math.floor(irpEligible * rate);
    const totalCredit = Math.floor(totalEligible * rate);

    // 월 환산
    const monthlyCredit = Math.floor(totalCredit / 12);

    // 최대 공제 시뮬레이션
    const maxTotalEligible = TOTAL_LIMIT;
    const maxCredit = Math.floor(maxTotalEligible * rate);
    const remainingRoom = Math.max(0, TOTAL_LIMIT - pension - irp);

    return {
      annualSalary, pension, irp,
      pensionEligible, irpEligible, totalEligible,
      pensionExcess, irpExcess, totalExcess,
      rate, rateLabel,
      pensionCredit, irpCredit, totalCredit,
      monthlyCredit,
      maxCredit, remainingRoom,
    };
  }

  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏦</div>
          연봉과 납입액을 입력해주세요
        </div>`;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">세액공제 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">총급여 (연봉)</span>
        <span class="br-value">${UI.fmtWon(r.annualSalary)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">적용 공제율</span>
        <span class="br-value" style="font-weight:700;color:var(--accent)">${r.rateLabel}</span>
      </div>

      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 연금저축</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">납입액</span>
        <span class="br-value">${UI.fmtWon(r.pension)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">공제 대상액 (한도 600만원)</span>
        <span class="br-value">${UI.fmtWon(r.pensionEligible)}</span>
      </div>
      ${r.pensionExcess > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label" style="color:var(--danger)">한도 초과 (공제 불가)</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(r.pensionExcess)}</span>
      </div>` : ''}
      <div class="breakdown-row indent">
        <span class="br-label" style="color:var(--success)">세액공제 (${r.rateLabel})</span>
        <span class="br-value" style="color:var(--success);font-weight:700">${UI.fmtWon(r.pensionCredit)}</span>
      </div>

      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 IRP (개인형퇴직연금)</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">납입액</span>
        <span class="br-value">${UI.fmtWon(r.irp)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">공제 대상액 (합산 900만원 한도)</span>
        <span class="br-value">${UI.fmtWon(r.irpEligible)}</span>
      </div>
      ${r.irpExcess > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label" style="color:var(--danger)">한도 초과 (공제 불가)</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(r.irpExcess)}</span>
      </div>` : ''}
      <div class="breakdown-row indent">
        <span class="br-label" style="color:var(--success)">세액공제 (${r.rateLabel})</span>
        <span class="br-value" style="color:var(--success);font-weight:700">${UI.fmtWon(r.irpCredit)}</span>
      </div>

      <div class="breakdown-row total" style="margin-top:12px">
        <span class="br-label">총 세액공제</span>
        <span class="br-value">${UI.fmtWon(r.totalCredit)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">월 환산 절세 효과</span>
        <span class="br-value">약 ${UI.fmtWon(r.monthlyCredit)}/월</span>
      </div>
      ${r.remainingRoom > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--text-muted)">추가 납입 가능 (공제 한도까지)</span>
        <span class="br-value" style="color:var(--text-muted)">${UI.fmtWon(r.remainingRoom)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--text-muted)">최대 공제 시 (900만원 납입)</span>
        <span class="br-value" style="color:var(--text-muted)">${UI.fmtWon(r.maxCredit)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-pension-saving');
    if (!view) return;

    const resultContainer = view.querySelector('#ps-result');
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      return {
        annualSalary: getVal('ps-salary'),
        pensionAmount: getVal('ps-pension'),
        irpAmount: getVal('ps-irp'),
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

    view.querySelector('#ps-copy')?.addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r) return;
      const rows = [
        { label: '총급여', value: UI.fmtWon(r.annualSalary) },
        { label: '연금저축 공제', value: UI.fmtWon(r.pensionCredit) },
        { label: 'IRP 공제', value: UI.fmtWon(r.irpCredit) },
        { label: '총 세액공제', value: UI.fmtWon(r.totalCredit) },
      ];
      await UI.copyText(UI.formatResultForCopy('연금저축·IRP 세액공제', rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#ps-print')?.addEventListener('click', () => UI.printCalc());
    view.querySelector('#ps-reset')?.addEventListener('click', () => {
      view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
      renderResult(null, resultContainer);
    });

    doCalc();
  }

  return { init };
})();
