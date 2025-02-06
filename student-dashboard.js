if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      const searchParams = new URLSearchParams(window.location.search);
      const member = await window.$memberstackDom.getCurrentMember();
      const org = searchParams.get("as_org") || member.data.customFields.organization;
      const { data } = await axios.get(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations/short_code/${org}`);
      const { district_name, custom_graphics, student_access, school_buildings } = data.organization;
      const loginLog = data.students_login_log;
      const lessonsLog = data.students_lessons_log;

      document.getElementById("org_name").textContent = district_name;
      if (student_access === true)
        document.getElementById("student_registration_links_lock").classList.add("hide");
      document.getElementById("custom_graphics").setAttribute("href", custom_graphics);

      document.getElementById("student_pin_list").innerHTML = school_buildings
        .map(s => `<a fs-copyclip-text="https://smartsocial.com/students?pin=${s.student_pin_code}" fs-copyclip-element="click" fs-copyclip-message="Link Copied!" href="#" class="link-list w-button">
                    ${s.school_name}<span class="pincode">Pincode: ${s.student_pin_code}</span>
                  </a>`)
        .join("");

      // Student logins per month (vertical bar chart)
      const monthlyLogins = Array(12).fill(0);
      loginLog.forEach(l => monthlyLogins[new Date(l.created_at).getMonth()]++);
      new Chart(document.getElementById("studentLoginsPerMonthChart"), {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [{
            label: "Student Logins per month",
            data: monthlyLogins,
            backgroundColor: "#02afaf"
          }]
        },
        options: { scales: { y: { beginAtZero: true } } }
      });

      // Student logins per building (doughnut chart)
      if (loginLog.length) {
        const buildingLogins = loginLog.reduce((acc, { _school_buildings }) => {
          const name = _school_buildings?.school_name;
          if (name) acc[name] = (acc[name] || 0) + 1;
          return acc;
        }, {});
        const colors = [
          "#EF476F", "#FFD166", "#06D6A0", "#118AB2", "#073B4C",
          "#FFC6FF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFADAD"
        ].slice(0, Object.keys(buildingLogins).length);
        new Chart(document.getElementById("studentLoginsPerBuilding"), {
          type: "doughnut",
          data: {
            labels: Object.keys(buildingLogins),
            datasets: [{ data: Object.values(buildingLogins), backgroundColor: colors }]
          },
          options: {
            cutout: "50%",
            plugins: {
              legend: { display: true, position: "bottom" },
              tooltip: {
                callbacks: {
                  label: ({ raw, dataset }) => {
                    const total = dataset.data.reduce((a, b) => a + b, 0);
                    return `${raw}: ${((raw / total) * 100).toFixed(2)}%`;
                  }
                }
              }
            }
          }
        });
      } else {
        document.getElementById("studentLoginsPerBuildingWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Please check back later.</h4></div>`;
      }

      // Top visited lessons (horizontal bar chart)
      if (lessonsLog && lessonsLog.length) {
        const lessonCounts = {};
        lessonsLog.forEach(item => {
          try {
            const lesson = new URL(item.page_url).pathname.split("/").pop();
            lessonCounts[lesson] = (lessonCounts[lesson] || 0) + 1;
          } catch (e) {}
        });
        const topLessons = Object.entries(lessonCounts)
          .map(([lesson, count]) => ({ lesson, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
        
        new Chart(document.getElementById("topVisitedLessonsChart"), {
          type: "bar",
          data: {
            labels: topLessons.map(item => item.lesson),
            datasets: [{
              label: "Top Visited Lessons",
              data: topLessons.map(item => item.count),
              backgroundColor: "#02afaf"
            }]
          },
          options: {
            indexAxis: "y",
            scales: { x: { beginAtZero: true } }
          }
        });
      } else {
        document.getElementById("topVisitedLessonsWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">No lesson visits yet.</h4></div>`;
      }

      // Append copyclip script
      const cpScript = document.createElement("script");
      cpScript.defer = true;
      cpScript.src = "https://cdn.jsdelivr.net/npm/@finsweet/attributes-copyclip@1/copyclip.js";
      document.head.appendChild(cpScript);

      document.querySelectorAll(".loader").forEach(e => e.classList.add("hide"));
    } catch (err) {
      console.error("Error:", err);
    }
  });
}
