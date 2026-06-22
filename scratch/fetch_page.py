import urllib.request
import re

url = "https://brews-and-memories.vercel.app"

try:
    with urllib.request.urlopen(url) as response:
        html = response.read().decode('utf-8')
    print(f"HTML Size: {len(html)} chars")
    
    # Print lines that look like main or hero
    for line in html.split('\n'):
        if "hero-" in line or "class=" in line:
            # truncate line to 200 chars for clean printing
            print(line[:250])
except Exception as e:
    print(f"Error: {e}")
