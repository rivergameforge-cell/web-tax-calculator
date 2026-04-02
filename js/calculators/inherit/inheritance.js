/* ===== 상속세 계산기 (2026년 기준) ===== */
const CalcInheritance = (() => {

  // 상속세 누진세율표
  const TAX_BRACKETS = [
    { limit: 100_000_000,  rate: 0.10, deduction:          0 },
    { limit: 500_000_000,  rate: 0.20, deduction: 10_000_000 },
    { limit: 1_000_000_000, rate: 0.30, deduction: 60_000_000 },
    { limit: 3_000_000_000, rate: 0.40, deduction: 160_000_000 },
    { limit: Infinity,     rate: 0.50, deduction: 460_000_000 },
  ];

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
      totalAsset,         // 총 상속재산 (원)
      debtAmount,         // 채무·장례비용 등 (원)
      spouseExists,       // 배우자 공제 여부
      spouseInherit,      // 배우자 실제 상속금액 (원, 0이면 법정상속분)
      childCount,         // 자녀 수
      directAncestor,     // 직계존속 수
      cohabitHouse,       // 동거주택 상속공제 여부
      cohabitHousePrice,  // 동거주택 가액 (원)
      financialAsset,     // 금융재산 (원)
      disabledExists,     // 장애인공제 여부
      disabledAge,        // 장애인 나이 (기대여명 적용)
    } = params;

    if (!totalAsset || totalAsset <= 0) return null;

    // 과세가액 = 총재산 - 채무·장례비
    const taxableAsset = Math.max(0, totalAsset - (debtAmount || 0));

    // ── 공제 계산 ──
    let deductions = [];

    // 기초공제 2억
    const basicDeduction = 200_000_000;
    deductions.push({ label: '기초공제', amount: basicDeduction });

    // 자녀공제: 1인당 5천만원
    const childDeduction = childCount * 50_000_000;
    if (childDeduction > 0) deductions.push({ label: `자녀공제 (${childCount}명)`, amount: childDeduction });

    // 직계존속 공제: 65세 이상 1인당 5천만원 (단순 처리)
    const ancestorDeduction = directAncestor * 50_000_000;
    if (ancestorDeduction > 0) deductions.push({ label: `직계존속공제 (${directAncestor}명)`, amount: ancestorDeduction });

    // 장애인 공제: 1000만원 × 기대여명
    let disabledDeduction = 0;
    if (disabledExists && disabledAge > 0) {
      // 간단 기대여명 근사값 (통계청 기준 근사)
      const lifeExpect = Math.max(0, 88 - disabledAge);
      disabledDeduction = lifeExpect * 10_000_000;
      if (disabledDeduction > 0) deductions.push({ label: `장애인공제 (기대여명 ${lifeExpect}년)`, amount: disabledDeduction });
    }

    // 일괄공제: 기초공제+인적공제 합계가 5억 미만이면 일괄공제 5억 선택
    const personalTotal = basicDeduction + childDeduction + ancestorDeduction + disabledDeduction;
    const lumpSum       = 500_000_000;
    let personalDeduction;
    if (personalTotal < lumpSum) {
      personalDeduction = lumpSum;
      deductions = [{ label: '일괄공제 (5억)', amount: lumpSum }];
    } else {
      personalDeduction = personalTotal;
    }

    // 배우자 공제
    let spouseDeduction = 0;
    if (spouseExists) {
      // 최소 5억, 최대 30억 / 법정상속분 한도
      const legalShare       = Math.floor(taxableAsset * 3 / 7); // 법정상속분 (자녀1명 기준 3/7)
      const actualInherit    = spouseInherit > 0 ? spouseInherit : legalShare;
      spouseDeduction        = Math.min(Math.max(actualInherit, 500_000_000), 3_000_000_000);
      deductions.push({ label: '배우자공제', amount: spouseDeduction });
    }

    // 금융재산공제: 2천만원 이상 순금융재산의 20% (최대 2억)
    let financialDeduction = 0;
    if (financialAsset >= 20_000_000) {
      financialDeduction = Math.min(Math.floor(financialAsset * 0.20), 200_000_000);
      if (financialDeduction > 0) deductions.push({ label: '금융재산공제 (20%)', amount: financialDeduction });
    }

    // 동거주택 공제: 6억 한도, 주택가액 × 100%
    let cohabitDeduction = 0;
    if (cohabitHouse && cohabitHousePrice > 0) {
      cohabitDeduction = Math.min(cohabitHousePrice, 600_000_000);
      deductions.push({ label: '동거주택 상속공제', amount: cohabitDeduction });
    }

    const totalDeduction = personalDeduction + spouseDeduction + financialDeduction + cohabitDeduction;
    const taxBase        = Math.max(0, taxableAsset - totalDeduction);
    const inheritanceTax = calcProgressiveTax(taxBase);

    // 신고 세액공제 3% (자진신고)
    const reportDiscount = Math.floor(inheritanceTax * 0.03);
    const finalTax       = Math.max(0, inheritanceTax - reportDiscount);

    return {
      totalAsset, debtAmount: debtAmount || 0,
      taxableAsset, deductions, totalDeduction,
      taxBase, inheritanceTax, reportDiscount, finalTax,
      params,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = `
        <div class="result-empty">
          <div class="result-empty-icon">📋</div>
          상속재산 총액을 입력해주세요
        </div>`;
      return;
    }

    const { totalAsset, debtAmount, taxableAsset, deductions, totalDeduction, taxBase, inheritanceTax, reportDiscount, finalTax } = result;

    const dedRows = deductions.map(d => `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">${d.label}</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(d.amount)}</span>
      </div>`).join('');

    container.innerHTML = `
      <div class="breakdown-title">상속세 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">상속재산 총액</span>
        <span class="br-value">${UI.fmtWon(totalAsset)}</span>
      </div>
      ${debtAmount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">채무·장례비 공제</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(debtAmount)}</span>
      </div>` : ''}
      <div class="breakdown-row">
        <span class="br-label">과세가액</span>
        <span class="br-value">${UI.fmtWon(taxableAsset)}</span>
      </div>
      ${dedRows}
      <div class="breakdown-row">
        <span class="br-label">총 공제액</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(totalDeduction)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">과세표준</span>
        <span class="br-value">${UI.fmtWon(taxBase)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">상속세 산출세액</span>
        <span class="br-value">${UI.fmtWon(inheritanceTax)}</span>
      </div>
      ${reportDiscount > 0 ? `
      <div class="breakdown-row">
        <span class="br-label" style="color:var(--success)">신고 세액공제 (3%)</span>
        <span class="br-value" style="color:var(--success)">- ${UI.fmtWon(reportDiscount)}</span>
      </div>` : ''}
      <div class="breakdown-row total">
        <span class="br-label">최종 납부세액</span>
        <span class="br-value">${UI.fmtWon(finalTax)}</span>
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-inherit-inheritance');
    if (!view) return;

    const resultContainer = view.querySelector('#inh-result');
    const btnCopy  = view.querySelector('#inh-copy');
    const btnPrint = view.querySelector('#inh-print');
    const btnReset = view.querySelector('#inh-reset');

    view.querySelectorAll('input[type="text"]').forEach(el => UI.bindNumInput(el));

    function getParams() {
      const getVal = id => UI.parseNum((view.querySelector(`#${id}`)?.value || '').replace(/,/g, ''));
      const getNum = id => parseInt(view.querySelector(`#${id}`)?.value || '0') || 0;
      return {
        totalAsset:        getVal('inh-total-asset'),
        debtAmount:        getVal('inh-debt'),
        spouseExists:      view.querySelector('#inh-spouse')?.checked || false,
        spouseInherit:     getVal('inh-spouse-inherit'),
        childCount:        getNum('inh-child-count'),
        directAncestor:    getNum('inh-ancestor-count'),
        cohabitHouse:      view.querySelector('#inh-cohabit')?.checked || false,
        cohabitHousePrice: getVal('inh-cohabit-price'),
        financialAsset:    getVal('inh-financial'),
        disabledExists:    view.querySelector('#inh-disabled')?.checked || false,
        disabledAge:       getNum('inh-disabled-age'),
      };
    }

    const doCalc = UI.debounce(() => {
      const params = getParams();
      const result = calculate(params);
      renderResult(result, resultContainer);

      // 조건부 필드 표시
      const spouseSection  = view.querySelector('#inh-spouse-section');
      const cohabitSection = view.querySelector('#inh-cohabit-section');
      const disabledSection = view.querySelector('#inh-disabled-section');
      if (spouseSection)  spouseSection.style.display  = params.spouseExists ? '' : 'none';
      if (cohabitSection) cohabitSection.style.display = params.cohabitHouse ? '' : 'none';
      if (disabledSection) disabledSection.style.display = params.disabledExists ? '' : 'none';
    }, 200);

    view.querySelectorAll('input').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.addEventListener('input', doCalc));

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const result = calculate(getParams());
        if (!result) return;
        const rows = [
          { label: '상속재산 총액', value: UI.fmtWon(result.totalAsset) },
          { label: '과세표준',     value: UI.fmtWon(result.taxBase) },
          { label: '상속세 산출세액', value: UI.fmtWon(result.inheritanceTax) },
          { label: '최종 납부세액', value: UI.fmtWon(result.finalTax) },
        ];
        await UI.copyText(UI.formatResultForCopy('상속세 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }
    if (btnPrint) btnPrint.addEventListener('click', () => UI.printCalc());
    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"], input[type="number"]').forEach(el => el.value = '');
        view.querySelectorAll('input[type="checkbox"]').forEach(el => el.checked = false);
        renderResult(null, resultContainer);
        doCalc();
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
