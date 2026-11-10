const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
let count = 0;
function moduleCalc(file, symbol) {
  const context = vm.createContext({ Date });
  vm.runInContext(fs.readFileSync(path.join(root, file), 'utf8') + `;globalThis.calc = ${symbol}.calculate;`, context);
  return context.calc;
}
function eq(actual, expected) { assert.equal(actual, expected); count++; }
const corporate = moduleCalc('js/calculators/income/corporate.js', 'CalcCorporate');
eq(corporate({ income: 500000000 }).totalTax, 88000000);
eq(corporate({ income: 200000000 }).corpTax, 20000000);
eq(corporate({ income: 20000000000 }).corpTax, 3980000000);
eq(corporate({ income: 300000000000 }).corpTax, 65580000000);
const insurance = moduleCalc('js/calculators/income/insurance.js', 'CalcInsurance');
eq(insurance({ salary: 3000000, insType: 'employee' }).monthlyTotal, 291521);
eq(insurance({ salary: 100000, insType: 'employee' }).items[0].amount, 19475);
eq(insurance({ salary: 10000000, insType: 'employee' }).items[0].amount, 313025);
eq(insurance({ salary: 200000000, insType: 'employee' }).items[1].amount, 4591740);
eq(insurance({ salary: 3000000, insType: 'self' }), null);
const salary = moduleCalc('js/calculators/income/salary.js', 'CalcSalary');
eq(salary({ mode: 'annual', amount: 50000000, nonTaxAmount: 200000, familyCount: 1, childCount: 0, weeklyHours: 40 }).monthlyNet, 3521240);
eq(salary({ mode: 'monthly', amount: 3000000, nonTaxAmount: 0, familyCount: 1, childCount: 0, weeklyHours: 40 }).pension, 142500);
const acquisition = moduleCalc('js/calculators/real-estate/acquisition.js', 'CalcAcquisition');
for (const houseCount of [2, 3, 4]) {
  const base = { type: 'housing', price: 500000000, houseCount, isAdjusted: true, area: 85 };
  eq(acquisition(base).ruralTax, 0);
  eq(acquisition({ ...base, area: 86 }).ruralTax, houseCount === 2 ? 3000000 : 5000000);
}
eq(acquisition({ type: 'housing', price: 600000000, houseCount: 1, area: 85 }).total, 6600000);
const commission = moduleCalc('js/calculators/real-estate/commission.js', 'CalcCommission');
const houseFee = (transType, price) => commission({ propertyType: 'housing', transType, price }).fee;
for (const [price, fee] of [[49999999,250000],[50000000,250000],[199999999,800000],[200000000,800000],
    [700000000,2800000],[899999999,3599999],[900000000,4500000],[1190000000,5950000],
    [1200000000,7200000],[1500000000,10500000]]) {
  eq(houseFee('매매', price), fee);
}
for (const [price, fee] of [[400000000,1200000],[599999999,1799999],[600000000,2400000],
    [1200000000,6000000],[1500000000,9000000]]) {
  eq(houseFee('전세', price), fee);
}
const monthlyFee = (price, monthlyRent) => commission({ propertyType: 'housing', transType: '월세', price, monthlyRent });
eq(monthlyFee(0, 400000).basePrice, 28000000);
eq(monthlyFee(0, 400000).fee, 140000);
eq(monthlyFee(10000000, 400000).basePrice, 50000000);
eq(monthlyFee(10000000, 500000).fee, 240000);
eq(monthlyFee(10000000, 0), null);
eq(commission({ propertyType: 'officetel', transType: '매매', price: 300000000 }).fee, 1500000);
eq(commission({ propertyType: 'officetel', transType: '전세', price: 300000000 }).fee, 1200000);
eq(commission({ propertyType: 'other', transType: '매매', price: 300000000 }).fee, 2700000);
eq(commission({ propertyType: 'housing', transType: '매매', price: 1200000000 }).total, 7920000);
const vat = moduleCalc('js/calculators/income/vat.js', 'CalcVat');
eq(vat({ taxType: 'general', salesAmount: 10000000, purchaseAmount: 15000000 }).vatPayable, -500000);
eq(vat({ taxType: 'general', salesAmount: 0, purchaseAmount: 15000000 }).vatPayable, -1500000);
eq(vat({ taxType: 'simplified', salesAmount: 47000000, purchaseAmount: 0, industryType: 'retail' }).vatPayable, 0);
eq(vat({ taxType: 'simplified', salesAmount: 60000000, purchaseAmount: 20000000, industryType: 'retail' }).vatPayable, 800000);
eq(vat({ taxType: 'simplified', salesAmount: 60000000, purchaseAmount: 0, industryType: 'accommodation' }).vatPayable, 1500000);
eq(vat({ taxType: 'simplified', salesAmount: 60000000, purchaseAmount: 0, industryType: 'specialService' }).vatPayable, 2400000);
eq(vat({ taxType: 'general', salesAmount: -1, purchaseAmount: 0 }), null);
eq(vat({ taxType: 'general', salesAmount: 10000000, purchaseAmount: NaN }), null);
const overdue = moduleCalc('js/calculators/vehicle/overdue.js', 'CalcVehicleOverdue');
eq(overdue({ tax: 449999, dueDate: '2026-01-31', today: '2026-10-06' }).additionalMonths, 0);
eq(overdue({ tax: 450000, dueDate: '2026-01-31', today: '2026-02-27' }).additionalMonths, 0);
eq(overdue({ tax: 450000, dueDate: '2026-01-31', today: '2026-02-28' }).additionalMonths, 1);
eq(overdue({ tax: 1000000, dueDate: '2025-01-01', today: '2026-01-01' }).grandTotal, 1109200);
eq(overdue({ tax: 1000000, dueDate: '2024-01-01', today: '2030-01-01' }).grandTotal, 1426000);
eq(overdue({ tax: 1000000, dueDate: '2026-01-01', today: '2026-01-01' }).grandTotal, 1000000);
eq(overdue({ tax: 1000000, dueDate: '2023-01-01', today: '2026-01-01' }), null);
eq(overdue({ tax: 1000000, dueDate: 'bad', today: '2026-01-01' }), null);
eq(overdue({ tax: 1000000, dueDate: '2026-02-30', today: '2026-03-01' }), null);
const ltv = moduleCalc('js/calculators/loan/ltv.js', 'CalcLTV');
const ltvBase = { propertyValue: 1200000000, region: 'speculative', housing: 'homeless', loanType: 'bank' };
eq(ltv(ltvBase).maxLoanTotal, 480000000);
eq(ltv({ ...ltvBase, propertyValue: 1800000000 }).maxLoanTotal, 400000000);
eq(ltv({ ...ltvBase, propertyValue: 2600000000 }).maxLoanTotal, 200000000);
eq(ltv({ ...ltvBase, region: 'non-regulated', isCapitalArea: true }).maxLoanTotal, 600000000);
eq(ltv({ ...ltvBase, region: 'non-regulated', isCapitalArea: true, housing: 'multi' }).maxLoanTotal, 0);
eq(ltv({ ...ltvBase, region: 'non-regulated', housing: 'multi' }).maxLoanTotal, 840000000);
eq(ltv({ ...ltvBase, existingLoan: -1 }), null);
const dsr = moduleCalc('js/calculators/loan/dsr.js', 'CalcDSR');
const dsrBase = { annualIncome: 50000000, newLoanAmount: 100000000, newLoanRate: 4,
  newLoanPeriodYears: 10, newLoanType: 'bullet', existingAnnualRepay: 0, lenderType: 'bank', useStressDSR: false };
