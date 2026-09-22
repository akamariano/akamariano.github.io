user=""
nuser=""
let globalCarnet = "";
function setCarnetAndDisplay(carnet) {
  guardarCarnet(carnet);
  globalCarnet = carnet;
  console.log("DESDE USER"+globalCarnet);
}
function guardarCarnet(carnet1){
console.log("carnet1"+carnet1);
globalCarnet = carnet1;
console.log("GLOBAL DESDE FUNCT"+globalCarnet);
return carnet1
}
function showAlert(message) {
    alert(message);
    user=message
    
  }
  function mostrarTextoEnH2(texto) {
    const elementoH2 = document.getElementById("texto-bienvenida");
    elementoH2.innerText = texto;
    nuser=texto;
  }
  
  class nodoArbol{
    
    constructor(valor, id){
        this.siguiente = null;
        this.valor = valor;
        this.primero = null;
        this.id = id;
        this.matriz = "";
        this.matrizarray="";
    }
}


class ArbolNArio{
    constructor(){
        this.raiz = new nodoArbol("/", 0)
        this.nodo_creados = 1;
    }
    notificarCambios() {
        hacerhtml();
    }
    deserializeMatrix(serialized) {
        
        const matrix = new Matriz();
        
        const files = serialized.convertedFiles;
       
        const permisos = serialized.permisos;
        files.forEach(file => {
            matrix.insertarArchivo(file.text, file.numero, file.nombreArchivo);
        }
        );
        permisos.forEach(permiso => {
            matrix.colocarPermiso(permiso.nombreArchivo, permiso.carnet, permiso.permisos);
        });
        return matrix;
    }
    insertararch(nombre){
    let ruta2 = document.getElementById("ruta2").value;
    let lista_carpeta = ruta2.split("/");
    let carpeta = this.BuscarCarpetaV2(lista_carpeta)
    if (carpeta!==null){
        console.log("Carpeta1"+carpeta);
        console.log("Lista Carpet"+lista_carpeta);
        let matrizGuardada = localStorage.getItem('miMatriz');
        let matrizObj = JSON.parse(matrizGuardada);
        if( matrizObj===null){
        if (carpeta.matriz === null){
            console.log("ESTÁ NULO")
        carpeta.matriz = new Matriz(carpeta.valor);
        carpeta.matriz.insertarArchivo(nombre,1);
        let p=JSON.stringify(carpeta.matriz);
        console.log(JSON.stringify(carpeta.matriz));
        localStorage.setItem('miMatriz', p);
    }
        }
        else{
            let matrizGuardada = localStorage.getItem('miMatriz');
            let matrizObj = JSON.parse(matrizGuardada);
            let a= this.deserializeMatrix(matrizObj);
            
            carpeta.matriz=a
            carpeta.matriz.insertarArchivo(nombre,1);
            let p=JSON.stringify(carpeta.matriz);
            console.log(JSON.stringify(carpeta.matriz));
            localStorage.setItem('miMatriz', p);
            reporteMatriz2(a);
        }
        let url = 'https://quickchart.io/graphviz?graph=';
        let body = carpeta.matriz.reporte();
        $("#image2").attr("src",url+body)
    }
    else{
        console.log("ENTRO AL ELSE");
        console.log("Lista Carpet"+lista_carpeta);
        console.log("Carpeta"+carpeta);
    }
    }
    BuscarCarpeta(carpeta_nueva, lista_carpeta){
        //Si la nueva carpeta se creara en la raiz, se buscara si existe o no
        if(lista_carpeta[1] === "" && this.raiz.primero !== null){
            let aux = this.raiz.primero
            while(aux){
                if(aux.valor === carpeta_nueva){
                    return 1
                }
                aux = aux.siguiente
            }
            return 2
        }
        //Si la nueva carpeta se creara en la raiz pero no existe ninguna carpeta
        else if (lista_carpeta[1] === "" && this.raiz.primero === null){
            return 5
        }
        //Si la nueva carpeta se creara en algun directorio pero la raiz no posee ninguna carpeta
        else if(lista_carpeta[1] !== "" && this.raiz.primero === null){
            return 3
        }
        //Buscamos el directorio padre y revisar si en sus hijos existe la carpeta
        else if(lista_carpeta[1] !== "" && this.raiz.primero !== null){
            let aux = this.raiz.primero
            let nivel = lista_carpeta.length
            let posicion = 1; 
            for(var i = 1; i < nivel; i++){
                if(aux !== null){
                    while(aux){
                        if(posicion < lista_carpeta.length && lista_carpeta[posicion] === aux.valor){
                            posicion++
                            if(aux.primero !== null && posicion < lista_carpeta.length){
                                aux = aux.primero
                            }
                            break;
                        }else{
                            aux = aux.siguiente
                        }
                    }
                }else{
                    break;
                }
            }
            if(aux !== null){
                aux = aux.primero
                while(aux){
                    if(aux.valor === carpeta_nueva){
                        return 1
                    }
                    aux = aux.siguiente
                }
                return 2
            }else{
                return 4
            }

        }
    }
    //Funcion solo para ordenar la lista de hijos cuando el padre posee varios hijos
    insertarOrdenado(raiz, nuevoNodo){
        let piv = raiz.primero
        if(nuevoNodo.valor < raiz.primero.valor){
            nuevoNodo.siguiente = raiz.primero
            raiz.primero = nuevoNodo
            return raiz
        }else{
            while(piv.siguiente){
                if( nuevoNodo.valor > piv.valor && nuevoNodo.valor < piv.siguiente.valor){
                    nuevoNodo.siguiente = piv.siguiente
                    piv.siguiente = nuevoNodo
                    return raiz
                }else if(nuevoNodo.valor < piv.valor){
                    nuevoNodo.siguiente = piv
                    piv =  nuevoNodo
                    return raiz
                }else{
                    piv = piv.siguiente
                }
            }
            piv.siguiente = nuevoNodo
            return raiz
        }
    }
    // /usac/prueba -> prueba1 /usac/prueba(prueba1)
    insertarHijos(carpeta_nueva, lista_carpeta){
        /**
         * creamos el nuevo nodo y aumentamos la cantidad de nodos creados
         */
        const nuevoNodo = new nodoArbol(carpeta_nueva, this.nodo_creados)
        this.nodo_creados++
        //Corroboramos si la insercion es en la raiz y si la raiz no tiene ninguna carpeta
        if(lista_carpeta[1] === "" && this.raiz.primero === null){
            this.raiz.primero = nuevoNodo
        }
        //Corroboramos si la insercion es en la raiz y pero la raiz ya tiene carpetas
        else if(lista_carpeta[1] === "" && this.raiz.primero !== null){
            this.raiz = this.insertarOrdenado(this.raiz, nuevoNodo)
        }
        //Corroboramos si la insercion es en algun directorio que no es la raiz
        else if(lista_carpeta[1] !== "" && this.raiz.primero !== null){
            let aux = this.raiz.primero
            let nivel = lista_carpeta.length
            let posicion = 1; 
            //Recorremos hasta llegar a la profundidad maxima donde se quiere insertar la nueva carpeta
            for(var i = 1; i < nivel; i++){
                if(aux !== null){
                    while(aux){
                        //Comparamos si las posiciones de la lista de carpetas es igual a la del nodo actual sino seguimos buscando
                        if(posicion < lista_carpeta.length && lista_carpeta[posicion] === aux.valor){ 
                            posicion++
                            //Esta comparacion es para asegurarnos que nos quedaremos en el nodo padre
                            if(aux.primero !== null && posicion < lista_carpeta.length){
                                aux = aux.primero
                            }
                            break;
                        }else{
                            aux = aux.siguiente
                        }
                    }
                }else{
                    break;
                }
            }
            //Si la carpeta padre ya tiene carpetas se agrega en el primero sino se manda a insertar en el orden correcto
            if(aux.primero === null){
                aux.primero = nuevoNodo
            }else{
                aux = this.insertarOrdenado(aux, nuevoNodo)
            }
        }
    }
    /**
     * 1 - Carpeta ya existe
     * 2 - la carpeta no existe
     * 3 - El directorio no es correcto o no es valido
     * 4 - Directorio no valido
     * 5 - No existe ninguna carpeta en la raiz
     * 
     */
    insertarValor(ruta, carpeta_nueva){
        let lista_carpeta = ruta.split('/')
        let existe_carpeta = this.BuscarCarpeta(carpeta_nueva, lista_carpeta)
        switch(existe_carpeta){
            case 1:
                alert("La carpeta ya existe")
                break;
            case 2:
                this.insertarHijos(carpeta_nueva, lista_carpeta)
                const listaCircularDesdeLocalStorage1 = obtenerListaCircularDeLocalStorage();
    const fechaHoraActual1 = new Date().toLocaleString();
    listaCircularDesdeLocalStorage1.agregar("Se Creó carpeta el: "+fechaHoraActual1);
    guardarListaCircularEnLocalStorage(listaCircularDesdeLocalStorage1);
    listaCircularDesdeLocalStorage1.imprimir();
    graficarListaCircular(listaCircularDesdeLocalStorage1);
 actualizarNodoCircu(getcurrentuserid(), convertirListaCircularAArregloLineal(listaCircularDesdeLocalStorage1));
 this.notificarCambios();
                break;
            case 3:
                alert("La ruta actual no existe")
                break;
            case 4:
                alert("La ruta actual no es valida")
                break;
            case 5:
                this.insertarHijos(carpeta_nueva, lista_carpeta)
                const listaCircularDesdeLocalStorage = obtenerListaCircularDeLocalStorage();
    const fechaHoraActual = new Date().toLocaleString();
    listaCircularDesdeLocalStorage.agregar("Se creó carpeta el: "+fechaHoraActual);
    guardarListaCircularEnLocalStorage(listaCircularDesdeLocalStorage);
    listaCircularDesdeLocalStorage.imprimir();
    graficarListaCircular(listaCircularDesdeLocalStorage);
 actualizarNodoCircu(getcurrentuserid(), convertirListaCircularAArregloLineal(listaCircularDesdeLocalStorage));
 this.notificarCambios();
                break;
        }
    }

