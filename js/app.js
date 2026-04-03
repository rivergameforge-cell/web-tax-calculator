/* ===== App Main ===== */

// Sidebar navigation config
const NAV_CONFIG = [
  {
    id: 'loan',
    label: '대출 계산기',
    icon: '🏦',
    color: 'var(--cat-loan)',
    items: [
      { id: 'loan/calculator', label: '대출금 계산기', badge: null },
    ]
  },
  {
    id: 'real-estate',
    label: '부동산',
    icon: '🏠',
    color: 'var(--cat-realestate)',
    items: [
      { id: 'real-estate/acquisition', label: '취득세', badge: null },
      { id: 'real-estate/capital-gains', label: '양도소득세', badge: null },
      { id: 'real-estate/comprehensive', label: '종합부동산세', badge: null },
      { id: 'real-estate/property-tax', label: '재산세', badge: null },
      { id: 'real-estate/rental-income', label: '임대소득세', badge: null },
      { id: 'real-estate/stamp', label: '인지세', badge: null },
      { id: 'real-estate/registration', label: '등록면허세', badge: null },
      { id: 'real-estate/commission', label: '부동산 복비', badge: null },
      { id: 'real-estate/total-cost', label: '집 살 때 / 팔 때', badge: '종합' },
    ]
  },
  {
    id: 'inherit',
    label: '상속/증여',
    icon: '📜',
    color: 'var(--cat-inherit)',
    items: [
      { id: 'inherit/inheritance', label: '상속세', badge: null },
      { id: 'inherit/gift', label: '증여세', badge: null },
    ]
  },
  {
    id: 'vehicle',
    label: '자동차',
    icon: '🚗',
    color: 'var(--cat-vehicle)',
    items: [
      { id: 'vehicle/vehicle-tax', label: '자동차세', badge: null },
      { id: 'vehicle/acquisition', label: '자동차 취득세', badge: null },
      { id: 'vehicle/excise', label: '자동차 개별소비세', badge: null },
      { id: 'vehicle/buying', label: '자동차 살 때', badge: '종합' },
      { id: 'vehicle/overdue', label: '자동차세 미납', badge: null },
    ]
  },
  {
    id: 'income',
    label: '소득',
    icon: '💼',
    color: 'var(--cat-income)',
    items: [
      { id: 'income/salary', label: '연봉 계산기', badge: '인기' },
      { id: 'income/employment', label: '근로소득세·연말정산', badge: null },
      { id: 'income/business', label: '사업소득세', badge: null },
      { id: 'income/comprehensive', label: '종합소득세', badge: null },
      { id: 'income/penalty', label: '종합소득세 가산세', badge: null },
      { id: 'income/corporate', label: '법인세', badge: null },
      { id: 'income/insurance', label: '4대보험', badge: '인기' },
      { id: 'income/interest-dividend', label: '이자·배당소득세', badge: null },
      { id: 'income/retirement', label: '퇴직소득세', badge: null },
      { id: 'income/vat', label: '부가가치세', badge: null },
      { id: 'income/customs', label: '해외 구매 관세', badge: '인기' },
    ]
  },
  {
    id: 'stocks',
    label: '주식/금융',
    icon: '📈',
    color: 'var(--cat-stocks)',
    items: [
      { id: 'stocks/domestic', label: '국내주식 양도소득세', badge: null },
      { id: 'stocks/foreign', label: '해외주식 양도소득세', badge: null },
      { id: 'stocks/transaction', label: '증권거래세', badge: null },
      { id: 'stocks/dividend', label: '배당소득세', badge: null },
    ]
  },
  {
    id: 'other',
    label: '기타',
    icon: '📋',
    color: 'var(--cat-other)',
    items: [
      { id: 'other/resident', label: '주민세', badge: null },
      { id: 'other/fuel', label: '유류세', badge: 'ℹ️' },
      { id: 'other/customs-info', label: '관세', badge: 'ℹ️' },
      { id: 'other/excise-info', label: '개별소비세', badge: 'ℹ️' },
      { id: 'other/liquor', label: '주세', badge: 'ℹ️' },
      { id: 'other/tobacco', label: '담배소비세', badge: 'ℹ️' },
      { id: 'other/leisure', label: '레저세', badge: 'ℹ️' },
    ]
  },
];

// Search index
const SEARCH_INDEX = [];
NAV_CONFIG.forEach(cat => {
  cat.items.forEach(item => {
    SEARCH_INDEX.push({
      id: item.id,
      label: item.label,
      category: cat.label,
      icon: cat.icon,
    });
  });
});

