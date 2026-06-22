import os
from PIL import Image

grid_path = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780639196238.jpg"
items_dir = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"

if not os.path.exists(items_dir):
    os.makedirs(items_dir)

try:
    with Image.open(grid_path) as img:
        print(f"Loaded grid image: {img.size}")
        
        # Crop coordinates (excluding the black dividing lines)
        # Column 0: 0 to 339, Column 1: 343 to 680, Column 2: 684 to 1024
        # Row 0: 0 to 262, Row 1: 266 to 528
        
        crops = {
            "Potato Wedges.webp": (343, 0, 680, 262),
            "Garlic Pops.webp": (684, 0, 1024, 262),
            "Onion Rings.webp": (343, 266, 680, 528),
            "Smileys.webp": (684, 266, 1024, 528)
        }
        
        for name, bbox in crops.items():
            cropped = img.crop(bbox)
            save_path = os.path.join(items_dir, name)
            cropped.save(save_path, "WEBP")
            print(f"Cropped and saved: {name} ({cropped.size})")
            
except Exception as e:
    print(f"Error cropping: {e}")
