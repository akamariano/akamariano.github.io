// Método para cargar el archivo JSON
let graphText=""
var alumnos=[];
function loadJSON(callback) {
	var input = document.createElement('input');
	input.type = 'file';
	input.accept = '.json';
	input.onchange = function() {
		var file = this.files[0];
		var reader = new FileReader();
		reader.onload = function() {
			var data = JSON.parse(reader.result);
			alumnos = data.alumnos; // Actualizar la variable global con los datos de los alumnos
			callback(data);
		};
		reader.readAsText(file);
	};
	input.click();
}

// Método para actualizar la tabla con los datos del archivo cargado
function updateTable(data) {
	var table = document.getElementById('dataTable');
	var tbody = table.getElementsByTagName('tbody')[0];
	tbody.innerHTML = '';
	for (var i = 0; i < data.alumnos.length; i++) {
		var alumno = data.alumnos[i];
		var row = tbody.insertRow();
		var carnetCell = row.insertCell();
		var nombreCell = row.insertCell();
		var passCell = row.insertCell();
		carnetCell.innerHTML = alumno.carnet;
		nombreCell.innerHTML = alumno.nombre;
		carnetCell.innerHTML = alumno.carnet;
		passCell.innerHTML = alumno.password;
	}
}

// Función para cargar el archivo y actualizar la tabla
function loadFile() {
	loadJSON(updateTable);
}

