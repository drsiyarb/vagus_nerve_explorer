"""
build_atlas_data.py
-------------------
Reads the manuscript-canonical ANALYSIS Excel workbook and emits
`vagus_atlas_data.js` — a single JS file that defines `window.atlasData`,
consumed by `vagus_atlas_explorer.html`.

Aligns with the manuscript pipeline:
  - Source: vagus_atlas_analysis.xlsx
  - Distance column: registered_distance_v2 (piecewise-linear, U/M/D/E anchors)
  - Group taxonomy: Sympathetic, Muscular, Vascular, Cardiac, Pulmonary, Esophageal,
                    Multiple Targets (+ Landmark rows treated separately)
  - Side-specific cohort template anchors (U_t, M_t, D_t, E_t) are computed
    here as the mean across donors per side.

Run:
    python build_atlas_data.py
"""

import json
import os
from pathlib import Path

import numpy as np
import pandas as pd

# ---------------------------------------------------------------------------
# Paths
# ---------------------------------------------------------------------------
PROJECT_ROOT = Path(__file__).resolve().parent.parent
ANALYSIS_XLSX = PROJECT_ROOT / "vagus_atlas_analysis.xlsx"
OUT_JS = Path(__file__).resolve().parent / "vagus_atlas_data.js"

# ---------------------------------------------------------------------------
# Canonical group order (manuscript-aligned)
# ---------------------------------------------------------------------------
GROUP_ORDER = [
    "Sympathetic", "Muscular", "Vascular",
    "Cardiac", "Pulmonary", "Esophageal",
    "Multiple Targets",
]

# ---------------------------------------------------------------------------
# Landmark name canonicalization (mirrors manuscript notebook logic)
# ---------------------------------------------------------------------------
def classify_landmark(name: str) -> str:
    """Return one of 'U' (carotid), 'M' (larynx), 'D' (clavicle), or '' if no match."""
    if not isinstance(name, str):
        return ""
    s = name.lower()
    if "carotid" in s and ("bif" in s or "bifurc" in s):
        return "U"
    if "larynx" in s or "laryng" in s:
        return "M"
    if "clavic" in s:
        return "D"
    return ""


