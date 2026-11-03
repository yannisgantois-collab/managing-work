#!/usr/bin/env python3
"""Génère les sons ASMR originaux du jeu (fichiers .wav dans assets/sounds).

Les sons sont synthétisés de zéro (aucun échantillon externe) : ils sont donc
libres de droits et tu peux les téléverser sur Roblox sans souci.

Utilisation (depuis le dossier steal-a-keyboard) :
    python3 tools/generate_sounds.py
"""

import math
import os
import random
import struct
import wave

RATE = 44100
OUT_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "assets", "sounds")
rng = random.Random(1234)


def blank(seconds):
    return [0.0] * int(seconds * RATE)


def add_mode(buf, start, freq, amp, tau, glide=0.0, phase=0.0):
    """Ajoute une résonance amortie (sinusoïde qui décroît) : le "corps" du son."""
    first = int(start * RATE)
    for i in range(first, len(buf)):
        t = (i - first) / RATE
        env = math.exp(-t / tau)
        if env < 1e-4:
            break
        f = freq * (1.0 - glide * (1.0 - math.exp(-t / 0.02)))
        buf[i] += amp * env * math.sin(2 * math.pi * f * t + phase)


def add_sweep(buf, start, f0, f1, sweep_time, amp, tau, attack=0.001):
    """Sinus dont la fréquence glisse de f0 à f1 (bulles, gouttes, pops)."""
    first = int(start * RATE)
    phase = 0.0
    for i in range(first, len(buf)):
        t = (i - first) / RATE
        k = min(t / sweep_time, 1.0)
        f = f0 * (f1 / f0) ** k
        phase += 2 * math.pi * f / RATE
        env = min(t / attack, 1.0) * math.exp(-t / tau)
        if t > attack and env < 1e-4:
            break
        buf[i] += amp * env * math.sin(phase)


def add_noise(buf, start, duration, amp, tau, lowpass=None, highpass=None):
    """Petit souffle de bruit filtré : l'impact du keycap."""
    first = int(start * RATE)
    last = min(len(buf), first + int(duration * RATE))
    lp_state = 0.0
    hp_prev_in = 0.0
    hp_state = 0.0
    lp_a = 1.0 if lowpass is None else 1.0 - math.exp(-2 * math.pi * lowpass / RATE)
    hp_a = 0.0 if highpass is None else math.exp(-2 * math.pi * highpass / RATE)
    for i in range(first, last):
        t = (i - first) / RATE
        x = rng.uniform(-1.0, 1.0)
        lp_state += lp_a * (x - lp_state)
        y = lp_state
        if highpass is not None:
            hp_state = hp_a * (hp_state + y - hp_prev_in)
            hp_prev_in = y
            y = hp_state
        buf[i] += amp * math.exp(-t / tau) * y


def finish(buf, peak=0.9, fade_out=0.006):
    """Petits fondus pour éviter les "clics" parasites, puis normalisation."""
    n = len(buf)
    fade_in = int(0.0003 * RATE)
    for i in range(min(fade_in, n)):
        buf[i] *= i / fade_in
    fo = int(fade_out * RATE)
    for i in range(max(0, n - fo), n):
        buf[i] *= (n - i) / fo
    top = max(1e-9, max(abs(v) for v in buf))
    return [v * peak / top for v in buf]


def save(name, buf):
    os.makedirs(OUT_DIR, exist_ok=True)
    path = os.path.join(OUT_DIR, name)
    with wave.open(path, "wb") as w:
        w.setnchannels(1)
        w.setsampwidth(2)
        w.setframerate(RATE)
        frames = b"".join(struct.pack("<h", int(max(-1.0, min(1.0, v)) * 32767)) for v in buf)
        w.writeframes(frames)
    print(f"  {name:20s} {len(buf) / RATE * 1000:5.0f} ms")


# ---------------------------------------------------------------------------
# ⌨️ Les 5 profils de touches (ceux de la vidéo) + le relâchement
# ---------------------------------------------------------------------------
def key_thocky():
    b = blank(0.17)
    add_noise(b, 0, 0.004, 0.12, 0.0009, lowpass=2200, highpass=600)
    for f, a, tau in ((290, 1.0, 0.030), (470, 0.6, 0.021), (780, 0.35, 0.013), (1250, 0.18, 0.008), (2100, 0.05, 0.004)):
        add_mode(b, 0.0005, f, a, tau, glide=0.03, phase=rng.random() * 6.28)
    return finish(b, 0.92)


def key_clicky():
    b = blank(0.13)
    add_noise(b, 0, 0.0015, 0.6, 0.0004, highpass=2500)
    add_mode(b, 0, 4300, 0.7, 0.003)
    add_mode(b, 0, 6100, 0.3, 0.002)
    t2 = 0.014
    add_noise(b, t2, 0.002, 0.35, 0.0006, highpass=1500)
    add_mode(b, t2, 2600, 0.6, 0.005)
    add_mode(b, t2, 900, 0.42, 0.010)
    add_mode(b, t2, 450, 0.26, 0.014)
    return finish(b, 0.85)


def key_bubble():
    b = blank(0.13)
    add_noise(b, 0, 0.0012, 0.25, 0.0004, highpass=3000)
    add_sweep(b, 0.0005, 1150, 420, 0.026, 1.0, 0.022)
    add_mode(b, 0.001, 260, 0.3, 0.015)
    return finish(b, 0.85)


def key_honey():
    b = blank(0.15)
    add_noise(b, 0, 0.005, 0.1, 0.0015, lowpass=1500)
    for f, a, tau in ((420, 0.85, 0.017), (690, 0.5, 0.012), (1150, 0.25, 0.007), (240, 0.35, 0.02)):
        add_mode(b, 0.0012, f, a, tau, glide=0.015, phase=rng.random() * 6.28)
    return finish(b, 0.88)


