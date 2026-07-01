from PIL import Image
import base64, io, re

im = Image.open(r"C:\Users\Walison\Desktop\new site\assets\logo.png").convert("RGBA")
im.thumbnail((96, 96), Image.LANCZOS)
buf = io.BytesIO()
im.save(buf, "PNG", optimize=True)
uri = "data:image/png;base64," + base64.b64encode(buf.getvalue()).decode()

p = r"C:\Users\Walison\Desktop\new site\index.html"
html = open(p, encoding="utf-8").read()

html, n1 = re.subn(
    r'(<img src=")data:image/png;base64,[^"]*(" alt="Almaz Store" class="brand-logo">)',
    lambda m: m.group(1) + uri + m.group(2), html)
html, n2 = re.subn(
    r'(<link rel="icon" type="image/png" href=")[^"]*(">)',
    lambda m: m.group(1) + uri + m.group(2), html)
html, n3 = re.subn(
    r'(<link rel="apple-touch-icon" href=")[^"]*(">)',
    lambda m: m.group(1) + uri + m.group(2), html)

open(p, "w", encoding="utf-8").write(html)
print("brand:", n1, "favicon:", n2, "apple:", n3, "uri_len:", len(uri))
