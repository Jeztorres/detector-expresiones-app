// Detector de gestos faciales usando MediaPipe
class GestureDetector {
  constructor() {
    this.faceMesh = null;
    this.camera = null;
    this.video = null;
    this.canvas = null;
    this.canvasCtx = null;
    
    // Estados anteriores para detectar transiciones
    this.previousStates = {
      parpadeo: null,
      cejas: null,
      boca: null
    };
    
    // Contadores para la UI
    this.counters = {
      parpadeo: 0,
      cejas: 0,
      cejasArqueadas: 0,    // Contador específico para arqueadas
      cejasNormales: 0,     // Contador específico para normales
      parpadeosCerrados: 0, // Contador específico para cerrados
      parpadeoAbiertos: 0,  // Contador específico para abiertos
      boca: 0,
      bocaAbierta: 0,       // Contador específico para abierta
      bocaCerrada: 0,       // Contador específico para cerrada
      parpadeoTotal: 0,
      cejaTotal: 0,
      bocaTotal: 0
    };
    
    // Filtros de estabilidad para evitar falsos positivos
    this.stateHistory = {
      parpadeo: [],
      cejas: [],
      boca: []
    };
    
    // Valores en tiempo real para calibración
    this.currentValues = {
      eyeHeight: 0,
      browDistance: 0,
      mouthRatio: 0
    };
    
    // NUEVO: Sistema de calibración facial
    this.faceCalibration = {
      isCalibrated: false,
      calibrationFrames: 0,
      requiredFrames: 30, // 30 frames para calibrar (1 segundo aprox)
      baseValues: {
        eyeDistance: 0,
        browDistance: 0,
        mouthDistance: 0,
        faceWidth: 0,
        faceHeight: 0
      },
      calibrationData: []
    };
    
    // Sistema de calibración automática
    this.calibration = {
      isCalibrating: true,
      calibrationFrames: 0,
      maxCalibrationFrames: 60, // 2 segundos a 30fps
      baselineValues: {
        eyeHeight: 0,
        browDistance: 0,
        mouthRatio: 0
      },
      samples: {
        eyeHeight: [],
        browDistance: [],
        mouthRatio: []
      }
    };
    
    // Configuración de umbrales OPTIMIZADOS para mejor sensibilidad
    this.thresholds = {
      blink: 0.35,         // Más permisivo para parpadeos reales humanos
      browRaise: 0.03,     // MUY sensible para detectar micro-movimientos de cejas
      mouthOpen: 1.8,      // Coincide con UI: relativo a la calibración base
      stabilityFrames: 2   // Frames de estabilidad para evitar falsos positivos
    };
    
    // Sistema de filtrado adicional para cejas
    this.browFilter = {
      consecutiveFrames: 0,
      requiredFrames: 12,  // Requiere 12 frames consecutivos de cejas arqueadas
      lastState: 'normales',
      minHoldTime: 500,    // Mínimo 500ms manteniendo la posición
      lastChangeTime: 0
    };
    
    this.isInitialized = false;
    this.showMesh = true; // Mostrar malla completa
  }

