if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // Color Palette
      const colors = {
        primary: '#449997',
        primaryLight: '#6AB5B3',
        primaryDark: '#357A78',
        text: '#435d60',
        accent1: '#F4A261',
        accent2: '#E76F51',
        accent3: '#2A9D8F',
        accent4: '#264653',
        background: '#FFFFFF'
      };

      // Chart color palette for multi-series
      const chartPalette = [
        '#449997', '#2A9D8F', '#264653', '#F4A261', '#E76F51',
        '#6AB5B3', '#357A78', '#E9C46A', '#8AB17D', '#287271',
        '#5E9B9A', '#3D5A5A', '#D4A373', '#BC6C47', '#4A9D9B'
      ];

      // Global ApexCharts defaults
      window.Apex = {
        chart: {
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif',
          toolbar: { show: false },
          animations: {
            enabled: true,
            easing: 'easeinout',
            speed: 800,
            animateGradually: { enabled: true, delay: 150 },
            dynamicAnimation: { enabled: true, speed: 350 }
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontSize: '13px' },
          y: { formatter: val => val?.toLocaleString() }
        },
        grid: {
          borderColor: '#e8eef0',
          strokeDashArray: 4
        },
        colors: chartPalette
      };

      // Helpers
      const setText = (id, txt) => {
        const el = document.getElementById(id);
        if (el) el.textContent = txt;
      };

      const getTop = items =>
        Object.entries(items)
          .map(([key, count]) => ({ key, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

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
      // Format numbers as integers with thousands separators, no decimals
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

      // Chart: Users Per Month (Bar Chart)
      const usersPerMonthEl = document.getElementById("usersPerMonthChart");
      if (usersPerMonthEl) {
        new ApexCharts(usersPerMonthEl, {
          chart: {
            type: 'bar',
            height: 350,
            background: 'transparent'
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
              style: { colors: colors.text, fontSize: '12px' },
              formatter: val => Math.round(val).toLocaleString()
            }
          },
          plotOptions: {
            bar: {
              borderRadius: 8,
              columnWidth: '60%',
              distributed: false
            }
          },
          fill: {
            type: 'gradient',
            gradient: {
              shade: 'light',
              type: 'vertical',
              shadeIntensity: 0.2,
              gradientToColors: [colors.primaryLight],
              inverseColors: false,
              opacityFrom: 1,
              opacityTo: 0.85,
              stops: [0, 100]
            }
          },
          colors: [colors.primary],
          dataLabels: { enabled: false },
          tooltip: {
            y: { formatter: val => `${val.toLocaleString()} registrations` }
          }
        }).render();
      }

      // Chart: School Buildings (Donut Chart)
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
            colors: chartPalette.slice(0, school_buildings.length),
            plotOptions: {
              pie: {
                donut: {
                  size: '65%',
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      offsetY: -10
                    },
                    value: {
                      show: true,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: colors.primary,
                      offsetY: 5,
                      formatter: val => `${((val / total) * 100).toFixed(1)}%`
                    },
                    total: {
                      show: true,
                      label: 'Total',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.text,
                      formatter: () => total.toLocaleString()
                    }
                  }
                }
              }
            },
            stroke: { width: 2, colors: ['#fff'] },
            legend: {
              show: false,
              position: 'bottom',
              fontSize: '13px',
              labels: { colors: colors.text },
              markers: { radius: 4 }
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: (val, { seriesIndex }) => {
                  const pct = ((val / total) * 100).toFixed(1);
                  return `${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          }).render();
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
        const topUsersEl = document.getElementById("topUsersChart");
        if (topUsersEl) {
          new ApexCharts(topUsersEl, {
            chart: {
              type: 'bar',
              height: Math.max(300, topUsers.length * 40),
              background: 'transparent'
            },
            series: [{
              name: 'Activity',
              data: topUsers.map(u => u.count)
            }],
            xaxis: {
              categories: topUsers.map(u => u.name),
              labels: {
                style: { colors: colors.text, fontSize: '12px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { colors: colors.text, fontSize: '12px', fontWeight: 500 },
                maxWidth: 160
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 6,
                barHeight: '65%',
                distributed: false,
                dataLabels: { position: 'top' }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.15,
                gradientToColors: [colors.primaryLight],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 0.9,
                stops: [0, 100]
              }
            },
            colors: [colors.primary],
            dataLabels: {
              enabled: true,
              textAnchor: 'start',
              style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 },
              formatter: val => val.toLocaleString(),
              offsetX: 5
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

      // Chart: Top Pages (Horizontal Bar)
      if (topPages.length) {
        const topPagesEl = document.getElementById("topPagesChart");
        if (topPagesEl) {
          new ApexCharts(topPagesEl, {
            chart: {
              type: 'bar',
              height: Math.max(300, topPages.length * 40),
              background: 'transparent'
            },
            series: [{
              name: 'Visits',
              data: topPages.map(p => p.count)
            }],
            xaxis: {
              categories: topPages.map(p => p.url.length > 30 ? p.url.substring(0, 30) + '...' : p.url),
              labels: {
                style: { colors: colors.text, fontSize: '12px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { colors: colors.text, fontSize: '11px', fontWeight: 500 },
                maxWidth: 180
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 6,
                barHeight: '65%',
                distributed: false,
                dataLabels: { position: 'top' }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.15,
                gradientToColors: [colors.accent3],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 0.9,
                stops: [0, 100]
              }
            },
            colors: [colors.accent3],
            dataLabels: {
              enabled: true,
              textAnchor: 'start',
              style: { colors: ['#fff'], fontSize: '11px', fontWeight: 600 },
              formatter: val => val.toLocaleString(),
              offsetX: 5
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

      // Chart: Top School Buildings (Donut)
      if (topSchoolBuildings.length) {
        const topSchoolBuildingsEl = document.getElementById("topSchoolBuildings");
        if (topSchoolBuildingsEl) {
          const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);
          new ApexCharts(topSchoolBuildingsEl, {
            chart: {
              type: 'donut',
              height: 400,
              background: 'transparent'
            },
            series: topSchoolBuildings.map(i => i.count),
            labels: topSchoolBuildings.map(i => i.school_name),
            colors: chartPalette.slice(0, topSchoolBuildings.length),
            plotOptions: {
              pie: {
                donut: {
                  size: '65%',
                  labels: {
                    show: true,
                    name: {
                      show: true,
                      fontSize: '14px',
                      fontWeight: 600,
                      color: colors.text,
                      offsetY: -10
                    },
                    value: {
                      show: true,
                      fontSize: '24px',
                      fontWeight: 700,
                      color: colors.primary,
                      offsetY: 5,
                      formatter: val => `${((val / total) * 100).toFixed(1)}%`
                    },
                    total: {
                      show: true,
                      label: 'Total Activity',
                      fontSize: '13px',
                      fontWeight: 500,
                      color: colors.text,
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
              fontSize: '13px',
              labels: { colors: colors.text },
              markers: { radius: 4 },
              itemMargin: { horizontal: 10, vertical: 5 }
            },
            dataLabels: { enabled: false },
            tooltip: {
              y: {
                formatter: val => {
                  const pct = ((val / total) * 100).toFixed(1);
                  return `${val.toLocaleString()} (${pct}%)`;
                }
              }
            }
          }).render();
        }
      } else {
        document.getElementById("topSchoolBuildingsWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

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
