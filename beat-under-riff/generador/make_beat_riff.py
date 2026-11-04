#!/usr/bin/env python3
"""UNDER RIFF — dark trap-metal beat: the rhythm IS a palm-muted guitar riff.
130 BPM, F Phrygian. 808 + kick lock to the riff accents. Everything synthesised
(no samples); guitars are Karplus-Strong plucked strings through a high-gain amp sim.
Outputs: full mix WAV, stems WAV (same length, start at 0, sum == mix), MIDI files.
"""
import os
import sys
import wave
import numpy as np
from scipy import signal, ndimage

OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
PREFIX = "UNDER_RIFF_130bpm_Fm"
os.makedirs(os.path.join(OUT, "stems"), exist_ok=True)
os.makedirs(os.path.join(OUT, "midi"), exist_ok=True)

SR = 44100
BPM = 130.0
SPB = 60.0 / BPM
STEP = SPB / 4.0
BARS = 32
TOTAL_STEPS = BARS * 16
TAIL = 3.5
N = int((TOTAL_STEPS * STEP + TAIL) * SR)
BAR_S = 16 * STEP
rng = np.random.default_rng(13)


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
    buf[i:i + n, 0] += sig[:n] * gain * min(1.0, 1.0 - pan)
    buf[i:i + n, 1] += sig[:n] * gain * min(1.0, 1.0 + pan)


def put_mono(buf, sig, t, gain=1.0):
    i = int(round(t * SR))
    if i >= N or i < 0:
        return
    n = min(len(sig), N - i)
    buf[i:i + n] += sig[:n] * gain


def pan_mono(x, pan):
    return np.stack([x * min(1.0, 1.0 - pan), x * min(1.0, 1.0 + pan)], axis=1)


# --------------------------------------------------------------------------- drums / 808
def make_kick():
    n = int(0.45 * SR)
    t = np.arange(n) / SR
    f = 62 + 170 * np.exp(-t / 0.028)
    body = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t / 0.11)
    body *= np.minimum(1, t / 0.0008)
    click = bp(rng.standard_normal(n), 1800, 7000) * np.exp(-t / 0.004) * 0.30
    return hp(np.tanh(2.0 * (body + click)), 55)


def make_snare():
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
    return np.tanh(1.5 * bp(rng.standard_normal(n), 800, 3500) * env)


def make_hat(decay, n_s=0.4, bright=1.0):
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
        f = f1 * (f0 / f1) ** np.clip(t / glide_t, 0, 1)
    f = f * (1 + 0.45 * np.exp(-t / 0.010))
    s = np.sin(2 * np.pi * np.cumsum(f) / SR)
    amp = np.exp(-t / (dur_s * 0.95 + 0.14)) * np.minimum(1, t / 0.003)
    amp *= np.where(t < dur_s, 1.0, np.clip(1 - (t - dur_s) / rel, 0, 1))
    return lp(np.tanh(drive * s * amp) / np.tanh(drive), 2200)


# --------------------------------------------------------------------------- guitars
def ks(f, n, t60=1.5, a=0.5, pick=0.2):
    """Karplus-Strong string, vectorised block recursion, fractional delay by linear interp."""
    D = SR / f - 0.5
    L = int(D)
    frac = D - L
    g = 10 ** (-3.0 / (f * t60))
    total = n + L + 4
    y = np.zeros(total)
    exc = signal.lfilter([1 - a], [1, -a], rng.uniform(-1, 1, L + 2))
    k = max(1, int(pick * L))
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


def riff_note(m, dur_s, mute, vel):
    n = int((dur_s + 0.03) * SR)
    if mute:                                  # palm-muted chug: short, dark, thumpy
        y = ks(mtof(m), n, t60=0.20, a=0.78, pick=0.10)
    else:                                     # open / ringing note
        y = ks(mtof(m), n, t60=1.3, a=0.55, pick=0.12)
    env = np.minimum(1, np.arange(n) / (0.001 * SR))
    rel = min(n, int(0.02 * SR))
    env[-rel:] *= np.linspace(1, 0, rel)
    return y * env * vel


