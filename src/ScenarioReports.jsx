import React from 'react';
import { LABELS } from './i18n/labels';
import { money, wording, unitLabel } from './AssessmentWorkflow';
import { numeric, calculateCustomerScenario, calculateRenewalComparison } from './models/customerAssessmentModel';
import { NEW_BUSINESS_SERVICE_DEFAULTS } from './models/newBusinessDefaults';

const number = (value, lang) => numeric(value) ? new Intl.NumberFormat(lang, { maximumFractionDigits: 2 }).format(Number(value)) : '—';
const amount = (value, lang) => numeric(value) ? new Intl.NumberFormat(lang, { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 }).format(Number(value)) : '—';
const percentage = (value, lang) => value === null || value === undefined ? '—' : `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(value)}%`;

function DataTable({ rows, lang }) {
  const t = wording(lang);
  return <table className="report-data"><thead><tr><th>{t('Parametro', 'Parameter')}</th><th>{t('Valore', 'Value')}</th></tr></thead><tbody>{rows.map(([label, value]) => <tr key={label}><td>{label}</td><td>{value}</td></tr>)}</tbody></table>;
}

function ReportHeader({ title, scenario, lang, profileComplete = true }) {
  const t = wording(lang);
  return <header className="report-hero">
    <p className="report-kicker">Citrix · {t('Analisi economica', 'Economic assessment')}</p>
    <h1>{title}</h1>
    <p>{t('Data di elaborazione', 'Report date')}: {new Intl.DateTimeFormat(lang, { dateStyle: 'long' }).format(new Date())}</p>
    <p className="report-status">{scenario.complete && scenario.baselineComplete && profileComplete ? t('Scenario compilato', 'Scenario completed') : t('SIMULAZIONE PARZIALE: completare i dati mancanti prima di usare i risultati.', 'PARTIAL SIMULATION: complete missing inputs before using results.')} {t('Voci compilate', 'Completed items')}: {scenario.completed}/{scenario.rows.length}.</p>
  </header>;
}

function ScopeNarrative({ state, lang }) {
  const t = wording(lang);
  return <p>{t(
    `L’assessment descrive un perimetro di ${number(state.tech.numberUsers, lang)} utenti, ${number(state.tech.numberPc, lang)} PC e ${number(state.tech.numberThinClient, lang)} thin client. L’infrastruttura comprende ${number(state.tech.numberHosts, lang)} host hypervisor, con ${number(state.tech.coresPerHost, lang)} core per host, e ${number(state.tech.numberVpnAdcAppliances, lang)} appliance VPN / ADC. La quota di utenti remoti o ibridi è pari al ${number(state.tech.pctRemoteHybridUsers, lang)}%. Questi dati costituiscono la base condivisa dell’analisi.`,
    `The assessment covers ${number(state.tech.numberUsers, lang)} users, ${number(state.tech.numberPc, lang)} PCs and ${number(state.tech.numberThinClient, lang)} thin clients. The infrastructure includes ${number(state.tech.numberHosts, lang)} hypervisor hosts with ${number(state.tech.coresPerHost, lang)} cores per host, and ${number(state.tech.numberVpnAdcAppliances, lang)} VPN / ADC appliances. Remote or hybrid users represent ${number(state.tech.pctRemoteHybridUsers, lang)}%. These figures form the shared baseline for the analysis.`
  )}</p>;
}

function LeadingOpportunities({ scenario, lang }) {
  const t = wording(lang);
  const leading = scenario.rows.filter((row) => row.annualSaving > 0).sort((a, b) => b.annualSaving - a.annualSaving).slice(0, 3);
  return <p>{leading.length ? t('I principali contributi al saving annuo a regime provengono da ', 'The largest contributions to annual savings at full operation come from ') + leading.map((row) => `${row.label} (${money(row.annualSaving, lang)})`).join(', ') + '.' : t('Le voci attualmente compilate non generano saving annuo aggiuntivo. Verificare i dati di base e gli obiettivi prima di interpretare il risultato come assenza di opportunità.', 'The currently completed items generate no additional annual savings. Review the baseline and targets before interpreting this as a lack of opportunities.')}</p>;
}

