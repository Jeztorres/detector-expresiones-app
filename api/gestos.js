// API para GitHub Pages que se conecta directamente a MySQL en la nube
// Usa tu backend existente desplegado en la nube

// Configuración de la base de datos en la nube
const DB_CONFIG = {
    // URL de tu backend desplegado en la nube (Railway, Render, Heroku, etc.)
    apiUrl: 'https://detector-expresiones-backend.railway.app/api/gestos'
};

// Función para enviar datos a MySQL en la nube
async function saveGesto(tipo, estado) {
    try {
        const response = await fetch(DB_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                tipo_gesto: tipo,
                estado: estado
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Gesto guardado en MySQL: ${tipo} - ${estado}`);
            return result;
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Error guardando en MySQL: ${error.message}`);
        
        // Fallback: guardar en localStorage si falla la conexión
        const fallbackData = {
            tipo: tipo,
            estado: estado,
            fecha: new Date().toISOString(),
            error: error.message
        };
        
        const existingData = JSON.parse(localStorage.getItem('gestos_fallback') || '[]');
        existingData.push(fallbackData);
        localStorage.setItem('gestos_fallback', JSON.stringify(existingData));
        
        console.log(`💾 Gesto guardado en localStorage como fallback: ${tipo} - ${estado}`);
        return fallbackData;
    }
}

// Función para obtener gestos desde MySQL en la nube
async function getGestos() {
    try {
        const response = await fetch(DB_CONFIG.apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (response.ok) {
            const gestos = await response.json();
            console.log(`📊 Obtenidos ${gestos.length} gestos desde MySQL`);
            return gestos;
        } else {
            throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
    } catch (error) {
        console.error(`❌ Error obteniendo gestos: ${error.message}`);
        
        // Fallback: obtener desde localStorage
        const fallbackData = JSON.parse(localStorage.getItem('gestos_fallback') || '[]');
        console.log(`💾 Obtenidos ${fallbackData.length} gestos desde localStorage`);
        return fallbackData;
    }
}

// Función para sincronizar datos pendientes
async function sincronizarPendientes() {
    const pendientes = JSON.parse(localStorage.getItem('gestos_fallback') || '[]');
    
    if (pendientes.length === 0) {
        console.log('✅ No hay datos pendientes para sincronizar');
        return;
    }
    
    console.log(`🔄 Sincronizando ${pendientes.length} gestos pendientes...`);
    
    for (const gesto of pendientes) {
        try {
            await saveGesto(gesto.tipo, gesto.estado);
        } catch (error) {
            console.error(`❌ Error sincronizando gesto: ${error.message}`);
            break; // Si falla, parar la sincronización
        }
    }
    
    // Limpiar datos sincronizados
    localStorage.removeItem('gestos_fallback');
    console.log('✅ Sincronización completada');
}

// Exportar funciones para uso global
window.GestosAPI = {
    save: saveGesto,
    getAll: getGestos,
    sync: sincronizarPendientes
};

// Sincronizar datos pendientes al cargar
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        window.GestosAPI.sync();
    }, 2000); // Esperar 2 segundos para que la página cargue
});
