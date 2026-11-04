#!/usr/bin/env python3
"""UNDER beat generator — dark underground trap, 140 BPM, F minor (Phrygian colour).

Outputs: full mix WAV, stems WAV (all same length / start at 0), MIDI files.
"""
import os
import sys
import wave
import numpy as np
from scipy import signal

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
os.makedirs(os.path.join(OUT, "stems"), exist_ok=True)
os.makedirs(os.path.join(OUT, "midi"), exist_ok=True)

SR = 44100
BPM = 140.0
SPB = 60.0 / BPM
STEP = SPB / 4.0                 # one 16th note
BARS = 32
TOTAL_STEPS = BARS * 16
TAIL = 3.5
N = int((TOTAL_STEPS * STEP + TAIL) * SR)
rng = np.random.default_rng(1308)


# --------------------------------------------------------------------------- utils
def mtof(m):
    return 440.0 * 2.0 ** ((m - 69) / 12.0)


def sos(kind, fc, order=2):
    return signal.butter(order, fc, kind, fs=SR, output="sos")


def lp(x, fc, order=2):
    return signal.sosfilt(sos("lp", fc, order), x, axis=0)


def hp(x, fc, order=2):
    return signal.sosfilt(sos("hp", fc, order), x, axis=0)


def bp(x, lo, hi, order=2):
    return signal.sosfilt(sos("bp", [lo, hi], order), x, axis=0)


def stereo():
    return np.zeros((N, 2))


def put(buf, sig, t, gain=1.0, pan=0.0):
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    l = min(1.0, 1.0 - pan)
    r = min(1.0, 1.0 + pan)
    buf[i:i + n, 0] += sig[:n] * gain * l
    buf[i:i + n, 1] += sig[:n] * gain * r


def put_mono(buf, sig, t, gain=1.0):
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    buf[i:i + n] += sig[:n] * gain


# --------------------------------------------------------------------------- instruments
def make_kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 62 + 170 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    body *= np.minimum(1, t / 0.0008)
    click = bp(rng.standard_normal(n), 1800, 7000) * np.exp(-t / 0.004) * 0.35
    k = np.tanh(2.0 * (body + click))
    return hp(k, 55)          # sub is the 808's job; kick = knock + click


def make_snare():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1800, 9500) * np.exp(-t / 0.10)
    f = 190 + 90 * np.exp(-t / 0.018)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.065)
    s = np.tanh(1.6 * (0.75 * noise + 0.55 * tone))
    return s


def make_clap():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for off in (0.0, 0.010, 0.021):
        i = int(off * SR)
        env[i:] += np.exp(-np.arange(n - i) / SR / 0.005) * 0.7
    i = int(0.03 * SR)
    env[i:] += np.exp(-np.arange(n - i) / SR / 0.085) * 0.55
    c = bp(rng.standard_normal(n), 900, 4200) * env
    return np.tanh(1.5 * c)


def make_hat(decay, n_s=0.4, bright=1.0):
    n = int(n_s * SR)
    t = np.arange(n) / SR
    metal = np.zeros(n)
    for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0):
        metal += np.sign(np.sin(2 * np.pi * f * 2.0 * t))
    metal = hp(metal / 6, 7000) * 0.5
    noise = hp(rng.standard_normal(n), 8500) * 0.5
    h = (metal + noise * bright) * np.exp(-t / decay)
    h *= np.minimum(1, t / 0.0005)
    return h


def make_808(m, dur_s, glide_from=None, glide_t=0.08, drive=1.8):
    rel = 0.012                      # note ends inside its own slot -> no overlap between 808s
    dur_s = dur_s - rel
    n = int((dur_s + rel) * SR)
    t = np.arange(n) / SR
    f0 = mtof(m)
    f = np.full(n, f0)
    if glide_from is not None:
        f1 = mtof(glide_from)
        g = np.clip(t / glide_t, 0, 1)
        f = f1 * (f0 / f1) ** g
    f = f * (1 + 0.45 * np.exp(-t / 0.010))        # little pitch "pop"
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph)
    amp = np.exp(-t / (dur_s * 0.9 + 0.12)) * np.minimum(1, t / 0.003)
    amp *= np.where(t < dur_s, 1.0, np.clip(1 - (t - dur_s) / rel, 0, 1))
    out = np.tanh(drive * s * amp) / np.tanh(drive)
    out = lp(out, 2400)
    return out


