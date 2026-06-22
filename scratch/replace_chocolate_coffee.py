import os
from PIL import Image

uploaded_path = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780596467599.jpg"
target_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items\Chocolate Cold Coffee.png"

if os.path.exists(uploaded_path):
    try:
        with Image.open(uploaded_path) as img:
            # Save it as PNG to replace the existing item image
            img.save(target_path, "PNG")
            print(f"Successfully replaced Chocolate Cold Coffee.png with uploaded image (dimensions: {img.size})")
    except Exception as e:
        print(f"Error converting and replacing image: {e}")
else:
    print("Uploaded image not found")
