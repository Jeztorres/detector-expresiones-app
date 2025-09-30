// --- CONFIG API (endpoint del backend Flask) ---
const ENDPOINT_GESTOS = "https://jeztorres.github.io/detector-expresiones-app/api/gestos";

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
      const lm = results.multiFaceLandmarks[0];

      drawConnectors(canvasCtx, lm, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
      drawConnectors(canvasCtx, lm, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
      drawConnectors(canvasCtx, lm, FACEMESH_LEFT_EYE, { color: '#30FF30' });
      drawConnectors(canvasCtx, lm, FACEMESH_LIPS, { color: '#E0E0E0' });

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
        enviarEvento("parpadeo", "abierto");
      } else {
        framesPorDebajo = 0;
      }
    }

    // --- Cejas: 'arqueadas' / 'normal' ---
    const cejaArq = ratioCeja > ratioCejaNeutralPromedio * FACTOR_UMBRAL_CEJA ? "arqueadas" : "normal";
    if (cejaArq !== estadoCejas) {
      estadoCejas = cejaArq;
      if (cejaArq === "arqueadas") { cejaCount++; cejaCounterEl.textContent = cejaCount; }
      enviarEvento("cejas", cejaArq);
    }

    // --- Boca: 'abierta' / 'cerrada' ---
    const bocaNow = distLabios > UMBRAL_BOCA_ABIERTA ? "abierta" : "cerrada";
    if (bocaNow !== estadoBoca) {
      estadoBoca = bocaNow;
      if (bocaNow === "abierta") { bocaCount++; bocaCounterEl.textContent = bocaCount; }
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

  camera.start().then(() => {
    status.textContent = "Cámara inicializada ✅";
  }).catch(err => {
    console.error("No se pudo iniciar la cámara:", err);
    status.textContent = "Permite el acceso a la cámara en el navegador.";
    alert("Activa los permisos de cámara (candado en la barra de direcciones).");
  });
});