function AssessmentInputs({ state, lang }) {
  const t = wording(lang);
  const labels = LABELS[lang] ?? LABELS.en;
  const tech = state.tech;
  const costs = state.cost;
  const techFields = [
    ['numberUsers', labels.users, ''], ['numberPc', labels.pcCount, ''], ['numberThinClient', labels.thinClients, ''],
    ['pctRemoteHybridUsers', labels.remote, '%'], ['pctByodUsers', labels.byod, '%'],
    ['numberHosts', labels.hosts, ''], ['coresPerHost', labels.cores, ''], ['numberVpnAdcAppliances', labels.vpnAdc, ''],
    ['avgPcAgeYears', t('Ciclo di rinnovo PC di riferimento', 'Baseline PC replacement cycle'), t('anni', 'years')],
    ['itDaysEndpointMgmt', labels.itDaysEndpoint, labels.daysYear], ['itDaysImageVdiMgmt', labels.itDaysImage, labels.daysYear],
    ['itDaysSupport', labels.itDaysSupport, labels.daysYear], ['itDaysAccessMgmt', labels.itDaysAccess, labels.daysYear], ['itDaysSecurityOps', labels.itDaysSecurity, labels.daysYear],
  ];
  const costFields = [
    ['costOnePc', labels.newPcCost], ['costHypervisorPerCoreYear', labels.hypervisorCostCoreYear], ['costVpnAdcAppliance', labels.vpnApplianceCost],
    ['applianceMaintenanceAnnualPct', labels.applianceMaintenance], ['costMfaUserMonth', labels.mfaCost], ['costZtnaUserMonth', labels.ztnaCost],
    ['costEdrEndpointMonth', labels.edrCost], ['costDevicePostureEndpointMonth', labels.postureCost], ['costSocMsspAnnual', labels.socCost],
    ['costRemediationPerEndpointYear', labels.remediationCost], ['costSysadminDay', labels.sysadminDayCost],
  ];
  return <section className="report-page">
    <h2>{t('Assessment: dati di riferimento', 'Assessment: baseline inputs')}</h2>
    <p>{t('I valori riportati sono quelli presenti nei campi al momento della generazione, inclusi i valori iniziali eventualmente mantenuti. Il simbolo — indica un dato mancante. Il perimetro è complessivo: nel Renewal comprende anche la quota già implementata.', 'Values reflect the fields at report generation, including any initial values retained. A dash means missing data. The full scope includes already implemented quantities in Renewal.')}</p>
    <h3>{t('Volumi ed effort As-Is', 'As-Is volumes and effort')}</h3>
    <DataTable lang={lang} rows={techFields.map(([key, label, unit]) => [label, `${number(tech[key], lang)} ${unit}`.trim()])} />
    <p className="report-note">{t('Thin client e BYOD documentano il contesto; non generano una voce di saving autonoma nel modello attuale.', 'Thin clients and BYOD document the context; they do not generate a separate savings item in the current model.')}</p>
    <h3>{t('Costi unitari e servizi', 'Unit costs and services')}</h3>
    <DataTable lang={lang} rows={costFields.map(([key, label]) => [label, key === 'applianceMaintenanceAnnualPct' ? `${number(costs[key], lang)}%` : amount(costs[key], lang)])} />
    {Object.keys(state.manualBaselines ?? {}).length > 0 && <><h3>{t('Basi economiche aggiuntive CPC', 'Additional CPC cost baselines')}</h3><DataTable lang={lang} rows={Object.entries(state.manualBaselines).map(([key, value]) => [({ cvadPremium: 'CVAD Premium', platformRisk: 'Platform risk', infrastructure: 'Infrastructure optimization' })[key] ?? key, `${amount(value, lang)} / ${t('anno', 'year')}`])} /></>}
  </section>;
}

