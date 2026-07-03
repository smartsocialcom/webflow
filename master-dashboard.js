document.addEventListener("DOMContentLoaded", () => {
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
  let trendRegistrationHasFullWindow = false; // true only when a 30-day user list is provided
  let trendChartRendered = false;
  const TREND_DAYS = 30;

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

  // ---------------------------------------------------------
  // "New Activity — Last 30 Days" line chart
  // ---------------------------------------------------------

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

  // Return the mount element for the chart. Prefer a #trends_chart
  // element the admin placed in Webflow; otherwise inject a card
  // above the Registration Summary so it always appears.
  function ensureTrendContainer() {
    const existing = document.getElementById('trends_chart');
    if (existing) return existing;

    if (!document.getElementById('trends_chart_style')) {
      const style = document.createElement('style');
      style.id = 'trends_chart_style';
      style.textContent =
        '#trends_chart_card{background:#fff;border:1px solid #e3ecec;border-radius:12px;' +
        'padding:18px 20px;margin:0 0 24px;box-shadow:0 1px 3px rgba(45,90,90,.06);}' +
        '#trends_chart_card h3{font-size:18px;color:#2D5A5A;font-weight:700;margin:0 0 4px;}' +
        '#trends_chart_note{margin:0 0 12px;font-size:12px;color:#6b7c7c;}';
      document.head.appendChild(style);
    }

    const card = document.createElement('div');
    card.id = 'trends_chart_card';
    card.innerHTML =
      '<h3>New Activity — Last 30 Days</h3>' +
      '<p id="trends_chart_note"></p>' +
      '<div id="trends_chart"></div>';

    const anchor = document.getElementById('latest_users') || document.getElementById('active');
    if (anchor && anchor.parentNode) {
      anchor.parentNode.insertBefore(card, anchor);
    } else {
      document.body.insertBefore(card, document.body.firstChild);
    }
    return document.getElementById('trends_chart');
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

  // Render once both source endpoints have populated their timestamps.
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
    const el = ensureTrendContainer();
    if (!el) return;
    trendChartRendered = true;

    const series = [
      { name: 'New Registrations', data: bucketDailySeries(trendRegistrationTs, TREND_DAYS) },
      { name: 'Streamyard Signups', data: bucketDailySeries(trendStreamyardTs, TREND_DAYS) },
      { name: 'New Feedbacks', data: bucketDailySeries(trendFeedbackTs, TREND_DAYS) },
      { name: 'Bootcamp Registrations', data: bucketDailySeries(trendBootcampTs, TREND_DAYS) }
    ];
    const totals = series.map(s => s.data.reduce((sum, p) => sum + p.y, 0));

    const noteEl = document.getElementById('trends_chart_note');
    if (noteEl) {
      let note = 'Totals — Registrations ' + totals[0].toLocaleString() +
        ' · Streamyard ' + totals[1].toLocaleString() +
        ' · Feedbacks ' + totals[2].toLocaleString() +
        ' · Bootcamp ' + totals[3].toLocaleString();
      const caveats = [];
      if (!trendRegistrationHasFullWindow) caveats.push('registrations reflect the last 7 days only');
      if ((trendFeedbackTs || []).length === 0) caveats.push('feedbacks need a date field to plot');
      if (caveats.length) note += ' (' + caveats.join('; ') + ')';
      noteEl.textContent = note;
    }

    new ApexCharts(el, {
      chart: {
        type: 'line',
        height: 360,
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
        toolbar: { show: false },
        zoom: { enabled: false },
        animations: { enabled: true, speed: 600 }
      },
      series: series,
      colors: ['#449997', '#E8907C', '#E0A93B', '#8E7CB8'],
      stroke: { curve: 'smooth', width: 3 },
      markers: { size: 0, hover: { size: 5 } },
      dataLabels: { enabled: false },
      legend: { position: 'top', horizontalAlign: 'left', fontSize: '14px' },
      xaxis: {
        type: 'datetime',
        labels: {
          datetimeUTC: false,
          format: 'MMM d',
          style: { colors: '#5a7a7a', fontSize: '12px' },
          hideOverlappingLabels: true
        },
        axisBorder: { show: false },
        axisTicks: { show: false },
        tooltip: { enabled: false }
      },
      yaxis: {
        min: 0,
        forceNiceScale: true,
        labels: {
          style: { colors: '#5a7a7a', fontSize: '12px' },
          formatter: v => Math.round(v).toLocaleString()
        }
      },
      grid: { borderColor: '#e8f0f0', strokeDashArray: 4 },
      tooltip: { shared: true, x: { format: 'MMM d, yyyy' } }
    }).render();
  }

  // ---------------------------------------------------------
  // 1. UPDATED CODE: Latest Users (1 Day & 7 Day) + Feedbacks
  // ---------------------------------------------------------
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users')
    .then(response => {
      const oneDayUsers = response.data.users_1day || [];
      const sevenDayUsers = response.data.users_7day || [];
      const feedbackList = response.data.organization_feedbacks || [];

      // A. Create frequency map for Feedbacks
      const feedbackCounts = {};
      feedbackList.forEach(item => {
        const orgId = item.organization;
        if (orgId) {
          feedbackCounts[orgId] = (feedbackCounts[orgId] || 0) + 1;
        }
      });

      const summary = {};

      const initDistrict = (distName, parents, orgId, shortCode) => {
        if (!summary[distName]) {
          summary[distName] = {
            name: distName,
            orgId: orgId || 0,
            shortCode: shortCode || '',
            parents: parents || 0,
            oneDayCount: 0,
            sevenDayCount: 0,
            sevenDayStreamyardCount: 0,
            feedbackTotal: feedbackCounts[orgId] || 0
          };
        }
      };

      // Process 7-Day List
      sevenDayUsers.forEach(user => {
        const distName = user.organization ? user.organization.district_name : 'Unknown District';
        const orgId = user.organizations_id;
        const shortCode = user.organization ? user.organization.short_code : '';

        initDistrict(distName, user.parents, orgId, shortCode);
        summary[distName].sevenDayCount++;
      });

      // Process 1-Day List
      oneDayUsers.forEach(user => {
        const distName = user.organization ? user.organization.district_name : 'Unknown District';
        const orgId = user.organizations_id;
        const shortCode = user.organization ? user.organization.short_code : '';

        initDistrict(distName, user.parents, orgId, shortCode);
        summary[distName].oneDayCount++;
      });

      // Store processed data globally
      latestUsersData = Object.values(summary);
      applySevenDayStreamyardToLatestUsers();

      // Populate VIP registration and feedback totals
      const el24hVipRegs = document.getElementById('24h_vip_registrations');
      const el7dVipRegs = document.getElementById('7d_vip_registrations');
      const el7dayFeedbacks = document.getElementById('7day_feedbacks');

      if (el24hVipRegs) el24hVipRegs.textContent = oneDayUsers.length;
      if (el7dVipRegs) el7dVipRegs.textContent = sevenDayUsers.length;
      if (el7dayFeedbacks) el7dayFeedbacks.textContent = feedbackList.length;

      // Feed the 30-day trend chart. Prefer a full 30-day user list if the
      // endpoint provides one (users_30day); otherwise fall back to the
      // 7-day list so the series still renders for the recent window.
      const registrationUsers = response.data.users_30day || sevenDayUsers;
      trendRegistrationHasFullWindow = Array.isArray(response.data.users_30day);
      trendRegistrationTs = registrationUsers
        .map(u => toTimestamp(u.created_at))
        .filter(v => v !== null);
      trendFeedbackTs = feedbackList
        .map(f => toTimestamp(f.created_at))
        .filter(v => v !== null);
      maybeRenderTrendChart();

      // Initial Sort
      // Since currentSortSummaryColumn is null, this will apply Default logic (Descending for numbers)
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
      { name: '7 Day Feedbacks', key: 'feedbackTotal' },
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

    latestUsersData.forEach(item => {
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

      const loader = document.getElementById('loader');
      if (loader) loader.remove();

      const feedbackHeader = document.querySelector('#active th[data-key="total_feedbacks"]');
      if (feedbackHeader) {
        sortColumn('total_feedbacks');
        sortColumn('total_feedbacks');
      }
    })
    .catch(error => {
      console.error("Error:", error);
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
