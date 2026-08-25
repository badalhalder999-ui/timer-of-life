/**
 * Live age counter and life countdown.
 *
 * Both are calendar-accurate: months and days follow the real calendar,
 * not fixed 30-day approximations.
 */

(function () {
  "use strict";

  var LIFE_YEARS = 75;

  // Year, month index (0 = January), day
  var BIRTH_DATE = new Date(1996, 11, 5, 0, 0, 0);                    // 05 December 1996
  var END_DATE   = new Date(1996 + LIFE_YEARS, 11, 5, 0, 0, 0);       // 05 December 2071

  var UNITS = ["years", "months", "days", "hours", "minutes", "seconds"];

  /**
   * Break the span between two dates into calendar years, months, days,
   * hours, minutes and seconds. Assumes `from` is earlier than `to`.
   */
  function breakdown(from, to) {
    var years   = to.getFullYear() - from.getFullYear();
    var months  = to.getMonth()    - from.getMonth();
    var days    = to.getDate()     - from.getDate();
    var hours   = to.getHours()    - from.getHours();
    var minutes = to.getMinutes()  - from.getMinutes();
    var seconds = to.getSeconds()  - from.getSeconds();

    // Borrow from the next larger unit whenever a value goes negative.
    if (seconds < 0) { seconds += 60; minutes--; }
    if (minutes < 0) { minutes += 60; hours--; }
    if (hours   < 0) { hours   += 24; days--; }

    if (days < 0) {
      // Day 0 of the current month = last day of the previous month.
      var daysInMonth = new Date(to.getFullYear(), to.getMonth(), 0).getDate();

      // The start day is clamped to that month's length, so 31 Jan + 1 month
      // lands on 29 Feb rather than overflowing into negative days.
      days += daysInMonth - Math.min(from.getDate(), daysInMonth) + from.getDate();
      months--;
    }

    if (months < 0) { months += 12; years--; }

    return {
      years: years, months: months, days: days,
      hours: hours, minutes: minutes, seconds: seconds
    };
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  /** Collect the value elements of a panel into a { unit: element } map. */
  function collect(id) {
    var root = document.getElementById(id);
    var map = {};
    UNITS.forEach(function (unit) {
      map[unit] = root.querySelector('[data-unit="' + unit + '"]');
    });
    return map;
  }

  var ageEls       = collect("age");
  var countdownEls = collect("countdown");
  var pctEl        = document.getElementById("progress-pct");
  var fillEl       = document.getElementById("progress-fill");

  var ZERO = { years: 0, months: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };

  /** Write a breakdown into a panel, only touching values that changed. */
  function render(els, data) {
    UNITS.forEach(function (unit) {
      var el = els[unit];
      var text = unit === "years" ? String(data[unit]) : pad(data[unit]);
      if (el.textContent === text) return;

      el.textContent = text;

      if (unit === "seconds") {
        el.classList.remove("tick");
        void el.offsetWidth;          // restart the animation
        el.classList.add("tick");
      }
    });
  }

  /** Share of the 75-year span already elapsed. */
  function renderProgress(now) {
    var span    = END_DATE - BIRTH_DATE;
    var elapsed = now - BIRTH_DATE;
    var pct     = Math.min(Math.max(elapsed / span, 0), 1) * 100;
    var text    = pct.toFixed(2) + "%";

    if (pctEl.textContent === text) return;

    pctEl.textContent = text;
    fillEl.style.width = pct + "%";

    // Keep the badge over the tip of the fill, but nudged inside the
    // track at the extremes so it never hangs off either edge.
    pctEl.style.left = Math.min(Math.max(pct, 6), 94) + "%";
  }

  function tick() {
    var now = new Date();

    render(ageEls, breakdown(BIRTH_DATE, now));

    // Past the target date: hold the countdown at zero.
    render(countdownEls, now < END_DATE ? breakdown(now, END_DATE) : ZERO);

    renderProgress(now);
  }

  tick();
  setInterval(tick, 1000);
})();
