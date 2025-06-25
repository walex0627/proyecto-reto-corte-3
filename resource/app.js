// app.js

import {
    formatCOP,
    showMessage,
    hideMessage,
    obtenerTarifaICA,
    showRegister, // Assuming this function is in your helpers.js
    crearTabla
} from "./helpers.js";

let users = [];
let empresas = [];
let facturas = [];
let tarifasICA = [];
let currentUser = null; // Mantén esta variable para el estado en memoria

// Variable global para mantener la sección activa
let currentActiveSection = 'welcome'; 

// Función para guardar el usuario actual en localStorage
function saveCurrentUser(user) {
    if (user) {
        localStorage.setItem('currentUser', JSON.stringify(user));
    } else {
        localStorage.removeItem('currentUser'); // Eliminar si el usuario es null (logout)
    }
}

// Función para cargar el usuario actual desde localStorage
function loadCurrentUser() {
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
        try {
            currentUser = JSON.parse(storedUser);
            return true; // Se cargó un usuario
        } catch (e) {
            console.error("Error al parsear el usuario de localStorage:", e);
            localStorage.removeItem('currentUser'); // Limpiar datos corruptos
            return false;
        }
    }
    return false; // No hay usuario guardado
}


// Cargar datos desde JSON Server al iniciar
async function cargarDatosIniciales() {
    try {
        const [resUsuarios, resEmpresas, resFacturas, resTarifas] =
            await Promise.all([
                fetch("http://localhost:4000/users"),
                fetch("http://localhost:4000/empresas"),
                fetch("http://localhost:4000/facturas"),
                fetch("http://localhost:4000/tarifasICA"),
            ]);

        if (
            !resUsuarios.ok ||
            !resEmpresas.ok ||
            !resFacturas.ok ||
            !resTarifas.ok
        ) {
            throw new Error("Error al cargar los datos desde el servidor");
        }

        users = await resUsuarios.json();
        empresas = await resEmpresas.json();
        facturas = await resFacturas.json();
        tarifasICA = await resTarifas.json();

        console.log("Datos cargados correctamente");
    } catch (error) {
        console.error("Error al cargar datos:", error.message);
        showMessage('loginMsg', 'Error al conectar con el servidor de datos. Asegúrate de que JSON Server esté funcionando.', true);
    }
}

document.addEventListener("DOMContentLoaded", async () => {
    await cargarDatosIniciales();

    // Lógica de inicio de sesión al cargar la página
    if (loadCurrentUser()) { // Intenta cargar el usuario guardado
        iniciarSesion(); // Si hay un usuario, inicia la sesión directamente
    } else {
        showLogin(); // Si no hay usuario guardado, muestra la pantalla de login
    }

    // Vinculación de botones de Login/Registro
    document.getElementById('loginButton')?.addEventListener('click', login);
    document.getElementById('showRegisterBtn')?.addEventListener('click', showRegister);
    document.getElementById('registerButton')?.addEventListener('click', register);
    document.getElementById('showLoginBtn')?.addEventListener('click', showLogin);

    // Vinculación de botones de Navegación
    document.getElementById('btnEmpresas')?.addEventListener('click', () => showSection('empresas'));
    document.getElementById('btnAgregarEmpresa')?.addEventListener('click', () => showSection('agregarEmpresa'));
    document.getElementById('btnAgregarTarifasICA')?.addEventListener('click', () => showSection('tarifasICA'));
    document.getElementById('btnFacturas')?.addEventListener('click', () => showSection('facturas'));
    document.getElementById('btnHistorial')?.addEventListener('click', () => showSection('historial'));
    document.getElementById('btnICA')?.addEventListener('click', () => showSection('ica'));
    document.getElementById('btnLogout')?.addEventListener('click', logout);

    // Vinculación de botones de formularios
    document.getElementById('agregarEmpresaBtn')?.addEventListener('click', agregarEmpresa);
    document.getElementById('agregarTarifaICABtn')?.addEventListener('click', agregarTarifaICA);
    document.getElementById('generarFacturaBtn')?.addEventListener('click', generarFactura);

    // Listener para el selector de ciudad ICA
    document.getElementById('selectCiudadICA')?.addEventListener('change', calcularICAPorCiudad);

    // Listener para cerrar modal de factura (si existe un modal de factura)
    document.getElementById('closeModalBtn')?.addEventListener('click', closeModal);
});

// Funcion para mostrar las secciones
function showSection(sectionKey) {
    // Oculta todas las secciones primero
    document.querySelectorAll(".section").forEach((section) => {
        section.style.display = "none";
    });

    // Mapeo entre claves internas y los IDs reales del HTML
    const secciones = {
        agregarEmpresa: "agregarEmpresaSection",
        empresas: "empresasSection",
        facturas: "facturasSection",
        ica: "icaSection",
        tarifasICA: "tarifasICASection",
        historial: "historialSection",
        welcome: "welcomeSection",
    };

    // Buscar el ID real correspondiente
    const sectionId = secciones[sectionKey];

    if (sectionId) {
        document.getElementById(sectionId).style.display = "block";
        currentActiveSection = sectionKey; // Actualiza la sección activa
    } else {
        console.warn(`Sección '${sectionKey}' no encontrada.`);
        return; // Salir si la sección no existe
    }

    // Specific actions for certain sections
    switch (sectionKey) {
        case 'historial':
            cargarHistorialFacturas(); // Asegura que se cargue la última data
            setupFiltrosFactura();
            hideMessage('historialMsg'); // Limpia mensajes de historial
            break;
        case 'empresas':
            cargarTablaEmpresas();
            hideMessage('empresaMsg'); // Limpia mensajes de empresa
            break;
        case 'facturas':
            cargarEmpresasParaFactura();
            // Asegúrate de resetear el botón de generar factura si se vuelve a la sección
            const generarFacturaBtn = document.getElementById('generarFacturaBtn');
            if (generarFacturaBtn) {
                generarFacturaBtn.textContent = 'Generar Factura';
                generarFacturaBtn.removeEventListener('click', actualizarFactura);
                generarFacturaBtn.addEventListener('click', generarFactura);
            }
            // Resetear el modo de edición de factura y ocultar el resultado previo
            modoEdicionFactura = false;
            facturaEditandoId = null;
            document.getElementById('facturaResult').style.display = 'none'; // Oculta el resultado de la factura
            hideMessage('facturaMsg'); // Limpia cualquier mensaje de factura
            // Limpia el formulario cuando entras en esta sección
            document.getElementById('empresaFactura').value = '';
            document.getElementById('valorVenta').value = '';
            document.getElementById('conceptoFactura').value = '';
            break;
        case 'ica':
            cargarCiudadesParaICA();
            calcularICAPorCiudad(); // Intenta calcular con la ciudad por defecto o seleccionada
            break;
        case 'agregarEmpresa':
            limpiarFormularioEmpresa(); // Limpia el formulario al entrar
            const agregarEmpresaBtn = document.getElementById('agregarEmpresaBtn');
            if (agregarEmpresaBtn) {
                agregarEmpresaBtn.textContent = 'Guardar Empresa';
                agregarEmpresaBtn.removeEventListener('click', actualizarEmpresa);
                agregarEmpresaBtn.addEventListener('click', agregarEmpresa);
            }
            // Resetear el modo de edición de empresa
            nitEmpresaEditando = null;
            hideMessage('empresaMsg'); // Limpia mensajes de empresa
            break;
        case 'tarifasICA':
            // Al entrar en la sección de tarifas ICA, asegúrate de limpiar cualquier mensaje anterior y campos
            hideMessage('tarifaICAMsg');
            document.getElementById("nuevaCiudad").value = "";
            document.getElementById("tarifaComercio").value = "";
            document.getElementById("tarifaServicios").value = "";
            document.getElementById("tarifaIndustria").value = "";
            break;
    }
}