function OpportunityDetails({ scenario, plans, lang }) {
  const t = wording(lang);
  const nb = scenario.mode === 'newBusiness';
  return <section className="report-page">
    <h2>{t('Piano di adozione e dettaglio saving', 'Adoption plan and savings detail')}</h2>
    <p>{nb ? t('Le percentuali indicano la copertura prevista o la riduzione di effort e servizi. Le quantità equivalenti possono essere frazionarie. Il beneficio è calcolato sul perimetro As-Is.', 'Percentages represent planned coverage or reductions in effort and services. Equivalent quantities may be fractional. Benefits are calculated against the As-Is scope.') : t('Per ogni leva sono documentati il totale As-Is, la quantità già implementata e l’obiettivo. Il nuovo saving è calcolato soltanto sulla differenza tra obiettivo e stato attuale.', 'Each lever documents the As-Is total, already implemented quantity and target. New savings apply only to the difference between target and current adoption.')}</p>
    {scenario.rows.map((row) => {
      const p = row.parameters;
      const unit = unitLabel(row.unit, t);
      const preset = nb && NEW_BUSINESS_SERVICE_DEFAULTS[row.id];
      const status = row.excluded ? t('Esclusa dal calcolo', 'Excluded from calculation') : !row.complete ? t('Dati da completare: nessun nuovo saving conteggiato', 'Incomplete data: no new savings counted') : row.gap === 0 ? t('Nessun intervento aggiuntivo previsto', 'No additional implementation planned') : t('Intervento incluso nella stima', 'Implementation included in estimate');
      return <section className="report-opportunity" key={row.id}>
        <h3>{row.label}</h3><p className="report-note">{status}</p>
        <p>{t('Totale As-Is', 'As-Is total')}: <strong>{row.referenceKnown ? number(row.total, lang) : '—'} {unit}</strong>. {nb
          ? <>{t('Adozione / riduzione prevista', 'Planned adoption / reduction')}: <strong>{number(p.adoptionPct, lang)}%</strong>; {t('quantità equivalente', 'equivalent quantity')}: {row.targetValid ? number(row.target, lang) : '—'} {unit}.</>
          : <>{t('Già implementato / risparmiato', 'Already implemented / saved')}: <strong>{number(p.current, lang)} {unit}</strong>; {t('obiettivo totale', 'total target')}: {number(p.target, lang)} {unit}; {t('da completare', 'remaining')}: <strong>{row.targetValid ? number(row.gap, lang) : '—'} {unit}</strong>.</>}
        </p>
        <p>{t('Quota eliminabile', 'Avoidable share')}: {number(p.avoidablePct, lang)}%; {t('attivazione dopo', 'activation after')}: {number(p.months, lang)} {t('mesi', 'months')}; {t('costo intervento una tantum inserito', 'entered one-time implementation cost')}: {amount(p.activationCost, lang)}. {t('Costo conteggiato', 'Cost included')}: {money(row.activationCost, lang)}.</p>
        {row.id === 'endpoint' && <p>{t('Ciclo dopo intervento', 'Post-implementation lifecycle')}: {number(p.endpointLifecycleYears, lang)} {t('anni', 'years')}; {t('costo sostituzione', 'replacement cost')}: {amount(p.endpointReplacementCost, lang)}; {t('costo annuo per endpoint risultante', 'resulting annual endpoint cost')}: {row.baselineValid ? money(row.endpointAnnualCost, lang) : '—'}.</p>}
        {row.id === 'netscaler' && <p>{t('Refresh futuro evitabile selezionato', 'Avoidable future refresh selected')}: {p.includeRefresh ? t('sì', 'yes') : t('no', 'no')}; {t('acquisto evitato nel periodo', 'purchase avoided over term')}: {money(row.oneTimeSaving, lang)}.</p>}
        <p>{!nb && <>{t('Beneficio annuo stimato già adottato (escluso dal nuovo saving)', 'Estimated annual benefit of existing adoption (excluded from new savings)')}: {row.baselineValid ? money(row.alreadySaving, lang) : '—'}. </>}{t('Saving aggiuntivo annuo', 'Additional annual saving')}: <strong>{row.complete ? money(row.annualSaving, lang) : '—'}</strong>; {t('lordo sul periodo', 'gross over term')}: {row.complete ? money(row.periodSaving, lang) : '—'}; {t('netto intervento', 'net of implementation')}: <strong>{row.complete ? money(row.netSaving, lang) : '—'}</strong>.</p>
        {preset && <p className="report-note">{t('Default di riferimento', 'Reference default')}: {preset.pct}% · {preset.benchmark ? t('benchmark osservato', 'observed benchmark') : t('ipotesi da validare', 'assumption to validate')}. {lang === 'it' ? preset.it : preset.en} <a href={preset.source}>{preset.sourceLabel}</a>.</p>}
        {plans?.[row.id]?.evidence?.trim() && <p className="report-evidence"><strong>{t('Note / evidenze inserite', 'Entered notes / evidence')}: </strong>{plans[row.id].evidence}</p>}
      </section>;
    })}
  </section>;
}

