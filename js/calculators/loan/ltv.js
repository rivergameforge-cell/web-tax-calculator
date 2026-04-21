/* ===== LTV 계산기 (2026년 기준) ===== */
const CalcLTV = (() => {

  // LTV 한도 테이블 — { lo: 9억 이하 LTV%, hi: 9억 초과 LTV% }
  // 2026년 현행 기준: 투기과열 40/20%, 조정대상 50/30%, 비규제 70%
  // 처분 조건부 1주택 = 무주택자와 동일 적용
  const LTV_TABLE = {
    'non-regulated': {
      homeless: { lo: 70, hi: 70 },
      '1house': { lo: 70, hi: 70 },
      multi:    { lo: 70, hi: 70 },
    },
    'regulated': {          // 조정대상지역
      homeless: { lo: 50, hi: 30 },
      '1house': { lo: 50, hi: 30 },  // 처분 조건부 = 무주택 동일
      multi:    { lo: 0,  hi: 0  },
    },
    'speculative': {        // 투기과열지구
      homeless: { lo: 40, hi: 20 },
      '1house': { lo: 0,  hi: 0  },  // 원칙적 불가
      multi:    { lo: 0,  hi: 0  },
    },
    'permit': {             // 토허제 (토지거래허가구역)
      homeless: { lo: 40, hi: 20 },  // 투기과열지구와 동일
      '1house': { lo: 0,  hi: 0  },  // 실거주 외 원칙적 불가
      multi:    { lo: 0,  hi: 0  },
    },
  };

  // 주택 시가별 대출 금액 상한 (수도권·규제지역·토허제 공통)
  // 15억 이하: 6억 / 15억 초과~25억: 4억 / 25억 초과: 2억
  const AMOUNT_CAPS = {
    'regulated':   true,
    'speculative': true,
    'permit':      true,
  };
  function getAmountCap(region, propertyValue) {
    if (!AMOUNT_CAPS[region]) return Infinity;
    if (propertyValue <= 1_500_000_000) return 600_000_000;
    if (propertyValue <= 2_500_000_000) return 400_000_000;
    return 200_000_000;
  }

  const REGION_LABELS = {
    'non-regulated': '비규제지역',
    'regulated':     '조정대상지역',
    'speculative':   '투기과열지구',
    'permit':        '토허제(토지거래허가구역)',
  };
  const HOUSING_LABELS = {
    homeless: '무주택',
    '1house': '1주택 (처분 조건부)',
    multi:    '2주택 이상',
  };

  function calculate(params) {
    const { propertyValue, loanAmount, region, housing, loanType, existingLoan } = params;
    if (!propertyValue || propertyValue <= 0) return null;

    const rates = LTV_TABLE[region]?.[housing] ?? { lo: 70, hi: 70 };
    const { lo, hi } = rates;

    // 9억 구간별 LTV 적용
    const TIER = 900_000_000;
    let maxLoanByLTV;
    if (lo === 0) {
      maxLoanByLTV = 0;
    } else if (propertyValue <= TIER) {
      maxLoanByLTV = Math.floor(propertyValue * lo / 100);
    } else {
      maxLoanByLTV = Math.floor(TIER * lo / 100 + (propertyValue - TIER) * hi / 100);
    }

    // 금액 상한 적용
    const amountCap = getAmountCap(region, propertyValue);
    const maxLoanTotal = Math.min(maxLoanByLTV, amountCap);
    const capApplied = amountCap < Infinity && maxLoanByLTV > amountCap;

    // 기존 대출 차감
    const maxLoanAvailable = Math.max(0, maxLoanTotal - (existingLoan || 0));

    // 유효 LTV% (표시용)
    const effectiveLtvPct = propertyValue > 0 ? (maxLoanTotal / propertyValue) * 100 : 0;

    // 현재 LTV 계산 (대출 희망 금액 입력 시)
    let currentLTV = null;
    let isOver = false;
    if (loanAmount > 0) {
      const totalLoan = loanAmount + (existingLoan || 0);
      currentLTV = (totalLoan / propertyValue) * 100;
      isOver = totalLoan > maxLoanTotal;
    }

    return {
      propertyValue,
      loanAmount: loanAmount || 0,
      existingLoan: existingLoan || 0,
      region, housing, loanType,
      ltvLo: lo, ltvHi: hi,
      maxLoanByLTV, amountCap, capApplied,
      maxLoanTotal, maxLoanAvailable,
      effectiveLtvPct,
      currentLTV, isOver,
      regionLabel: REGION_LABELS[region] || region,
      housingLabel: HOUSING_LABELS[housing] || housing,
    };
  }

  function fmtLtvRate(lo, hi) {
    if (lo === 0) return '0%';
    if (lo === hi) return `${lo}%`;
    return `${lo}% <small style="color:var(--text-secondary)">(9억 초과분 ${hi}%)</small>`;
  }

  function renderResult(result, container) {
    if (!result) {
      container.innerHTML = '<div class="result-empty"><div class="result-empty-icon">🏠</div>주택 가격을 입력해주세요</div>';
      return;
    }

    const r = result;
    const loanTypeLabel = r.loanType === 'bank' ? '은행권' : '비은행권';
    const isBlocked = r.ltvLo === 0;

    // 현재 LTV 섹션
    let currentLTVSection = '';
    if (r.currentLTV !== null) {
      const refPct = r.effectiveLtvPct > 0 ? r.effectiveLtvPct : r.ltvLo;
      const barWidth = refPct > 0 ? Math.min(r.currentLTV / refPct * 100, 150) : 0;
      currentLTVSection = `
        <div class="breakdown-row total">
          <span class="br-label">현재 LTV</span>
          <span class="br-value" style="color:${r.isOver ? 'var(--danger)' : 'var(--success)'}">${r.currentLTV.toFixed(1)}%</span>
        </div>
        <div style="margin:12px 0 8px">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:var(--text-secondary);margin-bottom:4px">
            <span>0%</span>
            <span style="color:${r.isOver ? 'var(--danger)' : 'var(--text-secondary)'}">한도 ${r.effectiveLtvPct.toFixed(1)}%</span>
          </div>
          <div style="background:var(--bg-secondary);border-radius:8px;height:20px;position:relative;overflow:hidden">
            <div style="width:${Math.min(barWidth, 100)}%;height:100%;background:${r.isOver ? 'var(--danger)' : 'var(--accent)'};border-radius:8px;transition:width 0.3s"></div>
            <div style="position:absolute;left:${Math.min(100 / 1.5, 100)}%;top:0;height:100%;width:2px;background:var(--text-secondary)"></div>
          </div>
        </div>
        <div class="notice-box ${r.isOver ? 'danger' : 'info'}" style="margin-top:12px">
          ${r.isOver
            ? `<strong>한도 초과!</strong> 최대 대출가능액(${UI.fmtWon(r.maxLoanAvailable)})을 초과하여 대출이 어려울 수 있습니다.`
            : `<strong>LTV 여유 있음</strong> ${r.regionLabel} · ${r.housingLabel} 기준 한도 이내입니다.`}
        </div>`;
    }

    // 금액 상한 안내
    const capSection = r.capApplied ? `
      <div class="notice-box warning" style="margin-top:8px">
        <strong>금액 상한 적용</strong> 주택 시가 ${r.propertyValue > 2_500_000_000 ? '25억 초과 → 최대 2억원' : '15억 초과~25억 → 최대 4억원'} 규제가 적용되었습니다 (LTV 계산액 ${UI.fmtWon(r.maxLoanByLTV)} → ${UI.fmtWon(r.amountCap)}).
      </div>` : '';

    // 특별 안내 메시지
    let specialNotice = '';
    if (isBlocked) {
      specialNotice = `
        <div class="notice-box danger" style="margin-top:12px">
          <strong>대출 원칙적 불가</strong> ${r.regionLabel}에서 ${r.housingLabel}자는 주택담보대출이 제한됩니다.
        </div>`;
    } else if ((r.region === 'regulated' || r.region === 'speculative') && r.housing === '1house') {
      specialNotice = `
        <div class="notice-box info" style="margin-top:12px">
          <strong>처분 조건부 허용</strong> 기존 주택을 일정 기간 내 처분하는 조건으로 대출이 가능합니다. 금융기관에서 처분 이행 확약서를 요구합니다.
        </div>`;
    } else if (r.region === 'permit') {
      specialNotice = `
        <div class="notice-box warning" style="margin-top:12px">
          <strong>토허제 실거주 의무</strong> 토지거래허가구역에서는 실거주 목적에 한해 허가를 받아야 하며, 허가 없이 취득 시 계약이 무효입니다. 투기·임대 목적 구입은 허가 불가합니다.
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
        <span class="br-value" style="font-weight:600">${fmtLtvRate(r.ltvLo, r.ltvHi)}</span>
      </div>
      <div class="breakdown-row">
        <span class="br-label">LTV 기준 최대액</span>
        <span class="br-value">${isBlocked ? '—' : UI.fmtWon(r.maxLoanByLTV)}</span>
      </div>
      ${r.capApplied ? `
      <div class="breakdown-row" style="color:var(--warning)">
        <span class="br-label">시가 상한 적용</span>
        <span class="br-value">→ ${UI.fmtWon(r.amountCap)}</span>
      </div>` : ''}
      ${r.existingLoan > 0 ? `
      <div class="breakdown-row">
        <span class="br-label">기존 담보대출 잔액</span>
        <span class="br-value">- ${UI.fmtWon(r.existingLoan)}</span>
      </div>` : ''}
      <div class="breakdown-row total" style="font-size:15px">
        <span class="br-label">최대 대출가능액</span>
        <span class="br-value" style="color:var(--accent)">${isBlocked ? '대출 불가' : UI.fmtWon(r.maxLoanAvailable)}</span>
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
      ${capSection}
      ${specialNotice}
      <div style="font-size:11px;color:var(--text-muted);margin-top:12px">
        * 실제 한도는 금융기관·DSR·생애최초 여부 등에 따라 달라질 수 있습니다
      </div>
    `;
  }

  function init() {
    const view = document.getElementById('view-loan-ltv');
    if (!view) return;

    const resultContainer = view.querySelector('#ltv-result');

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
        loanAmount:    getNum('ltv-loan-amount'),
        region:        view.querySelector('input[name="ltv-region"]:checked')?.value || 'non-regulated',
        housing:       view.querySelector('input[name="ltv-housing"]:checked')?.value || 'homeless',
        loanType:      view.querySelector('input[name="ltv-loantype"]:checked')?.value || 'bank',
        existingLoan:  getNum('ltv-existing-loan'),
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
          { label: '주택 가격',     value: UI.fmtWon(r.propertyValue) },
          { label: 'LTV 한도',      value: r.ltvLo === r.ltvHi ? `${r.ltvLo}%` : `${r.ltvLo}% / ${r.ltvHi}%` },
          { label: '최대 대출가능액', value: UI.fmtWon(r.maxLoanAvailable) },
        ];
        if (r.currentLTV !== null) rows.push({ label: '현재 LTV', value: r.currentLTV.toFixed(1) + '%' });
        await UI.copyText(UI.formatResultForCopy('LTV 계산', rows));
        UI.toast('복사되었습니다', 'success');
      });
    }

    if (btnReset) {
      btnReset.addEventListener('click', () => {
        view.querySelectorAll('input[type="text"]').forEach(el => el.value = '');
        const defaultRadios = { 'ltv-region': 'non-regulated', 'ltv-housing': 'homeless', 'ltv-loantype': 'bank' };
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
