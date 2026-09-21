import React, { useMemo } from 'react';
import { AssessmentSummary, Card, Input, Metric, OpportunityPlanner, OpportunityTable, buttonStyle, money, wording } from './AssessmentWorkflow';
import { calculateCustomerScenario, calculateRenewalComparison } from './models/customerAssessmentModel';

export default function RenewalAssessmentView({ stage = 'profile', onCompatibility, lang, state, profile, setProfile, plans, setPlans, onEdit, onReport }) {
  const t = wording(lang);
  const years = Number(profile.renewalYears) || 1;
  const renewalCost = Number(profile.totalRenewalCost) || 0;
  const annual = renewalCost / years;
  const model = useMemo(() => calculateCustomerScenario(state, plans, profile.renewalType, years, renewalCost), [state, plans, profile.renewalType, years, renewalCost]);
  const comparison = calculateRenewalComparison(profile, model);
  const { previousAnnual, increasePct: increase, uplift } = comparison;
  const percent = (value) => value === null ? '—' : `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1, minimumFractionDigits: 1 }).format(value)}%`;
  const deltaStatus = !comparison.known
    ? t('Completa i costi e le durate dei due contratti per calcolare il delta.', 'Complete both contract costs and durations to calculate the uplift.')
    : comparison.annualUplift === 0
      ? t('Nessun aumento annuo da recuperare.', 'No annual increase to recover.')
      : comparison.netCoveragePct >= 100
        ? t('Aumento del rinnovo interamente coperto sul periodo nello scenario stimato.', 'Renewal increase fully covered over the term in the estimated scenario.')
        : model.netSaving > 0
          ? t('Il saving aggiuntivo compensa una parte dell’aumento del rinnovo.', 'Additional savings offset part of the renewal increase.')
          : t('Lo scenario non genera ancora saving netto per coprire l’aumento.', 'The scenario does not yet generate net savings to cover the increase.');
  const deltaSummary = <div className="mb-5 rounded-2xl border border-blue-200 bg-blue-50 p-5" data-testid="renewal-delta-summary">
    <h3 className="font-semibold text-blue-950">{t('Recupero dell’aumento del rinnovo', 'Renewal increase recovery')}</h3>
    <p className="mt-1 text-sm text-blue-900">{deltaStatus}</p>
    <div className="mt-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <Metric label={t('Delta rinnovo annuo', 'Annual renewal uplift')} value={comparison.known ? money(comparison.annualUplift, lang) : '—'} hint={t('Costo annuo proposto − precedente, minimo 0.', 'Proposed annual cost − previous annual cost, minimum 0.')} />
      <Metric testId="renewal-annual-delta-coverage" label={t('Copertura delta annuo a regime', 'Annual uplift coverage at full operation')} value={percent(comparison.annualCoveragePct)} hint={`${comparison.annualUplift > 0 ? `${money(model.annualSaving, lang)} ÷ ${money(comparison.annualUplift, lang)}. ` : ''}${t('Prima dei costi di intervento e dei tempi di attivazione.', 'Before implementation costs and activation timing.')}`} />
      <Metric testId="renewal-net-delta-coverage" label={t('Copertura netta delta sul periodo', 'Net uplift coverage over term')} value={percent(comparison.netCoveragePct)} hint={`${uplift > 0 ? `${money(model.netSaving, lang)} ÷ ${money(uplift, lang)}. ` : ''}${t('Include tempi e costi di completamento.', 'Includes activation timing and completion costs.')}`} />
      <Metric label={t('Delta sul periodo ancora da coprire', 'Term uplift still to cover')} value={comparison.known ? money(comparison.remainingUplift, lang) : '—'} hint={t('Importo residuo dopo il saving netto.', 'Remaining amount after net savings.')} />
    </div>
    <p className="mt-3 text-xs leading-5 text-blue-900">{t('100% = aumento compensato. Oltre 100% = saving superiore all’aumento. Si considera solo il nuovo saving: i benefici delle quantità già adottate restano esclusi.', '100% = increase offset. Above 100% = savings exceed the increase. Only new savings count; benefits from already adopted quantities remain excluded.')}</p>
  </div>;
  const update = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const yearSelect = (key, label) => <label className="block space-y-2 text-sm font-medium text-slate-700">{label}<select className="block w-full rounded-xl border border-slate-300 p-2.5" value={profile[key]} onChange={(e) => update(key, Number(e.target.value))}>{[1,3,5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>;
  const status = model.complete ? t('Scenario completato', 'Scenario complete') : `${t('Stima parziale · voci completate', 'Partial estimate · items completed')}: ${model.completed}/${model.rows.length}`;
  return <>

    <div className="space-y-6" data-testid="renewal-assessment-view">
      <div hidden={stage !== 'profile'}><Card title={t('Profilo rinnovo', 'Renewal profile', 'Perfil de renovación', 'Renewal-Profil')} subtitle={t('Dati economici del rinnovo e confronto con il contratto precedente.', 'Renewal financial data and comparison with the previous contract.')}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="block space-y-2 text-sm font-medium text-slate-700">{t('Licenza rinnovata', 'Renewed license')}<select data-testid="renewal-type" value={profile.renewalType} onChange={(e) => update('renewalType', e.target.value)} className="block w-full rounded-xl border border-slate-300 p-2.5"><option>CPC</option><option>HMC</option></select></label>
          <Input label={t('Numero licenze', 'Number of licenses')} value={profile.numberLicenses} onChange={(v) => update('numberLicenses', v)} />
          <Metric label={t('Prezzo rinnovo per utente / anno', 'Renewal price per user / year')} value={profile.numberLicenses > 0 ? money(annual / profile.numberLicenses, lang) : '—'} />
          {yearSelect('renewalYears', t('Anni rinnovo', 'Renewal years'))}
          <Input help={t('Importo complessivo per tutti gli anni del rinnovo, non il canone annuo. Il modello calcola il valore annuo dalla durata.', 'Total amount for all renewal years, not the annual fee. The model annualizes it using the duration.')} label={t('Costo rinnovo totale proposto', 'Proposed total renewal cost')} suffix="€" value={profile.totalRenewalCost} onChange={(v) => update('totalRenewalCost', v)} />
        </div>
        <div className="mt-6 border-t pt-6"><h3 className="mb-4 text-sm font-semibold">{t('Confronto rinnovo precedente', 'Previous renewal comparison')}</h3><div className="grid gap-5 md:grid-cols-3"><Input help={t('Totale del contratto precedente sulla sua intera durata. Lascia vuoto se non disponibile: non equivale a zero.', 'Previous contract total over its full duration. Leave empty if unavailable; this is not zero.')} label={t('Costo rinnovo precedente', 'Previous renewal cost')} suffix="€" value={profile.previousRenewalCost} onChange={(v) => update('previousRenewalCost', v)} />{yearSelect('previousRenewalYears', t('Anni rinnovo precedente', 'Previous renewal years'))}<Metric label={t('Aumento annuo vs precedente', 'Annual increase vs previous')} value={percent(increase)} /></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3"><Metric label={t('Costo rinnovo totale', 'Total renewal cost')} value={money(renewalCost, lang)} /><Metric label={t('Valore annuo rinnovo', 'Annual renewal value')} value={money(annual, lang)} /><Metric label={t('Valore annuo rinnovo precedente', 'Previous annual renewal value')} value={previousAnnual === null ? '—' : money(previousAnnual, lang)} /></div>
      </Card>
      <AssessmentSummary state={state} lang={lang} onEdit={onEdit} /></div>
      <div hidden={stage !== 'adoption'}><OpportunityPlanner onCompatibility={onCompatibility} state={state} plans={plans} setPlans={setPlans} offer={profile.renewalType} years={years} lang={lang} onEdit={onEdit} /></div>
      <div hidden={stage !== 'results'}><Card title={t('Saving ancora ottenibile', 'Remaining savings opportunity')} subtitle={status}>
        {deltaSummary}
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label={t('Saving aggiuntivo annuo a regime', 'Additional annual saving at full operation')} value={money(model.annualSaving, lang)} />
          <Metric label={t('Saving lordo sul periodo', 'Gross saving over term')} value={money(model.periodSaving, lang)} hint={t('Tiene conto dei tempi di attivazione.', 'Accounts for activation timing.')} />
          <Metric label={t('Costi di completamento', 'Completion costs')} value={money(model.activationCost, lang)} />
          <Metric label={t('Saving netto disponibile', 'Available net saving')} value={money(model.netSaving, lang)} hint={t('Beneficio aggiuntivo meno costi di completamento.', 'Additional benefit minus completion costs.')} />
          <Metric label={t('Copertura del costo totale rinnovo', 'Total renewal cost coverage')} value={percent(model.coveragePct)} />
          <Metric label={t('Costo rinnovo ancora da coprire', 'Renewal cost still to cover')} value={money(model.uncoveredRenewalCost, lang)} />
          <Metric label={t('Saving netto meno aumento rinnovo', 'Net saving minus renewal uplift')} value={comparison.known ? money(comparison.netAfterUplift, lang) : '—'} hint={`${t('Aumento sul periodo', 'Uplift over term')}: ${comparison.known ? money(uplift, lang) : '—'}`} />
          <Metric label={t('Payback costi di completamento', 'Completion cost payback')} value={model.paybackMonths === null ? '—' : `${model.paybackMonths} ${t('mesi', 'months')}`} hint={t('Include i tempi di attivazione; — se assente o oltre il periodo.', 'Includes activation delay; — if absent or beyond the term.')} />
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-500">{t('La copertura usa soltanto il saving aggiuntivo netto. Il beneficio stimato della quota già adottata è escluso dal nuovo saving. Le riduzioni di effort rappresentano capacità liberata, non necessariamente minori esborsi.', 'Coverage uses only additional net saving. Estimated benefits of existing adoption are excluded from new saving. Effort reductions represent released capacity, not necessarily cash reductions.')}</p>
        <div className="mt-5"><OpportunityTable model={model} lang={lang} /></div>
        <button className={`${buttonStyle} mt-5`} onClick={onReport}>{t('Report', 'Report', 'Informe', 'Bericht')}</button>
      </Card></div>
    </div>
  </>;
}
