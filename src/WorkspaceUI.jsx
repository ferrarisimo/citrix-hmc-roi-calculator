import React, { createContext, useContext, useEffect, useId, useRef, useState } from 'react';
import { ArrowRight, Check, ChevronRight, CircleHelp, Layers3 } from 'lucide-react';
import { workspaceText } from './workspaceLabels';
import { assessmentGroups, groupStatus } from './assessmentFields';
export const WorkspaceLanguage = createContext('en');

export function FieldHelp({ text, label }) {
  const [open, setOpen] = useState(false);
  const root = useRef(null);
  const id = useId();
  const w = workspaceText(useContext(WorkspaceLanguage));
  useEffect(() => {
    if (!open) return;
    const close = event => { if (!root.current?.contains(event.target)) setOpen(false); };
    document.addEventListener('pointerdown', close);
    return () => document.removeEventListener('pointerdown', close);
  }, [open]);
  if (!text) return null;
  return <span className="field-help" ref={root} onKeyDown={event => { if (event.key === 'Escape') { setOpen(false); root.current?.querySelector('button')?.focus(); } }}>
    <button type="button" aria-label={`${w('help')}: ${label}`} aria-expanded={open} aria-controls={id} onClick={() => setOpen(!open)}><CircleHelp size={15} /></button>
    {open && <span className="help-popover" id={id} role="note">{text}</span>}
  </span>;
}

export function WelcomeWizard({ lang, onFinish, onResume, hasDraft }) {
  const w = workspaceText(lang);
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState('newBusiness');
  const [source, setSource] = useState('blank');
  const [group, setGroup] = useState('users');
  const [years, setYears] = useState(3);
  const heading = useRef(null);
  useEffect(() => { heading.current?.focus(); }, [step]);
  const choice = (value, selected, onSelect, title, detail) => <button type="button" className={`wizard-choice ${selected === value ? 'selected' : ''}`} aria-pressed={selected === value} onClick={() => onSelect(value)}><span className="choice-check">{selected === value ? <Check size={16}/> : null}</span><strong>{title}</strong>{detail && <span>{detail}</span>}</button>;
  return <main className="welcome-shell">
    <div className="welcome-brand"><Layers3 size={23}/><span>Citrix <strong>Value Studio</strong></span></div>
    <div className="welcome-layout"><div className="welcome-intro"><p className="eyebrow">ROI / RENEWAL</p><h1>{w('welcome')}</h1><p>{w('intro')}</p><ol className="wizard-progress">{['goal','start','scope','setup'].map((key, index) => <li key={key} aria-current={step === index ? 'step' : undefined} className={step >= index ? 'active' : ''}><span>{step > index ? <Check size={16}/> : index + 1}</span>{w(key)}</li>)}</ol><p className="welcome-footnote">{w('shared')}</p></div>
    <section className="wizard-panel"><div className="wizard-top"><span>{String(step + 1).padStart(2,'0')} / 04</span>{hasDraft && <button className="text-action" onClick={onResume}>{w('resume')} <ArrowRight size={15}/></button>}</div><h2 ref={heading} tabIndex={-1}>{w(['goal','start','scope','setup'][step])}</h2>
      {step === 0 && <div className="wizard-options">{choice('newBusiness',goal,setGoal,w('newBusiness'),w('businessHint'))}{choice('renewal',goal,setGoal,w('renewal'),w('renewalHint'))}</div>}
      {step === 1 && <><div className="wizard-options">{choice('blank',source,setSource,w('blank'),w('blankHint'))}{choice('example',source,setSource,w('example'),w('exampleHint'))}</div>{hasDraft && <p className="muted-note">{w('retained')}</p>}</>}
      {step === 2 && <><p className="muted-note">{w('scopeHint')}</p><div className="wizard-area-grid">{assessmentGroups.filter(g => !g.optional).map(g => <React.Fragment key={g.id}>{choice(g.id,group,setGroup,w(g.id))}</React.Fragment>)}</div></>}
      {step === 3 && <><div className="wizard-recap"><span>{w(goal)}</span><strong>{w(source)}</strong><span>{w(group)}</span></div><label className="field-label">{lang === 'it' ? 'Durata dell’analisi (anni)' : lang === 'es' ? 'Duración del análisis (años)' : lang === 'de' ? 'Analysezeitraum (Jahre)' : 'Analysis period (years)'}<select value={years} onChange={e => setYears(Number(e.target.value))}>{[1,3,5].map(n => <option key={n}>{n}</option>)}</select></label><p className="muted-note">{w('reviewHint')}</p></>}
      <div className="wizard-actions">{step > 0 ? <button className="secondary-button" onClick={() => setStep(step - 1)}>{w('back')}</button> : <span/>}<button className="primary-button" onClick={() => step < 3 ? setStep(step + 1) : onFinish({ goal, source, group, years })}>{w(step === 3 ? 'enter' : 'next')}<ArrowRight size={16}/></button></div>
      {!hasDraft && <button className="wizard-skip" onClick={() => onFinish({goal, source: 'example', group: 'users', years})}>{w('skip')}</button>}
    </section></div>
  </main>;
}

export function WorkspaceNav({ lang, mode, stage, setStage, onData, onMode }) {
  const w = workspaceText(lang);
  return <nav className="workspace-nav" aria-label={w('workspace')}>
    <button className={mode === 'assessment' ? 'active' : ''} aria-current={mode === 'assessment' ? 'step' : undefined} onClick={onData}><span>01</span>{w('data')}</button>
    {['profile','adoption','results'].map((key,i) => <button key={key} className={mode !== 'assessment' && stage === key ? 'active' : ''} aria-current={mode !== 'assessment' && stage === key ? 'step' : undefined} onClick={() => { if(mode === 'assessment') onMode(); setStage(key); }}><span>0{i+2}</span>{w(key)}<ChevronRight size={14}/></button>)}
  </nav>;
}

export function ReviewSummary({ lang, state, reviews, onGroup, children, origin }) {
  const w = workspaceText(lang);
  const groups = assessmentGroups.filter(g => !g.optional);
  const verified = groups.filter(g => groupStatus(g,state,reviews) === 'verified').length;
  return <aside className="review-summary"><p className="eyebrow">{w('workspace')}</p><h2>{w('checklist')} <span>{verified}/{groups.length}</span></h2><div className="review-progress" aria-hidden="true"><span style={{width:`${verified/groups.length*100}%`}}/></div><p className="muted-note">{w(origin === 'example' ? 'exampleBadge' : 'blankBadge')}</p><div className="review-list">{groups.map(g => { const status = groupStatus(g,state,reviews); return <button key={g.id} onClick={() => onGroup(g.id)}><span>{w(g.id)}</span><span className={`status-dot ${status}`} aria-label={w(status)} title={w(status)}>{status === 'verified' ? <Check size={13}/> : status === 'missing' ? '—' : '•'}</span></button>; })}</div>{children}<p className="summary-footnote">{w('capacity')}</p></aside>;
}
