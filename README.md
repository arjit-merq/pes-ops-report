# MerQube PE Support Ops Report (GitHub Pages)

Static MerQube-branded review of **Platform Engineering Support (PES)** cases.

Data source: offline Jira export for `2026-05-01 ≤ created < 2026-08-01` (395 tickets). No quarterly PDF / capacity figures.

Includes SLA, demand timing, case types, hotspots, closers (real Jira display names), and a filterable raw case dump.

## Local preview

```bash
cd /Users/arjit/Dev/Dev_Projects/pes-ops-report-pages
python3 -m http.server 4173
# open http://localhost:4173
```

## Live URL

`https://arjit-merq.github.io/pes-ops-report/`

## Refresh data

From `PES-CASE-ANALYSIS`:

```bash
python3 scripts/analyze_full_suite.py
python3 scripts/build_dashboard_report_bundle.py
# then rebuild public report.json (copy dashboard_full_report.json + tickets dump)
```