    grafica_arbol(){
        var cadena = "";
        if(!(this.raiz === null)){
            cadena = "digraph arbol{ ";
            cadena = cadena + this.retornarValoresArbol(this.raiz);
            cadena = cadena + "}";
        }else{
            cadena = "digraph G { arbol }";
        }
        return cadena;
    }

    /** le mando el parametro primero y solo recorre los siguientes*/
    retornarValoresArbol(raiz){
        var cadena = "node[shape=record] ";
        let nodo = 1;
        let nodo_padre = 0;
        cadena += "nodo" + nodo_padre + "[label=\"" + this.raiz.valor  + "\"] "
        cadena += this.valoresSiguietes(this.raiz.primero, nodo, nodo_padre)
        cadena += this.conexionRamas(this.raiz.primero, 0)
        return cadena;
    }


    valoresSiguietes(raiz, nodo, nodo_padre){
        let cadena = ""
        let aux = raiz
        let nodo_padre_aumento = nodo_padre
        if(aux !== null){
            while(aux){
                cadena += "nodo" + aux.id + "[label=\"" + aux.valor  + "\"] "
                aux = aux.siguiente
            }
            aux = raiz
            while(aux){
                nodo_padre_aumento++
                cadena += this.valoresSiguietes(aux.primero, this.nodo_creados, nodo_padre_aumento)
                aux = aux.siguiente
            }
        }
        return cadena
    }

