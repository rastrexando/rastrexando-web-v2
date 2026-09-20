(function () {
  "use strict";

  var STATE_LABELS = {
    past: "Eventos pasados",
    upcoming: "Eventos de hoxe ou próximos",
    mixed: "Eventos pasados e próximos"
  };

  var STATE_SYMBOLS = {
    past: "✓",
    upcoming: "P",
    mixed: "±"
  };
  var ACTIVE_MAPS = new Set();
  var EXPANDED_MAP = null;

  function addControlLabel(container, text, side) {
    container.classList.add("map-labeled-control", "map-labeled-control--" + side);
    container.dataset.controlLabel = text;
  }

  function addZoomControlLabel(map) {
    var container = map.zoomControl && map.zoomControl.getContainer();
    if (container) addControlLabel(container, "Zoom", "left");
  }

  function updateExpandButton(button, expanded) {
    var label = expanded ? "Saír da pantalla completa" : "Ampliar mapa";
    button.setAttribute("aria-label", label);
    button.setAttribute("aria-pressed", String(expanded));
    button.title = label;
    if (button.parentNode) {
      button.parentNode.dataset.controlLabel = expanded ? "Saír" : "Pantalla completa";
    }
  }

  function refreshMapSize(map, resetView) {
    window.requestAnimationFrame(function () {
      map.invalidateSize({ pan: false });
      if (resetView) resetView();
    });
  }

  function setMapExpanded(canvas, map, button, expanded, restoreFocus) {
    if (expanded && EXPANDED_MAP && EXPANDED_MAP.canvas !== canvas) {
      setMapExpanded(
        EXPANDED_MAP.canvas,
        EXPANDED_MAP.map,
        EXPANDED_MAP.button,
        false,
        false
      );
    }

    canvas.classList.toggle("map-is-expanded", expanded);
    document.documentElement.classList.toggle("map-expanded", expanded);
    document.body.classList.toggle("map-expanded", expanded);
    updateExpandButton(button, expanded);

    if (expanded) {
      map.scrollWheelZoom.enable();
      EXPANDED_MAP = { canvas: canvas, map: map, button: button };
    } else {
      map.scrollWheelZoom.disable();
      if (EXPANDED_MAP && EXPANDED_MAP.canvas === canvas) EXPANDED_MAP = null;
    }

    refreshMapSize(map, canvas._resetMapView);
    if (expanded && canvas._mapCloseButton) {
      canvas._mapCloseButton.focus({ preventScroll: true });
    } else if (!expanded && restoreFocus && button.isConnected) {
      button.focus({ preventScroll: true });
    }
  }

  function addExpandedBar(canvas, map, expandButton) {
    var bar = L.DomUtil.create("div", "map-expanded-bar", canvas);
    var logo = L.DomUtil.create("img", "map-expanded-logo", bar);
    var copy = L.DomUtil.create("span", "map-expanded-copy", bar);
    var eyebrow = L.DomUtil.create("span", "map-expanded-eyebrow", copy);
    var title = L.DomUtil.create("strong", "map-expanded-title", copy);
    var closeButton = L.DomUtil.create("button", "map-expanded-close", bar);

    logo.src = "/recursos/rastrexando-simbolo.png";
    logo.alt = "";
    logo.width = 40;
    logo.height = 40;
    eyebrow.textContent = "Rastrexando · " + (canvas.dataset.mapKind || "Mapa");
    title.textContent = canvas.dataset.mapTitle || canvas.getAttribute("aria-label") || "Mapa";
    closeButton.type = "button";
    closeButton.innerHTML =
      '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m6 6 12 12M18 6 6 18" /></svg>' +
      "<span>Pechar mapa</span>";
    closeButton.setAttribute("aria-label", "Pechar mapa");

    L.DomEvent.disableClickPropagation(bar);
    L.DomEvent.disableScrollPropagation(bar);
    closeButton.addEventListener("click", function () {
      setMapExpanded(canvas, map, expandButton, false, true);
    });
    canvas._mapCloseButton = closeButton;
  }

  function addExpandControl(canvas, map) {
    var control = L.control({ position: "topright" });
    var button;

    control.onAdd = function () {
      var container = L.DomUtil.create("div", "leaflet-bar map-expand-control");
      button = L.DomUtil.create("button", "map-expand-button", container);
      button.type = "button";
      button.innerHTML =
        '<svg class="map-expand-icon map-expand-icon--enter" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M4 9V4h5M15 4h5v5M20 15v5h-5M9 20H4v-5" />' +
        '</svg>' +
        '<svg class="map-expand-icon map-expand-icon--exit" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M9 4v5H4M20 9h-5V4M15 20v-5h5M4 15h5v5" />' +
        '</svg>';
      addControlLabel(container, "Pantalla completa", "right");
      updateExpandButton(button, false);

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      button.addEventListener("click", function () {
        setMapExpanded(canvas, map, button, !canvas.classList.contains("map-is-expanded"), true);
      });

      return container;
    };

    control.addTo(map);
    addExpandedBar(canvas, map, button);
  }

  function addResetControl(canvas, map, resetView, label) {
    var control = L.control({ position: "topleft" });
    canvas._resetMapView = resetView;

    control.onAdd = function () {
      var container = L.DomUtil.create("div", "leaflet-bar map-reset-control");
      var button = L.DomUtil.create("button", "map-reset-button", container);
      button.type = "button";
      button.title = label;
      button.setAttribute("aria-label", label);
      button.innerHTML =
        '<svg class="map-reset-icon" viewBox="0 0 24 24" aria-hidden="true">' +
          '<path d="M8 4H4v4M16 4h4v4M20 16v4h-4M8 20H4v-4" />' +
          '<circle cx="9" cy="10" r="1.4" /><circle cx="15" cy="14" r="1.4" />' +
        '</svg>';
      addControlLabel(container, "Centrar", "left");

      L.DomEvent.disableClickPropagation(container);
      L.DomEvent.disableScrollPropagation(container);
      button.addEventListener("click", function () {
        map.closePopup();
        resetView();
      });
      return container;
    };

    control.addTo(map);
  }

  function collapseExpandedMap(restoreFocus) {
    if (!EXPANDED_MAP) return;
    var current = EXPANDED_MAP;
    setMapExpanded(current.canvas, current.map, current.button, false, restoreFocus);
  }

  function addTileLayer(map) {
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19
    }).addTo(map);
  }

  function registerMap(owner, map) {
    owner._leafletMap = map;
    ACTIVE_MAPS.add({ owner: owner, map: map });
  }

  function localISODate(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, "0");
    var day = String(date.getDate()).padStart(2, "0");
    return year + "-" + month + "-" + day;
  }

  function eventState(date, today) {
    return date < today ? "past" : "upcoming";
  }

  function combinedState(events, today) {
    var states = new Set(events.map(function (event) {
      return eventState(event.date, today);
    }));
    return states.size === 1 ? Array.from(states)[0] : "mixed";
  }

  function stateFromMarkers(markers) {
    var states = new Set(markers.map(function (marker) {
      return marker.options.calendarState;
    }));
    return states.size === 1 ? Array.from(states)[0] : "mixed";
  }

  function formatDate(date) {
    return new Intl.DateTimeFormat("gl", {
      day: "numeric",
      month: "long",
      year: "numeric"
    }).format(new Date(date + "T12:00:00"));
  }

  function markerIcon(state, eventCount) {
    var count = eventCount > 1
      ? '<span class="calendar-map-marker-count">' + eventCount + "</span>"
      : "";

    return L.divIcon({
      className: "calendar-map-div-icon",
      html:
        '<span class="calendar-map-marker calendar-map-marker--' + state + '">' +
          '<span aria-hidden="true">' + STATE_SYMBOLS[state] + "</span>" +
          count +
          '<span class="visually-hidden">' + STATE_LABELS[state] + "</span>" +
        "</span>",
      iconSize: [38, 46],
      iconAnchor: [19, 44],
      popupAnchor: [0, -42]
    });
  }

  function clusterIcon(cluster) {
    var markers = cluster.getAllChildMarkers();
    var state = stateFromMarkers(markers);
    var locationCount = markers.length;
    var eventCount = markers.reduce(function (total, marker) {
      return total + marker.options.calendarEventCount;
    }, 0);
    var accessibleLabel = STATE_LABELS[state] + ": " + eventCount +
      (eventCount === 1 ? " evento" : " eventos") + " en " + locationCount +
      (locationCount === 1 ? " localización" : " localizacións");

    return L.divIcon({
      className: "calendar-map-cluster-icon",
      html:
        '<span class="calendar-map-cluster calendar-map-cluster--' + state + '">' +
          '<strong aria-hidden="true">' + eventCount + "</strong>" +
          '<small aria-hidden="true">' + STATE_SYMBOLS[state] + "</small>" +
          '<span class="visually-hidden">' + accessibleLabel + "</span>" +
        "</span>",
      iconSize: [48, 48]
    });
  }

  function popupContent(location, state) {
    var wrapper = document.createElement("div");
    wrapper.className = "calendar-map-popup";

    var heading = document.createElement("strong");
    heading.className = "calendar-map-popup-location";
    heading.textContent = location.name;
    wrapper.appendChild(heading);

    var status = document.createElement("span");
    status.className = "calendar-map-popup-status calendar-map-popup-status--" + state;
    status.textContent = STATE_LABELS[state];
    wrapper.appendChild(status);

    var list = document.createElement("ul");
    location.events.forEach(function (event) {
      var item = document.createElement("li");
      var link = document.createElement("a");
      var date = document.createElement("time");

      link.href = event.url;
      link.textContent = event.title;
      link.setAttribute("hx-get", event.url);
      link.setAttribute("hx-target", "#main-container");
      link.setAttribute("hx-select", "#main-container");
      link.setAttribute("hx-swap", "outerHTML");
      link.setAttribute("hx-push-url", "true");

      date.dateTime = event.date;
      date.textContent = formatDate(event.date);

      item.appendChild(link);
      item.appendChild(date);
      list.appendChild(item);
    });
    wrapper.appendChild(list);

    if (window.htmx) window.htmx.process(wrapper);
    return wrapper;
  }

  function mapSections(root) {
    var sections = [];
    if (root && root.matches && root.matches("[data-calendar-map]")) sections.push(root);
    if (root && root.querySelectorAll) {
      sections = sections.concat(Array.from(root.querySelectorAll("[data-calendar-map]")));
    }
    return sections;
  }

  function initialiseMap(section) {
    if (section._leafletMap || !window.L) return;

    var canvas = section.querySelector("[data-map-canvas]");
    var dataNode = section.querySelector("[data-calendar-map-data]");
    var empty = section.querySelector("[data-map-empty]");
    var summary = section.querySelector("[data-map-summary]");
    if (!canvas || !dataNode) return;

    var data;
    try {
      data = JSON.parse(dataNode.textContent);
    } catch (error) {
      canvas.hidden = true;
      empty.hidden = false;
      empty.textContent = "Non foi posible cargar os datos do mapa.";
      return;
    }

    var locations = data.locations || [];
    canvas.dataset.mapKind = "Mapa de eventos";
    canvas.dataset.mapTitle = "Calendario " + data.year;
    var eventCount = locations.reduce(function (total, location) {
      return total + location.events.length;
    }, 0);

    summary.textContent = eventCount + (eventCount === 1 ? " evento" : " eventos") +
      " · " + locations.length + (locations.length === 1 ? " localización" : " localizacións");

    if (!locations.length) {
      canvas.hidden = true;
      empty.hidden = false;
      return;
    }

    var today = localISODate(new Date());
    var map = L.map(canvas, {
      scrollWheelZoom: false,
      zoomControl: true
    });
    registerMap(section, map);
    addTileLayer(map);
    addZoomControlLabel(map);
    addExpandControl(canvas, map);

    var clusterGroup = L.markerClusterGroup({
      iconCreateFunction: clusterIcon,
      maxClusterRadius: 48,
      showCoverageOnHover: false,
      spiderfyOnMaxZoom: true,
      disableClusteringAtZoom: 15
    });
    var bounds = [];

    locations.forEach(function (location) {
      var state = combinedState(location.events, today);
      var position = [location.lat, location.lng];
      var marker = L.marker(position, {
        icon: markerIcon(state, location.events.length),
        title: location.name + ". " + STATE_LABELS[state],
        calendarState: state,
        calendarEventCount: location.events.length
      });

      marker.bindPopup(popupContent(location, state), {
        maxWidth: 320,
        minWidth: 220
      });
      clusterGroup.addLayer(marker);
      bounds.push(position);
    });

    map.addLayer(clusterGroup);

    function resetCalendarView() {
      if (bounds.length === 1) {
        map.setView(bounds[0], 12, { animate: false });
      } else {
        map.fitBounds(bounds, { padding: [24, 24], maxZoom: 12, animate: false });
      }
    }

    resetCalendarView();
    addResetControl(canvas, map, resetCalendarView, "Centrar os marcadores");

    window.setTimeout(function () {
      if (section._leafletMap) section._leafletMap.invalidateSize();
    }, 0);
  }

  function initialiseEventMap(canvas) {
    if (canvas._leafletMap || !window.L) return;

    var latitude = Number(canvas.dataset.lat);
    var longitude = Number(canvas.dataset.lng);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return;

    var pagePost = canvas.closest(".page-post");
    var pageTitle = pagePost ? pagePost.querySelector("h1") : null;
    canvas.dataset.mapKind = "Evento";
    canvas.dataset.mapTitle = pageTitle ? pageTitle.textContent.trim() : canvas.dataset.location;

    var position = [latitude, longitude];
    var map = L.map(canvas, {
      center: position,
      zoom: 14,
      scrollWheelZoom: false,
      zoomControl: true
    });
    registerMap(canvas, map);
    addTileLayer(map);
    addZoomControlLabel(map);
    addExpandControl(canvas, map);

    L.marker(position, {
      title: canvas.dataset.location || "Localización aproximada"
    }).addTo(map);
    addResetControl(canvas, map, function () {
      map.setView(position, 14, { animate: false });
    }, "Centrar a localización");

    window.setTimeout(function () {
      if (canvas._leafletMap) canvas._leafletMap.invalidateSize();
    }, 0);
  }

  function initialiseMaps(root) {
    var scope = root || document;
    mapSections(scope).forEach(initialiseMap);
    if (scope.matches && scope.matches("[data-event-map]")) initialiseEventMap(scope);
    if (scope.querySelectorAll) {
      Array.from(scope.querySelectorAll("[data-event-map]")).forEach(initialiseEventMap);
    }
  }

  function cleanupMaps() {
    collapseExpandedMap(false);
    ACTIVE_MAPS.forEach(function (entry) {
      entry.map.remove();
      delete entry.owner._leafletMap;
    });
    ACTIVE_MAPS.clear();
  }

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape" && EXPANDED_MAP) {
      collapseExpandedMap(true);
    }
  });

  document.addEventListener("DOMContentLoaded", function () {
    initialiseMaps(document);
  });

  document.addEventListener("htmx:beforeSwap", cleanupMaps);
  document.addEventListener("htmx:beforeCleanupElement", function (event) {
    var removedElement = event.detail.elt;
    ACTIVE_MAPS.forEach(function (entry) {
      if (entry.owner === removedElement || removedElement.contains(entry.owner)) {
        if (EXPANDED_MAP && EXPANDED_MAP.map === entry.map) collapseExpandedMap(false);
        entry.map.remove();
        delete entry.owner._leafletMap;
        ACTIVE_MAPS.delete(entry);
      }
    });
  });

  document.addEventListener("htmx:afterSettle", function () {
    initialiseMaps(document);
  });
}());
