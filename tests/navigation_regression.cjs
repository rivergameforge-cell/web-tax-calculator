const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const events = {};
const location = {
  search: '?keep=1', hash: '#real-estate/acquisition?price=600000000', destination: null,
  assign(url) { this.destination = { url, replace: false }; },
  replace(url) { this.destination = { url, replace: true }; },
};
const context = vm.createContext({
  URLSearchParams, location,
  document: { getElementById() { return null; }, addEventListener() {} },
  window: { addEventListener(type, listener) { events[type] = listener; } },
  Theme: { init() {} },
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/router.js'), 'utf8'), context);
vm.runInContext(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8') + ';globalThis.app = App;', context);
context.app.init();
assert.equal(location.destination.url, '/real-estate/acquisition.html?keep=1&price=600000000');
assert.equal(location.destination.replace, true);
location.hash = '#income/vat';
events.hashchange();
assert.equal(location.destination.url, '/income/vat.html?keep=1');
assert.equal(location.destination.replace, true);
location.destination = null;
context.app.navigateTo('../privacy');
assert.equal(location.destination, null);
context.app.navigateTo('loan/ltv', { note: '&/?' });
assert.equal(location.destination.url, '/loan/ltv.html?keep=1&note=%26%2F%3F');
assert.equal(location.destination.replace, false);

// Standalone pages must not invoke the home-only Router or intercept the logo.
function element(routeId) {
  const classes = new Set();
  const attrs = {};
  return {
    dataset: { routeId }, attrs, classes,
    classList: {
      add(...names) { names.forEach(name => classes.add(name)); },
      toggle(name, active) { if (active) classes.add(name); else classes.delete(name); },
    },
    setAttribute(name, value) { attrs[name] = value; },
    removeAttribute(name) { delete attrs[name]; },
  };
}
const activeLink = element('real-estate/commission');
const otherLink = element('income/salary');
const category = element();
const items = element();
let themeInitializations = 0;
const staticEvents = [];
const staticContext = vm.createContext({
  document: {
    body: { dataset: { routeId: 'real-estate/commission' } },
    getElementById(id) { return { 'cat-real-estate': category, 'items-real-estate': items }[id] || null; },
    querySelectorAll(selector) { return selector === '.sidebar-item' ? [activeLink, otherLink] : []; },
    addEventListener() {},
  },
  window: { addEventListener(type) { staticEvents.push(type); } },
  Theme: { init() { themeInitializations += 1; } },
});
vm.runInContext(fs.readFileSync(path.join(root, 'js/app.js'), 'utf8') + ';App.init();', staticContext);
assert.equal(activeLink.attrs['aria-current'], 'page');
assert.equal(activeLink.classes.has('active'), true);
assert.equal(otherLink.classes.has('active'), false);
assert.equal(otherLink.attrs['aria-current'], undefined);
assert.equal(category.attrs['aria-expanded'], 'true');
assert.equal(category.classes.has('open'), true);
assert.equal(items.classes.has('open'), true);
assert.equal(items.hidden, false);
assert.equal(themeInitializations, 1);
assert.equal(staticEvents.length, 0);
console.log('17 navigation regression assertions passed');