  async initialize() {
    try {
      console.log('🎥 Inicializando detector de gestos...');
      this.updateStatus('🔄 Inicializando cámara...');
      
      // Obtener elementos del DOM
      this.video = document.getElementById('video');
      this.canvas = document.getElementById('canvasOutput');
      this.canvasCtx = this.canvas.getContext('2d');
      
      if (!this.video || !this.canvas) {
        throw new Error('No se encontraron los elementos de video o canvas');
      }

      // Verificar soporte de cámara
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Tu navegador no soporta acceso a la cámara. Usa Chrome, Firefox o Edge.');
      }

      this.updateStatus('🔄 Solicitando permisos de cámara...');
      
      // Configurar cámara directamente sin MediaPipe Camera
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640, max: 1280 },
          height: { ideal: 480, max: 720 },
          facingMode: 'user'
        },
        audio: false
      });
      
      this.video.srcObject = stream;
      
      // Esperar a que el video esté listo
      await new Promise((resolve) => {
        this.video.onloadedmetadata = () => {
          this.video.play();
          resolve();
        };
      });
      
      this.updateStatus('🔄 Cargando MediaPipe...');
      
      // Esperar a que MediaPipe esté disponible
      await this.waitForMediaPipe();
      
      // Configurar Face Mesh
      this.faceMesh = new FaceMesh({
        locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
      });
      
      // Configuración optimizada de MediaPipe
      this.faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5
      });
      
      this.faceMesh.onResults(this.onResults.bind(this));
      
      this.updateStatus('🔄 Iniciando detección...');
      
      // Usar requestAnimationFrame en lugar de MediaPipe Camera
      this.startDetectionLoop();
      
      this.isInitialized = true;
      this.updateStatus('✅ Detector funcionando - Mueve tu cara frente a la cámara');
      console.log('✅ Detector de gestos inicializado correctamente');
      
    } catch (error) {
      console.error('❌ Error inicializando detector:', error);
      
      if (error.name === 'NotAllowedError') {
        this.updateStatus('❌ Permisos de cámara denegados. Permite el acceso y recarga la página.');
      } else if (error.name === 'NotFoundError') {
        this.updateStatus('❌ No se encontró cámara. Conecta una cámara y recarga.');
      } else if (error.name === 'NotSupportedError') {
        this.updateStatus('❌ Cámara no soportada. Usa HTTPS o localhost.');
      } else {
        this.updateStatus(`❌ Error: ${error.message}`);
      }
    }
  }

  startDetectionLoop() {
    const detectFrame = async () => {
      if (this.faceMesh && this.video.readyState === 4 && !this.video.paused) {
        try {
          await this.faceMesh.send({ image: this.video });
        } catch (error) {
          console.error('Error en detección:', error);
        }
      }
      
      if (this.isInitialized) {
        requestAnimationFrame(detectFrame);
      }
    };
    
    detectFrame();
  }

  async waitForMediaPipe() {
    return new Promise((resolve, reject) => {
      let attempts = 0;
      const maxAttempts = 100; // 10 segundos
      
      const checkMediaPipe = () => {
        attempts++;
        
        if (typeof FaceMesh !== 'undefined') {
          console.log('✅ MediaPipe FaceMesh cargado');
          resolve();
        } else if (attempts >= maxAttempts) {
          reject(new Error('MediaPipe no se cargó después de 10 segundos'));
        } else {
          setTimeout(checkMediaPipe, 100);
        }
      };
      
      checkMediaPipe();
    });
  }

  onResults(results) {
    if (!this.canvasCtx) return;
    
    // Debug para verificar que se detectan landmarks
    console.log(`🎯 LANDMARKS DETECTED: ${results.multiFaceLandmarks ? results.multiFaceLandmarks.length : 0} faces`);
    
    // Limpiar canvas
    this.canvasCtx.save();
    this.canvasCtx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.canvasCtx.drawImage(results.image, 0, 0, this.canvas.width, this.canvas.height);
    
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      const landmarks = results.multiFaceLandmarks[0];
      
      console.log(`🔍 CALLING DETECTIONS for face with ${landmarks.length} landmarks`);
      
      // Solo procesar si tenemos landmarks válidos
      if (landmarks && landmarks.length >= 468) {
        // NUEVO: Sistema de calibración
        if (!this.faceCalibration.isCalibrated) {
          this.calibrateFace(landmarks);
        } else {
          // Solo procesar gestos si está calibrado
          this.detectBlink(landmarks);
          this.detectEyebrowRaise(landmarks);
          this.detectMouthOpen(landmarks);
        }
        
        // Dibujar landmarks y métricas
        this.drawLandmarks(landmarks);
        this.drawMetrics();
        this.updateRealTimeMetrics();
      } else {
        console.log(`⚠️ LANDMARKS INSUFICIENTES: solo ${landmarks ? landmarks.length : 0} de 468 requeridos`);
      }
    } else {
      console.log(`⚠️ NO HAY ROSTROS DETECTADOS - saltando procesamiento de gestos`);
      // No procesar gestos cuando no hay rostros detectados
    }
    
    this.canvasCtx.restore();
  }



  // NUEVO: Sistema de calibración facial
  calibrateFace(landmarks) {
    const eyeDistance = this.calculateEyeValues(landmarks);
    const browDistance = this.calculateBrowValues(landmarks);
    const mouthDistance = this.calculateMouthValues(landmarks);
    
    // Calcular dimensiones de la cara
    const faceWidth = Math.abs(landmarks[454].x - landmarks[234].x); // Ancho de cara
    const faceHeight = Math.abs(landmarks[10].y - landmarks[152].y); // Alto de cara
    
    // Almacenar datos de calibración
    this.faceCalibration.calibrationData.push({
      eyeDistance,
      browDistance,
      mouthDistance,
      faceWidth,
      faceHeight
    });
    
    this.faceCalibration.calibrationFrames++;
    
    // Mostrar progreso de calibración
    const progress = (this.faceCalibration.calibrationFrames / this.faceCalibration.requiredFrames * 100).toFixed(0);
    console.log(`🎯 CALIBRANDO ROSTRO: ${progress}% (${this.faceCalibration.calibrationFrames}/${this.faceCalibration.requiredFrames})`);
    
    // Actualizar UI con progreso
    this.updateStatus(`Calibrando rostro... ${progress}%`);
    
    // Cuando tengamos suficientes frames, calcular valores base
    if (this.faceCalibration.calibrationFrames >= this.faceCalibration.requiredFrames) {
      this.finalizeFaceCalibration();
    }
  }
  
  finalizeFaceCalibration() {
    const data = this.faceCalibration.calibrationData;
    
    // Calcular promedios de los valores base
    this.faceCalibration.baseValues = {
      eyeDistance: data.reduce((sum, d) => sum + d.eyeDistance, 0) / data.length,
      browDistance: data.reduce((sum, d) => sum + d.browDistance, 0) / data.length,
      mouthDistance: data.reduce((sum, d) => sum + d.mouthDistance, 0) / data.length,
      faceWidth: data.reduce((sum, d) => sum + d.faceWidth, 0) / data.length,
      faceHeight: data.reduce((sum, d) => sum + d.faceHeight, 0) / data.length
    };
    
    this.faceCalibration.isCalibrated = true;
    
    console.log('✅ CALIBRACIÓN COMPLETADA:', this.faceCalibration.baseValues);
    console.log(`🔴 VALOR BASE CEJAS: ${this.faceCalibration.baseValues.browDistance.toFixed(4)}`);
    this.updateStatus('¡Calibración completada! Detector funcionando...');
    
    // Limpiar datos de calibración para ahorrar memoria
    this.faceCalibration.calibrationData = [];
  }

  calculateEyeValues(landmarks) {
    const leftEyeTop = landmarks[159];
    const leftEyeBottom = landmarks[145];
    const rightEyeTop = landmarks[386];
    const rightEyeBottom = landmarks[374];
    const leftEyeInner = landmarks[133];
    const leftEyeOuter = landmarks[33];
    const rightEyeInner = landmarks[362];
    const rightEyeOuter = landmarks[263];
    
    const leftEyeHeight = Math.abs(leftEyeTop.y - leftEyeBottom.y);
    const rightEyeHeight = Math.abs(rightEyeTop.y - rightEyeBottom.y);
    const leftEyeWidth = Math.abs(leftEyeOuter.x - leftEyeInner.x);
    const rightEyeWidth = Math.abs(rightEyeOuter.x - rightEyeInner.x);
    
    const leftEAR = leftEyeHeight / leftEyeWidth;
    const rightEAR = rightEyeHeight / rightEyeWidth;
    return (leftEAR + rightEAR) / 2;
  }

  calculateBrowValues(landmarks) {
    // Puntos clave de las cejas (los puntos rojos que se ven en la imagen)
    const leftBrowMiddle = landmarks[63];   // Ceja izquierda medio
    const rightBrowMiddle = landmarks[293]; // Ceja derecha medio
    
    // Obtener la posición Y actual de las cejas
    const currentBrowY = (leftBrowMiddle.y + rightBrowMiddle.y) / 2;
    
    console.log(`🔴 PUNTOS ROJOS - Posición Y actual: ${currentBrowY.toFixed(4)}`);
    
    return currentBrowY;
  }

  calculateMouthValues(landmarks) {
    const upperLipTop = landmarks[13];
    const upperLipMiddle = landmarks[12];
    const lowerLipBottom = landmarks[15];
    const lowerLipMiddle = landmarks[16];
    const leftCorner = landmarks[61];
    const rightCorner = landmarks[291];
    
    const mouthHeight1 = Math.abs(upperLipTop.y - lowerLipBottom.y);
    const mouthHeight2 = Math.abs(upperLipMiddle.y - lowerLipMiddle.y);
    const avgMouthHeight = (mouthHeight1 + mouthHeight2) / 2;
    const mouthWidth = Math.abs(leftCorner.x - rightCorner.x);
    
    return avgMouthHeight / mouthWidth;
  }



  detectBlink(landmarks) {
    const avgEAR = this.calculateEyeValues(landmarks);
    
    // Usar calibración para detección más precisa
    const baseEyeDistance = this.faceCalibration.baseValues.eyeDistance;
    const relativeRatio = avgEAR / baseEyeDistance;
    
    // Guardar valor actual para mostrar en UI
    this.currentValues.eyeHeight = avgEAR.toFixed(4);
    
    // Detección OPTIMIZADA para parpadeos humanos reales
    // Umbral más permisivo (0.35) para evitar falsos positivos por micro-movimientos
    const currentState = relativeRatio < this.thresholds.blink ? 'cerrado' : 'abierto';
    
    console.log(`👁️ BLINK OPTIMIZADO: eyeRatio=${avgEAR.toFixed(4)}, base=${baseEyeDistance.toFixed(4)}, relative=${relativeRatio.toFixed(4)}, threshold=${this.thresholds.blink}, state=${currentState}`);
    
    this.processStateChangeWithStability('parpadeo', currentState);
  }

  detectEyebrowRaise(landmarks) {
    const browHeight = this.calculateBrowValues(landmarks);
    
    // NUEVA LÓGICA SIMPLE: Si los puntos rojos se levantan = arqueadas
    // Usar calibración para obtener la altura base de las cejas
    const baseBrowHeight = this.faceCalibration.baseValues.browDistance;
    
    // Calcular diferencia: si es mayor que la base + umbral = arqueadas
    const heightDifference = browHeight - baseBrowHeight;
    
    // Guardar valor actual para mostrar en UI
    this.currentValues.browDistance = browHeight.toFixed(4);
    
    // LÓGICA CORREGIDA: En coordenadas Y, valores menores = más arriba
    // Si heightDifference es NEGATIVO (browHeight < baseBrowHeight) = cejas arqueadas
    // Umbral ULTRA sensible: 0.03 píxeles para detectar micro-movimientos
    const isRaised = heightDifference < -this.thresholds.browRaise;
    const currentTime = Date.now();
    
    console.log(`🔴 CEJAS: altura=${browHeight.toFixed(3)}, base=${baseBrowHeight.toFixed(3)}, diff=${heightDifference.toFixed(3)}, raised=${isRaised}`);
    
    // Sistema de filtrado simplificado
    if (isRaised) {
      this.browFilter.consecutiveFrames++;
    } else {
      this.browFilter.consecutiveFrames = 0;
    }
    
    // Cambiar estado con MENOS frames requeridos para ser MUY responsivo
    const hasEnoughFrames = this.browFilter.consecutiveFrames >= 1; // Solo 1 frame necesario!
    const hasEnoughTime = (currentTime - this.browFilter.lastChangeTime) > 100; // Solo 100ms entre cambios
    
    let finalState = this.browFilter.lastState;
    
    if (hasEnoughFrames && hasEnoughTime && this.browFilter.lastState === 'normales') {
      // Transición a arqueadas
      finalState = 'arqueadas';
      this.browFilter.lastChangeTime = currentTime;
      console.log(`✅ CEJAS ARQUEADAS CONFIRMADAS (diff: ${heightDifference.toFixed(3)})`);
    } else if (!isRaised && this.browFilter.lastState === 'arqueadas' && hasEnoughTime) {
      // Transición a normales
      finalState = 'normales';
      this.browFilter.lastChangeTime = currentTime;
      console.log(`✅ CEJAS NORMALES CONFIRMADAS`);
    }
    
    // Solo procesar si hay cambio de estado real
    if (finalState !== this.browFilter.lastState) {
      console.log(`🚨 CAMBIO DE ESTADO CEJAS: ${this.browFilter.lastState} → ${finalState}`);
      
      // Actualizar UI y guardar para AMBOS estados
      if (finalState === 'arqueadas') {
        // Incrementar contadores para arqueadas
        this.counters.cejas++;
        this.counters.cejasArqueadas++;
        this.counters.cejaTotal++;
        console.log(`📊 CONTADOR CEJAS ARQUEADAS: ${this.counters.cejasArqueadas}`);
        this.updateCounters();
      } else if (finalState === 'normales') {
        // Incrementar contadores para normales - CORREGIDO: ahora también cuenta transiciones
        this.counters.cejas++;
        this.counters.cejasNormales++;
        this.counters.cejaTotal++;
        console.log(`📊 CONTADOR CEJAS NORMALES: ${this.counters.cejasNormales}`);
        this.updateCounters();
      }
      
      // Actualizar status para AMBOS estados (arqueadas Y normales)
      this.updateLastStatus(`cejas: ${finalState}`);
      this.saveGestoToDatabase('cejas', finalState);
      
      this.browFilter.lastState = finalState;
    }
    
    // Actualizar estado anterior para compatibilidad
    this.previousStates.cejas = finalState;
  }

  detectMouthOpen(landmarks) {
    const mouthRatio = this.calculateMouthValues(landmarks);
    
    // Usar calibración para detección más precisa
    const baseMouthDistance = this.faceCalibration.baseValues.mouthDistance;
    const relativeRatio = mouthRatio / baseMouthDistance;
    
    // Guardar valor actual para mostrar en UI
    this.currentValues.mouthRatio = mouthRatio.toFixed(4);
    
    // Detección basada en ratio relativo a la calibración
    const currentState = relativeRatio > this.thresholds.mouthOpen ? 'abierta' : 'cerrada';
    
    console.log(`👄 MOUTH DEBUG: mouthRatio=${mouthRatio.toFixed(4)}, base=${baseMouthDistance.toFixed(4)}, relative=${relativeRatio.toFixed(4)}, state=${currentState}`);
    
    this.processStateChangeWithStability('boca', currentState);
  }

  processStateChangeWithStability(gestureType, currentState) {
    // Si stabilityFrames es 0, detección instantánea sin historial
    if (this.thresholds.stabilityFrames === 0) {
      const previousState = this.previousStates[gestureType];
      
      console.log(`🔍 STATE CHECK - ${gestureType}: previous="${previousState}" → current="${currentState}"`);
      
      if (previousState !== null && previousState !== currentState) {
        // Transición instantánea detectada
        console.log(`🔄 TRANSICIÓN INSTANTÁNEA - ${gestureType}: ${previousState} → ${currentState}`);
        
        // Debug del contador antes del incremento
        console.log(`📊 CONTADOR ANTES: ${gestureType} = ${this.counters[gestureType]}`);
        
        // Incrementar contadores específicos según el tipo de gesto y estado
        if (gestureType === 'parpadeo') {
          if (currentState === 'cerrado') {
            this.counters.parpadeosCerrados++;
            console.log(`📊 CONTADOR PARPADEOS CERRADOS: ${this.counters.parpadeosCerrados}`);
          } else if (currentState === 'abierto') {
            this.counters.parpadeoAbiertos++;
            console.log(`📊 CONTADOR PARPADEOS ABIERTOS: ${this.counters.parpadeoAbiertos}`);
          }
          this.counters.parpadeoTotal++;
        } else if (gestureType === 'boca') {
          if (currentState === 'abierta') {
            this.counters.bocaAbierta++;
            console.log(`📊 CONTADOR BOCA ABIERTA: ${this.counters.bocaAbierta}`);
          } else if (currentState === 'cerrada') {
            this.counters.bocaCerrada++;
            console.log(`📊 CONTADOR BOCA CERRADA: ${this.counters.bocaCerrada}`);
          }
          this.counters.bocaTotal++;
        }
        
        // SOLO incrementar si el gesto es válido y existe en counters
        if (this.counters.hasOwnProperty(gestureType)) {
          this.counters[gestureType]++;
          console.log(`✅ INCREMENTADO: ${gestureType} = ${this.counters[gestureType]}`);
        } else {
          console.log(`❌ ERROR: Contador '${gestureType}' no existe en:`, Object.keys(this.counters));
        }
        
        // Guardar en base de datos
        this.saveGestoToDatabase(gestureType, currentState);
        
        // Actualizar interfaz
        console.log(`🔄 ACTUALIZANDO INTERFAZ para ${gestureType}`);
        this.updateCounters();
        this.updateLastStatus(`${gestureType}: ${currentState}`);
      }
      
      // Actualizar estado anterior
      this.previousStates[gestureType] = currentState;
      return;
    }
    
    // Lógica original para cuando hay frames de estabilidad
    // Agregar estado actual al historial
    this.stateHistory[gestureType].push(currentState);
    
    // Mantener solo los últimos N frames
    if (this.stateHistory[gestureType].length > this.thresholds.stabilityFrames) {
      this.stateHistory[gestureType].shift();
    }
    
    // Verificar si todos los frames recientes tienen el mismo estado
    const recentFrames = this.stateHistory[gestureType];
    const isStable = recentFrames.length === this.thresholds.stabilityFrames && 
                     recentFrames.every(state => state === currentState);
    
    if (isStable) {
      const previousState = this.previousStates[gestureType];
      
      if (previousState !== null && previousState !== currentState) {
        // Hay una transición de estado estable
        console.log(`🔄 TRANSICIÓN DETECTADA - ${gestureType}: ${previousState} → ${currentState}`);
        
        // Incrementar contadores específicos según el tipo de gesto y estado
        if (gestureType === 'parpadeo') {
          if (currentState === 'cerrado') {
            this.counters.parpadeosCerrados++;
          } else if (currentState === 'abierto') {
            this.counters.parpadeoAbiertos++;
          }
          this.counters.parpadeoTotal++;
        } else if (gestureType === 'boca') {
          if (currentState === 'abierta') {
            this.counters.bocaAbierta++;
          } else if (currentState === 'cerrada') {
            this.counters.bocaCerrada++;
          }
          this.counters.bocaTotal++;
        }
        
        // Incrementar contadores generales
        this.counters[gestureType]++;
        this.counters[gestureType + 'Total']++;
        
        console.log(`📊 Contador ${gestureType}: ${this.counters[gestureType]} (Total: ${this.counters[gestureType + 'Total']})`);
        
        // Actualizar UI
        this.updateCounters();
        this.updateLastStatus(`${gestureType}: ${currentState}`);
        
        // Guardar en la base de datos
        this.saveGestoToDatabase(gestureType, currentState);
      }
      
      // Actualizar estado anterior solo cuando es estable
      this.previousStates[gestureType] = currentState;
    }
    
    // Actualizar métricas en tiempo real
    this.updateRealTimeMetrics();
  }

  async saveGestoToDatabase(gestureType, currentState) {
    try {
      const result = await GestosAPI.saveGesto(gestureType, currentState);
      if (result.error) {
        console.error('❌ Error guardando gesto:', result.error);
      } else {
        console.log('✅ Gesto guardado:', result.message);
      }
    } catch (error) {
      console.error('❌ Error al comunicarse con la API:', error);
    }
  }

  drawLandmarks(landmarks) {
    if (this.showMesh) {
      // Dibujar la malla facial completa como en la imagen
      this.drawFaceMesh(landmarks);
    }
    
    // Dibujar puntos clave específicos para calibración
    this.drawKeyPoints(landmarks);
    
    // Dibujar métricas en tiempo real
    this.drawMetrics();
  }

  drawFaceMesh(landmarks) {
    // Configurar estilo para la malla
    this.canvasCtx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    this.canvasCtx.lineWidth = 0.5;
    
    // Conexiones triangulares de la malla facial (como en la imagen)
    const connections = [
      // Contorno facial
      [10, 338, 297], [297, 332, 284], [284, 251, 389], [389, 356, 454],
      [454, 323, 361], [361, 288, 397], [397, 365, 379], [379, 378, 400],
      [400, 377, 152], [152, 148, 176], [176, 149, 150], [150, 136, 172],
      [172, 58, 132], [132, 93, 234], [234, 127, 162], [162, 21, 54],
      [54, 103, 67], [67, 109, 10],
      
      // Ojos
      [33, 7, 163], [163, 144, 145], [145, 153, 154], [154, 155, 133],
      [133, 173, 157], [157, 158, 159], [159, 160, 161], [161, 246, 33],
      [362, 398, 384], [384, 385, 386], [386, 387, 388], [388, 466, 263],
      [263, 249, 390], [390, 373, 374], [374, 380, 381], [381, 382, 362],
      
      // Cejas
      [46, 53, 52], [52, 65, 55], [55, 70, 63], [63, 105, 66], [66, 107, 46],
      [276, 283, 282], [282, 295, 285], [285, 300, 293], [293, 334, 296], [296, 336, 276],
      
      // Nariz
      [1, 2, 5], [5, 4, 6], [6, 19, 94], [94, 168, 195], [195, 197, 236],
      [236, 3, 51], [51, 48, 115], [115, 131, 134], [134, 102, 49], [49, 220, 305],
      
      // Boca
      [61, 84, 17], [17, 314, 405], [405, 320, 307], [307, 375, 321],
      [321, 308, 324], [324, 318, 12], [12, 15, 16], [16, 17, 18],
      [18, 200, 199], [199, 175, 0], [0, 269, 270], [270, 267, 271],
      [271, 272, 61]
    ];
    
    // Dibujar las conexiones triangulares
    connections.forEach(triangle => {
      if (triangle.length === 3) {
        const [a, b, c] = triangle;
        if (landmarks[a] && landmarks[b] && landmarks[c]) {
          this.canvasCtx.beginPath();
          this.canvasCtx.moveTo(
            landmarks[a].x * this.canvas.width,
            landmarks[a].y * this.canvas.height
          );
          this.canvasCtx.lineTo(
            landmarks[b].x * this.canvas.width,
            landmarks[b].y * this.canvas.height
          );
          this.canvasCtx.lineTo(
            landmarks[c].x * this.canvas.width,
            landmarks[c].y * this.canvas.height
          );
          this.canvasCtx.closePath();
          this.canvasCtx.stroke();
        }
      }
    });
    
    // Dibujar todos los 468 puntos
    this.canvasCtx.fillStyle = 'rgba(255, 255, 255, 0.8)';
    landmarks.forEach((point) => {
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        point.x * this.canvas.width,
        point.y * this.canvas.height,
        1, 0, 2 * Math.PI
      );
      this.canvasCtx.fill();
    });
  }

  drawKeyPoints(landmarks) {
    // Puntos de los ojos para parpadeo (azul brillante)
    this.canvasCtx.fillStyle = '#00ffff';
    const blinkPoints = [159, 145, 386, 374]; // Puntos superior e inferior de ambos ojos
    blinkPoints.forEach(index => {
      const point = landmarks[index];
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        point.x * this.canvas.width,
        point.y * this.canvas.height,
        4, 0, 2 * Math.PI
      );
      this.canvasCtx.fill();
    });
    
    // Puntos de las cejas para arqueamiento (rojo brillante)
    this.canvasCtx.fillStyle = '#ff0000';
    const browPoints = [70, 63, 105, 300, 293, 334]; // Puntos clave de cejas
    browPoints.forEach(index => {
      const point = landmarks[index];
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        point.x * this.canvas.width,
        point.y * this.canvas.height,
        4, 0, 2 * Math.PI
      );
      this.canvasCtx.fill();
    });
    
    // Puntos de la boca para apertura (verde brillante)
    this.canvasCtx.fillStyle = '#00ff00';
    const mouthPoints = [13, 14, 61, 291]; // Puntos superior, inferior y esquinas
    mouthPoints.forEach(index => {
      const point = landmarks[index];
      this.canvasCtx.beginPath();
      this.canvasCtx.arc(
        point.x * this.canvas.width,
        point.y * this.canvas.height,
        4, 0, 2 * Math.PI
      );
      this.canvasCtx.fill();
    });
  }

  drawMetrics() {
    // Método eliminado - sin información de debug en pantalla
  }

  updateRealTimeMetrics() {
    // Actualizar valores en tiempo real para cejas
    const browRealtimeEl = document.getElementById('brow-realtime');
    const browStatusEl = document.getElementById('brow-status');
    const browFramesEl = document.getElementById('brow-frames');
    const browThresholdEl = document.getElementById('brow-threshold-display');
    
    if (browRealtimeEl) browRealtimeEl.textContent = this.currentValues.browDistance || '0.00';
    if (browStatusEl) browStatusEl.textContent = this.browFilter.lastState || 'normales';
    if (browFramesEl) browFramesEl.textContent = this.browFilter.consecutiveFrames || '0';
    if (browThresholdEl) browThresholdEl.textContent = this.thresholds.browRaise.toFixed(1);
  }

  updateSliders() {
    // Actualizar valores de los sliders después de calibración
    const blinkSlider = document.getElementById('blink-threshold');
    const browSlider = document.getElementById('brow-threshold');
    const mouthSlider = document.getElementById('mouth-threshold');
    
    if (blinkSlider) {
      blinkSlider.value = this.thresholds.blink.toFixed(3);
      document.getElementById('blink-value').textContent = this.thresholds.blink.toFixed(3);
    }
    
    if (browSlider) {
      browSlider.value = this.thresholds.browRaise.toFixed(3);
      document.getElementById('brow-value').textContent = this.thresholds.browRaise.toFixed(3);
    }
    
    if (mouthSlider) {
      mouthSlider.value = this.thresholds.mouthOpen.toFixed(3);
      document.getElementById('mouth-value').textContent = this.thresholds.mouthOpen.toFixed(3);
    }
  }

  updateCounters() {
    console.log('🔢 Actualizando contadores:', this.counters);
    
    const parpadeoEl = document.getElementById('parpadeo-counter');
    const parpadeosCerradosEl = document.getElementById('parpadeos-cerrados-counter');
    const parpadeoAbiertosEl = document.getElementById('parpadeos-abiertos-counter');
    const parpadeoTotalEl = document.getElementById('parpadeo-total');
    const cejaEl = document.getElementById('ceja-counter');
    const cejasArqueadasEl = document.getElementById('cejas-arqueadas-counter');
    const cejasNormalesEl = document.getElementById('cejas-normales-counter');
    const cejaTotalEl = document.getElementById('ceja-total');
    const bocaEl = document.getElementById('boca-counter');
    const bocaAbiertaEl = document.getElementById('boca-abierta-counter');
    const bocaCerradaEl = document.getElementById('boca-cerrada-counter');
    const bocaTotalEl = document.getElementById('boca-total');
    
    // Debug de elementos encontrados
    console.log('🔍 Elementos DOM encontrados:', {
      parpadeoEl: !!parpadeoEl,
      parpadeosCerradosEl: !!parpadeosCerradosEl,
      parpadeoAbiertosEl: !!parpadeoAbiertosEl,
      cejaEl: !!cejaEl,
      cejasArqueadasEl: !!cejasArqueadasEl,
      cejasNormalesEl: !!cejasNormalesEl,
      bocaEl: !!bocaEl,
      bocaAbiertaEl: !!bocaAbiertaEl,
      bocaCerradaEl: !!bocaCerradaEl
    });
    
    if (parpadeoEl) parpadeoEl.textContent = this.counters.parpadeo;
    if (parpadeosCerradosEl) {
      parpadeosCerradosEl.textContent = this.counters.parpadeosCerrados;
      console.log(`✅ Actualizando contador parpadeos cerrados: ${this.counters.parpadeosCerrados}`);
    }
    if (parpadeoAbiertosEl) {
      parpadeoAbiertosEl.textContent = this.counters.parpadeoAbiertos;
      console.log(`✅ Actualizando contador parpadeos abiertos: ${this.counters.parpadeoAbiertos}`);
    }
    if (parpadeoTotalEl) parpadeoTotalEl.textContent = this.counters.parpadeoTotal;
    if (cejaEl) {
      cejaEl.textContent = this.counters.cejas;
      console.log(`✅ Actualizando contador cejas: ${this.counters.cejas}`);
    } else {
      console.log('❌ Elemento ceja-counter no encontrado');
    }
    if (cejasArqueadasEl) {
      cejasArqueadasEl.textContent = this.counters.cejasArqueadas;
      console.log(`✅ Actualizando contador cejas arqueadas: ${this.counters.cejasArqueadas}`);
    }
    if (cejasNormalesEl) {
      cejasNormalesEl.textContent = this.counters.cejasNormales;
      console.log(`✅ Actualizando contador cejas normales: ${this.counters.cejasNormales}`);
    }
    if (cejaTotalEl) cejaTotalEl.textContent = this.counters.cejaTotal;
    if (bocaEl) bocaEl.textContent = this.counters.boca;
    if (bocaAbiertaEl) {
      bocaAbiertaEl.textContent = this.counters.bocaAbierta;
      console.log(`✅ Actualizando contador boca abierta: ${this.counters.bocaAbierta}`);
    }
    if (bocaCerradaEl) {
      bocaCerradaEl.textContent = this.counters.bocaCerrada;
      console.log(`✅ Actualizando contador boca cerrada: ${this.counters.bocaCerrada}`);
    }
    if (bocaTotalEl) bocaTotalEl.textContent = this.counters.bocaTotal;
  }

  updateLastStatus(status) {
    document.getElementById('ultimo-status').textContent = status;
  }

  updateStatus(message) {
    const statusElement = document.getElementById('status');
    if (statusElement) {
      statusElement.textContent = message;
    }
  }
}

