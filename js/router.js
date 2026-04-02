/* ===== Hash Router ===== */
const Router = (() => {
  // Registry of views: { 'real-estate/acquisition': { render: fn, title: '' } }
  const routes = {};
  let currentRoute = null;
  let onChangeCallback = null;

  function register(id, config) {
    routes[id] = config;
  }

  function navigate(id, params = {}) {
    if (currentRoute === id) return;
    currentRoute = id;

    // Update hash
    const hash = params && Object.keys(params).length
      ? `#${id}?${new URLSearchParams(params).toString()}`
      : `#${id}`;
    history.replaceState(null, '', hash);

    render(id);
    if (onChangeCallback) onChangeCallback(id);
  }

  function render(id) {
    // Hide all views
    document.querySelectorAll('.calculator-view').forEach(v => v.classList.remove('active'));

    const view = document.getElementById(`view-${id.replace(/\//g, '-')}`);
    if (view) {
      view.classList.add('active');
    } else {
      // Show welcome if no view found
      const welcome = document.getElementById('view-welcome');
      if (welcome) welcome.classList.add('active');
    }

    // Update page title area
    const route = routes[id];
    if (route) {
      const pageTitle = document.getElementById('page-title-text');
      if (pageTitle && route.title) pageTitle.textContent = route.title;
    }
  }

  function getCurrentRoute() {
    return currentRoute;
  }

  function parseHash() {
    const hash = location.hash.slice(1);
    const [path, query] = hash.split('?');
    const params = query ? Object.fromEntries(new URLSearchParams(query)) : {};
    return { path, params };
  }

  function init(onChangeFn) {
    onChangeCallback = onChangeFn;

    // Handle back/forward
    window.addEventListener('hashchange', () => {
      const { path } = parseHash();
      if (path && routes[path]) {
        currentRoute = path;
        render(path);
        if (onChangeCallback) onChangeCallback(path);
      }
    });

    // Initial route
    const { path } = parseHash();
    if (path && routes[path]) {
      navigate(path);
    }
  }

  function onChange(fn) {
    onChangeCallback = fn;
  }

  return { register, navigate, render, getCurrentRoute, parseHash, init, onChange };
})();
