import os
from PIL import Image

uploaded_path = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780596467599.jpg"
original_path = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items_backup\Chocolate Cold Coffee.png"

if not os.path.exists(uploaded_path) or not os.path.exists(original_path):
    print("Files not found")
    exit()

# Load and resize
up_img = Image.open(uploaded_path).convert('L')
orig_img = Image.open(original_path).convert('L')

# Let's find the best scaling factor and offset.
# We know width of uploaded is 940, original is 1086.
# If it's not scaled, then the scale factor is ~1.0 (940/1086 = 0.865).
# Let's resize the original to 100px width (height becomes 133px).
# The uploaded image resized to 100px width (height becomes 109px).
orig_small = orig_img.resize((100, 133))
up_small = up_img.resize((100, 109))

orig_pixels = list(orig_small.getdata())
up_pixels = list(up_small.getdata())

best_y = 0
min_diff = float('inf')

for y in range(0, 133 - 109 + 1):
    diff = 0
    for x in range(100):
        for dy in range(109):
            p_orig = orig_pixels[(y + dy) * 100 + x]
            p_up = up_pixels[dy * 100 + x]
            diff += abs(p_orig - p_up)
    if diff < min_diff:
        min_diff = diff
        best_y = y

print(f"Best matching starting y in small scale: {best_y}/133")
# Map back to original height of 1448
start_y = int((best_y / 133) * 1448)
end_y = int(((best_y + 109) / 133) * 1448)
print(f"Mapped crop box: y_start={start_y}, y_end={end_y} (height={end_y - start_y})")
print(f"Fraction of original: {start_y/1448:.2f} to {end_y/1448:.2f}")
