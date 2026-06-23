import React, { useEffect, useMemo, useState } from 'react';
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
import { LABELS, detectBrowserLanguage } from './i18n/labels';

const eur = (value, lang = 'it', digits = 0) =>
  new Intl.NumberFormat(lang === 'en' ? 'en-US' : 'it-IT', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(Number.isFinite(value) ? value : 0);

const pct = (value, digits = 0) => {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue.toFixed(digits)}%`;
};

const COLORS = ['#2563eb', '#0f172a', '#16a34a', '#7c3aed', '#ea580c', '#0891b2', '#dc2626'];

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
    pctWorkloadsXenServerCompatible: 100,
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
  return <div className={`rounded-3xl border border-slate-200 bg-white shadow-sm ${className}`}><div className={children ? 'border-b border-slate-100 px-6 py-5' : 'px-6 py-5'}><h3 className="text-lg font-semibold text-slate-950">{title}</h3>{subtitle ? <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p> : null}</div>{children ? <div className="p-6">{children}</div> : null}</div>;
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


const parseCsvLine = (line, delimiter = ',') => {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      index += 1;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === delimiter && !inQuotes) {
      values.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current);
  return values;
};

const parseCompatibilityCsv = (csvText, delimiter = ',') => {
  const rows = csvText.trim().split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(rows[0], delimiter);
  return rows.slice(1)
    .filter((line) => !line.startsWith(`vendor_name${delimiter}`) && !line.startsWith(`vendor${delimiter}`))
    .map((line) => {
      const values = parseCsvLine(line, delimiter);
      return headers.reduce((record, header, index) => ({ ...record, [header]: values[index] || '' }), {});
    });
};

function CompatibilityView({ lang, onBack }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/xenserver_scl.csv`)
      .then((response) => response.text())
      .then((text) => setItems(parseCompatibilityCsv(text)))
      .catch(() => setItems([]));
  }, []);

  const t = (itText, enText) => (lang === 'it' ? itText : enText);
  const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();
  const statuses = [...new Set(items.map((item) => item.regulatory_status).filter(Boolean))].sort();
  const filteredItems = items.filter((item) => {
    const haystack = `${item.vendor_name} ${item.product_name} ${item.category} ${item.short_description} ${item.regulatory_status}`.toLowerCase();
    return (category === 'all' || item.category === category) &&
      (status === 'all' || item.regulatory_status === status) &&
      haystack.includes(query.toLowerCase());
  });

  const supportedCount = items.filter((item) => item.regulatory_status === 'Supported').length;
  const averageIndex = items.length ? Math.round(items.reduce((sum, item) => sum + Number(item.compatibility_index || 0), 0) / items.length) : 0;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 p-6 text-white shadow-sm">
          <button onClick={onBack} className="mb-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20">← {t('Torna al calcolatore ROI', 'Back to ROI calculator')}</button>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-blue-200">XenServer Hypervisor Compatibility</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{t('Verifica compatibilità workload per XenServer', 'XenServer workload compatibility checker')}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">
            {t('Questa vista riguarda esclusivamente la compatibilità con XenServer come hypervisor. Non rappresenta una matrice per Citrix Virtual Apps and Desktops, NetScaler o altre funzionalità HMC.', 'This view is only about compatibility with XenServer as the hypervisor. It is not a compatibility matrix for Citrix Virtual Apps and Desktops, NetScaler, or other HMC capabilities.')}
          </p>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <Kpi title={t('Soluzioni censite', 'Listed solutions')} value={String(items.length)} hint={t('Dati letti dal CSV separato aggiornabile.', 'Data loaded from the separately updateable CSV.')} />
          <Kpi title={t('Supportate', 'Supported')} value={String(supportedCount)} hint={t('Record con stato Supported.', 'Records with Supported status.')} />
          <Kpi title={t('Indice medio', 'Average index')} value={`${averageIndex}/100`} hint={t('Media semplice degli indici nel file.', 'Simple average of indexes in the file.')} />
        </div>

        <SectionCard className="mt-6" title={t('Hardware Compatibility List XenServer', 'XenServer Hardware Compatibility List')} subtitle={t('Verifica la compatibilità hardware direttamente sulla lista ufficiale XenServer.', 'Check hardware compatibility directly on the official XenServer list.')}>
          <div className="flex flex-col gap-4 rounded-2xl bg-slate-50 p-5 md:flex-row md:items-center md:justify-between">
            <p className="max-w-3xl text-sm leading-6 text-slate-600">
              {t('La lista di compatibilità hardware deve essere verificata sul sito XenServer per confermare il supporto di server, componenti e configurazioni specifiche.', 'The hardware compatibility list must be verified on the XenServer site to confirm support for specific servers, components, and configurations.')}
            </p>
            <a href="https://hcl.xenserver.com/" target="_blank" rel="noreferrer" className="inline-flex shrink-0 items-center justify-center rounded-2xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800">
              {t('Apri HCL XenServer', 'Open XenServer HCL')}
            </a>
          </div>
        </SectionCard>

        <SectionCard className="mt-6" title={t('Ricerca Software Compatibility List XenServer', 'Search XenServer Software Compatibility List')} subtitle={t('Filtra per vendor, prodotto, categoria o stato di supporto.', 'Filter by vendor, product, category, or support status.')}>
          <div className="grid gap-3 md:grid-cols-[1fr,220px,220px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Cerca vendor o prodotto...', 'Search vendor or product...')} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutte le categorie', 'All categories')}</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutti gli stati', 'All statuses')}</option>{statuses.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th className="py-3 pr-4">Vendor</th><th className="py-3 pr-4">Product</th><th className="py-3 pr-4">Category</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Index</th><th className="py-3">Evidence</th></tr></thead><tbody>{filteredItems.map((item) => (<tr key={`${item.vendor_name}-${item.product_name}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-semibold">{item.vendor_name}</td><td className="py-3 pr-4"><p className="font-medium">{item.product_name}</p><p className="mt-1 text-xs text-slate-500">{item.short_description}</p></td><td className="py-3 pr-4">{item.category}</td><td className="py-3 pr-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.regulatory_status}</span></td><td className="py-3 pr-4 font-semibold">{item.compatibility_index}/100</td><td className="py-3"><p className="text-xs text-slate-600">{item.evidence_summary}</p><a href={(item.source_urls || '').split(' | ')[0]} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900">Source</a></td></tr>))}</tbody></table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function EndpointCompatibilityView({ lang, onBack }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [vendor, setVendor] = useState('all');
  const [release, setRelease] = useState('all');
  const t = (itText, enText) => (lang === 'it' ? itText : enText);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/elux_endpoint_hcl.csv`)
      .then((response) => response.text())
      .then((text) => setItems(parseCompatibilityCsv(text, ';')))
      .catch(() => setItems([]));
  }, []);

  const vendors = [...new Set(items.map((item) => item.vendor).filter(Boolean))].sort();
  const releases = [...new Set(items.flatMap((item) => (item['eLux release'] || '').split(';').map((value) => value.trim()).filter(Boolean)))].sort();
  const filteredItems = items.filter((item) => {
    const haystack = `${item.vendor} ${item.modello} ${item.CPU} ${item.note} ${item['eLux release']}`.toLowerCase();
    return (vendor === 'all' || item.vendor === vendor) &&
      (release === 'all' || (item['eLux release'] || '').includes(release)) &&
      haystack.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-900 p-6 text-white shadow-sm">
          <button onClick={onBack} className="mb-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20">← {t('Torna al calcolatore ROI', 'Back to ROI calculator')}</button>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-emerald-200">Endpoint eLux Compatibility</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{t('Verifica compatibilità endpoint convertibili a eLux 7', 'eLux 7 convertible endpoint compatibility checker')}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">
            {t('Usa questa vista per validare l’ipotesi di conversione dei PC e thin client compatibili a eLux nel modello ROI.', 'Use this view to validate the ROI model assumption that compatible PCs and thin clients can be converted to eLux.')}
          </p>
        </div>

        <SectionCard className="mt-6" title={t('Profilo PC generico convertibile a eLux 7', 'Generic PC profile convertible to eLux 7')} subtitle={t('Caratteristiche principali da usare come prerequisito minimo di valutazione.', 'Key characteristics to use as the minimum assessment prerequisite.')}>
          <div className="grid gap-4 md:grid-cols-3">
            <Kpi title={t('Sistema operativo target', 'Target operating system')} value="eLux 7" hint={t('Conversione del dispositivo a endpoint gestito eLux.', 'Device conversion to an eLux-managed endpoint.')} />
            <Kpi title={t('Processore', 'Processor')} value="x86" hint={t('Architettura richiesta per il PC generico.', 'Required architecture for the generic PC.')} />
            <Kpi title={t('Memoria RAM', 'RAM memory')} value="4 GB" hint={t('Soglia minima indicata per la conversione.', 'Minimum threshold indicated for conversion.')} />
          </div>
        </SectionCard>

        <SectionCard className="mt-6" title={t('Hardware certificato thin client convertibile ad eLux', 'Certified thin-client hardware convertible to eLux')} subtitle={t('Filtra per vendor, modello, CPU, note o release eLux.', 'Filter by vendor, model, CPU, notes, or eLux release.')}>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr,220px,260px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Cerca modello, CPU o note...', 'Search model, CPU, or notes...')} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            <select value={vendor} onChange={(event) => setVendor(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutti i vendor', 'All vendors')}</option>{vendors.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select value={release} onChange={(event) => setRelease(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutte le release eLux', 'All eLux releases')}</option>{releases.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </div>
          <p className="mb-3 text-xs text-slate-500">{t(`${filteredItems.length} risultati su ${items.length} dispositivi certificati.`, `${filteredItems.length} results out of ${items.length} certified devices.`)}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th className="py-3 pr-4">Vendor</th><th className="py-3 pr-4">{t('Modello', 'Model')}</th><th className="py-3 pr-4">CPU</th><th className="py-3 pr-4">{t('Note', 'Notes')}</th><th className="py-3">eLux release</th></tr></thead><tbody>{filteredItems.map((item, index) => (<tr key={`${item.vendor}-${item.modello}-${item.CPU}-${index}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-semibold">{item.vendor}</td><td className="py-3 pr-4 font-medium">{item.modello}</td><td className="py-3 pr-4">{item.CPU || '—'}</td><td className="py-3 pr-4 text-slate-600">{item.note || '—'}</td><td className="py-3">{item['eLux release']}</td></tr>))}</tbody></table>
          </div>
        </SectionCard>
      </div>
    </div>
  );
}

