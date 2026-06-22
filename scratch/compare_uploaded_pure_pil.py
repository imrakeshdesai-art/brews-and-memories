import os
from PIL import Image

uploaded_path = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780596467599.jpg"
backup_dir = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items_backup"

if not os.path.exists(uploaded_path):
    print("Uploaded file not found")
    exit()

# Load uploaded image and convert to grayscale
up_img = Image.open(uploaded_path).convert('L').resize((100, 100))
up_pixels = list(up_img.getdata())

for filename in os.listdir(backup_dir):
    filepath = os.path.join(backup_dir, filename)
    try:
        with Image.open(filepath) as img:
            img_gray = img.convert('L').resize((100, 100))
            img_pixels = list(img_gray.getdata())
            diff = sum(abs(p1 - p2) for p1, p2 in zip(up_pixels, img_pixels)) / 10000.0
            print(f"{filename}: Diff score = {diff:.2f}")
    except Exception as e:
        print(f"Error reading {filename}: {e}")
