import fitz
import os

input_pdf = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'menu.pdf')
output_dir = os.path.join(os.path.dirname(__file__), '..', 'frontend', 'public', 'menu_pages')

os.makedirs(output_dir, exist_ok=True)
doc = fitz.open(input_pdf)
for i, page in enumerate(doc):
    pix = page.get_pixmap(dpi=150)
    out_path = os.path.join(output_dir, f'page_{i+1:02}.png')
    pix.save(out_path)
    print(out_path)
