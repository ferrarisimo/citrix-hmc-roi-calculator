import React, { useMemo } from 'react';
import { AssessmentSummary, Card, Input, Metric, OpportunityPlanner, OpportunityTable, buttonStyle, money, wording } from './AssessmentWorkflow';
import { calculateCustomerScenario } from './models/customerAssessmentModel';

export default function RenewalAssessmentView({ lang, state, profile, setProfile, plans, setPlans, onEdit }) {
  const t = wording(lang);
  const years = Number(profile.renewalYears) || 1;
  const renewalCost = Number(profile.totalRenewalCost) || 0;
  const annual = renewalCost / years;
  const previousAnnual = (Number(profile.previousRenewalCost) || 0) / (Number(profile.previousRenewalYears) || 1);
  const increase = previousAnnual > 0 ? (annual - previousAnnual) / previousAnnual * 100 : null;
  const uplift = Math.max(0, annual - previousAnnual) * years;
  const model = useMemo(() => calculateCustomerScenario(state, plans, profile.renewalType, years, renewalCost), [state, plans, profile.renewalType, years, renewalCost]);
  const update = (key, value) => setProfile((p) => ({ ...p, [key]: value }));
  const yearSelect = (key, label) => <label className="block space-y-2 text-sm font-medium text-slate-700">{label}<select className="block w-full rounded-xl border border-slate-300 p-2.5" value={profile[key]} onChange={(e) => update(key, Number(e.target.value))}>{[1,3,5].map((value) => <option key={value} value={value}>{value}</option>)}</select></label>;
  const status = model.complete ? t('Scenario completato', 'Scenario complete') : `${t('Stima parziale · voci completate', 'Partial estimate · items completed')}: ${model.completed}/${model.rows.length}`;
  return <>
    <article className="print-report renewal-print"><header className="report-hero"><h1>Renewal Value · {profile.renewalType}</h1><p>{status}</p><p>{profile.numberLicenses} {t('licenze', 'licenses')} · {years} {t('anni', 'years')} · {money(renewalCost, lang)}</p></header><OpportunityTable model={model} lang={lang} /><h2>{t('Saving ancora ottenibile', 'Remaining savings opportunity')}</h2><p>{t('Saving annuo aggiuntivo', 'Additional annual saving')}: {money(model.annualSaving, lang)}. {t('Saving lordo sul periodo', 'Gross term saving')}: {money(model.periodSaving, lang)}. {t('Costi completamento', 'Completion costs')}: {money(model.activationCost, lang)}. {t('Saving netto disponibile', 'Available net saving')}: {money(model.netSaving, lang)}.</p><p>{t('Costo rinnovo ancora da coprire', 'Renewal cost still to cover')}: {money(model.uncoveredRenewalCost, lang)}.</p></article>
    <div className="space-y-6" data-testid="renewal-assessment-view">
      <Card title={t('Profilo rinnovo', 'Renewal profile', 'Perfil de renovación', 'Renewal-Profil')} subtitle={t('Dati economici del rinnovo e confronto con il contratto precedente.', 'Renewal financial data and comparison with the previous contract.')}>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          <label className="block space-y-2 text-sm font-medium text-slate-700">{t('Licenza rinnovata', 'Renewed license')}<select data-testid="renewal-type" value={profile.renewalType} onChange={(e) => update('renewalType', e.target.value)} className="block w-full rounded-xl border border-slate-300 p-2.5"><option>CPC</option><option>HMC</option></select></label>
          <Input label={t('Numero licenze', 'Number of licenses')} value={profile.numberLicenses} onChange={(v) => update('numberLicenses', v)} />
          <Metric label={t('Prezzo rinnovo per utente / anno', 'Renewal price per user / year')} value={profile.numberLicenses > 0 ? money(annual / profile.numberLicenses, lang) : '—'} />
          {yearSelect('renewalYears', t('Anni rinnovo', 'Renewal years'))}
          <Input label={t('Costo rinnovo totale proposto', 'Proposed total renewal cost')} suffix="€" value={profile.totalRenewalCost} onChange={(v) => update('totalRenewalCost', v)} />
        </div>
        <div className="mt-6 border-t pt-6"><h3 className="mb-4 text-sm font-semibold">{t('Confronto rinnovo precedente', 'Previous renewal comparison')}</h3><div className="grid gap-5 md:grid-cols-3"><Input label={t('Costo rinnovo precedente', 'Previous renewal cost')} suffix="€" value={profile.previousRenewalCost} onChange={(v) => update('previousRenewalCost', v)} />{yearSelect('previousRenewalYears', t('Anni rinnovo precedente', 'Previous renewal years'))}<Metric label={t('Aumento annuo vs precedente', 'Annual increase vs previous')} value={increase === null ? '—' : `${increase.toFixed(1)}%`} /></div></div>
        <div className="mt-5 grid gap-4 md:grid-cols-3"><Metric label={t('Costo rinnovo totale', 'Total renewal cost')} value={money(renewalCost, lang)} /><Metric label={t('Valore annuo rinnovo', 'Annual renewal value')} value={money(annual, lang)} /><Metric label={t('Valore annuo rinnovo precedente', 'Previous annual renewal value')} value={money(previousAnnual, lang)} /></div>
      </Card>
      <AssessmentSummary state={state} lang={lang} onEdit={onEdit} />
      <OpportunityPlanner state={state} plans={plans} setPlans={setPlans} offer={profile.renewalType} years={years} lang={lang} onEdit={onEdit} />
      <Card title={t('Saving ancora ottenibile', 'Remaining savings opportunity')} subtitle={status}>
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Metric label={t('Saving aggiuntivo annuo a regime', 'Additional annual saving at full operation')} value={money(model.annualSaving, lang)} />
          <Metric label={t('Saving lordo sul periodo', 'Gross saving over term')} value={money(model.periodSaving, lang)} hint={t('Tiene conto dei tempi di attivazione.', 'Accounts for activation timing.')} />
          <Metric label={t('Costi di completamento', 'Completion costs')} value={money(model.activationCost, lang)} />
          <Metric label={t('Saving netto disponibile', 'Available net saving')} value={money(model.netSaving, lang)} hint={t('Beneficio aggiuntivo meno costi di completamento.', 'Additional benefit minus completion costs.')} />
          <Metric label={t('Copertura del costo rinnovo', 'Renewal cost coverage')} value={model.coveragePct === null ? '—' : `${model.coveragePct.toFixed(1)}%`} />
          <Metric label={t('Costo rinnovo ancora da coprire', 'Renewal cost still to cover')} value={money(model.uncoveredRenewalCost, lang)} />
          <Metric label={t('Saving netto meno aumento rinnovo', 'Net saving minus renewal uplift')} value={money(model.netSaving - uplift, lang)} hint={`${t('Aumento sul periodo', 'Uplift over term')}: ${money(uplift, lang)}`} />
          <Metric label={t('Payback costi di completamento', 'Completion cost payback')} value={model.paybackMonths === null ? '—' : `${model.paybackMonths} ${t('mesi', 'months')}`} hint={t('Include i tempi di attivazione; — se assente o oltre il periodo.', 'Includes activation delay; — if absent or beyond the term.')} />
        </div>
        <p className="mt-5 text-sm leading-6 text-slate-500">{t('La copertura usa soltanto il saving aggiuntivo netto. I benefici già conseguiti sono esclusi dal nuovo saving. Le riduzioni di effort rappresentano capacità liberata, non necessariamente minori esborsi.', 'Coverage uses only additional net saving. Benefits already achieved are excluded from new saving. Effort reductions represent released capacity, not necessarily cash reductions.')}</p>
        <div className="mt-5"><OpportunityTable model={model} lang={lang} /></div>
        <button className={`${buttonStyle} mt-5`} onClick={() => window.print()}>{t('Stampa report', 'Print report', 'Imprimir informe', 'Bericht drucken')}</button>
      </Card>
    </div>
  </>;
}
