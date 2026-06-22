import os

parent_dir = r"C:\Users\rakes\.gemini\antigravity\brain\1b868131-874c-483f-b200-b9a18d749cfb"
files = []
for root, dirs, filenames in os.walk(parent_dir):
    for f in filenames:
        filepath = os.path.join(root, f)
        files.append(filepath)

files.sort(key=os.path.getmtime, reverse=True)
for f in files[:10]:
    print(f"{os.path.relpath(f, parent_dir)}: Modified at {os.path.getmtime(f)}, Size: {os.path.getsize(f)} bytes")