def lead_note(m, dur_s, vel):
    n = int((dur_s + 0.06) * SR)
    y = ks(mtof(m), n, t60=3.2, a=0.35, pick=0.14)
    t = np.arange(n) / SR
    depth = 0.0045 * np.clip((t - 0.25) / 0.35, 0, 1)
    pos = np.clip(np.cumsum(1 + depth * np.sin(2 * np.pi * 5.4 * t)) - 1, 0, n - 1)
    y = np.interp(pos, np.arange(n), y)
    rel = int(0.05 * SR)
    env = np.minimum(1, np.arange(n) / (0.002 * SR))
    env[-rel:] *= np.linspace(1, 0, rel)
    return y * env * vel


def amp_hi(x, pre=5.0):
    """High-gain amp + cab: tight low end, two clipping stages, 4x12-ish roll-off."""
    x = hp(x, 85, 1)
    y = np.tanh(pre * x)
    y = lp(y, 6500, 1)
    y = np.tanh(2.5 * y)
    y = hp(lp(y, 4200, 4), 80, 2)
    return y / (np.percentile(np.abs(y), 99.5) + 1e-9)


# --------------------------------------------------------------------------- other voices
def make_bell(m, dur=1.9, bright=1.0, vel=1.0):
    n = int(dur * SR)
    t = np.arange(n) / SR
    f = mtof(m)
    mod = np.sin(2 * np.pi * f * 3.5 * t)
    idx = (1.6 * bright) * np.exp(-t / 0.20) + 0.2
    car = np.sin(2 * np.pi * f * t + idx * mod)
    car += 0.2 * np.sin(2 * np.pi * f * 2.0 * t) * np.exp(-t / 0.25)
    return car * np.minimum(1, t / 0.003) * np.exp(-t / 0.60) * vel


def make_pad_chord(midis, dur, cutoff, amp=1.0):
    rel = 0.9
    n = int((dur + rel) * SR)
    t = np.arange(n) / SR
    L = np.zeros(n)
    R = np.zeros(n)
    for m in midis:
        f = mtof(m)
        for cents, side in ((-10, 0), (3, 0), (-3, 1), (10, 1)):
            saw = 2 * ((f * 2 ** (cents / 1200) * t + rng.random()) % 1.0) - 1
            if side == 0:
                L += saw
            else:
                R += saw
        sub = np.sin(2 * np.pi * f * 0.5 * t) * 0.8
        L += sub
        R += sub
    env = np.clip(t / 0.5, 0, 1) * np.clip((dur + rel - t) / rel, 0, 1)
    sc = amp / (len(midis) * 2.2)
    return np.stack([lp(L, cutoff, 2) * env * sc, lp(R, cutoff, 2) * env * sc], axis=1)


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


F2 = 41                         # riff root (F2, 87 Hz); offsets are semitones above it
# Riff, 4 bars, 16th grid. kind: R = ringing power chord, P = palm-muted power chord (accent),
#                               p = palm-muted single note (chug)
RIFF = [
    [(0, 0, "R"), (3, 0, "p"), (4, 0, "p"), (6, 1, "p"), (7, 0, "p"), (8, 0, "R"),
     (10, 0, "P"), (11, 0, "p"), (13, 3, "P"), (14, 1, "p"), (15, 0, "p")],
    [(0, 0, "R"), (3, 0, "p"), (4, 0, "p"), (6, 0, "p"), (8, 7, "R"),
     (10, 5, "P"), (12, 3, "P"), (14, 1, "p"), (15, 0, "p")],
    [(0, 0, "R"), (3, 0, "p"), (4, 0, "p"), (6, 1, "p"), (7, 0, "p"), (8, 0, "R"),
     (10, 1, "P"), (11, 1, "p"), (13, 0, "P"), (14, 1, "p"), (15, 1, "p")],
    [(0, 0, "R"), (3, 0, "p"), (6, 0, "p"), (8, 1, "R"),
     (10, 1, "P"), (12, 0, "P"), (13, 0, "p"), (14, 0, "p"), (15, 0, "p")],
]


def riff_events(pb):
    """Expand a riff bar into (step, midi, dur_steps, mute, power, vel)."""
    ev = RIFF[pb]
    out = []
    for k, (s, off, kind) in enumerate(ev):
        nxt = ev[k + 1][0] if k + 1 < len(ev) else 16
        mute = kind in "pP"
        if kind == "R":
            dur = max(2, min(nxt - s, 6))
        elif kind == "P":
            dur = min(nxt - s, 1.25)
        else:
            dur = min(nxt - s, 0.85)
        out.append((s, F2 + off, dur, mute, kind in "RP", 1.0 if kind in "RP" else 0.8))
    return out


