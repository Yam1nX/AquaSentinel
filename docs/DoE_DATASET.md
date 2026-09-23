# Bangladesh DoE monthly station dataset (2021-2023)

Built from the Department of Environment *Surface and Ground Water Quality Report* 2021, 2022 and 2023 (annex tables).
No values are simulated or interpolated.

## Files (backend/data)
| file | content |
|---|---|
| `doe_2021_2023_long.csv` | one row per year / river / station / parameter / month |
| `doe_2021_2023_wide.csv` | one row per station-month, one column per parameter |
| `doe_2021_2023_scored.csv` | wide rows with DO & BOD present + rule bounds, model prediction, OOD distance |
| `bd_powered_eval.json` | headline evaluation used by `/api/bangladesh/doe_eval` |
| `ecr2023_surface_water_standards.json` | ECR 2023 Schedule-2 surface-water standards (transcribed from the gazette image; verify) |

## Rebuild
```bash
cd backend/data
for y in 2021 2022 2023; do python ../scripts/extract_doe_tables.py "<path>/Surface and Ground Water Quality Report $y.pdf" $y doe_${y}_raw.csv; done
python ../scripts/clean_doe_tables.py
cd .. && python scripts/eval_bd_powered.py
```

## Extraction method
Word-position parsing with `pdfplumber`: month header words give column centres; each numeric word inside a table row band
is assigned to the nearest month. Blank months stay blank (nothing is filled). Wrapped station labels are merged.
Groundwater tables are excluded.

## Validation
River-level means of the extracted monthly values reproduce the annual averages that were previously entered by hand:
Buriganga 2021 (pH 7.28, DO 1.84, BOD 18.47) and 2023 (7.28, 2.43, 10.89) match exactly, Turag 2021 DO/BOD (3.47, 16.25)
and 2023 (3.94, 9.14) match exactly; Buriganga 2022 BOD differs slightly (13.56 vs 13.73).

## Known issues
* Two apparent typos in the source tables (Jamuna Oct-2021 DO = 77.6 mg/L; Teesta Dec-2021 pH = 79.0) are treated as missing.
* DoE reports pH, DO, BOD, COD, TDS, SS, EC, chloride, turbidity, alkalinity. It does **not** report ammonium, nitrate,
  phosphate, or fecal coliform for rivers, although ECR 2023 Schedule-2 lists them.
* Station names differ slightly between years; matching across years is by cleaned label only.
* 2015 and 2016 reports give DO/BOD/pH monthly values only as charts; not digitised here. The 2016 PDF is a scan (needs OCR).

# REACH-Dhaka (2017-2021)
Source: REACH Dhaka Observatory workbook + methodology (58 sampling points, monthly to Feb 2020, seasonal to Jul 2021).
`backend/data/reach_dhaka_clean.csv` is the tidy version (`scripts/clean_reach_dhaka.py`). Units: nitrate mg/L as NO3-,
ammonia mg/L NH3-N (Nessler, total ammonia), phosphate mg/L as PO4 (converted to `PO4_P`). Orthophosphate-P is used as a
lower-bound proxy for total P. No BOD. COD only for 195 samples. Analysis: `scripts/reach_nutrient_analysis.py`;
prior: `scripts/train_reach_prior.py`; results: `reach_analysis.json`, `reach_prior_meta.json`.

Caveats: river-year medians are confounded by changing station coverage (points were added over time); E. coli is not the
same measurand as the fecal coliform limit in ECR 2023 (E. coli is a subset of fecal coliform); DO probe (REACH) vs Winkler (DoE).

# DoE 2016 seasonal trend values
`backend/data/doe_seasonal_trend_2016.csv`: 2016 dry/wet pH, DO, BOD for Buriganga (read from the page image), and Shitalakhya
and Turag (OCR only, verify). The 2016 Buriganga dry-season pH (7.54) and BOD (17.09) equal the 2015 values in the source table.
The 2010, 2013, 2014 and 2016 PDFs are scans and have not been digitised beyond these tables.

# Master dataset (bd_master_*)
`data/aquasentinel_bd_master_raw.csv` -> `scripts/build_master.py` -> `bd_master_clean_long.csv`, `bd_master_station_month.csv`, `master_qc_report.json`.
The merged table lacks REACH phosphate, total coliform and metals (present in the REACH workbook); the phosphate-based regional prior therefore reads `reach_dhaka_clean.csv`.
`scripts/build_assessability.py` -> `assessability.json`. `scripts/train_mask_aware_mlp.py` -> `aquasentinel_maskaware_mlp.pkl` (the API retrains it from `notebook/wise_river_wide.csv` if the pickle cannot be loaded).