    conexionRamas(raiz, padre){
        let cadena = ""
        let aux = raiz
        if(aux !== null){
            while(aux){
                cadena += "nodo" + padre + " -> nodo" + aux.id + " "
                aux = aux.siguiente
            }
            aux = raiz
            while(aux){
                cadena += this.conexionRamas(aux.primero, aux.id)
                aux = aux.siguiente
            }
        }
        return cadena
    }
    eliminarCarpeta(ruta) {
        let lista_carpeta = ruta.split("/");
        let carpeta = this.BuscarCarpetaV2(lista_carpeta);
        if (carpeta === null) {
            alert("La carpeta no existe");
            return;
        }
    
        let nodoPadre = this.encontrarNodoPadre(lista_carpeta.slice(0, -1));
        if (nodoPadre === null) {
            alert("No se pudo encontrar el nodo padre");
            return;
        }
    
        let nodoAnterior = null;
        let nodoActual = nodoPadre.primero;
    
        while (nodoActual) {
            if (nodoActual === carpeta) {
                break;
            }
            nodoAnterior = nodoActual;
            nodoActual = nodoActual.siguiente;
        }
    
        if (nodoActual === null) {
            alert("No se pudo encontrar la carpeta en el nodo padre");
            return;
        }
    
        if (nodoAnterior === null) {
            nodoPadre.primero = nodoActual.siguiente;
        } else {
            nodoAnterior.siguiente = nodoActual.siguiente;
        }
    
        alert("Carpeta eliminada correctamente");
        const listaCircularDesdeLocalStorage = obtenerListaCircularDeLocalStorage();
    const fechaHoraActual = new Date().toLocaleString();
    listaCircularDesdeLocalStorage.agregar("Se eliminó carpeta el: "+fechaHoraActual);
    guardarListaCircularEnLocalStorage(listaCircularDesdeLocalStorage);
    listaCircularDesdeLocalStorage.imprimir();
    graficarListaCircular(listaCircularDesdeLocalStorage);
 actualizarNodoCircu(getcurrentuserid(), convertirListaCircularAArregloLineal(listaCircularDesdeLocalStorage));
 this.notificarCambios();
    }
    
