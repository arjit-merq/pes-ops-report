/* MerQube PE Support Ops Report — executive SPA */

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
  { id: "timing", num: "02", title: "Demand timing", sub: "IST windows & TTR" },
  { id: "sla", num: "03", title: "SLA performance", sub: "Response & resolution" },
  { id: "types", num: "04", title: "Case types", sub: "Volume & pain rank" },
  { id: "hotspots", num: "05", title: "Hotspots", sub: "Recurring systems" },
  { id: "monthly", num: "06", title: "Monthly trend", sub: "Trajectory" },
  { id: "people", num: "07", title: "Closers & credit", sub: "Ownership from changelog" },
  { id: "pain", num: "08", title: "Pain points", sub: "Themes from comments" },
  { id: "cases", num: "09", title: "Case dump", sub: "All PES tickets" },
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

function kpi(label, value, hint = "") {
  return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div>${
    hint ? `<div class="hint">${hint}</div>` : ""
  }</div>`;
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

function buildHome(report) {
  const ov = report.overview;
  const resp = report.sla_response.overall;
  const reso = report.sla_resolution.overall;
  return `
    <section class="view active" data-view="home">
      <div class="cover">
        <p class="cover-eyebrow">Platform Engineering · Support Operations</p>
        <h1>PES support case review</h1>
        <p class="cover-lead">
          Executive walkthrough of Platform Engineering Support cases for ${report.window}:
          volume, SLA, demand timing, case mix, hotspots, and ownership credit.
        </p>
        <div class="cover-actions">
          <button class="btn btn-primary" data-nav="overview">Start review</button>
        </div>
        <div class="cover-stats">
          <div class="stat-pill"><div class="label">PES cases</div><div class="value">${ov.n}</div></div>
          <div class="stat-pill"><div class="label">Closed</div><div class="value">${fmtPct(ov.closed_pct)}</div></div>
          <div class="stat-pill"><div class="label">Response SLA</div><div class="value">${fmtPct(resp.meet_pct)}</div></div>
          <div class="stat-pill"><div class="label">Resolution SLA</div><div class="value">${fmtPct(reso.meet_pct)}</div></div>
        </div>
        <div class="notice">
          Internal review · offline Jira export of PES cases only (${report.window}).
          Names, summaries, and ticket fields are shown as in Jira.
        </div>
        ${insights("What this review answers", [
          "Is support demand stable, and where does it spike by time of day?",
          "Are we meeting first-response and resolution SLAs by priority?",
          "Which case types and systems create the most operational pain?",
          "Is ownership credit aligned with who actually works the tickets?",
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
      ${pageHead(s, `PES tickets created ${report.window}. Closed-at uses first terminal status transition.`)}
      <div class="content">
        <div class="kpi-row">
          ${kpi("Opened", ov.n)}
          ${kpi("Closed now", ov.closed_now, `${ov.closed_pct}%`)}
          ${kpi("Still open", ov.open_now)}
          ${kpi("Response SLA", fmtPct(resp.meet_pct), `${resp.n_met}/${resp.n_applicable}`)}
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

function buildTiming(report) {
  const s = SECTIONS.find((x) => x.id === "timing");
  return `
    <section class="view" data-view="timing">
      ${pageHead(s, "Created timestamps converted to Asia/Kolkata and grouped into 3-hour windows.")}
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
      ${pageHead(s, "Mapped to On-call Guidelines response and resolution targets.")}
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
        ${pager("sla")}
      </div>
    </section>`;
}

function buildTypes(report) {
  const s = SECTIONS.find((x) => x.id === "types");
  return `
    <section class="view" data-view="types">
      ${pageHead(s, `Summary/description classifier. Low-confidence labels: ${report.case_types.low_confidence_count}.`)}
      <div class="content">
        <div class="grid-2">
          ${card("Volume by case type", `<div class="chart-box tall"><canvas id="c-types"></canvas></div>`)}
          ${card("Pain score rank", `<div class="chart-box tall"><canvas id="c-pain"></canvas></div>`)}
        </div>
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
      ${pageHead(s, "Recurring systems and alert patterns matched from ticket summaries.")}
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
      ${pageHead(s, "Created month in IST — volume and SLA trajectory over May–Jul.")}
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

function buildPeople(report) {
  const s = SECTIONS.find((x) => x.id === "people");
  const cw = report.closer_vs_worker;
  return `
    <section class="view" data-view="people">
      ${pageHead(
        s,
        `Closer = author of first changelog transition to a terminal status. Closer ≠ top-commenter on ${fmtPct(cw.mismatch_pct)} of closed tickets (${cw.n_mismatch}/${cw.n_closed_with_closer}).`,
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
        ${pager("people")}
      </div>
    </section>`;
}

function ticketRows(tickets) {
  return tickets.map((t) => [
    `<span class="mono">${escapeHtml(t.key)}</span>`,
    `<span class="wrap">${escapeHtml(t.summary)}</span>`,
    escapeHtml(t.creator || "—"),
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
    "Creator",
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
        `All ${tickets.length} PES tickets in the cohort. Closed-at is first terminal status transition (not Jira resolutiondate).`,
      )}
      <div class="content">
        <div class="toolbar">
          <input id="case-filter" type="search" placeholder="Filter by key, summary, creator, assignee, status…" />
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
          [t.key, t.summary, t.creator, t.assignee, t.status, t.priority]
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
      ${pageHead(s, `${report.pain_points.pr_mention_count} tickets mention a GitHub PR in comments.`)}
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
    const res = await fetch("./data/report.json");
    if (!res.ok) throw new Error(`Could not load report.json (${res.status})`);
    const report = await res.json();

    document.getElementById("sidebar-meta").textContent = `${report.window} · ${report.overview.n} PES cases`;

    nav.innerHTML = SECTIONS.map(
      (s) => `<button class="nav-item" type="button" data-nav="${s.id}">
        <span class="nav-num">${s.num}</span>
        <span class="nav-copy"><span class="nav-title">${s.title}</span><span class="nav-sub">${s.sub}</span></span>
      </button>`,
    ).join("");

    stage.innerHTML = [
      buildHome(report),
      buildOverview(report),
      buildTiming(report),
      buildSla(report),
      buildTypes(report),
      buildHotspots(report),
      buildMonthly(report),
      buildPeople(report),
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