function NetScalerDetailView({ lang, onBack }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [scope, setScope] = useState('all');
  const t = (itText, enText) => (lang === 'it' ? itText : enText);

  useEffect(() => {
    fetch(`${import.meta.env.BASE_URL}data/netscaler_hmc_features.csv`)
      .then((response) => response.text())
      .then((text) => setItems(parseCompatibilityCsv(text)))
      .catch(() => setItems([]));
  }, []);

  const categories = [...new Set(items.map((item) => item.Categoria).filter(Boolean))].sort();
  const scopes = [...new Set(items.map((item) => item.Ambito).filter(Boolean))].sort();
  const filteredItems = items.filter((item) => {
    const haystack = `${item.Categoria} ${item.Sottocategoria} ${item.Funzionalità} ${item.Descrizione} ${item['Beneficio Principale']} ${item.Ambito}`.toLowerCase();
    return (category === 'all' || item.Categoria === category) &&
      (scope === 'all' || item.Ambito === scope) &&
      haystack.includes(query.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <div className="mx-auto max-w-7xl p-4 md:p-8">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-cyan-900 p-6 text-white shadow-sm">
          <button onClick={onBack} className="mb-5 rounded-2xl border border-white/20 bg-white/10 px-4 py-2 text-sm hover:bg-white/20">← {t('Torna al calcolatore ROI', 'Back to ROI calculator')}</button>
          <p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-200">NetScaler in HMC</p>
          <h1 className="mt-3 text-3xl font-semibold md:text-4xl">{t('Dettaglio funzionalità NetScaler incluse in HMC', 'NetScaler capabilities included with HMC')}</h1>
          <p className="mt-3 max-w-4xl text-sm leading-7 text-slate-200">
            {t('Vista di dettaglio per qualificare quali funzionalità NetScaler possono contribuire al consolidamento di appliance, VPN, bilanciamento, sicurezza applicativa e osservabilità.', 'Detail view to qualify which NetScaler capabilities can contribute to appliance, VPN, load-balancing, application-security, and observability consolidation.')}
          </p>
        </div>

        <SectionCard
          className="mt-6"
          title={t('Nota HMC su NetScaler', 'HMC note for NetScaler')}
          subtitle={t(
            'La subscription Citrix Universal Hybrid Multi-Cloud include NetScaler Premium per delivery applicativo e sicurezza: LB, SSL Offload, WAF, IP Reputation e altre funzionalità, fino a 999 istanze VPX/MPX/SDX/FIPS e 1000 Gbps di throughput aggregato.',
            'The Citrix Universal Hybrid Multi-Cloud subscription includes NetScaler Premium for application delivery and security: LB, SSL Offload, WAF, IP Reputation, and other capabilities, with up to 999 VPX/MPX/SDX/FIPS instances and 1000 Gbps aggregate throughput.'
          )}
        />

        <SectionCard className="mt-6" title={t('Catalogo funzionalità NetScaler', 'NetScaler capability catalog')} subtitle={t('Filtra le funzionalità per categoria, ambito o testo libero.', 'Filter capabilities by category, scope, or free text.')}>
          <div className="mb-4 grid gap-3 md:grid-cols-[1fr,240px,220px]">
            <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('Cerca funzionalità o beneficio...', 'Search capability or benefit...')} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm outline-none focus:border-slate-500 focus:ring-2 focus:ring-slate-200" />
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutte le categorie', 'All categories')}</option>{categories.map((value) => <option key={value} value={value}>{value}</option>)}</select>
            <select value={scope} onChange={(event) => setScope(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutti gli ambiti', 'All scopes')}</option>{scopes.map((value) => <option key={value} value={value}>{value}</option>)}</select>
          </div>
          <p className="mb-3 text-xs text-slate-500">{t(`${filteredItems.length} risultati su ${items.length} funzionalità censite.`, `${filteredItems.length} results out of ${items.length} listed capabilities.`)}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th className="py-3 pr-4">{t('Categoria', 'Category')}</th><th className="py-3 pr-4">{t('Sottocategoria', 'Subcategory')}</th><th className="py-3 pr-4">{t('Funzionalità', 'Capability')}</th><th className="py-3 pr-4">{t('Descrizione', 'Description')}</th><th className="py-3 pr-4">{t('Beneficio principale', 'Main benefit')}</th><th className="py-3">{t('Ambito', 'Scope')}</th></tr></thead><tbody>{filteredItems.map((item) => (<tr key={`${item.Categoria}-${item.Sottocategoria}-${item.Funzionalità}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-semibold">{item.Categoria}</td><td className="py-3 pr-4">{item.Sottocategoria}</td><td className="py-3 pr-4 font-medium">{item.Funzionalità}</td><td className="py-3 pr-4 text-slate-600">{item.Descrizione}</td><td className="py-3 pr-4 text-slate-600">{item['Beneficio Principale']}</td><td className="py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.Ambito}</span></td></tr>))}</tbody></table>
          </div>
        </SectionCard>
      </div>
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


function ScenarioReport({ lang, state, model, rowLabels }) {
  const t = (itText, enText) => (lang === 'it' ? itText : enText);
  const positiveDelta = model.projectDelta >= 0;
  const topRows = [...model.tableRows]
    .filter((row) => row.key !== 'migrationProject')
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))
    .slice(0, 5);

  return (
    <article className="print-report">
      <header className="report-hero">
        <p className="report-kicker">{t('Report scenario ROI Citrix HMC', 'Citrix HMC ROI scenario report')}</p>
        <h1>{t('Riepilogo discorsivo dello scenario attuale e del confronto economico', 'Narrative summary of the current scenario and economic comparison')}</h1>
        <p>{t('Documento generato automaticamente dai parametri impostati nel calcolatore. I valori riportati rappresentano una simulazione direzionale e devono essere validati con dati reali di cliente, contratti e perimetro tecnico.', 'Document automatically generated from the parameters configured in the calculator. The values shown are a directional simulation and must be validated with real customer data, contracts, and technical scope.')}</p>
      </header>

      <section className="report-section">
        <h2>{t('Scenario di partenza', 'Starting scenario')}</h2>
        <p>{t(`Lo scenario analizzato considera ${model.users} utenti complessivi su un orizzonte di ${model.projectYears} anni. La popolazione di utenti remoti o ibridi è pari al ${pct(state.tech.pctRemoteHybridUsers)}, corrispondente a circa ${Math.round(model.remoteUsers)} utenti, mentre la quota BYOD impostata è pari al ${pct(state.tech.pctByodUsers)}. Il parco endpoint attuale comprende ${state.tech.numberPc} PC gestiti e ${state.tech.numberThinClient} thin client già presenti; l'età media dei PC è di ${state.tech.avgPcAgeYears} anni e il ciclo di vita target dopo l'adozione della piattaforma viene portato a ${state.tech.lifecyclePcTargetYears} anni. Nel modello, il ${pct(state.tech.pctPcReplaceableWithThinClient)} dei PC è considerato sostituibile o estendibile con un approccio più leggero, con impatto diretto sui costi di refresh hardware.`, `The analyzed scenario includes ${model.users} total users over a ${model.projectYears}-year horizon. Remote or hybrid users are set to ${pct(state.tech.pctRemoteHybridUsers)}, equal to about ${Math.round(model.remoteUsers)} users, while the BYOD share is ${pct(state.tech.pctByodUsers)}. The current endpoint estate includes ${state.tech.numberPc} managed PCs and ${state.tech.numberThinClient} existing thin clients; the average PC age is ${state.tech.avgPcAgeYears} years and the target lifecycle after platform adoption is ${state.tech.lifecyclePcTargetYears} years. In the model, ${pct(state.tech.pctPcReplaceableWithThinClient)} of PCs are considered replaceable or extendable with a lighter approach, directly affecting hardware refresh costs.`)}</p>
        <p>{t(`Sul fronte infrastrutturale sono stati impostati ${state.tech.numberHosts} host hypervisor con ${state.tech.coresPerHost} core medi per host, per un totale di ${model.totalCores} core. La quota di workload considerata migrabile su XenServer è pari al ${pct(model.migratableWorkloadPct)}: l'eventuale quota non migrabile mantiene nel modello una parte proporzionale dei costi del virtualizzatore esistente. Per l'accesso remoto e ADC sono presenti ${state.tech.numberVpnAdcAppliances} appliance, valorizzate con costo unitario di ${eur(state.cost.costVpnAdcAppliance, lang)} e manutenzione annua del ${pct(state.cost.applianceMaintenanceAnnualPct)}.`, `On the infrastructure side, ${state.tech.numberHosts} hypervisor hosts with ${state.tech.coresPerHost} average cores per host have been configured, for a total of ${model.totalCores} cores. The workload share considered migratable to XenServer is ${pct(model.migratableWorkloadPct)}: any non-migratable share keeps a proportional amount of existing virtualizer costs in the model. For remote access and ADC, ${state.tech.numberVpnAdcAppliances} appliances are present, valued at a unit cost of ${eur(state.cost.costVpnAdcAppliance, lang)} and annual maintenance of ${pct(state.cost.applianceMaintenanceAnnualPct)}.`)}</p>
      </section>

      <section className="report-section">
        <h2>{t('Assunzioni economiche e operative', 'Economic and operational assumptions')}</h2>
        <p>{t(`Il costo HMC è stato impostato a ${eur(state.profile.hmcPricePerUserPerMonth, lang, 1)} per utente al mese, con un costo iniziale di progetto pari a ${eur(model.migrationCostOneTime, lang)} imputato al primo anno. Il costo unitario di un nuovo PC è pari a ${eur(state.cost.costOnePc, lang)}, mentre il costo unitario thin client è pari a ${eur(state.cost.costOneThinClient, lang)}. Le componenti di sicurezza considerate nello scenario attuale includono MFA a ${eur(state.cost.costMfaUserMonth, lang, 1)} utente/mese, ZTNA a ${eur(state.cost.costZtnaUserMonth, lang, 1)} utente/mese, EDR a ${eur(state.cost.costEdrEndpointMonth, lang, 1)} endpoint/mese, device posture a ${eur(state.cost.costDevicePostureEndpointMonth, lang, 1)} endpoint/mese, SOC/MSSP annuo pari a ${eur(state.cost.costSocMsspAnnual, lang)} e remediation media di ${eur(state.cost.costRemediationPerEndpointYear, lang)} per endpoint/anno.`, `The HMC cost has been set to ${eur(state.profile.hmcPricePerUserPerMonth, lang, 1)} per user per month, with an initial project cost of ${eur(model.migrationCostOneTime, lang)} allocated to year one. The unit cost of a new PC is ${eur(state.cost.costOnePc, lang)}, while the thin client unit cost is ${eur(state.cost.costOneThinClient, lang)}. Security components in the current scenario include MFA at ${eur(state.cost.costMfaUserMonth, lang, 1)} user/month, ZTNA at ${eur(state.cost.costZtnaUserMonth, lang, 1)} user/month, EDR at ${eur(state.cost.costEdrEndpointMonth, lang, 1)} endpoint/month, device posture at ${eur(state.cost.costDevicePostureEndpointMonth, lang, 1)} endpoint/month, annual SOC/MSSP of ${eur(state.cost.costSocMsspAnnual, lang)}, and average remediation of ${eur(state.cost.costRemediationPerEndpointYear, lang)} per endpoint/year.`)}</p>
        <p>{t(`Le giornate IT annue valorizzate sono ${state.tech.itDaysEndpointMgmt} per endpoint management, ${state.tech.itDaysImageVdiMgmt} per image/VDI management, ${state.tech.itDaysSupport} per supporto, ${state.tech.itDaysAccessMgmt} per access management e ${state.tech.itDaysSecurityOps} per security operations, con costo giornata sistemistica pari a ${eur(state.cost.costSysadminDay, lang)}. Nel passaggio allo scenario HMC il modello applica riduzioni di effort pari al ${pct(state.cost.reductionEffortEndpointPct)} sull'endpoint management, ${pct(state.cost.reductionEffortImagePct)} sulle immagini, ${pct(state.cost.reductionEffortSupportPct)} sul supporto e ${pct(state.cost.reductionEffortAccessPct)} sull'access management.`, `The annual IT days valued are ${state.tech.itDaysEndpointMgmt} for endpoint management, ${state.tech.itDaysImageVdiMgmt} for image/VDI management, ${state.tech.itDaysSupport} for support, ${state.tech.itDaysAccessMgmt} for access management, and ${state.tech.itDaysSecurityOps} for security operations, with a sysadmin day cost of ${eur(state.cost.costSysadminDay, lang)}. In the HMC scenario, the model applies effort reductions of ${pct(state.cost.reductionEffortEndpointPct)} on endpoint management, ${pct(state.cost.reductionEffortImagePct)} on image management, ${pct(state.cost.reductionEffortSupportPct)} on support, and ${pct(state.cost.reductionEffortAccessPct)} on access management.`)}</p>
      </section>

      <section className="report-section">
        <h2>{t('Risultato economico sintetico', 'Economic summary')}</h2>
        <p>{t(`Sul periodo di ${model.projectYears} anni, il TCO dello scenario attuale è pari a ${eur(model.totalAsIs, lang)}, mentre il TCO dello scenario HMC è pari a ${eur(model.totalHmc, lang)}. Il delta complessivo è quindi pari a ${eur(model.projectDelta, lang)} e viene interpretato come ${positiveDelta ? 'risparmio netto potenziale' : 'maggior costo netto potenziale'} rispetto allo scenario di partenza. Il ROI progetto calcolato come delta TCO su TCO HMC è pari a ${model.roiAnnual === null ? '—' : pct(model.roiAnnual * 100, 1)}. In termini normalizzati, il costo annuo As-Is per utente è ${eur(model.asIsCostPerUserPerYear, lang)}, il costo annuo HMC per utente è ${eur(model.hmcCostPerUserPerYear, lang)} e il delta annuo per utente è ${eur(model.perUserPerYearDelta, lang)}.`, `Over the ${model.projectYears}-year period, the current scenario TCO is ${eur(model.totalAsIs, lang)}, while the HMC scenario TCO is ${eur(model.totalHmc, lang)}. The overall delta is therefore ${eur(model.projectDelta, lang)} and is interpreted as a ${positiveDelta ? 'potential net saving' : 'potential net additional cost'} compared with the starting scenario. Project ROI, calculated as TCO delta over HMC TCO, is ${model.roiAnnual === null ? '—' : pct(model.roiAnnual * 100, 1)}. On a normalized basis, the annual As-Is cost per user is ${eur(model.asIsCostPerUserPerYear, lang)}, the annual HMC cost per user is ${eur(model.hmcCostPerUserPerYear, lang)}, and the annual per-user delta is ${eur(model.perUserPerYearDelta, lang)}.`)}</p>
        <p>{t(`Le principali aree che contribuiscono al delta economico sono: ${topRows.map((row) => `${rowLabels[row.key]} (${eur(row.delta, lang)})`).join(', ')}. Queste voci aiutano a leggere il risultato non come un singolo numero isolato, ma come somma di scelte architetturali, razionalizzazione licenze, semplificazione operativa, sicurezza integrata e gestione del ciclo di vita degli endpoint.`, `The main areas contributing to the economic delta are: ${topRows.map((row) => `${rowLabels[row.key]} (${eur(row.delta, lang)})`).join(', ')}. These items help interpret the result not as a single isolated number, but as the sum of architectural choices, license rationalization, operational simplification, integrated security, and endpoint lifecycle management.`)}</p>
      </section>

      <section className="report-section">
        <h2>{t('Dettaglio costi sul periodo', 'Cost details over the period')}</h2>
        <table>
          <thead><tr><th>{t('Voce', 'Item')}</th><th>{t('As-Is', 'As-Is')}</th><th>HMC</th><th>{t('Delta', 'Delta')}</th></tr></thead>
          <tbody>
            {model.tableRows.map((row) => (<tr key={row.key}><td>{rowLabels[row.key]}</td><td>{eur(row.asIs, lang)}</td><td>{eur(row.hmc, lang)}</td><td>{eur(row.delta, lang)}</td></tr>))}
            <tr className="report-total"><td>{t(`Totale progetto (${model.projectYears} anni)`, `Project total (${model.projectYears} years)`)}</td><td>{eur(model.totalAsIs, lang)}</td><td>{eur(model.totalHmc, lang)}</td><td>{eur(model.projectDelta, lang)}</td></tr>
          </tbody>
        </table>
      </section>
    </article>
  );
}

export default function App() {
  const [state, setState] = useState(DEFAULTS);
  const [lang, setLang] = useState(detectBrowserLanguage());
  const [showCustomization, setShowCustomization] = useState(false);
  const [customTab, setCustomTab] = useState('params');
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [view, setView] = useState('roi');
  const copy = LABELS[lang];
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
      hypervisor: asIs.hypervisor * (1 - Math.min(100, Math.max(0, tech.pctWorkloadsXenServerCompatible)) / 100),
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
    if (tech.numberUsers <= 0) warnings.push(copy.validationUsersPositive);
    if (tech.numberPc > tech.numberUsers * 1.4)
      warnings.push(
        copy.validationPcHigh
      );
    if (tech.pctByodUsers + tech.pctPcReplaceableWithThinClient > 130)
      warnings.push(
        copy.validationByodIncoherent
      );

    const chartRows = [
      { name: copy.chartCurrent, value: totalAsIs },
      { name: copy.chartHmc, value: totalHmc },
      { name: copy.chartDelta, value: projectDelta },
    ];

    const byDomain = [
      { key: 'endpoint', name: copy.domainEndpoint, value: asIs.endpoint - hmc.endpoint },
      { key: 'hypervisor', name: copy.domainHypervisor, value: asIs.hypervisor - hmc.hypervisor },
      { key: 'access', name: copy.domainAccess, value: asIs.access - hmc.access },
      { key: 'security', name: copy.domainSecurity, value: asIs.mfa + asIs.ztna + asIs.edr + asIs.posture + asIs.securityServices - (hmc.mfa + hmc.ztna + hmc.edr + hmc.posture + hmc.securityServices) },
      { key: 'operations', name: copy.domainOperations, value: asIs.opsEndpoint + asIs.opsImage + asIs.opsSupport + asIs.opsAccess - (hmc.opsEndpoint + hmc.opsImage + hmc.opsSupport + hmc.opsAccess) },
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
      retainedLegacyHypervisorAnnual: hmc.hypervisor,
      migratableWorkloadPct: Math.min(100, Math.max(0, tech.pctWorkloadsXenServerCompatible)),
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

  if (view === 'compatibility') {
    return <CompatibilityView lang={lang} onBack={() => setView('roi')} />;
  }
  if (view === 'endpointCompatibility') {
    return <EndpointCompatibilityView lang={lang} onBack={() => setView('roi')} />;
  }
  if (view === 'netscalerDetail') {
    return <NetScalerDetailView lang={lang} onBack={() => setView('roi')} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-950">
      <ScenarioReport lang={lang} state={state} model={model} rowLabels={rowLabels} />
      <div className="app-shell mx-auto max-w-7xl p-4 md:p-8">
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
                <button onClick={() => setView('compatibility')} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
                  {t('Verifica compatibilità XenServer', 'Check XenServer compatibility')}
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {showDisclaimer && (
          <SectionCard
            className="mb-6"
            title={copy.disclaimerTitle}
            subtitle={copy.disclaimerSubtitle}
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
                  title={copy.section1Title}
                  subtitle={copy.section1Subtitle}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <label className="block space-y-2">
                      <span className="text-sm font-medium text-slate-700">{copy.projectYears} <Help text={copy.helpProjectYears} /></span>
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
                  title={copy.section2Title}
                  subtitle={copy.section2Subtitle}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field label={copy.users} help={copy.helpUsers} value={state.tech.numberUsers} onChange={(v) => setTech('numberUsers', v)} suffix={copy.usersSuffix} />
                    <RangeField label={copy.remote} help={copy.helpRemote} value={state.tech.pctRemoteHybridUsers} onChange={(v) => setTech('pctRemoteHybridUsers', v)} />
                    <RangeField label={copy.byod} help={copy.helpByod} value={state.tech.pctByodUsers} onChange={(v) => setTech('pctByodUsers', v)} />
                    <Field label={copy.pcCount} help={copy.helpPcCount} value={state.tech.numberPc} onChange={(v) => setTech('numberPc', v)} suffix="PC" />
                    <Field label={copy.thinClients} help={copy.helpThinClients} value={state.tech.numberThinClient} onChange={(v) => setTech('numberThinClient', v)} suffix={copy.units} />
                    <Field label={copy.avgPcAge} help={copy.helpAvgPcAge} value={state.tech.avgPcAgeYears} onChange={(v) => setTech('avgPcAgeYears', v)} suffix={copy.yearsSuffix} />
                    <Field label={copy.lifecycle} help={copy.helpLifecycle} value={state.tech.lifecyclePcTargetYears} onChange={(v) => setTech('lifecyclePcTargetYears', v)} suffix={copy.yearsSuffix} />
                    <RangeField label={copy.replaceable} help={copy.helpReplaceable} value={state.tech.pctPcReplaceableWithThinClient} onChange={(v) => setTech('pctPcReplaceableWithThinClient', v)} />
                    <Field label={copy.vpnAdc} help={copy.helpVpnAdc} value={state.tech.numberVpnAdcAppliances} onChange={(v) => setTech('numberVpnAdcAppliances', v)} suffix={copy.appliances} />
                    <Field label={copy.hosts} help={copy.helpHosts} value={state.tech.numberHosts} onChange={(v) => setTech('numberHosts', v)} suffix={copy.host} />
                    <Field label={copy.cores} help={copy.helpCores} value={state.tech.coresPerHost} onChange={(v) => setTech('coresPerHost', v)} suffix={copy.core} />
                    <RangeField label={t('% workload migrabili su XenServer', '% workloads migratable to XenServer')} help={t('Riduci questo valore se dalla verifica compatibilità emerge che alcuni workload devono restare sul virtualizzatore attuale: il modello mantiene una quota proporzionale dei costi hypervisor esistenti.', 'Lower this value if the compatibility check shows that some workloads must remain on the existing virtualizer: the model retains a proportional share of existing hypervisor costs.')} value={state.tech.pctWorkloadsXenServerCompatible} onChange={(v) => setTech('pctWorkloadsXenServerCompatible', v)} />
                  </div>
                </SectionCard>

                <SectionCard
                  title={copy.section3Title}
                  subtitle={copy.section3Subtitle}
                >
                  <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                    <Field label={copy.itDaysEndpoint} help={copy.helpItDaysEndpoint} value={state.tech.itDaysEndpointMgmt} onChange={(v) => setTech('itDaysEndpointMgmt', v)} suffix={copy.daysYear} />
                    <Field label={copy.itDaysImage} help={copy.helpItDaysImage} value={state.tech.itDaysImageVdiMgmt} onChange={(v) => setTech('itDaysImageVdiMgmt', v)} suffix={copy.daysYear} />
                    <Field label={copy.itDaysSupport} help={copy.helpItDaysSupport} value={state.tech.itDaysSupport} onChange={(v) => setTech('itDaysSupport', v)} suffix={copy.daysYear} />
                    <Field label={copy.itDaysAccess} help={copy.helpItDaysAccess} value={state.tech.itDaysAccessMgmt} onChange={(v) => setTech('itDaysAccessMgmt', v)} suffix={copy.daysYear} />
                    <Field label={copy.itDaysSecurity} help={copy.helpItDaysSecurity} value={state.tech.itDaysSecurityOps} onChange={(v) => setTech('itDaysSecurityOps', v)} suffix={copy.daysYear} />
                    <Field label={copy.sysadminDayCost} help={copy.helpSysadminDayCost} value={state.cost.costSysadminDay} onChange={(v) => setCost('costSysadminDay', v)} prefix="€" suffix={copy.perDay} />
                    <RangeField label={copy.reductionEndpoint} help={copy.helpReductionEndpoint} value={state.cost.reductionEffortEndpointPct} onChange={(v) => setCost('reductionEffortEndpointPct', v)} />
                    <RangeField label={copy.reductionImage} help={copy.helpReductionImage} value={state.cost.reductionEffortImagePct} onChange={(v) => setCost('reductionEffortImagePct', v)} />
                    <RangeField label={copy.reductionSupport} help={copy.helpReductionSupport} value={state.cost.reductionEffortSupportPct} onChange={(v) => setCost('reductionEffortSupportPct', v)} />
                    <RangeField label={copy.reductionAccess} help={copy.helpReductionAccess} value={state.cost.reductionEffortAccessPct} onChange={(v) => setCost('reductionEffortAccessPct', v)} />
                    <RangeField label={copy.residualEdr} help={copy.helpResidualEdr} value={state.cost.residualEdrRatioWithHmc} onChange={(v) => setCost('residualEdrRatioWithHmc', v)} />
                    <RangeField label={copy.residualPosture} help={copy.helpResidualPosture} value={state.cost.residualDevicePostureRatioWithHmc} onChange={(v) => setCost('residualDevicePostureRatioWithHmc', v)} />
                    <RangeField label={copy.residualSecurity} help={copy.helpResidualSecurity} value={state.cost.residualSecurityServicesRatioWithHmc} onChange={(v) => setCost('residualSecurityServicesRatioWithHmc', v)} />
                  </div>
                </SectionCard>
              </div>
            )}

            {customTab === 'costs' && (
              <SectionCard
                title={copy.costAssumptions}
                subtitle={copy.economicValues}
              >
                <div className="mb-6 rounded-2xl border border-blue-200 bg-blue-50 p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">{copy.primaryParameter}</p>
                  <div className="mt-2 text-sm font-bold text-blue-900">
                    {copy.hmcCostUserMonth}
                  </div>
                  <div className="mt-3 max-w-xs">
                    <Field label={copy.hmcPriceUserMonth} value={state.profile.hmcPricePerUserPerMonth} onChange={(v) => setProfile('hmcPricePerUserPerMonth', v)} prefix="€" step="0.1" suffix={copy.perUserMonth} />
                  </div>
                  <div className="mt-4 text-sm font-bold text-blue-900">
                    {copy.initialProjectCost}
                  </div>
                  <div className="mt-3 max-w-xs">
                    <Field label={copy.initialProjectCost} value={state.profile.initialMigrationCost} onChange={(v) => setProfile('initialMigrationCost', v)} prefix="€" suffix={copy.year1Only} />
                  </div>
                </div>

                <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                  <Field label={copy.newPcCost} help={copy.helpNewPcCost} value={state.cost.costOnePc} onChange={(v) => setCost('costOnePc', v)} prefix="€" suffix={copy.perUnit} />
                  <Field label={copy.newThinCost} help={copy.helpNewThinCost} value={state.cost.costOneThinClient} onChange={(v) => setCost('costOneThinClient', v)} prefix="€" suffix={copy.perUnit} />
                  <Field label={copy.hypervisorCostCoreYear} help={copy.helpHypervisorCost} value={state.cost.costHypervisorPerCoreYear} onChange={(v) => setCost('costHypervisorPerCoreYear', v)} prefix="€" suffix={copy.perCoreYear} />
                  <Field label={copy.vpnApplianceCost} help={copy.helpVpnApplianceCost} value={state.cost.costVpnAdcAppliance} onChange={(v) => setCost('costVpnAdcAppliance', v)} prefix="€" suffix={copy.perAppliance} />
                  <RangeField label={copy.applianceMaintenance} help={copy.helpApplianceMaintenance} value={state.cost.applianceMaintenanceAnnualPct} onChange={(v) => setCost('applianceMaintenanceAnnualPct', v)} />
                  <Field label={copy.mfaCost} help={copy.helpMfaCost} value={state.cost.costMfaUserMonth} onChange={(v) => setCost('costMfaUserMonth', v)} prefix="€" step="0.1" suffix={copy.perUserMonth} />
                  <Field label={copy.ztnaCost} help={copy.helpZtnaCost} value={state.cost.costZtnaUserMonth} onChange={(v) => setCost('costZtnaUserMonth', v)} prefix="€" step="0.1" suffix={copy.perUserMonth} />
                  <Field label={copy.edrCost} help={copy.helpEdrCost} value={state.cost.costEdrEndpointMonth} onChange={(v) => setCost('costEdrEndpointMonth', v)} prefix="€" step="0.1" suffix={copy.perEndpointMonth} />
                  <Field label={copy.postureCost} help={copy.helpPostureCost} value={state.cost.costDevicePostureEndpointMonth} onChange={(v) => setCost('costDevicePostureEndpointMonth', v)} prefix="€" step="0.1" suffix={copy.perEndpointMonth} />
                  <Field label={copy.socCost} help={copy.helpSocCost} value={state.cost.costSocMsspAnnual} onChange={(v) => setCost('costSocMsspAnnual', v)} prefix="€" suffix={copy.perYear} />
                  <Field label={copy.remediationCost} help={copy.helpRemediationCost} value={state.cost.costRemediationPerEndpointYear} onChange={(v) => setCost('costRemediationPerEndpointYear', v)} prefix="€" suffix={copy.perEndpointYear} />
                  <Field label={copy.residualHardware} help={copy.helpResidualHardware} value={state.residuals.residualHardwareInfra} onChange={(v) => setResidual('residualHardwareInfra', v)} prefix="€" suffix={copy.perYear} />
                  <Field label={copy.residualServices} help={copy.helpResidualServices} value={state.residuals.residualServices} onChange={(v) => setResidual('residualServices', v)} prefix="€" suffix={copy.perYear} />
                </div>
              </SectionCard>
            )}
          </div>
        )}

        {model.warnings.length > 0 && (
          <SectionCard
            className="mb-4"
            title={copy.warningsTitle}
            subtitle={copy.warningsSubtitle}
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
          <Kpi title={copy.usersKpi} value={String(model.users)} hint={copy.usersKpiHint} />
          <Kpi title={copy.remoteUsers} value={String(Math.round(model.remoteUsers))} hint={copy.remoteUsersHint} />
        </div>

        <div className="mt-3 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600">
          {copy.kpiNote}
        </div>

        <button onClick={() => setView('compatibility')} className="mt-4 w-full rounded-3xl border border-blue-200 bg-blue-50 p-5 text-left shadow-sm transition hover:border-blue-300 hover:bg-blue-100">
          <p className="text-xs font-semibold uppercase tracking-wide text-blue-800">{t('Planning migrazione workload', 'Workload migration planning')}</p>
          <p className="mt-2 text-lg font-semibold text-slate-950">{t('Prima di migrare tutti gli host, verifica quali software sono compatibili con XenServer hypervisor.', 'Before migrating all hosts, verify which software is compatible with the XenServer hypervisor.')}</p>
          <p className="mt-1 text-sm text-slate-600">{t(`Workload migrabili impostati al ${model.migratableWorkloadPct}%. Costo annuo del vecchio virtualizzatore mantenuto nello scenario HMC: ${eur(model.retainedLegacyHypervisorAnnual, lang)}.`, `Migratable workloads set to ${model.migratableWorkloadPct}%. Annual legacy virtualizer cost retained in the HMC scenario: ${eur(model.retainedLegacyHypervisorAnnual, lang)}.`)}</p>
        </button>

        <div className="mt-6 grid gap-6 xl:grid-cols-[1.1fr,0.9fr]">
          <SectionCard
            title={copy.dashTitle}
            subtitle={copy.dashSubtitle}
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
            title={copy.breakdownTitle}
            subtitle={copy.breakdownSubtitle}
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
                      {item.key === 'endpoint' || item.key === 'hypervisor' || item.key === 'access' ? (
                        <button
                          type="button"
                          onClick={() => setView(item.key === 'endpoint' ? 'endpointCompatibility' : item.key === 'access' ? 'netscalerDetail' : 'compatibility')}
                          className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-900"
                          title={item.key === 'endpoint' ? t('Apri la verifica compatibilità endpoint eLux', 'Open the eLux endpoint compatibility checker') : item.key === 'access' ? t('Apri il dettaglio funzionalità NetScaler', 'Open the NetScaler capability detail') : t('Apri la verifica compatibilità XenServer hypervisor', 'Open the XenServer hypervisor compatibility checker')}
                        >
                          {item.name}
                        </button>
                      ) : (
                        <p className="font-medium">{item.name}</p>
                      )}
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
          title={copy.detailsTitle}
          subtitle={copy.detailsSubtitle}
        >
          {hoveredRowKey && hmcInfo[hoveredRowKey] ? (
            <div className="mb-4 rounded-2xl border border-blue-200 bg-blue-50 p-3 text-sm">
              <p className="font-semibold text-blue-900">
                {copy.hmcFeature}: {hmcInfo[hoveredRowKey].feature}
                {hoveredRowKey === 'hypervisor' ? (
                  <button
                    type="button"
                    onClick={() => setView('compatibility')}
                    className="ml-2 rounded-full border border-blue-300 bg-white px-3 py-1 text-xs font-semibold text-blue-700 hover:bg-blue-100"
                  >
                    {t('Verifica compatibilità XenServer', 'Check XenServer compatibility')}
                  </button>
                ) : null}
              </p>
              <p className="mt-1 text-blue-800">
                {copy.description}: {hmcInfo[hoveredRowKey].description}
              </p>
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 text-left text-slate-600">
                  <th className="py-2 pr-4">{copy.item}</th>
                  <th className="py-2 pr-4">{copy.asIs}</th>
                  <th className="py-2 pr-4">{copy.hmc}</th>
                  <th className="py-2">{copy.difference}</th>
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
                    <td className="py-2 pr-4">
                      {row.key === 'endpoint' || row.key === 'hypervisor' || row.key === 'access' ? (
                        <button
                          type="button"
                          onClick={() => setView(row.key === 'endpoint' ? 'endpointCompatibility' : row.key === 'access' ? 'netscalerDetail' : 'compatibility')}
                          className="font-medium text-blue-700 underline decoration-blue-300 underline-offset-4 hover:text-blue-900"
                          title={row.key === 'endpoint' ? t('Apri la verifica compatibilità endpoint eLux', 'Open the eLux endpoint compatibility checker') : row.key === 'access' ? t('Apri il dettaglio funzionalità NetScaler', 'Open the NetScaler capability detail') : t('Apri la verifica compatibilità XenServer hypervisor', 'Open the XenServer hypervisor compatibility checker')}
                        >
                          {rowLabels[row.key]}
                        </button>
                      ) : rowLabels[row.key]}
                    </td>
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
            {copy.methodNote}
          </p>
        </SectionCard>
      </div>
    </div>
  );
}
