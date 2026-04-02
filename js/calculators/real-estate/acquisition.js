/* ===== 취득세 계산기 ===== */
const CalcAcquisition = (() => {

  // 주택 취득세 기본세율 계산
  function getHousingRate(price, houseCount, isAdjusted) {
    // 1주택
    if (houseCount === 1) {
      if (price <= 600_000_000) return 0.01;
      if (price <= 900_000_000) {
        // 6억~9억: 선형 보간 1% → 3%
        return (price / 100_000_000 * 2 - 11) / 100;
      }
      return 0.03;
    }
    // 2주택
    if (houseCount === 2) {
      if (isAdjusted) return 0.08;
      // 비조정: 6억 이하 1%, 6~9억 1~3%, 9억 초과 3%
      if (price <= 600_000_000) return 0.01;
      if (price <= 900_000_000) return (price / 100_000_000 * 2 - 11) / 100;
      return 0.03;
    }
    // 3주택
    if (houseCount === 3) {
      return isAdjusted ? 0.12 : 0.08;
    }
    // 4주택 이상
    return 0.12;
  }

  // 지방교육세율 (취득세율에 따라 다름)
  function getEducationTaxRate(acqRate) {
    if (acqRate <= 0.02) return 0.1;  // 취득세율 2% 이하: 10%
    return 0.2; // 초과: 20%
  }

  // 계산 메인
  function calculate(params) {
    const {
      type,        // 'housing' | 'non-housing' | 'land'
      price,       // 취득가액 (원)
      houseCount,  // 주택 수 (1,2,3,4)
      isAdjusted,  // 조정대상지역 여부
      isFirstHome, // 생애최초 여부
      isBirth,     // 출산·양육 여부
      area,        // 면적 (㎡)
    } = params;

    if (!price || price <= 0) return null;

    let acqRate = 0;

    if (type === 'housing') {
      acqRate = getHousingRate(price, houseCount, isAdjusted);
    } else if (type === 'non-housing') {
      acqRate = 0.04; // 건물 기본 4%
    } else if (type === 'land') {
      acqRate = 0.04; // 농지 3%, 기타 4%
    }

    const acqTax = Math.floor(price * acqRate);

    // 농어촌특별세: 85㎡ 초과 주택 또는 비주택
    let ruralTax = 0;
    if (type === 'housing') {
      if (area > 85) {
        ruralTax = Math.floor(acqTax * 0.1);
      }
    } else {
      ruralTax = Math.floor(acqTax * 0.1);
    }

    // 지방교육세
    const eduRate = getEducationTaxRate(acqRate);
    const eduTax = Math.floor(acqTax * eduRate);

    let total = acqTax + ruralTax + eduTax;

    // 생애최초 감면: 최대 200만원
    let firstHomeDiscount = 0;
    if (isFirstHome && type === 'housing' && houseCount === 1) {
      firstHomeDiscount = Math.min(acqTax, 2_000_000);
    }

    // 출산·양육 감면: 최대 500만원 (2028년까지, 12억 이하)
    let birthDiscount = 0;
    if (isBirth && type === 'housing' && price <= 1_200_000_000) {
      birthDiscount = Math.min(acqTax, 5_000_000);
    }

    const discount = Math.max(firstHomeDiscount, birthDiscount);
    const finalTotal = Math.max(0, total - discount);

    return {
      acqRate,
      acqTax,
      ruralTax,
      eduTax,
      subtotal: total,
      discount,
      total: finalTotal,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏠</div>
          취득가액을 입력하면 세금이 계산됩니다
        </div>`;
      return;
    }

    const { acqRate, acqTax, ruralTax, eduTax, subtotal, discount, total } = result;

    container.innerHTML = `
      <div class="breakdown-title">취득세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">취득세율</span>
        <span class="br-value"><span class="rate-display">${(acqRate * 100).toFixed(2)}%</span></span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">취득세</span>
        <span class="br-value">${UI.fmtWon(acqTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방교육세</span>
        <span class="br-value">${UI.fmtWon(eduTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">농어촌특별세</span>
        <span class="br-value">${UI.fmtWon(ruralTax)}</span>
      </div>
      ${discount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">감면액</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(discount)}</span>
      </div>` : ''}
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-acquisition');
    if (!view) return;

    const inputs = {
      type: view.querySelectorAll('input[name="acq-type"]'),
      price: view.querySelector('#acq-price'),
      houseCount: view.querySelectorAll('input[name="acq-house-count"]'),
      isAdjusted: view.querySelector('#acq-adjusted'),
      isFirstHome: view.querySelector('#acq-first-home'),
      isBirth: view.querySelector('#acq-birth'),
      area: view.querySelector('#acq-area'),
    };

    const resultContainer = view.querySelector('#acq-result');
    const btnCopy = view.querySelector('#acq-copy');
    const btnPrint = view.querySelector('#acq-print');
    const btnReset = view.querySelector('#acq-reset');

    if (inputs.price) UI.bindNumInput(inputs.price);
    if (inputs.area) UI.bindNumInput(inputs.area);

    function getParams() {
      return {
        type: [...inputs.type].find(r => r.checked)?.value || 'housing',
        price: inputs.price ? UI.parseNum(inputs.price.value.replace(/,/g, '')) : 0,
        houseCount: parseInt([...inputs.houseCount].find(r => r.checked)?.value || '1'),
        isAdjusted: inputs.isAdjusted?.checked || false,
        isFirstHome: inputs.isFirstHome?.checked || false,
        isBirth: inputs.isBirth?.checked || false,
        area: inputs.area ? UI.parseNum(inputs.area.value.replace(/,/g, '')) : 0,
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);
      // Toggle house count section visibility
      const houseSection = view.querySelector('#acq-house-section');
      if (houseSection) {
        houseSection.style.display = params.type === 'housing' ? '' : 'none';
      }
    }, 200);

    // Bind all inputs
    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const params = getParams();
        const result = calculate(params);
        if (!result) return;
        const text = UI.formatResultForCopy('취득세 계산', [
          { label: '취득가액', value: UI.fmtWon(params.price) },
          { label: '취득세율', value: (result.acqRate * 100).toFixed(2) + '%' },
          { label: '취득세', value: UI.fmtWon(result.acqTax) },
          { label: '지방교육세', value: UI.fmtWon(result.eduTax) },
          { label: '농어촌특별세', value: UI.fmtWon(result.ruralTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.total) },
        ]);
        await UI.copyText(text);
        UI.toast('계산 결과가 복사되었습니다', 'success');
      });
    }

    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const firstRadio = view.querySelector('input[name="acq-type"][value="housing"]');
        if (firstRadio) firstRadio.checked = true;
        const firstCount = view.querySelector('input[name="acq-house-count"][value="1"]');
        if (firstCount) firstCount.checked = true;
        renderResult(null, resultContainer);
      });
    }

    // Initial calc
    doCalc();
  }

  return { init, calculate };
})();
