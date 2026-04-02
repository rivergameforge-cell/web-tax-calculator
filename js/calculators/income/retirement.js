/* ===== 퇴직소득세 계산기 (2026년 기준) ===== */
const CalcRetirement = (() => {

  const TAX_BRACKETS = [
    { limit:  14_000_000, rate: 0.06, deduction:          0 },
    { limit:  50_000_000, rate: 0.15, deduction:  1_260_000 },
    { limit:  88_000_000, rate: 0.24, deduction:  5_760_000 },
    { limit: 150_000_000, rate: 0.35, deduction: 15_440_000 },
    { limit: 300_000_000, rate: 0.38, deduction: 19_940_000 },
    { limit: 500_000_000, rate: 0.40, deduction: 25_940_000 },
    { limit: 1_000_000_000, rate: 0.42, deduction: 35_940_000 },
    { limit: Infinity,    rate: 0.45, deduction: 65_940_000 },
  ];

  // 근속연수공제
  function getServiceDeduction(years) {
    if (years <= 0) return 0;
    if (years <= 5)  return years * 1_000_000;
    if (years <= 10) return  5_000_000 + (years - 5) * 2_000_000;
    if (years <= 20) return 15_000_000 + (years - 10) * 2_500_000;
    return 40_000_000 + (years - 20) * 3_000_000;
  }

  // 환산급여 공제
  function getConversionDeduction(convertedPay) {
    if (convertedPay <= 8_000_000)   return Math.floor(convertedPay * 1.00);
    if (convertedPay <= 70_000_000)  return 8_000_000 + Math.floor((convertedPay - 8_000_000) * 0.60);
    if (convertedPay <= 100_000_000) return 45_200_000 + Math.floor((convertedPay - 70_000_000) * 0.55);
    if (convertedPay <= 300_000_000) return 61_700_000 + Math.floor((convertedPay - 100_000_000) * 0.45);
    return 151_700_000 + Math.floor((convertedPay - 300_000_000) * 0.35);
  }

  function calcProgressiveTax(taxBase) {
    if (taxBase <= 0) return 0;
    for (const b of TAX_BRACKETS) {
      if (taxBase <= b.limit) {
        return Math.max(0, Math.floor(taxBase * b.rate - b.deduction));
      }
    }
    return 0;
  }

  function calculate(params) {
    const {
      retirementPay,  // 퇴직급여 총액 (원)
      serviceYears,   // 근속연수 (년)
      serviceMonths,  // 근속월수 (추가)
    } = params;

    if (!retirementPay || retirementPay <= 0 || !serviceYears) return null;

    const totalYears = serviceYears + (serviceMonths || 0) / 12;
    const roundYears = Math.max(1, Math.ceil(totalYears)); // 1년 미만은 1년

    // 1) 근속연수공제
    const serviceDeduction = getServiceDeduction(roundYears);
    const afterServiceDed  = Math.max(0, retirementPay - serviceDeduction);

    // 2) 환산급여 = (퇴직급여 - 근속연수공제) × 12 / 근속연수
    const convertedPay = roundYears > 0 ? Math.floor(afterServiceDed * 12 / roundYears) : 0;

    // 3) 환산급여공제
    const conversionDeduction = getConversionDeduction(convertedPay);
    const convertedTaxBase    = Math.max(0, convertedPay - conversionDeduction);

    // 4) 환산산출세액 (누진세율 적용)
    const convertedTax = calcProgressiveTax(convertedTaxBase);

    // 5) 최종 퇴직소득세 = 환산산출세액 × 근속연수 / 12
    const retirementTax = roundYears > 0 ? Math.floor(convertedTax * roundYears / 12) : 0;

    // 지방소득세 10%
    const localTax = Math.floor(retirementTax * 0.10);
    const totalTax = retirementTax + localTax;

    // 실효세율
    const effectiveRate = retirementPay > 0 ? totalTax / retirementPay : 0;

    return {
      retirementPay, roundYears,
      serviceDeduction, afterServiceDed,
      convertedPay, conversionDeduction, convertedTaxBase,
      convertedTax, retirementTax, localTax, totalTax,
      effectiveRate,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">💼</div>
          퇴직급여와 근속연수를 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    container.innerHTML = `
      <div class="breakdown-title">퇴직소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">퇴직급여 총액</span>
        <span class="br-value">${UI.fmtWon(r.retirementPay)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">근속연수 (${r.roundYears}년) 공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.serviceDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">환산급여 (×12/${r.roundYears})</span>
        <span class="br-value">${UI.fmtWon(r.convertedPay)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">환산급여공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.conversionDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">환산과세표준</span>
        <span class="br-value">${UI.fmtWon(r.convertedTaxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">환산산출세액</span>
        <span class="br-value">${UI.fmtWon(r.convertedTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">퇴직소득세 (×${r.roundYears}/12)</span>
        <span class="br-value">${UI.fmtWon(r.retirementTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row" style="font-size:12px;color:var(--text-muted)">
        <span class="br-label">실효세율</span>
        <span class="br-value">${(r.effectiveRate * 100).toFixed(2)}%</span>
      </div>
      <div class="breakdown-row" style="font-size:12px;color:var(--text-muted)">
        <span class="br-label">실수령액 (세후)</span>
        <span class="br-value">${UI.fmtWon(r.retirementPay - r.totalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-income-retirement');
    if (!view) return;

    const resultContainer = view.querySelector('#retire-result');
    const btnCopy  = view.querySelector('#retire-copy');
    const btnPrint = view.querySelector('#retire-print');
    const btnReset = view.querySelector('#retire-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      const getNum = id => parseInt(view.querySelector(`#${id}`)?.value || '0') || 0;
      return {
        retirementPay: getVal('retire-pay'),
        serviceYears:  getNum('retire-years'),
        serviceMonths: getNum('retire-months'),
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('퇴직소득세 계산', [
          { label: '퇴직급여', value: UI.fmtWon(r.retirementPay) },
          { label: '근속연수', value: r.roundYears + '년' },
          { label: '퇴직소득세', value: UI.fmtWon(r.retirementTax) },
          { label: '최종 납부세액', value: UI.fmtWon(r.totalTax) },
          { label: '실효세율', value: (r.effectiveRate * 100).toFixed(2) + '%' },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
