// --- API REAL (CON BACKEND) ---
// Este script conecta el frontend con el backend de Flask.
// Funciona tanto en localhost como en GitHub Pages.

(function() {
  console.log("🚀 API real (backend) inicializada.");

  // Detectar si estamos en GitHub Pages o en localhost
  const isGitHubPages = window.location.hostname.includes('github.io') || 
                       window.location.hostname.includes('github.com');
  
  // Configurar URL del backend según el entorno
  const API_BASE_URL = isGitHubPages 
    ? 'https://detector-expresiones-backend.herokuapp.com/api'  // URL de tu backend en Heroku
    : 'http://127.0.0.1:5000/api';
  
  console.log(`🌐 Entorno detectado: ${isGitHubPages ? 'GitHub Pages' : 'Local'}`);
  console.log(`🔗 API URL: ${API_BASE_URL}`);

  /**
   * Guarda un gesto en la base de datos a través del backend.
   * @param {string} tipo - El tipo de gesto (e.g., 'parpadeo').
   * @param {string} estado - El estado del gesto (e.g., 'cerrado').
   * @returns {Promise<object>} - El resultado de la API.
   */
  async function saveGesto(tipo, estado) {
    // Se envían todos los estados al backend.
    // La base de datos se encarga de gestionar las transiciones (solo guarda si el estado cambia).

    try {
      const response = await fetch(`${API_BASE_URL}/gestos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_gesto: tipo, estado: estado })
      });

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      console.log(`✅ Gesto '${tipo}: ${estado}' enviado al backend.`);
      return await response.json();

    } catch (error) {
      console.error(`❌ Error al guardar gesto: ${error.message}`);
      // En caso de error, devolver un objeto de error para que la app no se rompa.
      return { error: error.message };
    }
  }

  /**
   * Obtiene estadísticas de la base de datos para un rango de fechas.
   * @param {string} tipo - El tipo de gesto.
   * @param {string} fechaInicio - Fecha de inicio 'YYYY-MM-DD'.
   * @param {string} fechaFin - Fecha de fin 'YYYY-MM-DD'.
   * @returns {Promise<Array>} - Una lista con las estadísticas.
   */
  async function getStatsByDate(tipo, fechaInicio, fechaFin) {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticas/${tipo}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`);
      
      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      console.log(`📊 Estadísticas para '${tipo}' obtenidas del backend.`);
      return await response.json();

    } catch (error) {
      console.error(`❌ Error al obtener estadísticas: ${error.message}`);
      return []; // Devolver un array vacío en caso de error.
    }
  }

  /**
   * Obtiene estadísticas de los últimos 30 días desde el backend.
   * @param {string} tipo - El tipo de gesto.
   * @returns {Promise<Array>} - Una lista con las estadísticas.
   */
  async function getStatsLast30(tipo) {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticas/${tipo}/ultimos30`);

      if (!response.ok) {
        throw new Error(`Error en la API: ${response.statusText}`);
      }

      console.log(`📊 Estadísticas de 30 días para '${tipo}' obtenidas del backend.`);
      return await response.json();

    } catch (error) {
      console.error(`❌ Error al obtener estadísticas de 30 días: ${error.message}`);
      return [];
    }
  }

  // Exponer la API en el objeto window para que `index.html` pueda usarla.
  window.GestosAPI = {
    saveGesto,
    getStatsByDate,
    getStatsLast30
  };

})();