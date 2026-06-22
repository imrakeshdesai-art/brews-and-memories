import os
from PIL import Image

d = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"
peri_path = os.path.join(d, "Peri Peri Fries.png")
schez_path = os.path.join(d, "Schezwan Fries.webp")

def analyze_image(path):
    img = Image.open(path).convert("RGB")
    w, h = img.size
    
    # We want to find the plate. The plate is white/light cream.
    # Let's count light pixels (R > 180, G > 180, B > 170)
    # in each row and column to locate the plate center.
    x_hist = [0] * w
    y_hist = [0] * h
    
    for y in range(h):
        for x in range(w):
            r, g, b = img.getpixel((x, y))
            # Plate is bright and relatively desaturated
            if r > 190 and g > 190 and b > 180 and abs(r - g) < 20 and abs(g - b) < 20:
                x_hist[x] += 1
                y_hist[y] += 1
                
    # Find bounding box of the main peak (where density is high)
    threshold_x = max(x_hist) * 0.2
    threshold_y = max(y_hist) * 0.2
    
    x_indices = [i for i, val in enumerate(x_hist) if val > threshold_x]
    y_indices = [i for i, val in enumerate(y_hist) if val > threshold_y]
    
    if x_indices and y_indices:
        x_min, x_max = min(x_indices), max(x_indices)
        y_min, y_max = min(y_indices), max(y_indices)
        cx = (x_min + x_max) // 2
        cy = (y_min + y_max) // 2
        diameter_x = x_max - x_min
        diameter_y = y_max - y_min
        print(f"{os.path.basename(path)}:")
        print(f"  Dimensions: {w}x{h}")
        print(f"  Plate center: ({cx}, {cy})")
        print(f"  Plate size: {diameter_x}x{diameter_y}")
        return cx, cy, diameter_x, diameter_y, w, h
    else:
        print(f"{os.path.basename(path)}: Could not detect plate")
        return None

analyze_image(peri_path)
analyze_image(schez_path)
