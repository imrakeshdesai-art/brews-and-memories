import os
from PIL import Image

grid_path = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\media__1780639196238.jpg"
items_dir = r"c:\Users\rakes\OneDrive\Desktop\BrewsAndMemories\frontend\public\images\menu\items"

def blend_vertical_seam(main_img, pad_img, seam_y, blend_height=12):
    # Convert both to RGBA
    main_rgba = main_img.convert("RGBA")
    pad_rgba = pad_img.convert("RGBA")
    
    w = main_rgba.width
    main_h = main_rgba.height
    pad_h = pad_rgba.height
    
    out = Image.new("RGBA", (w, main_h + pad_h))
    out.paste(main_rgba, (0, 0))
    out.paste(pad_rgba, (0, main_h))
    
    start_y = main_h - blend_height // 2
    for y in range(blend_height):
        current_y = start_y + y
        alpha = 1.0 - (y / (blend_height - 1))
        
        for x in range(w):
            p1_y = min(current_y, main_h - 1)
            r1, g1, b1, a1 = main_rgba.getpixel((x, p1_y))
            
            p2_y = max(0, current_y - main_h)
            r2, g2, b2, a2 = pad_rgba.getpixel((x, p2_y))
            
            r = int(r1 * alpha + r2 * (1 - alpha))
            g = int(g1 * alpha + g2 * (1 - alpha))
            b = int(b1 * alpha + b2 * (1 - alpha))
            a = int(a1 * alpha + a2 * (1 - alpha))
            
            out.putpixel((x, current_y), (r, g, b, a))
            
    return out.convert("RGB")

try:
    grid = Image.open(grid_path)
    
    # 1. POTATO WEDGES
    wedges_main = grid.crop((343, 0, 680, 232))
    wedges_wood = grid.crop((343, 498, 680, 528))
    wedges_final = blend_vertical_seam(wedges_main, wedges_wood, 232, blend_height=10)
    wedges_final.save(os.path.join(items_dir, "Potato Wedges.webp"), "WEBP")
    print("Processed and saved Potato Wedges.webp")
    
    # 2. GARLIC POPS
    pops_main = grid.crop((684, 0, 1024, 232))
    pops_wood = grid.crop((684, 498, 1024, 528))
    pops_final = blend_vertical_seam(pops_main, pops_wood, 232, blend_height=10)
    pops_final.save(os.path.join(items_dir, "Garlic Pops.webp"), "WEBP")
    print("Processed and saved Garlic Pops.webp")
    
    # 3. SCHEZWAN FRIES
    schez_img = Image.open(os.path.join(items_dir, "Schezwan Fries.webp"))
    schez_cropped = schez_img.crop((0, 179, 2508, 1472))
    schez_resized = schez_cropped.resize((2048, 1056), Image.Resampling.LANCZOS)
    schez_resized.save(os.path.join(items_dir, "Schezwan Fries.webp"), "WEBP", quality=90)
    print("Processed and saved Schezwan Fries.webp")
    
except Exception as e:
    print("Error:", e)
