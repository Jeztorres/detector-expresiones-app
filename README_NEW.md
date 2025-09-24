# 🎯 Detector de Expresiones Faciales

Una aplicación web moderna para la detección en tiempo real de gestos faciales usando **MediaPipe**, **Flask** y **MySQL**. Desarrollada con arquitectura MVC y tecnologías de inteligencia artificial.

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
- 📈 **Estadísticas históricas** por fechas
- 🌐 **Interfaz web moderna** y responsive

## 🚀 Demo en Vivo

Puedes ver la aplicación funcionando en: [https://jeztorres.github.io/detector-expresiones-app/](https://jeztorres.github.io/detector-expresiones-app/)

## 🛠️ Tecnologías Utilizadas

### Backend
- **Flask** - Framework web Python
- **MySQL** - Base de datos relacional
- **Flask-CORS** - Manejo de CORS

### Frontend  
- **JavaScript ES6** - Lógica del frontend
- **MediaPipe** - Detección de gestos faciales
- **Canvas API** - Renderizado de video
- **Fetch API** - Comunicación con backend

### IA y Visión Computacional
- **MediaPipe Face Mesh** - Detección de landmarks faciales
- **OpenCV.js** - Procesamiento de imágenes
- **Algoritmos de EAR** - Eye Aspect Ratio para parpadeos

## 📋 Requisitos

- Python 3.8+
- MySQL 8.0+
- Navegador web moderno con soporte para cámara
- Cámara web funcional

## ⚡ Instalación Rápida

### 1. Clonar el repositorio
```bash
git clone https://github.com/Jeztorres/detector-expresiones-app.git
cd detector-expresiones-app
```

### 2. Instalar dependencias
```bash
pip install -r requirements.txt
```

### 3. Configurar base de datos
```bash
# Crear base de datos MySQL y ejecutar el schema SQL
# Ver archivo database_schema.sql
```

### 4. Configurar variables de entorno
```bash
# Copiar y editar archivo de configuración
cp .env.example .env
# Editar .env con tus credenciales de MySQL
```

### 5. Ejecutar la aplicación
```bash
python app.py
```

### 6. Abrir en navegador
```
http://localhost:5000
```

## 🔧 Configuración

### Variables de Entorno (.env)
```env
# Aplicación
APP_HOST=127.0.0.1
APP_PORT=5000
DEBUG=true

# Base de datos MySQL
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=tu_password
DB_NAME=gestos_db
```

## 📡 API Endpoints

### Gestos
- `POST /api/gestos` - Registrar nuevo gesto
- `GET /api/gestos` - Obtener historial de gestos

### Estadísticas
- `GET /api/estadisticas/gesto?tipo=boca&desde=2024-01-01&hasta=2024-12-31`
- `GET /api/estadisticas/gesto/ultimos30?tipo=parpadeo`

### Ejemplo de uso
```bash
# Registrar gesto
curl -X POST http://localhost:5000/api/gestos \
  -H "Content-Type: application/json" \
  -d '{"tipo_gesto": "boca", "estado": "abierta"}'

# Obtener historial
curl http://localhost:5000/api/gestos
```

## 🏗️ Arquitectura del Proyecto

```
detector-expresiones-app/
├── api/
│   └── controllers/           # Controladores REST
├── config/                    # Configuración
├── front/                     # Frontend (JS, CSS)
├── models/                    # Modelos de datos
├── repositories/              # Capa de datos
├── services/                  # Lógica de negocio
├── tests/                     # Pruebas
├── index.html                 # Página principal
├── app.py                     # Punto de entrada
├── requirements.txt           # Dependencias Python
└── README.md                  # Este archivo
```

## 🤝 Contribuir

1. Fork el proyecto
2. Crea tu rama de feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📄 Licencia

Este proyecto está bajo la Licencia MIT.

## 👨‍💻 Autor

**Jeztorres**
- GitHub: [@Jeztorres](https://github.com/Jeztorres)

---

⭐ ¡No olvides dar una estrella al proyecto si te resultó útil!