function Methodology({ lang, newBusiness }) {
  const t = wording(lang);
  return <section className="report-methodology"><h2>{t('Metodo e limiti della stima', 'Method and estimate limitations')}</h2>
    <p>{newBusiness ? t('Saving annuo = totale As-Is × percentuale di adozione o riduzione × risparmio unitario × quota eliminabile. Il saving netto di ciascuna leva sottrae soltanto il relativo intervento; il risultato complessivo di progetto include anche licenze HMC, progetto base e costi residui.', 'Annual saving = As-Is total × adoption or reduction percentage × unit saving × avoidable share. Each lever’s net saving deducts only its implementation cost; the overall project result also includes HMC licenses, the base project and residual costs.') : t('Saving annuo aggiuntivo = (obiettivo − già implementato) × risparmio unitario × quota eliminabile. I benefici delle quantità già adottate sono stime e non vengono aggiunti al saving disponibile per mitigare il rinnovo.', 'Additional annual saving = (target − already implemented) × unit saving × avoidable share. Benefits from existing adoption are estimates and are excluded from savings available to mitigate renewal costs.')}</p>
    <p>{t('Il beneficio sul periodo considera i mesi successivi all’attivazione, gli eventuali refresh futuri evitati e i costi di completamento. XenServer usa core per host × costo core/anno; NetScaler la manutenzione annua e, solo se selezionato, un refresh futuro; Unicon/eLux la differenza tra costo annuo endpoint prima e dopo l’intervento. Le licenze mensili sono annualizzate × 12.', 'Term benefits account for months after activation, any avoided future refresh and implementation costs. XenServer uses cores per host × annual core cost; NetScaler uses annual maintenance and, only when selected, a future refresh; Unicon/eLux uses the difference between annual endpoint costs before and after implementation. Monthly licenses are annualized × 12.')}</p>
    <p>{t('Le riduzioni di giornate rappresentano capacità liberata, non necessariamente minori esborsi. SOC, remediation e Operations devono avere basi distinte e costi effettivamente riducibili. Le percentuali iniziali sono modificabili: i benchmark non garantiscono il risultato del singolo cliente. Compatibilità, disponibilità delle funzionalità e costi evitabili devono essere confermati nel progetto.', 'Reductions in days represent released capacity, not necessarily lower cash spending. SOC, remediation and Operations require distinct baselines and actually reducible costs. Initial percentages are editable: benchmarks do not guarantee individual customer outcomes. Compatibility, feature availability and avoidable costs must be confirmed for the project.')}</p>
    <p className="report-note">{t('Gli importi sono espressi in euro e arrotondati per la visualizzazione; i calcoli usano i valori non arrotondati. Le voci incomplete non generano nuovo saving. Nessuna indicizzazione o attualizzazione finanziaria viene applicata.', 'Amounts are in euros and rounded for display; calculations use unrounded values. Incomplete items generate no new savings. No indexation or financial discounting is applied.')}</p>
  </section>;
}

