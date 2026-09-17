const number = (value, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const nonNegative = (value) => Math.max(number(value), 0);
const pct = (value) => Math.min(Math.max(number(value), 0), 100);

export const ASSESSMENT_STATUSES = ['unknown', 'notUsed', 'pilot', 'partial', 'full'];
export const FEASIBILITY_STATUSES = ['unknown', 'yes', 'no'];
export const CONFIDENCE_LEVELS = ['low', 'medium', 'high'];

export const createEmptyAssessment = () => ({
  status: 'unknown',
  feasibility: 'unknown',
  currentCoveragePct: 0,
  targetCoveragePct: 0,
  currentAnnualCost: 0,
  avoidableCostPct: 0,
  activationCost: 0,
  timeToValueMonths: 0,
  confidence: 'low',
  evidence: '',
});

export function calculateRenewalAssessment(profile = {}, features = [], assessments = {}) {
  const renewalYears = Math.max(number(profile.renewalYears, 1), 1);
  const previousRenewalYears = Math.max(number(profile.previousRenewalYears, 1), 1);
  const proposedAnnualRenewal = nonNegative(profile.totalRenewalCost) / renewalYears;
  const previousAnnualRenewal = nonNegative(profile.previousRenewalCost) / previousRenewalYears;
  const annualRenewalUplift = previousAnnualRenewal > 0
    ? Math.max(proposedAnnualRenewal - previousAnnualRenewal, 0)
    : 0;
  const renewalUpliftOverTerm = annualRenewalUplift * renewalYears;

  const rows = features.map((feature) => {
    const assessment = { ...createEmptyAssessment(), ...(assessments[feature.id] ?? {}) };
    const currentCoveragePct = pct(assessment.currentCoveragePct);
    const targetCoveragePct = pct(assessment.targetCoveragePct);
    const adoptionGapPct = Math.max(targetCoveragePct - currentCoveragePct, 0);
    const assessed = assessment.status !== 'unknown' && assessment.feasibility !== 'unknown';
    const isFeasible = assessment.feasibility === 'yes';
    const annualCost = nonNegative(assessment.currentAnnualCost);
    const avoidableCostPct = pct(assessment.avoidableCostPct);
    const activationCost = nonNegative(assessment.activationCost);
    const timeToValueMonths = Math.min(nonNegative(assessment.timeToValueMonths), renewalYears * 12);
    const effectiveMonths = Math.max(renewalYears * 12 - timeToValueMonths, 0);
    const annualRunRateSaving = isFeasible
      ? annualCost * (avoidableCostPct / 100) * (adoptionGapPct / 100)
      : 0;
    const grossAvoidedCost = annualRunRateSaving * (effectiveMonths / 12);
    const qualified = assessed && isFeasible && adoptionGapPct > 0 && annualCost > 0 && avoidableCostPct > 0;
    const includedActivationCost = qualified ? activationCost : 0;
    const netOpportunityValue = qualified ? grossAvoidedCost - includedActivationCost : 0;
    const annualResidualSpend = qualified
      ? annualCost * (1 - avoidableCostPct / 100) * (adoptionGapPct / 100)
      : 0;

    return {
      feature,
      assessment,
      assessed,
      qualified,
      currentCoveragePct,
      targetCoveragePct,
      adoptionGapPct,
      annualRunRateSaving: qualified ? annualRunRateSaving : 0,
      grossAvoidedCost: qualified ? grossAvoidedCost : 0,
      activationCost: includedActivationCost,
      netOpportunityValue,
      annualResidualSpend,
      effectiveMonths,
    };
  });

  const assessedCount = rows.filter((row) => row.assessed).length;
  const qualifiedRows = rows.filter((row) => row.qualified);
  const annualRunRateSaving = qualifiedRows.reduce((sum, row) => sum + row.annualRunRateSaving, 0);
  const grossAvoidedCost = qualifiedRows.reduce((sum, row) => sum + row.grossAvoidedCost, 0);
  const activationCost = qualifiedRows.reduce((sum, row) => sum + row.activationCost, 0);
  const annualResidualSpend = qualifiedRows.reduce((sum, row) => sum + row.annualResidualSpend, 0);
  const incrementalInvestment = activationCost + renewalUpliftOverTerm;
  const netIncrementalValue = grossAvoidedCost - incrementalInvestment;
  const benefitCostRatio = incrementalInvestment > 0 ? grossAvoidedCost / incrementalInvestment : null;
  const paybackMonths = annualRunRateSaving > 0
    ? incrementalInvestment / annualRunRateSaving * 12
    : null;

  return {
    renewalYears,
    proposedAnnualRenewal,
    previousAnnualRenewal,
    annualRenewalUplift,
    renewalUpliftOverTerm,
    assessedCount,
    qualifiedCount: qualifiedRows.length,
    annualRunRateSaving,
    grossAvoidedCost,
    activationCost,
    annualResidualSpend,
    incrementalInvestment,
    netIncrementalValue,
    benefitCostRatio,
    paybackMonths,
    rows,
  };
}
