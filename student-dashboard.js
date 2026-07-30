if (!window.studentDashboardScriptExecuted) {
  window.studentDashboardScriptExecuted = true;

  document.addEventListener("DOMContentLoaded", async () => {
    const API_BASE = "https://xlbh-3re4-5vsp.n7c.xano.io/api:eJ2WWeJh";
    const chartPalette = [
      "#449997", "#7B9EB8", "#8E7CB8", "#D4A5B0", "#CBA58A",
      "#D4C99A", "#6EAA82", "#5A9EC8", "#E8907C", "#A48EB5"
    ];

    const byId = id => document.getElementById(id);
    const setText = (id, value) => {
      const element = byId(id);
      if (element) element.textContent = value;
    };

    const hideLoaders = () => {
      document.querySelectorAll(".loader").forEach(element => element.classList.add("hide"));
    };

    const showChartMessage = (wrapperId, message) => {
      const wrapper = byId(wrapperId);
      if (!wrapper) return;

      wrapper.replaceChildren();
      const messageWrapper = document.createElement("div");
      messageWrapper.className = "chart_message-wrapper";
      const heading = document.createElement("h4");
      heading.className = "chart_message";
      heading.textContent = message;
      messageWrapper.appendChild(heading);
      wrapper.appendChild(messageWrapper);
    };

    const normalizeId = value => {
      if (value && typeof value === "object") return normalizeId(value.id);
      if (value === undefined || value === null || value === "") return null;
      return String(value);
    };

    const toTimestamp = value => {
      if (typeof value === "number" && Number.isFinite(value)) {
        return value > 1e12 ? value : value * 1000;
      }
      if (typeof value === "string") {
        const numeric = Number(value);
        if (Number.isFinite(numeric) && value.trim() !== "") {
          return numeric > 1e12 ? numeric : numeric * 1000;
        }
        const parsed = Date.parse(value);
        if (!Number.isNaN(parsed)) return parsed;
      }
      return null;
    };

    const firstArray = (...values) => values.find(Array.isArray);

    const formatDashboardTime = date => {
      const datePart = date.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric"
      });
      const timePart = date.toLocaleTimeString("en-US", {
        hour: "numeric",
        minute: "2-digit",
        timeZoneName: "short"
      });
      return `${datePart} ${timePart}`;
    };

    const copyTextToClipboard = async text => {
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return;
        } catch {
          // Fall through for browsers that block the Clipboard API.
        }
      }

      const input = document.createElement("textarea");
      input.value = text;
      input.setAttribute("readonly", "");
      input.style.position = "fixed";
      input.style.opacity = "0";
      document.body.appendChild(input);
      input.select();
      const copied = document.execCommand("copy");
      input.remove();

      if (!copied) throw new Error("Clipboard copy failed.");
    };

    const ensureStudentDashboardStyles = () => {
      if (byId("student-dashboard-chart-styles")) return;

      const style = document.createElement("style");
      style.id = "student-dashboard-chart-styles";
      style.textContent = `
        #student-analytics .chart_embed {
          position: relative;
          min-height: 340px;
        }
        #student-analytics .chart_embed canvas {
          width: 100% !important;
          height: 100% !important;
        }
        #student-analytics .chart_message-wrapper {
          min-height: 240px;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 24px;
          text-align: center;
        }
        #student-analytics .chart_message {
          max-width: 34rem;
          margin: 0;
          color: #5A7A7A;
          font-size: 16px;
          font-weight: 500;
          line-height: 1.5;
        }
        #student_pin_list .pincode {
          cursor: copy;
        }
        #student_pin_list .pincode:hover,
        #student_pin_list .pincode:focus-visible {
          color: #2D5A5A;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        #student_pin_list .pincode:focus-visible {
          outline: 2px solid #449997;
          outline-offset: 3px;
        }
        @media (max-width: 767px) {
          #student-analytics .chart_embed {
            min-height: 300px;
          }
          #student-analytics #studentLoginsPerBuildingWrapper {
            min-height: 480px;
          }
          #student-analytics #topVisitedLessonsWrapper {
            min-height: 400px;
          }
        }
      `;
      document.head.appendChild(style);
    };

    const renderPinLinks = (schoolBuildings, studentAccess) => {
      const lock = byId("student_registration_links_lock");
      if (lock) lock.classList.toggle("hide", studentAccess === true);

      const list = byId("student_pin_list");
      if (!list) return;

      const buildingsWithPins = schoolBuildings.filter(building =>
        building && building.student_pin_code !== undefined && building.student_pin_code !== null
      );
      const fragment = document.createDocumentFragment();

      buildingsWithPins.forEach(building => {
        const link = document.createElement("a");
        const pin = String(building.student_pin_code);
        link.href = "#";
        link.className = "link-list w-button";
        link.setAttribute("fs-copyclip-text", `https://smartsocial.com/students?pin=${encodeURIComponent(pin)}`);
        link.setAttribute("fs-copyclip-element", "click");
        link.setAttribute("fs-copyclip-message", "Link Copied!");
        link.appendChild(document.createTextNode(building.school_name || "School"));

        const pinCode = document.createElement("span");
        pinCode.className = "pincode";
        pinCode.textContent = `Pincode: ${pin}`;
        pinCode.tabIndex = 0;
        pinCode.setAttribute("role", "button");
        pinCode.setAttribute("aria-label", `Copy PIN ${pin}`);
        pinCode.title = "Copy PIN";

        const copyPin = async event => {
          event.preventDefault();
          event.stopPropagation();

          const originalText = `Pincode: ${pin}`;
          try {
            await copyTextToClipboard(pin);
            pinCode.textContent = "PIN copied!";
          } catch (error) {
            pinCode.textContent = "Copy failed";
            console.warn("Student PIN could not be copied.", error);
          }

          window.setTimeout(() => {
            if (pinCode.isConnected) pinCode.textContent = originalText;
          }, 1500);
        };

        pinCode.addEventListener("click", copyPin);
        pinCode.addEventListener("keydown", event => {
          if (event.key === "Enter" || event.key === " ") copyPin(event);
        });
        link.appendChild(pinCode);
        fragment.appendChild(link);
      });

      list.replaceChildren(fragment);
      if (!buildingsWithPins.length) {
        const message = document.createElement("p");
        message.className = "chart_message";
        message.textContent = "No student registration links are available yet.";
        list.appendChild(message);
      }
    };

    const buildRollingMonths = (loginLog, now = new Date()) => {
      const buckets = Array.from({ length: 12 }, (_, index) => {
        const date = new Date(now.getFullYear(), now.getMonth() - 11 + index, 1);
        const month = date.toLocaleDateString("en-US", { month: "short" });
        const year = String(date.getFullYear()).slice(-2);
        return {
          key: `${date.getFullYear()}-${date.getMonth()}`,
          label: `${month} '${year}`,
          count: 0
        };
      });
      const bucketByKey = new Map(buckets.map(bucket => [bucket.key, bucket]));

      loginLog.forEach(entry => {
        const timestamp = toTimestamp(entry?.created_at);
        if (timestamp === null) return;
        const date = new Date(timestamp);
        if (Number.isNaN(date.getTime())) return;
        const bucket = bucketByKey.get(`${date.getFullYear()}-${date.getMonth()}`);
        if (bucket) bucket.count += 1;
      });

      return buckets;
    };

    const sharedTooltipOptions = {
      backgroundColor: "#2D5A5A",
      titleColor: "#FFFFFF",
      bodyColor: "#FFFFFF",
      padding: 12,
      cornerRadius: 6,
      displayColors: true,
      titleFont: { size: 14, weight: "600" },
      bodyFont: { size: 14 }
    };

    const sharedScaleOptions = {
      border: { display: false },
      grid: { color: "#E8F0F0", drawTicks: false },
      ticks: {
        color: "#5A7A7A",
        padding: 8,
        font: { size: 12, weight: "500" }
      }
    };

    const renderMonthlyLogins = loginLog => {
      const canvas = byId("studentLoginsPerMonthChart");
      if (!canvas) return;
      if (!loginLog.length) {
        showChartMessage("studentLoginsPerMonthChartWrapper", "No student logins have been recorded yet.");
        return;
      }

      const buckets = buildRollingMonths(loginLog);
      new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: buckets.map(bucket => bucket.label),
          datasets: [{
            label: "Student logins",
            data: buckets.map(bucket => bucket.count),
            backgroundColor: "#449997",
            hoverBackgroundColor: "#357A78",
            borderRadius: 7,
            borderSkipped: false,
            maxBarThickness: 42
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700, easing: "easeOutQuart" },
          interaction: { mode: "index", intersect: false },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...sharedTooltipOptions,
              callbacks: {
                label: context => ` ${context.raw.toLocaleString()} login${context.raw === 1 ? "" : "s"}`
              }
            }
          },
          scales: {
            x: {
              ...sharedScaleOptions,
              grid: { display: false },
              ticks: {
                ...sharedScaleOptions.ticks,
                maxRotation: 45,
                minRotation: 0
              }
            },
            y: {
              ...sharedScaleOptions,
              beginAtZero: true,
              ticks: {
                ...sharedScaleOptions.ticks,
                precision: 0
              }
            }
          }
        }
      });
    };

    const renderBuildingLogins = (loginLog, schoolBuildings) => {
      const canvas = byId("studentLoginsPerBuilding");
      if (!canvas) return;
      if (!loginLog.length) {
        showChartMessage("studentLoginsPerBuildingWrapper", "No student logins have been recorded yet.");
        return;
      }

      const schoolById = new Map();
      const schoolByPin = new Map();
      schoolBuildings.forEach(building => {
        const id = normalizeId(building?.id);
        const pin = normalizeId(building?.student_pin_code);
        if (id) schoolById.set(id, building.school_name || "Unknown school");
        if (pin) schoolByPin.set(pin, building.school_name || "Unknown school");
      });

      const counts = new Map();
      loginLog.forEach(entry => {
        const relatedBuilding = entry?._school_buildings || entry?.school_building;
        const relatedName = relatedBuilding && typeof relatedBuilding === "object"
          ? relatedBuilding.school_name
          : null;
        const buildingId = normalizeId(entry?.school_buildings_id ?? entry?.school_building);
        const pin = normalizeId(entry?.pin_code);
        const name = relatedName || schoolById.get(buildingId) || schoolByPin.get(pin) || "Unknown school";
        counts.set(name, (counts.get(name) || 0) + 1);
      });

      const buildings = [...counts.entries()]
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count);
      const total = buildings.reduce((sum, building) => sum + building.count, 0);
      const compactChart = window.matchMedia?.("(max-width: 767px)")?.matches;

      const centerTotalPlugin = {
        id: "studentBuildingLoginTotal",
        afterDraw(chart) {
          const { ctx, chartArea } = chart;
          if (!chartArea) return;
          const x = (chartArea.left + chartArea.right) / 2;
          const y = (chartArea.top + chartArea.bottom) / 2;
          ctx.save();
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillStyle = "#2D5A5A";
          ctx.font = "600 26px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(total.toLocaleString(), x, y - 8);
          ctx.fillStyle = "#5A7A7A";
          ctx.font = "500 12px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
          ctx.fillText(total === 1 ? "LOGIN" : "LOGINS", x, y + 16);
          ctx.restore();
        }
      };

      new window.Chart(canvas, {
        type: "doughnut",
        plugins: [centerTotalPlugin],
        data: {
          labels: buildings.map(building => building.name),
          datasets: [{
            data: buildings.map(building => building.count),
            backgroundColor: buildings.map((_, index) => chartPalette[index % chartPalette.length]),
            borderColor: "#FFFFFF",
            borderWidth: 3,
            hoverBorderWidth: 3,
            hoverOffset: 7
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: "66%",
          animation: { duration: 800, easing: "easeOutQuart" },
          layout: { padding: 8 },
          plugins: {
            legend: {
              display: true,
              position: "bottom",
              labels: {
                color: "#2D5A5A",
                usePointStyle: true,
                pointStyle: "circle",
                boxWidth: 8,
                boxHeight: 8,
                padding: compactChart ? 10 : 16,
                font: { size: compactChart ? 11 : 12, weight: "500" }
              }
            },
            tooltip: {
              ...sharedTooltipOptions,
              callbacks: {
                label: context => {
                  const percentage = total ? Math.round((context.raw / total) * 100) : 0;
                  return ` ${context.label}: ${context.raw.toLocaleString()} (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    };

    const lessonNameFromUrl = value => {
      if (!value || typeof value !== "string") return null;
      try {
        const pathname = new URL(value, window.location.origin).pathname;
        const slug = pathname.split("/").filter(Boolean).pop();
        if (!slug) return null;
        return decodeURIComponent(slug)
          .replace(/[-_]+/g, " ")
          .replace(/\b\w/g, character => character.toUpperCase());
      } catch (error) {
        return null;
      }
    };

    const renderTopLessons = lessonsLog => {
      const canvas = byId("topVisitedLessonsChart");
      if (!canvas) return;

      const counts = new Map();
      lessonsLog.forEach(entry => {
        const lesson = lessonNameFromUrl(entry?.page_url);
        if (lesson) counts.set(lesson, (counts.get(lesson) || 0) + 1);
      });
      const topLessons = [...counts.entries()]
        .map(([lesson, count]) => ({ lesson, count }))
        .sort((a, b) => b.count - a.count || a.lesson.localeCompare(b.lesson))
        .slice(0, 10);

      if (!topLessons.length) {
        showChartMessage("topVisitedLessonsWrapper", "No lesson visits have been recorded yet.");
        return;
      }

      new window.Chart(canvas, {
        type: "bar",
        data: {
          labels: topLessons.map(item => item.lesson),
          datasets: [{
            label: "Lesson visits",
            data: topLessons.map(item => item.count),
            backgroundColor: topLessons.map((_, index) => chartPalette[index % chartPalette.length]),
            hoverBackgroundColor: "#357A78",
            borderRadius: 6,
            borderSkipped: false,
            maxBarThickness: 28
          }]
        },
        options: {
          indexAxis: "y",
          responsive: true,
          maintainAspectRatio: false,
          animation: { duration: 700, easing: "easeOutQuart" },
          plugins: {
            legend: { display: false },
            tooltip: {
              ...sharedTooltipOptions,
              callbacks: {
                label: context => ` ${context.raw.toLocaleString()} visit${context.raw === 1 ? "" : "s"}`
              }
            }
          },
          scales: {
            x: {
              ...sharedScaleOptions,
              beginAtZero: true,
              ticks: {
                ...sharedScaleOptions.ticks,
                precision: 0
              }
            },
            y: {
              ...sharedScaleOptions,
              grid: { display: false },
              ticks: {
                ...sharedScaleOptions.ticks,
                autoSkip: false,
                font: { size: 12, weight: "500" },
                callback(value) {
                  const label = this.getLabelForValue(value);
                  const maxLength = this.chart.width < 500 ? 23 : 44;
                  return label.length > maxLength ? `${label.slice(0, maxLength - 3)}...` : label;
                }
              }
            }
          }
        }
      });
    };

    const ensureCopyClip = () => {
      if (document.querySelector('script[src*="attributes-copyclip"]')) return;
      const script = document.createElement("script");
      script.defer = true;
      script.src = "https://cdn.jsdelivr.net/npm/@finsweet/attributes-copyclip@1/copyclip.js";
      document.head.appendChild(script);
    };

    const dashboardExists = byId("student_pin_list")
      || byId("studentLoginsPerMonthChart")
      || byId("studentLoginsPerBuilding")
      || byId("topVisitedLessonsChart");
    if (!dashboardExists) return;

    ensureStudentDashboardStyles();

    try {
      const searchParams = new URLSearchParams(window.location.search);
      let org = searchParams.get("as_org");

      if (!org) {
        const member = await window.$memberstackDom?.getCurrentMember?.();
        org = member?.data?.customFields?.organization;
      }
      if (!org) throw new Error("No organization is assigned to this dashboard.");

      const encodedOrg = encodeURIComponent(org);
      const { data } = await window.axios.get(`${API_BASE}/organizations/short_code/${encodedOrg}`);
      const organization = data?.organization;
      if (!organization) throw new Error("The organization endpoint returned no organization.");

      const {
        id: organizationId,
        district_name: districtName,
        custom_graphics: customGraphics,
        student_access: studentAccess
      } = organization;
      const schoolBuildings = Array.isArray(organization.school_buildings)
        ? organization.school_buildings
        : [];

      setText("org_name", districtName || "Your District");
      setText("time", formatDashboardTime(new Date()));

      const customGraphicsElement = byId("custom_graphics");
      if (customGraphicsElement) {
        customGraphicsElement.classList.toggle("hide", !customGraphics);
        if (customGraphics) customGraphicsElement.href = customGraphics;
      }
      renderPinLinks(schoolBuildings, studentAccess);

      const chartTargetsStillExist = byId("studentLoginsPerMonthChart")
        || byId("studentLoginsPerBuilding")
        || byId("topVisitedLessonsChart");
      if (!chartTargetsStillExist) return;

      const studentData = data?.student_dashboard || data?.student_data || {};
      let loginLog = firstArray(
        data?.students_login_log,
        data?.student_login_log,
        data?.login_log,
        studentData?.students_login_log,
        studentData?.login_log
      );
      let lessonsLog = firstArray(
        data?.students_lessons_log,
        data?.student_lessons_log,
        data?.lessons_log,
        studentData?.students_lessons_log,
        studentData?.lessons_log
      );

      const needsLoginFallback = !Array.isArray(loginLog);
      const needsLessonsFallback = !Array.isArray(lessonsLog);
      let loginLoadFailed = false;
      let lessonsLoadFailed = false;
      if (needsLoginFallback || needsLessonsFallback) {
        const [loginResult, lessonsResult] = await Promise.allSettled([
          needsLoginFallback
            ? window.axios.get(`${API_BASE}/login_log?organizations_id=${encodeURIComponent(organizationId)}`)
            : Promise.resolve(null),
          needsLessonsFallback
            ? window.axios.get(`${API_BASE}/students_lessons_log?organization=${encodeURIComponent(organizationId)}`)
            : Promise.resolve(null)
        ]);
        const orgId = normalizeId(organizationId);

        if (needsLoginFallback) {
          if (loginResult.status === "fulfilled" && Array.isArray(loginResult.value?.data)) {
            loginLog = loginResult.value.data.filter(entry =>
              normalizeId(entry?.organizations_id ?? entry?.organization) === orgId
            );
          } else {
            loginLog = [];
            loginLoadFailed = true;
            console.warn("Student login data could not be loaded.", loginResult.reason);
          }
        }

        if (needsLessonsFallback) {
          if (lessonsResult.status === "fulfilled" && Array.isArray(lessonsResult.value?.data)) {
            lessonsLog = lessonsResult.value.data.filter(entry =>
              normalizeId(entry?.organization ?? entry?.organizations_id) === orgId
            );
          } else {
            lessonsLog = [];
            lessonsLoadFailed = true;
            console.warn("Student lesson data could not be loaded.", lessonsResult.reason);
          }
        }
      }

      if (typeof window.Chart !== "function" && (loginLog?.length || lessonsLog?.length)) {
        throw new Error("Chart.js is not available on the student dashboard.");
      }

      if (loginLoadFailed) {
        showChartMessage("studentLoginsPerMonthChartWrapper", "Student login data could not be loaded. Please try again shortly.");
        showChartMessage("studentLoginsPerBuildingWrapper", "Student login data could not be loaded. Please try again shortly.");
      } else {
        renderMonthlyLogins(loginLog || []);
        renderBuildingLogins(loginLog || [], schoolBuildings);
      }

      if (lessonsLoadFailed) {
        showChartMessage("topVisitedLessonsWrapper", "Student lesson data could not be loaded. Please try again shortly.");
      } else {
        renderTopLessons(lessonsLog || []);
      }
      ensureCopyClip();
    } catch (error) {
      console.error("Student dashboard error:", error);
      setText("org_name", "Student Dashboard");
      showChartMessage("studentLoginsPerMonthChartWrapper", "Student login data could not be loaded. Please try again shortly.");
      showChartMessage("studentLoginsPerBuildingWrapper", "Student login data could not be loaded. Please try again shortly.");
      showChartMessage("topVisitedLessonsWrapper", "Student lesson data could not be loaded. Please try again shortly.");
      document.querySelectorAll(".failed_loader").forEach(element => element.classList.remove("hide"));
    } finally {
      hideLoaders();
    }
  });
}
