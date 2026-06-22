import os
from PIL import Image

filepath = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780596467599.jpg"
if os.path.exists(filepath):
    try:
        with Image.open(filepath) as img:
            print(f"Uploaded Image: {img.size} (aspect ratio: {img.size[0]/img.size[1]:.2f})")
    except Exception as e:
        print(f"Error reading image: {e}")
else:
    print("File not found")
