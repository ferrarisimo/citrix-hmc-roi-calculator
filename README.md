# Citrix HMC ROI Webapp

Webapp React + Vite per simulare il valore economico dell’adozione Citrix HMC con dashboard, scenari, ipotesi di costo e dettaglio dei calcoli.

## Avvio locale

Prerequisiti: Node.js 20+.

```bash
npm install
npm run dev
```

Build produzione:

```bash
npm run build
npm run preview
```

## Deploy su Azure Web App con GitHub Actions

Il repository include una pipeline GitHub Actions in `.github/workflows/azure-webapp.yml`.

### 1) Crea la Web App su Azure

Esempio con Azure CLI:

```bash
az login
az group create --name rg-citrix-roi --location westeurope
az appservice plan create --name plan-citrix-roi --resource-group rg-citrix-roi --sku B1 --is-linux
az webapp create --name <NOME_UNIVOCO_WEBAPP> --resource-group rg-citrix-roi --plan plan-citrix-roi --runtime "NODE:20-lts"
```

### 2) Configura startup command (una sola volta)

```bash
az webapp config set \
  --resource-group rg-citrix-roi \
  --name <NOME_UNIVOCO_WEBAPP> \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

### 3) Aggiungi il secret su GitHub

> Se in Azure Portal compare l’errore **“Basic authentication is disabled”** quando clicchi su
> **Download publish profile**, abilita temporaneamente la basic auth per il deployment:
>
> - Portal: **Web App → Deployment Center → FTPS credentials** e abilita
>   **SCM Basic Auth Publishing Credentials** (e, se necessario, **FTP Basic Auth Publishing Credentials**).
>
> Dopo il download del profilo puoi disabilitarla di nuovo per maggiore sicurezza.

1. In Azure Portal apri la tua Web App.
2. Vai su **Download publish profile** e scarica il file.
3. In GitHub: **Settings → Secrets and variables → Actions → New repository secret**.
4. Nome secret: `AZURE_WEBAPP_PUBLISH_PROFILE`.
5. Incolla il contenuto del profilo di pubblicazione.

### 4) Personalizza il nome app nella pipeline

Nel file `.github/workflows/azure-webapp.yml` sostituisci:

- `AZURE_WEBAPP_NAME` con il nome reale della tua web app.

### Troubleshooting: pagina bianca o download di `index.html`

Se il deploy va a buon fine ma la Web App mostra pagina bianca o scarica `index.html`, verifica questi punti:

1. **Startup command su Azure (Linux App Service)**

```bash
az webapp config set \
  --resource-group rg-citrix-roi \
  --name citrix-hmc-roi-webapp \
  --startup-file "pm2 serve /home/site/wwwroot --no-daemon --spa"
