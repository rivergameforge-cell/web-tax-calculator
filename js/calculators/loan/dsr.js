/* ===== DSR 계산기 ===== */
const CalcDSR = (() => {

  // DSR 규제 한도
  const DSR_LIMITS = {
    bank: 0.40,       // 은행권 40%
    nonbank: 0.50,    // 비은행권 50%
    stress: 0.40,     // 스트레스 DSR (은행) 40%
  };

  // 입력 초기값일 뿐, 지역·상품별 규제 가산금리를 자동 판정하지 않는다.
  const STRESS_RATE_ADD = 1.50;

  function calculate(params) {
    const {
      annualIncome,
      newLoanAmount,
      newLoanRate,
      newLoanPeriodYears,
      newLoanType,        // 'equal-payment' | 'equal-principal' | 'bullet'
      existingAnnualRepay = 0, // 기존 대출 연간 원리금 상환액
      lenderType,          // 'bank' | 'nonbank'
      useStressDSR,        // 스트레스 DSR 적용 여부
      stressRateAdd = STRESS_RATE_ADD,
    } = params;

    if (!Number.isFinite(annualIncome) || annualIncome <= 0) return null;
    if (![newLoanAmount, newLoanRate, newLoanPeriodYears, existingAnnualRepay].every(Number.isFinite)) return null;
    if (newLoanAmount < 0 || newLoanRate < 0 || newLoanRate > 30 || newLoanPeriodYears <= 0 || newLoanPeriodYears > 50 || existingAnnualRepay < 0) return null;
    if (!['equal-payment', 'equal-principal', 'bullet'].includes(newLoanType) || !['bank', 'nonbank'].includes(lenderType)) return null;

    // 신규 대출 연간 원리금 상환액 계산
    const rate = newLoanRate / 100;
    if (!Number.isFinite(stressRateAdd) || stressRateAdd < 0 || stressRateAdd > 10) return null;
    const stressRate = useStressDSR ? (newLoanRate + stressRateAdd) / 100 : rate;
    const monthlyRate = stressRate / 12;
    const totalMonths = newLoanPeriodYears * 12;
    let newAnnualRepay = 0;

    if (newLoanAmount > 0 && totalMonths > 0) {
      if (newLoanType === 'bullet') {
        // 단순 연환산 모형; 금융권 상품별 원금 산정만기와 다를 수 있다.
        newAnnualRepay = newLoanAmount / newLoanPeriodYears + newLoanAmount * stressRate;
      } else if (newLoanType === 'equal-principal') {
        // 원금균등: 첫해 기준 (보수적)
        const monthlyPrincipal = newLoanAmount / totalMonths;
        let firstYearTotal = 0;
        for (let m = 0; m < 12 && m < totalMonths; m++) {
          const remainPrincipal = newLoanAmount - (monthlyPrincipal * m);
          firstYearTotal += monthlyPrincipal + (remainPrincipal * monthlyRate);
        }
        newAnnualRepay = firstYearTotal;
      } else {
        // 원리금균등
        if (monthlyRate > 0) {
          const monthlyPayment = newLoanAmount * monthlyRate * Math.pow(1 + monthlyRate, totalMonths) / (Math.pow(1 + monthlyRate, totalMonths) - 1);
          newAnnualRepay = monthlyPayment * Math.min(12, totalMonths);
        } else {
          newAnnualRepay = (newLoanAmount / totalMonths) * Math.min(12, totalMonths);
        }
      }
    }

    const totalAnnualRepay = Math.floor(newAnnualRepay) + (existingAnnualRepay || 0);
    const dsr = annualIncome > 0 ? totalAnnualRepay / annualIncome : 0;
    const dsrPercent = dsr * 100;

    const dsrLimit = DSR_LIMITS[lenderType] || 0.40;
    const dsrLimitPercent = dsrLimit * 100;

    // 한도 기준 최대 대출가능액 역산 (원리금균등 기준)
    const maxAnnualRepay = (annualIncome * dsrLimit) - (existingAnnualRepay || 0);
    let maxLoanAmount = 0;
    if (maxAnnualRepay > 0 && totalMonths > 0 && monthlyRate > 0) {
      const maxMonthlyPayment = maxAnnualRepay / 12;
      maxLoanAmount = maxMonthlyPayment * (Math.pow(1 + monthlyRate, totalMonths) - 1) / (monthlyRate * Math.pow(1 + monthlyRate, totalMonths));
    } else if (maxAnnualRepay > 0 && totalMonths > 0) {
      maxLoanAmount = maxAnnualRepay * newLoanPeriodYears;
    }

    const isOver = dsr > dsrLimit;

    return {
      annualIncome,
      newAnnualRepay: Math.floor(newAnnualRepay),
      existingAnnualRepay: existingAnnualRepay || 0,
      totalAnnualRepay,
      dsr,
      dsrPercent,
      dsrLimit,
      dsrLimitPercent,
      maxLoanAmount: Math.floor(maxLoanAmount),
      isOver,
      lenderType,
      useStressDSR,
      stressRateAdd,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🏦</div>연소득과 대출 정보를 입력해주세요</div>`;
      return;
    }

    const {
      annualIncome, newAnnualRepay, existingAnnualRepay,
      totalAnnualRepay, dsrPercent, dsrLimitPercent,
      maxLoanAmount, isOver, lenderType, useStressDSR,
    } = result;

    const lenderLabel = lenderType === 'bank' ? '은행권 (40%)' : '비은행권 (50%)';
    const barWidth = Math.min(dsrPercent / dsrLimitPercent * 100, 150);

    container.innerHTML = `
      <div class="breakdown-title">DSR 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">연 소득</span>
        <span class="br-value">${UI.fmtWon(annualIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">신규 대출 연간 상환액</span>
        <span class="br-value">${UI.fmtWon(newAnnualRepay)}</span>
      </div>
      ${existingAnnualRepay > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기존 대출 연간 상환액</span>
        <span class="br-value">${UI.fmtWon(existingAnnualRepay)}</span>
      </div>` : ''}
      <div class="breakdown-row" style="font-weight:600">
        <span class="br-label">총 연간 원리금 상환액</span>
        <span class="br-value">${UI.fmtWon(totalAnnualRepay)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">DSR</span>
        <span class="br-value" style="color:${isOver ? 'var(--danger)' : 'var(--success)'}">${dsrPercent.toFixed(1)}%</span>
      </div>
      <div style="margin:12px 0 8px">
        <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px">
          <span>0%</span>
          <span style="color:${isOver ? 'var(--danger)' : 'var(--text-secondary)'}">규제 한도 ${dsrLimitPercent}%</span>
        </div>
        <div style="background:var(--bg-secondary);border-radius:8px;height:20px;position:relative;overflow:hidden">
          <div style="width:${Math.min(barWidth, 100)}%;height:100%;background:${isOver ? 'var(--danger)' : 'var(--accent)'};border-radius:8px;transition:width 0.3s"></div>
          <div style="position:absolute;left:${100 * dsrLimitPercent / (dsrLimitPercent * 1.5)}%;top:0;height:100%;width:2px;background:var(--text-secondary)"></div>
        </div>
      </div>
      <div class="notice-box ${isOver ? 'danger' : 'info'}" style="margin-top:12px">
        ${isOver
          ? `<strong>DSR 한도 초과!</strong> ${lenderLabel} 기준 DSR ${dsrLimitPercent}%를 초과하여 대출이 어려울 수 있습니다.`
          : `<strong>DSR 여유 있음</strong> ${lenderLabel} 기준 DSR ${dsrLimitPercent}% 이내입니다.`}
        ${useStressDSR ? `<br>입력 스트레스 가산금리 (+${result.stressRateAdd.toFixed(2)}%p)` : ''}
      </div>
      <div class="breakdown-row" style="margin-top:12px;font-weight:600;font-size:15px">
        <span class="br-label">💡 동일 조건 최대 대출가능액</span>
        <span class="br-value" style="color:var(--accent)">${UI.fmtWon(maxLoanAmount)}</span>
      </div>
      <div style="font-size:11px;color:var(--text-muted);margin-top:4px">
        * 원리금균등상환 기준 역산, 실제 한도는 금융기관별로 다를 수 있습니다
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-loan-dsr');
    if (!view) return;

    const resultContainer = view.querySelector('#dsr-result');

    function getParams() {
      const getNum = id => {
        const el = view.querySelector(`#${id}`);
        if (!el) return 0;
        return parseFloat(el.value.replace(/,/g, '')) || 0;
      };
      const getCheck = id => view.querySelector(`#${id}`)?.checked || false;

      return {
        annualIncome: getNum('dsr-income'),
        newLoanAmount: getNum('dsr-loan-amount'),
        newLoanRate: getNum('dsr-loan-rate'),
        newLoanPeriodYears: getNum('dsr-loan-period'),
        newLoanType: view.querySelector('input[name="dsr-repay-type"]:checked')?.value || 'equal-payment',
        existingAnnualRepay: getNum('dsr-existing-repay'),
        lenderType: view.querySelector('input[name="dsr-lender"]:checked')?.value || 'bank',
        useStressDSR: getCheck('dsr-stress'),
        stressRateAdd: parseFloat(view.querySelector('#dsr-stress-rate')?.value || '1.5'),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    // 금액 입력 포맷팅
    const incomeInput = view.querySelector('#dsr-income');
    const loanAmountInput = view.querySelector('#dsr-loan-amount');
    const existingInput = view.querySelector('#dsr-existing-repay');

    [incomeInput, loanAmountInput, existingInput].forEach(input => {
      if (!input) return;
      UI.bindNumInput(input);
    });

    const btnCopy = view.querySelector('#dsr-copy');
    const btnReset = view.querySelector('#dsr-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '연 소득', value: UI.fmtWon(result.annualIncome) },
          { label: 'DSR', value: result.dsrPercent.toFixed(1) + '%' },
          { label: '최대 대출가능액', value: UI.fmtWon(result.maxLoanAmount) },
        ];
        await UI.copyText(UI.formatResultForCopy('DSR 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => {
          if (el.type === 'text') el.value = '';
          else el.value = '';
        });
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        view.querySelector('#dsr-stress-rate').value = String(STRESS_RATE_ADD);
        const bankRadio = view.querySelector('input[name="dsr-lender"][value="bank"]');
        if (bankRadio) bankRadio.checked = true;
        const equalRadio = view.querySelector('input[name="dsr-repay-type"][value="equal-payment"]');
        if (equalRadio) equalRadio.checked = true;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
