# Vagus Atlas — Companion data and code

Companion repository for the manuscript:

> *A standardized map of human vagus nerve branch emergence defines anatomical targets for function-selective neuromodulation* (submitted, 2026).

This repository contains:

1. **The published dataset** (`vagus_atlas_dataset.xlsx` + the registration scaffold `vagus_segment_scaffold.xlsx`).
2. **A reproducible Jupyter notebook** that regenerates every figure and supplementary figure/table in the paper from those input files (`paper_figures_reproducible.ipynb`).
3. **An interactive HTML atlas explorer** (`interactive_explorer/vagus_atlas_explorer.html`) that lets you filter the dataset, view individual branches, browse the prevalence subway map, build pool-vs-pool violin comparisons, and run the selectivity analysis interactively in your browser — no Python required.

## Folder structure

```
vagus_atlas_github_release/
├── README.md                                     (this file)
├── paper_figures_reproducible.ipynb              (copy)
├── vagus_atlas_dataset.xlsx               (copy)
├── vagus_segment_scaffold.xlsx                 (copy)
└── interactive_explorer/
    ├── vagus_atlas_explorer.html                 (copy)
    ├── vagus_atlas_data.js                       (copy — generated artifact, included so explorer works without re-running build script)
    └── build_atlas_data.py                       (copy — script to regenerate vagus_atlas_data.js from the analysis output)
```

## Reproducing the paper figures

1. Open `paper_figures_reproducible.ipynb` in Jupyter.
2. Run cells top-to-bottom (≈ 1–2 minutes total).
3. Each section header carries the paper figure / table number it produces. The output filename(s) are listed under each section.
4. Outputs are written to subfolders alongside the notebook: `Fig3_subway_map/`, `Fig5_regional_divisions/`, `Fig6_branch_free_intervals/`, `Fig7_selectivity/`, `Supplementary_tables/`, `Fig2_group_distributions/`, `Tables/`.

## Using the interactive explorer

1. Open `interactive_explorer/vagus_atlas_explorer.html` in a modern browser (Chrome / Firefox / Safari / Edge).
2. The companion data file `vagus_atlas_data.js` lives next to it and is loaded automatically.
3. Four panels:
   - **Individual Branches** — every branch as one mark along the registered axis; lanes per donor-side; sex-block grouped; landmark verticals.
   - **Subway Map** — Top-25 subgroup prevalence (Left-only / Right-only / Bilateral / Total).
   - **Distributions** — Atlas mode (paper Fig 2 / Fig 4 violins) or Pools mode (build named pools of mix-and-matched supergroups + subgroups for ad-hoc comparison).
   - **Selectivity** — interactive paper Fig 7 with custom target / comparator picker, cursor probe, peak indicator.
4. Universal filter bar across the top: Side · Sex · Supergroup · Donor · Distance toggle (registered ↔ raw).

## Re-generating the explorer data

The included `vagus_atlas_data.js` was generated from the manuscript ANALYSIS Excel by `build_atlas_data.py`. To regenerate it (e.g., after the notebook re-runs):

```
python interactive_explorer/build_atlas_data.py
```

The script expects the manuscript-output ANALYSIS Excel (`vagus_atlas_analysis.xlsx`) in the parent folder; that file is created when you run the reproducibility notebook.

## Methods summary

- **Per-nerve trunk length**: sum of ordered cervical + thoracic segment lengths from the registration scaffold.
- **Registration**: side-specific 4-anchor piecewise-linear mapping with anchors `U` (Carotid Bifurcation) · `M` (Laryngeal Prominence) · `D` (Sup. border of Clavicle) · `E` (true trunk length). Output column: `registered_distance_v2`.
- **Cohort**: N = 28 donors (15 female, 13 male), 56 nerves analyzed, 2,177 branches.

## License & citation

(add the license + DOI placeholder)