eq(dsr(dsrBase).newAnnualRepay, 14000000);
eq(Math.round(dsr(dsrBase).dsrPercent), 28);
eq(dsr({ ...dsrBase, useStressDSR: true, stressRateAdd: 3 }).newAnnualRepay, 17000000);
eq(dsr({ ...dsrBase, useStressDSR: true, stressRateAdd: 1.5 }).newAnnualRepay, 15500000);
eq(dsr({ ...dsrBase, newLoanPeriodYears: 0 }), null);
eq(dsr({ ...dsrBase, stressRateAdd: NaN }), null);
eq(dsr({ ...dsrBase, newLoanAmount: -1 }), null);
eq(dsr({ ...dsrBase, existingAnnualRepay: NaN }), null);
const dailyWorker = moduleCalc('js/calculators/income/daily-worker.js', 'CalcDailyWorker');
eq(dailyWorker({ dailyWage: 150000, workDays: 31 }).monthlyTax, 0);
eq(dailyWorker({ dailyWage: 180000, workDays: 1 }).monthlyTax, 0);
eq(dailyWorker({ dailyWage: 180000, workDays: 2, paymentMode: 'daily' }).monthlyTax, 0);
eq(dailyWorker({ dailyWage: 180000, workDays: 2, paymentMode: 'combined' }).monthlyTax, 1780);
eq(dailyWorker({ dailyWage: 180000, workDays: 2 }).monthlyTakeHome, 358220);
eq(dailyWorker({ dailyWage: 187000, workDays: 1 }).monthlyTax, 0);
eq(dailyWorker({ dailyWage: 187038, workDays: 1 }).monthlyTax, 1100);
eq(dailyWorker({ dailyWage: 200000, workDays: 1 }).monthlyTax, 1480);
eq(dailyWorker({ dailyWage: 200000, workDays: 5 }).monthlyIncomeTax, 6750);
eq(dailyWorker({ dailyWage: 200000, workDays: 5 }).monthlyLocalTax, 670);
eq(dailyWorker({ dailyWage: 200000, workDays: 5 }).monthlyTakeHome, 992580);
eq(dailyWorker({ dailyWage: 200000, workDays: 5, paymentMode: 'daily' }).monthlyTax, 7400);
eq(dailyWorker({ dailyWage: 200000, workDays: 0 }), null);
eq(dailyWorker({ dailyWage: 200000, workDays: 1.5 }), null);
eq(dailyWorker({ dailyWage: 200000, workDays: 32 }), null);
eq(dailyWorker({ dailyWage: Infinity }), null);
eq(dailyWorker({ dailyWage: -1 }), null);
eq(dailyWorker({ dailyWage: 200000, paymentMode: 'weekly' }), null);
console.log(`${count} calculator regression assertions passed`);
