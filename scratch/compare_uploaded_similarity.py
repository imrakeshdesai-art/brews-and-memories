import os
import numpy as np
from PIL import Image

uploaded_path = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780596467599.jpg"
backup_dir = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items_backup"

if not os.path.exists(uploaded_path):
    print("Uploaded file not found")
    exit()

# Load uploaded image and convert to grayscale
up_img = Image.open(uploaded_path).convert('L')
up_w, up_h = up_img.size

for filename in os.listdir(backup_dir):
    filepath = os.path.join(backup_dir, filename)
    try:
        with Image.open(filepath) as img:
            img_gray = img.convert('L')
            w, h = img_gray.size
            print(f"Comparing with {filename} ({w}x{h})...")
            # If the uploaded image is a cropped version, it might be scaled.
            # Let's resize both to a small size and compare simple similarity
            img_resized = img_gray.resize((100, 100))
            up_resized = up_img.resize((100, 100))
            diff = np.mean(np.abs(np.array(img_resized, dtype=float) - np.array(up_resized, dtype=float)))
            print(f"  Similarity diff score: {diff:.2f}")
    except Exception as e:
        print(f"Error reading {filename}: {e}")