// Verificar si estamos en un contexto seguro
function isSecureContext() {
  return location.protocol === 'https:' || 
         location.hostname === 'localhost' || 
         location.hostname === '127.0.0.1' ||
         location.hostname.startsWith('192.168.') ||
         location.hostname.startsWith('10.') ||
         location.hostname.startsWith('172.');
}

// Inicializar detector cuando el DOM esté listo
let detector = null;

// Funciones globales para controlar la aplicación
window.initCameraManually = async function() {
  console.log('🎥 Inicializando cámara manualmente...');
  document.getElementById('init-camera-btn').style.display = 'none';
  
  try {
    if (!detector) {
      detector = new GestureDetector();
    }
    await detector.initialize();
  } catch (error) {
    console.error('❌ Error inicializando cámara manualmente:', error);
    document.getElementById('status').textContent = '❌ Error: ' + error.message;
    document.getElementById('init-camera-btn').style.display = 'block';
  }
};

window.updateThreshold = function(type, value) {
  if (!detector) return;
  
  const numValue = parseFloat(value);
  
  switch(type) {
    case 'blink':
      detector.thresholds.blink = numValue;
      document.getElementById('blink-value').textContent = numValue;
      break;
    case 'brow':
      detector.thresholds.browRaise = numValue;
      document.getElementById('brow-value').textContent = numValue;
      // Actualizar también el display en tiempo real
      const browThresholdEl = document.getElementById('brow-threshold-display');
      if (browThresholdEl) browThresholdEl.textContent = numValue;
      // Resetear el filtro cuando se cambia el umbral
      detector.browFilter.consecutiveFrames = 0;
      detector.browFilter.lastChangeTime = Date.now();
      console.log(`🎛️ Umbral cejas actualizado a: ${numValue} - Filtro reiniciado`);
      break;
    case 'mouth':
      detector.thresholds.mouthOpen = numValue;
      document.getElementById('mouth-value').textContent = numValue;
      break;
  }
  
  console.log(`🎛️ Umbral ${type} actualizado a: ${numValue}`);
};

