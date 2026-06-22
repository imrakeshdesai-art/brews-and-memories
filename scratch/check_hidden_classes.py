css_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\src\index.css"

with open(css_path, "r", encoding="utf-8") as f:
    content = f.read()

import re

# Find occurrences of menu-card-foot, btn-add, or similar in CSS selectors
matches = re.finditer(r"([^{}]+)\{([^{}]+)\}", content)
for m in matches:
    selector = m.group(1).strip()
    body = m.group(2).strip()
    if any(k in selector for k in ["menu-card-foot", "btn-add", "btn-add:hover"]):
        print(f"Selector: {selector}")
        print(f"Body:\n{body}")
        print("="*40)