// Tab bar config per category
const TAB_CONFIG = {
  'loan': [
    { id: 'loan/calculator', label: '대출금 계산기' },
  ],
  'real-estate': [
    { id: 'real-estate/acquisition', label: '취득세' },
    { id: 'real-estate/capital-gains', label: '양도소득세' },
    { id: 'real-estate/comprehensive', label: '종합부동산세' },
    { id: 'real-estate/property-tax', label: '재산세' },
    { id: 'real-estate/rental-income', label: '임대소득세' },
    { id: 'real-estate/stamp', label: '인지세' },
    { id: 'real-estate/registration', label: '등록면허세' },
    { id: 'real-estate/commission', label: '복비 계산' },
    { id: 'real-estate/total-cost', label: '집 살 때/팔 때' },
  ],
  'inherit': [
    { id: 'inherit/inheritance', label: '상속세' },
    { id: 'inherit/gift', label: '증여세' },
  ],
  'vehicle': [
    { id: 'vehicle/vehicle-tax', label: '자동차세' },
    { id: 'vehicle/acquisition', label: '자동차 취득세' },
    { id: 'vehicle/excise', label: '개별소비세' },
    { id: 'vehicle/buying', label: '자동차 살 때' },
    { id: 'vehicle/overdue', label: '미납 가산금' },
  ],
  'income': [
    { id: 'income/salary', label: '연봉 계산기' },
    { id: 'income/employment', label: '근로소득세·연말정산' },
    { id: 'income/business', label: '사업소득세' },
    { id: 'income/comprehensive', label: '종합소득세' },
    { id: 'income/penalty', label: '가산세' },
    { id: 'income/corporate', label: '법인세' },
    { id: 'income/insurance', label: '4대보험' },
    { id: 'income/interest-dividend', label: '이자·배당소득세' },
    { id: 'income/retirement', label: '퇴직소득세' },
    { id: 'income/vat', label: '부가가치세' },
    { id: 'income/customs', label: '해외구매 관세' },
  ],
  'stocks': [
    { id: 'stocks/domestic', label: '국내주식' },
    { id: 'stocks/foreign', label: '해외주식' },
    { id: 'stocks/transaction', label: '증권거래세' },
    { id: 'stocks/dividend', label: '배당소득세' },
  ],
  'other': [
    { id: 'other/resident', label: '주민세' },
    { id: 'other/fuel', label: '유류세' },
    { id: 'other/customs-info', label: '관세 안내' },
    { id: 'other/excise-info', label: '개별소비세' },
    { id: 'other/liquor', label: '주세' },
    { id: 'other/tobacco', label: '담배소비세' },
    { id: 'other/leisure', label: '레저세' },
  ],
};

