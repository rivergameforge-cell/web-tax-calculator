/* ===== 취득세 계산기 ===== */
const CalcAcquisition = (() => {

  // 주택 취득세 기본세율 계산
  function getHousingRate(price, houseCount, isAdjusted) {
    // 1주택
    if (houseCount === 1) {
      if (price <= 600_000_000) return 0.01;
      if (price <= 900_000_000) {
        // 6억~9억: 선형 보간 1% → 3% (공식: 취득가액(억) × 2/3 - 3)
        return (price / 100_000_000 * 2 / 3 - 3) / 100;
      }
      return 0.03;
    }
    // 2주택
    if (houseCount === 2) {
      if (isAdjusted) return 0.08;
      // 비조정: 6억 이하 1%, 6~9억 1~3%, 9억 초과 3%
      if (price <= 600_000_000) return 0.01;
      if (price <= 900_000_000) return (price / 100_000_000 * 2 / 3 - 3) / 100;
      return 0.03;
    }
    // 3주택
    if (houseCount === 3) {
      return isAdjusted ? 0.12 : 0.08;
    }
    // 4주택 이상
    return 0.12;
  }

  // 농어촌특별세 정보: { rate: 취득가액 대비 비율, applyArea: 85㎡ 조건 여부 }
  function getRuralTaxInfo(type, houseCount, isAdjusted) {
    if (type !== 'housing') {
      return { rate: 0.002, applyArea: false }; // 비주택: 0.2% 고정
    }
    // 주택 중과세율 구간: 면적 조건 없이 고정율
    if (houseCount === 2 && isAdjusted)  return { rate: 0.006, applyArea: false }; // 0.6%
    if (houseCount === 3 && isAdjusted)  return { rate: 0.010, applyArea: false }; // 1%
    if (houseCount === 3 && !isAdjusted) return { rate: 0.006, applyArea: false }; // 0.6%
    if (houseCount >= 4)                 return { rate: 0.010, applyArea: false }; // 1%
    // 1주택 / 2주택 비조정: 0.2%, 전용면적 85㎡ 초과만
    return { rate: 0.002, applyArea: true };
  }

  // 지방교육세
  // - 일반세율(1~3%): 취득세액의 10%
  // - 중과세율(8%, 12%): 취득가액의 0.4% 고정 (표준세율 2% × 20%)
  function calcEduTax(price, acqTax, acqRate) {
    if (acqRate >= 0.08) return Math.floor(price * 0.004);
    return Math.floor(acqTax * 0.1);
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
      acqRate = 0.04;
    } else if (type === 'land') {
      acqRate = 0.04;
    }

    const acqTax = Math.floor(price * acqRate);

    // 농어촌특별세
    const ruralInfo = getRuralTaxInfo(type, houseCount, isAdjusted);
    const ruralTax = (ruralInfo.applyArea && area <= 85)
      ? 0
      : Math.floor(price * ruralInfo.rate);

    // 지방교육세
    const eduTax = calcEduTax(price, acqTax, acqRate);

    let total = acqTax + ruralTax + eduTax;

    // 생애최초 감면: 최대 200만원, 12억 이하
    let firstHomeDiscount = 0;
    if (isFirstHome && type === 'housing' && houseCount === 1 && price <= 1_200_000_000) {
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
      ruralRate: ruralInfo.rate,
      eduTax,
      subtotal: total,
      discount,
      firstHomeDiscount,
      birthDiscount,
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

    const { acqRate, acqTax, ruralTax, ruralRate, eduTax, subtotal, discount, firstHomeDiscount, birthDiscount, total, params } = result;
    const isHeavy = acqRate >= 0.08;
    const eduLabel = isHeavy
      ? `지방교육세 <span style="font-size:11px;color:var(--text-muted)">(취득가액 × 0.4%)</span>`
      : `지방교육세 <span style="font-size:11px;color:var(--text-muted)">(취득세 × 10%)</span>`;
    const ruralLabel = ruralTax === 0
      ? `농어촌특별세 <span style="font-size:11px;color:var(--text-muted)">(85㎡ 이하 비과세)</span>`
      : `농어촌특별세 <span style="font-size:11px;color:var(--text-muted)">(취득가액 × ${(ruralRate * 100).toFixed(1)}%)</span>`;

    // 생애최초/출산 감면 미적용 사유
    let discountNotice = '';
    if (params.isFirstHome && discount === 0) {
      let reason = '';
      if (params.type !== 'housing') reason = '주택 취득에만 적용됩니다';
      else if (params.houseCount !== 1) reason = '1주택자만 적용됩니다';
      else if (params.price > 1_200_000_000) reason = '취득가 12억 이하만 적용됩니다';
      if (reason) discountNotice += `<div class="notice-box warning" style="margin:12px 0 0;font-size:12px">⚠️ 생애최초 감면 미적용 — ${reason}</div>`;
    }
    if (params.isBirth && discount === 0) {
      let reason = '';
      if (params.type !== 'housing') reason = '주택 취득에만 적용됩니다';
      else if (params.price > 1_200_000_000) reason = '취득가 12억 이하만 적용됩니다';
      if (reason) discountNotice += `<div class="notice-box warning" style="margin:12px 0 0;font-size:12px">⚠️ 출산·양육 감면 미적용 — ${reason}</div>`;
    }

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
        <span class="br-label">${eduLabel}</span>
        <span class="br-value">${UI.fmtWon(eduTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">${ruralLabel}</span>
        <span class="br-value">${UI.fmtWon(ruralTax)}</span>
      </div>
      ${discount > 0 ? `
      <div class="breakdown-row" style="border-top:1px solid var(--border);padding-top:8px;margin-top:4px">
        <span class="br-label">세금 소계</span>
        <span class="br-value">${UI.fmtWon(subtotal)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">감면액 <span style="font-size:11px">(${params.isBirth && birthDiscount >= firstHomeDiscount ? '출산·양육' : '생애최초'})</span></span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(discount)}</span>
      </div>` : ''}
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(total)}</span>
      </div>
      ${discountNotice}
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
