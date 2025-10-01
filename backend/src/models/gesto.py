from dataclasses import dataclass
from datetime import datetime

@dataclass
class Gesto:
    """
    Representa un único gesto facial detectado.

    Atributos:
        id (int): El identificador único del gesto, generalmente de la base de datos.
        tipo_gesto (str): El tipo de gesto (e.g., 'parpadeo', 'cejas', 'boca').
        estado (str): El estado del gesto (e.g., 'cerrado', 'arqueadas', 'abierta').
        timestamp (datetime): La fecha y hora en que se registró el gesto.
    """
    id: int
    tipo_gesto: str
    estado: str
    timestamp: datetime
