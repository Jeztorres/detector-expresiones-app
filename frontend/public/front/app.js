// --- CONFIG API (endpoint del backend Flask) ---
// Para GitHub Pages, usar un backend público o deshabilitar guardado
const isGitHubPages = window.location.hostname.includes('github.io');
const ENDPOINT_GESTOS = isGitHubPages 
  ? null  // Sin backend en GitHub Pages
  : "http://127.0.0.1:5000/api/gestos";  // Backend local

document.addEventListener("DOMContentLoaded", () => {
  console.log("🚀 DOM cargado, iniciando aplicación...");
  
  const videoElement = document.getElementById('video');
  const canvasElement = document.getElementById('canvasOutput');
  const canvasCtx = canvasElement.getContext('2d');
  const status = document.getElementById('status');

  // Verificar que los elementos existan
  if (!videoElement) {
    console.error("❌ Elemento video no encontrado");
    status.textContent = "❌ Error: Elemento video no encontrado";
    return;
  }
  
  if (!canvasElement) {
    console.error("❌ Elemento canvas no encontrado");
    status.textContent = "❌ Error: Elemento canvas no encontrado";
    return;
  }

  console.log("✅ Elementos DOM encontrados:", {
    video: videoElement,
    canvas: canvasElement,
    status: status
  });

  const cejaCounterEl = document.getElementById('ceja-counter');
  const bocaCounterEl = document.getElementById('boca-counter');
  const parpadeoCounterEl = document.getElementById('parpadeo-counter');

  let cejaCount = 0, bocaCount = 0, parpadeoCount = 0;

  // Verificar si las librerías están disponibles
  console.log("🔍 Verificando librerías...");
  console.log("- Camera disponible:", typeof Camera !== 'undefined');
  console.log("- FaceMesh disponible:", typeof FaceMesh !== 'undefined');
  console.log("- drawConnectors disponible:", typeof drawConnectors !== 'undefined');
  console.log("- FACEMESH_* disponibles:", {
    TESSELATION: typeof FACEMESH_TESSELATION !== 'undefined',
    RIGHT_EYE: typeof FACEMESH_RIGHT_EYE !== 'undefined',
    LEFT_EYE: typeof FACEMESH_LEFT_EYE !== 'undefined',
    LIPS: typeof FACEMESH_LIPS !== 'undefined'
  });

  if (typeof Camera === 'undefined') {
    status.textContent = "❌ Error: Librería Camera no cargada - Verifica conexión a internet";
    console.error("MediaPipe Camera utils no está disponible");
    return;
  }

  if (typeof FaceMesh === 'undefined') {
    status.textContent = "❌ Error: Librería FaceMesh no cargada - Verifica conexión a internet";
    console.error("MediaPipe FaceMesh no está disponible");
    return;
  }

  if (typeof drawConnectors === 'undefined') {
    status.textContent = "❌ Error: Librería drawing_utils no cargada";
    console.error("MediaPipe drawing_utils no está disponible");
    return;
  }

  console.log("✅ Librerías MediaPipe cargadas correctamente");
  
  // Verificar OpenCV (opcional pero recomendado)
  if (typeof cvReady === 'undefined' || !cvReady) {
    console.log("⚠️ OpenCV.js aún no está listo, usando fallback");
  } else {
    console.log("✅ OpenCV.js cargado correctamente");
  }
  
  status.textContent = "🔄 Inicializando detección facial...";

  // Verificar si estamos en HTTPS o localhost
  function checkSecureContext() {
    const isSecure = window.location.protocol === 'https:' || 
                    window.location.hostname === 'localhost' || 
                    window.location.hostname === '127.0.0.1';
    
    if (!isSecure) {
      console.warn("⚠️ Conexión no segura detectada. Algunos navegadores requieren HTTPS para la cámara.");
      // No lanzar error, solo advertir
    }
    
    return isSecure;
  }

  // Función para verificar permisos de cámara
  async function checkCameraPermissions() {
    try {
      // Verificar contexto seguro
      const isSecure = checkSecureContext();
      if (!isSecure) {
        console.log("⚠️ Conexión HTTP detectada - algunos navegadores pueden bloquear la cámara");
      }

      // Verificar si el navegador soporta getUserMedia
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error("Este navegador no soporta acceso a cámara. Usa Chrome, Firefox o Edge.");
      }

      console.log("🔍 Verificando permisos de cámara...");
      status.textContent = "🔍 Verificando permisos de cámara...";

      // Verificar permisos usando la nueva API
      if ('permissions' in navigator) {
        const permission = await navigator.permissions.query({name: 'camera'});
        console.log("Estado de permisos:", permission.state);
        
        if (permission.state === 'denied') {
          throw new Error("Permisos de cámara denegados permanentemente. Ve a Configuración → Privacidad y activa la cámara.");
        }
      }

      // Intentar obtener acceso a la cámara directamente
      console.log("🎥 Solicitando acceso a la cámara...");
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { 
          width: { ideal: 640 }, 
          height: { ideal: 480 },
          facingMode: 'user' // Cámara frontal preferida
        }
      });
      
      // Detener el stream temporal
      stream.getTracks().forEach(track => track.stop());
      console.log("✅ Permisos de cámara verificados");
      return true;
      
    } catch (error) {
      console.error("❌ Error verificando permisos:", error);
      throw error;
    }
  }

  // ======= ESTADOS ACTUALES =======
  let estadoBoca = "cerrada";   // 'abierta' | 'cerrada'
  let estadoCejas = "normal";   // 'arqueadas' | 'normal'
  let estadoParp  = "abierto";  // 'cerrado' | 'abierto'

  // ======= CALIBRACIÓN / PARPADEO =======
  let frameCounter = 0;
  const framesParaCalibrar = 100;
  const earBufferCalibracion = [];
  const cejaBufferCalibracion = [];
  let earAbiertoCalibrado = null;
  let ratioCejaNeutralPromedio = null;

  let earEma = null;
  let framesPorDebajo = 0;
  let refractario = 0;
  let umbralCierre = null;
  let umbralApertura = null;

  // ======= PARÁMETROS =======
  const UMBRAL_BOCA_ABIERTA = 0.05;
  const EAR_EMA_ALPHA = 0.4;
  const FRAMES_CERRADO = 2;
  const REFRACTARIO_FRAMES = 6;
  const FACTOR_CIERRE = 0.78;
  const FACTOR_APERTURA = 0.88;
  const FACTOR_UMBRAL_CEJA = 1.20;

  function onResults(results) {
    frameCounter++;
    canvasCtx.save();

    // Limpiar canvas
    canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
    
    // Dibujar imagen base a COLOR (con OpenCV si está listo)
    if (typeof cvReady !== "undefined" && cvReady && typeof cv !== "undefined") {
      // Usar OpenCV pero MANTENER LOS COLORES
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      
      // Leer la imagen del canvas (ya a color)
      let src = cv.imread(canvasElement);
      
      // *** NO CONVERTIR A ESCALA DE GRISES - MANTENER COLOR ***
      // En lugar de cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      // Solo mostramos la imagen original a color
      cv.imshow(canvasElement, src);
      
      // Liberar memoria
      src.delete();
    } else {
      // Fallback sin OpenCV - también a color
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }

    // Dibujar los landmarks de detección facial si hay rostros
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const lm = results.multiFaceLandmarks[0];

      // Dibujar malla facial con colores más visibles sobre video a color
      drawConnectors(canvasCtx, lm, FACEMESH_TESSELATION, { color: '#00FF0040', lineWidth: 1 });
      drawConnectors(canvasCtx, lm, FACEMESH_RIGHT_EYE, { color: '#FF0000', lineWidth: 2 });
      drawConnectors(canvasCtx, lm, FACEMESH_LEFT_EYE, { color: '#00FF00', lineWidth: 2 });
      drawConnectors(canvasCtx, lm, FACEMESH_LIPS, { color: '#FFD700', lineWidth: 2 });

      detectarEstados(lm);
    }
    
    canvasCtx.restore();
  }

  function detectarEstados(lm) {
    const distCeja = Math.abs(lm[159].y - lm[105].y);
    const anchoOjo = Math.abs(lm[33].x - lm[133].x);
    const ratioCeja = distCeja / anchoOjo;

    const distLabios = Math.abs(lm[13].y - lm[14].y);

    const earIzq = calcularEAR(lm, [33, 160, 158, 133, 144, 153]);
    const earDer = calcularEAR(lm, [362, 385, 387, 263, 373, 380]);
    const earInst = (earIzq + earDer) / 2;

    // Calibración
    if (frameCounter < framesParaCalibrar) {
      status.textContent = `Calibrando... Rostro neutral (${frameCounter}%)`;
      earBufferCalibracion.push(earInst);
      cejaBufferCalibracion.push(ratioCeja);
      return;
    } else if (frameCounter === framesParaCalibrar) {
      earAbiertoCalibrado = percentil(earBufferCalibracion, 95);
      umbralCierre   = earAbiertoCalibrado * FACTOR_CIERRE;
      umbralApertura = earAbiertoCalibrado * FACTOR_APERTURA;

      ratioCejaNeutralPromedio = calcularPromedio(cejaBufferCalibracion);
      status.textContent = 'Detección de Alta Precisión ✅';
      return;
    }

    // --- Parpadeo: transiciones 'cerrado' <-> 'abierto' ---
    earEma = (earEma === null) ? earInst : (EAR_EMA_ALPHA * earInst + (1 - EAR_EMA_ALPHA) * earEma);
    if (refractario > 0) refractario--;

    if (earEma < umbralCierre) {
      if (estadoParp === "abierto") {
        framesPorDebajo++;
        if (framesPorDebajo >= FRAMES_CERRADO && refractario === 0) {
          estadoParp = "cerrado";
          parpadeoCount++; parpadeoCounterEl.textContent = parpadeoCount;
          refractario = REFRACTARIO_FRAMES;
          enviarEvento("parpadeo", "cerrado");
        }
      }
    } else if (earEma > umbralApertura) {
      if (estadoParp === "cerrado") {
        estadoParp = "abierto";
        framesPorDebajo = 0;
        parpadeoCount++; parpadeoCounterEl.textContent = parpadeoCount;
        enviarEvento("parpadeo", "abierto");
      } else {
        framesPorDebajo = 0;
      }
    }

    // --- Cejas: 'arqueadas' / 'normal' ---
    const cejaArq = ratioCeja > ratioCejaNeutralPromedio * FACTOR_UMBRAL_CEJA ? "arqueadas" : "normal";
    if (cejaArq !== estadoCejas) {
      estadoCejas = cejaArq;
      cejaCount++; cejaCounterEl.textContent = cejaCount;
      enviarEvento("cejas", cejaArq);
    }

    // --- Boca: 'abierta' / 'cerrada' ---
    const bocaNow = distLabios > UMBRAL_BOCA_ABIERTA ? "abierta" : "cerrada";
    if (bocaNow !== estadoBoca) {
      estadoBoca = bocaNow;
      bocaCount++; bocaCounterEl.textContent = bocaCount;
      enviarEvento("boca", bocaNow);
    }
  }

  // ======= Helpers geométricos =======
  function calcularEAR(lm, idx) {
    const p1 = lm[idx[0]], p2 = lm[idx[1]], p3 = lm[idx[2]], p4 = lm[idx[3]], p5 = lm[idx[4]], p6 = lm[idx[5]];
    const d = (a, b) => Math.hypot(a.x - b.x, a.y - b.y);
    return (d(p2, p6) + d(p3, p5)) / (2 * d(p1, p4));
  }
  function calcularPromedio(arr){ return arr.length ? arr.reduce((a,b)=>a+b,0)/arr.length : 0; }
  function percentil(arr, p){
    if(!arr.length) return 0;
    const a=[...arr].sort((x,y)=>x-y), r=(p/100)*(a.length-1);
    const lo=Math.floor(r), hi=Math.ceil(r);
    return lo===hi ? a[lo] : a[lo] + (a[hi]-a[lo])*(r-lo);
  }

  // ======= API =======
  async function enviarEvento(tipo, estado) {
    if (!ENDPOINT_GESTOS) {
      // En GitHub Pages, solo mostrar en consola
      console.log(`🎭 Gesto detectado: ${tipo} - ${estado}`);
      return;
    }
    
    try {
      await fetch(ENDPOINT_GESTOS, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo_gesto: tipo, estado })
      });
    } catch (err) {
      console.error("Error guardando evento:", tipo, estado, err);
    }
  }

  // ======= Inicializar MediaPipe + Cámara =======
  // Inicialización principal
  async function initializeCamera() {
    try {
      // Verificar permisos primero
      await checkCameraPermissions();
      
      console.log("🚀 Iniciando FaceMesh...");
      status.textContent = "🚀 Iniciando detección facial...";

      const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      
      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      faceMesh.onResults(onResults);

      console.log("📹 Iniciando cámara...");
      status.textContent = "📹 Iniciando cámara...";

      const camera = new Camera(videoElement, {
        onFrame: async () => { 
          try {
            await faceMesh.send({ image: videoElement }); 
          } catch (error) {
            console.error("Error procesando frame:", error);
          }
        },
        width: 640, 
        height: 480,
        facingMode: 'user' // Cámara frontal
      });

      await camera.start();
      console.log("✅ Cámara inicializada exitosamente");
      status.textContent = "📹 Cámara activa - Detectando gestos...";
      status.style.color = "#9ad1ff";
      
    } catch (error) {
      handleCameraError(error);
    }
  }

  function handleCameraError(err) {
    console.error("❌ Error al inicializar la cámara:", err);
    
    let mensaje = "❌ Error de cámara: ";
    if (err.name === 'NotAllowedError' || err.message.includes('denegado')) {
      mensaje += "Permisos denegados. Haz clic en el 🔒 y permite la cámara.";
    } else if (err.name === 'NotFoundError') {
      mensaje += "No se encontró cámara. Verifica que esté conectada.";
    } else if (err.name === 'NotReadableError') {
      mensaje += "Cámara en uso por otra aplicación. Cierra otras apps de video.";
    } else if (err.name === 'NotSupportedError') {
      mensaje += "Navegador no soporta acceso a cámara. Usa Chrome/Firefox.";
    } else if (err.message.includes('navegador no soporta')) {
      mensaje += "Navegador no compatible. Usa Chrome, Firefox o Edge.";
    } else {
      mensaje += err.message || "Error desconocido.";
    }
    
    status.textContent = mensaje;
    status.style.color = "#ff6b6b";
    
    // Mostrar botón para reintentar
    const retryBtn = document.createElement('button');
    retryBtn.textContent = "🔄 Reintentar";
    retryBtn.style.marginLeft = "10px";
    retryBtn.style.padding = "5px 10px";
    retryBtn.style.backgroundColor = "#58a6ff";
    retryBtn.style.color = "white";
    retryBtn.style.border = "none";
    retryBtn.style.borderRadius = "4px";
    retryBtn.style.cursor = "pointer";
    
    retryBtn.onclick = () => {
      status.innerHTML = "🔄 Reiniciando...";
      setTimeout(() => location.reload(), 500);
    };
    
    status.appendChild(retryBtn);
  }

  // Iniciar la aplicación
  initializeCamera();
});
