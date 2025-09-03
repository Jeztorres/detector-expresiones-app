// --- CÓDIGO PRINCIPAL DE LA APLICACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  // --- ELEMENTOS DEL DOM ---
  const videoElement = document.getElementById('video');
  const canvasElement = document.getElementById('canvasOutput');
  const canvasCtx = canvasElement.getContext('2d');
  const status = document.getElementById('status');

  // Contadores y UI
  const cejaCounterEl = document.getElementById('ceja-counter');
  const bocaCounterEl = document.getElementById('boca-counter');
  const parpadeoCounterEl = document.getElementById('parpadeo-counter');

  let cejaCount = 0, bocaCount = 0, parpadeoCount = 0;

  // --- API CONFIGURATION ---
  const API_BASE_URL = 'https://68b89984b71540504328aaf7.mockapi.io/api/v1/gestos';

  // --- ESTADOS Y CALIBRACIÓN ---
  let bocaAbiertaState = false;
  let cejaArqueadaState = false;

  let frameCounter = 0;
  const framesParaCalibrar = 100;

  const earBufferCalibracion = [];
  const cejaBufferCalibracion = [];

  let earAbiertoCalibrado = null;
  let ratioCejaNeutralPromedio = null;

  // Parpadeo (nuevos estados)
  let earEma = null;               // EAR suavizado (EMA)
  let framesPorDebajo = 0;         // frames consecutivos bajo umbral de cierre
  let refractario = 0;             // período refractario
  let parpadeoState = false;       // si está cerrado actualmente
  let umbralCierre = null;
  let umbralApertura = null;

  // --- PARÁMETROS DE SENSIBILIDAD ---
  const UMBRAL_BOCA_ABIERTA = 0.05;

  // Parpadeo – parámetros finos
  const EAR_EMA_ALPHA = 0.4;       // suavizado exponencial
  const FRAMES_CERRADO = 2;        // # frames mínimos para confirmar cierre
  const REFRACTARIO_FRAMES = 6;    // bloqueo tras contar un parpadeo
  const FACTOR_CIERRE = 0.78;      // umbral cierre = p95 * 0.78
  const FACTOR_APERTURA = 0.88;    // umbral apertura = p95 * 0.88 (histeresis)

  const FACTOR_UMBRAL_CEJA = 1.20;

  // --- CALLBACK DE MEDIAPIPE ---
  function onResults(results) {
    frameCounter++;
    canvasCtx.save();

    // Filtro BN con OpenCV si está listo
    if (typeof cvReady !== 'undefined' && cvReady) {
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
      let src = cv.imread(canvasElement);
      let gray = new cv.Mat();
      cv.cvtColor(src, gray, cv.COLOR_RGBA2GRAY, 0);
      cv.imshow(canvasElement, gray);
      src.delete(); gray.delete();
    } else {
      canvasCtx.clearRect(0, 0, canvasElement.width, canvasElement.height);
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }

    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];

      // Dibujo
      drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
      drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });
      drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0' });

      detectarExpresiones(landmarks);
    }
    canvasCtx.restore();
  }

  // --- DETECCIÓN ---
  function detectarExpresiones(landmarks) {
    // Métricas instantáneas (ceja y boca)
    const distCejaActual = Math.abs(landmarks[159].y - landmarks[105].y);
    const anchoOjo = Math.abs(landmarks[33].x - landmarks[133].x);
    const ratioCejaActual = distCejaActual / anchoOjo;
    const distLabiosActual = Math.abs(landmarks[13].y - landmarks[14].y);

    // EAR de ambos ojos
    const earIzq = calcularEAR(landmarks, [33, 160, 158, 133, 144, 153]);
    const earDer = calcularEAR(landmarks, [362, 385, 387, 263, 373, 380]);
    const earInst = (earIzq + earDer) / 2;

    // --- CALIBRACIÓN ---
    if (frameCounter < framesParaCalibrar) {
      status.textContent = `Calibrando... Rostro neutral (${frameCounter}%)`;
      earBufferCalibracion.push(earInst);
      cejaBufferCalibracion.push(ratioCejaActual);
      return;
    } else if (frameCounter === framesParaCalibrar) {
      // p95 para robustez
      earAbiertoCalibrado = percentil(earBufferCalibracion, 95);
      umbralCierre   = earAbiertoCalibrado * FACTOR_CIERRE;
      umbralApertura = earAbiertoCalibrado * FACTOR_APERTURA;

      ratioCejaNeutralPromedio = calcularPromedio(cejaBufferCalibracion);
      status.textContent = 'Detección de Alta Precisión ✅';
    } else {
      // --- PARPADEO: EMA + histeresis + consecutivos + refractario ---
      earEma = (earEma === null) ? earInst : (EAR_EMA_ALPHA * earInst + (1 - EAR_EMA_ALPHA) * earEma);
      if (refractario > 0) refractario--;

      if (earEma < umbralCierre) {
        framesPorDebajo++;
        if (!parpadeoState && framesPorDebajo >= FRAMES_CERRADO && refractario === 0) {
          parpadeoState = true;             // transita a cerrado
          parpadeoCount++;
          parpadeoCounterEl.textContent = parpadeoCount;
          refractario = REFRACTARIO_FRAMES;
          registrarEvento('parpadeo');      // ⬅ guarda al instante
        }
      } else if (earEma > umbralApertura) {
        parpadeoState = false;              // abierto confirmado
        framesPorDebajo = 0;
      }

      // --- CEJA ARQUEADA ---
      if (ratioCejaActual > ratioCejaNeutralPromedio * FACTOR_UMBRAL_CEJA) {
        if (!cejaArqueadaState) {
          cejaCount++;
          cejaCounterEl.textContent = cejaCount;
          cejaArqueadaState = true;
          registrarEvento('cejas');         // ⬅ guarda al instante
        }
      } else if (ratioCejaActual < ratioCejaNeutralPromedio * 1.05) {
        cejaArqueadaState = false;
      }

      // --- BOCA ABIERTA ---
      if (distLabiosActual > UMBRAL_BOCA_ABIERTA) {
        if (!bocaAbiertaState) {
          bocaCount++;
          bocaCounterEl.textContent = bocaCount;
          bocaAbiertaState = true;
          registrarEvento('boca');          // ⬅ guarda al instante
        }
      } else {
        bocaAbiertaState = false;
      }

      // --- HUD de diagnóstico ---
      if (umbralCierre && umbralApertura) {
        canvasCtx.font = "16px Arial";
        canvasCtx.fillStyle = "lime";
        canvasCtx.fillText(`EAR abierto p95: ${earAbiertoCalibrado.toFixed(3)}`, 10, 30);
        canvasCtx.fillText(`Umbral cierre:  ${umbralCierre.toFixed(3)}`, 10, 55);
        canvasCtx.fillText(`Umbral apertura:${umbralApertura.toFixed(3)}`, 10, 80);
        canvasCtx.fillText(`EAR (EMA):      ${earEma.toFixed(3)}`, 10, 105);
      }
    }
  }

  // --- FUNCIONES AUXILIARES ---
  function calcularPromedio(buffer) {
    if (buffer.length === 0) return 0;
    return buffer.reduce((a, b) => a + b, 0) / buffer.length;
  }

  function percentil(arr, p) {
    if (!arr.length) return 0;
    const a = [...arr].sort((x, y) => x - y);
    const rank = (p / 100) * (a.length - 1);
    const low = Math.floor(rank), high = Math.ceil(rank);
    if (low === high) return a[low];
    return a[low] + (a[high] - a[low]) * (rank - low);
  }

  function calcularEAR(landmarks, eyeIndices) {
    const p1 = landmarks[eyeIndices[0]]; const p2 = landmarks[eyeIndices[1]];
    const p3 = landmarks[eyeIndices[2]]; const p4 = landmarks[eyeIndices[3]];
    const p5 = landmarks[eyeIndices[4]]; const p6 = landmarks[eyeIndices[5]];
    const dist = (pA, pB) => Math.hypot(pA.x - pB.x, pA.y - pB.y);
    return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
  }

  // --- API ---
  function registrarEvento(evento) {
    // Guarda un snapshot con etiqueta de evento
    enviarContadoresAAPI(true, evento);
  }

  async function enviarContadoresAAPI(force = false, evento = null) {
    try {
      const total = parpadeoCount + cejaCount + bocaCount;
      if (!force && total === 0) return;

      const data = {
        parpadeo: parpadeoCount,
        cejas: cejaCount,
        boca: bocaCount,
        fecha_hora: new Date().toISOString(),
        ...(evento ? { evento } : {})
      };

      const response = await fetch(API_BASE_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (!response.ok) throw new Error(`Error HTTP: ${response.status}`);
      const result = await response.json();
      console.log('Contadores guardados:', result);
      return result;
    } catch (error) {
      console.error('Error al guardar contadores:', error);
    }
  }

  // --- ENVÍO PERIÓDICO DE RESPALDO ---
  setInterval(() => {
    if (parpadeoCount > 0 || cejaCount > 0 || bocaCount > 0) {
      enviarContadoresAAPI(false, null);
    }
  }, 60000); // cada 60s

  // --- INICIALIZACIÓN DE MEDIAPIPE Y CÁMARA ---
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

  const camera = new Camera(videoElement, {
    onFrame: async () => { await faceMesh.send({ image: videoElement }); },
    width: 640, height: 480
  });
  camera.start();
});
