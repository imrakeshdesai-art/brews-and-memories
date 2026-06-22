import urllib.request
import urllib.error

urls = [
    "https://brews-and-memories.vercel.app/",
    "https://brews-and-memories.vercel.app/admin",
    "https://brews-and-memories.vercel.app/menu"
]

for url in urls:
    print(f"Checking URL: {url}")
    try:
        response = urllib.request.urlopen(url, timeout=15)
        html = response.read().decode('utf-8')
        print(f"Status: {response.getcode()}")
        print(f"Title present: {'<title>' in html}")
        print(f"First 150 chars: {html[:150].strip()}")
    except urllib.error.HTTPError as e:
        print(f"HTTPError: {e.code} - {e.reason}")
    except Exception as e:
        print(f"Error: {e}")
    print("-" * 50)
