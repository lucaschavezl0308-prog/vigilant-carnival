"""Rellena la tabla de vídeos del README a partir de los manifiestos generados."""
import json
import re
from pathlib import Path

RAIZ = Path(__file__).resolve().parent.parent
filas = ["| # | Título | Duración | Carpeta |", "|---|---|---|---|"]
for f in sorted((RAIZ / "video" / "src" / "data").glob("[0-9][0-9].json")):
    m = json.loads(f.read_text())
    seg = m["durationInFrames"] // m["fps"]
    carpeta = f"publicar/{m['id']}-{m['slug']}/"
    filas.append(f"| {m['id']} | {m['title']} | {seg // 60}:{seg % 60:02d} | [`{carpeta}`]({carpeta}) |")

readme = RAIZ / "README.md"
texto = readme.read_text()
tabla = "<!-- TABLA_VIDEOS -->\n" + "\n".join(filas) + "\n<!-- /TABLA_VIDEOS -->"
if "<!-- /TABLA_VIDEOS -->" in texto:
    texto = re.sub(r"<!-- TABLA_VIDEOS -->.*<!-- /TABLA_VIDEOS -->", tabla, texto, flags=re.S)
else:
    texto = texto.replace("<!-- TABLA_VIDEOS -->", tabla)
readme.write_text(texto)
print("\n".join(filas))
