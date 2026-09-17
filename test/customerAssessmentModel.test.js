import test from 'node:test';
import assert from 'node:assert/strict';
import { assessmentLevers, calculateOpportunity, calculateCustomerScenario, calculateNewBusinessCosts, calculateRenewalComparison } from '../src/models/customerAssessmentModel.js';

const state = {
  tech: { numberHosts: 8, coresPerHost: 48, numberPc: 100, numberUsers: 100, pctRemoteHybridUsers: 60, numberVpnAdcAppliances: 2, avgPcAgeYears: 3, itDaysEndpointMgmt: 100 },
  cost: { costHypervisorPerCoreYear: 100, costOnePc: 600, costVpnAdcAppliance: 5000, applianceMaintenanceAnnualPct: 20, costSysadminDay: 500 },
};
const xen = assessmentLevers(state)[0];
const calc = (plan = { current: 2 }, lever = xen, mode = 'renewal') => calculateOpportunity(lever, plan, 3, mode);

test('renewal calculates savings for 6 remaining hosts and automatically estimates the existing 2', () => {
  const row = calc();
  assert.equal(row.currentPct, 25);
  assert.equal(row.target, 8);
  assert.equal(row.gap, 6);
  assert.equal(row.annualSaving, 28800);
  assert.equal(row.periodSaving, 86400);
  assert.equal(row.alreadySaving, 9600);
});

test('new business immediately forecasts savings from percentage, without current adoption inputs', () => {
  const row = calc({ adoptionPct: 50 }, xen, 'newBusiness');
  assert.equal(row.target, 4);
  assert.equal(row.annualSaving, 19200);
  assert.equal(row.alreadySaving, 0);
  assert.equal(row.complete, true);
  assert.equal(calc({}, xen, 'newBusiness').annualSaving, 0);
});

test('percentage forecasts allow equivalent quantities without rounding physical renewal counts', () => {
  assert.equal(calc({ adoptionPct: 30 }, xen, 'newBusiness').target, 2.4);
  assert.equal(calc({ current: 2.4 }).complete, false);
});

test('missing renewal adoption is unknown, whereas explicit zero means not adopted', () => {
  assert.equal(calc({}).complete, false);
  assert.equal(calc({ current: '' }).annualSaving, 0);
  assert.equal(calc({ current: 0 }).annualSaving, 38400);
});

test('clearing assumptions does not silently restore the displayed defaults', () => {
  for (const key of ['target', 'months', 'avoidablePct', 'activationCost']) {
    const row = calc({ current: 2, [key]: '' });
    assert.equal(row.complete, false, key);
    assert.equal(row.annualSaving, 0, key);
  }
  assert.equal(calc({ adoptionPct: '' }, xen, 'newBusiness').complete, false);
});

test('target subset, avoidable share, delay and implementation costs are applied once', () => {
  const row = calc({ current: 2, target: 6, avoidablePct: 50, months: 6, activationCost: 10000 });
  assert.equal(row.gap, 4);
  assert.equal(row.annualSaving, 9600);
  assert.equal(row.periodSaving, 24000);
  assert.equal(row.netSaving, 14000);
});

test('invalid quantities and percentages do not produce savings', () => {
  for (const current of [9, -1, 2.5]) assert.equal(calc({ current }).complete, false);
  for (const target of [1, 9, 4.5]) assert.equal(calc({ current: 2, target }).complete, false);
  for (const adoptionPct of [-1, 101, 'bad']) assert.equal(calc({ adoptionPct }, xen, 'newBusiness').complete, false);
});

test('shared total edits update both views and preserve separate adoption parameters', () => {
  const smaller = { ...state, tech: { ...state.tech, numberHosts: 4 }, adoption: { xenserver: { current: 4, annualSaving: 19200 } } };
  const renewal = calculateCustomerScenario(smaller, { xenserver: { current: 3 } }, 'HMC', 3);
  const business = calculateCustomerScenario(smaller, { xenserver: { adoptionPct: 50 } }, 'HMC', 3, 0, 'newBusiness');
  assert.equal(renewal.rows[0].gap, 1);
  assert.equal(renewal.rows[0].annualSaving, 4800);
  assert.equal(business.rows[0].target, 2);
  assert.equal(business.rows[0].annualSaving, 9600);
  assert.equal(business.rows[0].alreadySaving, 0);
  assert.equal(calculateCustomerScenario(smaller, { xenserver: { current: 5 } }, 'HMC', 3).rows[0].complete, false);
});

test('full adoption has no additional saving or activation cost', () => {
  const full = calc({ current: 8, activationCost: 1000 });
  assert.equal(full.annualSaving, 0);
  assert.equal(full.activationCost, 0);
  assert.equal(full.alreadySaving, 38400);
});

test('NetScaler calculates an explicitly selected future refresh from residual appliance count', () => {
  const lever = assessmentLevers(state).find((l) => l.id === 'netscaler');
  const row = calc({ current: 1, includeRefresh: true, months: 12 }, lever);
  assert.equal(row.annualSaving, 1000);
  assert.equal(row.oneTimeSaving, 5000);
  assert.equal(row.periodSaving, 7000);
  assert.equal(calc({ current: 1 }, lever).oneTimeSaving, 0);
  assert.equal(calc({ current: 1, includeRefresh: true, months: 36 }, lever).periodSaving, 0);
});

