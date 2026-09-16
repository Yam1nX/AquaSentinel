<a name="top"></a>
<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:0B5FFF,50:2E9BFF,100:12B886&height=200&section=header&text=AquaSentinel&fontSize=52&fontColor=FFFFFF&animation=fadeIn&fontAlignY=38&desc=Predictive%20Early-Warning%20for%20Urban%20Stream%20Health&descAlignY=58&descSize=18" width="100%" alt="AquaSentinel banner" />
</p>

<div align="center">

# 💧 AquaSentinel

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

AquaSentinel is a full-stack water-quality monitoring and decision-support prototype for urban rivers. It combines a Random Forest classifier with one-year-ahead forecasting, SHAP explanations, out-of-distribution detection, and missingness-matched conformal prediction.

The model-development dataset is drawn from the European Environment Agency Waterbase. External evaluation uses observations from the Bangladesh Department of Environment for the **Buriganga** and **Turag** rivers. The application is designed for environmental agencies that need to identify deteriorating stations and prioritize follow-up inspections under limited monitoring capacity.

> **Important scope statement:** AquaSentinel is a screening and prioritization tool. It does not replace laboratory testing, field inspection, or regulatory assessment.

This project was developed for the **OneAquaHealth IEEE Global Hackathon 2026 — Challenge Track 6: Resilience Informatics**.

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

## 📋 Contents

