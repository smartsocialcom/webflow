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
      // RESPONSIVE BREAKPOINTS FOR CHARTS
      // ═══════════════════════════════════════════════════════════════
      const areaChartResponsive = [
        {
          breakpoint: 480,
          options: {
            chart: { height: 240 },
            markers: { size: 3, hover: { size: 5 } },
            xaxis: { labels: { style: { fontSize: '11px' } } },
            yaxis: { labels: { style: { fontSize: '11px' } } }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: { height: 280 },
            markers: { size: 4, hover: { size: 6 } },
            xaxis: { labels: { style: { fontSize: '12px' } } },
            yaxis: { labels: { style: { fontSize: '12px' } } }
          }
        }
      ];

      const donutChartResponsive = [
        {
          breakpoint: 480,
          options: {
            chart: { height: 280, width: 280 },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    name: { fontSize: '11px' },
                    value: { fontSize: '18px' }
                  }
                }
              }
            }
          }
        },
        {
          breakpoint: 768,
          options: {
            chart: { height: 320, width: 320 },
            plotOptions: {
              pie: {
                donut: {
                  labels: {
                    name: { fontSize: '12px' },
                    value: { fontSize: '20px' }
                  }
                }
              }
            }
          }
        }
      ];

      const barChartResponsive = [
        {
          breakpoint: 480,
          options: {
            plotOptions: { bar: { barHeight: '55%' } },
            xaxis: { labels: { style: { fontSize: '10px' } } },
            yaxis: { labels: { style: { fontSize: '11px' }, maxWidth: 120 } },
            dataLabels: { style: { fontSize: '11px' }, offsetX: 5 }
          }
        },
        {
          breakpoint: 768,
          options: {
            plotOptions: { bar: { barHeight: '60%' } },
            xaxis: { labels: { style: { fontSize: '11px' } } },
            yaxis: { labels: { style: { fontSize: '12px' }, maxWidth: 150 } },
            dataLabels: { style: { fontSize: '12px' }, offsetX: 6 }
          }
        }
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

      // Accept epoch seconds/milliseconds or any Date-parseable string;
      // returns epoch-ms or null. Feeds the 30-day trend chart's daily buckets.
      const toTimestamp = value => {
        if (typeof value === "number" && Number.isFinite(value)) {
          return value > 1e12 ? value : value * 1000;
        }
        if (typeof value === "string") {
          const parsed = Date.parse(value);
          if (!Number.isNaN(parsed)) return parsed;
        }
        return null;
      };

      // ═══════════════════════════════════════════════════════════════
      // DATA FETCHING
      // ═══════════════════════════════════════════════════════════════
      const member = await window.$memberstackDom.getCurrentMember();
      const org = searchParams.get("as_org") || member.data.customFields.organization;
      setText("copy_link", `https://${window.location.hostname}/events?org=${org}`);

      if (!member.data.planConnections?.some(p => p.planId === "pln_master-admin-ay6204pn")) document.head.insertAdjacentHTML("beforeend", "<style>.created_at{display:none!important}</style>"); //show created_at only for master-admin

      const { data } = await axios.get(
        `https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/organizations/short_code/${org}`
      );
      const { total_students, parents: parentsCount, school_buildings, district_name, custom_graphics } = data.organization;
      const { feedback, top_users, users_per_month_arr, log, webinars_log, parent_concerns } = data;

      setText("org_name", district_name);
      document.querySelectorAll("#district_name").forEach(el => { el.textContent = district_name; });
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
          document.getElementById("percentage_to_goal")?.classList.remove("small");
        }
      };
      updateImpactMetrics(false);
      setText("feedback_count", formatNumber(feedback.length));
      setText("total_students_absent", formatNumber(studentsGoal));
      setText("estimated_funding", formatNumber(studentsGoal * 100));
      const customGraphicsEl = document.getElementById("custom_graphics");
      if (customGraphicsEl) customGraphicsEl.href = custom_graphics;

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
            width: '100%',
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
          },
          responsive: areaChartResponsive
        }).render();
      }

      const TREND_DAYS = 90;
      const webinarTsByAction = act => (webinars_log || [])
        .filter(l => l.action === act)
        .map(l => toTimestamp(l.created_at))
        .filter(v => v !== null);
      const trendMetrics = [
        { key: "feedbacks", name: "Recent Parent Testimonials", unit: "feedbacks", color: "#E8907C", ts: (feedback || []).map(f => toTimestamp(f.created_at)).filter(v => v !== null) },
        { key: "signups", name: "Recent Event Registrations", unit: "signups", color: "#E0A93B", ts: webinarTsByAction("registration") },
        { key: "attendees", name: "Recent Live Attendees", unit: "attendees", color: "#449997", ts: webinarTsByAction("live") },
        { key: "replays", name: "Recent Replay Views", unit: "views", color: "#8E7CB8", ts: webinarTsByAction("on-demand") }
      ];

      // Bucket epoch-ms timestamps into `days` daily points ending today,
      // each { x: localMidnightMs, y: count } — maps onto a datetime x-axis.
      const bucketDailySeries = (timestamps, days) => {
        const dayMs = 24 * 60 * 60 * 1000;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const startMs = todayStart.getTime() - (days - 1) * dayMs;
        const endMs = startMs + days * dayMs;
        const points = [];
        for (let i = 0; i < days; i++) points.push({ x: startMs + i * dayMs, y: 0 });
        (timestamps || []).forEach(ts => {
          if (ts === null || ts < startMs || ts >= endMs) return;
          const idx = Math.floor((ts - startMs) / dayMs);
          if (idx >= 0 && idx < days) points[idx].y++;
        });
        return points;
      };

      // Inject the card/grid styles once. Prefer a #trends_chart host the
      // admin placed in Webflow; otherwise build a self-contained card and
      // drop it above the first chart.
      const ensureTrendGrid = () => {
        if (!document.getElementById("trends_chart_style")) {
          const style = document.createElement("style");
          style.id = "trends_chart_style";
          style.textContent = `
            #trends_chart_card{background:#fff;border:1px solid #e3ecec;border-radius:14px;padding:20px 22px 16px;margin:0 0 24px;box-shadow:0 1px 3px rgba(45,90,90,.06);}
            #trends_chart_card h3{font-size:18px;color:#2D5A5A;font-weight:700;margin:0 0 2px;}
            #trends_chart_note{margin:0 0 16px;font-size:12px;color:#5A7A7A;}
            .trends-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:16px;}
            @media(max-width:560px){.trends-grid{grid-template-columns:1fr;}}
            .trend-panel{position:relative;border:1px solid #edf1f1;border-radius:12px;padding:14px 16px 8px;background:#fff;overflow:hidden;box-shadow:0 1px 2px rgba(45,90,90,.04);transition:box-shadow .15s ease,transform .15s ease;}
            .trend-panel:hover{box-shadow:0 6px 18px rgba(45,90,90,.11);transform:translateY(-2px);}
            .trend-panel-total{font-size:30px;font-weight:800;line-height:1.05;margin:3px 0 0;}
            .trend-panel-sub{font-size:11.5px;color:#8AA4A4;margin:2px 0 10px;}
            .trend-panel-chart{margin:0 -6px;}
          `;
          document.head.appendChild(style);
        }

        const host = document.getElementById("trends_chart");
        if (host) {
          host.innerHTML = "";
          const grid = document.createElement("div");
          grid.className = "trends-grid";
          host.appendChild(grid);
          return grid;
        }

        const card = document.createElement("div");
        card.id = "trends_chart_card";
        card.innerHTML =
          '<h3>New Activity — Last 30 Days</h3>' +
          '<p id="trends_chart_note">Each panel has its own scale — daily counts over the last 30 days.</p>';
        const grid = document.createElement("div");
        grid.className = "trends-grid";
        card.appendChild(grid);

        const anchor = document.getElementById("usersPerMonthChart")
          || document.getElementById("schoolBuildingsChartWrapper");
        if (anchor && anchor.parentNode) {
          anchor.parentNode.insertBefore(card, anchor);
        } else {
          document.body.insertBefore(card, document.body.firstChild);
        }
        return grid;
      };

      (() => {
        const grid = ensureTrendGrid();
        if (!grid || typeof ApexCharts === "undefined") return;

        const fmtDay = ms => new Date(ms).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        const dayMs = 24 * 60 * 60 * 1000;
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);
        const windowStartMs = todayStart.getTime() - (TREND_DAYS - 1) * dayMs;

        const noteEl = document.getElementById("trends_chart_note");
        if (noteEl) {
          noteEl.textContent = "Running total · " + fmtDay(windowStartMs) + " – " + fmtDay(todayStart.getTime()) + " · each panel scaled to itself.";
        }

        trendMetrics.forEach(metric => {
          const points = bucketDailySeries(metric.ts, TREND_DAYS);
          const total = points.reduce((sum, p) => sum + p.y, 0);
          const peak = points.reduce((m, p) => (p.y > m.y ? p : m), { x: null, y: 0 });

          // Cumulative running total — turns sporadic, mostly-zero daily
          // counts into a curve that rises across the window, while staying
          // exact (each point is the true total through that day).
          let running = 0;
          const cumulative = points.map(p => { running += p.y; return { x: p.x, y: running }; });

          const panel = document.createElement("div");
          panel.className = "trend-panel";
          panel.innerHTML =
            '<h3>' + metric.name + '</h3>' +
            '<div class="trend-panel-total" style="color:' + metric.color + '">' + total.toLocaleString() + '</div>' +
            '<div class="trend-panel-sub">' +
            (total > 0 ? 'Busiest day ' + peak.y.toLocaleString() + ' · ' + fmtDay(peak.x) : 'No activity in this window') +
            '</div>' +
            '<div class="trend-panel-chart"></div>';
          grid.appendChild(panel);

          new ApexCharts(panel.querySelector(".trend-panel-chart"), {
            chart: {
              type: "area", height: 122, toolbar: { show: false }, zoom: { enabled: false },
              parentHeightOffset: 0,
              fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, sans-serif',
              animations: { enabled: true, speed: 650 }
            },
            series: [{ name: metric.name, data: cumulative }],
            colors: [metric.color],
            stroke: { curve: "smooth", width: 3, lineCap: "round" },
            fill: { type: "gradient", gradient: { shadeIntensity: 1, opacityFrom: 0.45, opacityTo: 0.04, stops: [0, 100] } },
            dataLabels: { enabled: false },
            grid: { show: false, padding: { left: 10, right: 10, top: 0, bottom: -6 } },
            xaxis: {
              type: "datetime", min: windowStartMs, max: todayStart.getTime(), tickAmount: 5,
              labels: { datetimeUTC: false, format: "MMM d", style: { colors: "#5A7A7A", fontSize: "12px" }, hideOverlappingLabels: true, rotate: 0 },
              axisBorder: { show: false }, axisTicks: { show: false }, tooltip: { enabled: false }
            },
            yaxis: { show: false },
            tooltip: {
              // Pin to the top of the panel so it never floats off to the
              // side (where the panel's overflow:hidden would clip it).
              fixed: { enabled: true, position: "topLeft", offsetX: 0, offsetY: 0 },
              x: { format: "MMM d, yyyy" },
              y: { formatter: v => v.toLocaleString() + " " + metric.unit + " (running total)" }
            }
          }).render();
        });
      })();

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

          // Style the chart container to push chart right on desktop
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
                        const pct = Math.round((parseInt(val) / total) * 100);
                        return `${pct}%`;
                      }
                    },
                    total: {
                      show: true,
                      label: 'Total',
                      fontSize: '12px',
                      color: colors.textLight,
                      formatter: () => '100%'
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
                const pct = Math.round((value / total) * 100);
                return `
                  <div style="padding:14px 18px;background:#fff;border-radius:10px;box-shadow:0 8px 30px rgba(45,90,90,0.15);">
                    <div style="font-size:15px;font-weight:700;color:#2D5A5A;margin-bottom:10px;">${name}</div>
                    <div style="display:flex;align-items:baseline;gap:10px;">
                      <span style="font-size:24px;font-weight:700;color:#6B9E9C;">${pct}%</span>
                    </div>
                  </div>
                `;
              }
            },
            responsive: donutChartResponsive
          });
          chart2.render();

          // Force chart to align right after render on desktop
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
                  <span class="donut-legend-value">${Math.round((item.registered_school_parents / total) * 100)}%</span>
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
      const processLog = logs => logs.reduce((acc, { page_url, school_buildings_id }) => {
        try {
          const path = new URL(page_url).pathname;
          if (path && path !== '/') acc.pageCounts[path] = (acc.pageCounts[path] || 0) + 1;
        } catch (e) { /* malformed URL, skip */ }
        school_buildings_id?.forEach(b => { if (b?.school_name && b?.id !== 3) acc.schoolCounts[b.school_name] = (acc.schoolCounts[b.school_name] || 0) + 1; });
        return acc;
      }, { pageCounts: {}, schoolCounts: {} });

      const allLog = processLog(log);
      const topPages = getTop(allLog.pageCounts).map(({ key, count }) => ({ url: key, count }));
      const topSchoolBuildings = getTop(allLog.schoolCounts)
        .filter(({ key }) => key !== "District Staff")
        .map(({ key, count }) => ({ school_name: key, count }));

      // CHART 3 (Top Users from logs) intentionally disabled.

      // ═══════════════════════════════════════════════════════════════
      // CHART 4: TOP PAGES (Horizontal Bar - Large Text)
      // Webflow/Finsweet may re-render the w-embed block, detaching
      // the element after chart render. renderTopPages retries into
      // the fresh DOM node when that happens.
      // ═══════════════════════════════════════════════════════════════
      const topPagesChartOptions = {
        chart: {
          type: 'bar',
          height: Math.max(320, topPages.length * 42),
          width: '100%',
          background: 'transparent'
        },
        series: [{
          name: 'Visits',
          data: topPages.map(p => p.count)
        }],
        xaxis: {
          categories: topPages.map(p => {
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
        },
        responsive: barChartResponsive
      };

      const renderTopPages = (attempt = 0) => {
        const el = document.getElementById("topPagesChart");
        if (!el) return;
        const chart = new ApexCharts(el, topPagesChartOptions);
        chart.render().then(() => {
          // Check if the element was detached by a Webflow/Finsweet re-render
          if (!document.contains(el)) {
            if (attempt < 3) {
              chart.destroy();
              setTimeout(() => renderTopPages(attempt + 1), 500 * (attempt + 1));
            }
            return;
          }
          // Add click handlers to bars and labels
          setTimeout(() => {
            const liveEl = document.getElementById("topPagesChart");
            if (!liveEl) return;
            liveEl.querySelectorAll('.apexcharts-bar-area').forEach((bar, index) => {
              bar.style.cursor = 'pointer';
              bar.addEventListener('click', () => {
                if (topPages[index]) {
                  window.open(`https://smartsocial.com${topPages[index].url}`, '_blank');
                }
              });
            });
            liveEl.querySelectorAll('.apexcharts-yaxis-label').forEach((label, index) => {
              label.style.cursor = 'pointer';
              label.addEventListener('click', () => {
                if (topPages[index]) {
                  window.open(`https://smartsocial.com${topPages[index].url}`, '_blank');
                }
              });
            });
          }, 500);
        });
      };

      if (topPages.length) {
        renderTopPages();
      } else {
        document.getElementById("topPagesChartWrapper").innerHTML =
          `<div class="chart_message-wrapper"><h4 class="chart_message">Data is being updated. Use <a href="https://smartsocial.com/share?org=rooseveltmiddleschool"><strong>Sharing Center</strong></a> for accurate data.</h4></div>`;
      }

      // ═══════════════════════════════════════════════════════════════
      // CHART 5: TOP SCHOOL BUILDINGS (Donut - Full Width + Overlay Legend)
      // ═══════════════════════════════════════════════════════════════
      if (topSchoolBuildings.length) {
        const topSchoolBuildingsEl = document.getElementById("topSchoolBuildings");
        if (topSchoolBuildingsEl) {
          const total = topSchoolBuildings.reduce((sum, { count }) => sum + count, 0);

          // Truncate labels for center display
          const truncatedLabels = topSchoolBuildings.map(i =>
            i.school_name.length > 18 ? i.school_name.substring(0, 16) + '..' : i.school_name
          );

          // Style the chart container to push chart right on desktop
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
                        const pct = Math.round((parseInt(val) / total) * 100);
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
            legend: { show: true },
            dataLabels: { enabled: false },
            tooltip: {
              custom: ({ seriesIndex, w }) => {
                const name = topSchoolBuildings[seriesIndex].school_name;
                const value = topSchoolBuildings[seriesIndex].count;
                const pct = Math.round((value / total) * 100);
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
            },
            responsive: donutChartResponsive
          });
          chart5.render();
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // FEEDBACK TESTIMONIALS
      // Each card carries a stats row of survey chips: referral / watch /
      // use-strategies likert meters + kids-attendance chips. Style injected
      // once, mirroring the #parent_impact widget's self-contained pattern.
      // ═══════════════════════════════════════════════════════════════
      if (!document.getElementById("ss-stats-row-style")) {
        const style = document.createElement("style");
        style.id = "ss-stats-row-style";
        style.textContent = `
          .stats_row{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;margin:14px 0 2px;}
          .stat_chip{display:flex;align-items:center;gap:7px;padding:6px 11px;border-radius:999px;background:#f7f7f8;border:1px solid #ebebee;font-size:12px;font-weight:500;color:#555;line-height:1;white-space:nowrap;min-width:0;}
          .stat_chip span{min-width:0;overflow:hidden;text-overflow:ellipsis;}
          .stat_chip .icon{width:14px;height:14px;flex:none;opacity:.8;}
          .stat_chip .meter{flex:none;margin-left:auto;}
          .stat_chip span + .icon{margin-left:auto;}
          .kids_chip-yes{background:#ecfdf5;border-color:#d3f0e0;color:#067a52;}
          .kids_chip-no{background:#fafafa;border-color:#f0f0f0;color:#a8a8ad;}
          @media (max-width:480px){.stats_row{grid-template-columns:1fr;}}
        `;
        document.head.appendChild(style);
      }

      const LIKERT = {
        "very unlikely": 1, "unlikely": 2, "not likely": 2, "neutral": 3,
        "maybe": 3, "somewhat likely": 3, "likely": 4, "very likely": 5, "extremely likely": 5,
      };
      const LEVEL_COLORS = ["#ef4444", "#f97316", "#86efac", "#84cc16", "#22c55e"];
      const esc = s => String(s ?? "").replace(/[&<>"']/g, c =>
        ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
      const likertKey = v => String(v || "").trim().toLowerCase();
      const likertLevel = v => LIKERT[likertKey(v)] ?? 0;
      const yesNo = value => {
        if (value === true) return true;
        if (value === false) return false;
        const s = String(value || "").trim().toLowerCase();
        if (s === "yes" || s === "true") return true;
        if (s === "no" || s === "false") return false;
        return null;
      };
      const meterSVG = (level, max = 5) => {
        const color = LEVEL_COLORS[level - 1] || "#d4d4d8";
        let dots = "";
        for (let i = 0; i < max; i++) {
          const filled = i < level;
          dots += `<circle cx="${6 + i * 13}" cy="6" r="4" fill="${filled ? color : "transparent"}" stroke="${filled ? color : "#d4d4d8"}" stroke-width="1.5"/>`;
        }
        return `<svg class="meter" width="${max * 13}" height="12" viewBox="0 0 ${max * 13} 12" aria-hidden="true">${dots}</svg>`;
      };
      const ICONS = {
        recommend: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 11h4v9H3z"/><path d="M7 11l3.6-7.2A1.9 1.9 0 0 1 14 5.6V10h4.6a2 2 0 0 1 2 2.4l-1.1 5.2A2 2 0 0 1 17.5 20H7"/></svg>`,
        watch: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 12S6 5.8 12 5.8 21.5 12 21.5 12 18 18.2 12 18.2 2.5 12 2.5 12Z"/><circle cx="12" cy="12" r="2.6"/></svg>`,
        strategies: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0-3.4 10.9c.6.4 1 1.1 1 1.9h4.8c0-.8.4-1.5 1-1.9A6 6 0 0 0 12 3Z"/><path d="M9.8 19h4.4"/><path d="M10.6 21.5h2.8"/></svg>`,
        kids: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="8.5" cy="7.5" r="3"/><path d="M3 20a5.5 5.5 0 0 1 11 0"/><circle cx="17" cy="9.5" r="2.3"/><path d="M14.8 20a4.3 4.3 0 0 1 6.7 0"/></svg>`,
        check: `<svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 12.5l5 5 10-11"/></svg>`,
      };
      const statChip = (iconKey, label, value) => {
        const level = likertLevel(value);
        if (!level) return "";
        return `<div class="stat_chip" title="${esc(label)}: ${esc(value)}">${ICONS[iconKey]}<span>${esc(label)}</span>${meterSVG(level)}</div>`;
      };
      // Only shows when value resolves to true/false. Empty/missing -> hidden.
      // Pass onlyYes=true to hide the chip entirely when the answer is false/no.
      const kidsChip = (value, yesLabel, noLabel, onlyYes = false) => {
        const state = yesNo(value);
        if (state === null) return "";
        if (state === false && onlyYes) return "";
        return state
          ? `<div class="stat_chip kids_chip-yes" title="${esc(yesLabel)}">${ICONS.kids}<span>${esc(yesLabel)}</span>${ICONS.check}</div>`
          : `<div class="stat_chip kids_chip-no" title="${esc(noLabel)}">${ICONS.kids}<span>${esc(noLabel)}</span></div>`;
      };

      let testimonials = "";
      feedback.forEach(({ positive_feedback, user, created_at, page_name, recommend_likely, watch_likely, use_strategies_likely, kid_attended, bring_kids_next_time }) => {
        const name = user?.last_name ? `${user.first_name} ${user.last_name}` : user.first_name;
        const schools = user?.school_buildings_id
          ?.filter(s => s?.school_name && s.school_name !== "District Staff")
          .map(s => s.school_name)
          .join(", ") || "";
        const date = created_at
          ? new Date(created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
          : "";
        const statsRow = [
          statChip("recommend", "Recommend", recommend_likely),
          statChip("watch", "Watch again", watch_likely),
          statChip("strategies", "Use strategies", use_strategies_likely),
          kidsChip(kid_attended, "I brought my kids", "Adults only this time"),
          kidsChip(bring_kids_next_time, "Bringing kids next time", "Not bringing kids next time", true),
        ].join("");
        testimonials += `
          <div class="testimonial_card">
            <div class="feedback">"${esc(positive_feedback)}"</div>
            <p class="page_name">✏️ ${esc(page_name)}</p>
            ${statsRow ? `<div class="stats_row">${statsRow}</div>` : ""}
            <div class="feedback_line-divider"></div>
            <div>
              <p class="name">${esc(name)}</p>
              <p class="schools">${esc(schools)}</p>
              <p class="created_at">${date}</p>
            </div>
          </div>`;
      });
      document.querySelector("#org_feedbacks_list").innerHTML = testimonials;
      if (feedback.length > 6) {
        document.querySelector("#org_feedbacks_list_overlay").classList.remove("hide");
      }
      if (feedback.length > 3) {
        const btn = document.querySelector('.view-more_btn');
        if (btn) {
          btn.classList.remove("hide");
          btn.addEventListener("click", (e) => {
            e.preventDefault();
            document.querySelector("#org_feedbacks_list").classList.remove("max-height");
          });
        }
      }

      // ═══════════════════════════════════════════════════════════════
      // PARENT RESOURCE IMPACT WIDGET (#parent_impact)
      // Every metric computed live from the org-endpoint `feedback` array.
      // No extra API calls — survey fields ride along in `data.feedback`.
      // ═══════════════════════════════════════════════════════════════
      const renderParentImpact = (feedbackArr, districtName, parentConcerns) => {
        const mount = document.getElementById("parent_impact");
        if (!mount) return;

        // Map the widget's design-system vars to the site's teal theme (scoped to #parent_impact)
        if (!document.getElementById("ss-parent-impact-style")) {
          const style = document.createElement("style");
          style.id = "ss-parent-impact-style";
          style.textContent = `
            #parent_impact{
              --font-sans:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Arial,sans-serif;
              --color-text-primary:#2D5A5A;--color-text-secondary:#5A7A7A;--color-text-tertiary:#8AA4A4;
              --color-background-primary:#FFFFFF;--color-background-secondary:#F1F7F7;
              --color-border-tertiary:#E2EEEE;--border-radius-lg:12px;
            }
            #parent_impact .ss-wrap{padding:.75rem 0;font-family:var(--font-sans);}
            #parent_impact .ss-header{display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:18px;}
            #parent_impact .ss-title{font-size:18px;font-weight:600;color:var(--color-text-primary);}
            #parent_impact .ss-sub{font-size:16px;color:var(--color-text-secondary);margin-top:3px;}
            #parent_impact .kpi-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:12px;margin-bottom:12px;}
            #parent_impact .kpi-card{background:var(--color-background-secondary);border-radius:var(--border-radius-lg);padding:18px 10px 16px;text-align:center;}
            #parent_impact .coview{display:flex;flex-direction:column;justify-content:center;}
            #parent_impact .ring-wrap{position:relative;width:112px;height:112px;margin:0 auto 8px;}
            #parent_impact .ring-svg{width:112px;height:112px;transform:rotate(-90deg);display:block;}
            #parent_impact .ring-bg{fill:none;stroke:var(--color-border-tertiary);stroke-width:7;}
            #parent_impact .ring-fill{fill:none;stroke-width:7;stroke-linecap:round;transition:stroke-dashoffset 1.5s cubic-bezier(.22,1,.36,1);}
            #parent_impact .ring-center{position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);text-align:center;}
            #parent_impact .ring-pct{font-size:26px;font-weight:600;color:var(--color-text-primary);line-height:1;}
            #parent_impact .kpi-name{font-size:18px;font-weight:600;color:var(--color-text-primary);line-height:1.3;}
            #parent_impact .kpi-ctx{font-size:16px;color:var(--color-text-tertiary);margin-top:4px;}
            #parent_impact .bottom-row{display:grid;grid-template-columns:220px 180px 1fr;gap:12px;align-items:stretch;}
            #parent_impact .b-card{background:var(--color-background-secondary);border-radius:var(--border-radius-lg);padding:18px;}
            #parent_impact .sec-lbl{font-size:16px;font-weight:600;color:var(--color-text-secondary);letter-spacing:.04em;text-transform:uppercase;margin:0 0 14px;}
            #parent_impact .c-row{margin-bottom:12px;}
            #parent_impact .c-top{display:flex;justify-content:space-between;gap:10px;font-size:16px;color:var(--color-text-secondary);margin-bottom:5px;}
            #parent_impact .c-pct{font-weight:600;color:var(--color-text-primary);min-width:44px;text-align:right;}
            #parent_impact .bar-bg{background:var(--color-background-primary);border-radius:3px;height:8px;overflow:hidden;border:.5px solid var(--color-border-tertiary);}
            #parent_impact .bar-fill{height:100%;border-radius:3px;width:0;transition:width 1.6s cubic-bezier(.22,1,.36,1);}
            #parent_impact .impact-num{font-size:56px;font-weight:600;color:var(--color-text-primary);line-height:1;}
            #parent_impact .impact-denom{font-size:18px;color:var(--color-text-tertiary);font-weight:400;}
            #parent_impact .divider{border:none;border-top:.5px solid var(--color-border-tertiary);margin:12px 0;}
            #parent_impact .badge{display:inline-block;font-size:16px;font-weight:600;padding:4px 10px;border-radius:6px;}
            #parent_impact .badge-green{background:#E3F1EF;color:#15706A;}
            #parent_impact .badge-amber{background:#FBEFD8;color:#8A5A12;}
            #parent_impact .footer-note{font-size:16px;color:var(--color-text-tertiary);margin-top:14px;line-height:1.4;}
            @media (max-width:860px){#parent_impact .bottom-row{grid-template-columns:1fr;}}
            @media (max-width:560px){#parent_impact .kpi-grid{grid-template-columns:1fr;}}
          `;
          document.head.appendChild(style);
        }

        const LIKELY = new Set(["very likely", "likely"]);
        const survey = (feedbackArr || []).filter(f => (f.recommend_likely || "").trim());
        const N = survey.length;

        // Empty / low-data state — mirror the chart wrappers' "data being updated" pattern
        if (!N) {
          setText("total_bring_kids_percentage", "—");
          mount.innerHTML = `<div class="chart_message-wrapper"><h4 class="chart_message">Not enough survey responses yet. Use the <a href="https://smartsocial.com/share?org=${org}"><strong>Sharing Center</strong></a> to gather parent feedback.</h4></div>`;
          return;
        }

        const pctLikely = field => Math.round(100 * survey.filter(f => LIKELY.has(likertKey(f[field]))).length / N);
        const referral = pctLikely("recommend_likely");
        const returnIntent = pctLikely("watch_likely");
        const adoption = pctLikely("use_strategies_likely");
        const coview = Math.round(100 * survey.filter(f => f.kid_attended === "Yes").length / N);
        // Single source of truth: the dashboard "bring kids" tile mirrors the widget's Family co-view.
        setText("total_bring_kids_percentage", coview + "%");

        // Weighted composite (template subtitle: referral · return intent · adoption)
        const WEIGHTS = { referral: 0.4, return: 0.3, adoption: 0.3 };
        const impact = Math.round(WEIGHTS.referral * referral + WEIGHTS.return * returnIntent + WEIGHTS.adoption * adoption);

        // National benchmark — documented point-in-time constant (35 districts w/ survey data, 2026-06-02).
        // Upgrade path: replace with a live backend aggregate when available.
        const NATIONAL_IMPACT_AVG = 98;
        const diff = impact - NATIONAL_IMPACT_AVG;
        const benchBadge = diff >= 0
          ? `<span class="badge badge-green">+${diff} pts vs. national avg</span>`
          : `<span class="badge badge-amber">${diff} pts vs. national avg</span>`;

        // Family concern index — from the structured concerns[] selections (multi-select; totals can exceed 100%).
        // Denominator = only respondents who selected at least one concern (the recent responders).
        const CONCERN_BAR_LIMIT = 6;
        const concernLabel = new Map((parentConcerns || [])
          .filter(p => p.display_concern !== false)
          .map(p => [String(p.id), p.concern_topic]));
        const withConcerns = (feedbackArr || []).filter(f => Array.isArray(f.concerns) && f.concerns.length);
        const concernDen = withConcerns.length || 1;
        const concernColors = ["#6B9E9C", "#7B9EB8", "#9B8EB5", "#D4A5B0", "#CBA58A", "#8BAA8E"];
        const concernCounts = new Map();
        withConcerns.forEach(f => {
          // de-dupe per respondent so one person can't count twice for the same topic
          new Set(f.concerns.map(String)).forEach(id => {
            if (concernLabel.has(id)) concernCounts.set(id, (concernCounts.get(id) || 0) + 1);
          });
        });
        const concerns = [...concernCounts.entries()]
          .map(([id, n]) => ({ name: concernLabel.get(id), v: Math.round(100 * n / concernDen) }))
          .sort((a, b) => b.v - a.v)
          .slice(0, CONCERN_BAR_LIMIT);

        const ringColors = ["#2D5A5A", "#357A78", "#449997", "#5AADAB"];
        const rings = [
          { pct: referral, name: "Referral score", ctx: "Likely to recommend" },
          { pct: returnIntent, name: "Return intent", ctx: "Will watch again" },
          { pct: adoption, name: "Home adoption", ctx: "Using strategies" },
          { pct: coview, name: "Family co-view", ctx: "Watched with kids" }
        ];

        const RADIUS = 38, CIRC = 2 * Math.PI * RADIUS;
        const ringCard = (i, extraClass = "") => `
          <div class="kpi-card ${extraClass}">
            <div class="ring-wrap">
              <svg class="ring-svg" viewBox="0 0 100 100">
                <circle class="ring-bg" cx="50" cy="50" r="${RADIUS}"></circle>
                <circle class="ring-fill" id="ss-r${i}" cx="50" cy="50" r="${RADIUS}" stroke="${ringColors[i]}" stroke-dasharray="${CIRC.toFixed(2)}" stroke-dashoffset="${CIRC.toFixed(2)}"></circle>
              </svg>
              <div class="ring-center"><div class="ring-pct" id="ss-p${i}">0%</div></div>
            </div>
            <div class="kpi-name">${rings[i].name}</div>
            <div class="kpi-ctx">${rings[i].ctx}</div>
          </div>`;

        mount.innerHTML = `
          <div class="ss-wrap">
            <div class="ss-header">
              <div>
                <div class="ss-sub">${districtName || ""}</div>
              </div>
              <span class="badge badge-green">● Live</span>
            </div>
            <div class="kpi-grid">
              ${ringCard(0)}${ringCard(1)}${ringCard(2)}
            </div>
            <div class="bottom-row">
              <div class="b-card" style="display:flex;flex-direction:column;justify-content:center;">
                <div class="sec-lbl">Impact score</div>
                <div><span class="impact-num" id="ss-iscore">0</span><span class="impact-denom">/100</span></div>
                <div style="font-size:16px;color:var(--color-text-secondary);margin-top:6px;line-height:1.4;">Weighted composite: referral · return intent · adoption</div>
                <div class="divider"></div>
                <div style="font-size:16px;color:var(--color-text-secondary);">National average</div>
                <div style="font-size:18px;font-weight:600;color:var(--color-text-primary);margin-top:3px;">${NATIONAL_IMPACT_AVG} / 100</div>
                <div style="margin-top:9px;">${benchBadge}</div>
              </div>
              ${ringCard(3, "coview")}
              <div class="b-card">
                <div class="sec-lbl">Family concern index</div>
                ${concerns.map((c, i) => `
                  <div class="c-row">
                    <div class="c-top"><span>${c.name}</span><span class="c-pct" id="ss-cp${i}">—</span></div>
                    <div class="bar-bg"><div class="bar-fill" id="ss-cb${i}" style="background:${concernColors[i % concernColors.length]};"></div></div>
                  </div>`).join("")}
              </div>
            </div>
            <div class="footer-note"><span data-ms-content="master-admin">${N.toLocaleString()} survey ${N === 1 ? "response" : "responses"} &nbsp;·&nbsp; </span>Ring % = "Likely" + "Very Likely" responses &nbsp;·&nbsp; Concern % = share of parents who selected each topic (multi-select; totals may exceed 100%)</div>
          </div>`;

        // Animate rings (sweep + count-up)
        rings.forEach((r, i) => {
          setTimeout(() => {
            const ring = document.getElementById(`ss-r${i}`);
            const lbl = document.getElementById(`ss-p${i}`);
            if (ring) ring.style.strokeDashoffset = CIRC * (1 - r.pct / 100);
            if (lbl) {
              let cur = 0; const inc = r.pct / 50 || 1;
              const iv = setInterval(() => { cur = Math.min(cur + inc, r.pct); lbl.textContent = Math.round(cur) + "%"; if (cur >= r.pct) clearInterval(iv); }, 28);
            }
          }, 150 + i * 130);
        });

        // Animate concern bars
        setTimeout(() => {
          concerns.forEach((c, i) => {
            setTimeout(() => {
              const bar = document.getElementById(`ss-cb${i}`);
              const pct = document.getElementById(`ss-cp${i}`);
              if (bar) bar.style.width = c.v + "%";
              if (pct) pct.textContent = c.v + "%";
            }, i * 70);
          });
        }, 750);

        // Animate impact score
        setTimeout(() => {
          const el = document.getElementById("ss-iscore");
          if (!el) return;
          let cur = 0; const inc = impact / 50 || 1;
          const iv = setInterval(() => { cur = Math.min(cur + inc, impact); el.textContent = Math.round(cur); if (cur >= impact) clearInterval(iv); }, 26);
        }, 200);
      };
      renderParentImpact(feedback, district_name, parent_concerns);

      // Other Feedbacks List
      const loadOtherBtn = document.getElementById("load_other_feedbacks");
      if (loadOtherBtn) loadOtherBtn.addEventListener("click", async () => {
        loadOtherBtn.remove();
        const { data } = await axios.get(`https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh/feedback/not_org/${org}`);
        document.getElementById("other_feedbacks_list").innerHTML = data.map(({ positive_feedback, page_name, created_at, organization_info, recommend_likely, watch_likely, use_strategies_likely, kid_attended, bring_kids_next_time }) => {
          const date = created_at
            ? new Date(created_at).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
            : "";
          const statsRow = [
            statChip("recommend", "Recommend", recommend_likely),
            statChip("watch", "Watch again", watch_likely),
            statChip("strategies", "Use strategies", use_strategies_likely),
            kidsChip(kid_attended, "I brought my kids", "Adults only this time"),
            kidsChip(bring_kids_next_time, "Bringing kids next time", "Not bringing kids next time", true),
          ].join("");
          return `
          <div class="testimonial_card">
            <div class="feedback">"${esc(positive_feedback)}"</div>
            <p class="page_name">✏️ ${esc(page_name)}</p>
            ${statsRow ? `<div class="stats_row">${statsRow}</div>` : ""}
            <div class="feedback_line-divider"></div>
            <div>
              <p class="name">${esc(organization_info?.district_name || '')}</p>
              <p class="created_at">${date}</p>
            </div>
          </div>`;
        }).join("");
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
      document.getElementById("time").textContent = (d = new Date(), m = d.toLocaleString("en-US", { month: "long" }), day = d.getDate(), y = d.getFullYear(), hr = d.getHours() % 12 || 12, mi = (d.getMinutes() < 10 ? "0" : "") + d.getMinutes(), ap = d.getHours() < 12 ? "AM" : "PM", tz = d.toLocaleTimeString("en-US", { timeZoneName: "short" }).split(" ")[2], `${m} ${day}, ${y} ${hr}:${mi}${ap} ${tz}`);

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
             <div>${entry.user?.last_name ? `${entry.user?.first_name} ${entry.user?.last_name}` : entry.user?.first_name}</div>
             <div>${entry.user?.school_buildings_id?.slice(0, 3).map(b => b?.school?.school_name).filter(Boolean).join("<br>") || ""}</div>
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
        // total_bring_kids_percentage is set by renderParentImpact (mirrors the widget's Family co-view).
      }

      // Hide loaders
      document.querySelectorAll('.loader').forEach(e => e.classList.add('hide'));

      // Download Page PDF
      document.getElementById("screenshot").addEventListener("click", () => {
        document.querySelectorAll('.footer,.navbar5_component,.nav-wrapper').forEach(e => e.classList.add("hide"));
        setTimeout(() => {
          const scale = Math.min(2, 2400 / document.body.scrollWidth);
          html2canvas(document.body, { width: document.body.scrollWidth, height: document.body.scrollHeight, scrollX: 0, scrollY: 0, useCORS: !0, scale, backgroundColor: '#fff' }).then(c => {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF("p", "pt", "a4");
            const [pageWidth, pageHeight] = [pdf.internal.pageSize.getWidth(), pdf.internal.pageSize.getHeight()];
            const ratio = Math.min(pageWidth / c.width, pageHeight / c.height) * 2;
            const [scaledWidth, scaledHeight] = [c.width * ratio, c.height * ratio];
            const pagesNeeded = Math.ceil(scaledHeight / pageHeight);

            for (let i = 0; i < pagesNeeded; i++) {
              if (i > 0) pdf.addPage();
              const sourceY = i * pageHeight / ratio;
              const sourceHeight = Math.min(pageHeight / ratio, c.height - sourceY);
              const tempCanvas = document.createElement('canvas');
              const tempCtx = tempCanvas.getContext('2d');
              tempCanvas.width = c.width;
              tempCanvas.height = sourceHeight;
              tempCtx.drawImage(c, 0, sourceY, c.width, sourceHeight, 0, 0, c.width, sourceHeight);
              pdf.addImage(tempCanvas.toDataURL("image/jpeg", 0.4), "JPEG", (pageWidth - scaledWidth) / 2, 0, scaledWidth, sourceHeight * ratio, undefined, 'MEDIUM');
            }
            pdf.save(`${district_name} Parent engagement dashboard download smartsocial.com ${new Date().toLocaleDateString("en-US", { year: "2-digit", month: "numeric", day: "numeric" }).replace(/\//g, ".")}.pdf`);
            document.querySelectorAll('.footer,.navbar5_component,.nav-wrapper').forEach(e => e.classList.remove("hide"));
          });
        }, 1e3);
      });
    } catch (err) {
      console.error("Error:", err);
      document.querySelectorAll('.failed_loader').forEach(e => e.classList.remove('hide'));
      document.querySelectorAll('.loader').forEach(e => e.classList.add('hide'));
      axios.post("https://hook.us1.make.com/rif68igkkl1qju5ez06amm5svce3f89t", { memberid: memberData?.id }).catch(() => { });
    }
  });
}
