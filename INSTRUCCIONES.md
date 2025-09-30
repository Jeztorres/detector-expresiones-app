# 🎭 Detector de Expresiones Faciales - Instrucciones Actualizadas

## 📋 Configuración Rápida

### 1. **Configurar variables de entorno**

1. Copia el archivo `.env` de ejemplo (o edítalo directamente) con los datos de tu base de datos MySQL:
   ```bash
   cp .env .env.backup # opcional
   ```
2. Asegúrate de que `.env` contenga tus credenciales reales:
   ```env
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_USER=root
   DB_PASSWORD=Clave.Nueva_2025!
   DB_NAME=gestos_db
   PORT=5000
   DEBUG=true
   ```
3. Si despliegas el backend en otra URL, actualiza `app-config.js` para que `BACKEND_URL` apunte al dominio correcto.

### 2. **Instalar dependencias y ejecutar el backend**

```bash
cd backend
pip install -r requirements.txt
python app.py
```

### 3. **Usar la aplicación**

- **GitHub Pages / Producción**: [https://jeztorres.github.io/detector-expresiones-app/](https://jeztorres.github.io/detector-expresiones-app/)
- **Local**: abre `index.html` directamente o usa Live Server.

## 🔧 Configuración de Base de Datos

El backend utiliza el archivo `.env` para conectarse a MySQL mediante un pool de conexiones. No es necesario editar más archivos de configuración.

## 📁 Archivos Importantes

- `index.html` - Aplicación principal del frontend
- `app-config.js` - URL del backend para el frontend estático
- `api/gestos.js` - Cliente JavaScript para la API REST
- `backend/app.py` - Servidor Flask principal
- `backend/src/` - Código fuente organizado por capas (config, repositories, services)

## 🚀 Comandos Útiles

```bash
# Probar que la API está arriba
curl http://127.0.0.1:5000/api/health

# Verificar fecha del servidor
curl http://127.0.0.1:5000/debug/fecha
```

## 🌐 URLs

- **Frontend**: https://jeztorres.github.io/detector-expresiones-app/
- **Backend Local**: http://127.0.0.1:5000
- **API Health**: http://127.0.0.1:5000/api/health

¡Listo! Con el backend ejecutándose y `app-config.js` apuntando a la URL correcta, GitHub Pages leerá el historial, estadísticas y conteos directamente desde tu base de datos MySQL. 🎉
