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
console.log('7 navigation regression assertions passed');
