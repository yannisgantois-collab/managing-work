"""Procedural soundtrack for episode 3 « Et si Paris atteignait 50 °C ? » (no voice-over), synced to projets/canicule/shots.json, scenes3.js and anim3.js."""
import json, math, os, sys, wave
import numpy as np

SR = 48000
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = sys.argv[2] if len(sys.argv) > 2 else os.path.join(HERE, 'projets', 'canicule', 'shots.json')
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


def swift():   # a swift screaming past, the sound of Paris summers
    d = rng.uniform(0.18, 0.3); t = tt(d); f = 5200 + 1400 * np.sin(2 * np.pi * rng.uniform(18, 26) * t) - 900 * t / d
    return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d) ** 2
def metal_tic(): t = tt(0.25); return norm(band(noise(0.25), 1800, 7000) * np.exp(-t * 30) + 0.5 * np.sin(2 * np.pi * 2300 * t) * np.exp(-t * 18))
def zinc_clac():
    m = np.zeros(int(0.4 * SR)); mt = metal_tic(); m[:len(mt)] = mt
    return norm(0.8 * thump(0.4, 70, 10) + 0.6 * band(noise(0.4), 600, 4000) * np.exp(-tt(0.4) * 18) + 0.4 * m)
def fan(d, rot=0.9):
    t = tt(d); w = band(noise(d), 300, 2600); am = 0.65 + 0.35 * np.sin(2 * np.pi * rot / (2 * np.pi) * t * 2 * np.pi / 3)
    return norm(w * am + 0.25 * hum(d, 82)) * env(len(t), 0.2, 0.2)
def buzz(d):
    t = tt(d); f = 210 + 25 * np.sin(2 * np.pi * 3.1 * t) + 15 * np.sin(2 * np.pi * 7.3 * t); s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR))
    return norm(band(s, 150, 3000)) * (0.4 + 0.6 * np.abs(np.sin(2 * np.pi * 0.37 * t))) * env(len(t), 0.1, 0.1)
def screech(d):
    t = tt(d); f = 2400 + 300 * np.sin(2 * np.pi * 0.7 * t) + 80 * np.sin(2 * np.pi * 9 * t); s = np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.6 * band(noise(d), 2000, 6000)
    return norm(s) * (0.3 + 0.7 * np.abs(np.sin(2 * np.pi * 0.4 * t))) * env(len(t), 0.3, 0.3)
def catenary(d): t = tt(d); return norm(hum(d, 50) + 0.4 * band(noise(d), 4000, 9000) * (rng.random(len(t)) < 0.02)) * env(len(t), 0.2, 0.2)
def caw(): t = tt(0.32); f = 620 - 220 * t / 0.32; s = np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)) * np.sin(np.pi * t / 0.32); return norm(band(s, 400, 3200))
def flutter(d=0.6): t = tt(d); return norm(band(noise(d), 300, 3000) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 14 * t)))) * np.exp(-t * 3)
def car_alarm(d): t = tt(d); f = np.where((t % 0.5) < 0.25, 1200.0, 900.0); return norm(band(np.sign(np.sin(2 * np.pi * np.cumsum(f) / SR)), 600, 3000)) * env(len(t), 0.02, 0.1)
def compressors(d): t = tt(d); return norm(sum(hum(d, f0) * (0.6 + 0.4 * np.sin(2 * np.pi * r * t)) for f0, r in ((55, 0.3), (62, 0.21), (71, 0.17))) + 0.5 * band(noise(d), 200, 1800)) * env(len(t), 0.3, 0.3)
def crickets(d):
    t = tt(d); s = np.zeros(len(t))
    for k in range(5):
        f = rng.uniform(4200, 5200); r = rng.uniform(2.5, 4.0); ph = rng.uniform(0, 6)
        s += np.sin(2 * np.pi * f * t) * (np.sin(2 * np.pi * 30 * t) > 0.2) * (np.sin(2 * np.pi * r * t + ph) > 0.3) * rng.uniform(0.4, 1)
    return norm(s) * env(len(t), 0.3, 0.3)
