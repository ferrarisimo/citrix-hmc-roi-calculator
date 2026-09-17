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
import { CustomerAssessment, AssessmentSummary, OpportunityPlanner, OpportunityTable, Input, Card, wording, buttonStyle } from './AssessmentWorkflow';
import { calculateCustomerScenario, calculateNewBusinessCosts } from './models/customerAssessmentModel';
import RenewalAssessmentView from './RenewalAssessmentView';

const localeByLanguage = { it: 'it-IT', en: 'en-US', es: 'es-ES', de: 'de-DE' };

const ES_INLINE = {
  'Back to ROI calculator': 'Volver a la calculadora ROI',
  'XenServer workload compatibility checker': 'Verificador de compatibilidad de workloads XenServer',
  'This view is only about compatibility with XenServer as the hypervisor. It is not a compatibility matrix for Citrix Virtual Apps and Desktops, NetScaler, or other HMC capabilities.': 'Esta vista trata exclusivamente la compatibilidad con XenServer como hypervisor. No representa una matriz para Citrix Virtual Apps and Desktops, NetScaler u otras funcionalidades HMC.',
  'Listed solutions': 'Soluciones listadas', 'Data loaded from the separately updateable CSV.': 'Datos leídos desde el CSV separado y actualizable.',
  'Supported': 'Soportadas', 'Records with Supported status.': 'Registros con estado Supported.', 'Average index': 'Índice medio', 'Simple average of indexes in the file.': 'Media simple de los índices del archivo.',
  'XenServer Hardware Compatibility List': 'Hardware Compatibility List XenServer', 'Check hardware compatibility directly on the official XenServer list.': 'Verifica la compatibilidad hardware directamente en la lista oficial de XenServer.',
  'The hardware compatibility list must be verified on the XenServer site to confirm support for specific servers, components, and configurations.': 'La lista de compatibilidad hardware debe verificarse en el sitio de XenServer para confirmar el soporte de servidores, componentes y configuraciones específicos.',
  'Open XenServer HCL': 'Abrir HCL XenServer', 'Search XenServer Software Compatibility List': 'Buscar en la Software Compatibility List XenServer',
  'Filter by vendor, product, category, or support status.': 'Filtra por vendor, producto, categoría o estado de soporte.', 'Search vendor or product...': 'Buscar vendor o producto...', 'All categories': 'Todas las categorías', 'All statuses': 'Todos los estados',
  'eLux 7 convertible endpoint compatibility checker': 'Verificador de compatibilidad de endpoints convertibles a eLux 7',
  'Use this view to validate the ROI model assumption that compatible PCs and thin clients can be converted to eLux.': 'Usa esta vista para validar el supuesto del modelo ROI de que los PC y thin clients compatibles pueden convertirse a eLux.',
  'Generic PC profile convertible to eLux 7': 'Perfil de PC genérico convertible a eLux 7', 'Key characteristics to use as the minimum assessment prerequisite.': 'Características principales que se usan como requisito mínimo de evaluación.',
  'Target operating system': 'Sistema operativo objetivo', 'Device conversion to an eLux-managed endpoint.': 'Conversión del dispositivo a endpoint gestionado con eLux.', 'Processor': 'Procesador', 'Required architecture for the generic PC.': 'Arquitectura requerida para el PC genérico.', 'RAM memory': 'Memoria RAM', 'Minimum threshold indicated for conversion.': 'Umbral mínimo indicado para la conversión.',
  'Certified thin-client hardware convertible to eLux': 'Hardware thin client certificado convertible a eLux', 'Filter by vendor, model, CPU, notes, or eLux release.': 'Filtra por vendor, modelo, CPU, notas o release eLux.', 'Search model, CPU, or notes...': 'Buscar modelo, CPU o notas...', 'All vendors': 'Todos los vendors', 'All eLux releases': 'Todas las releases eLux', 'Model': 'Modelo', 'Notes': 'Notas',
  'NetScaler capabilities included with HMC': 'Funcionalidades NetScaler incluidas con HMC', 'Detail view to qualify which NetScaler capabilities can contribute to appliance, VPN, load-balancing, application-security, and observability consolidation.': 'Vista de detalle para cualificar qué funcionalidades NetScaler contribuyen a consolidar appliances, VPN, balanceo, seguridad aplicativa y observabilidad.',
  'HMC note for NetScaler': 'Nota HMC para NetScaler', 'The Citrix Universal Hybrid Multi-Cloud subscription includes NetScaler Premium for application delivery and security: LB, SSL Offload, WAF, IP Reputation, and other capabilities, with up to 999 VPX/MPX/SDX/FIPS instances and 1000 Gbps aggregate throughput.': 'La suscripción Citrix Universal Hybrid Multi-Cloud incluye NetScaler Premium para delivery aplicativo y seguridad: LB, SSL Offload, WAF, IP Reputation y otras funcionalidades, hasta 999 instancias VPX/MPX/SDX/FIPS y 1000 Gbps de throughput agregado.',
  'NetScaler capability catalog': 'Catálogo de funcionalidades NetScaler', 'Filter capabilities by category, scope, or free text.': 'Filtra funcionalidades por categoría, ámbito o texto libre.', 'Search capability or benefit...': 'Buscar funcionalidad o beneficio...', 'All scopes': 'Todos los ámbitos', 'Category': 'Categoría', 'Subcategory': 'Subcategoría', 'Capability': 'Funcionalidad', 'Description': 'Descripción', 'Main benefit': 'Beneficio principal', 'Scope': 'Ámbito',
  'Check XenServer compatibility': 'Verificar compatibilidad XenServer', '% workloads migratable to XenServer': '% workloads migrables a XenServer',
  'Lower this value if the compatibility check shows that some workloads must remain on the existing virtualizer: the model retains a proportional share of existing hypervisor costs.': 'Reduce este valor si la verificación de compatibilidad muestra que algunos workloads deben permanecer en el virtualizador actual: el modelo conserva una cuota proporcional de los costes hypervisor existentes.',
  'Total current cost over the selected project period.': 'Coste total actual en todo el periodo de proyecto seleccionado.', 'Total HMC cost over the selected project period, including the initial project cost in year one.': 'Coste total HMC en el periodo seleccionado, incluido el coste inicial de proyecto en el primer año.', 'Difference between current TCO and HMC TCO over the selected project period.': 'Diferencia entre TCO actual y TCO HMC en el periodo seleccionado.', 'Gross avoided costs over the period.': 'Costes brutos evitados durante el periodo.', 'Total net saving over the project horizon.': 'Ahorro neto total en el horizonte del proyecto.', 'Project TCO delta / HMC project TCO.': 'Delta TCO proyecto / TCO HMC proyecto.', 'Annual cost per user in the current scenario.': 'Coste anual por usuario en el escenario actual.', 'Annual cost per user in the HMC scenario.': 'Coste anual por usuario en el escenario HMC.', 'Annual per-user difference between current and HMC scenario.': 'Diferencia anual por usuario entre escenario actual y HMC.',
  'Workload migration planning': 'Planificación de migración de workloads', 'Before migrating all hosts, verify which software is compatible with the XenServer hypervisor.': 'Antes de migrar todos los hosts, verifica qué software es compatible con XenServer hypervisor.',
  'Open the eLux endpoint compatibility checker': 'Abrir el verificador de compatibilidad endpoint eLux', 'Open the NetScaler capability detail': 'Abrir el detalle de funcionalidades NetScaler', 'Open the XenServer hypervisor compatibility checker': 'Abrir el verificador de compatibilidad XenServer hypervisor',
  'Item': 'Concepto', 'As-Is': 'As-Is', 'Delta': 'Delta', 'Project total': 'Total del proyecto', 'Initial project cost (year 1 only)': 'Coste inicial del proyecto (solo año 1)', 'HMC subscription': 'Suscripción HMC', 'Residual hardware / infra': 'Hardware / infra residual', 'Residual services': 'Servicios residuales'
};

