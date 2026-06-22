import re

with open(r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\src\data\menuData.js", "r", encoding="utf-8") as f:
    content = f.read()

# Let's search for keys in the exported object
# The format is 'Category Name': [
matches = re.findall(r"'([^']+)':\s*\[", content)
print("Categories found in single quotes:")
print(matches)

matches_double = re.findall(r'"([^"]+)":\s*\[', content)
print("Categories found in double quotes:")
print(matches_double)
