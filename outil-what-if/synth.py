"""Procedural soundtrack for the 78.5 s What if (no voice-over): music bed + sound design, synced to shots.json."""
import json, math, os, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
shots = {s['id']: s for s in json.load(open(os.path.join(HERE, 'shots.json'), encoding='utf-8'))['shots']}
DUR = shots['P19']['t0'] + shots['P19']['dur']
N = int(DUR * SR)
rng = np.random.default_rng(42)
L = np.zeros(N); R = np.zeros(N)
T = lambda id: shots[id]['t0']

def add(sig, t0, gain=1.0, pan=0.0):
    i0 = int(t0 * SR)
    if i0 >= N: return
    sig = sig[: N - i0]
    gl, gr = gain * math.sqrt((1 - pan) / 2), gain * math.sqrt((1 + pan) / 2)
    L[i0:i0 + len(sig)] += sig * gl; R[i0:i0 + len(sig)] += sig * gr

def tt(d): return np.arange(int(d * SR)) / SR
def env(n, a=0.01, r=0.05):
    e = np.ones(n); na, nr = max(1, int(a * SR)), max(1, int(r * SR))
    e[:na] = np.linspace(0, 1, na); e[-nr:] = np.minimum(e[-nr:], np.linspace(1, 0, nr)); return e
def band(x, lo=None, hi=None, soft=0.15):
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR); m = np.ones_like(f)
    if lo: m *= 1 / (1 + np.exp(np.clip(-(f - lo) / (lo * soft), -60, 60)))
    if hi: m *= 1 / (1 + np.exp(np.clip((f - hi) / (hi * soft), -60, 60)))
    return np.fft.irfft(X * m, len(x))
def noise(d): return rng.standard_normal(int(d * SR))
def brown(d):
    x = band(np.cumsum(rng.standard_normal(int(d * SR))), 20, None); return x / (np.abs(x).max() + 1e-9)
def norm(x): return x / (np.abs(x).max() + 1e-9)
def midi(n): return 440 * 2 ** ((n - 69) / 12)

# ---------------- instruments ----------------
def piano(f, d=3.5, vel=1.0):
    t = tt(d); s = np.zeros_like(t)
    for k in range(1, 7):
        fk = f * k * math.sqrt(1 + 0.0004 * k * k)
        s += (1 / k ** 1.3) * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6)) * np.exp(-t * (0.9 + 0.7 * k))
    s *= env(len(t), 0.004, 0.3); return vel * s / 2.2
def pad(freqs, d, a=1.4, r=1.8):
    t = tt(d); s = np.zeros_like(t)
    for f in freqs:
        for det in (-0.18, 0.18):
            ph = rng.uniform(0, 6)
            s += np.sin(2 * np.pi * (f + det) * t + ph) + 0.22 * np.sin(2 * np.pi * 2 * (f + det) * t + ph)
    s = band(s, None, 2200) * env(len(t), a, r); return s / (len(freqs) * 2.4)
def thump(d=0.5, f0=58):
    t = tt(d); f = f0 * (1 + 0.6 * np.exp(-t * 30)); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 9) * env(len(t), 0.002, 0.05)
def alarm(d):  # twin-bell alarm clock: hammer at ~22 Hz alternating two bells
    out = np.zeros(int(d * SR)); hit = tt(0.06)
    bells = [[2610, 3480, 4790, 6120], [2760, 3650, 5010, 6400]]
    for k, t0 in enumerate(np.arange(0, d, 1 / 22.5)):
        b = bells[k % 2]; s = sum(np.sin(2 * np.pi * f * hit + rng.uniform(0, 6)) / (1 + j * 0.6) for j, f in enumerate(b))
        s = s * np.exp(-hit * 55) + 0.25 * band(noise(0.06), 2000, 9000) * np.exp(-hit * 120)
        i = int(t0 * SR); out[i:i + len(s)] += s[: len(out) - i]
    return norm(out) * env(len(out), 0.005, 0.03)
