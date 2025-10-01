# 🎭 Detector de Expresiones Faciales

Aplicación web que detecta parpadeos, cejas y boca en tiempo real usando MediaPipe Face Mesh. El frontend vive en GitHub Pages y se conecta a un backend Flask que guarda los datos en MySQL.

## ✨ Características

- 🎥 Detección facial en tiempo real desde el navegador
- 📊 Conteos por gesto, historial diario y estadísticas (hoy / 7 días / 30 días)
- 🗄️ Persistencia en MySQL utilizando stored procedures existentes
- 🌐 Frontend estático compatible con GitHub Pages
- 🔌 Backend Flask con pool de conexiones a MySQL

## 🚀 Requisitos

- Python 3.9+
- MySQL 8+
- Acceso a cámara web desde el navegador

## ⚙️ Configuración

1. **Variables de entorno**
   - Edita el archivo `.env` en la raíz con los datos de tu base MySQL. El repositorio ya incluye la configuración compartida:
     ```env
     DB_HOST=127.0.0.1
     DB_PORT=3306
     DB_USER=root
     DB_PASSWORD=Clave.Nueva_2025!
     DB_NAME=gestos_db
     PORT=5000
     DEBUG=true
     ```
   - Si despliegas el backend en otra URL, actualiza `app-config.js` para que `BACKEND_URL` apunte allí.

2. **Instalar dependencias del backend**
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. **Ejecutar el backend**
   ```bash
   python app.py
   ```
   Esto levantará la API en `http://127.0.0.1:5000` (configurable desde `.env`).

4. **Abrir el frontend**
   - **Producción**: https://jeztorres.github.io/detector-expresiones-app/
   - **Local**: abre `index.html` con Live Server o cualquier servidor estático.

## 🔗 Endpoints principales

| Método | Ruta | Descripción |
|--------|------|-------------|
| `POST` | `/api/gestos` | Guarda un evento de gesto (usa stored procedures para evitar duplicados). |
| `GET`  | `/api/estadisticas/<tipo>?fecha_inicio=YYYY-MM-DD&fecha_fin=YYYY-MM-DD` | Devuelve estadísticas por rango de fechas. |
| `GET`  | `/api/estadisticas/<tipo>/ultimos30` | Estadísticas de los últimos 30 días. |
| `GET`  | `/api/health` | Verifica que la API esté funcionando. |
| `GET`  | `/debug/fecha` | Devuelve fecha/hora del servidor para depuración de diferencias horario. |

## 🧩 Estructura

```
.
├── index.html          # Frontend principal
├── app-config.js       # URL del backend para el frontend
├── api/gestos.js       # Cliente JS que consume la API Flask
├── backend/
│   ├── app.py          # Servidor Flask
│   └── src/
│       ├── api/        # Controladores
│       ├── config/     # Conexión a base de datos
│       ├── repositories/ # Acceso a datos
│       └── services/   # Lógica de negocio
└── .env                # Configuración de base de datos y servidor
```

## 📈 Estadísticas & Historial

- **Hoy**: se consulta el rango `[fecha_actual, fecha_actual]`.
- **7 días**: rango `[hoy-6, hoy]`.
- **30 días**: se usan stored procedures especializados (`sp_resumen_*_ultimos_30`).
- **Historial diario**: el frontend agrupa la respuesta de `/api/estadisticas/<tipo>` por fecha.

## 🛠️ Notas de despliegue

- El frontend en GitHub Pages puede consumir un backend remoto siempre que `BACKEND_URL` use HTTPS o `http://127.0.0.1` (permitido por navegadores para localhost).
- Asegúrate de habilitar CORS en el backend (ya configurado con Flask-CORS).
- Mantén el backend y la base de datos encendidos para que las estadísticas se carguen correctamente.

## ✅ Verificaciones rápidas

```bash
# Estado del backend
curl http://127.0.0.1:5000/api/health

# Fecha/hora del servidor
curl http://127.0.0.1:5000/debug/fecha
```

¡Listo! Con el backend conectado a tu MySQL y el frontend apuntando a `BACKEND_URL`, tendrás el conteo, estadísticas y historial funcionando en tiempo real. 🎉