    encontrarNodoPadre(lista_carpeta) {
        if (lista_carpeta.length === 1 && lista_carpeta[0] === "") {
            return this.raiz;
        }
    
        let aux = this.raiz.primero;
        let nivel = lista_carpeta.length;
        let posicion = 1;
    
        for (let i = 1; i < nivel; i++) {
            if (aux !== null) {
                while (aux) {
                    if (
                        posicion < lista_carpeta.length &&
                        lista_carpeta[posicion] === aux.valor
                    ) {
                        posicion++;
                        if (aux.primero !== null && posicion < lista_carpeta.length) {
                            aux = aux.primero;
                        }
                        break;
                    } else {
                        aux = aux.siguiente;
                    }
                }
            } else {
                break;
            }
        }
    
        return aux;
    }
    BuscarCarpetaNew(ruta){
        let lista_carpeta = ruta.split("/")
        if(lista_carpeta[1] === "" && this.raiz.primero !== null){
            return this.raiz
        }
        else if (lista_carpeta[1] === "" && this.raiz.primero === null){
            return null
        }
        else if(lista_carpeta[1] !== "" && this.raiz.primero === null){
            return null
        }
        else if(lista_carpeta[1] !== "" && this.raiz.primero !== null){
            let aux = this.raiz.primero
            let nivel = lista_carpeta.length
            let posicion = 1; 
            for(var i = 1; i < nivel; i++){
                if(aux !== null){
                    while(aux){
                        if(posicion < lista_carpeta.length && lista_carpeta[posicion] === aux.valor){
                            posicion++
                            if(aux.primero !== null && posicion < lista_carpeta.length){
                                aux = aux.primero
                            }
                            break;
                        }else{
                            aux = aux.siguiente
                        }
                    }
                }else{
                    break;
                }
            }
            if(aux !== null){
                return aux.matriz // En vez de retornar el nodo completo, retornamos solo la matriz
            }else{
                return null
            }
        }
    }
    /** Modificacion 30/03/2023 */
    BuscarCarpetaV2Matriz(lista_carpeta){
        //Directorio Actual seria la Raiz
        if(lista_carpeta[1] === "" && this.raiz.primero !== null){
            console.log("MATRIZ"+aux.matriz)
            return this.raiz.matriz
        }
        //Directorio Actual seria Raiz pero no contiene elementos
        else if (lista_carpeta[1] === "" && this.raiz.primero === null){
            return null
        }
        //Actual no es raiz pero tampoco hay elementos en raiz
        else if(lista_carpeta[1] !== "" && this.raiz.primero === null){
            return null
        }
        //Buscamos el directorio padre y revisar si en sus hijos existe la carpeta
        else if(lista_carpeta[1] !== "" && this.raiz.primero !== null){
            let aux = this.raiz.primero
            let nivel = lista_carpeta.length
            let posicion = 1; 
            for(var i = 1; i < nivel; i++){
                if(aux !== null){
                    while(aux){
                        if(posicion < lista_carpeta.length && lista_carpeta[posicion] === aux.valor){
                            posicion++
                            if(aux.primero !== null && posicion < lista_carpeta.length){
                                aux = aux.primero
                            }
                            break;
                        }else{
                            aux = aux.siguiente
                        }
                    }
                }else{
                    break;
                }
            }
            if(aux !== null){
                console.log("MATRIZ2"+aux.matriz)
                return aux.matriz
            }else{
                return null
            }

        }
    }
    modificarMatriz(ruta, nuevaMatriz) {
        let lista_carpeta = ruta.split("/");
        let carpeta = this.BuscarCarpetaV2(lista_carpeta);
        if (carpeta !== null) {
          carpeta.matriz = nuevaMatriz;
          localStorage.setItem('miMatriz', JSON.stringify(carpeta.matriz));
          hacerhtml();
          alert("Se han guardado los cambios");
        } else {
          alert("La carpeta no existe");
        }
      }
    BuscarCarpetaV2(lista_carpeta){
        //Directorio Actual seria la Raiz
        if(lista_carpeta[1] === "" && this.raiz.primero !== null){
            return this.raiz
        }
        //Directorio Actual seria Raiz pero no contiene elementos
        else if (lista_carpeta[1] === "" && this.raiz.primero === null){
            return null
        }
        //Actual no es raiz pero tampoco hay elementos en raiz
        else if(lista_carpeta[1] !== "" && this.raiz.primero === null){
            return null
        }
        //Buscamos el directorio padre y revisar si en sus hijos existe la carpeta
        else if(lista_carpeta[1] !== "" && this.raiz.primero !== null){
            let aux = this.raiz.primero
            let nivel = lista_carpeta.length
            let posicion = 1; 
            for(var i = 1; i < nivel; i++){
                if(aux !== null){
                    while(aux){
                        if(posicion < lista_carpeta.length && lista_carpeta[posicion] === aux.valor){
                            posicion++
                            if(aux.primero !== null && posicion < lista_carpeta.length){
                                aux = aux.primero
                            }
                            break;
                        }else{
                            aux = aux.siguiente
                        }
                    }
                }else{
                    break;
                }
            }
            if(aux !== null){
                return aux
            }else{
                return null
            }

        }
    }
    colocar(archivo,carnet,permiso){
        let ruta = document.getElementById("ruta2").value;
        let lista_carpeta = ruta.split("/");
        let carpeta = this.BuscarCarpetaV2(lista_carpeta);
        if (carpeta !== null){
            if (carpeta.matriz !== null){
                 
                 let matrizGuardada = localStorage.getItem('miMatriz');
            let matrizObj = JSON.parse(matrizGuardada);
            let a= this.deserializeMatrix(matrizObj);
            reporteMatriz2(a);
            carpeta.matriz=a
            carpeta.matriz.colocarPermiso(archivo,carnet,permiso)
            let p=JSON.stringify(carpeta.matriz);
            console.log(JSON.stringify(carpeta.matriz));
            localStorage.setItem('miMatriz', p);
                let url = 'https://quickchart.io/graphviz?graph=';
                let body = carpeta.matriz.reporte();
                $("#image2").attr("src", url + body);
                
            }
        }
    }
    mostrarCarpetasActuales(ruta){
        let lista_carpeta = ruta.split('/')
        let existe_carpeta = this.BuscarCarpetaV2(lista_carpeta)
        try{
            if(existe_carpeta !== null){
                let aux = existe_carpeta.primero
                while(aux){
                    console.log(aux.valor)
                    aux = aux.siguiente
                }
            }
        }catch(error){
            console.log("Hubo un error")
        }
    }
}

