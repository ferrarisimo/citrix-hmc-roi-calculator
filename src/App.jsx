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

const eur = (value, lang = 'it', digits = 0) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value, digits = 0) => `${(Number.isFinite(value) ? value : 0).toFixed(digits)}%`;

const COLORS = ['#2563eb', '#0f172a', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#dc2626'];
const DEFAULT_ICON_NAME = 'Calculator';

function SafeIcon({ name, fallback = DEFAULT_ICON_NAME, ...props }) {
  const PrimaryIcon = LucideIcons[name];
  const FallbackIcon = LucideIcons[fallback] || LucideIcons[DEFAULT_ICON_NAME];
  const IconToRender = typeof PrimaryIcon === 'function' ? PrimaryIcon : FallbackIcon;
  if (typeof IconToRender !== 'function') return null;
  return <IconToRender {...props} />;
}

const TEXT = {
  it: {
    badge: 'Arrow | Citrix ROI Calculator',
    title: 'Citrix HMC ROI Simulator / ROI Calculator',
    subtitle: 'Confronto trasparente tra TCO attuale e scenario HMC, con KPI, warning e dettagli calcolo pronti per cliente/partner.',
    customizationIntro: 'I valori della dashboard sono modificabili: apri la sezione scenario per personalizzare assunzioni, costi e formule.',
    editScenario: 'Modifica parametri scenario',
    hideScenario: 'Chiudi parametri scenario',
    reset: 'Reset scenario',
    users: 'Utenti',
    remoteUsers: 'Utenti remoti',
    hmcUserMonth: 'HMC €/utente/mese',
    tabs: ['Dashboard', 'Scenario', 'Assunzioni costi', 'Dettaglio calcoli'],
    currentAnnual: 'Current annual TCO',
    hmcAnnual: 'HMC annual TCO',
    annualDelta: 'Annual TCO delta',
    grossAvoided: 'Gross avoided cost',
    netAnnual: 'Net annual saving',
    annualRoi: 'ROI annuale',
    payback: 'Payback',
    notReached: 'Non raggiunto',
    notApplicable: 'Non applicabile',
    currentPerUser: 'Costo attuale per utente/anno',
    hmcPerUser: 'Costo HMC per utente/anno',
    deltaPerUser: 'Delta per utente/anno',
    assumptions: 'Nota modello',
    printSummary: 'Stampa / Salva PDF',
    years: 'anni',
  },
  en: {
    badge: 'Arrow | Citrix ROI Calculator',
    title: 'Citrix HMC ROI Simulator / ROI Calculator',
    subtitle: 'Transparent comparison between current TCO and HMC target with customer-ready KPIs, warnings, and calculation details.',
    customizationIntro: 'Dashboard values are editable: open scenario settings to customize assumptions, costs, and formulas.',
    editScenario: 'Edit scenario parameters',
    hideScenario: 'Hide scenario parameters',
    reset: 'Reset scenario',
    users: 'Users',
    remoteUsers: 'Remote users',
    hmcUserMonth: 'HMC €/user/month',
    tabs: ['Dashboard', 'Scenario', 'Cost assumptions', 'Calculation details'],
    currentAnnual: 'Current annual TCO',
    hmcAnnual: 'HMC annual TCO',
    annualDelta: 'Annual TCO delta',
    grossAvoided: 'Gross avoided cost',
    netAnnual: 'Net annual saving',
    annualRoi: 'Annual ROI',
    payback: 'Payback',
    notReached: 'Not reached',
    notApplicable: 'Not applicable',
    currentPerUser: 'Current cost per user/year',
    hmcPerUser: 'HMC cost per user/year',
    deltaPerUser: 'Delta per user/year',
    assumptions: 'Model note',
    printSummary: 'Print / Save PDF',
    years: 'years',
  },
};

const APP_VERSION = '2026.04.27-r5';

const DEFAULTS = {
  profile: {
    customerType: 'Enterprise',
    currentModel: 'Mixed',
    currentHypervisorType: 'VMware',
    horizonYears: 3,
    hmcPricePerUserPerMonth: 25,
    initialMigrationCost: 60000,
  },
  tech: {
    numberUsers: 1000,
    pctRemoteHybridUsers: 60,
    pctByodUsers: 20,
    numberPc: 900,
    numberThinClient: 100,
    avgPcAgeYears: 3,
    lifecyclePcTargetYears: 5,
    pctPcReplaceableWithThinClient: 35,
    numberHosts: 8,
    coresPerHost: 48,
    numberVpnAdcAppliances: 2,
    itDaysEndpointMgmt: 120,
    itDaysImageVdiMgmt: 90,
    itDaysSupport: 180,
    itDaysAccessMgmt: 50,
    itDaysSecurityOps: 60,
  },
  cost: {
    costOnePc: 700,
    costOneThinClient: 0,
    costHypervisorPerCoreYear: 100,
    costVpnAdcAppliance: 5000,
    applianceMaintenanceAnnualPct: 20,
    costMfaUserMonth: 4,
    costZtnaUserMonth: 7,
    costEdrEndpointMonth: 5,
    costDevicePostureEndpointMonth: 2.5,
    costSocMsspAnnual: 20000,
    costRemediationPerEndpointYear: 40,
    costSysadminDay: 600,
    reductionEffortEndpointPct: 35,
    reductionEffortImagePct: 60,
    reductionEffortSupportPct: 35,
    reductionEffortAccessPct: 30,
    residualEdrRatioWithHmc: 65,
    residualDevicePostureRatioWithHmc: 30,
    residualSecurityServicesRatioWithHmc: 70,
    costAvdPerUserMonth: 18,
    costWindows365PerUserMonth: 31,
    premiumUpliftCitrixCloudAvoidedPct: 15,
  },
  residuals: {
    residualHardwareInfra: 0,
    residualServices: 0,
  },
};

function SectionCard({ title, subtitle, children, className = '' }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}><div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-semibold text-slate-950">{title}</h3>{subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}</div><div className="p-6">{children}</div></div>;
}

