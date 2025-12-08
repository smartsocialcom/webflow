document.addEventListener("DOMContentLoaded", () => {
  let organizations = [];
  let latestUsers = []; // Store the new user data
  let currentSortColumn = null;
  let sortAscending = true;

  // Fetch both Organizations and Latest Users data simultaneously
  Promise.all([
    axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations'),
    axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/latest_users')
  ])
  .then(([orgResponse, userResponse]) => {
    organizations = orgResponse.data;
    latestUsers = userResponse.data; // Save user data
    
    renderTable(organizations);
    
    const loader = document.getElementById('loader');
    if(loader) loader.remove();

    // Trigger default sort if needed
    const feedbackHeader = document.querySelector('th[data-key="total_feedbacks"][style*="cursor:pointer;"]');
    if (feedbackHeader) {
      feedbackHeader.click();
      feedbackHeader.click();
    }
  })
  .catch(error => console.error("Error:", error));

  function renderTable(data) {
    const orgsList = document.querySelector('.orgs_list');
    
    // --- 1. Prepare Latest Users Summary Data ---
    // Count how many users belong to each organization ID
    const userCounts = {};
    latestUsers.forEach(user => {
        const orgId = user.organizations_id;
        userCounts[orgId] = (userCounts[orgId] || 0) + 1;
    });

    // Map this count to the organization data and sort by latest registrations (High to Low)
    const summaryList = data
        .map(org => ({
            name: org.district_name,
            parents: org.parents,
            latestCount: userCounts[org.id] || 0
        }))
        .filter(item => item.latestCount > 0) // Only show orgs that appeared in the latest_users result
        .sort((a, b) => b.latestCount - a.latestCount);

    // --- 2. Filter Active/Inactive for existing tables ---
    const activeOrgs = data.filter(org => org.org_active === true);
    const inactiveOrgs = data.filter(org => org.org_active === false);
    
    // --- 3. Build HTML with the 3 requested containers ---
    let html = '';

    // Container 1: Latest Users Summary
    html += '<div id="latest_users">';
    html += '<h3>Latest Users Summary</h3>';
    html += '<table border="1"><thead><tr>';
    html += '<th>Organization Name</th><th>Parents</th><th>Latest Registrations</th>';
    html += '</tr></thead><tbody>';
    
    summaryList.forEach(item => {
        html += `<tr>
            <td>${item.name}</td>
            <td>${item.parents.toLocaleString()}</td>
            <td>${item.latestCount}</td>
        </tr>`;
    });
    html += '</tbody></table>';
    html += '</div><br><br>';

    // Container 2: Active
    html += '<div id="active">';
    html += renderTableSection(activeOrgs, 'Active Organizations');
    html += '</div><br><br>';

    // Container 3: Inactive
    html += '<div id="inactive">';
    html += renderTableSection(inactiveOrgs, 'Inactive Organizations');
    html += '</div>';
    
    orgsList.innerHTML = html;
    
    // Add event listeners for the sorting columns (applies to active/inactive tables)
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
