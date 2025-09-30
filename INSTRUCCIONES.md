# 🎭 Detector de Expresiones Faciales - Instrucciones

## 📋 Configuración Rápida

### 1. **Configurar Base de Datos**

```bash
cd backend
# Edita config_database.py con tus datos de MySQL
python setup_with_config.py
```

### 2. **Ejecutar Servidor**

```bash
cd backend
python app_configurado.py
```

### 3. **Usar la Aplicación**

- **Local**: Abrir `index.html` en tu navegador
- **GitHub Pages**: https://jeztorres.github.io/detector-expresiones-app/

## 🔧 Configuración de Base de Datos

Edita `backend/config_database.py`:

```python
DATABASE_CONFIG = {
    'host': 'tu_host_mysql',        # Ej: 'localhost'
    'port': 3306,                   # Puerto de MySQL
    'user': 'tu_usuario',           # Tu usuario de MySQL
    'password': 'tu_password',       # Tu contraseña
    'database': 'tu_base_de_datos'  # Nombre de tu BD
}
```

## 📁 Archivos Importantes

- `index.html` - Aplicación principal
- `api/gestos.js` - API configurada para GitHub Pages
- `backend/app_configurado.py` - Servidor Flask
- `backend/config_database.py` - Configuración de BD
- `backend/setup_with_config.py` - Script de configuración

## 🚀 Comandos

```bash
# Configurar base de datos
cd backend
python setup_with_config.py

# Ejecutar servidor
python app_configurado.py

# Verificar API
curl http://localhost:5000/api/health
```

## 🌐 URLs

- **Frontend**: https://jeztorres.github.io/detector-expresiones-app/
- **Backend Local**: http://localhost:5000
- **API Health**: http://localhost:5000/api/health

¡Listo! Tu aplicación está configurada para funcionar tanto localmente como en GitHub Pages. 🎉
