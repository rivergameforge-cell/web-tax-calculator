/* ===== 부동산 중개보수(복비) 계산기 ===== */
const CalcCommission = (() => {

  /**
   * 2026년 기준 공인중개사법 시행규칙 상한 요율
   * 주택: 거래금액 구간별 상한요율 + 한도액
   * 주택 외(토지·상가 등): 거래금액 × 0.9% 이내 협의
   */
  const HOUSING_RATES = {
    매매: [
      { limit:  50_000_000, rate: 0.006, maxFee:  250_000 },
      { limit: 200_000_000, rate: 0.005, maxFee:  800_000 },
      { limit: 600_000_000, rate: 0.004, maxFee: null },
      { limit: 900_000_000, rate: 0.005, maxFee: null },
      { limit: Infinity,    rate: 0.007, maxFee: null },   // 9억 초과: 0.7% 이내 협의
    ],
    전세: [
      { limit:  50_000_000, rate: 0.005, maxFee:  200_000 },
      { limit: 100_000_000, rate: 0.004, maxFee:  300_000 },
      { limit: 300_000_000, rate: 0.003, maxFee: null },
      { limit: 600_000_000, rate: 0.004, maxFee: null },
      { limit: Infinity,    rate: 0.008, maxFee: null },   // 6억 초과: 0.8% 이내 협의
    ],
    월세: null, // 별도 계산
  };

  /**
   * 주택 중개보수 계산
   * 전월세: 보증금 + (월세 × 100) → 5,000만원 미만이면 보증금 + (월세 × 70)
   */
  function calcHousing(type, price, deposit, monthlyRent) {
    let basePrice = price;

    if (type === '월세') {
      // 환산보증금 = 보증금 + (월세 × 100)
      const converted = deposit + (monthlyRent * 100);
      // 환산보증금이 5천만 미만이면 보증금 + (월세 × 70)
      basePrice = converted < 50_000_000
        ? deposit + (monthlyRent * 70)
        : converted;
    }

    const rateTable = type === '월세' ? HOUSING_RATES['전세'] : HOUSING_RATES[type];
    if (!rateTable) return null;

    let bracket = rateTable.find(b => basePrice <= b.limit);
    if (!bracket) bracket = rateTable[rateTable.length - 1];

    const rawFee = Math.floor(basePrice * bracket.rate);
    const maxFee = bracket.maxFee ?? Infinity;
    const fee = Math.min(rawFee, maxFee);
    const vatFee = Math.floor(fee * 0.1);   // VAT 10%

    return {
      basePrice,
      rate: bracket.rate,
      maxFee: bracket.maxFee,
      fee,
      vatFee,
      total: fee + vatFee,
      isNegotiable: basePrice >= 600_000_000,
    };
  }

  /**
   * 주택 외(토지·상가·오피스텔 등): 상한 0.9%
   */
  function calcOther(price) {
    const fee = Math.floor(price * 0.009);
    const vatFee = Math.floor(fee * 0.1);
    return {
      basePrice: price,
      rate: 0.009,
      maxFee: null,
      fee,
      vatFee,
      total: fee + vatFee,
      isNegotiable: true,
    };
  }

  function calculate(params) {
    const { propertyType, transType, price, deposit, monthlyRent } = params;
    if (!price || price <= 0) return null;

    if (propertyType === 'housing') {
      return calcHousing(transType, price, deposit || 0, monthlyRent || 0);
    }
    return calcOther(price);
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏠</div>
          거래금액을 입력하면 복비가 계산됩니다
        </div>`;
      return;
    }

    const { basePrice, rate, maxFee, fee, vatFee, total, isNegotiable } = result;

    container.innerHTML = `
      <div class="breakdown-title">중개보수 계산 결과</div>
      ${basePrice !== result.basePrice ? `
      <div class="breakdown-row">
        <span class="br-label">환산 기준금액</span>
        <span class="br-value">${UI.fmtWon(basePrice)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">적용 상한요율</span>
        <span class="br-value"><span class="rate-display">${(rate * 100).toFixed(1)}%${isNegotiable ? ' 이내 협의' : ''}</span></span>
      </div>
      ${maxFee ? `
      <div class="breakdown-row indent">
        <span class="br-label">한도액</span>
        <span class="br-value">${UI.fmtWon(maxFee)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">중개보수 (상한)</span>
        <span class="br-value">${UI.fmtWon(fee)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">부가세 (VAT 10%)</span>
        <span class="br-value">${UI.fmtWon(vatFee)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">합계 (VAT 포함)</span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
      ${isNegotiable ? `
      <div style="padding:10px 16px;font-size:12px;color:var(--warning);background:var(--warning-light);border-top:1px solid var(--border)">
        ⚠️ 이 금액은 법정 <strong>상한액</strong>입니다. 중개사와 협의하여 낮출 수 있습니다.
      </div>` : ''}
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-commission');
    if (!view) return;

    const resultContainer = view.querySelector('#comm-result');
    const monthlyRentSection = view.querySelector('#comm-monthly-section');
    const depositSection = view.querySelector('#comm-deposit-section');
    const priceLabel = view.querySelector('#comm-price-label');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function updateLayout() {
      const propType = view.querySelector('input[name="comm-prop"]:checked')?.value;
      const transType = view.querySelector('input[name="comm-trans"]:checked')?.value;
      const isHousing = propType === 'housing';
      const isMonthly = isHousing && transType === '월세';
      const isJeonse = isHousing && (transType === '전세' || transType === '월세');

      if (depositSection) depositSection.style.display = isJeonse ? '' : 'none';
      if (monthlyRentSection) monthlyRentSection.style.display = isMonthly ? '' : 'none';

      // 매매/토지상가는 "거래금액", 전세는 "보증금(전세금)", 월세는 별도
      if (priceLabel) {
        if (transType === '전세' && isHousing) priceLabel.textContent = '보증금(전세금)';
        else if (isMonthly) priceLabel.textContent = '보증금';
        else priceLabel.textContent = '거래금액';
      }

      // 주택 외이면 거래유형 숨김
      const transSection = view.querySelector('#comm-trans-section');
      if (transSection) transSection.style.display = isHousing ? '' : 'none';
    }

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        propertyType: view.querySelector('input[name="comm-prop"]:checked')?.value || 'housing',
        transType: view.querySelector('input[name="comm-trans"]:checked')?.value || '매매',
        price: getVal('comm-price'),
        deposit: getVal('comm-deposit'),
        monthlyRent: getVal('comm-monthly-rent'),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input').forEach(el => {
      el.addEventListener('change', () => { updateLayout(); doCalc(); });
      if (el.type === 'text') el.addEventListener('input', doCalc);
    });

    const btnCopy = view.querySelector('#comm-copy');
    const btnPrint = view.querySelector('#comm-print');
    const btnReset = view.querySelector('#comm-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        await UI.copyText(UI.formatResultForCopy('부동산 복비 계산', [
          { label: '적용 상한요율', value: (result.rate * 100).toFixed(1) + '%' },
          { label: '중개보수', value: UI.fmtWon(result.fee) },
          { label: '부가세(10%)', value: UI.fmtWon(result.vatFee) },
          { label: '합계(VAT포함)', value: UI.fmtWon(result.total) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelector('input[name="comm-prop"][value="housing"]').checked = true;
        view.querySelector('input[name="comm-trans"][value="매매"]').checked = true;
        updateLayout();
        renderResult(null, resultContainer);
      });
    }

    updateLayout();
    doCalc();
  }

  return { init, calculate };
})();
