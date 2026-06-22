import os
from PIL import Image

dir_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"
cold_bevs = [
    "Chocolate Cold Coffee.png",
    "Hazelnut Cold Coffee.png",
    "Cold Coffee With Vanilla Ice Cream.png",
    "Mint Mojito.png",
    "Blue Lagoon.png",
    "Lemon Soda.png",
    "Butterscotch Mojito.png"
]

for filename in cold_bevs:
    filepath = os.path.join(dir_path, filename)
    if os.path.exists(filepath):
        try:
            with Image.open(filepath) as img:
                has_alpha = img.mode in ('RGBA', 'LA') or (img.mode == 'P' and 'transparency' in img.info)
                print(f"{filename}: Mode {img.mode}, Has alpha/transparency: {has_alpha}")
        except Exception as e:
            print(f"{filename}: Error {e}")
    else:
        print(f"{filename}: Not found")