// Agregar ciudad con su tarifa de Ica correspondiente
async function agregarTarifaICA() {
    const ciudad = document.getElementById("nuevaCiudad").value.trim();
    const comercio = parseFloat(document.getElementById("tarifaComercio").value);
    const servicios = parseFloat(
        document.getElementById("tarifaServicios").value
    );
    const industria = parseFloat(
        document.getElementById("tarifaIndustria").value
    );

    if (!ciudad || isNaN(comercio) || isNaN(servicios) || isNaN(industria)) {
        showMessage(
            "tarifaICAMsg",
            "Por favor completa todos los campos correctamente",
            true // Es un error
        );
        return;
    }

    const nuevaTarifa = {
        ciudad,
        tarifas: {
            Comercio: comercio,
            Servicios: servicios,
            Industria: industria,
        },
    };

    try {
        const res = await fetch("http://localhost:4000/tarifasICA", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaTarifa),
        });

        if (!res.ok) throw new Error("No se pudo guardar la tarifa ICA");

        showMessage(
            "tarifaICAMsg",
            "Ciudad y tarifas guardadas correctamente",
            false
        );

        // Limpiar campos
        document.getElementById("nuevaCiudad").value = "";
        document.getElementById("tarifaComercio").value = "";
        document.getElementById("tarifaServicios").value = "";
        document.getElementById("tarifaIndustria").value = "";

        // Actualizar la lista de tarifas en memoria (volver a fetch para tener el ID si JSON Server lo asigna)
        const nuevaLista = await fetch("http://localhost:4000/tarifasICA");
        tarifasICA = await nuevaLista.json();

        // Actualizar el selector de ciudades ICA si se acaba de añadir una nueva ciudad
        cargarCiudadesParaICA();
        // **NO REDIRIGE - SE QUEDA EN LA SECCIÓN**
    } catch (err) {
        console.error("Error al agregar tarifa ICA:", err);
        showMessage("tarifaICAMsg", "Error al guardar los datos", true)
    }
}

//Mostrar el login de la app
function showLogin() {
    document.getElementById("loginContainer").style.display = "flex"; // Usar flex para centrar
    document.getElementById("loginForm").style.display = "block";
    document.getElementById("registerForm").style.display = "none";
    document.getElementById("dashboardContent").style.display = "none";
    document.getElementById("navBar").style.display = "none";
    hideMessage("loginMsg");
    hideMessage("registerMsg");
    // Limpiar campos de login
    document.getElementById('loginUser').value = '';
    document.getElementById('loginPass').value = '';
    currentUser = null; // Asegúrate de que no haya un usuario activo si se vuelve al login
    saveCurrentUser(null); // Elimina de localStorage al mostrar el login
}

// Registro
async function register() {
    const user = document.getElementById('regUser').value.trim();
    const pass = document.getElementById('regPass').value.trim();
    const role = document.getElementById('regRole').value;

    if (!user || !pass) {
        showMessage('registerMsg', 'Por favor complete todos los campos', true);
        return;
    }

    if (users.find(u => u.user === user)) {
        showMessage('registerMsg', 'El usuario ya existe', true);
        return;
    }

    try {
        const newUser = { user, pass, role };
        const res = await fetch("http://localhost:4000/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newUser),
        });

        if (!res.ok) throw new Error("No se pudo registrar el usuario");

        const addedUser = await res.json();
        users.push(addedUser); // Actualizar el array local

        showMessage('registerMsg', 'Registro exitoso! Ahora inicie sesión.', false);
        // Limpiar campos de registro
        document.getElementById('regUser').value = '';
        document.getElementById('regPass').value = '';
        document.getElementById('regRole').value = 'auxiliar'; // Resetear a valor por defecto
        setTimeout(showLogin, 2000);
    } catch (error) {
        console.error("Error al registrar:", error);
        showMessage('registerMsg', 'Error al registrar usuario.', true);
    }
}

// Login de la app
function login() {
    const user = document.getElementById('loginUser').value.trim();
    const pass = document.getElementById('loginPass').value.trim();

    const foundUser = users.find(u => u.user === user && u.pass === pass);

    if (!foundUser) {
        showMessage('loginMsg', 'Usuario o contraseña incorrectos', true);
        return;
    }

    currentUser = foundUser;
    saveCurrentUser(currentUser); // Guarda en localStorage
    iniciarSesion();
}

// Cerrar sesion
function logout() {
    currentUser = null;
    saveCurrentUser(null); // Eliminar de localStorage
    showLogin(); // Vuelve a mostrar la pantalla de login
}

// Funciones del dashboard
function iniciarSesion() {
    document.getElementById('loginContainer').style.display = 'none';
    document.getElementById('dashboardContent').style.display = 'block';
    document.getElementById('navBar').style.display = 'flex'; // Usar flex para la barra de navegación

    // Mostrar mensaje de bienvenida personalizado
    const welcomeText = document.getElementById('welcomeText');
    let roleName = '';
    switch (currentUser.role) {
        case 'contador': roleName = 'Contador'; break;
        case 'revisor': roleName = 'Revisor Fiscal'; break;
        case 'auxiliar': roleName = 'Auxiliar Contable'; break;
        case 'invitado': roleName = 'Invitado'; break;
        default: roleName = 'Usuario';
    }
    welcomeText.textContent = `Bienvenido ${currentUser.user} (${roleName}). Utiliza el menú superior para navegar por el sistema.`;

    // Configurar permisos según rol
    setupPermissions();

    // Mostrar la última sección activa o la de bienvenida por defecto
    showSection(currentActiveSection || 'welcome');
}