function KpiCard({ iconName, title, value, hint }) {
  return <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm"><div className="flex items-start justify-between gap-4"><div><p className="text-sm text-slate-500">{title}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>{hint ? <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p> : null}</div><div className="rounded-2xl bg-slate-100 p-3"><SafeIcon name={iconName} className="h-5 w-5 text-slate-700" /></div></div></div>;
}

function Help({ text }) {
  return <span title={text} className="inline-flex cursor-help text-slate-400"><SafeIcon name="Info" className="h-4 w-4" /></span>;
}

function Field({ label, help, value, onChange, step = '1', min = '0', suffix, prefix }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">{label}{help ? <Help text={help} /> : null}</span>
      <div className="relative">
        {prefix ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span> : null}
        <input type="number" value={value} min={min} step={step} onChange={(e) => onChange(Number(e.target.value))} className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 outline-none transition focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-20' : ''}`} />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}

function RangeField({ label, help, value, onChange }) {
  return <div className="space-y-2"><div className="flex items-center justify-between gap-3"><span className="flex items-center gap-2 text-sm font-medium text-slate-700">{label}{help ? <Help text={help} /> : null}</span><span className="text-sm text-slate-500">{pct(value)}</span></div><input type="range" min="0" max="100" step="1" value={Math.round(value)} onChange={(e) => onChange(Number(e.target.value))} className="w-full" /></div>;
}

function Row({ label, formula, value }) {
  return <div className="rounded-2xl border border-slate-200 bg-white p-3"><div className="flex items-center justify-between gap-2"><span className="font-medium text-slate-800">{label}</span><span className="font-semibold">{value}</span></div>{formula ? <p className="mt-1 text-xs text-slate-500">{formula}</p> : null}</div>;
}

export default function App() {
  const [tab, setTab] = useState('dashboard');
  const [lang, setLang] = useState('it');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [state, setState] = useState(DEFAULTS);
  const copy = TEXT[lang] || TEXT.it;
  const t = (itText, enText) => (lang === 'en' ? enText : itText);

  const setProfile = (key, value) => setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const setTech = (key, value) => setState((s) => ({ ...s, tech: { ...s.tech, [key]: value } }));
  const setCost = (key, value) => setState((s) => ({ ...s, cost: { ...s.cost, [key]: value } }));
  const setResidual = (key, value) => setState((s) => ({ ...s, residuals: { ...s.residuals, [key]: value } }));

  const model = useMemo(() => {
    const { profile, tech, cost, residuals } = state;
    const users = Math.max(tech.numberUsers, 0);
    const remoteUsers = users * (tech.pctRemoteHybridUsers / 100);
    const cores = Math.max(tech.numberHosts, 0) * Math.max(tech.coresPerHost, 0);
    const replacementRatio = tech.pctPcReplaceableWithThinClient / 100;
    const replaceablePc = Math.max(0, tech.numberPc * replacementRatio);
    const remainingPc = Math.max(0, tech.numberPc - replaceablePc);

    const currentEndpoint = (tech.numberPc * cost.costOnePc) / Math.max(tech.avgPcAgeYears, 1);
    const currentHypervisor = cores * cost.costHypervisorPerCoreYear;
    const currentAccess = tech.numberVpnAdcAppliances * cost.costVpnAdcAppliance * (1 + cost.applianceMaintenanceAnnualPct / 100);
    const currentMfa = users * cost.costMfaUserMonth * 12;
    const currentZtna = remoteUsers * cost.costZtnaUserMonth * 12;
    const currentEdr = tech.numberPc * cost.costEdrEndpointMonth * 12;
    const currentDevicePosture = tech.numberPc * cost.costDevicePostureEndpointMonth * 12;
    const currentSecurityServices = cost.costSocMsspAnnual + tech.numberPc * cost.costRemediationPerEndpointYear + tech.itDaysSecurityOps * cost.costSysadminDay;
    const currentOps = (tech.itDaysEndpointMgmt + tech.itDaysImageVdiMgmt + tech.itDaysSupport + tech.itDaysAccessMgmt) * cost.costSysadminDay;

    const currentAnnualCost = currentEndpoint + currentHypervisor + currentAccess + currentMfa + currentZtna + currentEdr + currentDevicePosture + currentSecurityServices + currentOps;

    const hmcSubscription = users * profile.hmcPricePerUserPerMonth * 12;
    const hmcEndpointResidual = (remainingPc * cost.costOnePc) / Math.max(tech.lifecyclePcTargetYears, 1) + (replaceablePc * cost.costOneThinClient) / 5;
    const hmcEdrResidual = currentEdr * (cost.residualEdrRatioWithHmc / 100);
    const hmcPostureResidual = currentDevicePosture * (cost.residualDevicePostureRatioWithHmc / 100);
    const hmcSecurityServicesResidual = currentSecurityServices * (cost.residualSecurityServicesRatioWithHmc / 100);
    const hmcOpsResidual =
      tech.itDaysEndpointMgmt * (1 - cost.reductionEffortEndpointPct / 100) * cost.costSysadminDay +
      tech.itDaysImageVdiMgmt * (1 - cost.reductionEffortImagePct / 100) * cost.costSysadminDay +
      tech.itDaysSupport * (1 - cost.reductionEffortSupportPct / 100) * cost.costSysadminDay +
      tech.itDaysAccessMgmt * (1 - cost.reductionEffortAccessPct / 100) * cost.costSysadminDay;

    const hmcAnnualCost = hmcSubscription + hmcEndpointResidual + hmcEdrResidual + hmcPostureResidual + hmcSecurityServicesResidual + hmcOpsResidual + residuals.residualHardwareInfra + residuals.residualServices;

    const annualTcoDelta = currentAnnualCost - hmcAnnualCost;
    const grossAvoidedCost = currentAnnualCost - (hmcAnnualCost - hmcSubscription);
    const netAnnualSaving = annualTcoDelta;
    const roiAnnual = hmcAnnualCost > 0 ? annualTcoDelta / hmcAnnualCost : null;

    const paybackYears = profile.initialMigrationCost > 0 && annualTcoDelta > 0 ? profile.initialMigrationCost / annualTcoDelta : null;
    const paybackLabel = profile.initialMigrationCost <= 0 ? 'not_applicable' : annualTcoDelta <= 0 ? 'not_reached' : 'ok';

    const horizonYears = profile.horizonYears;
    const horizonDelta = annualTcoDelta * horizonYears - profile.initialMigrationCost;

    const domainDelta = [
      { name: 'Endpoint', value: currentEndpoint - hmcEndpointResidual },
      { name: 'Hypervisor', value: currentHypervisor },
      { name: 'Access / NetScaler', value: currentAccess },
      { name: 'Security', value: currentMfa + currentZtna + currentEdr + currentDevicePosture + currentSecurityServices - (hmcEdrResidual + hmcPostureResidual + hmcSecurityServicesResidual) },
      { name: 'Operations', value: currentOps - hmcOpsResidual },
    ].filter((x) => x.value > 0);

    const warnings = [];
    if (tech.numberUsers <= 0) warnings.push(t('Numero utenti deve essere > 0.', 'Number of users must be > 0.'));
    if (tech.numberPc > tech.numberUsers * 1.4) warnings.push(t('Numero PC molto alto rispetto agli utenti (warning non bloccante).', 'PC count is very high vs users (non-blocking warning).'));
    if (tech.pctByodUsers + tech.pctPcReplaceableWithThinClient > 130) warnings.push(t('BYOD + PC sostituibili può essere incoerente: verifica lo scenario endpoint.', 'BYOD + replaceable PCs may be inconsistent: review endpoint scenario.'));
    if (profile.hmcPricePerUserPerMonth === 0) warnings.push(t('Prezzo HMC a 0: ROI e payback potrebbero risultare distorti.', 'HMC price at 0: ROI and payback may be distorted.'));
    if (annualTcoDelta < 0) warnings.push(t('ROI negativo: il costo HMC supera i saving stimati.', 'Negative ROI: HMC cost exceeds estimated savings.'));

    const comparison = [
      { name: 'Current Annual TCO', value: currentAnnualCost },
      { name: 'HMC Annual TCO', value: hmcAnnualCost },
      { name: 'Annual TCO Delta', value: annualTcoDelta },
    ];

    return {
      users,
      remoteUsers,
      cores,
      currentAnnualCost,
      hmcAnnualCost,
      grossAvoidedCost,
      netAnnualSaving,
      annualTcoDelta,
      roiAnnual,
      paybackYears,
      paybackLabel,
      horizonDelta,
      warnings,
      comparison,
      domainDelta,
      details: { currentEndpoint, hmcEndpointResidual, currentHypervisor, currentAccess, hmcSubscription, hmcEdrResidual, hmcPostureResidual, hmcSecurityServicesResidual, hmcOpsResidual },
    };
  }, [state, lang]);

  const narrative = useMemo(() => {
    if (model.annualTcoDelta > 0) {
      return t(
        `Il modello mostra un ritorno economico positivo. Le principali aree di saving sono ${model.domainDelta.slice(0, 3).map((d) => d.name).join(', ')}. ${model.paybackLabel === 'ok' ? `Payback stimato: ${model.paybackYears.toFixed(2)} anni.` : 'Payback non applicabile senza investimento iniziale separato.'}`,
        `The model shows a positive economic return. Main saving areas are ${model.domainDelta.slice(0, 3).map((d) => d.name).join(', ')}. ${model.paybackLabel === 'ok' ? `Estimated payback: ${model.paybackYears.toFixed(2)} years.` : 'Payback is not applicable without a separate initial investment.'}`
      );
    }
    return t('ROI negativo: il costo HMC supera i saving stimati. Verifica in particolare costo HMC, numero utenti, ciclo di refresh PC, effort IT e costi security/access/hypervisor.', 'Negative ROI: HMC cost is higher than estimated savings. Review HMC price, user count, PC refresh lifecycle, IT effort, and security/access/hypervisor costs.');
  }, [model, lang]);

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-8 text-white">
              <div className="mb-4 flex justify-end gap-2">
                <button onClick={() => setLang('it')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'it' ? 'bg-white/20' : ''}`}>IT</button>
                <button onClick={() => setLang('en')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'en' ? 'bg-white/20' : ''}`}>EN</button>
              </div>
              <p className="mb-2 text-xs">Version {APP_VERSION}</p>
              <p className="mb-2 text-xs">{copy.badge}</p>
              <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200 md:text-base">{copy.subtitle}</p>
              <p className="mt-3 max-w-3xl rounded-xl border border-white/20 bg-white/10 p-3 text-sm">{copy.customizationIntro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => setShowAdvanced((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white shadow hover:bg-blue-400"><SafeIcon name="SlidersHorizontal" className="h-4 w-4" />{showAdvanced ? copy.hideScenario : copy.editScenario}</button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm"><SafeIcon name="Printer" className="h-4 w-4" />{copy.printSummary}</button>
                <button onClick={() => setState(DEFAULTS)} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm"><SafeIcon name="RefreshCcw" className="h-4 w-4" />{copy.reset}</button>
              </div>
            </div>
          </div>
        </motion.div>

        {showAdvanced && <div className="mb-4 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">{[['dashboard', copy.tabs[0]], ['scenario', copy.tabs[1]], ['costs', copy.tabs[2]], ['details', copy.tabs[3]]].map(([value, label]) => <button key={value} onClick={() => setTab(value)} className={`rounded-2xl px-4 py-2.5 text-sm font-medium transition ${tab === value ? 'bg-slate-900 text-white ring-2 ring-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}>{label}</button>)}</div>}

        {model.warnings.length > 0 && <SectionCard className="mb-4" title={t('Warning scenario', 'Scenario warnings')} subtitle={t('Incoerenze non bloccanti rilevate dal validatore frontend.', 'Non-blocking inconsistencies detected by frontend validation.')}>{model.warnings.map((w) => <p key={w} className="mb-1 text-sm text-amber-700">• {w}</p>)}</SectionCard>}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard iconName="Calculator" title={copy.currentAnnual} value={eur(model.currentAnnualCost, lang)} hint={t('Costo annuo scenario attuale.', 'Current annual scenario cost.')} />
          <KpiCard iconName="Shield" title={copy.hmcAnnual} value={eur(model.hmcAnnualCost, lang)} hint={t('Costo annuo target HMC.', 'HMC target annual cost.')} />
          <KpiCard iconName="TrendingUp" title={copy.annualDelta} value={eur(model.annualTcoDelta, lang)} hint={t('Current annual cost - HMC annual cost.', 'Current annual cost - HMC annual cost.')} />
          <KpiCard iconName="Landmark" title={copy.grossAvoided} value={eur(model.grossAvoidedCost, lang)} hint={t('Costi evitati lordi prima della subscription HMC.', 'Gross avoided costs before HMC subscription.')} />
          <KpiCard iconName="Clock3" title={copy.netAnnual} value={eur(model.netAnnualSaving, lang)} hint={t('Saving netto annuale da delta TCO.', 'Annual net saving from TCO delta.')} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <KpiCard iconName="Percent" title={copy.annualRoi} value={model.roiAnnual === null ? '—' : pct(model.roiAnnual * 100, 1)} hint={t('ROI = Annual TCO Delta / HMC annual TCO.', 'ROI = Annual TCO Delta / HMC annual TCO.')} />
          <KpiCard iconName="Timer" title={copy.payback} value={model.paybackLabel === 'ok' ? `${model.paybackYears.toFixed(2)} ${copy.years}` : model.paybackLabel === 'not_reached' ? copy.notReached : copy.notApplicable} hint={t('Payback = costo iniziale migrazione / annual TCO delta.', 'Payback = initial migration cost / annual TCO delta.')} />
          <KpiCard iconName="Users" title={copy.currentPerUser} value={eur(model.users > 0 ? model.currentAnnualCost / model.users : 0, lang)} hint={t('Current annual TCO / utenti.', 'Current annual TCO / users.')} />
          <KpiCard iconName="Users" title={copy.hmcPerUser} value={eur(model.users > 0 ? model.hmcAnnualCost / model.users : 0, lang)} hint={t('HMC annual TCO / utenti.', 'HMC annual TCO / users.')} />
          <KpiCard iconName="Users" title={copy.deltaPerUser} value={eur(model.users > 0 ? model.annualTcoDelta / model.users : 0, lang)} hint={t('Delta annuale per utente.', 'Annual delta per user.')} />
        </div>

        <SectionCard className="mt-4" title={t('Messaggio economico sintetico', 'Executive economic message')} subtitle={t('Messaggio dinamico basato su ROI, saving e payback.', 'Dynamic message based on ROI, savings, and payback.')}> <p className="text-sm leading-7 text-slate-700">{narrative}</p><p className="mt-2 text-xs text-slate-500">{t('Se Annual TCO Delta ≤ 0 il payback è mostrato come “Non raggiunto”.', 'If Annual TCO Delta ≤ 0 payback is shown as “Not reached”.')}</p></SectionCard>

        {tab === 'dashboard' && <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]"><SectionCard title={t('Confronto TCO', 'TCO comparison')} subtitle={t('Current annual TCO vs HMC annual TCO e relativo delta.', 'Current annual TCO vs HMC annual TCO and delta.')}><div className="h-80"><ResponsiveContainer width="100%" height="100%"><BarChart data={model.comparison}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="name" tickLine={false} axisLine={false} /><YAxis tickFormatter={(v) => `€${Math.round(v / 1000)}k`} tickLine={false} axisLine={false} /><Tooltip formatter={(value) => eur(value, lang)} /><Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#2563eb" /></BarChart></ResponsiveContainer></div></SectionCard><SectionCard title={t('Breakdown delta economico', 'Economic delta breakdown')} subtitle={t('Voci che contribuiscono al delta (senza doppio conteggio).', 'Areas contributing to delta (without double counting).')}><div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]"><div className="h-72"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={model.domainDelta} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2}>{model.domainDelta.map((item, index) => <Cell key={item.name} fill={COLORS[index % COLORS.length]} />)}</Pie><Tooltip formatter={(value) => eur(value, lang)} /></PieChart></ResponsiveContainer></div><div className="space-y-3">{model.domainDelta.map((item, index) => <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3"><div className="flex items-center gap-3"><span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} /><p className="font-medium text-slate-900">{item.name}</p></div><span className="font-semibold">{eur(item.value, lang)}</span></div>)}</div></div></SectionCard></div>}

        {showAdvanced && tab === 'scenario' && <div className="mt-6 grid gap-6 xl:grid-cols-2"><SectionCard title={t('Scenario', 'Scenario')} subtitle={t('Input operativi con unità e help contestuale.', 'Operational inputs with units and contextual help.')}><div className="grid gap-5 md:grid-cols-2"><Field label={t('Numero utenti', 'Number of users')} help={t('Numero utenti gestiti dal perimetro. Impatta subscription e costi security. È una stima di volume.', 'Users in scope. Impacts subscription and security costs. This is a volume estimate.')} value={state.tech.numberUsers} onChange={(v) => setTech('numberUsers', v)} suffix={t('utenti', 'users')} /><RangeField label="% Remote / Hybrid users" help={t('Percentuale utenti in lavoro remoto/ibrido. Influenza accesso sicuro e ZTNA. È una stima.', 'Share of remote/hybrid users. Influences secure access and ZTNA. It is an estimate.')} value={state.tech.pctRemoteHybridUsers} onChange={(v) => setTech('pctRemoteHybridUsers', v)} /><RangeField label="% BYOD users" help={t('Percentuale utenti con device personale. Influenza coerenza scenario endpoint/security. È una stima.', 'Share of users with personal devices. Influences endpoint/security coherence. It is an estimate.')} value={state.tech.pctByodUsers} onChange={(v) => setTech('pctByodUsers', v)} /><Field label={t('Numero PC', 'Number of PCs')} help={t('Endpoint corporate attuali. Impatta TCO endpoint, EDR e posture. È un volume.', 'Current corporate endpoints. Impacts endpoint TCO, EDR and posture. It is a volume input.')} value={state.tech.numberPc} onChange={(v) => setTech('numberPc', v)} suffix="PC" /><Field label={t('Numero thin client', 'Number of thin clients')} help={t('Thin client presenti o target. Influenza costo residuo endpoint HMC. È un volume.', 'Existing/target thin clients. Impacts HMC endpoint residual cost. It is a volume input.')} value={state.tech.numberThinClient} onChange={(v) => setTech('numberThinClient', v)} suffix={t('unità', 'units')} /><Field label={t('Età media PC', 'Average PC age')} help={t('Proxy lifecycle corrente usato per annualizzare costo PC attuale. È una stima tecnica.', 'Current lifecycle proxy used to annualize current PC cost. It is a technical estimate.')} value={state.tech.avgPcAgeYears} onChange={(v) => setTech('avgPcAgeYears', v)} suffix={t('anni', 'years')} /><Field label="Lifecycle PC target" help={t('Lifecycle target post-HMC per i PC mantenuti. Riduce o aumenta costo residuale endpoint. È una stima.', 'Target lifecycle post-HMC for retained PCs. Reduces or increases endpoint residual cost. It is an estimate.')} value={state.tech.lifecyclePcTargetYears} onChange={(v) => setTech('lifecyclePcTargetYears', v)} suffix={t('anni', 'years')} /><RangeField label={t('% PC sostituibili / estendibili', '% PCs replaceable / extendable')} help={t('Quota PC spostabile su thin client/estensione lifecycle. Influenza delta endpoint. È una stima.', 'Share of PCs moveable to thin-client/lifecycle extension. Impacts endpoint delta. It is an estimate.')} value={state.tech.pctPcReplaceableWithThinClient} onChange={(v) => setTech('pctPcReplaceableWithThinClient', v)} /><Field label={t('Numero appliance VPN / ADC', 'Number of VPN / ADC appliances')} help={t('Appliance di accesso legacy nello scenario corrente. Influenza costi access. È un costo diretto.', 'Legacy access appliances in current scenario. Influences access costs. It is a direct cost.')} value={state.tech.numberVpnAdcAppliances} onChange={(v) => setTech('numberVpnAdcAppliances', v)} suffix={t('appliance', 'appliances')} /><Field label="HMC price per user / month" help={t('Canone HMC unitario. Driver principale del costo target HMC. Costo diretto.', 'Unit HMC subscription fee. Main driver of HMC target cost. Direct cost.')} value={state.profile.hmcPricePerUserPerMonth} onChange={(v) => setProfile('hmcPricePerUserPerMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" /><Field label={t('Initial migration / project cost', 'Initial migration / project cost')} help={t('Assessment, migrazione, setup, training e servizi professionali una tantum. Influenza payback.', 'One-time assessment, migration, setup, training and professional services. Influences payback.')} value={state.profile.initialMigrationCost} onChange={(v) => setProfile('initialMigrationCost', v)} prefix="€" suffix={t('una tantum', 'one-time')} /><Field label={t('Orizzonte analisi', 'Analysis horizon')} value={state.profile.horizonYears} onChange={(v) => setProfile('horizonYears', v)} suffix={t('anni', 'years')} /></div></SectionCard></div>}

        {showAdvanced && tab === 'costs' && <div className="mt-6 grid gap-6 xl:grid-cols-2"><SectionCard title={t('Assunzioni costo e residui', 'Cost and residual assumptions')}><div className="grid gap-5 md:grid-cols-2"><Field label={t('Costo MFA / utente / mese', 'MFA cost / user / month')} help={t('Costo security diretto ricorrente nello scenario attuale.', 'Direct recurring security cost in current scenario.')} value={state.cost.costMfaUserMonth} onChange={(v) => setCost('costMfaUserMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" /><Field label={t('Costo ZTNA / utente / mese', 'ZTNA cost / user / month')} value={state.cost.costZtnaUserMonth} onChange={(v) => setCost('costZtnaUserMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" /><Field label={t('Costo EDR / endpoint / mese', 'EDR cost / endpoint / month')} value={state.cost.costEdrEndpointMonth} onChange={(v) => setCost('costEdrEndpointMonth', v)} prefix="€" step="0.1" suffix="/endpoint/mese" /><Field label={t('Costo device posture / endpoint / mese', 'Device posture / endpoint / month')} value={state.cost.costDevicePostureEndpointMonth} onChange={(v) => setCost('costDevicePostureEndpointMonth', v)} prefix="€" step="0.1" suffix="/endpoint/mese" /><Field label={t('Costo AVD / utente / mese', 'AVD cost / user / month')} value={state.cost.costAvdPerUserMonth} onChange={(v) => setCost('costAvdPerUserMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" /><Field label={t('Costo Windows 365 / utente / mese', 'Windows 365 cost / user / month')} value={state.cost.costWindows365PerUserMonth} onChange={(v) => setCost('costWindows365PerUserMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" /><RangeField label={t('Riduzione effort endpoint', 'Endpoint effort reduction')} help={t('Riduzione giorni/anno su endpoint management; influenza costo operations residuo.', 'Reduction in days/year on endpoint management; impacts residual operations cost.')} value={state.cost.reductionEffortEndpointPct} onChange={(v) => setCost('reductionEffortEndpointPct', v)} /><RangeField label={t('Riduzione effort image / VDI', 'Image / VDI effort reduction')} value={state.cost.reductionEffortImagePct} onChange={(v) => setCost('reductionEffortImagePct', v)} /><RangeField label={t('Riduzione effort support', 'Support effort reduction')} value={state.cost.reductionEffortSupportPct} onChange={(v) => setCost('reductionEffortSupportPct', v)} /><RangeField label={t('Riduzione effort access', 'Access effort reduction')} value={state.cost.reductionEffortAccessPct} onChange={(v) => setCost('reductionEffortAccessPct', v)} /><RangeField label="Residual EDR ratio with HMC" help={t('Quota costo EDR che resta con HMC. Valore più alto = saving minore.', 'Share of EDR cost that remains with HMC. Higher means lower savings.')} value={state.cost.residualEdrRatioWithHmc} onChange={(v) => setCost('residualEdrRatioWithHmc', v)} /><RangeField label="Residual device posture ratio with HMC" value={state.cost.residualDevicePostureRatioWithHmc} onChange={(v) => setCost('residualDevicePostureRatioWithHmc', v)} /><RangeField label="Residual security services ratio with HMC" value={state.cost.residualSecurityServicesRatioWithHmc} onChange={(v) => setCost('residualSecurityServicesRatioWithHmc', v)} /><Field label="Residual hardware / infra" value={state.residuals.residualHardwareInfra} onChange={(v) => setResidual('residualHardwareInfra', v)} prefix="€" suffix="/anno" /><Field label="Residual services" value={state.residuals.residualServices} onChange={(v) => setResidual('residualServices', v)} prefix="€" suffix="/anno" /></div></SectionCard></div>}

        {showAdvanced && tab === 'details' && <div className="mt-6 grid gap-6 xl:grid-cols-2"><SectionCard title={t('Dettaglio calcoli (trasparenza modello)', 'Calculation details (model transparency)')} subtitle={t('Formule leggibili per current cost, HMC cost e delta TCO.', 'Readable formulas for current cost, HMC cost and TCO delta.')}><div className="space-y-3 text-sm"><Row label="Endpoint current annual cost" formula="numero PC × costo PC / lifecycle corrente" value={eur(model.details.currentEndpoint, lang)} /><Row label="Endpoint HMC residual cost" formula="PC residui × costo PC / lifecycle target + PC sostituiti × costo thin client / 5" value={eur(model.details.hmcEndpointResidual, lang)} /><Row label="Endpoint saving" formula="Endpoint current annual cost - Endpoint HMC residual cost" value={eur(model.details.currentEndpoint - model.details.hmcEndpointResidual, lang)} /><Row label="Current annual TCO" formula="Somma costi annui scenario attuale" value={eur(model.currentAnnualCost, lang)} /><Row label="HMC annual TCO" formula="Subscription HMC + costi residui endpoint/security/operations + residual hardware/services" value={eur(model.hmcAnnualCost, lang)} /><Row label="Annual TCO Delta" formula="Current Annual TCO - HMC Annual TCO" value={eur(model.annualTcoDelta, lang)} /><Row label="ROI" formula="Annual TCO Delta / HMC Annual TCO" value={model.roiAnnual === null ? '—' : pct(model.roiAnnual * 100, 1)} /><Row label="Payback" formula="Initial migration cost / Annual TCO Delta (se delta > 0)" value={model.paybackLabel === 'ok' ? `${model.paybackYears.toFixed(2)} ${copy.years}` : model.paybackLabel === 'not_reached' ? copy.notReached : copy.notApplicable} /></div></SectionCard>
          <SectionCard title={t('Assunzioni modello pluriennale', 'Multi-year model assumptions')} subtitle={t('Stima lineare con separazione costo iniziale una tantum.', 'Linear estimate with one-time initial cost separated.')}> <div className="space-y-3 text-sm"><p>{t('Il modello pluriennale usa costi/saving ricorrenti costanti per anno e applica il costo iniziale al Year 0.', 'The multi-year model uses constant recurring yearly costs/savings and applies initial cost at Year 0.')}</p><Row label={t('Delta TCO orizzonte selezionato', 'Selected horizon TCO delta')} formula={`${state.profile.horizonYears} × annual TCO delta - initial migration cost`} value={eur(model.horizonDelta, lang)} /></div></SectionCard></div>}

        <SectionCard className="mt-6" title={copy.assumptions} subtitle={t('Nota metodologica per stampa/PDF.', 'Methodological note for print/PDF.')}> <p className="text-xs text-slate-500">{t('Il modello evita doppio conteggio: “PC refresh avoidance” è inglobato nel delta endpoint (current endpoint cost - endpoint residual cost HMC).', 'The model avoids double counting: “PC refresh avoidance” is embedded in endpoint delta (current endpoint cost - HMC endpoint residual cost).')}</p></SectionCard>
      </div>
    </div>
  );
}
