with open(r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\src\data\menuData.js", "r", encoding="utf-8") as f:
    content = f.read()

# Let's find the section for 'Maggi' and 'Burgers'
import re

# find 'Maggi' array block
maggi_match = re.search(r"'Maggi':\s*\[(.*?)\]", content, re.DOTALL)
if maggi_match:
    print("Maggi Category:")
    print(maggi_match.group(1).strip()[:500])

burgers_match = re.search(r"'Burgers':\s*\[(.*?)\]", content, re.DOTALL)
if burgers_match:
    print("Burgers Category:")
    print(burgers_match.group(1).strip()[:500])