const App = (() => {

  let currentCategory = null;

  function getCategoryOfRoute(routeId) {
    return routeId ? routeId.split('/')[0] : null;
  }

  function buildSidebar() {
    const sidebar = document.getElementById('sidebar');
    const mobileCatStrip = document.getElementById('mobile-cat-strip');
    if (!sidebar) return;

    NAV_CONFIG.forEach(cat => {
      // Mobile category chip
      if (mobileCatStrip) {
        const chip = document.createElement('button');
        chip.className = 'mobile-cat-chip';
        chip.id = `mobile-chip-${cat.id}`;
        chip.innerHTML = `${cat.icon} ${cat.label}`;
        chip.addEventListener('click', () => {
          navigateToCategory(cat.id);
          closeSidebar();
        });
        mobileCatStrip.appendChild(chip);
      }

      // Sidebar section
      const section = document.createElement('div');
      section.className = 'sidebar-section';
      section.id = `section-${cat.id}`;

      const catBtn = document.createElement('div');
      catBtn.className = 'sidebar-category';
      catBtn.id = `cat-${cat.id}`;
      catBtn.innerHTML = `
        <span class="cat-icon">${cat.icon}</span>
        <span class="cat-label">${cat.label}</span>
        <span class="cat-arrow">▶</span>
      `;

      const itemList = document.createElement('div');
      itemList.className = 'sidebar-items';
      itemList.id = `items-${cat.id}`;

      cat.items.forEach(item => {
        const el = document.createElement('div');
        el.className = 'sidebar-item';
        el.id = `nav-${item.id.replace(/\//g, '-')}`;
        el.dataset.routeId = item.id;
        el.innerHTML = item.badge
          ? `${item.label} <span class="item-badge">${item.badge}</span>`
          : item.label;

        el.addEventListener('click', () => {
          navigateTo(item.id);
          closeSidebar();
        });
        itemList.appendChild(el);
      });

      catBtn.addEventListener('click', () => {
        const isOpen = itemList.classList.contains('open');
        // Close all
        document.querySelectorAll('.sidebar-items').forEach(el => el.classList.remove('open'));
        document.querySelectorAll('.sidebar-category').forEach(el => el.classList.remove('open'));
        if (!isOpen) {
          itemList.classList.add('open');
          catBtn.classList.add('open');
          catBtn.classList.add('active');
        } else {
          catBtn.classList.remove('active');
        }
      });

      section.appendChild(catBtn);
      section.appendChild(itemList);
      sidebar.appendChild(section);
    });
  }

  function navigateToCategory(catId) {
    const cat = NAV_CONFIG.find(c => c.id === catId);
    if (!cat || cat.items.length === 0) return;
    navigateTo(cat.items[0].id);
  }

  function navigateTo(routeId) {
    Router.navigate(routeId);
    updateActiveNav(routeId);
    updateTabBar(routeId);
    updatePageTitleBar(routeId);
    updateMobileChips(routeId);

    // Open sidebar category
    const catId = getCategoryOfRoute(routeId);
    if (catId !== currentCategory) {
      currentCategory = catId;
      document.querySelectorAll('.sidebar-items').forEach(el => el.classList.remove('open'));
      document.querySelectorAll('.sidebar-category').forEach(el => {
        el.classList.remove('open');
        el.classList.remove('active');
      });
      const items = document.getElementById(`items-${catId}`);
      const catBtn = document.getElementById(`cat-${catId}`);
      if (items) items.classList.add('open');
      if (catBtn) {
        catBtn.classList.add('open');
        catBtn.classList.add('active');
      }
    }
  }

  function updateActiveNav(routeId) {
    document.querySelectorAll('.sidebar-item').forEach(el => {
      el.classList.toggle('active', el.dataset.routeId === routeId);
    });
  }

  function updateTabBar(routeId) {
    const catId = getCategoryOfRoute(routeId);
    const tabBar = document.getElementById('tab-bar');
    if (!tabBar) return;

    const tabs = TAB_CONFIG[catId] || [];
    tabBar.innerHTML = '';

    tabs.forEach(tab => {
      const el = document.createElement('div');
      el.className = `tab-item${tab.id === routeId ? ' active' : ''}`;
      el.textContent = tab.label;
      el.dataset.routeId = tab.id;
      el.addEventListener('click', () => navigateTo(tab.id));
      tabBar.appendChild(el);
    });
  }

  function updatePageTitleBar(routeId) {
    const catId = getCategoryOfRoute(routeId);
    const cat = NAV_CONFIG.find(c => c.id === catId);
    const item = cat?.items.find(i => i.id === routeId);

    const iconEl = document.getElementById('page-title-icon');
    const textEl = document.getElementById('page-title-text');

    if (iconEl && cat) iconEl.textContent = cat.icon;
    if (textEl && item) textEl.textContent = item.label;
  }

  function updateMobileChips(routeId) {
    const catId = getCategoryOfRoute(routeId);
    document.querySelectorAll('.mobile-cat-chip').forEach(chip => {
      chip.classList.toggle('active', chip.id === `mobile-chip-${catId}`);
    });
  }

  function buildSearchDropdown() {
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    if (!searchInput || !searchResults) return;

    const doSearch = UI.debounce((q) => {
      if (!q.trim()) {
        searchResults.classList.remove('visible');
        return;
      }
      const results = SEARCH_INDEX.filter(item =>
        item.label.includes(q) || item.category.includes(q)
      ).slice(0, 8);

      searchResults.innerHTML = '';
      if (results.length === 0) {
        searchResults.innerHTML = '<div style="padding:12px 14px;font-size:13px;color:var(--text-muted)">검색 결과가 없습니다</div>';
      } else {
        results.forEach(item => {
          const el = document.createElement('div');
          el.className = 'search-result-item';
          el.innerHTML = `
            <span class="sri-icon">${item.icon}</span>
            <span class="sri-label">${item.label}</span>
            <span class="sri-category">${item.category}</span>
          `;
          el.addEventListener('click', () => {
            navigateTo(item.id);
            searchResults.classList.remove('visible');
            searchInput.value = '';
          });
          searchResults.appendChild(el);
        });
      }
      searchResults.classList.add('visible');
    }, 200);

    searchInput.addEventListener('input', (e) => doSearch(e.target.value));

    document.addEventListener('click', (e) => {
      if (!e.target.closest('.header-search')) {
        searchResults.classList.remove('visible');
      }
    });

    searchInput.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        searchResults.classList.remove('visible');
        searchInput.value = '';
      }
    });
  }

  function initHamburger() {
    const btn = document.getElementById('btn-hamburger');
    const overlay = document.getElementById('sidebar-overlay');
    if (!btn || !overlay) return;

    btn.addEventListener('click', () => toggleSidebar());
    overlay.addEventListener('click', () => closeSidebar());
  }

  function toggleSidebar() {
    const sidebar = document.getElementById('sidebar');
    const overlay = document.getElementById('sidebar-overlay');
    const isOpen = sidebar?.classList.contains('open');
    if (isOpen) closeSidebar();
    else openSidebar();
  }

  function openSidebar() {
    document.getElementById('sidebar')?.classList.add('open');
    document.getElementById('sidebar-overlay')?.classList.add('visible');
  }

  function closeSidebar() {
    document.getElementById('sidebar')?.classList.remove('open');
    document.getElementById('sidebar-overlay')?.classList.remove('visible');
  }

  function init() {
    buildSidebar();
    buildSearchDropdown();
    initHamburger();
    Theme.init();
    Ads.init();

    // Handle initial route from hash
    const { path } = Router.parseHash();
    if (path && NAV_CONFIG.some(c => c.items.some(i => i.id === path))) {
      navigateTo(path);
    } else {
      // Show welcome screen
      const welcome = document.getElementById('view-welcome');
      if (welcome) welcome.classList.add('active');
    }
  }

  // Expose navigateTo for calculator files
  return { init, navigateTo, navigateToCategory };
})();

document.addEventListener('DOMContentLoaded', () => App.init());
