"""Convierte los guiones (contenido/*.yaml) en todo lo necesario para renderizar y publicar.

Por cada vídeo genera:
  video/public/audio/NN.wav      mezcla final (voz + música + efectos) a -14 LUFS
  video/src/data/NN.json         manifiesto con escenas, tiempos y subtítulos
  publicar/NN-slug/guion.md      guion legible con códigos de tiempo
  publicar/NN-slug/youtube.md    título, descripción con capítulos, etiquetas
  publicar/NN-slug/subtitulos.srt

Uso:
  python3 pipeline/producir.py                 # todos
  python3 pipeline/producir.py 01 03           # sólo algunos
  python3 pipeline/producir.py --motor elevenlabs --voz <voice_id>
"""
import argparse
import json
import re
import subprocess
import sys
from pathlib import Path

import numpy as np
import soundfile as sf
import yaml
from scipy import signal

sys.path.insert(0, str(Path(__file__).resolve().parent))
from audio_gen import SR, cama_musical, impacto, pop, whoosh  # noqa: E402
from pronunciacion import para_el_oido  # noqa: E402
from voz import crear_motor  # noqa: E402

RAIZ = Path(__file__).resolve().parent.parent
CONTENIDO = RAIZ / "contenido"
VIDEO = RAIZ / "video"
PUBLICAR = RAIZ / "publicar"
FPS = 30

CANAL = "Modo Leonida"
FECHA_DATOS = "15 de noviembre de 2026"

# Pausas (segundos)
ENTRADA = 0.30
ENTRE_FRASES = 0.30
SALIDA = 0.55
ENTRADA_INTRO = 0.55

LISTAS = {
    "bullets": "items", "table": "rows", "checklist": "items", "warning": "items",
    "timeline": "points", "cast": "people", "clocks": "clocks", "storage": "consoles",
    "character": "traits", "map": "regions", "compare": None,
}


def frames(seg: float) -> int:
    return int(round(seg * FPS))


def calcular_revelados(escena: dict, beats: list[int], duracion: int) -> list[int]:
    tipo = escena["type"]
    datos = escena.get("data", {})
    if tipo == "compare":
        n = 3 if datos.get("verdict") else 2
    elif tipo in LISTAS and LISTAS[tipo]:
        n = len(datos.get(LISTAS[tipo], []))
    else:
        return []
    if n == 0:
        return []
    if "reveal" in escena:
        idx = escena["reveal"]
        return [beats[min(i, len(beats) - 1)] for i in idx][:n] + [beats[-1]] * max(0, n - len(idx))
    L = len(beats)
    if n == L:
        return list(beats)
    if n == L - 1:
        return beats[1:]
    if n < L - 1:
        return [beats[1 + round(i * (L - 2) / max(n - 1, 1))] for i in range(n)]
    ini = beats[1] if L > 1 else 12
    fin = int(duracion * 0.72)
    return [int(ini + (fin - ini) * i / max(n - 1, 1)) for i in range(n)]


def trocear(texto: str, max_chars: int = 40) -> list[str]:
    palabras = texto.split()
    trozos, actual = [], ""
    for p in palabras:
        if actual and len(actual) + 1 + len(p) > max_chars:
            trozos.append(actual)
            actual = p
        else:
            actual = f"{actual} {p}".strip()
    if actual:
        trozos.append(actual)
    # Evita un último trozo de una sola palabra corta
    if len(trozos) > 1 and len(trozos[-1]) < 10:
        ultimo = trozos.pop()
        trozos[-1] = f"{trozos[-1]} {ultimo}"
    return trozos


def envolvente(voz: np.ndarray) -> np.ndarray:
    """Envolvente de la voz (0..1) con ataque rápido y liberación lenta, para el ducking."""
    hop = SR // 100
    n = len(voz) // hop + 1
    pad = np.zeros(n * hop)
    pad[: len(voz)] = np.abs(voz)
    rms = np.sqrt((pad.reshape(n, hop) ** 2).mean(axis=1))
    activo = (rms > 0.01).astype(float)
    sal = np.zeros(n)
    v = 0.0
    for i in range(n):
        objetivo = activo[i]
        coef = 0.35 if objetivo > v else 0.04
        v += (objetivo - v) * coef
        sal[i] = v
    return np.interp(np.arange(len(voz)) / hop, np.arange(n), sal)