test('endpoint annual cost is derived from replacement cost and lifecycle with no duplicated eLux benefit', () => {
  const lever = assessmentLevers(state).find((l) => l.id === 'endpoint');
  assert.equal(assessmentLevers(state).filter((l) => l.category === 'endpoint').length, 1);
  const row = calc({ current: 20 }, lever);
  assert.equal(row.endpointAnnualCost, 120);
  assert.equal(row.alreadySaving, 1600);
  assert.equal(row.annualSaving, 6400);
  assert.equal(calc({ current: 20, endpointLifecycleYears: 0 }, lever).complete, false);
  assert.equal(calc({ adoptionPct: 50, endpointLifecycleYears: 6 }, lever, 'newBusiness').annualSaving, 5000);
});

test('IT effort uses days × daily rate and preserves fractional days', () => {
  const ops = assessmentLevers(state).find((l) => l.id === 'opsEndpoint');
  const row = calc({ current: 20.5, target: 40.5 }, ops);
  assert.equal(row.alreadySaving, 10250);
  assert.equal(row.annualSaving, 10000);
  assert.equal(calc({ adoptionPct: 35 }, ops, 'newBusiness').annualSaving, 17500);
});

test('CPC/HMC eligibility, coverage and payback account for delay', () => {
  const model = calculateCustomerScenario(state, { xenserver: { current: 2, months: 6, activationCost: 28800 } }, 'CPC', 3, 100000);
  assert.equal(model.rows.some((r) => r.id === 'netscaler'), false);
  assert.equal(model.netSaving, 43200);
  assert.equal(model.coveragePct, 43.2);
  assert.equal(model.uncoveredRenewalCost, 56800);
  assert.equal(model.paybackMonths, 18);
});

test('zero perimeters do not require adoption, but blank As-Is data is incomplete', () => {
  const empty = { tech: { numberHosts: 0, numberVpnAdcAppliances: 0, numberPc: 0, numberUsers: 0, pctRemoteHybridUsers: 0, itDaysEndpointMgmt: 0, itDaysImageVdiMgmt: 0, itDaysSupport: 0, itDaysAccessMgmt: 0, itDaysSecurityOps: 0 }, cost: { costSocMsspAnnual: 0 } };
  assert.equal(calculateCustomerScenario(empty, {}, 'HMC', 3).complete, true);
  for (const next of [{ ...state, tech: { ...state.tech, numberHosts: '' } }, { ...state, cost: { ...state.cost, costHypervisorPerCoreYear: '' } }]) {
    const lever = assessmentLevers(next)[0];
    assert.equal(calc({ current: 0 }, lever).complete, false);
  }
});

test('New Business TCO uses full As-Is and only its own future percentage, license and project costs', () => {
  const customer = { ...state, profile: { horizonYears: 3, hmcPricePerUserPerMonth: 10, initialMigrationCost: 2000 } };
  const scenario = calculateCustomerScenario(customer, { xenserver: { adoptionPct: 50, months: 6, activationCost: 1000 }, opsEndpoint: { adoptionPct: 0 } }, 'HMC', 3, 0, 'newBusiness');
  const result = calculateNewBusinessCosts(customer, scenario);
  const row = result.tableRows.find((r) => r.key === 'hypervisor');
  assert.equal(row.asIs, 115200);
  assert.equal(row.delta, 48000);
  assert.equal(row.hmc, 67200);
  assert.equal(result.tableRows.find((r) => r.key === 'hmcSubscription').hmc, 36000);
  assert.equal(result.migrationCostOneTime, 3000);
  assert.equal(result.tableRows.reduce((sum, r) => sum + r.delta, 0), 9000);
});

test('future NetScaler purchases are included in both As-Is TCO and avoided costs', () => {
  const customer = { ...state, profile: { horizonYears: 3 } };
  const scenario = calculateCustomerScenario(customer, { netscaler: { adoptionPct: 50, includeRefresh: true } }, 'HMC', 3, 0, 'newBusiness');
  const row = calculateNewBusinessCosts(customer, scenario).tableRows.find((r) => r.key === 'access');
  assert.equal(row.asIs, 11000);
  assert.equal(row.hmc, 3000);
  assert.equal(row.delta, 8000);
});