export function NewBusinessReport({ lang, state, model, rowLabels, opportunityModel: scenario, plans }) {
  const t = wording(lang);
  return <article className="print-report" data-testid="new-business-report">
    <ReportHeader title="New Business ROI" scenario={scenario} lang={lang} profileComplete={
      [state.profile.horizonYears, state.profile.hmcPricePerUserPerMonth, state.profile.initialMigrationCost, state.residuals?.residualHardwareInfra, state.residuals?.residualServices].every(numeric)
    } />
    <section><h2>{t('Sintesi dello scenario', 'Scenario summary')}</h2><ScopeNarrative state={state} lang={lang} />
      <p>{t(`Lo scenario valuta l’introduzione di Citrix HMC su un orizzonte di ${model.projectYears} anni. Il canone indicato è ${amount(state.profile.hmcPricePerUserPerMonth, lang)} per utente al mese, con un costo base di progetto di ${amount(state.profile.initialMigrationCost, lang)}. Le adozioni e le riduzioni previste nelle singole schede determinano il risparmio atteso; gli interventi aggiuntivi ammontano a ${money(scenario.activationCost, lang)}.`, `The scenario evaluates the introduction of Citrix HMC over ${model.projectYears} years. The entered subscription is ${amount(state.profile.hmcPricePerUserPerMonth, lang)} per user per month, with a base project cost of ${amount(state.profile.initialMigrationCost, lang)}. Planned adoption and reductions in each card determine expected savings; additional implementation costs total ${money(scenario.activationCost, lang)}.`)}</p>
      <p>{t(`Il costo complessivo As-Is sul periodo è ${money(model.totalAsIs, lang)}, rispetto a ${money(model.totalHmc, lang)} dello scenario HMC, comprensivo di licenze, progetto e costi residui.`, `Total As-Is cost over the term is ${money(model.totalAsIs, lang)}, compared with ${money(model.totalHmc, lang)} for HMC, including licenses, project and residual costs.`)} {' '}{model.projectDelta >= 0 ? t(`Il modello stima un risparmio netto di ${money(model.projectDelta, lang)}.`, `The model estimates net savings of ${money(model.projectDelta, lang)}.`) : t(`Il modello stima un maggior costo di ${money(-model.projectDelta, lang)}: con queste ipotesi il nuovo progetto non si ripaga attraverso i risparmi quantificati nel periodo.`, `The model estimates an additional cost of ${money(-model.projectDelta, lang)}: under these assumptions, quantified savings do not cover the new project over the term.`)}</p>
      <LeadingOpportunities scenario={scenario} lang={lang} />
    </section>
    <h2>{t('Profilo economico e indicatori', 'Financial profile and indicators')}</h2>
    <DataTable lang={lang} rows={[
      [t('Durata progetto', 'Project duration'), `${number(state.profile.horizonYears, lang)} ${t('anni', 'years')}`],
      [t('Licenza HMC / utente / mese', 'HMC license / user / month'), amount(state.profile.hmcPricePerUserPerMonth, lang)],
      [t('Costo progetto base', 'Base project cost'), amount(state.profile.initialMigrationCost, lang)],
      [t('Interventi aggiuntivi conteggiati', 'Additional implementation costs included'), money(scenario.activationCost, lang)],
      [t('Hardware / infrastruttura residui annui', 'Annual residual hardware / infrastructure'), amount(state.residuals?.residualHardwareInfra, lang)],
      [t('Servizi residui annui', 'Annual residual services'), amount(state.residuals?.residualServices, lang)],
      [t('Saving annuo a regime prima delle licenze HMC', 'Annual saving at full operation before HMC licenses'), money(scenario.annualSaving, lang)],
      [t('Saving lordo sul periodo', 'Gross term saving'), money(scenario.periodSaving, lang)],
      [t('ROI progetto (delta TCO / TCO HMC)', 'Project ROI (TCO delta / HMC TCO)'), percentage(model.roiAnnual === null ? null : model.roiAnnual * 100, lang)],
    ]} />
    <section className="report-page"><h2>{t('Confronto economico sul periodo', 'Economic comparison over term')}</h2>
      <p>{t('Il confronto include la quota di costi As-Is mantenuta, i canoni HMC, i costi residui e gli interventi una tantum. Un delta positivo indica un risparmio.', 'The comparison includes retained As-Is costs, HMC subscriptions, residual costs and one-time implementation. A positive delta indicates savings.')}</p>
      <table><thead><tr><th>{t('Voce', 'Item')}</th><th>As-Is</th><th>HMC</th><th>Delta</th></tr></thead><tbody>{model.tableRows.map((row) => <tr key={row.key}><td>{rowLabels[row.key]}</td><td>{money(row.asIs, lang)}</td><td>{money(row.hmc, lang)}</td><td>{money(row.delta, lang)}</td></tr>)}<tr className="report-total"><td>{t('Totale', 'Total')}</td><td>{money(model.totalAsIs, lang)}</td><td>{money(model.totalHmc, lang)}</td><td>{money(model.projectDelta, lang)}</td></tr></tbody></table>
    </section>
    <AssessmentInputs state={state} lang={lang} />
    <OpportunityDetails scenario={scenario} plans={plans} lang={lang} />
    <Methodology lang={lang} newBusiness />
  </article>;
}