def make_bell(m, dur=1.7, bright=1.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t)
    idx = (1.9 * bright) * np.exp(-t / 0.20) + 0.25
    car = np.sin(2 * np.pi * f * t + idx * mod)
    car += 0.22 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.50)
    return car * env * vel


def make_pad_chord(midis, dur, cutoff, amp=1.0):
    rel = 0.9
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in midis:
        f = mtof(m)
        for cents, side in ((-9, 0), (3, 0), (-3, 1), (9, 1)):
            ff = f * 2 ** (cents / 1200)
            ph0 = rng.random()
            saw = 2 * ((ff * t + ph0) % 1.0) - 1
            if side == 0:
                L += saw
            else:
                R += saw
        sub = np.sin(2 * np.pi * f * 0.5 * t) * 0.8
        L += sub
        R += sub
    env = np.clip(t / 0.45, 0, 1) * np.clip((dur + rel - t) / rel, 0, 1)
    L = lp(L, cutoff, 2) * env
    R = lp(R, cutoff, 2) * env
    sc = amp / (len(midis) * 2.2)
    return np.stack([L * sc, R * sc], axis=1)


def make_ir(sec, decay_t, lo=250, hi=7000):
    n = int(sec * SR)
    t = np.arange(n) / SR
    ir = np.zeros((n, 2))
    for c in range(2):
        x = rng.standard_normal(n) * np.exp(-t / decay_t)
        x[: int(0.012 * SR)] *= np.linspace(0, 1, int(0.012 * SR))
        x = bp(x, lo, hi, 1)
        ir[:, c] = x / np.sqrt(np.sum(x ** 2))
    return ir


def reverb(mono, ir):
    out = np.zeros((N, 2))
    for c in range(2):
        out[:, c] = signal.fftconvolve(mono, ir[:, c])[:N]
    return out


def pingpong(mono, delay_s, fb=0.46, taps=7, fc=3200):
    d = int(delay_s * SR)
    out = np.zeros((N, 2))
    x = mono.copy()
    for k in range(1, taps + 1):
        if k * d >= N:
            break
        x = lp(x * fb, fc, 1)
        out[k * d:, k % 2] += x[: N - k * d]
    return out


def riser(dur, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    ramp = (t / dur) ** 2.2
    noise = hp(rng.standard_normal(n), 2500) * ramp
    f = 220 * (4200 / 220) ** (t / dur)
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * ramp * 0.35
    out = (noise * 0.6 + sweep) * level
    return out


def impact(level=1.0):
    n = int(2.2 * SR)
    t = np.arange(n) / SR
    f = 36 + 90 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.7)
    crash = lp(hp(rng.standard_normal(n), 1500), 9000) * np.exp(-t / 0.55) * 0.35
    return np.tanh(1.4 * (boom + crash)) * level


