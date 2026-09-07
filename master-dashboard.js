// ---------------------------------------------------------
// Shimmer loaders
// Swaps the spinner Webflow puts inside every .loader / #loader for a
// content-shaped skeleton with a soft gloss sweeping across it. The
// shape comes from data-shimmer when the Webflow element sets one,
// otherwise it is inferred from the host container (table / chart /
// donut / stat / cards) and finally from the host's box. hide() and
// remove() fade the skeleton out first so content never pops.
// ---------------------------------------------------------
window.ssShimmer = window.ssShimmer || (() => {
  const STYLE_ID = 'ss-shimmer-style';
  const LOADERS = '.loader, #loader';
  const FADE_MS = 380;

  const CSS = `
    .loader[data-ss-shim],#loader[data-ss-shim]{--ss-base:#e9f1f1;--ss-base-2:#e1ecec;--ss-gloss:rgba(255,255,255,.95);--ss-dur:1.5s;display:block!important;width:100%!important;height:auto!important;min-height:0!important;border:0!important;background:none!important;box-shadow:none!important;animation:none!important;}
    .loader.hide[data-ss-shim],#loader.hide[data-ss-shim]{display:none!important;}
    .loader[data-ss-shim]::before,.loader[data-ss-shim]::after,#loader[data-ss-shim]::before,#loader[data-ss-shim]::after{content:none!important;display:none!important;}
    .ss-shim-out{opacity:0!important;transform:translateY(-4px)!important;transition:opacity .38s cubic-bezier(.4,0,.2,1),transform .38s cubic-bezier(.4,0,.2,1)!important;pointer-events:none!important;}
    .ss-shim-stack{display:flex;flex-direction:column;gap:14px;width:100%;}
    .ss-shim-row{display:grid;gap:16px;align-items:center;width:100%;}
    .ss-shim-rule{width:100%;height:1px;background:#e4efef;border-radius:1px;}
    .ss-shim-b{position:relative;overflow:hidden;flex:none;border-radius:8px;background:linear-gradient(180deg,var(--ss-base) 0%,var(--ss-base-2) 100%);}
    .ss-shim-b::after{content:"";position:absolute;top:0;bottom:0;left:0;width:100%;min-width:280px;transform:translate3d(-100%,0,0);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.28) 32%,var(--ss-gloss) 50%,rgba(255,255,255,.28) 68%,rgba(255,255,255,0) 100%);animation-name:ss-shim-sweep;animation-duration:var(--ss-dur);animation-timing-function:cubic-bezier(.45,.05,.3,1);animation-iteration-count:infinite;animation-delay:var(--ss-d,0s);}
    @keyframes ss-shim-sweep{0%{transform:translate3d(-100%,0,0)}100%{transform:translate3d(100%,0,0)}}
    .ss-shim-circle{border-radius:50%;}
    .ss-shim-cols{display:flex;align-items:flex-end;gap:6px;width:100%;height:158px;}
    .ss-shim-cols .ss-shim-b{flex:1 1 0;min-width:0;border-radius:7px 7px 3px 3px;}
    .ss-shim-donut{display:flex;align-items:center;gap:30px;width:100%;flex-wrap:wrap;}
    .ss-shim-legend{display:flex;flex-direction:column;gap:13px;flex:1 1 170px;min-width:150px;}
    .ss-shim-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;}
    .ss-shim-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;width:100%;}
    .ss-shim-card{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 16px;border:1px solid #edf4f4;border-radius:12px;background:#fbfdfd;}
    @media(max-width:767px){.ss-shim-cols{height:120px;gap:4px;}.ss-shim-cards{grid-template-columns:1fr;}.ss-shim-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}.ss-shim-row{gap:10px;}}
    @media(prefers-reduced-motion:reduce){.ss-shim-b::after{min-width:0;transform:none;background:rgba(255,255,255,.6);animation-name:ss-shim-breathe;animation-duration:2.4s;animation-timing-function:ease-in-out;}}
    @keyframes ss-shim-breathe{0%,100%{opacity:.2}50%{opacity:.85}}
  `;

  const ensureStyles = () => {
    if (document.getElementById(STYLE_ID)) return;
    const style = document.createElement('style');
    style.id = STYLE_ID;
    style.textContent = CSS;
    document.head.appendChild(style);
  };

  // One skeleton bar. `delay` phases the gloss so a stack of bars
  // reads as a single light travelling across the whole block.
  const bar = (width, height, extra, delay) =>
    `<div class="ss-shim-b${extra ? ` ${extra}` : ''}" style="width:${width};height:${height};--ss-d:-${(delay || 0).toFixed(2)}s"></div>`;

  const TEXT_WIDTHS = ['100%', '92%', '68%', '84%', '74%'];
  const ROW_WIDTHS = [
    ['46%', '88%', '72%', '56%'],
    ['54%', '72%', '62%', '68%'],
    ['42%', '94%', '58%', '48%'],
    ['58%', '68%', '80%', '62%'],
    ['48%', '82%', '66%', '52%']
  ];
  const COLUMN_HEIGHTS = [44, 66, 52, 78, 58, 90, 68, 96, 60, 84, 54, 74, 46, 70];
  const LEGEND_WIDTHS = ['82%', '64%', '74%', '56%', '68%'];

  const SHAPES = {
    text: ({ rows }) => `<div class="ss-shim-stack">${
      Array.from({ length: rows || 3 }, (unused, i) =>
        bar(TEXT_WIDTHS[i % TEXT_WIDTHS.length], '13px', '', i * 0.08)).join('')
    }</div>`,

    table: ({ rows }) => {
      const columns = '1.5fr 2.6fr 2fr 1.4fr';
      const line = (widths, height, delay) =>
        `<div class="ss-shim-row" style="grid-template-columns:${columns}">${
          widths.map(width => bar(width, height, '', delay)).join('')}</div>`;
      return `<div class="ss-shim-stack">${
        line(['62%', '48%', '54%', '44%'], '11px', 0)
      }<div class="ss-shim-rule"></div>${
        Array.from({ length: rows || 5 }, (unused, i) =>
          line(ROW_WIDTHS[i % ROW_WIDTHS.length], '14px', (i + 1) * 0.08)).join('')
      }</div>`;
    },

    chart: () => `<div class="ss-shim-stack" style="gap:20px">
      <div class="ss-shim-stack" style="gap:10px">${bar('38%', '16px', '', 0)}${bar('24%', '10px', '', 0.08)}</div>
      <div class="ss-shim-cols">${
        COLUMN_HEIGHTS.map((height, i) => bar('auto', `${height}%`, '', i * 0.05)).join('')}</div>
      <div class="ss-shim-rule"></div>
      <div class="ss-shim-row" style="grid-template-columns:repeat(4,minmax(0,1fr))">${
        ['70%', '58%', '64%', '52%'].map((width, i) => bar(width, '10px', '', 0.4 + i * 0.06)).join('')}</div>
    </div>`,

    donut: () => `<div class="ss-shim-donut">${bar('156px', '156px', 'ss-shim-circle', 0)}
      <div class="ss-shim-legend">${
        LEGEND_WIDTHS.map((width, i) => bar(width, '12px', '', 0.1 + i * 0.08)).join('')}</div>
    </div>`,

    stat: () => `<div class="ss-shim-stack" style="gap:9px">${bar('64px', '9px', '', 0)}${bar('112px', '28px', '', 0.09)}</div>`,

    stats: () => `<div class="ss-shim-stats">${[0, 1, 2, 3, 4].map(i =>
      `<div class="ss-shim-stack" style="gap:9px">${bar('62%', '9px', '', i * 0.09)}${bar('84%', '26px', '', i * 0.09 + 0.05)}</div>`
    ).join('')}</div>`,

    cards: () => `<div class="ss-shim-cards">${[0, 1, 2].map(i =>
      `<div class="ss-shim-card">${bar('76px', '76px', 'ss-shim-circle', i * 0.1)}${bar('74%', '12px', '', i * 0.1 + 0.06)}${bar('50%', '10px', '', i * 0.1 + 0.12)}</div>`
    ).join('')}</div>`,

    block: ({ height }) => bar('100%', `${Math.max(160, height || 0)}px`, '', 0)
  };

  // Hosts this dashboard family fills, matched by id first and then by
  // any id/class in the loader's ancestor chain.
  const ID_SHAPES = {
    active: 'table', inactive: 'table', latest_users: 'table',
    student_pin_list: 'table', org_feedbacks_list: 'table',
    other_feedbacks_list: 'table', topSchoolBuildings: 'table',
    overview: 'stats', parent_impact: 'cards', trends_chart: 'chart'
  };

  const SIGNATURE_SHAPES = [
    [/donut|pie|ring/, 'donut'],
    [/chart|graph|trend|apex/, 'chart'],
    [/leader_board|webinars_log|pin_list|feedbacks_list|latest_users|table|_list/, 'table'],
    [/overview|kpi|metric|counter|percentage|goal|stat|number|score/, 'stat'],
    [/impact|card/, 'cards']
  ];

  const shapeFor = element => {
    const requested = (element.getAttribute('data-shimmer') || '').trim().toLowerCase();
    if (SHAPES[requested]) return requested;

    let node = element;
    for (let depth = 0; node && node !== document.body && depth < 8; depth++) {
      if (ID_SHAPES[node.id]) return ID_SHAPES[node.id];
      const signature = `${node.id} ${[...node.classList].join(' ')}`.toLowerCase();
      const matched = SIGNATURE_SHAPES.find(([pattern]) => pattern.test(signature));
      if (matched) return matched[1];
      node = node.parentElement;
    }
    return null;
  };

  const mount = root => {
    ensureStyles();
    (root || document).querySelectorAll(LOADERS).forEach(element => {
      try {
        if (element.hasAttribute('data-ss-shim') || element.classList.contains('failed_loader')) return;

        // Measure the host before the reset styles below change the box.
        const height = Math.round((element.parentElement || element).getBoundingClientRect().height);
        const shape = shapeFor(element)
          || (height >= 220 ? 'chart' : height > 0 && height <= 96 ? 'stat' : 'text');

        element.setAttribute('data-ss-shim', shape);
        element.setAttribute('role', 'status');
        element.setAttribute('aria-label', 'Loading');
        element.innerHTML = SHAPES[shape]({ rows: Number(element.getAttribute('data-shimmer-rows')) || 0, height });
      } catch (error) {
        console.warn('Shimmer loader skipped:', error);
      }
    });
  };

  // Fade first, then let the caller retire the node — the class changes
  // land in one task so the skeleton never flashes back.
  const fade = (elements, retire) => {
    const nodes = elements.filter(Boolean);
    if (!nodes.length) return;
    nodes.forEach(node => node.classList.add('ss-shim-out'));
    setTimeout(() => nodes.forEach(node => {
      node.classList.remove('ss-shim-out');
      node.removeAttribute('role');
      node.removeAttribute('aria-label');
      retire(node);
    }), FADE_MS);
  };

  return {
    mount,
    hide: root => fade([...(root || document).querySelectorAll(LOADERS)], node => node.classList.add('hide')),
    remove: target => fade([typeof target === 'string' ? document.querySelector(target) : target], node => node.remove())
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  window.ssShimmer.mount();

  // ---------------------------------------------------------
  // Global Variables for "Active/Inactive" Tables
  // ---------------------------------------------------------
  let organizations = [];
  let currentSortColumn = null;
  let sortAscending = true;

  // ---------------------------------------------------------
  // Global Variables for "Registration Summary" Table
  // ---------------------------------------------------------
  let latestUsersData = [];
  let sevenDayStreamyardRecordsByOrg = {};
  let totalStreamyardRecordsByOrg = {};

  // FIX: Set this to null. 
  // If you set it to 'sevenDayCount' here, the function below will flip it to Ascending (Low -> High).
  // By setting it to null, the function defaults to Descending (High -> Low).
  let currentSortSummaryColumn = null;
  let sortAscendingSummary = false;

  // ---------------------------------------------------------
  // State for the "New Activity — Last 30 Days" trend chart
  // Each holds an array of epoch-ms timestamps once its source
  // endpoint has resolved (null = still loading, [] = none).
  // ---------------------------------------------------------
  let trendRegistrationTs = null;
  let trendFeedbackTs = null;
  let trendStreamyardTs = null;
  let trendBootcampTs = null;
  let trendChartRendered = false;
  const TREND_DAYS = 90;

  function normalizeOrgKey(value) {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value === 'object') {
      if (value.id !== undefined && value.id !== null && value.id !== '') {
        return String(value.id);
      }
      return null;
    }
    return String(value);
  }

  function extractOrgKeyFromLog(log) {
    return (
      normalizeOrgKey(log.organization) ||
      normalizeOrgKey(log.organizations_id) ||
      normalizeOrgKey(log.organization_id)
    );
  }

  function toTimestamp(value) {
    if (typeof value === 'number' && Number.isFinite(value)) {
      return value > 1e12 ? value : value * 1000;
    }
    if (typeof value === 'string') {
      const parsed = Date.parse(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return null;
  }

  function applySevenDayStreamyardToLatestUsers() {
    latestUsersData = latestUsersData.map(item => {
      const orgKey = normalizeOrgKey(item.orgId);
      return {
        ...item,
        sevenDayStreamyardCount: orgKey ? (sevenDayStreamyardRecordsByOrg[orgKey] || 0) : 0
      };
    });
  }

  const TREND_METRICS = [
    {
      key: 'registrations', name: '90 Day VIP Registrations', unit: 'registrations',
      color: '#449997', getTs: () => trendRegistrationTs,
      note: () => null
    },
    {
      key: 'bootcamp', name: '90 Day Bootcamp Registrations', unit: 'registrations',
      color: '#8E7CB8', getTs: () => trendBootcampTs, note: () => null
    },
    {
      key: 'feedbacks', name: '90 Day Feedbacks', unit: 'feedbacks',
      color: '#E8907C', getTs: () => trendFeedbackTs,
      note: (windowTotal, allTime) => allTime === 0 ? 'Add created_at to feedbacks to plot' : null
    },
    {
      key: 'streamyard', name: '90 Day Streamyards', unit: 'signups',
      color: '#E0A93B', getTs: () => trendStreamyardTs,
      note: (windowTotal, allTime) =>
        (windowTotal <= 3 && allTime > 50)
          ? 'Recent feed sparse · ' + allTime.toLocaleString() + ' logged all-time'
          : null
    }
  ];

  // Load ApexCharts on demand so the master-admin page doesn't
  // need its own script embed. Resolves once window.ApexCharts exists.
  function ensureApexCharts() {
    return new Promise((resolve, reject) => {
      if (window.ApexCharts) return resolve(window.ApexCharts);
      let script = document.querySelector('script[data-apexcharts-loader]');
      if (!script) {
        script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/apexcharts';
        script.async = true;
        script.setAttribute('data-apexcharts-loader', '');
        document.head.appendChild(script);
      }
      script.addEventListener('load', () => resolve(window.ApexCharts));
      script.addEventListener('error', () => reject(new Error('Failed to load ApexCharts')));
    });
  }

  // Build (once) the card + responsive grid and return the grid element.
  // Prefer a #trends_chart element the admin placed in Webflow as the host;
  // otherwise inject a card above the Registration Summary table.
  function ensureTrendGrid() {
    if (!document.getElementById('trends_chart_style')) {
      const style = document.createElement('style');
      style.id = 'trends_chart_style';
      style.textContent =
        '#trends_chart_card{background:#fff;border:1px solid #e3ecec;border-radius:14px;' +
        'padding:20px 22px 16px;margin:0 0 24px;box-shadow:0 1px 3px rgba(45,90,90,.06);}' +
        '#trends_chart_card h3{font-size:18px;color:#2D5A5A;font-weight:700;margin:0 0 2px;}' +
        '#trends_chart_note{margin:0 0 16px;font-size:12px;color:#5A7A7A;}' +
        '.trends-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}' +
        '@media(max-width:560px){.trends-grid{grid-template-columns:1fr;}}' +
        '.trend-panel{position:relative;border:1px solid #edf1f1;border-radius:12px;' +
        'padding:14px 16px 8px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(45,90,90,.04);' +
        'transition:box-shadow .15s ease,transform .15s ease;}' +
        '.trend-panel:hover{box-shadow:0 6px 18px rgba(45,90,90,.11);transform:translateY(-2px);}' +
        '.trend-panel-total{font-size:30px;font-weight:800;line-height:1.05;margin:3px 0 0;}' +
        '.trend-panel-sub{font-size:11.5px;color:#8AA4A4;margin:2px 0 10px;}' +
        '.trend-panel-note{font-size:10.5px;color:#b0870f;margin:-6px 0 10px;}' +
        '.trend-panel-chart{margin:0 -6px;}' +
        '.trend-panel-chart .apexcharts-tooltip{display:none !important;}' +
        '.trend-panel-tip{min-height:16px;margin:0 0 4px;font-size:12px;font-weight:600;color:#2D5A5A;}';
      document.head.appendChild(style);
    }

    let host = document.getElementById('trends_chart');
    if (!host) {
      const card = document.createElement('div');
      card.id = 'trends_chart_card';
      card.innerHTML =
        '<h3>New Activity — Last 30 Days</h3>' +
        '<p id="trends_chart_note">Each panel has its own scale — daily counts over the last 30 days.</p>';
      const grid = document.createElement('div');
      grid.className = 'trends-grid';
      card.appendChild(grid);

      const anchor = document.getElementById('latest_users') || document.getElementById('active');
      if (anchor && anchor.parentNode) {
        anchor.parentNode.insertBefore(card, anchor);
      } else {
        document.body.insertBefore(card, document.body.firstChild);
      }
      return grid;
    }

    // Admin-provided host: render the grid inside it.
    host.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'trends-grid';
    host.appendChild(grid);
    return grid;
  }

  // Bucket an array of epoch-ms timestamps into `days` daily points
  // ending today. Each point is { x: localMidnightMs, y: count } so it
  // maps cleanly onto an ApexCharts datetime x-axis.
  function bucketDailySeries(timestamps, days) {
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const startMs = todayStart.getTime() - (days - 1) * dayMs;
    const endMs = startMs + days * dayMs;

    const points = [];
    for (let i = 0; i < days; i++) {
      points.push({ x: startMs + i * dayMs, y: 0 });
    }
    (timestamps || []).forEach(ts => {
      if (ts === null || ts < startMs || ts >= endMs) return;
      const idx = Math.floor((ts - startMs) / dayMs);
      if (idx >= 0 && idx < days) points[idx].y++;
    });
    return points;
  }

  // Render once all four source arrays have populated their timestamps.
  function maybeRenderTrendChart() {
    const ready = [trendRegistrationTs, trendFeedbackTs, trendStreamyardTs, trendBootcampTs]
      .every(v => v !== null);
    if (!ready || trendChartRendered) return;
    ensureApexCharts()
      .then(renderTrendChart)
      .catch(err => console.error('Trend chart:', err));
  }

  function renderTrendChart() {
    if (trendChartRendered) return;
    const grid = ensureTrendGrid();
    if (!grid) return;
    trendChartRendered = true;

    const fmtDay = ms => new Date(ms).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });

    // State the shared window once in the header; each curve is a running
    // total scaled to its own metric (x-axis is hidden on the sparklines).
    const dayMs = 24 * 60 * 60 * 1000;
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const windowStartMs = todayStart.getTime() - (TREND_DAYS - 1) * dayMs;
    const noteEl = document.getElementById('trends_chart_note');
    if (noteEl) {
      noteEl.textContent = 'Running total · ' + fmtDay(windowStartMs) + ' – ' + fmtDay(todayStart.getTime()) +
        ' · each panel scaled to itself.';
    }

    TREND_METRICS.forEach(metric => {
      const allTs = metric.getTs() || [];
      const points = bucketDailySeries(allTs, TREND_DAYS);
      const total = points.reduce((sum, p) => sum + p.y, 0);
      const peak = points.reduce((m, p) => (p.y > m.y ? p : m), { x: null, y: 0 });
      const note = metric.note ? metric.note(total, allTs.length) : null;

      // Cumulative running total — turns sporadic, mostly-zero daily counts
      // into a curve that rises across the window and fills the panel, while
      // staying exact (each point is the true total through that day).
      let running = 0;
      const cumulative = points.map(p => { running += p.y; return { x: p.x, y: running }; });

      const panel = document.createElement('div');
      panel.className = 'trend-panel';
      panel.innerHTML =
        '<h3>' + metric.name + '</h3>' +
        '<div class="trend-panel-total" style="color:' + metric.color + '">' + total.toLocaleString() + '</div>' +
        '<div class="trend-panel-sub">' +
        (total > 0 ? 'Busiest day ' + fmtDay(peak.x) : 'No activity in this window') +
        '</div>' +
        (note ? '<div class="trend-panel-note">' + note + '</div>' : '') +
        '<div class="trend-panel-tip"></div>' +
        '<div class="trend-panel-chart" id="trends_chart_' + metric.key + '"></div>';
      grid.appendChild(panel);

      // Tooltip renders into the reserved band above the chart, not over the curve.
      const tipEl = panel.querySelector('.trend-panel-tip');

      new ApexCharts(panel.querySelector('.trend-panel-chart'), {
        chart: {
          type: 'area',
          height: 122,
          toolbar: { show: false },
          zoom: { enabled: false },
          parentHeightOffset: 0,
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
          animations: { enabled: true, speed: 650 },
          events: { mouseLeave: () => { if (tipEl) tipEl.textContent = ''; } }
        },
        series: [{ name: metric.name, data: cumulative }],
        colors: [metric.color],
        stroke: { curve: 'smooth', width: 3, lineCap: 'round' },
        fill: {
          type: 'gradient',
          gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.04, stops: [0, 100] }
        },
        dataLabels: { enabled: false },
        markers: { size: 0, hover: { size: 5, strokeColors: '#fff', strokeWidth: 2 } },
        grid: { show: false, padding: { left: 10, right: 10, top: 0, bottom: -6 } },
        xaxis: {
          type: 'datetime',
          // Fixed to the shared window so all four panels' date ticks align.
          min: windowStartMs,
          max: todayStart.getTime(),
          tickAmount: 5,
          labels: {
            datetimeUTC: false,
            format: 'MMM d',
            style: { colors: '#5A7A7A', fontSize: '12px' },
            hideOverlappingLabels: true,
            rotate: 0
          },
          axisBorder: { show: false },
          axisTicks: { show: false },
          tooltip: { enabled: false }
        },
        yaxis: { show: false },
        tooltip: {
          enabled: true,
          // Drive the readout in the reserved band above the chart; the native
          // box is CSS-hidden so nothing floats over the curve.
          custom: ({ dataPointIndex }) => {
            const pt = cumulative[dataPointIndex];
            if (tipEl && pt) tipEl.textContent = fmtDay(pt.x) + ' · ' + pt.y.toLocaleString() + ' ' + metric.unit;
            return ' ';
          }
        }
      }).render();
    });
  }

  // ---------------------------------------------------------
  // 1. Latest Users + Feedbacks — full logs; windows derived client-side
  // ---------------------------------------------------------
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users')
    .then(response => {
      // The endpoint now ships two FULL logs (`users`, `organization_feedbacks`).
      // Every 1d / 7d count is derived here by filtering on created_at, so a
      // short backend window can never starve the chart or tiles again.
      const users = response.data.users || [];
      const feedbacks = response.data.organization_feedbacks || [];

      const now = Date.now();
      const dayMs = 24 * 60 * 60 * 1000;
      const oneDayAgo = now - dayMs;
      const sevenDaysAgo = now - 7 * dayMs;

      // All-time feedback count per org (full log).
      const feedbackCounts = {};
      feedbacks.forEach(item => {
        const orgId = item.organization;
        if (orgId) feedbackCounts[orgId] = (feedbackCounts[orgId] || 0) + 1;
      });

      // One summary row per org seen in either log.
      const summary = {};
      const initDistrict = (distName, parents, orgId, shortCode) => {
        const orgKey = normalizeOrgKey(orgId);
        const summaryKey = orgKey ? `org:${orgKey}` : `name:${distName}`;
        const numericParents = Number(parents);
        const hasParentTotal = parents !== undefined
          && parents !== null
          && Number.isFinite(numericParents);

        if (!summary[summaryKey]) {
          summary[summaryKey] = {
            name: distName,
            orgId: orgId || 0,
            shortCode: shortCode || '',
            parents: hasParentTotal ? numericParents : 0,
            oneDayCount: 0,
            sevenDayCount: 0,
            sevenDayStreamyardCount: 0,
            feedbackTotal: feedbackCounts[orgId] || 0
          };
        } else {
          const district = summary[summaryKey];
          if (hasParentTotal) district.parents = numericParents;
          if (distName && distName !== 'Unknown District') district.name = distName;
          if (orgId) district.orgId = orgId;
          if (shortCode) district.shortCode = shortCode;
        }

        return summary[summaryKey];
      };

      // Seed orgs that have feedbacks but no registrations yet.
      feedbacks.forEach(item => {
        const det = item.organization_details || {};
        initDistrict(det.district_name || 'Unknown District', 0, item.organization, det.short_code || '');
      });

      // Walk the full user log once: register every org, tally 24h/7d counts.
      let oneDayCount = 0, sevenDayCount = 0;
      users.forEach(user => {
        const distName = user.organization ? user.organization.district_name : 'Unknown District';
        const orgId = user.organizations_id;
        const shortCode = user.organization ? user.organization.short_code : '';
        const district = initDistrict(distName, user.parents, orgId, shortCode);
        const created = toTimestamp(user.created_at);
        if (created !== null) {
          if (created >= sevenDaysAgo) { district.sevenDayCount++; sevenDayCount++; }
          if (created >= oneDayAgo) { district.oneDayCount++; oneDayCount++; }
        }
      });

      // 7-day feedback total for the stat tile.
      let sevenDayFeedbackCount = 0;
      feedbacks.forEach(item => {
        const created = toTimestamp(item.created_at);
        if (created !== null && created >= sevenDaysAgo) sevenDayFeedbackCount++;
      });

      latestUsersData = Object.values(summary);
      applySevenDayStreamyardToLatestUsers();

      // Stat tiles: 24h / 7d VIPs + 7-day feedbacks, all derived from the full logs.
      const el24hVipRegs = document.getElementById('24h_vip_registrations');
      const el7dVipRegs = document.getElementById('7d_vip_registrations');
      const el7dayFeedbacks = document.getElementById('7day_feedbacks');
      if (el24hVipRegs) el24hVipRegs.textContent = oneDayCount;
      if (el7dVipRegs) el7dVipRegs.textContent = sevenDayCount;
      if (el7dayFeedbacks) el7dayFeedbacks.textContent = sevenDayFeedbackCount;

      // Trend series: full timestamp arrays; bucketDailySeries keeps the 90-day window.
      trendRegistrationTs = users.map(u => toTimestamp(u.created_at)).filter(v => v !== null);
      trendFeedbackTs = feedbacks.map(f => toTimestamp(f.created_at)).filter(v => v !== null);
      maybeRenderTrendChart();

      // Initial Sort (Descending for numbers)
      sortLatestUsers('sevenDayCount');
    })
    .catch(error => {
      console.error("Error fetching latest users:", error);
      // Let the chart still render from the other endpoint's data.
      if (trendRegistrationTs === null) trendRegistrationTs = [];
      if (trendFeedbackTs === null) trendFeedbackTs = [];
      maybeRenderTrendChart();
    });

  // Function to Sort the Summary Table
  function sortLatestUsers(key) {
    // If clicking the SAME column, toggle the order
    if (currentSortSummaryColumn === key) {
      sortAscendingSummary = !sortAscendingSummary;
    } else {
      // If clicking a NEW column (or first load), set defaults
      currentSortSummaryColumn = key;
      sortAscendingSummary = true; // Default to A-Z for strings

      // FIX: Ensure numbers start as Descending (High -> Low)
      if (['oneDayCount', 'sevenDayCount', 'sevenDayStreamyardCount', 'feedbackTotal', 'parents'].includes(key)) {
        sortAscendingSummary = false;
      }
    }

    latestUsersData.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];

      if (typeof valA === 'string') {
        valA = valA.toLowerCase();
        valB = valB.toLowerCase();
      }

      if (valA < valB) return sortAscendingSummary ? -1 : 1;
      if (valA > valB) return sortAscendingSummary ? 1 : -1;
      return 0;
    });

    renderLatestUsersTable();
  }

  // Function to Render the Summary Table
  function renderLatestUsersTable() {
    const latestContainer = document.getElementById('latest_users');
    if (!latestContainer) return;

    const headers = [
      { name: 'District Name', key: 'name' },
      { name: '24h VIPs', key: 'oneDayCount' },
      { name: '7 Day VIPs', key: 'sevenDayCount' },
      { name: '7 Day Streamyard', key: 'sevenDayStreamyardCount' },
      { name: 'Total Feedbacks', key: 'feedbackTotal' },
      { name: 'Total VIPs', key: 'parents' }
    ];

    let html = `<h3>Registration Summary</h3><table border="1"><thead><tr>`;

    headers.forEach(header => {
      let label = header.name;
      // Add arrow indicators
      if (currentSortSummaryColumn === header.key) {
        label += sortAscendingSummary ? ' ▲' : ' ▼';
      } else {
        label += ' ▲▼';
      }
      html += `<th data-key="${header.key}" style="cursor:pointer;">${label}</th>`;
    });

    html += `</tr></thead><tbody>`;

    const sevenDayRows = latestUsersData.filter(item => item.sevenDayCount > 0);
    sevenDayRows.forEach(item => {
      const oneDayStyle = item.oneDayCount > 0 ? 'font-weight:bold; color:green;' : '';

      const parentLink = item.shortCode
        ? `https://smartsocial.com/dashboard/parents?as_org=${item.shortCode}`
        : '#';

      const studentLink = item.shortCode
        ? `https://smartsocial.com/dashboard/student?as_org=${item.shortCode}`
        : '#';

      html += `
        <tr>
          <td>
            <a href="${parentLink}" target="_blank">${item.name}</a>
            (<a href="${studentLink}" target="_blank">📚</a>)
          </td>
          <td style="${oneDayStyle}">${item.oneDayCount}</td> 
          <td>${item.sevenDayCount}</td>
          <td>${item.sevenDayStreamyardCount}</td>
          <td>${item.feedbackTotal}</td>
          <td>${item.parents.toLocaleString()}</td>
        </tr>`;
    });
    html += `</tbody></table>`;

    latestContainer.innerHTML = html;

    latestContainer.querySelectorAll('th[data-key]').forEach(th => {
      th.addEventListener('click', () => {
        sortLatestUsers(th.getAttribute('data-key'));
      });
    });
  }

  // ---------------------------------------------------------
  // 2. EXISTING CODE: Active / Inactive Organizations
  // ---------------------------------------------------------
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations')
    .then(response => {
      organizations = response.data.organizations || [];

      // Process webinars_log for statistics
      const webinarsLog = response.data.webinars_log || [];

      const now = Date.now();
      const oneDayAgo = now - (24 * 60 * 60 * 1000);
      const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);
      const thirtyDaysAgo = now - (30 * 24 * 60 * 60 * 1000);

      let sevenDayAttendees = 0;
      let sevenDayRegistrations = 0;
      let twentyFourHourRegistrations = 0;

      totalStreamyardRecordsByOrg = {};
      sevenDayStreamyardRecordsByOrg = {};
      webinarsLog.forEach(log => {
        const orgKey = extractOrgKeyFromLog(log);
        const createdAt = toTimestamp(log.created_at);

        if (orgKey && log.action === 'registration') {
          totalStreamyardRecordsByOrg[orgKey] = (totalStreamyardRecordsByOrg[orgKey] || 0) + 1;
          if (createdAt !== null && createdAt >= sevenDaysAgo) {
            sevenDayStreamyardRecordsByOrg[orgKey] = (sevenDayStreamyardRecordsByOrg[orgKey] || 0) + 1;
          }
        }

        if (createdAt !== null && createdAt >= sevenDaysAgo && log.action === 'live') {
          sevenDayAttendees++;
        }
        if (createdAt !== null && createdAt >= sevenDaysAgo && log.action === 'registration') {
          sevenDayRegistrations++;
        }
        if (createdAt !== null && createdAt >= oneDayAgo && log.action === 'registration') {
          twentyFourHourRegistrations++;
        }
      });

      // Process courses_log for bootcamp statistics
      const coursesLog = response.data.courses_log || [];
      // Only count registration and course-start actions (case-insensitive).
      const BOOTCAMP_ACTIONS = new Set(['register', 'registration', 'start', 'starts']);
      let sevenDayBootcamp = 0;
      let thirtyDayBootcamp = 0;
      let allBootcamp = 0;
      coursesLog.forEach(log => {
        const action = (log.action || '').toString().trim().toLowerCase();
        if (!BOOTCAMP_ACTIONS.has(action)) return;
        allBootcamp++;
        const createdAt = toTimestamp(log.created_at);
        if (createdAt !== null && createdAt >= sevenDaysAgo) {
          sevenDayBootcamp++;
        }
        if (createdAt !== null && createdAt >= thirtyDaysAgo) {
          thirtyDayBootcamp++;
        }
      });
      applySevenDayStreamyardToLatestUsers();
      renderTable(organizations);
      renderLatestUsersTable();

      // Update DOM elements
      const el7dayAttendees = document.getElementById('7day_attendees');
      const el7dayRegs = document.getElementById('7day_registrations');
      const el24hRegs = document.getElementById('24h_registrations');
      const el7dayBootcamp = document.getElementById('7day_bootcamp');
      const el30dayBootcamp = document.getElementById('30day_bootcamp');
      const elAllBootcamp = document.getElementById('all_bootcamp');

      if (el7dayAttendees) el7dayAttendees.textContent = sevenDayAttendees;
      if (el7dayRegs) el7dayRegs.textContent = sevenDayRegistrations;
      if (el24hRegs) el24hRegs.textContent = twentyFourHourRegistrations;
      if (el7dayBootcamp) el7dayBootcamp.textContent = sevenDayBootcamp;
      if (el30dayBootcamp) el30dayBootcamp.textContent = thirtyDayBootcamp;
      if (elAllBootcamp) elAllBootcamp.textContent = allBootcamp;

      // Feed the 30-day trend chart with Streamyard signups (webinars_log
      // registrations) and Bootcamp registrations (courses_log actions).
      trendStreamyardTs = webinarsLog
        .filter(log => log.action === 'registration')
        .map(log => toTimestamp(log.created_at))
        .filter(v => v !== null);
      trendBootcampTs = coursesLog
        .filter(log => BOOTCAMP_ACTIONS.has((log.action || '').toString().trim().toLowerCase()))
        .map(log => toTimestamp(log.created_at))
        .filter(v => v !== null);
      maybeRenderTrendChart();

      window.ssShimmer.remove('#loader');

      const feedbackHeader = document.querySelector('#active th[data-key="total_feedbacks"]');
      if (feedbackHeader) {
        sortColumn('total_feedbacks');
        sortColumn('total_feedbacks');
      }
    })
    .catch(error => {
      console.error("Error:", error);
      // Retire the skeleton too — otherwise it shimmers forever here.
      window.ssShimmer.remove('#loader');
      // Let the chart still render from the other endpoint's data.
      if (trendStreamyardTs === null) trendStreamyardTs = [];
      if (trendBootcampTs === null) trendBootcampTs = [];
      maybeRenderTrendChart();
    });

  function renderTable(data) {
    const activeContainer = document.getElementById('active');
    const inactiveContainer = document.getElementById('inactive');

    const normalizedData = data.map(org => ({
      ...org,
      streamyardTotal: totalStreamyardRecordsByOrg[String(org.id)] || 0
    }));

    const activeOrgs = normalizedData.filter(org => org.org_active === true);
    const inactiveOrgs = normalizedData.filter(org => org.org_active === false);

    if (activeContainer) {
      activeContainer.innerHTML = renderTableSection(activeOrgs, 'Active Organizations', 'active');
      activeContainer.querySelectorAll('th[data-key]').forEach(th =>
        th.addEventListener('click', () => sortColumn(th.getAttribute('data-key')))
      );
    }

    if (inactiveContainer) {
      inactiveContainer.innerHTML = renderTableSection(inactiveOrgs, 'Inactive Organizations', 'inactive');
      inactiveContainer.querySelectorAll('th[data-key]').forEach(th =>
        th.addEventListener('click', () => sortColumn(th.getAttribute('data-key')))
      );
    }
  }

  function renderTableSection(data, title, contextId) {
    const headers = [
      { name: '#', key: 'row_number', type: 'none' },
      { name: 'District Name', key: 'district_name', type: 'string' },
      { name: 'Students', key: 'total_students', type: 'number' },
      { name: 'Goal', key: 'registrationGoal', type: 'number' },
      { name: 'VIPs', key: 'parents', type: 'number' },
      { name: '% to Goal', key: 'percentageToGoal', type: 'number' },
      { name: '💵', key: 'payment', type: 'number' },
      { name: 'Streamyards', key: 'streamyardTotal', type: 'number' },
      { name: 'Feedback', key: 'total_feedbacks', type: 'number' },
      { name: 'Expire', key: 'org_expire_date', type: 'date' }
    ];

    let html = `<h3>${title} (${data.length})</h3><table border="1"><tr>`;
    headers.forEach(header => {
      if (header.type !== 'none') {
        let headerLabel = header.name;
        headerLabel += currentSortColumn === header.key ? (sortAscending ? ' ▲' : ' ▼') : ' ▲▼';
        html += `<th data-key="${header.key}" style="cursor:pointer;">${headerLabel}</th>`;
      } else {
        html += `<th>${header.name}</th>`;
      }
    });
    html += '</tr>';

    data.forEach((org, index) => {
      const registrationGoal = Math.round(org.total_students * 0.05);
      const rawPercent = (org.parents / (org.total_students * 0.05)) * 100;
      const percentageToGoal = rawPercent.toFixed(1);
      const percentStyle = rawPercent < 50 ? 'background: #f5cbcb;' : '';
      const paymentVal = org.payment ? org.payment : 0;
      const paymentFormatted = (paymentVal / 1000).toFixed(0) + 'K';

      html += `<tr>
        <td>${index + 1}</td>
        <td>
            <a href="https://smartsocial.com/dashboard/parents?as_org=${org.short_code}" target="_blank">
                ${org.district_name}
            </a>
            (<a href="https://smartsocial.com/dashboard/student?as_org=${org.short_code}" target="_blank">📚</a>)
        </td>
        <td>${org.total_students.toLocaleString()}</td>
        <td>${registrationGoal.toLocaleString()}</td>
        <td>${org.parents.toLocaleString()}</td>
        <td style="${percentStyle}">${percentageToGoal}%</td>
        <td>${paymentFormatted}</td>
        <td>${(org.streamyardTotal || 0).toLocaleString()}</td>
        <td>${org.total_feedbacks.toLocaleString()}</td>`;

      if (org.org_expire_date) {
        let expireDate = new Date(org.org_expire_date);
        let today = new Date();
        today.setHours(0, 0, 0, 0);
        let diffDays = (expireDate - today) / (1000 * 60 * 60 * 24);
        let bgColor = diffDays < 0 ? '#f5cbcb' : diffDays >= 90 ? '#d9ead3' : '#fdf2cc';
        let parts = org.org_expire_date.split('-');
        let formattedDate = parts[1] + '/' + parts[2] + '/' + parts[0].slice(-2);
        html += `<td style="background: ${bgColor}">${formattedDate}</td>`;
      } else {
        html += `<td></td>`;
      }

      html += `</tr>`;
    });
    html += '</table>';

    return html;
  }

  function sortColumn(key) {
    if (key === 'org_expire_date') {
      organizations.sort((a, b) => {
        let dateA = a.org_expire_date ? new Date(a.org_expire_date) : new Date(0);
        let dateB = b.org_expire_date ? new Date(b.org_expire_date) : new Date(0);
        return sortAscending ? dateA - dateB : dateB - dateA;
      });
    } else {
      organizations = organizations.map(org => {
        const registrationGoal = Math.round(org.total_students * 0.05);
        const percentageToGoal = ((org.parents / (org.total_students * 0.05)) * 100);
        return {
          ...org,
          registrationGoal,
          percentageToGoal,
          streamyardTotal: totalStreamyardRecordsByOrg[String(org.id)] || 0
        };
      });
      organizations.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];

        if (valA === undefined || valA === null) valA = 0;
        if (valB === undefined || valB === null) valB = 0;

        if (typeof valA === 'string') {
          valA = valA.toLowerCase();
          valB = valB.toLowerCase();
        }
        if (valA < valB) return sortAscending ? -1 : 1;
        if (valA > valB) return sortAscending ? 1 : -1;
        return 0;
      });
    }
    currentSortColumn = key;
    sortAscending = !sortAscending;
    renderTable(organizations);
  }
});
