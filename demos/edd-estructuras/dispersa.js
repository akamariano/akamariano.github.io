const inputElement = document.getElementById("input");
inputElement.addEventListener("change", onChange, false);
let nombreArchivo = ""
let base64String = ""
function onChange(event) {
    var reader = new FileReader();
    reader.onload = onReaderLoad;
    nombreArchivo = event.target.files[0].name
    reader.readAsDataURL(event.target.files[0]);
    
    console.log("NARIOOO"+arbolnario)
    // inputElement.value=""
   
}

function onReaderLoad(event){
    base64String = event.target.result
    console.log("BASE64"+base64String)
}



class nodoMatriz{
    constructor(posX, posY, nombre_archivo){
        this.siguiente = null;
        this.anterior = null;
        this.abajo = null;
        this.arriba = null;
        this.posX = posX;
        this.posY = posY;
        this.posicion = nombre_archivo;
    }
   
}
class Matriz{
    constructor(nombre){
        this.principal = new nodoMatriz(-1,-1,"Raiz")
        this.coordenadaY = 0;
        this.coordenadaX = 0;
    }
    
    buscarF(nombre_archivo){
        let aux = this.principal
        while(aux){
            /**if(aux.posY === y) */
            if(aux.posicion === nombre_archivo){
                return aux;
            }else{
                aux = aux.abajo;
            }
        }
        return null;
    }
    
    buscarC(carnet){
        let aux = this.principal;
        while(aux){
            /**if(aux.posX === x) */
            if(aux.posicion === carnet){
                return aux;
            }else{
                aux = aux.siguiente
            }
        }
        return null;
    }

    insertarColumna(posicion,texto){
        const nuevoNodo = new nodoMatriz(posicion,-1,texto);
        let piv = this.principal;
        let pivA = this.principal;
        while(piv.siguiente){
            if(nuevoNodo.posX > piv.posX){
                pivA = piv;
                piv = piv.siguiente
            }else{
                nuevoNodo.siguiente = piv;
                nuevoNodo.anterior = pivA;
                pivA.siguiente = nuevoNodo;
                piv.anterior = nuevoNodo;
                return;
            }
        }
        nuevoNodo.anterior = piv;
        piv.siguiente = nuevoNodo;
    }

    insertarFila(posicion,texto){
        const nuevoNodo = new nodoMatriz(-1,posicion,texto);
        let piv = this.principal;
        let pivA = this.principal;
        while(piv.abajo){
            if(nuevoNodo.posY > piv.posY){
                pivA = piv;
                piv = piv.abajo;
            }else{
                nuevoNodo.abajo = piv;
                nuevoNodo.arriba = pivA;
                pivA.abajo = nuevoNodo;
                piv.arriba = nuevoNodo;
                return;
            }
        }
        nuevoNodo.arriba = piv;
        piv.abajo = nuevoNodo;
    }
    
    insertarNodo(x,y,texto){
        const nuevoNodo = new nodoMatriz(x,y,texto);
        let tempX = this.principal;
        let tempY = this.principal;
        //Agregar en Columna
        while(tempX.siguiente){
            if(tempX.posX === nuevoNodo.posX){
                break;
            }
            tempX = tempX.siguiente;
        }
        while(true){
            if(tempX.posY === nuevoNodo.posY){
                break;
            }else if(tempX.abajo !== null && tempX.abajo.posY > nuevoNodo.posY){
                nuevoNodo.abajo = tempX.abajo;
                nuevoNodo.arriba = tempX;
                tempX.abajo = nuevoNodo;
                break;
            }else if(tempX.abajo === null){
                nuevoNodo.arriba = tempX
                nuevoNodo.abajo = tempX.abajo
                tempX.abajo = nuevoNodo;
                break;
            }else{
                tempX = tempX.abajo;
            }
        }
        //Agregar en Fila
        while(tempY.abajo){
            if(tempY.posY === nuevoNodo.posY){
                break;
            }
            tempY = tempY.abajo;
        }
        while(true){
            if(tempY.posX === nuevoNodo.posX){
                break;
            }else if(tempY.siguiente !== null && tempY.siguiente.posX > nuevoNodo.posX){
                nuevoNodo.siguiente = tempY.siguiente;
                nuevoNodo.anterior = tempY;
                tempY.siguiente = nuevoNodo;
            }else if(tempY.siguiente === null){
                nuevoNodo.anterior = tempY;
                nuevoNodo.siguiente = tempY.siguiente;
                tempY.siguiente = nuevoNodo;
            }else{
                tempY = tempY.siguiente;
            }
        }
    }