// Permisos
function setupPermissions() {
    const btnEmpresas = document.getElementById('btnEmpresas');
    const btnAgregarEmpresa = document.getElementById('btnAgregarEmpresa');
    const btnFacturas = document.getElementById('btnFacturas');
    const btnHistorial = document.getElementById('btnHistorial');
    const btnICA = document.getElementById('btnICA');
    const btnAgregarTarifasICA = document.getElementById('btnAgregarTarifasICA');

    // Contador y Revisor Fiscal tienen acceso completo
    if (currentUser.role === 'contador' || currentUser.role === 'revisor') {
        if (btnEmpresas) btnEmpresas.style.display = 'block';
        if (btnAgregarEmpresa) btnAgregarEmpresa.style.display = 'block';
        if (btnFacturas) btnFacturas.style.display = 'block';
        if (btnHistorial) btnHistorial.style.display = 'block';
        if (btnICA) btnICA.style.display = 'block';
        if (btnAgregarTarifasICA) btnAgregarTarifasICA.style.display = 'block';
    }
    // Auxiliar contable puede generar facturas pero no agregar empresas
    else if (currentUser.role === 'auxiliar') {
        if (btnEmpresas) btnEmpresas.style.display = 'block';
        if (btnAgregarEmpresa) btnAgregarEmpresa.style.display = 'none';
        if (btnFacturas) btnFacturas.style.display = 'block';
        if (btnHistorial) btnHistorial.style.display = 'block';
        if (btnICA) btnICA.style.display = 'block';
        if (btnAgregarTarifasICA) btnAgregarTarifasICA.style.display = 'none';
    }
    // Invitado solo puede ver
    else {
        if (btnEmpresas) btnEmpresas.style.display = 'block';
        if (btnAgregarEmpresa) btnAgregarEmpresa.style.display = 'none';
        if (btnFacturas) btnFacturas.style.display = 'none';
        if (btnHistorial) btnHistorial.style.display = 'block';
        if (btnICA) btnICA.style.display = 'block';
        if (btnAgregarTarifasICA) btnAgregarTarifasICA.style.display = 'none';
    }
}

// Funciones para empresas
async function agregarEmpresa() {
    // Validar permisos
    if (currentUser.role !== 'contador' && currentUser.role !== 'revisor') {
        showMessage('empresaMsg', 'No tienes permisos para agregar empresas', true);
        return;
    }

    const nombre = document.getElementById('nombreEmpresa').value.trim();
    const nit = document.getElementById('nitEmpresa').value.trim();
    const ciudad = document.getElementById('ciudadEmpresa').value;
    const actividad = document.getElementById('actividadEmpresa').value;
    const regimen = document.getElementById('regimenEmpresa').value;
    const direccion = document.getElementById('direccionEmpresa').value.trim();
    const tarifaNacional = parseFloat(document.getElementById('tarifaNacional').value);
    const tarifaTerritorial = parseFloat(document.getElementById('tarifaTerritorial').value);
    const retenciones = parseFloat(document.getElementById('retenciones').value);
    const autoretenciones = parseFloat(document.getElementById('autoretenciones').value);

    // Validaciones
    if (!nombre || !nit || !ciudad || !actividad || !regimen || !direccion ||
        isNaN(tarifaNacional) || isNaN(tarifaTerritorial) || isNaN(retenciones) || isNaN(autoretenciones)) {
        showMessage('empresaMsg', 'Por favor complete todos los campos correctamente', true);
        return;
    }

    // Verificar si el NIT ya existe (solo si no estamos editando)
    if (!nitEmpresaEditando && empresas.some(e => e.nit === nit)) {
        showMessage('empresaMsg', 'Ya existe una empresa con este NIT', true);
        return;
    }

    // Crear nueva empresa
    const nuevaEmpresa = {
        nit,
        nombre,
        ciudad,
        actividad,
        regimen,
        direccion,
        tarifaNacional,
        tarifaTerritorial,
        retenciones,
        autoretenciones
    };

    try {
        const res = await fetch("http://localhost:4000/empresas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaEmpresa),
        });

        if (!res.ok) throw new Error("No se pudo guardar la empresa");

        const addedEmpresa = await res.json();
        empresas.push(addedEmpresa); // Actualizar el array local

        limpiarFormularioEmpresa(); // Limpiar el formulario
        showMessage('empresaMsg', 'Empresa agregada correctamente.', false);

        // Actualizar listados relevantes *si se llegan a visualizar*
        cargarEmpresasParaFactura();
        // La tabla de empresas se cargará cuando el usuario navegue a esa sección

    } catch (error) {
        console.error("Error al agregar empresa:", error);
        showMessage('empresaMsg', 'Error al guardar la empresa.', true);
    }
}

// Función para limpiar el formulario de empresa
function limpiarFormularioEmpresa() {
    document.getElementById('nombreEmpresa').value = '';
    document.getElementById('nitEmpresa').value = '';
    document.getElementById('ciudadEmpresa').value = '';
    document.getElementById('actividadEmpresa').value = '';
    document.getElementById('regimenEmpresa').value = '';
    document.getElementById('direccionEmpresa').value = '';
    document.getElementById('tarifaNacional').value = '19';
    document.getElementById('tarifaTerritorial').value = '10';
    document.getElementById('retenciones').value = '3.5';
    document.getElementById('autoretenciones').value = '1';
    hideMessage('empresaMsg');
}


function cargarEmpresasParaFactura() {
    const select = document.getElementById('empresaFactura');
    if (!select) return;

    select.innerHTML = '<option value="" disabled selected>-- Seleccione una empresa --</option>';

    empresas.forEach(empresa => {
        select.innerHTML += `<option value="${empresa.nit}">${empresa.nombre} (${empresa.nit})</option>`;
    });
}

