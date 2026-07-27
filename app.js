/* MerQube PE Support Ops Report — Chart.js renderer */

const COLORS = {
  teal: "#2dd4bf",
  sky: "#38bdf8",
  amber: "#fbbf24",
  rose: "#fb7185",
  emerald: "#34d399",
  indigo: "#818cf8",
  slate: "#94a3b8",
  white: "#f8fafc",
};

const chartDefaults = () => {
  Chart.defaults.color = "#94a3b8";
  Chart.defaults.borderColor = "rgba(148,163,184,0.18)";
  Chart.defaults.font.family = "'IBM Plex Sans', sans-serif";
};

function fmtHours(v) {
  if (v == null || Number.isNaN(Number(v))) return "—";
  const n = Number(v);
  if (n < 48) return `${n.toFixed(1)}h`;
  return `${n.toFixed(1)}h (${(n / 24).toFixed(1)}d)`;
}

function fmtPct(v) {
  return v == null ? "—" : `${v}%`;
}

function el(html) {
  const t = document.createElement("template");
  t.innerHTML = html.trim();
  return t.content.firstElementChild;
}

function kpi(label, value, hint = "") {
  return `<div class="kpi"><div class="label">${label}</div><div class="value">${value}</div>${
    hint ? `<div class="hint">${hint}</div>` : ""
  }</div>`;
}

function card(title, body) {
  return `<section class="card"><h3>${title}</h3>${body}</section>`;
}

function table(headers, rows) {
  const head = headers.map((h) => `<th>${h}</th>`).join("");
  const body = rows
    .map((r) => `<tr>${r.map((c) => `<td>${c ?? "—"}</td>`).join("")}</tr>`)
    .join("");
  return `<div class="table-scroll"><table><thead><tr>${head}</tr></thead><tbody>${body}</tbody></table></div>`;
}

function insights(title, items) {
  return `<aside class="insights"><h3>${title}</h3><ul>${items.map((i) => `<li>${i}</li>`).join("")}</ul></aside>`;
}

function makeChart(canvas, config) {
  return new Chart(canvas, config);
}

