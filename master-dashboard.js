document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let latestUsersStats = []; // Store the summary data here
  let currentSortColumn = null;
  let sortAscending = true;

  // URLs
  const orgsUrl = 'https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations';
  const usersUrl = 'https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users';

  // Fetch both endpoints simultaneously
  Promise.all([
    axios.get(orgsUrl),
    axios.get(usersUrl)
  ])
  .then(([orgsResponse, usersResponse]) => {
    organizations = orgsResponse.data;
    const latestUsers = usersResponse.data;

    // Process Latest Users Data
    processLatestUsers(latestUsers, organizations);

    // Initial Render
    renderTable(organizations);
    
    const loader = document.getElementById('loader');
    if(loader) loader.remove();

    // Default sorting trigger (as per your original code)
    const feedbackHeader = document.querySelector('th[data-key="total_feedbacks"][style*="cursor:pointer;"]');
    if (feedbackHeader) {
      feedbackHeader.click();
      feedbackHeader.click();
    }
  })
  .catch(error => console.error("Error:", error));

  // Helper: Process the users list to get counts per organization
  function processLatestUsers(users, orgs) {
    const counts = {};

    // 1. Count users per organization
    users.forEach(user => {
      const orgId = user.organizations_id;
      if (orgId) {
        counts[orgId] = (counts[orgId] || 0) + 1;
      }
    });

    // 2. Map counts to organization details
    // We filter to only show orgs that actually have latest registrations
    latestUsersStats = Object.keys(counts).map(orgId => {
      // Find the full org object to get the name and total parents
      const org = orgs.find(o => o.id === parseInt(orgId));
      return {
        name: org ? org.district_name : 'Unknown District',
        total_parents: org ? org.parents : 0,
        latest_registrations: counts[orgId]
      };
    }).sort((a, b) => b.latest_registrations - a.latest_registrations); // Sort high to low
  }

  function renderTable(data) {
    const orgsList = document.querySelector('.orgs_list');
    
    // Split organizations into active and inactive
    const activeOrgs = data.filter(org => org.org_active === true);
    const inactiveOrgs = data.filter(org => org.org_active === false);
    
    let html = '';

    // --- NEW SECTION: Render Latest Users Summary ---
    // We render this first
    if (latestUsersStats.length > 0) {
      html += renderLatestUsersTable(latestUsersStats);
      html += '<br><hr style="border: 1px solid #ccc;"><br>';
    }

    // Render Active/Inactive Tables
    html += renderTableSection(activeOrgs, 'Active Organizations');
    html += '<br><br>';
    html += renderTableSection(inactiveOrgs, 'Inactive Organizations');
    
    orgsList.innerHTML = html;
    
    // Add event listeners for the Active/Inactive table headers
    orgsList.querySelectorAll('th[data-key]').forEach(th =>
      th.addEventListener('click', () => sortColumn(th.getAttribute('data-key')))
    );
  }

  // Function to generate HTML for the new 3rd list
  function renderLatestUsersTable(data) {
    let html = `<div id="latest_users"><h3>Latest User Registrations Summary</h3>
    <table border="1" style="background-color: #f9f9f9;">
      <thead>
        <tr>
          <th>Organization Name</th>
          <th>Total Parents</th>
          <th>Latest Registrations</th>
        </tr>
      </thead>
      <tbody>`;

    data.forEach(row => {
      html += `<tr>
        <td>${row.name}</td>
        <td>${row.total_parents.toLocaleString()}</td>
        <td style="font-weight:bold; color:green;">+${row.latest_registrations}</td>
      </tr>`;
    });

    html += `</tbody></table></div>`;
    return html;
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
