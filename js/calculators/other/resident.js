/* ===== 주민세 계산기 (2026년 기준) ===== */
const CalcResident = (() => {

  // 개인분 본세는 지방자치단체 조례에 따라 다름 (기본 입력값 1만원)
  const INDIVIDUAL_DEFAULT_TAX = 10_000;

  // 사업소분 기본세액 (자본금/매출 기준)
  const BUSINESS_BASE = {
    'small':  50_000,    // 개인사업자, 자본금 30억원 이하 법인, 그 밖의 법인
    'medium': 100_000,   // 자본금 30억원 초과 ~ 50억원 이하 법인
    'large':  200_000,   // 자본금 50억원 초과 법인
  };

  // 사업소분 연면적분 (330㎡ 초과 시)
  const AREA_THRESHOLD = 330;         // ㎡
  const AREA_RATE = 250;              // 원/㎡

  // 종업원분 세율
  const EMPLOYEE_RATE = 0.005;        // 급여총액의 0.5%
  // 종업원분 면제: 최근 1년간 월평균 급여총액 1.8억원 이하 (2025년~ 인상)
  const EMPLOYEE_EXEMPT_SALARY = 180_000_000;

  function calculate(params) {
    const {
      taxSubType,       // 'individual' | 'business' | 'employee'
      // 개인분
      householdCount,    // 납세 대상 인원
      individualTax,     // 조례상 개인분 본세
      individualEduRate, // 지방교육세율
      // 사업소분
      bizScale,          // 사업장 규모
      floorArea,         // 연면적 (㎡)
      businessEduRate,   // 지방교육세율
      // 종업원분
      totalSalary,      // 급여총액 (월)
      employeeCount,    // 종업원 수
    } = params;

    if (taxSubType === 'individual') {
      const count = Math.max(1, householdCount || 1);
      const baseTax = Math.max(0, individualTax || INDIVIDUAL_DEFAULT_TAX);
      const eduRate = individualEduRate === 0.10 ? 0.10 : 0.25;
      const tax = baseTax * count;
      const localEdu = Math.floor(tax * eduRate);
      return {
        taxSubType, householdCount: count,
        baseTax, eduRate, tax, localEdu,
        totalTax: tax + localEdu,
        params,
      };
    }

    if (taxSubType === 'business') {
      const baseTax = BUSINESS_BASE[bizScale] || BUSINESS_BASE['small'];
      const area = floorArea || 0;
      const areaTax = area > AREA_THRESHOLD
        ? Math.floor(area * AREA_RATE)
        : 0;
      // 오염물질 배출 사업소는 별도 (여기서는 미반영)
      const tax = baseTax + areaTax;
      const eduRate = businessEduRate === 0.10 ? 0.10 : 0.25;
      const localEdu = Math.floor(baseTax * eduRate);
      return {
        taxSubType, bizScale, floorArea: area,
        baseTax, areaTax, eduRate, tax, localEdu,
        totalTax: tax + localEdu,
        params,
      };
    }

    if (taxSubType === 'employee') {
      if (!totalSalary || totalSalary <= 0) return null;
      const count = employeeCount || 0;
      // 월평균 급여총액 1.8억원 이하 면제
      const isExempt = totalSalary <= EMPLOYEE_EXEMPT_SALARY;
      const tax = isExempt ? 0 : Math.floor(totalSalary * EMPLOYEE_RATE);
      return {
        taxSubType, totalSalary, employeeCount: count,
        isExempt, rate: EMPLOYEE_RATE,
        tax, totalTax: tax,
        params,
      };
    }

    return null;
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">🏛️</div>
          항목을 선택하고 정보를 입력해주세요
        </div>`;
      return;
    }

    const r = result;

    if (r.taxSubType === 'individual') {
      container.innerHTML = `
        <div class="breakdown-title">주민세 (개인분) 계산 결과</div>
        <div class="breakdown-row">
          <span class="br-label">납세 대상 인원</span>
          <span class="br-value">${r.householdCount}명</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">1명당 개인분 본세</span>
          <span class="br-value">${UI.fmtWon(r.baseTax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">주민세 소계</span>
          <span class="br-value">${UI.fmtWon(r.tax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">지방교육세 (${(r.eduRate * 100).toFixed(0)}%)</span>
          <span class="br-value">${UI.fmtWon(r.localEdu)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">납부할 금액</span>
          <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
        </div>
      `;
      return;
    }

    if (r.taxSubType === 'business') {
      container.innerHTML = `
        <div class="breakdown-title">주민세 (사업소분) 계산 결과</div>
        <div class="breakdown-row">
          <span class="br-label">기본세액</span>
          <span class="br-value">${UI.fmtWon(r.baseTax)}</span>
        </div>
        ${r.areaTax > 0 ? `
        <div class="breakdown-row">
          <span class="br-label">연면적분 (${UI.fmtNum(r.floorArea)}㎡ 전체 × 250원)</span>
          <span class="br-value">${UI.fmtWon(r.areaTax)}</span>
        </div>` : `
        <div class="breakdown-row">
          <span class="br-label">연면적분</span>
          <span class="br-value">0원 (330㎡ 이하)</span>
        </div>`}
        <div class="breakdown-row">
          <span class="br-label">주민세 소계</span>
          <span class="br-value">${UI.fmtWon(r.tax)}</span>
        </div>
        <div class="breakdown-row">
          <span class="br-label">지방교육세 (기본세액 × ${(r.eduRate * 100).toFixed(0)}%)</span>
          <span class="br-value">${UI.fmtWon(r.localEdu)}</span>
        </div>
        <div class="breakdown-row total">
          <span class="br-label">납부할 금액</span>
          <span class="br-value">${UI.fmtWon(r.totalTax)}</span>
        </div>
      `;
      return;
    }

    // 종업원분
    container.innerHTML = `
      <div class="breakdown-title">주민세 (종업원분) 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">월 급여총액</span>
        <span class="br-value">${UI.fmtWon(r.totalSalary)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">종업원 수</span>
        <span class="br-value">${r.employeeCount}명</span>
      </div>
      ${r.isExempt ? `
      <div style="padding:16px;text-align:center">
        <div class="exempt-badge">✅ 납부 면제</div>
        <p style="margin-top:12px;font-size:13px;color:var(--text-secondary)">
          월평균 급여총액 1억 8천만원 이하 사업장은 종업원분 주민세가 <strong>면제</strong>됩니다.
        </p>
      </div>` : `
      <div class="breakdown-row">
        <span class="br-label">세율</span>
        <span class="br-value"><span class="rate-display">0.5%</span></span>
      </div>
      <div class="breakdown-row total">
        <span class="br-label">납부할 금액</span>
        <span class="br-value">${UI.fmtWon(r.tax)}</span>
      </div>`}
    `;
  }

  function init() {
    const view = document.getElementById('view-other-resident');
    if (!view) return;

    const resultContainer = view.querySelector('#resident-result');
    const btnCopy  = view.querySelector('#resident-copy');
    const btnPrint = view.querySelector('#resident-print');
    const btnReset = view.querySelector('#resident-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    // 섹션 토글
    function toggleSections(subType) {
      view.querySelectorAll('[data-section]').forEach(el => {
        el.style.display = el.dataset.section === subType ? '' : 'none';
      });
    }

    function getParams() {
      const subType = [...view.querySelectorAll('input[name="resident-type"]')].find(r => r.checked)?.value || 'individual';
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      return {
        taxSubType:     subType,
        householdCount: parseInt(view.querySelector('#resident-household')?.value || '1') || 1,
        individualTax:  getVal('resident-individual-base') || INDIVIDUAL_DEFAULT_TAX,
        individualEduRate: parseFloat(view.querySelector('#resident-individual-edu-rate')?.value || '0.25'),
        bizScale:       view.querySelector('#resident-biz-scale')?.value || 'small',
        floorArea:      parseFloat(view.querySelector('#resident-area')?.value || '0') || 0,
        businessEduRate: parseFloat(view.querySelector('#resident-business-edu-rate')?.value || '0.25'),
        totalSalary:    getVal('resident-salary'),
        employeeCount:  parseInt(view.querySelector('#resident-emp-count')?.value || '0') || 0,
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      toggleSections(params.taxSubType);
      const result = calculate(params);
      renderResult(result, resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        const typeLabel = { individual: '개인분', business: '사업소분', employee: '종업원분' }[r.taxSubType];
        await UI.copyText(UI.formatResultForCopy(`주민세 (${typeLabel}) 계산`, [
          { label: '유형', value: typeLabel },
          { label: '납부할 금액', value: UI.fmtWon(r.totalTax) },
        ]));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="number"]').forEach(el => el.value = '');
        const individualBase = view.querySelector('#resident-individual-base');
        if (individualBase) individualBase.value = '10,000';
        const firstType = view.querySelector('input[name="resident-type"][value="individual"]');
        if (firstType) firstType.checked = true;
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
