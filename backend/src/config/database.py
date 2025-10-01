import mysql.connector
from mysql.connector import pooling
import os
from dotenv import load_dotenv
from pathlib import Path

# Construir la ruta al archivo .env que está en la raíz del proyecto
env_path = Path(__file__).resolve().parent.parent.parent.parent / '.env'
load_dotenv(dotenv_path=env_path)


POOL_SIZE = int(os.getenv('DB_POOL_SIZE', '5'))

class Database:
    _pool = None

    @classmethod
    def get_pool(cls):
        """
        Crea y devuelve un pool de conexiones a la base de datos.
        Si el pool ya existe, lo devuelve directamente.
        """
        if cls._pool is None:
            try:
                cls._pool = pooling.MySQLConnectionPool(
                    pool_name="gestos_pool",
                    pool_size=POOL_SIZE,
                    host=os.getenv('DB_HOST'),
                    port=int(os.getenv('DB_PORT', '3306')),
                    user=os.getenv('DB_USER'),
                    password=os.getenv('DB_PASSWORD'),
                    database=os.getenv('DB_NAME')
                )
                print("Pool de conexiones a MySQL creado exitosamente.")
            except mysql.connector.Error as err:
                print(f"Error al crear el pool de conexiones: {err}")
                raise err
        return cls._pool

    @classmethod
    def get_connection(cls):
        """
        Obtiene una conexión del pool.
        """
        pool = cls.get_pool()
        try:
            return pool.get_connection()
        except mysql.connector.Error as err:
            print(f"Error al obtener una conexión del pool: {err}")
            return None

# Bloque para probar la conexión al ejecutar este archivo directamente
if __name__ == '__main__':
    try:
        connection = Database.get_connection()
        if connection:
            print("Conexión a la base de datos obtenida exitosamente del pool.")
            connection.close()
            print("Conexión cerrada y devuelta al pool.")
        else:
            print("Falló la obtención de la conexión a la base de datos.")
    except Exception as e:
        print(f"Error durante la prueba de conexión: {e}")
