(function () {
  "use strict";

  var footerObserver;

  function initialiseBottomNavigation() {
    if (footerObserver) {
      footerObserver.disconnect();
      footerObserver = null;
    }

    var navigation = document.querySelector(".prev-next-buttons");
    var footer = document.getElementById("main-footer");

    if (!navigation || !footer) return;

    if (!("IntersectionObserver" in window)) {
      navigation.classList.add("prev-next-buttons--docked");
      return;
    }

    footerObserver = new IntersectionObserver(function (entries) {
      navigation.classList.toggle("prev-next-buttons--docked", entries[0].isIntersecting);
    });

    footerObserver.observe(footer);
  }

  document.addEventListener("DOMContentLoaded", initialiseBottomNavigation);
  document.addEventListener("htmx:afterSettle", initialiseBottomNavigation);
})();