function cargarTablaEmpresas() {
    const tableContainer = document.getElementById('empresasTableContainer');
    if (!tableContainer) {
        console.error("No se encontró el contenedor para la tabla de empresas. Asegúrate de tener un <div id='empresasTableContainer'> en tu HTML.");
        return;
    }
    tableContainer.innerHTML = ''; // Limpiar contenido previo

    const headers = ['NIT', 'Nombre', 'Ciudad', 'Actividad', 'Régimen', 'Acciones'];
    const tableData = empresas.map(empresa => {
        const actionsHtml = `
            <button data-nit="${empresa.nit}" class="btn-ver-detalle-empresa nav-button" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Ver</button>
            ${currentUser.role === 'contador' || currentUser.role === 'revisor' ?
                `<button data-nit="${empresa.nit}" class="btn-editar-empresa nav-button" style="padding: 0.3rem 0.6rem; font-size: 0.8rem;">Editar</button>
                <button data-nit="${empresa.nit}" class="btn-eliminar-empresa nav-button" style="padding: 0.3rem 0.6rem; font-size: 0.8rem; background: #b22;">Eliminar</button>` : ''
            }
        `;
        return [
            empresa.nit,
            empresa.nombre,
            empresa.ciudad,
            empresa.actividad,
            empresa.regimen,
            actionsHtml
        ];
    });

    const tabla = crearTabla(headers, tableData);
    tableContainer.appendChild(tabla);
    tabla.id = 'empresasTable';

    tabla.querySelectorAll('.btn-ver-detalle-empresa').forEach(button => {
        button.addEventListener('click', (event) => verDetalleEmpresa(event.target.dataset.nit));
    });
    tabla.querySelectorAll('.btn-editar-empresa').forEach(button => {
        button.addEventListener('click', (event) => editarEmpresa(event.target.dataset.nit));
    });
    tabla.querySelectorAll('.btn-eliminar-empresa').forEach(button => {
        button.addEventListener('click', (event) => eliminarEmpresa(event.target.dataset.nit));
    });
}

function verDetalleEmpresa(nit) {
    const empresa = empresas.find(e => e.nit === nit);
    if (!empresa) {
        showMessage('empresaMsg', 'Empresa no encontrada para detalle.', true);
        return;
    }

    // Usar alert o un modal más sofisticado si lo prefieres para el detalle
    alert(`Detalle de Empresa:
        Nombre: ${empresa.nombre}
        NIT: ${empresa.nit}
        Ciudad: ${empresa.ciudad}
        Actividad: ${empresa.actividad}
        Régimen: ${empresa.regimen}
        Dirección: ${empresa.direccion}
        Tarifa Nacional: ${empresa.tarifaNacional}%
        Tarifa Territorial: ${empresa.tarifaTerritorial}%
        Retenciones: ${empresa.retenciones}%
        Autoretenciones: ${empresa.autoretenciones}%`);

    // Puedes agregar un showMessage aquí si quieres que aparezca en el div de mensajes de la sección
    // showMessage('empresaMsg', 'Ver detalles de empresa...', false);
}

let nitEmpresaEditando = null;

function editarEmpresa(nit) {
    if (currentUser.role !== 'contador' && currentUser.role !== 'revisor') {
        showMessage('empresaMsg', 'No tienes permisos para editar empresas', true);
        return;
    }

    const empresa = empresas.find(e => e.nit === nit);
    if (!empresa) {
        showMessage('empresaMsg', 'Empresa no encontrada para editar.', true);
        return;
    }

    // Llenar el formulario con los datos de la empresa
    document.getElementById('nombreEmpresa').value = empresa.nombre;
    document.getElementById('nitEmpresa').value = empresa.nit;
    // OJO: El NIT debe ser solo de lectura o deshabilitado si lo usas como ID único
    document.getElementById('nitEmpresa').readOnly = true; // Deshabilita la edición del NIT
    document.getElementById('ciudadEmpresa').value = empresa.ciudad;
    document.getElementById('actividadEmpresa').value = empresa.actividad;
    document.getElementById('regimenEmpresa').value = empresa.regimen;
    document.getElementById('direccionEmpresa').value = empresa.direccion;
    document.getElementById('tarifaNacional').value = empresa.tarifaNacional;
    document.getElementById('tarifaTerritorial').value = empresa.tarifaTerritorial;
    document.getElementById('retenciones').value = empresa.retenciones;
    document.getElementById('autoretenciones').value = empresa.autoretenciones;

    nitEmpresaEditando = nit;

    showSection('agregarEmpresa'); // Navega a la sección de agregar/editar empresa

    const btnAgregarEmpresa = document.getElementById('agregarEmpresaBtn');
    if (btnAgregarEmpresa) {
        btnAgregarEmpresa.textContent = 'Actualizar Empresa';
        btnAgregarEmpresa.removeEventListener('click', agregarEmpresa); // Remueve listener de agregar
        btnAgregarEmpresa.addEventListener('click', actualizarEmpresa); // Añade listener de actualizar
    }

    showMessage('empresaMsg', 'Editando empresa. Complete los cambios y haga clic en Actualizar.', false);
}

