import { after, test } from 'node:test';
import assert from 'node:assert/strict';
import React from 'react';
import { createServer as createHttpServer } from 'node:http';
import { renderToStaticMarkup } from 'react-dom/server';
import { createServer } from 'vite';
import { calculateCustomerScenario, calculateNewBusinessCosts } from '../src/models/customerAssessmentModel.js';

// Render the actual report components against the same model as the UI.
// An unbound host keeps middleware rendering independent from local ports.
const host = createHttpServer();
const vite = await createServer({ server: { middlewareMode: true, hmr: { server: host } }, appType: 'custom' });
after(() => vite.close());
const { RenewalReport, NewBusinessReport } = await vite.ssrLoadModule('/src/ScenarioReports.jsx');
const state = {
  profile: { horizonYears: 3, hmcPricePerUserPerMonth: 35, initialMigrationCost: 60000 },
  tech: { numberUsers: 100, numberPc: 80, numberThinClient: 20, pctRemoteHybridUsers: 60, pctByodUsers: 20, numberHosts: 8, coresPerHost: 48, numberVpnAdcAppliances: 2, avgPcAgeYears: 3, itDaysEndpointMgmt: 120, itDaysImageVdiMgmt: 90, itDaysSupport: 180, itDaysAccessMgmt: 50, itDaysSecurityOps: 60 },
  cost: { costOnePc: 700, costHypervisorPerCoreYear: 100, costVpnAdcAppliance: 5000, applianceMaintenanceAnnualPct: 20, costMfaUserMonth: 4, costZtnaUserMonth: 7, costEdrEndpointMonth: 5, costDevicePostureEndpointMonth: 2.5, costSocMsspAnnual: 20000, costRemediationPerEndpointYear: 40, costSysadminDay: 600 },
  residuals: { residualHardwareInfra: 0, residualServices: 0 },
};
const profile = { renewalType: 'HMC', numberLicenses: 100, renewalYears: 3, totalRenewalCost: 150000, previousRenewalCost: 120000, previousRenewalYears: 3 };
const render = (component, props) => renderToStaticMarkup(React.createElement(component, { lang: 'it', state, ...props })).replaceAll('\u00a0', ' ');

test('renewal report documents current, target, timing, costs, input precision and escaped notes', () => {
  const plans = { xenserver: { current: 2, target: 4, months: 6, activationCost: 3000, evidence: 'Migrazione concordata <script>alert(1)</script>\nSeconda fase' } };
  const html = render(RenewalReport, { profile, plans });
  assert.match(html, /SIMULAZIONE PARZIALE/);
  assert.match(html, /21\.000 €/); // 2 hosts * 4800 * 2.5 years - 3000
  assert.match(html, /70%/); // term net savings / 30k increase
  assert.match(html, /attivazione dopo: 6/);
  assert.match(html, /già implementati/);
  assert.match(html, /&lt;script&gt;alert\(1\)&lt;\/script&gt;/);
  assert.doesNotMatch(html, /<script>/);
  assert.match(html, /2,50 €/); // entered monthly cost must not round to 3 euros
  assert.match(html, /Note \/ evidenze inserite/);
});

test('missing previous renewal price is documented without claiming coverage', () => {
  const html = render(RenewalReport, { profile: { ...profile, previousRenewalCost: '' }, plans: {} });
  assert.match(html, /Il confronto con il contratto precedente richiede costi e durate completi/);
  assert.match(html, /Costo contratto precedente<\/td><td>—<\/td>/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});

test('CPC report retains manual baselines and restricts levers to the selected offer', () => {
  const html = render(RenewalReport, { profile: { ...profile, renewalType: 'CPC' }, state: { ...state, manualBaselines: { platformRisk: 12345 } }, plans: { platformRisk: { current: 0, target: 2000, evidence: 'Base di rischio verificata' } } });
  assert.match(html, /12\.345,00 €/);
  assert.match(html, /Base di rischio verificata/);
  assert.doesNotMatch(html, /<h3>Security · SOC/);
});

test('new business narrative states an extra cost accurately and includes scenario overrides', () => {
  const customer = { ...state, profile: { ...state.profile, hmcPricePerUserPerMonth: 500 } };
  const plans = { opsEndpoint: { adoptionPct: 40, evidence: 'Confermare il perimetro' }, endpoint: { adoptionPct: 50, endpointLifecycleYears: 6, endpointReplacementCost: 400 }, netscaler: { adoptionPct: 50, includeRefresh: true } };
  const scenario = calculateCustomerScenario(customer, plans, 'HMC', 3, 0, 'newBusiness');
  const costs = calculateNewBusinessCosts(customer, scenario);
  const totalAsIs = costs.tableRows.reduce((sum, row) => sum + row.asIs, 0);
  const totalHmc = costs.tableRows.reduce((sum, row) => sum + row.hmc, 0);
  const model = { ...costs, totalAsIs, totalHmc, projectDelta: totalAsIs - totalHmc, roiAnnual: (totalAsIs - totalHmc) / totalHmc };
  const html = render(NewBusinessReport, { state: customer, opportunityModel: scenario, model, rowLabels: {}, plans });
  assert.match(html, /Il modello stima un maggior costo/);
  assert.match(html, /il nuovo progetto non si ripaga/);
  assert.match(html, /Confermare il perimetro/);
  assert.match(html, /400,00 €/);
  assert.match(html, /Default di riferimento/);
  assert.match(html, /<strong>40%<\/strong>/);
  assert.match(html, /Costo progetto base/);
  assert.doesNotMatch(html, /NaN|Infinity/);
});
