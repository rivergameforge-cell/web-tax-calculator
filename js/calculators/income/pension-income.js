/* ===== 연금소득세 계산기 ===== */
const CalcPensionIncome = (() => {

  // 사적연금 연령별 세율 (퇴직연금·연금저축 등)
  const PRIVATE_PENSION_RATES = [
    { minAge: 80, rate: 0.033, label: '80세 이상 (3.3%)' },
    { minAge: 70, rate: 0.044, label: '70~79세 (4.4%)' },
    { minAge: 0,  rate: 0.055, label: '70세 미만 (5.5%)' },
  ];

  // 공적연금(국민연금) 간이세액: 연금소득 간이세액표 간소화
  // 연금소득공제 적용 후 종합과세
  function getPublicPensionDeduction(annualPension) {
    // 2026년 연금소득공제
    if (annualPension <= 3500000) return annualPension; // 350만원 이하 전액
    if (annualPension <= 7000000) return 3500000 + (annualPension - 3500000) * 0.4;
    if (annualPension <= 14000000) return 4900000 + (annualPension - 7000000) * 0.2;
    return Math.min(6300000 + (annualPension - 14000000) * 0.1, 9000000); // 최대 900만원 한도
  }

  // 종합소득세 세율표 (간이)
  const TAX_BRACKETS = [
    { limit: 14000000, rate: 0.06, deduction: 0 },
    { limit: 50000000, rate: 0.15, deduction: 1260000 },
    { limit: 88000000, rate: 0.24, deduction: 5760000 },
    { limit: 150000000, rate: 0.35, deduction: 15440000 },
    { limit: 300000000, rate: 0.38, deduction: 19940000 },
    { limit: 500000000, rate: 0.40, deduction: 25940000 },
    { limit: 1000000000, rate: 0.42, deduction: 35940000 },
    { limit: Infinity, rate: 0.45, deduction: 65940000 },
  ];

  function calcIncomeTax(taxable) {
    if (taxable <= 0) return 0;
    for (const b of TAX_BRACKETS) {
      if (taxable <= b.limit) {
        return Math.floor(taxable * b.rate - b.deduction);
      }
    }
    return 0;
  }

  function calculate(params) {
    const {
      pensionType,      // 'public' | 'private'
      annualPension,    // 연간 연금 수령액
      age,
    } = params;

    if (!annualPension || annualPension <= 0) return null;

    if (pensionType === 'private') {
      // 사적연금: 연 1,500만원 이하 분리과세 가능
      let rate = PRIVATE_PENSION_RATES[2].rate; // 기본 5.5%
      let rateLabel = PRIVATE_PENSION_RATES[2].label;
      for (const r of PRIVATE_PENSION_RATES) {
        if (age >= r.minAge) {
          rate = r.rate;
          rateLabel = r.label;
          break;
        }
      }

      const canSeparate = annualPension <= 15000000; // 연 1,500만원 이하

      // 분리과세 세액 (연령별 세율, 지방세 포함)
      const separateTax = Math.floor(annualPension * rate);
      const separateLocalTax = Math.floor(separateTax / (rate * 100) * (rate * 10)); // 이미 지방세 포함된 세율
      // rate 자체가 지방소득세 포함 세율 (3.3%, 4.4%, 5.5%)
      const totalTax = separateTax;
      const takeHome = annualPension - totalTax;

      // 1,500만원 초과 시 종합과세 또는 16.5% 분리과세 선택
      let overTax = 0;
      let overTakeHome = annualPension;
      if (!canSeparate) {
        overTax = Math.floor(annualPension * 0.165); // 16.5% 분리과세
        overTakeHome = annualPension - overTax;
      }

      return {
        pensionType: 'private',
        annualPension,
        age,
        rate,
        rateLabel,
        canSeparate,
        totalTax,
        takeHome,
        overTax,
        overTakeHome,
        effectiveRate: (totalTax / annualPension * 100),
        monthlyPension: Math.floor(annualPension / 12),
        monthlyTakeHome: Math.floor(takeHome / 12),
      };
    }

    // 공적연금 (국민연금)
    const pensionDeduction = Math.floor(getPublicPensionDeduction(annualPension));
    const taxableIncome = Math.max(annualPension - pensionDeduction, 0);

    // 기본공제 150만원 (본인)
    const basicDeduction = 1500000;
    const taxBase = Math.max(taxableIncome - basicDeduction, 0);

    const incomeTax = calcIncomeTax(taxBase);
    const localTax = Math.floor(incomeTax * 0.1);
    const totalTax = incomeTax + localTax;
    const takeHome = annualPension - totalTax;

    return {
      pensionType: 'public',
      annualPension,
      age,
      pensionDeduction,
      basicDeduction,
      taxableIncome,
      taxBase,
      incomeTax,
      localTax,
      totalTax,
      takeHome,
      effectiveRate: annualPension > 0 ? (totalTax / annualPension * 100) : 0,
      monthlyPension: Math.floor(annualPension / 12),
      monthlyTakeHome: Math.floor(takeHome / 12),
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🧓</div>연금 수령액을 입력해주세요</div>`;
      return;
    }

    if (result.pensionType === 'private') {
      const {
        annualPension, rateLabel, canSeparate,
        totalTax, takeHome, overTax, overTakeHome, effectiveRate,
        monthlyPension, monthlyTakeHome,
      } = result;

      container.innerHTML = `
        <div class="breakdown-title">사적연금 소득세</div>
        <div class="breakdown-row">
          <span class="br-label">연간 연금 수령액</span>
          <span class="br-value">${UI.fmtWon(annualPension)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">적용 세율</span>
          <span class="br-value"><span class="rate-display">${rateLabel}</span></span>
        </div>
        ${canSeparate ? `
        <div class="breakdown-row" style="font-weight:600">
          <span class="br-label">원천징수세액</span>
          <span class="br-value" style="color:var(--danger)">${UI.fmtWon(totalTax)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">연간 실수령액</span>
          <span class="br-value">${UI.fmtWon(takeHome)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">월 실수령액</span>
          <span class="br-value">${UI.fmtWon(monthlyTakeHome)}</span>
        </div>
        <div class="notice-box info" style="margin-top:12px">
          <strong>분리과세 가능:</strong> 연 1,500만원 이하이므로 연령별 세율로 분리과세됩니다.
        </div>` : `
        <div class="notice-box warning" style="margin-top:12px;margin-bottom:12px">
          <strong>연 1,500만원 초과!</strong> 종합과세 또는 16.5% 분리과세 중 선택해야 합니다.
        </div>
        <div class="breakdown-row">
          <span class="br-label">16.5% 분리과세 시 세액</span>
          <span class="br-value">${UI.fmtWon(overTax)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">16.5% 분리과세 실수령</span>
          <span class="br-value">${UI.fmtWon(overTakeHome)}</span>
        </div>
        <div style="font-size:11px;color:var(--text-muted);margin-top:8px">
          * 종합과세 선택 시 다른 소득과 합산하여 세율이 달라질 수 있습니다
        </div>`}
        <div style="font-size:12px;color:var(--text-secondary);margin-top:8px">
          실효세율: <strong>${effectiveRate.toFixed(2)}%</strong>
        </div>
      `;
      return;
    }

    // 공적연금
    const {
      annualPension, pensionDeduction, basicDeduction,
      taxableIncome, taxBase, incomeTax, localTax,
      totalTax, takeHome, effectiveRate,
      monthlyPension, monthlyTakeHome,
    } = result;

    container.innerHTML = `
      <div class="breakdown-title">공적연금(국민연금) 소득세</div>
      <div class="breakdown-row">
        <span class="br-label">연간 연금 수령액</span>
        <span class="br-value">${UI.fmtWon(annualPension)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">연금소득공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(pensionDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">연금소득금액</span>
        <span class="br-value">${UI.fmtWon(taxableIncome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기본공제 (본인)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(Math.min(basicDeduction, taxableIncome))}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">소득세</span>
        <span class="br-value">${UI.fmtWon(incomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(localTax)}</span>
      </div>
      <div class="breakdown-row" style="font-weight:600">
        <span class="br-label">연간 세금 합계</span>
        <span class="br-value" style="color:var(--danger)">${UI.fmtWon(totalTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">연간 실수령액</span>
        <span class="br-value">${UI.fmtWon(takeHome)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">월 연금액</span>
        <span class="br-value">${UI.fmtWon(monthlyPension)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">월 실수령액</span>
        <span class="br-value">${UI.fmtWon(monthlyTakeHome)}</span>
      </div>
      <div style="font-size:12px;color:var(--text-secondary);margin:8px 0">
        실효세율: <strong>${effectiveRate.toFixed(2)}%</strong>
      </div>
      <div class="notice-box info" style="margin-top:12px">
        <strong>공적연금 과세:</strong> 2002년 이후 납입분에 대한 연금소득에 종합소득세율이 적용됩니다.<br>
        연금소득만 있고 연 516만원(월 43만원) 이하면 과세 미달로 세금이 없습니다.
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-pension-income');
    if (!view) return;

    const resultContainer = view.querySelector('#pincome-result');

    function getParams() {
      const getNum = id => {
        const el = view.querySelector(`#${id}`);
        if (!el) return 0;
        return parseFloat(el.value.replace(/,/g, '')) || 0;
      };
      return {
        pensionType: view.querySelector('input[name="pincome-type"]:checked')?.value || 'public',
        annualPension: getNum('pincome-amount'),
        age: getNum('pincome-age') || 65,
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    // 금액 포맷팅
    const amountInput = view.querySelector('#pincome-amount');
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

    const btnCopy = view.querySelector('#pincome-copy');
    const btnReset = view.querySelector('#pincome-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '연간 연금', value: UI.fmtWon(result.annualPension) },
          { label: '세금', value: UI.fmtWon(result.totalTax) },
          { label: '실수령', value: UI.fmtWon(result.takeHome) },
        ];
        await UI.copyText(UI.formatResultForCopy('연금소득세', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="number"], input[type="text"]').forEach(el => el.value = '');
        const publicRadio = view.querySelector('input[name="pincome-type"][value="public"]');
        if (publicRadio) publicRadio.checked = true;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