def bell_tinkle(n=4):
    t = tt(1.2); s = np.zeros_like(t)
    for f, g in ((2637, 1), (3136, .7), (3951, .5), (5274, .3)): s += g * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * 4.5)
    out = np.zeros(int(1.8 * SR))
    for k in range(n): i = int(k * 0.09 * SR); out[i:i + len(s)] += s[: len(out) - i] * (1 - 0.15 * k)
    return norm(out)
def cowbell():
    t = tt(1.6); s = sum(g * np.sin(2 * np.pi * f * t + rng.uniform(0, 6)) * np.exp(-t * dcy) for f, g, dcy in ((540, 1, 3), (800, .6, 4), (1255, .4, 6), (1890, .2, 8)))
    return norm(s) * env(len(t), 0.002, 0.2)
def beep(f, d):
    t = tt(d); return np.sin(2 * np.pi * f * t) * env(len(t), 0.004, 0.01)
def click():
    s = 0.6 * thump(0.08, 90); n = int(0.012 * SR); s[:n] += band(noise(0.012), 1200, 6000)[:n] * np.exp(-tt(0.012)[:n] * 400); return norm(s)
def chirp_cricket(d):
    out = np.zeros(int(d * SR)); t3 = tt(0.016)
    p = np.sin(2 * np.pi * 4650 * t3) * np.sin(np.pi * t3 / 0.016)
    t0 = rng.uniform(0, 0.3)
    while t0 < d - 0.2:
        for k in range(3):
            i = int((t0 + k * 0.032) * SR); out[i:i + len(p)] += p[: len(out) - i]
        t0 += rng.uniform(0.55, 0.85)
    return out
def babble(d, lo=280, hi=1600, rate=4.5):
    x = band(noise(d), lo, hi); am = band(rng.standard_normal(len(x)), None, rate, 0.4); am = 0.55 + 0.45 * norm(am)
    return norm(x * am)
def wind(d, lo=120, hi=900, swell=0.25):
    x = band(noise(d), lo, hi); am = band(rng.standard_normal(len(x)), None, swell, 0.5); am = 0.6 + 0.4 * norm(am)
    return norm(x * am) * env(len(x), 0.6, 0.6)
def rain(d):
    x = band(noise(d), 900, 9000) * 0.6
    for _ in range(int(d * 40)):
        i = rng.integers(0, len(x) - 200); x[i:i + 200] += band(noise(200 / SR), 2500, 9000)[:200] * np.exp(-np.arange(200) / 30) * rng.uniform(0.5, 1.5)
    return norm(x) * env(len(x), 0.3, 0.4)
def roomtone(d, hi=220):
    return norm(band(brown(d), 25, hi)) * env(int(d * SR), 0.2, 0.2)
def hum(d, f=100):
    t = tt(d); return (np.sin(2 * np.pi * f * t) + 0.4 * np.sin(2 * np.pi * 2 * f * t) + 0.2 * np.sin(2 * np.pi * 3 * f * t)) / 1.6 * env(len(t), 0.1, 0.1)

# ---------------- sound design (shot by shot) ----------------
ALARM_STOP = T('P03') + 0.6           # the alarm dies in P03, then 1 s of total silence
add(alarm(ALARM_STOP), 0.0, 0.42, 0.25)
add(chirp_cricket(ALARM_STOP) * env(int(ALARM_STOP * SR), 0.3, 0.4), 0.0, 0.05, -0.5)
add(chirp_cricket(ALARM_STOP), 0.4, 0.035, 0.6)
add(roomtone(ALARM_STOP, 160), 0.0, 0.03)
# P04 barn: room tone + chain clinks
add(roomtone(4.0, 260), T('P04'), 0.07)
for k, t0 in enumerate([0.6, 1.9, 3.1]):
    tk = tt(0.4); s = sum(np.sin(2 * np.pi * f * tk + rng.uniform(0, 6)) * np.exp(-tk * 12) / (j + 1) for j, f in enumerate((2120, 3390, 5210)))
    add(norm(s), T('P04') + t0, 0.05, -0.3 + 0.3 * k)
