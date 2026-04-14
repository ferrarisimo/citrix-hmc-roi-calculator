import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import * as LucideIcons from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
} from 'recharts';

const eur = (value, lang = 'it') =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'it-IT', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value, digits = 0) =>
  `${((Number.isFinite(value) ? value : 0) * 100).toFixed(digits)}%`;

const COLORS = ['#2563eb', '#0f172a', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#dc2626'];
const DEFAULT_ICON_NAME = 'Calculator';

function SafeIcon({ name, fallback = DEFAULT_ICON_NAME, ...props }) {
  const PrimaryIcon = LucideIcons[name];
  const FallbackIcon = LucideIcons[fallback] || LucideIcons[DEFAULT_ICON_NAME];
  const IconToRender = typeof PrimaryIcon === 'function' ? PrimaryIcon : FallbackIcon;

  if (typeof IconToRender !== 'function') {
    return null;
  }

  return <IconToRender {...props} />;
}

const TEXT = {
  it: {
    badge: 'Arrow | Citrix ROI Calculator',
    title: 'Calcolatore ROI Citrix per clienti',
    subtitle:
      'Strumento professionale per confrontare costi attuali, scenario HMC, saving, ROI e payback in modo chiaro e immediato.',
    reset: 'Reset scenario',
    users: 'Utenti',
    remoteUsers: 'Utenti remoti',
    hmcUserMonth: 'HMC per utente/mese',
    currentAnnual: 'Totale attuale annuo',
    hmcAnnual: 'Totale HMC annuo',
    grossAnnual: 'Saving lordo annuo',
    netAnnual: 'Saving netto annuo',
    annualRoi: 'ROI annuo',
    payback: 'Payback',
    currentPerUser: 'Costo attuale per utente/anno',
    hmcPerUser: 'Costo HMC per utente/anno',
    deltaPerUser: 'Delta per utente/anno',
    months: 'mesi',
    na: 'n/d',
    netYears: 'Saving netto',
    roiYears: 'ROI',
    years: 'anni',
    tabs: ['Dashboard', 'Scenario', 'Assunzioni costi', 'Dettaglio calcoli'],
    thinClientCost: 'Costo 1 thin client (impostato a €0 con soluzione Scout eLux)',
    advancedParams: 'Parametri avanzati',
    showAdvanced: 'Mostra personalizzazione',
    hideAdvanced: 'Nascondi personalizzazione',
    assumptions: 'Legenda calcoli e assunzioni',
    printSummary: 'Stampa / Salva PDF',
  },
  en: {
    badge: 'Arrow | Citrix ROI Calculator',
    title: 'Citrix ROI Calculator for customer engagements',
    subtitle:
      'Professional tool to compare current costs, HMC scenario, savings, ROI, and payback with a clear and customer-ready view.',
    reset: 'Reset scenario',
    users: 'Users',
    remoteUsers: 'Remote users',
    hmcUserMonth: 'HMC per user/month',
    currentAnnual: 'Current annual total',
    hmcAnnual: 'HMC annual total',
    grossAnnual: 'Gross annual savings',
    netAnnual: 'Net annual savings',
    annualRoi: 'Annual ROI',
    payback: 'Payback',
    currentPerUser: 'Current cost per user/year',
    hmcPerUser: 'HMC cost per user/year',
    deltaPerUser: 'Delta per user/year',
    months: 'months',
    na: 'n/a',
    netYears: 'Net savings',
    roiYears: 'ROI',
    years: 'years',
    tabs: ['Dashboard', 'Scenario', 'Cost assumptions', 'Calculation details'],
    thinClientCost: 'Thin client unit cost (€0 when using Scout eLux)',
    advancedParams: 'Advanced parameters',
    showAdvanced: 'Show customization',
    hideAdvanced: 'Hide customization',
    assumptions: 'Calculation legend and assumptions',
    printSummary: 'Print / Save PDF',
  },
};

const APP_VERSION = '2026.04.02-r4';

const DEFAULTS = {
  profile: {
    customerType: 'Enterprise',
    currentModel: 'Mixed',
    market: 'Europa',
    currentHypervisorType: 'VMware',
    horizonYears: 3,
    hmcPricePerUserPerMonth: 25,
  },
  tech: {
    numberUsers: 1000,
    pctRemoteHybridUsers: 0.6,
    pctByodUsers: 0.2,
    numberPc: 900,
    numberThinClient: 100,
    avgPcAgeYears: 3,
    lifecyclePcTargetYears: 4,
    pctPcReplaceableWithThinClient: 0.35,
    numberHosts: 8,
    coresPerHost: 48,
    numberVpnAdcAppliances: 2,
    itDaysEndpointMgmt: 120,
    itDaysImageVdiMgmt: 90,
    itDaysSupport: 180,
    itDaysAccessMgmt: 50,
    itDaysSecurityOps: 60,
    usersAvd: 0,
    usersWindows365: 0,
  },
  cost: {
    costOnePc: 700,
    costOneThinClient: 0,
    costHypervisorPerCoreYear: 100,
    costVpnAdcAppliance: 5000,
    applianceMaintenanceAnnualPct: 0.2,
    costMfaUserMonth: 4,
    costZtnaUserMonth: 7,
    costEdrEndpointMonth: 5,
    costDevicePostureEndpointMonth: 2.5,
    costSocMsspAnnual: 20000,
    costRemediationPerEndpointYear: 40,
    costSysadminDay: 600,
    reductionEffortEndpointPct: 0.35,
    reductionEffortImagePct: 0.6,
    reductionEffortSupportPct: 0.35,
    reductionEffortAccessPct: 0.3,
    residualEdrRatioWithHmc: 0.65,
    residualDevicePostureRatioWithHmc: 0.3,
    residualSecurityServicesRatioWithHmc: 0.7,
    costAvdPerUserMonth: 18,
    costWindows365PerUserMonth: 31,
    premiumUpliftCitrixCloudAvoidedPct: 0.15,
  },
  residuals: {
    residualHardwareInfra: 0,
    residualServices: 0,
  },
};

function SectionCard({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}>
      <div className="border-b border-slate-100 px-6 py-5">
        <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>
      <div className="p-6">{children}</div>
    </div>
  );
}

