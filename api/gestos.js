// --- API REAL (CON BACKEND) ---
// Este script conecta el frontend con el backend de Flask utilizando la configuración
// definida en `app-config.js`. Funciona tanto en GitHub Pages como en entornos locales.

(function() {
  const FALLBACK_BACKEND_URL = 'http://127.0.0.1:5000';
  const configuredBackend = window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL;

  const backendBaseUrl = (configuredBackend || FALLBACK_BACKEND_URL).replace(/\/$/, '');
  const API_BASE_URL = `${backendBaseUrl}/api`;

  console.log('🚀 API real (backend) inicializada.');
  console.log(`🌐 Backend base URL: ${backendBaseUrl}`);
  console.log(`🔗 Endpoint API: ${API_BASE_URL}`);

  async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    const fetchOptions = {
      method: 'GET',
      ...options,
      headers
    };

    try {
      const response = await fetch(url, fetchOptions);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error en la solicitud ${url}:`, error);
      throw error;
    }
  }

  /**
   * Guarda un gesto en la base de datos a través del backend.
   * @param {string} tipo - El tipo de gesto (e.g., 'parpadeo').
   * @param {string} estado - El estado del gesto (e.g., 'cerrado').
   * @returns {Promise<object>} - El resultado de la API.
   */
  async function saveGesto(tipo, estado) {
    try {
      const result = await request('/gestos', {
        method: 'POST',
        body: JSON.stringify({ tipo_gesto: tipo, estado })
      });
      console.log(`✅ Gesto '${tipo}: ${estado}' enviado al backend.`);
      return result;
    } catch (error) {
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
      const query = `?fecha_inicio=${encodeURIComponent(fechaInicio)}&fecha_fin=${encodeURIComponent(fechaFin)}`;
      const result = await request(`/estadisticas/${tipo}${query}`);
      console.log(`📊 Estadísticas para '${tipo}' obtenidas del backend.`);
      return result;
    } catch (error) {
      console.error(`❌ Error al obtener estadísticas: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtiene estadísticas de los últimos 30 días desde el backend.
   * @param {string} tipo - El tipo de gesto.
   * @returns {Promise<Array>} - Una lista con las estadísticas.
   */
  async function getStatsLast30(tipo) {
    try {
      const result = await request(`/estadisticas/${tipo}/ultimos30`);
      console.log(`📊 Estadísticas de 30 días para '${tipo}' obtenidas del backend.`);
      return result;
    } catch (error) {
      console.error(`❌ Error al obtener estadísticas de 30 días: ${error.message}`);
      return [];
    }
  }

  /**
   * Obtiene la fecha y hora del backend para depuración.
   * @returns {Promise<object|null>} - Información de fecha del servidor.
   */
  async function getServerDate() {
    try {
      const response = await fetch(`${backendBaseUrl}/debug/fecha`);
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`❌ Error obteniendo fecha del backend: ${error.message}`);
      return null;
    }
  }

  // Exponer la API en el objeto window para que `index.html` pueda usarla.
  window.GestosAPI = {
    saveGesto,
    getStatsByDate,
    getStatsLast30,
    getServerDate,
    getBackendBaseUrl: () => backendBaseUrl
  };

})();
