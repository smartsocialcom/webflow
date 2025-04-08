if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // Helpers
      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };
      const createChart = (id, type, data, opts) =>
        new Chart(document.getElementById(id), { type, data, options: opts });
      const getTop = items =>
        Object.entries(items)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);
      const generateColors = count =>
        ["#EF476F", "#FFD166", "#06D6A0", "#118AB2", "#073B4C", "#FFC6FF", "#9BF6A0", "#A0C4FF", "#BDB2FF", "#FFADAD", "#F94144", "#F3722C", "#F8961E", "#F9C74F", "#90BE6D", "#277DA1", "#577590", "#4D908E", "#43AA8B", "#F9844A", "#8338EC", "#3A86FF", "#EF233C", "#FF6D00", "#FFD500"].slice(0, count);

      // Member & Data Fetch
      const member = await window.$memberstackDom.getCurrentMember();
      const org = searchParams.get("as_org") || member.data.customFields.organization;
      setText("copy_link", `https://${window.location.hostname}/events?org=${org}`);

      const { data } = await axios.get(
        `https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations/short_code/${org}`
      );
      const { total_students, parents: parentsCount, school_buildings, district_name, custom_graphics } = data.organization;
      const { feedback, top_users, users_per_month_arr, log } = data;

      // Stats Update
      setText("org_name", district_name);
      setText("total_students", total_students.toLocaleString());
      setText("community_registration_goal", Math.round(total_students * 0.05).toLocaleString());
      setText("parents", parentsCount);
      const pct = ((parentsCount / (total_students * 0.05)) * 100).toFixed(1);
      if (pct > 25) {
        setText("percentage_to_goal", pct + "%");
        document.getElementById("percentage_to_goal").classList.remove("small");
      }
      setText("compared_engagement", (parentsCount / (total_students * 0.001)).toFixed(1));
      setText("monthly_engagement", (parentsCount * 4).toLocaleString());
      setText("bullying_avoided", (parentsCount * 0.15).toFixed(0));
      setText("screen_avoided", (parentsCount * 0.09).toFixed(0));
      setText("abuse_avoided", (parentsCount * 0.088).toFixed(0));
      setText("total_incidents", (parentsCount * (0.15 + 0.09 + 0.088)).toFixed(0));
      setText("feedback_count", feedback.length);
      setText("total_students_absent", (total_students * 0.05).toFixed(0));
      setText("estimated_funding", (total_students * 0.05 * 100).toFixed(0).replace(/\B(?=(\d{3})+(?!\d))/g, ","));
      document.getElementById("custom_graphics").setAttribute("href", custom_graphics);

      // Chart: Users Per Month
      createChart("usersPerMonthChart", "bar", {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          label: "Registrations per month in your community",
          data: users_per_month_arr,
          borderWidth: 1,
          borderColor: "#03afaf",
          backgroundColor: "#03afaf"
        }]
      }, { scales: { y: { beginAtZero: true } } });

      // Chart: School Buildings
      if (school_buildings.length) {
        createChart("schoolBuildingsChart", "doughnut", {
          labels: school_buildings.map(i => i.school_name),
          datasets: [{
            data: school_buildings.map(i => i.registered_school_parents),
            backgroundColor: generateColors(school_buildings.length)
          }]
        }, {
          cutout: "50%",
          plugins: {
            title: { display: true, text: "" },
            legend: { display: false, position: "bottom" },
            tooltip: {
              callbacks: {
                label: ctx => {
                  const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                  return `${ctx.label}: ${((ctx.raw / total) * 100).toFixed(2)}%`;
                }
              }
            }
          }
        });
      } else {
        document.getElementById("schoolBuildingsChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Process Logs for Top Charts
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const validPaths = ['/events', '/teen-slang', '/app-guide', '/video-games', '/parental-control', '/online-activities', '/offline-activities', '/sex-trafficking', '/post/'];
      const processLog = logs => logs.reduce((acc, { created_at, page_url, user, school_buildings_id }) => {
        if (!user || !user.first_name || !user.last_name ||
            (school_buildings_id && school_buildings_id.some(s => s?.id === 1)) ||
            !validPaths.some(p => page_url.includes(p))) return acc;
        const fullName = `${user.first_name} ${user.last_name}`.trim();
        const path = page_url.split('.com')[1]?.split('?')[0];
        if (path && created_at > thirtyDaysAgo) acc.pageCounts[path] = (acc.pageCounts[path] || 0) + 1;
        acc.userCounts[fullName] = (acc.userCounts[fullName] || 0) + 1;
        school_buildings_id?.forEach(b => { if (b?.school_name) acc.schoolCounts[b.school_name] = (acc.schoolCounts[b.school_name] || 0) + 1; });
        return acc;
      }, { userCounts: {}, pageCounts: {}, schoolCounts: {} });
      
      const filteredLog = processLog(log.filter(l => !(l.user?.school_buildings_id?.some(s => s?.id === 1))));
      const allLog = processLog(log);
      const topUsers = getTop(filteredLog.userCounts).map(({ key, count }) => ({ name: key, count }));
      const topPages = getTop(allLog.pageCounts).map(({ key, count }) => ({ url: key, count }));
      const topSchoolBuildings = getTop(allLog.schoolCounts)
        .filter(({ key }) => key !== "District Staff")
        .map(({ key, count }) => ({ school_name: key, count }));

      // Chart: Top Users
      if (topUsers.length > 1) {
        createChart("topUsersChart", "bar", {
          labels: topUsers.map(u => u.name),
          datasets: [{
            label: "Most Active Users",
            data: topUsers.map(u => u.count),
            backgroundColor: "#03afaf",
            borderColor: "#03afaf",
            borderWidth: 1
          }]
        }, { indexAxis: "y", scales: { x: { beginAtZero: true } } });
      } else {
        document.getElementById("topUsersChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Chart: Top Pages
      if (topPages.length) {
        createChart("topPagesChart", "bar", {
          labels: topPages.map(p => p.url),
          datasets: [{
            label: "Top Visited Pages",
            data: topPages.map(p => p.count),
            backgroundColor: "#03afaf",
            borderColor: "#007bff",
            borderWidth: 1
          }]
        }, { indexAxis: "y", scales: { x: { beginAtZero: true } } });
      } else {
        document.getElementById("topPagesChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Chart: Top School Buildings
      if (topSchoolBuildings.length) {
        const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);
        createChart("topSchoolBuildings", "doughnut", {
          labels: topSchoolBuildings.map(i => i.school_name),
          datasets: [{
            data: topSchoolBuildings.map(i => ((i.count / total) * 100).toFixed(2)),
            backgroundColor: generateColors(topSchoolBuildings.length),
            hoverOffset: 4
          }]
        }, {
          cutout: "50%",
          plugins: {
            tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw}%` } },
            title: { display: true, text: "Top School Buildings" },
            legend: { display: true, position: "bottom" }
          }
        });
      } else {
        document.getElementById("topSchoolBuildingsWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Feedback Testimonials
      let testimonials = "";
      feedback.forEach(({ positive_feedback, user, created_at, page_name }) => {
        const name = `${user?.first_name || ""} ${user?.last_name || ""}`;
        const schools = user?.school_buildings_id
          ?.filter(s => s?.school_name && s.school_name !== "District Staff")
          .map(s => s.school_name)
          .join(", ") || "";
        const date = new Date(created_at).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" });
        testimonials += `
          <div class="testimonial_card">
            <div class="feedback">"${positive_feedback}"</div>
            <p class="page_name">- ${page_name}</p>
            <div class="feedback_line-divider"></div>
            <div>
              <p class="name">${name}</p>
              <p class="schools">${schools}</p>
              <p class="created_at">${date}</p>
            </div>
          </div>`;
      });
      document.querySelector(".testimonial-list").innerHTML = testimonials;
      if (feedback.length > 3) {
        const btn = document.querySelector('.view-more_btn');
        btn.classList.remove("hide");
        btn.addEventListener("click", () => document.querySelector(".testimonial-list").classList.remove("max-height"));
      }

      // Download Feature
      document.getElementById("download")?.addEventListener("click", async () => {
        const dlData = await (await fetch(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/user/shortcode/${org}`)).json();
        const csv = "Email,First Name,Last Name,School Buildings\n" + dlData.users.map(user => {
          const schools = (user.school_buildings_id || [])
            .filter(b => b?.school_name)
            .map(b => b.school_name)
            .join(", ");
          return `"${user.email}","${user.first_name}","${user.last_name}","${schools}"`;
        }).join("\n");
        const blob = new Blob([csv], { type: "text/csv" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${dlData.organization.district_name} SmartSocial Parent List Export ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\//g, "-")}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      });

      // Time
      document.getElementById("time").textContent=(d=new Date(),m=d.toLocaleString("en-US",{month:"long"}),day=d.getDate(),y=d.getFullYear(),hr=d.getHours()%12||12,mi=(d.getMinutes()<10?"0":"")+d.getMinutes(),ap=d.getHours()<12?"AM":"PM",tz=d.toLocaleTimeString("en-US",{timeZoneName:"short"}).split(" ")[2],`${m} ${day}, ${y} ${hr}:${mi}${ap} ${tz}`);

      // Leader Board from API Top Users
      document.querySelector(".leader_board-wrapper").innerHTML += top_users.items.map((user, i) =>
        `<div class='leader_board-row'>
           <div>#${i + 1}</div>
           <div>${user.first_name} ${user.last_name}</div>
           <div>${user.school_buildings_id?.[0]?.school_name || ""}</div>
           <div>${user.points} points</div>
         </div>`
      ).join("");

      // Hide loaders
      document.querySelectorAll('.loader').forEach(e => e.classList.add('hide'));

      // Download Page PDF
      document.getElementById("screenshot").addEventListener("click", function(){
        document.querySelectorAll('.footer,.navbar5_component,.nav-wrapper').forEach(el => el.classList.add("hide"));
        document.querySelector(".view-more_btn")?.click();
        setTimeout(() => {
          html2canvas(document.body, {
            width: document.body.scrollWidth,
            height: document.body.scrollHeight,
            scrollX: 0,
            scrollY: 0,
            useCORS: true
          }).then(canvas => {
            const { jsPDF } = window.jspdf,
                  imgData = canvas.toDataURL("image/png"),
                  pdf = new jsPDF("p", "pt", [canvas.width, canvas.height]);
            pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
            pdf.save(`${district_name} Parent engagement dashboard download smartsocial.com ${new Date().toLocaleDateString("en-US", { year: "2-digit", month: "numeric", day: "numeric" }).replace(/\//g, ".")
            }.pdf`);
            document.querySelectorAll('.footer,.navbar5_component,.nav-wrapper').forEach(el => el.classList.remove("hide"));
          });
        }, 1000);
      });
    } catch (err) {
      console.error("Error:", err);
    }
  });
}