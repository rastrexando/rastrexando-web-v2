function updateRelativeDates() {
  var now = new Date();
  var spans = document.querySelectorAll(".relative-date[data-date]");
  for (var i = 0; i < spans.length; i++) {
    var span = spans[i];
    var date = new Date(span.dataset.date);
    var diffDays = Math.ceil((date - now) / (1000 * 60 * 60 * 24));
    var label = "";
    if (diffDays === 0) label = "Hoxe";
    else if (diffDays === 1) label = "Mañá";
    else if (diffDays > 1 && diffDays < 30) label = "En " + diffDays + " días";
    else if (diffDays >= 30 && diffDays < 60) label = "En 1 mes";
    else if (diffDays >= 60 && diffDays < 365) label = "En " + Math.round(diffDays / 30) + " meses";
    if (label) {
      span.textContent = label;
      span.style.display = "";
    } else {
      span.style.display = "none";
    }
  }
}

document.addEventListener("DOMContentLoaded", updateRelativeDates);
document.addEventListener("htmx:afterSwap", updateRelativeDates);
