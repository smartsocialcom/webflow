if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // =============================================
      // MODERN CHART CONFIGURATION
      // =============================================
      
      // Brand Colors
      const COLORS = {
        primary: '#449997',
        primaryLight: '#5bb8b6',
        primaryDark: '#367a78',
        text: '#435d60',
        textLight: '#6b8a8d',
        background: '#ffffff',
        gridLine: 'rgba(67, 93, 96, 0.08)',
        tooltipBg: '#2d4a4c',
      };

      // Modern color palette that complements the brand
      const CHART_PALETTE = [
        '#449997', // Primary teal
        '#5bb8b6', // Light teal
        '#7ecbc9', // Lighter teal
        '#367a78', // Dark teal
        '#6b8a8d', // Muted teal-gray
        '#89a5a7', // Soft sage
        '#4db6ac', // Bright teal
        '#26a69a', // Deep teal
        '#80cbc4', // Pastel teal
        '#b2dfdb', // Very light teal
        '#e0f2f1', // Near white teal
        '#00897b', // Bold teal
        '#00796b', // Forest teal
        '#004d40', // Very dark teal
        '#a7d7d5', // Soft aqua
      ];

      // Global Chart.js defaults for modern look
      Chart.defaults.font.family = "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif";
      Chart.defaults.font.size = 12;
      Chart.defaults.font.weight = '500';
      Chart.defaults.color = COLORS.text;
      Chart.defaults.plugins.tooltip.backgroundColor = COLORS.tooltipBg;
      Chart.defaults.plugins.tooltip.titleFont = { size: 13, weight: '600' };
      Chart.defaults.plugins.tooltip.bodyFont = { size: 12, weight: '400' };
      Chart.defaults.plugins.tooltip.padding = 12;
      Chart.defaults.plugins.tooltip.cornerRadius = 8;
      Chart.defaults.plugins.tooltip.displayColors = true;
      Chart.defaults.plugins.tooltip.boxPadding = 4;
      Chart.defaults.plugins.legend.labels.usePointStyle = true;
      Chart.defaults.plugins.legend.labels.pointStyle = 'circle';
      Chart.defaults.plugins.legend.labels.padding = 20;
      Chart.defaults.elements.bar.borderRadius = 6;
      Chart.defaults.elements.bar.borderSkipped = false;
      Chart.defaults.elements.arc.borderWidth = 0;
      Chart.defaults.animation.duration = 800;
      Chart.defaults.animation.easing = 'easeOutQuart';

      // Helpers
      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      // Create gradient for bar charts
      const createGradient = (ctx, isHorizontal = false) => {
        const gradient = isHorizontal 
          ? ctx.createLinearGradient(0, 0, ctx.canvas.width, 0)
          : ctx.createLinearGradient(0, ctx.canvas.height, 0, 0);
        gradient.addColorStop(0, COLORS.primary);
        gradient.addColorStop(1, COLORS.primaryLight);
        return gradient;
      };

      // Modern chart creation with enhanced options
      const createChart = (id, type, data, opts = {}) => {
        const canvas = document.getElementById(id);
        if (!canvas) return null;
        const ctx = canvas.getContext('2d');
        
        // Apply gradient to bar charts
        if (type === 'bar' && data.datasets) {
          data.datasets = data.datasets.map(dataset => ({
            ...dataset,
            backgroundColor: createGradient(ctx, opts.indexAxis === 'y'),
            hoverBackgroundColor: COLORS.primaryDark,
            borderRadius: 6,
            borderSkipped: false,
          }));
        }
        
        return new Chart(canvas, { type, data, options: opts });
      };

      const getTop = items =>
        Object.entries(items)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

      const generateColors = count => CHART_PALETTE.slice(0, Math.min(count, CHART_PALETTE.length));

      // Modern bar chart options
      const modernBarOptions = (horizontal = false) => ({
        indexAxis: horizontal ? 'y' : 'x',
        responsive: true,
        maintainAspectRatio: true,
        layout: {
          padding: { top: 10, bottom: 10, left: 10, right: 10 }
        },
        scales: {
          x: {
            beginAtZero: true,
            grid: {
              display: !horizontal,
              color: COLORS.gridLine,
              drawBorder: false,
            },
            border: { display: false },
            ticks: {
              color: COLORS.textLight,
              font: { size: 11, weight: '500' },
              padding: 8,
            },
          },
          y: {
            beginAtZero: true,
            grid: {
              display: horizontal,
              color: COLORS.gridLine,
              drawBorder: false,
            },
            border: { display: false },
            ticks: {
              color: COLORS.textLight,
              font: { size: 11, weight: '500' },
              padding: 8,
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            align: 'start',
            labels: {
              color: COLORS.text,
              font: { size: 12, weight: '600' },
              boxWidth: 12,
              boxHeight: 12,
              useBorderRadius: true,
              borderRadius: 3,
            },
          },
          tooltip: {
            backgroundColor: COLORS.tooltipBg,
            titleColor: '#ffffff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 10,
            titleFont: { size: 13, weight: '600' },
            bodyFont: { size: 12 },
            callbacks: {
              labelColor: () => ({
                backgroundColor: COLORS.primary,
                borderColor: COLORS.primary,
                borderRadius: 3,
              }),
            },
          },
        },
        interaction: {
          intersect: false,
          mode: 'index',
        },
      });

      // Modern doughnut chart options
      const modernDoughnutOptions = (showLegend = true, title = '') => ({
        responsive: true,
        maintainAspectRatio: true,
        cutout: '65%',
        layout: {
          padding: { top: 20, bottom: 20 }
        },
        plugins: {
          legend: {
            display: showLegend,
            position: 'bottom',
            labels: {
              color: COLORS.text,
              font: { size: 11, weight: '500' },
              padding: 16,
              usePointStyle: true,
              pointStyle: 'circle',
            },
          },
          title: {
            display: !!title,
            text: title,
            color: COLORS.text,
            font: { size: 14, weight: '600' },
            padding: { bottom: 20 },
          },
          tooltip: {
            backgroundColor: COLORS.tooltipBg,
            titleColor: '#ffffff',
            bodyColor: 'rgba(255, 255, 255, 0.85)',
            borderColor: 'rgba(255, 255, 255, 0.1)',
            borderWidth: 1,
            padding: 14,
            cornerRadius: 10,
          },
        },
        elements: {
          arc: {
            borderWidth: 3,
            borderColor: COLORS.background,
            hoverBorderColor: COLORS.background,
            hoverOffset: 8,
          },
        },
      });

      // =============================================
      // DATA FETCHING & PROCESSING
      // =============================================

      // Member & Data Fetch
      const member = await window.$memberstackDom.getCurrentMember();
      const org = searchParams.get("as_org") || member.data.customFields.organization;
      setText("copy_link", `https://${window.location.hostname}/events?org=${org}`);

      const { data } = await axios.get(
        `https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations/short_code/${org}`
      );
      const { total_students, parents: parentsCount, school_buildings, district_name, custom_graphics } = data.organization;
      const { feedback, top_users, users_per_month_arr, log } = data;

      setText("org_name", district_name);
      const formatNumber = n => Math.round(n).toLocaleString();
      const studentsGoal = total_students * 0.05; 
      setText("total_students", formatNumber(total_students));
      setText("community_registration_goal", formatNumber(studentsGoal));

      const updateImpactMetrics = (useStudentsGoal) => {
        const v = useStudentsGoal ? studentsGoal : parentsCount;
        setText("parents", formatNumber(v));
        setText("compared_engagement", formatNumber(v / (total_students * 0.001)));
        setText("monthly_engagement", formatNumber(v * 4));
        setText("bullying_avoided", formatNumber(v * 0.15));
        setText("screen_avoided", formatNumber(v * 0.09));
        setText("abuse_avoided", formatNumber(v * 0.088));
        setText("total_incidents", formatNumber(v * (0.15 + 0.09 + 0.088)));
        const p = v / (studentsGoal) * 100;
        if (p > 25) {
          setText("percentage_to_goal", Math.round(p) + "%");
          document.getElementById("percentage_to_goal").classList.remove("small");
        }
      };
      updateImpactMetrics(false);
      setText("feedback_count", formatNumber(feedback.length));
      setText("total_students_absent", formatNumber(studentsGoal));
      setText("estimated_funding", formatNumber(studentsGoal * 100));
      document.getElementById("custom_graphics").href = custom_graphics;
      
      // Toggle
      (() => {
        const toggleInput = document.getElementById("use_goal_toggle");
        if (!toggleInput) return;
        const sync = () => updateImpactMetrics(toggleInput.checked);
        toggleInput.addEventListener("change", sync);
        sync();
      })();

      // =============================================
      // CHARTS
      // =============================================

      // Chart: Users Per Month (Vertical Bar)
      (() => {
        const canvas = document.getElementById("usersPerMonthChart");
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        const gradient = ctx.createLinearGradient(0, canvas.height || 400, 0, 0);
        gradient.addColorStop(0, COLORS.primary);
        gradient.addColorStop(1, COLORS.primaryLight);

        new Chart(canvas, {
          type: 'bar',
          data: {
            labels: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            datasets: [{
              label: "Registrations per month in your community",
              data: users_per_month_arr,
              backgroundColor: gradient,
              hoverBackgroundColor: COLORS.primaryDark,
              borderRadius: 8,
              borderSkipped: false,
              barThickness: 'flex',
              maxBarThickness: 50,
            }]
          },
          options: {
            ...modernBarOptions(false),
            scales: {
              ...modernBarOptions(false).scales,
              x: {
                ...modernBarOptions(false).scales.x,
                grid: { display: false },
              },
              y: {
                ...modernBarOptions(false).scales.y,
                grid: {
                  color: COLORS.gridLine,
                  drawBorder: false,
                },
              },
            },
          },
        });
      })();

      // Chart: School Buildings (Doughnut)
      if (school_buildings.length) {
        const canvas = document.getElementById("schoolBuildingsChart");
        if (canvas) {
          new Chart(canvas, {
            type: 'doughnut',
            data: {
              labels: school_buildings.map(i => i.school_name),
              datasets: [{
                data: school_buildings.map(i => i.registered_school_parents),
                backgroundColor: generateColors(school_buildings.length),
                hoverOffset: 12,
              }]
            },
            options: {
              ...modernDoughnutOptions(false, ''),
              plugins: {
                ...modernDoughnutOptions(false).plugins,
                legend: { display: false },
                tooltip: {
                  ...modernDoughnutOptions(false).plugins.tooltip,
                  callbacks: {
                    label: ctx => {
                      const total = ctx.dataset.data.reduce((a, b) => a + b, 0);
                      const percentage = ((ctx.raw / total) * 100).toFixed(1);
                      return `${ctx.label}: ${ctx.raw.toLocaleString()} (${percentage}%)`;
                    }
                  }
                }
              }
            },
          });
        }
      } else {
        document.getElementById("schoolBuildingsChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Process Logs for Top Charts
      const thirtyDaysAgo = Date.now() - 30 * 24 * 60 * 60 * 1000;
      const validPaths = ['/events', '/teen-slang', '/app-guide', '/video-games', '/parental-control', '/online-activities', '/offline-activities', '/sex-trafficking', '/post/'];
      const processLog = logs => logs.reduce((acc, { created_at, page_url, user, school_buildings_id }) => {
        if (!user || !user.first_name ||
            (school_buildings_id && school_buildings_id.some(s => s?.id === 1)) ||
            !validPaths.some(p => page_url.includes(p))) return acc;
        const fullName = user.last_name ? `${user.first_name} ${user.last_name}`.trim() : user.first_name;
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

      // Chart: Top Users (Horizontal Bar)
      if (topUsers.length > 1) {
        const canvas = document.getElementById("topUsersChart");
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const gradient = ctx.createLinearGradient(0, 0, canvas.width || 400, 0);
          gradient.addColorStop(0, COLORS.primary);
          gradient.addColorStop(1, COLORS.primaryLight);

          new Chart(canvas, {
            type: 'bar',
            data: {
              labels: topUsers.map(u => u.name),
              datasets: [{
                label: "Most Active Users",
                data: topUsers.map(u => u.count),
                backgroundColor: gradient,
                hoverBackgroundColor: COLORS.primaryDark,
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 28,
              }]
            },
            options: {
              ...modernBarOptions(true),
              scales: {
                ...modernBarOptions(true).scales,
                y: {
                  ...modernBarOptions(true).scales.y,
                  grid: { display: false },
                  ticks: {
                    ...modernBarOptions(true).scales.y.ticks,
                    callback: function(value, index) {
                      const label = this.getLabelForValue(value);
                      return label.length > 20 ? label.substring(0, 18) + '...' : label;
                    }
                  }
                },
                x: {
                  ...modernBarOptions(true).scales.x,
                  grid: {
                    color: COLORS.gridLine,
                    drawBorder: false,
                  },
                },
              },
            },
          });
        }
      } else {
        document.getElementById("topUsersChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Chart: Top Pages (Horizontal Bar)
      if (topPages.length) {
        const canvas = document.getElementById("topPagesChart");
        if (canvas) {
          const ctx = canvas.getContext('2d');
          const gradient = ctx.createLinearGradient(0, 0, canvas.width || 400, 0);
          gradient.addColorStop(0, COLORS.primary);
          gradient.addColorStop(1, COLORS.primaryLight);

          new Chart(canvas, {
            type: 'bar',
            data: {
              labels: topPages.map(p => p.url),
              datasets: [{
                label: "Top Visited Pages",
                data: topPages.map(p => p.count),
                backgroundColor: gradient,
                hoverBackgroundColor: COLORS.primaryDark,
                borderRadius: 6,
                borderSkipped: false,
                barThickness: 'flex',
                maxBarThickness: 28,
              }]
            },
            options: {
              ...modernBarOptions(true),
              scales: {
                ...modernBarOptions(true).scales,
                y: {
                  ...modernBarOptions(true).scales.y,
                  grid: { display: false },
                  ticks: {
                    ...modernBarOptions(true).scales.y.ticks,
                    callback: function(value, index) {
                      const label = this.getLabelForValue(value);
                      return label.length > 25 ? label.substring(0, 23) + '...' : label;
                    }
                  }
                },
                x: {
                  ...modernBarOptions(true).scales.x,
                  grid: {
                    color: COLORS.gridLine,
                    drawBorder: false,
                  },
                },
              },
            },
          });
        }
      } else {
        document.getElementById("topPagesChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // Chart: Top School Buildings (Doughnut)
      if (topSchoolBuildings.length) {
        const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);
        const canvas = document.getElementById("topSchoolBuildings");
        if (canvas) {
          new Chart(canvas, {
            type: 'doughnut',
            data: {
              labels: topSchoolBuildings.map(i => i.school_name),
              datasets: [{
                data: topSchoolBuildings.map(i => i.count),
                backgroundColor: generateColors(topSchoolBuildings.length),
                hoverOffset: 12,
              }]
            },
            options: {
              ...modernDoughnutOptions(true, 'Top School Buildings'),
              plugins: {
                ...modernDoughnutOptions(true, 'Top School Buildings').plugins,
                tooltip: {
                  ...modernDoughnutOptions(true).plugins.tooltip,
                  callbacks: {
                    label: ctx => {
                      const percentage = ((ctx.raw / total) * 100).toFixed(1);
                      return `${ctx.label}: ${ctx.raw.toLocaleString()} visits (${percentage}%)`;
                    }
                  }
                }
              }
            },
          });
        }
      } else {
        document.getElementById("topSchoolBuildingsWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // =============================================
      // TESTIMONIALS & OTHER FEATURES
      // =============================================

      // Feedback Testimonials
      let testimonials = "";
      feedback.forEach(({ positive_feedback, user, created_at, page_name }) => {
        const name = user?.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
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
      document.querySelector("#org_feedbacks_list").innerHTML = testimonials;
      if (feedback.length > 3) {
        const btn = document.querySelector('.view-more_btn');
        btn.classList.remove("hide");
        document.querySelector("#org_feedbacks_list_overlay").classList.remove("hide");
        btn.addEventListener("click", () => {
            document.querySelector("#org_feedbacks_list").classList.remove("max-height");
        });
      }
      
      // Other Feedbacks List
      const loadOtherBtn = document.getElementById("load_other_feedbacks");
      if (loadOtherBtn) loadOtherBtn.addEventListener("click", async () => {
        loadOtherBtn.remove();
        const { data } = await axios.get(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/feedback/not_org/${org}`);
        document.getElementById("other_feedbacks_list").innerHTML = data.map(({ positive_feedback, page_name, created_at, organization_info }) => `
          <div class="testimonial_card">
            <div class="feedback">"${positive_feedback}"</div>
            <p class="page_name">- ${page_name}</p>
            <div class="feedback_line-divider"></div>
            <div>
              <p class="name">${organization_info.district_name}</p>
              <p class="created_at">${new Date(created_at).toLocaleDateString("en-US", { year: "numeric", month: "2-digit", day: "2-digit" })}</p>
            </div>
          </div>`).join("");
      });
      
      // Download Feature
      document.getElementById("download")?.addEventListener("click", async () => {
        const dlData = await (await fetch(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/user/shortcode/${org}`)).json();
        const csv = "Email,First Name,Last Name,Mobile Phone,School Buildings\n" + dlData.users.map(user => {
          const schools = (user.school_buildings_id || [])
            .filter(b => b?.school_name)
            .map(b => b.school_name)
            .join(", ");
          return `"${user.email}","${user.first_name}","${user.last_name || ''}","${user.mobile_phone || ''}","${schools}"`;
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
           <div>${user.last_name ? `${user.first_name} ${user.last_name}` : user.first_name}</div>
           <div>${user.school_buildings_id?.[0]?.school_name || ""}</div>
           <div>${user.points} points</div>
         </div>`
      ).join("");

      // Hide loaders
      document.querySelectorAll('.loader').forEach(e => e.classList.add('hide'));

      // Download Page PDF
      document.getElementById("screenshot").addEventListener("click",()=>{
        document.querySelectorAll('.footer,.navbar5_component,.nav-wrapper').forEach(e=>e.classList.add("hide"));
        setTimeout(()=>{
          const scale = Math.min(2, 2400/document.body.scrollWidth);
          html2canvas(document.body,{width:document.body.scrollWidth,height:document.body.scrollHeight,scrollX:0,scrollY:0,useCORS:!0,scale,backgroundColor:'#fff'}).then(c=>{
                        const {jsPDF} = window.jspdf;
            const pdf = new jsPDF("p","pt","a4");
            const [pageWidth,pageHeight] = [pdf.internal.pageSize.getWidth(),pdf.internal.pageSize.getHeight()];
            const ratio = Math.min(pageWidth/c.width,pageHeight/c.height) * 2;
            const [scaledWidth,scaledHeight] = [c.width*ratio,c.height*ratio];
            const pagesNeeded = Math.ceil(scaledHeight/pageHeight);
            
            for(let i=0;i<pagesNeeded;i++){
              if(i>0)pdf.addPage();
              const sourceY = i*pageHeight/ratio;
              const sourceHeight = Math.min(pageHeight/ratio,c.height-sourceY);
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d');
              tempCanvas.width = c.width;
              tempCanvas.height = sourceHeight;
              tempCtx.drawImage(c,0,sourceY,c.width,sourceHeight,0,0,c.width,sourceHeight);
              pdf.addImage(tempCanvas.toDataURL("image/jpeg",0.4),"JPEG",(pageWidth-scaledWidth)/2,0,scaledWidth,sourceHeight*ratio,undefined,'MEDIUM');
            }
            pdf.save(`${district_name} Parent engagement dashboard download smartsocial.com ${new Date().toLocaleDateString("en-US",{year:"2-digit",month:"numeric",day:"numeric"}).replace(/\//g,".")}.pdf`);
            document.querySelectorAll('.footer,.navbar5_component,.nav-wrapper').forEach(e=>e.classList.remove("hide"));
          });
        },1e3);
      });
    } catch (err) {
      console.error("Error:", err);
      document.querySelectorAll('.failed_loader').forEach(e => e.classList.remove('hide'));
      document.querySelectorAll('.loader').forEach(e => e.classList.add('hide'));
      axios.post("https://hook.us1.make.com/rif68igkkl1qju5ez06amm5svce3f89t",{memberid:memberData.id});
    }
  });
}
