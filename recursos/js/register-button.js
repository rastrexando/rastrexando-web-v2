function initRegisterButtons() {
  var buttons = document.querySelectorAll(".register-btn[data-event-date]");
  var now = new Date();
  now.setHours(0, 0, 0, 0);

  for (var i = 0; i < buttons.length; i++) {
    var btn = buttons[i];
    var eventDate = new Date(btn.dataset.eventDate);
    eventDate.setHours(0, 0, 0, 0);

    if (eventDate < now) {
      btn.style.display = "none";
    }
  }
}

function showRegisterDialog(btn) {
  var emailB64 = btn.dataset.e;
  var subject = btn.dataset.subject || "";
  var body = btn.dataset.body || "";

  var dialog = document.getElementById("register-dialog");
  if (!dialog) {
    dialog = document.createElement("dialog");
    dialog.id = "register-dialog";
    dialog.className = "register-dialog";
    dialog.innerHTML = `
      <div class="register-dialog-content">
        <h3>Abrir correo electrónico</h3>
        <p>Abrirase o teu cliente de correo cunha mensaxe xa preparada para que só teñas que revisala e enviala. Os datos (asunto, corpo e destinatario) veñen recheos automaticamente.</p>
        <p class="register-dialog-note"><i class="fi-info"></i> Podes consultar máis información no cartel do evento (a imaxe superior).</p>
        <div class="register-dialog-actions">
          <button type="button" class="register-dialog-cancel">Cancelar</button>
          <button type="button" class="register-dialog-confirm"><i class="fi-mail"></i> Abrir correo</button>
        </div>
      </div>
    `;
    document.body.appendChild(dialog);

    dialog.querySelector(".register-dialog-cancel").addEventListener("click", function () {
      dialog.close();
    });
  }

  var confirmBtn = dialog.querySelector(".register-dialog-confirm");
  var newConfirmBtn = confirmBtn.cloneNode(true);
  confirmBtn.parentNode.replaceChild(newConfirmBtn, confirmBtn);

  newConfirmBtn.addEventListener("click", function () {
    var email = atob(emailB64);
    var mailto = "mailto:" + encodeURIComponent(email) +
      "?subject=" + encodeURIComponent(subject) +
      "&body=" + encodeURIComponent(body);
    window.location.href = mailto;
    dialog.close();
  });

  dialog.showModal();
}

function attachRegisterListeners() {
  var buttons = document.querySelectorAll(".register-btn");
  for (var i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function (e) {
      showRegisterDialog(e.currentTarget);
    });
  }
}

function setupRegister() {
  initRegisterButtons();
  attachRegisterListeners();
}

document.addEventListener("DOMContentLoaded", setupRegister);
document.addEventListener("htmx:afterSwap", setupRegister);
