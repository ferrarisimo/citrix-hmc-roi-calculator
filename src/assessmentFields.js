// One catalogue links labels, help, units and review state to the same fields.
const field = (section, key, label, help, suffix, max, step = 'any') => ({ section, key, label, help, suffix, max, step });
export const assessmentGroups = [
  { id: 'users', fields: [field('tech','numberUsers','users','helpUsers',null,null,1), field('tech','pctRemoteHybridUsers','remote','helpRemote','%',100), field('tech','pctByodUsers','byod','helpByod','%',100)] },
  { id: 'devices', compatibility: 'endpointCompatibility', fields: [field('tech','numberPc','pcCount','helpPcCount',null,null,1), field('tech','numberThinClient','thinClients','helpThinClients',null,null,1), field('tech','avgPcAgeYears','pcCycle','helpAvgPcAge','yearsSuffix'), field('cost','costOnePc','newPcCost','helpNewPcCost','€')] },
  { id: 'infrastructure', compatibility: 'compatibility', fields: [field('tech','numberHosts','hosts','helpHosts',null,null,1), field('tech','coresPerHost','cores','helpCores',null,null,1), field('cost','costHypervisorPerCoreYear','hypervisorCostCoreYear','helpHypervisorCost','€')] },
  { id: 'security', fields: [field('tech','numberVpnAdcAppliances','vpnAdc','helpVpnAdc',null,null,1), field('cost','costVpnAdcAppliance','vpnApplianceCost','helpVpnApplianceCost','€'), field('cost','applianceMaintenanceAnnualPct','applianceMaintenance','helpApplianceMaintenance','%',100), field('cost','costMfaUserMonth','mfaCost','helpMfaCost','€'), field('cost','costZtnaUserMonth','ztnaCost','helpZtnaCost','€'), field('cost','costEdrEndpointMonth','edrCost','helpEdrCost','€'), field('cost','costDevicePostureEndpointMonth','postureCost','helpPostureCost','€'), field('cost','costSocMsspAnnual','socCost','helpSocCost','€'), field('cost','costRemediationPerEndpointYear','remediationCost','helpRemediationCost','€')] },
  { id: 'operations', fields: [field('cost','costSysadminDay','sysadminDayCost','helpSysadminDayCost','€'), field('tech','itDaysEndpointMgmt','itDaysEndpoint','helpItDaysEndpoint','daysYear'), field('tech','itDaysImageVdiMgmt','itDaysImage','helpItDaysImage','daysYear'), field('tech','itDaysSupport','itDaysSupport','helpItDaysSupport','daysYear'), field('tech','itDaysAccessMgmt','itDaysAccess','helpItDaysAccess','daysYear'), field('tech','itDaysSecurityOps','itDaysSecurity','helpItDaysSecurity','daysYear')] },
  { id: 'other', optional: true, fields: ['cvadPremium','platformRisk','infrastructure'].map(key => field('manualBaselines',key,key,null,'€/anno')) },
];
export function groupComplete(group, state) {
  return group.fields.every(({section, key, max, step}) => {
    const value = state[section]?.[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && (max == null || value <= max) && (step !== 1 || Number.isInteger(value));
  });
}
export function groupFingerprint(group, state) {
  return JSON.stringify(group.fields.map(({section, key}) => state[section]?.[key] ?? ''));
}
export function groupStatus(group, state, reviews = {}) {
  return !groupComplete(group, state) ? 'missing' : reviews[group.id] === groupFingerprint(group, state) ? 'verified' : 'review';
}