def riff_808(pb):
    """808 follows the riff accents (ring + palm-mute power chords), an octave down."""
    acc = [(s, off, kind) for s, off, kind in RIFF[pb] if kind in "RP"]
    notes = []
    prev = None
    for k, (s, off, kind) in enumerate(acc):
        nxt = acc[k + 1][0] if k + 1 < len(acc) else 16
        dur = min(max(nxt - s, 2), 6 if kind == "R" else 3)
        m = F2 - 12 + off
        gf = prev[1] if (prev and prev[1] != m and s - prev[0] <= 5) else None
        notes.append((s, dur, m, gf))
        prev = (s, m)
    return notes


CHORDS = [
    [53, 56, 60, 63, 66],       # Fm7(b9)
    [49, 53, 56, 60],           # Dbmaj7
    [53, 56, 60, 63, 66],       # Fm7(b9)
    [54, 58, 61, 65],           # Gbmaj7
]
LEAD = [                        # (step, midi, dur_steps) — slow, mournful, over the riff
    [(0, 72, 8), (8, 73, 4), (12, 72, 4)],
    [(0, 68, 6), (6, 70, 2), (8, 72, 8)],
    [(0, 73, 6), (6, 72, 2), (8, 70, 8)],
    [(0, 72, 8), (8, 68, 4), (12, 65, 4)],
]
BELLS = [
    [(0, 72), (6, 72), (8, 73), (14, 68)],
    [(0, 73), (6, 73), (8, 77), (14, 70)],
    [(0, 72), (6, 72), (8, 73), (14, 68)],
    [(0, 70), (6, 73), (8, 77), (14, 73)],
]
BREAK_808 = [29, 25, 29, 30]
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
lead_dry = stereo()
bell_dry = stereo()
pad = stereo()
fx = stereo()
snare_bus = np.zeros(N)
riff_A = np.zeros(N)          # distorted double-track, panned left
riff_B = np.zeros(N)          # distorted double-track, panned right
riff_oct = np.zeros(N)        # octave-up layer (second drop only)
riff_clean = np.zeros(N)      # clean muffled version for intro / break / outro

midi = {"drums": [], "808": [], "riff": [], "lead": [], "bells": [], "pad": []}
kick_times = []


def at(bar, step):
    return (bar * 16 + step) * STEP


for bar in range(BARS):
    sec = section(bar)
    pb = bar % 4
    t0 = bar * BAR_S

    # ---- 808 + kick locked to the riff
    notes = []
    if sec in ("A", "B"):
        notes = riff_808(pb)
    elif sec == "break":
        notes = [(0, 14, BREAK_808[pb], None)]
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

    # ---- THE RIFF
    if sec in ("A", "B"):
        mode, rvel = "dist", 1.0
    elif (sec == "intro" and bar >= 2) or sec == "break":
        mode, rvel = "clean", (0.55 if sec == "intro" else 0.85)
    elif sec == "outro":
        mode, rvel = "clean", 0.8 - 0.18 * (bar - 28)
    else:
        mode, rvel = None, 0
    if mode:
        for step, m, dur, mute, power, v in riff_events(pb):
            t = at(bar, step)
            d = dur * STEP
            notes_m = [m, m + 7] if power else [m]
            midi_v = int(110 * v * rvel) if mode == "dist" else int(70 * v * rvel)
            for mm in notes_m:
                midi["riff"].append((bar * 16 + step, dur, mm, max(1, midi_v)))
            if mode == "dist":
                for mm in notes_m:
                    w = 0.9 if mm != m else 1.0
                    put_mono(riff_A, riff_note(mm, d, mute, v * w), t)
                    put_mono(riff_B, riff_note(mm, d, mute, v * w), t + rng.uniform(0.0, 0.006))
                    if sec == "B" and mm == m:
                        put_mono(riff_oct, riff_note(mm + 12, d, mute, v), t)
            else:
                for mm in notes_m:
                    put_mono(riff_clean, riff_note(mm, d * 1.4, mute, v * rvel * (0.9 if mm != m else 1.0)), t)

    # ---- lead guitar (distorted, vibrato) over the riff
    if (sec == "A" and bar >= 8) or sec == "B":
        lvel = 0.7 if sec == "A" else 0.95
        for step, m, dur in LEAD[pb]:
            put(lead_dry, lead_note(m, dur * STEP, lvel), at(bar, step), 0.5)
            midi["lead"].append((bar * 16 + step, dur, m, int(100 * lvel)))

    # ---- creepy high bells
    bvel = {"intro": 0.5, "A": 0.3, "break": 0.5, "B": 0.28, "outro": 0.4 - 0.08 * (bar - 28)}[sec]
    for step, m in BELLS[pb]:
        put(bell_dry, make_bell(m + 12, 1.9, 0.6, bvel), at(bar, step), 0.5, 0.35 if step % 2 else -0.35)
        midi["bells"].append((bar * 16 + step, 2, m + 12, int(80 * bvel)))

    # ---- pad
    cutoff = {"intro": 450, "A": 700, "break": 1100, "B": 800, "outro": 400}[sec]
    pamp = {"intro": 0.9, "A": 0.9, "break": 1.1, "B": 0.9, "outro": 0.9 - 0.2 * (bar - 28)}[sec]
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

