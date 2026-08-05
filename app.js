(function () {
  "use strict";

  var STORAGE_KEY = "dailyTrackerData";
  var PALETTE = [
    "#4f46e5", "#0ea5a4", "#f59e0b", "#e0575b",
    "#8b5cf6", "#059669", "#db2777", "#2563eb"
  ];

  var state = {
    activities: [],
    completions: {},
    viewYear: 0,
    viewMonth: 0,
    viewMode: "month",
    selectedDateKey: null
  };

  var WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  var MONTH_ABBR = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

  var today = new Date();

  function dateKey(y, m, d) {
    return y + "-" + String(m + 1).padStart(2, "0") + "-" + String(d).padStart(2, "0");
  }

  function loadData() {
    var raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
      var parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.activities) && typeof parsed.completions === "object") {
        state.activities = parsed.activities;
        state.completions = parsed.completions || {};
      }
    } catch (e) {
      console.warn("Failed to parse stored data", e);
    }
  }

  function saveData() {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ activities: state.activities, completions: state.completions })
    );
  }

  function nextColor() {
    return PALETTE[state.activities.length % PALETTE.length];
  }

  function addActivity(name) {
    var trimmed = name.trim();
    if (!trimmed) return;
    state.activities.push({
      id: "act_" + Date.now() + "_" + Math.random().toString(36).slice(2, 7),
      name: trimmed,
      color: nextColor()
    });
    saveData();
    renderActivities();
    renderCalendar();
  }

  function deleteActivity(id) {
    state.activities = state.activities.filter(function (a) { return a.id !== id; });
    Object.keys(state.completions).forEach(function (key) {
      state.completions[key] = state.completions[key].filter(function (aid) { return aid !== id; });
      if (state.completions[key].length === 0) delete state.completions[key];
    });
    saveData();
    renderActivities();
    renderCalendar();
  }

  function toggleCompletion(dateKeyStr, activityId) {
    var list = state.completions[dateKeyStr] || [];
    var idx = list.indexOf(activityId);
    if (idx === -1) list.push(activityId);
    else list.splice(idx, 1);
    if (list.length === 0) delete state.completions[dateKeyStr];
    else state.completions[dateKeyStr] = list;
    saveData();
  }

  function renderActivities() {
    var list = document.getElementById("activityList");
    list.innerHTML = "";
    if (state.activities.length === 0) {
      var empty = document.createElement("li");
      empty.className = "activity-empty";
      empty.textContent = "No activities yet. Add your first one above.";
      list.appendChild(empty);
      return;
    }
    state.activities.forEach(function (activity) {
      var li = document.createElement("li");
      li.className = "badge outline";

      var dot = document.createElement("span");
      dot.className = "activity-dot";
      dot.style.background = activity.color;

      var name = document.createElement("span");
      name.textContent = activity.name;

      var removeBtn = document.createElement("button");
      removeBtn.type = "button";
      removeBtn.textContent = "×";
      removeBtn.setAttribute("aria-label", "Delete " + activity.name);
      removeBtn.addEventListener("click", function () {
        if (confirm('Delete activity "' + activity.name + '"? This removes it from all days.')) {
          deleteActivity(activity.id);
        }
      });

      li.appendChild(dot);
      li.appendChild(name);
      li.appendChild(removeBtn);
      list.appendChild(li);
    });
  }

  function renderCalendar() {
    var calendarNav = document.getElementById("calendarNav");
    var weekdayRow = document.getElementById("weekdayRow");
    var grid = document.getElementById("calendarGrid");

    if (state.viewMode === "month") {
      calendarNav.hidden = false;
      weekdayRow.hidden = false;
      grid.classList.remove("rolling-grid");
      renderMonthView();
    } else {
      calendarNav.hidden = true;
      weekdayRow.hidden = true;
      grid.classList.add("rolling-grid");
      renderRollingView(state.viewMode === "last7" ? 7 : 30);
    }
  }

  function makeDayCell(cellYear, cellMonth, dayNum, options) {
    var key = dateKey(cellYear, cellMonth, dayNum);
    var cell = document.createElement("div");
    cell.className = "day-cell" + (options.outside ? " outside" : "") + (options.rolling ? " rolling" : "");

    var isToday = cellYear === today.getFullYear() && cellMonth === today.getMonth() && dayNum === today.getDate();
    if (isToday) cell.classList.add("today");

    if (options.rolling) {
      var label = document.createElement("div");
      label.className = "day-label";
      label.innerHTML = WEEKDAY_ABBR[new Date(cellYear, cellMonth, dayNum).getDay()] +
        "<br>" + MONTH_ABBR[cellMonth] + " " + dayNum;
      cell.appendChild(label);
    } else {
      var numberEl = document.createElement("div");
      numberEl.className = "day-number";
      numberEl.textContent = String(dayNum);
      cell.appendChild(numberEl);
    }

    if (!options.outside && state.activities.length > 0) {
      var doneList = state.completions[key] || [];

      var dotsWrap = document.createElement("div");
      dotsWrap.className = "day-dots";
      state.activities.forEach(function (activity) {
        var dot = document.createElement("span");
        var done = doneList.indexOf(activity.id) !== -1;
        dot.className = "day-dot" + (done ? " done" : "");
        dot.style.color = activity.color;
        dotsWrap.appendChild(dot);
      });
      cell.appendChild(dotsWrap);

      var progress = document.createElement("div");
      progress.className = "day-progress";
      var fill = document.createElement("div");
      fill.className = "day-progress-fill";
      var pct = Math.round((doneList.length / state.activities.length) * 100);
      fill.style.width = pct + "%";
      progress.appendChild(fill);
      cell.appendChild(progress);
    }

    if (!options.outside) {
      cell.addEventListener("click", function () { openDayModal(key); });
    }

    return cell;
  }

  function renderRollingView(numDays) {
    var grid = document.getElementById("calendarGrid");
    var monthLabel = document.getElementById("monthLabel");
    monthLabel.textContent = numDays === 7 ? "Last 7 Days" : "Last 30 Days";

    grid.innerHTML = "";

    for (var i = numDays - 1; i >= 0; i--) {
      var d = new Date(today.getFullYear(), today.getMonth(), today.getDate() - i);
      var cell = makeDayCell(d.getFullYear(), d.getMonth(), d.getDate(), { outside: false, rolling: true });
      grid.appendChild(cell);
    }
  }

  function renderMonthView() {
    var grid = document.getElementById("calendarGrid");
    var monthLabel = document.getElementById("monthLabel");
    var year = state.viewYear;
    var month = state.viewMonth;

    var monthNames = ["January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"];
    monthLabel.textContent = monthNames[month] + " " + year;

    grid.innerHTML = "";

    var firstDay = new Date(year, month, 1);
    var startOffset = firstDay.getDay();
    var daysInMonth = new Date(year, month + 1, 0).getDate();
    var daysInPrevMonth = new Date(year, month, 0).getDate();

    var totalCells = Math.ceil((startOffset + daysInMonth) / 7) * 7;

    for (var i = 0; i < totalCells; i++) {
      var dayNum, cellYear, cellMonth, isOutside;

      if (i < startOffset) {
        dayNum = daysInPrevMonth - startOffset + 1 + i;
        cellMonth = month - 1;
        cellYear = year;
        if (cellMonth < 0) { cellMonth = 11; cellYear -= 1; }
        isOutside = true;
      } else if (i >= startOffset + daysInMonth) {
        dayNum = i - startOffset - daysInMonth + 1;
        cellMonth = month + 1;
        cellYear = year;
        if (cellMonth > 11) { cellMonth = 0; cellYear += 1; }
        isOutside = true;
      } else {
        dayNum = i - startOffset + 1;
        cellMonth = month;
        cellYear = year;
        isOutside = false;
      }

      grid.appendChild(makeDayCell(cellYear, cellMonth, dayNum, { outside: isOutside, rolling: false }));
    }
  }

  function openDayModal(key) {
    state.selectedDateKey = key;
    var modal = document.getElementById("dayModal");
    var titleEl = document.getElementById("modalDate");
    var checklist = document.getElementById("modalChecklist");
    var emptyMsg = document.getElementById("modalEmpty");

    var parts = key.split("-").map(Number);
    var d = new Date(parts[0], parts[1] - 1, parts[2]);
    titleEl.textContent = d.toLocaleDateString(undefined, { weekday: "long", year: "numeric", month: "long", day: "numeric" });

    checklist.innerHTML = "";

    if (state.activities.length === 0) {
      emptyMsg.hidden = false;
    } else {
      emptyMsg.hidden = true;
      var doneList = state.completions[key] || [];
      state.activities.forEach(function (activity) {
        var li = document.createElement("li");
        var label = document.createElement("label");

        var checkbox = document.createElement("input");
        checkbox.type = "checkbox";
        checkbox.checked = doneList.indexOf(activity.id) !== -1;

        var dot = document.createElement("span");
        dot.className = "activity-dot";
        dot.style.background = activity.color;

        var text = document.createElement("span");
        text.textContent = activity.name;
        if (checkbox.checked) text.classList.add("done-text");

        checkbox.addEventListener("change", function () {
          toggleCompletion(key, activity.id);
          text.classList.toggle("done-text", checkbox.checked);
          renderCalendar();
        });

        label.appendChild(checkbox);
        label.appendChild(dot);
        label.appendChild(text);
        li.appendChild(label);
        checklist.appendChild(li);
      });
    }

    modal.showModal();
  }

  function closeModal() {
    document.getElementById("dayModal").close();
    state.selectedDateKey = null;
  }

  function exportJSON() {
    var payload = {
      exportedAt: new Date().toISOString(),
      activities: state.activities,
      completions: state.completions
    };
    var blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    var stamp = dateKey(today.getFullYear(), today.getMonth(), today.getDate());
    a.href = url;
    a.download = "daily-tracker-" + stamp + ".json";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    ot.toast("Exported JSON file");
  }

  function importJSON(file) {
    var reader = new FileReader();
    reader.onload = function () {
      try {
        var parsed = JSON.parse(reader.result);
        if (!parsed || !Array.isArray(parsed.activities) || typeof parsed.completions !== "object") {
          throw new Error("Unrecognized file format");
        }
        if (!confirm("Import will replace your current activities and history. Continue?")) return;
        state.activities = parsed.activities;
        state.completions = parsed.completions || {};
        saveData();
        renderActivities();
        renderCalendar();
        ot.toast("Import successful");
      } catch (e) {
        ot.toast("Import failed: invalid JSON file", "Error", { variant: "danger" });
      }
    };
    reader.readAsText(file);
  }

  function init() {
    loadData();
    state.viewYear = today.getFullYear();
    state.viewMonth = today.getMonth();

    renderActivities();
    renderCalendar();

    document.getElementById("activityForm").addEventListener("submit", function (e) {
      e.preventDefault();
      var input = document.getElementById("activityInput");
      addActivity(input.value);
      input.value = "";
      input.focus();
    });

    document.getElementById("prevMonth").addEventListener("click", function () {
      state.viewMonth -= 1;
      if (state.viewMonth < 0) { state.viewMonth = 11; state.viewYear -= 1; }
      renderCalendar();
    });

    document.getElementById("nextMonth").addEventListener("click", function () {
      state.viewMonth += 1;
      if (state.viewMonth > 11) { state.viewMonth = 0; state.viewYear += 1; }
      renderCalendar();
    });

    document.querySelectorAll(".view-tab").forEach(function (tab) {
      tab.addEventListener("click", function () {
        state.viewMode = tab.dataset.view;
        document.querySelectorAll(".view-tab").forEach(function (t) {
          var active = t === tab;
          t.setAttribute("aria-pressed", String(active));
          t.classList.toggle("outline", !active);
        });
        renderCalendar();
      });
    });

    document.getElementById("todayBtn").addEventListener("click", function () {
      state.viewYear = today.getFullYear();
      state.viewMonth = today.getMonth();
      renderCalendar();
    });

    document.getElementById("closeModal").addEventListener("click", closeModal);
    document.getElementById("dayModal").addEventListener("click", function (e) {
      if (e.target.id === "dayModal") closeModal();
    });

    document.getElementById("exportBtn").addEventListener("click", exportJSON);
    document.getElementById("importBtn").addEventListener("click", function () {
      document.getElementById("importInput").click();
    });
    document.getElementById("importInput").addEventListener("change", function (e) {
      var file = e.target.files[0];
      if (file) importJSON(file);
      e.target.value = "";
    });
  }

  document.addEventListener("DOMContentLoaded", init);

  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("service-worker.js").catch(function (e) {
        console.warn("Service worker registration failed", e);
      });
    });
  }
})();
