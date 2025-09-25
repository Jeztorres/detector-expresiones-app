// API estática para GitHub Pages
// Simula el backend Flask pero funciona como archivo estático

// Base de datos simulada en localStorage
const DB_KEY = 'gestos_database';

function initDatabase() {
    if (!localStorage.getItem(DB_KEY)) {
        localStorage.setItem(DB_KEY, JSON.stringify({
            parpadeos: [],
            cejas: [],
            boca: []
        }));
    }
}

function saveGesto(tipo, estado) {
    const db = JSON.parse(localStorage.getItem(DB_KEY));
    const gesto = {
        tipo: tipo,
        estado: estado,
        fecha: new Date().toISOString()
    };
    
    db[tipo + 's'].push(gesto);
    localStorage.setItem(DB_KEY, JSON.stringify(db));
    
    console.log(`✅ Gesto guardado en localStorage: ${tipo} - ${estado}`);
    return gesto;
}

function getGestos() {
    const db = JSON.parse(localStorage.getItem(DB_KEY));
    const allGestos = [];
    
    Object.keys(db).forEach(tipo => {
        db[tipo].forEach(gesto => {
            allGestos.push({
                tipo: tipo.slice(0, -1), // quitar 's' del final
                estado: gesto.estado,
                fecha: gesto.fecha
            });
        });
    });
    
    return allGestos.sort((a, b) => new Date(b.fecha) - new Date(a.fecha));
}

// Inicializar base de datos
initDatabase();

// Exportar funciones para uso global
window.GestosAPI = {
    save: saveGesto,
    getAll: getGestos
};
