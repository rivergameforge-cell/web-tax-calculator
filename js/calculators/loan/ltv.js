/* ===== LTV 계산기 (2026년 기준) ===== */
const CalcLTV = (() => {

  // LTV 한도 테이블 (2026년 기준)
  // [규제지역][주택보유수][대출유형] = LTV%
  // 2024년 9월~ 완화 기준 반영
  const LTV_TABLE = {
    'non-regulated': {
      homeless:  { bank: 70, nonbank: 70 },
      '1house':  { bank: 70, nonbank: 70 },
      multi:     { bank: 70, nonbank: 70 },
    },
    'regulated': {
      homeless:  { bank: 40, nonbank: 40 },
      '1house':  { bank: 40, nonbank: 40 },  // 처분 조건부 시 40% 허용 (2024.9~ 완화)
      multi:     { bank: 0,  nonbank: 0  },
    },
    'speculative': {
      homeless:  { bank: 40, nonbank: 40 },
      '1house':  { bank: 0,  nonbank: 0  },  // 투기과열지구는 원칙적 불가
      multi:     { bank: 0,  nonbank: 0  },
    },
  };

  const REGION_LABELS = {
    'non-regulated': '비규제지역',
    'regulated': '조정대상지역',
    'speculative': '투기과열지구',
  };
  const HOUSING_LABELS = {
    homeless: '무주택',
    '1house': '1주택 (처분 조건부)',
    multi: '2주택 이상',
  };

  function calculate(params) {
    const { propertyValue, loanAmount, region, housing, loanType, existingLoan } = params;
    if (!propertyValue || propertyValue <= 0) return null;

    const ltvLimit = LTV_TABLE[region]?.[housing]?.[loanType] ?? 70;
    const ltvLimitRate = ltvLimit / 100;

    // 최대 대출가능액 = 주택가격 × LTV - 기존대출잔액
    const maxLoanTotal = Math.floor(propertyValue * ltvLimitRate);
    const maxLoanAvailable = Math.max(0, maxLoanTotal - (existingLoan || 0));

    // 현재 LTV 계산 (대출 희망 금액 입력 시)
    let currentLTV = null;
    let isOver = false;
    if (loanAmount > 0) {
      const totalLoan = loanAmount + (existingLoan || 0);
      currentLTV = (totalLoan / propertyValue) * 100;
      isOver = currentLTV > ltvLimit;
    }

    return {
      propertyValue,
      loanAmount: loanAmount || 0,
      existingLoan: existingLoan || 0,
      region,
      housing,
      loanType,
      ltvLimit,
      maxLoanTotal,
      maxLoanAvailable,
      currentLTV,
      isOver,
      regionLabel: REGION_LABELS[region] || region,
      housingLabel: HOUSING_LABELS[housing] || housing,
    };
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = '<div class="result-empty"><div class="result-empty-icon">🏠</div>주택 가격을 입력해주세요</div>';
      return;
    }

    const r = result;
    const loanTypeLabel = r.loanType === 'bank' ? '은행권' : '비은행권';

    let currentLTVSection = '';
    if (r.currentLTV !== null) {
      const barWidth = Math.min(r.currentLTV / Math.max(r.ltvLimit, 1) * 100, 150);
      currentLTVSection = `
        <div class="breakdown-row total">
          <span class="br-label">현재 LTV</span>
          <span class="br-value" style="color:${r.isOver ? 'var(--danger)' : 'var(--success)'}">${r.currentLTV.toFixed(1)}%</span>
        </div>
        <div style="margin:12px 0 8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px">
            <span>0%</span>
            <span style="color:${r.isOver ? 'var(--danger)' : 'var(--text-secondary)'}">LTV 한도 ${r.ltvLimit}%</span>
          </div>
          <div style="background:var(--bg-secondary);border-radius:8px;height:20px;position:relative;overflow:hidden">
            <div style="width:${Math.min(barWidth, 100)}%;height:100%;background:${r.isOver ? 'var(--danger)' : 'var(--accent)'};border-radius:8px;transition:width 0.3s"></div>
            <div style="position:absolute;left:${r.ltvLimit > 0 ? 100 * r.ltvLimit / (r.ltvLimit * 1.5) : 66}%;top:0;height:100%;width:2px;background:var(--text-secondary)"></div>
          </div>
        </div>
        <div class="notice-box ${r.isOver ? 'danger' : 'info'}" style="margin-top:12px">
          ${r.isOver
            ? `<strong>LTV 한도 초과!</strong> ${r.regionLabel} · ${r.housingLabel} 기준 LTV ${r.ltvLimit}%를 초과하여 대출이 어려울 수 있습니다.`
            : `<strong>LTV 여유 있음</strong> ${r.regionLabel} · ${r.housingLabel} 기준 LTV ${r.ltvLimit}% 이내입니다.`}
        </div>`;
    }

    container.innerHTML = `
      <div class="breakdown-title">LTV 계산 결과</div>
      <div class="breakdown-row">
        <span class="br-label">주택 가격</span>
        <span class="br-value">${UI.fmtWon(r.propertyValue)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">적용 조건</span>
        <span class="br-value" style="font-size:13px">${r.regionLabel} · ${r.housingLabel} · ${loanTypeLabel}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">LTV 한도</span>
        <span class="br-value" style="font-weight:600">${r.ltvLimit}%</span>
      </div>
      ${r.existingLoan > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기존 담보대출 잔액</span>
        <span class="br-value">- ${UI.fmtWon(r.existingLoan)}</span>
      </div>` : ''}
      <div class="breakdown-row total" style="font-size:15px">
        <span class="br-label">최대 대출가능액</span>
        <span class="br-value" style="color:var(--accent)">${r.ltvLimit === 0 ? '대출 불가' : UI.fmtWon(r.maxLoanAvailable)}</span>
      </div>
      ${r.loanAmount > 0 ? `
      <div class="breakdown-row" style="margin-top:8px">
        <span class="br-label">대출 희망 금액</span>
        <span class="br-value">${UI.fmtWon(r.loanAmount)}</span>
      </div>
      ${r.existingLoan > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">총 담보대출 (기존+신규)</span>
        <span class="br-value">${UI.fmtWon(r.loanAmount + r.existingLoan)}</span>
      </div>` : ''}` : ''}
      ${currentLTVSection}
      ${r.ltvLimit === 0 ? `
      <div class="notice-box danger" style="margin-top:12px">
        <strong>대출 원칙적 불가</strong> ${r.regionLabel}에서 ${r.housingLabel}자는 주택담보대출이 제한됩니다.
      </div>` : ''}
      ${r.region === 'regulated' && r.housing === '1house' ? `
      <div class="notice-box info" style="margin-top:12px">
        <strong>처분 조건부 허용</strong> 조정대상지역 1주택자는 기존 주택을 일정 기간 내 처분하는 조건으로 LTV 40% 대출이 가능합니다. 실제 실행 시 금융기관에서 처분 이행 확약서를 요구합니다.
      </div>` : ''}
      <div style="font-size:11px;color:var(--text-muted);margin-top:12px">
        * 실제 LTV 한도는 금융기관, 주택 가격대, 생애최초 여부 등에 따라 달라질 수 있습니다
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-loan-ltv');
    if (!view) return;

    const resultContainer = view.querySelector('#ltv-result');

    // 금액 입력 포맷팅
    const numInputs = ['ltv-property-value', 'ltv-loan-amount', 'ltv-existing-loan'];
    numInputs.forEach(id => {
      const input = view.querySelector(`#${id}`);
      if (!input) return;
      UI.bindNumInput(input);
    });

    function getParams() {
      const getNum = id => {
        const el = view.querySelector(`#${id}`);
        if (!el) return 0;
        return parseFloat(el.value.replace(/,/g, '')) || 0;
      };
      return {
        propertyValue: getNum('ltv-property-value'),
        loanAmount: getNum('ltv-loan-amount'),
        region: view.querySelector('input[name="ltv-region"]:checked')?.value || 'non-regulated',
        housing: view.querySelector('input[name="ltv-housing"]:checked')?.value || 'homeless',
        loanType: view.querySelector('input[name="ltv-loantype"]:checked')?.value || 'bank',
        existingLoan: getNum('ltv-existing-loan'),
      };
    }

    const doCalc = UI.debounce(() => {
      renderResult(calculate(getParams()), resultContainer);
    }, 200);

    view.querySelectorAll('input, select').forEach(el => el.addEventListener('change', doCalc));
    view.querySelectorAll('input[type="text"]').forEach(el => el.addEventListener('input', doCalc));

    const btnCopy = view.querySelector('#ltv-copy');
    const btnReset = view.querySelector('#ltv-reset');

    if (btnCopy) {
      btnCopy.addEventListener('click', async () => {
        const r = calculate(getParams());
        if (!r) return;
        const rows = [
          { label: '주택 가격', value: UI.fmtWon(r.propertyValue) },
          { label: 'LTV 한도', value: r.ltvLimit + '%' },
          { label: '최대 대출가능액', value: UI.fmtWon(r.maxLoanAvailable) },
        ];
        if (r.currentLTV !== null) {
          rows.push({ label: '현재 LTV', value: r.currentLTV.toFixed(1) + '%' });
        }
        await UI.copyText(UI.formatResultForCopy('LTV 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const defaultRadios = {
          'ltv-region': 'non-regulated',
          'ltv-housing': 'homeless',
          'ltv-loantype': 'bank',
        };
        Object.entries(defaultRadios).forEach(([name, value]) => {
          const radio = view.querySelector(`input[name="${name}"][value="${value}"]`);
          if (radio) radio.checked = true;
        });
        renderResult(null, resultContainer);
      });
    }

    doCalc();
  }

  return { init, calculate };
})();
