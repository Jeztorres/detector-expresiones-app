import requests
import json

url = 'http://127.0.0.1:5000/api/gestos'
data = {
    'tipo_gesto': 'parpadeo',
    'estado': 'cerrado'
}

response = requests.post(url, json=data)
print('Status Code:', response.status_code)
print('Response:', response.json())