test('IT and Security defaults calculate savings immediately, once, and remain independent from renewal', () => {
  const customer = {
    tech: { ...state.tech, itDaysEndpointMgmt: 120, itDaysImageVdiMgmt: 90, itDaysSupport: 180, itDaysAccessMgmt: 50, itDaysSecurityOps: 60 },
    cost: { ...state.cost, costSocMsspAnnual: 100000, costRemediationPerEndpointYear: 200 },
  };
  const business = calculateCustomerScenario(customer, {}, 'HMC', 3, 0, 'newBusiness');
  const expected = { opsEndpoint: [31, 18600], opsImage: [35, 15750], opsSupport: [36, 32400], opsAccess: [30, 7500], soc: [10, 10000], remediation: [20, 4000], securityOps: [20, 6000] };
  for (const [id, [pct, saving]] of Object.entries(expected)) {
    const row = business.rows.find((r) => r.id === id);
    assert.equal(row.parameters.adoptionPct, pct, id);
    assert.equal(row.annualSaving, saving, id);
    assert.equal(row.periodSaving, saving * 3, id);
    const lever = assessmentLevers(customer).find((r) => r.id === id);
    assert.equal(calc({ adoptionPct: 0 }, lever, 'newBusiness').annualSaving, 0, id);
    assert.equal(calc({ adoptionPct: '' }, lever, 'newBusiness').complete, false, id);
    assert.equal(calc({}, lever).complete, false, id);
  }
  for (const id of ['xenserver', 'netscaler', 'endpoint', 'mfa', 'ztna', 'edr', 'posture']) {
    assert.equal(business.rows.find((r) => r.id === id).parameters.adoptionPct, 0, id);
  }
  const endpoint = assessmentLevers(customer).find((r) => r.id === 'opsEndpoint');
  const custom = calc({ adoptionPct: 40, months: 6, activationCost: 1000 }, endpoint, 'newBusiness');
  assert.equal(custom.target, 48);
  assert.equal(custom.total - custom.target, 72);
  assert.equal(custom.annualSaving, 24000);
  assert.equal(custom.netSaving, 59000);
  const partial = calc({ avoidablePct: 50 }, endpoint, 'newBusiness');
  assert.equal(partial.annualSaving, 9300);
});

const renewalProfile = { totalRenewalCost: 150000, renewalYears: 3, previousRenewalCost: 120000, previousRenewalYears: 3 };

test('renewal shows coverage of the 10k annual uplift separately from the full renewal price', () => {
  const result = calculateRenewalComparison(renewalProfile, { annualSaving: 9720, netSaving: 29160 });
  assert.equal(result.annualUplift, 10000);
  assert.equal(result.uplift, 30000);
  assert.equal(result.annualCoveragePct, 97.2);
  assert.equal(result.netCoveragePct, 97.2);
  assert.equal(result.remainingUplift, 840);
  assert.equal(result.netAfterUplift, -840);
  assert.equal(result.increasePct, 25);
});

test('two additional hosts can recover the full uplift without counting previously migrated hosts', () => {
  const customer = { ...state, cost: { ...state.cost, costHypervisorPerCoreYear: 125 } };
  const scenario = calculateCustomerScenario(customer, { xenserver: { current: 2, target: 4 } }, 'HMC', 3, 150000);
  const result = calculateRenewalComparison(renewalProfile, scenario);
  assert.equal(scenario.rows[0].alreadySaving, 12000);
  assert.equal(scenario.annualSaving, 12000);
  assert.equal(result.annualCoveragePct, 120);
  assert.equal(result.netCoveragePct, 120);
  assert.equal(result.remainingUplift, 0);
  assert.equal(scenario.coveragePct, 24);
});

test('delta annualization handles different contract durations, costs and activation delay', () => {
  const scenario = calculateCustomerScenario(state, { xenserver: { current: 2, target: 4, months: 6, activationCost: 6000 } }, 'HMC', 3);
  const result = calculateRenewalComparison({ ...renewalProfile, previousRenewalCost: 40000, previousRenewalYears: 1 }, scenario);
  assert.equal(result.annualCoveragePct, 96);
  assert.equal(result.netCoveragePct, 60);
  assert.equal(result.remainingUplift, 12000);
});

test('missing prices never imply a free previous contract and zero or negative deltas have no percentage', () => {
  const scenario = { annualSaving: 10000, netSaving: -1000 };
  for (const key of ['totalRenewalCost', 'renewalYears', 'previousRenewalCost', 'previousRenewalYears']) {
    for (const value of ['', undefined, null, -1, 'bad']) {
      const result = calculateRenewalComparison({ ...renewalProfile, [key]: value }, scenario);
      assert.equal(result.known, false, key);
      assert.equal(result.netCoveragePct, null, key);
      assert.equal(result.remainingUplift, null, key);
    }
  }
  assert.equal(calculateRenewalComparison({ ...renewalProfile, previousRenewalYears: 0 }, scenario).known, false);
  for (const totalRenewalCost of [0, 90000, 120000]) {
    const result = calculateRenewalComparison({ ...renewalProfile, totalRenewalCost }, scenario);
    assert.equal(result.annualUplift, 0);
    assert.equal(result.annualCoveragePct, null);
    assert.equal(result.netCoveragePct, null);
  }
  assert.equal(calculateRenewalComparison(renewalProfile, scenario).netCoveragePct, 0);
  assert.equal(calculateRenewalComparison(renewalProfile, scenario).remainingUplift, 31000);
  const freePrevious = calculateRenewalComparison({ ...renewalProfile, previousRenewalCost: 0 }, scenario);
  assert.equal(freePrevious.known, true);
  assert.equal(freePrevious.annualUplift, 50000);
  assert.equal(freePrevious.increasePct, null);
});
