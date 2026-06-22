import os

dir_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"
png_files = [
    "Potato Wedges.png",
    "Garlic Pops.png",
    "Onion Rings.png",
    "Smileys.png"
]

for filename in png_files:
    filepath = os.path.join(dir_path, filename)
    if os.path.exists(filepath):
        try:
            os.remove(filepath)
            print(f"Removed old PNG file: {filename}")
        except Exception as e:
            print(f"Error removing {filename}: {e}")
    else:
        print(f"File not found: {filename}")