# P05 countryside: wind, birds, trucks approaching the camera
add(wind(4.0, 150, 1200), T('P05'), 0.07)
for _ in range(7):
    tb = tt(0.07); f = np.linspace(rng.uniform(3000, 3800), rng.uniform(4800, 6000), len(tb)); s = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * tb / 0.07)
    add(s, T('P05') + rng.uniform(0.2, 3.6), 0.04, rng.uniform(-0.7, 0.7))
tr = roomtone(4.0, 140) + 0.5 * hum(4.0, 46); tr = norm(tr) * np.linspace(0.3, 1.0, len(tr)) ** 1.5
add(tr, T('P05'), 0.12, 0.35)
# P06 supermarket: babble, scanner beeps, fluorescent hum
add(babble(4.0), T('P06'), 0.08)
add(hum(4.0, 100), T('P06'), 0.012)
for t0 in (0.7, 1.9, 3.2): add(beep(2830, 0.09), T('P06') + t0, 0.035, 0.5)
# P07 wholesale hall: big room tone, hum, distant reversing beeps with echo
add(roomtone(4.0, 400), T('P07'), 0.06); add(hum(4.0, 50), T('P07'), 0.02)
for k in range(5):
    b = beep(1040, 0.35); add(b, T('P07') + 0.4 + k * 0.7, 0.02, -0.4); add(b, T('P07') + 0.55 + k * 0.7, 0.008, 0.4)
# P08 market stall: sparse murmur
add(babble(4.5, 250, 1300, 3.0), T('P08'), 0.045)
# P09-P10 bakery and food bank in the rain: rain, door bell, footsteps
add(rain(8.0), T('P09'), 0.055)
add(bell_tinkle(), T('P09') + 0.8, 0.05, -0.2)
add(babble(4.0, 220, 1100, 2.5), T('P09'), 0.025)
for k in range(7): add(thump(0.12, 120) * 0.6, T('P10') + 0.3 + k * 0.52, 0.06, 0.2)
# P11 wheat: wind through the field
add(wind(4.0, 400, 3200, 0.35), T('P11'), 0.07)
# P12 park: shovels + distant city
add(roomtone(4.5, 300), T('P12'), 0.05)
for t0 in (0.5, 1.6, 2.4, 3.5):
    s = band(noise(0.28), 1800, 5500) * np.sin(np.pi * tt(0.28) / 0.28); add(norm(s), T('P12') + t0, 0.03, rng.uniform(-0.5, 0.5))
# P13 fallow: wind + insects
add(wind(4.0, 150, 900, 0.2), T('P13'), 0.06)
ti = tt(4.0); add(np.sin(2 * np.pi * 6100 * ti) * (0.5 + 0.5 * np.sin(2 * np.pi * 115 * ti)) * env(len(ti), 0.5, 0.5), T('P13'), 0.008, 0.4)
# P14 the same alarm, stopped by Hélène: ring -> click -> silence
CLICK = T('P14') + 1.0                 # same instant as P14_CLICK in anim.js
add(roomtone(4.0, 160), CLICK + 0.1, 0.02)
# P15 barn at dawn: milking pump rhythm
for k in range(4): add(band(noise(0.35), 300, 1500) * np.sin(np.pi * tt(0.35) / 0.35), T('P15') + 0.4 + k * 1.05, 0.03)
add(roomtone(4.5, 220), T('P15'), 0.04)
# P16 gate at sunset: wind + distant cow bells
add(wind(4.5, 120, 700, 0.2), T('P16'), 0.05)
for t0, pan in ((0.6, -0.6), (1.7, -0.5), (2.9, -0.7), (3.8, -0.4)): add(cowbell(), T('P16') + t0, 0.025, pan)
# P17 valley: a click for every farm light that goes out (same timing as the picture)
n_prev = 0
for i in range(int(5.0 * 30)):
    t = i / 30; n = int(34 * max(0.0, min(1.0, (t - 0.35) / (5.0 - 0.9))) ** 1.35 + 1e-6)
    if n > n_prev: add(click(), T('P17') + t, 0.09, rng.uniform(-0.5, 0.5)); n_prev = n