async function actualizarEmpresa() {
    if (!nitEmpresaEditando) {
        // Esto no debería ocurrir si el flujo es correcto, pero es un seguro
        showMessage('empresaMsg', 'Error interno: ID de empresa a editar no encontrado. Intente de nuevo.', true);
        return;
    }

    const empresaIndex = empresas.findIndex(e => e.nit === nitEmpresaEditando);
    if (empresaIndex === -1) {
        showMessage('empresaMsg', 'Error: Empresa no encontrada para actualizar.', true);
        nitEmpresaEditando = null;
        limpiarFormularioEmpresa();
        const btnAgregarEmpresa = document.getElementById('agregarEmpresaBtn');
        if(btnAgregarEmpresa) {
            btnAgregarEmpresa.textContent = 'Guardar Empresa';
            btnAgregarEmpresa.removeEventListener('click', actualizarEmpresa);
            btnAgregarEmpresa.addEventListener('click', agregarEmpresa);
        }
        document.getElementById('nitEmpresa').readOnly = false; // Habilitar edición de NIT
        return;
    }

    const nombre = document.getElementById('nombreEmpresa').value.trim();
    const ciudad = document.getElementById('ciudadEmpresa').value;
    const actividad = document.getElementById('actividadEmpresa').value;
    const regimen = document.getElementById('regimenEmpresa').value;
    const direccion = document.getElementById('direccionEmpresa').value.trim();
    const tarifaNacional = parseFloat(document.getElementById('tarifaNacional').value);
    const tarifaTerritorial = parseFloat(document.getElementById('tarifaTerritorial').value);
    const retenciones = parseFloat(document.getElementById('retenciones').value);
    const autoretenciones = parseFloat(document.getElementById('autoretenciones').value);

    if (!nombre || !ciudad || !actividad || !regimen || !direccion ||
        isNaN(tarifaNacional) || isNaN(tarifaTerritorial) || isNaN(retenciones) || isNaN(autoretenciones)) {
        showMessage('empresaMsg', 'Por favor complete todos los campos correctamente', true);
        return;
    }

    const empresaActualizada = {
        ...empresas[empresaIndex], // Mantener propiedades que no se editan
        nombre,
        ciudad,
        actividad,
        regimen,
        direccion,
        tarifaNacional,
        tarifaTerritorial,
        retenciones,
        autoretenciones
    };

    try {
        const res = await fetch(`http://localhost:4000/empresas/${nitEmpresaEditando}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(empresaActualizada),
        });

        if (!res.ok) throw new Error("No se pudo actualizar la empresa");

        const updatedEmpresa = await res.json();
        empresas[empresaIndex] = updatedEmpresa; // Actualiza el array local

        limpiarFormularioEmpresa(); // Limpiar formulario después de actualizar
        // Restaurar el botón a "Guardar Empresa" y su listener original
        const btnAgregarEmpresa = document.getElementById('agregarEmpresaBtn');
        if (btnAgregarEmpresa) {
            btnAgregarEmpresa.textContent = 'Guardar Empresa';
            btnAgregarEmpresa.removeEventListener('click', actualizarEmpresa);
            btnAgregarEmpresa.addEventListener('click', agregarEmpresa);
        }
        document.getElementById('nitEmpresa').readOnly = false; // Habilitar edición de NIT de nuevo
        nitEmpresaEditando = null; // Resetear el ID de edición

        showMessage('empresaMsg', 'Empresa actualizada correctamente.', false);

        cargarEmpresasParaFactura(); // Actualiza el selector de facturas

        // La tabla de empresas se cargará cuando el usuario navegue a esa sección,
        // o si deseas, puedes forzar una recarga aquí si el usuario está en la vista de lista de empresas.
        // if (currentActiveSection === 'empresas') cargarTablaEmpresas();
        
    } catch (error) {
        console.error("Error al actualizar empresa:", error);
        showMessage('empresaMsg', 'Error al actualizar la empresa.', true);
    }
}


async function eliminarEmpresa(nit) {
    if (currentUser.role !== 'contador' && currentUser.role !== 'revisor') {
        showMessage('empresaMsg', 'No tienes permisos para eliminar empresas', true);
        return;
    }

    if (!confirm('¿Está seguro que desea eliminar esta empresa? Esta acción no se puede deshacer.')) {
        return;
    }

    try {
        const res = await fetch(`http://localhost:4000/empresas/${nit}`, {
            method: "DELETE",
        });

        if (!res.ok) throw new Error("No se pudo eliminar la empresa");

        empresas = empresas.filter(e => e.nit !== nit); // Eliminar del array local

        cargarEmpresasParaFactura(); // Actualizar selector de facturas
        cargarTablaEmpresas(); // Recargar la tabla si el usuario está en esta sección

        showMessage('empresaMsg', 'Empresa eliminada correctamente.', false);
    } catch (error) {
        console.error("Error al eliminar empresa:", error);
        showMessage('empresaMsg', 'Error al eliminar la empresa.', true);
    }
}

// Funciones para facturas
async function generarFactura() {
    // Validar permisos
    if (currentUser.role === 'invitado') {
        showMessage('facturaMsg', 'No tienes permisos para generar facturas', true);
        return;
    }

    const nitEmpresa = document.getElementById('empresaFactura').value;
    const valorVenta = parseFloat(document.getElementById('valorVenta').value);
    const concepto = document.getElementById('conceptoFactura').value.trim();

    if (!nitEmpresa) {
        showMessage('facturaMsg', 'Seleccione una empresa', true);
        return;
    }

    if (isNaN(valorVenta) || valorVenta <= 0) {
        showMessage('facturaMsg', 'Ingrese un valor de venta válido', true);
        return;
    }

    if (!concepto) {
        showMessage('facturaMsg', 'Ingrese un concepto para la factura', true);
        return;
    }

    const empresa = empresas.find(e => e.nit === nitEmpresa);
    if (!empresa) {
        showMessage('facturaMsg', 'Empresa no encontrada', true);
        return;
    }

    // Cálculos tributarios
    const iva = valorVenta * (empresa.tarifaNacional / 100);
    const retencionIVA = iva * (empresa.retenciones / 100);
    const retencionFuente = valorVenta * (empresa.retenciones / 100);
    const autoretencion = empresa.regimen === 'Especial' ? valorVenta * (empresa.autoretenciones / 100) : 0;

    const tarifaICA = obtenerTarifaICA(empresa.ciudad, empresa.actividad, tarifasICA);
    const ica = valorVenta * (tarifaICA / 100);

    // Calcular total
    const totalFactura = valorVenta + iva - retencionIVA - retencionFuente - autoretencion + ica;

    // Crear factura
    const nuevaFactura = {
        id: Date.now().toString(),
        fecha: new Date().toISOString(),
        nitEmpresa: empresa.nit,
        nombreEmpresa: empresa.nombre,
        ciudadEmpresa: empresa.ciudad,
        actividadEmpresa: empresa.actividad,
        regimenEmpresa: empresa.regimen,
        concepto,
        valorVenta,
        iva,
        retencionIVA,
        retencionFuente,
        autoretencion,
        ica,
        totalFactura,
        usuario: currentUser.user
    };

    try {
        const res = await fetch("http://localhost:4000/facturas", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nuevaFactura),
        });

        if (!res.ok) throw new Error("No se pudo guardar la factura");

        const addedFactura = await res.json();
        facturas.push(addedFactura); // Actualizar el array local

        // Mostrar resultado en un div dentro de la misma sección
        mostrarResultadoFactura(nuevaFactura);

        // Limpiar formulario y mostrar mensaje de éxito
        document.getElementById('empresaFactura').value = ''; // Resetear select
        document.getElementById('valorVenta').value = '';
        document.getElementById('conceptoFactura').value = '';
        
        showMessage('facturaMsg', 'Factura generada y guardada correctamente.', false);

        // No es necesario llamar a cargarHistorialFacturas aquí, ya que el usuario no se ha movido a esa sección.
        // Se cargará cuando el usuario navegue a 'historial'.

    } catch (error) {
        console.error("Error al generar factura:", error);
        showMessage('facturaMsg', 'Error al generar la factura.', true);
    }
}

