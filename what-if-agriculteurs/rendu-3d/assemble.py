"""Concatenate the 19 rendered segments, add the soundtrack normalised to -14 LUFS (two-pass loudnorm), write the final MP4."""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'final.mp4')
ids = [s['id'] for s in json.load(open(os.path.join(HERE, 'shots.json'), encoding='utf-8'))['shots']]
seg = [os.path.join(HERE, 'segments', i + '.mp4') for i in ids]
missing = [s for s in seg if not os.path.exists(s) or os.path.getsize(s) < 10000]
if missing: sys.exit('missing segments: ' + ', '.join(os.path.basename(m) for m in missing))
lst = os.path.join(HERE, 'concat.txt')
open(lst, 'w').write(''.join(f"file '{s}'\n" for s in seg))
silent = os.path.join(HERE, 'video_noaudio.mp4')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', silent], check=True)
wav = os.path.join(HERE, 'soundtrack.wav')
# pass 1: measure
p = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', p.stderr)[-1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=summary")
# pass 2: apply + mux
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-i', wav, '-map', '0:v:0', '-map', '1:a:0', '-c:v', 'copy',
                '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', OUT], check=True)
print('wrote', OUT, round(os.path.getsize(OUT) / 1e6, 1), 'MB')
