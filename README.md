# Proyecto API Gestos (MVC + SP)

Este paquete reestructura tu backend a MVC/OOP con repositorio y Stored Procedures.

## Estructura
```
api/controllers/gestos_controller.py  # rutas Flask
services/gesto_service.py             # reglas de negocio/validación
repositories/db.py                    # conexión a MySQL
repositories/gesto_repository.py      # llamadas a SP
models/gesto.py                       # dataclass Gesto
config/settings.py                    # configuración desde .env
app.py                                # arranque Flask
front/                                
```
Además se incluyen tus archivos de frontend originales en `front/`.

## Requisitos
```
python -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env  # y completa credenciales
python app.py
```
Health check: `GET http://localhost:5000/health`

### Endpoint principal
`POST /api/gestos`
```json
{
  "tipo_gesto": "parpadeo|cejas|boca",
  "estado": "según el tipo"
}
```
*201* → `{"mensaje":"Gesto registrado", "tipo":"...", "estado":"...", "fecha":"..."}`  
*400* → `{"error":"..."}` (validación)  
*500* → `{"error":"Error interno del servidor"}` (BD/falla)

### Stored Procedures esperados
- `sp_insertar_estado_parpadeo(estado VARCHAR)`
- `sp_insertar_estado_ceja(estado VARCHAR)`
- `sp_insertar_estado_boca(estado VARCHAR)`

## Thunder Client (VS Code)
Importa `tests/thunder_collection.json` y usa el environment `local`.

## Notas Frontend
En `front/index.html` y `front/app.js` se conservó tu lógica. Si quieres apuntar al backend local,
ajusta `API_BASE_URL` a `http://localhost:5000`.