// Modificado para mostrar el resultado directamente en la sección
function mostrarResultadoFactura(factura) {
    const contenedor = document.getElementById('facturaResult');
    if (!contenedor) {
        console.error("No se encontró el contenedor 'facturaResult'.");
        return;
    }
    contenedor.innerHTML = '';
    contenedor.style.display = 'block'; // Asegurarse de que esté visible

    const titulo = document.createElement('h3');
    titulo.textContent = 'Detalle de Última Factura Generada';
    contenedor.appendChild(titulo);

    const datosRow = crearRow([
        crearGrupo([
            `Número: ${factura.id}`,
            `Fecha: ${new Date(factura.fecha).toLocaleString()}`,
            `Empresa: ${factura.nombreEmpresa} (${factura.nitEmpresa})`
        ]),
        crearGrupo([
            `Ciudad: ${factura.ciudadEmpresa}`,
            `Actividad: ${factura.actividadEmpresa}`,
            `Régimen: ${factura.regimenEmpresa}`
        ])
    ]);
    contenedor.appendChild(datosRow);

    const conceptoRow = crearRow([
        crearGrupo([`Concepto: ${factura.concepto}`])
    ]);
    contenedor.appendChild(conceptoRow);

    const tabla = document.createElement('table');
    tabla.innerHTML = `
        <thead>
            <tr>
                <th>Concepto</th>
                <th>Valor</th>
            </tr>
        </thead>
        <tbody>
            ${crearFila('Valor Venta', formatCOP(factura.valorVenta))}
            ${crearFila(`IVA (${factura.iva > 0 ? (factura.iva / factura.valorVenta * 100).toFixed(2) : '0'}%)`, formatCOP(factura.iva))}
            ${crearFila('Retención IVA', '-' + formatCOP(factura.retencionIVA))}
            ${crearFila('Retención Fuente', '-' + formatCOP(factura.retencionFuente))}
            ${crearFila('Autoretención', '-' + formatCOP(factura.autoretencion))}
            ${crearFila(`ICA (${(factura.ica / factura.valorVenta * 100).toFixed(2)}%)`, formatCOP(factura.ica))}
            ${crearFila('TOTAL A PAGAR', formatCOP(factura.totalFactura), true)}
        </tbody>
    `;
    contenedor.appendChild(tabla);

    const btnExportar = document.createElement('button');
    btnExportar.textContent = 'Exportar a PDF';
    btnExportar.style.marginTop = '1rem';
    btnExportar.addEventListener('click', () => exportarFacturaPDF(factura.id));
    contenedor.appendChild(btnExportar);
}


function closeModal() {
    // Si estás usando un modal para ver el detalle de factura, esta función lo cierra
    const facturaModal = document.getElementById('facturaModal');
    if (facturaModal) {
        facturaModal.style.display = 'none';
        const facturaDetailDiv = document.getElementById('facturaDetail');
        if (facturaDetailDiv) {
            facturaDetailDiv.innerHTML = '';
        }
    }
}


function cargarHistorialFacturas() {
    renderHistorial(facturas);
}


function renderHistorial(facturasToRender) {
    const historialTableContainer = document.getElementById('historialTableContainer');
    if (!historialTableContainer) {
        console.error("No se encontró el contenedor para la tabla de historial. Asegúrate de tener un <div id='historialTableContainer'> en tu HTML.");
        return;
    }
    historialTableContainer.innerHTML = ''; // Limpiar contenido previo

    const ordenadas = [...facturasToRender].sort((a, b) => new Date(b.fecha) - new Date(a.fecha));

    const headers = ['Fecha', 'Empresa', 'Ciudad', 'Valor Venta', 'Total Factura', 'Acciones'];
    const tableData = ordenadas.map(f => {
        const actionsHtml = `
            <button data-id="${f.id}" class="btn-ver-detalle-factura">Detalle</button>
            <button data-id="${f.id}" class="btn-editar-factura">Editar</button>
            <button data-id="${f.id}" class="btn-eliminar-factura" style="background: #b22; color: white;">Eliminar</button>
        `;
        return [
            new Date(f.fecha).toLocaleDateString(),
            f.nombreEmpresa,
            f.ciudadEmpresa,
            formatCOP(f.valorVenta),
            formatCOP(f.totalFactura),
            actionsHtml
        ];
    });

    const tabla = crearTabla(headers, tableData);
    historialTableContainer.appendChild(tabla);
    tabla.id = 'historialTable';

    tabla.querySelectorAll('.btn-ver-detalle-factura').forEach(button => {
        button.addEventListener('click', (event) => verDetalleFactura(event.target.dataset.id));
    });
    tabla.querySelectorAll('.btn-editar-factura').forEach(button => {
        button.addEventListener('click', (event) => editarFactura(event.target.dataset.id));
    });
    tabla.querySelectorAll('.btn-eliminar-factura').forEach(button => {
        button.addEventListener('click', (event) => eliminarFactura(event.target.dataset.id));
    });
}

function setupFiltrosFactura() {
    const filtroBuscarBtn = document.getElementById('filtroBuscarBtn');
    const filtroLimpiarBtn = document.getElementById('filtroLimpiarBtn');

    if (!filtroBuscarBtn || !filtroLimpiarBtn) {
        console.error("Botones de filtro de factura no encontrados.");
        return;
    }

    // Clonar y reemplazar para limpiar listeners anteriores (importante para evitar duplicados)
    const newFiltroBuscarBtn = filtroBuscarBtn.cloneNode(true);
    filtroBuscarBtn.parentNode.replaceChild(newFiltroBuscarBtn, filtroBuscarBtn);
    const newFiltroLimpiarBtn = filtroLimpiarBtn.cloneNode(true);
    filtroLimpiarBtn.parentNode.replaceChild(newFiltroLimpiarBtn, filtroLimpiarBtn);

    // Asignar listeners a los nuevos botones
    newFiltroBuscarBtn.addEventListener('click', () => {
        const fecha = document.getElementById('filtroFecha').value;
        const nit = document.getElementById('filtroNIT').value.trim().toLowerCase();
        const empresa = document.getElementById('filtroEmpresa').value.trim().toLowerCase();

        let resultados = [...facturas];

        if (fecha) {
            resultados = resultados.filter(f => new Date(f.fecha).toISOString().slice(0, 10) === fecha);
        }

        if (nit) {
            resultados = resultados.filter(f => f.nitEmpresa.toLowerCase().includes(nit));
        }

        if (empresa) {
            resultados = resultados.filter(f => f.nombreEmpresa.toLowerCase().includes(empresa));
        }

        renderHistorial(resultados);
    });

    newFiltroLimpiarBtn.addEventListener('click', () => {
        document.getElementById('filtroFecha').value = '';
        document.getElementById('filtroNIT').value = '';
        document.getElementById('filtroEmpresa').value = '';
        renderHistorial(facturas);
    });
}


