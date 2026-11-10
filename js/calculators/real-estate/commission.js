/* ===== 부동산 중개보수(복비) 계산기 ===== */
const CalcCommission = (() => {

  // 공인중개사법 시행규칙 별표 1. 구간 끝값은 미만이다.
  const HOUSING_RATES = {
    매매: [
      [50_000_000, 6, 250_000],
      [200_000_000, 5, 800_000],
      [900_000_000, 4],
      [1_200_000_000, 5],
      [1_500_000_000, 6],
      [Infinity, 7],
    ],
    전세: [
      [50_000_000, 5, 200_000],
      [100_000_000, 4, 300_000],
      [600_000_000, 3],
      [1_200_000_000, 4],
      [1_500_000_000, 5],
      [Infinity, 6],
    ],
  };

  function calculate({ propertyType, transType, price, monthlyRent = 0 }) {
    if (!Number.isFinite(price) || price < 0) return null;
    if (!['매매', '전세', '월세'].includes(transType)) return null;
    const isMonthly = transType === '월세';
    if (isMonthly ? !Number.isFinite(monthlyRent) || monthlyRent <= 0 : price <= 0) return null;
    const converted = isMonthly ? price + monthlyRent * 100 : price;
    const basePrice = isMonthly && converted < 50_000_000 ? price + monthlyRent * 70 : converted;
    if (!Number.isFinite(basePrice)) return null;

    let perMille, maxFee;
    if (propertyType === 'housing') {
      const table = HOUSING_RATES[isMonthly ? '전세' : transType];
      [, perMille, maxFee] = table.find(([limit]) => basePrice < limit);
    } else if (propertyType === 'officetel') {
      // 전용 85㎡ 이하이면서 법정 설비를 모두 갖춘 경우.
      perMille = transType === '매매' ? 5 : 4;
    } else if (propertyType === 'other') {
      perMille = 9;
    } else {
      return null;
    }
    const fee = Math.min(Math.floor(basePrice * perMille / 1000), maxFee ?? Infinity);
    const vatFee = Math.floor(fee / 10);
    return { basePrice, rate: perMille / 1000, maxFee, fee, vatFee, total: fee + vatFee, isMonthly };
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

    const { basePrice, rate, maxFee, fee, vatFee, total, isMonthly } = result;

    container.innerHTML = `
      <div class="breakdown-title">중개보수 계산 결과</div>
      ${isMonthly ? `
      <div class="breakdown-row">
        <span class="br-label">환산 기준금액</span>
        <span class="br-value">${UI.fmtWon(basePrice)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">적용 상한요율</span>
        <span class="br-value"><span class="rate-display">${(rate * 100).toFixed(1)}% 이내 협의</span></span>
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
        <span class="br-label">부가세 (10% 별도 가정)</span>
        <span class="br-value">${UI.fmtWon(vatFee)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">합계 (부가세 별도 가정)</span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
      <div style="padding:10px 16px;font-size:12px;color:var(--warning);background:var(--warning-light);border-top:1px solid var(--border)">
        보수는 상한 안에서 협의합니다. 적용 지역의 조례와 부가세 포함 여부를 확인하세요.
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-commission');
    if (!view) return;

    const resultContainer = view.querySelector('#comm-result');
    const monthlyRentSection = view.querySelector('#comm-monthly-section');
    const priceLabel = view.querySelector('#comm-price-label');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function updateLayout() {
      const transType = view.querySelector('input[name="comm-trans"]:checked')?.value;
      if (monthlyRentSection) monthlyRentSection.style.display = transType === '월세' ? '' : 'none';
      if (priceLabel) priceLabel.textContent = transType === '매매' ? '거래금액' : '보증금';
    }

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        propertyType: view.querySelector('input[name="comm-prop"]:checked')?.value || 'housing',
        transType: view.querySelector('input[name="comm-trans"]:checked')?.value || '매매',
        price: getVal('comm-price'),
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
          { label: '부가세(10% 별도 가정)', value: UI.fmtWon(result.vatFee) },
          { label: '합계(부가세 별도 가정)', value: UI.fmtWon(result.total) },
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
