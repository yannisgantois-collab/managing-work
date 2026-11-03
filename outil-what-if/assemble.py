"""Concatenate the 19 rendered segments, add the soundtrack normalised to -14 LUFS (two-pass loudnorm), write the final MP4."""
import json, os, re, subprocess, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'final.mp4')
DATA = os.environ.get('DATA') or os.path.join(HERE, 'shots.json')
SEG = os.environ.get('SEG') or os.path.join(HERE, 'segments')
WAV = os.environ.get('WAV') or os.path.join(HERE, 'soundtrack.wav')
ids = [s['id'] for s in json.load(open(DATA, encoding='utf-8'))['shots']]
seg = [os.path.abspath(os.path.join(SEG, i + '.mp4')) for i in ids]
missing = [s for s in seg if not os.path.exists(s) or os.path.getsize(s) < 10000]
if missing: sys.exit('missing segments: ' + ', '.join(os.path.basename(m) for m in missing))
lst = os.path.join(SEG, 'concat.txt')
open(lst, 'w').write(''.join(f"file '{s}'\n" for s in seg))
silent = os.path.join(SEG, 'video_noaudio.mp4')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', lst, '-c', 'copy', silent], check=True)
wav = WAV
# pass 1: measure
p = subprocess.run(['ffmpeg', '-hide_banner', '-i', wav, '-af', 'loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json', '-f', 'null', '-'], capture_output=True, text=True)
m = json.loads(re.findall(r'\{[^{}]*"input_i"[^{}]*\}', p.stderr)[-1])
af = (f"loudnorm=I=-14:TP=-1.5:LRA=11:measured_I={m['input_i']}:measured_TP={m['input_tp']}:measured_LRA={m['input_lra']}"
      f":measured_thresh={m['input_thresh']}:offset={m['target_offset']}:linear=true:print_format=summary")
# final encode: two-pass H.264 at 6 Mb/s (about 60 MB for 78.5 s: under GitHub's 100 MB limit, plenty for TikTok, which re-encodes)
venc = ['-c:v', 'libx264', '-preset', 'slow', '-b:v', '6M', '-maxrate', '9M', '-bufsize', '12M', '-profile:v', 'high', '-level', '4.1', '-pix_fmt', 'yuv420p', '-r', '30']
plog = os.path.join(SEG, 'x264pass')
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', silent] + venc + ['-pass', '1', '-passlogfile', plog, '-an', '-f', 'mp4', os.devnull], check=True)
subprocess.run(['ffmpeg', '-hide_banner', '-loglevel', 'error', '-y', '-i', silent, '-i', wav, '-map', '0:v:0', '-map', '1:a:0'] + venc + ['-pass', '2', '-passlogfile', plog,
                '-af', af, '-ar', '48000', '-c:a', 'aac', '-b:a', '192k', '-movflags', '+faststart', '-shortest', OUT], check=True)
print('wrote', OUT, round(os.path.getsize(OUT) / 1e6, 1), 'MB')