const DE_INLINE = {
  'Back to ROI calculator': 'Zurück zum ROI-Rechner',
  'XenServer workload compatibility checker': 'XenServer Workload-Kompatibilitätsprüfung',
  'This view is only about compatibility with XenServer as the hypervisor. It is not a compatibility matrix for Citrix Virtual Apps and Desktops, NetScaler, or other HMC capabilities.': 'Diese Ansicht betrifft ausschließlich die Kompatibilität mit XenServer als Hypervisor. Sie ist keine Kompatibilitätsmatrix für Citrix Virtual Apps and Desktops, NetScaler oder andere HMC-Funktionen.',
  'Listed solutions': 'Erfasste Lösungen', 'Data loaded from the separately updateable CSV.': 'Daten aus separat aktualisierbaren CSV-Dateien.',
  'Supported': 'Unterstützt', 'Records with Supported status.': 'Datensätze mit Status Supported.', 'Average index': 'Durchschnittsindex', 'Simple average of indexes in the file.': 'Einfacher Durchschnitt der Indizes in der Datei.',
  'XenServer Hardware Compatibility List': 'XenServer Hardware Compatibility List', 'Check hardware compatibility directly on the official XenServer list.': 'Hardware-Kompatibilität direkt in der offiziellen XenServer-Liste prüfen.',
  'The hardware compatibility list must be verified on the XenServer site to confirm support for specific servers, components, and configurations.': 'Die Hardware Compatibility List muss auf der XenServer-Website geprüft werden, um die Unterstützung spezifischer Server, Komponenten und Konfigurationen zu bestätigen.',
  'Open XenServer HCL': 'XenServer HCL öffnen', 'Search XenServer Software Compatibility List': 'XenServer Software Compatibility List durchsuchen',
  'Filter by vendor, product, category, or support status.': 'Nach Hersteller, Produkt, Kategorie oder Supportstatus filtern.', 'Search vendor or product...': 'Hersteller oder Produkt suchen...', 'All categories': 'Alle Kategorien', 'All statuses': 'Alle Status',
  'eLux 7 convertible endpoint compatibility checker': 'Kompatibilitätsprüfung für zu eLux 7 konvertierbare Endpoints',
  'Use this view to validate the ROI model assumption that compatible PCs and thin clients can be converted to eLux.': 'Diese Ansicht validiert die ROI-Annahme, dass kompatible PCs und Thin Clients zu eLux konvertiert werden können.',
  'Generic PC profile convertible to eLux 7': 'Generisches zu eLux 7 konvertierbares PC-Profil', 'Key characteristics to use as the minimum assessment prerequisite.': 'Kerneigenschaften als Mindestvoraussetzung für die Bewertung.',
  'Target operating system': 'Zielbetriebssystem', 'Device conversion to an eLux-managed endpoint.': 'Gerätekonvertierung zu einem eLux-verwalteten Endpoint.', 'Processor': 'Prozessor', 'Required architecture for the generic PC.': 'Erforderliche Architektur für den generischen PC.', 'RAM memory': 'RAM-Speicher', 'Minimum threshold indicated for conversion.': 'Angegebene Mindestanforderung für die Konvertierung.',
  'Certified thin-client hardware convertible to eLux': 'Zertifizierte zu eLux konvertierbare Thin-Client-Hardware', 'Filter by vendor, model, CPU, notes, or eLux release.': 'Nach Hersteller, Modell, CPU, Notizen oder eLux-Release filtern.', 'Search model, CPU, or notes...': 'Modell, CPU oder Notizen suchen...', 'All vendors': 'Alle Hersteller', 'All eLux releases': 'Alle eLux-Releases', 'Model': 'Modell', 'Notes': 'Notizen',
  'NetScaler capabilities included with HMC': 'In HMC enthaltene NetScaler-Funktionen', 'Detail view to qualify which NetScaler capabilities can contribute to appliance, VPN, load-balancing, application-security, and observability consolidation.': 'Detailansicht zur Bewertung, welche NetScaler-Funktionen zur Konsolidierung von Appliances, VPN, Load Balancing, Anwendungssicherheit und Observability beitragen.',
  'HMC note for NetScaler': 'HMC-Hinweis zu NetScaler', 'The Citrix Universal Hybrid Multi-Cloud subscription includes NetScaler Premium for application delivery and security: LB, SSL Offload, WAF, IP Reputation, and other capabilities, with up to 999 VPX/MPX/SDX/FIPS instances and 1000 Gbps aggregate throughput.': 'Die Citrix Universal Hybrid Multi-Cloud Subscription enthält NetScaler Premium für Application Delivery und Security: LB, SSL Offload, WAF, IP Reputation und weitere Funktionen, mit bis zu 999 VPX/MPX/SDX/FIPS-Instanzen und 1000 Gbit/s aggregiertem Durchsatz.',
  'NetScaler capability catalog': 'NetScaler-Funktionskatalog', 'Filter capabilities by category, scope, or free text.': 'Funktionen nach Kategorie, Scope oder Freitext filtern.', 'Search capability or benefit...': 'Funktion oder Nutzen suchen...', 'All scopes': 'Alle Scopes', 'Category': 'Kategorie', 'Subcategory': 'Unterkategorie', 'Capability': 'Funktion', 'Description': 'Beschreibung', 'Main benefit': 'Hauptnutzen', 'Scope': 'Scope',
  'Check XenServer compatibility': 'XenServer-Kompatibilität prüfen', '% workloads migratable to XenServer': '% zu XenServer migrierbare Workloads',
  'Lower this value if the compatibility check shows that some workloads must remain on the existing virtualizer: the model retains a proportional share of existing hypervisor costs.': 'Reduzieren Sie diesen Wert, wenn die Kompatibilitätsprüfung zeigt, dass einige Workloads auf dem bestehenden Virtualisierer bleiben müssen: Das Modell behält einen proportionalen Anteil der bestehenden Hypervisor-Kosten bei.',
  'Total current cost over the selected project period.': 'Aktuelle Gesamtkosten über den ausgewählten Projektzeitraum.', 'Total HMC cost over the selected project period, including the initial project cost in year one.': 'HMC-Gesamtkosten über den ausgewählten Projektzeitraum einschließlich initialer Projektkosten im ersten Jahr.', 'Difference between current TCO and HMC TCO over the selected project period.': 'Differenz zwischen aktuellem TCO und HMC-TCO über den ausgewählten Projektzeitraum.', 'Gross avoided costs over the period.': 'Brutto vermiedene Kosten über den Zeitraum.', 'Total net saving over the project horizon.': 'Gesamte Nettoeinsparung über den Projekthorizont.', 'Project TCO delta / HMC project TCO.': 'Projekt-TCO-Delta / HMC-Projekt-TCO.', 'Annual cost per user in the current scenario.': 'Jährliche Kosten pro Benutzer im aktuellen Szenario.', 'Annual cost per user in the HMC scenario.': 'Jährliche Kosten pro Benutzer im HMC-Szenario.', 'Annual per-user difference between current and HMC scenario.': 'Jährliche Differenz pro Benutzer zwischen aktuellem und HMC-Szenario.',
  'Workload migration planning': 'Workload-Migrationsplanung', 'Before migrating all hosts, verify which software is compatible with the XenServer hypervisor.': 'Vor der Migration aller Hosts prüfen, welche Software mit dem XenServer-Hypervisor kompatibel ist.',
  'Open the eLux endpoint compatibility checker': 'eLux Endpoint-Kompatibilitätsprüfung öffnen', 'Open the NetScaler capability detail': 'NetScaler-Funktionsdetails öffnen', 'Open the XenServer hypervisor compatibility checker': 'XenServer Hypervisor-Kompatibilitätsprüfung öffnen',
  'Item': 'Position', 'As-Is': 'As-Is', 'Delta': 'Delta', 'Project total': 'Projektsumme', 'Initial project cost (year 1 only)': 'Initiale Projektkosten (nur Jahr 1)', 'HMC subscription': 'HMC-Subscription', 'Residual hardware / infra': 'Rest-Hardware / Infra', 'Residual services': 'Rest-Services'
};


