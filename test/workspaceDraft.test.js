import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readDraft, writeDraft, blankAssessment, DRAFT_KEY } from '../src/workspaceDraft.js';
import { assessmentGroups, groupFingerprint, groupStatus } from '../src/assessmentFields.js';
const defaults = { profile: {horizonYears: 3, hmcPricePerUserPerMonth: 35, initialMigrationCost: 60000}, tech: {numberUsers: 1000, pctRemoteHybridUsers: 60, pctByodUsers: 20}, cost: {costOnePc: 700}, residuals: {residualHardwareInfra: 0, residualServices: 0}, renewal: {profile: {renewalType: 'HMC', renewalYears: 3, totalRenewalCost: 1260000}} };
const storage = () => { let text; return {getItem: () => text, setItem: (key,value) => { assert.equal(key,DRAFT_KEY); text=value; }}; };
const data = () => ({state: {...defaults, manualBaselines: {platformRisk: 1250}}, renewalProfile: defaults.renewal.profile, businessPlans: {xenserver: {adoptionPct: 45, evidence: 'Verified'}}, renewalPlans: {xenserver: {current: 2, target: 5, months: 3, includeRefresh: false}}, reviews: {}, calculatorMode: 'assessment', analysisMode: 'renewal', stage: 'adoption', group: 'security', origin: 'blank', lang: 'it'});
test('draft round-trip preserves shared data, independent plans, manual bases and renewal navigation', () => {
  const store = storage(); const original = data(); writeDraft(store, original); const restored = readDraft(store,defaults);
  assert.equal(restored.state.manualBaselines.platformRisk,1250);
  assert.deepEqual(restored.businessPlans,original.businessPlans); assert.deepEqual(restored.renewalPlans,original.renewalPlans);
  assert.equal(restored.analysisMode,'renewal'); assert.equal(restored.group,'security'); assert.equal(restored.stage,'adoption');
});
test('unknown values and explicit zero remain distinct after reloading', () => {
  const store = storage(); const original = data(); original.state = blankAssessment(defaults); original.state.tech.numberUsers=0;
  writeDraft(store,original); const restored=readDraft(store,defaults);
  assert.equal(restored.state.tech.numberUsers,0); assert.equal(restored.state.tech.pctRemoteHybridUsers,''); assert.equal(restored.state.cost.costOnePc,'');
});
test('malformed, incompatible and inaccessible drafts fall back safely', () => {
  const store=storage(); store.setItem(DRAFT_KEY,'broken'); assert.equal(readDraft(store,defaults),null);
  store.setItem(DRAFT_KEY,JSON.stringify({...data(),version: 99})); assert.equal(readDraft(store,defaults),null);
  const corrupt=data(); corrupt.state={...defaults,tech:{numberUsers:{malicious:true}}}; writeDraft(store,corrupt); assert.equal(readDraft(store,defaults),null);
  assert.equal(readDraft({getItem(){throw new Error('blocked');}},defaults),null);
  assert.throws(() => writeDraft({setItem(){throw new Error('quota');}},data()),/quota/);
});
test('review confirmation is invalidated by edits and never inferred from example values', () => {
  const group=assessmentGroups[0]; const state=structuredClone(defaults);
  assert.equal(groupStatus(group,state,{}),'review'); const reviews={users:groupFingerprint(group,state)};
  assert.equal(groupStatus(group,state,reviews),'verified'); state.tech.numberUsers=1500;
  assert.equal(groupStatus(group,state,reviews),'review'); state.tech.numberUsers=''; assert.equal(groupStatus(group,state,reviews),'missing');
  state.tech.numberUsers=1000; state.tech.pctByodUsers=120; assert.equal(groupStatus(group,state,reviews),'missing');
});
