# MerQube PE Support Ops Report (GitHub Pages)

Static, MerQube-branded report page for Platform Engineering support ops.

- **Quarterly sample** from `PE_Quarterly_Delivery_Review_Mar_To_June_2026.pdf` (delivery + BAU context)
- **May–Jul 2026 deep dive** from the local PES analysis suite (SLA, timing, types, hotspots, etc.)
- Person names anonymized; ticket summaries redacted for public hosting

## Local preview

```bash
cd /Users/arjit/Dev/Dev_Projects/pes-ops-report-pages
python3 -m http.server 4173
# open http://localhost:4173
```

## Publish (GitHub Pages)

Repo intended for: `https://github.com/arjit-merq/pes-ops-report`

```bash
# after: gh auth refresh -h github.com
gh repo create arjit-merq/pes-ops-report --public --source=. --remote=origin --push
gh api repos/arjit-merq/pes-ops-report/pages -X POST -f build_type=workflow \
  || echo "Enable Pages in Settings → Pages → Deploy from branch: main / root"
```

Expected URL after Pages is enabled:

`https://arjit-merq.github.io/pes-ops-report/`

## Refresh data

From `PES-CASE-ANALYSIS`:

```bash
python3 scripts/analyze_full_suite.py
python3 scripts/build_dashboard_report_bundle.py
# then re-run the sanitize export into this repo's data/report.json
```

## Privacy

Do **not** commit `.env`, raw Jira JSON, or unsanitized breach tables with customer text.