# ---------------------------------------------------------------------------
# Main
# ---------------------------------------------------------------------------
def main():
    if not ANALYSIS_XLSX.exists():
        raise FileNotFoundError(f"Manuscript analysis file not found: {ANALYSIS_XLSX}")

    df = pd.read_excel(ANALYSIS_XLSX)
    print(f"Loaded {len(df):,} rows from {ANALYSIS_XLSX.name}")

    # Normalize side
    df["Side"] = df["Side"].astype(str).str.strip().str.upper().str[0]

    # Strip whitespace on key string columns
    for c in ["Group", "Subgroup", "(REVA) Branch Name", "Subject", "Sex"]:
        if c in df.columns:
            df[c] = df[c].astype(str).str.strip()

    # ---------------------------------------------------------------------
    # 1) Donor demographics table  (one row per Subject)
    # ---------------------------------------------------------------------
    donor_cols = ["Subject", "Sex", "Age", "Height (cm)", "Weight (kg)", "BMI", "Cause of death"]
    donor_present = [c for c in donor_cols if c in df.columns]
    donors_df = (
        df[donor_present]
        .dropna(subset=["Subject"])
        .drop_duplicates(subset=["Subject"])
        .sort_values("Subject")
        .reset_index(drop=True)
    )
    donors_records = []
    for _, r in donors_df.iterrows():
        rec = {"id": str(r["Subject"]).strip()}
        for c in donor_present[1:]:
            v = r[c]
            if pd.isna(v):
                rec[c] = None
            elif isinstance(v, (int, np.integer)):
                rec[c] = int(v)
            elif isinstance(v, (float, np.floating)):
                rec[c] = round(float(v), 2)
            else:
                rec[c] = str(v).strip()
        # HIPAA-style age capping: 90+ for any age >= 90
        if "Age" in rec and isinstance(rec["Age"], (int, float)) and rec["Age"] >= 90:
            rec["Age"] = "90+"
        donors_records.append(rec)
    print(f"  → {len(donors_records)} donors")

    # ---------------------------------------------------------------------
    # 2) Per-nerve landmark anchors (raw + registered)
    # ---------------------------------------------------------------------
    lm_rows = df[df["Group"].astype(str).str.strip() == "Landmark"].copy()
    lm_rows["lm_kind"] = lm_rows["(REVA) Branch Name"].apply(classify_landmark)

    # Use Landmark Position column when present, else fall back to Branch Distance
    if "Landmark Position" in lm_rows.columns:
        lm_rows["raw_pos"] = lm_rows["Landmark Position"].where(
            lm_rows["Landmark Position"].notna(),
            lm_rows.get("Branch Distance (from top of nerve)"),
        )
    else:
        lm_rows["raw_pos"] = lm_rows.get("Branch Distance (from top of nerve)")

    # Per-nerve total length (truth source for E)
    nerve_len = (
        df[["Subject", "Side", "total_length_sum_seg_length"]]
        .dropna(subset=["Subject", "Side", "total_length_sum_seg_length"])
        .drop_duplicates(subset=["Subject", "Side"])
    )

    # Build nerves list: one entry per (Subject, Side)
    nerves = []
    for (subj, side), grp in df.groupby(["Subject", "Side"]):
        if pd.isna(subj) or pd.isna(side):
            continue
        rec = {"subject": str(subj).strip(), "side": str(side).strip()}
        # total length
        nl = nerve_len[(nerve_len["Subject"] == subj) & (nerve_len["Side"] == side)]
        rec["total_length"] = (
            round(float(nl["total_length_sum_seg_length"].iloc[0]), 3)
            if len(nl) and pd.notna(nl["total_length_sum_seg_length"].iloc[0])
            else None
        )
        # raw landmark positions per nerve
        these_lms = lm_rows[(lm_rows["Subject"] == subj) & (lm_rows["Side"] == side)]
        rec["lm_raw"] = {}
        rec["lm_v2"] = {}
        for kind in ["U", "M", "D"]:
            kind_rows = these_lms[these_lms["lm_kind"] == kind]
            if len(kind_rows):
                raw_vals = kind_rows["raw_pos"].dropna().astype(float).tolist()
                v2_vals = (
                    kind_rows["registered_distance_v2"]
                    .dropna()
                    .astype(float)
                    .tolist()
                )
                if raw_vals:
                    rec["lm_raw"][kind] = round(float(np.mean(raw_vals)), 3)
                if v2_vals:
                    rec["lm_v2"][kind] = round(float(np.mean(v2_vals)), 3)
        # sex (looked up from donors)
        sex_match = donors_df[donors_df["Subject"] == subj]
        rec["sex"] = (
            str(sex_match["Sex"].iloc[0]).strip() if len(sex_match) else None
        )
        nerves.append(rec)
    nerves.sort(key=lambda r: (r["subject"], r["side"]))
    print(f"  → {len(nerves)} (subject, side) nerves")

    # ---------------------------------------------------------------------
    # 3) Cohort template anchors (mean per side across donors)
    # ---------------------------------------------------------------------
    anchors = {}
    for side in ["L", "R"]:
        side_nerves = [n for n in nerves if n["side"] == side]
        u_vals = [n["lm_raw"]["U"] for n in side_nerves if "U" in n["lm_raw"]]
        m_vals = [n["lm_raw"]["M"] for n in side_nerves if "M" in n["lm_raw"]]
        d_vals = [n["lm_raw"]["D"] for n in side_nerves if "D" in n["lm_raw"]]
        e_vals = [n["total_length"] for n in side_nerves if n["total_length"] is not None]
        # By design of the piecewise-linear registration, every nerve's U/M/D maps
        # exactly onto the cohort means of raw U/M/D. So the registered anchors
        # equal the raw cohort means — no need to recompute from registered_distance_v2
        # of landmark rows (which are NaN by construction; landmarks are inputs to
        # the registration, not outputs of it).
        u_t = round(float(np.mean(u_vals)), 3) if u_vals else None
        m_t = round(float(np.mean(m_vals)), 3) if m_vals else None
        d_t = round(float(np.mean(d_vals)), 3) if d_vals else None
        e_t = round(float(np.mean(e_vals)), 3) if e_vals else None
        anchors[side] = {
            "raw":        {"U": u_t, "M": m_t, "D": d_t, "E": e_t, "n": len(side_nerves)},
            "registered": {"U": u_t, "M": m_t, "D": d_t, "E": e_t, "n": len(side_nerves)},
        }
    print(f"  → anchors: L raw {anchors['L']['raw']},  R raw {anchors['R']['raw']}")

    # ---------------------------------------------------------------------
    # 4) Branch records (columnar layout for JSON compactness)
    # ---------------------------------------------------------------------
    branch_df = df[df["Group"].astype(str).str.strip() != "Landmark"].copy()
    # Only keep rows with a registered_distance_v2 (drop missing)
    branch_df = branch_df.dropna(subset=["registered_distance_v2"])

    cols = {
        "subject":  branch_df["Subject"].astype(str).str.strip().tolist(),
        "side":     branch_df["Side"].astype(str).str.strip().tolist(),
        "sex":      branch_df["Sex"].astype(str).str.strip().tolist() if "Sex" in branch_df.columns else [None] * len(branch_df),
        "group":    branch_df["Group"].astype(str).str.strip().tolist(),
        "subgroup": branch_df["Subgroup"].astype(str).str.strip().tolist() if "Subgroup" in branch_df.columns else [""] * len(branch_df),
        "name":     branch_df["(REVA) Branch Name"].astype(str).str.strip().tolist() if "(REVA) Branch Name" in branch_df.columns else [""] * len(branch_df),
        "d_raw":    branch_df.get("Branch Distance (from top of nerve)").astype(float).round(3).where(lambda s: s.notna(), None).tolist() if "Branch Distance (from top of nerve)" in branch_df.columns else [None] * len(branch_df),
        "d_reg":    branch_df["registered_distance_v2"].astype(float).round(3).tolist(),
        "zone":     branch_df["Zone"].where(branch_df["Zone"].notna(), None).tolist() if "Zone" in branch_df.columns else [None] * len(branch_df),
    }
    n_branches = len(cols["subject"])
    print(f"  → {n_branches:,} branch records")

    # Sanitize Nones for JSON
    def sanitize(v):
        if v is None: return None
        if isinstance(v, float) and (np.isnan(v) or np.isinf(v)): return None
        if isinstance(v, str) and v.lower() == "nan": return None
        return v
    for k, arr in cols.items():
        cols[k] = [sanitize(v) for v in arr]

    # ---------------------------------------------------------------------
    # 5) Landmark records (columnar)
    # ---------------------------------------------------------------------
    lm_keep = lm_rows.dropna(subset=["raw_pos"]).copy()
    lm_cols = {
        "subject":  lm_keep["Subject"].astype(str).str.strip().tolist(),
        "side":     lm_keep["Side"].astype(str).str.strip().tolist(),
        "kind":     lm_keep["lm_kind"].astype(str).tolist(),
        "name":     lm_keep["(REVA) Branch Name"].astype(str).str.strip().tolist(),
        "d_raw":    lm_keep["raw_pos"].astype(float).round(3).tolist(),
        "d_reg":    lm_keep["registered_distance_v2"].astype(float).round(3).where(lambda s: s.notna(), None).tolist() if "registered_distance_v2" in lm_keep.columns else [None] * len(lm_keep),
    }
    for k, arr in lm_cols.items():
        lm_cols[k] = [sanitize(v) for v in arr]
    print(f"  → {len(lm_cols['subject']):,} landmark records")

    # ---------------------------------------------------------------------
    # 6) Assemble + emit
    # ---------------------------------------------------------------------
    payload = {
        "meta": {
            "source_file": ANALYSIS_XLSX.name,
            "n_donors": len(donors_records),
            "n_nerves": len(nerves),
            "n_branches": n_branches,
            "n_landmarks": len(lm_cols["subject"]),
            "distance_column": "registered_distance_v2",
            "group_order": GROUP_ORDER,
            "generated": pd.Timestamp.now().strftime("%Y-%m-%d %H:%M:%S"),
        },
        "donors": donors_records,
        "nerves": nerves,
        "anchors": anchors,
        "branches": cols,
        "landmarks": lm_cols,
    }

    js_text = "/* AUTO-GENERATED by build_atlas_data.py — do not hand-edit */\n"
    js_text += "window.atlasData = "
    js_text += json.dumps(payload, separators=(",", ":"), ensure_ascii=False)
    js_text += ";\n"

    OUT_JS.write_text(js_text, encoding="utf-8")
    size_kb = OUT_JS.stat().st_size / 1024
    print(f"\n✓ wrote {OUT_JS.name}  ({size_kb:,.1f} KB)")
    print(f"  meta: {payload['meta']}")


if __name__ == "__main__":
    main()
                                                                                                                                                                                                                                                                                                                                                                                      