function verDetalleFactura(id) {
    const factura = facturas.find(f => f.id === id);
    if (!factura) {
        // En lugar de alert, usar showMessage si tienes un div para mensajes en historial
        showMessage('historialMsg', 'Factura no encontrada para detalle.', true);
        return;
    }

    const facturaDetailDiv = document.getElementById('facturaDetail');
    const facturaModal = document.getElementById('facturaModal');

    // Muestra el modal para el detalle
    if (facturaDetailDiv && facturaModal) {
        facturaDetailDiv.innerHTML = `
            <h3>Detalle de Factura #${factura.id}</h3>
            <p><strong>Fecha:</strong> ${new Date(factura.fecha).toLocaleString()}</p>
            <p><strong>Empresa:</strong> ${factura.nombreEmpresa} (${factura.nitEmpresa})</p>
            <p><strong>Ciudad:</strong> ${factura.ciudadEmpresa}</p>
            <p><strong>Actividad:</strong> ${factura.actividadEmpresa}</p>
            <p><strong>Régimen:</strong> ${factura.regimenEmpresa}</p>
            <p><strong>Concepto:</strong> ${factura.concepto}</p>
            <p><strong>Valor Venta:</strong> ${formatCOP(factura.valorVenta)}</p>
            <p><strong>IVA:</strong> ${formatCOP(factura.iva)}</p>
            <p><strong>Retención IVA:</strong> -${formatCOP(factura.retencionIVA)}</p>
            <p><strong>Retención Fuente:</strong> -${formatCOP(factura.retencionFuente)}</p>
            <p><strong>Autoretención:</strong> -${formatCOP(factura.autoretencion)}</p>
            <p><strong>ICA:</strong> ${formatCOP(factura.ica)}</p>
            <h4><strong>TOTAL A PAGAR:</strong> ${formatCOP(factura.totalFactura)}</h4>
            <p>Generado por: ${factura.usuario}</p>
            <button id="exportPdfModalBtn" class="nav-button">Exportar a PDF</button>
        `;
        facturaModal.style.display = 'block';

        // Asegúrate de que el listener se añada al botón del modal
        document.getElementById('exportPdfModalBtn')?.addEventListener('click', () => exportarFacturaPDF(factura.id));
    } else {
        // Fallback si no hay modal (o para depuración)
        alert(`Detalle de Factura:\n\n` +
            `ID: ${factura.id}\n` +
            `Fecha: ${new Date(factura.fecha).toLocaleString()}\n` +
            `Empresa: ${factura.nombreEmpresa} (${factura.nitEmpresa})\n` +
            `Concepto: ${factura.concepto}\n` +
            `Valor Venta: ${formatCOP(factura.valorVenta)}\n` +
            `IVA: ${formatCOP(factura.iva)}\n` +
            `Retención IVA: -${formatCOP(factura.retencionIVA)}\n` +
            `Retención Fuente: -${formatCOP(factura.retencionFuente)}\n` +
            `Autoretención: -${formatCOP(factura.autoretencion)}\n` +
            `ICA: ${formatCOP(factura.ica)}\n` +
            `Total a Pagar: ${formatCOP(factura.totalFactura)}\n` +
            `Generado por: ${factura.usuario}`);
    }
}

let modoEdicionFactura = false;
let facturaEditandoId = null;

function editarFactura(id) {
    const factura = facturas.find(f => f.id === id);
    if (!factura) {
        showMessage('historialMsg', 'Factura no encontrada para editar.', true);
        return;
    }

    modoEdicionFactura = true;
    facturaEditandoId = id;

    // Prefill form fields
    document.getElementById('empresaFactura').value = factura.nitEmpresa;
    document.getElementById('valorVenta').value = factura.valorVenta;
    document.getElementById('conceptoFactura').value = factura.concepto;

    showSection('facturas'); // Navega a la sección de generación de facturas para editar

    // Change button text and action
    const btnGenerarFactura = document.getElementById('generarFacturaBtn');
    if (btnGenerarFactura) {
        btnGenerarFactura.textContent = 'Actualizar Factura';
        btnGenerarFactura.removeEventListener('click', generarFactura); // Remueve listener de generar
        btnGenerarFactura.addEventListener('click', actualizarFactura); // Añade listener de actualizar
    }

    // Ocultar el resultado de la factura previa
    document.getElementById('facturaResult').style.display = 'none';

    showMessage('facturaMsg', 'Editando factura. Realiza los cambios y presiona Actualizar.', false);
}

async function actualizarFactura() {
    if (!facturaEditandoId) {
        // Esto no debería pasar si el flujo es correcto, pero es un seguro.
        // Si no hay ID de edición, vuelve al comportamiento de generar.
        generarFactura();
        return;
    }

    const nitEmpresa = document.getElementById('empresaFactura').value;
    const valorVenta = parseFloat(document.getElementById('valorVenta').value);
    const concepto = document.getElementById('conceptoFactura').value.trim();

    if (!nitEmpresa || isNaN(valorVenta) || valorVenta <= 0 || !concepto) {
        showMessage('facturaMsg', 'Por favor completa todos los campos correctamente.', true);
        return;
    }

    const empresa = empresas.find(e => e.nit === nitEmpresa);
    if (!empresa) {
        showMessage('facturaMsg', 'Empresa no encontrada.', true);
        return;
    }

    // Cálculos tributarios (se recalculan al actualizar)
    const iva = valorVenta * (empresa.tarifaNacional / 100);
    const retencionIVA = iva * (empresa.retenciones / 100);
    const retencionFuente = valorVenta * (empresa.retenciones / 100);
    const autoretencion = empresa.regimen === 'Especial' ? valorVenta * (empresa.autoretenciones / 100) : 0;
    const tarifaICA = obtenerTarifaICA(empresa.ciudad, empresa.actividad, tarifasICA);
    const ica = valorVenta * (tarifaICA / 100);
    const totalFactura = valorVenta + iva - retencionIVA - retencionFuente - autoretencion + ica;

    const facturaActualizada = {
        id: facturaEditandoId,
        fecha: new Date().toISOString(), // Actualiza la fecha de modificación
        nitEmpresa: empresa.nit,
        nombreEmpresa: empresa.nombre,
        ciudadEmpresa: empresa.ciudad,
        actividadEmpresa: empresa.actividad,
        regimenEmpresa: empresa.regimen,
        concepto,
        valorVenta,
        iva,
        retencionIVA,
        retencionFuente,
        autoretencion,
        ica,
        totalFactura,
        usuario: currentUser.user
    };

    try {
        const res = await fetch(`http://localhost:4000/facturas/${facturaEditandoId}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(facturaActualizada),
        });

        if (!res.ok) throw new Error("No se pudo actualizar la factura");

        const index = facturas.findIndex(f => f.id === facturaEditandoId);
        if (index !== -1) facturas[index] = facturaActualizada; // Actualiza el array local

        // Resetear el modo de edición
        modoEdicionFactura = false;
        facturaEditandoId = null;

        // Limpiar el formulario
        document.getElementById('empresaFactura').value = '';
        document.getElementById('valorVenta').value = '';
        document.getElementById('conceptoFactura').value = '';

        // Restaurar el botón a "Generar Factura"
        const btnGenerarFactura = document.getElementById('generarFacturaBtn');
        if (btnGenerarFactura) {
            btnGenerarFactura.textContent = 'Generar Factura';
            btnGenerarFactura.removeEventListener('click', actualizarFactura);
            btnGenerarFactura.addEventListener('click', generarFactura);
        }
        
        // Ocultar el resultado de la factura (si se mostró para la edición)
        document.getElementById('facturaResult').style.display = 'none';

        showMessage('facturaMsg', 'Factura actualizada correctamente.', false);
        // Cuando actualizas una factura desde la sección de facturas, no la redirijas
        // a historial, solo actualiza el historial internamente para que se vea
        // reflejado cuando el usuario navegue allí.
        cargarHistorialFacturas(); 
        
    } catch (error) {
        console.error("Error al actualizar factura:", error);
        showMessage('facturaMsg', 'Error al actualizar la factura.', true);
    }
}

async function eliminarFactura(id) {
    if (!confirm('¿Estás seguro de eliminar esta factura? Esta acción no se puede deshacer.')) return;

    try {
        const res = await fetch(`http://localhost:4000/facturas/${id}`, {
            method: "DELETE",
        });

        if (!res.ok) throw new Error("No se pudo eliminar la factura");

        facturas = facturas.filter(f => f.id !== id); // Eliminar del array local
        renderHistorial(facturas); // Volver a renderizar la tabla del historial
        showMessage('historialMsg', 'Factura eliminada con éxito.', false); // Mensaje en la sección de historial
    } catch (error) {
        console.error("Error al eliminar factura:", error);
        showMessage('historialMsg', 'Error al eliminar la factura.', true);
    }
}

