import urllib.request
import json
import urllib.error

url = 'http://localhost:5000/api/info'
data = {"url": "https://www.youtube.com/watch?v=jNQXAC9IVRw"}
headers = {'Content-Type': 'application/json'}

req = urllib.request.Request(url, data=json.dumps(data).encode('utf-8'), headers=headers)

try:
    with urllib.request.urlopen(req) as response:
        print("Status:", response.getcode())
        print("Response:", response.read().decode('utf-8'))
except urllib.error.URLError as e:
    print("Error:", e)
