if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // ═══════════════════════════════════════════════════════════════
      // REFINED COLOR PALETTE
      // ═══════════════════════════════════════════════════════════════
      const colors = {
        primary: '#449997',
        primaryLight: '#7EC8C8',
        primaryDark: '#357A78',
        text: '#435d60',
        textLight: '#6b8285',
        secondary: '#E8D5B7',
        accent1: '#C17767',    // Terracotta
        accent2: '#8BA888',    // Sage
        accent3: '#7BA3B4',    // Dusty Blue
        accent4: '#D4A853',    // Muted Gold
        dark: '#2D4A4A',
        background: '#FFFFFF',
        backgroundAlt: '#f8fafa'
      };

      // Harmonious palette for multi-series charts
      const chartPalette = [
        '#449997',  // Primary teal
        '#7BA3B4',  // Dusty blue
        '#8BA888',  // Sage
        '#D4A853',  // Muted gold
        '#C17767',  // Terracotta
        '#7EC8C8',  // Soft teal
        '#9ABDB4',  // Mint
        '#B8A08C',  // Taupe
        '#6D9B8F',  // Forest teal
        '#A3C4BC',  // Seafoam
        '#D4B5A0',  // Warm beige
        '#8AABA7',  // Sage teal
        '#C9B896',  // Sand
        '#7A9E9A',  // Muted cyan
        '#BDA88E'   // Camel
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
            speed: 1000,
            animateGradually: {
              enabled: true,
              delay: 200
            },
            dynamicAnimation: {
              enabled: true,
              speed: 400
            }
          },
          dropShadow: {
            enabled: true,
            top: 3,
            left: 0,
            blur: 8,
            color: colors.primary,
            opacity: 0.12
          }
        },
        states: {
          hover: {
            filter: { type: 'lighten', value: 0.08 }
          },
          active: {
            filter: { type: 'darken', value: 0.1 }
          }
        },
        tooltip: {
          theme: 'light',
          style: { fontSize: '13px' },
          y: { formatter: val => val?.toLocaleString() }
        },
        grid: {
          borderColor: '#e8eef0',
          strokeDashArray: 5,
          padding: { left: 10, right: 10 }
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
      // CHART 1: REGISTRATIONS PER MONTH (Area Chart)
      // ═══════════════════════════════════════════════════════════════
      const usersPerMonthEl = document.getElementById("usersPerMonthChart");
      if (usersPerMonthEl) {
        new ApexCharts(usersPerMonthEl, {
          chart: {
            type: 'area',
            height: 360,
            background: 'transparent',
            animations: {
              enabled: true,
              easing: 'easeout',
              speed: 1200,
              animateGradually: { enabled: true, delay: 100 }
            },
            sparkline: { enabled: false },
            zoom: { enabled: false }
          },
          series: [{
            name: 'Registrations',
            data: users_per_month_arr
          }],
          xaxis: {
            categories: ["Aug", "Sep", "Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun"],
            labels: {
              style: { 
                colors: colors.text, 
                fontSize: '12px', 
                fontWeight: 600 
              }
            },
            axisBorder: { show: false },
            axisTicks: { show: false },
            crosshairs: {
              show: true,
              stroke: { color: colors.primary, width: 1, dashArray: 4 }
            }
          },
          yaxis: {
            labels: {
              style: { colors: colors.textLight, fontSize: '11px' },
              formatter: val => Math.round(val).toLocaleString()
            }
          },
          stroke: {
            curve: 'smooth',
            width: 3,
            lineCap: 'round'
          },
          fill: {
            type: 'gradient',
            gradient: {
              shade: 'light',
              type: 'vertical',
              shadeIntensity: 0.3,
              gradientToColors: [colors.backgroundAlt],
              inverseColors: false,
              opacityFrom: 0.7,
              opacityTo: 0.05,
              stops: [0, 95]
            }
          },
          colors: [colors.primary],
          dataLabels: { enabled: false },
          markers: {
            size: 0,
            strokeWidth: 3,
            strokeColors: '#fff',
            colors: [colors.primary],
            hover: {
              size: 8,
              sizeOffset: 4
            }
          },
          tooltip: {
            y: { 
              formatter: val => `<span style="font-size:18px;font-weight:700;color:${colors.primary}">${val.toLocaleString()}</span> <span style="color:${colors.textLight}">registrations</span>` 
            }
          },
          grid: {
            borderColor: '#e8eef0',
            strokeDashArray: 6,
            padding: { top: 0, bottom: 0 }
          }
        }).render();
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 2: SCHOOL BUILDINGS (Treemap)
      // ═══════════════════════════════════════════════════════════════
      if (school_buildings.length) {
        const schoolBuildingsEl = document.getElementById("schoolBuildingsChart");
        if (schoolBuildingsEl) {
          const total = school_buildings.reduce((sum, i) => sum + i.registered_school_parents, 0);
          
          // Prepare treemap data
          const treemapData = school_buildings.map((b, i) => ({
            x: b.school_name,
            y: b.registered_school_parents
          }));

          new ApexCharts(schoolBuildingsEl, {
            chart: {
              type: 'treemap',
              height: 400,
              background: 'transparent',
              animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 1000
              }
            },
            series: [{
              data: treemapData
            }],
            colors: chartPalette,
            plotOptions: {
              treemap: {
                distributed: true,
                enableShades: true,
                shadeIntensity: 0.3,
                colorScale: {
                  ranges: treemapData.map((_, i) => ({
                    from: i,
                    to: i,
                    color: chartPalette[i % chartPalette.length]
                  }))
                }
              }
            },
            dataLabels: {
              enabled: true,
              style: {
                fontSize: '12px',
                fontWeight: 600,
                colors: ['#fff']
              },
              formatter: (text, op) => {
                const pct = ((op.value / total) * 100).toFixed(1);
                const shortName = text.length > 20 ? text.substring(0, 18) + '...' : text;
                return [shortName, `${pct}%`];
              },
              offsetY: -2
            },
            stroke: {
              width: 3,
              colors: ['#fff']
            },
            legend: { show: false },
            tooltip: {
              custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                const name = w.config.series[0].data[dataPointIndex].x;
                const value = w.config.series[0].data[dataPointIndex].y;
                const pct = ((value / total) * 100).toFixed(1);
                return `
                  <div style="padding:14px 18px;background:linear-gradient(135deg,#fff,#f8fafa);border-radius:12px;box-shadow:0 10px 40px rgba(68,153,151,0.2);">
                    <div style="font-weight:700;color:${colors.dark};font-size:14px;margin-bottom:8px;">${name}</div>
                    <div style="display:flex;gap:16px;align-items:baseline;">
                      <span style="font-size:24px;font-weight:700;color:${colors.primary}">${value.toLocaleString()}</span>
                      <span style="font-size:13px;color:${colors.textLight};background:${colors.backgroundAlt};padding:4px 10px;border-radius:20px;">${pct}%</span>
                    </div>
                  </div>
                `;
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
      // CHART 3: TOP USERS (Enhanced Horizontal Bar with Ranking)
      // ═══════════════════════════════════════════════════════════════
      if (topUsers.length > 1) {
        const topUsersEl = document.getElementById("topUsersChart");
        if (topUsersEl) {
          const maxValue = Math.max(...topUsers.map(u => u.count));
          
          new ApexCharts(topUsersEl, {
            chart: {
              type: 'bar',
              height: Math.max(340, topUsers.length * 44),
              background: 'transparent',
              animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 80 }
              }
            },
            series: [{
              name: 'Activities',
              data: topUsers.map(u => u.count)
            }],
            xaxis: {
              categories: topUsers.map((u, i) => u.name),
              labels: {
                style: { colors: colors.text, fontSize: '11px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { 
                  colors: colors.text, 
                  fontSize: '12px', 
                  fontWeight: 600 
                },
                maxWidth: 180,
                formatter: (val, i) => {
                  const idx = typeof i === 'object' ? i.dataPointIndex : i;
                  const rank = idx !== undefined && idx < 3 ? ['🥇', '🥈', '🥉'][idx] + ' ' : '';
                  return rank + val;
                }
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 8,
                borderRadiusApplication: 'end',
                barHeight: '70%',
                distributed: false,
                dataLabels: { position: 'center' }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.2,
                gradientToColors: [colors.primaryLight],
                inverseColors: false,
                opacityFrom: 1,
                opacityTo: 0.85,
                stops: [0, 100]
              }
            },
            colors: [colors.primary],
            dataLabels: {
              enabled: true,
              textAnchor: 'middle',
              style: { 
                colors: ['#fff'], 
                fontSize: '12px', 
                fontWeight: 700 
              },
              formatter: val => val.toLocaleString(),
              offsetX: 0
            },
            grid: {
              borderColor: '#e8eef0',
              strokeDashArray: 5,
              xaxis: { lines: { show: true } },
              yaxis: { lines: { show: false } },
              padding: { left: 0 }
            },
            tooltip: {
              custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                const name = topUsers[dataPointIndex].name;
                const value = topUsers[dataPointIndex].count;
                const pct = ((value / maxValue) * 100).toFixed(0);
                const rankLabel = dataPointIndex < 3 ? ['🥇 Top User', '🥈 Runner Up', '🥉 Third Place'][dataPointIndex] : `#${dataPointIndex + 1}`;
                return `
                  <div style="padding:14px 18px;background:linear-gradient(135deg,#fff,#f8fafa);border-radius:12px;box-shadow:0 10px 40px rgba(68,153,151,0.2);">
                    <div style="font-size:11px;color:${colors.textLight};margin-bottom:4px;">${rankLabel}</div>
                    <div style="font-weight:700;color:${colors.dark};font-size:15px;margin-bottom:8px;">${name}</div>
                    <div style="font-size:26px;font-weight:700;color:${colors.primary}">${value.toLocaleString()}</div>
                    <div style="font-size:11px;color:${colors.textLight};margin-top:4px;">activities</div>
                  </div>
                `;
              }
            }
          }).render();
        }
      } else {
        document.getElementById("topUsersChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 4: TOP PAGES (Enhanced Horizontal Bar)
      // ═══════════════════════════════════════════════════════════════
      if (topPages.length) {
        const topPagesEl = document.getElementById("topPagesChart");
        if (topPagesEl) {
          const maxValue = Math.max(...topPages.map(p => p.count));
          
          new ApexCharts(topPagesEl, {
            chart: {
              type: 'bar',
              height: Math.max(340, topPages.length * 44),
              background: 'transparent',
              animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 800,
                animateGradually: { enabled: true, delay: 80 }
              }
            },
            series: [{
              name: 'Visits',
              data: topPages.map(p => p.count)
            }],
            xaxis: {
              categories: topPages.map(p => {
                // Clean up URL for display
                const url = p.url.replace('/post/', '').replace(/-/g, ' ');
                return url.length > 24 ? url.substring(0, 22) + '...' : url;
              }),
              labels: {
                style: { colors: colors.text, fontSize: '11px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { 
                  colors: colors.text, 
                  fontSize: '11px', 
                  fontWeight: 500 
                },
                maxWidth: 180
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 8,
                borderRadiusApplication: 'end',
                barHeight: '70%',
                distributed: false,
                dataLabels: { position: 'center' }
              }
            },
            fill: {
              type: 'gradient',
              gradient: {
                shade: 'light',
                type: 'horizontal',
                shadeIntensity: 0.2,
                gradientToColors: [colors.accent3],
                inverseColors: true,
                opacityFrom: 0.85,
                opacityTo: 1,
                stops: [0, 100]
              }
            },
            colors: [colors.accent3],
            dataLabels: {
              enabled: true,
              textAnchor: 'middle',
              style: { 
                colors: ['#fff'], 
                fontSize: '12px', 
                fontWeight: 700 
              },
              formatter: val => val.toLocaleString(),
              offsetX: 0
            },
            grid: {
              borderColor: '#e8eef0',
              strokeDashArray: 5,
              xaxis: { lines: { show: true } },
              yaxis: { lines: { show: false } },
              padding: { left: 0 }
            },
            tooltip: {
              custom: ({ series, seriesIndex, dataPointIndex, w }) => {
                const url = topPages[dataPointIndex].url;
                const value = topPages[dataPointIndex].count;
                const pct = ((value / maxValue) * 100).toFixed(0);
                return `
                  <div style="padding:14px 18px;background:linear-gradient(135deg,#fff,#f8fafa);border-radius:12px;box-shadow:0 10px 40px rgba(68,153,151,0.2);max-width:280px;">
                    <div style="font-weight:600;color:${colors.dark};font-size:13px;margin-bottom:10px;word-break:break-all;">${url}</div>
                    <div style="display:flex;align-items:baseline;gap:8px;">
                      <span style="font-size:28px;font-weight:700;color:${colors.accent3}">${value.toLocaleString()}</span>
                      <span style="font-size:12px;color:${colors.textLight}">visits</span>
                    </div>
                  </div>
                `;
              }
            }
          }).render();
        }
      } else {
        document.getElementById("topPagesChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 5: TOP SCHOOL BUILDINGS (Polar Area)
      // ═══════════════════════════════════════════════════════════════
      if (topSchoolBuildings.length) {
        const topSchoolBuildingsEl = document.getElementById("topSchoolBuildings");
        if (topSchoolBuildingsEl) {
          const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);
          
          new ApexCharts(topSchoolBuildingsEl, {
            chart: {
              type: 'polarArea',
              height: 420,
              background: 'transparent',
              animations: {
                enabled: true,
                easing: 'easeinout',
                speed: 1000,
                animateGradually: { enabled: true, delay: 150 }
              }
            },
            series: topSchoolBuildings.map(i => i.count),
            labels: topSchoolBuildings.map(i => i.school_name),
            colors: chartPalette.slice(0, topSchoolBuildings.length),
            stroke: {
              width: 2,
              colors: ['#fff']
            },
            fill: {
              opacity: 0.85
            },
            plotOptions: {
              polarArea: {
                rings: {
                  strokeWidth: 1,
                  strokeColor: '#e8eef0'
                },
                spokes: {
                  strokeWidth: 1,
                  connectorColors: '#e8eef0'
                }
              }
            },
            legend: {
              show: true,
              position: 'bottom',
              fontSize: '12px',
              fontWeight: 500,
              labels: { colors: colors.text },
              markers: { 
                width: 10, 
                height: 10, 
                radius: 3 
              },
              itemMargin: { horizontal: 12, vertical: 6 },
              formatter: (seriesName, opts) => {
                const shortName = seriesName.length > 25 ? seriesName.substring(0, 23) + '...' : seriesName;
                return shortName;
              }
            },
            dataLabels: {
              enabled: false
            },
            yaxis: {
              show: false
            },
            tooltip: {
              custom: ({ series, seriesIndex, w }) => {
                const name = topSchoolBuildings[seriesIndex].school_name;
                const value = topSchoolBuildings[seriesIndex].count;
                const pct = ((value / total) * 100).toFixed(1);
                return `
                  <div style="padding:14px 18px;background:linear-gradient(135deg,#fff,#f8fafa);border-radius:12px;box-shadow:0 10px 40px rgba(68,153,151,0.2);">
                    <div style="font-weight:700;color:${colors.dark};font-size:14px;margin-bottom:8px;">${name}</div>
                    <div style="display:flex;gap:12px;align-items:baseline;">
                      <span style="font-size:24px;font-weight:700;color:${chartPalette[seriesIndex % chartPalette.length]}">${value.toLocaleString()}</span>
                      <span style="font-size:13px;color:${colors.textLight};background:${colors.backgroundAlt};padding:4px 10px;border-radius:20px;">${pct}%</span>
                    </div>
                  </div>
                `;
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
