import urllib.request
import urllib.error
import socket

urls = [
    "https://brews-backend.onrender.com/api/health",
    "https://brews-memories-backend.onrender.com/api/health"
]

for url in urls:
    print(f"Testing URL: {url}")
    try:
        response = urllib.request.urlopen(url, timeout=70)
        code = response.getcode()
        body = response.read().decode('utf-8')
        print(f"Success! Status: {code}, Body: {body}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
    except urllib.error.URLError as e:
        print(f"URLError: {e.reason}")
    except socket.timeout:
        print("Timeout reached!")
    except Exception as e:
        print(f"Other error: {e}")
    print("-" * 50)