def sprinkler(d): t = tt(d); return norm(band(noise(d), 2500, 9000) * (0.35 + 0.65 * ((t * 9) % 1 < 0.35))) * env(len(t), 0.1, 0.2)
def hiss(d, lo=3000, hi=9000): return norm(band(noise(d), lo, hi)) * env(int(d * SR), 0.15, 0.2)
def radio(d=0.6): return norm(band(babble(d, 500, 2600, 9), 400, 3000) * (0.6 + 0.4 * np.sign(np.sin(2 * np.pi * 11 * tt(d))))) * env(int(d * SR), 0.01, 0.05)
def thunder(d=3.2):
    t = tt(d); crack = band(noise(d), 800, 6000) * np.exp(-t * 9); roll = band(brown(d), 25, 300) * (np.exp(-t * 0.9) * (0.7 + 0.3 * np.sin(2 * np.pi * 1.3 * t)))
    return norm(0.7 * crack + roll) * env(len(t), 0.005, 0.6)
def rain(d, lo=400, hi=9000): t = tt(d); x = band(noise(d), lo, hi); return norm(x * (0.85 + 0.15 * norm(band(rng.standard_normal(len(t)), None, 2, 0.5)))) * env(len(t), 0.2, 0.3)
def phone_trill(d=1.2): t = tt(d); s = (np.sin(2 * np.pi * 900 * t) + np.sin(2 * np.pi * 1100 * t)) * ((t * 20) % 1 < 0.5) * ((t % 1.2) < 0.9); return norm(s) * env(len(t), 0.01, 0.05)
def typing(d):
    s = np.zeros(int(d * SR)); k = tick()
    for i in rng.integers(0, len(s) - len(k), int(d * 9)): s[i:i + len(k)] += k * rng.uniform(0.4, 1)
    return s
def heartbeat(): s = np.zeros(int(0.7 * SR)); a = thump(0.25, 55, 16); s[:len(a)] += a; b = thump(0.25, 50, 16) * 0.7; i = int(0.24 * SR); s[i:i + len(b)] += b; return s
def chirp(): d = rng.uniform(0.08, 0.16); t = tt(d); f = rng.uniform(3500, 5200) + 1500 * t / d * rng.choice([-1, 1]); return np.sin(2 * np.pi * np.cumsum(f) / SR) * np.sin(np.pi * t / d)
def water(d): return norm(band(noise(d), 600, 5000) * (0.7 + 0.3 * norm(band(rng.standard_normal(int(d * SR)), None, 6, 0.5)))) * env(int(d * SR), 0.2, 0.2)

