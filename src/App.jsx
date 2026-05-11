import React, { useMemo, useState } from 'react';
import { motion } from 'framer-motion';
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

const TEXT = {
  it: {
    title: 'Citrix HMC ROI Simulator / ROI Calculator',
    subtitle:
      'Confronto trasparente tra TCO attuale e scenario HMC, con KPI, warning e dettaglio calcoli per discussione aperta e validazione delle assunzioni.',
    customizationIntro:
      'I valori della dashboard sono modificabili: usa il pulsante qui sotto per accedere solo alle aree di personalizzazione dati (Scenario e Assunzioni costi).',
    editScenario: 'Modifica parametri scenario',
    hideScenario: 'Chiudi parametri scenario',
    tabs: ['Parametri', 'Assunzioni costi'],
    reset: 'Reset scenario',
    print: 'Stampa / Salva PDF',
    currentAnnual: 'TCO attuale progetto',
    hmcAnnual: 'TCO HMC progetto',
    annualDelta: 'Delta TCO progetto',
    grossAvoided: 'Gross avoided cost',
    netAnnual: 'Risparmio netto progetto',
    annualRoi: 'ROI progetto',
    asIsPerUserYear: 'As-Is €/utente/anno',
    hmcPerUserYear: 'HMC €/utente/anno',
    deltaPerUserYear: 'Delta €/utente/anno',
    years: 'anni',
    disclaimerButton: 'Mostra disclaimer metodologico',
    disclaimerTitle: 'Disclaimer metodologico',
    disclaimerBody:
      'Questo esercizio ha finalità dimostrative. Tutti i dati e le assunzioni sono modificabili in base alla situazione reale del cliente. Il calcolatore fornisce una simulazione semplificata, paragonabile a un foglio di calcolo evoluto: non rappresenta un impegno commerciale, legale o finanziario. Ideatore: Simone Ferrari, progetto personale di vibe coding con AI.',
  },
  en: {
    title: 'Citrix HMC ROI Simulator / ROI Calculator',
    subtitle:
      'Transparent comparison between current TCO and HMC scenario with KPI, warnings, and calculation details for open discussion and assumption validation.',
    customizationIntro:
      'Dashboard values are editable: use the button below to open data customization only (Scenario and Cost assumptions).',
    editScenario: 'Edit scenario parameters',
    hideScenario: 'Hide scenario parameters',
    tabs: ['Parameters', 'Cost assumptions'],
    reset: 'Reset scenario',
    print: 'Print / Save PDF',
    currentAnnual: 'Current project TCO',
    hmcAnnual: 'HMC project TCO',
    annualDelta: 'Project TCO delta',
    grossAvoided: 'Gross avoided cost',
    netAnnual: 'Net project saving',
    annualRoi: 'Project ROI',
    asIsPerUserYear: 'As-Is €/user/year',
    hmcPerUserYear: 'HMC €/user/year',
    deltaPerUserYear: 'Delta €/user/year',
    years: 'years',
    disclaimerButton: 'Show methodology disclaimer',
    disclaimerTitle: 'Methodology disclaimer',
    disclaimerBody:
      "This exercise is for demonstration purposes. All inputs and assumptions are editable according to the customer's real context. The calculator is a simplified simulation, similar to an advanced spreadsheet: it is not a commercial, legal, or financial commitment. Creator: Simone Ferrari, personal AI vibe-coding project.",
  },
};

const DEFAULTS = {
  profile: {
    horizonYears: 3,
    hmcPricePerUserPerMonth: 35,
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
  },
  residuals: {
    residualHardwareInfra: 0,
    residualServices: 0,
  },
};

function SectionCard({ title, subtitle, children, className = '' }) {
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}><div className="border-b border-slate-100 px-6 py-5"><h3 className="text-lg font-semibold text-slate-950">{title}</h3>{subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}</div><div className="p-6">{children}</div></div>;
}

function Help({ text }) {
  return (
    <span title={text} className="inline-flex cursor-help text-xs font-semibold text-slate-500">
      ⓘ
    </span>
  );
}

function Field({ label, value, onChange, prefix, suffix, help, step = '1' }) {
  return (
    <label className="block space-y-2">
      <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
        {label}
        {help ? <Help text={help} /> : null}
      </span>
      <div className="relative">
        {prefix ? <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-slate-400">{prefix}</span> : null}
        <input
          type="number"
          value={value}
          step={step}
          min="0"
          onChange={(e) => onChange(Number(e.target.value))}
          className={`w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200 ${prefix ? 'pl-8' : ''} ${suffix ? 'pr-24' : ''}`}
        />
        {suffix ? <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400">{suffix}</span> : null}
      </div>
    </label>
  );
}

function RangeField({ label, value, onChange, help }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="flex items-center gap-2 text-sm font-medium text-slate-700">
          {label}
          {help ? <Help text={help} /> : null}
        </span>
        <span className="text-sm text-slate-500">{pct(value)}</span>
      </div>
      <input type="range" min="0" max="100" step="1" value={value} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </div>
  );
}

function Kpi({ title, value, hint }) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">
      <p className="text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{hint}</p>
    </div>
  );
}

