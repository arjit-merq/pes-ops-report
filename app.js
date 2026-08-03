/* MerQube PE Support Ops Report — executive SPA */

const ASSET_VERSION = "20260804e";

const COLORS = {
  teal: "#0f7a3a",
  sky: "#335cad",
  amber: "#b45309",
  rose: "#be123c",
  emerald: "#16a34a",
  indigo: "#3241ff",
  violet: "#6c32ff",
  slate: "#727a7d",
  white: "#212322",
};

const SECTIONS = [
  { id: "home", num: "00", title: "Cover", sub: "Executive summary" },
  { id: "overview", num: "01", title: "Overview", sub: "PES cohort volume" },
  { id: "impact", num: "02", title: "Resolution trend", sub: "Mar → Aug Highest & High" },
  { id: "timing", num: "03", title: "Demand timing", sub: "IST windows × type" },
  { id: "sla", num: "04", title: "SLA performance", sub: "Response & resolution" },
  { id: "types", num: "05", title: "Case types", sub: "Volume & pain rank" },
  { id: "hotspots", num: "06", title: "Hotspots", sub: "Recurring systems" },
  { id: "monthly", num: "07", title: "Monthly trend", sub: "Trajectory" },
  { id: "wfi", num: "08", title: "Waiting for Input", sub: "Dwell & backlog" },
  { id: "people", num: "09", title: "Closers & credit", sub: "Ownership from changelog" },
  { id: "reporters", num: "10", title: "Reporters", sub: "Intake sources" },
  { id: "pain", num: "11", title: "Pain points", sub: "Themes from comments" },
  { id: "cases", num: "12", title: "Case dump", sub: "All PES tickets" },
];

const chartRegistry = [];

function fmtHours(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n < 48) return `${n.toFixed(1)}h`;
  return `${n.toFixed(1)}h (${(n / 24).toFixed(1)}d)`;
}

function fmtPct(v) {
  return v == null ? "—" : `${v}%`;
}

function destroyCharts() {
  while (chartRegistry.length) {
    const c = chartRegistry.pop();
    try {
      c.destroy();
    } catch (_) {
      /* ignore */
    }
  }
}

function chart(canvas, config) {
  const instance = new Chart(canvas, config);
  chartRegistry.push(instance);
  return instance;
}

function kpi(label, value, hint = "", tip = "") {
  const tipAttr = tip ? ` data-tip="${escapeHtml(tip)}"` : "";
  const tipBtn = tip
    ? `<button type="button" class="tip-btn" aria-label="What this metric means">?</button>`
    : "";
  return `<div class="kpi"${tipAttr}>
    <div class="label">${label}${tipBtn}</div>
    <div class="value">${value}</div>
    ${hint ? `<div class="hint">${hint}</div>` : ""}
  </div>`;
}

function card(title, body, extraClass = "") {
  return `<section class="card ${extraClass}"><h3>${title}</h3>${body}</section>`;
}

function insights(title, items) {
  return `<aside class="insights"><h3>${title}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></aside>`;
}

