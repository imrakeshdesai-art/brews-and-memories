import os
from PIL import Image

filepath = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780639196238.jpg"
if os.path.exists(filepath):
    try:
        with Image.open(filepath) as img:
            print(f"Grid Image: {img.size} Mode: {img.mode}")
    except Exception as e:
        print(f"Error: {e}")
else:
    print("File not found")