def key_water():
    b = blank(0.19)
    add_sweep(b, 0, 600, 1900, 0.035, 1.0, 0.030, attack=0.0005)
    add_mode(b, 0.004, 2600, 0.15, 0.010)
    add_noise(b, 0, 0.001, 0.1, 0.0003, highpass=4000)
    return finish(b, 0.82)


def key_release():
    b = blank(0.06)
    add_noise(b, 0, 0.001, 0.5, 0.0003, highpass=3000)
    add_mode(b, 0, 3200, 0.5, 0.0025)
    add_mode(b, 0, 1400, 0.25, 0.004)
    return finish(b, 0.5)


# ---------------------------------------------------------------------------
# ✨ Effets
# ---------------------------------------------------------------------------
def pluck(b, start, freq, amp=1.0, tau=0.12):
    add_mode(b, start, freq, amp, tau)
    add_mode(b, start, freq * 2, amp * 0.25, tau * 0.6)


def fx_collect():
    b = blank(0.5)
    add_noise(b, 0, 0.002, 0.3, 0.0005, highpass=2500)
    add_mode(b, 0, 3400, 0.3, 0.003)
    add_noise(b, 0.03, 0.002, 0.3, 0.0005, highpass=2500)
    add_mode(b, 0.03, 3600, 0.3, 0.003)
    pluck(b, 0.05, 1318.5, 0.8, 0.12)
    pluck(b, 0.10, 1975.5, 0.7, 0.14)
    add_mode(b, 0.10, 2637, 0.25, 0.08)
    return finish(b, 0.8)


def fx_pop():
    b = blank(0.22)
    add_noise(b, 0, 0.008, 0.2, 0.003, lowpass=800)
    add_sweep(b, 0.002, 520, 160, 0.06, 1.0, 0.04)
    return finish(b, 0.85)


def fx_alarm():
    b = blank(0.75)
    step = 0.12
    t = 0.0
    k = 0
    while t < 0.72:
        f = 880 if k % 2 == 0 else 660
        first = int(t * RATE)
        for i in range(first, min(len(b), first + int(step * RATE))):
            tt = (i - first) / RATE
            env = min(tt / 0.005, 1.0) * min((step - tt) / 0.01, 1.0)
            s = math.sin(2 * math.pi * f * tt) + 0.3 * math.sin(2 * math.pi * 3 * f * tt)
            b[i] += 0.6 * env * s
        t += step
        k += 1
    return finish(b, 0.75)


def fx_deposit():
    b = blank(0.45)
    for i, f in enumerate((1046.5, 1318.5, 1568.0)):
        pluck(b, 0.06 * i, f, 0.8, 0.09)
    add_mode(b, 0, 220, 0.4, 0.03)
    return finish(b, 0.8)


def fx_slap():
    b = blank(0.28)
    add_mode(b, 0, 120, 0.55, 0.04)
    for _ in range(9):
        start = rng.uniform(0, 0.09)
        add_noise(b, start, 0.0012, 0.4, 0.0004, highpass=2000)
        add_mode(b, start, rng.uniform(2200, 4200), rng.uniform(0.25, 0.5), 0.003)
    return finish(b, 0.9)


def fx_lock():
    b = blank(0.4)
    add_mode(b, 0, 180, 0.8, 0.025)
    add_noise(b, 0, 0.003, 0.4, 0.001, lowpass=3000)
    add_mode(b, 0.05, 90, 0.9, 0.04)
    add_noise(b, 0.05, 0.004, 0.4, 0.0015, lowpass=2000)
    add_mode(b, 0.05, 2200, 0.25, 0.06)
    return finish(b, 0.85)


def fx_notify():
    b = blank(0.32)
    pluck(b, 0, 880, 0.7, 0.09)
    pluck(b, 0.09, 1318.5, 0.6, 0.1)
    return finish(b, 0.6)


def fx_rare():
    b = blank(0.95)
    for i, f in enumerate((1046.5, 1318.5, 1568.0, 2093.0, 2637.0)):
        pluck(b, 0.07 * i, f, 0.7, 0.2)
    for _ in range(12):
        add_mode(b, rng.uniform(0.2, 0.6), rng.uniform(3000, 5000), 0.08, 0.05)
    return finish(b, 0.75)


def fx_error():
    b = blank(0.32)
    for start, f in ((0, 330), (0.11, 247)):
        add_mode(b, start, f, 0.8, 0.08)
        add_mode(b, start, f * 3, 0.2, 0.05)
    return finish(b, 0.7)


def fx_upgrade():
    b = blank(0.65)
    add_sweep(b, 0, 400, 1600, 0.25, 0.6, 0.18, attack=0.01)
    pluck(b, 0.25, 1568.0, 0.8, 0.18)
    pluck(b, 0.25, 2093.0, 0.6, 0.2)
    return finish(b, 0.8)


SOUNDS = {
    "key_thocky.wav": key_thocky,
    "key_clicky.wav": key_clicky,
    "key_bubble.wav": key_bubble,
    "key_honey.wav": key_honey,
    "key_water.wav": key_water,
    "key_release.wav": key_release,
    "fx_collect.wav": fx_collect,
    "fx_pop.wav": fx_pop,
    "fx_alarm.wav": fx_alarm,
    "fx_deposit.wav": fx_deposit,
    "fx_slap.wav": fx_slap,
    "fx_lock.wav": fx_lock,
    "fx_notify.wav": fx_notify,
    "fx_rare.wav": fx_rare,
    "fx_error.wav": fx_error,
    "fx_upgrade.wav": fx_upgrade,
}

if __name__ == "__main__":
    print(f"Génération des sons dans {OUT_DIR}")
    for filename, make in SOUNDS.items():
        save(filename, make())