ti = tt(9.5); add(norm(np.sin(2 * np.pi * 55 * ti) + 0.5 * np.sin(2 * np.pi * 82.4 * ti)) * env(len(ti), 1.0, 2.5), T('P17'), 0.06)

# ---------------- music ----------------
MUS_A = ALARM_STOP + 1.0                   # first piano note after the second of silence
chords_a = [[45, 52, 57, 60], [41, 48, 57, 60], [48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 57, 60], [38, 50, 53, 57], [40, 52, 56, 59], [45, 52, 57, 60], [40, 52, 56, 59]]
step = (T('P14') - MUS_A) / len(chords_a)
for k, ch in enumerate(chords_a):
    t0 = MUS_A + k * step
    add(pad([midi(n) for n in ch], step + 1.6, 1.2, 1.6), t0, 0.16)
    for j, n in enumerate(ch[1:]): add(piano(midi(n + 12), 3.2, 0.9 - 0.15 * j), t0 + j * 0.42, 0.22, -0.2 + 0.2 * j)
for k, t0 in enumerate(np.arange(T('P06'), T('P14') - 0.2, 1.0)):   # heartbeat pulse under act 2
    add(thump(0.45, 52), t0, 0.12 + 0.18 * k / 33)
ti = tt(T('P14') - T('P10')); add(np.sin(2 * np.pi * 880 * ti + 0.02 * np.sin(2 * np.pi * 5.2 * ti) * 40) * np.linspace(0, 1, len(ti)) ** 2, T('P10'), 0.03)
# hard cut of the music at the P14 cut (the alarm takes over)
cut = int(T('P14') * SR); fade = int(0.04 * SR)
for ch in (L, R): ch[cut - fade:cut] *= np.linspace(1, 0, fade); ch[cut:int(CLICK * SR)] = 0
add(alarm(1.0), T('P14'), 0.36, 0.25); add(click(), CLICK, 0.25, 0.25)
# act 3 in A major, resolving on the end card
MUS_B = CLICK + 0.5
chords_b = [[45, 52, 57, 61], [40, 52, 56, 59], [42, 49, 54, 57], [38, 50, 54, 57], [45, 52, 57, 61]]
step = (T('P19') - MUS_B) / len(chords_b)
for k, ch in enumerate(chords_b):
    t0 = MUS_B + k * step
    add(pad([midi(n) for n in ch], step + 1.6, 1.0, 1.6), t0, 0.18)
    for j, n in enumerate(ch[1:]): add(piano(midi(n + 12), 3.4, 0.95 - 0.12 * j), t0 + j * 0.38, 0.24, -0.2 + 0.2 * j)
end_len = DUR - 0.5 - T('P19')
add(pad([midi(n) for n in [33, 45, 52, 57, 61, 64]], end_len, 0.4, 1.6), T('P19'), 0.22)
for j, n in enumerate([57, 61, 64, 69]): add(piano(midi(n + 12), end_len, 0.9), T('P19') + 0.05 + j * 0.12, 0.22, -0.3 + 0.2 * j)
# last half second of silence, then the loop back to the alarm
tail = int((DUR - 0.5) * SR); fade = int(0.6 * SR)
for ch in (L, R): ch[tail - fade:tail] *= np.linspace(1, 0, fade); ch[tail:] = 0
# the silent second after the first alarm
s0, s1 = int(ALARM_STOP * SR), int(MUS_A * SR)
for ch in (L, R): ch[s0:s1] = 0

st = np.stack([L, R], 1); st /= max(1e-9, np.abs(st).max()) / 0.89
out = os.path.join(HERE, sys.argv[1] if len(sys.argv) > 1 else 'soundtrack.wav')
with wave.open(out, 'wb') as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
print('wrote', out, f'{DUR:.1f}s')
