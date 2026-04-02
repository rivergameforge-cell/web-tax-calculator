/* ===== 자동차 살 때 총 비용 계산기 (2026년 기준) ===== */
const CalcVehicleBuying = (() => {

  const EDU_RATE = 0.30; // 교육세: 개소세의 30%

  // 취득세율
  const ACQ_RATES = {
    'passenger': 0.07,
    'light':     0.04,
    'truck':     0.05,
    'van':       0.05,
    'electric':  0.07,
  };

  // 친환경차 취득세 감면 한도
  const ECO_ACQ_MAX = {
    'hybrid':   1_400_000,
    'electric': 1_400_000,
    'hydrogen': 1_400_000,
  };

  // 친환경차 개소세 감면 한도
  const ECO_EXCISE_MAX = {
    'hybrid':   1_000_000,
    'electric': 3_000_000,
    'hydrogen': 4_000_000,
  };

  /**
   * 소비자 판매가(세금 포함)에서 공장출고가를 역산
   * 판매가 = 공장가 × (1 + 개소세율 + 개소세율×0.3) × 1.1
   * → 공장가 = 판매가 / ((1 + exciseRate × 1.3) × 1.1)
   */
  function reverseFactoryPrice(salePrice, exciseRate) {
    const multiplier = (1 + exciseRate * 1.3) * 1.1;
    return Math.floor(salePrice / multiplier);
  }

  function calculate(params) {
    const { salePrice, vehicleType, ecoType, isUsed, exciseRate } = params;
    if (!salePrice || salePrice <= 0) return null;

    const isLight = vehicleType === 'light';
    const isEco = ecoType && ecoType !== 'none';
    const hasExcise = !isUsed && (vehicleType === 'passenger' || vehicleType === 'electric');
    const noExcise = isLight || vehicleType === 'truck' || vehicleType === 'van';

    // ── 1단계: 판매가에서 세금 내역 역산 (신차, 개소세 대상) ──
    let factoryPrice = 0;
    let exciseTax = 0;
    let exciseDiscount = 0;
    let eduTax = 0;
    let vat = 0;

    if (!isUsed && hasExcise) {
      // 승용차/전기차: 개소세 포함 가격에서 역산
      factoryPrice = reverseFactoryPrice(salePrice, exciseRate);
      exciseTax = Math.floor(factoryPrice * exciseRate);

      // 친환경차 개소세 감면
      if (isEco && ECO_EXCISE_MAX[ecoType]) {
        exciseDiscount = Math.min(exciseTax, ECO_EXCISE_MAX[ecoType]);
      }
      const exciseAfter = exciseTax - exciseDiscount;
      eduTax = Math.floor(exciseAfter * EDU_RATE);
      vat = Math.floor((factoryPrice + exciseAfter + eduTax) * 0.10);
    } else if (!isUsed && noExcise) {
      // 경차/화물/승합: 부가세만 포함
      factoryPrice = Math.floor(salePrice / 1.1);
      vat = salePrice - factoryPrice;
    }
    // 중고차: salePrice가 최종 가격

    // ── 2단계: 취득세 (판매가 기준) ──
    const acqRate = ACQ_RATES[vehicleType] || 0.07;
    let acqTax = Math.floor(salePrice * acqRate);

    // 친환경차 취득세 감면
    let acqDiscount = 0;
    if (isEco && ECO_ACQ_MAX[ecoType]) {
      acqDiscount = Math.min(acqTax, ECO_ACQ_MAX[ecoType]);
    }
    const acqTaxAfter = acqTax - acqDiscount;

    // 취득세 부가: 지방교육세 30%, 농특세 10%
    const acqEduTax = isLight ? 0 : Math.floor(acqTaxAfter * 0.30);
    const acqRuralTax = (isLight || vehicleType === 'truck' || vehicleType === 'van') ? 0 : Math.floor(acqTaxAfter * 0.10);
    const totalAcqTax = acqTaxAfter + acqEduTax + acqRuralTax;

    // ── 3단계: 공채·등록 비용 (근사치) ──
    const bondRate = isLight ? 0.01 : (vehicleType === 'passenger' || vehicleType === 'electric') ? 0.05 : 0.03;
    const bondFace = Math.floor(salePrice * bondRate);
    const bondDiscount = Math.floor(bondFace * 0.07);

    const registrationFee = 15_000;
    const plateFee = 12_000;

    // ── 합계: 판매가 + 추가 비용 ──
    const totalExtraCost = totalAcqTax + bondDiscount + registrationFee + plateFee;

    // 친환경차 감면이 있으면 실제 판매가도 줄어듦
    let adjustedSalePrice = salePrice;
    if (!isUsed && hasExcise && exciseDiscount > 0) {
      // 감면분 재계산: 공장가 동일, 세금만 줄어듦
      const exciseAfter = exciseTax - exciseDiscount;
      const adjEduTax = Math.floor(exciseAfter * EDU_RATE);
      const adjVat = Math.floor((factoryPrice + exciseAfter + adjEduTax) * 0.10);
      adjustedSalePrice = factoryPrice + exciseAfter + adjEduTax + adjVat;
    }

    const grandTotal = adjustedSalePrice + totalExtraCost;

    return {
      salePrice, adjustedSalePrice, vehicleType, ecoType, isUsed, exciseRate,
      factoryPrice, exciseTax, exciseDiscount, exciseAfter: exciseTax - exciseDiscount,
      eduTax, vat,
      acqRate, acqTax, acqDiscount, acqTaxAfter,
      acqEduTax, acqRuralTax, totalAcqTax,
      bondDiscount, registrationFee, plateFee,
      totalExtraCost, grandTotal,
      isLight, isEco, hasExcise, noExcise,
    };
  }

  function renderResult(r, container) {
    if (!r) {
      container.innerHTML = `<div class="result-empty"><div class="result-empty-icon">🚗</div>차량 가격을 입력해주세요</div>`;
      return;
    }

    const exciseLabel = `${(r.exciseRate * 100).toFixed(1)}%`;

    container.innerHTML = `
      <div class="breakdown-title">자동차 구매 총 비용</div>
      <div class="breakdown-row">
        <span class="br-label">${r.isUsed ? '매입가격' : '차량 판매가격'}</span>
        <span class="br-value">${UI.fmtWon(r.salePrice)}</span>
      </div>
      ${!r.isUsed && r.hasExcise ? `
      <div class="breakdown-row" style="border-top:1px dashed var(--border);padding-top:8px;margin-top:4px">
        <span class="br-label" style="color:var(--text-muted);font-size:13px">↳ 판매가 내역 (이미 포함)</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">공장출고가</span>
        <span class="br-value">${UI.fmtWon(r.factoryPrice)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">개별소비세 (${exciseLabel})</span>
        <span class="br-value">${UI.fmtWon(r.exciseTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">교육세 (개소세의 30%)</span>
        <span class="br-value">${UI.fmtWon(r.eduTax)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">부가가치세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.vat)}</span>
      </div>
      ${r.exciseDiscount > 0 ? `
      <div class="breakdown-row" style="border-top:1px dashed var(--border);padding-top:8px">
        <span class="br-label" style="color:var(--success)">친환경차 개소세 감면</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(r.exciseDiscount)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">감면 후 실제 구매가</span>
        <span class="br-value" style="font-weight:700">${UI.fmtWon(r.adjustedSalePrice)}</span>
      </div>` : ''}` : ''}
      ${!r.isUsed && r.noExcise ? `
      <div class="breakdown-row indent" style="border-top:1px dashed var(--border);padding-top:8px">
        <span class="br-label" style="color:var(--text-muted);font-size:13px">↳ 개소세 면제 차종</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">공장출고가 (부가세 전)</span>
        <span class="br-value">${UI.fmtWon(r.factoryPrice)}</span>
      </div>
      <div class="breakdown-row indent">
        <span class="br-label">부가가치세 (10%)</span>
        <span class="br-value">${UI.fmtWon(r.vat)}</span>
      </div>` : ''}
      <div class="breakdown-row" style="border-top:2px solid var(--border);padding-top:12px;margin-top:8px">
        <span class="br-label" style="font-weight:700">📋 추가로 내야 할 비용</span>
        <span class="br-value"></span>
      </div>
      <div class="breakdown-row">
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
        <span class="br-label">총 예상 비용 (차량가 + 등록비)</span>
        <span class="br-value">${UI.fmtWon(r.grandTotal)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-vehicle-buying');
    if (!view) return;

    const resultContainer = view.querySelector('#vbuy-result');
    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum(view.querySelector(`#${id}`)?.value || '');
      const exciseRate = view.querySelector('#vbuy-excise-cut')?.checked ? 0.035 : 0.05;
      return {
        salePrice: getVal('vbuy-price'),
        vehicleType: view.querySelector('#vbuy-type')?.value || 'passenger',
        ecoType: view.querySelector('#vbuy-eco')?.value || 'none',
        isUsed: view.querySelector('#vbuy-used')?.checked || false,
        exciseRate,
      };
    }

    const doCalc = UI.debounce(() => {
      const result = calculate(getParams());
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => {
      el.addEventListener('input', doCalc);
      el.addEventListener('change', doCalc);
    });

    // 복사·인쇄·초기화
    view.querySelector('#vbuy-copy')?.addEventListener('click', async () => {
      const r = calculate(getParams());
      if (!r) return;
      const rows = [
        { label: '차량 판매가격', value: UI.fmtWon(r.salePrice) },
        { label: '추가 등록비용', value: UI.fmtWon(r.totalExtraCost) },
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
