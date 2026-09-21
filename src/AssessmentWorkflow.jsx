import React, { useContext, useId, useState } from 'react';
import { FieldHelp, WorkspaceLanguage } from './WorkspaceUI';
import { workspaceText } from './workspaceLabels';
import { assessmentGroups, groupStatus, groupFingerprint, groupComplete } from './assessmentFields';
import { LABELS } from './i18n/labels';
import { calculateCustomerScenario } from './models/customerAssessmentModel';
import { NEW_BUSINESS_SERVICE_DEFAULTS } from './models/newBusinessDefaults';

export const wording = (lang) => (it, en, es = en, de = en) => ({ it, en, es, de }[lang] ?? en);
export const money = (value, lang = 'it') => new Intl.NumberFormat({ it: 'it-IT', en: 'en-US', es: 'es-ES', de: 'de-DE' }[lang] ?? 'en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
export const buttonStyle = 'rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600';
export function Card({ title, subtitle, children }) {
  return <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}</div><div className="p-6">{children}</div></section>;
}
export function Input({ label, value, onChange, suffix, max, step = 'any', testId, placeholder = '—', help }) {
  const id = useId();
  const lang = useContext(WorkspaceLanguage);
  const w = workspaceText(lang);
  const [touched, setTouched] = useState(false);
  const invalid = value !== '' && value != null && (!Number.isFinite(Number(value)) || Number(value) < 0 || (max != null && Number(value) > max) || (step === 1 && !Number.isInteger(Number(value))));
  return <div className="input-field"><div className="field-heading"><label htmlFor={id}>{label}</label><FieldHelp label={label} text={help}/></div><div className="input-wrap"><input id={id} data-testid={testId} type="number" inputMode="decimal" min="0" max={max} step={step} value={value ?? ''} placeholder={placeholder} onBlur={() => setTouched(true)} aria-invalid={touched && invalid ? true : undefined} aria-describedby={touched && invalid ? `${id}-error` : undefined} onChange={(e) => onChange(e.target.value === '' ? '' : Number(e.target.value))} />{suffix && <span className="input-unit">{suffix}</span>}</div>{touched && invalid && <p className="field-error" id={`${id}-error`}>{w('invalid')} {max != null ? `(0–${max})` : '(≥ 0)'}{step === 1 ? ' · 0, 1, 2…' : ''}</p>}</div>;
}
export function Metric({ label, value, hint, testId }) {
  return <div data-testid={testId} className="rounded-2xl bg-slate-50 p-4"><p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p><p className="mt-2 text-xl font-semibold text-slate-950">{value}</p>{hint && <p className="mt-2 text-xs leading-5 text-slate-500">{hint}</p>}</div>;
}

function ServiceDefaultNote({ id, lang, compact = false }) {
  const preset = NEW_BUSINESS_SERVICE_DEFAULTS[id];
  if (!preset) return null;
  const t = wording(lang);
  return <p className="text-xs font-normal leading-5 text-slate-600">
    <strong>{t('Default', 'Default')} {preset.pct}% · {preset.benchmark ? t('Benchmark osservato', 'Observed benchmark') : t('Ipotesi da validare', 'Assumption to validate')}</strong>. {!compact && (lang === 'it' ? preset.it : preset.en)}
    {' '}<a href={preset.source} target="_blank" rel="noreferrer" className="text-blue-700 underline">{preset.sourceLabel}</a>
  </p>;
}
export function unitLabel(unit, t) {
  return { units: t('unità', 'units', 'unidades', 'Einheiten'), hosts: 'host', users: t('utenti', 'users', 'usuarios', 'Benutzer'), days: t('giorni/anno', 'days/year', 'días/año', 'Tage/Jahr'), eurYear: t('€/anno', '€/year', '€/año', '€/Jahr') }[unit];
}

