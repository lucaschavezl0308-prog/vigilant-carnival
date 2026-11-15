"""Motores de voz. Por defecto Kokoro (local, Apache-2.0, apto para uso comercial).

Si mejoras tu plan de ElevenLabs (Starter o superior incluye licencia comercial),
puedes revoicear todo con:  python3 pipeline/producir.py --motor elevenlabs --voz <voice_id>
"""
import hashlib
import io
import os
import subprocess
import urllib.request
from pathlib import Path

import numpy as np
import soundfile as sf

RAIZ = Path(__file__).resolve().parent
MODELOS = RAIZ / ".models"
CACHE = RAIZ / ".cache" / "tts"
URL_MODELO = "https://github.com/thewh1teagle/kokoro-onnx/releases/download/model-files-v1.0/"


def _descargar(nombre: str) -> Path:
    MODELOS.mkdir(parents=True, exist_ok=True)
    destino = MODELOS / nombre
    if not destino.exists():
        print(f"  descargando {nombre}…")
        urllib.request.urlretrieve(URL_MODELO + nombre, destino)
    return destino


def recortar_silencio(x: np.ndarray, sr: int, umbral_db: float = -42.0, margen: float = 0.03) -> np.ndarray:
    if len(x) == 0:
        return x
    umbral = 10 ** (umbral_db / 20) * max(np.max(np.abs(x)), 1e-6)
    idx = np.where(np.abs(x) > umbral)[0]
    if len(idx) == 0:
        return x
    m = int(margen * sr)
    return x[max(0, idx[0] - m): min(len(x), idx[-1] + m)]


class Kokoro:
    sr = 24000

    def __init__(self, voz: str = "em_alex", velocidad: float = 1.08):
        from kokoro_onnx import Kokoro as _K

        self.voz, self.velocidad = voz, velocidad
        self.k = _K(str(_descargar("kokoro-v1.0.onnx")), str(_descargar("voices-v1.0.bin")))
        self.clave = f"kokoro:{voz}:{velocidad}"

    def sintetizar(self, texto: str) -> np.ndarray:
        audio, sr = self.k.create(texto, voice=self.voz, speed=self.velocidad, lang="es")
        assert sr == self.sr
        return audio.astype(np.float32)


class ElevenLabs:
    sr = 44100

    def __init__(self, voz: str, modelo: str = "eleven_multilingual_v2"):
        self.voz, self.modelo = voz, modelo
        self.clave = f"eleven:{voz}:{modelo}"

    def sintetizar(self, texto: str) -> np.ndarray:
        import json

        req = urllib.request.Request(
            f"https://api.elevenlabs.io/v1/text-to-speech/{self.voz}?output_format=mp3_44100_128",
            data=json.dumps({
                "text": texto, "model_id": self.modelo, "language_code": "es",
                "voice_settings": {"stability": 0.45, "similarity_boost": 0.8, "style": 0.25},
            }).encode(),
            headers={"Content-Type": "application/json", "xi-api-key": os.environ.get("ELEVENLABS_API_KEY", "x")},
        )
        mp3 = urllib.request.urlopen(req).read()
        wav = subprocess.run(
            ["ffmpeg", "-loglevel", "error", "-i", "pipe:0", "-ac", "1", "-ar", str(self.sr), "-f", "wav", "pipe:1"],
            input=mp3, capture_output=True, check=True,
        ).stdout
        audio, _ = sf.read(io.BytesIO(wav), dtype="float32")
        return audio


class ConCache:
    """Envuelve un motor y guarda cada frase en disco para no regenerarla."""

    def __init__(self, motor):
        self.motor = motor
        self.sr = motor.sr
        CACHE.mkdir(parents=True, exist_ok=True)

    def __call__(self, texto: str) -> np.ndarray:
        h = hashlib.sha1(f"{self.motor.clave}|{texto}".encode()).hexdigest()[:16]
        f = CACHE / f"{h}.wav"
        if f.exists():
            audio, _ = sf.read(f, dtype="float32")
            return audio
        audio = recortar_silencio(self.motor.sintetizar(texto), self.sr)
        sf.write(f, audio, self.sr)
        return audio


def crear_motor(nombre: str, voz: str | None, velocidad: float) -> ConCache:
    if nombre == "elevenlabs":
        if not voz:
            raise SystemExit("Con --motor elevenlabs indica --voz <voice_id>")
        return ConCache(ElevenLabs(voz))
    return ConCache(Kokoro(voz or "em_alex", velocidad))
