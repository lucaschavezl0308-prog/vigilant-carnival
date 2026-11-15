"""Música de fondo y efectos generados por código.

Todo se sintetiza aquí (osciladores + ruido), así que no hay muestras ni pistas
de terceros: cero problemas de Content ID con la música.
"""
import numpy as np
from scipy import signal

SR = 48000

NOTAS = {"C": 0, "C#": 1, "D": 2, "D#": 3, "E": 4, "F": 5, "F#": 6, "G": 7, "G#": 8, "A": 9, "A#": 10, "B": 11}


def midi(nombre: str, octava: int) -> int:
    return 12 * (octava + 1) + NOTAS[nombre]


def hz(m: float) -> float:
    return 440.0 * 2 ** ((m - 69) / 12)


def saw(f, n, fase=0.0):
    t = np.arange(n) / SR
    return 2.0 * ((t * f + fase) % 1.0) - 1.0


def tri(f, n):
    return 2.0 * np.abs(saw(f, n)) - 1.0


def env_adsr(n, a, d, s, r):
    e = np.ones(n) * s
    na, nd, nr = int(a * SR), int(d * SR), int(r * SR)
    na = min(na, n)
    e[:na] = np.linspace(0, 1, na, endpoint=False)
    nd2 = min(nd, max(0, n - na))
    e[na:na + nd2] = np.linspace(1, s, nd2, endpoint=False)
    if nr > 0 and n > nr:
        e[-nr:] *= np.linspace(1, 0, nr)
    return e


