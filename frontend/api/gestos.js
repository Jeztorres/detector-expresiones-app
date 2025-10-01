// Copia directa de api/gestos.js para frontend
(function(){
  const FALLBACK_BACKEND_URL = 'http://127.0.0.1:5000';
  const configuredBackend = window.APP_CONFIG && window.APP_CONFIG.BACKEND_URL;
  const backendBaseUrl = (configuredBackend || FALLBACK_BACKEND_URL).replace(/\/$/, '');
  const API_BASE_URL = `${backendBaseUrl}/api`;

  console.log('🚀 API real (backend) inicializada.');
  console.log(`🌐 Backend base URL: ${backendBaseUrl}`);
  console.log(`🔗 Endpoint API: ${API_BASE_URL}`);

  async function request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
    const fetchOptions = { method: 'GET', ...options, headers, mode: 'cors' };
    console.log('🌐 Petición:', url, fetchOptions);
    const resp = await fetch(url, fetchOptions);
    console.log('📥 Respuesta:', resp.status, resp.statusText, resp.headers.get('content-type'));
    if (!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
    const data = await resp.json();
    console.log('📦 Datos recibidos:', data);
    return data;
  }

  async function saveGesto(tipo, estado){
    try{ return await request('/gestos', { method:'POST', body: JSON.stringify({ tipo_gesto: tipo, estado }) }); }
    catch(e){ return { error: e.message }; }
  }

  async function getStatsByDate(tipo, fi, ff){
    try{ return await request(`/estadisticas/${tipo}?fecha_inicio=${encodeURIComponent(fi)}&fecha_fin=${encodeURIComponent(ff)}`); }
    catch(e){ console.error(`❌ Error al obtener estadísticas: ${e.message}`); return []; }
  }

  // Nueva función para estadísticas de hoy
  async function getStatsToday(tipo){
    try{ return await request(`/estadisticas/${tipo}/hoy`); }
    catch(e){ console.error(`❌ Error al obtener estadísticas de hoy: ${e.message}`); return []; }
  }

  // Nueva función para estadísticas de últimos 7 días
  async function getStatsLast7(tipo){
    try{ return await request(`/estadisticas/${tipo}/ultimos7`); }
    catch(e){ console.error(`❌ Error al obtener estadísticas de 7 días: ${e.message}`); return []; }
  }

  async function getStatsLast30(tipo){
    try{ return await request(`/estadisticas/${tipo}/ultimos30`); }
    catch(e){ console.error(`❌ Error al obtener estadísticas de 30 días: ${e.message}`); return []; }
  }

  // Nueva función para historial diario con paginación
  async function getDailyHistory(tipo, page = 1, limit = 30){
    try{ return await request(`/estadisticas/${tipo}/historial?page=${page}&limit=${limit}`); }
    catch(e){ console.error(`❌ Error al obtener historial diario: ${e.message}`); return { data: [], page: 1, limit: 30, total_pages: 0 }; }
  }

  async function getServerDate(){
    try{
      const resp = await fetch(`${backendBaseUrl}/debug/fecha`, { mode: 'cors' });
      if(!resp.ok) throw new Error(`Error ${resp.status}: ${resp.statusText}`);
      return await resp.json();
    }catch(e){ console.error(`❌ Error obteniendo fecha del backend: ${e.message}`); return null; }
  }

  // Exportar todas las funciones incluyendo las nuevas
  window.GestosAPI = { 
    saveGesto, 
    getStatsByDate, 
    getStatsToday,
    getStatsLast7,
    getStatsLast30, 
    getDailyHistory,
    getServerDate, 
    getBackendBaseUrl: () => backendBaseUrl 
  };
})();
