document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let currentSortColumn = null;
  let sortAscending = true;

  // 1. SETUP LAYOUT STRUCTURE
  // We prepare the 3 containers immediately so they exist for the data to populate
  const orgsListContainer = document.querySelector('.orgs_list');
  if (orgsListContainer) {
    orgsListContainer.innerHTML = `
      <div id="latest_users"></div>
      <br>
      <div id="active"></div>
      <br><br>
      <div id="inactive"></div>
    `;
  }

  // 2. NEW: FETCH AND RENDER LATEST USERS
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users')
    .then(response => {
      renderLatestUsers(response.data);
    })
    .catch(error => console.error("Error fetching latest users:", error));

  // 3. EXISTING: FETCH ORGANIZATIONS
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations')
    .then(response => {
      organizations = response.data;
      renderTable(organizations);
      
      const loader = document.getElementById('loader');
      if(loader) loader.remove();

      const feedbackHeader = document.querySelector('th[data-key="total_feedbacks"][style*="cursor:pointer;"]');
      if (feedbackHeader) {
        feedbackHeader.click();
        feedbackHeader.click();
      }
    })
    .catch(error => console.error("Error:", error));

  // --- NEW FUNCTION: Render the Latest Users Summary ---
  function renderLatestUsers(users) {
    const container = document.getElementById('latest_users');
    if (!container) return;

    // Aggregate data: Count users per district
    const summary = {};

    users.forEach(user => {
      // safe navigation in case organization is null
      const districtName = user.organization ? user.organization.district_name : "Unknown Organization";
      
      if (!summary[districtName]) {
        summary[districtName] = {
          name: districtName,
          parents: user.parents || 0, // Using parents count from the user object
          latestRegs: 0
        };
      }
      summary[districtName].latestRegs += 1; // Increment count for this batch
    });

    // Generate HTML
    let html = `<h3>Latest Users Summary</h3>
                <table border="1">
                  <tr>
                    <th>Organization Name</th>
                    <th>Latest Registrations</th>
                    <th>Parents (Total)</th>
                  </tr>`;

    // Convert object to array and sort by Latest Registrations (High to Low)
    const sortedSummary = Object.values(summary).sort((a, b) => b.latestRegs - a.latestRegs);

    sortedSummary.forEach(org => {
      html += `<tr>
                <td>${org.name}</td>
                <td>${org.latestRegs}</td>
                <td>${org.parents.toLocaleString()}</td>
               </tr>`;
    });

    html += `</table>`;
    container.innerHTML = html;
  }

  // --- EXISTING FUNCTIONS (Modified DOM targets only) ---

  function renderTable(data) {
    // Split organizations into active and inactive
    const activeOrgs = data.filter(org => org.org_active === true);
    const inactiveOrgs = data.filter(org => org.org_active === false);
    
    // RENDER ACTIVE
    const activeContainer = document.getElementById('active');
    if (activeContainer) {
        activeContainer.innerHTML = renderTableSection(activeOrgs, 'Active Organizations');
    }

    // RENDER INACTIVE
    const inactiveContainer = document.getElementById('inactive');
    if (inactiveContainer) {
        inactiveContainer.innerHTML = renderTableSection(inactiveOrgs, 'Inactive Organizations');
    }
    
    // Add event listeners (Attached to the main container, referencing the new TH elements)
    // We re-select the headers because the DOM was updated
    document.querySelectorAll('.orgs_list th[data-key]').forEach(th =>
      th.addEventListener('click', () => sortColumn(th.getAttribute('data-key')))
    );
  }

  function renderTableSection(data, title) {
    const headers = [
      { name: '#', key: 'row_number', type: 'none' },
      { name: 'District Name', key: 'district_name', type: 'string' },
      { name: 'Students', key: 'total_students', type: 'number' },
      { name: 'Goal', key: 'registrationGoal', type: 'number' },
      { name: 'Regs', key: 'parents', type: 'number' },
      { name: '% to Goal', key: 'percentageToGoal', type: 'number' },
      { name: '💵', key: 'payment', type: 'number' },
      { name: 'Feedback', key: 'total_feedbacks', type: 'number' },
      { name: 'Expire', key: 'org_expire_date', type: 'date' },
      { name: 'Dashboard', key: 'dashboard', type: 'none' }
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
        <td>${org.district_name}</td>
        <td>${org.total_students.toLocaleString()}</td>
        <td>${registrationGoal.toLocaleString()}</td>
        <td>${org.parents.toLocaleString()}</td>
        <td style="${percentStyle}">${percentageToGoal}%</td>
        <td>${paymentFormatted}</td>
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

      html += `<td>
        <a href="https://smartsocial.com/dashboard/parents?as_org=${org.short_code}" target="_blank">Parents</a><br>
        <a href="https://smartsocial.com/dashboard/student?as_org=${org.short_code}" target="_blank">Students</a>
      </td></tr>`;
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
        return { ...org, registrationGoal, percentageToGoal };
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
