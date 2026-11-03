"""Procedural soundtrack for episode 2 « la coupure » (no voice-over), synced to projets/coupure/shots.json and anim2.js."""
import json, math, os, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'projets', 'coupure', 'shots.json')
shots = {s['id']: s for s in json.load(open(DATA, encoding='utf-8'))['shots']}
DUR = shots['P19']['t0'] + shots['P19']['dur']
N = int(DUR * SR)
rng = np.random.default_rng(7)
L = np.zeros(N); R = np.zeros(N); ML = np.zeros(N); MR = np.zeros(N)   # sound design / music buses
T = lambda id: shots[id]['t0']

def add(sig, t0, gain=1.0, pan=0.0, bus='fx'):
    i0 = int(t0 * SR)
    if i0 >= N or i0 < 0: return
    sig = sig[: N - i0]; gl, gr = gain * math.sqrt((1 - pan) / 2), gain * math.sqrt((1 + pan) / 2)
    a, b = (L, R) if bus == 'fx' else (ML, MR)
    a[i0:i0 + len(sig)] += sig * gl; b[i0:i0 + len(sig)] += sig * gr
def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.01, r=0.05):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR)); e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr)); return e
def band(x, lo=None, hi=None, soft=0.15):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + np.exp(np.clip(-(f - lo) / (lo * soft), -60, 60)))
    if hi: m *= 1 / (1 + np.exp(np.clip((f - hi) / (hi * soft), -60, 60)))
    return np.fft.irfft(X * m, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def norm(x): return x / (np.abs(x).max() + 1e-9)
def brown(d): x = band(np.cumsum(rng.standard_normal(int(d * SR))), 20, None); return norm(x)
def midi(n): return 440 * 2 ** ((n - 69) / 12)
def roomtone(d, hi=220): return norm(band(brown(d), 25, hi)) * env(int(d * SR), 0.2, 0.2)
def hum(d, f=50): t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.5 * np.sin(4 * np.pi * f * t) + 0.25 * np.sin(6 * np.pi * f * t)) / 1.75 * env(len(t), 0.05, 0.05)
def babble(d, lo=280, hi=1500, rate=4.5):
    x = band(noise(d), lo, hi); am = 0.55 + 0.45 * norm(band(rng.standard_normal(len(x)), None, rate, 0.4)); return norm(x * am) * env(len(x), 0.2, 0.2)
def wind(d, lo=120, hi=900, swell=0.25):
    x = band(noise(d), lo, hi); am = 0.55 + 0.45 * norm(band(rng.standard_normal(len(x)), None, swell, 0.5)); return norm(x * am) * env(len(x), 0.5, 0.5)
def thump(d=0.3, f0=60, dec=12):
    t = tt(d); f = f0 * (1 + 0.8 * np.exp(-t * 30)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * dec) * env(len(t), 0.002, 0.03)
def click(d=0.06):
    s = 0.7 * thump(d, 110, 40); n = int(0.01 * SR); s[:n] += band(noise(0.01), 1500, 7000)[:n] * np.exp(-tt(0.01) * 500); return norm(s)
def clac():   # a breaker / a block of the city going dark
    s = 0.9 * thump(0.45, 48, 9); s[: int(0.02 * SR)] += band(noise(0.02), 800, 5000) * np.exp(-tt(0.02) * 220); return norm(s)
def beep(f, d): t = tt(d); return np.sin(2 * np.pi * f * t) * env(len(t), 0.004, 0.01)
def plip():
    t = tt(0.09); f = np.linspace(2600, 1100, len(t)); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 45)
def ting(f=2700):
    t = tt(0.9); return sum(g * np.sin(2 * np.pi * f * k * t) * np.exp(-t * (6 + 4 * k)) for k, g in ((1, 1), (2.76, 0.4), (5.4, 0.2))) / 1.6
