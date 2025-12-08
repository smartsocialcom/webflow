document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let currentSortColumn = null;
  let sortAscending = true;

  // --- NEW CODE START: Fetch and Render Latest Users ---
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users')
    .then(response => {
      renderLatestUsers(response.data);
    })
    .catch(error => console.error("Error fetching latest users:", error));

  function renderLatestUsers(users) {
    // 1. Ensure the container exists
    let latestContainer = document.getElementById('latest_users');
    if (!latestContainer) {
      // If the user hasn't added the div in HTML, create it and prepend it to the main container or body
      latestContainer = document.createElement('div');
      latestContainer.id = 'latest_users';
      const orgsList = document.querySelector('.orgs_list');
      if (orgsList) {
        orgsList.parentNode.insertBefore(latestContainer, orgsList);
      } else {
        document.body.prepend(latestContainer);
      }
    }

    // 2. Aggregate data by District Name
    const aggregation = {};

    users.forEach(user => {
      // safe check in case organization object is missing
      const districtName = user.organization ? user.organization.district_name : "Unknown District";
      
      if (!aggregation[districtName]) {
        aggregation[districtName] = {
          name: districtName,
          parents: user.parents || 0, // Fallback to 0 if missing
          latestCount: 0
        };
      }
      aggregation[districtName].latestCount += 1;
    });

    // Convert object to array for sorting/mapping
    const tableData = Object.values(aggregation);

    // 3. Render the HTML Table
    let html = `<h3>Latest User Registrations</h3>
                <table border="1" style="margin-bottom: 20px;">
                  <tr>
                    <th>Organization Name</th>
                    <th>Parents</th>
                    <th>Latest Registrations</th>
                  </tr>`;

    tableData.forEach(row => {
      html += `<tr>
                 <td>${row.name}</td>
                 <td>${row.parents.toLocaleString()}</td>
                 <td>${row.latestCount.toLocaleString()}</td>
               </tr>`;
    });

    html += `</table><hr>`; // Added a horizontal rule to separate from the next lists
    latestContainer.innerHTML = html;
  }
  // --- NEW CODE END ---

  // --- EXISTING CODE BELOW (Untouched Logic) ---

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
    
    // Render both tables in the same container
    let html = '';
    html += renderTableSection(activeOrgs, 'Active Organizations');
    html += '<br><br>';
    html += renderTableSection(inactiveOrgs, 'Inactive Organizations');
    
    orgsList.innerHTML = html;
    
    // Add event listeners for both tables
    orgsList.querySelectorAll('th[data-key]').forEach(th =>
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