def downlift(dur=1.8, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 2400 * (180 / 2400) ** (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9) * 0.3
    nz = lp(rng.standard_normal(n), 3000) * np.exp(-t / 0.7) * 0.4
    return (s + nz) * level


# --------------------------------------------------------------------------- music data
def section(bar):
    if bar < 4:
        return "intro"
    if bar < 12:
        return "A"
    if bar < 16:
        return "break"
    if bar < 28:
        return "B"
    return "outro"


ROOTS = [29, 30, 25, 27]   # F1, Gb1, Db1, Eb1
CHORDS = [
    [53, 56, 60, 63],      # Fm7
    [54, 58, 61, 65],      # Gbmaj7
    [49, 53, 56, 60],      # Dbmaj7
    [51, 55, 58, 62],      # Ebmaj7
]
# melody per bar: (step, midi, length_in_steps)
MELODY = [
    [(0, 72), (3, 68), (6, 72), (8, 73), (11, 72), (14, 68)],
    [(0, 73), (3, 70), (6, 73), (8, 77), (11, 73), (14, 70)],
    [(0, 77), (3, 73), (6, 72), (8, 68), (11, 72), (14, 73)],
    [(0, 70), (3, 74), (6, 70), (8, 67), (11, 70), (14, 72)],
]

# 808 patterns: (step, dur_steps, midi, glide_from)
P808_A = [
    [(0, 6, 29, None), (7, 3, 29, None), (10, 4, 29, None), (14, 2, 30, 29)],
    [(0, 6, 30, None), (7, 3, 30, None), (10, 6, 30, None)],
    [(0, 6, 25, None), (7, 3, 25, None), (10, 3, 25, None), (13, 3, 27, 25)],
    [(0, 6, 27, None), (7, 3, 27, None), (10, 4, 27, None), (14, 2, 29, 27)],
]
P808_B = [
    [(0, 5, 29, None), (6, 3, 41, 29), (10, 6, 29, None)],
    [(0, 5, 30, None), (7, 3, 30, None), (10, 3, 30, None), (13, 3, 42, 30)],
    [(0, 4, 25, None), (5, 2, 25, None), (7, 3, 25, None), (10, 4, 25, None), (14, 2, 27, 25)],
    [(0, 5, 27, None), (7, 2, 27, None), (10, 3, 27, None), (13, 3, 29, 27)],
]

HAT_VEL = [1.0, 0.55, 0.8, 0.55, 0.95, 0.55, 0.8, 0.6]


def hats_for(bar):
    """Return {step: (vel, kind)} for a bar. kind: 'c' closed, 'o' open."""
    sec = section(bar)
    pb = bar % 4
    ev = {}
    if sec == "intro":
        if bar < 2:
            return ev
        for s in range(0, 16, 2):
            ev[s] = (HAT_VEL[s // 2] * 0.45, "c")
        if bar == 3:
            for s, v in ((12, .5), (13, .6), (14, .75), (15, .9)):
                ev[s] = (v * 0.8, "c")
        return ev
    if sec == "break":
        for s in range(0, 16, 4):
            ev[s] = (HAT_VEL[s // 2] * 0.4, "c")
        if bar == 15:
            for s in range(8, 16):
                ev[s] = (0.3 + 0.1 * (s - 8), "c")
        return ev
    if sec == "outro":
        fade = 1.0 - (bar - 28) / 4.0
        for s in range(0, 16, 2):
            ev[s] = (HAT_VEL[s // 2] * 0.5 * fade, "c")
        return ev
    # A / B drops
    for s in range(0, 16, 2):
        ev[s] = (HAT_VEL[s // 2], "c")
    if sec == "A":
        if pb == 1:
            ev[7] = (0.5, "c"); ev[15] = (0.45, "c")
        if pb == 2:
            ev[3] = (0.45, "c"); ev[11] = (0.4, "c")
        if pb == 3:
            for s, v in ((12, .6), (13, .7), (14, .85), (15, 1.0)):
                ev[s] = (v, "c")
        if bar == 11:                     # triplet fill into the break
            for k in range(6):
                ev[12 + k * 2 / 3] = (0.5 + 0.1 * k, "c")
            ev.pop(12.0, None); ev[12.0] = (0.5, "c")
            ev.pop(14, None); ev[14.0] = (0.8, "c")
    else:  # B — busier
        if pb == 0:
            ev[7] = (0.5, "c"); ev[11] = (0.45, "c"); ev[15] = (0.5, "c")
        if pb == 1:
            ev[3] = (0.45, "c"); ev[7] = (0.55, "c"); ev[13] = (0.5, "c")
            ev[10] = (0.7, "o")
        if pb == 2:
            ev[5] = (0.45, "c"); ev[7] = (0.5, "c"); ev[15] = (0.5, "c")
            ev[6] = (0.55, "o")
        if pb == 3:
            for s in (12, 14):
                ev.pop(s, None)
            for k in range(6):
                ev[12 + k * 2 / 3] = (0.5 + 0.1 * k, "c")
            ev[2] = (0.6, "o")
    return ev


# --------------------------------------------------------------------------- render
kick_s, snare_s, clap_s = make_kick(), make_snare(), make_clap()
hat_c, hat_o = make_hat(0.026), make_hat(0.20, 0.5, 0.8)

drums = stereo()
bass = stereo()
mel_dry = stereo()
pad = stereo()
fx = stereo()
snare_bus = np.zeros(N)

midi = {"drums": [], "808": [], "melody": [], "pad": []}   # (step, dur, note, vel)
kick_times = []


def at(bar, step):
    return (bar * 16 + step) * STEP


for bar in range(BARS):
    sec = section(bar)
    pb = bar % 4
    t0 = bar * 16 * STEP

    # ---- 808 + kick
    notes = []
    if sec == "A":
        notes = P808_A[pb]
    elif sec == "B":
        notes = P808_B[pb]
    elif sec == "break":
        notes = [(0, 14, ROOTS[pb], None)]
    elif sec == "outro" and bar == 28:
        notes = [(0, 12, 29, None)]
    for step, dur, m, gf in notes:
        s = make_808(m, dur * STEP, gf)
        put(bass, s, at(bar, step), 0.95)
        midi["808"].append((bar * 16 + step, dur, m, 105))
        if gf is None and sec in ("A", "B"):
            put(drums, kick_s, at(bar, step), 0.85)
            kick_times.append(at(bar, step))
            midi["drums"].append((bar * 16 + step, 1, 36, 112))

    # ---- snare / clap
    if sec in ("A", "B"):
        snare_steps = [(8, 1.0)]
        if (sec == "B" and pb == 3) or bar == 11:
            snare_steps += [(13, .55), (14, .7), (15, .9)]
        for step, v in snare_steps:
            put_mono(snare_bus, snare_s, at(bar, step), 0.58 * v)
            put_mono(snare_bus, clap_s, at(bar, step), 0.46 * v)
            midi["drums"].append((bar * 16 + step, 1, 38, int(100 * v)))
            midi["drums"].append((bar * 16 + step, 1, 39, int(90 * v)))
    if bar == 15:                                   # roll into the last drop
        for k, step in enumerate(range(8, 16)):
            v = 0.3 + 0.1 * k
            put_mono(snare_bus, snare_s, at(bar, step), 0.7 * v)
            midi["drums"].append((bar * 16 + step, 1, 38, int(100 * v)))

    # ---- hats
    for i, (step, (v, kind)) in enumerate(sorted(hats_for(bar).items())):
        v *= 1.0 + rng.uniform(-0.08, 0.08)
        sample = hat_o if kind == "o" else hat_c
        pan = 0.18 if i % 2 else -0.18
        put(drums, sample, at(bar, step), 0.5 * v, pan)
        midi["drums"].append((bar * 16 + step, 1, 46 if kind == "o" else 42, max(1, min(127, int(95 * v)))))

    # ---- melody (bells)
    bright = {"intro": 0.55, "A": 1.0, "break": 0.8, "B": 1.0, "outro": 0.5}[sec]
    mvel = {"intro": 0.7, "A": 0.9, "break": 0.8, "B": 0.95, "outro": 0.8 - 0.15 * (bar - 28)}[sec]
    for step, m in MELODY[pb]:
        put(mel_dry, make_bell(m, 1.7, bright, mvel), at(bar, step), 0.5, -0.1 if step % 2 else 0.1)
        midi["melody"].append((bar * 16 + step, 2, m, int(95 * mvel)))
    # shimmering arp, only break + B
    if sec in ("break", "B"):
        ch = CHORDS[pb]
        avel = 0.22 if sec == "break" else 0.3
        for k, step in enumerate(range(0, 16, 2)):
            m = ch[k % 4] + 24
            put(mel_dry, make_bell(m, 0.9, 0.7, avel), at(bar, step), 0.5, 0.5 if k % 2 else -0.5)
            midi["melody"].append((bar * 16 + step, 1, m, int(70 * avel / 0.3)))

    # ---- pad
    cutoff = {"intro": 700, "A": 1100, "break": 1900, "B": 1300, "outro": 600}[sec]
    pamp = {"intro": 0.9, "A": 1.0, "break": 1.15, "B": 1.0, "outro": 0.9 - 0.2 * (bar - 28)}[sec]
    put_chord = make_pad_chord(CHORDS[pb], 16 * STEP, cutoff, pamp)
    i = int(t0 * SR)
    n = min(len(put_chord), N - i)
    pad[i:i + n] += put_chord[:n]
    for m in CHORDS[pb]:
        midi["pad"].append((bar * 16, 16, m, 70))

    # ---- fx
    if bar in (3, 15):
        r = riser(16 * STEP, 0.9)
        put(fx, r, t0, 0.5)
    if bar in (4, 16):
        put(fx, impact(0.9), t0, 0.7)
    if bar in (12, 28):
        put(fx, downlift(1.8, 0.8), t0, 0.5)

# vinyl crackle + hiss (constant, very low)
crackle = np.zeros(N)
n_pops = int(8 * N / SR)
pos = rng.integers(0, N - 200, n_pops)
for p in pos:
    crackle[p] += rng.uniform(0.2, 1.0) * rng.choice([-1, 1])
crackle = hp(crackle, 1200) * 0.35
hiss = lp(hp(rng.standard_normal(N), 4000), 11000) * 0.012
fx[:, 0] += crackle + hiss
fx[:, 1] += np.roll(crackle, 37) * 0.8 + np.roll(hiss, 91)

# ---- buses: reverb/delay sends
room = make_ir(0.7, 0.14, 300, 7000)
hall = make_ir(2.6, 0.75, 200, 5500)
snare_wet = reverb(snare_bus, room)
drums += np.stack([snare_bus, snare_bus], axis=1) + 0.22 * snare_wet

mel_mono = (mel_dry[:, 0] + mel_dry[:, 1]) * 0.5
mel_wet = reverb(mel_mono, hall)
mel_dly = pingpong(mel_mono, 3 * STEP, 0.46, 7, 3200)
melody = lp(mel_dry, 6500, 1) + 0.30 * mel_wet + 0.42 * mel_dly
melody = lp(melody, 7500, 1)

pad_mono = (pad[:, 0] + pad[:, 1]) * 0.5
padbus = pad + 0.18 * reverb(pad_mono, hall)

# gentle sidechain ducking from the kick on pad + melody
duck = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    seg = np.arange(min(int(0.35 * SR), N - i)) / SR
    duck[i:i + len(seg)] *= 1 - 0.40 * np.exp(-seg / 0.09)
padbus *= duck[:, None]
melody *= (0.6 + 0.4 * duck)[:, None]

# ---- stem gains
stems = {
    "drums": drums * 0.85,
    "808": bass * 0.72,
    "melody": melody * 0.55,
    "pad": padbus * 0.55,
    "fx": fx * 0.7,
}

mix_raw = sum(stems.values())
peak = np.max(np.abs(mix_raw))
print(f"raw mix peak: {peak:.3f} at {np.argmax(np.max(np.abs(mix_raw), axis=1)) / SR:.2f}s")
for _n, _x in stems.items():
    _p = np.max(np.abs(_x))
    print(f"  {_n:7s} raw peak {_p:.2f} at {np.argmax(np.max(np.abs(_x), axis=1)) / SR:.2f}s  rms {np.sqrt(np.mean(_x ** 2)):.3f}")

# master: make-up gain + look-ahead limiter. The SAME gain curve is applied to the
# mix and to every stem, so stems summed in a DAW == the mix and never exceed -1 dBFS.
from scipy import ndimage

CEIL = 0.84
M = CEIL * 1.02 / np.percentile(np.abs(mix_raw), 99.7)
hot = mix_raw * M
look = int(0.004 * SR)
g = np.minimum(1.0, CEIL / np.maximum(np.max(np.abs(hot), axis=1), 1e-9))
g = ndimage.minimum_filter1d(g, size=2 * look + 1)
g = ndimage.uniform_filter1d(g, size=2 * look + 1)
coef = np.exp(-1.0 / (0.10 * SR))
cur = 1.0
for i in range(N):                       # release: gain recovers over ~100 ms
    gi = g[i]
    cur = gi if gi < cur else cur + (1 - coef) * (gi - cur)
    g[i] = cur
print(f"makeup x{M:.2f}, max reduction {20 * np.log10(g.min()):.1f} dB, "
      f"samples limited {np.mean(g < 0.999) * 100:.1f}%")
gs = M * g[:, None]
mix = mix_raw * gs


def write_wav(path, x):
    x16 = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(x16.tobytes())


write_wav(os.path.join(OUT, "UNDER_140bpm_Fm_MIX.wav"), mix)
for name, x in stems.items():
    write_wav(os.path.join(OUT, "stems", f"UNDER_140bpm_Fm_{name}.wav"), x * gs)


# --------------------------------------------------------------------------- MIDI
def vlq(n):
    out = [n & 0x7F]
    n >>= 7
    while n:
        out.append((n & 0x7F) | 0x80)
        n >>= 7
    return bytes(reversed(out))


TPQ = 480
TPS = TPQ // 4


def midi_track(name, events, channel):
    ev = []
    for step, dur, note, vel in events:
        on = int(round(step * TPS))
        off = on + max(1, int(round(dur * TPS)) - 4)
        ev.append((on, 1, bytes([0x90 | channel, note, max(1, min(127, vel))])))
        ev.append((off, 0, bytes([0x80 | channel, note, 0])))
    ev.sort(key=lambda e: (e[0], e[1]))
    data = b"\x00\xff\x03" + bytes([len(name)]) + name.encode()
    last = 0
    for tick, _, msg in ev:
        data += vlq(tick - last) + msg
        last = tick
    data += b"\x00\xff\x2f\x00"
    return b"MTrk" + len(data).to_bytes(4, "big") + data


def write_midi(path, tracks):
    tempo = int(60_000_000 / BPM)
    meta = (b"\x00\xff\x03\x05Tempo"
            + b"\x00\xff\x51\x03" + tempo.to_bytes(3, "big")
            + b"\x00\xff\x58\x04\x04\x02\x18\x08"
            + b"\x00\xff\x2f\x00")
    chunks = [b"MTrk" + len(meta).to_bytes(4, "big") + meta] + tracks
    head = b"MThd" + (6).to_bytes(4, "big") + (1).to_bytes(2, "big") + len(chunks).to_bytes(2, "big") + TPQ.to_bytes(2, "big")
    with open(path, "wb") as f:
        f.write(head + b"".join(chunks))


T = {
    "drums": midi_track("Drums", midi["drums"], 9),
    "808": midi_track("808 Bass", midi["808"], 0),
    "melody": midi_track("Melody", midi["melody"], 1),
    "pad": midi_track("Pad", midi["pad"], 2),
}
write_midi(os.path.join(OUT, "midi", "UNDER_140bpm_Fm_ALL.mid"), list(T.values()))
for k, v in T.items():
    write_midi(os.path.join(OUT, "midi", f"UNDER_140bpm_Fm_{k}.mid"), [v])

print(f"done. length {N / SR:.1f}s, bars {BARS}, kicks {len(kick_times)}")
