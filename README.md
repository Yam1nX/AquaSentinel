# AquaSentinel

AI-powered urban water early-warning and community decision-support platform —
built for the **OneAquaHealth IEEE Global Hackathon 2026**, Track 6: Resilience
Informatics.

AquaSentinel answers four questions for a monitored waterway:
1. **What** is the current water-quality risk?
2. **Is it getting worse?** — a real, explainable early-warning state (NORMAL /
   WATCH / WARNING / CRITICAL), computed from actual multi-year station history.
3. **Why** is the risk what it is? — SHAP explanations in both technical and
   plain-language form.
4. **What should happen next?** — decision-support recommendations, clearly
   labelled as suggestions, not regulatory instructions.

**Data source:** European Environment Agency — [Waterbase / WISE-6 Water Quality
dataset](https://www.eea.europa.eu/en/datahub/datahubitem-view/fbf3717c-cd7b-4785-933a-d0cf510542e1)
(real, not synthetic), filtered to river stations across 6 EU countries, 2010–2024
(40,638 station-year rows, 8,762 stations).

## On scientific honesty (please read before demoing)

- The model is **trained only on European rivers**. Bangladesh (Buriganga & Turag,
  Dhaka) is used for **independent external stress-testing only** — it was never
  used in training, and it is **not** described as "global validation" anywhere in
  this app.
- Bangladesh data are **three single-point-in-time field observations**, manually
  compiled from published studies — not a downloadable dataset, and **not a time
  series**. Because of this, there is no real historical trend to show for these
  sites. The app is explicit about this: real Bangladesh readings are shown as
  single points, and the temporal early-warning walkthrough for Bangladesh is a
  clearly labelled **DEMO SIMULATION**, deterministic and reproducible, never
  presented as a real observation.
- The Risk_Level label used for training is a **transparent, documented,
  rule-based screening threshold** (see `backend/app.py`, `compute_risk_points`) —
  not an official regulatory classification. Because the model is trained to
  reproduce this rule from its own input features, very high held-out accuracy
  (~99%) is expected and is **not** independent evidence that the rule reflects
  real-world ecological health — see `/api/model_card` for the full caveat.
- Every prediction reports **measured vs. estimated (imputed)** fields, and the
  confidence label is explicitly downgraded when a large share of inputs were
  estimated rather than measured.

## Research rigor pass (v4.1) — citations and related work

Two gaps a peer reviewer would flag immediately, now closed:

- **The risk rule is no longer uncited.** Every threshold in Section 4 (DO, BOD₅, Ammonium, pH,
  Nitrate, Total Phosphorus) is now traced to a specific regulatory or scientific source — EU
  Directive 2006/44/EC (noting honestly that it was repealed in 2013 and consolidated into the
  Water Framework Directive, so it's cited as a literature reference value, not current binding
  law), the still-in-force EU Nitrates Directive 91/676/EEC, and cross-jurisdictionally
  corroborated eutrophication thresholds (US EPA 1986, Brazilian CONAMA 357/2005). Full citations
  in the notebook's Section 4 and in `/api/provenance`.
- **A real Related Work section** now opens the notebook, covering ML for water-quality
  prediction, WQI methodology, cross-region/domain-adaptation approaches, conformal prediction in
  environmental science, and — importantly — **two prior ML studies on these exact rivers**
  (Nafsin & Li 2022 on Buriganga BOD₅; Nishat et al. 2025 on Dhaka's four rivers including Turag).
  This project is honestly positioned as complementary to that work, not competing with it: those
  studies train in-domain on Bangladeshi data; this project diagnoses what happens when a model
  trained *only* on European data is deployed on Bangladesh with zero retraining, and proposes a
  missingness-aware calibration fix that needs no target-domain labels.

## Real multi-year Bangladesh data (v4) — from single points to real history

The single-point Bangladesh observations (still included below) never had a time series behind
them — any "trend" for Bangladesh could only ever be a labelled DEMO SIMULATION. That gap is now
closed: **Bangladesh's own Department of Environment (DoE)** publishes an annual *River Water
Quality Report* — the same kind of official monitoring-agency source as the EEA data used for
training. We compiled real pH/DO/BOD₅ annual averages for **Buriganga and Turag** from four DoE
reports (2015, 2021, 2022, 2023): **9 real years each** (2010–2015, then 2021–2023 — 2016–2020 is
an honest, disclosed reporting gap, not bridged or estimated).

**The finding holds up at scale, not just on 3 points:** across all 18 of these real yearly
observations, the transparent rule-based label says *High* in 17/18 cases — the model predicts
*Medium* in every single one. The same systematic, imputation-driven under-call already found on
the 3 single-point sites, now confirmed on 6× more independent real observations across 9 years and
both rivers. See `/api/bangladesh/history/buriganga` and `/api/bangladesh/history/turag`, and the
"🇧🇩 Bangladesh Demo" tab's new real-history panel (shown above the single-point sites and demo
simulation, which both remain for their own purposes).

## The novelty: from a classifier to a genuine forecasting + decision-support system (v3)

Most water-quality hackathon prototypes stop at "classify this one reading as Low/Medium/High." AquaSentinel does two things beyond that, both **real, backtested, and honestly reported** — not marketing claims:

1. **A genuine one-year-ahead forecasting model** (`notebook/`, Section 8.4) — trained on real
   consecutive-year transitions at EU stations, **walk-forward validated**: trained only on
   transitions ending ≤2022, tested only on 2023–2024 (years it never saw during training). It
   beats a "nothing changes" persistence baseline on accuracy and macro-F1, concentrated on the
   Medium/High classes that matter for early warning. We also report the harder, honest number:
   of stations that *actually* worsen the following year, the model catches only a minority
   (~20% recall, ~45% precision) — a real, disclosed limitation, not hidden. This is what makes
   the pitch *"AquaSentinel predicts when a stream is likely to deteriorate"* literally true,
   with the caveats stated up front.
2. **Inspection Priority — decision support for limited resources** (`notebook/`, Section 8.5) —
   a transparent, auditable ranking of every station by current severity, early-warning state,
   forecast escalation, and data recency, so a resource-constrained agency knows *where to send
   an inspector first*, not just which stations are flagged. Every component of the score is
   inspectable — no black box.

Both are exposed via `/api/station/<id>/forecast` and `/api/priority`, and shown in the frontend
(the station panel's "forecast — next year" card, and the new "🎯 Inspection Priority" tab).

## What's new in the v2 honesty/completeness upgrade

- **Real multi-year early-warning system** for EU stations — `backend/station_history.json`
  (7,577 stations with ≥2 real recorded years, built from the raw EEA CSV) powers a
  documented, deterministic NORMAL/WATCH/WARNING/CRITICAL state machine
  (`classify_early_warning` in `app.py`) with explicit reasons, not vibes.
- **Bangladesh Demo mode** — real single-point field observations scored by the
  model, plus a deterministic 7-step DEMO SIMULATION walkthrough of the
  early-warning system, ending at the real measured reading.
- **Honest data completeness & confidence** — every prediction reports
  measured/estimated field counts and a confidence label that accounts for how
  much was imputed, not just the raw model probability.
- **Cross-Region Evaluation panel** — EU held-out performance (both a row-level
  split, matching the original notebook, and a harder station-level split with no
  leakage across years of the same site) alongside a small-sample Bangladesh
  stress test with real domain-shift z-scores. See `backend/scripts/build_eval_metrics.py`.
- **Citizen science** — `/api/citizen_reports`, a "📱 Report Local Water" form, and
  citizen markers on the map, clearly labelled as supplementary contextual signals.
- **Data & Methodology / Model Card** panel — real dataset facts pulled from the
  actual CSV (no hard-coded/invented numbers), documented limitations, and the
  full evaluation methodology.
- **Plain-language SHAP** — a toggle between technical SHAP values and
  human-readable explanations, careful to use "associated with," never "caused."

---

## Project structure

```
AquaSentinel/
├── notebook/                         # original AI/ML work
│   ├── AquaSentinel_notebook.ipynb
│   └── wise_river_wide.csv           # pre-filtered EEA dataset (~40k station-years)
├── backend/                          # Flask API
│   ├── app.py                        # all endpoints — see API reference below
│   ├── requirements.txt
│   ├── aquasentinel_model.pkl        # produced by the notebook
│   ├── aquasentinel_imputer.pkl      # produced by the notebook
│   ├── model_metadata.json           # produced by the notebook
│   ├── stations_for_map.json         # produced by the notebook
│   ├── station_history.json          # NEW v2 — real multi-year per-station history
│   ├── eval_metrics.json             # NEW v2 — honest, leakage-checked evaluation
│   ├── aquasentinel_forecast_model.pkl    # NEW v3 — one-year-ahead forecast model (notebook Sec. 8.4)
│   ├── aquasentinel_forecast_imputer.pkl  # NEW v3
│   ├── forecast_metrics.json         # NEW v3 — honest backtest vs. persistence baseline
│   ├── station_forecasts.json        # NEW v3 — per-station next-year forecast
│   ├── station_priority.json         # NEW v3 — ranked Inspection Priority list (notebook Sec. 8.5)
│   ├── provenance_facts.json         # NEW — real dataset provenance facts
│   ├── eu_distribution_stats.json    # NEW — EU parameter distributions (domain shift)
│   ├── citizen_reports.json          # NEW — citizen observation store
│   └── scripts/
│       ├── build_station_history.py  # regenerates station_history.json from the raw CSV
│       └── build_eval_metrics.py     # regenerates eval_metrics.json + provenance facts
└── frontend/                         # React + Tailwind + Leaflet UI
    ├── src/
    │   ├── App.jsx                   # tabbed dashboard: Europe / Bangladesh / Cross-Region / Methodology
    │   ├── api.js                    # NEW — centralized API client
    │   └── components/
    │       ├── Header.jsx
    │       ├── StationMap.jsx        # filters, legend, Bangladesh focus mode, citizen markers
    │       ├── ReadingForm.jsx
    │       ├── ResultPanel.jsx       # completeness, plain-language/technical toggle, recommendations
    │       ├── StationTrendPanel.jsx # NEW — real EU station history + early warning
    │       ├── BangladeshPanel.jsx   # NEW — Bangladesh Demo mode + demo stepper
    │       ├── CitizenReportForm.jsx # NEW
    │       ├── CrossRegionEval.jsx   # NEW
    │       ├── ProvenancePanel.jsx   # NEW — Data & Methodology / Model Card
    │       └── EarlyWarningBadge.jsx / DataCompleteness.jsx  # NEW — shared UI
    ├── package.json
    └── vite.config.js
```

The `.pkl` / `.json` files in `backend/` are already generated and included — you
can run the app immediately without re-running anything. Re-run the notebook only
if you want to retrain the model; re-run the two new scripts only if you want to
regenerate the real-data derived files from a different CSV.

---

## 1. Run the backend (Flask API)

```bash
cd backend
python3 -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
python3 app.py
```

Runs on **http://127.0.0.1:5000**. Check it's alive:
```bash
curl http://127.0.0.1:5000/api/health
```

## 2. Run the frontend (React)

In a second terminal:
```bash
cd frontend
npm install
npm run dev
```

Open **http://localhost:5173** — the dev server proxies `/api/*` calls to the Flask
backend automatically (see `vite.config.js`).

## 3. (Optional) Regenerate the real-data derived files

```bash
cd backend
python3 scripts/build_station_history.py   # -> station_history.json
python3 scripts/build_eval_metrics.py      # -> eval_metrics.json, provenance_facts.json, eu_distribution_stats.json
```

## 4. (Optional) Re-run the training notebook

```bash
cd notebook
pip install pandas numpy scikit-learn matplotlib seaborn shap jupyter
jupyter notebook AquaSentinel_notebook.ipynb
```
Running it end-to-end regenerates `aquasentinel_model.pkl`, `aquasentinel_imputer.pkl`,
`model_metadata.json`, and `stations_for_map.json` — copy the new versions into
`backend/` if you retrain, and re-run the two scripts above afterward.

---

## API reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/health` | GET | Sanity check, model info |
| `/api/stations` | GET | All EU monitoring stations (for the map) |
| `/api/station/<site_id>/history` | GET | Real multi-year trajectory + early-warning state for one EU station (includes embedded forecast) |
| `/api/station/<site_id>/forecast` | GET | Genuine one-year-ahead forecast, walk-forward backtested, with honest accuracy vs. persistence baseline |
| `/api/priority` | GET | Transparent Inspection Priority ranking (`?limit=`, `?state=`, `?country=`) |
| `/api/predict` | POST | `{ "pH": 7.1, "Dissolved oxygen": 5.2, ... }` → risk level, SHAP explanation, data completeness, recommendations. Any field can be omitted; it will be imputed and flagged. |
| `/api/defaults` | GET | Typical/median values, used to pre-fill the form |
| `/api/bangladesh/sites` | GET | Real single-point Bangladesh field observations, scored |
| `/api/bangladesh/history/<river>` | GET | Real multi-year history for `buriganga` or `turag` — official DoE data, 2010-2015 & 2021-2023 |
| `/api/bangladesh/demo/<site_key>` | GET | Deterministic DEMO SIMULATION early-warning walkthrough |
| `/api/cross_region_eval` | GET | EU held-out performance vs. Bangladesh small-sample stress test |
| `/api/provenance` | GET | Real dataset provenance facts |
| `/api/model_card` | GET | Purpose, training, honest evaluation, limitations |
| `/api/citizen_reports` | GET/POST | List / submit citizen observations |

---

## Known limitations (stated honestly, for the pitch/demo)

- The one-year-ahead forecast model provides a real, backtested lift over a "nothing changes"
  baseline, but only catches a minority (~20%) of stations that actually worsen the following
  year — annual aggregates likely miss the higher-frequency dynamics that drive real
  deterioration. Treat "escalation expected" as a real but partial signal, not a guarantee.

- This is a **screening tool, not a lab-grade test** — final decisions should still
  involve professional water testing.
- The EEA dataset has no official "risk level" label; we derive one from commonly
  used general freshwater-quality thresholds (documented in `app.py` and the
  notebook, Section 4). It is transparent and auditable, but not an official
  regulatory classification.
- The Bangladesh field observations are **manually compiled from published
  studies**, not a downloadable raw dataset, and are **not a time series** — used
  only for small-sample external stress-testing, never as training data.
- Because the training label is a transparent function of the same input features,
  the model's ~99% held-out accuracy reflects learning the rule faithfully, not
  independent proof the rule captures real ecological health.
- When several inputs are missing and get imputed, the confidence label is
  downgraded accordingly — the frontend surfaces this instead of hiding it.
- Citizen observations are supplementary contextual signals, not laboratory
  measurements, and are never converted into inferred chemical concentrations.