export function AssessmentSummary({ state, lang, onEdit }) {
  const t = wording(lang);
  return <Card title={t('Assessment cliente condiviso', 'Shared customer assessment', 'Assessment compartido', 'Gemeinsames Kunden-Assessment')} subtitle={t('Volumi e costi As-Is sono centralizzati. L’adozione si definisce separatamente in ciascuna analisi.', 'As-Is volumes and costs are centralized. Adoption is defined separately in each analysis.')}>
    <div className="flex flex-wrap items-center justify-between gap-4"><div className="flex flex-wrap gap-6 text-sm"><span><strong>{state.tech.numberUsers}</strong> {t('utenti', 'users')}</span><span><strong>{state.tech.numberPc}</strong> PC</span><span><strong>{state.tech.numberHosts}</strong> host</span><span><strong>{state.tech.numberVpnAdcAppliances}</strong> VPN / ADC</span></div><button className={buttonStyle} onClick={onEdit}>{t('Apri assessment', 'Open assessment', 'Abrir assessment', 'Assessment öffnen')}</button></div>
  </Card>;
}

export function CustomerAssessment({ state, setState, lang, onNavigate, onCompatibility, group = 'users', setGroup, reviews = {}, setReviews }) {
  const t = wording(lang);
  const w = workspaceText(lang);
  const c = LABELS[lang];
  const [full, setFull] = useState(false);
  const labels = { ...c, remote: t('Utenti remoti o ibridi', 'Remote or hybrid users', 'Usuarios remotos o híbridos', 'Remote- oder Hybridnutzer'), byod: t('Utenti con dispositivi personali', 'Users with personal devices', 'Usuarios con dispositivos personales', 'Nutzer mit privaten Geräten'), sysadminDayCost: t('Costo medio di una giornata IT', 'Average IT day cost', 'Coste medio de un día TI', 'Durchschnittliche Kosten pro IT-Tag'), pcCycle: t('Ciclo di sostituzione PC', 'PC replacement cycle', 'Ciclo de sustitución de PC', 'PC-Austauschzyklus'), cvadPremium: 'CVAD Premium', platformRisk: 'Platform risk', infrastructure: 'Infrastructure optimization' };
  const activityLabels = { itDaysEndpoint: ['Gestione dispositivi', 'Device management', 'Gestión de dispositivos', 'Geräteverwaltung'], itDaysImage: ['Gestione immagini e VDI', 'Image and VDI management', 'Gestión de imágenes y VDI', 'Image- und VDI-Verwaltung'], itDaysSupport: ['Supporto utenti', 'User support', 'Soporte al usuario', 'Benutzersupport'], itDaysAccess: ['Gestione accessi', 'Access management', 'Gestión de accesos', 'Zugriffsverwaltung'], itDaysSecurity: ['Operazioni di sicurezza', 'Security operations', 'Operaciones de seguridad', 'Sicherheitsbetrieb'] };
  for (const [key, values] of Object.entries(activityLabels)) labels[key] = t(...values);
  const update = (section, key, value) => setState(s => ({ ...s, [section]: { ...s[section], [key]: value } }));
  const currentIndex = assessmentGroups.findIndex(g => g.id === group);
  return <div data-testid="customer-assessment" className="assessment-workspace">
    <div className="section-heading"><div><p className="eyebrow">01 / {w('data')}</p><h2>{t('Conosciamo il punto di partenza', 'Establish your baseline', 'Define el punto de partida', 'Ausgangslage erfassen')}</h2></div><button className="secondary-button" aria-pressed={full} onClick={() => setFull(!full)}>{w(full ? 'focused' : 'all')}</button></div>
    <p className="shared-note">{w('shared')}</p>
    <nav className="group-tabs" aria-label={w('data')}>{assessmentGroups.map(g => <button key={g.id} aria-pressed={group === g.id && !full} className={group === g.id && !full ? 'active' : ''} onClick={() => { setGroup?.(g.id); setFull(false); }}>{w(g.id)}<span className={`tiny-dot ${groupStatus(g,state,reviews)}`}/></button>)}</nav>
    <p className="muted-note mb-4">{w('unknown')}</p>
    <div className="space-y-5">{assessmentGroups.filter(g => full || g.id === group).map(g => {
      const status = groupStatus(g,state,reviews);
      return <Card key={g.id} title={<span className="group-title">{w(g.id)}<span className={`status-badge ${status}`}>{w(status)}</span></span>} subtitle={g.optional ? t('Facoltativo. Inserisci solo costi documentati, distinti dalle altre voci.', 'Optional. Enter only documented costs, separate from other items.', 'Opcional. Solo costes documentados y separados.', 'Optional. Nur dokumentierte, getrennte Kosten eingeben.') : undefined}>
        <div className="grid gap-x-6 gap-y-5 md:grid-cols-2">{g.fields.map(f => <Input key={f.key} label={labels[f.label]} help={c[f.help]} value={state[f.section]?.[f.key]} suffix={f.suffix === '€/anno' ? t('€/anno','€/year','€/año','€/Jahr') : c[f.suffix] ?? f.suffix} max={f.max} step={f.step} onChange={v => update(f.section,f.key,v)} testId={`assessment-${f.key}`}/>)}</div>
        {g.id === 'operations' && <p className="muted-note mt-5">{t('Giornate-persona totali annue: 2 persone × 30 giornate = 60. Evita sovrapposizioni tra le attività.', 'Total person-days per year: 2 people × 30 days = 60. Avoid overlaps between activities.', 'Días-persona al año: 2 personas × 30 días = 60. Evita duplicidades.', 'Personentage pro Jahr: 2 Personen × 30 Tage = 60. Überschneidungen vermeiden.')}</p>}
        <div className="group-footer">{g.compatibility ? <button className="text-action" onClick={() => onCompatibility(g.compatibility)}>{g.id === 'devices' ? 'eLux' : 'XenServer'} · {t('Compatibilità', 'Compatibility', 'Compatibilidad', 'Kompatibilität')} ↗</button> : <span/>}<button className="secondary-button" disabled={!groupComplete(g,state) || status === 'verified'} onClick={() => setReviews?.(r => ({ ...r, [g.id]: groupFingerprint(g,state) }))}>{w(status === 'verified' ? 'verified' : 'confirm')}</button></div>
      </Card>;
    })}</div>
    <div className="assessment-actions"><button className="secondary-button" disabled={currentIndex <= 0 || full} onClick={() => setGroup?.(assessmentGroups[currentIndex - 1].id)}>{w('back')}</button>{!full && currentIndex < assessmentGroups.length - 1 ? <button className="primary-button" onClick={() => setGroup?.(assessmentGroups[currentIndex + 1].id)}>{w('next')} →</button> : <button className="primary-button" onClick={onNavigate}>{w('profile')} →</button>}</div>
  </div>;
}

