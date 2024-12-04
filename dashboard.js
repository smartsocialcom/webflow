if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
  try {
    const member = await window.$memberstackDom.getCurrentMember();
    const org = member.data.customFields.organization;
    document.getElementById("copy_link").textContent = `https://${window.location.hostname}/members?org=${org}`;

    const { data } = await axios.get(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations/short_code/${org}`);
    const { total_students, parents: parentsCount, school_buildings } = data.organization;
    const studentsLoginLog = data.students_login_log;
    const feedback = data.feedback;

    document.getElementById("total_students").textContent = total_students.toLocaleString();
    document.getElementById("community_registration_goal").textContent = Math.round(total_students * 0.05).toLocaleString();
    document.getElementById("parents").textContent = parentsCount;
    document.getElementById("percentage_to_goal").textContent = ((parentsCount / (total_students * 0.05)) * 100).toFixed(1);
    document.getElementById("compared_engagement").textContent = (parentsCount / (total_students * 0.001)).toFixed(1);
    document.getElementById("monthly_engagement").textContent = (parentsCount * 4).toLocaleString();
    document.getElementById("bullying_avoided").textContent = (parentsCount * 0.15).toFixed(0);
    document.getElementById("screen_avoided").textContent = (parentsCount * 0.09).toFixed(0);
    document.getElementById("abuse_avoided").textContent = (parentsCount * 0.088).toFixed(0);
    document.getElementById("total_incidents").textContent = (parentsCount * (0.15 + 0.09 + 0.088)).toFixed(0);

    if (data.organization.student_access === true) document.getElementById("student_registration_links_lock").classList.add("hide");
    const getTop = (items) => Object.entries(items).map(([key, count]) => ({ key, count })).sort((a, b) => b.count - a.count).slice(0, 10);
  
    // document.getElementById("custom_graphics").setAttribute("href", data.organization.custom_graphics);
    const generateColors = (count) => ["#EF476F", "#FFD166", "#06D6A0", "#118AB2", "#073B4C", "#FFC6FF", "#9BF6FF", "#A0C4FF", "#BDB2FF", "#FFADAD", "#F94144", "#F3722C", "#F8961E", "#F9C74F", "#90BE6D", "#277DA1", "#577590", "#4D908E", "#43AA8B", "#F9844A", "#8338EC", "#3A86FF", "#EF233C", "#FF6D00", "#FFD500", "#06D6A0", "#118AB2", "#073B4C", "#FFD166", "#EF476F"].slice(0, count);

    new Chart(document.getElementById("usersPerMonthChart"), {
      type: "bar",
      data: {
        labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [{
          label: "Registrations per month in your community",
          data: data.users_per_month_arr,
          borderWidth: 1,
          borderColor: "#03afaf",
          backgroundColor: "#03afaf"
        }]
      },
      options: { scales: { y: { beginAtZero: true } } }
    });
    if(school_buildings.length){
      new Chart(document.getElementById("schoolBuildingsChart"), {
        type: "doughnut",
        data: { 
          labels: school_buildings.map(item => item.school_name), 
          datasets: [{ 
            data: school_buildings.map(item => item.registered_school_parents), 
            backgroundColor: generateColors(school_buildings.length), 
          }] 
        },
        options: { 
          cutout: "50%", 
          plugins: { 
            title: { display: true, text: "" },
            legend: { display: false, position: "bottom" },
            tooltip: {
              callbacks: {
                label: function(context) {
                  let total = context.dataset.data.reduce((a, b) => a + b, 0);
                  let percentage = (context.raw / total * 100).toFixed(2) + '%';
                  return context.label + ': ' + percentage;
                }
              }
            }
          } 
        }
      });
    } else {
      document.getElementById("schoolBuildingsChartWrapper").innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated as more parents access. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> to get more parents involved so this graph has accurate data.</h4></div>`
    }
    const loginsPerMonth = Array(12).fill(0);
    studentsLoginLog.forEach(studentLog => loginsPerMonth[new Date(studentLog.created_at).getMonth()]++);

    if (loginsPerMonth.length){
      new Chart(document.getElementById("studentLoginsPerMonthChart"), {
        type: "bar",
        data: {
          labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
          datasets: [{
            label: "Student Logins per month in your community",
            data: loginsPerMonth,
            backgroundColor: "#03afaf"
          }]
        },
        options: { scales: { y: { beginAtZero: true } } }
      });
    } else {
      document.getElementById("studentLoginsPerMonthChartWrapper").innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated as more parents access. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> to get more parents involved so this graph has accurate data.</h4></div>`
    }
    if (studentsLoginLog.length) {
      const loginData = studentsLoginLog.reduce((acc, { _school_buildings }) => {
        const name = _school_buildings?.school_name;
        if (name) acc[name] = (acc[name] || 0) + 1;
        return acc;
      }, {});
    
      new Chart(document.getElementById("studentLoginsPerBuilding"), {
        type: "doughnut",
        data: {
          labels: Object.keys(loginData),
          datasets: [{
            data: Object.values(loginData),
            backgroundColor: generateColors(studentsLoginLog.length)
          }]
        },
        options: {
          cutout: "50%",
          plugins: {
            title: { display: true, text: "" },
            legend: { display: true, position: "bottom" },
            tooltip: {
              callbacks: {
                label: ({ raw, dataset }) => {
                  const total = dataset.data.reduce((a, b) => a + b, 0);
                  return `${raw}: ${(raw / total * 100).toFixed(2)}%`;
                }
              }
            }
          }
        }
      });
    } else {
      document.getElementById("studentLoginsPerBuildingWrapper").innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated as more parents access. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> to get more parents involved so this graph has accurate data.</h4></div>`
    }

    //Top Users, Pages, Active Schoolbuildings
    const thirtyDaysAgo = Date.now() - (30 * 24 * 60 * 60 * 1000);
    const validPaths = [
      '/events', '/teen-slang', '/app-guide', '/video-games', 
      '/parental-control', '/online-activities', '/offline-activities', 
      '/sex-trafficking', '/post/'
    ];
    
    const processLog = (data) => data.reduce((acc, { created_at, page_url, user, school_buildings_id }) => {
      if (!user || !user.first_name || !user.last_name || 
          (school_buildings_id && school_buildings_id.some(s => s && s.id === 1)) || 
          !validPaths.some(path => page_url.includes(path))) return acc;
    
      const fullName = `${user.first_name} ${user.last_name}`.trim();
      const path = page_url.split('.com')[1]?.split('?')[0] || null;
    
      if (path && created_at > thirtyDaysAgo) acc.pageCounts[path] = (acc.pageCounts[path] || 0) + 1;
      acc.userCounts[fullName] = (acc.userCounts[fullName] || 0) + 1;
    
      school_buildings_id?.forEach(b => {
        if (b?.school_name) acc.schoolCounts[b.school_name] = (acc.schoolCounts[b.school_name] || 0) + 1;
      });
    
      return acc;
    }, { userCounts: {}, pageCounts: {}, schoolCounts: {} });
    
    const filteredLogData = data.log.filter(l => !(l.user?.school_buildings_id?.some(s => s && s.id === 1)));
    const log = processLog(data.log);
    const filteredLog = processLog(filteredLogData);    

    const topUsers = getTop(filteredLog.userCounts).map(({ key, count }) => ({ name: key, count }));
    const topPages = getTop(log.pageCounts).map(({ key, count }) => ({ url: key, count }));
    const topSchoolBuildings = getTop(log.schoolCounts).filter(({ key }) => key !== "District Staff").map(({ key, count }) => ({ school_name: key, count }));
    if (topUsers.length > 1) {
      new Chart(document.getElementById('topUsersChart'), {
        type: 'bar',
        data: {
          labels: topUsers.map(u => u.name),
          datasets: [{ label: 'Most Active Users', data: topUsers.map(u => u.count), backgroundColor: '#03afaf', borderColor: '#03afaf', borderWidth: 1 }]
        },
        options: {
          indexAxis: 'y',
          scales: { x: { beginAtZero: true } }
        }
      });
    } else {
      document.getElementById("topUsersChartWrapper").innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated as more parents access. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> to get more parents involved so this graph has accurate data.</h4></div>`
    }

    if (topPages.length) {
      new Chart(document.getElementById('topPagesChart'), {
        type: 'bar',
        data: {
          labels: topPages.map(p => p.url),
          datasets: [{ label: 'Top Visited Pages', data: topPages.map(p => p.count), backgroundColor: '#03afaf', borderColor: '#007bff', borderWidth: 1 }]
        },
        options: {
          indexAxis: 'y',
          scales: { x: { beginAtZero: true } }
        }
      });
    } else {
      document.getElementById("topPagesChartWrapper").innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated as more parents access. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> to get more parents involved so this graph has accurate data.</h4></div>`
    }

    if (topSchoolBuildings.length) {
      new Chart(document.getElementById("topSchoolBuildings"), {
        type: "doughnut",
        data: {
          labels: topSchoolBuildings.map(item => item.school_name),
          datasets: [{
            data: topSchoolBuildings.map(item => (item.count / topSchoolBuildings.reduce((sum, item) => sum + item.count, 0) * 100).toFixed(2)),
            backgroundColor: generateColors(topSchoolBuildings.length),
            hoverOffset: 4
          }]
        },
        options: {
          cutout: "50%",
          plugins: {
            tooltip: {
              callbacks: {
                label: (tooltipItem) => `${tooltipItem.label}: ${tooltipItem.raw}%`
              }
            },
            title: {
              display: true,
              text: 'Top School Buildings'
            },
            legend: {
              display: true,
              position: "bottom"
            }
          }
        }
      });
    } else {
      document.getElementById("topSchoolBuildingsWrapper").innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated as more parents access. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> to get more parents involved so this graph has accurate data.</h4></div>`
    }

    const script = document.createElement('script');
    script.defer = true;
    script.src = "https://cdn.jsdelivr.net/npm/@finsweet/attributes-copyclip@1/copyclip.js";
    document.head.appendChild(script);
    document.getElementById('student_pin_list').innerHTML = school_buildings.map(school => `<a fs-copyclip-text="https://smartsocial.com/students?pin=${school.student_pin_code}" fs-copyclip-element="click" fs-copyclip-message="Link Copied!" href="#" class="link-list w-button">${school.school_name}<span class="pincode">Pincode: ${school.student_pin_code}</span></a>`).join(''); // List School Buildings Pincodes
    
    const testimonialList = document.querySelector(".testimonial-list");
    feedback.forEach(({ positive_feedback, user, created_at, page_name }) => {
      const firstName = user?.first_name || "";
      const lastName = user?.last_name || "";
      const schoolNames = user?.school_buildings_id
        ?.filter(s => s?.school_name && s.school_name !== "District Staff")
        .map(s => s.school_name)
        .join(", ") || "";
      const formattedDate = new Date(created_at).toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' });
    
      testimonialList.innerHTML += `
        <div class="testimonial_card">
          <div class="feedback">"${positive_feedback}"</div>
          <p class="page_name">- ${page_name}</p>
          <div class="feedback_line-divider"></div>
          <div>
           
            <p class="name">${firstName} ${lastName}</p>
            <p class="schools">${schoolNames}</p>
            <p class="created_at">${formattedDate}</p>
          </div>
        </div>`;
    });
    if (feedback.length > 3) {
      document.querySelector('.view-more_btn').classList.remove('hide');
      document.querySelector('.view-more_btn').addEventListener('click', () => {
        document.querySelector('.testimonial-list').classList.remove('max-height');
      });
      
    }

    // document.getElementById("download").addEventListener("click", async () => {
    //   const data = await (await fetch(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/user/shortcode/${org}`)).json();
    //   const csv = "Email,First Name,Last Name,School Buildings\n" + data.users.map(user => {
    //     const schoolBuildings = (user.school_buildings_id || []).filter(b => b && b.school_name).map(b => b.school_name).join(', ');
    //     return `"${user.email}","${user.first_name}","${user.last_name}","${schoolBuildings}"`;
    //   }).join("\n");
      
    //   const blob = new Blob([csv], { type: "text/csv" });
    //   const url = URL.createObjectURL(blob);
    //   const a = document.createElement("a");
    //   a.href = url;
    //   a.download = `${data.organization.district_name} SmartSocial Parent List Export ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' }).replace(/\//g, '-')}.csv`;
    //   document.body.appendChild(a);
    //   a.click();
    //   document.body.removeChild(a);
    //   URL.revokeObjectURL(url);
    // });
    
    document.getElementById('close').click();
  } catch (error) {
    console.error("Error:", error);
  }
  });
}