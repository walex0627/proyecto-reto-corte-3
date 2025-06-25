// helpers.js

// Formato de pesos
export function formatCOP(value) {
    return new Intl.NumberFormat('es-CO', {
        style: 'currency',
        currency: 'COP',
        minimumFractionDigits: 0
    }).format(value);
}

// Mostrar mensaje personalizado
export function showMessage(id, text, isError = true) {
    const el = document.getElementById(id);
    if (el) { // MEJORA: Verificar que el elemento existe antes de manipularlo
        el.textContent = text;
        el.className = isError ? 'message error' : 'message success';
        el.style.display = 'block';
    } else {
        console.warn(`Elemento con ID '${id}' no encontrado para mostrar mensaje.`);
    }
}

export function hideMessage(id) {
    const el = document.getElementById(id);
    if (el) { // MEJORA: Verificar que el elemento existe
        el.style.display = 'none';
    }
}

// Obtener tarifa de ICA
// MEJORA: Reordenar parámetros para que coincida con cómo se llama en app.js
export function obtenerTarifaICA(ciudad, actividad, tarifasICA) {
    const ciudadObj = tarifasICA.find(t => t.ciudad === ciudad);
    return ciudadObj?.tarifas?.[actividad] || 0;
}

// MEJORA: showRegister ahora se define y exporta desde helpers.js
export function showRegister() {
    document.getElementById('loginForm').style.display = 'none';
    document.getElementById('registerForm').style.display = 'block';
    hideMessage('loginMsg');
    hideMessage('registerMsg');
    // MEJORA: Limpiar campos de registro al mostrar el formulario
    document.getElementById('regUser').value = '';
    document.getElementById('regPass').value = '';
    document.getElementById('regRole').value = 'invitado'; // Valor por defecto
}

export function crearTabla(headers, rows) {
    const table = document.createElement('table');
    // MEJORA: Añadir clases para estilos si es necesario
    table.className = 'data-table'; 

    const thead = document.createElement('thead');
    const headerRow = document.createElement('tr');
    headers.forEach(headerText => {
        const th = document.createElement('th');
        th.textContent = headerText;
        headerRow.appendChild(th);
    });
    thead.appendChild(headerRow);
    table.appendChild(thead);

    const tbody = document.createElement('tbody');
    rows.forEach(rowData => {
        const tr = document.createElement('tr');
        rowData.forEach(cellData => {
            const td = document.createElement('td');
            // MEJORA: Usar innerHTML para permitir que cellData contenga HTML (ej. botones)
            td.innerHTML = cellData; 
            tr.appendChild(td);
        });
        tbody.appendChild(tr);
    });

    table.appendChild(tbody);
    return table;
}