```

2. **Deploy del contenuto `dist/` alla root di wwwroot**

La pipeline è configurata per pubblicare esplicitamente `dist/` (non l'intero workspace del job) verso Azure Web App.

3. **Verifica in DevTools (Network/Console)**

Controlla che richieste come `/assets/*.js` e `/assets/*.css` rispondano con `200` e `content-type` corretto.

### 5) Deploy

Fai push su `main`: la pipeline builda la webapp e pubblica `dist/` su Azure Web App.

## Assessment condiviso e scenari economici

**Assessment cliente** contiene soltanto parametri As-Is: volumi, costi unitari,
ciclo di rinnovo PC ed effort. Questi dati sono centralizzati: 4 host inseriti qui
compaiono sia in New Business sia in Renewal. Per Renewal il perimetro include
anche la quota già implementata; non inserire soltanto i volumi residui.

L'adozione si configura nelle rispettive schede, indipendentemente:

- **New Business**: percentuale prevista per ciascuna leva, con anteprima del
  saving immediata e quantità equivalenti (es. 30% di 8 host = 2,4 host equivalenti
  ai fini della simulazione). Non richiede adozione attuale e non utilizza le
  quantità inserite nel Renewal. Licenze HMC, durata e progetto base rimangono nel
  Profilo New Business; ogni leva può aggiungere un costo di intervento extra.
- **Renewal**: quantità già implementata, obiettivo totale raggiungibile e costo
  di completamento. L'obiettivo iniziale è il totale As-Is, modificabile in caso
  di vincoli tecnici. Quantità mancanti restano da compilare; 0 indica nessuna
  adozione. Host, utenti e dispositivi sono interi.

I dati rimangono disponibili durante i cambi vista nella sessione; non sono
salvati dopo un ricaricamento della pagina.

### Formule e ipotesi visibili

```
New Business: totale As-Is × % adozione prevista × saving unitario × quota eliminabile
Renewal: (obiettivo totale − già implementato) × saving unitario × quota eliminabile
```

Il saving sul periodo considera i mesi di attivazione e sottrae gli interventi
extra. I benefici della quota già adottata sono **stime calcolate**, non valori
consuntivi richiesti all'utente. Le ipotesi iniziali sono visibili e modificabili:
adozione New Business 0% per le leve di sostituzione; per effort IT e servizi
Security si applicano i default riportati sotto. Quota eliminabile 100%,
attivazione immediata e costo extra 0. Le percentuali New Business esprimono copertura o, per effort e servizi,
la riduzione delle giornate o del costo considerato.

- **XenServer**: core medi per host × costo core/anno.
- **NetScaler**: costo appliance × manutenzione annua. Solo selezionando un
  refresh futuro evitabile si aggiunge, una volta, quantità residua × costo
  appliance × quota eliminabile. Gli acquisti passati sono esclusi.
- **Unicon/eLux e lifecycle**: una sola leva; costo annuo prima = costo PC / ciclo
  As-Is; costo annuo dopo = costo sostituzione / ciclo dopo intervento. Ipotesi
  iniziale esplicita: ciclo As-Is + 2 anni e costo PC dell'assessment, modificabili.
- **MFA/ZTNA/EDR/Posture**: quantità × costo mensile × 12.
- **Effort IT**: giorni × costo giornata. Si tratta di capacità liberata e non
  necessariamente di una riduzione monetaria degli esborsi.
- **SOC e opportunità CPC manuali**: base annua dichiarata; il modello non
  inventa importi per rischi o costi privi di una base documentata.

Il modello attivo `src/models/customerAssessmentModel.js` alimenta input,
riepiloghi, TCO e report. Un cambio dei dati As-Is aggiorna entrambe le viste;
quantità già adottate o target non più validi vengono segnalati. I CSV di
compatibilità XenServer, eLux e NetScaler restano indipendenti.

Verifiche: `npm test`, `npm run build`, `npm run validate:i18n-data`.


### Copertura dell’aumento di rinnovo

Il riepilogo e il report mantengono la copertura del costo **totale** e aggiungono:

- Delta annuo = max(0, costo proposto / anni − costo precedente / anni precedenti).
- Copertura delta annuo a regime = saving aggiuntivo annuo / delta annuo × 100.
- Copertura netta delta sul periodo = (saving sul periodo − costi interventi) /
  (delta annuo × anni rinnovo) × 100. Include i ritardi di attivazione.
- Delta residuo = max(0, delta sul periodo − saving netto).

Con 9.720 €/anno di saving e un aumento di 10.000 €/anno la copertura è 97,2%.
Se il saving supera il delta si mostra anche oltre il 100%. I benefici già
implementati non sono aggiunti al nuovo saving. Senza aumento la percentuale è
non applicabile; senza il prezzo precedente il confronto resta da completare.

### Default New Business per IT e Security

Catalogo: `src/models/newBusinessDefaults.js`. Le percentuali si applicano una
sola volta al totale As-Is. Un valore esplicito di 0% le disattiva; un campo
svuotato resta incompleto. Il reset ripristina i default. Non modificano Renewal.

| Servizio | Riduzione iniziale | Natura del valore |
| --- | ---: | --- |
| IT Endpoint | 31% | Benchmark device management IDC, tabella 5 |
| IT Image / VDI | 35% | Applicazione al modello del benchmark infrastruttura IDC, tabella 3 |
| IT Support | 36% | Benchmark help desk IDC, tabella 4 |
| IT Access | 30% | Ipotesi del modello da validare |
| SOC / MSSP | 10% | Ipotesi su spesa rinegoziabile; 0% se contratto fisso |
| Remediation | 20% | Ipotesi su attività automatizzabili |
| Security Operations | 20% | Ipotesi su effort operativo |

Fonti visibili anche nelle schede e nel report:
[IDC 2024](https://www.citrix.com/content/dam/citrix/en_us/documents/data-sheet/the-business-value-of-hybrid-citrix-infrastructure.pdf),
[caso Citrix CSG](https://www.citrix.com/customer-success/csg.html),
[azioni automatiche Citrix](https://docs.citrix.com/en-us/security-analytics/policies-and-actions.html).
Le ultime due fonti descrivono meccanismi operativi, **non** convalidano i valori
10% e 20% del modello. Nessuna percentuale è una garanzia universale. Il benchmark
IDC riguarda sei organizzazioni ed è sponsorizzato da Citrix.

Esempio: 120 giornate Endpoint × 31% = 37,2 giornate liberate; residuo 82,8.
Impostando manualmente 40%: 48 liberate, 72 residue. Il costo si calcola dal
costo/giornata dell’assessment. Questa capacità non implica automaticamente
minori esborsi. SOC, remediation e Operations devono avere basi distinte per
non contare due volte le stesse attività. Leve di migrazione e sostituzione
licenze (inclusi EDR e posture) restano allo 0% fino alla definizione del perimetro.