# dark rumble (loud in intro / break / outro, ducked in the drops)
brown = lp(hp(np.cumsum(rng.standard_normal(N)), 30, 1), 170, 2)
brown /= np.std(brown)
tt = np.arange(N) / SR
breathe = 0.6 + 0.4 * np.sin(2 * np.pi * tt / (4 * BAR_S))
level_pts = {"intro": 1.0, "A": 0.25, "break": 1.0, "B": 0.25, "outro": 1.0}
xs, ys = [], []
for b in range(BARS):
    xs += [b * BAR_S + 0.01, (b + 1) * BAR_S - 0.01]
    ys += [level_pts[section(b)]] * 2
rumble = brown * breathe * np.interp(tt, xs, ys) * 0.10
fx[:, 0] += rumble
fx[:, 1] += np.roll(rumble, 500)

# ---- buses
room = make_ir(0.9, 0.20, 300, 6500)
hall = make_ir(3.0, 0.9, 200, 5000)

snare_wet = reverb(snare_bus, room)
drums += np.stack([snare_bus, snare_bus], axis=1) + 0.30 * snare_wet

# riff: two distorted takes hard-ish L/R + octave layer in the centre
guitar_riff = (pan_mono(amp_hi(riff_A), -0.75) + pan_mono(amp_hi(riff_B), 0.75)
               + pan_mono(amp_hi(riff_oct), 0.0) * 0.35)
# clean muffled riff: soft clip, dark cab, delay + hall
cl = hp(lp(np.tanh(1.3 * riff_clean), 2200, 2), 80, 2)
guitar_riff += pan_mono(cl, 0.0) + 0.35 * reverb(cl, hall) + 0.30 * pingpong(cl, 3 * STEP, 0.45, 6, 2200)

lead_g = hp(lp(np.tanh(6.0 * lead_dry), 3300, 4), 130, 2)
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
guitar_riff *= (0.85 + 0.15 * duck)[:, None]
bells *= (0.6 + 0.4 * duck)[:, None]

stems = {
    "drums": drums * 0.78,
    "808": bass * 0.62,
    "guitarra_riff": guitar_riff * 0.52,
    "guitarra_lead": guitar_lead * 0.50,
    "campanas": bells * 0.6,
    "pad": padbus * 0.40,
    "fx": fx * 0.70,
}

mix_raw = sum(stems.values())
print(f"raw mix peak: {np.max(np.abs(mix_raw)):.3f}")
for _n, _x in stems.items():
    print(f"  {_n:15s} raw peak {np.max(np.abs(_x)):.2f}  rms {np.sqrt(np.mean(_x ** 2)):.3f}")

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
    "guitarra_riff": midi_track("Guitar Riff", midi["riff"], 1),
    "guitarra_lead": midi_track("Guitar Lead", midi["lead"], 2),
    "campanas": midi_track("Bells", midi["bells"], 3),
    "pad": midi_track("Pad", midi["pad"], 4),
}
write_midi(os.path.join(OUT, "midi", f"{PREFIX}_ALL.mid"), list(T.values()))
for k, v in T.items():
    write_midi(os.path.join(OUT, "midi", f"{PREFIX}_{k}.mid"), [v])

print(f"done. length {N / SR:.1f}s, bars {BARS}, kicks {len(kick_times)}, riff notes {len(midi['riff'])}")
