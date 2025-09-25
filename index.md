---
layout: default
title: Detector de Expresiones Faciales
---

# 🎭 Detector de Expresiones Faciales

Sistema completo de detección de gestos faciales en tiempo real usando MediaPipe Face Mesh.

## 🚀 Características

- **Detección en tiempo real** de 3 tipos de gestos:
  - 👁️ **Parpadeos** (abierto/cerrado)
  - 🤨 **Cejas** (arqueadas/normal)
  - 😮 **Boca** (abierta/cerrada)

## 🛠️ Tecnologías

- **Frontend**: HTML5, JavaScript, MediaPipe Face Mesh
- **Backend**: Python Flask, MySQL
- **Detección**: Algoritmos EAR (Eye Aspect Ratio)
- **Arquitectura**: MVC + Repository + Service Layer

## 📱 Uso

1. **Permite acceso a la cámara** cuando te lo solicite
2. **Espera la calibración** (100 frames iniciales)
3. **Haz gestos** y observa la detección en tiempo real
4. **Los datos se guardan automáticamente** en la base de datos

## 🔧 Desarrollo

### Estructura del Proyecto
```
detector-expresiones-app/
├── index.html              # Frontend principal
├── backend/                 # Servidor Flask
│   ├── app.py              # Aplicación principal
│   ├── src/                # Código MVC
│   │   ├── api/controllers/ # Controladores REST
│   │   ├── config/         # Configuración
│   │   ├── models/         # Modelos de datos
│   │   ├── repositories/   # Acceso a BD
│   │   └── services/       # Lógica de negocio
│   ├── requirements.txt    # Dependencias
│   ├── test_gestos.py      # Scripts de prueba
│   └── monitor_gestos.py   # Monitoreo
├── frontend/               # Cliente web
│   └── public/front/       # Archivos estáticos
│       ├── app.js          # Lógica de detección
│       └── haarcascade_*.xml # Modelos OpenCV
└── README.md               # Documentación
```

## 🌐 Despliegue

- **GitHub Pages**: Frontend estático
- **Backend**: Servidor Flask en la nube
- **Base de Datos**: MySQL con Stored Procedures

---

**¡Sistema completo de detección de gestos faciales con arquitectura profesional!** 🎉
