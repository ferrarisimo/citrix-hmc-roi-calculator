// Shared As-Is quantities and costs describe the full reference perimeter.
// Only Renewal subtracts existing adoption; New Business models future coverage.
import { newBusinessDefaultPct } from './newBusinessDefaults.js';
export const numeric = (value) => value !== '' && value !== null && value !== undefined && Number.isFinite(Number(value)) && Number(value) >= 0;
const n = (value) => numeric(value) ? Number(value) : 0;

export function assessmentLevers(state) {
  const t = state.tech;
  const c = state.cost;
  const users = n(t.numberUsers);
  const pc = n(t.numberPc);
  const remote = Math.floor(users * n(t.pctRemoteHybridUsers) / 100);
  const feature = (id, label, total, unitCost, category, offer = ['HMC'], unit = 'units') => ({ id, label, total, unitCost, category, offer, unit, annualBaseline: total * unitCost });
  return [
    feature('xenserver', 'XenServer', n(t.numberHosts), n(t.coresPerHost) * n(c.costHypervisorPerCoreYear), 'hypervisor', ['HMC', 'CPC'], 'hosts'),
    feature('netscaler', 'NetScaler · VPN / ADC', n(t.numberVpnAdcAppliances), n(c.costVpnAdcAppliance) * n(c.applianceMaintenanceAnnualPct) / 100, 'access'),
    feature('endpoint', 'Unicon/eLux · Endpoint lifecycle', pc, n(c.costOnePc) / Math.max(n(t.avgPcAgeYears), 1), 'endpoint'),
    feature('mfa', 'MFA', users, n(c.costMfaUserMonth) * 12, 'mfa', ['HMC'], 'users'),
    feature('ztna', 'ZTNA', remote, n(c.costZtnaUserMonth) * 12, 'ztna', ['HMC'], 'users'),
    ...[
      ['opsEndpoint', 'IT · Endpoint', 'itDaysEndpointMgmt'],
      ['opsImage', 'IT · Image / VDI', 'itDaysImageVdiMgmt'],
      ['opsSupport', 'IT · Support', 'itDaysSupport'],
      ['opsAccess', 'IT · Access', 'itDaysAccessMgmt'],
    ].map(([id, label, key]) => feature(id, label, n(t[key]), n(c.costSysadminDay), id, ['HMC', 'CPC'], 'days')),
    feature('edr', 'Security · EDR', pc, n(c.costEdrEndpointMonth) * 12, 'edr'),
    feature('posture', 'Security · Device posture', pc, n(c.costDevicePostureEndpointMonth) * 12, 'posture'),
    feature('soc', 'Security · SOC / MSSP', n(c.costSocMsspAnnual), 1, 'securityServices', ['HMC'], 'eurYear'),
    feature('remediation', 'Security · Remediation', pc * n(c.costRemediationPerEndpointYear), 1, 'securityServices', ['HMC'], 'eurYear'),
    feature('securityOps', 'Security · Operations', n(t.itDaysSecurityOps), n(c.costSysadminDay), 'securityServices', ['HMC'], 'days'),
    ...[
      ['cvadPremium', 'CVAD Premium'], ['platformRisk', 'Platform risk'], ['infrastructure', 'Infrastructure optimization'],
    ].map(([id, label]) => feature(id, label, n(state.manualBaselines?.[id]), 1, id, ['CPC'], 'eurYear')),
  ].map((lever) => {
    const dependencies = {
      xenserver: [[t.numberHosts], [t.coresPerHost, c.costHypervisorPerCoreYear]],
      netscaler: [[t.numberVpnAdcAppliances], [c.costVpnAdcAppliance, c.applianceMaintenanceAnnualPct]],
      endpoint: [[t.numberPc], [c.costOnePc, t.avgPcAgeYears]],
      mfa: [[t.numberUsers], [c.costMfaUserMonth]],
      ztna: [[t.numberUsers, t.pctRemoteHybridUsers], [c.costZtnaUserMonth]],
      opsEndpoint: [[t.itDaysEndpointMgmt], [c.costSysadminDay]],
      opsImage: [[t.itDaysImageVdiMgmt], [c.costSysadminDay]],
      opsSupport: [[t.itDaysSupport], [c.costSysadminDay]],
      opsAccess: [[t.itDaysAccessMgmt], [c.costSysadminDay]],
      edr: [[t.numberPc], [c.costEdrEndpointMonth]],
      posture: [[t.numberPc], [c.costDevicePostureEndpointMonth]],
      soc: [[c.costSocMsspAnnual], []],
      remediation: [[t.numberPc], [c.costRemediationPerEndpointYear]],
      securityOps: [[t.itDaysSecurityOps], [c.costSysadminDay]],
    }[lever.id] ?? [[state.manualBaselines?.[lever.id] ?? 0], []];
    const [quantities, costs] = dependencies;
    const referenceKnown = quantities.every(numeric) && (lever.total === 0 || costs.every(numeric)) &&
      (lever.id !== 'endpoint' || lever.total === 0 || Number(t.avgPcAgeYears) > 0) &&
      (lever.id !== 'ztna' || n(t.pctRemoteHybridUsers) <= 100) &&
      (lever.id !== 'netscaler' || n(c.applianceMaintenanceAnnualPct) <= 100) &&
      (['eurYear', 'days'].includes(lever.unit) || Number.isInteger(lever.total));
    return { ...lever, referenceKnown, replacementCost: lever.id === 'endpoint' ? n(c.costOnePc) : lever.id === 'netscaler' ? n(c.costVpnAdcAppliance) : 0, baselineLifecycle: n(t.avgPcAgeYears) };
  });
}

