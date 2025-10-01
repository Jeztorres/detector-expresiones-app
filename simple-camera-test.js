// Test simple de cámara sin MediaPipe
async function testCamera() {
  console.log('🎥 Probando cámara simple...');
  
  const video = document.getElementById('video');
  const status = document.getElementById('status');
  
  try {
    status.textContent = '🔄 Solicitando acceso a la cámara...';
    
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        facingMode: 'user'
      },
      audio: false
    });
    
    video.srcObject = stream;
    video.play();
    
    status.textContent = '✅ Cámara funcionando correctamente';
    console.log('✅ Cámara inicializada correctamente');
    
    // Mostrar información del stream
    const tracks = stream.getVideoTracks();
    if (tracks.length > 0) {
      const settings = tracks[0].getSettings();
      console.log('📹 Configuración de cámara:', settings);
    }
    
  } catch (error) {
    console.error('❌ Error con la cámara:', error);
    
    if (error.name === 'NotAllowedError') {
      status.textContent = '❌ Permisos denegados. Permite el acceso a la cámara.';
    } else if (error.name === 'NotFoundError') {
      status.textContent = '❌ No se encontró cámara.';
    } else if (error.name === 'NotSupportedError') {
      status.textContent = '❌ Cámara no soportada. Usa HTTPS o localhost.';
    } else {
      status.textContent = `❌ Error: ${error.message}`;
    }
  }
}

// Función global para el botón
window.testCameraSimple = testCamera;

// Auto-inicializar si estamos en contexto seguro
document.addEventListener('DOMContentLoaded', () => {
  const isSecure = location.protocol === 'https:' || 
                   location.hostname === 'localhost' || 
                   location.hostname === '127.0.0.1';
  
  if (isSecure) {
    setTimeout(testCamera, 1000);
  } else {
    document.getElementById('status').textContent = '⚠️ Usa localhost o HTTPS para la cámara';
  }
});