const translate = (lang, itText, enText, esText, deText) => {
  if (lang === 'it') return itText;
  if (lang === 'es') return esText ?? ES_INLINE[enText] ?? enText;
  if (lang === 'de') return deText ?? DE_INLINE[enText] ?? enText;
  return enText;
};

const eur = (value, lang = 'it', digits = 0) =>
  new Intl.NumberFormat(localeByLanguage[lang] ?? 'en-US', {
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
  },
  residuals: {
    residualHardwareInfra: 0,
    residualServices: 0,
  },
  renewal: {
    profile: {
      renewalType: 'HMC',
      numberLicenses: 1000,
      renewalYears: 3,
      totalRenewalCost: 1260000,
      previousRenewalCost: 1200000,
      previousRenewalYears: 3,
    },
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

class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMessage: '' };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, errorMessage: error?.message || 'Unknown error' };
  }

  componentDidCatch(error) {
    console.error(error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <SectionCard title="Errore applicativo" subtitle="La sezione non può essere mostrata a causa di un errore di rendering.">
          <p className="text-sm leading-6 text-slate-700">
            Aggiorna la pagina per caricare l’ultima versione dell’applicazione. Dettaglio errore: {this.state.errorMessage}
          </p>
        </SectionCard>
      );
    }

    return this.props.children;
  }
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
  if (!rows.length) return [];
  const headers = parseCsvLine(rows[0], delimiter);
  return rows.slice(1)
    .filter((line) => !line.startsWith(`vendor_name${delimiter}`) && !line.startsWith(`vendor${delimiter}`) && !line.startsWith(`id${delimiter}`))
    .map((line) => {
      const values = parseCsvLine(line, delimiter);
      return headers.reduce((record, header, index) => ({ ...record, [header]: values[index] || '' }), {});
    });
};

