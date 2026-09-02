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
  // a toggle. Optional data-collapse-noun="projects" tunes the generic label.
  document.querySelectorAll("[data-collapse-after]").forEach(function (section, i) {
    var limit = parseInt(section.getAttribute("data-collapse-after"), 10);
    var entries = Array.prototype.filter.call(section.children, function (el) {
      return el.classList.contains("entry");
    });
    if (!(limit >= 0) || entries.length <= limit) return;

    var overflow = entries.slice(limit);
    var noun = section.getAttribute("data-collapse-noun");
    var suffix = noun ? " " + noun : "";

    // Count the items actually hidden, not just the .entry blocks. One entry can
    // bundle several items in a trailing ul.more-projects list (the "Additional
    // Projects" entry), so expand that list into its item count. Derived from the
    // DOM, so the toggle label stays accurate as items are added or removed.
    var hidden = overflow.reduce(function (n, el) {
      var bundle = el.querySelector("ul.more-projects");
      return n + (bundle ? bundle.children.length : 1);
    }, 0);

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
      btn.innerHTML = (open ? "Show fewer" + suffix : "Show " + hidden + " more" + suffix) +
                      ' <span class="chev" aria-hidden="true">▾</span>';
    }
    btn.addEventListener("click", function () {
      setOpen(!section.classList.contains("is-open"));
    });
    setOpen(false);

    // Print styles reveal every project. Temporarily remove `inert` as well so
    // browser-generated PDFs retain the expanded content and its links.
    window.addEventListener("beforeprint", function () { region.inert = false; });
    window.addEventListener("afterprint", function () {
      region.inert = !section.classList.contains("is-open");
    });
  });

  // Keep the anchor-jump offset in sync with the live nav height — the bar
  // can wrap onto additional lines on narrow screens.
  var topnav = document.querySelector(".topnav");
  if (topnav) {
    var syncNavOffset = function () {
      document.documentElement.style.scrollPaddingTop = (topnav.offsetHeight + 2) + "px";
    };
    syncNavOffset();
    window.addEventListener("resize", syncNavOffset);
    // The theme button is revealed later, and web-font loading or narrow-screen
    // wrapping can also change the sticky bar's height without a window resize.
    if ("ResizeObserver" in window) {
      var navResizeObserver = new ResizeObserver(syncNavOffset);
      navResizeObserver.observe(topnav);
    }
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
      var nextId = null;
      entries.forEach(function (e) {
        if (e.isIntersecting) nextId = e.target.id;
      });

      if (nextId) {
        if (activeId && navLinks[activeId]) navLinks[activeId].removeAttribute("aria-current");
        activeId = nextId;
        navLinks[activeId].setAttribute("aria-current", "location");
        return;
      }

      entries.forEach(function (e) {
        if (!e.isIntersecting && e.target.id === activeId) {
          navLinks[activeId].removeAttribute("aria-current");
          activeId = null;
        }
      });
    }, { rootMargin: "-45% 0px -45% 0px", threshold: 0 });
    spyIds.forEach(function (id) { spy.observe(document.getElementById(id)); });
  }

  // Theme toggle — the inline head script set the initial [data-theme]; here we
  // wire the nav button to flip it and remember the choice.
  var themeToggle = document.querySelector('.theme-toggle');
  if (themeToggle) {
    themeToggle.hidden = false;
    var syncThemeToggle = function () {
      var dark = document.documentElement.getAttribute('data-theme') === 'dark';
      var label = dark ? 'Switch to light theme' : 'Switch to dark theme';
      themeToggle.setAttribute('aria-pressed', dark ? 'true' : 'false');
      themeToggle.setAttribute('aria-label', label);
      themeToggle.setAttribute('title', label);
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

  // On a direct visit to a fragment URL (for example, /#education), the
  // browser performs its initial anchor jump before the project overflow is
  // collapsed. Collapsing it changes the page height and can leave the target
  // far below the viewport. Realign the target once after all layout-changing
  // enhancements above have finished, while keeping ordinary in-page anchor
  // navigation smooth.
  if (window.location.hash.length > 1) {
    window.requestAnimationFrame(function () {
      var targetId;
      try {
        targetId = decodeURIComponent(window.location.hash.slice(1));
      } catch (e) {
        targetId = window.location.hash.slice(1);
      }
      var target = document.getElementById(targetId);
      if (!target) return;

      var previousScrollBehavior = document.documentElement.style.scrollBehavior;
      document.documentElement.style.scrollBehavior = "auto";
      target.scrollIntoView();
      document.documentElement.style.scrollBehavior = previousScrollBehavior;
    });
  }
})();
