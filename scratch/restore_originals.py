import os
import subprocess

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

for filename in cold_bevs:
    git_path = f"frontend/public/images/menu/items/{filename}"
    out_file = os.path.join(backup_path, filename)
    try:
        # Run git show HEAD~1:path to get the original file before our file-level crop
        # Wait, git commit 7271f85 is HEAD, 1a3f84e is HEAD~1
        cmd = ["git", "show", f"HEAD~1:{git_path}"]
        content = subprocess.check_output(cmd)
        with open(out_file, "wb") as f:
            f.write(content)
        print(f"Restored original to backup: {filename}")
    except Exception as e:
        print(f"Error restoring {filename}: {e}")
