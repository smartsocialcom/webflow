document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let currentSortColumn = 'total_feedbacks';
  let sortAscending = false;

  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations')
    .then(response => {
      organizations = response.data.map(org => {
        const registrationGoal = Math.round(org.total_students * 0.05);
        const percentageToGoal = ((org.parents / (org.total_students * 0.05)) * 100);
        return { ...org, registrationGoal, percentageToGoal };
      });

      sortColumn(currentSortColumn);
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

    let html = `
      <table border="1" style="table-layout: fixed; width: 50%;">
      <colgroup>
        <col style="width:5%;">
        <col style="width:10%;">
        <col style="width:10%;">
        <col style="width:10%;">
        <col style="width:10%;">
        <col style="width:10%;">
        <col style="width:10%;">
        <col style="width:10%;">
      </colgroup>
      <tr>`;

    headers.forEach(header => {
      if (header.type !== 'none') {
        let headerLabel = header.name;
        if (currentSortColumn === header.key) {
          headerLabel += sortAscending ? ' ▲' : ' ▼';
        } else {
          headerLabel += ' ▲▼';
        }
        html += `<th data-key="${header.key}" style="cursor:pointer; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${headerLabel}</th>`;
      } else {
        html += `<th style="white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${header.name}</th>`;
      }
    });
    html += '</tr>';

    data.forEach((org, index) => {
      html += `<tr>
        <td>${index + 1}</td>
        <td>${org.district_name}</td>
        <td>${org.total_students.toLocaleString()}</td>
        <td>${org.registrationGoal.toLocaleString()}</td>
        <td>${org.parents.toLocaleString()}</td>
        <td>${org.percentageToGoal.toFixed(1)}%</td>
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
      sortAscending = false; // Default to descending for new column
    }

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
console.log("damn");