//////////////////////////
class NodoAVL {
	constructor(valor,nombre, contraseña,nario,circular) {
	  this.valor = valor;
	  this.nombre = nombre;
	  this.contraseña = contraseña;
	  this.nario=nario;
	  this.circular=circular;
	  this.izquierdo = null;
	  this.derecho = null;
	  this.altura = 1;
	}
  }
  
  class AVL {
	constructor() {
	  this.raiz = null;
	}
  
	// Función auxiliar para calcular la altura de un nodo
	altura(nodo) {
	  if (nodo === null) {
		return 0;
	  }
	  return nodo.altura;
	}
  
	// Función auxiliar para obtener el factor de balance de un nodo
	balanceFactor(nodo) {
	  if (nodo === null) {
		return 0;
	  }
	  return this.altura(nodo.izquierdo) - this.altura(nodo.derecho);
	}
  
	// Función auxiliar para realizar una rotación hacia la izquierda
	// (reenlaza los nodos en vez de copiar sus campos uno por uno, que era
	// la causa de que se perdieran o duplicaran estudiantes al balancear)
	rotacionIzquierda(nodo) {
	  const nuevaRaiz = nodo.derecho;
	  nodo.derecho = nuevaRaiz.izquierdo;
	  nuevaRaiz.izquierdo = nodo;

	  nodo.altura = Math.max(this.altura(nodo.izquierdo), this.altura(nodo.derecho)) + 1;
	  nuevaRaiz.altura = Math.max(this.altura(nuevaRaiz.izquierdo), this.altura(nuevaRaiz.derecho)) + 1;

	  return nuevaRaiz;
	}
  
	// Función auxiliar para realizar una rotación hacia la derecha
	rotacionDerecha(nodo) {
	  const nuevaRaiz = nodo.izquierdo;
	  nodo.izquierdo = nuevaRaiz.derecho;
	  nuevaRaiz.derecho = nodo;

	  nodo.altura = Math.max(this.altura(nodo.izquierdo), this.altura(nodo.derecho)) + 1;
	  nuevaRaiz.altura = Math.max(this.altura(nuevaRaiz.izquierdo), this.altura(nuevaRaiz.derecho)) + 1;

	  return nuevaRaiz;
	}
  
	// Función para insertar un nodo en el árbol AVL
	insertar(valor,nombre,contraseña,nario,circular) {
	  this.raiz = this.insertarNodo(this.raiz, valor,nombre,contraseña,nario,circular);
	}
  
	insertarNodo(nodo, valor,nombre,contraseña,nario,circular) {
	  // Si el nodo es nulo, lo creamos con el valor dado
	  if (nodo === null) {
		
		return new NodoAVL(valor,nombre,contraseña,nario,circular);
	  }
  
	  // Si el valor es menor que el valor del nodo actual, insertamos en el subárbol izquierdo
	  if (valor < nodo.valor) {
		nodo.izquierdo = this.insertarNodo(nodo.izquierdo, valor,nombre,contraseña,nario,circular);
	  }
  
	  // Si el valor es mayor que el valor del nodo actual, insertamos en el subárbol derecho
	  else if (valor > nodo.valor) {
		nodo.derecho = this.insertarNodo(nodo.derecho, valor,nombre,contraseña,nario,circular);
	  }
  
	  // Si el valor es igual al valor del nodo actual, no hacemos nada
	  else {
		return nodo;
		}
	// Actualizamos la altura del nodo actual
nodo.altura = 1 + Math.max(this.altura(nodo.izquierdo), this.altura(nodo.derecho));

// Calculamos el factor de balance del nodo actual
const factorBalance = this.balanceFactor(nodo);

// Si el factor de balance es mayor que 1, significa que el árbol está desequilibrado hacia la izquierda
if (factorBalance > 1) {
  // Si el valor a insertar es menor que el valor del nodo hijo izquierdo, realizamos una rotación hacia la derecha
  if (valor < nodo.izquierdo.valor) {
    return this.rotacionDerecha(nodo);
  }
  // Si el valor a insertar es mayor que el valor del nodo hijo izquierdo, realizamos una rotación izquierda-derecha
  else {
    nodo.izquierdo = this.rotacionIzquierda(nodo.izquierdo);
    return this.rotacionDerecha(nodo);
  }
}

// Si el factor de balance es menor que -1, significa que el árbol está desequilibrado hacia la derecha
if (factorBalance < -1) {
  // Si el valor a insertar es mayor que el valor del nodo hijo derecho, realizamos una rotación hacia la izquierda
  if (valor > nodo.derecho.valor) {
    return this.rotacionIzquierda(nodo);
  }
  // Si el valor a insertar es menor que el valor del nodo hijo derecho, realizamos una rotación derecha-izquierda
  else {
    nodo.derecho = this.rotacionDerecha(nodo.derecho);
    return this.rotacionIzquierda(nodo);
  }
}

// Si el factor de balance está entre -1 y 1, el árbol está equilibrado
return nodo;
	}
// Función para imprimir el árbol AVL
imprimir() {
	this.imprimirNodo(this.raiz);
	let graph = "digraph G {\n";
	graph += "node [fontname=\"Arial\"];\n";
	graph += this.imprimirNodo1(this.raiz);
	graph += "}";
	console.log(graph)
	graphText=graph
	// console.log("TEXTTTT"+graphText+"TERMINA")
	return graph;
  }
  imprimirNodo1(nodo) {
	let graph = "";
	if (nodo !== null) {
	  graph += `"${nodo.valor} - ${nodo.nombre}\\n${nodo.altura}" [shape=rectangle, style=filled, fillcolor=white];\n`;
	  if (nodo.izquierdo !== null) {
		graph += `"${nodo.valor} - ${nodo.nombre}\\n${nodo.altura}" -> "${nodo.izquierdo.valor} - ${nodo.izquierdo.nombre}\\n${nodo.izquierdo.altura}";\n`;
	  }
	  if (nodo.derecho !== null) {
		graph += `"${nodo.valor} - ${nodo.nombre}\\n${nodo.altura}" -> "${nodo.derecho.valor} - ${nodo.derecho.nombre}\\n${nodo.derecho.altura}";\n`;
	  }
	  graph += this.imprimirNodo1(nodo.izquierdo);
	  graph += this.imprimirNodo1(nodo.derecho);
	}
	return graph;
  }
	
	imprimirNodo(nodo) {
	if (nodo !== null) {
	console.log("Carnet: " + nodo.valor + " - Nombre: " + nodo.nombre + " - Altura: " + nodo.altura+" - Contraseña: " + nodo.contraseña+"NARIO:"+nodo.nario);
	this.imprimirNodo(nodo.izquierdo);
	this.imprimirNodo(nodo.derecho);
	}
	}
	imprimirpos() {
		this.imprimirNodoPostorden(this.raiz);
	}
	
	imprimirNodoPostorden(nodo) {
		if (nodo !== null) {
			this.imprimirNodoPostorden(nodo.izquierdo);
			this.imprimirNodoPostorden(nodo.derecho);
			console.log("Post orden Carnet: " + nodo.valor + " - Nombre: " + nodo.nombre + " - Altura: " + nodo.altura + " - Contraseña: " + nodo.contraseña);
		}
	}
	imprimirpre() {
		this.imprimirNodoPreorden(this.raiz);
	}
	
	imprimirNodoPreorden(nodo) {
		if (nodo !== null) {
			console.log("PreOrden Carnet: " + nodo.valor + " - Nombre: " + nodo.nombre + " - Altura: " + nodo.altura + " - Contraseña: " + nodo.contraseña);
			this.imprimirNodoPreorden(nodo.izquierdo);
			this.imprimirNodoPreorden(nodo.derecho);
		}
	}
	}