export default function App() {
  const [state, setState] = useState(DEFAULTS);
  const [lang, setLang] = useState('it');
  const [showCustomization, setShowCustomization] = useState(false);
  const [customTab, setCustomTab] = useState('params');
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const copy = TEXT[lang];
  const t = (itText, enText) => (lang === 'it' ? itText : enText);

  const setProfile = (key, value) => setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const setTech = (key, value) => setState((s) => ({ ...s, tech: { ...s.tech, [key]: value } }));
  const setCost = (key, value) => setState((s) => ({ ...s, cost: { ...s.cost, [key]: value } }));
  const setResidual = (key, value) => setState((s) => ({ ...s, residuals: { ...s.residuals, [key]: value } }));

  const model = useMemo(() => {
    const { profile, tech, cost, residuals } = state;

    const users = Math.max(tech.numberUsers, 0);
    const remoteUsers = users * (tech.pctRemoteHybridUsers / 100);
    const totalCores = tech.numberHosts * tech.coresPerHost;
    const replaceablePc = tech.numberPc * (tech.pctPcReplaceableWithThinClient / 100);
    const remainingPc = tech.numberPc - replaceablePc;

    const asIs = {
      endpoint: (tech.numberPc * cost.costOnePc) / Math.max(tech.avgPcAgeYears, 1),
      hypervisor: totalCores * cost.costHypervisorPerCoreYear,
      access: tech.numberVpnAdcAppliances * cost.costVpnAdcAppliance * (1 + cost.applianceMaintenanceAnnualPct / 100),
      mfa: users * cost.costMfaUserMonth * 12,
      ztna: remoteUsers * cost.costZtnaUserMonth * 12,
      edr: tech.numberPc * cost.costEdrEndpointMonth * 12,
      posture: tech.numberPc * cost.costDevicePostureEndpointMonth * 12,
      securityServices: cost.costSocMsspAnnual + tech.numberPc * cost.costRemediationPerEndpointYear + tech.itDaysSecurityOps * cost.costSysadminDay,
      opsEndpoint: tech.itDaysEndpointMgmt * cost.costSysadminDay,
      opsImage: tech.itDaysImageVdiMgmt * cost.costSysadminDay,
      opsSupport: tech.itDaysSupport * cost.costSysadminDay,
      opsAccess: tech.itDaysAccessMgmt * cost.costSysadminDay,
      hmcSubscription: 0,
      residualHw: 0,
      residualServices: 0,
    };

    const hmc = {
      endpoint:
        (remainingPc * cost.costOnePc) / Math.max(tech.lifecyclePcTargetYears, 1) +
        (replaceablePc * cost.costOneThinClient) / 5,
      hypervisor: 0,
      access: 0,
      mfa: 0,
      ztna: 0,
      edr: asIs.edr * (cost.residualEdrRatioWithHmc / 100),
      posture: asIs.posture * (cost.residualDevicePostureRatioWithHmc / 100),
      securityServices: asIs.securityServices * (cost.residualSecurityServicesRatioWithHmc / 100),
      opsEndpoint: asIs.opsEndpoint * (1 - cost.reductionEffortEndpointPct / 100),
      opsImage: asIs.opsImage * (1 - cost.reductionEffortImagePct / 100),
      opsSupport: asIs.opsSupport * (1 - cost.reductionEffortSupportPct / 100),
      opsAccess: asIs.opsAccess * (1 - cost.reductionEffortAccessPct / 100),
      hmcSubscription: users * profile.hmcPricePerUserPerMonth * 12,
      residualHw: residuals.residualHardwareInfra,
      residualServices: residuals.residualServices,
    };

    const annualKeys = Object.keys(asIs);
    const annualRows = annualKeys.map((key) => ({
      key,
      asIs: asIs[key],
      hmc: hmc[key],
      delta: asIs[key] - hmc[key],
    }));

    const totalAsIsAnnual = annualRows.reduce((sum, row) => sum + row.asIs, 0);
    const totalHmcAnnual = annualRows.reduce((sum, row) => sum + row.hmc, 0);
    const annualDelta = totalAsIsAnnual - totalHmcAnnual;
    const projectYears = Math.min(5, Math.max(1, Number(profile.horizonYears) || 1));
    const migrationCostOneTime = profile.initialMigrationCost;

    const tableRows = annualRows
      .map((row) => ({
        ...row,
        asIs: row.asIs * projectYears,
        hmc: row.hmc * projectYears,
        delta: (row.asIs - row.hmc) * projectYears,
      }))
      .concat([
        {
          key: 'migrationProject',
          asIs: 0,
          hmc: migrationCostOneTime,
          delta: -migrationCostOneTime,
        },
      ]);

    const totalAsIs = tableRows.reduce((sum, row) => sum + row.asIs, 0);
    const totalHmc = tableRows.reduce((sum, row) => sum + row.hmc, 0);
    const projectDelta = totalAsIs - totalHmc;
    const grossAvoided = totalAsIs - (totalHmc - (hmc.hmcSubscription * projectYears) + migrationCostOneTime);
    const roiAnnual = totalHmc > 0 ? projectDelta / totalHmc : null;

    const asIsCostPerUserPerYear = users > 0 ? totalAsIsAnnual / users : 0;
    const hmcCostPerUserPerYear = users > 0 ? totalHmcAnnual / users : 0;
    const perUserPerYearDelta = asIsCostPerUserPerYear - hmcCostPerUserPerYear;

    const warnings = [];
    if (tech.numberUsers <= 0) warnings.push(t('Numero utenti deve essere > 0.', 'Number of users must be > 0.'));
    if (tech.numberPc > tech.numberUsers * 1.4)
      warnings.push(
        t(
          'Numero PC molto alto rispetto agli utenti (warning non bloccante).',
          'PC count appears very high compared to users (non-blocking warning).'
        )
      );
    if (tech.pctByodUsers + tech.pctPcReplaceableWithThinClient > 130)
      warnings.push(
        t(
          'BYOD + % PC sostituibili/estendibili può essere incoerente.',
          'BYOD + % replaceable/extendable PCs may be inconsistent.'
        )
      );

    const chartRows = [
      { name: 'Current Project TCO', value: totalAsIs },
      { name: 'HMC Project TCO', value: totalHmc },
      { name: 'Project TCO Delta', value: projectDelta },
    ];

    const byDomain = [
      { name: 'Endpoint', value: asIs.endpoint - hmc.endpoint },
      { name: 'Hypervisor', value: asIs.hypervisor - hmc.hypervisor },
      { name: 'Access / NetScaler', value: asIs.access - hmc.access },
      { name: 'Security', value: asIs.mfa + asIs.ztna + asIs.edr + asIs.posture + asIs.securityServices - (hmc.mfa + hmc.ztna + hmc.edr + hmc.posture + hmc.securityServices) },
      { name: 'Operations', value: asIs.opsEndpoint + asIs.opsImage + asIs.opsSupport + asIs.opsAccess - (hmc.opsEndpoint + hmc.opsImage + hmc.opsSupport + hmc.opsAccess) },
    ].filter((item) => item.value > 0);

    return {
      users,
      remoteUsers,
      totalCores,
      projectYears,
      totalAsIs,
      totalHmc,
      totalAsIsAnnual,
      totalHmcAnnual,
      annualDelta,
      projectDelta,
      migrationCostOneTime,
      grossAvoided,
      roiAnnual,
      asIsCostPerUserPerYear,
      hmcCostPerUserPerYear,
      perUserPerYearDelta,
      warnings,
      chartRows,
      byDomain,
      tableRows,
    };
  }, [state, lang]);

  const rowLabels = {
    endpoint: t('Endpoint (PC/thin client)', 'Endpoint (PC/thin client)'),
    hypervisor: t('Hypervisor', 'Hypervisor'),
    access: t('Access / NetScaler / ADC', 'Access / NetScaler / ADC'),
    mfa: t('Security - MFA', 'Security - MFA'),
    ztna: t('Security - ZTNA', 'Security - ZTNA'),
    edr: t('Security - EDR/XDR', 'Security - EDR/XDR'),
    posture: t('Security - Device posture', 'Security - Device posture'),
    securityServices: t(
      `Security services (SOC, remediation, SecOps ${state.tech.itDaysSecurityOps} giorni/anno)`,
      `Security services (SOC, remediation, SecOps ${state.tech.itDaysSecurityOps} days/year)`
    ),
    opsEndpoint: t(
      `Operations - Endpoint effort (${state.tech.itDaysEndpointMgmt} giorni/anno)`,
      `Operations - Endpoint effort (${state.tech.itDaysEndpointMgmt} days/year)`
    ),
    opsImage: t(
      `Operations - Image/VDI effort (${state.tech.itDaysImageVdiMgmt} giorni/anno)`,
      `Operations - Image/VDI effort (${state.tech.itDaysImageVdiMgmt} days/year)`
    ),
    opsSupport: t(
      `Operations - Support effort (${state.tech.itDaysSupport} giorni/anno)`,
      `Operations - Support effort (${state.tech.itDaysSupport} days/year)`
    ),
    opsAccess: t(
      `Operations - Access effort (${state.tech.itDaysAccessMgmt} giorni/anno)`,
      `Operations - Access effort (${state.tech.itDaysAccessMgmt} days/year)`
    ),
    hmcSubscription: t('HMC subscription', 'HMC subscription'),
    residualHw: t('Residual hardware / infra', 'Residual hardware / infra'),
    residualServices: t('Residual services', 'Residual services'),
    migrationProject: t('Costo progetto iniziale (solo primo anno)', 'Initial project cost (year 1 only)'),
  };

  const hmcInfo = {
    endpoint: {
      feature: 'Endpoint Management, eLux, Workspace',
      description: t(
        'Centralizza gestione endpoint e riduce costi hardware e lifecycle.',
        'Centralizes endpoint management and reduces hardware and lifecycle cost.'
      ),
    },
    hypervisor: {
      feature: 'XenServer Premium (10.000 socket)',
      description: t(
        'Hypervisor incluso elimina costi licenze e abilita HA, vMotion, GPU.',
        'Included hypervisor removes license costs and enables HA, vMotion, GPU.'
      ),
    },
    access: {
      feature: 'NetScaler (LB, Gateway, WAF)',
      description: t(
        'Accesso sicuro, bilanciamento e pubblicazione webapp con WAF e sicurezza integrata.',
        'Secure access, load balancing, and web app publishing with integrated WAF security.'
      ),
    },
    mfa: {
      feature: 'Adaptive Authentication',
      description: t(
        'MFA adattivo contestuale senza soluzioni aggiuntive.',
        'Contextual adaptive MFA without additional solutions.'
      ),
    },
    ztna: {
      feature: 'Secure Private Access + Gateway Service',
      description: t(
        'Accesso Zero Trust senza VPN tradizionale.',
        'Zero Trust access without traditional VPN.'
      ),
    },
    edr: {
      feature: 'Citrix Monitor, uberAgent ESA + integrazione SIEM',
      description: t(
        'Telemetria e security analytics avanzati end-to-end.',
        'Advanced end-to-end telemetry and security analytics.'
      ),
    },
    posture: {
      feature: 'deviceTRUST',
      description: t(
        'Controllo accesso basato su contesto e stato dispositivo in tempo reale.',
        'Access control based on context and real-time device posture.'
      ),
    },
    securityServices: {
      feature: 'App Protection, Session Recording, Citrix Policy',
      description: t(
        'Protezione sessioni e auditing centralizzato.',
        'Centralized session protection and auditing.'
      ),
    },
    opsEndpoint: {
      feature: 'Endpoint Mgmt, eLux, automazione',
      description: t(
        'Riduce effort operativo gestione dispositivi.',
        'Reduces operational effort for device management.'
      ),
    },
    opsImage: {
      feature: 'PVS, MCS, App Layering',
      description: t(
        'Automazione immagini e provisioning VDI.',
        'Automated image lifecycle and VDI provisioning.'
      ),
    },
    opsSupport: {
      feature: 'Director, NetScaler Console, uberAgent UXM, Scout',
      description: t(
        'Monitoraggio e troubleshooting proattivo.',
        'Proactive monitoring and troubleshooting.'
      ),
    },
    opsAccess: {
      feature: 'Gateway Service + NetScaler',
      description: t(
        'Accesso unificato e semplificato utenti.',
        'Unified and simplified user access.'
      ),
    },
    hmcSubscription: {
      feature: 'Tutto il bundle HMC',
      description: t(
        'Consolidamento licenze in piattaforma unica.',
        'License consolidation into a single platform.'
      ),
    },
    residualHw: {
      feature: '-',
      description: t(
        'Coperto da modelli cloud/hybrid.',
        'Covered by cloud/hybrid operating models.'
      ),
    },
    residualServices: {
      feature: '-',
      description: t(
        'Ridotti grazie automazione e SaaS.',
        'Reduced through automation and SaaS.'
      ),
    },
    migrationProject: {
      feature: 'Servizi professionali migrazione HMC',
      description: t(
        'Assessment, setup, migrazione e formazione; costo una tantum al primo anno.',
        'Assessment, setup, migration and training; one-time cost in year one.'
      ),
    },
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-8 text-white rounded-t-3xl">
              <div className="mb-3 flex justify-end gap-2">
                <button onClick={() => setLang('it')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'it' ? 'bg-white/20' : ''}`}>IT</button>
                <button onClick={() => setLang('en')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'en' ? 'bg-white/20' : ''}`}>EN</button>
              </div>
              <h1 className="text-3xl font-semibold md:text-4xl">{copy.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{copy.subtitle}</p>
              <p className="mt-3 max-w-4xl rounded-xl border border-white/20 bg-white/10 p-3 text-sm">{copy.customizationIntro}</p>
              <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => setShowCustomization((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl border border-blue-200 bg-blue-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-400">
                  {showCustomization ? copy.hideScenario : copy.editScenario}
                </button>
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  {copy.print}
                </button>
                <button onClick={() => setState(DEFAULTS)} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  {copy.reset}
                </button>
                <button onClick={() => setShowDisclaimer((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  {copy.disclaimerButton}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {(showDisclaimer || !showCustomization) && (
          <SectionCard
            className="mb-6"
            title={copy.disclaimerTitle}
            subtitle={t("Trasparenza del modello e contesto d'uso.", 'Model transparency and usage context.')}
          >
            <p className="text-sm leading-6 text-slate-700">{copy.disclaimerBody}</p>
          </SectionCard>
        )}

        {showCustomization && (
          <div className="mb-6">
            <div className="mb-3 flex flex-wrap gap-2 rounded-3xl border border-slate-200 bg-white p-2 shadow-sm">
              {[
                ['params', copy.tabs[0]],
                ['costs', copy.tabs[1]],
              ].map(([value, label]) => (
                <button
                  key={value}
                  onClick={() => setCustomTab(value)}
                  className={`rounded-2xl px-4 py-2.5 text-sm font-medium ${customTab === value ? 'bg-slate-900 text-white ring-2 ring-blue-200' : 'text-slate-600 hover:bg-slate-100'}`}
                >
                  {label}
                </button>
              ))}
            </div>

            {customTab === 'params' && (
              <div className="space-y-4">
                <SectionCard
                  title={t('1) Profilo progetto', '1) Project profile')}
                  subtitle={t('Impostazioni base del progetto ROI.', 'Base settings for ROI project.')}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">{t('Anni di progetto', 'Project years')}</span>
                      <select
                        value={state.profile.horizonYears}
                        onChange={(e) => setProfile('horizonYears', Number(e.target.value))}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-2.5 text-sm"
                      >
                        {[1, 2, 3, 4, 5].map((year) => (
                          <option key={year} value={year}>{year}</option>
                        ))}
                      </select>
                    </label>
                  </div>
                </SectionCard>

                <SectionCard
                  title={t('2) Scenario infrastruttura', '2) Infrastructure scenario')}
                  subtitle={t('Volumi utenti, endpoint e piattaforma.', 'Users, endpoint, and platform volumes.')}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field label={t('Numero utenti', 'Number of users')} value={state.tech.numberUsers} onChange={(v) => setTech('numberUsers', v)} suffix={t('utenti', 'users')} />
                    <RangeField label="% Remote / Hybrid users" value={state.tech.pctRemoteHybridUsers} onChange={(v) => setTech('pctRemoteHybridUsers', v)} />
                    <RangeField label="% BYOD users" value={state.tech.pctByodUsers} onChange={(v) => setTech('pctByodUsers', v)} />
                    <Field label={t('Numero PC', 'Number of PCs')} value={state.tech.numberPc} onChange={(v) => setTech('numberPc', v)} suffix="PC" />
                    <Field label={t('Numero thin client', 'Number of thin clients')} value={state.tech.numberThinClient} onChange={(v) => setTech('numberThinClient', v)} suffix={t('unità', 'units')} />
                    <Field label={t('Età media PC', 'Average PC age')} value={state.tech.avgPcAgeYears} onChange={(v) => setTech('avgPcAgeYears', v)} suffix={t('anni', 'years')} />
                    <Field label="Lifecycle PC target" value={state.tech.lifecyclePcTargetYears} onChange={(v) => setTech('lifecyclePcTargetYears', v)} suffix={t('anni', 'years')} />
                    <RangeField label={t('% PC sostituibili / estendibili', '% PCs replaceable / extendable')} value={state.tech.pctPcReplaceableWithThinClient} onChange={(v) => setTech('pctPcReplaceableWithThinClient', v)} />
                    <Field label={t('Numero appliance VPN / ADC', 'Number of VPN / ADC appliances')} value={state.tech.numberVpnAdcAppliances} onChange={(v) => setTech('numberVpnAdcAppliances', v)} suffix={t('appliance', 'appliances')} />
                    <Field label={t('Numero host hypervisor', 'Hypervisor host count')} value={state.tech.numberHosts} onChange={(v) => setTech('numberHosts', v)} suffix={t('host', 'hosts')} />
                    <Field label={t('Core CPU per host', 'CPU cores per host')} value={state.tech.coresPerHost} onChange={(v) => setTech('coresPerHost', v)} suffix={t('core', 'cores')} />
                  </div>
                </SectionCard>

                <SectionCard
                  title={t('3) Servizi', '3) Services')}
                  subtitle={t('Giornate IT, costi servizio e residui post-migrazione.', 'IT days, service costs, and post-migration residual settings.')}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field label={t('Giorni IT/anno endpoint management', 'IT days/year endpoint management')} value={state.tech.itDaysEndpointMgmt} onChange={(v) => setTech('itDaysEndpointMgmt', v)} suffix={t('giorni/anno', 'days/year')} />
                    <Field label={t('Giorni IT/anno image/VDI management', 'IT days/year image/VDI management')} value={state.tech.itDaysImageVdiMgmt} onChange={(v) => setTech('itDaysImageVdiMgmt', v)} suffix={t('giorni/anno', 'days/year')} />
                    <Field label={t('Giorni IT/anno support', 'IT days/year support')} value={state.tech.itDaysSupport} onChange={(v) => setTech('itDaysSupport', v)} suffix={t('giorni/anno', 'days/year')} />
                    <Field label={t('Giorni IT/anno access management', 'IT days/year access management')} value={state.tech.itDaysAccessMgmt} onChange={(v) => setTech('itDaysAccessMgmt', v)} suffix={t('giorni/anno', 'days/year')} />
                    <Field label={t('Giorni IT/anno security operations', 'IT days/year security operations')} value={state.tech.itDaysSecurityOps} onChange={(v) => setTech('itDaysSecurityOps', v)} suffix={t('giorni/anno', 'days/year')} />
                    <Field label={t('Costo giornata sistemistica', 'Sysadmin day cost')} value={state.cost.costSysadminDay} onChange={(v) => setCost('costSysadminDay', v)} prefix="€" suffix="/giorno" />
                    <RangeField label={t('Riduzione effort endpoint', 'Endpoint effort reduction')} value={state.cost.reductionEffortEndpointPct} onChange={(v) => setCost('reductionEffortEndpointPct', v)} />
                    <RangeField label={t('Riduzione effort image / VDI', 'Image / VDI effort reduction')} value={state.cost.reductionEffortImagePct} onChange={(v) => setCost('reductionEffortImagePct', v)} />
                    <RangeField label={t('Riduzione effort support', 'Support effort reduction')} value={state.cost.reductionEffortSupportPct} onChange={(v) => setCost('reductionEffortSupportPct', v)} />
                    <RangeField label={t('Riduzione effort access', 'Access effort reduction')} value={state.cost.reductionEffortAccessPct} onChange={(v) => setCost('reductionEffortAccessPct', v)} />
                    <RangeField label="Residual EDR ratio with HMC" value={state.cost.residualEdrRatioWithHmc} onChange={(v) => setCost('residualEdrRatioWithHmc', v)} />
                    <RangeField label="Residual device posture ratio with HMC" value={state.cost.residualDevicePostureRatioWithHmc} onChange={(v) => setCost('residualDevicePostureRatioWithHmc', v)} />
                    <RangeField label="Residual security services ratio with HMC" value={state.cost.residualSecurityServicesRatioWithHmc} onChange={(v) => setCost('residualSecurityServicesRatioWithHmc', v)} />
                  </div>
                </SectionCard>
              </div>
            )}

            {customTab === 'costs' && (
              <SectionCard
                title={t('Assunzioni costi', 'Cost assumptions')}
                subtitle={t('Valori economici da personalizzare.', 'Economic values to customize.')}
              >
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">{t('Parametro principale', 'Primary parameter')}</p>
                  <div className="mt-2 text-sm font-bold text-blue-900">
                    {t('Costo HMC per utente / mese', 'HMC cost per user / month')}
                  </div>
                  <div className="mt-3 max-w-xs">
                    <Field label={t('HMC price per user / month', 'HMC price per user / month')} value={state.profile.hmcPricePerUserPerMonth} onChange={(v) => setProfile('hmcPricePerUserPerMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" />
                  </div>
                  <div className="mt-4 text-sm font-bold text-blue-900">
                    {t('Costo progetto iniziale', 'Initial project cost')}
                  </div>
                  <div className="mt-3 max-w-xs">
                    <Field label={t('Costo progetto iniziale', 'Initial project cost')} value={state.profile.initialMigrationCost} onChange={(v) => setProfile('initialMigrationCost', v)} prefix="€" suffix={t('solo anno 1', 'year 1 only')} />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label={t('Costo nuovo PC', 'New PC cost')} value={state.cost.costOnePc} onChange={(v) => setCost('costOnePc', v)} prefix="€" suffix={t('/unità', '/unit')} />
                  <Field label={t('Costo nuovo thin client', 'New thin client cost')} value={state.cost.costOneThinClient} onChange={(v) => setCost('costOneThinClient', v)} prefix="€" suffix={t('/unità', '/unit')} help={t('Impostare €0 se si usa Unicon eLux.', 'Set to €0 when using Unicon eLux.')} />
                  <Field label={t('Costo hypervisor / core / anno', 'Hypervisor cost / core / year')} value={state.cost.costHypervisorPerCoreYear} onChange={(v) => setCost('costHypervisorPerCoreYear', v)} prefix="€" suffix="/core/anno" />
                  <Field label={t('Costo appliance VPN / ADC', 'VPN / ADC appliance cost')} value={state.cost.costVpnAdcAppliance} onChange={(v) => setCost('costVpnAdcAppliance', v)} prefix="€" suffix={t('/appliance', '/appliance')} />
                  <RangeField label={t('Manutenzione appliance', 'Appliance maintenance')} value={state.cost.applianceMaintenanceAnnualPct} onChange={(v) => setCost('applianceMaintenanceAnnualPct', v)} />
                  <Field label={t('Costo MFA / utente / mese', 'MFA cost / user / month')} value={state.cost.costMfaUserMonth} onChange={(v) => setCost('costMfaUserMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" />
                  <Field label={t('Costo ZTNA / utente / mese', 'ZTNA cost / user / month')} value={state.cost.costZtnaUserMonth} onChange={(v) => setCost('costZtnaUserMonth', v)} prefix="€" step="0.1" suffix="/utente/mese" />
                  <Field label={t('Costo EDR / endpoint / mese', 'EDR cost / endpoint / month')} value={state.cost.costEdrEndpointMonth} onChange={(v) => setCost('costEdrEndpointMonth', v)} prefix="€" step="0.1" suffix="/endpoint/mese" />
                  <Field label={t('Costo device posture / endpoint / mese', 'Device posture / endpoint / month')} value={state.cost.costDevicePostureEndpointMonth} onChange={(v) => setCost('costDevicePostureEndpointMonth', v)} prefix="€" step="0.1" suffix="/endpoint/mese" />
                  <Field label={t('Costo SOC / MSSP annuo', 'SOC / MSSP annual cost')} value={state.cost.costSocMsspAnnual} onChange={(v) => setCost('costSocMsspAnnual', v)} prefix="€" suffix="/anno" />
                  <Field label={t('Costo remediation / endpoint / anno', 'Remediation / endpoint / year')} value={state.cost.costRemediationPerEndpointYear} onChange={(v) => setCost('costRemediationPerEndpointYear', v)} prefix="€" suffix="/endpoint/anno" />
                  <Field label="Residual hardware / infra" value={state.residuals.residualHardwareInfra} onChange={(v) => setResidual('residualHardwareInfra', v)} prefix="€" suffix="/anno" />
                  <Field label="Residual services" value={state.residuals.residualServices} onChange={(v) => setResidual('residualServices', v)} prefix="€" suffix="/anno" />
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {model.warnings.length > 0 && (
          <SectionCard
            className="mb-4"
            title={t('Warning scenario', 'Scenario warnings')}
            subtitle={t('Segnalazioni non bloccanti del validatore frontend.', 'Non-blocking signals from frontend validator.')}
          >
            {model.warnings.map((warning) => (
              <p key={warning} className="mb-1 text-sm text-amber-700">• {warning}</p>
            ))}
          </SectionCard>
        )}

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Kpi title={`${copy.currentAnnual} (${model.projectYears} ${copy.years})`} value={eur(model.totalAsIs, lang)} hint={t('Costo totale attuale sull’intero periodo selezionato.', 'Total current cost over the selected project period.')} />
          <Kpi title={`${copy.hmcAnnual} (${model.projectYears} ${copy.years})`} value={eur(model.totalHmc, lang)} hint={t('Costo totale HMC sull’intero periodo selezionato, incluso il costo progetto iniziale al primo anno.', 'Total HMC cost over the selected project period, including the initial project cost in year one.')} />
          <Kpi title={`${copy.annualDelta} (${model.projectYears} ${copy.years})`} value={eur(model.projectDelta, lang)} hint={t('Differenza tra TCO attuale e TCO HMC sull’intero periodo selezionato.', 'Difference between current TCO and HMC TCO over the selected project period.')} />
          <Kpi title={copy.grossAvoided} value={eur(model.grossAvoided, lang)} hint={t('Costi evitati lordi sul periodo.', 'Gross avoided costs over the period.')} />
          <Kpi title={copy.netAnnual} value={eur(model.projectDelta, lang)} hint={t('Risparmio netto complessivo sull’orizzonte progetto.', 'Total net saving over the project horizon.')} />
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Kpi title={copy.annualRoi} value={model.roiAnnual === null ? '—' : pct(model.roiAnnual * 100, 1)} hint={t('Delta TCO progetto / TCO HMC progetto.', 'Project TCO delta / HMC project TCO.')} />
          <Kpi title={copy.asIsPerUserYear} value={eur(model.asIsCostPerUserPerYear, lang, 0)} hint={t('Costo annuo per utente nello scenario attuale.', 'Annual cost per user in the current scenario.')} />
          <Kpi title={copy.hmcPerUserYear} value={eur(model.hmcCostPerUserPerYear, lang, 0)} hint={t('Costo annuo per utente nello scenario HMC.', 'Annual cost per user in the HMC scenario.')} />
          <Kpi title={copy.deltaPerUserYear} value={eur(model.perUserPerYearDelta, lang, 0)} hint={t('Differenza annua per utente tra scenario attuale e HMC.', 'Annual per-user difference between current and HMC scenario.')} />
          <Kpi title={t('Utenti', 'Users')} value={String(model.users)} hint={t('Volume utenti scenario.', 'Scenario user volume.')} />
          <Kpi title={t('Utenti remoti', 'Remote users')} value={String(Math.round(model.remoteUsers))} hint={t('Derivato da % remote/hybrid.', 'Derived from % remote/hybrid.')} />
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          {t(
            'I KPI di TCO, delta, saving e ROI sono calcolati sull’intero periodo selezionato. I KPI €/utente/anno sono invece normalizzati su base annuale.',
            'TCO, delta, saving and ROI KPIs are calculated over the selected project period. €/user/year KPIs are normalized on an annual basis.'
          )}
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <SectionCard
            title={t('Dashboard - Confronto economico', 'Dashboard - Economic comparison')}
            subtitle={t('Questa dashboard resta sempre visibile.', 'This dashboard is always visible.')}
          >
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={model.chartRows}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickFormatter={(v) => `€${Math.round(v / 1000)}k`} tickLine={false} axisLine={false} />
                  <Tooltip formatter={(value) => eur(value, lang)} />
                  <Bar dataKey="value" fill="#2563eb" radius={[10, 10, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </SectionCard>

          <SectionCard
            title={t('Breakdown delta economico', 'Economic delta breakdown')}
            subtitle={t('Aree di differenza economica (senza doppio conteggio).', 'Economic difference areas (without double counting).')}
          >
            <div className="grid gap-6 lg:grid-cols-[0.85fr,1.15fr]">
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={model.byDomain} dataKey="value" nameKey="name" innerRadius={55} outerRadius={88} paddingAngle={2}>
                      {model.byDomain.map((item, i) => (
                        <Cell key={item.name} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value) => eur(value, lang)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-3">
                {model.byDomain.map((item, i) => (
                  <div key={item.name} className="flex items-center justify-between rounded-2xl border border-slate-200 p-3">
                    <div className="flex items-center gap-3">
                      <span className="h-3 w-3 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <p className="font-medium">{item.name}</p>
                    </div>
                    <span className="font-semibold">{eur(item.value, lang)}</span>
                  </div>
                ))}
              </div>
            </div>
          </SectionCard>
        </div>

        <SectionCard
          className="mt-6"
          title={t('Dettaglio calcoli - confronto sul periodo', 'Calculation details - project period comparison')}
          subtitle={t('Valori As-Is, HMC e Differenza calcolati sull’intero orizzonte progetto selezionato.', 'As-Is, HMC and Difference values calculated over the full selected project horizon.')}
        >
          {hoveredRowKey && hmcInfo[hoveredRowKey] ? (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm">
              <p className="font-semibold text-blue-900">
                {t('Funzionalità associate', 'Associated feature')}: {hmcInfo[hoveredRowKey].feature}
              </p>
              <p className="mt-1 text-blue-800">
                {t('Descrizione', 'Description')}: {hmcInfo[hoveredRowKey].description}
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">{t('Voce', 'Item')}</th>
                  <th className="py-2 pr-4">{t('As Is', 'As Is')}</th>
                  <th className="py-2 pr-4">HMC</th>
                  <th className="py-2">{t('Differenza', 'Difference')}</th>
                </tr>
              </thead>
              <tbody>
                {model.tableRows.map((row) => (
                  <tr
                    key={row.key}
                    className={`border-b border-slate-100 transition ${hoveredRowKey === row.key ? 'bg-blue-50' : ''}`}
                    onMouseEnter={() => setHoveredRowKey(row.key)}
                    onMouseLeave={() => setHoveredRowKey(null)}
                  >
                    <td className="py-2 pr-4">{rowLabels[row.key]}</td>
                    <td className="py-2 pr-4">{eur(row.asIs, lang)}</td>
                    <td className="py-2 pr-4">{eur(row.hmc, lang)}</td>
                    <td className={`py-2 font-medium ${row.delta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{eur(row.delta, lang)}</td>
                  </tr>
                ))}
                <tr className="border-t-2 border-slate-300 font-semibold">
                  <td className="py-2 pr-4">{t(`Totale progetto (${model.projectYears} anni)`, `Project total (${model.projectYears} years)`)}</td>
                  <td className="py-2 pr-4">{eur(model.totalAsIs, lang)}</td>
                  <td className="py-2 pr-4">{eur(model.totalHmc, lang)}</td>
                  <td className={`py-2 ${model.projectDelta >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>{eur(model.projectDelta, lang)}</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 text-xs text-slate-500">
            {t(
              'Nota metodologica: la voce PC refresh avoidance non è sommata separatamente perché è già inclusa nel delta Endpoint (As Is Endpoint - HMC Endpoint).',
              'Note: PC refresh avoidance is not added as a separate saving: it is already embedded in Endpoint delta (As Is Endpoint - HMC Endpoint).'
            )}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