// Defaults are displayed in the UI. Empty strings remain invalid; only absent
// optional assumptions get defaults, so clearing an input never means zero.
export function scenarioParameters(lever, plan = {}, mode = 'renewal') {
  const adoptionPct = plan.adoptionPct ?? (mode === 'newBusiness' ? newBusinessDefaultPct(lever.id) : 0);
  return {
    current: mode === 'newBusiness' ? 0 : plan.current ?? (lever.total === 0 ? 0 : ''),
    adoptionPct,
    target: mode === 'newBusiness' ? lever.total * n(adoptionPct) / 100 : plan.target ?? lever.total,
    avoidablePct: plan.avoidablePct ?? 100,
    months: plan.months ?? 0,
    activationCost: plan.activationCost ?? 0,
    endpointLifecycleYears: plan.endpointLifecycleYears ?? lever.baselineLifecycle + 2,
    endpointReplacementCost: plan.endpointReplacementCost ?? lever.replacementCost,
    includeRefresh: plan.includeRefresh === true,
  };
}

export function calculateOpportunity(lever, plan = {}, years = 1, mode = 'renewal') {
  const p = scenarioParameters(lever, plan, mode);
  const total = lever.total;
  const current = numeric(p.current) ? Number(p.current) : null;
  const isQuantity = !['eurYear', 'days'].includes(lever.unit);
  const currentValid = lever.referenceKnown !== false && current !== null && current <= total && (!isQuantity || Number.isInteger(current));
  const target = numeric(p.target) ? Number(p.target) : null;
  // Percentages represent equivalent coverage in a forecast; real renewal
  // host/user/device counts must remain integers.
  const percentValid = mode !== 'newBusiness' || (numeric(p.adoptionPct) && Number(p.adoptionPct) <= 100);
  const targetValid = currentValid && percentValid && target !== null && target >= current && target <= total &&
    (mode === 'newBusiness' || !isQuantity || Number.isInteger(target));
  const gap = targetValid ? target - current : null;
  const rateValid = numeric(p.avoidablePct) && Number(p.avoidablePct) <= 100;
  const endpointValid = lever.id !== 'endpoint' ||
    (numeric(p.endpointReplacementCost) && numeric(p.endpointLifecycleYears) && Number(p.endpointLifecycleYears) > 0);
  const endpointAnnualCost = lever.id === 'endpoint' && endpointValid ? n(p.endpointReplacementCost) / Number(p.endpointLifecycleYears) : 0;
  const unitSaving = lever.id === 'endpoint' ? Math.max(0, lever.unitCost - endpointAnnualCost) : lever.unitCost;
  const baselineValid = currentValid && endpointValid && rateValid;
  const alreadySaving = baselineValid ? current * unitSaving * n(p.avoidablePct) / 100 : 0;
  const remainingAnnualCost = Math.max(0, lever.annualBaseline - alreadySaving);
  const excluded = plan.feasibility === 'no';
  const complete = excluded || (baselineValid && targetValid &&
    numeric(p.months) && Number(p.months) <= years * 12 && numeric(p.activationCost));
  const qualified = complete && !excluded && gap > 0;
  const annualSaving = qualified ? Math.min(remainingAnnualCost, gap * unitSaving * n(p.avoidablePct) / 100) : 0;
  const effectiveMonths = qualified ? Math.max(0, years * 12 - n(p.months)) : 0;
  const oneTimeSaving = qualified && lever.id === 'netscaler' && p.includeRefresh && effectiveMonths > 0
    ? gap * lever.replacementCost * n(p.avoidablePct) / 100 : 0;
  const periodSaving = annualSaving * effectiveMonths / 12 + oneTimeSaving;
  const activationCost = qualified ? n(p.activationCost) : 0;
  return { ...lever, mode, parameters: p, current, currentValid, baselineValid, target, targetValid, gap, complete, qualified, excluded,
    alreadySaving, remainingAnnualCost, annualSaving, periodSaving, oneTimeSaving, activationCost, endpointAnnualCost, unitSaving,
    months: n(p.months), effectiveMonths, netSaving: periodSaving - activationCost,
    targetPct: targetValid && total > 0 ? target / total * 100 : 0,
    currentPct: currentValid && total > 0 ? current / total * 100 : 0 };
}

