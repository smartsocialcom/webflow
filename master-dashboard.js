document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let currentSortColumn = null;
  let sortAscending = true;

  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations')
    .then(response => {
      organizations = response.data;
      renderTables(organizations);
      document.getElementById('loader').remove();

      // Default sort both tables by feedback (descending)
      const activeHeader = document.querySelector('#active th[data-key="total_feedbacks"][style*="cursor:pointer;"]');
      const inactiveHeader = document.querySelector('#inactive th[data-key="total_feedbacks"][style*="cursor:pointer;"]');
      if (activeHeader) {
        activeHeader.click();
        activeHeader.click();
      }
      if (inactiveHeader) {
        inactiveHeader.click();
        inactiveHeader.click();
      }
    })
    .catch(error => console.error("Error:", error));

  function renderTables(data) {
    const activeOrgs = data.filter(org => org.org_active === true);
    const inactiveOrgs = data.filter(org => org.org_active === false);
    
    renderTable(activeOrgs, '#active', 'active');
    renderTable(inactiveOrgs, '#inactive', 'inactive');
  }

  function renderTable(data, containerId, tableType) {
    const container = document.querySelector(containerId);
    if (!container) {
      console.error(`Container ${containerId} not found`);
      return;
    }
    
    const headers = [
      { name: '#', key: 'row_number', type: 'none' },
      { name: 'District Name', key: 'district_name', type: 'string' },
      { name: 'Students', key: 'total_students', type: 'number' },
      { name: 'Goal', key: 'registrationGoal', type: 'number' },
      { name: 'Regs', key: 'parents', type: 'number' },
      { name: '% to Goal', key: 'percentageToGoal', type: 'number' },
      { name: 'Feedback', key: 'total_feedbacks', type: 'number' },
      { name: 'Expire', key: 'org_expire_date', type: 'date' },
      { name: 'Dashboard', key: 'dashboard', type: 'none' }
    ];

    let html = '<table border="1"><tr>';
    headers.forEach(header => {
      if (header.type !== 'none') {
        let headerLabel = header.name;
        headerLabel += currentSortColumn === header.key ? (sortAscending ? ' ▲' : ' ▼') : ' ▲▼';
        html += `<th data-key="${header.key}" data-table-type="${tableType}" style="cursor:pointer;">${headerLabel}</th>`;
      } else {
        html += `<th>${header.name}</th>`;
      }
    });
    html += '</tr>';

    data.forEach((org, index) => {
      const registrationGoal = Math.round(org.total_students * 0.05);
      const percentageToGoal = ((org.parents / (org.total_students * 0.05)) * 100).toFixed(1);
      html += `<tr>
        <td>${index + 1}</td>
        <td>${org.district_name}</td>
        <td>${org.total_students.toLocaleString()}</td>
        <td>${registrationGoal.toLocaleString()}</td>
        <td>${org.parents.toLocaleString()}</td>
        <td>${percentageToGoal}%</td>
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
    container.innerHTML = html;

    container.querySelectorAll('th[data-key]').forEach(th =>
      th.addEventListener('click', () => sortColumn(th.getAttribute('data-key'), th.getAttribute('data-table-type')))
    );
  }

  function sortColumn(key, tableType) {
    const activeOrgs = organizations.filter(org => org.org_active === true);
    const inactiveOrgs = organizations.filter(org => org.org_active === false);
    let targetOrgs = tableType === 'active' ? activeOrgs : inactiveOrgs;
    
    if (key === 'org_expire_date') {
      targetOrgs.sort((a, b) => {
        let dateA = a.org_expire_date ? new Date(a.org_expire_date) : new Date(0);
        let dateB = b.org_expire_date ? new Date(b.org_expire_date) : new Date(0);
        return sortAscending ? dateA - dateB : dateB - dateA;
      });
    } else {
      targetOrgs = targetOrgs.map(org => {
        const registrationGoal = Math.round(org.total_students * 0.05);
        const percentageToGoal = ((org.parents / (org.total_students * 0.05)) * 100);
        return { ...org, registrationGoal, percentageToGoal };
      });
      targetOrgs.sort((a, b) => {
        let valA = a[key];
        let valB = b[key];
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
    
    // Re-render only the specific table
    const containerId = tableType === 'active' ? '#active' : '#inactive';
    renderTable(targetOrgs, containerId, tableType);
  }
});
