"""Genera las voces del guion con edge-tts y guarda sus duraciones.

Uso:  python scripts/generar-voces.py   (requiere: pip install edge-tts, ffmpeg)
Lee los diálogos de src/script.ts y escribe public/voz/<id>.mp3 y
src/voice-durations.json.
"""
import asyncio, json, os, re, ssl, subprocess, pathlib
import edge_tts
import edge_tts.communicate as _comm

# Si hay un proxy HTTPS (p. ej. en la nube), úsalo y confía en su CA.
PROXY = os.environ.get("HTTPS_PROXY") or os.environ.get("https_proxy")
_ca = os.environ.get("SSL_CERT_FILE") or "/root/.ccr/ca-bundle.crt"
if PROXY and os.path.exists(_ca):
    _comm._SSL_CTX = ssl.create_default_context(cafile=_ca)

ROOT = pathlib.Path(__file__).resolve().parent.parent
VOCES = {
    "alejandro": dict(voice="es-AR-TomasNeural", rate="+0%", pitch="-2Hz"),
    "claudia": dict(voice="es-AR-ElenaNeural", rate="+6%", pitch="+28Hz"),
}
# Toque robótico sutil para Claudia (chorus corto + leve brillo).
ROBOT_FX = "chorus=0.6:0.85:18|26:0.35|0.25:0.4|0.6:2|1.5,highpass=f=140,treble=g=3"

def leer_guion():
    src = (ROOT / "src/script.ts").read_text()
    out = []
    for bloque in re.findall(r"\{[^{}]*\}", src):
        sid = re.search(r'id: "([^"]+)"', bloque)
        who = re.search(r'talk: "(\w+)"', bloque)
        line = re.search(r'line: "([^"]+)"', bloque)
        say = re.search(r'say: "([^"]+)"', bloque)
        if sid and who and line:
            out.append((sid.group(1), who.group(1), (say or line).group(1)))
    return out

def duracion(path):
    out = subprocess.check_output(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(path)])
    return float(out)

def envolvente(path, fps=30):
    """Volumen por frame (0..1) para animar la boca."""
    import array, math
    sr = 16000
    pcm = subprocess.check_output(["ffmpeg", "-v", "error", "-i", str(path), "-ac", "1", "-ar", str(sr), "-f", "s16le", "-"])
    a = array.array("h", pcm)
    step = sr // fps
    vals = []
    for i in range(0, len(a), step):
        chunk = a[i:i + step]
        rms = math.sqrt(sum(x * x for x in chunk) / max(1, len(chunk))) / 32768
        vals.append(rms)
    peak = max(vals) or 1
    return [round(min(1.0, (v / peak) ** 0.7), 2) for v in vals]

async def main():
    out_dir = ROOT / "public/voz"
    out_dir.mkdir(parents=True, exist_ok=True)
    durs = {}
    envs = {}
    for sid, who, line in leer_guion():
        cfg = VOCES[who]
        raw = out_dir / f"{sid}.raw.mp3"
        final = out_dir / f"{sid}.mp3"
        await edge_tts.Communicate(line, cfg["voice"], rate=cfg["rate"], pitch=cfg["pitch"], proxy=PROXY).save(str(raw))
        filtros = "silenceremove=start_periods=1:start_threshold=-45dB,areverse,silenceremove=start_periods=1:start_threshold=-45dB,areverse"
        if who == "claudia":
            filtros += "," + ROBOT_FX
        subprocess.run(["ffmpeg", "-v", "error", "-y", "-i", str(raw), "-af", filtros, "-ar", "44100", str(final)], check=True)
        raw.unlink()
        durs[sid] = round(duracion(final), 3)
        print(f"{sid:16s} {who:9s} {durs[sid]:.2f}s  {line}")
        envs[sid] = envolvente(final)
    (ROOT / "src/voice-durations.json").write_text(json.dumps(durs, indent=2) + "\n")
    (ROOT / "src/voice-envelopes.json").write_text(json.dumps(envs) + "\n")

asyncio.run(main())
