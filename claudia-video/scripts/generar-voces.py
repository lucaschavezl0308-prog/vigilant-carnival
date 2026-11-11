"""Genera las voces de todos los episodios con edge-tts.

Uso:  python scripts/generar-voces.py [ep2 ...]   (requiere: pip install edge-tts, ffmpeg, npm i)

- Lee los guiones de src/episodes/ (vía scripts/dump-episodes.ts).
- Escribe public/voz/<ep>/<id>.mp3.
- Actualiza src/voice-data.json con duración, volumen por frame (para la boca)
  y el tiempo de cada palabra (para los subtítulos palabra por palabra).
- `mood` de cada toma cambia velocidad, tono y volumen para darle emoción.
"""
import array, asyncio, json, math, os, ssl, subprocess, sys, pathlib
import edge_tts
import edge_tts.communicate as _comm

ROOT = pathlib.Path(__file__).resolve().parent.parent

# Si hay un proxy HTTPS (p. ej. en la nube), úsalo y confía en su CA.
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
_ca = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
if PROXY and os.path.exists(_ca):
    _comm._SSL_CTX = ssl.create_default_context(cafile=_ca)

VOZ = {"alejandro": "es-AR-TomasNeural", "claudia": "es-AR-ElenaNeural"}
# Tono base de cada personaje (Hz) y ajustes por emoción: (velocidad %, tono Hz, volumen %)
BASE_PITCH = {"alejandro": -2, "claudia": 28}
BASE_RATE = {"alejandro": 0, "claudia": 6}
MOODS = {
    "neutral": (0, 0, 0),
    "sleepy": (-8, -8, -10),
    "shocked": (14, 14, 15),
    "sad": (-14, -10, -15),
    "hopeful": (6, 10, 5),
    "suspicious": (-6, -4, -5),
    "serious": (-4, -10, 0),
    "proud": (8, 8, 10),
    "tender": (-4, -4, -10),
    "smug": (-6, -6, 0),
    "excited": (16, 12, 15),
}
# Toque robótico sutil para Claudia (chorus corto + brillo).
ROBOT_FX = "chorus=0.6:0.85:18|26:0.35|0.25:0.4|0.6:2|1.5,highpass=f=140,treble=g=3"
FPS = 30


def fmt(v, unit):
    return f"{'+' if v >= 0 else ''}{v}{unit}"


def envolvente(path):
    """Volumen por frame (0..1) para animar la boca."""
    sr = 16000
    pcm = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
    a = array.array("h", pcm)
    step = sr // FPS
    vals = []
    for i in range(0, len(a), step):
        chunk = a[i:i + step]
        vals.append(math.sqrt(sum(x * x for x in chunk) / max(1, len(chunk))) / 32768)
    peak = max(vals) or 1
    return [round(min(1.0, (v / peak) ** 0.7), 2) for v in vals]


def duracion(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out)


async def sintetizar(text, who, mood, raw_path):
    r, p, v = MOODS.get(mood or "neutral", MOODS["neutral"])
    com = edge_tts.Communicate(
        text,
        VOZ[who],
        rate=fmt(BASE_RATE[who] + r, "%"),
        pitch=fmt(BASE_PITCH[who] + p, "Hz"),
        volume=fmt(v, "%"),
        boundary="WordBoundary",
        proxy=PROXY,
    )
    words = []
    with open(raw_path, "wb") as f:
        async for chunk in com.stream():
            if chunk["type"] == "audio":
                f.write(chunk["data"])
            elif chunk["type"] == "WordBoundary":
                s = chunk["offset"] / 1e7
                words.append({"w": chunk["text"], "s": s, "e": s + chunk["duration"] / 1e7})
    return words


async def main():
    solo = set(sys.argv[1:])
    episodes = json.loads(subprocess.check_output(["npx", "tsx", "scripts/dump-episodes.ts"], cwd=ROOT))
    data_path = ROOT / "src/voice-data.json"
    data = json.loads(data_path.read_text()) if data_path.exists() else {}
    for ep in episodes:
        if solo and ep["id"] not in solo:
            continue
        out_dir = ROOT / "public/voz" / ep["id"]
        out_dir.mkdir(parents=True, exist_ok=True)
        for shot in ep["shots"]:
            who, line = shot.get("talk"), shot.get("line")
            if not who or not line:
                continue
            text = shot.get("say") or line
            raw = out_dir / f"{shot['id']}.raw.mp3"
            final = out_dir / f"{shot['id']}.mp3"
            words = await sintetizar(text, who, shot.get("mood"), raw)
            # Recorta el silencio inicial justo antes de la primera palabra.
            lead = max(0.0, (words[0]["s"] if words else 0) - 0.04)
            filtros = f"atrim=start={lead},asetpts=PTS-STARTPTS,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
            if who == "claudia":
                filtros += "," + ROBOT_FX
            subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", filtros, "-ar", "44100", str(final)], check=True)
            raw.unlink()
            words = [{"w": w["w"], "s": round(w["s"] - lead, 3), "e": round(w["e"] - lead, 3)} for w in words]
            key = f"{ep['id']}/{shot['id']}"
            data[key] = {"dur": round(duracion(final), 3), "env": envolvente(final), "words": words}
            print(f"{key:22s} {who:9s} {shot.get('mood') or '-':10s} {data[key]['dur']:.2f}s  {text}")
    data_path.write_text(json.dumps(data, ensure_ascii=False) + "\n")


asyncio.run(main())
