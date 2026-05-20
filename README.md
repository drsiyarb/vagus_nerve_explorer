# Vagus Nerve Atlas Explorer

[![Binder](https://mybinder.org/badge_logo.svg)](https://mybinder.org/v2/gh/drsiyarb/vagus_nerve_explorer/main?filepath=paper_figures_reproducible.ipynb)
[![License: MIT](https://img.shields.io/badge/Code%20License-MIT-yellow.svg)](LICENSE)
[![License: CC BY 4.0](https://img.shields.io/badge/Data%20License-CC%20BY%204.0-lightgrey.svg)](https://creativecommons.org/licenses/by/4.0/)

Interactive browser-based atlas and full reproducibility companion for the manuscript

> **A standardized map of human vagus nerve branch emergence defines anatomical targets for function-selective neuromodulation** (submitted, 2026).

The atlas describes **28 donors · 56 nerves · 2,177 branches** mapped along a side-specific landmark-anchored cervico-thoracic axis. This repository contains every input, every output, and every line of code needed to regenerate every figure and table in the manuscript from raw inputs.

---

## What's here

| | |
|---|---|
| 🔬 **Live atlas explorer** | [drsiyarb.github.io/vagus_nerve_explorer](https://drsiyarb.github.io/vagus_nerve_explorer/) — no install required |
| 📓 **Reproducibility notebook** | [`paper_figures_reproducible.ipynb`](paper_figures_reproducible.ipynb) regenerates every paper figure and table |
| 📦 **Published dataset** | [`vagus_atlas_dataset.xlsx`](vagus_atlas_dataset.xlsx) (28 donors, 2,177 branches + 168 landmark rows) |
| 🧮 **Analysis-ready dataset** | [`vagus_atlas_analysis.xlsx`](vagus_atlas_analysis.xlsx) (registered & filtered, used by both notebook and explorer) |
| 📐 **Registration scaffold** | [`vagus_segment_scaffold_from_dd.xlsx`](vagus_segment_scaffold_from_dd.xlsx) (per-nerve segment lengths) |
| 📊 **Figures** | `Fig2_…/` through `Fig7_…/` — PNG + SVG of every main figure |
| 📋 **Tables** | `Tables/` (Table 1) and `Supplementary_tables/` (S1–S7) |
| 💻 **Explorer source** | `interactive_explorer/` (`vagus_atlas_explorer.html`, `vagus_atlas_data.js`, `build_atlas_data.py`) |

---

## Quick reproduction (three lines)

```bash
git clone https://github.com/drsiyarb/vagus_nerve_explorer.git
cd vagus_nerve_explorer
pip install -r requirements.txt && jupyter notebook paper_figures_reproducible.ipynb
```

In the notebook: Kernel → Restart & Run All. Total runtime is 1–2 minutes on a modern laptop. Outputs land in the corresponding figure / table subfolders alongside the notebook.

### One-click reproduction (no install)

Click the Binder badge above. You get a live Jupyter notebook in your browser; press Run All. The container is built from the same `requirements.txt` shipped in this repo, so reproducibility is by definition matched.

### Conda alternative

```bash
conda env create -f environment.yml
conda activate vagus-atlas
jupyter notebook paper_figures_reproducible.ipynb
```

---

## The interactive explorer (no Python)

If you just want to slice the data without running code, open the explorer URL above. The explorer:

- runs entirely in the browser (single static page; nothing to install)
- exposes the full cohort through one filter bar (donor, side, sex, supergroup, subgroup)
- has four coupled panels:
  - **Individual Branches** — every branch as one mark along the registered axis, per donor
  - **Subway Map** — top-25 subgroup prevalence × four occurrence lanes
  - **Distributions** — group-level violins with cohort-template landmarks
  - **Selectivity** — interactive target/comparator picker with i(*x*) curve
- has role-based font controls so the rendering scales for screen, projector, or paper

To regenerate the explorer's data file from a re-run of the analysis notebook:

```bash
python interactive_explorer/build_atlas_data.py
```

---

## Methods summary

- **Per-nerve trunk length** is the sum of ordered cervical + thoracic segment lengths from the registration scaffold, not the position of the last branch.
- **Registration** is a side-specific four-anchor piecewise-linear mapping. Anchors:
  - **U** — Carotid Bifurcation
  - **M** — Laryngeal Prominence
  - **D** — Superior border of Clavicle
  - **E** — true total trunk length
  - Output column: `registered_distance_v2`
- **Cohort**: N = 28 donors (15 female, 13 male), 56 nerves analyzed.
- **Selectivity index** *i*(*x*) is defined as the cumulative-recruitment difference between target and comparator groups at axial position *x*.

The full methodology is in the manuscript; the notebook is the executable reference.

---

## Data dictionary

The primary dataset (`vagus_atlas_dataset.xlsx`, also referenced as `Sheet1`) has the following columns:

| Column | Type | Meaning |
|---|---|---|
| `Subject` | string | Donor identifier (e.g., `B822`, `2305`). Anonymized; not linkable to source records. |
| `Side` | `L`/`R` | Nerve side. |
| `Group` | string | Functional supergroup (one of `Sympathetic`, `Muscular`, `Vascular`, `Cardiac`, `Pulmonary`, `Esophageal`, `Multiple Targets`, `Landmark`). |
| `Subgroup` | string | Named functional subgroup within the supergroup (e.g., `Superficial cardiac plexus`). |
| `(REVA) Branch Name` | string | Branch name in REVA dissection naming convention. |
| `Branch Distance (from top of nerve)` | float (cm) | Raw axial distance from the jugular foramen to the branch's emergence point, in centimeters. |
| `Branch Distance (from top of segment)` | float (cm) | Same emergence point measured from the top of the parent segment. |
| `Segment Name` | string | Cervical / thoracic segment label (e.g., `C1`, `C2`, `T1`). |
| `Segment Length` | float (cm) | Length of the parent segment. |
| `total_length_sum_seg_length` | float (cm) | True total trunk length for this (donor, side), computed as the sum of segment lengths. Same value repeats for every row of a given nerve. |
| `Landmark Position` | float (cm) or null | Non-null only for rows whose `Group` is `Landmark`. Marks the donor's measured position of `Carotid Bifurcation`, `Laryngeal Prominence`, or `Sup. Border of Clavicle`. |
| `Zone` / `Zone_Label` | int / string | Anatomical zone (1–4, corresponding to `Upper neck (0–Carotid)` through `Thorax`). |
| `registered_distance` | float (cm) | Older single-segment linear registration (kept for backward comparison). |
| `registered_distance_v2` | float (cm) | **Canonical registered distance.** Side-specific four-anchor piecewise-linear mapping; use this column for any new analysis. |
| `Sex` | `F`/`M` | Donor sex. |
| `Age` | int or string | Donor age. Ages ≥90 are coded as `"90+"`. |
| `Height (cm)` | float | Donor stature. |
| `Weight (kg)` | float or `"Not provided"` | Donor mass. |
| `BMI` | float or null | Body mass index where weight + height are available. |
| `Cause of death` | string | Cause of death as listed on intake records. |

---

## Repository layout

```
vagus_nerve_explorer/
├── README.md                                   (this file)
├── LICENSE                                     (MIT for code; CC BY 4.0 for data)
├── CITATION.cff                                (citable metadata)
├── requirements.txt                            (pip dependencies)
├── environment.yml                             (conda dependencies)
├── runtime.txt                                 (Python version pin for Binder)
├── index.html                                  (Pages root → redirects to explorer)
├── paper_figures_reproducible.ipynb            (regenerates everything)
├── vagus_atlas_dataset.xlsx                    (published cohort, primary)
├── vagus_atlas_full.xlsx                       (cohort + landmarks merged)
├── vagus_atlas_analysis.xlsx                   (analysis-ready, registered)
├── vagus_segment_scaffold_from_dd.xlsx         (per-nerve segment lengths)
├── overview_table_registered_v2_tiefix.csv     (per-nerve summary)
├── supp_table_S7_noncanonical_landmark_ordering.csv
├── Fig2_group_distributions/                   (PNG + SVG per figure)
├── Fig3_subway_map/
├── Fig4_subgroup_violins/
├── Fig5_regional_divisions/
├── Fig6_branch_free_intervals/
├── Fig7_selectivity/
├── Tables/                                     (Table 1)
├── Supplementary_tables/                       (Supp Tables 1–6)
├── interactive_explorer/                       (the live atlas explorer)
│   ├── vagus_atlas_explorer.html
│   ├── vagus_atlas_data.js                     (generated)
│   └── build_atlas_data.py                     (regenerates the .js)
└── .binder/                                    (Binder configuration)
```

---

## Citing

If you use the dataset, the explorer, or the reproducibility notebook in published work, please cite:

1. **The manuscript** (when published — DOI to be added)
2. **This repository** — GitHub renders a "Cite this repository" button from `CITATION.cff`; for static citation:

   > Bahadir, S. *Vagus Nerve Atlas Explorer*. GitHub, 2026. https://github.com/drsiyarb/vagus_nerve_explorer

A frozen, citable version (with DOI) is also archived on Zenodo (DOI added upon release).

---

## License

- **Code** — MIT License (see [`LICENSE`](LICENSE))
- **Anatomical dataset and figures** — Creative Commons Attribution 4.0 International (CC BY 4.0)

Both licenses require attribution; please cite the manuscript and this repository.

---

## Questions, issues, contributions

Open an issue on GitHub: https://github.com/drsiyarb/vagus_nerve_explorer/issues

Pull requests are welcome — particularly for additional analyses, alternative visualizations, or extensions to other cohorts using the same registration scheme.