def lp(x, fc, order=2):
    sos = signal.butter(order, fc, "low", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def hp(x, fc, order=2):
    sos = signal.butter(order, fc, "high", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def bp(x, lo, hi, order=2):
    sos = signal.butter(order, [lo, hi], "band", fs=SR, output="sos")
    return signal.sosfilt(sos, x, axis=0)


def reverb(x, segundos=1.8, mezcla=0.25, rng=None):
    rng = rng or np.random.default_rng(1)
    n = int(segundos * SR)
    ir = rng.standard_normal((n, 2)) * np.exp(-np.linspace(0, 6, n))[:, None]
    ir = lp(ir, 6000)
    ir /= np.sqrt((ir ** 2).sum(axis=0))
    mojado = np.stack([signal.fftconvolve(x[:, c], ir[:, c])[: len(x)] for c in range(2)], axis=1)
    return x * (1 - mezcla) + mojado * mezcla


# Progresiones (grados en semitonos desde la tónica menor) y tonalidades por vídeo
PROGRESIONES = [
    [(0, "m"), (8, "M"), (3, "M"), (10, "M")],   # i - VI - III - VII
    [(0, "m"), (5, "m"), (8, "M"), (10, "M")],   # i - iv - VI - VII
    [(0, "m"), (10, "M"), (8, "M"), (7, "M")],   # i - VII - VI - V
]
TONALIDADES = ["A", "C", "D", "E", "F#", "G", "B", "C#", "F", "D#"]


def acorde(raiz_midi, tipo):
    tercera = 3 if tipo == "m" else 4
    return [raiz_midi, raiz_midi + tercera, raiz_midi + 7, raiz_midi + 12]


def generar_loop(semilla: int = 0, bpm: float = 96.0, compases: int = 16) -> np.ndarray:
    """Devuelve un loop estéreo (float32, SR) de `compases` compases."""
    rng = np.random.default_rng(semilla + 7)
    tonica = midi(TONALIDADES[semilla % len(TONALIDADES)], 3)
    prog = PROGRESIONES[semilla % len(PROGRESIONES)]
    beat = 60.0 / bpm
    compas = 4 * beat
    total = int(compases * compas * SR)
    pad = np.zeros((total, 2))
    bajo = np.zeros(total)
    arp = np.zeros(total)
    bat = np.zeros((total, 2))

    acordes_por_compas = []
    for c in range(compases):
        grado, tipo = prog[(c // 2) % len(prog)]
        acordes_por_compas.append(acorde(tonica + grado, tipo))

    # Pad: sierras desafinadas, filtradas y con ataque lento (2 compases por acorde)
    for c in range(0, compases, 2):
        notas = acordes_por_compas[c]
        ini = int(c * compas * SR)
        n = int(2 * compas * SR)
        n = min(n, total - ini)
        e = env_adsr(n, 0.6, 0.8, 0.8, 0.9)
        for m in notas[:3] + [notas[0] + 12]:
            for k, det in enumerate((-0.07, 0.0, 0.07)):
                f = hz(m + 12 + det)
                v = saw(f, n, fase=rng.random()) * e * 0.05
                pad[ini:ini + n, 0] += v * (0.6 if k == 0 else 0.4 if k == 2 else 0.5)
                pad[ini:ini + n, 1] += v * (0.4 if k == 0 else 0.6 if k == 2 else 0.5)
    pad = lp(pad, 1700)

    # Bajo: corcheas con envolvente corta
    corchea = beat / 2
    for c in range(compases):
        raiz = acordes_por_compas[c][0] - 12
        for k in range(8):
            ini = int((c * compas + k * corchea) * SR)
            n = int(corchea * 0.92 * SR)
            n = min(n, total - ini)
            e = env_adsr(n, 0.005, 0.12, 0.35, 0.03)
            nota = raiz + (12 if k in (3, 7) else 0)
            bajo[ini:ini + n] += saw(hz(nota), n) * e * 0.33
    bajo = lp(bajo, 520)

    # Arpegio: semicorcheas sobre notas del acorde (sólo en la segunda mitad del loop)
    semi = beat / 4
    patron = [0, 1, 2, 3, 2, 1, 2, 3]
    for c in range(compases // 2, compases):
        notas = acordes_por_compas[c]
        for k in range(16):
            ini = int((c * compas + k * semi) * SR)
            n = int(semi * 1.6 * SR)
            n = min(n, total - ini)
            e = np.exp(-np.linspace(0, 7, n))
            arp[ini:ini + n] += tri(hz(notas[patron[k % 8]] + 24), n) * e * 0.06
    # Delay ping-pong para el arpegio
    retardo = int(3 * semi * SR)
    arp_st = np.stack([arp, np.zeros_like(arp)], axis=1)
    for rep in range(1, 5):
        g = 0.38 ** rep
        canal = rep % 2
        arp_st[retardo * rep:, canal] += arp[: total - retardo * rep] * g

    # Batería
    def kick():
        n = int(0.42 * SR)
        t = np.arange(n) / SR
        f = 45 + 95 * np.exp(-t * 28)
        return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 7.5) * 0.85

    def caja():
        n = int(0.28 * SR)
        t = np.arange(n) / SR
        ruido = bp(rng.standard_normal(n), 1400, 6500) * np.exp(-t * 16)
        tono = np.sin(2 * np.pi * 190 * t) * np.exp(-t * 25)
        return (ruido * 0.55 + tono * 0.35) * 0.7

    def hat():
        n = int(0.06 * SR)
        t = np.arange(n) / SR
        return hp(rng.standard_normal(n), 8000) * np.exp(-t * 70) * 0.16

    K, S, H = kick(), caja(), hat()
    for c in range(compases):
        if c < 2:
            continue  # entrada suave: dos compases sin batería
        for b in range(4):
            ini = int((c * compas + b * beat) * SR)
            if b in (0, 2):
                fin = min(total, ini + len(K))
                bat[ini:fin] += K[: fin - ini, None]
            if b in (1, 3):
                fin = min(total, ini + len(S))
                bat[ini:fin, 0] += S[: fin - ini] * 0.9
                bat[ini:fin, 1] += S[: fin - ini]
        for k in range(8):
            ini = int((c * compas + k * corchea) * SR)
            fin = min(total, ini + len(H))
            pan = 0.7 if k % 2 else 0.4
            bat[ini:fin, 0] += H[: fin - ini] * pan
            bat[ini:fin, 1] += H[: fin - ini] * (1 - pan)

    mezcla = reverb(pad, 2.2, 0.35, rng) + arp_st * 0.8 + bajo[:, None] * 0.8
    mezcla = reverb(mezcla, 1.2, 0.12, rng) + bat * 0.7
    mezcla = np.tanh(mezcla * 1.2)
    mezcla /= np.max(np.abs(mezcla)) + 1e-9
    return (mezcla * 0.9).astype(np.float32)


def cama_musical(segundos: float, semilla: int) -> np.ndarray:
    """Repite el loop con fundidos para cubrir `segundos`, con salida en fade."""
    loop = generar_loop(semilla)
    n = int(segundos * SR)
    xf = int(0.5 * SR)
    salida = np.zeros((n + len(loop), 2), dtype=np.float32)
    pos = 0
    rampa = np.linspace(0, 1, xf)[:, None]
    while pos < n:
        trozo = loop.copy()
        if pos > 0:
            trozo[:xf] *= rampa
            salida[pos:pos + xf] *= (1 - rampa)
        salida[pos:pos + len(trozo)] += trozo
        pos += len(loop) - xf
    salida = salida[:n]
    fade = int(min(3.0, segundos / 4) * SR)
    salida[-fade:] *= np.linspace(1, 0, fade)[:, None]
    entrada = int(0.4 * SR)
    salida[:entrada] *= np.linspace(0, 1, entrada)[:, None]
    return salida


# ---------------------------------------------------------------- efectos
def whoosh(dur=0.55, semilla=0):
    rng = np.random.default_rng(100 + semilla)
    n = int(dur * SR)
    ruido = rng.standard_normal(n)
    salida = np.zeros(n)
    bloques = 24
    tam = n // bloques
    for i in range(bloques):
        fc = 300 * (14 ** (i / bloques)) if i < bloques * 0.7 else 300 * 14 ** (0.7) * (1 - (i - 0.7 * bloques) / bloques)
        fc = float(np.clip(fc, 150, 9000))
        seg = ruido[i * tam:(i + 1) * tam + 256]
        filt = bp(seg, fc * 0.6, min(fc * 1.6, 20000))[: tam]
        salida[i * tam:i * tam + len(filt)] = filt
    e = np.sin(np.linspace(0, np.pi, n)) ** 2
    st = np.stack([salida * e, np.roll(salida * e, 180)], axis=1)
    return (st / (np.max(np.abs(st)) + 1e-9) * 0.5).astype(np.float32)


def riser(dur=1.6):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 180 * (8 ** (t / dur))
    tono = np.sin(2 * np.pi * np.cumsum(f) / SR) * 0.25
    rng = np.random.default_rng(3)
    ruido = hp(rng.standard_normal(n), 2500) * 0.25
    e = (t / dur) ** 2.2
    s = (tono + ruido) * e
    return (np.stack([s, s], axis=1) * 0.6).astype(np.float32)


def impacto(dur=1.4):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 32 + 70 * np.exp(-t * 9)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 3.2)
    rng = np.random.default_rng(4)
    ruido = lp(rng.standard_normal(n), 2500) * np.exp(-t * 14) * 0.5
    s = np.tanh((boom + ruido) * 1.5)
    st = reverb(np.stack([s, s], axis=1), 1.5, 0.3)
    return (st / (np.max(np.abs(st)) + 1e-9) * 0.75).astype(np.float32)


def pop(semilla=0):
    n = int(0.09 * SR)
    t = np.arange(n) / SR
    f0 = 1000 + 120 * (semilla % 3)
    f = f0 * np.exp(-t * 9)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
    return (np.stack([s, s], axis=1) * 0.35).astype(np.float32)


if __name__ == "__main__":
    import soundfile as sf
    import sys
    out = sys.argv[1] if len(sys.argv) > 1 else "loop.wav"
    sf.write(out, generar_loop(0), SR)
    print("ok", out)