const indexRowsById = (rows) => rows.reduce((index, row) => ({ ...index, [row.id]: row }), {});

const mergeLocalizedRows = (baseRows, localizedRows, fallbackRows = []) => {
  const localizedById = indexRowsById(localizedRows);
  const fallbackById = indexRowsById(fallbackRows);
  return baseRows.map((row) => ({
    ...row,
    ...(fallbackById[row.id] || {}),
    ...(localizedById[row.id] || {}),
  }));
};

const loadLocalizedCsvDataset = async ({ basePath, i18nPath, lang, delimiter = ',', fallbackLang = 'en' }) => {
  const baseUrl = import.meta.env.BASE_URL;
  const [baseText, localizedText, fallbackText] = await Promise.all([
    fetch(`${baseUrl}${basePath}`).then((response) => response.text()),
    fetch(`${baseUrl}${i18nPath}.${lang}.csv`).then((response) => response.ok ? response.text() : ''),
    lang === fallbackLang ? Promise.resolve('') : fetch(`${baseUrl}${i18nPath}.${fallbackLang}.csv`).then((response) => response.ok ? response.text() : ''),
  ]);
  return mergeLocalizedRows(
    parseCompatibilityCsv(baseText, delimiter),
    localizedText ? parseCompatibilityCsv(localizedText, delimiter) : [],
    fallbackText ? parseCompatibilityCsv(fallbackText, delimiter) : []
  );
};

