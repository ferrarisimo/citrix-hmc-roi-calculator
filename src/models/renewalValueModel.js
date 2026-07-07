const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const clampPct = (value) => Math.min(Math.max(toNumber(value), 0), 100);

const getProfile = (state = {}) => state.profile ?? state.renewal?.profile ?? {};

const getStateAdoption = (state = {}, featureId) =>
  state.adoption?.[featureId] ?? state.renewal?.adoption?.[featureId] ?? {};

const getFeatureAdoption = (state, feature) => ({
  ...(feature.adoption?.[feature.id] ?? {}),
  ...getStateAdoption(state, feature.id),
});

const getFeatureMaxSaving = (feature, adoption) =>
  Math.max(
    toNumber(
      adoption.maxSaving ??
        adoption.manualAnnualSaving ??
        feature.maxSaving ??
        feature.featureMaxSaving ??
        feature.annualSaving
    ),
    0
  );

export function calculateRenewalValueModel(state = {}, features = []) {
  const warnings = [];
  const profile = getProfile(state);
  const renewalYears = Math.max(toNumber(profile.renewalYears, 1), 1);
  const renewalCost = Math.max(toNumber(profile.totalRenewalCost), 0);
  const calculatedRenewalCost = Math.max(
    toNumber(profile.calculatedRenewalCost ?? profile.numberLicenses) *
      toNumber(profile.renewalPricePerUserYear) *
      renewalYears,
    0
  );

  if (!Array.isArray(features)) {
    warnings.push('features must be an array.');
  }

  const featureRows = (Array.isArray(features) ? features : []).map((feature) => {
    const adoption = getFeatureAdoption(state, feature);
    const maxSaving = getFeatureMaxSaving(feature, adoption);
    const currentAdoptionPct = clampPct(adoption.currentAdoptionPct ?? feature.currentAdoptionPct);
    const potentialAdoptionPct = clampPct(adoption.potentialAdoptionPct ?? feature.potentialAdoptionPct);
    const adoptionGapPct = Math.max(0, potentialAdoptionPct - currentAdoptionPct);
    const alreadyRealizedSaving = maxSaving * (currentAdoptionPct / 100);
    const potentialSaving = maxSaving * (potentialAdoptionPct / 100);
    const incrementalSaving = potentialSaving - alreadyRealizedSaving;

    return {
      id: feature.id,
      label: feature.label,
      category: feature.category,
      maxSaving,
      currentAdoptionPct,
      potentialAdoptionPct,
      adoptionGapPct,
      alreadyRealizedSaving,
      potentialSaving,
      incrementalSaving,
    };
  });

  const alreadyRealizedSaving = featureRows.reduce((sum, row) => sum + row.alreadyRealizedSaving, 0);
  const potentialSaving = featureRows.reduce((sum, row) => sum + row.potentialSaving, 0);
  const incrementalSaving = potentialSaving - alreadyRealizedSaving;
  const adoptionGapPct = featureRows.length
    ? featureRows.reduce((sum, row) => sum + row.adoptionGapPct, 0) / featureRows.length
    : 0;
  const netRenewalValue = potentialSaving - renewalCost;
  const renewalCoverageRatio = renewalCost > 0 ? potentialSaving / renewalCost : null;
  const paybackMonths = incrementalSaving > 0
    ? renewalCost / (incrementalSaving / renewalYears / 12)
    : null;

  return {
    renewalCost,
    calculatedRenewalCost,
    alreadyRealizedSaving,
    potentialSaving,
    incrementalSaving,
    adoptionGapPct,
    netRenewalValue,
    renewalCoverageRatio,
    paybackMonths,
    featureRows,
    warnings,
  };
}