export function calculateCustomerScenario(state, plans, offer, years, renewalCost = 0, mode = 'renewal') {
  const rows = assessmentLevers(state).filter((l) => l.offer.includes(offer)).map((lever) =>
    calculateOpportunity(lever, plans?.[lever.id], years, mode));
  const sum = (key) => rows.reduce((acc, row) => acc + row[key], 0);
  const annualSaving = sum('annualSaving');
  const periodSaving = sum('periodSaving');
  const activationCost = sum('activationCost');
  const netSaving = periodSaving - activationCost;
  // Monthly cashflow accounts for each individual activation delay.
  let cumulative = -activationCost;
  let paybackMonths = activationCost === 0 ? null : undefined;
  for (let month = 1; month <= years * 12 && paybackMonths === undefined; month += 1) {
    for (const row of rows.filter((r) => r.qualified)) {
      cumulative += row.annualSaving / 12 * Math.max(0, Math.min(1, month - row.months));
      if (row.oneTimeSaving && row.months >= month - 1 && row.months < month) cumulative += row.oneTimeSaving;
    }
    if (cumulative >= 0) paybackMonths = month;
  }
  return { mode, rows, annualSaving, periodSaving, activationCost, netSaving,
    complete: rows.every((row) => row.complete), completed: rows.filter((row) => row.complete).length,
    baselineComplete: rows.every((row) => row.baselineValid),
    paybackMonths: paybackMonths ?? null,
    coveragePct: renewalCost > 0 ? Math.max(0, netSaving) / renewalCost * 100 : null,
    uncoveredRenewalCost: Math.max(0, renewalCost - netSaving) };
}

// Compare annualized contracts even when their durations differ. An unknown
// previous price must never be interpreted as a zero-cost previous contract.
export function calculateRenewalComparison(profile, scenario) {
  const known = ['totalRenewalCost', 'renewalYears', 'previousRenewalCost', 'previousRenewalYears'].every((key) => numeric(profile[key])) &&
    Number(profile.renewalYears) > 0 && Number(profile.previousRenewalYears) > 0;
  const annual = known ? Number(profile.totalRenewalCost) / Number(profile.renewalYears) : null;
  const previousAnnual = known ? Number(profile.previousRenewalCost) / Number(profile.previousRenewalYears) : null;
  const annualUplift = known ? Math.max(0, annual - previousAnnual) : null;
  const uplift = known ? annualUplift * Number(profile.renewalYears) : null;
  return {
    known, previousAnnual, annualUplift, uplift,
    increasePct: known && previousAnnual > 0 ? (annual - previousAnnual) / previousAnnual * 100 : null,
    annualCoveragePct: annualUplift > 0 ? Math.max(0, scenario.annualSaving) / annualUplift * 100 : null,
    netCoveragePct: uplift > 0 ? Math.max(0, scenario.netSaving) / uplift * 100 : null,
    remainingUplift: known ? Math.max(0, uplift - scenario.netSaving) : null,
    netAfterUplift: known ? scenario.netSaving - uplift : null,
  };
}

export function calculateNewBusinessCosts(state, scenario) {
  const years = Math.min(5, Math.max(1, n(state.profile.horizonYears)));
  const categories = ['endpoint', 'hypervisor', 'access', 'mfa', 'ztna', 'edr', 'posture', 'securityServices', 'opsEndpoint', 'opsImage', 'opsSupport', 'opsAccess'];
  const asIs = Object.fromEntries(categories.map((key) => [key, 0]));
  const hmc = { ...asIs };
  for (const row of scenario.rows) {
    const baseline = row.baselineValid ? row.remainingAnnualCost : row.annualBaseline;
    asIs[row.category] += baseline;
    hmc[row.category] += baseline - row.annualSaving;
  }
  Object.assign(asIs, { hmcSubscription: 0, residualHw: 0, residualServices: 0 });
  Object.assign(hmc, {
    hmcSubscription: n(state.tech.numberUsers) * n(state.profile.hmcPricePerUserPerMonth) * 12,
    residualHw: n(state.residuals?.residualHardwareInfra),
    residualServices: n(state.residuals?.residualServices),
  });
  const migrationCostOneTime = n(state.profile.initialMigrationCost) + scenario.activationCost;
  const annualRows = Object.keys(asIs).map((key) => ({ key, asIs: asIs[key], hmc: hmc[key], delta: asIs[key] - hmc[key] }));
  const tableRows = annualRows.map((row) => {
    const levers = scenario.rows.filter((lever) => lever.category === row.key);
    // An avoided future purchase belongs to both the baseline and the benefit.
    const baseline = row.asIs * years + levers.reduce((sum, lever) => sum + lever.oneTimeSaving, 0);
    const target = categories.includes(row.key)
      ? baseline - levers.reduce((sum, lever) => sum + lever.periodSaving, 0)
      : row.hmc * years;
    return { key: row.key, asIs: baseline, hmc: target, delta: baseline - target };
  });
  tableRows.push({ key: 'migrationProject', asIs: 0, hmc: migrationCostOneTime, delta: -migrationCostOneTime });
  return { asIs, hmc, annualRows, tableRows, migrationCostOneTime, projectYears: years };
}