    insertarElemento(x,y){
        let texto = x + "," + y;
        let nuevaFila = this.buscarF(y);
        let nuevaColumna = this.buscarC(x);
        /** Fila y Columna no existen */
        if(nuevaFila === null && nuevaColumna === null){
            this.insertarColumna(x, "C"+x);
            this.insertarFila(y, "F"+y);
            this.insertarNodo(x,y,texto);
        }else if(nuevaFila === null && nuevaColumna !== null){ /* Fila no existe, Columna si existe */
            this.insertarFila(y,"F"+y);
            this.insertarNodo(x,y,texto);
        }else if(nuevaFila !== null && nuevaColumna === null){/* Fila si existe, Columna no existe */
            this.insertarColumna(x, "C"+x);
            this.insertarNodo(x,y,texto);
        }else if(nuevaFila !== null && nuevaColumna !== null){/* Fila si existe, Columna si existe */
            this.insertarNodo(x,y,texto);
        }else{
            console.log("Me dio Ansiedad :(");
        }
    }

    insertarArchivo(texto, numero){
        let nuevaFila = this.buscarF(texto)
        if(nuevaFila === null){
            this.insertarFila(this.coordenadaY,texto)
            this.coordenadaY++
            
        }else{
            let copia_archivo = "(" + (numero++) + ")" + nombreArchivo
            this.insertarArchivo(copia_archivo, numero)
        }
    }

    colocarPermiso(archivo, carnet, permisos){
        /** NOTA: Paso Previo Buscar en AVL si existe el carnet*/
        let nuevaColumna = this.buscarC(carnet)
        let nuevaFila = this.buscarF(archivo)
        if(nuevaColumna === null){
            this.insertarColumna(this.coordenadaX, carnet)
            this.coordenadaX++
            nuevaColumna = this.buscarC(carnet)
        }
        if(nuevaColumna !== null && nuevaFila !== null){
            this.insertarNodo(nuevaColumna.posX, nuevaFila.posY, permisos)
        }
    }

    reporte(){
        let cadena = "";
        let aux1 = this.principal;
        let aux2 = this.principal;
        let aux3 = this.principal;
        if(aux1 !== null){
            cadena = "digraph MatrizCapa{ node[shape=box]  rankdir=UD;  {rank=min; ";
            /** Creacion de los nodos actuales */
            while(aux1){
                cadena += "nodo" + (aux1.posX+1) + (aux1.posY+1) + "[label=\"" + aux1.posicion + "\" ,rankdir=LR,group=" + (aux1.posX+1) + "]; ";
                aux1 = aux1.siguiente;
            }
            cadena += "}"
            while(aux2){
                aux1 = aux2;
                cadena += "{rank=same; ";
                while(aux1){
                    cadena += "nodo" + (aux1.posX+1) + (aux1.posY+1) + "[label=\"" + aux1.posicion + "\" ,group=" + (aux1.posX+1) + "]; ";
                    aux1 = aux1.siguiente;
                }
                cadena += "}";
                aux2 = aux2.abajo;
            }
            /** Conexiones entre los nodos de la matriz */
            aux2 = aux3;
            while(aux2){
                aux1 = aux2;
                while(aux1.siguiente){
                    cadena += "nodo" + (aux1.posX+1) + (aux1.posY+1) + " -> " + "nodo" + (aux1.siguiente.posX+1) + (aux1.siguiente.posY+1) + " [dir=both];"
                    aux1 = aux1.siguiente
                }
                aux2 = aux2.abajo;
            }
            aux2 = aux3;
            while(aux2){
                aux1 = aux2;
                while(aux1.abajo){
                    cadena += "nodo" + (aux1.posX+1) + (aux1.posY+1) + " -> " + "nodo" + (aux1.abajo.posX+1) + (aux1.abajo.posY+1) + " [dir=both];"
                    aux1 = aux1.abajo
                }
                aux2 = aux2.siguiente;
            }
            cadena +=  "}";
        }else{
            cadena = "No hay elementos en la matriz"
        }
        return cadena;
    }
    imprimirMatriz() {
        let auxY = this.principal.abajo;
        let auxX;
        let fila;
    
        console.log("Matriz dispersa:");
        while (auxY) {
            auxX = auxY.siguiente;
            fila = "";
            while (auxX) {
                fila += "[" + auxX.posicion + "] ";
                auxX = auxX.siguiente;
            }
            console.log(fila);
            auxY = auxY.abajo;
        }
    }
    toJSON() {
        
        const convertedFiles = [];
        
        const permisos = [];
        let aux1 = this.principal;
        let aux2 = this.principal;
        if (aux1 !== null) {
            
            aux1 = aux1.abajo;
            while (aux1) {
                convertedFiles.push({
                    text: aux1.posicion,
                    numero: 1,
                    nombreArchivo: aux1.posicion
                })
                aux1 = aux1.abajo;
            }

            
            while (aux2) {
                aux1 = aux2;
                while (aux1) {
                    aux1 = aux1.siguiente;
                    if (aux1 !== null) {
                        if (aux1.posY !== -1) {
                            const fileName = this.buscarY(aux1.posY);
                            const carnet = this.buscarX(aux1.posX);
                            permisos.push({
                                nombreArchivo: fileName.posicion,
                                carnet: carnet.posicion,
                                permisos: aux1.posicion
                            })
                        }
                    }

                }
                aux2 = aux2.abajo;
            }
        }
        return {
            permisos,
            convertedFiles
        }
    }
    buscarX(x) {
        let aux = this.principal;
        while (aux) {
            if (aux.posX === x && aux.posY === -1) {
                return aux;
            } else {
                aux = aux.siguiente
            }
        }
        return null;
    }

