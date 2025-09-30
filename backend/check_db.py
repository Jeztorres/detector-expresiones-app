import mysql.connector
import os
from dotenv import load_dotenv
load_dotenv()
conn = mysql.connector.connect(
    host=os.getenv('DB_HOST'),
    port=int(os.getenv('DB_PORT')),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    database=os.getenv('DB_NAME')
)
cursor = conn.cursor()
cursor.execute('SHOW TABLES;')
tables = cursor.fetchall()
print('Tablas en la BD:', tables)
for table in tables:
    table_name = table[0]
    cursor.execute(f'DESCRIBE {table_name};')
    columns = cursor.fetchall()
    print(f'Columnas de {table_name}:', columns)
cursor.close()
conn.close()

