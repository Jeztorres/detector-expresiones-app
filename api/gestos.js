// --- API REAL (CON BACKEND) ---
// Este script conecta el frontend con el backend de Flask e incluye un indicador de estado.

(function() {
  console.log("🚀 API real (backend) inicializada.");

  const API_BASE_URL = 'http://127.0.0.1:5000/api';

  /**
   * Actualiza el indicador de estado del backend en la interfaz.
   * @param {boolean} isConnected - True si la conexión es exitosa, false en caso contrario.
   * @param {string} message - El mensaje a mostrar.
   */
  function updateBackendStatus(isConnected, message) {
    const statusElement = document.getElementById('backend-status');
    if (statusElement) {
      const statusSpan = statusElement.querySelector('span');
      if (isConnected) {
        statusSpan.textContent = message;
        statusSpan.style.color = '#3fb950'; // Verde
      } else {
        statusSpan.textContent = message;
        statusSpan.style.color = '#f85149'; // Rojo
      }
    }
  }

  /**
   * Verifica la conexión con el backend llamando al endpoint de health check.
   */
  async function healthCheck() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      if (!response.ok) {
        throw new Error(`El backend respondió con estado: ${response.status}`);
      }
      const data = await response.json();
      if (data.status === 'ok') {
        updateBackendStatus(true, '✅ Conectado');
        console.log("✅ Backend conectado.");
      } else {
        throw new Error("La respuesta del health check no fue 'ok'.");
      }
    } catch (error) {
      updateBackendStatus(false, '❌ Desconectado');
      console.error(`❌ Error de conexión con el backend: ${error.message}`);
    }
  }

  /**
   * Guarda un gesto en la base de datos a través del backend.
   */
  async function saveGesto(tipo, estado) {
    if ( (tipo === 'parpadeo' && estado !== 'cerrado') || (tipo === 'cejas' && estado !== 'arqueadas') || (tipo === 'boca' && estado !== 'abierta') ) {
      return Promise.resolve({ message: "Estado no relevante, no guardado." });
    }
    try {
      const response = await fetch(`${API_BASE_URL}/gestos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tipo_gesto: tipo, estado: estado })
      });
      if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
      console.log(`✅ Gesto '${tipo}: ${estado}' enviado al backend.`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Error al guardar gesto: ${error.message}`);
      updateBackendStatus(false, '❌ Desconectado');
      return { error: error.message };
    }
  }

  /**
   * Obtiene estadísticas de la base de datos para un rango de fechas.
   */
  async function getStatsByDate(tipo, fechaInicio, fechaFin) {
    try {
      const url = `${API_BASE_URL}/estadisticas/${tipo}?fecha_inicio=${fechaInicio}&fecha_fin=${fechaFin}`;
      const response = await fetch(url);
      if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
      console.log(`📊 Estadísticas para '${tipo}' obtenidas del backend.`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Error al obtener estadísticas: ${error.message}`);
      updateBackendStatus(false, '❌ Desconectado');
      return [];
    }
  }

  /**
   * Obtiene estadísticas de los últimos 30 días desde el backend.
   */
  async function getStatsLast30(tipo) {
    try {
      const response = await fetch(`${API_BASE_URL}/estadisticas/${tipo}/ultimos30`);
      if (!response.ok) throw new Error(`Error en la API: ${response.statusText}`);
      console.log(`📊 Estadísticas de 30 días para '${tipo}' obtenidas del backend.`);
      return await response.json();
    } catch (error) {
      console.error(`❌ Error al obtener estadísticas de 30 días: ${error.message}`);
      updateBackendStatus(false, '❌ Desconectado');
      return [];
    }
  }

  // Exponer la API en el objeto window para que `index.html` pueda usarla.
  window.GestosAPI = {
    saveGesto,
    getStatsByDate,
    getStatsLast30
  };

  // Verificar el estado del backend cuando el DOM esté completamente cargado.
  document.addEventListener('DOMContentLoaded', healthCheck);

})();