arbolnario = new ArbolNArio()
async function graficarListaCircular(listaCircular) {
    function generarCodigoGraphviz(listaCircular) {
      let codigo = "digraph G {\n";
  
      if (listaCircular.cabeza === null) {
        codigo += "}\n";
        return codigo;
      }
  
      let nodoActual = listaCircular.cabeza;
      let i = 0;
      do {
        codigo += `  ${i} [label=" ${i}: ${nodoActual.fechaHora}"];\n`;
        nodoActual = nodoActual.siguiente;
        i++;
      } while (nodoActual !== listaCircular.cabeza);
  
      for (let j = 0; j < i; j++) {
        codigo += `  ${j} -> ${j === i - 1 ? 0 : j + 1};\n`;
      }
  
      codigo += "}\n";
      return codigo;
    }
  
    const codigoGraphviz = generarCodigoGraphviz(listaCircular);
    const urlQuickChart = `https://quickchart.io/graphviz?graph=${encodeURIComponent(codigoGraphviz)}`;
    const response = await fetch(urlQuickChart);
    const blob = await response.blob();
    const objectURL = URL.createObjectURL(blob);
  
    // Establecer la URL de objeto como el atributo src del elemento <img> con id "image3"
    const imagen = document.getElementById("image3");
    imagen.src = objectURL;
  }
