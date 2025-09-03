// --- ESTADO GLOBAL DE LAS LIBRERÍAS ---
let cvReady = false;
window.onOpenCvReady = () => {
    cvReady = true;
    document.getElementById('status').textContent = 'OpenCV listo. Cargando MediaPipe...';
};

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

    // --- ESTADOS ---
    let bocaAbiertaState = false;
    let cejaArqueadaState = false;
    let parpadeoState = false;

    // --- LÓGICA DE CALIBRACIÓN ---
    let frameCounter = 0;
    const framesParaCalibrar = 100;

    // Buffers para recolección de datos durante la calibración
    const earBufferCalibracion = [];
    const cejaBufferCalibracion = [];
    
    // Variables de calibración (valores aprendidos)
    let earAbiertoCalibrado = null;
    let umbralParpadeoDinamico = null;
    let ratioCejaNeutralPromedio = null;

    // --- PARÁMETROS DE SENSIBILIDAD ---
    const UMBRAL_BOCA_ABIERTA = 0.05;
    const FACTOR_UMBRAL_PARPADEO = 0.85; // MÁS SENSIBLE: El EAR solo necesita bajar un 15%
    const FACTOR_UMBRAL_CEJA = 1.20;

    // --- FUNCIÓN DE CALLBACK DE MEDIAPIPE ---
    function onResults(results) {
        frameCounter++;
        canvasCtx.save();
        
        if (cvReady) {
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
            
            drawConnectors(canvasCtx, landmarks, FACEMESH_TESSELATION, { color: '#C0C0C070', lineWidth: 1 });
            drawConnectors(canvasCtx, landmarks, FACEMESH_RIGHT_EYE, { color: '#FF3030' });
            drawConnectors(canvasCtx, landmarks, FACEMESH_LEFT_EYE, { color: '#30FF30' });
            drawConnectors(canvasCtx, landmarks, FACEMESH_LIPS, { color: '#E0E0E0' });

            detectarExpresiones(landmarks);
        }
        canvasCtx.restore();
    }

    // --- LÓGICA DE DETECCIÓN ---
    function detectarExpresiones(landmarks) {
        // --- 1. CALCULAR MÉTRICAS INSTANTÁNEAS ---
        const earActual = calcularEAR(landmarks, [33, 160, 158, 133, 144, 153]);
        const distCejaActual = Math.abs(landmarks[159].y - landmarks[105].y);
        const anchoOjo = Math.abs(landmarks[33].x - landmarks[133].x);
        const ratioCejaActual = distCejaActual / anchoOjo;
        const distLabiosActual = Math.abs(landmarks[13].y - landmarks[14].y);

        // --- 2. FASE DE CALIBRACIÓN ---
        if (frameCounter < framesParaCalibrar) {
            status.textContent = `Calibrando... Rostro neutral (${frameCounter}%)`;
            earBufferCalibracion.push(earActual);
            cejaBufferCalibracion.push(ratioCejaActual);
            return;
        } 
        
        // --- 3. FIN DE CALIBRACIÓN (SE EJECUTA UNA SOLA VEZ) ---
        else if (frameCounter === framesParaCalibrar) {
            earAbiertoCalibrado = Math.max(...earBufferCalibracion);
            umbralParpadeoDinamico = earAbiertoCalibrado * FACTOR_UMBRAL_PARPADEO;
            
            ratioCejaNeutralPromedio = calcularPromedio(cejaBufferCalibracion);
            status.textContent = 'Detección de Alta Precisión ✅';
        } 
        
        // --- 4. FASE DE DETECCIÓN ---
        else {
            // Detección de Parpadeo (usando el valor INSTANTÁNEO)
            if (earActual < umbralParpadeoDinamico) {
                if (!parpadeoState) {
                    parpadeoCount++;
                    parpadeoCounterEl.textContent = parpadeoCount;
                    parpadeoState = true;
                }
            } else {
                parpadeoState = false;
            }

            // Detección de Ceja Arqueada
            if (ratioCejaActual > ratioCejaNeutralPromedio * FACTOR_UMBRAL_CEJA) {
                if (!cejaArqueadaState) {
                    cejaCount++;
                    cejaCounterEl.textContent = cejaCount;
                    cejaArqueadaState = true;
                }
            } else if (ratioCejaActual < ratioCejaNeutralPromedio * 1.05) { 
                cejaArqueadaState = false;
            }

            // Detección de Boca Abierta (método con umbral fijo)
            if (distLabiosActual > UMBRAL_BOCA_ABIERTA) {
                if (!bocaAbiertaState) {
                    bocaCount++;
                    bocaCounterEl.textContent = bocaCount;
                    bocaAbiertaState = true;
                }
            } else {
                bocaAbiertaState = false;
            }

            // --- DIBUJAR DIAGNÓSTICO VISUAL PARA PARPADEO ---
            if (umbralParpadeoDinamico) {
                canvasCtx.font = "16px Arial";
                canvasCtx.fillStyle = "lime";
                canvasCtx.fillText(`EAR Calibrado: ${earAbiertoCalibrado.toFixed(3)}`, 10, 30);
                canvasCtx.fillText(`Umbral Parpadeo: ${umbralParpadeoDinamico.toFixed(3)}`, 10, 55);
                canvasCtx.fillText(`EAR Actual:      ${earActual.toFixed(3)}`, 10, 80);
            }
        }
    }

    // --- FUNCIONES AUXILIARES ---
    function calcularPromedio(buffer) {
        if (buffer.length === 0) return 0;
        return buffer.reduce((a, b) => a + b, 0) / buffer.length;
    }

    function calcularEAR(landmarks, eyeIndices) {
        const p1 = landmarks[eyeIndices[0]]; const p2 = landmarks[eyeIndices[1]];
        const p3 = landmarks[eyeIndices[2]]; const p4 = landmarks[eyeIndices[3]];
        const p5 = landmarks[eyeIndices[4]]; const p6 = landmarks[eyeIndices[5]];
        const dist = (pA, pB) => Math.hypot(pA.x - pB.x, pA.y - pB.y);
        return (dist(p2, p6) + dist(p3, p5)) / (2 * dist(p1, p4));
    }

    // --- INICIALIZACIÓN DE MEDIAPIPE Y CÁMARA ---
    const faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });
    faceMesh.setOptions({ maxNumFaces: 1, refineLandmarks: true, minDetectionConfidence: 0.5, minTrackingConfidence: 0.5 });
    faceMesh.onResults(onResults);

    const camera = new Camera(videoElement, {
        onFrame: async () => {
            await faceMesh.send({ image: videoElement });
        },
        width: 640, height: 480
    });
    camera.start();
});