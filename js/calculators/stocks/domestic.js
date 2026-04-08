/* ===== 국내주식 양도소득세 계산기 (2026년 기준) ===== */
const CalcStockDomestic = (() => {

  // 대주주 기준: 종목당 50억원 이상 보유 (2024년~ 완화)
  const MAJOR_THRESHOLD = 5_000_000_000;
  const BASIC_DEDUCTION = 2_500_000; // 기본공제 250만원

  // 세율
  const RATES = {
    small: {  // 중소기업
      normal: 0.10,   // 일반 10%
      major:  0.20,   // 대주주 20%
      majorOver3: 0.25, // 대주주 3억 초과 25%
    },
    general: { // 일반기업 (대기업 등)
      normal: 0.20,   // 일반 20%
      major:  0.20,   // 대주주 20%
      majorOver3: 0.25, // 대주주 3억 초과 25%
    },
  };

  const LOCAL_TAX_RATE = 0.10; // 지방소득세 10%

  function calculate(params) {
    const {
      companyType,       // 'small' | 'general'
      isMajor,           // 대주주 여부
      sellAmount,        // 양도가액 (원)
      buyAmount,         // 취득가액 (원)
      expenses,          // 필요경비 (수수료 등)
    } = params;

    if (!sellAmount || sellAmount <= 0 || !buyAmount) return null;

    const gain = sellAmount - buyAmount - (expenses || 0);
    if (gain <= 0) {
      return {
        sellAmount, buyAmount, expenses: expenses || 0,
        gain, taxableGain: 0, incomeTax: 0, localTax: 0, totalTax: 0,
        effectiveRate: 0, netProfit: gain,
        params,
      };
    }

    // 기본공제 (연간 합산, 여기서는 단일 거래 기준)
    const taxableGain = Math.max(0, gain - BASIC_DEDUCTION);

    const rateSet = RATES[companyType] || RATES['general'];
    let incomeTax = 0;

    if (!isMajor) {
      // 소액주주 (비상장 or 장외거래 시 과세, 상장주식 소액주주는 비과세이나 계산기에서는 과세 시나리오)
      incomeTax = Math.floor(taxableGain * rateSet.normal);
    } else {
      // 대주주: 3억 이하 / 3억 초과 구간
      const threshold = 300_000_000;
      if (taxableGain <= threshold) {
        incomeTax = Math.floor(taxableGain * rateSet.major);
      } else {
        incomeTax = Math.floor(threshold * rateSet.major)
                  + Math.floor((taxableGain - threshold) * rateSet.majorOver3);
      }
    }

    const localTax = Math.floor(incomeTax * LOCAL_TAX_RATE);
    const totalTax = incomeTax + localTax;
    const netProfit = gain - totalTax;
    const effectiveRate = gain > 0 ? totalTax / gain : 0;

    return {
      sellAmount, buyAmount, expenses: expenses || 0,
      gain, taxableGain,
      incomeTax, localTax, totalTax,
      effectiveRate, netProfit,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📈</div>
          양도가액과 취득가액을 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    if (r.gain <= 0) {
      container.innerHTML = `
        <div class="breakdown-title">국내주식 양도소득세 계산 결과</div>
        <div class="breakdown-row">
          <span class="br-label">양도차익</span>
          <span class="br-value" style="color:var(--danger)">${UI.fmtWon(r.gain)}</span>
        </div>
        <div style="padding:16px;text-align:center">
          <div class="exempt-badge">✅ 양도차손 — 세금 없음</div>
        </div>
      `;
      return;
    }

    container.innerHTML = `
      <div class="breakdown-title">국내주식 양도소득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">양도가액</span>
        <span class="br-value">${UI.fmtWon(r.sellAmount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득가액</span>
        <span class="br-value">${UI.fmtWon(r.buyAmount)}</span>
      </div>
      ${r.expenses > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">필요경비 (수수료 등)</span>
        <span class="br-value">${UI.fmtWon(r.expenses)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">양도차익</span>
        <span class="br-value">${UI.fmtWon(r.gain)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">기본공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(2500000)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(r.taxableGain)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">양도소득세</span>
        <span class="br-value">${UI.fmtWon(r.incomeTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방소득세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.localTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">세금 합계</span>
        <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">실효세율</span>
        <span class="br-value"><span class="rate-display">${(r.effectiveRate * 100).toFixed(1)}%</span></span>
      </div>
      <div class="breakdown-row total" style="margin-top:8px">
        <span class="br-label">세후 순이익</span>
        <span class="br-value">${UI.fmtWon(r.netProfit)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-stocks-domestic');
    if (!view) return;

    const resultContainer = view.querySelector('#sdom-result');
    const btnCopy  = view.querySelector('#sdom-copy');
    const btnPrint = view.querySelector('#sdom-print');
    const btnReset = view.querySelector('#sdom-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        companyType: [...view.querySelectorAll('input[name="sdom-company"]')].find(r => r.checked)?.value || 'general',
        isMajor:     view.querySelector('#sdom-major')?.checked || false,
        sellAmount:  getVal('sdom-sell'),
        buyAmount:   getVal('sdom-buy'),
        expenses:    getVal('sdom-expense'),
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        await UI.copyText(UI.formatResultForCopy('국내주식 양도소득세 계산', [
          { label: '양도차익', value: UI.fmtWon(r.gain) },
          { label: '양도소득세', value: UI.fmtWon(r.incomeTax) },
          { label: '지방소득세', value: UI.fmtWon(r.localTax) },
          { label: '세금 합계', value: UI.fmtWon(r.totalTax) },
          { label: '세후 순이익', value: UI.fmtWon(r.netProfit) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const firstType = view.querySelector('input[name="sdom-company"][value="general"]');
        if (firstType) firstType.checked = true;
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