function table(headers, rows) {
  return `<div class="table-wrap"><table><thead><tr>${headers
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead><tbody>${rows
    .map((r) => `<tr>${r.map((c) => `<td>${c ?? "—"}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function pageHead(section, lead) {
  return `<header class="page-head">
    <div>
      <div class="page-index">${section.num} / ${SECTIONS[SECTIONS.length - 1].num}</div>
      <h2>${section.title}</h2>
      <p>${lead}</p>
    </div>
  </header>`;
}

function pager(currentId) {
  const idx = SECTIONS.findIndex((s) => s.id === currentId);
  const prev = SECTIONS[idx - 1];
  const next = SECTIONS[idx + 1];
  return `<div class="pager">
    ${
      prev
        ? `<button class="btn btn-ghost" data-nav="${prev.id}">← ${prev.title}</button>`
        : `<span></span>`
    }
    ${
      next
        ? `<button class="btn btn-primary" data-nav="${next.id}">${next.title} →</button>`
        : `<span></span>`
    }
  </div>`;
}

function configureChartDefaults() {
  Chart.defaults.color = "#727a7d";
  Chart.defaults.borderColor = "rgba(33,35,34,0.1)";
  Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
  Chart.defaults.plugins.legend.labels.boxWidth = 12;
  Chart.defaults.plugins.legend.labels.usePointStyle = true;
}

function fmtTs(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
}

function escapeHtml(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function jiraLink(key, url) {
  const href = url || `https://merqube.atlassian.net/browse/${encodeURIComponent(key)}`;
  return `<a class="jira-link" href="${href}" target="_blank" rel="noreferrer">${escapeHtml(key)}</a>`;
}

function miniList(title, items) {
  const rows = (items || [])
    .slice(0, 8)
    .map((it) => {
      if (Array.isArray(it)) return `<li><strong>${escapeHtml(it[0])}</strong> · ${it[1]}</li>`;
      if (it && typeof it === "object") {
        const label = it.type || it.case_type || it.name || it[0] || "—";
        const n = it.n ?? it.count ?? it[1] ?? "";
        return `<li><strong>${escapeHtml(label)}</strong> · ${escapeHtml(n)}</li>`;
      }
      return `<li>${escapeHtml(it)}</li>`;
    })
    .join("");
  return `<div class="mini-list"><h4>${escapeHtml(title)}</h4><ul>${rows || "<li>—</li>"}</ul></div>`;
}

function heatTable(heat) {
  const max = Math.max(1, ...heat.cells.map((c) => c.n));
  const head = `<tr><th>IST window</th>${heat.types.map((t) => `<th class="heat-col">${escapeHtml(t)}</th>`).join("")}</tr>`;
  const body = heat.buckets
    .map((bucket) => {
      const cells = heat.types
        .map((t) => {
          const n = heat.cells.find((c) => c.bucket === bucket && c.type === t)?.n ?? 0;
          const a = n ? 0.12 + (0.72 * n) / max : 0;
          return `<td class="heat-cell" style="background:rgba(15,122,58,${a.toFixed(3)})">${n || ""}</td>`;
        })
        .join("");
      return `<tr><th class="heat-row">${escapeHtml(bucket.replace(" IST", ""))}</th>${cells}</tr>`;
    })
    .join("");
  return `<div class="table-wrap heat"><table class="heat-table"><thead>${head}</thead><tbody>${body}</tbody></table></div>`;
}

function buildHome(report) {
  const ov = report.overview;
  const wi = report.weekly_impact;
  const highest = wi?.early_vs_summer_created?.Highest || wi?.before_after_created_cohort?.Highest;
  const high = wi?.early_vs_summer_created?.High || wi?.before_after_created_cohort?.High;
  return `
    <section class="view active" data-view="home">
      <div class="cover">
        <p class="cover-eyebrow">Platform Engineering · Support Operations</p>
        <h1>PES support case review</h1>
        <p class="cover-lead">
          Executive walkthrough of Platform Engineering Support cases from
          ${report.window_label || report.window}, with week-on-week Highest/High
          resolution trending through June and July.
        </p>
        <div class="cover-actions">
          <button class="btn btn-primary" data-nav="overview">Start review</button>
        </div>
        <div class="cover-stats">
          <div class="stat-pill"><div class="label">PES cases</div><div class="value">${ov.n}</div></div>
          <div class="stat-pill"><div class="label">Closed</div><div class="value">${fmtPct(ov.closed_pct)}</div></div>
          <div class="stat-pill"><div class="label">Highest SLA (Jun–Jul)</div><div class="value">${fmtPct(highest?.summer?.resolution_meet_pct ?? highest?.after?.resolution_meet_pct)}</div></div>
          <div class="stat-pill"><div class="label">High SLA (Jun–Jul)</div><div class="value">${fmtPct(high?.summer?.resolution_meet_pct ?? high?.after?.resolution_meet_pct)}</div></div>
        </div>
        ${insights("What this review answers", [
          "Did Highest/High resolution improve from early spring into June–July?",
          "Is support demand stable, and where does it spike by time of day?",
          "Are we meeting first-response and resolution SLAs by priority?",
          "Which case types and systems create the most operational pain?",
        ])}
      </div>
    </section>`;
}

function buildOverview(report) {
  const s = SECTIONS.find((x) => x.id === "overview");
  const ov = report.overview;
  const resp = report.sla_response.overall;
  const reso = report.sla_resolution.overall;
  return `
    <section class="view" data-view="overview">
      ${pageHead(s, `PES tickets created ${report.window_label || report.window} (${ov.n} cases). Open = status NOT IN (Canceled, Cancelled, Completed, Done, DECLINED, ENHANCEMENT). Closed-at uses first terminal status transition.`)}
      <div class="content">
        <div class="kpi-row">
          ${kpi("Opened", ov.n)}
          ${kpi("Closed now", ov.closed_now, `${ov.closed_pct}%`)}
          ${kpi("Still open", ov.open_now, "matches live open JQL")}
          ${kpi("Response SLA", fmtPct(resp.meet_pct), `${resp.n_met}/${resp.n_applicable} · May–Jul deep dive`)}
        </div>
        <div class="grid-2">
          ${card("Open vs closed", `<div class="chart-box"><canvas id="c-open"></canvas></div>`)}
          ${card("Priority mix", `<div class="chart-box"><canvas id="c-pri"></canvas></div>`)}
        </div>
        <div class="grid-2">
          ${card("Status breakdown", table(["Status", "Count"], ov.status_counts.map((r) => [r.status, r.n])))}
          ${insights("Resolution posture", [
            `Resolution SLA meet: ${fmtPct(reso.meet_pct)} (${reso.n_met}/${reso.n_applicable}).`,
            "Highest priority scored as same IST business day or ≤24h continuous effort.",
            "Business days counted in IST Mon–Fri; holidays not applied.",
          ])}
        </div>
        ${pager("overview")}
      </div>
    </section>`;
}

function fmtDeltaPct(v) {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v}%`;
}

function fmtPp(v) {
  if (v == null) return "—";
  const sign = v > 0 ? "+" : "";
  return `${sign}${v} pp`;
}

function buildImpact(report) {
  const s = SECTIONS.find((x) => x.id === "impact");
  const wi = report.weekly_impact;
  if (!wi) {
    return `<section class="view" data-view="impact">${pageHead(s, "Weekly impact data not loaded.")}${pager("impact")}</section>`;
  }
  const def = wi.definition;
  const highest = wi.early_vs_summer_created?.Highest || wi.before_after_created_cohort.Highest;
  const high = wi.early_vs_summer_created?.High || wi.before_after_created_cohort.High;
  const both = wi.early_vs_summer_created?.["Highest+High"] || wi.before_after_created_cohort["Highest+High"];
  const early = highest.early || highest.before;
  const summer = highest.summer || highest.after;
  return `
    <section class="view" data-view="impact">
      ${pageHead(
        s,
        `Highest & High resolution from ${def.window_label || def.window_start}. Compare Mar–May vs Jun–Jul, then read the week-on-week charts.`,
      )}
      <div class="content">
        ${insights("How to read this", [
          "General March → August trajectory for Highest and High priority PE support cases.",
          "Headline comparison: tickets that <em>arrived</em> in Mar–May vs Jun–Jul (created cohort).",
          "Charts use week-of-resolution. Shaded band / marker marks the start of June.",
        ])}
        <div class="kpi-row">
          ${kpi(
            "Highest mean TTR (Jun–Jul)",
            `${summer.mean_ttr_h}h`,
            `Mar–May ${early.mean_ttr_h}h → ${fmtDeltaPct(highest.mean_ttr_change_pct)}`,
            "Mean time to resolution for Highest-priority tickets created in Jun–Jul (then closed). TTR = calendar hours from created → first terminal status. Lower is better. Compared with the same metric for tickets created in Mar–May.",
          )}
          ${kpi(
            "Highest median TTR (Jun–Jul)",
            `${summer.median_ttr_h}h`,
            `Mar–May ${early.median_ttr_h}h → ${fmtDeltaPct(highest.median_ttr_change_pct)}`,
            "Median (50th percentile) time to resolution for Highest tickets created in Jun–Jul. Less skewed by a few very long outliers than the mean. Lower is better.",
          )}
          ${kpi(
            "Highest resolution SLA",
            fmtPct(summer.resolution_meet_pct),
            `Mar–May ${fmtPct(early.resolution_meet_pct)} → ${fmtPp(highest.resolution_meet_pp)}`,
            "Share of Highest tickets (created in that period, now closed) that met the On-call resolution target: same IST business day or within 24 calendar hours. Higher is better. Δ is percentage points vs Mar–May.",
          )}
          ${kpi(
            "High resolution SLA",
            fmtPct((high.summer || high.after).resolution_meet_pct),
            `Mar–May ${fmtPct((high.early || high.before).resolution_meet_pct)} → ${fmtPp(high.resolution_meet_pp)}`,
            "Share of High-priority tickets that met the On-call resolution target: closed within 3 IST business days. Higher is better. Compared Mar–May → Jun–Jul for tickets created in each period.",
          )}
        </div>
        <div class="grid-2">
          ${card(
            "Mar–May → Jun–Jul (created cohort)",
            table(
              ["Priority", "n early", "n Jun–Jul", "Mean TTR Δ", "Median TTR Δ", "SLA meet Δ"],
              ["Highest", "High", "Highest+High"].map((p) => {
                const row = (wi.early_vs_summer_created || wi.before_after_created_cohort)[p];
                return [
                  p,
                  (row.early || row.before).n_closed,
                  (row.summer || row.after).n_closed,
                  fmtDeltaPct(row.mean_ttr_change_pct),
                  fmtDeltaPct(row.median_ttr_change_pct),
                  fmtPp(row.resolution_meet_pp),
                ];
              }),
            ),
          )}
          ${insights("Jun–Jul takeaways", [
            `Highest mean TTR fell ${Math.abs(highest.mean_ttr_change_pct)}% (${early.mean_ttr_h}h → ${summer.mean_ttr_h}h) for tickets filed in Jun–Jul vs Mar–May.`,
            `Highest resolution SLA meet rose ${fmtPp(highest.resolution_meet_pp)} (${fmtPct(early.resolution_meet_pct)} → ${fmtPct(summer.resolution_meet_pct)}).`,
            `Highest+High SLA meet rose ${fmtPp(both.resolution_meet_pp)}; mean TTR ${fmtDeltaPct(both.mean_ttr_change_pct)}.`,
            "Week-on-week charts below show the path into that summer improvement.",
          ])}
        </div>
        ${card("Mean TTR by closed week (hours)", `<div class="chart-box tall"><canvas id="c-impact-mean"></canvas></div>`)}
        ${card("Median TTR by closed week (hours)", `<div class="chart-box tall"><canvas id="c-impact-median"></canvas></div>`)}
        ${card("Resolution SLA meet % by closed week", `<div class="chart-box tall"><canvas id="c-impact-sla"></canvas></div>`)}
        ${card("Highest + High closed volume by week", `<div class="chart-box"><canvas id="c-impact-vol"></canvas></div>`)}
        ${pager("impact")}
      </div>
    </section>`;
}

function buildTiming(report) {
  const s = SECTIONS.find((x) => x.id === "timing");
  return `
    <section class="view" data-view="timing">
      ${pageHead(s, "Created timestamps converted to Asia/Kolkata and grouped into 3-hour windows (May–Jul deep-dive cohort).")}
      <div class="content">
        <div class="grid-2">
          ${card("Opened by IST window", `<div class="chart-box"><canvas id="c-ist"></canvas></div>`)}
          ${card("Time to close percentiles", `<div class="chart-box"><canvas id="c-ttr"></canvas></div>`)}
        </div>
        ${card(
          "TTR by priority",
          table(
            ["Priority", "n", "Avg", "p50", "p90", "p99"],
            report.ttr_by_priority.map((r) => [
              r.priority,
              r.n,
              fmtHours(r.avg_h),
              fmtHours(r.p50_h),
              fmtHours(r.p90_h),
              fmtHours(r.p99_h),
            ]),
          ),
        )}
        ${insights("Timing signal", [
          "Evening IST into US hours carries the largest open volume.",
          "p50 close times look healthier than the long p90/p99 tails — focus on outliers.",
        ])}
        ${card("IST window × case type", heatTable(report.ist_x_type))}
        <div class="grid-2">
          ${card("Evening / US hours (18:00–03:00 IST)", miniList("Top types", report.ist_x_type.evening_top))}
          ${card("Daytime IST (09:00–18:00)", miniList("Top types", report.ist_x_type.daytime_top))}
        </div>
        ${pager("timing")}
      </div>
    </section>`;
}

function buildSla(report) {
  const s = SECTIONS.find((x) => x.id === "sla");
  const resp = report.sla_response.overall;
  const reso = report.sla_resolution.overall;
  return `
    <section class="view" data-view="sla">
      ${pageHead(s, "Mapped to On-call Guidelines response and resolution targets (May–Jul deep-dive cohort).")}
      <div class="content">
        <div class="kpi-row">
          ${kpi("Response meet", fmtPct(resp.meet_pct), `${report.sla_response.breach_count} breaches`)}
          ${kpi("Resolution meet", fmtPct(reso.meet_pct), `${report.sla_resolution.breach_count} breaches`)}
          ${kpi("WFI ever", report.wfi.n_ever_wfi)}
          ${kpi("WFI now", report.wfi.n_currently_wfi, `p50 dwell ${fmtHours(report.wfi.dwell_hours.p50 ?? report.wfi.dwell_hours.p50_h)}`)}
        </div>
        ${card("Meet rate by priority", `<div class="chart-box"><canvas id="c-sla"></canvas></div>`)}
        ${card(
          "Detail",
          table(
            ["Priority", "n", "Resp p50", "Resp meet%", "TTR p50", "Res meet%"],
            report.sla_response.by_priority.map((r) => [
              r.priority,
              r.n_tickets,
              fmtHours(r.response_p50_h),
              fmtPct(r.response_meet_pct),
              fmtHours(r.ttr_p50_h),
              fmtPct(r.resolution_meet_pct),
            ]),
          ),
        )}
        ${card(
          `Response SLA breaches (top ${report.sla_response.breaches.length} of ${report.sla_response.breach_count})`,
          table(
            ["Case", "Pri", "Hours", "Responder", "Type", "Summary"],
            report.sla_response.breaches.map((b) => [
              jiraLink(b.key),
              b.priority,
              fmtHours(b.hours),
              escapeHtml(b.responder || "—"),
              escapeHtml(b.case_type || "—"),
              escapeHtml((b.summary || "").slice(0, 60)),
            ]),
          ),
        )}
        ${card(
          `Resolution SLA breaches (top ${report.sla_resolution.breaches.length} of ${report.sla_resolution.breach_count})`,
          table(
            ["Case", "Pri", "TTR", "Closer", "Type", "Summary"],
            report.sla_resolution.breaches.map((b) => [
              jiraLink(b.key),
              b.priority,
              fmtHours(b.ttr_hours),
              escapeHtml(b.closer || "—"),
              escapeHtml(b.case_type || "—"),
              escapeHtml((b.summary || "").slice(0, 60)),
            ]),
          ),
        )}
        ${pager("sla")}
      </div>
    </section>`;
}

function buildTypes(report) {
  const s = SECTIONS.find((x) => x.id === "types");
  return `
    <section class="view" data-view="types">
      ${pageHead(s, `Summary/description classifier on the May–Jul deep-dive cohort. Low-confidence labels: ${report.case_types.low_confidence_count}.`)}
      <div class="content">
        <div class="grid-2">
          ${card("Volume by case type", `<div class="chart-box tall"><canvas id="c-types"></canvas></div>`)}
          ${card("Pain score rank", `<div class="chart-box tall"><canvas id="c-pain"></canvas></div>`)}
        </div>
        ${card("PE Issue Category (Jira field)", `<div class="chart-box"><canvas id="c-pe-cat"></canvas></div>`)}
        ${card(
          "Type detail",
          table(
            ["Type", "n", "Open", "TTR p50", "Resp%", "Res%", "Pain"],
            report.case_types.pain_ranked.map((r) => [
              r.case_type,
              r.n,
              r.open_now,
              fmtHours(r.ttr_p50_h),
              fmtPct(r.response_meet_pct),
              fmtPct(r.resolution_meet_pct),
              r.pain_score ?? "—",
            ]),
          ),
        )}
        ${pager("types")}
      </div>
    </section>`;
}

function buildHotspots(report) {
  const s = SECTIONS.find((x) => x.id === "hotspots");
  return `
    <section class="view" data-view="hotspots">
      ${pageHead(s, "Recurring systems and alert patterns matched from ticket summaries (May–Jul deep-dive cohort).")}
      <div class="content">
        ${card("Top hotspots", `<div class="chart-box tall"><canvas id="c-hot"></canvas></div>`)}
        ${card(
          "Hotspot detail",
          table(
            ["Hotspot", "n", "TTR p50", "Resp%", "Res%"],
            report.hotspots.map((h) => [
              h.hotspot,
              h.n,
              fmtHours(h.ttr_p50_h),
              fmtPct(h.response_meet_pct),
              fmtPct(h.resolution_meet_pct),
            ]),
          ),
        )}
        ${pager("hotspots")}
      </div>
    </section>`;
}

function buildMonthly(report) {
  const s = SECTIONS.find((x) => x.id === "monthly");
  return `
    <section class="view" data-view="monthly">
      ${pageHead(s, "Created month in IST — volume and SLA trajectory (May–Jul deep-dive cohort).")}
      <div class="content">
        <div class="grid-2">
          ${card("Opened vs still open", `<div class="chart-box"><canvas id="c-mvol"></canvas></div>`)}
          ${card("SLA meet trajectory", `<div class="chart-box"><canvas id="c-msla"></canvas></div>`)}
        </div>
        ${card(
          "Month detail",
          table(
            ["Month", "Opened", "Closed", "Open", "TTR p50", "Resp%", "Res%"],
            report.monthly.map((m) => [
              m.month,
              m.opened,
              m.closed,
              m.still_open,
              fmtHours(m.ttr_p50_h),
              fmtPct(m.response_meet_pct),
              fmtPct(m.resolution_meet_pct),
            ]),
          ),
        )}
        ${pager("monthly")}
      </div>
    </section>`;
}

function buildWfi(report) {
  const s = SECTIONS.find((x) => x.id === "wfi");
  const dwell = report.wfi.dwell_hours || {};
  return `
    <section class="view" data-view="wfi">
      ${pageHead(s, (report.wfi.definition || "Time spent in Waiting for Input.") + " (May–Jul deep-dive cohort)")}
      <div class="content">
        <div class="kpi-row">
          ${kpi("Ever WFI", report.wfi.n_ever_wfi)}
          ${kpi("Currently WFI", report.wfi.n_currently_wfi)}
          ${kpi("Dwell p50", fmtHours(dwell.p50 ?? dwell.p50_h))}
          ${kpi("Dwell p90", fmtHours(dwell.p90 ?? dwell.p90_h))}
        </div>
        ${card(
          "Currently Waiting for Input",
          table(
            ["Case", "Pri", "WFI h", "Assignee", "Type", "Summary"],
            (report.wfi.currently || []).length
              ? report.wfi.currently.map((r) => [
                  jiraLink(r.key),
                  r.priority,
                  r.wfi_hours,
                  escapeHtml(r.assignee || "—"),
                  escapeHtml(r.case_type || "—"),
                  escapeHtml((r.summary || "").slice(0, 55)),
                ])
              : [["—", "—", "—", "—", "—", "none"]],
          ),
        )}
        ${card(
          "Longest WFI dwell",
          table(
            ["Case", "Pri", "Status", "WFI h", "Type", "Summary"],
            (report.wfi.longest_dwell || []).map((r) => [
              jiraLink(r.key),
              r.priority,
              escapeHtml(r.status),
              r.wfi_hours,
              escapeHtml(r.case_type || "—"),
              escapeHtml((r.summary || "").slice(0, 55)),
            ]),
          ),
        )}
        ${pager("wfi")}
      </div>
    </section>`;
}

function buildPeople(report) {
  const s = SECTIONS.find((x) => x.id === "people");
  const cw = report.closer_vs_worker;
  return `
    <section class="view" data-view="people">
      ${pageHead(
        s,
        `Closer = author of first changelog transition to a terminal status. Closer ≠ top-commenter on ${fmtPct(cw.mismatch_pct)} of closed tickets (${cw.n_mismatch}/${cw.n_closed_with_closer}). May–Jul deep-dive cohort.`,
      )}
      <div class="content">
        ${card("Tickets closed (changelog closer)", `<div class="chart-box tall"><canvas id="c-closers"></canvas></div>`)}
        ${card(
          "Credit delta",
          table(
            ["Person", "Closed as closer", "Was top commenter", "Delta"],
            cw.credit_delta.slice(0, 15).map((r) => [
              escapeHtml(r.person),
              r.closed_as_closer,
              r.was_top_commenter_on_closed,
              r.delta_closer_minus_top,
            ]),
          ),
        )}
        ${card(
          "Mismatch examples (closer ≠ primary commenter)",
          table(
            ["Case", "Pri", "Closer", "Top commenter (n)", "Type", "Summary"],
            (cw.mismatches || []).slice(0, 40).map((m) => [
              jiraLink(m.key),
              m.priority,
              escapeHtml(m.closer),
              `${escapeHtml(m.top_commenter)} (${m.top_commenter_count})`,
              escapeHtml(m.case_type || "—"),
              escapeHtml((m.summary || "").slice(0, 45)),
            ]),
          ),
        )}
        ${card(
          "Weekly closers",
          (report.weekly_closers || [])
            .map(
              (w) => `<div class="week-block"><p class="week-title">${escapeHtml(w.week)} — ${w.total_closed} closed</p>${table(
                ["Person", "Closed"],
                (w.by_person || []).map((p) => [escapeHtml(p.person), p.closed]),
              )}</div>`,
            )
            .join(""),
        )}
        ${pager("people")}
      </div>
    </section>`;
}

function buildReporters(report) {
  const s = SECTIONS.find((x) => x.id === "reporters");
  const r = report.reporters;
  return `
    <section class="view" data-view="reporters">
      ${pageHead(
        s,
        `${r.n_unique_reporters} unique reporters · alert-like summaries ${r.alertish_summary_count} (${r.alertish_pct}%). May–Jul deep-dive cohort.`,
      )}
      <div class="content">
        ${card("Top reporters", `<div class="chart-box tall"><canvas id="c-reporters"></canvas></div>`)}
        ${card(
          "Reporter detail",
          table(
            ["Reporter", "n", "Share", "Alertish", "Top types"],
            r.reporters.map((row) => [
              escapeHtml(row.reporter),
              row.n,
              `${row.share_pct}%`,
              row.alertish_summaries,
              (row.top_types || [])
                .filter((t) => t && t[0])
                .slice(0, 3)
                .map(([t, n]) => `${t}(${n})`)
                .join(", "),
            ]),
          ),
        )}
        ${pager("reporters")}
      </div>
    </section>`;
}

function ticketRows(tickets) {
  return tickets.map((t) => [
    jiraLink(t.key, t.jira_url),
    `<span class="wrap">${escapeHtml(t.summary)}</span>`,
    escapeHtml(t.reporter || t.creator || "—"),
    escapeHtml(t.assignee || "—"),
    `<span class="mono">${fmtTs(t.created_at)}</span>`,
    `<span class="mono">${fmtTs(t.closed_at)}</span>`,
    escapeHtml(t.status),
    escapeHtml(t.priority),
  ]);
}

function renderCaseTable(tickets) {
  return `<div class="table-wrap raw"><table><thead><tr>${[
    "Case",
    "Subject",
    "Reporter",
    "Assignee",
    "Created",
    "Closed",
    "Status",
    "Priority",
  ]
    .map((h) => `<th>${h}</th>`)
    .join("")}</tr></thead><tbody>${ticketRows(tickets)
    .map((r) => `<tr>${r.map((c) => `<td>${c ?? "—"}</td>`).join("")}</tr>`)
    .join("")}</tbody></table></div>`;
}

function buildCases(report) {
  const s = SECTIONS.find((x) => x.id === "cases");
  const tickets = report.tickets || [];
  return `
    <section class="view" data-view="cases">
      ${pageHead(
        s,
        `All ${tickets.length} PES tickets. Reporter is the Jira reporter (not Atlassian Assist creator). Closed-at is first terminal status transition. Case keys link to Jira.`,
      )}
      <div class="content">
        <div class="toolbar">
          <input id="case-filter" type="search" placeholder="Filter by key, summary, reporter, assignee, status…" />
          <span class="count" id="case-count">${tickets.length} shown</span>
        </div>
        ${card("Raw case table", `<div id="case-table">${renderCaseTable(tickets)}</div>`)}
        ${pager("cases")}
      </div>
    </section>`;
}

function wireCaseFilter(report) {
  const input = document.getElementById("case-filter");
  const host = document.getElementById("case-table");
  const count = document.getElementById("case-count");
  if (!input || !host) return;
  const all = report.tickets || [];
  const apply = () => {
    const q = input.value.trim().toLowerCase();
    const filtered = !q
      ? all
      : all.filter((t) =>
          [t.key, t.summary, t.reporter, t.creator, t.assignee, t.status, t.priority]
            .map((x) => String(x || "").toLowerCase())
            .some((x) => x.includes(q)),
        );
    host.innerHTML = renderCaseTable(filtered);
    count.textContent = `${filtered.length} shown`;
  };
  input.addEventListener("input", apply);
}

function buildPain(report) {
  const s = SECTIONS.find((x) => x.id === "pain");
  return `
    <section class="view" data-view="pain">
      ${pageHead(s, `${report.pain_points.pr_mention_count} tickets mention a GitHub PR in comments (May–Jul deep-dive cohort).`)}
      <div class="content">
        ${insights("Narrative", report.pain_points.narrative_bullets)}
        ${card("Theme frequency", `<div class="chart-box tall"><canvas id="c-themes"></canvas></div>`)}
        ${pager("pain")}
      </div>
    </section>`;
}

function mountCharts(report, viewId) {
  destroyCharts();
  const commonOpts = {
    responsive: true,
    maintainAspectRatio: false,
  };

  if (viewId === "impact" && report.weekly_impact) {
    const weeks = report.weekly_impact.weekly_closed;
    const labels = weeks.map((w) => w.week_id.replace("2026-", ""));
    const juneIdx = weeks.findIndex((w) => (w.phase || w.period) === "summer" || w.week_monday >= "2026-06-01");
    const junePlugin = {
      id: "juneMarker",
      afterDraw(chart) {
        if (juneIdx < 0) return;
        const { ctx, chartArea, scales } = chart;
        const x = scales.x.getPixelForValue(juneIdx);
        ctx.save();
        ctx.strokeStyle = "rgba(15,122,58,0.55)";
        ctx.setLineDash([5, 4]);
        ctx.beginPath();
        ctx.moveTo(x, chartArea.top);
        ctx.lineTo(x, chartArea.bottom);
        ctx.stroke();
        ctx.fillStyle = "rgba(15,122,58,0.85)";
        ctx.font = "11px IBM Plex Sans";
        ctx.fillText("Jun →", x + 4, chartArea.top + 12);
        ctx.restore();
      },
    };
    const series = (pri, field) => weeks.map((w) => w.priorities[pri]?.[field] ?? null);
    chart(document.getElementById("c-impact-mean"), {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Highest mean TTR", data: series("Highest", "mean_ttr_h"), borderColor: COLORS.rose, tension: 0.25, spanGaps: true },
          { label: "High mean TTR", data: series("High", "mean_ttr_h"), borderColor: COLORS.amber, tension: 0.25, spanGaps: true },
        ],
      },
      options: { ...commonOpts, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, title: { display: true, text: "Hours" } } } },
      plugins: [junePlugin],
    });
    chart(document.getElementById("c-impact-median"), {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Highest median TTR", data: series("Highest", "median_ttr_h"), borderColor: COLORS.rose, tension: 0.25, spanGaps: true },
          { label: "High median TTR", data: series("High", "median_ttr_h"), borderColor: COLORS.amber, tension: 0.25, spanGaps: true },
        ],
      },
      options: { ...commonOpts, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, title: { display: true, text: "Hours" } } } },
      plugins: [junePlugin],
    });
    chart(document.getElementById("c-impact-sla"), {
      type: "line",
      data: {
        labels,
        datasets: [
          { label: "Highest SLA meet %", data: series("Highest", "resolution_meet_pct"), borderColor: COLORS.teal, tension: 0.25, spanGaps: true },
          { label: "High SLA meet %", data: series("High", "resolution_meet_pct"), borderColor: COLORS.sky, tension: 0.25, spanGaps: true },
        ],
      },
      options: { ...commonOpts, plugins: { legend: { position: "bottom" } }, scales: { y: { beginAtZero: true, max: 100, title: { display: true, text: "%" } } } },
      plugins: [junePlugin],
    });
    chart(document.getElementById("c-impact-vol"), {
      type: "bar",
      data: {
        labels,
        datasets: [
          { label: "Highest closed", data: weeks.map((w) => w.priorities.Highest.n_closed), backgroundColor: COLORS.rose, borderRadius: 6 },
          { label: "High closed", data: weeks.map((w) => w.priorities.High.n_closed), backgroundColor: COLORS.amber, borderRadius: 6 },
        ],
      },
      options: { ...commonOpts, plugins: { legend: { position: "bottom" } }, scales: { x: { stacked: true }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } } } },
      plugins: [junePlugin],
    });
  }

  if (viewId === "overview") {
    const ov = report.overview;
    chart(document.getElementById("c-open"), {
      type: "doughnut",
      data: {
        labels: ["Closed", "Open"],
        datasets: [{ data: [ov.closed_now, ov.open_now], backgroundColor: [COLORS.emerald, COLORS.amber], borderWidth: 0 }],
      },
      options: { ...commonOpts, cutout: "62%", plugins: { legend: { position: "bottom" } } },
    });
    chart(document.getElementById("c-pri"), {
      type: "bar",
      data: {
        labels: ov.priority_counts.map((p) => p.priority),
        datasets: [{ data: ov.priority_counts.map((p) => p.n), backgroundColor: COLORS.indigo, borderRadius: 10 }],
      },
      options: { ...commonOpts, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
  }

  if (viewId === "timing") {
    chart(document.getElementById("c-ist"), {
      type: "bar",
      data: {
        labels: report.ist_buckets.map((b) => b.bucket.replace(" IST", "")),
        datasets: [{ data: report.ist_buckets.map((b) => b.opened), backgroundColor: COLORS.sky, borderRadius: 10 }],
      },
      options: {
        ...commonOpts,
        plugins: { legend: { display: false } },
        scales: {
          x: { ticks: { maxRotation: 40, minRotation: 20, font: { size: 10 } } },
          y: { beginAtZero: true, ticks: { precision: 0 } },
        },
      },
    });
    chart(document.getElementById("c-ttr"), {
      type: "bar",
      data: {
        labels: report.ttr_by_priority.map((r) => r.priority),
        datasets: [
          { label: "p50", data: report.ttr_by_priority.map((r) => r.p50_h ?? 0), backgroundColor: COLORS.emerald, borderRadius: 8 },
          { label: "p90", data: report.ttr_by_priority.map((r) => r.p90_h ?? 0), backgroundColor: COLORS.amber, borderRadius: 8 },
          { label: "p99", data: report.ttr_by_priority.map((r) => r.p99_h ?? 0), backgroundColor: COLORS.rose, borderRadius: 8 },
        ],
      },
      options: { ...commonOpts, scales: { y: { beginAtZero: true, title: { display: true, text: "Hours" } } } },
    });
  }

  if (viewId === "sla") {
    chart(document.getElementById("c-sla"), {
      type: "bar",
      data: {
        labels: report.sla_response.by_priority.map((r) => r.priority),
        datasets: [
          {
            label: "Response meet %",
            data: report.sla_response.by_priority.map((r) => r.response_meet_pct ?? 0),
            backgroundColor: COLORS.sky,
            borderRadius: 8,
          },
          {
            label: "Resolution meet %",
            data: report.sla_response.by_priority.map((r) => r.resolution_meet_pct ?? 0),
            backgroundColor: COLORS.teal,
            borderRadius: 8,
          },
        ],
      },
      options: { ...commonOpts, scales: { y: { beginAtZero: true, max: 100 } } },
    });
  }

  if (viewId === "types") {
    const types = report.case_types.bars.slice(0, 12);
    const pain = report.case_types.pain_ranked.slice(0, 10);
    chart(document.getElementById("c-types"), {
      type: "bar",
      data: {
        labels: types.map((t) => t.type.replaceAll("_", " ")),
        datasets: [{ data: types.map((t) => t.n), backgroundColor: COLORS.indigo, borderRadius: 8 }],
      },
      options: {
        ...commonOpts,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
    chart(document.getElementById("c-pain"), {
      type: "bar",
      data: {
        labels: pain.map((t) => t.case_type.replaceAll("_", " ")),
        datasets: [{ data: pain.map((t) => t.pain_score ?? 0), backgroundColor: COLORS.rose, borderRadius: 8 }],
      },
      options: { ...commonOpts, indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    });
    const pe = (report.case_types.pe_category_bars || []).slice(0, 12);
    const peCanvas = document.getElementById("c-pe-cat");
    if (peCanvas) {
      chart(peCanvas, {
        type: "bar",
        data: {
          labels: pe.map((r) => r.category),
          datasets: [{ data: pe.map((r) => r.n), backgroundColor: COLORS.sky, borderRadius: 8 }],
        },
        options: {
          ...commonOpts,
          indexAxis: "y",
          plugins: { legend: { display: false } },
          scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        },
      });
    }
  }

  if (viewId === "hotspots") {
    const rows = report.hotspots.slice(0, 10);
    chart(document.getElementById("c-hot"), {
      type: "bar",
      data: {
        labels: rows.map((h) => (h.hotspot.length > 28 ? `${h.hotspot.slice(0, 26)}…` : h.hotspot)),
        datasets: [{ data: rows.map((h) => h.n), backgroundColor: COLORS.amber, borderRadius: 8 }],
      },
      options: {
        ...commonOpts,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  if (viewId === "monthly") {
    chart(document.getElementById("c-mvol"), {
      type: "bar",
      data: {
        labels: report.monthly.map((m) => m.month),
        datasets: [
          { label: "Opened", data: report.monthly.map((m) => m.opened), backgroundColor: COLORS.sky, borderRadius: 8 },
          { label: "Still open", data: report.monthly.map((m) => m.still_open), backgroundColor: COLORS.amber, borderRadius: 8 },
        ],
      },
      options: { ...commonOpts, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    chart(document.getElementById("c-msla"), {
      type: "line",
      data: {
        labels: report.monthly.map((m) => m.month),
        datasets: [
          {
            label: "Response meet %",
            data: report.monthly.map((m) => m.response_meet_pct ?? 0),
            borderColor: COLORS.sky,
            backgroundColor: "rgba(56,189,248,0.15)",
            tension: 0.3,
            fill: true,
          },
          {
            label: "Resolution meet %",
            data: report.monthly.map((m) => m.resolution_meet_pct ?? 0),
            borderColor: COLORS.teal,
            backgroundColor: "rgba(45,212,191,0.12)",
            tension: 0.3,
            fill: true,
          },
        ],
      },
      options: { ...commonOpts, scales: { y: { beginAtZero: true, max: 100 } } },
    });
  }

  if (viewId === "people") {
    const closers = report.closer_vs_worker.closers.slice(0, 12);
    chart(document.getElementById("c-closers"), {
      type: "bar",
      data: {
        labels: closers.map((c) => c.person),
        datasets: [{ data: closers.map((c) => c.closed), backgroundColor: COLORS.teal, borderRadius: 8 }],
      },
      options: {
        ...commonOpts,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  if (viewId === "reporters") {
    const rows = report.reporters.reporters.slice(0, 12);
    chart(document.getElementById("c-reporters"), {
      type: "bar",
      data: {
        labels: rows.map((r) => (r.reporter.length > 22 ? `${r.reporter.slice(0, 20)}…` : r.reporter)),
        datasets: [{ data: rows.map((r) => r.n), backgroundColor: COLORS.sky, borderRadius: 8 }],
      },
      options: {
        ...commonOpts,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }

  if (viewId === "pain") {
    const themes = report.pain_points.themes.slice(0, 10);
    chart(document.getElementById("c-themes"), {
      type: "bar",
      data: {
        labels: themes.map((t) => (t.theme.length > 30 ? `${t.theme.slice(0, 28)}…` : t.theme)),
        datasets: [{ data: themes.map((t) => t.n), backgroundColor: COLORS.rose, borderRadius: 8 }],
      },
      options: {
        ...commonOpts,
        indexAxis: "y",
        plugins: { legend: { display: false } },
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
  }
}

function navigate(report, id, { push = true } = {}) {
  const target = SECTIONS.some((s) => s.id === id) ? id : "home";
  document.querySelectorAll(".view").forEach((v) => {
    v.classList.toggle("active", v.dataset.view === target);
  });
  document.querySelectorAll(".nav-item").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.nav === target);
  });
  if (push) {
    history.pushState({ view: target }, "", `#/${target}`);
  }
  // charts only for active view; slight delay so canvas is visible
  requestAnimationFrame(() => mountCharts(report, target));
  const stage = document.getElementById("stage");
  const active = stage.querySelector(".view.active");
  if (active) active.scrollTop = 0;
}

