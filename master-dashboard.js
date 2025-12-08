document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let currentSortColumn = null;
  let sortAscending = true;
  
  // Store the HTML for the new table here so we can re-render easily
  let latestUsersHtml = '<div id="latest_users"><h3>Loading Latest Users...</h3></div>';

  // 1. NEW: Fetch Latest Users
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users')
    .then(response => {
      const users = response.data;
      const summary = {};

      // Aggregate data: Group by District Name
      users.forEach(user => {
        const distName = user.organization ? user.organization.district_name : 'Unknown District';
        // Initialize if not exists
        if (!summary[distName]) {
          summary[distName] = {
            name: distName,
            parents: user.parents || 0, // Grab parents count from the user record
            latestCount: 0
          };
        }
        // Increment count for this batch
        summary[distName].latestCount++;
      });

      // Convert object to array and sort by Latest Registrations (High to Low)
      const summaryArray = Object.values(summary).sort((a, b) => b.latestCount - a.latestCount);

      // Build the New Table HTML
      let newTable = `
        <h3>Latest Registrations Summary</h3>
        <table border="1">
          <thead>
            <tr>
              <th>Organization Name</th>
              <th>Parents</th>
              <th>Latest Registrations</th>
            </tr>
          </thead>
          <tbody>`;

      summaryArray.forEach(item => {
        newTable += `
          <tr>
            <td>${item.name}</td>
            <td>${item.parents.toLocaleString()}</td>
            <td>${item.latestCount}</td>
          </tr>`;
      });

      newTable += `</tbody></table><br><br>`;
      
      // Save to variable and wrap in the requested div ID
      latestUsersHtml = `<div id="latest_users">${newTable}</div>`;
      
      // Trigger a re-render to show the new table immediately
      renderTable(organizations);
    })
    .catch(error => console.error("Error fetching users:", error));

  // 2. EXISTING: Fetch Organizations (Unchanged logic)
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

  function renderTable(data) {
    const orgsList = document.querySelector('.orgs_list');
    
    // Split organizations into active and inactive
    const activeOrgs = data.filter(org => org.org_active === true);
    const inactiveOrgs = data.filter(org => org.org_active === false);
    
    // START EDIT: Construct HTML with the 3 requested containers
    let html = '';
    
    // 1. The New Latest Users Table (pre-calculated)
    html += latestUsersHtml;

    // 2. The Active Table (Wrapped in #active)
    html += `<div id="active">`;
    html += renderTableSection(activeOrgs, 'Active Organizations');
    html += `</div><br><br>`;

    // 3. The Inactive Table (Wrapped in #inactive)
    html += `<div id="inactive">`;
    html += renderTableSection(inactiveOrgs, 'Inactive Organizations');
    html += `</div>`;
    // END EDIT

    orgsList.innerHTML = html;
    
    // Add event listeners for both tables (Unchanged)
    orgsList.querySelectorAll('th[data-key]').forEach(th =>
      th.addEventListener('click', () => sortColumn(th.getAttribute('data-key')))
    );
  }

  // --- EXISTING HELPER FUNCTIONS BELOW (UNTOUCHED) ---

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