    buscarY(y) {
        let aux = this.principal;
        while (aux) {
            if (aux.posY === y && aux.posX === -1) {
                return aux;
            } else {
                aux = aux.abajo
            }
        }
        return null;
    }
}

 matriz = new Matriz()

function reporteMatriz(){
    arbolnario1= cargarArbolNADesdeLocalStorage();
    let ruta = document.getElementById("ruta2").value;
    pp=arbolnario1.BuscarCarpetaNew(ruta)
    if(pp!=""){
        matriz=arbolnario1.deserializeMatrix(pp)
    }
    let url = 'https://quickchart.io/graphviz?graph=';
    let body = matriz.reporte();
    $("#image2").attr("src",url+body)
}
function reporteMatriz2(matriz){
    let url = 'https://quickchart.io/graphviz?graph=';
    let body = matriz.reporte();
    $("#image4").attr("src",url+body)
}
function cargarArchivo(){
   
    arbolnario1= cargarArbolNADesdeLocalStorage();
    let ruta = document.getElementById("ruta2").value;
    pp=arbolnario1.BuscarCarpetaNew(ruta)
    if(pp!=""){
        matriz=arbolnario1.deserializeMatrix(pp)
    }
    matriz.insertarArchivo(nombreArchivo,1)
    const listaCircularDesdeLocalStorage = obtenerListaCircularDeLocalStorage();
    const fechaHoraActual = new Date().toLocaleString();
    listaCircularDesdeLocalStorage.agregar("Se creo archivo el: "+fechaHoraActual);
    guardarListaCircularEnLocalStorage(listaCircularDesdeLocalStorage);
    listaCircularDesdeLocalStorage.imprimir();
    graficarListaCircular(listaCircularDesdeLocalStorage);
   actualizarNodoCircu(getcurrentuserid(), convertirListaCircularAArregloLineal(listaCircularDesdeLocalStorage));
//    console.log("RAIZ"+getcurrentuser().raiz.matriz);
//    arbito = new ArbolNArio();
//    arbito.
//    arbito=getcurrentuser();
//    arbito
//    arbito.BuscarCarpetaV2Matriz("/");
arbolnario1.modificarMatriz(ruta, matriz.toJSON())
guardarArbolNAEnLocalStorage(arbolnario1);
actualizarNodo(getcurrentuserid(), arbolnario1);
  
//    console.log("/")
//    arb = new ArbolNArio();
//    console.log(arb.BuscarCarpetaV2("/").matriz);
    reporteMatriz();
    recargarPagina();
}

function asignarPermisos(){
    let encontrado = false;
    let cadena = document.getElementById("permiso").value;
    let arreglo = cadena.split('-');
    arbolnario1= cargarArbolNADesdeLocalStorage();
    let ruta = document.getElementById("ruta2").value;
    pp=arbolnario1.BuscarCarpetaNew(ruta)
    console.log("CONVERTED FILES"+pp.convertedFiles)
    archivos=pp.convertedFiles;
    archivos.forEach(function(archivo) {
        if (archivo.nombreArchivo === arreglo[0]) {
          encontrado = true;
        }
      });
      
      if (!encontrado) {
        alert("Error: no se ha encontrado el archivo con el nombre especificado");
      }
    if(pp!=""){
        matriz=arbolnario1.deserializeMatrix(pp)
    }
    
    // arbolnario.colocar(arreglo[0],arreglo[1],arreglo[2]);
    if ( BuscarUserPermison(arreglo[1]) && encontrado==true && (arreglo[2]==="r" || arreglo[2]==="w" )){
        matriz.colocarPermiso(arreglo[0],arreglo[1],arreglo[2]);
    arbolnario1.modificarMatriz(ruta, matriz.toJSON())
guardarArbolNAEnLocalStorage(arbolnario1);
actualizarNodo(getcurrentuserid(), arbolnario1);
    reporteMatriz()
    recargarPagina();
    }
    else{
        alert("Error");
    }
    
}
function recargarPagina() {
    location.reload();
}