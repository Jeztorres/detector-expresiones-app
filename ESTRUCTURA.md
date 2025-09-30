# 📋 Estructura Organizada del Proyecto

## ✅ Archivos Principales (Raíz del Proyecto)

```
📁 detector-expresiones-app/
├── 🌐 index.html          ← ARCHIVO PRINCIPAL - Abrir este para usar la app
├── 📖 README.md           ← Documentación completa del proyecto
└── ⚙️ .env               ← Configuración de base de datos
```

## 🔧 Backend (API y Base de Datos)

```
📁 backend/
├── 🚀 app.py              ← Servidor Flask - Ejecutar para iniciar API
├── 📦 requirements.txt    ← Dependencias Python
├── 🧪 test_gestos.py     ← Tests unitarios
├── 📊 monitor_gestos.py  ← Monitor en tiempo real
└── 📁 src/               ← Código fuente MVC
    ├── api/controllers/  ← Controladores REST
    ├── config/          ← Configuraciones
    ├── models/          ← Modelos de datos
    ├── repositories/    ← Acceso a base de datos
    └── services/        ← Lógica de negocio
```

## 📦 Archivos de Desarrollo (src/)

```
📁 src/
├── 📁 api/client/       ← Cliente JavaScript para las APIs
├── 📁 assets/           ← Recursos estáticos (imágenes, etc.)
├── 📁 docs/             ← Documentación adicional
├── 📁 examples/         ← Ejemplos de código e integración
└── 📁 frontend-old/     ← Versiones anteriores del frontend
```

## 🚀 Cómo Ejecutar el Proyecto

### 1. Activar el Backend
```bash
cd backend
python app.py
```

### 2. Abrir Frontend
- Abrir `index.html` en el navegador
- O usar Live Server en VS Code

### 3. Configurar Base de Datos
- Editar el archivo `.env` en la raíz
- Configurar credenciales de MySQL

## 📊 APIs Disponibles

- **POST** `/api/gestos` - Guardar nuevo gesto
- **GET** `/api/gestos` - Obtener todos los gestos  
- **GET** `/api/estadisticas/gesto` - Estadísticas por fecha
- **GET** `/api/estadisticas/gesto/ultimos30` - Últimos 30 días
- **GET** `/health` - Estado del servidor
- **GET** `/debug/fecha` - Verificar sincronización de fechas

## 🎯 Ventajas de esta Estructura

✅ **Organizada** - Fácil de navegar y mantener
✅ **Escalable** - Separación clara entre frontend/backend/recursos  
✅ **Limpia** - Solo los archivos esenciales en la raíz
✅ **Profesional** - Estructura estándar de desarrollo
✅ **Funcional** - Todo sigue funcionando igual