const arbolAVL = new AVL();
function addprint(){
	// Recorrer los datos de los alumnos y agregarlos al árbol AVL
	for (var i = 0; i < alumnos.length; i++) {
		arbolnario1 = new ArbolNArio();
		Lcircular = new ListaCircular();
		const arregloLineal2 = convertirListaCircularAArregloLineal(Lcircular);
		console.log(arbolnario1)
		arbolAVL.insertar(alumnos[i].carnet,alumnos[i].nombre,alumnos[i].password,arbolnario1,arregloLineal2);
	}

arbolAVL.imprimir(); // 
graficar_binario();
guardarArbolEnLocalStorage(arbolAVL);
imprimirArbolDesdeLocalStorage();

// iniciarSesion(12345,"abc123");
}

function graficar_binario(){
	const lienzo = document.getElementById("lienzo");
	try {
		d3.select("#lienzo").graphviz()
			.width(3000)
			.height(1000)
			.onerror(function () { mostrarErrorGrafico(); })
			.renderDot(graphText);
		// Si la librería externa (WASM en un Web Worker) no logra cargar,
		// no siempre dispara onerror — verificamos tras un momento.
		setTimeout(function () {
			if (lienzo && !lienzo.querySelector("svg")) {
				mostrarErrorGrafico();
			}
		}, 4000);
	} catch (e) {
		mostrarErrorGrafico();
	}

}
function mostrarErrorGrafico(){
	const lienzo = document.getElementById("lienzo");
	if (lienzo && !lienzo.querySelector("svg")) {
		lienzo.innerHTML = '<p style="color:#6e6e73;font-size:0.875rem;margin:0;">' +
			'No se pudo cargar el visualizador gráfico (librería externa). ' +
			'Los datos del árbol siguen disponibles en los recorridos de arriba.</p>';
	}
}
// Función para guardar el árbol AVL en LocalStorage
function guardarArbolEnLocalStorage(arbol) {
	// Convertir el árbol a una cadena de texto JSON
	var arbolJson = JSON.stringify(arbol);
	// Almacenar la cadena en LocalStorage
	localStorage.setItem("arbolAVL", arbolJson);
  }

  function cargarArbolDesdeLocalStorage() {
	// Obtener la cadena de texto JSON del árbol almacenada en LocalStorage
	var arbolJson = localStorage.getItem("arbolAVL");
	// Si no hay ninguna cadena almacenada, retornar un árbol vacío
	if (!arbolJson) {
	  return new AVL();
	}
	// Convertir la cadena de texto JSON a un objeto JavaScript
	var arbolObj = JSON.parse(arbolJson);
	// Crear un nuevo árbol AVL con los datos cargados desde LocalStorage
	var arbol = new AVL();
	arbol.raiz = cargarNodoDesdeObj(arbolObj.raiz);
	return arbol;
  }
  function cargarNodoDesdeObj(nodoObj) {
	if (nodoObj === null) {
	  return null;
	}
	var nodo = new NodoAVL(nodoObj.valor, nodoObj.nombre, nodoObj.contraseña,nodoObj.nario,nodoObj.circular);

	nodo.izquierdo = cargarNodoDesdeObj(nodoObj.izquierdo);
	nodo.derecho = cargarNodoDesdeObj(nodoObj.derecho);
	nodo.altura = nodoObj.altura;
	return nodo;
  }
  function imprimirArbolDesdeLocalStorage() {
	// Cargar el árbol AVL desde LocalStorage
	var arbol = cargarArbolDesdeLocalStorage();
	// Recorrer el árbol en orden y mostrar sus valores
	recorrerEnOrden(arbol.raiz);
  }
  function avlToArray(nodo, array) {
	if (nodo !== null) {
	  avlToArray(nodo.izquierdo, array);
	  array.push({
		carnet: nodo.valor,
		nombre: nodo.nombre,
		password: nodo.contraseña,
		nario: nodo.nario
	  });
	  avlToArray(nodo.derecho, array);
	}
  }
  function actualizarNodo(carnet, nuevoNario) {
	// Cargar el árbol AVL desde LocalStorage
	const arbol = cargarArbolDesdeLocalStorage();
  
	// Buscar el nodo y actualizar sus datos
	const nodo = buscarNodo(arbol.raiz, carnet);
	if (nodo !== null) {
	  nodo.nario = nuevoNario;
	} else {
	  console.log("No se encontró el nodo con carnet:", carnet);
	  return;
	}
  
	// Guardar el árbol AVL actualizado en LocalStorage
	guardarArbolEnLocalStorage(arbol);
  }
  function actualizarNodoCircu(carnet, nuevaCirc) {
	// Cargar el árbol AVL desde LocalStorage
	const arbol = cargarArbolDesdeLocalStorage();
  
	// Buscar el nodo y actualizar sus datos
	const nodo = buscarNodo(arbol.raiz, carnet);
	if (nodo !== null) {
	  nodo.circular= nuevaCirc;
	} else {
	  console.log("No se encontró el nodo con carnet:", carnet);
	  return;
	}
  
	// Guardar el árbol AVL actualizado en LocalStorage
	guardarArbolEnLocalStorage(arbol);
  }
