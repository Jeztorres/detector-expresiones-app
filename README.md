# Detector de Expresiones - API

Esta API de ejemplo se ha reestructurado siguiendo reglas de negocio comunes para proyectos en entorno local:

1. **OOP**: la lógica de conexión y de negocio se encuentra encapsulada en clases (`Database` y `GestoModel`).
2. **Archivos separados**: cada responsabilidad vive en un archivo independiente dentro del paquete `app`.
3. **Arquitectura Modelo-Controlador**: los modelos se ubican en `app/models` y los controladores en `app/controllers`.
4. **Stored Procedures (SP)**: la API invoca SP definidos en la base de datos mediante `callproc`.
5. **Testing con Thunder Client**: puedes probar la API en VS Code instalando la extensión *Thunder Client* y enviando una solicitud `POST` a `http://localhost:5000/api/gestos` con un cuerpo JSON como:

   ```json
   {
     "tipo_gesto": "boca",
     "estado": "abierta"
   }
   ```

Inicia la API ejecutando:

```bash
python api.py
```