async function main() {
  const root = document.getElementById("app");
  try {
    const res = await fetch("./data/report.json");
    if (!res.ok) throw new Error(`Failed to load report.json (${res.status})`);
    const report = await res.json();
    chartDefaults();

    document.getElementById("hero-meta").innerHTML = `
      <span class="badge">${report.window || "May–Jul 2026"}</span>
      <span class="badge">Generated ${String(report.generated_at || "").slice(0, 10)}</span>
      <span class="badge">${report.overview?.n ?? "—"} deep-dive tickets</span>
    `;

    const q = report.quarterly_sample;
    root.className = "";
    root.innerHTML = "";

    // 01 Quarterly sample from PDF
    root.appendChild(
      el(`<section class="section" id="quarter">
        <h2>01 · Quarterly sample (Mar–Jun)</h2>
        <p class="lede">${q.title} · ${q.period}. Sourced from ${q.source} for branding/context — not the May–Jul deep dive below.</p>
        <div class="kpi-grid">
          ${kpi("Capacity", `${q.delivery.capacity_sp} SP`)}
          ${kpi("Committed", `${q.delivery.committed_sp} SP`, `${q.delivery.commitment_pct}% commitment`)}
          ${kpi("Delivered", `${q.delivery.delivered_sp} SP`, `${q.delivery.completion_pct}% completion`)}
          ${kpi("Utilization", `${q.delivery.utilization_pct}%`)}
        </div>
        <div class="grid-2" style="margin-top:14px">
          ${card(
            "Strategic allocation",
            `<div class="chart-wrap"><canvas id="allocChart"></canvas></div>
             <p style="color:var(--mq-muted);font-size:13px;margin:8px 0 0">
               Helix ${q.allocation.helix_pct}% · Support/BAU ${q.allocation.support_bau_pct}% · Legacy ${q.allocation.legacy_pct}%
             </p>`,
          )}
          ${card(
            "BAU support overview",
            `<div class="kpi-grid" style="grid-template-columns:repeat(2,minmax(0,1fr))">
              ${kpi("Total tickets", q.bau.total_tickets)}
              ${kpi("Avg weekly inflow", q.bau.avg_weekly_inflow)}
              ${kpi("Closed / resolved", `${q.bau.closed_resolved}`, `${q.bau.closed_pct}%`)}
              ${kpi("Peak week", q.bau.peak_week)}
            </div>
            <p style="margin-top:12px;color:var(--mq-muted);font-size:13px">
              Top category: <strong style="color:var(--mq-white)">${q.bau.top_category}</strong><br/>
              Top reporting team: <strong style="color:var(--mq-white)">${q.bau.top_reporting_team}</strong>
            </p>`,
          )}
        </div>
        <div style="margin-top:14px">${insights("Key insights", q.insights)}</div>
      </section>`),
    );

    makeChart(document.getElementById("allocChart"), {
      type: "doughnut",
      data: {
        labels: ["Helix", "Support / BAU", "Legacy Platform"],
        datasets: [
          {
            data: [q.allocation.helix_sp, q.allocation.support_bau_sp, q.allocation.legacy_sp],
            backgroundColor: [COLORS.sky, COLORS.teal, COLORS.indigo],
            borderWidth: 0,
          },
        ],
      },
      options: {
        plugins: { legend: { position: "bottom" } },
        cutout: "58%",
      },
    });

    // 02 Overview
    const ov = report.overview;
    const slaR = report.sla_response.overall;
    const slaZ = report.sla_resolution.overall;
    root.appendChild(
      el(`<section class="section" id="overview">
        <h2>02 · May–Jul deep dive overview</h2>
        <p class="lede">PES tickets created ${report.window}. Closed-at uses changelog terminal transition (not bulk resolutiondate).</p>
        <div class="kpi-grid">
          ${kpi("Opened", ov.n)}
          ${kpi("Closed now", ov.closed_now, `${ov.closed_pct}%`)}
          ${kpi("Still open", ov.open_now)}
          ${kpi("Response SLA", fmtPct(slaR.meet_pct), `${slaR.n_met}/${slaR.n_applicable}`)}
        </div>
        <div class="grid-2" style="margin-top:14px">
          ${card("Open vs closed", `<div class="chart-wrap"><canvas id="openClosedChart"></canvas></div>`)}
          ${card("Priority mix", `<div class="chart-wrap"><canvas id="priorityChart"></canvas></div>`)}
        </div>
        <div style="margin-top:14px">${card("Status breakdown", table(["Status", "Count"], ov.status_counts.map((s) => [s.status, s.n])))}</div>
        <div style="margin-top:14px">${insights("Resolution SLA", [
          `Meet rate ${fmtPct(slaZ.meet_pct)} (${slaZ.n_met}/${slaZ.n_applicable}).`,
          `Highest uses same IST business day OR ≤24h continuous-effort proxy.`,
          `Business days = IST Mon–Fri; company holidays not applied.`,
        ])}</div>
      </section>`),
    );

    makeChart(document.getElementById("openClosedChart"), {
      type: "doughnut",
      data: {
        labels: ["Closed", "Open"],
        datasets: [{ data: [ov.closed_now, ov.open_now], backgroundColor: [COLORS.emerald, COLORS.amber], borderWidth: 0 }],
      },
      options: { plugins: { legend: { position: "bottom" } }, cutout: "58%" },
    });
    makeChart(document.getElementById("priorityChart"), {
      type: "bar",
      data: {
        labels: ov.priority_counts.map((p) => p.priority),
        datasets: [{ data: ov.priority_counts.map((p) => p.n), backgroundColor: COLORS.indigo, borderRadius: 8 }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    // 03 Timing
    root.appendChild(
      el(`<section class="section" id="timing">
        <h2>03 · When tickets open (IST)</h2>
        <p class="lede">Created timestamps bucketed into 3-hour Asia/Kolkata windows.</p>
        <div class="grid-2">
          ${card("Opened by IST window", `<div class="chart-wrap"><canvas id="istChart"></canvas></div>`)}
          ${card("Time to close (p50 / p90 / p99)", `<div class="chart-wrap"><canvas id="ttrChart"></canvas></div>`)}
        </div>
        <div style="margin-top:14px">${card(
          "TTR table",
          table(
            ["Priority", "n", "Avg", "p50", "p90", "p99"],
            report.ttr_by_priority.map((r) => [r.priority, r.n, fmtHours(r.avg_h), fmtHours(r.p50_h), fmtHours(r.p90_h), fmtHours(r.p99_h)]),
          ),
        )}</div>
      </section>`),
    );
    makeChart(document.getElementById("istChart"), {
      type: "bar",
      data: {
        labels: report.ist_buckets.map((b) => b.bucket.replace(" IST", "")),
        datasets: [{ data: report.ist_buckets.map((b) => b.opened), backgroundColor: COLORS.sky, borderRadius: 8 }],
      },
      options: {
        plugins: { legend: { display: false } },
        scales: { x: { ticks: { maxRotation: 45, minRotation: 25, font: { size: 10 } } }, y: { beginAtZero: true, ticks: { precision: 0 } } },
      },
    });
    makeChart(document.getElementById("ttrChart"), {
      type: "bar",
      data: {
        labels: report.ttr_by_priority.map((r) => r.priority),
        datasets: [
          { label: "p50", data: report.ttr_by_priority.map((r) => r.p50_h ?? 0), backgroundColor: COLORS.emerald, borderRadius: 6 },
          { label: "p90", data: report.ttr_by_priority.map((r) => r.p90_h ?? 0), backgroundColor: COLORS.amber, borderRadius: 6 },
          { label: "p99", data: report.ttr_by_priority.map((r) => r.p99_h ?? 0), backgroundColor: COLORS.rose, borderRadius: 6 },
        ],
      },
      options: { scales: { y: { beginAtZero: true, title: { display: true, text: "Hours" } } } },
    });

    // 04 SLA
    root.appendChild(
      el(`<section class="section" id="sla">
        <h2>04 · SLA performance</h2>
        <p class="lede">On-call Guidelines response &amp; resolution targets.</p>
        <div class="kpi-grid">
          ${kpi("Response meet", fmtPct(slaR.meet_pct), `${report.sla_response.breach_count} breaches`)}
          ${kpi("Resolution meet", fmtPct(slaZ.meet_pct), `${report.sla_resolution.breach_count} breaches`)}
          ${kpi("WFI ever", report.wfi.n_ever_wfi)}
          ${kpi("WFI current", report.wfi.n_currently_wfi)}
        </div>
        <div style="margin-top:14px">${card("Meet % by priority", `<div class="chart-wrap"><canvas id="slaChart"></canvas></div>`)}</div>
        <div style="margin-top:14px">${card(
          "SLA detail",
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
        )}</div>
      </section>`),
    );
    makeChart(document.getElementById("slaChart"), {
      type: "bar",
      data: {
        labels: report.sla_response.by_priority.map((r) => r.priority),
        datasets: [
          { label: "Response meet %", data: report.sla_response.by_priority.map((r) => r.response_meet_pct ?? 0), backgroundColor: COLORS.sky, borderRadius: 6 },
          { label: "Resolution meet %", data: report.sla_response.by_priority.map((r) => r.resolution_meet_pct ?? 0), backgroundColor: COLORS.teal, borderRadius: 6 },
        ],
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } },
    });

    // 05 Types
    const types = report.case_types.bars.slice(0, 12);
    const pain = report.case_types.pain_ranked.slice(0, 10);
    root.appendChild(
      el(`<section class="section" id="types">
        <h2>05 · Case types</h2>
        <p class="lede">Classifier from summary/description. Low-confidence: ${report.case_types.low_confidence_count}.</p>
        <div class="grid-2">
          ${card("Volume by type", `<div class="chart-wrap tall"><canvas id="typeChart"></canvas></div>`)}
          ${card("Pain score rank", `<div class="chart-wrap tall"><canvas id="painChart"></canvas></div>`)}
        </div>
        <div style="margin-top:14px">${card(
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
        )}</div>
      </section>`),
    );
    makeChart(document.getElementById("typeChart"), {
      type: "bar",
      data: {
        labels: types.map((t) => t.type.replaceAll("_", " ")),
        datasets: [{ data: types.map((t) => t.n), backgroundColor: COLORS.indigo, borderRadius: 6 }],
      },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    makeChart(document.getElementById("painChart"), {
      type: "bar",
      data: {
        labels: pain.map((t) => t.case_type.replaceAll("_", " ")),
        datasets: [{ data: pain.map((t) => t.pain_score ?? 0), backgroundColor: COLORS.rose, borderRadius: 6 }],
      },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true } } },
    });

    // 06 Hotspots
    root.appendChild(
      el(`<section class="section" id="hotspots">
        <h2>06 · Recurring hotspots</h2>
        <p class="lede">Matched on ticket summaries (pipelines, vendors, alerts).</p>
        ${card("Top hotspots", `<div class="chart-wrap tall"><canvas id="hotChart"></canvas></div>`)}
        <div style="margin-top:14px">${card(
          "Hotspot detail",
          table(
            ["Hotspot", "n", "TTR p50", "Resp%", "Res%"],
            report.hotspots.map((h) => [h.hotspot, h.n, fmtHours(h.ttr_p50_h), fmtPct(h.response_meet_pct), fmtPct(h.resolution_meet_pct)]),
          ),
        )}</div>
      </section>`),
    );
    makeChart(document.getElementById("hotChart"), {
      type: "bar",
      data: {
        labels: report.hotspots.slice(0, 10).map((h) => (h.hotspot.length > 28 ? `${h.hotspot.slice(0, 26)}…` : h.hotspot)),
        datasets: [{ data: report.hotspots.slice(0, 10).map((h) => h.n), backgroundColor: COLORS.amber, borderRadius: 6 }],
      },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    // 07 Monthly
    root.appendChild(
      el(`<section class="section" id="monthly">
        <h2>07 · Monthly trends</h2>
        <p class="lede">Created month in IST — volume and SLA trajectory.</p>
        <div class="grid-2">
          ${card("Opened vs still open", `<div class="chart-wrap"><canvas id="monthVol"></canvas></div>`)}
          ${card("SLA meet %", `<div class="chart-wrap"><canvas id="monthSla"></canvas></div>`)}
        </div>
      </section>`),
    );
    makeChart(document.getElementById("monthVol"), {
      type: "bar",
      data: {
        labels: report.monthly.map((m) => m.month),
        datasets: [
          { label: "Opened", data: report.monthly.map((m) => m.opened), backgroundColor: COLORS.sky, borderRadius: 6 },
          { label: "Still open", data: report.monthly.map((m) => m.still_open), backgroundColor: COLORS.amber, borderRadius: 6 },
        ],
      },
      options: { scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
    makeChart(document.getElementById("monthSla"), {
      type: "line",
      data: {
        labels: report.monthly.map((m) => m.month),
        datasets: [
          { label: "Response meet %", data: report.monthly.map((m) => m.response_meet_pct ?? 0), borderColor: COLORS.sky, tension: 0.25 },
          { label: "Resolution meet %", data: report.monthly.map((m) => m.resolution_meet_pct ?? 0), borderColor: COLORS.teal, tension: 0.25 },
        ],
      },
      options: { scales: { y: { beginAtZero: true, max: 100 } } },
    });

    // 08 People
    const closers = report.closer_vs_worker.closers.slice(0, 12);
    root.appendChild(
      el(`<section class="section" id="people">
        <h2>08 · Closers &amp; credit</h2>
        <p class="lede">Anonymized engineers. Mismatch rate ${fmtPct(report.closer_vs_worker.mismatch_pct)}
          (${report.closer_vs_worker.n_mismatch}/${report.closer_vs_worker.n_closed_with_closer}).</p>
        ${card("Tickets closed (changelog closer)", `<div class="chart-wrap tall"><canvas id="closerChart"></canvas></div>`)}
        <div style="margin-top:14px">${card(
          "Credit delta (closer − top commenter)",
          table(
            ["Person", "Closed as closer", "Was top commenter", "Delta"],
            report.closer_vs_worker.credit_delta.slice(0, 15).map((r) => [
              r.person,
              r.closed_as_closer,
              r.was_top_commenter_on_closed,
              r.delta_closer_minus_top,
            ]),
          ),
        )}</div>
      </section>`),
    );
    makeChart(document.getElementById("closerChart"), {
      type: "bar",
      data: {
        labels: closers.map((c) => c.person),
        datasets: [{ data: closers.map((c) => c.closed), backgroundColor: COLORS.teal, borderRadius: 6 }],
      },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    // 09 Pain
    root.appendChild(
      el(`<section class="section" id="pain">
        <h2>09 · Pain points</h2>
        <p class="lede">${report.pain_points.pr_mention_count} tickets mention a GitHub PR in comments.</p>
        <div style="margin-bottom:14px">${insights("Narrative", report.pain_points.narrative_bullets)}</div>
        ${card("Theme frequency", `<div class="chart-wrap tall"><canvas id="themeChart"></canvas></div>`)}
      </section>`),
    );
    makeChart(document.getElementById("themeChart"), {
      type: "bar",
      data: {
        labels: report.pain_points.themes.slice(0, 10).map((t) => (t.theme.length > 30 ? `${t.theme.slice(0, 28)}…` : t.theme)),
        datasets: [{ data: report.pain_points.themes.slice(0, 10).map((t) => t.n), backgroundColor: COLORS.rose, borderRadius: 6 }],
      },
      options: { indexAxis: "y", plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, ticks: { precision: 0 } } } },
    });
  } catch (err) {
    root.className = "error";
    root.textContent = String(err.message || err);
  }
}

document.addEventListener("DOMContentLoaded", main);
