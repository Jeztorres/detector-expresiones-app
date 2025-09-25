# 🎯 Detector de Expresiones Faciales

Una aplicación web moderna para la detección en tiempo real de gestos faciales usando **MediaPipe**, **Flask** y **MySQL**. 

![Python](https://img.shields.io/badge/Python-3.13-blue)
![Flask](https://img.shields.io/badge/Flask-3.0-green)
![MySQL](https://img.shields.io/badge/MySQL-8.0-orange)
![MediaPipe](https://img.shields.io/badge/MediaPipe-Latest-red)

## ✨ Características

- 🎥 **Detección en tiempo real** de gestos faciales
- 👁️ **Seguimiento de parpadeos** (abierto/cerrado)
- 🤨 **Detección de cejas** (arqueadas/normal)  
- 👄 **Monitoreo de boca** (abierta/cerrada)
- 📊 **Almacenamiento en base de datos** MySQL
- 🔄 **APIs REST** para integración
- 🌐 **Interfaz web moderna** y responsive

## 🚀 Demo en Vivo

[Ver Demo](https://jeztorres.github.io/detector-expresiones-app/)

## 📋 Instalación

```bash
# 1. Clonar repositorio
git clone https://github.com/Jeztorres/detector-expresiones-app.git
cd detector-expresiones-app

# 2. Instalar dependencias
pip install -r requirements.txt

# 3. Configurar variables de entorno
cp .env.example .env
# Editar .env con tus credenciales de MySQL

# 4. Ejecutar aplicación
python app.py
```

## 🏗️ Estructura del Proyecto

```
detector-expresiones-app/
├── src/                      # Backend (Flask)
│   ├── api/controllers/      # Controladores REST
│   ├── config/              # Configuración
│   ├── models/              # Modelos de datos
│   ├── repositories/        # Capa de datos
│   └── services/            # Lógica de negocio
├── public/                   # Frontend
│   ├── front/               # Assets (JS, CSS)
│   ├── index.html           # Página principal
│   └── demo.html            # Demo para GitHub Pages
├── docs/                    # Documentación y pruebas
├── app.py                   # Punto de entrada
└── requirements.txt         # Dependencias
```

## 📡 API Endpoints

- `POST /api/gestos` - Registrar gesto
- `GET /api/gestos` - Historial de gestos
- `GET /api/estadisticas/gesto` - Estadísticas por fecha

## 👨‍💻 Autor

**Jeztorres** - [@Jeztorres](https://github.com/Jeztorres)

---

⭐ ¡Dale una estrella si te resultó útil!