def bell_tinkle(n=4):
    t = tt(1.2); s = sum(g * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * 4.5) for f, g in ((2637, 1), (3136, .7), (3951, .5), (5274, .3)))
    out = np.zeros(int(1.8 * SR))
    for k in range(n): i = int(k * 0.09 * SR); out[i:i + len(s)] += s[: len(out) - i] * (1 - 0.15 * k)
    return norm(out)
def horn(d=0.45, f1=410, f2=515):
    t = tt(d); s = np.sign(np.sin(2 * np.pi * f1 * t)) * 0.6 + np.sign(np.sin(2 * np.pi * f2 * t)) * 0.6; return norm(band(s, 250, 2200)) * env(len(t), 0.01, 0.06)
def siren(d):   # French two-tone « pin-pon »
    t = tt(d); f = np.where((t % 1.2) < 0.6, 435.0, 488.0); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.3 * np.sin(4 * np.pi * np.cumsum(f) / SR); return norm(band(s, 300, 2500)) * env(len(t), 0.6, 0.8)
def sit_tones():   # three rising information tones: the call cannot go through
    out = np.zeros(int(1.2 * SR))
    for k, f in enumerate((950, 1400, 1800)): b = beep(f, 0.3); i = int(k * 0.34 * SR); out[i:i + len(b)] += b
    return out
def ringback(d):   # French ring-back tone: 440 Hz, 1.5 s on
    t = tt(d); return np.sin(2 * np.pi * 440 * t) * ((t % 5.0) < 1.5) * env(len(t), 0.01, 0.02)
def knock():
    s = band(noise(0.08), 150, 1400) * np.exp(-tt(0.08) * 60) + 0.8 * thump(0.08, 140, 50); return norm(s)
def creak(d=0.7):
    t = tt(d); f = 180 + 120 * np.sin(2 * np.pi * 0.8 * t) + rng.uniform(-8, 8, len(t)).cumsum() * 0.001
    s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * (0.5 + 0.5 * np.sin(2 * np.pi * 23 * t)); return norm(band(s, 300, 3000)) * env(len(t), 0.05, 0.15)
def step(): s = band(noise(0.12), 80, 900) * np.exp(-tt(0.12) * 35) + 0.5 * thump(0.12, 90, 35); return norm(s)
def whistle(d=0.45):
    t = tt(d); f = 3000 + 180 * np.sin(2 * np.pi * 28 * t); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.25 * band(noise(d), 2500, 5000); return norm(s) * env(len(t), 0.01, 0.05)
def door_thump(): s = 1.0 * thump(0.35, 70, 14) + 0.4 * band(noise(0.35), 200, 2000) * np.exp(-tt(0.35) * 25); return norm(s)
def stall(d=1.0):
    t = tt(d); rate = 14 - 8 * t / d; ph = np.cumsum(rate) / SR; s = band(noise(d), 60, 500) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * ph))); return norm(s) * np.linspace(1, 0, len(t)) ** 0.5
def tvbabble(d): return norm(band(babble(d, 300, 3500, 6), 200, 5000)) * env(int(d * SR), 0.02, 0.01)
def tick(): t = tt(0.03); return band(noise(0.03), 2000, 8000) * np.exp(-t * 300)
def piano(f, d=3.5, vel=1.0):
    t = tt(d); s = np.zeros_like(t)
    for k in range(1, 7): fk = f * k * math.sqrt(1 + 0.0004 * k * k); s += (1 / k ** 1.3) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6)) * np.exp(-t * (0.9 + 0.7 * k))
    return vel * s * env(len(t), 0.004, 0.3) / 2.2
def pad(freqs, d, a=1.4, r=1.8):
    t = tt(d); s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.18, 0.18): ph = rng.uniform(0, 6); s += np.sin(2 * np.pi * (f + det) * t + ph) + 0.22 * np.sin(2 * np.pi * 2 * (f + det) * t + ph)
    return band(s, None, 2200) * env(len(t), a, r) / (len(freqs) * 2.4)

