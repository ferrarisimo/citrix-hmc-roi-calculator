export const DRAFT_KEY = 'citrix-roi-workspace-v1';
const isObject = value => value !== null && typeof value === 'object' && !Array.isArray(value);
const numeric = value => value === '' || (typeof value === 'number' && Number.isFinite(value));
function restoreSection(value, template) {
  if (!isObject(value)) throw new Error('Invalid draft section');
  return Object.fromEntries(Object.entries(template).map(([key, fallback]) => {
    const next = value[key];
    if (next === undefined) return [key, fallback];
    if (isObject(fallback)) return [key, restoreSection(next, fallback)];
    if (typeof fallback === 'number' ? !numeric(next) : typeof next !== typeof fallback) throw new Error('Invalid draft value');
    return [key, next];
  }));
}
function restorePlans(value) {
  if (!isObject(value)) throw new Error('Invalid plans');
  const numericKeys = ['current','target','adoptionPct','activationCost','avoidablePct','months','endpointLifecycleYears','endpointReplacementCost'];
  return Object.fromEntries(Object.entries(value).filter(([key]) => !['__proto__','constructor','prototype'].includes(key)).map(([key, plan]) => {
    if (!isObject(plan)) throw new Error('Invalid plan');
    return [key, Object.fromEntries(Object.entries(plan).filter(([name]) => [...numericKeys,'evidence','includeRefresh'].includes(name)).map(([name, entry]) => {
      if (numericKeys.includes(name) ? !numeric(entry) : typeof entry !== (name === 'evidence' ? 'string' : 'boolean')) throw new Error('Invalid plan value');
      return [name, entry];
    }))];
  }));
}
export function readDraft(storage, defaults) {
  try {
    const raw = JSON.parse(storage.getItem(DRAFT_KEY));
    if (!raw || raw.version !== 1) return null;
    const state = restoreSection(raw.state, defaults);
    state.manualBaselines = { cvadPremium: '', platformRisk: '', infrastructure: '' };
    // Manual bases accept numeric data or an explicitly empty field.
    for (const key of Object.keys(state.manualBaselines)) {
      const value = raw.state.manualBaselines?.[key] ?? '';
      if (!numeric(value)) return null;
      state.manualBaselines[key] = value;
    }
    const renewalProfile = restoreSection(raw.renewalProfile, defaults.renewal.profile);
    if (!['CPC','HMC'].includes(renewalProfile.renewalType)) return null;
    return { state, renewalProfile, businessPlans: restorePlans(raw.businessPlans), renewalPlans: restorePlans(raw.renewalPlans),
      lang: ['it','en','es','de'].includes(raw.lang) ? raw.lang : 'en',
      calculatorMode: ['assessment','newBusiness','renewal'].includes(raw.calculatorMode) ? raw.calculatorMode : 'assessment',
      analysisMode: raw.analysisMode === 'renewal' ? 'renewal' : 'newBusiness',
      stage: ['profile','adoption','results'].includes(raw.stage) ? raw.stage : 'profile',
      group: ['users','devices','infrastructure','security','operations','other'].includes(raw.group) ? raw.group : 'users',
      origin: raw.origin === 'blank' ? 'blank' : 'example',
      reviews: isObject(raw.reviews) ? Object.fromEntries(Object.entries(raw.reviews).filter(([,v]) => typeof v === 'string')) : {},
    };
  } catch { return null; }
}
export function writeDraft(storage, data) {
  storage.setItem(DRAFT_KEY, JSON.stringify({ ...data, version: 1 }));
}
export function blankAssessment(defaults) {
  return { ...defaults, tech: Object.fromEntries(Object.keys(defaults.tech).map(key => [key, ''])), cost: Object.fromEntries(Object.keys(defaults.cost).map(key => [key, ''])),
    profile: { ...defaults.profile, hmcPricePerUserPerMonth: '', initialMigrationCost: '' }, residuals: { residualHardwareInfra: '', residualServices: '' } };
}