# ---------------- sound design, shot by shot ----------------
# P01: hot wind over the roofs, the zinc ticking as it expands, swifts screaming past
add(wind(3.0, 150, 1200, 0.4), T('P01'), 0.06); add(roomtone(3.0, 300), T('P01'), 0.05)
for t0 in (0.5, 1.4, 2.3): add(metal_tic(), T('P01') + t0, 0.03, rng.uniform(-0.6, 0.6))
for t0 in (0.7, 0.95, 1.8, 2.5): add(swift(), T('P01') + t0, 0.035, rng.uniform(-0.8, 0.8))
# P02: the fan pushing hot air, the zinc clacking, a fly, the notebook fanning
add(fan(4.0), T('P02'), 0.07, 0.3); add(zinc_clac(), T('P02') + 1.2, 0.08, -0.4); add(zinc_clac(), T('P02') + 3.1, 0.06, -0.2)
add(buzz(3.6), T('P02') + 0.2, 0.018, 0.1)
for k in range(5): add(norm(band(noise(0.25), 400, 2500)) * np.sin(np.pi * tt(0.25) / 0.25), T('P02') + 0.3 + k * 0.7, 0.025, -0.1)
# P03: the street slowed by the heat, a bus coming, the pharmacy cross beeping as it switches
add(babble(4.0, 250, 1500, 3.0), T('P03'), 0.04); add(roomtone(4.0, 180) * np.linspace(0.3, 1, int(4.0 * SR)), T('P03'), 0.07, -0.3)
for t0 in (1.6, 3.2): add(beep(2100, 0.06), T('P03') + t0, 0.025, 0.6)
for t0 in (0.4, 2.2): add(swift(), T('P03') + t0, 0.025, rng.uniform(-0.6, 0.6))
# P04: the train creeping on hot rails, the overhead line crackling, crows taking off
add(screech(4.0), T('P04'), 0.03, -0.2); add(catenary(4.0), T('P04'), 0.03); add(roomtone(4.0, 140) * np.linspace(0.5, 1, int(4.0 * SR)), T('P04'), 0.08)
add(flutter(0.8), T('P04') + 1.3, 0.05, 0.2); add(caw(), T('P04') + 1.45, 0.04, 0.3); add(caw(), T('P04') + 1.9, 0.03, -0.2)
# P05: the plant's electric hum drops a tone as the reactors slow down
t = tt(4.0); f = np.where(t < 1.5, 100.0, 100.0 - 18 * np.minimum(1, (t - 1.5) / 1.2)); add(norm(np.sin(2 * np.pi * np.cumsum(f) / SR) + 0.4 * np.sin(4 * np.pi * np.cumsum(f) / SR)) * env(len(t), 0.3, 0.3), T('P05'), 0.05)
add(wind(4.0, 120, 800, 0.3), T('P05'), 0.04)
# P06: an empty schoolyard, the flag flapping, a car alarm far away
add(roomtone(4.0, 200), T('P06'), 0.04); add(car_alarm(2.6), T('P06') + 1.0, 0.012, 0.6)
for k in range(4): add(norm(band(noise(0.3), 300, 2000)) * np.exp(-tt(0.3) * 9), T('P06') + 0.3 + k * 1.14, 0.03, 0.2)
# P07: dozens of compressors humming, a bike freewheeling past
add(compressors(4.0), T('P07'), 0.08); add(hiss(4.0, 1500, 5000), T('P07'), 0.015)
for k in range(40): add(tick(), T('P07') + 0.2 + k * 0.09, 0.03, 0.7 - 1.4 * k / 40)
# P08: a hot night, fans at the windows, a siren far off, a plane
add(fan(4.5), T('P08'), 0.03, -0.5); add(siren(4.5), T('P08'), 0.012, 0.5); add(roomtone(4.5, 120) * np.sin(np.pi * tt(4.5) / 4.5), T('P08'), 0.05, 0.3)
add(tvbabble(4.5), T('P08'), 0.012, -0.3)
# P09: the fan, short breaths, the clock
add(fan(4.0), T('P09'), 0.05, 0.4)
for t0 in (0.4, 1.6, 2.8): add(norm(band(noise(0.8), 250, 1400)) * np.sin(np.pi * tt(0.8) / 0.8) ** 2, T('P09') + t0, 0.03)
for k in range(8): add(tick(), T('P09') + 0.2 + k * 0.5, 0.035 if k % 2 else 0.025, -0.3)
# P10: crickets, murmurs, a sprinkler, steps on the grass
add(crickets(4.0), T('P10'), 0.03); add(babble(4.0, 200, 900, 2), T('P10'), 0.02); add(sprinkler(4.0), T('P10'), 0.02, -0.5)
for k in range(5): add(band(step(), 100, 2500), T('P10') + 0.3 + k * 0.8, 0.03, 0.4)
# P11: an oppressive near-silence at 50 °C: the mist hissing, the cross beeping when it reaches 50
add(roomtone(4.5, 90), T('P11'), 0.05); add(hiss(4.5), T('P11'), 0.03, 0.4); add(beep(2100, 0.08), T('P11') + 2.7, 0.04, 0.6); add(beep(2100, 0.08), T('P11') + 2.82, 0.04, 0.6)
# P12: the siren stops, doors, the stretcher rolling, a radio
add(siren(1.4) * np.linspace(1, 0, int(1.4 * SR)), T('P12'), 0.05, 0.3); add(door_thump(), T('P12') + 0.6, 0.07, 0.4)
add(norm(band(noise(3.0), 80, 600)) * env(int(3.0 * SR), 0.3, 0.5), T('P12') + 0.8, 0.03, 0.3)
add(radio(0.7), T('P12') + 1.5, 0.03, 0.5); add(radio(0.5), T('P12') + 2.9, 0.025, 0.5)
# P13: lightning at 1.2 s, thunder, a downpour on the zinc, steam hissing off the hot metal
add(thunder(2.8), T('P13') + 1.22, 0.3); add(rain(4.0), T('P13'), 0.1); add(hiss(2.2, 4000, 9000), T('P13') + 1.6, 0.03)
for k in range(30): add(metal_tic(), T('P13') + rng.uniform(0, 4), 0.01, rng.uniform(-0.8, 0.8))
# P14: rain heard from inside, drops by the skylight, a long relieved breath
add(band(rain(4.0), 200, 3500), T('P14'), 0.06); add(norm(band(noise(1.4), 200, 1200)) * np.sin(np.pi * tt(1.4) / 1.4) ** 2, T('P14') + 0.4, 0.04)
for k in range(10): add(plip(), T('P14') + 0.3 + k * 0.37, 0.03, rng.uniform(-0.3, 0.3))
# P15: the crisis room: phones, keyboards, calm voices
add(babble(4.5, 250, 1200, 3), T('P15'), 0.03); add(phone_trill(1.2), T('P15') + 0.4, 0.02, -0.5); add(phone_trill(1.2), T('P15') + 2.4, 0.015, 0.4); add(typing(4.4), T('P15'), 0.03, 0.2)
# P16: a slow, low heartbeat under the 2003 count
for k in range(5): add(heartbeat(), T('P16') + 0.2 + k * 0.95, 0.18)
# P17: the pin lands at 0.8 s, then a hot wind rises as the map reddens
add(click(), T('P17') + 0.8, 0.12); add(wind(3.2, 100, 900, 0.5) * np.linspace(0, 1, int(3.2 * SR)), T('P17') + 1.8, 0.07)
# P18: birds, the fountain, the ball bouncing, leaves
add(water(4.5), T('P18'), 0.025, 0.2)
for k in range(14): add(chirp(), T('P18') + rng.uniform(0, 4.3), 0.02, rng.uniform(-0.7, 0.7))
for k in range(1, 5): add(thump(0.15, 140, 30), T('P18') + k * 0.9, 0.06, 0.1)
add(wind(4.5, 400, 3000, 0.6), T('P18'), 0.015)

