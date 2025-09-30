# 🎭 Detector de Expresiones Faciales

Una aplicación web de inteligencia artificial que detecta gestos faciales en tiempo real usando MediaPipe.

## 🌐 **Demo en Vivo**
**👉 [Abrir Aplicación](https://jeztorres.github.io/detector-expresiones-app/)**

## ✨ **Características**
- 🎥 Detección facial en tiempo real con MediaPipe
- 👁️ Seguimiento preciso de parpadeos
- 🦅 Detección de movimiento de cejas  
- 👄 Análisis de apertura de boca
- 📊 Estadísticas y contadores en tiempo real
- 📱 Compatible con dispositivos móviles
- 🎨 Interfaz moderna y responsiva

## � **Uso**
1. Abre el [enlace de la aplicación](https://jeztorres.github.io/detector-expresiones-app/)
2. Permite el acceso a la cámara cuando se solicite
3. Espera la calibración automática (2-3 segundos)
4. ¡Comienza a hacer gestos faciales y ve las estadísticas en tiempo real!

## 🛠️ **Tecnologías**
- **MediaPipe Face Mesh** - Detección facial de Google
- **JavaScript ES6** - Lógica de la aplicación
- **HTML5 Canvas** - Renderizado de video
- **CSS3** - Interfaz moderna
- **WebRTC** - Acceso a cámara web

## 📁 **Estructura del Proyecto**

```
detector-expresiones-app/
├── index.html                  # 🌟 Aplicación principal
├── README.md                   # 📖 Este archivo
├── .env                        # Configuración de ambiente
├── backend/                    # 🔧 API REST en Flask
│   ├── app.py                  # Servidor principal
│   ├── requirements.txt        # Dependencias Python
│   ├── test_gestos.py         # Tests unitarios
│   ├── monitor_gestos.py      # Monitor en tiempo real
│   └── src/                   # Código fuente MVC
│       ├── api/controllers/   # Controladores REST
│       ├── config/           # Configuración
│       ├── models/           # Modelos de datos
│       ├── repositories/     # Acceso a base de datos
│       └── services/         # Lógica de negocio
└── src/                       # 📦 ARCHIVOS DE DESARROLLO
    ├── api/client/           # Cliente JavaScript API
    ├── assets/              # Recursos y archivos estáticos
    ├── docs/                # Documentación adicional
    ├── examples/            # Ejemplos de integración
    └── frontend-old/        # Versiones anteriores del frontend
├── frontend/               # Cliente web
│   └── public/front/       # Archivos estáticos
│       ├── app.js          # Lógica de detección
│       └── haarcascade_*.xml # Modelos OpenCV
└── README.md               # Documentación
```

## 🚀 Características

- **Detección en tiempo real** de 3 tipos de gestos:
  - 👁️ **Parpadeos** (abierto/cerrado)
  - 🤨 **Cejas** (arqueadas/normal)
  - 😮 **Boca** (abierta/cerrada)

- **Tecnologías**:
  - **Frontend**: HTML5, JavaScript, MediaPipe Face Mesh
  - **Backend**: Python Flask, MySQL
  - **Detección**: Algoritmos EAR (Eye Aspect Ratio)
  - **Arquitectura**: MVC + Repository + Service Layer

## 🛠️ Instalación y Uso

### 1. Configurar Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 2. Acceder al Frontend
Abre `index.html` en tu navegador o accede a:
- **Local**: http://localhost:5000
- **GitHub Pages**: https://jeztorres.github.io/detector-expresiones-app/

### 3. Monitorear Gestos (Opcional)
```bash
cd backend
python monitor_gestos.py
```

## 📊 API Endpoints

- **POST** `/api/gestos` - Registrar gesto
- **GET** `/api/gestos` - Obtener historial
- **GET** `/api/estadisticas/gesto` - Estadísticas por fecha
- **GET** `/health` - Health check

## 🗄️ Base de Datos

El sistema guarda automáticamente todos los gestos en MySQL:
- `parpadeos_hist` - Historial de parpadeos
- `cejas_hist` - Historial de cejas
- `boca_hist` - Historial de boca

## 🎯 Uso

1. **Permite acceso a la cámara** cuando te lo solicite
2. **Espera la calibración** (100 frames iniciales)
3. **Haz gestos** y observa la detección en tiempo real
4. **Los datos se guardan automáticamente** en la base de datos

## 🔧 Desarrollo

### Estructura MVC
- **Models**: Definición de entidades (`gesto.py`)
- **Views**: Frontend HTML/JS (`index.html`, `app.js`)
- **Controllers**: Endpoints REST (`gestos_controller.py`)
- **Services**: Lógica de negocio (`gesto_service.py`)
- **Repositories**: Acceso a datos (`gesto_repository.py`)

### Scripts Útiles
- `test_gestos.py` - Probar guardado de gestos
- `monitor_gestos.py` - Monitoreo en tiempo real
- `test_db.py` - Verificar conexión a BD

## 📈 Estadísticas

El sistema incluye análisis de:
- Conteo de gestos por tipo
- Historial temporal
- Estadísticas por fecha
- Monitoreo en tiempo real

## 🌐 Despliegue

- **GitHub Pages**: Frontend estático
- **Backend**: Servidor Flask local o en la nube
- **Base de Datos**: MySQL con Stored Procedures

---

**¡Sistema completo de detección de gestos faciales con arquitectura profesional!** 🎉