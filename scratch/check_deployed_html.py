import urllib.request

url = "https://brews-and-memories.vercel.app/"
print(f"Fetching: {url}")
try:
    response = urllib.request.urlopen(url, timeout=15)
    html = response.read().decode('utf-8')
    if "Staff Login" in html:
        print("Success! Deployed page contains 'Staff Login'")
    else:
        print("Warning: Deployed page DOES NOT contain 'Staff Login' yet!")
        # Print a portion of the footer or HTML to see what's there
        print(html[-2000:])
except Exception as e:
    print(f"Error fetching page: {e}")
