// API que conecta GitHub Pages a tu backend local
const DB_CONFIG = {
    apiUrl: 'http://127.0.0.1:5000/api/gestos'
};

async function saveGesto(tipo, estado) {
    try {
        const response = await fetch(DB_CONFIG.apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                tipo_gesto: tipo,
                estado: estado
            })
        });
        
        if (response.ok) {
            const result = await response.json();
            console.log(`✅ Gesto guardado: ${tipo} - ${estado}`);
            return result;
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return null;
    }
}

async function getGestos() {
    try {
        const response = await fetch(DB_CONFIG.apiUrl, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        });
        
        if (response.ok) {
            const gestos = await response.json();
            console.log(`📊 Obtenidos ${gestos.length} gestos`);
            return gestos;
        } else {
            throw new Error(`Error ${response.status}`);
        }
    } catch (error) {
        console.error(`❌ Error: ${error.message}`);
        return [];
    }
}

window.GestosAPI = {
    save: saveGesto,
    getAll: getGestos
};