[Challenge](#challenge-track) · [Contributions](#main-contributions) · [Overview](#application-overview) · [One Health](#one-health-connection) · [Architecture](#architecture) · [Workflow](#user-workflow) · [Methodology](#data-and-methodology) · [Evaluation](#evaluation-at-a-glance) · [Limitations](#limitations) · [Setup](#run-locally) · [Structure](#project-structure) · [API](#api-reference) · [Sources](#data-sources-and-acknowledgments)

## 🏆 Challenge track

AquaSentinel addresses **Track 6: Resilience Informatics** by focusing on the information required to manage freshwater conditions when observations are incomplete or infrequent. The system extends beyond a static risk label: it estimates temporal change, produces a one-year-ahead forecast, reports uncertainty, detects domain shift, and ranks stations for possible inspection.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:12B886,50:2E9BFF,100:0B5FFF&height=3&width=1200" width="100%" alt="divider" />
</p>

## ✨ Main contributions

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

In the reported experiment, naive calibration achieved **84.3% coverage** while targeting 90%. Calibration matched to the observed missingness pattern achieved **90.4% coverage** and returned wider prediction sets when the available measurements did not sufficiently distinguish between categories.

### 7. Out-of-distribution detection

A nearest-neighbour detector estimates how far an input is from observations in the model's training feature space. This provides an additional warning when a prediction is made for a measurement profile that differs substantially from the training data.

In the Bangladesh evaluation, **16 of 18 observations** were flagged as out-of-distribution. The two observations that were not flagged correspond to Turag observations from 2022–2023, when dissolved oxygen moved toward the range observed in the European training data. This is an association in the available evaluation data, not a causal validation.

## 🧩 Application overview

AquaSentinel is organized as three connected layers:

| Layer | Implementation | Responsibility |
|---|---|---|
| **User interface** | React, Vite, Leaflet, Tailwind CSS | Maps, forms, rankings, explanations, and evaluation views |
| **Inference API** | Flask, Python, scikit-learn, SHAP | Predictions, forecasts, explanations, OOD checks, and model-card data |
| **Reproducible pipeline** | Jupyter, pandas, scikit-learn | Data preparation, training, validation, metrics, and derived files |

The repository includes trained models and derived data files so that the live application can run without retraining. The notebook can be rerun to reproduce the analysis from raw data.

## 🌍 One Health connection

Freshwater quality connects environmental, animal, and human health. The Buriganga and Turag rivers support ecosystems and are located within a densely populated urban region. Changes in dissolved oxygen, organic load, ammonium, nutrients, and related indicators can affect aquatic organisms and indicate pollution sources relevant to public health.

AquaSentinel supports this connection through:

- **Ecosystem monitoring:** Risk and early-warning components focus on indicators associated with aquatic ecosystem health.
- **Environmental exposure:** BOD, ammonium, and related indicators can signal contamination associated with industrial and municipal waste.
- **Citizen participation:** The Report Local Water feature accepts observations such as foam, odour, and visible pollution. These are contextual signals, not substitutes for laboratory measurements.
- **Monitoring resilience:** Missingness-aware uncertainty estimation addresses deployment where the target region does not measure all variables used during training.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0B5FFF,50:2E9BFF,100:12B886&height=3&width=1200" width="100%" alt="divider" />
</p>

## 🏗️ Architecture

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

## 🗺️ User workflow

1. **Europe Monitoring:** Explore EU monitoring stations on the map. Filter by risk level or early-warning state, open a station's multi-year history, and view its forecast.
2. **Reading Entry:** Enter a measurement and receive a risk prediction, SHAP explanation, calibrated prediction set, and OOD status.
3. **Inspection Priority:** Review the ranked station list and inspect the components of the priority score.
4. **Bangladesh Evaluation:** Review Buriganga and Turag histories and compare model predictions with transparent rule-based labels.
5. **Cross-Region Evaluation:** Examine missingness patterns, OOD flags, and EU–Bangladesh domain-shift results.
6. **Data and Methodology:** Review training data, evaluation design, model details, and limitations.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:12B886,50:2E9BFF,100:0B5FFF&height=3&width=1200" width="100%" alt="divider" />
</p>

## 📊 Data and methodology

### Training data

The model-development dataset is the European Environment Agency Waterbase WISE-6 river-station dataset. The reported analysis uses **40,638 station-year rows** from **8,762 stations** across **six countries** for 2010–2024.

### External evaluation data

The external evaluation uses annual observations from Bangladesh Department of Environment River Water Quality Reports for the Buriganga and Turag rivers. The reported evaluation contains **18 observations** from 2015, 2021, 2022, and 2023. The reporting gap from 2016 to 2020 is disclosed and is not filled through interpolation or estimation.

### Risk label

The risk label is generated by a transparent points-based rule. The thresholds are compared with EU Directive 2006/44/EC, the EU Nitrates Directive 91/676/EEC, US EPA guidance, and Bangladesh's Environmental Conservation Rules, 1997.

### Classification model

The classifier is a Random Forest model with 300 trees. It is evaluated using both a standard row-level split and a stricter station-level split. The station-level split prevents records from the same station from appearing in both training and test sets.

### Forecast evaluation

The one-year-ahead forecast uses walk-forward validation. The model is trained on data available up to a given year and evaluated on later observations. Its performance is compared with a persistence baseline.

### Uncertainty and domain shift

Conformal calibration is evaluated under the missingness pattern observed in Bangladesh. OOD detection uses nearest-neighbour distance in feature space to identify inputs that differ from the European training data.

## 📈 Evaluation at a glance

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
| Bangladesh model/rule-label agreement | **1 of 18** observations |
| Bangladesh OOD flags | **16 of 18** observations |

> **Interpretation note:** Classification accuracy should be read together with the split design and class distribution. The forecast model identifies approximately 20% of stations that worsen in the following year in the reported evaluation, so accuracy alone does not represent complete early-warning performance.

<details>
<summary><strong>What the cross-region result indicates</strong></summary>

The Bangladesh evaluation demonstrates a substantial difference between the training environment and the external evaluation environment. The model/rule-label agreement is 1 of 18 observations, while 16 of 18 observations are flagged as out-of-distribution. These results support using domain-shift and uncertainty indicators alongside the predicted class when applying the model outside the training region.

</details>

## ⚠️ Limitations

AquaSentinel is a prototype screening and prioritization tool. It does not replace laboratory testing, regulatory assessment, or field inspection.

- The Bangladesh evaluation contains 18 observations from two rivers. It is illustrative of cross-region behaviour and missingness effects, but it is not a statistically powered multi-region validation study.
- The risk label is a transparent prototype screening rule, not an official regulatory classification for any jurisdiction.
- The forecast model identifies approximately 20% of stations that worsen in the following year in the reported evaluation.
- The early-warning state machine does not yet distinguish chronic severe pollution from acute deterioration. Both conditions can produce a `CRITICAL` state.
- The two non-flagged Bangladesh observations coincide with a period of dissolved-oxygen recovery toward the European training range. This pattern is not an independent causal validation of the detector.
- Citizen reports are contextual observations and are not treated as laboratory measurements.

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=rect&color=0:0B5FFF,50:2E9BFF,100:12B886&height=3&width=1200" width="100%" alt="divider" />
</p>

## 💻 Run locally

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

## 📁 Project structure

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

## 🔌 API reference

| Endpoint | Method | Description |
|---|---|---|
| `/api/predict` | `POST` | Risk prediction, SHAP explanation, and calibrated prediction set |
| `/api/station/<id>/history` | `GET` | Multi-year EU station history and early-warning state |
| `/api/station/<id>/forecast` | `GET` | Backtested one-year-ahead forecast |
| `/api/priority` | `GET` | Inspection Priority ranking |
| `/api/bangladesh/history/<river>` | `GET` | Buriganga or Turag multi-year history |
| `/api/cross_region_eval` | `GET` | EU and Bangladesh comparison |
| `/api/model_card` | `GET` | Training, evaluation, and limitation summary |
| `/api/citizen_reports` | `GET/POST` | Citizen water-quality observations |

The complete endpoint list is available in `backend/app.py`.

## 🙏 Data sources and acknowledgments

- European Environment Agency, Waterbase WISE-6 Water Quality dataset [1]
- Bangladesh Department of Environment, *River Water Quality Report* for 2015, 2021, 2022, and 2023
- OneAquaHealth IEEE Global Hackathon 2026, Challenge Track 6: Resilience Informatics

## 📚 References

[1]: https://www.eea.europa.eu/en/datahub/datahubitem-view/fbf3717c-cd7b-4785-933a-d0cf510542e1 "European Environment Agency Waterbase WISE-6 Water Quality dataset"

---

<div align="center">

**AquaSentinel helps identify where water-quality conditions may be changing and where further investigation may be useful.**

*Final decisions should be based on laboratory measurements, field inspection, and the relevant regulatory framework.*

<sub>[⬆ Back to top](#top)</sub>

</div>

<p align="center">
  <img src="https://capsule-render.vercel.app/api?type=waving&color=0:12B886,50:2E9BFF,100:0B5FFF&height=120&section=footer&animation=fadeIn" width="100%" alt="AquaSentinel footer" />
</p>
