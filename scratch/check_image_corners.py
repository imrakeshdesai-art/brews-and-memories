import os
from PIL import Image

dir_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"
non_alpha = [
    "Cold Coffee.webp",
    "Blue Lagoon.png",
    "Butterscotch Mojito.png"
]

for filename in non_alpha:
    filepath = os.path.join(dir_path, filename)
    if os.path.exists(filepath):
        try:
            with Image.open(filepath) as img:
                # Get the colors of the corners
                w, h = img.size
                corners = [
                    img.getpixel((0, 0)),
                    img.getpixel((w - 1, 0)),
                    img.getpixel((0, h - 1)),
                    img.getpixel((w - 1, h - 1))
                ]
                print(f"{filename}: size {img.size}, Mode {img.mode}, Corners: {corners}")
        except Exception as e:
            print(f"{filename}: Error {e}")
    else:
        print(f"{filename}: Not found")
