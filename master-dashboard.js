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
  let sevenDayStreamyardRegistrationsByOrg = {};
  let totalStreamyardRegistrationsByOrg = {};
  
  // FIX: Set this to null. 
  // If you set it to 'sevenDayCount' here, the function below will flip it to Ascending (Low -> High).
  // By setting it to null, the function defaults to Descending (High -> Low).
  let currentSortSummaryColumn = null; 
  let sortAscendingSummary = false;

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

      // Populate VIP registration and feedback totals
      const el24hVipRegs = document.getElementById('24h_vip_registrations');
      const el7dVipRegs = document.getElementById('7d_vip_registrations');
      const el7dayFeedbacks = document.getElementById('7day_feedbacks');

      if (el24hVipRegs) el24hVipRegs.textContent = oneDayUsers.length;
      if (el7dVipRegs) el7dVipRegs.textContent = sevenDayUsers.length;
      if (el7dayFeedbacks) el7dayFeedbacks.textContent = feedbackList.length;

      // Initial Sort
      // Since currentSortSummaryColumn is null, this will apply Default logic (Descending for numbers)
      sortLatestUsers('sevenDayCount');
    })
    .catch(error => console.error("Error fetching latest users:", error));

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

      const sevenDayAttendees = webinarsLog.filter(
        log => log.action === 'live' && log.created_at >= sevenDaysAgo
      ).length;

      const sevenDayRegistrations = webinarsLog.filter(
        log => log.action === 'registration' && log.created_at >= sevenDaysAgo
      ).length;
      totalStreamyardRegistrationsByOrg = {};
      sevenDayStreamyardRegistrationsByOrg = {};
      webinarsLog.forEach(log => {
        if (log.action !== 'registration') return;
        const orgId = Number(log.organization) || 0;
        totalStreamyardRegistrationsByOrg[orgId] = (totalStreamyardRegistrationsByOrg[orgId] || 0) + 1;
        if (log.created_at >= sevenDaysAgo) {
          sevenDayStreamyardRegistrationsByOrg[orgId] = (sevenDayStreamyardRegistrationsByOrg[orgId] || 0) + 1;
        }
      });
      latestUsersData = latestUsersData.map(item => ({
        ...item,
        sevenDayStreamyardCount: sevenDayStreamyardRegistrationsByOrg[item.orgId] || 0
      }));
      renderTable(organizations);
      renderLatestUsersTable();

      const twentyFourHourRegistrations = webinarsLog.filter(
        log => log.action === 'registration' && log.created_at >= oneDayAgo
      ).length;

      // Update DOM elements
      const el7dayAttendees = document.getElementById('7day_attendees');
      const el7dayRegs = document.getElementById('7day_registrations');
      const el24hRegs = document.getElementById('24h_registrations');

      if (el7dayAttendees) el7dayAttendees.textContent = sevenDayAttendees;
      if (el7dayRegs) el7dayRegs.textContent = sevenDayRegistrations;
      if (el24hRegs) el24hRegs.textContent = twentyFourHourRegistrations;

      const loader = document.getElementById('loader');
      if (loader) loader.remove();

      const feedbackHeader = document.querySelector('#active th[data-key="total_feedbacks"]');
      if (feedbackHeader) {
        sortColumn('total_feedbacks');
        sortColumn('total_feedbacks');
      }
    })
    .catch(error => console.error("Error:", error));

  function renderTable(data) {
    const activeContainer = document.getElementById('active');
    const inactiveContainer = document.getElementById('inactive');

    const normalizedData = data.map(org => ({
      ...org,
      streamyardTotal: totalStreamyardRegistrationsByOrg[org.id] || 0
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
        return { ...org,
          registrationGoal,
          percentageToGoal,
          streamyardTotal: totalStreamyardRegistrationsByOrg[org.id] || 0
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
