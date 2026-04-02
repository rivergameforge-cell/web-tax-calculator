/* ===== 등록면허세 계산기 (2026년 기준) ===== */
const CalcRegistration = (() => {

  // 등록면허세율 (지방세법 기준)
  const RATES = {
    // 부동산 소유권 이전
    'ownership-transfer-housing': { rate: 0.008,  label: '주택 소유권 이전 (0.8%)' },
    'ownership-transfer-other':   { rate: 0.020,  label: '토지·건물 소유권 이전 (2%)' },
    // 부동산 소유권 보존
    'ownership-conservation':     { rate: 0.008,  label: '소유권 보존 등기 (0.8%)' },
    // 저당권 설정 (근저당)
    'mortgage':                   { rate: 0.002,  label: '저당권(근저당) 설정 (0.2%)' },
    // 전세권 설정
    'lease':                      { rate: 0.002,  label: '전세권 설정 (0.2%)' },
    // 지상권 설정
    'surface':                    { rate: 0.002,  label: '지상권 설정 (0.2%)' },
  };

  function calculate(params) {
    const {
      regType,         // 등기 유형
      propertyValue,   // 부동산 가액 또는 채권금액 (원)
      isFirstHome,     // 생애최초 주택 취득 감면 여부
    } = params;

    if (!propertyValue || propertyValue <= 0) return null;

    const regInfo = RATES[regType] || RATES['ownership-transfer-other'];
    let regTax    = Math.floor(propertyValue * regInfo.rate);

    // 생애최초 주택 소유권 이전: 200만원 한도 감면
    let discount = 0;
    if (isFirstHome && regType === 'ownership-transfer-housing') {
      discount = Math.min(regTax, 2_000_000);
    }

    // 최소세액 (도시지역 6천원, 기타 3천원 - 단순화)
    const minTax = 3_000;
    regTax = Math.max(minTax, regTax - discount);

    // 지방교육세: 등록면허세의 20%
    const eduTax   = Math.floor(regTax * 0.20);
    const totalTax = regTax + eduTax;

    return {
      propertyValue, regType,
      regLabel: regInfo.label,
      regRate:  regInfo.rate,
      regTaxBefore: Math.floor(propertyValue * regInfo.rate),
      discount, regTax, eduTax, totalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📋</div>
          부동산 가액을 입력해주세요
        </div>`;
      return;
    }

    const { propertyValue, regLabel, regRate, regTaxBefore, discount, regTax, eduTax, totalTax } = result;

    container.innerHTML = `
      <div class="breakdown-title">등록면허세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">등기 유형</span>
        <span class="br-value" style="font-size:13px">${regLabel}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">부동산 가액 (채권금액)</span>
        <span class="br-value">${UI.fmtWon(propertyValue)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">등록면허세율</span>
        <span class="br-value"><span class="rate-display">${(regRate * 100).toFixed(1)}%</span></span>
      </div>
      ${discount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">산출세액</span>
        <span class="br-value">${UI.fmtWon(regTaxBefore)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">생애최초 감면</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(discount)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">등록면허세</span>
        <span class="br-value">${UI.fmtWon(regTax)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">지방교육세 (20%)</span>
        <span class="br-value">${UI.fmtWon(eduTax)}</span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(totalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-real-estate-registration');
    if (!view) return;

    const resultContainer = view.querySelector('#reg-result');
    const btnCopy  = view.querySelector('#reg-copy');
    const btnPrint = view.querySelector('#reg-print');
    const btnReset = view.querySelector('#reg-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      return {
        regType:       view.querySelector('#reg-type')?.value || 'ownership-transfer-housing',
        propertyValue: UI.parseNum((view.querySelector('#reg-value')?.value || '').replace(/,/g, '')),
        isFirstHome:   view.querySelector('#reg-first-home')?.checked || false,
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 생애최초 체크박스: 주택 소유권 이전일 때만 표시
      const firstHomeGroup = view.querySelector('#reg-first-home-group');
      if (firstHomeGroup) {
        firstHomeGroup.style.display = params.regType === 'ownership-transfer-housing' ? '' : 'none';
      }
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '부동산 가액',   value: UI.fmtWon(result.propertyValue) },
          { label: '등록면허세',    value: UI.fmtWon(result.regTax) },
          { label: '지방교육세',    value: UI.fmtWon(result.eduTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.totalTax) },
        ];
        await UI.copyText(UI.formatResultForCopy('등록면허세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        const sel = view.querySelector('#reg-type');
        if (sel) sel.value = 'ownership-transfer-housing';
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
