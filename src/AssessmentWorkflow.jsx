import React from 'react';
import { LABELS } from './i18n/labels';
import { calculateCustomerScenario } from './models/customerAssessmentModel';
import { NEW_BUSINESS_SERVICE_DEFAULTS } from './models/newBusinessDefaults';

export const wording = (lang) => (it, en, es = en, de = en) => ({ it, en, es, de }[lang] ?? en);
export const money = (value, lang = 'it') => new Intl.NumberFormat({ it: 'it-IT', en: 'en-US', es: 'es-ES', de: 'de-DE' }[lang] ?? 'en-US', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(value);
export const buttonStyle = 'rounded-xl bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-600';
export function Card({ title, subtitle, children }) {
  return <section className="rounded-3xl border border-slate-200 bg-white shadow-sm"><div className="border-b border-slate-100 px-6 py-5"><h2 className="text-lg font-semibold">{title}</h2>{subtitle && <p className="mt-1 text-sm leading-6 text-slate-500">{subtitle}</p>}</div><div className="p-6">{children}</div></section>;
}
export function Input({ label, value, onChange, suffix, max, step = 'any', testId, placeholder = '—' }) {
  return <label className="block space-y-2"><span className="block text-sm font-medium text-slate-700">{label}{suffix && <span className="ml-1 text-xs text-slate-500">({suffix})</span>}</span><input data-testid={testId} type="number" min="0" max={max} step={step} value={value ?? ''} placeholder={placeholder} onChange={(e) => onChange(e.target.value === '' ? '' : Math.max(0, Number(e.target.value)))} className="w-full rounded-xl border border-slate-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></label>;
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

export function CustomerAssessment({ state, setState, lang, onNavigate, onCompatibility }) {
  const t = wording(lang);
  const c = LABELS[lang];
  const update = (section, key, value) => setState((s) => ({ ...s, [section]: { ...s[section], [key]: value } }));
  const fields = (section, entries) => <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{entries.map(([key, label, suffix, max]) => <Input key={key} label={label} suffix={suffix} max={max} value={state[section][key]} onChange={(v) => update(section, key, v)} testId={`assessment-${key}`} />)}</div>;
  return <div className="space-y-6" data-testid="customer-assessment">
    <Card title={t('1. Perimetro complessivo', '1. Overall scope')} subtitle={t('Inserisci il perimetro complessivo As-Is: gli stessi totali saranno disponibili nel New Business e nel Renewal. I valori iniziali sono esempi modificabili.', 'Enter the full As-Is scope: the same totals will be available in New Business and Renewal. Initial values are editable examples.')}>
      {fields('tech', [['numberUsers', c.users], ['pctRemoteHybridUsers', c.remote, '%', 100], ['pctByodUsers', c.byod, '%', 100], ['numberPc', c.pcCount], ['numberThinClient', c.thinClients], ['avgPcAgeYears', t('Ciclo di rinnovo PC di riferimento', 'Baseline PC replacement cycle'), c.yearsSuffix], ['numberHosts', c.hosts], ['coresPerHost', c.cores], ['numberVpnAdcAppliances', c.vpnAdc]])}
    </Card>
    <Card title={t('2. Costi e effort di riferimento', '2. Reference costs and effort')} subtitle={t('Costi unitari e giornate riferiti all’intero perimetro. Nel Renewal il modello sottrae la quota già implementata: non ridurre qui i totali.', 'Unit costs and days for the full scope. Renewal subtracts the already implemented share: do not reduce these totals.')}>
      {fields('cost', [['costOnePc', c.newPcCost, '€'], ['costHypervisorPerCoreYear', c.hypervisorCostCoreYear, '€'], ['costVpnAdcAppliance', c.vpnApplianceCost, '€'], ['applianceMaintenanceAnnualPct', c.applianceMaintenance, '%', 100], ['costMfaUserMonth', c.mfaCost, '€'], ['costZtnaUserMonth', c.ztnaCost, '€'], ['costEdrEndpointMonth', c.edrCost, '€'], ['costDevicePostureEndpointMonth', c.postureCost, '€'], ['costSocMsspAnnual', c.socCost, '€'], ['costRemediationPerEndpointYear', c.remediationCost, '€'], ['costSysadminDay', c.sysadminDayCost, '€']])}
      <div className="mt-6 border-t pt-6">{fields('tech', [['itDaysEndpointMgmt', c.itDaysEndpoint, c.daysYear], ['itDaysImageVdiMgmt', c.itDaysImage, c.daysYear], ['itDaysSupport', c.itDaysSupport, c.daysYear], ['itDaysAccessMgmt', c.itDaysAccess, c.daysYear], ['itDaysSecurityOps', c.itDaysSecurity, c.daysYear]])}</div>
      <details className="mt-6 rounded-xl bg-slate-50 p-4"><summary className="cursor-pointer text-sm font-semibold">{t('Altre opportunità CPC · basi economiche documentate', 'Other CPC opportunities · documented cost baselines')}</summary><p className="my-3 text-sm text-slate-500">{t('Inserisci soltanto costi distinti dalle altre voci. Una riduzione del rischio non quantificata resta esclusa dal saving.', 'Only enter costs separate from the other items. Unquantified risk reduction is excluded from savings.')}</p><div className="grid gap-4 md:grid-cols-3">{['cvadPremium', 'platformRisk', 'infrastructure'].map((id) => <Input key={id} label={{ cvadPremium: 'CVAD Premium', platformRisk: 'Platform risk', infrastructure: 'Infrastructure optimization' }[id]} value={state.manualBaselines?.[id]} onChange={(v) => update('manualBaselines', id, v)} suffix="€/anno" />)}</div></details>
    </Card>
    <div className="flex flex-wrap gap-3"><button className={buttonStyle} onClick={() => onCompatibility('compatibility')}>XenServer compatibility</button><button className={buttonStyle} onClick={() => onCompatibility('endpointCompatibility')}>eLux compatibility</button></div>
    <Card title={t('Scegli l’analisi economica', 'Choose the economic analysis')} subtitle={t('L’assessment rimane condiviso. Prezzi, costi di progetto e obiettivi sono specifici di ciascuno scenario.', 'The assessment stays shared. Pricing, project costs and targets are specific to each scenario.')}><div className="grid gap-4 md:grid-cols-2"><button className={buttonStyle} onClick={() => onNavigate('newBusiness')}>New Business ROI →</button><button className={buttonStyle} onClick={() => onNavigate('renewal')}>Renewal Value →</button></div></Card>
  </div>;
}

export function OpportunityPlanner({ state, plans, setPlans, offer, years, lang, onEdit, newBusiness = false }) {
  const t = wording(lang);
  const mode = newBusiness ? 'newBusiness' : 'renewal';
  const model = calculateCustomerScenario(state, plans, offer, years, 0, mode);
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
      <h3 className="font-semibold">{t('Riduzioni IT e Security applicate automaticamente', 'IT and Security reductions applied automatically')}</h3>
      <p>{t('I valori iniziali si applicano al perimetro As-Is e sono modificabili in ogni scheda. Non sono risparmi garantiti: i benchmark IDC 2024 derivano da sei organizzazioni e da uno studio sponsorizzato da Citrix; le altre percentuali sono ipotesi di modello. Adegua le riduzioni se il progetto copre solo parte del perimetro.', 'Starting values apply to the As-Is scope and can be edited in each card. Savings are not guaranteed: IDC 2024 benchmarks come from six organizations in a Citrix-sponsored study; other percentages are model assumptions. Adjust reductions if the project covers only part of the scope.')}</p>
      <p className="mt-2">{t('Le giornate risparmiate valorizzano capacità liberata. SOC e remediation richiedono costi effettivamente riducibili e separati dalle altre voci. Licenze EDR, posture, MFA e ZTNA restano allo 0% finché non definisci quali contratti sostituire.', 'Saved days value released capacity. SOC and remediation require genuinely reducible costs separate from other items. EDR, posture, MFA and ZTNA licenses stay at 0% until you define which contracts can be replaced.')}</p>
    </div>}
    <div className="space-y-4">{model.rows.map((row) => {
      const p = row.parameters;
      const serviceDefault = newBusiness && NEW_BUSINESS_SERVICE_DEFAULTS[row.id];
      const percentageLabel = serviceDefault ? t('Riduzione prevista', 'Planned reduction') : t('Adozione prevista', 'Planned adoption');
      const status = row.excluded ? t('Escluso', 'Excluded') : !row.complete ? t('Dati da completare', 'Incomplete data') : newBusiness ? `${quantity(row.targetPct)}%` : `${quantity(row.currentPct)}% ${t('già adottato', 'already adopted')}`;
      return <details key={row.id} className="rounded-2xl border border-slate-200" open={row.id === 'xenserver' ? true : undefined}>
        <summary className="cursor-pointer p-4">
          <span className="font-semibold">{row.label}</span><span className="ml-3 text-xs text-slate-500">{status}</span>
          <span className="mt-2 flex flex-wrap justify-between gap-2 text-sm text-slate-600">
            <span>{t('Totale As-Is', 'As-Is total')}: {row.referenceKnown ? quantity(row.total) : '—'} {unitLabel(row.unit, t)} · {newBusiness ? serviceDefault ? t('Riduzione prevista', 'Planned reduction') : t('Copertura prevista', 'Planned coverage') : t('Da completare', 'Remaining')}: {row.targetValid ? quantity(row.gap) : '—'}</span>
            <strong className="text-emerald-700">{row.complete ? money(row.annualSaving, lang) : '—'} / {t('anno', 'year')}</strong>
          </span>
        </summary>
        <div className="border-t border-slate-100 p-4">
          {serviceDefault && <div className="mb-4 rounded-xl bg-slate-50 p-3"><ServiceDefaultNote id={row.id} lang={lang} /><button type="button" onClick={() => update(row.id, 'adoptionPct', serviceDefault.pct)} className="mt-2 text-xs font-semibold text-blue-700 underline">{t('Ripristina percentuale iniziale', 'Restore initial percentage')} ({serviceDefault.pct}%)</button></div>}
          <div className="grid items-start gap-4 md:grid-cols-3">
            {newBusiness ? <div>
              <Input testId={`adoption-${row.id}`} label={percentageLabel} value={p.adoptionPct} max={100} suffix="%" onChange={(v) => update(row.id, 'adoptionPct', v)} />
              <input aria-label={`${percentageLabel} ${row.label}`} type="range" min="0" max="100" step="1" value={p.adoptionPct || 0} onChange={(e) => update(row.id, 'adoptionPct', Number(e.target.value))} className="mt-3 w-full accent-blue-600" />
              <p className="text-xs text-slate-500">{serviceDefault ? t('Riduzione = totale As-Is × percentuale; applicata una sola volta.', 'Reduction = As-Is total × percentage; applied once.') : t('Copertura equivalente: totale × percentuale.', 'Equivalent coverage: total × percentage.')}</p>
            </div> : <Input testId={`current-${row.id}`} label={t('Già implementato / risparmiato', 'Already implemented / saved')} value={p.current} max={row.total} suffix={unitLabel(row.unit, t)} onChange={(v) => update(row.id, 'current', v)} />}
            {newBusiness
              ? <Metric testId={`planned-quantity-${row.id}`} label={serviceDefault ? t('Riduzione annua prevista', 'Planned annual reduction') : t('Quantità equivalente prevista', 'Planned equivalent quantity')} value={row.targetValid ? `${quantity(row.target)} ${unitLabel(row.unit, t)}` : '—'} hint={serviceDefault && row.complete ? `${t('Residuo a regime dopo la quota eliminabile', 'Remaining at full operation after avoidable share')}: ${quantity(row.total - row.target * Number(p.avoidablePct) / 100)} ${unitLabel(row.unit, t)}` : undefined} />
              : <Input testId={`target-${row.id}`} label={t('Obiettivo totale raggiungibile', 'Achievable total target')} value={p.target} max={row.total} suffix={unitLabel(row.unit, t)} onChange={(v) => update(row.id, 'target', v)} />}
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
          <details className="mt-4 rounded-xl bg-slate-50 p-3"><summary className="cursor-pointer text-sm font-medium">{t('Ipotesi di calcolo e tempi', 'Calculation assumptions and timing')}</summary>
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
