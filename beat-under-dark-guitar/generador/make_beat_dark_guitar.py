#!/usr/bin/env python3
"""UNDER DARK GUITAR — dark underground trap with guitars, 130 BPM, F minor (Phrygian colour).

Everything is synthesised (no samples). Guitars use Karplus-Strong plucked strings.
Outputs: full mix WAV, stems WAV (same length, start at 0, sum == mix), MIDI files.
"""
import os
import sys
import wave
import numpy as np
from scipy import signal, ndimage

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
PREFIX = "UNDER_DARK_GUITAR_130bpm_Fm"
os.makedirs(os.path.join(OUT, "stems"), exist_ok=True)
os.makedirs(os.path.join(OUT, "midi"), exist_ok=True)

SR = 44100
BPM = 130.0
SPB = 60.0 / BPM
STEP = SPB / 4.0                 # one 16th note
BARS = 32
TOTAL_STEPS = BARS * 16
TAIL = 3.5
N = int((TOTAL_STEPS * STEP + TAIL) * SR)
BAR_S = 16 * STEP
rng = np.random.default_rng(666)


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


# --------------------------------------------------------------------------- drums / 808
def make_kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 62 + 170 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    body *= np.minimum(1, t / 0.0008)
    click = bp(rng.standard_normal(n), 1800, 7000) * np.exp(-t / 0.004) * 0.30
    k = np.tanh(2.0 * (body + click))
    return hp(k, 55)


def make_snare():                     # darker: lower band, lower body
    n = int(0.55 * SR)
    t = np.arange(n) / SR
    noise = bp(rng.standard_normal(n), 1200, 7000) * np.exp(-t / 0.12)
    f = 170 + 80 * np.exp(-t / 0.018)
    tone = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.075)
    return np.tanh(1.6 * (0.7 * noise + 0.6 * tone))


def make_clap():
    n = int(0.5 * SR)
    t = np.arange(n) / SR
    env = np.zeros(n)
    for off in (0.0, 0.010, 0.021):
        i = int(off * SR)
        env[i:] += np.exp(-np.arange(n - i) / SR / 0.005) * 0.7
    i = int(0.03 * SR)
    env[i:] += np.exp(-np.arange(n - i) / SR / 0.09) * 0.55
    c = bp(rng.standard_normal(n), 800, 3500) * env
    return np.tanh(1.5 * c)


def make_hat(decay, n_s=0.4, bright=1.0):     # darker hats: tamed top end
    n = int(n_s * SR)
    t = np.arange(n) / SR
    metal = np.zeros(n)
    for f in (205.3, 304.4, 369.6, 522.7, 540.0, 800.0):
        metal += np.sign(np.sin(2 * np.pi * f * 2.0 * t))
    metal = hp(metal / 6, 6500) * 0.5
    noise = hp(rng.standard_normal(n), 7500) * 0.5
    h = (metal + noise * bright) * np.exp(-t / decay)
    h *= np.minimum(1, t / 0.0005)
    return lp(h, 10500)


def make_808(m, dur_s, glide_from=None, glide_t=0.09, drive=2.0):
    rel = 0.012
    dur_s = dur_s - rel
    n = int((dur_s + rel) * SR)
    t = np.arange(n) / SR
    f0 = mtof(m)
    f = np.full(n, f0)
    if glide_from is not None:
        f1 = mtof(glide_from)
        g = np.clip(t / glide_t, 0, 1)
        f = f1 * (f0 / f1) ** g
    f = f * (1 + 0.45 * np.exp(-t / 0.010))
    ph = 2 * np.pi * np.cumsum(f) / SR
    s = np.sin(ph)
    amp = np.exp(-t / (dur_s * 0.95 + 0.14)) * np.minimum(1, t / 0.003)
    amp *= np.where(t < dur_s, 1.0, np.clip(1 - (t - dur_s) / rel, 0, 1))
    out = np.tanh(drive * s * amp) / np.tanh(drive)
    return lp(out, 2200)


