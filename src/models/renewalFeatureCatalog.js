export const RENEWAL_FEATURES = [
  {
    id: 'xenserver',
    label: 'XenServer adoption',
    availableFor: ['CPC', 'HMC'],
    category: 'Hypervisor',
    description: 'Riduzione o eliminazione dei costi hypervisor di terze parti.',
    calculationKey: 'xenserver',
    adoption: {
      xenserver: {
        currentAdopted: true,
        currentAdoptionPct: 40,
        targetAdoptable: true,
        potentialAdoptionPct: 90,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'cvadPremiumFeatures',
    label: 'CVAD premium features',
    availableFor: ['CPC'],
    category: 'Virtual Apps and Desktops',
    description: 'Valore da consolidamento o adozione di feature premium non ancora implementate.',
    calculationKey: 'manualCvadPremium',
    adoption: {
      cvadPremiumFeatures: {
        currentAdopted: false,
        currentAdoptionPct: 10,
        targetAdoptable: true,
        potentialAdoptionPct: 65,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'platformRiskReduction',
    label: 'Platform risk reduction',
    availableFor: ['CPC'],
    category: 'Risk',
    description: 'Riduzione del rischio operativo e dei costi di piattaforma.',
    calculationKey: 'manualPlatformRisk',
    adoption: {
      platformRiskReduction: {
        currentAdopted: false,
        currentAdoptionPct: 15,
        targetAdoptable: true,
        potentialAdoptionPct: 70,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'infrastructureOptimization',
    label: 'Infrastructure optimization',
    availableFor: ['CPC'],
    category: 'Infrastructure',
    description: 'Ottimizzazione infrastrutturale abilitata dal rinnovo.',
    calculationKey: 'manualInfrastructureOptimization',
    adoption: {
      infrastructureOptimization: {
        currentAdopted: false,
        currentAdoptionPct: 20,
        targetAdoptable: true,
        potentialAdoptionPct: 75,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'netscaler',
    label: 'NetScaler',
    availableFor: ['HMC'],
    category: 'Access / ADC',
    description: 'Riduzione costi VPN, ADC e appliance sovrapposte.',
    calculationKey: 'netscaler',
    adoption: {
      netscaler: {
        currentAdopted: false,
        currentAdoptionPct: 25,
        targetAdoptable: true,
        potentialAdoptionPct: 85,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'uniconElux',
    label: 'Unicon/eLux',
    availableFor: ['HMC'],
    category: 'Endpoint',
    description: 'Estensione vita endpoint e conversione dispositivi compatibili.',
    calculationKey: 'uniconElux',
    adoption: {
      uniconElux: {
        currentAdopted: false,
        currentAdoptionPct: 10,
        targetAdoptable: true,
        potentialAdoptionPct: 70,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'endpointLifecycleExtension',
    label: 'Endpoint lifecycle extension',
    availableFor: ['HMC'],
    category: 'Endpoint',
    description: 'Riduzione refresh PC tramite estensione lifecycle.',
    calculationKey: 'endpointLifecycle',
    adoption: {
      endpointLifecycleExtension: {
        currentAdopted: true,
        currentAdoptionPct: 35,
        targetAdoptable: true,
        potentialAdoptionPct: 80,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'mfaZtnaOverlapReduction',
    label: 'MFA/ZTNA overlap reduction',
    availableFor: ['HMC'],
    category: 'Security',
    description: 'Riduzione costi di strumenti MFA/ZTNA sovrapposti.',
    calculationKey: 'mfaZtna',
    adoption: {
      mfaZtnaOverlapReduction: {
        currentAdopted: false,
        currentAdoptionPct: 20,
        targetAdoptable: true,
        potentialAdoptionPct: 75,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'itEffortReduction',
    label: 'IT effort reduction',
    availableFor: ['HMC'],
    category: 'Operations',
    description: 'Riduzione effort IT operativo.',
    calculationKey: 'itEffort',
    adoption: {
      itEffortReduction: {
        currentAdopted: true,
        currentAdoptionPct: 30,
        targetAdoptable: true,
        potentialAdoptionPct: 70,
        manualAnnualSaving: 0,
      },
    },
  },
  {
    id: 'edrPostureSocOptimization',
    label: 'EDR/Posture/SOC optimization',
    availableFor: ['HMC'],
    category: 'Security',
    description: 'Riduzione costi residui EDR, posture, SOC e remediation.',
    calculationKey: 'securityOps',
    adoption: {
      edrPostureSocOptimization: {
        currentAdopted: false,
        currentAdoptionPct: 15,
        targetAdoptable: true,
        potentialAdoptionPct: 65,
        manualAnnualSaving: 0,
      },
    },
  },
];

// Assessment-oriented catalog. Unlike the legacy catalog above, this contains
// no customer adoption defaults and no assumed savings. It only describes what
// can be assessed for each renewal offer and which enablement service can turn
// the capability into an actionable opportunity.
export const RENEWAL_ASSESSMENT_FEATURES = [
  {
    id: 'xenserver',
    label: 'XenServer',
    availableFor: ['CPC', 'HMC'],
    category: 'Hypervisor',
    question: {
      it: 'Quale quota dei workload Citrix gira oggi su hypervisor di terze parti?',
      en: 'What share of Citrix workloads currently runs on third-party hypervisors?',
    },
    valueLever: {
      it: 'Riduzione di licenze e supporto hypervisor sovrapposti.',
      en: 'Reduce overlapping hypervisor licensing and support costs.',
    },
    service: {
      it: 'Assessment compatibilità, piano di migrazione e pilot XenServer',
      en: 'Compatibility assessment, migration plan, and XenServer pilot',
    },
  },
  {
    id: 'cvadPremium',
    label: 'CVAD Premium capabilities',
    availableFor: ['CPC'],
    category: 'Virtual Apps and Desktops',
    question: {
      it: 'Quali funzionalità Premium incluse sono attive e su quanti utenti?',
      en: 'Which included Premium capabilities are active, and for how many users?',
    },
    valueLever: {
      it: 'Adozione di funzionalità già incluse e riduzione di prodotti sovrapposti.',
      en: 'Adopt already-included capabilities and reduce overlapping products.',
    },
    service: {
      it: 'Capability workshop, design e piano di adozione CVAD',
      en: 'Capability workshop, design, and CVAD adoption plan',
    },
  },
  {
    id: 'netscaler',
    label: 'NetScaler',
    availableFor: ['HMC'],
    category: 'Access / ADC',
    question: {
      it: 'Quali servizi VPN, ADC, load balancing o WAF sono acquistati separatamente?',
      en: 'Which VPN, ADC, load-balancing, or WAF services are purchased separately?',
    },
    valueLever: {
      it: 'Consolidamento di appliance e servizi di application delivery.',
      en: 'Consolidate appliances and application-delivery services.',
    },
    service: {
      it: 'Discovery NetScaler, assessment configurazioni e piano di consolidamento',
      en: 'NetScaler discovery, configuration assessment, and consolidation plan',
    },
  },
  {
    id: 'endpointLifecycle',
    label: 'Unicon/eLux & endpoint lifecycle',
    availableFor: ['HMC'],
    category: 'Endpoint',
    question: {
      it: 'Quanti endpoint possono essere convertiti o mantenuti più a lungo evitando il refresh?',
      en: 'How many endpoints can be converted or retained longer to avoid refresh?',
    },
    valueLever: {
      it: 'Estensione del ciclo di vita endpoint senza duplicare il beneficio eLux.',
      en: 'Extend endpoint lifecycle without double-counting the eLux benefit.',
    },
    service: {
      it: 'Assessment hardware eLux, pilot endpoint e piano di rollout',
      en: 'eLux hardware assessment, endpoint pilot, and rollout plan',
    },
  },
  {
    id: 'secureAccess',
    label: 'Adaptive Authentication & Secure Private Access',
    availableFor: ['HMC'],
    category: 'Security / Access',
    question: {
      it: 'Quali costi MFA, ZTNA o VPN possono essere ridotti dopo la validazione tecnica?',
      en: 'Which MFA, ZTNA, or VPN costs can be reduced after technical validation?',
    },
    valueLever: {
      it: 'Riduzione selettiva di servizi di accesso e autenticazione sovrapposti.',
      en: 'Selectively reduce overlapping access and authentication services.',
    },
    service: {
      it: 'Access security workshop, policy design e pilot utenti',
      en: 'Access-security workshop, policy design, and user pilot',
    },
  },
  {
    id: 'operations',
    label: 'Citrix operations & observability',
    availableFor: ['CPC', 'HMC'],
    category: 'Operations',
    question: {
      it: 'Quanto effort viene speso oggi per immagini, supporto, accessi e troubleshooting?',
      en: 'How much effort is currently spent on images, support, access, and troubleshooting?',
    },
    valueLever: {
      it: 'Riduzione misurabile dell’effort operativo tramite automazione e observability.',
      en: 'Measurably reduce operational effort through automation and observability.',
    },
    service: {
      it: 'Operations baseline, use-case workshop e piano di automazione',
      en: 'Operations baseline, use-case workshop, and automation plan',
    },
  },
  {
    id: 'securityOperations',
    label: 'Security analytics & session protection',
    availableFor: ['HMC'],
    category: 'Security',
    question: {
      it: 'Quali costi EDR, posture, SOC o remediation sono realmente sovrapposti alle capability HMC?',
      en: 'Which EDR, posture, SOC, or remediation costs genuinely overlap HMC capabilities?',
    },
    valueLever: {
      it: 'Ottimizzazione dei soli costi verificati come sostituibili, mantenendo i residui.',
      en: 'Optimize only verified replaceable costs while retaining residual spend.',
    },
    service: {
      it: 'Security use-case assessment, integrazione SIEM e piano di adozione',
      en: 'Security use-case assessment, SIEM integration, and adoption plan',
    },
  },
];
