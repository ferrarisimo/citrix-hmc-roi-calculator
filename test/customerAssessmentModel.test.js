import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentLevers, calculateOpportunity, calculateCustomerScenario, calculateNewBusinessCosts } from '../src/models/customerAssessmentModel.js';

const state = {
  tech: { numberHosts: 8, coresPerHost: 48, numberPc: 100, numberUsers: 100, pctRemoteHybridUsers: 60, numberVpnAdcAppliances: 2, avgPcAgeYears: 3, itDaysEndpointMgmt: 100 },
  cost: { costHypervisorPerCoreYear: 100, costOnePc: 600, costVpnAdcAppliance: 5000, applianceMaintenanceAnnualPct: 20, costSysadminDay: 500 },
  adoption: { xenserver: { current: 2, annualSaving: 9600 } },
};
const xen = assessmentLevers(state)[0];
const plan = { feasibility: 'yes', target: 8, avoidablePct: 100, months: 0, activationCost: 0 };
const calc = (adoption = state.adoption.xenserver, p = plan, lever = xen) => calculateOpportunity(lever, adoption, p, 3);

test('8 hosts including 2 migrated: only the remaining 6 generate new savings', () => {
  const row = calc();
  assert.equal(row.currentPct, 25);
  assert.equal(row.gap, 6);
  assert.equal(row.annualSaving, 28800);
  assert.equal(row.periodSaving, 86400);
  assert.equal(row.alreadySaving, 9600);
});

test('missing adoption, financial realization, target, timing and avoidability are not assumed', () => {
  for (const row of [calc({}), calc({ current: 2 }), calc(undefined, {}), ...['target', 'months', 'avoidablePct', 'activationCost'].map((key) => calc(undefined, { ...plan, [key]: '' }))]) {
    assert.equal(row.complete, false);
    assert.equal(row.annualSaving, 0);
  }
  assert.equal(calc({ current: 0 }).annualSaving, 38400);
  assert.equal(calc({ current: 2, annualSaving: 0 }).annualSaving, 28800);
});

test('migration only of a compatible subset, actual avoidability, delay and services', () => {
  const row = calc(undefined, { ...plan, target: 6, avoidablePct: 50, months: 6, activationCost: 10000 });
  assert.equal(row.gap, 4);
  assert.equal(row.annualSaving, 9600);
  assert.equal(row.periodSaving, 24000);
  assert.equal(row.netSaving, 14000);
});

test('invalid quantities and revised shared totals invalidate existing targets', () => {
  for (const target of [1, 9, 4.5]) assert.equal(calc(undefined, { ...plan, target }).complete, false);
  for (const current of [9, 2.5]) assert.equal(calc({ current, annualSaving: 0 }).complete, false);
  const smaller = assessmentLevers({ ...state, tech: { ...state.tech, numberHosts: 4 } })[0];
  assert.equal(calc(undefined, plan, smaller).complete, false);
});

test('full adoption and excluded opportunities generate no additional benefits or project costs', () => {
  const full = calc({ current: 8, annualSaving: 38400 }, { ...plan, activationCost: 1000 });
  assert.equal(full.annualSaving, 0);
  assert.equal(full.activationCost, 0);
  const excluded = calc({}, { feasibility: 'no' });
  assert.equal(excluded.complete, true);
  assert.equal(excluded.periodSaving, 0);
});

test('savings are capped by remaining spend and realization cannot exceed baseline', () => {
  assert.equal(calc({ current: 2, annualSaving: 35000 }).annualSaving, 3400);
  assert.equal(calc({ current: 2, annualSaving: 40000 }).complete, false);
});

test('NetScaler excludes sunk purchase costs and counts an explicit future refresh only once', () => {
  const net = assessmentLevers(state).find((l) => l.id === 'netscaler');
  const p = { ...plan, target: 2, avoidedPurchase: 5000, months: 12 };
  const row = calc({ current: 1, annualSaving: 1000 }, p, net);
  assert.equal(row.annualSaving, 1000);
  assert.equal(row.periodSaving, 7000);
  assert.equal(calc({ current: 1, annualSaving: 1000 }, { ...p, months: 36 }, net).periodSaving, 0);
});

