# Vagus Atlas Explorer (source)

This folder holds the source for the **live interactive atlas explorer**.

[![Open Atlas Explorer](https://img.shields.io/badge/%E2%96%B6%20Atlas%20Explorer-Launch%20interactive%20tool-2ea44f?style=for-the-badge)](https://drsiyarb.github.io/vagus_nerve_explorer/)

You don't need to clone or run anything — the button above opens it in your browser. The site is served directly from this folder by GitHub Pages.

---

## What's in here

| File | What it is |
|---|---|
| `index.html` | The explorer app — a single self-contained HTML page with all CSS, JS, and rendering logic for the four coupled panels (Individual Branches, Subway Map, Distributions, Selectivity). |
| `vagus_atlas_data.js` | The dataset payload the page loads on startup. Generated from `paper/vagus_atlas_analysis.xlsx`. Do not hand-edit. |
| `build_atlas_data.py` | Regenerates `vagus_atlas_data.js` from the analysis-ready Excel file in `paper/`. Run after any change to the upstream dataset. |

---

## Regenerating the data payload

If you've re-run the paper notebook and want the explorer to pick up the new data:

```bash
python explorer/build_atlas_data.py
```

It reads `paper/vagus_atlas_analysis.xlsx` (the registered, analysis-ready dataset) and writes a fresh `explorer/vagus_atlas_data.js`. Commit both files together.

---

## How the explorer relates to the paper

The explorer surfaces the same underlying cohort (28 donors · 56 nerves · 2,177 branches) and the same `registered_distance_v2` axis used in every figure of the manuscript. It is not a separate analysis — it is a viewer on the published data.

For methods, citation, and the regeneratable figure/table bundle, see the [root README](../README.md) and the `paper/` folder.
