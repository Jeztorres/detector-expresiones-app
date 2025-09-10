from mysql.connector import Error


class GestoModel:
    """Encapsula las operaciones relacionadas con los gestos."""

    _PROCEDIMIENTOS = {
        'parpadeo': 'sp_insertar_estado_parpadeo',
        'cejas': 'sp_insertar_estado_ceja',
        'boca': 'sp_insertar_estado_boca'
    }

    def __init__(self, database):
        self.database = database

    def insertar_gesto(self, tipo_gesto, estado):
        if tipo_gesto not in self._PROCEDIMIENTOS:
            raise ValueError("Tipo de gesto no válido")

        conn = self.database.get_connection()
        if conn is None:
            raise Error("No se pudo conectar a la base de datos")

        try:
            cursor = conn.cursor()
            cursor.callproc(self._PROCEDIMIENTOS[tipo_gesto], (estado,))
            conn.commit()
        except Error:
            conn.rollback()
            raise
        finally:
            cursor.close()
            conn.close()