function CompatibilityView({ lang, onBack }) {
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [status, setStatus] = useState('all');

  useEffect(() => {
    loadLocalizedCsvDataset({ basePath: 'data/xenserver/scl.csv', i18nPath: 'data/xenserver/scl.i18n', lang })
      .then(setItems)
      .catch(() => setItems([]));
  }, [lang]);

  const t = (itText, enText, esText) => translate(lang, itText, enText, esText);
  const categories = [...new Map(items.filter((item) => item.category_key).map((item) => [item.category_key, item.category_label || item.category_key])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const statuses = [...new Map(items.filter((item) => item.regulatory_status_key).map((item) => [item.regulatory_status_key, item.regulatory_status_label || item.regulatory_status_key])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const filteredItems = items.filter((item) => {
    const haystack = `${item.vendor_name} ${item.product_name} ${item.category_label} ${item.short_description} ${item.regulatory_status_label}`.toLowerCase();
    return (category === 'all' || item.category_key === category) &&
      (status === 'all' || item.regulatory_status_key === status) &&
      haystack.includes(query.toLowerCase());
  });

  const supportedCount = items.filter((item) => item.regulatory_status_key === 'supported').length;
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
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutte le categorie', 'All categories')}</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={status} onChange={(event) => setStatus(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutti gli stati', 'All statuses')}</option>{statuses.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <div className="mt-5 overflow-x-auto">
            <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th className="py-3 pr-4">Vendor</th><th className="py-3 pr-4">Product</th><th className="py-3 pr-4">Category</th><th className="py-3 pr-4">Status</th><th className="py-3 pr-4">Index</th><th className="py-3">Evidence</th></tr></thead><tbody>{filteredItems.map((item) => (<tr key={`${item.vendor_name}-${item.product_name}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-semibold">{item.vendor_name}</td><td className="py-3 pr-4"><p className="font-medium">{item.product_name}</p><p className="mt-1 text-xs text-slate-500">{item.short_description}</p></td><td className="py-3 pr-4">{item.category_label}</td><td className="py-3 pr-4"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.regulatory_status_label}</span></td><td className="py-3 pr-4 font-semibold">{item.compatibility_index}/100</td><td className="py-3"><p className="text-xs text-slate-600">{item.evidence_summary}</p><a href={(item.source_urls || '').split(' | ')[0]} target="_blank" rel="noreferrer" className="mt-2 inline-block text-xs font-semibold text-blue-700 hover:text-blue-900">Source</a></td></tr>))}</tbody></table>
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
  const t = (itText, enText, esText) => translate(lang, itText, enText, esText);

  useEffect(() => {
    loadLocalizedCsvDataset({ basePath: 'data/elux/hcl.csv', i18nPath: 'data/elux/hcl.i18n', lang })
      .then(setItems)
      .catch(() => setItems([]));
  }, [lang]);

  const vendors = [...new Set(items.map((item) => item.vendor).filter(Boolean))].sort();
  const releases = [...new Set(items.flatMap((item) => (item.elux_release || '').split(';').map((value) => value.trim()).filter(Boolean)))].sort();
  const filteredItems = items.filter((item) => {
    const haystack = `${item.vendor} ${item.model} ${item.cpu} ${item.notes} ${item.elux_release}`.toLowerCase();
    return (vendor === 'all' || item.vendor === vendor) &&
      (release === 'all' || (item.elux_release || '').includes(release)) &&
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
            <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th className="py-3 pr-4">Vendor</th><th className="py-3 pr-4">{t('Modello', 'Model')}</th><th className="py-3 pr-4">CPU</th><th className="py-3 pr-4">{t('Note', 'Notes')}</th><th className="py-3">eLux release</th></tr></thead><tbody>{filteredItems.map((item, index) => (<tr key={`${item.vendor}-${item.model}-${item.cpu}-${index}`} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-semibold">{item.vendor}</td><td className="py-3 pr-4 font-medium">{item.model}</td><td className="py-3 pr-4">{item.cpu || '—'}</td><td className="py-3 pr-4 text-slate-600">{item.notes || '—'}</td><td className="py-3">{item.elux_release}</td></tr>))}</tbody></table>
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
  const t = (itText, enText, esText) => translate(lang, itText, enText, esText);

  useEffect(() => {
    loadLocalizedCsvDataset({ basePath: 'data/netscaler/features.csv', i18nPath: 'data/netscaler/features.i18n', lang })
      .then(setItems)
      .catch(() => setItems([]));
  }, [lang]);

  const categories = [...new Map(items.filter((item) => item.category_key).map((item) => [item.category_key, item.category_label || item.category_key])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const scopes = [...new Map(items.filter((item) => item.scope_key).map((item) => [item.scope_key, item.scope_label || item.scope_key])).entries()].sort((a, b) => a[1].localeCompare(b[1]));
  const filteredItems = items.filter((item) => {
    const haystack = `${item.category_label} ${item.subcategory_label} ${item.capability_label} ${item.description} ${item.main_benefit} ${item.scope_label}`.toLowerCase();
    return (category === 'all' || item.category_key === category) &&
      (scope === 'all' || item.scope_key === scope) &&
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
            <select value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutte le categorie', 'All categories')}</option>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
            <select value={scope} onChange={(event) => setScope(event.target.value)} className="rounded-2xl border border-slate-300 px-4 py-2.5 text-sm"><option value="all">{t('Tutti gli ambiti', 'All scopes')}</option>{scopes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
          </div>
          <p className="mb-3 text-xs text-slate-500">{t(`${filteredItems.length} risultati su ${items.length} funzionalità censite.`, `${filteredItems.length} results out of ${items.length} listed capabilities.`)}</p>
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm"><thead><tr className="border-b text-left text-slate-600"><th className="py-3 pr-4">{t('Categoria', 'Category')}</th><th className="py-3 pr-4">{t('Sottocategoria', 'Subcategory')}</th><th className="py-3 pr-4">{t('Funzionalità', 'Capability')}</th><th className="py-3 pr-4">{t('Descrizione', 'Description')}</th><th className="py-3 pr-4">{t('Beneficio principale', 'Main benefit')}</th><th className="py-3">{t('Ambito', 'Scope')}</th></tr></thead><tbody>{filteredItems.map((item) => (<tr key={item.id} className="border-b border-slate-100 align-top"><td className="py-3 pr-4 font-semibold">{item.category_label}</td><td className="py-3 pr-4">{item.subcategory_label}</td><td className="py-3 pr-4 font-medium">{item.capability_label}</td><td className="py-3 pr-4 text-slate-600">{item.description}</td><td className="py-3 pr-4 text-slate-600">{item.main_benefit}</td><td className="py-3"><span className="rounded-full bg-slate-100 px-2.5 py-1 text-xs font-semibold text-slate-700">{item.scope_label}</span></td></tr>))}</tbody></table>
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


function ScenarioReport({ lang, state, model, rowLabels, opportunityModel }) {
  const t = wording(lang);
  return <article className="print-report"><header className="report-hero"><h1>New Business ROI</h1><p>{t('Profilo progetto', 'Project profile')}: {model.projectYears} {t('anni', 'years')} · HMC {eur(state.profile.hmcPricePerUserPerMonth, lang)} / {t('utente/mese', 'user/month')} · {t('Migrazione e interventi', 'Migration and implementation')}: {eur(model.migrationCostOneTime, lang)}</p><p>{(opportunityModel.complete && opportunityModel.baselineComplete) ? t('Scenario completato', 'Scenario complete') : t('SIMULAZIONE PARZIALE — assessment o obiettivi incompleti', 'PARTIAL SIMULATION — assessment or targets incomplete')}</p></header><OpportunityTable model={opportunityModel} lang={lang} /><h2>{t('Confronto economico sul periodo', 'Economic comparison over term')}</h2><table><thead><tr><th>{t('Voce', 'Item')}</th><th>As-Is</th><th>HMC</th><th>Delta</th></tr></thead><tbody>{model.tableRows.map((row) => <tr key={row.key}><td>{rowLabels[row.key]}</td><td>{eur(row.asIs, lang)}</td><td>{eur(row.hmc, lang)}</td><td>{eur(row.delta, lang)}</td></tr>)}<tr className="report-total"><td>{t('Totale', 'Total')}</td><td>{eur(model.totalAsIs, lang)}</td><td>{eur(model.totalHmc, lang)}</td><td>{eur(model.projectDelta, lang)}</td></tr></tbody></table></article>;
}

function ModeSelector({ mode, onChange, t }) {
  const options = [
    { value: 'assessment', label: t('Assessment cliente', 'Customer assessment', 'Assessment cliente', 'Kunden-Assessment') },
    { value: 'newBusiness', label: 'New Business ROI' },
    { value: 'renewal', label: 'Renewal Value' },
  ];

  return (
    <div className="flex flex-wrap gap-2 rounded-2xl border border-white/20 bg-white/10 p-1">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-xl px-3 py-1.5 text-xs font-semibold transition ${mode === option.value ? 'bg-white text-slate-950 shadow-sm' : 'text-white hover:bg-white/10'}`}
          aria-pressed={mode === option.value}
        >
          {t(option.label, option.label)}
        </button>
      ))}
    </div>
  );
}


export default function App() {
  const [state, setState] = useState(DEFAULTS);
  const [renewalProfile, setRenewalProfile] = useState(DEFAULTS.renewal.profile);
  const [renewalPlans, setRenewalPlans] = useState({});
  const [businessPlans, setBusinessPlans] = useState({});
  const [lang, setLang] = useState(detectBrowserLanguage());
  const [hoveredRowKey, setHoveredRowKey] = useState(null);
  const [showDisclaimer, setShowDisclaimer] = useState(false);
  const [view, setView] = useState('roi');
  const [calculatorMode, setCalculatorMode] = useState('assessment');
  const copy = LABELS[lang];
  const t = (it, en, es, de) => translate(lang, it, en, es, de);

  const setProfile = (key, value) => setState((s) => ({ ...s, profile: { ...s.profile, [key]: value } }));
  const businessModel = useMemo(() => calculateCustomerScenario(state, businessPlans, 'HMC', state.profile.horizonYears, 0, 'newBusiness'), [state, businessPlans]);

  const model = useMemo(() => {
    const { tech } = state;

    const users = Math.max(tech.numberUsers, 0);
    const remoteUsers = Math.floor(users * (tech.pctRemoteHybridUsers / 100));
    const totalCores = tech.numberHosts * tech.coresPerHost;
    const { asIs, hmc, annualRows, tableRows, migrationCostOneTime, projectYears } = calculateNewBusinessCosts(state, businessModel);
    const totalAsIsAnnual = annualRows.reduce((sum, row) => sum + row.asIs, 0);
    const totalHmcAnnual = annualRows.reduce((sum, row) => sum + row.hmc, 0);
    const annualDelta = totalAsIsAnnual - totalHmcAnnual;

    const totalAsIs = tableRows.reduce((sum, row) => sum + row.asIs, 0);
    const totalHmc = tableRows.reduce((sum, row) => sum + row.hmc, 0);
    const projectDelta = totalAsIs - totalHmc;
    const grossAvoided = businessModel.periodSaving;
    const roiAnnual = totalHmc > 0 ? projectDelta / totalHmc : null;

    const asIsCostPerUserPerYear = users > 0 ? totalAsIs / projectYears / users : 0;
    const hmcCostPerUserPerYear = users > 0 ? totalHmc / projectYears / users : 0;
    const perUserPerYearDelta = asIsCostPerUserPerYear - hmcCostPerUserPerYear;

    const warnings = [];
    if (tech.numberUsers <= 0) warnings.push(copy.validationUsersPositive);
    if (tech.numberPc > tech.numberUsers * 1.4)
      warnings.push(
        copy.validationPcHigh
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
      migratableWorkloadPct: businessModel.rows.find((row) => row.id === 'xenserver')?.targetPct ?? 0,
      tableRows,
    };
  }, [state, lang, businessModel, businessPlans]);

  const rowLabels = {
    endpoint: t('Endpoint (PC/thin client)', 'Endpoint (PC/thin client)', 'Endpoint (PC/thin client)', 'Endpoint (PC/Thin Client)'),
    hypervisor: t('Hypervisor', 'Hypervisor', 'Hypervisor', 'Hypervisor'),
    access: t('Access / NetScaler / ADC', 'Access / NetScaler / ADC', 'Acceso / NetScaler / ADC', 'Access / NetScaler / ADC'),
    mfa: t('Security - MFA', 'Security - MFA', 'Seguridad - MFA', 'Security - MFA'),
    ztna: t('Security - ZTNA', 'Security - ZTNA', 'Seguridad - ZTNA', 'Security - ZTNA'),
    edr: t('Security - EDR/XDR', 'Security - EDR/XDR', 'Seguridad - EDR/XDR', 'Security - EDR/XDR'),
    posture: t('Security - Device posture', 'Security - Device posture', 'Seguridad - postura de dispositivo', 'Security - Device Posture'),
    securityServices: t(
      `Security services (SOC, remediation, SecOps ${state.tech.itDaysSecurityOps} giorni/anno)`,
      `Security services (SOC, remediation, SecOps ${state.tech.itDaysSecurityOps} days/year)`,
      `Servicios de seguridad (SOC, remediación, SecOps ${state.tech.itDaysSecurityOps} días/año)`,
      `Security Services (SOC, Remediation, SecOps ${state.tech.itDaysSecurityOps} Tage/Jahr)`
    ),
    opsEndpoint: t(
      `Operations - Endpoint effort (${state.tech.itDaysEndpointMgmt} giorni/anno)`,
      `Operations - Endpoint effort (${state.tech.itDaysEndpointMgmt} days/year)`,
      `Operaciones - esfuerzo endpoint (${state.tech.itDaysEndpointMgmt} días/año)`,
      `Operations - Endpoint-Aufwand (${state.tech.itDaysEndpointMgmt} Tage/Jahr)`
    ),
    opsImage: t(
      `Operations - Image/VDI effort (${state.tech.itDaysImageVdiMgmt} giorni/anno)`,
      `Operations - Image/VDI effort (${state.tech.itDaysImageVdiMgmt} days/year)`,
      `Operaciones - esfuerzo imagen/VDI (${state.tech.itDaysImageVdiMgmt} días/año)`,
      `Operations - Image/VDI-Aufwand (${state.tech.itDaysImageVdiMgmt} Tage/Jahr)`
    ),
    opsSupport: t(
      `Operations - Support effort (${state.tech.itDaysSupport} giorni/anno)`,
      `Operations - Support effort (${state.tech.itDaysSupport} days/year)`,
      `Operaciones - esfuerzo soporte (${state.tech.itDaysSupport} días/año)`,
      `Operations - Support-Aufwand (${state.tech.itDaysSupport} Tage/Jahr)`
    ),
    opsAccess: t(
      `Operations - Access effort (${state.tech.itDaysAccessMgmt} giorni/anno)`,
      `Operations - Access effort (${state.tech.itDaysAccessMgmt} days/year)`,
      `Operaciones - esfuerzo acceso (${state.tech.itDaysAccessMgmt} días/año)`,
      `Operations - Access-Aufwand (${state.tech.itDaysAccessMgmt} Tage/Jahr)`
    ),
    hmcSubscription: t('HMC subscription', 'HMC subscription', 'Suscripción HMC', 'HMC-Subscription'),
    residualHw: t('Residual hardware / infra', 'Residual hardware / infra', 'Hardware / infra residual', 'Rest-Hardware / Infra'),
    residualServices: t('Residual services', 'Residual services', 'Servicios residuales', 'Rest-Services'),
    migrationProject: t('Costo progetto iniziale (solo primo anno)', 'Initial project cost (year 1 only)', 'Coste inicial del proyecto (solo año 1)', 'Initiale Projektkosten (nur Jahr 1)'),
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
      {calculatorMode === 'newBusiness' ? <ScenarioReport lang={lang} state={state} model={model} rowLabels={rowLabels} opportunityModel={businessModel} /> : null}
      <div className="app-shell mx-auto max-w-7xl p-4 md:p-8">
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="bg-gradient-to-r from-slate-950 via-slate-900 to-blue-900 px-6 py-8 text-white rounded-t-3xl">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
                <ModeSelector mode={calculatorMode} onChange={setCalculatorMode} t={t} />
                <div className="flex gap-2">
                  <button onClick={() => setLang('it')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'it' ? 'bg-white/20' : ''}`}>IT</button>
                  <button onClick={() => setLang('en')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'en' ? 'bg-white/20' : ''}`}>EN</button>
                  <button onClick={() => setLang('es')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'es' ? 'bg-white/20' : ''}`}>ES</button>
                  <button onClick={() => setLang('de')} className={`rounded-xl border px-3 py-1 text-xs ${lang === 'de' ? 'bg-white/20' : ''}`}>DE</button>
                </div>
              </div>
              <h1 className="text-3xl font-semibold md:text-4xl">{calculatorMode === 'assessment' ? t('Assessment cliente', 'Customer assessment', 'Assessment cliente', 'Kunden-Assessment') : calculatorMode === 'newBusiness' ? 'New Business ROI' : 'Renewal Value'}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-200">{t('Un assessment condiviso, due percorsi: valutare un nuovo investimento o mitigare i costi del rinnovo completando l’adozione.', 'One shared assessment, two paths: evaluate a new investment or mitigate renewal costs by completing adoption.')}</p>

              {calculatorMode === 'newBusiness' ? <div className="mt-4 flex flex-wrap gap-3">
                <button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  {copy.print}
                </button>
                <button onClick={() => { setProfile('horizonYears', DEFAULTS.profile.horizonYears); setProfile('hmcPricePerUserPerMonth', DEFAULTS.profile.hmcPricePerUserPerMonth); setProfile('initialMigrationCost', DEFAULTS.profile.initialMigrationCost); setBusinessPlans({}); }} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  {copy.reset}
                </button>
                <button onClick={() => setShowDisclaimer((v) => !v)} className="inline-flex items-center gap-2 rounded-2xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm">
                  {copy.disclaimerButton}
                </button>
                <button onClick={() => setView('compatibility')} className="inline-flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-400">
                  {t('Verifica compatibilità XenServer', 'Check XenServer compatibility')}
                </button>
              </div> : null}
            </div>
          </div>
        </motion.div>

        {calculatorMode === 'newBusiness' && showDisclaimer && (
          <SectionCard
            className="mb-6"
            title={copy.disclaimerTitle}
            subtitle={copy.disclaimerSubtitle}
          >
            <p className="text-sm leading-6 text-slate-700">{copy.disclaimerBody}</p>
          </SectionCard>
        )}


        <AppErrorBoundary>
        {calculatorMode === 'assessment' ? (
          <CustomerAssessment state={state} setState={setState} lang={lang} onNavigate={setCalculatorMode} onCompatibility={setView} />
        ) : calculatorMode === 'renewal' ? (
          <RenewalAssessmentView lang={lang} state={state} profile={renewalProfile} setProfile={setRenewalProfile} plans={renewalPlans} setPlans={setRenewalPlans} onEdit={() => setCalculatorMode('assessment')} />
        ) : (
          <>
        <div className="mb-6 space-y-6">
          <Card title={t('Profilo New Business', 'New Business profile')} subtitle={t('Investimento specifico del nuovo progetto. L’assessment e il profilo rinnovo restano separati.', 'Investment specific to the new project. Assessment and renewal profile remain separate.')}>
            <div className="grid gap-5 md:grid-cols-3">
              <label className="block space-y-2 text-sm font-medium text-slate-700">{copy.projectYears}<select className="block w-full rounded-xl border border-slate-300 p-2.5" value={state.profile.horizonYears} onChange={(e) => setProfile('horizonYears', Number(e.target.value))}>{[1,2,3,4,5].map((year) => <option key={year} value={year}>{year}</option>)}</select></label>
              <Input label={t('Prezzo HMC per utente / mese', 'HMC price per user / month')} suffix="€" value={state.profile.hmcPricePerUserPerMonth} onChange={(v) => setProfile('hmcPricePerUserPerMonth', v)} />
              <Input label={copy.initialProjectCost} suffix="€" value={state.profile.initialMigrationCost} onChange={(v) => setProfile('initialMigrationCost', v)} />
            </div>
            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <Input label={copy.residualHardware} value={state.residuals.residualHardwareInfra} suffix={copy.perYear} onChange={(v) => setState((s) => ({ ...s, residuals: { ...s.residuals, residualHardwareInfra: v } }))} />
              <Input label={copy.residualServices} value={state.residuals.residualServices} suffix={copy.perYear} onChange={(v) => setState((s) => ({ ...s, residuals: { ...s.residuals, residualServices: v } }))} />
            </div>
          </Card>
          <AssessmentSummary state={state} lang={lang} onEdit={() => setCalculatorMode('assessment')} />
          <OpportunityPlanner state={state} plans={businessPlans} setPlans={setBusinessPlans} offer="HMC" years={state.profile.horizonYears} lang={lang} onEdit={() => setCalculatorMode('assessment')} newBusiness />
          <Card title={t('Riepilogo adozione e saving', 'Adoption and savings summary')} subtitle={(businessModel.complete && businessModel.baselineComplete) ? t('Scenario completato', 'Scenario complete') : t('Simulazione parziale: completa assessment e obiettivi prima di usare il ROI. Le voci mancanti non generano saving e usano il costo di riferimento.', 'Partial simulation: complete assessment and targets before using ROI. Missing items generate no saving and use reference costs.')}><OpportunityTable model={businessModel} lang={lang} /></Card>
        </div>

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
          <p className="mt-1 text-sm text-slate-600">{t(`Obiettivo host XenServer impostato al ${model.migratableWorkloadPct}%. Costo annuo del vecchio virtualizzatore mantenuto nello scenario HMC: ${eur(model.retainedLegacyHypervisorAnnual, lang)}.`, `XenServer host target set to ${model.migratableWorkloadPct}%. Annual legacy virtualizer cost retained in the HMC scenario: ${eur(model.retainedLegacyHypervisorAnnual, lang)}.`)}</p>
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
          </>
        )}
        </AppErrorBoundary>
      </div>
    </div>
  );
}
