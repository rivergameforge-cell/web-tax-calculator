/* ===== 기타소득세 계산기 ===== */
const CalcOtherIncome = (() => {

  // 기타소득 필요경비율
  const EXPENSE_RATES = {
    general: 0.60,     // 일반 기타소득 60%
    lecture: 0.60,     // 강연료 60%  (2025~ 실제 80%→60% 개정됨)
    royalty: 0.60,     // 원고료 60%
    prize: 0.80,       // 서화·골동품 양도 80%
    lottery: 0,        // 복권·당첨금 0%
  };

  // 복권 당첨금 세율
  const LOTTERY_EXEMPT = 2000000;     // 200만원 이하 비과세 (2023년~)
  const LOTTERY_THRESHOLD = 300000000; // 3억원
  const LOTTERY_RATE_LOW = 0.20;   // 3억 이하 20%
  const LOTTERY_RATE_HIGH = 0.30;  // 3억 초과 30%

  function calculate(params) {
    const { grossIncome, incomeType, isLottery } = params;

    if (!grossIncome || grossIncome <= 0) return null;

    if (isLottery) {
      // 복권·당첨금 계산 (200만원 이하 비과세)
      const taxableAmount = Math.max(0, grossIncome - LOTTERY_EXEMPT);
      let incomeTax = 0;
      if (taxableAmount > 0) {
        if (taxableAmount <= LOTTERY_THRESHOLD) {
          incomeTax = Math.floor(taxableAmount * LOTTERY_RATE_LOW);
        } else {
          incomeTax = Math.floor(LOTTERY_THRESHOLD * LOTTERY_RATE_LOW)
                    + Math.floor((taxableAmount - LOTTERY_THRESHOLD) * LOTTERY_RATE_HIGH);
        }
      }
      const localTax = Math.floor(incomeTax * 0.1);
      const totalTax = incomeTax + localTax;
      const takeHome = grossIncome - totalTax;

      return {
        isLottery: true,
        grossIncome,
        expense: 0,
        expenseRate: 0,
        taxableIncome: taxableAmount,
        exemptAmount: Math.min(grossIncome, LOTTERY_EXEMPT),
        incomeTax,
        localTax,
        totalTax,
        takeHome,
        effectiveRate: grossIncome > 0 ? (totalTax / grossIncome * 100) : 0,
      };
    }

    // 일반 기타소득
    const expenseRate = EXPENSE_RATES[incomeType] || 0.60;
    const expense = Math.floor(grossIncome * expenseRate);
    const taxableIncome = grossIncome - expense;

    // 기타소득금액이 연 300만원 이하면 분리과세 선택 가능
    // 원천징수: 20% + 지방소득세 2% = 22%
    const incomeTax = Math.floor(taxableIncome * 0.20);
    const localTax = Math.floor(incomeTax * 0.10);
    const totalTax = incomeTax + localTax;
    const takeHome = grossIncome - totalTax;

    // 종합과세 vs 분리과세 안내
    const canSeparateTax = taxableIncome <= 3000000; // 연 300만원 이하

    return {
      isLottery: false,
      grossIncome,
      incomeType,
      expenseRate,
      expense,
      taxableIncome,
      incomeTax,
      localTax,
      totalTax,
      takeHome,
      effectiveRate: (totalTax / grossIncome * 100),
      canSeparateTax,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">💰</div>기타소득 금액을 입력해주세요</div>`;
      return;
    }

    const {
      isLottery, grossIncome, expense, expenseRate,
      taxableIncome, incomeTax, localTax, totalTax,
      takeHome, effectiveRate, canSeparateTax,
    } = result;

    const typeLabels = {
      general: '일반 기타소득',
      lecture: '강연료',
      royalty: '원고료',
      prize: '서화·골동품',
      lottery: '복권·당첨금',
    };

    container.innerHTML = `
      <div class="breakdown-title">기타소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">소득 유형</span>
        <span class="br-value">${isLottery ? '복권·당첨금' : typeLabels[result.incomeType] || '일반'}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">총 수입금액</span>
        <span class="br-value">${UI.fmtWon(grossIncome)}</span>
      </div>
      ${!isLottery ? `
      <div class="breakdown-row">
        <span class="br-label">필요경비 (${(expenseRate * 100).toFixed(0)}%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(expense)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">기타소득금액 (과세표준)</span>
        <span class="br-value">${UI.fmtWon(taxableIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득세 (${isLottery ? (grossIncome > 300000000 ? '20%+30%' : '20%') : '20%'})</span>
        <span class="br-value">${UI.fmtWon(incomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(localTax)}</span>
      </div>
      <div class="breakdown-row" style="font-weight:600">
        <span class="br-label">원천징수 합계</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(totalTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">실수령액</span>
        <span class="br-value">${UI.fmtWon(takeHome)}</span>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin:8px 0">
        실효세율: <strong>${effectiveRate.toFixed(2)}%</strong>
      </div>

      ${!isLottery && canSeparateTax !== undefined ? `
      <div class="notice-box ${canSeparateTax ? 'info' : 'warning'}" style="margin-top:12px">
        ${canSeparateTax
          ? '<strong>분리과세 가능:</strong> 기타소득금액이 연 300만원 이하이므로 분리과세(22%)를 선택할 수 있습니다. 종합과세 신고 불필요.'
          : '<strong>종합과세 대상:</strong> 기타소득금액이 연 300만원을 초과하면 다른 소득과 합산하여 종합소득세 신고를 해야 합니다.'}
      </div>` : ''}

      ${isLottery ? `
      <div class="notice-box info" style="margin-top:12px">
        <strong>복권 당첨금 과세:</strong><br>
        • 200만원 이하: 비과세<br>
        • 3억원 이하: 20% (+ 지방세 2% = 22%)<br>
        • 3억원 초과분: 30% (+ 지방세 3% = 33%)
      </div>` : ''}
    `;
  }

  function init() {
    const view = document.getElementById('view-income-other-income');
    if (!view) return;

    const resultContainer = view.querySelector('#oincome-result');
    const lotteryCheck = view.querySelector('#oincome-lottery');
    const typeSection = view.querySelector('#oincome-type-section');

    function getParams() {
      const getNum = id => {
        const el = view.querySelector(`#${id}`);
        if (!el) return 0;
        return parseFloat(el.value.replace(/,/g, '')) || 0;
      };
      const getCheck = id => view.querySelector(`#${id}`)?.checked || false;

      return {
        grossIncome: getNum('oincome-amount'),
        incomeType: view.querySelector('#oincome-type')?.value || 'general',
        isLottery: getCheck('oincome-lottery'),
      };
    }

    // 복권 체크 시 소득유형 숨기기
    if (lotteryCheck && typeSection) {
      lotteryCheck.addEventListener('change', () => {
        typeSection.style.display = lotteryCheck.checked ? 'none' : '';
        doCalc();
      });
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    // 금액 포맷팅
    const amountInput = view.querySelector('#oincome-amount');
    if (amountInput) {
      amountInput.addEventListener('input', () => {
        const raw = amountInput.value.replace(/,/g, '').replace(/[^0-9]/g, '');
        if (raw) {
          const cursor = amountInput.selectionStart;
          const oldLen = amountInput.value.length;
          amountInput.value = Number(raw).toLocaleString();
          const newLen = amountInput.value.length;
          amountInput.setSelectionRange(cursor + (newLen - oldLen), cursor + (newLen - oldLen));
        }
      });
    }

    const btnCopy = view.querySelector('#oincome-copy');
    const btnReset = view.querySelector('#oincome-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '수입금액', value: UI.fmtWon(result.grossIncome) },
          { label: '원천징수', value: UI.fmtWon(result.totalTax) },
          { label: '실수령액', value: UI.fmtWon(result.takeHome) },
        ];
        await UI.copyText(UI.formatResultForCopy('기타소득세', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.value = '');
        if (lotteryCheck) lotteryCheck.checked = false;
        if (typeSection) typeSection.style.display = '';
        const typeSelect = view.querySelector('#oincome-type');
        if (typeSelect) typeSelect.value = 'general';
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
