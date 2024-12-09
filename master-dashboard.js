document.addEventListener("DOMContentLoaded", () => {
  axios.get('https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations')
  .then(response => {
    const data = response.data;
    const orgsList = document.querySelector('.orgs_list');
    let html = '<table border="1"><tr><th>School District Name</th><th>Total Students</th><th>Registration Goal</th><th>Current Registrations</th><th>% to Goal</th><th>Total Feedbacks</th><th>Dashboard</th></tr>';

    data.forEach(organization => {
      const registrationGoal = Math.round(organization.total_students * 0.05).toLocaleString();
      const percentageToGoal = ((organization.parents / (organization.total_students * 0.05)) * 100).toFixed(1) + '%';

      html += `<tr>
        <td>${organization.district_name}</td>
        <td>${organization.total_students}</td>
        <td>${registrationGoal}</td>
        <td>${organization.parents}</td>
        <td>${percentageToGoal}</td>
        <td>${organization.total_feedbacks}</td>
        <td><a href="https://smartsocial.com/dashboard?as_org=${organization.short_code}" target="_blank">View More</a></td>
      </tr>`;
    });

    html += '</table>';
    orgsList.innerHTML = html;
    document.getElementById('loader').remove();
  })
  .catch(error => console.error("Error:", error));
});