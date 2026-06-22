import os
from PIL import Image

dir_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"
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

for filename in cold_bevs:
    filepath = os.path.join(dir_path, filename)
    if os.path.exists(filepath):
        try:
            with Image.open(filepath) as img:
                print(f"{filename}: {img.size} (aspect ratio: {img.size[0]/img.size[1]:.2f})")
        except Exception as e:
            print(f"{filename}: Error {e}")
    else:
        print(f"{filename}: Not found")