export function OpportunityPlanner({ state, plans, setPlans, offer, years, lang, onEdit, onCompatibility, newBusiness = false }) {
  const t = wording(lang);
  const [area, setArea] = useState('all');
  const w = workspaceText(lang);
  const rowArea = row => row.id.startsWith('ops') || row.id === 'securityOps' ? 'operations' : row.id === 'xenserver' ? 'infrastructure' : row.id === 'endpoint' ? 'devices' : ['cvadPremium','platformRisk','infrastructure'].includes(row.id) ? 'other' : 'security';
  const mode = newBusiness ? 'newBusiness' : 'renewal';
  const model = calculateCustomerScenario(state, plans, offer, years, 0, mode);
  const activeArea = area === 'all' || model.rows.some(row => rowArea(row) === area) ? area : 'all';
  const update = (id, key, value) => setPlans((current) => ({ ...current, [id]: { ...current[id], [key]: value } }));
  const quantity = (value) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);

  return <Card
    title={newBusiness ? t('Adozione prevista e saving', 'Planned adoption and savings') : `${t('Adozione attuale e saving residuo', 'Current adoption and remaining savings')} · ${offer}`}
    subtitle={newBusiness
      ? t('Imposta la percentuale prevista per ciascuna leva: il saving si aggiorna subito sul perimetro As-Is. Per l’effort IT la percentuale indica la riduzione delle giornate; per i servizi, la quota di costo ottimizzabile.', 'Set the planned percentage for each lever: savings update immediately against the As-Is scope. For IT effort this means a reduction in days; for services, the optimizable cost share.')
      : t('Inserisci le quantità già implementate. Il saving aggiuntivo riguarda solo il residuo fino all’obiettivo, inizialmente pari al totale As-Is.', 'Enter already implemented quantities. Additional savings cover only the remaining scope up to the target, initially equal to the full As-Is total.')}
  >
    <div className="mb-5 rounded-xl bg-blue-50 p-4 text-sm leading-6 text-blue-950">
      {t('Importi calcolati dai costi dell’assessment. Ipotesi iniziali modificabili: quota eliminabile 100%, attivazione immediata, nessun costo extra. Gli importi della quota già adottata sono stime, non consuntivi.', 'Amounts are calculated from assessment costs. Editable initial assumptions: 100% avoidable share, immediate activation, no extra cost. Amounts for existing adoption are estimates, not actuals.')}
      {' '}<button className="font-semibold underline" onClick={onEdit}>{t('Modifica dati As-Is', 'Edit As-Is data')}</button>
    </div>
    {newBusiness && <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950" data-testid="service-defaults-note">
      <p className="font-semibold">{t('Riduzioni IT e Security iniziali da verificare. Non sono risparmi garantiti.', 'Verify initial IT and Security reductions. They are not guaranteed savings.', 'Verifica las reducciones TI y seguridad. No son ahorros garantizados.', 'Anfängliche IT- und Sicherheitsannahmen prüfen. Keine garantierten Einsparungen.')}</p><details className="mt-2"><summary className="cursor-pointer text-xs">{w('method')}</summary>
      <p>{t('I valori iniziali si applicano al perimetro As-Is e sono modificabili in ogni scheda. Non sono risparmi garantiti: i benchmark IDC 2024 derivano da sei organizzazioni e da uno studio sponsorizzato da Citrix; le altre percentuali sono ipotesi di modello. Adegua le riduzioni se il progetto copre solo parte del perimetro.', 'Starting values apply to the As-Is scope and can be edited in each card. Savings are not guaranteed: IDC 2024 benchmarks come from six organizations in a Citrix-sponsored study; other percentages are model assumptions. Adjust reductions if the project covers only part of the scope.')}</p>
      <p className="mt-2">{t('Le giornate risparmiate valorizzano capacità liberata. SOC e remediation richiedono costi effettivamente riducibili e separati dalle altre voci. Licenze EDR, posture, MFA e ZTNA restano allo 0% finché non definisci quali contratti sostituire.', 'Saved days value released capacity. SOC and remediation require genuinely reducible costs separate from other items. EDR, posture, MFA and ZTNA licenses stay at 0% until you define which contracts can be replaced.')}</p>
    </details></div>}
    <nav className="group-tabs" aria-label={w('adoption')}>{['all','infrastructure','devices','security','operations','other'].filter(key => key === 'all' || model.rows.some(row => rowArea(row) === key)).map(key => <button key={key} aria-pressed={activeArea === key} className={activeArea === key ? 'active' : ''} onClick={() => setArea(key)}>{w(key)}</button>)}</nav>
    <div className="space-y-4">{model.rows.filter(row => activeArea === 'all' || rowArea(row) === activeArea).map((row) => {
      const p = row.parameters;
      const serviceDefault = newBusiness && NEW_BUSINESS_SERVICE_DEFAULTS[row.id];
      const percentageLabel = serviceDefault ? t('Riduzione prevista', 'Planned reduction') : t('Adozione prevista', 'Planned adoption');
      const status = row.excluded ? t('Escluso', 'Excluded') : !row.complete ? t('Dati da completare', 'Incomplete data') : newBusiness ? `${quantity(row.targetPct)}%` : `${quantity(row.currentPct)}% ${t('già adottato', 'already adopted')}`;
      return <details key={row.id} className="rounded-2xl border border-slate-200">
        <summary className="cursor-pointer p-4">
          <span className="font-semibold">{row.label}</span><span className="ml-3 text-xs text-slate-500">{status}</span>
          <span className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-slate-600">
            <span>{t('Totale As-Is', 'As-Is total')}: {row.referenceKnown ? quantity(row.total) : '—'} {unitLabel(row.unit, t)} · {newBusiness ? serviceDefault ? t('Riduzione prevista', 'Planned reduction') : t('Copertura prevista', 'Planned coverage') : t('Da completare', 'Remaining')}: {row.targetValid ? quantity(row.gap) : '—'}</span>
            <strong className="text-emerald-700">{row.complete ? money(row.annualSaving, lang) : '—'} / {t('anno', 'year')}</strong>
          </span>
        </summary>
        <div className="border-t border-slate-100 p-4">
          {onCompatibility && ['xenserver','endpoint','netscaler'].includes(row.id) && <button className="text-action mb-4" onClick={() => onCompatibility({xenserver: 'compatibility', endpoint: 'endpointCompatibility', netscaler: 'netscalerDetail'}[row.id])}>{t('Verifica compatibilità e funzionalità', 'Check compatibility and capabilities', 'Verificar compatibilidad y funciones', 'Kompatibilität und Funktionen prüfen')} ↗</button>}
          {serviceDefault && <div className="mb-4 rounded-xl bg-slate-50 p-3"><ServiceDefaultNote id={row.id} lang={lang} /><button type="button" onClick={() => update(row.id, 'adoptionPct', serviceDefault.pct)} className="mt-2 text-xs font-semibold text-blue-700 underline">{t('Ripristina percentuale iniziale', 'Restore initial percentage')} ({serviceDefault.pct}%)</button></div>}
          <div className="grid items-start gap-4 md:grid-cols-3">
            {newBusiness ? <div>
              <Input testId={`adoption-${row.id}`} label={percentageLabel} help={serviceDefault ? t('Quota di riduzione prevista sul totale annuo. Verifica il valore iniziale rispetto al perimetro del cliente.', 'Planned reduction of the annual total. Verify the initial value against the customer scope.') : t('Percentuale del perimetro totale coinvolta nel progetto. 0% non genera saving per questa leva.', 'Percentage of the total scope covered by the project. 0% generates no savings for this lever.')} value={p.adoptionPct} max={100} suffix="%" onChange={(v) => update(row.id, 'adoptionPct', v)} />
              <input aria-label={`${percentageLabel} ${row.label}`} type="range" min="0" max="100" step="1" value={p.adoptionPct || 0} onChange={(e) => update(row.id, 'adoptionPct', Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
              <p className="text-xs text-slate-500">{serviceDefault ? t('Riduzione = totale As-Is × percentuale; applicata una sola volta.', 'Reduction = As-Is total × percentage; applied once.') : t('Copertura equivalente: totale × percentuale.', 'Equivalent coverage: total × percentage.')}</p>
            </div> : <Input testId={`current-${row.id}`} label={t('Già implementato / risparmiato', 'Already implemented / saved')} help={t('Quantità già adottata nel perimetro totale. Inserisci 0 se non ancora implementata; lascia vuoto se sconosciuta.', 'Quantity already adopted within the total scope. Enter 0 if not yet implemented; leave empty if unknown.')} value={p.current} max={row.total} suffix={unitLabel(row.unit, t)} onChange={(v) => update(row.id, 'current', v)} />}
            {newBusiness
              ? <Metric testId={`planned-quantity-${row.id}`} label={serviceDefault ? t('Riduzione annua prevista', 'Planned annual reduction') : t('Quantità equivalente prevista', 'Planned equivalent quantity')} value={row.targetValid ? `${quantity(row.target)} ${unitLabel(row.unit, t)}` : '—'} hint={serviceDefault && row.complete ? `${t('Residuo a regime dopo la quota eliminabile', 'Remaining at full operation after avoidable share')}: ${quantity(row.total - row.target * Number(p.avoidablePct) / 100)} ${unitLabel(row.unit, t)}` : undefined} />
              : <Input testId={`target-${row.id}`} label={t('Obiettivo totale raggiungibile', 'Achievable total target')} help={t('Obiettivo totale finale, comprensivo della quota già adottata. Non inserire soltanto il residuo.', 'Final total target, including existing adoption. Do not enter only the remaining quantity.')} value={p.target} max={row.total} suffix={unitLabel(row.unit, t)} onChange={(v) => update(row.id, 'target', v)} />}
            <Input testId={`activation-${row.id}`} label={newBusiness ? t('Costo intervento aggiuntivo al progetto base', 'Implementation cost beyond base project') : t('Costo completamento una tantum', 'One-time completion cost')} suffix="€" value={p.activationCost} onChange={(v) => update(row.id, 'activationCost', v)} />
          </div>
          {row.id === 'endpoint' && <div className="mt-4 grid gap-4 md:grid-cols-3">
            <Input testId="endpoint-lifecycle" label={t('Ciclo di vita dopo intervento', 'Lifecycle after implementation')} suffix={t('anni', 'years')} value={p.endpointLifecycleYears} onChange={(v) => update(row.id, 'endpointLifecycleYears', v)} />
            <Input testId="endpoint-replacement" label={t('Costo sostituzione endpoint a fine ciclo', 'Endpoint replacement cost at end of lifecycle')} suffix="€" value={p.endpointReplacementCost} onChange={(v) => update(row.id, 'endpointReplacementCost', v)} />
            <Metric label={t('Costo annuo endpoint calcolato', 'Calculated annual endpoint cost')} value={row.baselineValid ? money(row.endpointAnnualCost, lang) : '—'} hint={t('Costo sostituzione ÷ ciclo di vita. Scenario iniziale: ciclo As-Is + 2 anni; costo PC dell’assessment.', 'Replacement cost ÷ lifecycle. Initial scenario: As-Is lifecycle + 2 years; assessment PC cost.')} />
          </div>}
          <div className="mt-4 grid gap-3 sm:grid-cols-3">
            <Metric label={newBusiness ? t('Costo annuo As-Is', 'As-Is annual cost') : t('Beneficio annuo stimato quota già adottata', 'Estimated annual benefit of existing adoption')} value={(newBusiness ? row.referenceKnown : row.baselineValid) ? money(newBusiness ? row.annualBaseline : row.alreadySaving, lang) : '—'} />
            <Metric label={t('Saving aggiuntivo annuo', 'Additional annual saving')} value={row.complete ? money(row.annualSaving, lang) : '—'} />
            <Metric label={t('Saving netto sul periodo', 'Net saving over term')} value={row.complete ? money(row.netSaving, lang) : '—'} />
          </div>
          {!row.complete && <p role="alert" className="mt-3 text-sm text-amber-700">{newBusiness
            ? t('Verifica i dati As-Is e una percentuale tra 0 e 100. Durate e costi devono essere validi.', 'Check As-Is data and a percentage between 0 and 100. Durations and costs must be valid.')
            : t('Inserisci la quantità già implementata, anche 0. Deve valere: già implementato ≤ obiettivo ≤ totale As-Is. Host, utenti e dispositivi devono essere interi.', 'Enter existing quantity, including 0. Existing quantity ≤ target ≤ As-Is total. Hosts, users and devices must be whole numbers.')}</p>}
          <details className="mt-4 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-medium">{t('Ipotesi di calcolo e tempi', 'Calculation assumptions and timing')}<span className="mt-1 block text-xs font-normal text-slate-500">{p.avoidablePct}% · {p.months} {t('mesi prima dell’attivazione', 'months before activation')} · {money(p.activationCost, lang)}</span></summary>
            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <Input testId={`avoidable-${row.id}`} label={t('Quota di costo eliminabile sulla parte adottata', 'Avoidable cost share on adopted scope')} suffix="%" value={p.avoidablePct} max={100} onChange={(v) => update(row.id, 'avoidablePct', v)} />
              <Input testId={`months-${row.id}`} label={t('Mesi prima dell’attivazione saving', 'Months before savings start')} value={p.months} max={years * 12} onChange={(v) => update(row.id, 'months', v)} />
            </div>
            {row.id === 'netscaler' && <label className="mt-4 flex items-start gap-2 text-sm"><input data-testid="netscaler-refresh" type="checkbox" checked={p.includeRefresh} onChange={(e) => update(row.id, 'includeRefresh', e.target.checked)} /><span>{t('Previsto un refresh appliance evitabile nel periodo', 'An avoidable appliance refresh is scheduled within the term')}<span className="mt-1 block text-xs text-slate-500">{t('Importo calcolato: quantità aggiuntiva × costo appliance × quota eliminabile. Gli acquisti passati restano esclusi.', 'Calculated amount: additional quantity × appliance cost × avoidable share. Past purchases are excluded.')} {money(row.oneTimeSaving, lang)}</span></span></label>}
            <label className="mt-4 block text-sm font-medium">{t('Note / evidenze', 'Notes / evidence')}<textarea value={plans[row.id]?.evidence ?? ''} onChange={(e) => update(row.id, 'evidence', e.target.value)} className="mt-2 block w-full rounded-xl border border-slate-300 p-3" rows="2" /></label>
          </details>
          <p className="mt-3 text-xs leading-5 text-slate-500">{newBusiness
            ? t('Saving annuo = totale As-Is × adozione / riduzione prevista × risparmio unitario × quota eliminabile.', 'Annual saving = As-Is total × planned adoption / reduction × unit saving × avoidable share.')
            : t('Saving annuo aggiuntivo = (obiettivo − già implementato) × risparmio unitario × quota eliminabile.', 'Additional annual saving = (target − already implemented) × unit saving × avoidable share.')}
            {' '}{t('Il periodo tiene conto dei mesi di attivazione e dei costi extra.', 'Term totals account for activation timing and extra costs.')}</p>
          <p className="mt-1 text-xs text-slate-500">{t('Risparmio unitario annuo calcolato', 'Calculated annual unit saving')}: {money(row.unitSaving, lang)}{row.id === 'xenserver' ? ` = ${state.tech.coresPerHost} core × ${money(state.cost.costHypervisorPerCoreYear, lang)}` : ''}.</p>
        </div>
      </details>;
    })}</div>
  </Card>;
}

export function OpportunityTable({ model, lang }) {
  const t = wording(lang);
  const newBusiness = model.mode === 'newBusiness';
  const quantity = (value) => new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(value);
  const headers = [t('Leva', 'Lever'), t('Totale As-Is', 'As-Is total'),
    ...(newBusiness ? [t('Adozione / riduzione prevista', 'Planned adoption / reduction'), t('Quantità / riduzione equivalente', 'Equivalent quantity / reduction')] : [t('Già adottato', 'Already adopted'), t('Obiettivo', 'Target'), t('Da completare', 'Remaining')]),
    t('Saving annuo aggiuntivo', 'Additional annual saving'), t('Saving sul periodo', 'Term saving')];
  return <div className="overflow-x-auto"><table className="w-full text-left text-sm">
    <thead className="bg-slate-50 text-xs text-slate-500"><tr>{headers.map((label) => <th key={label} className="p-3">{label}</th>)}</tr></thead>
    <tbody>{model.rows.map((row) => <tr key={row.id} className="border-t border-slate-100">
      <td className="p-3 font-medium">{row.label}<span className="block text-xs font-normal text-slate-500">{unitLabel(row.unit, t)}{!row.complete ? ` · ${t('Da compilare', 'Incomplete')}` : ''}</span>{newBusiness && <ServiceDefaultNote id={row.id} lang={lang} compact />}</td>
      <td className="p-3">{row.referenceKnown ? quantity(row.total) : '—'}</td>
      {newBusiness ? <><td className="p-3">{row.targetValid ? `${quantity(row.targetPct)}%` : '—'}</td><td className="p-3">{row.targetValid ? quantity(row.target) : '—'}</td></>
        : <><td className="p-3">{row.currentValid ? quantity(row.current) : '—'}</td><td className="p-3">{row.targetValid ? quantity(row.target) : '—'}</td><td className="p-3">{row.targetValid ? quantity(row.gap) : '—'}</td></>}
      <td className="p-3">{row.complete ? money(row.annualSaving, lang) : '—'}</td><td className="p-3 font-semibold text-emerald-700">{row.complete ? money(row.periodSaving, lang) : '—'}</td>
    </tr>)}</tbody>
  </table></div>;
}