# ---------------- sound design, shot by shot ----------------
# P01: the city hum dies as the wave of blackout sweeps in; "clacs" come closer
add(roomtone(3.0, 400) * np.linspace(1, 0.05, int(3.0 * SR)) ** 1.5, T('P01'), 0.10)
add(babble(3.0, 200, 900, 2) * np.linspace(1, 0, int(3.0 * SR)), T('P01'), 0.035)
for k, t0 in enumerate(np.linspace(0.55, 2.75, 11) ** 1.0): add(clac(), T('P01') + t0, 0.05 + 0.03 * k, rng.uniform(-0.6, 0.6))
# P02: TV and fridge until 19:42 (0.38 s), then a power-down and a battery clock
add(tvbabble(0.38), T('P02'), 0.05, 0.5); add(hum(0.38, 50), T('P02'), 0.03)
t = tt(0.5); add(np.sin(2 * np.pi * np.cumsum(np.linspace(140, 35, len(t))) / SR) * np.exp(-t * 6), T('P02') + 0.38, 0.12); add(clac(), T('P02') + 0.38, 0.22)
for k in range(1, 9): add(tick(), T('P02') + 0.4 + k * 0.5, 0.05 if k % 2 else 0.035, 0.3)
# P03: honks and idling engines at the dead crossroads
add(roomtone(4.0, 140), T('P03'), 0.09)
for t0, f1, f2, pan in ((0.4, 410, 515, -0.4), (1.3, 380, 470, 0.5), (2.3, 440, 560, -0.1), (3.1, 410, 515, 0.6)): add(horn(0.45, f1, f2), T('P03') + t0, 0.05, pan)
# P04: metro stopped, heavy silence, a chime cut short, murmurs
add(roomtone(4.0, 180), T('P04'), 0.05); add(babble(4.0, 220, 1100, 2.0), T('P04'), 0.03)
add(beep(1046, 0.25) * np.exp(-tt(0.25) * 6), T('P04') + 0.3, 0.05); add(beep(784, 0.12) * np.exp(-tt(0.12) * 6), T('P04') + 0.55, 0.05)
# P05: the call rings back once, then the three information tones exactly when the screen shows the failure (anim2: 1.5 s)
add(ringback(1.4), T('P05') + 0.05, 0.035, 0.2); add(sit_tones(), T('P05') + 1.5, 0.06, 0.2)
# P06: the tap coughs air, the last drop lands at 2.05 s (anim2)
add(norm(band(noise(0.7), 1800, 6500)) * np.sin(np.pi * tt(0.7) / 0.7) * (0.6 + 0.4 * np.sin(2 * np.pi * 9 * tt(0.7))), T('P06') + 0.3, 0.05)
add(plip(), T('P06') + 2.05, 0.12); for_ticks = [add(tick(), T('P06') + 0.2 + k * 0.5, 0.03, 0.3) for k in range(8)]
# P07: murmurs, the shop bell when a customer leaves (0.3 s), coins
add(babble(4.0, 250, 1400, 3.5), T('P07'), 0.05); add(bell_tinkle(), T('P07') + 0.3, 0.05, -0.3)
for t0 in (1.5, 1.62, 2.4): add(ting(4200 + rng.uniform(-300, 300)) * np.exp(-tt(0.9) * 6), T('P07') + t0, 0.03, 0.4)
# P08: wind, car doors, an engine that will not start
add(norm(band(noise(4.0), 150, 1000)) * env(int(4 * SR), 0.5, 0.5), T('P08'), 0.04)
add(door_thump(), T('P08') + 0.9, 0.1, 0.4); add(door_thump(), T('P08') + 2.5, 0.08, -0.3); add(stall(1.0), T('P08') + 2.9, 0.08, 0.2)
# P09: generator hum, monitor beeps (1.15 Hz like the screens), the nurse's steps (3.2 steps/s)
add(hum(4.5, 50) * 0.7 + 0.3 * roomtone(4.5, 300), T('P09'), 0.06)
for k in range(5): add(beep(1000, 0.08), T('P09') + 0.2 + k / 1.15, 0.025, -0.5)
for k in range(14): add(step(), T('P09') + 0.15 + k / 3.2, 0.03, 0.05)
# P10: drips, the fridge door creaks
for k in range(10): add(plip() * 0.7, T('P10') + 0.25 + k * 0.38 + rng.uniform(-0.05, 0.05), 0.05, rng.uniform(-0.3, 0.5))
add(creak(0.8), T('P10') + 0.1, 0.035, 0.4)
# P11: cold wind, a fire-engine siren far away
add(wind(4.0, 100, 600, 0.3), T('P11'), 0.08); add(siren(3.2), T('P11') + 0.6, 0.02, -0.6)
# P12: candle, clock, Jeanne's breath
for k in range(9): add(tick(), T('P12') + 0.2 + k * 0.5, 0.03, -0.3)
for t0 in (0.3, 2.5): add(norm(band(noise(0.9), 250, 1400)) * np.sin(np.pi * tt(0.9) / 0.9) ** 2, T('P12') + t0, 0.025)
add(norm(band(noise(4.5), 2000, 9000)) * (rng.random(int(4.5 * SR)) < 0.0015), T('P12'), 0.05)
# P13: three knocks, the door opens (0-0.7 s), Yanis' steps (3 per second while walking)
for k in range(3): add(knock(), T('P13') - 0.55 + k * 0.17, 0.16, 0.6)
add(creak(0.7), T('P13') + 0.02, 0.05, 0.6)
for k in range(7): add(step(), T('P13') + 0.55 + k * 0.33, 0.04, 0.5 - k * 0.06)
# P14: the fridge restarts, the city comes back, "clacs" of light
add(click(), T('P14') + 0.3, 0.12); add(hum(3.6, 50) * np.linspace(0, 1, int(3.6 * SR)), T('P14') + 0.35, 0.03)
add(roomtone(4.0, 400) * np.linspace(0.05, 1, int(4.0 * SR)), T('P14'), 0.09)
for k, t0 in enumerate(np.linspace(0.4, 3.4, 10)): add(clac() * 0.6, T('P14') + t0, 0.05, rng.uniform(-0.6, 0.6))
# P15: one big "clac" when the peninsula goes dark (1.0 s), then a long silence
big = norm(1.0 * thump(1.8, 38, 2.5) + 0.3 * band(noise(1.8), 30, 300) * np.exp(-tt(1.8) * 3)); add(big, T('P15') + 1.0, 0.35); add(clac(), T('P15') + 1.0, 0.2)
# P16: Spanish street: whistle, honks, chatter, a car rolling up to the crossing
add(babble(4.5, 250, 1800, 4.0), T('P16'), 0.06)
for t0 in (0.3, 1.6, 3.1): add(whistle(0.45), T('P16') + t0, 0.05, -0.2)
for t0 in (0.9, 2.6): add(horn(0.35, 460, 580), T('P16') + t0, 0.03, 0.5)
add(roomtone(3.6, 160) * np.interp(np.arange(int(3.6 * SR)), [0, int(2.6 * SR), int(3.6 * SR)], [0.2, 1.0, 0.45]), T('P16') + 0.6, 0.06, 0.3)   # the far car rolls up, then idles at the crossing
# P17: one click per French city going dark (west to east, 0.6-3.6 s), winter wind
add(wind(5.0, 100, 500, 0.2), T('P17'), 0.05)
for k in range(30): add(click(), T('P17') + 0.6 + 3.0 * (k / 29) + rng.uniform(-0.04, 0.04), 0.07, -0.6 + 1.2 * k / 29)
# P18: cups, a warm room
add(roomtone(4.5, 200), T('P18'), 0.03)
for t0 in (0.6, 2.4, 3.3): add(ting(2650 + rng.uniform(-150, 150)), T('P18') + t0, 0.03, rng.uniform(-0.3, 0.3))

