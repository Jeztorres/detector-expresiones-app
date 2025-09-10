import mysql.connector
from mysql.connector import Error


class Database:
    """Maneja la conexión a la base de datos usando mysql-connector."""

    def __init__(self, config):
        self.config = config

    def get_connection(self):
        try:
            return mysql.connector.connect(**self.config)
        except Error as e:
            print(f"Error al conectar a la base de datos: {e}")
            return None
