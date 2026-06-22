import os
import shutil
from PIL import Image

dir_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"
backup_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items_backup"

if not os.path.exists(backup_path):
    os.makedirs(backup_path)

cold_bevs = [
    "Cold Coffee.webp",
    "Chocolate Cold Coffee.png",
    "Hazelnut Cold Coffee.png",
    "Cold Coffee With Vanilla Ice Cream.png",
    "Mint Mojito.png",
    "Blue Lagoon.png",
    "Lemon Soda.png",
    "Butterscotch Mojito.png"
]

crop_percentage = 0.55 # Crop to show top 55% of height

for filename in cold_bevs:
    src_file = os.path.join(dir_path, filename)
    backup_file = os.path.join(backup_path, filename)
    
    if os.path.exists(src_file):
        # Back up first if not already backed up
        if not os.path.exists(backup_file):
            shutil.copy2(src_file, backup_file)
            print(f"Backed up: {filename}")
            
        try:
            with Image.open(backup_file) as img:
                w, h = img.size
                new_h = int(h * crop_percentage)
                # Crop box: (left, upper, right, lower)
                cropped_img = img.crop((0, 0, w, new_h))
                cropped_img.save(src_file)
                print(f"Cropped {filename}: {w}x{h} -> {w}x{new_h}")
        except Exception as e:
            print(f"Error cropping {filename}: {e}")
    else:
        print(f"File not found: {filename}")
