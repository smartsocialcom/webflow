if (!window.studentDashboardScriptExecuted) {
  window.studentDashboardScriptExecuted = true;

  // ═══════════════════════════════════════════════════════════════
  // SHIMMER LOADERS
  // Swaps the spinner Webflow puts inside every .loader / #loader for
  // a content-shaped skeleton with a soft gloss sweeping across it.
  // The shape comes from data-shimmer when the Webflow element sets
  // one, otherwise it is inferred from the host container (table /
  // chart / donut / stat / cards) and finally from the host's box.
  // hide() fades the skeleton out before the real .hide class lands
  // so revealed content never pops.
  // ═══════════════════════════════════════════════════════════════
  window.ssShimmer = window.ssShimmer || (() => {
    const STYLE_ID = "ss-shimmer-style";
    const LOADERS = ".loader, #loader";
    const FADE_MS = 380;

    const CSS = `
      .loader[data-ss-shim],#loader[data-ss-shim]{--ss-base:#e9f1f1;--ss-base-2:#e1ecec;--ss-gloss:rgba(255,255,255,.95);--ss-dur:1.5s;display:block!important;width:100%!important;height:auto!important;min-height:0!important;border:0!important;background:none!important;box-shadow:none!important;animation:none!important;}
      .loader.hide[data-ss-shim],#loader.hide[data-ss-shim]{display:none!important;}
      .loader[data-ss-shim]::before,.loader[data-ss-shim]::after,#loader[data-ss-shim]::before,#loader[data-ss-shim]::after{content:none!important;display:none!important;}
      .ss-shim-out{opacity:0!important;transform:translateY(-4px)!important;transition:opacity .38s cubic-bezier(.4,0,.2,1),transform .38s cubic-bezier(.4,0,.2,1)!important;pointer-events:none!important;}
      .ss-shim-stack{display:flex;flex-direction:column;gap:14px;width:100%;}
      .ss-shim-row{display:grid;gap:16px;align-items:center;width:100%;}
      .ss-shim-rule{width:100%;height:1px;background:#e4efef;border-radius:1px;}
      .ss-shim-b{position:relative;overflow:hidden;flex:none;border-radius:8px;background:linear-gradient(180deg,var(--ss-base) 0%,var(--ss-base-2) 100%);}
      .ss-shim-b::after{content:"";position:absolute;top:0;bottom:0;left:0;width:100%;min-width:280px;transform:translate3d(-100%,0,0);background:linear-gradient(90deg,rgba(255,255,255,0) 0%,rgba(255,255,255,.28) 32%,var(--ss-gloss) 50%,rgba(255,255,255,.28) 68%,rgba(255,255,255,0) 100%);animation-name:ss-shim-sweep;animation-duration:var(--ss-dur);animation-timing-function:cubic-bezier(.45,.05,.3,1);animation-iteration-count:infinite;animation-delay:var(--ss-d,0s);}
      @keyframes ss-shim-sweep{0%{transform:translate3d(-100%,0,0)}100%{transform:translate3d(100%,0,0)}}
      .ss-shim-circle{border-radius:50%;}
      .ss-shim-cols{display:flex;align-items:flex-end;gap:6px;width:100%;height:158px;}
      .ss-shim-cols .ss-shim-b{flex:1 1 0;min-width:0;border-radius:7px 7px 3px 3px;}
      .ss-shim-donut{display:flex;align-items:center;gap:30px;width:100%;flex-wrap:wrap;}
      .ss-shim-legend{display:flex;flex-direction:column;gap:13px;flex:1 1 170px;min-width:150px;}
      .ss-shim-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;width:100%;}
      .ss-shim-stats{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:18px;width:100%;}
      .ss-shim-card{display:flex;flex-direction:column;align-items:center;gap:12px;padding:20px 16px;border:1px solid #edf4f4;border-radius:12px;background:#fbfdfd;}
      @media(max-width:767px){.ss-shim-cols{height:120px;gap:4px;}.ss-shim-cards{grid-template-columns:1fr;}.ss-shim-stats{grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;}.ss-shim-row{gap:10px;}}
      @media(prefers-reduced-motion:reduce){.ss-shim-b::after{min-width:0;transform:none;background:rgba(255,255,255,.6);animation-name:ss-shim-breathe;animation-duration:2.4s;animation-timing-function:ease-in-out;}}
      @keyframes ss-shim-breathe{0%,100%{opacity:.2}50%{opacity:.85}}
    `;

    const ensureStyles = () => {
      if (document.getElementById(STYLE_ID)) return;
      const style = document.createElement("style");
      style.id = STYLE_ID;
      style.textContent = CSS;
      document.head.appendChild(style);
    };

    // One skeleton bar. `delay` phases the gloss so a stack of bars
    // reads as a single light travelling across the whole block.
    const bar = (width, height, extra, delay) =>
      `<div class="ss-shim-b${extra ? ` ${extra}` : ""}" style="width:${width};height:${height};--ss-d:-${(delay || 0).toFixed(2)}s"></div>`;

    const TEXT_WIDTHS = ["100%", "92%", "68%", "84%", "74%"];
    const ROW_WIDTHS = [
      ["46%", "88%", "72%", "56%"],
      ["54%", "72%", "62%", "68%"],
      ["42%", "94%", "58%", "48%"],
      ["58%", "68%", "80%", "62%"],
      ["48%", "82%", "66%", "52%"]
    ];
    const COLUMN_HEIGHTS = [44, 66, 52, 78, 58, 90, 68, 96, 60, 84, 54, 74, 46, 70];
    const LEGEND_WIDTHS = ["82%", "64%", "74%", "56%", "68%"];

    const SHAPES = {
      text: ({ rows }) => `<div class="ss-shim-stack">${
        Array.from({ length: rows || 3 }, (unused, i) =>
          bar(TEXT_WIDTHS[i % TEXT_WIDTHS.length], "13px", "", i * 0.08)).join("")
      }</div>`,

      table: ({ rows }) => {
        const columns = "1.5fr 2.6fr 2fr 1.4fr";
        const line = (widths, height, delay) =>
          `<div class="ss-shim-row" style="grid-template-columns:${columns}">${
            widths.map(width => bar(width, height, "", delay)).join("")}</div>`;
        return `<div class="ss-shim-stack">${
          line(["62%", "48%", "54%", "44%"], "11px", 0)
        }<div class="ss-shim-rule"></div>${
          Array.from({ length: rows || 5 }, (unused, i) =>
            line(ROW_WIDTHS[i % ROW_WIDTHS.length], "14px", (i + 1) * 0.08)).join("")
        }</div>`;
      },

      chart: () => `<div class="ss-shim-stack" style="gap:20px">
        <div class="ss-shim-stack" style="gap:10px">${bar("38%", "16px", "", 0)}${bar("24%", "10px", "", 0.08)}</div>
        <div class="ss-shim-cols">${
          COLUMN_HEIGHTS.map((height, i) => bar("auto", `${height}%`, "", i * 0.05)).join("")}</div>
        <div class="ss-shim-rule"></div>
        <div class="ss-shim-row" style="grid-template-columns:repeat(4,minmax(0,1fr))">${
          ["70%", "58%", "64%", "52%"].map((width, i) => bar(width, "10px", "", 0.4 + i * 0.06)).join("")}</div>
      </div>`,

      donut: () => `<div class="ss-shim-donut">${bar("156px", "156px", "ss-shim-circle", 0)}
        <div class="ss-shim-legend">${
          LEGEND_WIDTHS.map((width, i) => bar(width, "12px", "", 0.1 + i * 0.08)).join("")}</div>
      </div>`,

      stat: () => `<div class="ss-shim-stack" style="gap:9px">${bar("64px", "9px", "", 0)}${bar("112px", "28px", "", 0.09)}</div>`,

      stats: () => `<div class="ss-shim-stats">${[0, 1, 2, 3, 4].map(i =>
        `<div class="ss-shim-stack" style="gap:9px">${bar("62%", "9px", "", i * 0.09)}${bar("84%", "26px", "", i * 0.09 + 0.05)}</div>`
      ).join("")}</div>`,

      cards: () => `<div class="ss-shim-cards">${[0, 1, 2].map(i =>
        `<div class="ss-shim-card">${bar("76px", "76px", "ss-shim-circle", i * 0.1)}${bar("74%", "12px", "", i * 0.1 + 0.06)}${bar("50%", "10px", "", i * 0.1 + 0.12)}</div>`
      ).join("")}</div>`,

      block: ({ height }) => bar("100%", `${Math.max(160, height || 0)}px`, "", 0)
    };

    // Hosts this dashboard family fills, matched by id first and then
    // by any id/class in the loader's ancestor chain.
    const ID_SHAPES = {
      active: "table", inactive: "table", latest_users: "table",
      student_pin_list: "table", org_feedbacks_list: "table",
      other_feedbacks_list: "table", topSchoolBuildings: "table",
      overview: "stats", parent_impact: "cards", trends_chart: "chart"
    };

    const SIGNATURE_SHAPES = [
      [/donut|pie|ring/, "donut"],
      [/chart|graph|trend|apex/, "chart"],
      [/leader_board|webinars_log|pin_list|feedbacks_list|latest_users|table|_list/, "table"],
      [/overview|kpi|metric|counter|percentage|goal|stat|number|score/, "stat"],
      [/impact|card/, "cards"]
    ];

    const shapeFor = element => {
      const requested = (element.getAttribute("data-shimmer") || "").trim().toLowerCase();
      if (SHAPES[requested]) return requested;

      let node = element;
      for (let depth = 0; node && node !== document.body && depth < 8; depth++) {
        if (ID_SHAPES[node.id]) return ID_SHAPES[node.id];
        const signature = `${node.id} ${[...node.classList].join(" ")}`.toLowerCase();
        const matched = SIGNATURE_SHAPES.find(([pattern]) => pattern.test(signature));
        if (matched) return matched[1];
        node = node.parentElement;
      }
      return null;
    };

    const mount = root => {
      ensureStyles();
      (root || document).querySelectorAll(LOADERS).forEach(element => {
        try {
          if (element.hasAttribute("data-ss-shim") || element.classList.contains("failed_loader")) return;

          // Measure the host before the reset styles below change the box.
          const height = Math.round((element.parentElement || element).getBoundingClientRect().height);
          const shape = shapeFor(element)
            || (height >= 220 ? "chart" : height > 0 && height <= 96 ? "stat" : "text");

          element.setAttribute("data-ss-shim", shape);
          element.setAttribute("role", "status");
          element.setAttribute("aria-label", "Loading");
          element.innerHTML = SHAPES[shape]({ rows: Number(element.getAttribute("data-shimmer-rows")) || 0, height });
        } catch (error) {
          console.warn("Shimmer loader skipped:", error);
        }
      });
    };

    // Fade first, then let the caller retire the node — the class
    // changes land in one task so the skeleton never flashes back.
    const fade = (elements, retire) => {
      const nodes = elements.filter(Boolean);
      if (!nodes.length) return;
      nodes.forEach(node => node.classList.add("ss-shim-out"));
      setTimeout(() => nodes.forEach(node => {
        node.classList.remove("ss-shim-out");
        node.removeAttribute("role");
        node.removeAttribute("aria-label");
        retire(node);
      }), FADE_MS);
    };

    return {
      mount,
      hide: root => fade([...(root || document).querySelectorAll(LOADERS)], node => node.classList.add("hide")),
      remove: target => fade([typeof target === "string" ? document.querySelector(target) : target], node => node.remove())
    };
  })();

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

    const hideLoaders = () => window.ssShimmer.hide();

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
        #student_pin_list .student-registration-link-copy {
          width: 100%;
          appearance: none;
          cursor: copy;
          font: inherit;
          letter-spacing: 0;
          text-align: left;
        }
        #student_pin_list .student-registration-link-copy .pincode {
          pointer-events: none;
        }
        #student_pin_list .student-registration-link-copy:hover .pincode,
        #student_pin_list .student-registration-link-copy:focus-visible .pincode {
          color: #2D5A5A;
          text-decoration: underline;
          text-underline-offset: 3px;
        }
        #student_pin_list .student-registration-link-copy:focus-visible {
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

    const renderRegistrationLinkButtons = (schoolBuildings, studentAccess) => {
      const lock = byId("student_registration_links_lock");
      if (lock) lock.classList.toggle("hide", studentAccess === true);

      const list = byId("student_pin_list");
      if (!list) return;

      const buildingsWithPins = schoolBuildings.filter(building =>
        building && building.student_pin_code !== undefined && building.student_pin_code !== null
      );
      const fragment = document.createDocumentFragment();

      buildingsWithPins.forEach(building => {
        const pin = String(building.student_pin_code);
        const schoolName = building.school_name || "School";
        const registrationUrl = new URL("https://smartsocial.com/students");
        registrationUrl.searchParams.set("pin", pin);

        const button = document.createElement("button");
        button.type = "button";
        button.className = "link-list w-button student-registration-link-copy";
        button.dataset.copyUrl = registrationUrl.href;
        button.setAttribute("aria-label", `Copy student registration link for ${schoolName}`);
        button.title = "Copy student registration link";
        button.appendChild(document.createTextNode(schoolName));

        const pinCode = document.createElement("span");
        pinCode.className = "pincode";
        pinCode.textContent = `Pincode: ${pin}`;

        button.addEventListener("click", async () => {
          const originalText = `Pincode: ${pin}`;
          try {
            await copyTextToClipboard(registrationUrl.href);
            pinCode.textContent = "Link copied!";
          } catch (error) {
            pinCode.textContent = "Copy failed";
            console.warn("Student registration link could not be copied.", error);
          }

          window.setTimeout(() => {
            if (pinCode.isConnected) pinCode.textContent = originalText;
          }, 1500);
        });

        button.appendChild(pinCode);
        fragment.appendChild(button);
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

    const dashboardExists = byId("student_pin_list")
      || byId("studentLoginsPerMonthChart")
      || byId("studentLoginsPerBuilding")
      || byId("topVisitedLessonsChart");
    if (!dashboardExists) return;

    ensureStudentDashboardStyles();
    window.ssShimmer.mount();

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
      renderRegistrationLinkButtons(schoolBuildings, studentAccess);

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