//   function convertAvlToArray() {
// 	const arbol = cargarArbolDesdeLocalStorage();
// 	const array = [];
// 	avlToArray(arbol.raiz, array);
// 	return array;
//   }
  // Función auxiliar para recorrer el árbol en orden
  function recorrerEnOrden(nodo) {
	if (nodo !== null) {
	  recorrerEnOrden(nodo.izquierdo);
	  console.log("Imprimiendo desde local storage:"+nodo.valor, nodo.nombre, nodo.contraseña,nodo.circular);
	  recorrerEnOrden(nodo.derecho);
	}
  }
//////////////////////////
function recorridosAVL() {
  const tableIn = document.getElementById('dataTableIn').getElementsByTagName('tbody')[0];
  const tablePost = document.getElementById('dataTablePost').getElementsByTagName('tbody')[0];
  const tablePre = document.getElementById('dataTablePre').getElementsByTagName('tbody')[0];

  function inorden(nodo) {
    if (nodo !== null) {
      inorden(nodo.izquierdo);
      const row = tableIn.insertRow();
      const carnetCell = row.insertCell();
      const nombreCell = row.insertCell();
      const passCell = row.insertCell();
      carnetCell.innerHTML = nodo.valor;
      nombreCell.innerHTML = nodo.nombre;
      passCell.innerHTML = nodo.contraseña;
      inorden(nodo.derecho);
    }
  }

  function postorden(nodo) {
    if (nodo !== null) {
      postorden(nodo.izquierdo);
      postorden(nodo.derecho);
      const row = tablePost.insertRow();
      const carnetCell = row.insertCell();
      const nombreCell = row.insertCell();
      const passCell = row.insertCell();
      carnetCell.innerHTML = nodo.valor;
      nombreCell.innerHTML = nodo.nombre;
      passCell.innerHTML = nodo.contraseña;
    }
  }

  function preorden(nodo) {
    if (nodo !== null) {
      const row = tablePre.insertRow();
      const carnetCell = row.insertCell();
      const nombreCell = row.insertCell();
      const passCell = row.insertCell();
      carnetCell.innerHTML = nodo.valor;
      nombreCell.innerHTML = nodo.nombre;
      passCell.innerHTML = nodo.contraseña;
      preorden(nodo.izquierdo);
      preorden(nodo.derecho);
    }
  }

  // Limpiar las tablas antes de agregar nuevos elementos
  tableIn.innerHTML = '';
  tablePost.innerHTML = '';
  tablePre.innerHTML = '';

  // Realizar los recorridos y agregar los nodos a las tablas correspondientes
  inorden(cargarArbolDesdeLocalStorage().raiz);
  postorden(cargarArbolDesdeLocalStorage().raiz);
  preorden(cargarArbolDesdeLocalStorage().raiz);
  
}
function BuscarUserPermison(carnet) {
	const arbol = cargarArbolDesdeLocalStorage();
	const nodoEncontrado = buscarNodo(arbol.raiz, carnet);
  
	if (nodoEncontrado !== null) {

	  return true
	} else {
	  alert("Error, el usuario a otrogar permisos no se encuentra en el sistema")
	  return false
	}
  }