# --------------------------------------------------------------------------- guitars (Karplus-Strong)
def ks(f, n, t60=1.5, a=0.5, pick=0.2):
    """Plucked string. Vectorised block recursion; linear-interpolated fractional delay."""
    D = SR / f - 0.5                         # 0.5 = delay of the averaging (damping) filter
    L = int(D)
    frac = D - L
    g = 10 ** (-3.0 / (f * t60))             # per-period loss -> -60 dB after t60
    total = n + L + 4
    y = np.zeros(total)
    exc = signal.lfilter([1 - a], [1, -a], rng.uniform(-1, 1, L + 2))   # dark pick
    k = max(1, int(pick * L))                                           # pick position
    exc2 = exc.copy()
    exc2[k:] -= exc[:-k]
    y[:L + 2] = exc2
    c0, c1, c2 = g * (1 - frac) * 0.5, g * 0.5, g * frac * 0.5
    start = L + 2
    while start < total:
        end = min(start + L, total)
        m = end - start
        y[start:end] = (c0 * y[start - L:start - L + m]
                        + c1 * y[start - L - 1:start - L - 1 + m]
                        + c2 * y[start - L - 2:start - L - 2 + m])
        start = end
    y = hp(y[:n], 45, 1)
    return y / (np.max(np.abs(y)) + 1e-9)


def arp_note(m, vel):
    y = ks(mtof(m), int(2.2 * SR), t60=1.5, a=0.60, pick=0.18)
    y *= np.minimum(1, np.arange(len(y)) / (0.0015 * SR))
    return y * vel


def lead_note(m, dur_s, vel):
    n = int((dur_s + 0.06) * SR)
    y = ks(mtof(m), n, t60=3.2, a=0.35, pick=0.14)
    t = np.arange(n) / SR
    depth = 0.0045 * np.clip((t - 0.25) / 0.35, 0, 1)         # vibrato fades in
    pos = np.clip(np.cumsum(1 + depth * np.sin(2 * np.pi * 5.4 * t)) - 1, 0, n - 1)
    y = np.interp(pos, np.arange(n), y)
    rel = int(0.05 * SR)
    env = np.minimum(1, np.arange(n) / (0.002 * SR))
    env[-rel:] *= np.linspace(1, 0, rel)
    return y * env * vel


# --------------------------------------------------------------------------- other voices
def make_bell(m, dur=1.9, bright=1.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t)
    idx = (1.6 * bright) * np.exp(-t / 0.20) + 0.2
    car = np.sin(2 * np.pi * f * t + idx * mod)
    car += 0.2 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
    env = np.minimum(1, t / 0.003) * np.exp(-t / 0.60)
    return car * env * vel


def make_pad_chord(midis, dur, cutoff, amp=1.0):
    rel = 0.9
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in midis:
        f = mtof(m)
        for cents, side in ((-10, 0), (3, 0), (-3, 1), (10, 1)):
            ff = f * 2 ** (cents / 1200)
            saw = 2 * ((ff * t + rng.random()) % 1.0) - 1
            if side == 0:
                L += saw
            else:
                R += saw
        sub = np.sin(2 * np.pi * f * 0.5 * t) * 0.8
        L += sub
        R += sub
    env = np.clip(t / 0.5, 0, 1) * np.clip((dur + rel - t) / rel, 0, 1)
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


def pingpong(mono, delay_s, fb=0.46, taps=7, fc=2800):
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
    noise = hp(rng.standard_normal(n), 2000) * ramp
    f = 180 * (3200 / 180) ** (t / dur)
    sweep = np.sin(2 * np.pi * np.cumsum(f) / SR) * ramp * 0.35
    return (noise * 0.6 + sweep) * level


