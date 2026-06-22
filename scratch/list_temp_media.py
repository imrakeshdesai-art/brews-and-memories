import os

temp_dir = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb\.tempmediaStorage"
if os.path.exists(temp_dir):
    files = [os.path.join(temp_dir, f) for f in os.listdir(temp_dir)]
    files.sort(key=os.path.getmtime, reverse=True)
    for f in files[:5]:
        print(f"{os.path.basename(f)}: Modified at {os.path.getmtime(f)}, Size: {os.path.getsize(f)} bytes")
else:
    print("Directory not found")
