(function () {
  "use strict";

  var PARAMETER_NAMES = ["canal", "organizacion", "ano"];

  function selectedFilters(form) {
    return {
      canal: form.elements.canal.value,
      organizacion: form.elements.organizacion.value,
      ano: form.elements.ano.value
    };
  }

  function updateUrl(filters) {
    var url = new URL(window.location.href);

    PARAMETER_NAMES.forEach(function (name) {
      if (filters[name]) {
        url.searchParams.set(name, filters[name]);
      } else {
        url.searchParams.delete(name);
      }
    });

    window.history.replaceState(window.history.state, "", url.pathname + url.search + url.hash);
  }

  function initialiseVideoCatalog(catalog) {
    if (!catalog || catalog.dataset.videoFiltersReady === "true") return;

    var form = catalog.querySelector("[data-video-filters]");
    var cards = Array.prototype.slice.call(catalog.querySelectorAll("[data-video-card]"));
    var count = catalog.querySelector("[data-video-count]");
    var empty = catalog.querySelector("[data-video-empty]");
    var clearButton = catalog.querySelector("[data-video-filters-clear]");
    if (!form || !count || !empty || !clearButton || cards.length === 0) return;

    function applyFilters(writeUrl) {
      var filters = selectedFilters(form);
      var visibleCount = 0;

      cards.forEach(function (card) {
        var organizationSlugs = (card.dataset.videoOrganizations || "").split(",").filter(Boolean);
        var visible = (!filters.canal || card.dataset.videoChannel === filters.canal) &&
          (!filters.organizacion || organizationSlugs.indexOf(filters.organizacion) !== -1) &&
          (!filters.ano || card.dataset.videoYear === filters.ano);

        card.hidden = !visible;
        if (visible) visibleCount += 1;
      });

      count.textContent = visibleCount === 1 ? "1 vídeo publicado" : visibleCount + " vídeos publicados";
      empty.hidden = visibleCount !== 0;
      clearButton.hidden = !filters.canal && !filters.organizacion && !filters.ano;
      if (writeUrl) updateUrl(filters);
    }

    function syncFromUrl() {
      var parameters = new URLSearchParams(window.location.search);
      PARAMETER_NAMES.forEach(function (name) {
        form.elements[name].value = parameters.get(name) || "";
      });
      applyFilters(false);
    }

    form.addEventListener("change", function () {
      applyFilters(true);
    });

    clearButton.addEventListener("click", function () {
      form.reset();
      applyFilters(true);
      form.elements.canal.focus();
    });

    catalog.dataset.videoFiltersReady = "true";
    catalog.videoFiltersSyncFromUrl = syncFromUrl;
    form.hidden = false;
    syncFromUrl();
  }

  function initialiseVideoFilters() {
    document.querySelectorAll("[data-video-catalog]").forEach(initialiseVideoCatalog);
  }

  document.addEventListener("DOMContentLoaded", initialiseVideoFilters);
  document.addEventListener("htmx:afterSettle", initialiseVideoFilters);
  window.addEventListener("popstate", function () {
    document.querySelectorAll("[data-video-catalog]").forEach(function (catalog) {
      if (catalog.videoFiltersSyncFromUrl) catalog.videoFiltersSyncFromUrl();
    });
  });
})();