def impact(level=1.0):
    n = int(2.4 * SR)
    t = np.arange(n) / SR
    f = 34 + 90 * np.exp(-t / 0.08)
    boom = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.8)
    crash = lp(hp(rng.standard_normal(n), 1200), 7500) * np.exp(-t / 0.6) * 0.3
    return np.tanh(1.4 * (boom + crash)) * level


def downlift(dur=1.8, level=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = 2000 * (150 / 2000) ** (t / dur)
    s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.9) * 0.3
    nz = lp(rng.standard_normal(n), 2500) * np.exp(-t / 0.7) * 0.4
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


CHORDS = [                      # pad voicings (Fm gets the b9 for extra darkness)
    [53, 56, 60, 63, 66],       # Fm7(b9)
    [54, 58, 61, 65],           # Gbmaj7
    [49, 53, 56, 60],           # Dbmaj7
    [51, 55, 58, 62],           # Ebmaj7
]
GUITAR_CH = [                   # guitar voicings, low -> high
    [41, 48, 53, 56, 60, 65],   # F2 C3 F3 Ab3 C4 F4
    [42, 49, 54, 58, 61, 66],   # Gb2 Db3 Gb3 Bb3 Db4 Gb4
    [37, 44, 49, 53, 56, 61],   # Db2 Ab2 Db3 F3 Ab3 Db4
    [39, 46, 51, 55, 58, 62],   # Eb2 Bb2 Eb3 G3 Bb3 D4
]
ARP = [(0, 0), (2, 2), (4, 3), (6, 4), (8, 2), (10, 3), (12, 5), (14, 4)]
ARP_ACC = [1.0, 0.6, 0.7, 0.85, 0.65, 0.6, 0.95, 0.7]
LEAD = [                        # (step, midi, dur_steps) — slow, mournful
    [(0, 72, 8), (8, 73, 4), (12, 72, 4)],
    [(0, 70, 6), (6, 73, 2), (8, 77, 8)],
    [(0, 77, 6), (6, 75, 2), (8, 73, 8)],
    [(0, 74, 8), (8, 70, 4), (12, 67, 4)],
]
BELLS = [                       # played an octave up, very quiet: creepy music-box
    [(0, 72), (6, 72), (8, 73), (14, 68)],
    [(0, 73), (6, 73), (8, 77), (14, 70)],
    [(0, 77), (6, 72), (8, 68), (14, 73)],
    [(0, 70), (6, 70), (8, 67), (14, 72)],
]

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
    sec = section(bar)
    pb = bar % 4
    ev = {}
    if sec == "intro":
        return ev if bar < 3 else {s: (HAT_VEL[s // 2] * 0.4, "c") for s in range(0, 16, 2)}
    if sec == "break":
        for s in range(0, 16, 4):
            ev[s] = (HAT_VEL[s // 2] * 0.4, "c")
        if bar == 15:
            for s in range(8, 16):
                ev[s] = (0.3 + 0.1 * (s - 8), "c")
        return ev
    if sec == "outro":
        fade = 1.0 - (bar - 28) / 4.0
        return {s: (HAT_VEL[s // 2] * 0.45 * fade, "c") for s in range(0, 16, 2)}
    for s in range(0, 16, 2):
        ev[s] = (HAT_VEL[s // 2], "c")
    if sec == "A":
        if pb == 1:
            ev[7] = (0.5, "c"); ev[15] = (0.45, "c")
        if pb == 2:
            ev[3] = (0.45, "c")
        if pb == 3:
            for s, v in ((12, .6), (13, .7), (14, .85), (15, 1.0)):
                ev[s] = (v, "c")
        if bar == 11:
            for k in range(6):
                ev[12 + k * 2 / 3] = (0.5 + 0.1 * k, "c")
    else:
        if pb == 0:
            ev[7] = (0.5, "c"); ev[15] = (0.5, "c")
        if pb == 1:
            ev[3] = (0.45, "c"); ev[7] = (0.55, "c"); ev[10] = (0.7, "o")
        if pb == 2:
            ev[7] = (0.5, "c"); ev[15] = (0.5, "c"); ev[6] = (0.55, "o")
        if pb == 3:
            for s in (12, 14):
                ev.pop(s, None)
            for k in range(6):
                ev[12 + k * 2 / 3] = (0.5 + 0.1 * k, "c")
    return ev


# --------------------------------------------------------------------------- render
kick_s, snare_s, clap_s = make_kick(), make_snare(), make_clap()
hat_c, hat_o = make_hat(0.026), make_hat(0.20, 0.5, 0.8)

drums = stereo()
bass = stereo()
arp_dry = stereo()
lead_dry = stereo()
bell_dry = stereo()
pad = stereo()
fx = stereo()
snare_bus = np.zeros(N)

midi = {"drums": [], "808": [], "arp": [], "lead": [], "bells": [], "pad": []}
kick_times = []


def at(bar, step):
    return (bar * 16 + step) * STEP


for bar in range(BARS):
    sec = section(bar)
    pb = bar % 4
    t0 = bar * BAR_S

    # ---- 808 + kick
    notes = []
    if sec == "A":
        notes = P808_A[pb]
    elif sec == "B":
        notes = P808_B[pb]
    elif sec == "break":
        notes = [(0, 14, [29, 30, 25, 27][pb], None)]
    elif sec == "outro" and bar == 28:
        notes = [(0, 12, 29, None)]
    for step, dur, m, gf in notes:
        put(bass, make_808(m, dur * STEP, gf), at(bar, step), 0.95)
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
            put_mono(snare_bus, clap_s, at(bar, step), 0.42 * v)
            midi["drums"].append((bar * 16 + step, 1, 38, int(100 * v)))
            midi["drums"].append((bar * 16 + step, 1, 39, int(90 * v)))
    if bar == 15:
        for k, step in enumerate(range(8, 16)):
            v = 0.3 + 0.1 * k
            put_mono(snare_bus, snare_s, at(bar, step), 0.7 * v)
            midi["drums"].append((bar * 16 + step, 1, 38, int(100 * v)))

    # ---- hats
    for i, (step, (v, kind)) in enumerate(sorted(hats_for(bar).items())):
        v *= 1.0 + rng.uniform(-0.08, 0.08)
        put(drums, hat_o if kind == "o" else hat_c, at(bar, step), 0.42 * v, 0.18 if i % 2 else -0.18)
        midi["drums"].append((bar * 16 + step, 1, 46 if kind == "o" else 42, max(1, min(127, int(95 * v)))))

    # ---- arpeggiated guitar (let-ring, dark, muffled)
    gvel = {"intro": 0.55 + 0.1 * bar, "A": 0.8, "break": 1.0, "B": 0.85,
            "outro": 0.8 - 0.18 * (bar - 28)}[sec]
    ch = GUITAR_CH[pb]
    for k, (step, idx) in enumerate(ARP):
        v = gvel * ARP_ACC[k] * (1 + rng.uniform(-0.06, 0.06))
        put(arp_dry, arp_note(ch[idx], v), at(bar, step), 0.5, -0.15 if k % 2 else 0.15)
        midi["arp"].append((bar * 16 + step, 2, ch[idx], max(1, min(127, int(88 * v)))))

    # ---- lead guitar (distorted, mono, vibrato)
    if (sec == "A" and bar >= 8) or sec == "B":
        lvel = 0.7 if sec == "A" else 0.95
        for step, m, dur in LEAD[pb]:
            put(lead_dry, lead_note(m, dur * STEP, lvel), at(bar, step), 0.5)
            midi["lead"].append((bar * 16 + step, dur, m, int(100 * lvel)))

    # ---- creepy high bells (very quiet)
    bvel = {"intro": 0.5, "A": 0.3, "break": 0.5, "B": 0.28, "outro": 0.4 - 0.08 * (bar - 28)}[sec]
    for step, m in BELLS[pb]:
        put(bell_dry, make_bell(m + 12, 1.9, 0.6, bvel), at(bar, step), 0.5, 0.35 if step % 2 else -0.35)
        midi["bells"].append((bar * 16 + step, 2, m + 12, int(80 * bvel)))

    # ---- pad (darker cutoffs)
    cutoff = {"intro": 450, "A": 700, "break": 1100, "B": 800, "outro": 400}[sec]
    pamp = {"intro": 0.9, "A": 1.0, "break": 1.1, "B": 1.0, "outro": 0.9 - 0.2 * (bar - 28)}[sec]
    chord = make_pad_chord(CHORDS[pb], BAR_S, cutoff, pamp)
    i = int(t0 * SR)
    n = min(len(chord), N - i)
    pad[i:i + n] += chord[:n]
    for m in CHORDS[pb]:
        midi["pad"].append((bar * 16, 16, m, 70))

    # ---- fx
    if bar in (3, 15):
        put(fx, riser(BAR_S, 0.9), t0, 0.5)
    if bar in (4, 16):
        put(fx, impact(0.9), t0, 0.7)
    if bar in (12, 28):
        put(fx, downlift(1.8, 0.8), t0, 0.5)

# vinyl crackle + hiss
crackle = np.zeros(N)
for p in rng.integers(0, N - 200, int(8 * N / SR)):
    crackle[p] += rng.uniform(0.2, 1.0) * rng.choice([-1, 1])
crackle = hp(crackle, 1200) * 0.35
hiss = lp(hp(rng.standard_normal(N), 3500), 9000) * 0.012
fx[:, 0] += crackle + hiss
fx[:, 1] += np.roll(crackle, 37) * 0.8 + np.roll(hiss, 91)

# dark rumble: slow-breathing brown noise, loud in intro/break/outro, ducked in drops
brown = hp(np.cumsum(rng.standard_normal(N)), 30, 1)
brown = lp(brown, 170, 2)
brown /= np.std(brown)
tt = np.arange(N) / SR
breathe = 0.6 + 0.4 * np.sin(2 * np.pi * tt / (4 * BAR_S))
level_pts = {"intro": 1.0, "A": 0.25, "break": 1.0, "B": 0.25, "outro": 1.0}
xs, ys = [], []
for b in range(BARS):
    xs += [b * BAR_S + 0.01, (b + 1) * BAR_S - 0.01]
    ys += [level_pts[section(b)]] * 2
rumble_env = np.interp(tt, xs, ys)
rumble = brown * breathe * rumble_env * 0.10
fx[:, 0] += rumble
fx[:, 1] += np.roll(rumble, 500)

# ---- buses: reverb / delay / amp sims
room = make_ir(0.9, 0.20, 300, 6500)
hall = make_ir(3.0, 0.9, 200, 5000)

snare_wet = reverb(snare_bus, room)
drums += np.stack([snare_bus, snare_bus], axis=1) + 0.30 * snare_wet

# arp: warm, muffled, slight drive + cab filter, long dotted delay + hall
arp_g = np.tanh(1.5 * arp_dry)
arp_g = hp(lp(arp_g, 2600, 2), 70, 2)
arp_mono = (arp_g[:, 0] + arp_g[:, 1]) * 0.5
guitar_arp = arp_g + 0.35 * reverb(arp_mono, hall) + 0.40 * pingpong(arp_mono, 3 * STEP, 0.48, 7, 2400)

# lead: high-gain distortion + cab, delay on quarter + hall
lead_g = np.tanh(6.0 * lead_dry)
lead_g = hp(lp(lead_g, 3300, 4), 130, 2)
lead_mono = (lead_g[:, 0] + lead_g[:, 1]) * 0.5
guitar_lead = lead_g + 0.30 * reverb(lead_mono, hall) + 0.32 * pingpong(lead_mono, 4 * STEP, 0.42, 6, 2600)

bell_mono = (bell_dry[:, 0] + bell_dry[:, 1]) * 0.5
bells = lp(bell_dry, 5000, 1) + 0.45 * reverb(bell_mono, hall) + 0.35 * pingpong(bell_mono, 3 * STEP, 0.5, 6, 2800)

pad_mono = (pad[:, 0] + pad[:, 1]) * 0.5
padbus = pad + 0.20 * reverb(pad_mono, hall)

duck = np.ones(N)
for kt in kick_times:
    i = int(kt * SR)
    seg = np.arange(min(int(0.35 * SR), N - i)) / SR
    duck[i:i + len(seg)] *= 1 - 0.40 * np.exp(-seg / 0.09)
padbus *= duck[:, None]
guitar_arp *= (0.7 + 0.3 * duck)[:, None]
bells *= (0.6 + 0.4 * duck)[:, None]

stems = {
    "drums": drums * 0.85,
    "808": bass * 0.62,
    "guitarra_arpegio": guitar_arp * 1.5,
    "guitarra_lead": guitar_lead * 0.75,
    "campanas": bells * 0.6,
    "pad": padbus * 0.50,
    "fx": fx * 0.70,
}

mix_raw = sum(stems.values())
print(f"raw mix peak: {np.max(np.abs(mix_raw)):.3f}")
for _n, _x in stems.items():
    print(f"  {_n:17s} raw peak {np.max(np.abs(_x)):.2f}  rms {np.sqrt(np.mean(_x ** 2)):.3f}")

# master: make-up gain + look-ahead limiter; SAME gain curve on mix and every stem
CEIL = 0.84
M = CEIL * 1.02 / np.percentile(np.abs(mix_raw), 99.7)
hot = mix_raw * M
look = int(0.004 * SR)
g = np.minimum(1.0, CEIL / np.maximum(np.max(np.abs(hot), axis=1), 1e-9))
g = ndimage.minimum_filter1d(g, size=2 * look + 1)
g = ndimage.uniform_filter1d(g, size=2 * look + 1)
coef = np.exp(-1.0 / (0.10 * SR))
cur = 1.0
for i in range(N):
    gi = g[i]
    cur = gi if gi < cur else cur + (1 - coef) * (gi - cur)
    g[i] = cur
print(f"makeup x{M:.2f}, max reduction {20 * np.log10(g.min()):.1f} dB")
gs = M * g[:, None]
mix = mix_raw * gs


def write_wav(path, x):
    x16 = (np.clip(x, -1, 1) * 32767).astype("<i2")
    with wave.open(path, "wb") as w:
        w.setnchannels(2)
        w.setsampwidth(2)
        w.setframerate(SR)
        w.writeframes(x16.tobytes())


write_wav(os.path.join(OUT, f"{PREFIX}_MIX.wav"), mix)
for name, x in stems.items():
    write_wav(os.path.join(OUT, "stems", f"{PREFIX}_{name}.wav"), x * gs)


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
    head = (b"MThd" + (6).to_bytes(4, "big") + (1).to_bytes(2, "big")
            + len(chunks).to_bytes(2, "big") + TPQ.to_bytes(2, "big"))
    with open(path, "wb") as f:
        f.write(head + b"".join(chunks))


T = {
    "drums": midi_track("Drums", midi["drums"], 9),
    "808": midi_track("808 Bass", midi["808"], 0),
    "guitarra_arpegio": midi_track("Guitar Arp", midi["arp"], 1),
    "guitarra_lead": midi_track("Guitar Lead", midi["lead"], 2),
    "campanas": midi_track("Bells", midi["bells"], 3),
    "pad": midi_track("Pad", midi["pad"], 4),
}
write_midi(os.path.join(OUT, "midi", f"{PREFIX}_ALL.mid"), list(T.values()))
for k, v in T.items():
    write_midi(os.path.join(OUT, "midi", f"{PREFIX}_{k}.mid"), [v])

print(f"done. length {N / SR:.1f}s, bars {BARS}, kicks {len(kick_times)}")