function KpiCard({ iconName, title, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{title}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
          {hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}
        </div>
        <div className="rounded-2xl bg-slate-100 p-3">
          <SafeIcon name={iconName} className="h-5 w-5 text-slate-700" />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, type = 'number', step = '1', min = '0', suffix, prefix }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <div className="relative">
        {prefix ? (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span>
        ) : null}
        <input
          type={type}
          value={value}
          min={min}
          step={step}
          onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)}
          className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${
            prefix ? 'pl-8' : ''
          } ${suffix ? 'pr-10' : ''}`}
        />
        {suffix ? (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{suffix}</span>
        ) : null}
      </div>
    </label>
  );
}

function SelectField({ label, value, onChange, options }) {
  return (
    <label className="block space-y-2">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200"
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function RangeField({ label, value, onChange }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-700">{label}</span>
        <span className="text-sm text-slate-500">{pct(value)}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        step="1"
        value={Math.round(value * 100)}
        onChange={(e) => onChange(Number(e.target.value) / 100)}
        className="w-full"
      />
    </div>
  );
}

function Row({ label, value, strong = false }) {
  return (
    <div
      className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 ${
        strong ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
      }`}
    >
      <span className={`${strong ? 'text-white' : 'text-slate-600'}`}>{label}</span>
      <span className="font-semibold">{value}</span>
    </div>
  );
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [lang, setLang] = useState('it');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [showLegend, setShowLegend] = useState(false);
  const [state, setState] = useState(DEFAULTS);
  const copy = TEXT[lang] || TEXT.it;
  const t = (itText, enText) => (lang === 'en' ? enText : itText);

  const setProfile = (key, value) =>
    setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const setTech = (key, value) => setState((s) => ({ ...s, tech: { ...s.tech, [key]: value } }));
  const setCost = (key, value) => setState((s) => ({ ...s, cost: { ...s.cost, [key]: value } }));
  const setResidual = (key, value) =>
    setState((s) => ({ ...s, residuals: { ...s.residuals, [key]: value } }));
  const resetAll = () => setState(DEFAULTS);

  const model = useMemo(() => {
    const { profile, tech, cost, residuals } = state;

    const totalUsers = tech.numberUsers;
    const totalCores = tech.numberHosts * tech.coresPerHost;
    const secureRemoteUsers = Math.round(totalUsers * tech.pctRemoteHybridUsers);
    const endpointCount = tech.numberPc;

    const currentEndpoint =
      (tech.numberPc * cost.costOnePc) / Math.max(tech.lifecyclePcTargetYears, 1);
    const currentHypervisor = totalCores * cost.costHypervisorPerCoreYear;
    const currentAccess =
      tech.numberVpnAdcAppliances *
      cost.costVpnAdcAppliance *
      (1 + cost.applianceMaintenanceAnnualPct);
    const currentMfa = totalUsers * cost.costMfaUserMonth * 12;
    const currentZtna = secureRemoteUsers * cost.costZtnaUserMonth * 12;
    const currentEdr = endpointCount * cost.costEdrEndpointMonth * 12;
    const currentDevicePosture = endpointCount * cost.costDevicePostureEndpointMonth * 12;
    const currentSocMssp = cost.costSocMsspAnnual;
    const currentRemediation = endpointCount * cost.costRemediationPerEndpointYear;
    const currentOpsEndpoint = tech.itDaysEndpointMgmt * cost.costSysadminDay;
    const currentOpsImage = tech.itDaysImageVdiMgmt * cost.costSysadminDay;
    const currentOpsSupport = tech.itDaysSupport * cost.costSysadminDay;
    const currentOpsAccess = tech.itDaysAccessMgmt * cost.costSysadminDay;
    const currentOpsSecurity = tech.itDaysSecurityOps * cost.costSysadminDay;
    const currentAvd = tech.usersAvd * cost.costAvdPerUserMonth * 12;
    const currentWindows365 = tech.usersWindows365 * cost.costWindows365PerUserMonth * 12;

    const totalCurrent =
      currentEndpoint +
      currentHypervisor +
      currentAccess +
      currentMfa +
      currentZtna +
      currentEdr +
      currentDevicePosture +
      currentSocMssp +
      currentRemediation +
      currentOpsEndpoint +
      currentOpsImage +
      currentOpsSupport +
      currentOpsAccess +
      currentOpsSecurity;

    const hmcSubscription = totalUsers * profile.hmcPricePerUserPerMonth * 12;
    const residualEndpointCost =
      (tech.numberPc * tech.pctPcReplaceableWithThinClient * cost.costOneThinClient) / 5;
    const residualEdr = currentEdr * cost.residualEdrRatioWithHmc;
    const residualDevicePosture =
      currentDevicePosture * cost.residualDevicePostureRatioWithHmc;
    const residualSecurityServices =
      (currentSocMssp + currentRemediation + currentOpsSecurity) *
      cost.residualSecurityServicesRatioWithHmc;

    const totalHmc =
      hmcSubscription +
      residualEndpointCost +
      residualEdr +
      residualDevicePosture +
      residualSecurityServices +
      residuals.residualHardwareInfra +
      residuals.residualServices;

    const savings = {
      XenServer: currentHypervisor,
      'NetScaler / Access': currentAccess,
      'Adaptive Authentication': currentMfa,
      'Secure Private Access': currentZtna,
      'EDR scope reduction': currentEdr * (1 - cost.residualEdrRatioWithHmc),
      'Device posture / App protection':
        currentDevicePosture * (1 - cost.residualDevicePostureRatioWithHmc),
      'Security services simplification':
        (currentSocMssp + currentRemediation + currentOpsSecurity) *
        (1 - cost.residualSecurityServicesRatioWithHmc),
      'Endpoint management': currentOpsEndpoint * cost.reductionEffortEndpointPct,
      'Image / VDI management': currentOpsImage * cost.reductionEffortImagePct,
      'Support / troubleshooting': currentOpsSupport * cost.reductionEffortSupportPct,
      'Access management': currentOpsAccess * cost.reductionEffortAccessPct,
      'PC refresh avoidance': currentEndpoint * tech.pctPcReplaceableWithThinClient,
      'Cloud governance uplift':
        (currentAvd + currentWindows365) * cost.premiumUpliftCitrixCloudAvoidedPct,
    };

    const grossSavings = Object.values(savings).reduce((sum, v) => sum + v, 0);
    const netSavings = grossSavings - totalHmc;
    const roiAnnual = totalHmc > 0 ? netSavings / totalHmc : 0;
    const paybackMonths = netSavings > 0 ? (totalHmc / netSavings) * 12 : null;
    const horizonNetSaving = netSavings * profile.horizonYears;
    const horizonRoi =
      totalHmc > 0 ? horizonNetSaving / (totalHmc * profile.horizonYears) : 0;
    const currentCostPerUserYear = totalUsers > 0 ? totalCurrent / totalUsers : 0;
    const hmcCostPerUserYear = totalUsers > 0 ? totalHmc / totalUsers : 0;
    const deltaCostPerUserYear = currentCostPerUserYear - hmcCostPerUserYear;

    const featureRows = Object.entries(savings)
      .map(([name, value]) => ({ name, value }))
      .filter((x) => x.value > 0)
      .sort((a, b) => b.value - a.value);

    const byDomain = [
      { name: 'Infrastructure', value: savings.XenServer + savings['NetScaler / Access'] },
      {
        name: 'Security',
        value:
          savings['Adaptive Authentication'] +
          savings['Secure Private Access'] +
          savings['EDR scope reduction'] +
          savings['Device posture / App protection'] +
          savings['Security services simplification'],
      },
      {
        name: 'Operations',
        value:
          savings['Endpoint management'] +
          savings['Image / VDI management'] +
          savings['Support / troubleshooting'] +
          savings['Access management'],
      },
      { name: 'Endpoint', value: savings['PC refresh avoidance'] },
      { name: 'Cloud', value: savings['Cloud governance uplift'] },
    ].filter((x) => x.value > 0);

    const comparison = [
      { name: 'Current', value: totalCurrent },
      { name: 'HMC', value: totalHmc },
      { name: 'Gross Saving', value: grossSavings },
      { name: 'Net Saving', value: netSavings },
    ];

    return {
      totals: {
        totalUsers,
        totalCores,
        secureRemoteUsers,
        totalCurrent,
        totalHmc,
        grossSavings,
        netSavings,
        roiAnnual,
        paybackMonths,
        horizonNetSaving,
        horizonRoi,
        currentCostPerUserYear,
        hmcCostPerUserYear,
        deltaCostPerUserYear,
      },
      current: {
        currentEndpoint,
        currentHypervisor,
        currentAccess,
        currentMfa,
        currentZtna,
        currentEdr,
        currentDevicePosture,
        currentSocMssp,
        currentRemediation,
        currentOpsEndpoint,
        currentOpsImage,
        currentOpsSupport,
        currentOpsAccess,
        currentOpsSecurity,
      },
      hmc: {
        hmcSubscription,
        residualEndpointCost,
        residualEdr,
        residualDevicePosture,
        residualSecurityServices,
      },
      featureRows,
      byDomain,
      comparison,
    };
  }, [state]);

  const roiNarrative =
    model.totals.roiAnnual >= 0
      ? t(
          'Il ROI è positivo: il modello mostra saving netto annuo e costo per utente sotto controllo. Questo rende la proposta immediatamente sostenibile.',
          'ROI is positive: the model shows annual net savings and controlled per-user cost, making the proposal immediately sustainable.'
        )
      : t(
          'Il ROI è attualmente negativo, ma il costo per utente resta contenuto. Anche una singola funzionalità aggiuntiva a basso costo (security o operations) può ribaltare rapidamente la percezione del valore.',
          'ROI is currently negative, but per-user cost remains contained. Even one low-cost additional capability (security or operations) can quickly improve perceived value.'
        );

  const perUserDeltaTone =
    model.totals.deltaCostPerUserYear >= 0
      ? t('Riduzione costo per utente', 'Per-user cost reduction')
      : t('Incremento costo per utente', 'Per-user cost increase');

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl p-6 md:p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-8 py-8 text-white">
              <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
                <div className="max-w-4xl">
                  <div className="mb-4 flex items-start justify-end gap-4">
                    <div className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 p-1 text-xs font-medium">
                      <button
                        onClick={() => setLang('it')}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 ${lang === 'it' ? 'bg-white/20' : ''}`}
                      >
                        <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ee-1f1f9.svg" alt="Italian flag" className="h-3.5 w-3.5" />
                        IT
                      </button>
                      <button
                        onClick={() => setLang('en')}
                        className={`inline-flex items-center gap-1 rounded-xl px-2.5 py-1 ${lang === 'en' ? 'bg-white/20' : ''}`}
                      >
                        <img src="https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/svg/1f1ec-1f1e7.svg" alt="English flag" className="h-3.5 w-3.5" />
                        EN
                      </button>
                    </div>
                  </div>
                  <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-200">
                    Version {APP_VERSION}
                  </div>
                  <div className="mb-3 inline-flex rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium tracking-wide">
                    {copy.badge}
                  </div>
                  <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{copy.title}</h1>
                  <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">{copy.subtitle}</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  <button
                    onClick={() => window.print()}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    <SafeIcon name="Printer" className="h-4 w-4" />
                    {copy.printSummary}
                  </button>
                  <button
                    onClick={resetAll}
                    className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-white/20"
                  >
                    <SafeIcon name="RefreshCcw" className="h-4 w-4" />
                    {copy.reset}
                  </button>
                </div>
              </div>
            </div>
            <div className="grid gap-4 border-t border-slate-100 bg-slate-50 p-6 md:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{copy.users}</p>
                <p className="mt-1 text-2xl font-semibold">{model.totals.totalUsers}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{t('Core cluster', 'Cluster cores')}</p>
                <p className="mt-1 text-2xl font-semibold">{model.totals.totalCores}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{copy.remoteUsers}</p>
                <p className="mt-1 text-2xl font-semibold">{model.totals.secureRemoteUsers}</p>
              </div>
              <div className="rounded-2xl border border-slate-200 bg-white p-4">
                <p className="text-xs text-slate-500">{copy.hmcUserMonth}</p>
                <p className="mt-1 text-2xl font-semibold">
                  {eur(state.profile.hmcPricePerUserPerMonth, lang)}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            iconName="Calculator"
            title={copy.currentAnnual}
            value={eur(model.totals.totalCurrent, lang)}
            hint={t('Costo annuo stimato dello scenario attuale.', 'Estimated annual cost of the current scenario.')}
          />
          <KpiCard
            iconName="Shield"
            title={copy.hmcAnnual}
            value={eur(model.totals.totalHmc, lang)}
            hint={t('Subscription HMC più costi residui mantenuti.', 'HMC subscription plus retained residual costs.')}
          />
          <KpiCard
            iconName="TrendingUp"
            title={copy.grossAnnual}
            value={eur(model.totals.grossSavings, lang)}
            hint={t('Valore economico prima del costo HMC.', 'Economic value before HMC cost.')}
          />
          <KpiCard
            iconName="Clock3"
            title={copy.netAnnual}
            value={eur(model.totals.netSavings, lang)}
            hint={t('Saving lordo meno costo annuo HMC.', 'Gross savings minus annual HMC cost.')}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard
            iconName="TrendingUp"
            title={copy.annualRoi}
            value={pct(model.totals.roiAnnual, 1)}
            hint={t('Net saving / costo HMC.', 'Net savings / HMC cost.')}
          />
          <KpiCard
            iconName="Clock3"
            title={copy.payback}
            value={model.totals.paybackMonths ? `${model.totals.paybackMonths.toFixed(1)} ${copy.months}` : copy.na}
            hint={t('Tempo di recupero dell’investimento.', 'Investment payback period.')}
          />
          <KpiCard
            iconName="Users"
            title={`${copy.netYears} ${state.profile.horizonYears} ${copy.years}`}
            value={eur(model.totals.horizonNetSaving, lang)}
            hint={t('Valore cumulato sull’orizzonte selezionato.', 'Cumulative value over the selected horizon.')}
          />
          <KpiCard
            iconName="Server"
            title={`${copy.roiYears} ${state.profile.horizonYears} ${copy.years}`}
            value={pct(model.totals.horizonRoi, 1)}
            hint={t('ROI medio sull’orizzonte selezionato.', 'Average ROI over the selected horizon.')}
          />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <KpiCard
            iconName="Users"
            title={copy.currentPerUser}
            value={eur(model.totals.currentCostPerUserYear, lang)}
            hint={t('Totale current diviso utenti.', 'Current total divided by users.')}
          />
          <KpiCard
            iconName="Users"
            title={copy.hmcPerUser}
            value={eur(model.totals.hmcCostPerUserYear, lang)}
            hint={t('Totale HMC diviso utenti.', 'HMC total divided by users.')}
          />
          <KpiCard
            iconName="TrendingUp"
            title={copy.deltaPerUser}
            value={eur(model.totals.deltaCostPerUserYear, lang)}
            hint={perUserDeltaTone}
          />
        </div>

        <SectionCard
          className="mt-4"
          title={t('Messaggio economico sintetico', 'Executive economic message')}
          subtitle={t('Lettura consigliata di saving, ROI e costo per utente.', 'Recommended reading of savings, ROI, and per-user cost.')}
        >
          <p className="text-sm leading-7 text-slate-700">{roiNarrative}</p>
        </SectionCard>

        <div className="mt-8 print:hidden">
          <button
            onClick={() =>
              setShowAdvanced((v) => {
                if (v) {
                  setTab('dashboard');
                }
                return !v;
              })
            }
            className="inline-flex items-center gap-2 rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 shadow-sm hover:bg-slate-50"
          >
            <SafeIcon name="SlidersHorizontal" className="h-4 w-4" />
            {showAdvanced ? copy.hideAdvanced : copy.showAdvanced}
            {showAdvanced ? (
              <SafeIcon name="ChevronUp" className="h-4 w-4" />
            ) : (
              <SafeIcon name="ChevronDown" className="h-4 w-4" />
            )}
          </button>
        </div>

        {showAdvanced && (
          <div className="mt-4">
            <div className="flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
              {[
                ['dashboard', copy.tabs[0]],
                ['scenario', copy.tabs[1]],
                ['costs', copy.tabs[2]],
                ['details', copy.tabs[3]],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setTab(value)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${
                    tab === value ? 'bg-slate-900 text-white' : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'dashboard' && (
          <div className="mt-6 space-y-6">
            <div className="grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
              <SectionCard
                title={t('Confronto economico', 'Economic comparison')}
                subtitle={t('Vista sintetica di costo attuale, costo HMC e saving.', 'Summary view of current cost, HMC cost, and savings.')}
              >
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={model.comparison}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="name" tickLine={false} axisLine={false} />
                      <YAxis
                        tickFormatter={(v) => `€${Math.round(v / 1000)}k`}
                        tickLine={false}
                        axisLine={false}
                      />
                      <Tooltip formatter={(value) => eur(value, lang)} />
                      <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563eb" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </SectionCard>

              <SectionCard
                title={t('Breakdown saving per dominio', 'Savings breakdown by domain')}
                subtitle={t('Distribuzione del saving lordo annuo.', 'Distribution of gross annual savings.')}
              >
                <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
                  <div className="h-72">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={model.byDomain}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={55}
                          outerRadius={88}
                          paddingAngle={2}
                        >
                          {model.byDomain.map((item, index) => (
                            <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(value) => eur(value, lang)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-3">
                    {model.byDomain.map((item, index) => (
                      <div
                        key={item.name}
                        className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"
                      >
                        <div className="flex items-center gap-3">
                          <span
                            className="h-3 w-3 rounded-full"
                            style={{ backgroundColor: COLORS[index % COLORS.length] }}
                          />
                          <div>
                            <p className="font-medium text-slate-900">{item.name}</p>
                            <p className="text-xs text-slate-500">
                              {pct(item.value / Math.max(model.totals.grossSavings, 1), 1)} {t('del totale', 'of total')}
                            </p>
                          </div>
                        </div>
                        <span className="font-semibold">{eur(item.value, lang)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </SectionCard>
            </div>

            <SectionCard
              title={t('Leve di valore HMC', 'HMC value levers')}
              subtitle={t('Classifica dei principali driver economici inclusi nel modello ROI.', 'Ranking of the main economic drivers included in the ROI model.')}
            >
              <div className="h-[520px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={model.featureRows}
                    layout="vertical"
                    margin={{ top: 10, right: 20, bottom: 10, left: 40 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tickFormatter={(v) => `€${Math.round(v / 1000)}k`} />
                    <YAxis type="category" dataKey="name" width={190} tickLine={false} axisLine={false} />
                    <Tooltip formatter={(value) => eur(value, lang)} />
                    <Bar dataKey="value" fill="#0f172a" radius={[0, 10, 10, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </SectionCard>

          </div>
        )}

        {showAdvanced && tab === 'scenario' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <SectionCard
              title={t('Profilo scenario', 'Scenario profile')}
              subtitle={t('Parametri generali della simulazione.', 'General simulation parameters.')}
              className="xl:col-span-1"
            >
              <div className="space-y-5">
                <SelectField
                  label="Customer type"
                  value={state.profile.customerType}
                  onChange={(v) => setProfile('customerType', v)}
                  options={[
                    { value: 'SMB', label: 'SMB' },
                    { value: 'Enterprise', label: 'Enterprise' },
                    { value: 'Sanita-PA', label: t('Sanità / PA', 'Healthcare / Public Sector') },
                    { value: 'Finance', label: 'Finance' },
                    { value: 'Manufacturing', label: 'Manufacturing' },
                  ]}
                />
                <SelectField
                  label="Current model"
                  value={state.profile.currentModel}
                  onChange={(v) => setProfile('currentModel', v)}
                  options={[
                    { value: 'Traditional', label: 'Traditional' },
                    { value: 'VDI', label: 'VDI' },
                    { value: 'Cloud', label: 'Cloud' },
                    { value: 'Mixed', label: 'Mixed' },
                  ]}
                />
                <SelectField
                  label="Current hypervisor type"
                  value={state.profile.currentHypervisorType}
                  onChange={(v) => setProfile('currentHypervisorType', v)}
                  options={[
                    { value: 'VMware', label: 'VMware' },
                    { value: 'Nutanix', label: 'Nutanix' },
                    { value: 'Hyper-V', label: 'Hyper-V' },
                    { value: 'Proxmox', label: 'Proxmox' },
                    { value: 'Altro', label: 'Altro' },
                  ]}
                />
                <SelectField
                  label={t('Orizzonte temporale', 'Time horizon')}
                  value={String(state.profile.horizonYears)}
                  onChange={(v) => setProfile('horizonYears', Number(v))}
                  options={[
                    { value: '3', label: t('3 anni', '3 years') },
                    { value: '5', label: t('5 anni', '5 years') },
                  ]}
                />
                <Field
                  label="HMC price per user / month"
                  value={state.profile.hmcPricePerUserPerMonth}
                  onChange={(v) => setProfile('hmcPricePerUserPerMonth', v)}
                  prefix="€"
                />
              </div>
            </SectionCard>

            <SectionCard
              title={t('Input tecnici', 'Technical inputs')}
              subtitle={t('Variabili operative utilizzate nel modello.', 'Operational variables used in the model.')}
              className="xl:col-span-2"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label={t('Numero utenti', 'Number of users')}
                  value={state.tech.numberUsers}
                  onChange={(v) => setTech('numberUsers', v)}
                />
                <RangeField
                  label="% Remote / Hybrid users"
                  value={state.tech.pctRemoteHybridUsers}
                  onChange={(v) => setTech('pctRemoteHybridUsers', v)}
                />
                <RangeField
                  label="% BYOD users"
                  value={state.tech.pctByodUsers}
                  onChange={(v) => setTech('pctByodUsers', v)}
                />
                <Field label={t('Numero PC', 'Number of PCs')} value={state.tech.numberPc} onChange={(v) => setTech('numberPc', v)} />
                <Field
                  label={t('Numero thin client', 'Number of thin clients')}
                  value={state.tech.numberThinClient}
                  onChange={(v) => setTech('numberThinClient', v)}
                />
                <Field
                  label={t('Età media PC', 'Average PC age')}
                  value={state.tech.avgPcAgeYears}
                  onChange={(v) => setTech('avgPcAgeYears', v)}
                  suffix={t('anni', 'years')}
                />
                <Field
                  label="Lifecycle PC target"
                  value={state.tech.lifecyclePcTargetYears}
                  onChange={(v) => setTech('lifecyclePcTargetYears', v)}
                  suffix={t('anni', 'years')}
                />
                <RangeField
                  label={t('% PC sostituibili / estendibili', '% PCs replaceable / extendable')}
                  value={state.tech.pctPcReplaceableWithThinClient}
                  onChange={(v) => setTech('pctPcReplaceableWithThinClient', v)}
                />
                <Field
                  label={t('Numero appliance VPN / ADC', 'Number of VPN / ADC appliances')}
                  value={state.tech.numberVpnAdcAppliances}
                  onChange={(v) => setTech('numberVpnAdcAppliances', v)}
                />
                <Field
                  label={t('Numero host', 'Number of hosts')}
                  value={state.tech.numberHosts}
                  onChange={(v) => setTech('numberHosts', v)}
                />
                <Field
                  label={t('Core per host', 'Cores per host')}
                  value={state.tech.coresPerHost}
                  onChange={(v) => setTech('coresPerHost', v)}
                />
                <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-4">
                  <p className="text-xs uppercase tracking-wide text-slate-500">{t('Derivato', 'Derived')}</p>
                  <p className="mt-1 text-2xl font-semibold">{model.totals.totalCores}</p>
                  <p className="mt-2 text-sm text-slate-500">{t('Core complessivi del cluster corrente.', 'Total cores in the current cluster.')}</p>
                </div>
              </div>
            </SectionCard>

            <SectionCard
              title={t('Effort operativo annuo', 'Annual operational effort')}
              subtitle={t('Driver relativi all’efficienza IT.', 'Drivers related to IT efficiency.')}
              className="xl:col-span-2"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field
                  label={t('Giorni IT endpoint management', 'IT days for endpoint management')}
                  value={state.tech.itDaysEndpointMgmt}
                  onChange={(v) => setTech('itDaysEndpointMgmt', v)}
                />
                <Field
                  label={t('Giorni IT image / VDI management', 'IT days for image / VDI management')}
                  value={state.tech.itDaysImageVdiMgmt}
                  onChange={(v) => setTech('itDaysImageVdiMgmt', v)}
                />
                <Field
                  label={t('Giorni IT support', 'IT support days')}
                  value={state.tech.itDaysSupport}
                  onChange={(v) => setTech('itDaysSupport', v)}
                />
                <Field
                  label={t('Giorni IT access management', 'IT days for access management')}
                  value={state.tech.itDaysAccessMgmt}
                  onChange={(v) => setTech('itDaysAccessMgmt', v)}
                />
                <Field
                  label={t('Giorni IT security operations', 'IT days for security operations')}
                  value={state.tech.itDaysSecurityOps}
                  onChange={(v) => setTech('itDaysSecurityOps', v)}
                />
              </div>
            </SectionCard>

            <SectionCard
              title={t('Cloud benchmark opzionale', 'Optional cloud benchmark')}
              subtitle={t('Driver utile per confronti con AVD e Windows 365.', 'Useful driver for comparisons with AVD and Windows 365.')}
              className="xl:col-span-1"
            >
              <div className="space-y-5">
                <Field label={t('Utenti AVD', 'AVD users')} value={state.tech.usersAvd} onChange={(v) => setTech('usersAvd', v)} />
                <Field
                  label={t('Utenti Windows 365', 'Windows 365 users')}
                  value={state.tech.usersWindows365}
                  onChange={(v) => setTech('usersWindows365', v)}
                />
              </div>
            </SectionCard>
          </div>
        )}

        {showAdvanced && tab === 'costs' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <SectionCard
              title={t('Assunzioni economiche', 'Cost assumptions')}
              subtitle={t('Valori economici principali del modello.', 'Main economic values of the model.')}
              className="xl:col-span-2"
            >
              <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                <Field label={t('Costo 1 PC', 'Single PC cost')} value={state.cost.costOnePc} onChange={(v) => setCost('costOnePc', v)} prefix="€" />
                <Field
                  label={copy.thinClientCost}
                  value={state.cost.costOneThinClient}
                  onChange={(v) => setCost('costOneThinClient', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo hypervisor / core / anno', 'Hypervisor cost / core / year')}
                  value={state.cost.costHypervisorPerCoreYear}
                  onChange={(v) => setCost('costHypervisorPerCoreYear', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo appliance VPN / ADC', 'VPN / ADC appliance cost')}
                  value={state.cost.costVpnAdcAppliance}
                  onChange={(v) => setCost('costVpnAdcAppliance', v)}
                  prefix="€"
                />
                <RangeField
                  label={t('Manutenzione annuale appliance', 'Annual appliance maintenance')}
                  value={state.cost.applianceMaintenanceAnnualPct}
                  onChange={(v) => setCost('applianceMaintenanceAnnualPct', v)}
                />
                <Field
                  label={t('Costo MFA / utente / mese', 'MFA cost / user / month')}
                  value={state.cost.costMfaUserMonth}
                  onChange={(v) => setCost('costMfaUserMonth', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo ZTNA / utente / mese', 'ZTNA cost / user / month')}
                  value={state.cost.costZtnaUserMonth}
                  onChange={(v) => setCost('costZtnaUserMonth', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo EDR / endpoint / mese', 'EDR cost / endpoint / month')}
                  value={state.cost.costEdrEndpointMonth}
                  onChange={(v) => setCost('costEdrEndpointMonth', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo device posture / endpoint / mese', 'Device posture cost / endpoint / month')}
                  value={state.cost.costDevicePostureEndpointMonth}
                  onChange={(v) => setCost('costDevicePostureEndpointMonth', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo SOC / MSSP annuo', 'Annual SOC / MSSP cost')}
                  value={state.cost.costSocMsspAnnual}
                  onChange={(v) => setCost('costSocMsspAnnual', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo remediation / endpoint / anno', 'Remediation cost / endpoint / year')}
                  value={state.cost.costRemediationPerEndpointYear}
                  onChange={(v) => setCost('costRemediationPerEndpointYear', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo giornata sistemistica', 'System administration day cost')}
                  value={state.cost.costSysadminDay}
                  onChange={(v) => setCost('costSysadminDay', v)}
                  prefix="€"
                />
                <RangeField
                  label={t('Riduzione effort endpoint', 'Endpoint effort reduction')}
                  value={state.cost.reductionEffortEndpointPct}
                  onChange={(v) => setCost('reductionEffortEndpointPct', v)}
                />
                <RangeField
                  label={t('Riduzione effort image / VDI', 'Image / VDI effort reduction')}
                  value={state.cost.reductionEffortImagePct}
                  onChange={(v) => setCost('reductionEffortImagePct', v)}
                />
                <RangeField
                  label={t('Riduzione effort support', 'Support effort reduction')}
                  value={state.cost.reductionEffortSupportPct}
                  onChange={(v) => setCost('reductionEffortSupportPct', v)}
                />
                <RangeField
                  label={t('Riduzione effort access', 'Access effort reduction')}
                  value={state.cost.reductionEffortAccessPct}
                  onChange={(v) => setCost('reductionEffortAccessPct', v)}
                />
              </div>
            </SectionCard>

            <SectionCard
              title={t('Residui e benchmark', 'Residuals and benchmarks')}
              subtitle={t('Parametri che modulano saving e costi residui.', 'Parameters that modulate savings and residual costs.')}
              className="xl:col-span-1"
            >
              <div className="space-y-5">
                <RangeField
                  label="Residual EDR ratio with HMC"
                  value={state.cost.residualEdrRatioWithHmc}
                  onChange={(v) => setCost('residualEdrRatioWithHmc', v)}
                />
                <RangeField
                  label="Residual device posture ratio with HMC"
                  value={state.cost.residualDevicePostureRatioWithHmc}
                  onChange={(v) => setCost('residualDevicePostureRatioWithHmc', v)}
                />
                <RangeField
                  label="Residual security services ratio with HMC"
                  value={state.cost.residualSecurityServicesRatioWithHmc}
                  onChange={(v) => setCost('residualSecurityServicesRatioWithHmc', v)}
                />
                <Field
                  label={t('Costo AVD / utente / mese', 'AVD cost / user / month')}
                  value={state.cost.costAvdPerUserMonth}
                  onChange={(v) => setCost('costAvdPerUserMonth', v)}
                  prefix="€"
                />
                <Field
                  label={t('Costo Windows 365 / utente / mese', 'Windows 365 cost / user / month')}
                  value={state.cost.costWindows365PerUserMonth}
                  onChange={(v) => setCost('costWindows365PerUserMonth', v)}
                  prefix="€"
                />
                <RangeField
                  label={t('Premium uplift cloud evitato', 'Avoided cloud premium uplift')}
                  value={state.cost.premiumUpliftCitrixCloudAvoidedPct}
                  onChange={(v) => setCost('premiumUpliftCitrixCloudAvoidedPct', v)}
                />
                <Field
                  label="Residual hardware / infra"
                  value={state.residuals.residualHardwareInfra}
                  onChange={(v) => setResidual('residualHardwareInfra', v)}
                  prefix="€"
                />
                <Field
                  label="Residual services"
                  value={state.residuals.residualServices}
                  onChange={(v) => setResidual('residualServices', v)}
                  prefix="€"
                />
              </div>
            </SectionCard>
          </div>
        )}

        {showAdvanced && tab === 'details' && (
          <div className="mt-6 grid gap-6 xl:grid-cols-3">
            <SectionCard title={t('Current cost model', 'Current cost model')} subtitle={t('Dettaglio annuo dello scenario attuale.', 'Annual detail of the current scenario.')}>
              <div className="space-y-3 text-sm">
                <Row label="Endpoint" value={eur(model.current.currentEndpoint, lang)} />
                <Row label="Hypervisor" value={eur(model.current.currentHypervisor, lang)} />
                <Row label="Access" value={eur(model.current.currentAccess, lang)} />
                <Row label="Security - MFA" value={eur(model.current.currentMfa, lang)} />
                <Row label="Security - ZTNA" value={eur(model.current.currentZtna, lang)} />
                <Row label="Security - EDR/XDR" value={eur(model.current.currentEdr, lang)} />
                <Row label="Security - Device Posture" value={eur(model.current.currentDevicePosture, lang)} />
                <Row label="Security - SOC/MSSP" value={eur(model.current.currentSocMssp, lang)} />
                <Row label="Security - Remediation" value={eur(model.current.currentRemediation, lang)} />
                <Row label="Operations - Endpoint" value={eur(model.current.currentOpsEndpoint, lang)} />
                <Row label="Operations - Image/VDI" value={eur(model.current.currentOpsImage, lang)} />
                <Row label="Operations - Support" value={eur(model.current.currentOpsSupport, lang)} />
                <Row label="Operations - Access" value={eur(model.current.currentOpsAccess, lang)} />
                <Row label="Operations - Security Ops" value={eur(model.current.currentOpsSecurity, lang)} />
                <Row label={t('Totale current', 'Total current')} value={eur(model.totals.totalCurrent, lang)} strong />
              </div>
            </SectionCard>

            <SectionCard title={t('HMC cost model', 'HMC cost model')} subtitle={t('Dettaglio annuo dello scenario target HMC.', 'Annual detail of the HMC target scenario.')}>
              <div className="space-y-3 text-sm">
                <Row label="HMC Subscription" value={eur(model.hmc.hmcSubscription, lang)} />
                <Row label="Residual Endpoint Cost" value={eur(model.hmc.residualEndpointCost, lang)} />
                <Row label="Residual EDR/XDR" value={eur(model.hmc.residualEdr, lang)} />
                <Row label="Residual Device Posture" value={eur(model.hmc.residualDevicePosture, lang)} />
                <Row
                  label="Residual Security Services"
                  value={eur(model.hmc.residualSecurityServices, lang)}
                />
                <Row label="Residual Hardware / Infra" value={eur(state.residuals.residualHardwareInfra, lang)} />
                <Row label="Residual Services" value={eur(state.residuals.residualServices, lang)} />
                <Row label={t('Totale HMC', 'Total HMC')} value={eur(model.totals.totalHmc, lang)} strong />
              </div>
            </SectionCard>

            <SectionCard
              title={t('Saving breakdown', 'Savings breakdown')}
              subtitle={t('Le singole voci che compongono il saving lordo.', 'Individual items that compose gross savings.')}
            >
              <div className="space-y-3 text-sm">
                {model.featureRows.map((item) => (
                  <Row key={item.name} label={item.name} value={eur(item.value, lang)} />
                ))}
                <Row label={t('Saving lordo', 'Gross savings')} value={eur(model.totals.grossSavings, lang)} strong />
                <Row label="Net saving" value={eur(model.totals.netSavings, lang)} strong />
              </div>
            </SectionCard>
          </div>
        )}

      </div>
    </div>
  );
}
