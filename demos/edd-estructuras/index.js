function checkLogin(event) {
	event.preventDefault();

	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;
	var errorMessage = document.getElementById("errorMessage");
	if (errorMessage) errorMessage.style.display = "none";

	if (username === "admin" && password === "admin") {
		window.location.replace("admin.html");
		return;
	}

	var ok = iniciarSesion(username, password);
	if (!ok && errorMessage) {
		errorMessage.style.display = "block";
	}
}

var loginForm = document.getElementById("loginForm");
if (loginForm) {
	loginForm.addEventListener("submit", checkLogin);
}
