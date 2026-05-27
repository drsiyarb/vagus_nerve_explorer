# Paper reproducibility bundle

This folder contains everything needed to regenerate every figure and table in the manuscript:

> Bahadir, S. *A standardized, surgically relevant map of emergence of organ-specific branches in the human vagus nerve.* bioRxiv, 2026. doi:[10.64898/2026.05.08.723047](https://www.biorxiv.org/content/10.64898/2026.05.08.723047v2)

---

## One-step reproduction

From the repo root:

```bash
pip install -r requirements.txt
jupyter notebook paper/paper_figures_reproducible.ipynb
```

Then in the notebook: **Kernel → Restart & Run All**. Total runtime is 1–2 minutes. Outputs land back in the figure / table subfolders alongside the notebook.

For a no-install option, use the Binder badge in the [root README](../README.md).

---

## What's in here

### Notebook

| File | What it does |
|---|---|
| `paper_figures_reproducible.ipynb` | End-to-end pipeline: loads the dataset, applies the four-anchor registration, and regenerates every main figure (Fig 2–7) and every table (Table 1 + Supp Tables S1–S7). |

### Data

| File | What it is |
|---|---|
| `vagus_atlas_dataset.xlsx` | **Published cohort.** 28 donors, 2,177 branches + 168 landmark rows. This is the primary dataset. |
| `vagus_atlas_full.xlsx` | Cohort + landmarks merged into a single sheet (intermediate; built by the notebook). |
| `vagus_atlas_analysis.xlsx` | Analysis-ready dataset after the registration step. This is what both the notebook and the explorer downstream of it consume. |
| `vagus_segment_scaffold_from_dd.xlsx` | Per-nerve cervical + thoracic segment lengths used to compute true total trunk length and to anchor the registration. |
| `overview_table_registered_v2_tiefix.csv` | Per-nerve summary table (one row per nerve). |
| `supp_table_S7_noncanonical_landmark_ordering.csv` | Supplementary Table S7 source — donors whose measured landmarks deviate from the canonical U → M → D ordering. |

### Generated outputs

The notebook writes its outputs back to these folders (each contains PNG + SVG of the figure plus any per-figure CSVs):

| Folder | Manuscript item |
|---|---|
| `Fig2_group_distributions/` | Figure 2 — group-level violin distributions |
| `Fig3_subway_map/` | Figure 3 — top-25 subgroup prevalence × four occurrence lanes |
| `Fig4_subgroup_violins/` | Figure 4 — subgroup-level distributions within each supergroup |
| `Fig5_regional_divisions/` | Figure 5 — pharyngeal arch, muscular / vascular regional, primitive mediastinum, cardiac subgroups |
| `Fig6_branch_free_intervals/` | Figure 6 — branch-free intervals per nerve |
| `Fig7_selectivity/` | Figure 7 — six prespecified target/comparator selectivity comparisons |
| `Tables/` | Table 1 |
| `Supplementary_tables/` | Supplementary Tables S1–S6 (S7 source is the CSV above) |

---

## Methods reference

- **Per-nerve trunk length** is the sum of ordered cervical + thoracic segment lengths from the registration scaffold, not the position of the last branch.
- **Registration** is a side-specific four-anchor piecewise-linear mapping. Anchors are **U** (Carotid Bifurcation), **M** (Laryngeal Prominence), **D** (Sup. Border of Clavicle), and **E** (true total trunk length). The registered axis column is `registered_distance_v2`.
- **Selectivity index** *i*(*x*) is the cumulative-recruitment difference between target and comparator groups at axial position *x*.

Full data dictionary and methods are in the [root README](../README.md) and the manuscript.
