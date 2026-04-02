/* ===== 자동차 살 때 총 비용 계산기 (2026년 기준) ===== */
const CalcVehicleBuying = (() => {

  // 개별소비세율 5%
  const EXCISE_RATE = 0.05;
  // 교육세: 개소세의 30%
  const EDU_RATE = 0.30;

  // 취득세율
  const ACQ_RATES = {
    'passenger': 0.07,
    'light':     0.04,
    'truck':     0.05,
    'van':       0.05,
    'electric':  0.07,
  };

  // 친환경차 개소세 감면 한도
  const ECO_EXCISE_MAX = {
    'hybrid':   1_000_000,
    'electric': 3_000_000,
    'hydrogen': 4_000_000,
  };

  // 친환경차 취득세 감면 한도
  const ECO_ACQ_MAX = {
    'hybrid':   1_400_000,
    'electric': 1_400_000,
    'hydrogen': 1_400_000,
  };

  function calculate(params) {
    const { carPrice, vehicleType, ecoType, isUsed } = params;
    if (!carPrice || carPrice <= 0) return null;

    const isLight = vehicleType === 'light';
    const isEco = ecoType && ecoType !== 'none';

    // ── 1단계: 개별소비세 (신차만, 경차·화물·승합 면제) ──
    let exciseTax = 0;
    let exciseDiscount = 0;
    let eduTax = 0;
    let vat = 0;
    let totalCarPrice = carPrice; // 실제 지불 차량가 (신차: 출고가+세금)

    if (!isUsed && (vehicleType === 'passenger' || vehicleType === 'electric')) {
      exciseTax = Math.floor(carPrice * EXCISE_RATE);

      // 친환경차 개소세 감면
      if (isEco && ECO_EXCISE_MAX[ecoType]) {
        exciseDiscount = Math.min(exciseTax, ECO_EXCISE_MAX[ecoType]);
      }
      const exciseAfter = exciseTax - exciseDiscount;

      eduTax = Math.floor(exciseAfter * EDU_RATE);
      const vatBase = carPrice + exciseAfter + eduTax;
      vat = Math.floor(vatBase * 0.10);
      totalCarPrice = vatBase + vat;
    } else if (!isUsed) {
      // 경차·화물·승합: 개소세 면제, 부가세만
      vat = Math.floor(carPrice * 0.10);
      totalCarPrice = carPrice + vat;
    }
    // 중고차: carPrice가 이미 최종 가격

    // ── 2단계: 취득세 ──
    const acqRate = ACQ_RATES[vehicleType] || 0.07;
    let acqBase = isUsed ? carPrice : totalCarPrice;
    let acqTax = Math.floor(acqBase * acqRate);

    // 친환경차 취득세 감면
    let acqDiscount = 0;
    if (isEco && ECO_ACQ_MAX[ecoType]) {
      acqDiscount = Math.min(acqTax, ECO_ACQ_MAX[ecoType]);
    }
    const acqTaxAfter = acqTax - acqDiscount;

    // 취득세 부가세: 교육세 30%, 농특세 10% (경차·화물 면제)
    const acqEduTax = isLight ? 0 : Math.floor(acqTaxAfter * 0.30);
    const acqRuralTax = (isLight || vehicleType === 'truck' || vehicleType === 'van') ? 0 : Math.floor(acqTaxAfter * 0.10);
    const totalAcqTax = acqTaxAfter + acqEduTax + acqRuralTax;

    // ── 3단계: 공채·등록 비용 (근사치) ──
    // 공채매입 할인비: 차량가 × 비율 × 할인율 (지역별 상이, 서울 기준 근사)
    const bondRate = isLight ? 0.01 : vehicleType === 'passenger' || vehicleType === 'electric' ? 0.05 : 0.03;
    const bondFace = Math.floor(acqBase * bondRate);
    const bondDiscount = Math.floor(bondFace * 0.07); // 할인율 약 7%

    // 등록비·번호판
    const registrationFee = isUsed ? 15_000 : 15_000; // 등록수수료
    const plateFee = isUsed ? 12_000 : 12_000;         // 번호판

    // ── 합계 ──
    const totalExtraCost = totalAcqTax + bondDiscount + registrationFee + plateFee;
    const grandTotal = totalCarPrice + totalExtraCost;

    return {
      carPrice, vehicleType, ecoType, isUsed,
      exciseTax, exciseDiscount, exciseAfter: exciseTax - exciseDiscount,
      eduTax, vat, totalCarPrice,
      acqRate, acqTax, acqDiscount, acqTaxAfter,
      acqEduTax, acqRuralTax, totalAcqTax,
      bondDiscount, registrationFee, plateFee,
      totalExtraCost, grandTotal,
      isLight, isEco,
    };
  }

  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🚗</div>차량 가격을 입력해주세요</div>`;
      return;
    }

    const typeLabels = {
      'passenger': '승용차', 'light': '경차', 'truck': '화물차',
      'van': '승합차', 'electric': '전기차',
    };

    container.innerHTML = `
      <div class="breakdown-title">자동차 구매 총 비용</div>
      <div class="breakdown-row">
        <span class="br-label">${r.isUsed ? '매입가격' : '출고가격'}</span>
        <span class="br-value">${UI.fmtWon(r.carPrice)}</span>
      </div>
      ${!r.isUsed && (r.vehicleType === 'passenger' || r.vehicleType === 'electric') ? `
      <div class="breakdown-row">
        <span class="br-label">개별소비세 (5%)</span>
        <span class="br-value">${UI.fmtWon(r.exciseTax)}</span>
      </div>
      ${r.exciseDiscount > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label">친환경차 감면</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.exciseDiscount)}</span>
      </div>` : ''}
      <div class="breakdown-row indent">
        <span class="br-label">교육세 (30%)</span>
        <span class="br-value">${UI.fmtWon(r.eduTax)}</span>
      </div>` : ''}
      ${!r.isUsed ? `
      <div class="breakdown-row">
        <span class="br-label">부가가치세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.vat)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">차량 구매가 (세금 포함)</span>
        <span class="br-value" style="font-weight:700">${UI.fmtWon(r.totalCarPrice)}</span>
      </div>` : ''}
      <div class="breakdown-row" style="border-top:2px solid var(--border)">
        <span class="br-label">취득세 (${(r.acqRate * 100).toFixed(0)}%)</span>
        <span class="br-value">${UI.fmtWon(r.acqTax)}</span>
      </div>
      ${r.acqDiscount > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label">친환경차 감면</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.acqDiscount)}</span>
      </div>` : ''}
      ${r.acqEduTax > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label">지방교육세</span>
        <span class="br-value">${UI.fmtWon(r.acqEduTax)}</span>
      </div>` : ''}
      ${r.acqRuralTax > 0 ? `
      <div class="breakdown-row indent">
        <span class="br-label">농어촌특별세</span>
        <span class="br-value">${UI.fmtWon(r.acqRuralTax)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">등록세 소계</span>
        <span class="br-value">${UI.fmtWon(r.totalAcqTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">공채할인비 (추정)</span>
        <span class="br-value">≈ ${UI.fmtWon(r.bondDiscount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">등록수수료 + 번호판</span>
        <span class="br-value">${UI.fmtWon(r.registrationFee + r.plateFee)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">총 예상 비용</span>
        <span class="br-value">${UI.fmtWon(r.grandTotal)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-vehicle-buying');
    if (!view) return;

    const resultContainer = view.querySelector('#vbuy-result');
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    const doCalc = UI.debounce(() => {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      const result = calculate({
        carPrice: getVal('vbuy-price'),
        vehicleType: view.querySelector('#vbuy-type')?.value || 'passenger',
        ecoType: view.querySelector('#vbuy-eco')?.value || 'none',
        isUsed: view.querySelector('#vbuy-used')?.checked || false,
      });
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', doCalc);
      el.addEventListener('change', doCalc);
    });

    // 복사·인쇄·초기화
    view.querySelector('#vbuy-copy')?.addEventListener('click', async () => {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      const r = calculate({
        carPrice: getVal('vbuy-price'),
        vehicleType: view.querySelector('#vbuy-type')?.value || 'passenger',
        ecoType: view.querySelector('#vbuy-eco')?.value || 'none',
        isUsed: view.querySelector('#vbuy-used')?.checked || false,
      });
      if (!r) return;
      const rows = [
        { label: '차량가격', value: UI.fmtWon(r.carPrice) },
        { label: '등록세 소계', value: UI.fmtWon(r.totalAcqTax) },
        { label: '총 예상 비용', value: UI.fmtWon(r.grandTotal) },
      ];
      await UI.copyText(UI.formatResultForCopy('자동차 구매 총 비용', rows));
      UI.toast('복사되었습니다', 'success');
    });
    view.querySelector('#vbuy-print')?.addEventListener('click', () => UI.printCalc());
    view.querySelector('#vbuy-reset')?.addEventListener('click', () => {
      view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
      view.querySelectorAll('select').forEach(el => el.selectedIndex = 0);
      view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
      renderResult(null, resultContainer);
    });

    doCalc();
  }

  return { init };
})();