def loudnorm(entrada: Path, salida: Path):
    filtro = "loudnorm=I=-14:TP=-1.5:LRA=11"
    medida = subprocess.run(
        ["ffmpeg", "-hide_banner", "-i", str(entrada), "-af", filtro + ":print_format=json", "-f", "null", "-"],
        capture_output=True, text=True,
    ).stderr
    m = json.loads(medida[medida.rindex("{"): medida.rindex("}") + 1])
    f2 = (f"{filtro}:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
          f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true")
    subprocess.run(["ffmpeg", "-loglevel", "error", "-y", "-i", str(entrada), "-af", f2, "-ar", str(SR),
                    "-c:a", "pcm_s16le", str(salida)], check=True)


def tc(frame: int, srt: bool = False) -> str:
    s = frame / FPS
    if srt:
        h, rem = divmod(s, 3600)
        m, sec = divmod(rem, 60)
        return f"{int(h):02d}:{int(m):02d}:{int(sec):02d},{int(round((sec % 1) * 1000)):03d}".replace(",1000", ",999")
    m, sec = divmod(int(s), 60)
    return f"{m}:{sec:02d}"


def formatear_datos(datos) -> list[str]:
    """Convierte los datos de pantalla en una lista Markdown legible."""
    out = []
    for k, v in datos.items():
        if isinstance(v, list):
            out.append(f"- **{k}:**")
            for it in v:
                if isinstance(it, list):
                    out.append("  - " + " | ".join(str(x) for x in it))
                elif isinstance(it, dict):
                    principal = it.get("text") or it.get("name") or it.get("label") or it.get("date") or it.get("id")
                    resto = [f"{kk}: {vv}" for kk, vv in it.items() if vv != principal and kk not in ("icon", "color", "initials", "id")]
                    out.append(f"  - {principal}" + (f" ({'; '.join(resto)})" if resto else ""))
                else:
                    out.append(f"  - {it}")
        elif isinstance(v, dict):
            out.append(f"- **{k}:** {v.get('title', '')}" + (f" · {v['price']}" if v.get('price') else ""))
            for it in v.get("items", []):
                out.append(f"  - {it}")
        else:
            out.append(f"- **{k}:** {v}")
    return out


def mezclar(vid, pistas_voz, escenas_out, n, total_seg):
    """Voz + música con ducking + efectos, normalizado a -14 LUFS."""
    voz = np.zeros(n, dtype=np.float32)
    for ini, a in pistas_voz:
        voz[ini: ini + len(a)] += a[: max(0, n - ini)]
    activos = voz[np.abs(voz) > 0.01]
    rms_voz = np.sqrt((activos ** 2).mean()) if len(activos) else 0.1
    voz *= 0.16 / rms_voz  # nivel de referencia, luego loudnorm ajusta el total

    # ---- Música con ducking
    musica = cama_musical(n / SR, semilla=int(vid))
    env = envolvente(voz)
    ganancia = (0.34 - 0.25 * env)[:, None]
    musica = musica[:n] * ganancia

    # ---- Efectos
    sfx = np.zeros((n, 2), dtype=np.float32)

    def poner(muestra, seg, gan):
        ini = max(0, int(seg * SR))
        fin = min(n, ini + len(muestra))
        sfx[ini:fin] += muestra[: fin - ini] * gan

    poner(impacto(), 0.0, 0.55)
    for k, e in enumerate(escenas_out[1:], 1):
        poner(whoosh(semilla=k), e["from"] / FPS - 0.28, 0.30)
    for e in escenas_out:
        for r in e["reveals"]:
            if r > 6:
                poner(pop(r), (e["from"] + r) / FPS, 0.22)

    mezcla = np.stack([voz, voz], axis=1) + musica + sfx
    mezcla = mezcla[: int(total_seg * SR)]
    tmp = VIDEO / "public" / "audio" / f"{vid}.raw.wav"
    tmp.parent.mkdir(parents=True, exist_ok=True)
    sf.write(tmp, mezcla / max(1.0, np.max(np.abs(mezcla))), SR, subtype="FLOAT")
    final = VIDEO / "public" / "audio" / f"{vid}.wav"
    loudnorm(tmp, final)
    tmp.unlink()


def producir(ruta: Path, tts, solo_textos: bool = False) -> dict:
    g = yaml.safe_load(ruta.read_text())
    vid = str(g["id"]).zfill(2)
    slug = g["slug"]
    print(f"\n▶ {vid} {slug}")

    escenas_out, subtitulos = [], []
    pistas_voz = []  # (inicio_muestras, audio48k)
    t = 0.0
    for i, esc in enumerate(g["scenes"]):
        lineas = esc["lines"]
        inicio = frames(t)
        cursor = t + (ENTRADA_INTRO if i == 0 else ENTRADA)
        beats = []
        for linea in lineas:
            audio = tts(para_el_oido(linea))
            audio48 = signal.resample_poly(audio, SR, tts.sr).astype(np.float32)
            dur = len(audio48) / SR
            beats.append(frames(cursor) - inicio)
            pistas_voz.append((int(cursor * SR), audio48))
            # Subtítulos: troceado proporcional a la longitud de cada trozo
            trozos = trocear(linea)
            total_chars = sum(len(x) for x in trozos)
            c0 = cursor
            for tz in trozos:
                d = dur * len(tz) / total_chars
                subtitulos.append({"from": frames(c0), "to": frames(c0 + d), "text": tz})
                c0 += d
            pausa = ENTRE_FRASES + (0.12 if linea.rstrip().endswith(("?", ":")) else 0)
            cursor += dur + pausa
        cursor = cursor - ENTRE_FRASES + SALIDA
        fin = frames(cursor)
        duracion = max(fin - inicio, frames(2.5))
        esc_out = {
            "type": esc["type"],
            "from": inicio,
            "duration": duracion,
            "beats": beats,
            "data": esc.get("data", {}),
            "chapter": esc.get("chapter"),
        }
        esc_out["reveals"] = calcular_revelados(esc, beats, duracion)
        escenas_out.append(esc_out)
        t = (inicio + duracion) / FPS

    total_frames = escenas_out[-1]["from"] + escenas_out[-1]["duration"]
    total_seg = total_frames / FPS
    n = int(total_seg * SR) + SR

    if not solo_textos:
        mezclar(vid, pistas_voz, escenas_out, n, total_seg)

    # ---- Capítulos (mínimo 10 s entre capítulos, el primero en 0:00)
    capitulos = []
    for e in escenas_out:
        nombre = e["chapter"] or ("Intro" if e["from"] == 0 else None)
        if not nombre:
            continue
        if capitulos and (e["from"] - capitulos[-1]["from"]) < 10 * FPS:
            continue
        capitulos.append({"from": e["from"], "title": nombre})
    capitulos[0]["from"] = 0

    manifiesto = {
        "id": vid, "slug": slug, "fps": FPS, "durationInFrames": total_frames,
        "audio": f"audio/{vid}.wav", "title": g["youtube"]["title"],
        "scenes": escenas_out, "captions": subtitulos, "chapters": capitulos,
        "thumbnail": g["thumbnail"],
    }
    datos = VIDEO / "src" / "data"
    datos.mkdir(parents=True, exist_ok=True)
    (datos / f"{vid}.json").write_text(json.dumps(manifiesto, ensure_ascii=False, indent=1))

    # ---- Material de publicación
    carpeta = PUBLICAR / f"{vid}-{slug}"
    carpeta.mkdir(parents=True, exist_ok=True)
    with open(carpeta / "subtitulos.srt", "w") as f:
        for k, s in enumerate(subtitulos, 1):
            f.write(f"{k}\n{tc(s['from'], True)} --> {tc(s['to'], True)}\n{s['text']}\n\n")

    yt = g["youtube"]
    caps = "\n".join(f"{tc(c['from'])} {c['title']}" for c in capitulos)
    hashtags = " ".join(yt.get("hashtags", ["#GTA6", "#GTAVI", "#GrandTheftAutoVI"]))
    descripcion = (
        f"{yt['description'].strip()}\n\n"
        f"⏱️ Capítulos\n{caps}\n\n"
        f"📌 Datos contrastados a {FECHA_DATOS} con fuentes públicas (Rockstar, tiendas y prensa especializada). "
        f"Si algo cambia, lo actualizamos en el comentario fijado.\n\n"
        f"🔔 Suscríbete a {CANAL}: guías de GTA 6 claras y sin rodeos.\n\n"
        f"Canal no oficial. No está afiliado a Rockstar Games ni a Take-Two Interactive. "
        f"Grand Theft Auto y GTA son marcas de sus respectivos propietarios. "
        f"Gráficos, música y narración (voz sintética) creados para este canal.\n\n"
        f"{hashtags}"
    )
    (carpeta / "youtube.md").write_text(
        f"# {vid} · {yt['title']}\n\n"
        f"**Duración:** {tc(total_frames)}  \n"
        f"**Archivo:** `{vid}-{slug}.mp4` · **Miniatura:** `miniatura.png` · **Subtítulos:** `subtitulos.srt`\n\n"
        f"## Título ({len(yt['title'])} caracteres)\n\n{yt['title']}\n\n"
        f"## Descripción\n\n```\n{descripcion}\n```\n\n"
        f"## Etiquetas\n\n```\n{', '.join(yt['tags'])}\n```\n\n"
        f"## Comentario fijado\n\n{yt.get('pinned', '¿Qué más quieres saber de GTA 6? Te leo en los comentarios 👇')}\n\n"
        f"## Ajustes recomendados\n\n"
        f"- Categoría: Videojuegos · Idioma: Español · Juego: Grand Theft Auto VI\n"
        f"- Contenido alterado o sintético: **No** (la voz es sintética pero no imita a ninguna persona real "
        f"ni muestra hechos realistas inventados; se indica en la descripción por transparencia)\n"
        f"- Pantalla final: suscribirse + vídeo recomendado: {yt.get('next', 'el más reciente')}\n"
    )

    lineas_md = [f"# Guion {vid} · {yt['title']}\n", f"Duración total: **{tc(total_frames)}**\n"]
    for k, e in enumerate(escenas_out):
        src = g["scenes"][k]
        cab = e["chapter"] or ("Intro" if k == 0 else e["type"])
        lineas_md.append(f"\n## [{tc(e['from'])}] {cab}  \n*Plano: `{e['type']}`*\n")
        lineas_md.append("**En pantalla:**\n")
        lineas_md.extend(formatear_datos(src.get("data", {})))
        lineas_md.append("")
        lineas_md.append("**Voz:**\n")
        for ln in src["lines"]:
            lineas_md.append(f"> {ln}  ")
    (carpeta / "guion.md").write_text("\n".join(lineas_md) + "\n")

    print(f"  {len(escenas_out)} escenas · {tc(total_frames)} · {len(subtitulos)} subtítulos")
    return manifiesto


def regenerar_indice():
    datos = VIDEO / "src" / "data"
    ids = sorted(p.stem for p in datos.glob("[0-9][0-9].json"))
    lineas = ["// Generado por pipeline/producir.py — no editar a mano", "import type {Manifest} from '../types';"]
    for i in ids:
        lineas.append(f"import m{i} from './{i}.json';")
    lineas.append(f"export const MANIFESTS = [{', '.join('m' + i for i in ids)}] as unknown as Manifest[];")
    (datos / "index.ts").write_text("\n".join(lineas) + "\n")


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("ids", nargs="*")
    ap.add_argument("--motor", default="kokoro", choices=["kokoro", "elevenlabs"])
    ap.add_argument("--voz", default=None)
    ap.add_argument("--velocidad", type=float, default=1.08)
    ap.add_argument("--solo-textos", action="store_true", help="regenera guion, YouTube y SRT sin tocar el audio")
    a = ap.parse_args()
    tts = crear_motor(a.motor, a.voz, a.velocidad)
    rutas = sorted(CONTENIDO.glob("*.yaml"))
    if a.ids:
        rutas = [r for r in rutas if r.name[:2] in {i.zfill(2) for i in a.ids}]
    for r in rutas:
        producir(r, tts, a.solo_textos)
    regenerar_indice()


if __name__ == "__main__":
    main()
