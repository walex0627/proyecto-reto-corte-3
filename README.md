# Sistema de Gestión Contable

Este es un sistema web simple diseñado para la gestión de empresas, facturas, y cálculo de impuestos como el ICA (Impuesto de Industria y Comercio). La aplicación permite a diferentes roles de usuario (Contador, Revisor Fiscal, Auxiliar Contable, Invitado) acceder a funcionalidades específicas, como la creación y edición de empresas, la generación de facturas y la visualización de historiales y cálculos tributarios.

La aplicación simula un backend RESTful utilizando **JSON Server**, lo que permite una experiencia de desarrollo frontend completa sin la necesidad de un servidor backend real complejo.

## Tabla de Contenidos

1.  [Características](#características)
2.  [Roles de Usuario](#roles-de-usuario)
3.  [Tecnologías Utilizadas](#tecnologías-utilizadas)
4.  [Configuración del Proyecto](#configuración-del-proyecto)
    * [Requisitos Previos](#requisitos-previos)
    * [Instalación](#instalación)
    * [Ejecución de JSON Server](#ejecución-de-json-server)
    * [Ejecución de la Aplicación Frontend](#ejecución-de-la-aplicación-frontend)
5.  [Estructura del Código](#estructura-del-código)
    * [`app.js`](#appjs)
    * [`helpers.js`](#helpersjs)
    * `db.json`
    * Archivos HTML
6.  [Funcionalidades Clave](#funcionalidades-clave)
    * [Autenticación y Autorización](#autenticación-y-autorización)
    * [Gestión de Empresas](#gestión-de-empresas)
    * [Generación y Gestión de Facturas](#generación-y-gestión-de-facturas)
    * [Cálculo y Visualización del ICA](#cálculo-y-visualización-del-ica)
    * [Gestión de Tarifas ICA](#gestión-de-tarifas-ica)
7.  [Consideraciones Futuras](#consideraciones-futuras)

## Características

* **Autenticación de Usuarios:** Login y registro de usuarios con diferentes roles.
* **Gestión de Roles y Permisos:** Control de acceso a funcionalidades basado en el rol del usuario.
* **Gestión de Empresas:** CRUD (Crear, Leer, Actualizar, Eliminar) de empresas con detalles contables.
* **Generación de Facturas:** Cálculo automático de IVA, retenciones (IVA, Fuente, Autorretención) e ICA.
* **Historial de Facturas:** Visualización y filtrado de facturas generadas.
* **Cálculo ICA:** Consulta del Impuesto de Industria y Comercio por ciudad.
* **Gestión de Tarifas ICA:** Adición de nuevas ciudades y sus tarifas de ICA.
* **Interfaz de Usuario Intuitiva:** Navegación clara y mensajes de confirmación contextuales.

## Roles de Usuario

La aplicación maneja los siguientes roles con sus respectivos permisos:

* **Contador / Revisor Fiscal:** Acceso completo a todas las funcionalidades (gestión de usuarios, empresas, facturas, ICA y tarifas).
* **Auxiliar Contable:** Puede ver empresas, generar facturas, ver historial de facturas y ver el ICA. No puede agregar/editar empresas ni tarifas ICA.
* **Invitado:** Solo puede ver empresas, historial de facturas y la sección de ICA. No puede generar facturas ni modificar datos.

## Tecnologías Utilizadas

* **HTML5:** Estructura de la aplicación.
* **CSS3:** Estilos y presentación (se asume un archivo `style.css` o estilos inline).
* **JavaScript (ES6+):** Lógica principal de la aplicación, manejo del DOM, interacciones.
* **JSON Server:** Backend RESTful simulado para persistencia de datos local.

## Configuración del Proyecto

Sigue estos pasos para poner en marcha la aplicación en tu entorno local.

### Requisitos Previos

* **Node.js y npm:** Asegúrate de tener Node.js (que incluye npm) instalado en tu sistema. Puedes descargarlo desde [nodejs.org](https://nodejs.org/).

### Instalación

1.  **Clonar el repositorio** (o descargar los archivos del proyecto).
2.  **Navegar al directorio del proyecto** en tu terminal.
3.  **Instalar JSON Server globalmente:**
    ```bash
    npm install -g json-server
    ```

### Ejecución de JSON Server

1.  Asegúrate de tener un archivo `db.json` en la raíz de tu proyecto con una estructura similar a la siguiente (contendrá tus datos):

    ```json
    {
      "users": [],
      "empresas": [],
      "facturas": [],
      "tarifasICA": [
        { "id": 1, "ciudad": "Barranquilla", "tarifas": { "Comercio": 0.8, "Servicios": 1.2, "Industria": 0.7 } },
        { "id": 2, "ciudad": "Bogota", "tarifas": { "Comercio": 1.0, "Servicios": 1.5, "Industria": 0.9 } }
      ]
    }
    ```
2.  Inicia JSON Server desde la raíz de tu proyecto:
    ```bash
    json-server --watch db.json --port 4000
    ```
    Esto iniciará el servidor en `http://localhost:4000`. Mantén esta terminal abierta mientras uses la aplicación.

### Ejecución de la Aplicación Frontend

1.  Abre el archivo `index.html` en tu navegador web.
2.  La aplicación se cargará y te redirigirá a la pantalla de inicio de sesión si no hay una sesión activa.

## Estructura del Código

La lógica principal de la aplicación reside en dos archivos JavaScript:

### `app.js`

Este es el archivo principal que orquesta la lógica de la aplicación. Contiene:

* **Variables Globales:** `users`, `empresas`, `facturas`, `tarifasICA` (arrays en memoria que replican los datos del `db.json`), y `currentUser` (para la sesión del usuario activo). `currentActiveSection` para recordar la última sección visitada.
* **`saveCurrentUser()` y `loadCurrentUser()`:** Funciones para persistir el estado del `currentUser` en `localStorage` del navegador, permitiendo recordar la sesión.
* **`cargarDatosIniciales()`:** Función asíncrona que realiza peticiones `fetch` a JSON Server para cargar todos los datos iniciales al arrancar la aplicación.
* **Manejadores de Eventos `DOMContentLoaded`:** Se encarga de inicializar la aplicación una vez que el DOM está completamente cargado, cargando datos, verificando la sesión y adjuntando todos los `EventListeners` a los botones y elementos interactivos.
* **`showSection(sectionKey)`:** Función crucial para controlar la visibilidad de las diferentes secciones de la aplicación (login, dashboard, empresas, facturas, etc.). Asegura que solo una sección esté visible a la vez y limpia los mensajes y formularios al navegar.
* **Funciones de Autenticación (`showLogin`, `register`, `login`, `logout`, `iniciarSesion`, `setupPermissions`):** Manejan el flujo de registro, inicio y cierre de sesión, y la configuración dinámica de permisos basados en el rol del usuario.
* **Funciones de Gestión de Empresas (`agregarEmpresa`, `limpiarFormularioEmpresa`, `cargarEmpresasParaFactura`, `cargarTablaEmpresas`, `verDetalleEmpresa`, `editarEmpresa`, `actualizarEmpresa`, `eliminarEmpresa`):** Implementan las operaciones CRUD para las entidades de empresas. Incluyen lógica para llenar formularios en modo edición y recalcular las listas cuando es necesario.
* **Funciones de Gestión de Facturas (`generarFactura`, `mostrarResultadoFactura`, `closeModal`, `cargarHistorialFacturas`, `renderHistorial`, `setupFiltrosFactura`, `verDetalleFactura`, `editarFactura`, `actualizarFactura`, `eliminarFactura`):** Contienen la lógica para calcular y generar facturas con impuestos, visualizarlas, gestionarlas (editar/eliminar) y filtrarlas en el historial.
* **Funciones de ICA (`cargarCiudadesParaICA`, `calcularICAPorCiudad`, `agregarTarifaICA`):** Permiten la gestión y consulta de tarifas de ICA por ciudad, mostrando resúmenes por empresa y facturas.
* **`exportarFacturaPDF(facturaId)`:** Un placeholder para la futura funcionalidad de exportación a PDF.
* **Helpers para DOM:** Funciones auxiliares como `crearRow`, `crearGrupo`, `crearFila` para la construcción dinámica de elementos HTML.

### `helpers.js`

Este archivo contiene funciones auxiliares reutilizables que son importadas por `app.js`:

* **`formatCOP(amount)`:** Formatea un valor numérico a formato de moneda colombiana (COP).
* **`showMessage(elementId, message, isError)`:** Muestra mensajes de feedback (éxito o error) en un elemento HTML específico.
* **`hideMessage(elementId)`:** Oculta un mensaje previamente mostrado.
* **`obtenerTarifaICA(ciudad, actividad, tarifasICA)`:** Calcula la tarifa de ICA basándose en la ciudad y la actividad económica.
* **`showRegister()`:** Alterna la visibilidad entre el formulario de login y registro.
* **`crearTabla(headers, data)`:** Función genérica para crear tablas HTML dinámicamente a partir de una lista de encabezados y datos.

### `db.json`

Este archivo actúa como la base de datos de tu aplicación, almacenando los datos en formato JSON. JSON Server lo "sirve" como una API REST. Contiene colecciones para `users`, `empresas`, `facturas`, y `tarifasICA`.

### Archivos HTML

Cada sección de la aplicación (login, dashboard, empresas, facturas, etc.) se define en los archivos HTML correspondientes. Es crucial que los elementos HTML tengan los `id`s correctos para que `app.js` pueda interactuar con ellos.

## Funcionalidades Clave

### Autenticación y Autorización

Al iniciar la aplicación, el usuario es presentado con una pantalla de login/registro. Una vez que un usuario inicia sesión, su información de rol se usa para determinar qué secciones y acciones tiene permiso para realizar. La sesión del usuario se persiste en `localStorage` para una experiencia más fluida.

### Gestión de Empresas

La sección "Empresas" permite visualizar una tabla con todas las empresas registradas. Los usuarios con los roles adecuados pueden:

* **Agregar una nueva empresa:** Rellenando un formulario con detalles como NIT, nombre, ciudad, actividad, régimen, etc.
* **Editar una empresa existente:** Los datos de la empresa se cargan en el formulario para su modificación.
* **Eliminar una empresa:** Con una confirmación previa.
* **Ver detalles:** Un pop-up o alerta muestra toda la información de una empresa.

### Generación y Gestión de Facturas

En la sección "Facturas", se puede seleccionar una empresa y ingresar un valor de venta y concepto. La aplicación calculará automáticamente:

* IVA
* Retención en la fuente
* Retención de IVA
* Autorretención (si aplica por régimen)
* Impuesto de Industria y Comercio (ICA)
* Total a pagar

El resultado se muestra directamente en la misma sección. El historial de facturas permite ver todas las facturas generadas, filtrarlas y también editarlas o eliminarlas.

### Cálculo y Visualización del ICA

La sección "ICA" permite seleccionar una ciudad y visualizar un resumen del ICA calculado para las empresas y facturas asociadas a esa ciudad. Esto ayuda a tener una visión general de la carga tributaria del ICA por ubicación.

### Gestión de Tarifas ICA

Los usuarios con permisos pueden añadir nuevas ciudades y sus respectivas tarifas de ICA (Comercio, Servicios, Industria). Estas tarifas son utilizadas por el sistema al calcular el ICA en la generación de facturas.

## Consideraciones Futuras

* **Mejora de la Interfaz de Usuario:** Implementación de modales más robustos, mejores estilos para tablas y formularios.
* **Funcionalidad de Exportación a PDF:** Desarrollar la lógica para exportar los detalles de las facturas a un formato PDF.
* **Validación de Formularios:** Mejorar las validaciones de entrada de datos en los formularios (ej. formatos de NIT, campos obligatorios, tipos de datos).
* **Manejo de Errores Más Robusto:** Implementación de un sistema de manejo de errores global y mensajes más detallados para el usuario.
* **Búsqueda y Paginación:** Añadir funcionalidades de búsqueda y paginación a las tablas de historial y empresas para manejar grandes volúmenes de datos.
* **Persistencia de Datos Real:** Migración a una base de datos real y un backend completo (Node.js con Express, Python con Flask/Django, etc.) una vez que la maqueta frontend esté completa.