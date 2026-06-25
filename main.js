// main.js — progressive-enhancement behaviour for the homepage.
// Loaded with `defer`, so the DOM is fully parsed before this runs. With JS
// disabled the page still works: every section/entry simply shows.
(function () {
  "use strict";

  // Footer year.
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  // Collapsible sections — the single knob is data-collapse-after="N" on a
  // <section>: the first N .entry items stay visible, the rest collapse behind
  // a toggle. Optional data-collapse-noun="projects" tunes the label.
  document.querySelectorAll("[data-collapse-after]").forEach(function (section, i) {
    var limit = parseInt(section.getAttribute("data-collapse-after"), 10);
    var entries = Array.prototype.filter.call(section.children, function (el) {
      return el.classList.contains("entry");
    });
    if (!(limit >= 0) || entries.length <= limit) return;

    var overflow = entries.slice(limit);
    var noun = section.getAttribute("data-collapse-noun");
    var suffix = noun ? " " + noun : "";

    // Wrap the overflow entries so their combined height can animate.
    var region = document.createElement("div");
    region.className = "collapse-region";
    region.id = "collapse-region-" + i;
    var inner = document.createElement("div");
    region.appendChild(inner);
    section.insertBefore(region, overflow[0]);
    overflow.forEach(function (el) { inner.appendChild(el); });

    var btn = document.createElement("button");
    btn.type = "button";
    btn.className = "collapse-toggle";
    btn.setAttribute("aria-controls", region.id);
    section.appendChild(btn);

    function setOpen(open) {
      section.classList.toggle("is-open", open);
      region.inert = !open;                       // keep collapsed links out of tab order / AT
      btn.setAttribute("aria-expanded", open ? "true" : "false");
      btn.innerHTML = (open ? "Show fewer" + suffix : "Show " + overflow.length + " more" + suffix) +
                      ' <span class="chev" aria-hidden="true">▾</span>';
    }
    btn.addEventListener("click", function () {
      setOpen(!section.classList.contains("is-open"));
    });
    setOpen(false);
  });

  // Keep the anchor-jump offset in sync with the live nav height — the bar
  // wraps to two lines on narrow screens, which makes it taller.
  var topnav = document.querySelector(".topnav");
  if (topnav) {
    var syncNavOffset = function () {
      document.documentElement.style.scrollPaddingTop = (topnav.offsetHeight + 2) + "px";
    };
    syncNavOffset();
    window.addEventListener("resize", syncNavOffset);
  }

  // Scrollspy — highlight the nav link for whichever section crosses the
  // viewport's mid-line. No-ops without IntersectionObserver; entirely off
  // without JS, so it degrades cleanly.
  var navLinks = {};
  Array.prototype.forEach.call(document.querySelectorAll(".topnav-links a[href^='#']"), function (a) {
    var sec = document.getElementById(a.getAttribute("href").slice(1));
    if (sec) navLinks[sec.id] = a;
  });
  var spyIds = Object.keys(navLinks);
  if (spyIds.length && "IntersectionObserver" in window) {
    var activeId = null;
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        if (activeId && navLinks[activeId]) navLinks[activeId].removeAttribute("aria-current");
        activeId = e.target.id;
        navLinks[activeId].setAttribute("aria-current", "location");
      });
    }, { rootMargin: "-50% 0px -50% 0px", threshold: 0 });
    spyIds.forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  // Theme toggle — the inline head script set the initial [data-theme]; here we
  // wire the nav button to flip it and remember the choice.
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    var syncThemeToggle = function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', dark ? 'Switch to light theme' : 'Switch to dark theme');
    };
    syncThemeToggle();
    themeToggle.addEventListener('click', function () {
      var next = document.documentElement.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
      document.documentElement.setAttribute('data-theme', next);
      try { localStorage.setItem('theme', next); } catch (e) { /* storage blocked */ }
      var tc = document.querySelector('meta[name="theme-color"]');
      if (tc) tc.setAttribute('content', next === 'dark' ? '#1b1e24' : '#173a5e');
      syncThemeToggle();
    });
  }
})();
