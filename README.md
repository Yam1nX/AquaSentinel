<a name="top"></a>
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B5FFF,50:2E9BFF,100:12B886&height=200&section=header&text=AquaSentinel&fontSize=52&fontColor=FFFFFF&animation=fadeIn&fontAlignY=38&desc=Predictive%20Early-Warning%20for%20Urban%20Stream%20Health&descAlignY=58&descSize=18" width="100%" alt="AquaSentinel banner" />
</p>

<div align="center">



<img src="https://readme-typing-svg.demolab.com/?font=Fira+Code&weight=500&size=20&duration=2800&pause=900&color=2E9BFF&center=true&vCenter=true&width=680&lines=Predictive+Early-Warning+and+Decision+Support;Detecting+Change+%C2%B7+Explaining+Risk+%C2%B7+Forecasting+Ahead;Prioritizing+Inspection+for+Urban+Stream+Health" alt="Typing SVG" />

[![Track](https://img.shields.io/badge/IEEE%20Global%20Hackathon-2026-1D4ED8?style=for-the-badge&labelColor=172033)](#)
[![Challenge](https://img.shields.io/badge/Track%206-Resilience%20Informatics-0F9D8A?style=for-the-badge&labelColor=172033)](#)
[![Backend](https://img.shields.io/badge/Backend-Flask-E67E22?style=for-the-badge&logo=flask&logoColor=white&labelColor=172033)](#)
[![Frontend](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-7C3AED?style=for-the-badge&logo=react&logoColor=61DAFB&labelColor=172033)](#)

<br/>

**A practical water-quality intelligence system for detecting change, explaining risk, forecasting the next year, and prioritizing inspection.**

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0B5FFF,50:2E9BFF,100:12B886&height=3&width=1200" width="100%" alt="divider" />
</p>

## Overview
<div align="center">
<img width="1152" height="648" alt="Seeing Water Quality Data" src="https://github.com/user-attachments/assets/322286bf-4209-4253-96b6-4972d69cc221" />
<!-- <img width="1280" height="720" alt="AquaSentinel_Animated" src="https://github.com/user-attachments/assets/38e960fe-e8ce-4463-92fc-2f1d01eb5ca3" /> -->
<details>
<summary><strong>Explore the AquaSentinel Interface</strong></summary>

<br/>

| Dashboard | Risk Analysis |
|:---:|:---:|
| <img width="755" height="872" alt="overview" src="https://github.com/user-attachments/assets/ad44a517-fca9-42a0-8660-3e19c2364625" /> | <img width="1503" height="950" alt="1b" src="https://github.com/user-attachments/assets/3f6250a6-5cb9-47cd-94b1-850ae5b04c04" /> |

| Inspection Priority | SHAP Explanation |
|:---:|:---:|
| <img width="872" height="952" alt="2b" src="https://github.com/user-attachments/assets/16e44d92-5163-4a1e-89bc-9377a04260bc" /> | <img width="1916" height="913" alt="Screenshot 2026-09-22 012459" src="https://github.com/user-attachments/assets/8f8fc219-f559-42bd-8db4-e4311d51f634" /> |

| Dhaka Observatory | Bangladesh Demo |
|:---:|:---:|
| <img width="1244" height="806" alt="Screenshot 2026-09-22 012737" src="https://github.com/user-attachments/assets/2df2ef5c-df74-4754-9974-742d66651e1b" /> | <img width="1912" height="918" alt="Bangladesh Demo" src="https://github.com/user-attachments/assets/3df81cae-bc3e-4bd8-af48-fe43db27def8" /> |

| Legal Compilance | Data & Methodology |
|:---:|:---:|
| <img width="1045" height="822" alt="Legal Compilance" src="https://github.com/user-attachments/assets/47def31f-dd45-4ac3-a771-20243e5fad8c" /> | <img width="874" height="942" alt="5" src="https://github.com/user-attachments/assets/c63f4219-080e-4343-938e-0beaa769ac28" /> |
</div>

</details>
AquaSentinel is a full-stack water-quality monitoring and decision-support prototype for urban rivers. It combines a Random Forest classifier with one-year-ahead forecasting, SHAP explanations, out-of-distribution detection, and missingness-matched conformal prediction.

The model-development dataset is drawn from the European Environment Agency Waterbase. External evaluation now spans **three real, independently-sourced Bangladesh panels**: (1) a 41 river-year panel across the **Buriganga, Turag, and Shitalakhya** rivers (2010-2023, 13,976 underlying raw observations, with the DoE 2016 report's own trend table closing the earlier 2016 gap for all three rivers), (2) a statistically powered 28-river, 2,070-station-month panel built directly from DoE's monthly annex tables (2021-2023), and (3) the REACH-Dhaka field campaign (University of Oxford, 2017-2021), which is the only source with real Ammonium/Nitrate measurements for this region. The application is designed for environmental agencies that need to identify deteriorating stations and prioritize follow-up inspections under limited monitoring capacity.

> **Important scope statement:** AquaSentinel is a screening and prioritization tool. It does not replace laboratory testing, field inspection, or regulatory assessment.

This project was developed for the **OneAquaHealth IEEE Global Hackathon 2026 - Challenge Track 6: Resilience Informatics**.

## Why this project matters

A current water-quality classification answers only one part of an operational problem. A monitoring team also needs to know whether conditions are worsening, which variables are contributing to the result, what may happen next year, where inspection effort should be directed, and whether the model is operating outside its training distribution.

AquaSentinel brings these questions into one workflow:

| Operational question | AquaSentinel component |
|---|---|
| What is the current risk? | Random Forest classification |
| Which variables drive the result? | SHAP explanation |
| Is the station deteriorating? | Multi-year early-warning state machine |
| What may happen next year? | Walk-forward forecast model |
| Where should an agency inspect first? | Inspection Priority ranking |
| Is the input unlike the training data? | k-nearest-neighbour OOD detector |
| How should uncertainty change with missing data? | Missingness-matched conformal prediction |

<p align="center">
  <a href="#main-contributions"><img src="https://img.shields.io/badge/Contributions-006D77?style=for-the-badge&labelColor=00545C"></a>
  <a href="#application-overview"><img src="https://img.shields.io/badge/Overview-008C99?style=for-the-badge&labelColor=006B75"></a>
  <a href="#one-health-connection"><img src="https://img.shields.io/badge/One%20Health-0A7C86?style=for-the-badge&labelColor=08646C"></a>
  <a href="#architecture"><img src="https://img.shields.io/badge/Architecture-158F9C?style=for-the-badge&labelColor=11727C"></a>
  <a href="#data-and-methodology"><img src="https://img.shields.io/badge/Methodology-219EBC?style=for-the-badge&labelColor=197F98"></a>
  <a href="#evaluation-at-a-glance"><img src="https://img.shields.io/badge/Evaluation-3AAFB9?style=for-the-badge&labelColor=2B8D96"></a>
  <a href="#limitations"><img src="https://img.shields.io/badge/Limitations-4F858A?style=for-the-badge&labelColor=416E72"></a>
  <a href="#data-sources-and-acknowledgments"><img src="https://img.shields.io/badge/Sources-397D8A?style=for-the-badge&labelColor=326875"></a>
</p>

## Challenge track

AquaSentinel addresses **Track 6: Resilience Informatics** by focusing on the information required to manage freshwater conditions when observations are incomplete or infrequent. The system extends beyond a static risk label: it estimates temporal change, produces a one-year-ahead forecast, reports uncertainty, detects domain shift, and ranks stations for possible inspection.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:12B886,50:2E9BFF,100:0B5FFF&height=3&width=1200" width="100%" alt="divider" />
</p>

## Main contributions

### 1. Current risk classification

A Random Forest classifier estimates a water-quality risk category from monitoring measurements. The target label is generated using a transparent points-based rule informed by environmental water-quality standards.

### 2. One-year-ahead forecasting

The forecast model estimates whether the risk category is likely to change in the following year. It is evaluated using walk-forward validation, in which earlier years are used for training and later years are held out for testing. The model is compared with a persistence baseline that assumes the current category remains unchanged.

### 3. Explainable predictions

SHAP values identify the measurements that contribute most to an individual prediction. The frontend presents both technical explanations and a plain-language interpretation.

### 4. Inspection prioritization

The Inspection Priority tool ranks stations using current severity, early-warning trend, forecast escalation, and data recency. The score components are displayed so that the ranking can be reviewed and audited.

### 5. Deterministic early-warning states

The application assigns one of four states based on multi-year station history:

`NORMAL` → `WATCH` → `WARNING` → `CRITICAL`

Each state includes the conditions that triggered it. The current implementation does not yet distinguish chronic severe pollution from acute deterioration.

### 6. Missingness-matched conformal prediction

The system reports prediction sets instead of relying only on a single confidence score. Calibration is matched to the missing-value pattern observed at inference time. This is relevant to cross-region deployment because Bangladesh observations do not contain four nutrient parameters available in the European training data.

In the reported experiment, naive calibration achieved **84.3% coverage** while targeting 90%. Calibration matched to the observed missingness pattern achieved **90.4% coverage** and returned wider prediction sets when the available measurements did not sufficiently distinguish between categories. This gap has narrowed but not closed with richer Bangladesh data: even where the REACH-Dhaka campaign provides real Ammonium/Nitrate, BOD5 (the strongest driver of the rule-based High label for these rivers) is itself missing from those same samples — see "Powered Bangladesh evaluation" below.

### 7. Out-of-distribution detection

A nearest-neighbour detector estimates how far an input is from observations in the model's training feature space. This provides an additional warning when a prediction is made for a measurement profile that differs substantially from the training data.

In the Bangladesh evaluation (41 river-years, Buriganga/Turag/Shitalakhya, 2010-2023), **32 of 41 observations** were flagged as out-of-distribution. On the larger, statistically powered 28-river/2,070-station-month panel, the OOD distance predicts the model's own provable-lower-bound violations at **AUROC 0.895** — i.e. the detector is a genuinely useful warning sign for exactly the cases where the model is wrong, not just a generic domain-shift flag.

## Application overview

AquaSentinel is organized as three connected layers:

| Layer | Implementation | Responsibility |
|---|---|---|
| **User interface** | React, Vite, Leaflet, Tailwind CSS | Maps, forms, rankings, explanations, and evaluation views |
| **Inference API** | Flask, Python, scikit-learn, SHAP | Predictions, forecasts, explanations, OOD checks, and model-card data |
| **Reproducible pipeline** | Jupyter, pandas, scikit-learn | Data preparation, training, validation, metrics, and derived files |

The repository includes trained models and derived data files so that the live application can run without retraining. The notebook can be rerun to reproduce the analysis from raw data.

## One Health connection

Freshwater quality connects environmental, animal, and human health. The Buriganga and Turag rivers support ecosystems and are located within a densely populated urban region. Changes in dissolved oxygen, organic load, ammonium, nutrients, and related indicators can affect aquatic organisms and indicate pollution sources relevant to public health.

AquaSentinel supports this connection through:

- **Ecosystem monitoring:** Risk and early-warning components focus on indicators associated with aquatic ecosystem health.
- **Environmental exposure:** BOD, ammonium, and related indicators can signal contamination associated with industrial and municipal waste.
- **Citizen participation:** The Report Local Water feature accepts observations such as foam, odour, and visible pollution. These are contextual signals, not substitutes for laboratory measurements.
- **Monitoring resilience:** Missingness-aware uncertainty estimation addresses deployment where the target region does not measure all variables used during training.

### Alignment with the OneAquaHealth ecosystem

OneAquaHealth's own hackathon guidance highlights three public-facing applications — the **Citizen Science App**, the **Resilience Map**, and the **Diptera Forecasting App**. AquaSentinel is designed to complement, not duplicate, these:

- The **Inspection Priority** ranking and **Dhaka Observatory** map are a resilience/decision-support layer in the same spirit as the Resilience Map — surfacing *where* limited inspection capacity should go, using real DoE and REACH data rather than a simulated demo.
- The **Report Local Water** citizen-observation schema is intentionally simple (foam, odour, colour, visible pollution) so it can be aligned with or feed into a Citizen Science App data pipeline rather than compete with it.
- Water-quality deterioration (low DO, high BOD/ammonium) is a known correlate of conditions that favour disease-vector breeding (stagnant, organically loaded water); the early-warning state machine could act as a covariate feed for a Diptera-style vector forecasting effort, though AquaSentinel does not itself model vector populations.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0B5FFF,50:2E9BFF,100:12B886&height=3&width=1200" width="100%" alt="divider" />
</p>

## Architecture

<p align="center">
  <img src="https://github.com/user-attachments/assets/3ca7b61d-170a-4f91-bb11-1699af0ddc7d" alt="AquaSentinel system architecture" width="100%" />
</p>

The React frontend communicates with the Flask backend through HTTP endpoints. The backend loads the trained models and derived data produced by the Jupyter notebook. The notebook is treated as the reproducible modelling pipeline for the reported metrics.

```text
┌─────────────────────────┐          ┌──────────────────────────────┐
│  React + Vite frontend  │   HTTP   │      Flask backend           │
│   • Leaflet map         │ ◄──────► │  • RandomForest classifier   │
│   • Tailwind UI         │          │  • SHAP explainability       │
│   • 5 dashboard tabs    │          │  • Forecast model (RF)       │
└─────────────────────────┘          │  • OOD detector (k-NN)       │
                                     │  • Conformal calibration     │
                                     └───────────────┬──────────────┘
                                                     │
                                     ┌───────────────▼────────────────┐
                                     │   Jupyter notebook (source of  │
                                     │   truth — every model/metric)  │
                                     └───────────────┬────────────────┘
                                                     │
                          ┌──────────────────────────┴───────────────────────────┐
                          │                                                      │
              ┌───────────▼───────────┐                             ┌────────────▼────────────┐
              │ EEA Waterbase (train) │                             │  Bangladesh DoE (test)  │
              │ 40,638 rows, 8,762    │                             │  18 real yearly obs.,   │
              │ stations, 6 countries │                             │  Buriganga & Turag      │
              └───────────────────────┘                             └─────────────────────────┘
```

### Technology stack

- **Data science:** Python, pandas, scikit-learn, SHAP, Jupyter
- **Backend:** Flask and Python REST endpoints
- **Frontend:** React, Vite, Leaflet, Tailwind CSS
- **Models:** Random Forest classifier and forecast model, k-nearest-neighbour OOD detector, conformal calibration
- **Data:** Open environmental monitoring data and government river-water-quality reports

No paid APIs or proprietary services are required.

## User workflow

1. **Europe Monitoring:** Explore EU monitoring stations on the map. Filter by risk level or early-warning state, open a station's multi-year history, and view its forecast.
2. **Reading Entry:** Enter a measurement and receive a risk prediction, SHAP explanation, calibrated prediction set, and OOD status.
3. **Inspection Priority:** Review the ranked station list and inspect the components of the priority score.
4. **Bangladesh Evaluation:** Review Buriganga, Turag, and Shitalakhya histories and compare model predictions with transparent rule-based labels.
5. **Cross-Region Evaluation:** Examine missingness patterns, OOD flags, and EU–Bangladesh domain-shift results.
6. **Data and Methodology:** Review training data, evaluation design, model details, and limitations.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:12B886,50:2E9BFF,100:0B5FFF&height=3&width=1200" width="100%" alt="divider" />
</p>

## Data and methodology

### Training data

The model-development dataset is the European Environment Agency Waterbase WISE-6 river-station dataset. The reported analysis uses **40,638 station-year rows** from **8,762 stations** across **six countries** for 2010–2024.

### External evaluation data

External evaluation is built from a **merged, multi-source Bangladesh dataset** (`backend/data/aquasentinel_bd_master_raw.csv`, 36,298 raw long-format rows, 40 rivers/canals, 2010-2023), assembled from three independent sources:

1. **Bangladesh DoE River / Surface & Ground Water Quality Reports** — the 2015 report's Chapter 6 trend tables (2010-2015, annual, Buriganga/Turag/Shitalakhya and others) plus the 2021-2023 reports' monthly, multi-station annex tables (33 rivers). Used per DoE's own usage note: freely for study, research and training purposes with acknowledgement of source.
2. **REACH-Dhaka field dataset** (*REACH: Improving water security for the poor*, University of Oxford, UK-aid/FCDO funded; creators Hossain, M.A., Shawal, S. et al.) — 1,495 field-campaign samples, 58 GPS-located points, 19 rivers/canals in Greater Dhaka, 2017-2021. This is the only source with real Ammonium/Nitrate measurements for the region; it does not include BOD.
3. **Bangladesh Environment Conservation Rules 2023** (Gazette, 5 March 2023, Schedule-2) — regulatory thresholds superseding ECR 1997, used for the three-valued compliance checker (`backend/ecr2023.py`); values were transcribed from the gazette image and should be independently verified before being cited as binding law.

From this merged dataset, three evaluation panels are reported at different levels of statistical power:

| Panel | Grain | n | Rivers | Years |
|---|---|---:|---:|---|
| Multi-year river history | annual average | 41 river-years (13,976 raw obs.) | 3 (Buriganga, Turag, Shitalakhya) | 2010-2023 (Shitalakhya: gap only in 2017) |
| Powered DoE evaluation | station-month | 2,070 | 28 | 2021-2023 |
| REACH nutrient analysis | field sample | 1,397 (with DO/pH/ammonia/nitrate/phosphate) | 12 | 2017-2021 |

Reporting gaps are disclosed rather than interpolated. The DoE 2016 report's own Chapter 6 trend table closed the earlier 2016 gap for all three rivers; Shitalakhya still has a genuine gap in 2017 only.

### Risk label

The risk label is generated by a transparent points-based rule. The thresholds are compared with EU Directive 2006/44/EC, the EU Nitrates Directive 91/676/EEC, US EPA guidance, and Bangladesh's Environmental Conservation Rules, 1997 (superseded by the Environment Conservation Rules 2023).

### Classification model

The classifier is a Random Forest model with 300 trees. It is evaluated using both a standard row-level split and a stricter station-level split. The station-level split prevents records from the same station from appearing in both training and test sets.

### Forecast evaluation

The one-year-ahead forecast uses walk-forward validation. The model is trained on data available up to a given year and evaluated on later observations. Its performance is compared with a persistence baseline.

### Uncertainty and domain shift

Conformal calibration is evaluated under the missingness pattern observed in Bangladesh. OOD detection uses nearest-neighbour distance in feature space to identify inputs that differ from the European training data.

## Evaluation at a glance

The following results are reported by the executed analysis notebook:

| Metric | Result |
|---|---:|
| Classification accuracy — station-level held-out split | **99.4%** |
| Classification macro-F1 | **0.98** |
| Forecast accuracy | **85.9%** |
| Persistence baseline accuracy | **85.0%** |
| Forecast comparison | McNemar's test, *p* = 0.0057 |
| Naive conformal coverage | **84.3%** |
| Missingness-matched conformal coverage | **90.4%** |
| Prediction-set hedging | **13.4%** of cases |
| Bangladesh model/rule-label agreement (41 river-years, 3 rivers) | **8 of 41** |
| Bangladesh OOD flags (41 river-years, 3 rivers) | **32 of 41** |
| Powered evaluation: station-months provably High from measured values alone (28 rivers) | **20.2%** |
| Powered evaluation: model predicts High | **0.0%** |
| Powered evaluation: OOD distance vs. bound-violation AUROC | **0.895** |

> **Interpretation note:** Classification accuracy should be read together with the split design and class distribution. The forecast model identifies approximately 20% of stations that worsen in the following year in the reported evaluation, so accuracy alone does not represent complete early-warning performance.

<details>
<summary><strong>What the cross-region result indicates</strong></summary>

The Bangladesh evaluation demonstrates a substantial and *reproducible* difference between the training environment and the external evaluation environment, confirmed across three independently-built panels of increasing statistical power (41 river-years → 2,070 station-months). The model systematically under-predicts risk severity, and its own out-of-distribution flag is a strong, usable warning sign for exactly the cases where it is wrong (AUROC 0.895 against the model's provable lower-bound violations) — not merely a generic domain-shift indicator. A more precise reading, enabled by the REACH-Dhaka data, is that missing **BOD5** specifically — not missing nutrients in general — is the more load-bearing gap for this river set: even in years where Ammonium/Nitrate are measured, the model still under-calls severity because BOD5 is absent from those same field campaigns. See "Powered Bangladesh evaluation and provable risk bounds" below for the full-power version of this result.

</details>

## What changed in this version

**Data.** `aquasentinel_bd_master_raw.csv` (36,298 long-format rows: DoE 2021-2023, REACH-Dhaka 2017-2021, DoE 2015 trend table) is QC-checked by
`backend/scripts/build_master.py` into 4,106 station-months. Raw values are kept; 8 implausible values (two source typos and six negative COD values) get `qc_flag`
and a blank `value_clean`. The DoE portion reproduces the hand-entered annual means for 17 of 18 checked values (largest difference 0.17).

**API (`backend/app.py`, `backend/ecr2023.py`).**
`POST /api/predict` now also returns `risk_bounds`, `model_risk_level`, `bound_adjusted`, an opt-in `regional_prior` (`"region": "dhaka_rivers"`) and a `neural_second_opinion`.
New: `POST /api/compliance` (three-valued check against ECR 2023 use classes), `GET /api/standards/ecr2023`, `GET /api/assessability`, `GET /api/master/summary`,
`GET /api/reach/points`, `GET /api/master/river/<river>?param=`, `GET /api/overview`, `GET /api/bangladesh/doe_eval`, `GET /api/bangladesh/doe/rivers`.

**Regulatory assessability (4,070 station-months).** No station-month can be certified compliant with any ECR 2023 use class (0.0%), because the scheduled nutrients, metals and
fecal coliform are never all measured; 64.8% provably fail the fisheries class and 72.9% the conventional-treatment drinking-source class. The limits were transcribed from a page image: verify before citing.

**Neural baseline (notebook 14.7).** A mask-aware MLP trained with random masking of nutrients, compared with the random forest on an EU station-level split with nutrients hidden:

| Model | accuracy | macro-F1 | log-loss | High recall |
|---|---:|---:|---:|---:|
| RF, median impute | 0.793 | 0.403 | 0.803 | 0.00 |
| MLP, median impute | 0.789 | 0.399 | 1.665 | 0.00 |
| **Mask-aware MLP** | **0.864** | **0.696** | **0.346** | **0.37** |

On the real DoE station-months it contradicts the provable lower bound in 1.6% of cases versus 22.7% for the random forest; no accuracy claim is possible there because DoE has no nutrient measurements.

**Notebook.** Part II (sections 14.1-14.8) is appended to `notebook/AquaSentinel_notebook.ipynb` and was executed end to end.

**Frontend.** New design system and pages: Overview, Dhaka Observatory (map + time series), Legal compliance (interactive three-valued matrix and assessability charts), Evidence.
The compliance check and neural second opinion appear beside every prediction. Pages were smoke-tested against the live API in jsdom (`frontend/tests`); they were **not** inspected in a real browser.

**Fixes (mentor-review pass).** `bangladesh_history.json` is now regenerated from the same merged master dataset used everywhere else (previously stale at 2 rivers / 18 entries while other endpoints already used 28-40 rivers); the Data & Methodology panel's Bangladesh block was rebuilt to be symmetric with the EU block instead of showing a blank field, and made defensive against partial API responses; the Leaflet basemap on the Dhaka Observatory and station maps was switched from CARTO (which now requires a paid API key and was rendering "API KEY REQUIRED" watermark tiles) to standard, key-free OpenStreetMap tiles.

**National-scale and climate context (new).** A new `/api/context/national_scale_and_climate` endpoint and Overview section connect the project to two independent, cited sources rather than a new AquaSentinel-fitted statistic: (1) Bangladesh Water Development Board's national inventory of 405 named rivers/streams/canals, compared against the 33 rivers DoE's own lab network actively sampled in 2021-2023 (8.1%) — the scale argument for why an inspection-priority tool matters; (2) DoE Climate Change Cell's 2016 sea-level-rise trend study (30-year tidal record, Sen's slope + Mann-Kendall at 95% confidence), which measured 7-8 mm/year rise in the Ganges Tidal Floodplain — the same coastal zone as Pashur, Rupsha and Kakshiali, AquaSentinel's highest-salinity rivers. Both are presented as documented context with explicit caveats, not as a regression AquaSentinel fit itself.

**2016 gap closed (new).** The DoE *Surface and Ground Water Quality Report 2016* is a scanned document (no text layer); its own Chapter 6 trend table (read directly from the page image) supplied real 2016 dry/wet-season pH, DO and BOD5 for Buriganga, Turag and Shitalakhya. Buriganga and Turag now have complete, gap-free annual coverage from 2010-2023; Shitalakhya's only remaining gap is 2017.

## Powered Bangladesh evaluation and provable risk bounds

The earlier Bangladesh test used 18 annual river averages from two rivers; the current `bangladesh_history.json` panel extends this to 41
river-years across three rivers (Buriganga, Turag, Shitalakhya), with only a single remaining gap year (Shitalakhya, 2017). The Department of Environment annex tables (2021-2023) additionally contain
monthly per-station measurements, which were extracted into a dataset of **2,070 station-months from 176 stations on 28
rivers and urban lakes** (see `docs/DoE_DATASET.md`; extraction validated against the annual averages previously entered by hand).

Because every scored parameter can only add risk points, the points earned by the *measured* parameters are a provable lower
bound on the rule-based risk, and the maximum extra points from the *unmeasured* scored parameters give a provable upper bound.
On the DoE data (measured: pH, DO, BOD, EC; not reported: ammonium, nitrate, phosphorus):

| Result | Value |
|---|---:|
| Station-months provably **High** from measured values alone | **20.2%** |
| Station-months where the EU-trained model predicts High | **0.0%** |
| Model prediction below the provable lower bound | **23.0%** (100% of provably-High cases) |
| Prediction after projection into the feasible interval | never below the bound |
| OOD distance vs. bound violation (AUROC) | 0.895 |

`/api/predict` now returns `risk_bounds`, `model_risk_level` and `bound_adjusted`; the reported `risk_level` is the model
prediction projected into `[lower_bound, upper_bound]`, and conformal sets are intersected with the feasible classes.
The AUROC is descriptive: the OOD distance and the bound violation both depend on the same extreme DO/BOD values.

Bangladesh's Environment Conservation Rules **2023** (Schedule-2) replaced the 1997 rules and list ammonium-N, nitrate-N,
phosphate-P and fecal coliform limits that the DoE river tables do not report. The current risk rule's ammonium thresholds
(0.5 / 1.0 mg/L) are looser than the ECR 2023 limits (0.1-0.3 mg/L NH4-N for most uses).

## Real nutrient data for Dhaka rivers (REACH-Dhaka 2017-2021)

The REACH-Dhaka programme measured ammonia-N, nitrate, phosphate, E. coli, DO, pH and EC at 58 locations on 12 rivers and
canals (1,495 samples; `docs/DoE_DATASET.md`). It has no BOD, so it complements the DoE data instead of replacing it.
Results (1,397 samples with DO, pH, ammonia, nitrate and phosphate; `backend/data/reach_analysis.json`):

| Finding | Value |
|---|---:|
| Risk points added by the nutrients that DoE does not report (mean / median) | **2.2 / 3** |
| Samples where nutrients add at least 2 points | **68.6%** |
| Points the EU-median imputation implicitly assumes for those nutrients | **0** (bias -2.2 points) |
| Ammonia-N above 0.3 mg/L (ECR 2023 fisheries class, as transcribed) | 77.4% |
| E. coli above 5,000 per 100 mL (n = 1,049) | 60.7% |

A regional prior predicts the nutrient points from DO, pH and EC (leave-river-out MAE 0.36 points vs 0.84 for a constant;
leave-year-out 0.43). It is **opt-in** (`"region": "dhaka_rivers"` in `/api/predict`), never overrides the provable bounds, is
validated on risk points only (not on measured class labels), and is applied only to Dhaka-region rivers (EC in southern
tidal rivers reflects salinity). On the 629 DoE station-months from those rivers, 47.2% are provably High from the measured
values, the prior-informed estimate is High for 75.0%, and the EU-trained model predicts High for 0%.

Two data sources are not interchangeable: dry-season median DO differs between REACH (2017-2021) and DoE (2021-2023) for
the same rivers (e.g. Buriganga 0.16 vs 0.70 mg/L) and the station sets differ.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0B5FFF,50:2E9BFF,100:12B886&height=3&width=1200" width="100%" alt="divider" />
</p>

## Run locally

### Backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py
```

The backend runs at `http://127.0.0.1:5000` by default.

### Frontend

Open a second terminal:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at `http://localhost:5173` by default.

### Reproduce the analysis

The trained models and derived data files are included for running the application. To reproduce the modelling pipeline from raw data, open the following notebook and run it from top to bottom:

```text
notebook/AquaSentinel_notebook.ipynb
```

## Project structure

```text
AquaSentinel/
├── notebook/
│   ├── AquaSentinel_notebook.ipynb
│   └── wise_river_wide.csv
├── backend/
│   ├── app.py
│   ├── requirements.txt
│   └── *.pkl / *.json
└── frontend/
    └── src/
        ├── App.jsx
        └── components/
```

## API reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/predict` | `POST` | Risk prediction, SHAP explanation, and calibrated prediction set |
| `/api/station/<id>/history` | `GET` | Multi-year EU station history and early-warning state |
| `/api/station/<id>/forecast` | `GET` | Backtested one-year-ahead forecast |
| `/api/priority` | `GET` | Inspection Priority ranking |
| `/api/bangladesh/history/<river>` | `GET` | Buriganga, Turag, or Shitalakhya multi-year history |
| `/api/bangladesh/doe_eval` | `GET` | Powered 28-river/2,070-station-month evaluation |
| `/api/bangladesh/doe/rivers` | `GET` | List of rivers in the DoE-only panel |
| `/api/standards/ecr2023` | `GET` | Environment Conservation Rules 2023, Schedule-2 thresholds |
| `/api/compliance` | `POST` | Three-valued (pass/fail/unknown) ECR 2023 compliance check |
| `/api/assessability` | `GET` | Share of station-months that can be certified compliant |
| `/api/master/summary` | `GET` | Summary of the merged 36,298-row Bangladesh raw dataset |
| `/api/master/river/<river>` | `GET` | Per-river slice of the merged raw dataset |
| `/api/reach/points` | `GET` | REACH-Dhaka GPS-located sample points |
| `/api/overview` | `GET` | Dashboard-level summary across all panels |
| `/api/cross_region_eval` | `GET` | EU and Bangladesh comparison |
| `/api/model_card` | `GET` | Training, evaluation, and limitation summary |
| `/api/citizen_reports` | `GET/POST` | Citizen water-quality observations |

The complete endpoint list is available in `backend/app.py`.

## Data sources and acknowledgments

- European Environment Agency, Waterbase WISE-6 Water Quality dataset [1]
- Bangladesh Department of Environment - *River Water Quality Report* 2010, 2013, 2014, 2015, 2016 and *Surface & Ground Water Quality Report* 2021, 2022, 2023. Used per DoE's own note: freely for study, research and training purposes, subject to acknowledgement of the source.
- REACH: Improving water security for the poor, University of Oxford (UK-aid/FCDO funded) - Greater Dhaka watershed water quality dataset, 2017-2021, 58 sampling points. Creators: Hossain, M.A., Shawal, S. et al. [2]
- Bangladesh Gazette, Additional Issue, 5 March 2023 - Environment Conservation Rules 2023 (পরিবেশ সংরক্ষণ বিধিমালা, ২০২৩), Schedule-2
- OneAquaHealth IEEE Global Hackathon 2026, Challenge Track 6: Resilience Informatics

## References

1. [European Environment Agency - Waterbase WISE-6 Water Quality dataset](https://www.eea.europa.eu/en/datahub/datahubitem-view/fbf3717c-cd7b-4785-933a-d0cf510542e1)
2. [REACH - Improving water security for the poor - Datasets](https://reachwater.uk/datasets/)
---

<div align="center">

**AquaSentinel helps identify where water-quality conditions may be changing and where further investigation may be useful.**

*Final decisions should be based on laboratory measurements, field inspection, and the relevant regulatory framework.*

<sub>[⬆ Back to top](#top)</sub>

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:12B886,50:2E9BFF,100:0B5FFF&height=120&section=footer&animation=fadeIn" width="100%" alt="AquaSentinel footer" />
</p>