// Helper functions for displaying invoice details (crearRow, crearGrupo, crearFila)
function crearRow(grupos) {
    const row = document.createElement('div');
    row.className = 'form-row';
    grupos.forEach(grupo => row.appendChild(grupo));
    return row;
}

function crearGrupo(lineas) {
    const grupo = document.createElement('div');
    grupo.className = 'form-group';
    lineas.forEach(linea => {
        const p = document.createElement('p');
        const parts = linea.split(':');
        const key = parts[0];
        const value = parts.slice(1).join(':').trim();
        p.innerHTML = `<strong>${key}:</strong> ${value}`;
        grupo.appendChild(p);
    });
    return grupo;
}

function crearFila(concepto, valor, esTotal = false) {
    return `
        <tr style="${esTotal ? 'font-weight: bold; background: #f5f9ff;' : ''}">
            <td>${concepto}</td>
            <td>${valor}</td>
        </tr>
    `;
}

// Para cargar dinámicamente las ciudades en el selector de ICA
function cargarCiudadesParaICA() {
    const selectCiudadICA = document.getElementById('selectCiudadICA');
    if (!selectCiudadICA) return;

    // Guardar la ciudad seleccionada actual antes de borrar las opciones
    const selectedValue = selectCiudadICA.value;

    selectCiudadICA.innerHTML = '<option value="" disabled selected>-- Seleccione ciudad --</option>';

    const ciudadesUnicas = [...new Set(tarifasICA.map(t => t.ciudad))];

    ciudadesUnicas.forEach(ciudad => {
        const option = document.createElement('option');
        option.value = ciudad;
        option.textContent = ciudad;
        selectCiudadICA.appendChild(option);
    });

    // Restaurar la selección si la ciudad existía en la nueva lista
    if (ciudadesUnicas.includes(selectedValue)) {
        selectCiudadICA.value = selectedValue;
    }
}


function calcularICAPorCiudad() {
    const ciudad = document.getElementById('selectCiudadICA').value;
    if (!ciudad) {
        document.getElementById('icaEmpresas').innerHTML = '';
        document.getElementById('icaFacturas').innerHTML = '';
        document.getElementById('ciudadSeleccionada').textContent = '';
        return;
    }

    document.getElementById('ciudadSeleccionada').textContent = ciudad;

    const empresasCiudad = empresas.filter(e => e.ciudad === ciudad);
    const facturasCiudad = facturas.filter(f => empresasCiudad.some(e => e.nit === f.nitEmpresa));

    const icaPorEmpresa = {};
    empresasCiudad.forEach(empresa => {
        const facturasEmpresa = facturasCiudad.filter(f => f.nitEmpresa === empresa.nit);
        const totalICA = facturasEmpresa.reduce((sum, f) => sum + f.ica, 0);
        icaPorEmpresa[empresa.nit] = {
            nombre: empresa.nombre,
            totalICA,
            facturas: facturasEmpresa.length
        };
    });

    // Render empresa ICA
    const icaEmpresasDiv = document.getElementById('icaEmpresas');
    icaEmpresasDiv.innerHTML = '';
    const empresaTitulo = document.createElement('h4');
    empresaTitulo.textContent = `Empresas en ${ciudad}`;
    icaEmpresasDiv.appendChild(empresaTitulo);

    const rowsEmpresas = Object.entries(icaPorEmpresa).map(([nit, data]) => [
        data.nombre,
        nit,
        data.facturas,
        formatCOP(data.totalICA)
    ]);

    const tablaEmpresas = crearTabla(['Empresa', 'NIT', 'Facturas', 'Total ICA'], rowsEmpresas);
    icaEmpresasDiv.appendChild(tablaEmpresas);

    // Render facturas ICA
    const icaFacturasDiv = document.getElementById('icaFacturas');
    icaFacturasDiv.innerHTML = '';
    const facturasTitulo = document.createElement('h4');
    facturasTitulo.textContent = `Facturas en ${ciudad}`;
    icaFacturasDiv.appendChild(facturasTitulo);

    const rowsFacturas = facturasCiudad.map(factura => [
        new Date(factura.fecha).toLocaleDateString(),
        factura.nombreEmpresa,
        factura.concepto,
        formatCOP(factura.valorVenta),
        formatCOP(factura.ica)
    ]);

    const tablaFacturas = crearTabla(['Fecha', 'Empresa', 'Concepto', 'Valor Venta', 'ICA'], rowsFacturas);
    icaFacturasDiv.appendChild(tablaFacturas);
}

function exportarFacturaPDF(facturaId) {
    alert(`Exportando factura ${facturaId} a PDF... (Funcionalidad pendiente)`);
    // Implement PDF generation logic here, e.g., using jsPDF
}