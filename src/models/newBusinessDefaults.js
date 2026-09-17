// These are editable scenario starting points, never guaranteed savings.
// Only IT Endpoint and Support directly map to published effort benchmarks.
const idc = 'https://www.citrix.com/content/dam/citrix/en_us/documents/data-sheet/the-business-value-of-hybrid-citrix-infrastructure.pdf';
const csg = 'https://www.citrix.com/customer-success/csg.html';
const policies = 'https://docs.citrix.com/en-us/security-analytics/policies-and-actions.html';

export const NEW_BUSINESS_SERVICE_DEFAULTS = {
  opsEndpoint: {
    pct: 31, benchmark: true, source: `${idc}#page=17`, sourceLabel: 'IDC 2024 · tab. 5',
    it: 'Riduzione dell’effort di gestione dispositivi osservata nello studio IDC.',
    en: 'Device management effort reduction observed in the IDC study.',
  },
  opsImage: {
    pct: 35, benchmark: false, source: `${idc}#page=14`, sourceLabel: 'IDC 2024 · tab. 3',
    it: 'Ipotesi per Image / VDI basata sul benchmark di gestione infrastruttura; non è una misura specifica per le immagini.',
    en: 'Image / VDI assumption based on the infrastructure management benchmark; not an image-specific measurement.',
  },
  opsSupport: {
    pct: 36, benchmark: true, source: `${idc}#page=15`, sourceLabel: 'IDC 2024 · tab. 4',
    it: 'Riduzione dell’effort help desk osservata nello studio IDC.',
    en: 'Help desk effort reduction observed in the IDC study.',
  },
  opsAccess: {
    pct: 30, benchmark: false, source: `${idc}#page=14`, sourceLabel: 'IDC 2024 · contesto / context',
    it: 'Ipotesi di modello del 30% per la gestione accessi centralizzata, inferiore al benchmark infrastruttura del 35%; da validare sul perimetro.',
    en: 'Model assumption of 30% for centralized access management, below the 35% infrastructure benchmark; validate against the scope.',
  },
  soc: {
    pct: 10, benchmark: false, source: csg, sourceLabel: 'Citrix · CSG',
    it: 'Ipotesi di modello del 10% sulla quota di servizio rinegoziabile. Meno alert non implica una fattura SOC inferiore: usare 0% per contratti fissi non riducibili. Il caso CSG non documenta questa percentuale di costo.',
    en: 'Model assumption of 10% on renegotiable service spend. Fewer alerts do not imply a lower SOC bill: use 0% for fixed contracts that cannot be reduced. The CSG case does not document this cost percentage.',
  },
  remediation: {
    pct: 20, benchmark: false, source: policies, sourceLabel: 'Citrix · Policies and actions',
    it: 'Ipotesi di modello del 20% per attività ripetitive automatizzabili. La documentazione descrive le azioni automatiche, non una percentuale di saving. Escludere attività già incluse nel SOC.',
    en: 'Model assumption of 20% for repetitive tasks eligible for automation. Documentation describes automated actions, not a savings percentage. Exclude tasks already included in SOC.',
  },
  securityOps: {
    pct: 20, benchmark: false, source: csg, sourceLabel: 'Citrix · CSG',
    it: 'Ipotesi di modello del 20% sull’effort operativo, da validare con il team Security. Il caso CSG descrive benefici operativi, non questa riduzione delle giornate. Escludere effort già conteggiato in SOC o remediation.',
    en: 'Model assumption of 20% on operational effort, to validate with the Security team. The CSG case describes operational benefits, not this reduction in days. Exclude effort already counted in SOC or remediation.',
  },
};

export const newBusinessDefaultPct = (id) => NEW_BUSINESS_SERVICE_DEFAULTS[id]?.pct ?? 0;