window.toggleMesh = function() {
  if (!detector) return;
  
  detector.showMesh = !detector.showMesh;
  console.log(`🔄 Malla facial: ${detector.showMesh ? 'ON' : 'OFF'}`);
};

window.resetCounters = function() {
  if (!detector) return;
  
  // Resetear contadores
  detector.counters = {
    parpadeo: 0,
    parpadeosCerrados: 0,
    parpadeoAbiertos: 0,
    cejas: 0,
    cejasArqueadas: 0,
    cejasNormales: 0,
    boca: 0,
    bocaAbierta: 0,
    bocaCerrada: 0,
    parpadeoTotal: 0,
    cejaTotal: 0,
    bocaTotal: 0
  };
  
  // Resetear estados
  detector.previousStates = {
    parpadeo: null,
    cejas: null,
    boca: null
  };
  
  detector.updateCounters();
  console.log('🔄 Contadores reiniciados');
};

document.addEventListener('DOMContentLoaded', async () => {
  console.log('🚀 Inicializando aplicación de detección de gestos...');
  
  // Verificar contexto seguro
  if (!isSecureContext()) {
    console.warn('⚠️ Contexto no seguro detectado. La cámara puede no funcionar.');
    document.getElementById('status').textContent = '⚠️ Usa HTTPS o localhost para acceder a la cámara';
    document.getElementById('init-camera-btn').style.display = 'block';
    return;
  }
  
  // Esperar un poco para que se carguen todas las dependencias
  setTimeout(async () => {
    try {
      detector = new GestureDetector();
      await detector.initialize();
    } catch (error) {
      console.error('❌ Error fatal inicializando detector:', error);
      document.getElementById('status').textContent = '❌ Error. Haz clic en el botón para reintentar.';
      document.getElementById('init-camera-btn').style.display = 'block';
    }
  }, 3000); // Más tiempo para cargar MediaPipe
});