const toNumber = (value, fallback = 0) => {
  const numberValue = Number(value);
  return Number.isFinite(numberValue) ? numberValue : fallback;
};

const clampPct = (value) => Math.min(Math.max(toNumber(value), 0), 100);

const getProfile = (state = {}) => state.profile ?? state.renewal?.profile ?? {};
const getTech = (state = {}) => state.tech ?? state.renewal?.tech ?? {};
const getCost = (state = {}) => state.cost ?? state.renewal?.cost ?? {};

const getStateAdoption = (state = {}, featureId) =>
  state.adoption?.[featureId] ?? state.renewal?.adoption?.[featureId] ?? {};

const getFeatureAdoption = (state, feature) => ({
  ...(feature.adoption?.[feature.id] ?? {}),
  ...getStateAdoption(state, feature.id),
});

const getWeightedItReductionPct = (tech, cost) => {
  const endpointDays = Math.max(toNumber(tech.itDaysEndpointMgmt), 0);
  const imageDays = Math.max(toNumber(tech.itDaysImageVdiMgmt), 0);
  const supportDays = Math.max(toNumber(tech.itDaysSupport), 0);
  const accessDays = Math.max(toNumber(tech.itDaysAccessMgmt), 0);
  const totalDays = endpointDays + imageDays + supportDays + accessDays;

  if (totalDays <= 0) return 0;

  return (
    endpointDays * clampPct(cost.reductionEffortEndpointPct) +
    imageDays * clampPct(cost.reductionEffortImagePct) +
    supportDays * clampPct(cost.reductionEffortSupportPct) +
    accessDays * clampPct(cost.reductionEffortAccessPct)
  ) / totalDays / 100;
};

const getCalculatedMaxSaving = (feature, state, renewalYears) => {
  const profile = getProfile(state);
  const tech = getTech(state);
  const cost = getCost(state);
  const numberLicenses = Math.max(toNumber(profile.numberLicenses), 0);
  const numberPc = Math.max(toNumber(tech.numberPc), 0);
  const remoteUsers = numberLicenses * (clampPct(tech.pctRemoteHybridUsers) / 100);
  const totalCores = Math.max(toNumber(tech.numberHosts), 0) * Math.max(toNumber(tech.coresPerHost), 0);
  const accessAppliancePurchaseCost = Math.max(toNumber(tech.numberVpnAdcAppliances), 0) * Math.max(toNumber(cost.costVpnAdcAppliance), 0);
  const accessApplianceMaintenanceAnnual = accessAppliancePurchaseCost * (toNumber(cost.applianceMaintenanceAnnualPct) / 100);
  const replaceablePc = numberPc * (clampPct(tech.pctPcReplaceableWithThinClient) / 100);
  const remainingPc = Math.max(numberPc - replaceablePc, 0);
  const currentEndpointAnnualCost = numberPc * Math.max(toNumber(cost.costOnePc), 0) / Math.max(toNumber(tech.avgPcAgeYears, 1), 1);
  const optimizedEndpointAnnualCost =
    remainingPc * Math.max(toNumber(cost.costOnePc), 0) / Math.max(toNumber(tech.lifecyclePcTargetYears, 1), 1) +
    replaceablePc * Math.max(toNumber(cost.costOneThinClient), 0) / 5;
  const currentItEffortAnnualCost = (
    Math.max(toNumber(tech.itDaysEndpointMgmt), 0) +
    Math.max(toNumber(tech.itDaysImageVdiMgmt), 0) +
    Math.max(toNumber(tech.itDaysSupport), 0) +
    Math.max(toNumber(tech.itDaysAccessMgmt), 0)
  ) * Math.max(toNumber(cost.costSysadminDay), 0);

  return {
    xenserver: totalCores * Math.max(toNumber(cost.costHypervisorPerCoreYear), 0) * renewalYears,
    netscaler: accessAppliancePurchaseCost + accessApplianceMaintenanceAnnual * renewalYears,
    uniconElux: Math.max(0, currentEndpointAnnualCost - optimizedEndpointAnnualCost) * renewalYears,
    endpointLifecycle: Math.max(0, currentEndpointAnnualCost - optimizedEndpointAnnualCost) * renewalYears,
    mfaZtna: (
      numberLicenses * Math.max(toNumber(cost.costMfaUserMonth), 0) * 12 +
      remoteUsers * Math.max(toNumber(cost.costZtnaUserMonth), 0) * 12
    ) * renewalYears,
    itEffort: currentItEffortAnnualCost * getWeightedItReductionPct(tech, cost) * renewalYears,
    securityOps: (
      numberPc * Math.max(toNumber(cost.costEdrEndpointMonth), 0) * 12 +
      numberPc * Math.max(toNumber(cost.costDevicePostureEndpointMonth), 0) * 12 +
      Math.max(toNumber(cost.costSocMsspAnnual), 0) +
      numberPc * Math.max(toNumber(cost.costRemediationPerEndpointYear), 0) +
      Math.max(toNumber(tech.itDaysSecurityOps), 0) * Math.max(toNumber(cost.costSysadminDay), 0)
    ) * renewalYears,
  }[feature.calculationKey];
};

const getFeatureMaxSaving = (feature, adoption, state, renewalYears) => {
  const isManualEstimate = feature.calculationKey?.startsWith('manual');
  const manualAnnualSaving = Math.max(toNumber(adoption.maxSaving ?? adoption.manualAnnualSaving ?? feature.maxSaving ?? feature.featureMaxSaving ?? feature.annualSaving), 0);
  const calculatedMaxSaving = getCalculatedMaxSaving(feature, state, renewalYears);

  return Math.max(isManualEstimate || calculatedMaxSaving === undefined ? manualAnnualSaving * renewalYears : calculatedMaxSaving, 0);
};

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
    const maxSaving = getFeatureMaxSaving(feature, adoption, state, renewalYears);
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
