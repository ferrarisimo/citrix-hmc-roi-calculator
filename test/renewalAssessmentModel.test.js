import test from 'node:test';
import assert from 'node:assert/strict';
import { calculateRenewalAssessment } from '../src/models/renewalAssessmentModel.js';

const profile = {
  renewalYears: 3,
  totalRenewalCost: 1260000,
  previousRenewalCost: 1200000,
  previousRenewalYears: 3,
};
const features = [{ id: 'xenserver', label: 'XenServer' }];

test('starts from a neutral assessment with no assumed saving', () => {
  const result = calculateRenewalAssessment(profile, features, {});

  assert.equal(result.assessedCount, 0);
  assert.equal(result.qualifiedCount, 0);
  assert.equal(result.grossAvoidedCost, 0);
  assert.equal(result.annualRunRateSaving, 0);
});

test('calculates only the qualified coverage gap after time to value', () => {
  const result = calculateRenewalAssessment(profile, features, {
    xenserver: {
      status: 'partial', feasibility: 'yes', currentCoveragePct: 20, targetCoveragePct: 80,
      currentAnnualCost: 100000, avoidableCostPct: 50, activationCost: 20000,
      timeToValueMonths: 6, confidence: 'high',
    },
  });

  assert.equal(result.qualifiedCount, 1);
  assert.equal(result.annualRunRateSaving, 30000);
  assert.equal(result.grossAvoidedCost, 75000);
  assert.equal(result.activationCost, 20000);
  assert.equal(result.renewalUpliftOverTerm, 60000);
  assert.equal(result.netIncrementalValue, -5000);
});

test('excludes opportunities that are not technically feasible', () => {
  const result = calculateRenewalAssessment(profile, features, {
    xenserver: {
      status: 'notUsed', feasibility: 'no', currentCoveragePct: 0, targetCoveragePct: 100,
      currentAnnualCost: 100000, avoidableCostPct: 100, activationCost: 10000,
    },
  });

  assert.equal(result.assessedCount, 1);
  assert.equal(result.qualifiedCount, 0);
  assert.equal(result.grossAvoidedCost, 0);
  assert.equal(result.activationCost, 0);
});