# ---------------- music ----------------
MUS_A = T('P02') + 1.2
chords_a = [[45, 52, 57, 60], [41, 48, 57, 60], [48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 57, 60], [38, 50, 53, 57], [40, 52, 56, 59], [45, 52, 57, 60], [40, 52, 56, 59]]
step_a = (T('P14') - MUS_A) / len(chords_a)
for k, ch in enumerate(chords_a):
    t0 = MUS_A + k * step_a
    add(pad([midi(n) for n in ch], step_a + 1.6, 1.4, 1.6), t0, 0.15, bus='mu')
    if k >= 1: [add(piano(midi(n + 12), 3.2, 0.85 - 0.15 * j), t0 + j * 0.45, 0.2, -0.2 + 0.2 * j, bus='mu') for j, n in enumerate(ch[1:])]
for k, t0 in enumerate(np.arange(T('P06'), T('P14') - 0.3, 1.0)): add(thump(0.45, 52, 9), t0, 0.1 + 0.16 * k / 33, bus='mu')
MUS_B = T('P14') + 0.5
chords_b = [[45, 52, 57, 61], [40, 52, 56, 59], [42, 49, 54, 57], [38, 50, 54, 57], [45, 52, 57, 61]]
step_b = (T('P19') - MUS_B) / len(chords_b)
for k, ch in enumerate(chords_b):
    t0 = MUS_B + k * step_b
    add(pad([midi(n) for n in ch], step_b + 1.6, 1.0, 1.6), t0, 0.17, bus='mu')
    [add(piano(midi(n + 12), 3.4, 0.95 - 0.12 * j), t0 + j * 0.38, 0.23, -0.2 + 0.2 * j, bus='mu') for j, n in enumerate(ch[1:])]