# ---------------- music ----------------
# act 1-2: a tense minor pad that slowly climbs with the thermometer, a pulse that tightens, crushed to silence at 50 °C (P11)
MUS_A = T('P01') + 0.2
chords_a = [[38, 45, 50, 53], [38, 45, 50, 53], [36, 43, 48, 51], [37, 44, 49, 52], [38, 45, 50, 53], [39, 46, 51, 54], [40, 47, 52, 55], [41, 48, 53, 56], [42, 49, 54, 57], [43, 50, 55, 58]]
step_a = (T('P11') - MUS_A) / len(chords_a)
for k, ch in enumerate(chords_a): add(pad([midi(n) for n in ch], step_a + 1.4, 1.2, 1.4), MUS_A + k * step_a, 0.13 + 0.006 * k, bus='mu')
t0, k = T('P04'), 0   # a pulse that tightens as the heat builds (0.95 s -> 0.6 s between beats)
while t0 < T('P11') - 0.2:
    u = (t0 - T('P04')) / (T('P11') - T('P04')); add(thump(0.4, 50, 10), t0, 0.06 + 0.1 * u, bus='mu'); t0 += 0.95 - 0.35 * u; k += 1
# P12-P13: low unease until the storm
add(pad([midi(n) for n in [38, 45, 50, 53]], T('P13') + 1.2 - T('P12'), 0.6, 0.3), T('P12'), 0.11, bus='mu')
# after the thunder: relief (P14) and the sober reality section (P15-P17)
MUS_B = T('P14') + 0.2
chords_b = [[45, 52, 57, 60], [41, 48, 57, 60], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]]
step_b = (T('P18') - MUS_B) / len(chords_b)
for k, ch in enumerate(chords_b):
    t0 = MUS_B + k * step_b; add(pad([midi(n) for n in ch], step_b + 1.4, 1.0, 1.4), t0, 0.13, bus='mu')
    [add(piano(midi(n + 12), 3.0, 0.8 - 0.15 * j), t0 + j * 0.5, 0.17, -0.2 + 0.2 * j, bus='mu') for j, n in enumerate(ch[1:])]
