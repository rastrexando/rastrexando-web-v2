(function () {
  "use strict";

  var storageKey = "rastrexando-theme";
  var darkScheme = window.matchMedia("(prefers-color-scheme: dark)");

  function storedTheme() {
    try {
      var value = localStorage.getItem(storageKey);
      return value === "light" || value === "dark" ? value : null;
    } catch (error) {
      return null;
    }
  }

  function updateTheme(theme) {
    var resolvedTheme = theme || (darkScheme.matches ? "dark" : "light");
    var root = document.documentElement;
    var toggle = document.getElementById("theme-toggle");
    var themeColor = document.getElementById("theme-color");

    if (theme) {
      root.dataset.theme = theme;
    } else {
      delete root.dataset.theme;
    }

    root.dataset.resolvedTheme = resolvedTheme;
    root.style.colorScheme = resolvedTheme;

    if (themeColor) {
      themeColor.content = resolvedTheme === "dark" ? "#11141c" : "#f5f7fa";
    }

    if (toggle) {
      var darkIsActive = resolvedTheme === "dark";
      var label = darkIsActive ? "Activar tema claro" : "Activar tema escuro";
      toggle.setAttribute("aria-pressed", darkIsActive ? "true" : "false");
      toggle.setAttribute("aria-label", label);
      toggle.setAttribute("title", label);
    }
  }

  function saveTheme(theme) {
    try {
      localStorage.setItem(storageKey, theme);
    } catch (error) {
      // The selected theme still applies for the current page if storage is unavailable.
    }
  }

  function initialiseThemeToggle() {
    var toggle = document.getElementById("theme-toggle");
    updateTheme(storedTheme());

    if (!toggle || toggle.dataset.themeReady === "true") return;

    toggle.dataset.themeReady = "true";
    toggle.addEventListener("click", function () {
      var nextTheme = document.documentElement.dataset.resolvedTheme === "dark" ? "light" : "dark";
      saveTheme(nextTheme);
      updateTheme(nextTheme);
    });
  }

  darkScheme.addEventListener("change", function () {
    if (!storedTheme()) updateTheme(null);
  });

  document.addEventListener("DOMContentLoaded", initialiseThemeToggle);
  window.addEventListener("pageshow", initialiseThemeToggle);
})();
