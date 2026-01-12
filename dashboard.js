if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // ═══════════════════════════════════════════════════════════════
      // MONOCHROMATIC TEAL PALETTE (Readable & Cohesive)
      // ═══════════════════════════════════════════════════════════════
      const colors = {
        primary: '#449997',
        dark: '#2D5A5A',
        darkMid: '#357A78',
        mid: '#5AADAB',
        light: '#7EC8C8',
        lighter: '#A3DADA',
        lightest: '#C8EBEB',
        text: '#2D5A5A',
        textLight: '#5A7A7A',
        background: '#FFFFFF'
      };

      // Monochromatic palette for multi-series (dark to light)
      const chartPalette = [
        '#449997',
        '#357A78',
        '#5AADAB',
        '#2D5A5A',
        '#7EC8C8',
        '#3D6B6B',
        '#6BBAB8',
        '#4A8A8A',
        '#8CD0CE',
        '#5C9E9C'
      ];

      // ═══════════════════════════════════════════════════════════════
      // GLOBAL APEX DEFAULTS
      // ═══════════════════════════════════════════════════════════════
      window.Apex = {
        chart: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontSize: '13px' }
        },
        grid: {
          borderColor: '#e8f0f0',
          strokeDashArray: 4
        },
        colors: chartPalette
      };

      // ═══════════════════════════════════════════════════════════════
      // HELPERS
      // ═══════════════════════════════════════════════════════════════
      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      const getTop = items =>
        Object.entries(items)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

      // ═══════════════════════════════════════════════════════════════
      // DATA FETCHING
      // ═══════════════════════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════════════════════
      // CHART 1: REGISTRATIONS PER MONTH (Area Chart - Clean)
      // ═══════════════════════════════════════════════════════════════
      const usersPerMonthEl = document.getElementById("usersPerMonthChart");
      if (usersPerMonthEl) {
        new ApexCharts(usersPerMonthEl, {
          chart: {
            type: 'area',
            height: 340,
            background: 'transparent',
            zoom: { enabled: false }
          },
          series: [{
            name: 'Registrations',
            data: users_per_month_arr
          }],
          xaxis: {
            categories: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            labels: {
              style: { colors: colors.text, fontSize: '12px', fontWeight: 500 }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
          },
          yaxis: {
            labels: {
              style: { colors: colors.textLight, fontSize: '11px' },
              formatter: val => Math.round(val).toLocaleString()
            }
          },
          stroke: {
            curve: 'smooth',
            width: 3
          },
          fill: {
            type: 'gradient',
            gradient: {
              shadeIntensity: 0.4,
              opacityFrom: 0.5,
              opacityTo: 0.1,
              stops: [0, 90, 100]
            }
          },
          colors: [colors.primary],
          dataLabels: { enabled: false },
          markers: {
            size: 4,
            colors: [colors.primary],
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: { size: 6 }
          },
          tooltip: {
            y: { formatter: val => `${val.toLocaleString()} registrations` }
          }
        }).render();
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 2: SCHOOL BUILDINGS (Donut - Clean & Readable)
      // ═══════════════════════════════════════════════════════════════
      if (school_buildings.length) {
        const schoolBuildingsEl = document.getElementById("schoolBuildingsChart");
        if (schoolBuildingsEl) {
          const total = school_buildings.reduce((sum, i) => sum + i.registered_school_parents, 0);
          
          new ApexCharts(schoolBuildingsEl, {
            chart: {
              type: 'donut',
              height: 380,
              background: 'transparent'
            },
            series: school_buildings.map(i => i.registered_school_parents),
            labels: school_buildings.map(i => i.school_name),
            colors: chartPalette,
            plotOptions: {
              pie: {
                donut: {
                  size: '60%',
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text
                    },
                    value: {
                      show: true,
                      fontSize: '22px',
                      fontWeight: 700,
                      color: colors.primary,
                      formatter: val => parseInt(val).toLocaleString()
                    },
                    total: {
                      show: true,
                      label: 'Total',
                      fontSize: '13px',
                      color: colors.textLight,
                      formatter: () => total.toLocaleString()
                    }
                  }
                }
              }
            },
            stroke: { width: 2, colors: ['#fff'] },
            legend: {
              show: true,
              position: 'bottom',
              fontSize: '12px',
              fontWeight: 500,
              labels: { colors: colors.text },
              markers: { width: 10, height: 10, radius: 2 },
              itemMargin: { horizontal: 8, vertical: 4 },
              formatter: (name, opts) => {
                const val = opts.w.globals.series[opts.seriesIndex];
                const pct = ((val / total) * 100).toFixed(1);
                const shortName = name.length > 20 ? name.substring(0, 18) + '...' : name;
                return `${shortName} (${pct}%)`;
              }
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: val => {
                  const pct = ((val / total) * 100).toFixed(1);
                  return `${val.toLocaleString()} parents (${pct}%)`;
                }
              }
            }
          }).render();
        }
      } else {
        document.getElementById("schoolBuildingsChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // PROCESS LOGS
      // ═══════════════════════════════════════════════════════════════
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

      // ═══════════════════════════════════════════════════════════════
      // CHART 3: TOP USERS (Horizontal Bar - Labels Outside)
      // ═══════════════════════════════════════════════════════════════
      if (topUsers.length > 1) {
        const topUsersEl = document.getElementById("topUsersChart");
        if (topUsersEl) {
          new ApexCharts(topUsersEl, {
            chart: {
              type: 'bar',
              height: Math.max(300, topUsers.length * 38),
              background: 'transparent'
            },
            series: [{
              name: 'Activities',
              data: topUsers.map(u => u.count)
            }],
            xaxis: {
              categories: topUsers.map(u => u.name),
              labels: {
                style: { colors: colors.textLight, fontSize: '11px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { colors: colors.text, fontSize: '12px', fontWeight: 500 },
                maxWidth: 150
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '60%',
                dataLabels: { position: 'top' }
              }
            },
            fill: {
              type: 'solid',
              opacity: 0.9
            },
            colors: [colors.primary],
            dataLabels: {
              enabled: true,
              textAnchor: 'start',
              formatter: val => val.toLocaleString(),
              offsetX: 5,
              style: {
                colors: [colors.dark],
                fontSize: '12px',
                fontWeight: 600
              }
            },
            grid: {
              borderColor: '#e8f0f0',
              xaxis: { lines: { show: true } },
              yaxis: { lines: { show: false } }
            },
            tooltip: {
              y: { formatter: val => `${val.toLocaleString()} activities` }
            }
          }).render();
        }
      } else {
        document.getElementById("topUsersChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 4: TOP PAGES (Horizontal Bar - Labels Outside)
      // ═══════════════════════════════════════════════════════════════
      if (topPages.length) {
        const topPagesEl = document.getElementById("topPagesChart");
        if (topPagesEl) {
          new ApexCharts(topPagesEl, {
            chart: {
              type: 'bar',
              height: Math.max(300, topPages.length * 38),
              background: 'transparent'
            },
            series: [{
              name: 'Visits',
              data: topPages.map(p => p.count)
            }],
            xaxis: {
              categories: topPages.map(p => {
                // Clean URL for display
                let url = p.url.replace('/post/', '').replace(/-/g, ' ');
                return url.length > 22 ? url.substring(0, 20) + '...' : url;
              }),
              labels: {
                style: { colors: colors.textLight, fontSize: '11px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { colors: colors.text, fontSize: '11px', fontWeight: 500 },
                maxWidth: 160
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 4,
                barHeight: '60%',
                dataLabels: { position: 'top' }
              }
            },
            fill: {
              type: 'solid',
              opacity: 0.9
            },
            colors: [colors.mid],
            dataLabels: {
              enabled: true,
              textAnchor: 'start',
              formatter: val => val.toLocaleString(),
              offsetX: 5,
              style: {
                colors: [colors.dark],
                fontSize: '12px',
                fontWeight: 600
              }
            },
            grid: {
              borderColor: '#e8f0f0',
              xaxis: { lines: { show: true } },
              yaxis: { lines: { show: false } }
            },
            tooltip: {
              y: { formatter: val => `${val.toLocaleString()} visits` }
            }
          }).render();
        }
      } else {
        document.getElementById("topPagesChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 5: TOP SCHOOL BUILDINGS (Donut - Clean)
      // ═══════════════════════════════════════════════════════════════
      if (topSchoolBuildings.length) {
        const topSchoolBuildingsEl = document.getElementById("topSchoolBuildings");
        if (topSchoolBuildingsEl) {
          const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);
          
          new ApexCharts(topSchoolBuildingsEl, {
            chart: {
              type: 'donut',
              height: 380,
              background: 'transparent'
            },
            series: topSchoolBuildings.map(i => i.count),
            labels: topSchoolBuildings.map(i => i.school_name),
            colors: chartPalette,
            plotOptions: {
              pie: {
                donut: {
                  size: '60%',
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: '13px',
                      fontWeight: 600,
                      color: colors.text
                    },
                    value: {
                      show: true,
                      fontSize: '20px',
                      fontWeight: 700,
                      color: colors.primary,
                      formatter: val => {
                        const pct = ((parseInt(val) / total) * 100).toFixed(1);
                        return `${pct}%`;
                      }
                    },
                    total: {
                      show: true,
                      label: 'Total Activity',
                      fontSize: '12px',
                      color: colors.textLight,
                      formatter: () => total.toLocaleString()
                    }
                  }
                }
              }
            },
            stroke: { width: 2, colors: ['#fff'] },
            legend: {
              show: true,
              position: 'bottom',
              fontSize: '12px',
              fontWeight: 500,
              labels: { colors: colors.text },
              markers: { width: 10, height: 10, radius: 2 },
              itemMargin: { horizontal: 8, vertical: 4 },
              formatter: (name) => {
                return name.length > 22 ? name.substring(0, 20) + '...' : name;
              }
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: val => {
                  const pct = ((val / total) * 100).toFixed(1);
                  return `${val.toLocaleString()} visits (${pct}%)`;
                }
              }
            }
          }).render();
        }
      } else {
        document.getElementById("topSchoolBuildingsWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // FEEDBACK TESTIMONIALS
      // ═══════════════════════════════════════════════════════════════
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
        btn.addEventListener("click", () => {
            document.querySelector("#org_feedbacks_list").classList.remove("max-height");
            document.querySelector("#org_feedbacks_list_overlay").classList.remove("hide");
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
      
      // ═══════════════════════════════════════════════════════════════
      // DOWNLOAD FEATURE
      // ═══════════════════════════════════════════════════════════════
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
