from dataclasses import dataclass
from datetime import datetime
from typing import Literal

TipoGesto = Literal["parpadeo", "cejas", "boca"]

@dataclass
class Gesto:
    tipo: TipoGesto
    estado: str
    fecha: datetime