function iniciarSesion(carnet, contraseña) {
	const arbol = cargarArbolDesdeLocalStorage();
	const nodoEncontrado = buscarNodo(arbol.raiz, carnet);
  
	if (nodoEncontrado !== null && nodoEncontrado.contraseña === contraseña) {
		
		setCarnetAndDisplay(carnet);
		console.log("Inicio de sesión exitoso");
		console.log(nodoEncontrado.circular);
		localStorage.setItem("currentuser", JSON.stringify({ valor: carnet, nario: nodoEncontrado.nario, circular: nodoEncontrado.circular}));
		guardarArbolNAEnLocalStorage(nodoEncontrado.nario);
		getcurrentuser();
		
		showAlert("Bienvenido "+carnet);
		window.location.assign("user.html");

	  return true
	} else {
	  console.log("Carnet o contraseña incorrectos");
	  return false
	}
  }
  function convertirListaCircularAArregloLineal(listaCircular) {
	let arregloLineal = [];
  
	if (listaCircular.cabeza === null) {
	  return arregloLineal;
	}
  
	let nodoActual = listaCircular.cabeza;
	do {
	  arregloLineal.push(nodoActual.fechaHora);
	  nodoActual = nodoActual.siguiente;
	} while (nodoActual !== listaCircular.cabeza);
  
	return arregloLineal;
  }
  
  function guardarListaCircularEnLocalStorage(listaCircular) {
	const arregloLineal = convertirListaCircularAArregloLineal(listaCircular);
	localStorage.setItem("listaCircular", JSON.stringify(arregloLineal));
  }
  
  function obtenerArregloLinealDeLocalStorage() {
	const datosGuardados = localStorage.getItem("listaCircular");
	return JSON.parse(datosGuardados) || [];
  }
  
  function convertirArregloLinealAListaCircular(arregloLineal) {
	const listaCircular = new ListaCircular();
	for (const fechaHora of arregloLineal) {
	  listaCircular.agregar(fechaHora);
	}
	return listaCircular;
  }
  
  function obtenerListaCircularDeLocalStorage() {
	const arregloLineal = obtenerArregloLinealDeLocalStorage();
	return convertirArregloLinealAListaCircular(arregloLineal);
  }
  function guardarArbolNAEnLocalStorage(arbol) {
	const arbolSerializado = JSON.stringify(arbol);
	localStorage.setItem('arbolNario', arbolSerializado);
  }
  
  function cargarArbolNADesdeLocalStorage() {
	const arbolSerializadoNa = localStorage.getItem('arbolNario');
	if (arbolSerializadoNa) {
	  const arbolObj = JSON.parse(arbolSerializadoNa);
	  const arbolNario = Object.assign(new ArbolNArio(), arbolObj);
	  arbolNario.raiz = Object.assign(new nodoArbol(), arbolObj.raiz);
	  return arbolNario;
	} else {
	  return null;
	}
  }
  function getcurrentuser(){
	const usuariocur = JSON.parse(localStorage.getItem("currentuser"));
console.log("Desde local usuario current:"+usuariocur.valor+"NARIO: "+usuariocur.nario); // Imprime el valor del carnet
console.log("CIRCULAR USER:"+usuariocur.circular);
ackon=convertirArregloLinealAListaCircular(usuariocur.circular);
guardarListaCircularEnLocalStorage(ackon);
cargarArbolNADesdeLocalStorage(); 

console.log(usuariocur.nario)
return usuariocur.nario
}
function getcurrentuserid(){
	const usuariocur = JSON.parse(localStorage.getItem("currentuser"));
console.log("Desde local usuario current:"+usuariocur.valor); // Imprime el valor del carnet
cargarArbolNADesdeLocalStorage();   
return usuariocur.valor
}
  
  // Función auxiliar para buscar un nodo con un valor específico en el árbol AVL
  function buscarNodo(nodo, valor) {
	if (nodo === null) {
	  return null;
	}
  
	if (valor < nodo.valor) {
	  return buscarNodo(nodo.izquierdo, valor);
	} else if (valor > nodo.valor) {
	  return buscarNodo(nodo.derecho, valor);
	} else {
	  return nodo;
	}
  }
  
//////////////////////////
// Cableado de botones: solo corre si el elemento existe en la página actual
// (admin.js se carga también en index.html porque el login depende de sus
// funciones de árbol AVL, así que estos botones no siempre están presentes).
var loadFileBtn = document.getElementById('loadFileBtn');
if (loadFileBtn) loadFileBtn.addEventListener('click', loadFile);

var reload = document.getElementById('btnreload');
if (reload) reload.addEventListener('click', recorridosAVL);

var avlvar = document.getElementById('avlload');
if (avlvar) avlvar.addEventListener('click', addprint);

var btnLogoutAdmin = document.getElementById("btnLogout");
if (btnLogoutAdmin) {
  btnLogoutAdmin.addEventListener("click", function () {
    window.location.href = "index.html";
  });
}

// Auto-carga: en cuanto se abre el panel de administración, trae
// alumnos.json y construye el árbol automáticamente, para que el flujo
// completo (tabla, árbol, recorridos) se vea sin tener que hacer clic en
// "Cargar archivo" primero. El botón sigue disponible por si se quiere
// cargar un archivo distinto.
if (loadFileBtn) {
  fetch('alumnos.json')
    .then(function (res) { return res.json(); })
    .then(function (data) {
      alumnos = data.alumnos;
      updateTable(data);
      addprint();
      recorridosAVL();
    })
    .catch(function (err) {
      console.log('No se pudo auto-cargar alumnos.json:', err);
    });
}
