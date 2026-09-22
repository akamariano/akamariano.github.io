function checkLogin(event) {
	imprimirArbolDesdeLocalStorage();
	console.log(cargarArbolDesdeLocalStorage());
	event.preventDefault();
	
	// Obtener los valores de entrada de usuario y contraseña
	var username = document.getElementById("username").value;
	var password = document.getElementById("password").value;

	// Verificar si el usuario y la contraseña son correctos
	if (username === "admin" && password === "admin") {
		// Redirigir al usuario a la página de admin
		window.location.replace("admin.html");
	} else {
		// Mostrar un mensaje de error
		iniciarSesion(username,password);
		
		
	}
}

var loginForm = document.getElementById("loginForm");
loginForm.addEventListener("submit", checkLogin);
