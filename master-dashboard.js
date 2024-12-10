document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let currentSortColumn = null;
  let sortAscending = true;

  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations')
    .then(response => {
      organizations = response.data;
      renderTable(organizations);
      document.getElementById('loader').remove();
    })
    .catch(error => console.error("Error:", error));

  function renderTable(data) {
    const orgsList = document.querySelector('.orgs_list');
    const headers = [
      { name: '#', key: 'row_number', type: 'none' },
      { name: 'District Name', key: 'district_name', type: 'string' },
      { name: 'Students', key: 'total_students', type: 'number' },
      { name: 'Goal', key: 'registrationGoal', type: 'number' },
      { name: 'Registrations', key: 'parents', type: 'number' },
      { name: '% to Goal', key: 'percentageToGoal', type: 'number' },
      { name: 'Feedback', key: 'total_feedbacks', type: 'number' },
      { name: 'Dashboard', key: 'dashboard', type: 'none' }
    ];

    let html = '<table border="1"><tr>';
    headers.forEach(header => {
      if (header.type !== 'none') {
        let headerLabel = header.name;
        if (currentSortColumn === header.key) {
          headerLabel += sortAscending ? ' ▲' : ' ▼';
        } else {
          headerLabel += ' ▲▼';
        }
        html += `<th data-key="${header.key}" style="cursor:pointer;">${headerLabel}</th>`;
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
        <td>${org.total_feedbacks.toLocaleString()}</td>
        <td><a href="https://smartsocial.com/dashboard?as_org=${org.short_code}" target="_blank">View More</a></td>
      </tr>`;
    });

    html += '</table>';
    orgsList.innerHTML = html;

    orgsList.querySelectorAll('th[data-key]').forEach(th => {
      th.addEventListener('click', () => sortColumn(th.getAttribute('data-key')));
    });
  }

  function sortColumn(key) {
    if (currentSortColumn === key) {
      sortAscending = !sortAscending;
    } else {
      currentSortColumn = key;
      sortAscending = true;
    }

    organizations = organizations.map(org => {
      const registrationGoal = Math.round(org.total_students * 0.05);
      const percentageToGoal = ((org.parents / (org.total_students * 0.05)) * 100);
      return { ...org, registrationGoal, percentageToGoal };
    });

    organizations.sort((a, b) => {
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

    renderTable(organizations);
  }
});