export function RenewalReport({ lang, state, profile, plans }) {
  const t = wording(lang);
  const years = Number(profile.renewalYears) || 1;
  const cost = Number(profile.totalRenewalCost) || 0;
  const scenario = calculateCustomerScenario(state, plans, profile.renewalType, years, cost);
  const comparison = calculateRenewalComparison(profile, scenario);
  const deltaText = !comparison.known ? t('Il confronto con il contratto precedente richiede costi e durate completi.', 'Comparison with the previous contract requires complete costs and durations.') : comparison.uplift === 0 ? t('Non risulta un aumento annuo da compensare rispetto al contratto precedente.', 'There is no annual increase to offset compared with the previous contract.') : t(`L’aumento normalizzato è ${money(comparison.annualUplift, lang)} all’anno, pari a ${money(comparison.uplift, lang)} sul periodo. Il saving copre il ${percentage(comparison.annualCoveragePct, lang)} del delta annuo a regime e il ${percentage(comparison.netCoveragePct, lang)} del delta sul periodo al netto di tempi e costi degli interventi.`, `The annualized increase is ${money(comparison.annualUplift, lang)}, totaling ${money(comparison.uplift, lang)} over the term. Savings cover ${percentage(comparison.annualCoveragePct, lang)} of the annual increase at full operation and ${percentage(comparison.netCoveragePct, lang)} of the term increase after implementation timing and costs.`);
  return <article className="print-report" data-testid="renewal-report">
    <ReportHeader title={`Renewal Value · ${profile.renewalType}`} scenario={scenario} lang={lang} profileComplete={comparison.known && numeric(profile.numberLicenses)} />
    <section><h2>{t('Sintesi dello scenario', 'Scenario summary')}</h2><ScopeNarrative state={state} lang={lang} />
      <p>{t(`L’analisi considera il rinnovo ${profile.renewalType} di ${number(profile.numberLicenses, lang)} licenze per ${number(profile.renewalYears, lang)} anni, a un costo proposto di ${amount(profile.totalRenewalCost, lang)}. Il cliente dispone già del prodotto: l’obiettivo è quantificare il beneficio ancora ottenibile completando l’adozione, senza conteggiare di nuovo i benefici già implementati.`, `The analysis considers renewal of ${number(profile.numberLicenses, lang)} ${profile.renewalType} licenses for ${number(profile.renewalYears, lang)} years at a proposed cost of ${amount(profile.totalRenewalCost, lang)}. The customer already has the product: the aim is to quantify the remaining benefit from completing adoption, without counting existing benefits again.`)}</p>
      <p>{t(`Le voci calcolabili generano un saving aggiuntivo annuo a regime di ${money(scenario.annualSaving, lang)} e un beneficio lordo di ${money(scenario.periodSaving, lang)} sul periodo. Sottraendo ${money(scenario.activationCost, lang)} di costi di completamento, il saving netto disponibile è ${money(scenario.netSaving, lang)}.`, `Calculable items generate additional annual savings of ${money(scenario.annualSaving, lang)} at full operation and gross benefits of ${money(scenario.periodSaving, lang)} over the term. After ${money(scenario.activationCost, lang)} in completion costs, available net savings are ${money(scenario.netSaving, lang)}.`)}</p>
      <p>{deltaText}</p><LeadingOpportunities scenario={scenario} lang={lang} />
    </section>
    <h2>{t('Profilo rinnovo: dati inseriti', 'Renewal profile: entered data')}</h2>
    <DataTable lang={lang} rows={[
      [t('Licenza rinnovata', 'Renewed license'), profile.renewalType], [t('Numero licenze', 'Number of licenses'), number(profile.numberLicenses, lang)],
      [t('Anni rinnovo proposto', 'Proposed renewal years'), number(profile.renewalYears, lang)], [t('Costo totale proposto', 'Proposed total cost'), amount(profile.totalRenewalCost, lang)],
      [t('Anni contratto precedente', 'Previous contract years'), number(profile.previousRenewalYears, lang)], [t('Costo contratto precedente', 'Previous contract cost'), amount(profile.previousRenewalCost, lang)],
      [t('Costo annuo proposto', 'Proposed annual cost'), numeric(profile.totalRenewalCost) ? money(cost / years, lang) : '—'],
      [t('Costo annuo precedente', 'Previous annual cost'), amount(comparison.previousAnnual, lang)],
      [t('Aumento percentuale annuo', 'Annual percentage increase'), percentage(comparison.increasePct, lang)],
    ]} />
    <section className="report-page"><h2>{t('Risultati: copertura del rinnovo', 'Results: renewal coverage')}</h2>
      <DataTable lang={lang} rows={[
        [t('Saving aggiuntivo annuo a regime', 'Additional annual saving at full operation'), money(scenario.annualSaving, lang)],
        [t('Saving lordo sul periodo', 'Gross term saving'), money(scenario.periodSaving, lang)], [t('Costi di completamento', 'Completion costs'), money(scenario.activationCost, lang)],
        [t('Saving netto disponibile', 'Available net savings'), money(scenario.netSaving, lang)], [t('Delta rinnovo annuo', 'Annual renewal uplift'), amount(comparison.annualUplift, lang)],
        [t('Delta rinnovo sul periodo', 'Term renewal uplift'), amount(comparison.uplift, lang)],
        [t('Copertura delta annuo a regime', 'Annual uplift coverage at full operation'), percentage(comparison.annualCoveragePct, lang)],
        [t('Copertura netta delta sul periodo', 'Net uplift coverage over term'), percentage(comparison.netCoveragePct, lang)],
        [t('Delta ancora da coprire sul periodo', 'Term uplift still to cover'), amount(comparison.remainingUplift, lang)],
        [t('Saving netto meno aumento rinnovo', 'Net saving minus renewal uplift'), comparison.known ? money(comparison.netAfterUplift, lang) : '—'],
        [t('Copertura costo totale rinnovo', 'Total renewal cost coverage'), percentage(scenario.coveragePct, lang)],
        [t('Costo rinnovo ancora da coprire', 'Renewal cost still to cover'), numeric(profile.totalRenewalCost) ? money(scenario.uncoveredRenewalCost, lang) : '—'],
        [t('Payback dei costi di completamento', 'Completion cost payback'), scenario.paybackMonths === null ? t('Non applicabile o oltre il periodo', 'Not applicable or beyond the term') : `${scenario.paybackMonths} ${t('mesi', 'months')}`],
      ]} />
      <p>{t('La copertura annua confronta il saving a regime con il delta annuo. La copertura netta sul periodo considera tempi e costi di completamento. Il 100% indica che l’aumento è compensato; un valore superiore indica un beneficio eccedente. Senza aumento la percentuale non è applicabile.', 'Annual coverage compares savings at full operation with the annual increase. Net term coverage accounts for activation timing and completion costs. At 100% the increase is offset; a higher value indicates surplus benefit. With no increase the percentage is not applicable.')}</p>
    </section>
    <AssessmentInputs state={state} lang={lang} />
    <OpportunityDetails scenario={scenario} plans={plans} lang={lang} />
    <Methodology lang={lang} />
  </article>;
}