function agregarVarios(){
    
    arbolnario= cargarArbolNADesdeLocalStorage();
    
    // console.log("CIRCULAR"+cargarListaCircularDesdeLocalStorage())
    //  lcircle=cargarListaCircularDesdeLocalStorage();
    
    //  console.log("Circular")
    //  lcircle.imprimir();
    let ruta = document.getElementById("ruta").value;
    let carpeta = document.getElementById("carpeta").value;
    try{
        arbolnario.insertarValor(ruta,carpeta);
    }catch(error){
        alert("Hubo un error al insertar el nodo")
    }
    document.getElementById("carpeta").value = "";
    refrescarArbol();  
    
   guardarArbolNAEnLocalStorage(arbolnario);
   actualizarNodo(getcurrentuserid(), arbolnario);
  
}
function eliminarVarios(){
    console.log("Eliminar")
    arbolnario= cargarArbolNADesdeLocalStorage();
    
    let ruta = document.getElementById("ruta").value
    arbolnario.eliminarCarpeta(ruta)
    refrescarArbol();  
   guardarArbolNAEnLocalStorage(arbolnario);
   actualizarNodo(getcurrentuserid(), arbolnario);
   hacerhtml();
   
    
}
class NodoCircular {
    constructor(fechaHora) {
      this.fechaHora = fechaHora;
      this.siguiente = null;
    }
  }
  
  class ListaCircular {
    constructor() {
      this.cabeza = null;
      this.longitud = 0;
    }
    
  
    agregar(fechaHora) {
      const nuevoNodo = new NodoCircular(fechaHora);
  
      if (this.cabeza === null) {
        this.cabeza = nuevoNodo;
        this.cabeza.siguiente = this.cabeza;
      } else {
        let nodoActual = this.cabeza;
  
        while (nodoActual.siguiente !== this.cabeza) {
          nodoActual = nodoActual.siguiente;
        }
  
        nodoActual.siguiente = nuevoNodo;
        nuevoNodo.siguiente = this.cabeza;
      }
  
      this.longitud++;
    }
  
    imprimir() {
      if (this.cabeza === null) {
        console.log("La lista está vacía.");
        return;
      }
  
      let nodoActual = this.cabeza;
      let i = 0;
  
      do {
        console.log(`Nodo ${i}: ${nodoActual.fechaHora}`);
        nodoActual = nodoActual.siguiente;
        i++;
      } while (nodoActual !== this.cabeza);
    }
    
  }