end_len = DUR - 0.5 - T('P19')
add(pad([midi(n) for n in [33, 45, 52, 57, 61, 64]], end_len, 0.4, 1.6), T('P19'), 0.22, bus='mu')
[add(piano(midi(n + 12), end_len, 0.9), T('P19') + 0.05 + j * 0.12, 0.22, -0.3 + 0.2 * j, bus='mu') for j, n in enumerate([57, 61, 64, 69])]
# music ducking: cut at the P14 cut (the power comes back), near silence after the Iberian "clac"
duck = np.ones(N)
def ramp(t0, t1, v0, v1): i0, i1 = int(t0 * SR), int(t1 * SR); duck[i0:i1] = np.linspace(v0, v1, max(1, i1 - i0))
ramp(T('P14') - 0.05, T('P14'), 1, 0); duck[int(T('P14') * SR):int(MUS_B * SR)] = 0
ramp(T('P15') + 1.0, T('P15') + 1.1, 1, 0.12); duck[int((T('P15') + 1.1) * SR):int((T('P15') + 2.6) * SR)] = 0.12; ramp(T('P15') + 2.6, T('P15') + 3.6, 0.12, 1)
ramp(T('P05') + 1.4, T('P05') + 1.5, 1, 0.5); duck[int((T('P05') + 1.5) * SR):int((T('P05') + 2.6) * SR)] = 0.5; ramp(T('P05') + 2.6, T('P05') + 3.2, 0.5, 1)
L += ML * duck; R += MR * duck
tail = int((DUR - 0.5) * SR); fade = int(0.6 * SR)
for ch in (L, R): ch[tail - fade:tail] *= np.linspace(1, 0, fade); ch[tail:] = 0
st = np.stack([L, R], 1); st /= max(1e-9, np.abs(st).max()) / 0.89
out = os.path.join(HERE, sys.argv[1] if len(sys.argv) > 1 else 'soundtrack2.wav')
with wave.open(out, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
print('wrote', out, f'{DUR:.1f}s')