# P18: hope in major, then the end card resolves
chords_c = [[48, 55, 60, 64], [43, 50, 55, 59], [45, 52, 57, 60], [41, 48, 53, 57]]
step_c = (T('P19') - T('P18')) / len(chords_c)
for k, ch in enumerate(chords_c):
    t0 = T('P18') + k * step_c; add(pad([midi(n) for n in ch], step_c + 1.4, 0.8, 1.4), t0, 0.15, bus='mu')
    [add(piano(midi(n + 12), 3.2, 0.95 - 0.12 * j), t0 + j * 0.3, 0.22, -0.2 + 0.2 * j, bus='mu') for j, n in enumerate(ch[1:])]
end_len = DUR - 0.5 - T('P19')
add(pad([midi(n) for n in [36, 48, 55, 60, 64, 67]], end_len, 0.4, 1.6), T('P19'), 0.2, bus='mu')
[add(piano(midi(n + 12), end_len, 0.9), T('P19') + 0.05 + j * 0.12, 0.22, -0.3 + 0.2 * j, bus='mu') for j, n in enumerate([60, 64, 67, 72])]
# ducking: crushed at 50 °C (P11), cut by the thunder, low under the heartbeat
duck = np.ones(N)
def ramp(t0, t1, v0, v1): i0, i1 = int(t0 * SR), int(t1 * SR); duck[i0:i1] = np.linspace(v0, v1, max(1, i1 - i0))
ramp(T('P11') - 0.3, T('P11') + 0.2, 1, 0.08); duck[int((T('P11') + 0.2) * SR):int(T('P12') * SR)] = 0.08; ramp(T('P12'), T('P12') + 0.6, 0.08, 1)
ramp(T('P13') + 1.15, T('P13') + 1.22, 1, 0); duck[int((T('P13') + 1.22) * SR):int(MUS_B * SR)] = 0
ramp(T('P16'), T('P16') + 0.3, 1, 0.45); duck[int((T('P16') + 0.3) * SR):int((T('P17') - 0.3) * SR)] = 0.45; ramp(T('P17') - 0.3, T('P17'), 0.45, 1)
L += ML * duck; R += MR * duck
tail = int((DUR - 0.5) * SR); fade = int(0.6 * SR)
for ch in (L, R): ch[tail - fade:tail] *= np.linspace(1, 0, fade); ch[tail:] = 0
st = np.stack([L, R], 1); st /= max(1e-9, np.abs(st).max()) / 0.89
out = os.path.join(HERE, sys.argv[1] if len(sys.argv) > 1 else 'soundtrack3.wav')
with wave.open(out, 'wb') as w: w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes((st * 32767).astype('<i2').tobytes())
print('wrote', out, f'{DUR:.1f}s')