function refrescarArbol(){
    let url = 'https://quickchart.io/graphviz?graph=';
    let body = arbolnario.grafica_arbol();
    $("#image").attr("src", url + body);
    document.getElementById("carpeta").value = "";
}

function mostraCarpetas(){
    let ruta = document.getElementById("ruta").value
    arbolnario.mostrarCarpetasActuales(ruta)
}

document.getElementById("btnLogout").addEventListener("click", function() {
    window.location.href = "index.html";
  });
  function generarArbolHtml(nodo, contenedor) {
    if (!nodo) {
        return;
    }

    const carpetaDiv = document.createElement("div");
    carpetaDiv.className = "carpeta";
    contenedor.appendChild(carpetaDiv);

    const carpetaIcon = document.createElement("span");
    carpetaIcon.className = "carpeta-icon";
    carpetaIcon.textContent = "📁";
    carpetaDiv.appendChild(carpetaIcon);

    const carpetaNombre = document.createElement("span");
    carpetaNombre.className = "carpeta-nombre";
    carpetaNombre.textContent = nodo.valor;
    carpetaDiv.appendChild(carpetaNombre);

    // Mostrar los archivos como íconos
    if (nodo.matriz) {
        const archivos = nodo.matriz.convertedFiles;
        archivos.forEach(archivo => {
            const archivoIcon = document.createElement("span");
            archivoIcon.className = "archivo-icon";
            archivoIcon.textContent = "📄";
            carpetaDiv.appendChild(archivoIcon);

            const archivoNombre = document.createElement("span");
            archivoNombre.className = "archivo-nombre";
            archivoNombre.textContent = archivo.nombreArchivo;
            carpetaDiv.appendChild(archivoNombre);
        });
    }

    if (nodo.primero) {
        const subcarpetasDiv = document.createElement("div");
        carpetaDiv.appendChild(subcarpetasDiv);
        let aux = nodo.primero;
        while (aux) {
            generarArbolHtml(aux, subcarpetasDiv);
            aux = aux.siguiente;
        }
    }
}
function hacerhtml(){
const arbolContenedor = document.getElementById("arbol");
while (arbolContenedor.firstChild) {
    arbolContenedor.removeChild(arbolContenedor.firstChild);
}
generarArbolHtml(arbolnario.raiz, arbolContenedor);
}
function Muestraico(){
mostrarTexto(getcurrentuserid());
const arbolContenedor1 = document.getElementById("arbol");
while (arbolContenedor1.firstChild) {
    arbolContenedor1.removeChild(arbolContenedor1.firstChild);
}
ar = cargarArbolNADesdeLocalStorage();
generarArbolHtml(ar.raiz, arbolContenedor1);
}
function mostrarTexto(texto) {
    const elementoH2 = document.querySelector('h2'); // o usa document.getElementById('id-del-h2')
  elementoH2.innerText = "Se encuentra en sesión "+texto;
  }