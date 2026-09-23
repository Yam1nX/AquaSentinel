"""Bangladesh Environment Conservation Rules 2023, Schedule-2 (A)(1): inland surface water standards by use class.
Values were transcribed from the gazette page image and must be verified before being cited.
Three-valued compliance: pass / fail / unknown, so an unmeasured parameter is never silently treated as compliant."""
NO3_TO_N = 14.007 / 62.005     # mg NO3/L -> mg N/L
STANDARDS = {
    "1_drinking_source_disinfection_only": {"label": "Drinking-water source (disinfection only)", "pH": (6.5, 8.5), "DO": (6, None), "BOD": (None, 2), "NO3_N": (None, 7.0), "NH4_N": (None, 0.1), "PO4_P": (None, 0.1), "Cr": (None, 0.02), "Pb": (None, 0.03), "Hg": (None, 0.001), "FC": (None, 100), "TDS": (None, 1000), "COD": (None, 10)},
    "2_recreation": {"label": "Recreation", "pH": (6.5, 8.5), "DO": (5, None), "BOD": (None, 3), "NO3_N": (None, 7.0), "NH4_N": (None, 0.3), "PO4_P": (None, 0.5), "Cr": (None, 0.2), "Pb": (None, 0.05), "Hg": (None, 0.001), "FC": (None, 50), "TDS": (None, 1000), "COD": (None, 10)},
    "3_drinking_source_conventional": {"label": "Drinking-water source (conventional treatment)", "pH": (6, 9), "DO": (5, None), "BOD": (None, 3), "NO3_N": (None, 7.0), "NH4_N": (None, 0.3), "PO4_P": (None, 0.5), "Cr": (None, 0.02), "Pb": (None, 0.03), "Hg": (None, 0.001), "FC": (None, 5000), "TDS": (None, 1000), "COD": (None, 25)},
    "4_fisheries": {"label": "Fisheries", "pH": (6, 9), "DO": (5, None), "BOD": (None, 6), "NO3_N": (None, 7.0), "NH4_N": (None, 0.3), "PO4_P": (None, 0.5), "Cr": (None, 0.05), "Pb": (None, 0.1), "Hg": (None, 0.008), "FC": (None, 5000), "TDS": (None, 1000), "COD": (None, 50)},
    "5_industrial_cooling": {"label": "Industrial / cooling", "pH": (6.5, 8.5), "DO": (1, None), "BOD": (None, 12), "NH4_N": (None, 2.7), "Cr": (None, 0.1), "Pb": (None, 0.1), "Hg": (None, 0.05), "TDS": (None, 1000), "COD": (None, 100)},
    "6_irrigation": {"label": "Irrigation", "pH": (6.5, 8.5), "BOD": (None, 12), "NO3_N": (None, 5.0), "NH4_N": (None, 1.5), "PO4_P": (None, 2.0), "Cr": (None, 0.1), "Pb": (None, 0.1), "Hg": (None, 0.002), "FC": (None, 50000), "TDS": (None, 1000), "COD": (None, 100)},
}
PARAM_LABELS = {"pH": "pH", "DO": "Dissolved oxygen", "BOD": "BOD5", "NO3_N": "Nitrate-N", "NH4_N": "Ammonia-N", "PO4_P": "Phosphate-P",
                "Cr": "Total chromium", "Pb": "Lead", "Hg": "Mercury", "FC": "Fecal coliform", "TDS": "TDS", "COD": "COD"}
# request key -> standard column (Nitrate arrives as mg NO3/L, converted; E. coli is a subset of fecal coliform)
KEYMAP = {"pH": "pH", "Dissolved oxygen": "DO", "BOD5": "BOD", "Nitrate": "NO3_N", "Ammonium": "NH4_N", "Phosphate_P": "PO4_P",
          "E_coli": "FC", "Fecal_coliform": "FC", "TDS": "TDS", "COD": "COD", "Cr": "Cr", "Pb": "Pb", "Hg": "Hg"}

def _norm(readings):
    out = {}
    if readings.get("Fecal_coliform") not in (None, ""):
        out["_fc_exact"] = True
    for k, v in readings.items():
        if v is None or v == "" or k not in KEYMAP:
            continue
        v = float(v)
        out[KEYMAP[k]] = v * NO3_TO_N if k == "Nitrate" else v
    return out

def check(param, value, lim, fc_exact=False):
    lo, hi = lim
    if value is None:
        return "unknown"
    if param == "FC" and not fc_exact:       # E. coli above the limit proves fecal coliform above it; E. coli below the limit proves nothing
        return "fail" if hi is not None and value > hi else "unknown"
    if lo is not None and value < lo: return "fail"
    if hi is not None and value > hi: return "fail"
    return "pass"

def assess(readings):
    vals = _norm(readings); res = {}
    for cid, spec in STANDARDS.items():
        rows = {p: check(p, vals.get(p), lim, vals.get("_fc_exact", False)) for p, lim in spec.items() if p != "label"}
        fails = [p for p, s in rows.items() if s == "fail"]; unk = [p for p, s in rows.items() if s == "unknown"]
        verdict = "non_compliant" if fails else ("compliant" if not unk else "undetermined")
        res[cid] = {"label": spec["label"], "verdict": verdict, "failed": fails, "unmeasured": unk,
                    "measured_pass": [p for p, s in rows.items() if s == "pass"], "parameters": rows}
    return res