test('eLux and endpoint lifecycle share one benefit; target annual cost is explicit', () => {
  const lever = assessmentLevers(state).find((l) => l.category === 'endpoint');
  assert.equal(assessmentLevers(state).filter((l) => l.category === 'endpoint').length, 1);
  const p = { ...plan, target: 100, endpointAnnualCost: 120 };
  assert.equal(calc({ current: 20, annualSaving: 1600 }, p, lever).annualSaving, 6400);
  assert.equal(calc({ current: 20, annualSaving: 1600 }, { ...p, endpointAnnualCost: '' }, lever).complete, false);
});

test('operational savings value days once, monetary savings value euros once', () => {
  const ops = assessmentLevers(state).find((l) => l.id === 'opsEndpoint');
  const row = calc({ current: 20 }, { ...plan, target: 40 }, ops);
  assert.equal(row.alreadySaving, 10000);
  assert.equal(row.annualSaving, 10000);
});

test('CPC/HMC eligibility, coverage and payback account for delay', () => {
  const plans = { xenserver: { ...plan, months: 6, activationCost: 28800 } };
  const model = calculateCustomerScenario(state, plans, 'CPC', 3, 100000);
  assert.equal(model.rows.some((r) => r.id === 'netscaler'), false);
  assert.equal(model.netSaving, 43200);
  assert.equal(model.coveragePct, 43.2);
  assert.equal(model.uncoveredRenewalCost, 56800);
  assert.equal(model.paybackMonths, 18);
  assert.equal(model.complete, false);
});

test('zero perimeters do not require invented adoption and have no savings', () => {
  const empty = { tech: { numberHosts: 0, numberVpnAdcAppliances: 0, numberPc: 0, numberUsers: 0, pctRemoteHybridUsers: 0, itDaysEndpointMgmt: 0, itDaysImageVdiMgmt: 0, itDaysSupport: 0, itDaysAccessMgmt: 0, itDaysSecurityOps: 0 }, cost: { costSocMsspAnnual: 0 } };
  const model = calculateCustomerScenario(empty, {}, 'HMC', 3);
  assert.equal(model.complete, true);
  assert.equal(model.periodSaving, 0);
});

test('clearing a reference total or cost does not silently mean zero', () => {
  for (const next of [
    { ...state, tech: { ...state.tech, numberHosts: '' } },
    { ...state, cost: { ...state.cost, costHypervisorPerCoreYear: '' } },
  ]) {
    const lever = assessmentLevers(next)[0];
    assert.equal(calc({ current: 0 }, { ...plan, target: 0 }, lever).complete, false);
  }
});

test('New Business uses current spend, timing, HMC licenses and migration without recounting adopted savings', () => {
  const customer = { ...state, profile: { horizonYears: 3, hmcPricePerUserPerMonth: 10, initialMigrationCost: 2000 } };
  const scenario = calculateCustomerScenario(customer, { xenserver: { ...plan, months: 6, activationCost: 1000 } }, 'HMC', 3);
  const result = calculateNewBusinessCosts(customer, scenario);
  const row = result.tableRows.find((r) => r.key === 'hypervisor');
  assert.equal(row.asIs, 86400);
  assert.equal(row.delta, 72000);
  assert.equal(row.hmc, 14400);
  assert.equal(result.tableRows.find((r) => r.key === 'hmcSubscription').hmc, 36000);
  assert.equal(result.migrationCostOneTime, 3000);
  assert.equal(result.tableRows.reduce((sum, r) => sum + r.delta, 0), 33000);
});

test('New Business includes an avoided future appliance purchase in the reference TCO, not negative target costs', () => {
  const customer = { ...state, adoption: { netscaler: { current: 1, annualSaving: 1000 } }, profile: { horizonYears: 3 } };
  const scenario = calculateCustomerScenario(customer, { netscaler: { ...plan, target: 2, avoidedPurchase: 5000 } }, 'HMC', 3);
  const row = calculateNewBusinessCosts(customer, scenario).tableRows.find((r) => r.key === 'access');
  assert.equal(row.asIs, 8000);
  assert.equal(row.hmc, 0);
  assert.equal(row.delta, 8000);
});
