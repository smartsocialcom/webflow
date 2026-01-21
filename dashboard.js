if (!window.scriptExecuted) {
  window.scriptExecuted = true;
  document.addEventListener("DOMContentLoaded", async () => {
    try {
      // ═══════════════════════════════════════════════════════════════
      // COLOR PALETTES
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

      // 100 VIBRANT BUT PLEASANT COLORS - SHUFFLED for variety
      const treemapPalette = [
        '#5EAE72', '#E8907C', '#8E7CB8', '#E8C468', '#4AADA8',
        '#E07A98', '#F0A060', '#98C45A', '#B888A8', '#5A9EC8',
        '#F4A08C', '#6EC082', '#9E8CC8', '#F2D078', '#5CC4BE',
        '#EC8AA8', '#F8AC70', '#A6D06A', '#C698B8', '#6AAED8',
        '#E58068', '#4EA264', '#806EAA', '#DEB858', '#42A09B',
        '#D46C8A', '#E89452', '#8CB84C', '#AA7A9A', '#4A90BC',
        '#F0967A', '#64B878', '#9484C0', '#ECC86E', '#52B8B2',
        '#E88298', '#F4A868', '#A0CA60', '#C090B0', '#60A6D0',
        '#DC7862', '#46985C', '#7866A2', '#D4AC4A', '#3A9994',
        '#CC647E', '#E08C4A', '#84B044', '#A27292', '#4288B4',
        '#F2988A', '#6ABC80', '#9C8AC6', '#F0CE76', '#58C0BA',
        '#EA88A4', '#F6AA6E', '#A4CE68', '#C496B6', '#68ACD6',
        '#E68A74', '#5AB270', '#8A78B4', '#E6C264', '#4EB4AE',
        '#DE7894', '#EE9E5E', '#9AC258', '#B686A6', '#5EA2CC',
        '#EE9480', '#66BA7A', '#9680BC', '#EECC72', '#54BCB6',
        '#E680A0', '#F2A664', '#A2CC64', '#BE8EB0', '#64A8D2',
        '#DA7660', '#52A668', '#8472B0', '#DCBA56', '#46A8A2',
        '#D87088', '#E69658', '#90BC52', '#AE809E', '#5698C2',
        '#F09C8E', '#5EB476', '#9886C2', '#E4C060', '#5AC2BC',
        '#E4869E', '#F0A262', '#9CC65C', '#C294B4', '#62A4CE'
      ];

      // Matte palette for other charts (bar, donut, etc)
      const chartPalette = [
        '#6B9E9C', '#7B9EB8', '#9B8EB5', '#D4A5B0', '#C9A5A5',
        '#CBA58A', '#D4C99A', '#8BAA8E', '#7AADAD', '#B5A899'
      ];

      // ═══════════════════════════════════════════════════════════════
      // GLOBAL APEX DEFAULTS (LARGER FONTS)
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
          style: { fontSize: '15px' }
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
      const { feedback, top_users, users_per_month_arr, log, webinars_log } = data;

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
              style: { colors: colors.text, fontSize: '14px', fontWeight: 600 }
            },
            axisBorder: { show: false },
            axisTicks: { show: false }
          },
          yaxis: {
            labels: {
              style: { colors: colors.textLight, fontSize: '13px' },
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
            size: 5,
            colors: [colors.primary],
            strokeColors: '#fff',
            strokeWidth: 2,
            hover: { size: 7 }
          },
          tooltip: {
            y: { formatter: val => `${val.toLocaleString()} registrations` }
          }
        }).render();
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 2: SCHOOL BUILDINGS (Donut - Full Width + Overlay Legend)
      // ═══════════════════════════════════════════════════════════════
      if (school_buildings.length) {
        const schoolBuildingsEl = document.getElementById("schoolBuildingsChart");
        const schoolBuildingsWrapper = document.getElementById("schoolBuildingsChartWrapper");
        if (schoolBuildingsEl && schoolBuildingsWrapper) {
          // Sort by value for better visual hierarchy
          const sortedBuildings = [...school_buildings].sort((a, b) => 
            b.registered_school_parents - a.registered_school_parents
          );
          
          const total = sortedBuildings.reduce((sum, b) => sum + b.registered_school_parents, 0);
          
          // Ensure wrapper can contain absolute legend
          schoolBuildingsWrapper.style.position = 'relative';
          
          // Truncate labels for center display
          const truncatedLabels = sortedBuildings.map(b => 
            b.school_name.length > 18 ? b.school_name.substring(0, 16) + '..' : b.school_name
          );
          
          // Style the chart container to push chart right
          schoolBuildingsEl.style.display = 'flex';
          schoolBuildingsEl.style.justifyContent = 'flex-end';
          
          const chart2 = new ApexCharts(schoolBuildingsEl, {
            chart: {
              type: 'donut',
              height: 400,
              width: 400,
              background: 'transparent'
            },
            series: sortedBuildings.map(b => b.registered_school_parents),
            labels: truncatedLabels,
            colors: treemapPalette,
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
                      color: colors.text,
                      offsetY: -8
                    },
                    value: {
                      show: true,
                      fontSize: '22px',
                      fontWeight: 700,
                      color: colors.primary,
                      offsetY: 4,
                      formatter: val => {
                        const pct = ((parseInt(val) / total) * 100).toFixed(1);
                        return `${pct}%`;
                      }
                    },
                    total: {
                      show: true,
                      label: 'Total',
                      fontSize: '12px',
                      color: colors.textLight,
                      formatter: () => total.toLocaleString()
                    }
                  }
                }
              }
            },
            stroke: { width: 2, colors: ['#fff'] },
            legend: { show: false },
            dataLabels: { enabled: false },
            tooltip: {
              custom: ({ seriesIndex }) => {
                const name = sortedBuildings[seriesIndex].school_name;
                const value = sortedBuildings[seriesIndex].registered_school_parents;
                const pct = ((value / total) * 100).toFixed(1);
                return `
                  <div style="padding:14px 18px;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(45,90,90,0.15);">
                    <div style="font-size:15px;font-weight:700;color:#2D5A5A;margin-bottom:10px;">${name}</div>
                    <div style="display:flex;align-items:baseline;gap:10px;">
                      <span style="font-size:24px;font-weight:700;color:#6B9E9C;">${value.toLocaleString()}</span>
                      <span style="font-size:13px;color:#5A7A7A;">parents</span>
                    </div>
                    <div style="margin-top:8px;font-size:13px;color:#fff;background:#6B9E9C;padding:5px 12px;border-radius:20px;display:inline-block;font-weight:600;">${pct}%</div>
                  </div>
                `;
              }
            }
          });
          chart2.render();
          
          // Force chart to align right after render
          setTimeout(() => {
            const chartWrapper = schoolBuildingsEl.querySelector('.apexcharts-canvas');
            if (chartWrapper) {
              chartWrapper.style.marginLeft = 'auto';
              chartWrapper.style.marginRight = '0';
            }
          }, 100);
          
          // Create custom overlay legend on left
          const legendHtml = `
            <div class="donut-overlay-legend" id="schoolBuildingsLegend">
              ${sortedBuildings.map((item, idx) => `
                <div class="donut-legend-item" data-index="${idx}" data-chart="chart2">
                  <span class="donut-legend-marker" style="background-color: ${treemapPalette[idx % treemapPalette.length]};"></span>
                  <span class="donut-legend-text">${item.school_name}</span>
                  <span class="donut-legend-value">${item.registered_school_parents}</span>
                </div>
              `).join('')}
            </div>
          `;
          const legendContainer = document.createElement('div');
          legendContainer.innerHTML = legendHtml;
          schoolBuildingsWrapper.appendChild(legendContainer.firstElementChild);
          
          // Add hover interaction
          document.querySelectorAll('#schoolBuildingsLegend .donut-legend-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
              const idx = parseInt(item.dataset.index);
              chart2.toggleDataPointSelection(idx);
              item.classList.add('active');
            });
            item.addEventListener('mouseleave', () => {
              const idx = parseInt(item.dataset.index);
              chart2.toggleDataPointSelection(idx);
              item.classList.remove('active');
            });
          });
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
      // CHART 3: TOP USERS (Horizontal Bar - Large Text)
      // ═══════════════════════════════════════════════════════════════
      if (topUsers.length > 1) {
        const topUsersEl = document.getElementById("topUsersChart");
        if (topUsersEl) {
          new ApexCharts(topUsersEl, {
            chart: {
              type: 'bar',
              height: Math.max(320, topUsers.length * 42),
              background: 'transparent'
            },
            series: [{
              name: 'Activities',
              data: topUsers.map(u => u.count)
            }],
            xaxis: {
              categories: topUsers.map(u => u.name),
              labels: {
                style: { colors: colors.textLight, fontSize: '13px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { colors: colors.text, fontSize: '14px', fontWeight: 600 },
                maxWidth: 180
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 6,
                barHeight: '65%',
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
              offsetX: 8,
              style: {
                colors: [colors.dark],
                fontSize: '14px',
                fontWeight: 700
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
      // CHART 4: TOP PAGES (Horizontal Bar - Large Text)
      // ═══════════════════════════════════════════════════════════════
      if (topPages.length) {
        const topPagesEl = document.getElementById("topPagesChart");
        if (topPagesEl) {
          new ApexCharts(topPagesEl, {
            chart: {
              type: 'bar',
              height: Math.max(320, topPages.length * 42),
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
                return url.length > 25 ? url.substring(0, 23) + '..' : url;
              }),
              labels: {
                style: { colors: colors.textLight, fontSize: '13px' }
              },
              axisBorder: { show: false },
              axisTicks: { show: false }
            },
            yaxis: {
              labels: {
                style: { colors: colors.text, fontSize: '13px', fontWeight: 600 },
                maxWidth: 180
              }
            },
            plotOptions: {
              bar: {
                horizontal: true,
                borderRadius: 6,
                barHeight: '65%',
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
              offsetX: 8,
              style: {
                colors: [colors.dark],
                fontSize: '14px',
                fontWeight: 700
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
      // CHART 5: TOP SCHOOL BUILDINGS (Donut - Full Width + Overlay Legend)
      // ═══════════════════════════════════════════════════════════════
      if (topSchoolBuildings.length) {
        const topSchoolBuildingsEl = document.getElementById("topSchoolBuildings");
        const topSchoolBuildingsWrapper = document.getElementById("topSchoolBuildingsWrapper");
        if (topSchoolBuildingsEl && topSchoolBuildingsWrapper) {
          const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);
          
          // Ensure wrapper can contain absolute legend
          topSchoolBuildingsWrapper.style.position = 'relative';
          
          // Truncate labels for center display
          const truncatedLabels = topSchoolBuildings.map(i => 
            i.school_name.length > 18 ? i.school_name.substring(0, 16) + '..' : i.school_name
          );
          
          // Style the chart container to push chart right
          topSchoolBuildingsEl.style.display = 'flex';
          topSchoolBuildingsEl.style.justifyContent = 'flex-end';
          
          const chart5 = new ApexCharts(topSchoolBuildingsEl, {
            chart: {
              type: 'donut',
              height: 400,
              width: 400,
              background: 'transparent'
            },
            series: topSchoolBuildings.map(i => i.count),
            labels: truncatedLabels,
            colors: treemapPalette,
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
                      color: colors.text,
                      offsetY: -8
                    },
                    value: {
                      show: true,
                      fontSize: '22px',
                      fontWeight: 700,
                      color: colors.primary,
                      offsetY: 4,
                      formatter: val => {
                        const pct = ((parseInt(val) / total) * 100).toFixed(1);
                        return `${pct}%`;
                      }
                    },
                    total: {
                      show: true,
                      label: 'Total',
                      fontSize: '12px',
                      color: colors.textLight,
                      formatter: () => total.toLocaleString()
                    }
                  }
                }
              }
            },
            stroke: { width: 2, colors: ['#fff'] },
            legend: { show: false }, // Hide built-in legend
            dataLabels: { enabled: false },
            tooltip: {
              custom: ({ seriesIndex, w }) => {
                const name = topSchoolBuildings[seriesIndex].school_name;
                const value = topSchoolBuildings[seriesIndex].count;
                const pct = ((value / total) * 100).toFixed(1);
                return `
                  <div style="padding:14px 18px;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(45,90,90,0.15);">
                    <div style="font-size:15px;font-weight:700;color:#2D5A5A;margin-bottom:10px;">${name}</div>
                    <div style="display:flex;align-items:baseline;gap:10px;">
                      <span style="font-size:24px;font-weight:700;color:#6B9E9C;">${value.toLocaleString()}</span>
                      <span style="font-size:13px;color:#5A7A7A;">visits</span>
                    </div>
                    <div style="margin-top:8px;font-size:13px;color:#fff;background:#6B9E9C;padding:5px 12px;border-radius:20px;display:inline-block;font-weight:600;">${pct}%</div>
                  </div>
                `;
              }
            }
          });
          chart5.render();
          
          // Force chart to align right after render
          setTimeout(() => {
            const chartWrapper = topSchoolBuildingsEl.querySelector('.apexcharts-canvas');
            if (chartWrapper) {
              chartWrapper.style.marginLeft = 'auto';
              chartWrapper.style.marginRight = '0';
            }
          }, 100);
          
          // Create custom overlay legend on left
          const legendHtml = `
            <div class="donut-overlay-legend" id="topSchoolBuildingsLegend">
              ${topSchoolBuildings.map((item, idx) => `
                <div class="donut-legend-item" data-index="${idx}">
                  <span class="donut-legend-marker" style="background-color: ${treemapPalette[idx % treemapPalette.length]};"></span>
                  <span class="donut-legend-text">${item.school_name}</span>
                  <span class="donut-legend-value">${item.count}</span>
                </div>
              `).join('')}
            </div>
          `;
          const legendContainer = document.createElement('div');
          legendContainer.innerHTML = legendHtml;
          topSchoolBuildingsWrapper.appendChild(legendContainer.firstElementChild);
          
          // Add hover interaction
          document.querySelectorAll('#topSchoolBuildingsLegend .donut-legend-item').forEach(item => {
            item.addEventListener('mouseenter', () => {
              const idx = parseInt(item.dataset.index);
              chart5.toggleDataPointSelection(idx);
              item.classList.add('active');
            });
            item.addEventListener('mouseleave', () => {
              const idx = parseInt(item.dataset.index);
              chart5.toggleDataPointSelection(idx);
              item.classList.remove('active');
            });
          });
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

      // Webinars Log Table
      if (webinars_log && webinars_log.length) {
        document.querySelector(".webinars_log-wrapper").innerHTML += webinars_log
          .filter(entry => entry.action === "registration")
          .map(entry =>
          `<div class='leader_board-row _3'>
             <div>${entry.last_name ? `${entry.first_name} ${entry.last_name}` : entry.first_name}</div>
             <div>${entry.user?.school_buildings_id?.[0]?.school?.school_name || ""}</div>
             <div>${entry.webinar}</div>
           </div>`
        ).join("");
        
        // Webinar stats by action type
        const webinarRegistrations = webinars_log.filter(e => e.action === "registration").length;
        const webinarAttendees = webinars_log.filter(e => e.action === "live").length;
        const webinarReplays = webinars_log.filter(e => e.action === "on-demand").length;
        
        setText("total_webinar_registrations", formatNumber(webinarRegistrations));
        setText("total_webinar_attendees", formatNumber(webinarAttendees));
        setText("total_webinar_replays", formatNumber(webinarReplays));
      }

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
