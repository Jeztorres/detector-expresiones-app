# 🎭 Detector de Expresiones Faciales

Una aplicación web de inteligencia artificial que detecta gestos faciales en tiempo real usando MediaPipe.

## 🌐 **Demo en Vivo**

**👉 [Abrir Aplicación en GitHub Pages](https://jeztorres.github.io/detector-expresiones-app/)**

## ✨ **Características**

* 🎥 Detección facial en tiempo real con MediaPipe
* 👁️ Seguimiento preciso de parpadeos
* 🦅 Detección de movimiento de cejas
* 👄 Análisis de apertura de boca
* 📊 Estadísticas y contadores en tiempo real
* 📱 Compatible con dispositivos móviles
* 🎨 Interfaz moderna y responsiva
* 🌐 Funciona tanto localmente como en GitHub Pages

## 🛠️ **Tecnologías**

* **Frontend**: HTML5, JavaScript ES6, MediaPipe Face Mesh, CSS3
* **Backend**: Python Flask, MySQL
* **Detección**: Algoritmos EAR (Eye Aspect Ratio)
* **Arquitectura**: MVC + Repository + Service Layer

## 🚀 **Instalación y Uso**

### 1. Configurar Base de Datos

```bash
# 1. Editar configuración de base de datos
cd backend
# Edita config_database.py con tus datos de MySQL

# 2. Configurar base de datos
python setup_with_config.py

# 3. Ejecutar servidor
python app_configurado.py
```

### 2. Acceder a la Aplicación

* **GitHub Pages**: [https://jeztorres.github.io/detector-expresiones-app/](https://jeztorres.github.io/detector-expresiones-app/)
* **Local**: Abrir `index.html` en tu navegador

### 3. Configuración de Base de Datos

Edita `backend/config_database.py` con tus datos:

```python
DATABASE_CONFIG = {
    'host': 'tu_host_mysql',
    'port': 3306,
    'user': 'tu_usuario',
    'password': 'tu_password',
    'database': 'tu_base_de_datos'
}
```

## 📁 **Estructura del Proyecto**

```
detector-expresiones-app/
├── index.html                    # 🌟 Aplicación principal
├── api/
│   └── gestos.js                # API para GitHub Pages y localhost
├── backend/                     # 🔧 Backend Flask
│   ├── app_configurado.py      # Servidor configurado
│   ├── config_database.py      # Configuración de BD
│   ├── setup_with_config.py    # Script de configuración
│   └── src/                    # Código fuente MVC
│       ├── api/controllers/    # Controladores REST
│       ├── config/            # Configuración
│       ├── models/            # Modelos de datos
│       ├── repositories/      # Acceso a base de datos
│       └── services/          # Lógica de negocio
└── README_GITHUB.md           # Este archivo
```

## 📊 **API Endpoints**

* **POST** `/api/gestos` - Registrar gesto
* **GET** `/api/estadisticas/{tipo}` - Estadísticas por fecha
* **GET** `/api/estadisticas/{tipo}/ultimos30` - Últimos 30 días
* **GET** `/api/health` - Health check

## 🗄️ **Base de Datos**

El sistema guarda automáticamente todos los gestos en MySQL:

```sql
CREATE TABLE gestos (
    id INT AUTO_INCREMENT PRIMARY KEY,
    tipo_gesto VARCHAR(50) NOT NULL,
    estado VARCHAR(50) NOT NULL,
    fecha_hora TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    fecha DATE GENERATED ALWAYS AS (DATE(fecha_hora)) STORED
);
```

## 🎯 **Uso**

1. **Permite acceso a la cámara** cuando te lo solicite
2. **Espera la calibración** (100 frames iniciales)
3. **Haz gestos** y observa la detección en tiempo real
4. **Los datos se guardan automáticamente** en la base de datos

## 🔧 **Desarrollo**

### Comandos Útiles

```bash
# Configurar base de datos
cd backend
python setup_with_config.py

# Ejecutar servidor
python app_configurado.py

# Verificar API
curl http://localhost:5000/api/health
```

### Estructura MVC

* **Models**: Definición de entidades (`gesto.py`)
* **Views**: Frontend HTML/JS (`index.html`)
* **Controllers**: Endpoints REST (`gestos_controller.py`)
* **Services**: Lógica de negocio (`gesto_service.py`)
* **Repositories**: Acceso a datos (`gesto_repository.py`)

## 🌐 **Despliegue**

### GitHub Pages (Frontend)
- ✅ **Automático**: Se despliega automáticamente desde la rama `main`
- 🌐 **URL**: https://jeztorres.github.io/detector-expresiones-app/

### Backend (Heroku/Railway)
```bash
# Para Heroku
heroku create detector-expresiones-backend
git push heroku main

# Para Railway
# Conectar repositorio y desplegar automáticamente
```

## 📈 **Estadísticas**

El sistema incluye análisis de:

* Conteo de gestos por tipo
* Historial temporal
* Estadísticas por fecha
* Monitoreo en tiempo real

## 🔍 **Solución de Problemas**

### Error de Conexión a Base de Datos
```bash
# Verificar MySQL está ejecutándose
sudo service mysql start

# Verificar configuración
cat backend/config_database.py

# Probar conexión
python backend/setup_with_config.py
```

### Error de Cámara
1. **Permisos**: Permitir acceso a la cámara
2. **HTTPS**: GitHub Pages requiere HTTPS para cámara
3. **Navegador**: Usar Chrome/Firefox actualizado

## 📞 **Soporte**

Si tienes problemas:
1. Revisa los logs del navegador (F12)
2. Verifica que el backend esté ejecutándose
3. Comprueba la configuración de la base de datos
4. Asegúrate de que las URLs estén correctas

---

**¡Sistema completo de detección de gestos faciales con arquitectura profesional!** 🎉

## 📄 **Licencia**

Este proyecto está bajo la Licencia MIT. Ver el archivo `LICENSE` para más detalles.

## 👥 **Contribuciones**

Las contribuciones son bienvenidas. Por favor, abre un issue o pull request.

## 📧 **Contacto**

- **GitHub**: [@Jeztorres](https://github.com/Jeztorres)
- **Proyecto**: [detector-expresiones-app](https://github.com/Jeztorres/detector-expresiones-app)
