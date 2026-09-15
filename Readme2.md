<div align="center">

# 🌊 AquaSentinel
### Predictive Early-Warning & Decision-Support for Urban Stream Health

**OneAquaHealth IEEE Global Hackathon 2026**
**Challenge Track 6 - Resilience Informatics**

*"AquaSentinel doesn't just classify a water sample as safe or unsafe — it detects when a
stream is deteriorating, explains why, forecasts what happens next, and tells a
resource-constrained agency where to look first - honestly reporting what it does and
doesn't know along the way."*

</div>

---

## Table of contents

1. [Challenge track](#1-challenge-track)
2. [The problem & who it helps](#2-the-problem--who-it-helps)
3. [What makes this different (innovation)](#3-what-makes-this-different-innovation)
4. [The working prototype](#4-the-working-prototype)
5. [Connection to OneAquaHealth / One Health](#5-connection-to-oneaquahealth--one-health)
6. [Architecture & technology](#6-architecture--technology)
7. [How it works — a judge's walkthrough](#7-how-it-works--a-judges-walkthrough)
8. [Data & methodology](#8-data--methodology)
9. [Results — the honest numbers](#9-results--the-honest-numbers)
10. [Known limitations (stated on purpose)](#10-known-limitations-stated-on-purpose)
11. [Running it yourself](#11-running-it-yourself)
12. [Project structure](#12-project-structure)
13. [API reference](#13-api-reference)
14. [Data sources & acknowledgments](#14-data-sources--acknowledgments)

---

## 1. Challenge track

**Track 6 — Resilience Informatics.** AquaSentinel builds the informatics layer a
water-stressed community or agency needs to become *resilient* to deteriorating
freshwater conditions: not just a snapshot of current water quality, but a system that
detects trends, forecasts what's likely next, quantifies its own uncertainty honestly,
and helps decide where limited inspection resources should go first.

## 2. The problem & who it helps

Urban streams — especially in rapidly industrializing cities — can deteriorate faster
than conventional, low-frequency lab-sampling programmes can respond to. Two rivers in
Dhaka, Bangladesh, the **Buriganga** and the **Turag**, are both officially declared
**Ecologically Critical Areas** by the Government of Bangladesh, and remain severely
polluted more than a decade later.

Most existing water-quality dashboards answer one question: *"is this sample safe right
now?"* That's necessary but not sufficient for **resilience** — a community, a water
utility, or an environmental agency needs to know:

- **Is it getting worse?** — not just today's reading, but the real trend.
- **Why?** — which specific measurements are driving the risk, in plain language.
- **What's likely next year?** — a genuine forecast, not a guess.
- **Where should we act first?** — when you can't inspect everywhere, where matters most?
- **How sure are we?** — especially when some measurements simply aren't available.

**Who benefits:** local environmental agencies with limited inspection budgets (the
Inspection Priority tool), citizens near a monitored river (the map, plain-language
explanations, and citizen-reporting feature), and — importantly — **researchers and
policymakers evaluating whether models built in data-rich regions can be responsibly
deployed in data-scarce ones**, which is the project's core technical finding.

## 3. What makes this different (innovation)

Most hackathon water-quality projects stop at "train a classifier, report accuracy."
AquaSentinel goes four steps further, and every one of them is **real, tested, and
honestly reported** — not a marketing claim:

### 🔮 Genuine one-year-ahead forecasting
Not just "is this risky now" but "is it likely to get worse next year." Trained on
26,951 real consecutive-year transitions from EU monitoring stations, **walk-forward
validated** (trained only on data through 2022, tested only on 2023–2024 — years it
never saw). It beats a "nothing changes" persistence baseline, and the improvement is
**statistically significant** (McNemar's test, *p* = 0.0057) — not just a bigger number,
a real one.

### 🎯 Inspection Priority — decision support, not just alerts
A transparent, auditable ranking of every monitored station by current severity,
early-warning trend, forecast escalation, and data recency — so an agency with limited
inspectors knows *where to send them first*, not just a long list of red flags.

### 🚨 A real early-warning state machine
Four documented, deterministic states — NORMAL / WATCH / WARNING / CRITICAL — computed
from **actual multi-year station history** (7,577 real EU stations), not a black box.
Every alert comes with the specific reasons it fired.

### 🛡️ Missingness-aware conformal prediction *(the core research contribution)*
This is the project's central methodological finding, and it's the reason AquaSentinel
can be trusted in exactly the situation it's built for: **deploying a model where the
measurement capability is different from where it was trained.**

We show that naively calibrating a model's confidence on fully-measured training data,
then reusing that calibration on inputs missing four key nutrient parameters (the real
situation for Bangladesh, where the government's own monitoring programme doesn't
measure them) causes the model to *silently* claim 90% confidence while actually being
right only ~84% of the time. Calibrating separately for **the exact missingness pattern
encountered at inference** restores the guarantee to ~90% — and, crucially, makes the
model **honestly widen its answer** ("this could be Medium *or* High") instead of
guessing, in the cases where it genuinely can't tell. This is a general, reusable fix
for anyone deploying an ML model across a real-world measurement-capability gap — not
specific to water quality.

### 🔎 Out-of-distribution detection
Every prediction is checked against how far it sits from anything the model was
actually trained on (nearest-neighbour distance in the model's own feature space). When
applied to real Bangladesh data, 16 of 18 real yearly observations are flagged
out-of-distribution — and the two that *aren't* flagged are exactly the two years
(Turag 2022–2023) when the river's real Dissolved Oxygen genuinely recovered toward
typical European levels. The detector is tracking real water-quality conditions, not
an artifact of the data format.

## 4. The working prototype

This is a **fully working, end-to-end application** — not a slide deck describing an
idea:

- **Backend**: a Flask REST API serving a trained Random Forest classifier, a
  walk-forward-validated forecasting model, an out-of-distribution detector, and
  missingness-aware conformal calibration — 15+ endpoints, all tested.
- **Frontend**: a React + Leaflet dashboard with five tabs — live map of 7,810 EU
  monitoring stations with real-time filtering, a reading-entry form with SHAP
  explanations, an Inspection Priority ranked list, a Bangladesh panel showing real
  multi-year river history, and a Cross-Region Evaluation / Data & Methodology panel
  for full transparency.
- **Notebook**: the complete, executed, end-to-end data science pipeline — from raw
  EEA CSV through model training, evaluation, the forecasting model, the OOD detector,
  and the conformal calibration — every number in this README and in the accompanying
  research paper traces back to a cell in this notebook.

## 5. Connection to OneAquaHealth / One Health

Freshwater rivers sit at the intersection of environmental health and human health:
the same Buriganga and Turag waters that fail fisheries-protection thresholds are used
for irrigation, informal domestic use, and sit upstream of a city of over 20 million
people. A system that can flag deterioration early — and be honest about when it
*can't* tell — is directly in service of the One Health principle that environmental,
animal, and human health are interconnected and best managed together:

- **Freshwater ecosystems**: the early-warning system and forecasting model target
  ecological risk indicators (dissolved oxygen, organic load, nutrients) directly tied
  to aquatic ecosystem health and fish survivability (the risk thresholds themselves
  are drawn from EU and Bangladeshi fisheries-protection standards).
- **Environmental health → human health**: BOD, ammonium, and pathogen-adjacent
  indicators in urban rivers are well-established proxies for public-health-relevant
  water contamination from industrial and municipal waste.
- **Citizen engagement**: the "📱 Report Local Water" feature lets community members
  contribute supplementary observations (foam, smell, visible pollution), explicitly
  and honestly labelled as contextual signals rather than lab measurements — citizen
  science as part of the monitoring loop, not a replacement for it.
- **Resilience under real-world constraints**: the entire project is built around the
  reality that the regions most exposed to water-related health risk are often the
  regions with the least monitoring infrastructure — which is exactly the gap the
  conformal-prediction contribution addresses.

## 6. Architecture & technology

```
┌─────────────────────────┐        ┌──────────────────────────────┐
│   React + Vite frontend │  HTTP  │        Flask backend          │
│   • Leaflet map          │◄──────►│  • RandomForest classifier    │
│   • Tailwind UI           │        │  • SHAP explainability        │
│   • 5 dashboard tabs      │        │  • Forecast model (RF)        │
└─────────────────────────┘        │  • OOD detector (k-NN)        │
                                     │  • Conformal calibration       │
                                     └───────────────┬────────────────┘
                                                      │
                                     ┌───────────────▼────────────────┐
                                     │   Jupyter notebook (source of   │
                                     │   truth — every model/metric)   │
                                     └───────────────┬────────────────┘
                                                      │
                          ┌───────────────────────────┴───────────────────────────┐
                          │                                                       │
              ┌───────────▼───────────┐                             ┌────────────▼────────────┐
              │  EEA Waterbase (train) │                             │  Bangladesh DoE (test)    │
              │  40,638 rows, 8,762    │                             │  18 real yearly obs.,      │
              │  stations, 6 countries │                             │  Buriganga & Turag         │
              └────────────────────────┘                             └────────────────────────────┘
```

**Stack:** Python (scikit-learn, SHAP, pandas), Flask, React, Leaflet, Tailwind CSS,
Vite. No paid APIs, no proprietary services — everything runs on open data and open-
source tooling.

## 7. How it works — a judge's walkthrough

1. **Europe Monitoring tab** — explore 7,810 real EU stations on the map, filter by
   risk level or early-warning state, click any station for its real multi-year trend,
   early-warning status, and next-year forecast. Or enter a reading manually to see a
   live prediction with SHAP explanation (technical or plain-language) and a calibrated
   confidence set.
2. **🎯 Inspection Priority tab** — the ranked shortlist a real agency would use, with
   the scoring formula fully shown.
3. **🇧🇩 Bangladesh Demo tab** — real multi-year Buriganga/Turag history from official
   government reports, with the model's prediction shown *next to* the transparent
   rule-based label so the gap between them is visible, not hidden.
4. **Cross-Region Evaluation tab** — the honest EU-vs-Bangladesh comparison, including
   the out-of-distribution flags and domain-shift statistics.
5. **Data & Methodology tab** — the full model card: training data, evaluation
   methodology, and every stated limitation.

## 8. Data & methodology

- **Training data**: European Environment Agency Waterbase (WISE-6), river stations,
  2010–2024, 6 countries, 40,638 station-year rows — real, public, open data.
- **External test data**: Bangladesh Department of Environment's own annual *River
  Water Quality Reports* (2015, 2021, 2022, 2023) — 18 real yearly observations across
  the Buriganga and Turag, with an honestly disclosed 2016–2020 reporting gap that is
  not bridged or estimated.
- **Risk label**: a transparent, points-based rule, cited against EU Directive
  2006/44/EC, the EU Nitrates Directive 91/676/EEC, US EPA guidance, and — notably —
  independently corroborated by Bangladesh's *own* legal water-quality standard under
  its Environmental Conservation Rules, 1997, which uses nearly identical thresholds.
- **Model**: Random Forest (300 trees), evaluated under both a standard row-level split
  and a stricter station-level split that prevents any station's data from leaking
  between train and test.

## 9. Results — the honest numbers

| What | Result |
|---|---|
| Classification accuracy (station-level held-out split) | 99.4% (macro-F1 0.98) |
| Forecast model vs. "nothing changes" baseline | 85.9% vs 85.0% accuracy — **statistically significant**, *p*=0.0057 |
| Conformal coverage, naive calibration | 84.3% (claims 90% — silently overconfident) |
| Conformal coverage, missingness-matched calibration | 90.4%, honestly hedges 13.4% of the time — **p<10⁻⁶ improvement** |
| Bangladesh: model vs. rule-based label agreement | 1 of 18 real yearly observations — a systematic, explainable gap, not noise |
| Bangladesh: out-of-distribution flag rate | 16 of 18, with the 2 exceptions matching a real, independently measured DO recovery |

## 10. Known limitations (stated on purpose)

We consider honestly-stated limitations a feature, not a weakness, of this submission:

- The forecast model only catches ~20% of stations that *actually* worsen the
  following year — a real, disclosed gap, not hidden behind the headline accuracy
  number.
- The Bangladesh evidence (18 real observations, 2 rivers) is illustrative and
  mechanistically well-explained, not a statistically powered multi-region validation.
- The risk label is a transparent prototype screening rule, not an official regulatory
  classification for any jurisdiction.
- The early-warning state machine doesn't yet distinguish *chronic* severe pollution
  from *acutely emerging* deterioration — both currently register as CRITICAL.
- This is a **screening tool, not a laboratory replacement** — every part of the app
  says so.

## 11. Running it yourself

```bash
# Backend
cd backend
python3 -m venv venv && source venv/bin/activate
pip install -r requirements.txt
python3 app.py                      # → http://127.0.0.1:5000

# Frontend (second terminal)
cd frontend
npm install
npm run dev                         # → http://localhost:5173
```

All trained models and derived data files are already included — no retraining
required to run the live app. To reproduce everything from raw data, open
`notebook/AquaSentinel_notebook.ipynb` and run it top to bottom.

## 12. Project structure

```
AquaSentinel/
├── notebook/                 # the full, executed data-science pipeline (source of truth)
│   ├── AquaSentinel_notebook.ipynb
│   └── wise_river_wide.csv
├── backend/                  # Flask API
│   ├── app.py                 # all endpoints
│   ├── requirements.txt
│   └── *.pkl / *.json         # trained models + derived data (pre-built, ready to run)
└── frontend/                  # React + Leaflet dashboard
    └── src/
        ├── App.jsx
        └── components/
```

## 13. API reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/predict` | POST | Risk prediction + SHAP explanation + calibrated confidence set |
| `/api/station/<id>/history` | GET | Real multi-year EU station trend + early-warning state |
| `/api/station/<id>/forecast` | GET | Backtested one-year-ahead forecast |
| `/api/priority` | GET | Transparent Inspection Priority ranking |
| `/api/bangladesh/history/<river>` | GET | Real multi-year Buriganga/Turag history |
| `/api/cross_region_eval` | GET | EU vs. Bangladesh honest comparison |
| `/api/model_card` | GET | Full model card: training, evaluation, limitations |
| `/api/citizen_reports` | GET/POST | Citizen water observations |

*(Full endpoint list in `backend/app.py`.)*

## 14. Data sources & acknowledgments

- European Environment Agency, [Waterbase (WISE-6) Water Quality dataset](https://www.eea.europa.eu/en/datahub/datahubitem-view/fbf3717c-cd7b-4785-933a-d0cf510542e1)
- Bangladesh Department of Environment, *River Water Quality Report* (2015, 2021, 2022, 2023)
- Built for the OneAquaHealth IEEE Global Hackathon 2026, Track 6: Resilience Informatics

---

<div align="center">

**AquaSentinel does not replace laboratory testing. It helps decide where to look
sooner, why risk is changing, and when action may be needed — honestly reporting what
it does and doesn't know.**

</div>