function wireNav(report) {
  document.body.addEventListener("click", (e) => {
    const btn = e.target.closest("[data-nav]");
    if (!btn) return;
    navigate(report, btn.dataset.nav);
  });
  window.addEventListener("popstate", () => {
    const id = (location.hash.replace(/^#\/?/, "") || "home").split("?")[0];
    navigate(report, id, { push: false });
  });
}

async function main() {
  configureChartDefaults();
  const stage = document.getElementById("stage");
  const nav = document.getElementById("side-nav");

  try {
    const res = await fetch(`./data/report.json?v=${ASSET_VERSION}`);
    if (!res.ok) throw new Error(`Could not load report.json (${res.status})`);
    const report = await res.json();

    document.getElementById("sidebar-meta").textContent = "";

    nav.innerHTML = SECTIONS.map(
      (s) => `<button class="nav-item" type="button" data-nav="${s.id}">
        <span class="nav-num">${s.num}</span>
        <span class="nav-copy"><span class="nav-title">${s.title}</span><span class="nav-sub">${s.sub}</span></span>
      </button>`,
    ).join("");

    stage.innerHTML = [
      buildHome(report),
      buildOverview(report),
      buildImpact(report),
      buildTiming(report),
      buildSla(report),
      buildTypes(report),
      buildHotspots(report),
      buildMonthly(report),
      buildWfi(report),
      buildPeople(report),
      buildReporters(report),
      buildPain(report),
      buildCases(report),
    ].join("");

    wireNav(report);
    wireCaseFilter(report);
    const initial = (location.hash.replace(/^#\/?/, "") || "home").split("?")[0];
    navigate(report, initial, { push: false });
  } catch (err) {
    stage.innerHTML = `<div class="loading-screen"><div class="boot-card"><p style="color:#fecaca">${String(
      err.message || err,
    )}</p></div></div>`;
  }
}

document.addEventListener("DOMContentLoaded", main);
