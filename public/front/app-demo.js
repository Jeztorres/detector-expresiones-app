// --- VERSION DEMO - Sin backend, solo para GitHub Pages ---
const DEMO_MODE = true; // Modo demo para GitHub Pages

document.addEventListener("DOMContentLoaded", () => {
  const videoElement = document.getElementById('video');
  const canvasElement = document.getElementById('canvasOutput');
  const canvasCtx = canvasElement.getContext('2d');
  const status = document.getElementById('status');

  const cejaCounterEl = document.getElementById('ceja-counter');
  const bocaCounterEl = document.getElementById('boca-counter');
  const parpadeoCounterEl = document.getElementById('parpadeo-counter');

  let cejaCount = 0, bocaCount = 0, parpadeoCount = 0;

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

    // Dibujo base (OpenCV si está listo)
    if (typeof cvReady !== "undefined" && cvReady) {
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    } else {
      canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
    }

    if (results.multiFaceLandmarks) {
      for (const landmarks of results.multiFaceLandmarks) {
        // Dibujar landmarks faciales
        drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, {color: '#C0C0C070', lineWidth: 1});
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, {color: '#FF3030'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYEBROW, {color: '#FF3030'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, {color: '#30FF30'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYEBROW, {color: '#30FF30'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_FACE_OVAL, {color: '#E0E0E0'});
        drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, {color: '#E0E0E0'});

        // ===== DETECCIÓN DE PARPADEO =====
        const ear = calcularEAR(landmarks);
        if (frameCounter <= framesParaCalibrar) {
          earBufferCalibracion.push(ear);
          status.textContent = `Calibrando parpadeo... ${frameCounter}/${framesParaCalibrar}`;
          
          if (frameCounter === framesParaCalibrar) {
            earAbiertoCalibrado = percentil(earBufferCalibracion, 80);
            umbralCierre = earAbiertoCalibrado * FACTOR_CIERRE;
            umbralApertura = earAbiertoCalibrado * FACTOR_APERTURA;
            earEma = earAbiertoCalibrado;
            status.textContent = `Calibración completa. EAR calibrado: ${earAbiertoCalibrado.toFixed(3)}`;
          }
        } else {
          // Aplicar filtro EMA
          earEma = EAR_EMA_ALPHA * ear + (1 - EAR_EMA_ALPHA) * earEma;
          
          // Lógica de parpadeo
          if (refractario > 0) {
            refractario--;
          } else {
            if (estadoParp === "abierto" && earEma < umbralCierre) {
              framesPorDebajo++;
              if (framesPorDebajo >= FRAMES_CERRADO) {
                estadoParp = "cerrado";
                enviarEvento("parpadeo", "cerrado");
                parpadeoCount++;
                parpadeoCounterEl.textContent = parpadeoCount;
              }
            } else if (estadoParp === "cerrado" && earEma > umbralApertura) {
              estadoParp = "abierto";
              framesPorDebajo = 0;
              refractario = REFRACTARIO_FRAMES;
              enviarEvento("parpadeo", "abierto");
            } else if (earEma >= umbralCierre) {
              framesPorDebajo = 0;
            }
          }

          status.textContent = `EAR: ${earEma.toFixed(3)} | Estado: ${estadoParp}`;
        }

        // ===== DETECCIÓN DE CEJAS =====
        const ratioCeja = calcularRatioCeja(landmarks);
        if (frameCounter <= framesParaCalibrar) {
          cejaBufferCalibracion.push(ratioCeja);
          if (frameCounter === framesParaCalibrar) {
            ratioCejaNeutralPromedio = percentil(cejaBufferCalibracion, 50);
          }
        } else {
          const umbralCejaArqueada = ratioCejaNeutralPromedio * FACTOR_UMBRAL_CEJA;
          const nuevoEstadoCejas = ratioCeja > umbralCejaArqueada ? "arqueadas" : "normal";
          
          if (nuevoEstadoCejas !== estadoCejas) {
            estadoCejas = nuevoEstadoCejas;
            enviarEvento("cejas", estadoCejas);
            if (estadoCejas === "arqueadas") {
              cejaCount++;
              cejaCounterEl.textContent = cejaCount;
            }
          }
        }

        // ===== DETECCIÓN DE BOCA =====
        const ratioBoca = calcularRatioBoca(landmarks);
        const nuevoEstadoBoca = ratioBoca > UMBRAL_BOCA_ABIERTA ? "abierta" : "cerrada";
        
        if (nuevoEstadoBoca !== estadoBoca) {
          estadoBoca = nuevoEstadoBoca;
          enviarEvento("boca", estadoBoca);
          if (estadoBoca === "abierta") {
            bocaCount++;
            bocaCounterEl.textContent = bocaCount;
          }
        }
      }
    }

    canvasCtx.restore();
  }

  // ======= FUNCIONES DE CÁLCULO =======
  function calcularEAR(landmarks) {
    const ojo_izq = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246];
    const ojo_der = [362, 382, 381, 380, 374, 373, 390, 249, 263, 466, 388, 387, 386, 385, 384, 398];
    
    const ear_izq = calcularEAROjo(landmarks, ojo_izq);
    const ear_der = calcularEAROjo(landmarks, ojo_der);
    
    return (ear_izq + ear_der) / 2.0;
  }

  function calcularEAROjo(landmarks, indices) {
    const puntos = indices.map(i => [landmarks[i].x, landmarks[i].y]);
    
    // Puntos clave para EAR
    const p1 = puntos[1], p2 = puntos[5];  // extremos horizontales
    const p3 = puntos[2], p4 = puntos[4];  // puntos verticales superiores
    const p5 = puntos[3], p6 = puntos[3];  // puntos verticales inferiores (simplificado)
    
    const dist_vert1 = distancia(p3, p5);
    const dist_vert2 = distancia(p4, p6);
    const dist_horiz = distancia(p1, p2);
    
    return (dist_vert1 + dist_vert2) / (2.0 * dist_horiz);
  }

  function calcularRatioCeja(landmarks) {
    // Puntos de las cejas y ojos
    const ceja_izq = [70, 63, 105, 66, 107];
    const ojo_izq_sup = [159, 158, 157, 173, 133];
    
    const dist_ceja_ojo = ceja_izq.map((c, i) => 
      distancia([landmarks[c].x, landmarks[c].y], [landmarks[ojo_izq_sup[i]].x, landmarks[ojo_izq_sup[i]].y])
    ).reduce((a, b) => a + b) / ceja_izq.length;
    
    return dist_ceja_ojo;
  }

  function calcularRatioBoca(landmarks) {
    // Puntos de la boca
    const labio_sup = [13, 14, 15, 16, 17, 18];
    const labio_inf = [0, 1, 2, 3, 4, 5];
    const comisuras = [61, 291]; // esquinas de la boca
    
    const altura = labio_sup.map((s, i) => 
      distancia([landmarks[s].x, landmarks[s].y], [landmarks[labio_inf[i]].x, landmarks[labio_inf[i]].y])
    ).reduce((a, b) => a + b) / labio_sup.length;
    
    const anchura = distancia([landmarks[comisuras[0]].x, landmarks[comisuras[0]].y], 
                             [landmarks[comisuras[1]].x, landmarks[comisuras[1]].y]);
    
    return altura / anchura;
  }

  function distancia(p1, p2) {
    return Math.sqrt((p1[0] - p2[0]) ** 2 + (p1[1] - p2[1]) ** 2);
  }

  function percentil(arr, p) {
    if(!arr.length) return 0;
    const a=[...arr].sort((x,y)=>x-y), r=(p/100)*(a.length-1);
    const lo=Math.floor(r), hi=Math.ceil(r);
    return lo===hi ? a[lo] : a[lo] + (a[hi]-a[lo])*(r-lo);
  }

  // ======= API (MODO DEMO) =======
  async function enviarEvento(tipo, estado) {
    if (DEMO_MODE) {
      // En modo demo, solo mostrar en consola
      console.log(`📊 Gesto detectado: ${tipo} - ${estado}`);
      return;
    }
    
    // Código original para backend (no se ejecuta en modo demo)
    try {
      await fetch("http://127.0.0.1:5000/api/gestos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tipo_gesto: tipo, estado })
      });
    } catch (err) {
      console.error("Error guardando evento:", tipo, estado, err);
    }
  }

  // ======= Inicializar MediaPipe + Cámara =======
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
    onFrame: async () => {
      await faceMesh.send({image: videoElement});
    },
    width: 640,
    height: 480
  });
  camera.start();
});