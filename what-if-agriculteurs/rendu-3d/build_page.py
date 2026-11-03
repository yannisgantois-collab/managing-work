"""Builds the storyboard page (index.html) from shots.json + rendered frames."""
import json, html, os, shutil, sys

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = sys.argv[1] if len(sys.argv) > 1 else os.path.join(HERE, 'storyboard')
os.makedirs(os.path.join(OUT, 'frames'), exist_ok=True)
data = json.load(open(os.path.join(HERE, 'shots.json'), encoding='utf-8'))
shots = data['shots']
for s in shots:
    shutil.copy(os.path.join(HERE, 'frames', s['id'] + '.jpg'), os.path.join(OUT, 'frames', s['id'] + '.jpg'))

NB = ' '; NNB = ' '
def fr(t):
    import re
    t = re.sub(r' ([?!:;»])', NB + r'\1', t)
    t = t.replace('« ', '«' + NB)
    t = re.sub(r'(\d) (\d{3})', r'\1' + NB + r'\2', t)
    return t
def e(t): return html.escape(fr(t), quote=True)
def tc(x):
    m = int(x // 60); s = x - m * 60
    return f"{m}:{s:04.1f}".replace('.', ',')
def secs(x): return (f"{x:.1f}".replace('.', ',')) + NB + 's'

TOTAL = shots[-1]['t0'] + shots[-1]['dur']
ACTS = {1: ("Acte 1", "Le matin où personne ne se lève"), 2: ("Acte 2", "La ville a faim"), 3: ("Acte 3", "Retour au réel")}

DEFECTS = [
 ("D01", "Incohérences logiques", "Vidéo 2, 0:12–0:34 : les hommes enceints ont leurs règles et achètent des protections. Vidéo 1, 0:54–1:00 : « la criminalité augmente de 80 % » alors que « les femmes ne commettaient que 20 % des crimes violents ». Vidéo 1, 1:08 : le compteur des soins non rémunérés tombe à 0 alors que « les pères s’en chargent seuls ».", "Seule la prémisse est fictive ; chaque conséquence en découle et passe un test cause → conséquence. Les citadins qui cultivent (P12) n’effacent pas le manque, ils l’illustrent.", "P08, P12"),
 ("D02", "Le chiffre à l’image contredit le texte", "Vidéo 2, 1:22 : la facture affiche 18 640,75 $, le sous-titre dit 18 865 $. Vidéo 1, 1:02 : le compteur montre 12,42 milliards, le texte dit 12,5 milliards.", "Une seule table de chiffres alimente compteurs, accessoires et sous-titres. Rien n’est retapé à la main.", "P08, P17"),
 ("D03", "Texte déformé dans l’image", "Vidéo 1, 0:54 : enseigne « SUPERMA KET ».", "Tout texte dans le décor (enseigne, cagettes, pancartes) est écrit proprement, en post-production ou dans le rendu, jamais laissé au générateur.", "P07, P08, P09, P16"),
 ("D04", "Le personnage change d’un plan à l’autre", "Vidéo 2 : le héros passe d’un sweat gris à un sweat marine, la coiffure varie.", "Fiche personnage unique d’Hélène (veste bleu de travail, pantalon vert, bottes vertes, chignon gris), réutilisée dans chaque plan où elle apparaît.", "P02, P03, P14, P15, P16"),
 ("D05", "Sous-titres peu lisibles", "Vidéo 1, 0:32–0:44 : petit italique blanc sans ombre sur des fonds clairs (couloir ensoleillé, bougies).", "Corps 54 px au lieu d’environ 34 px, ombre portée et voile sombre local derrière les sous-titres et le compteur.", "Tous"),
 ("D06", "Sous-titres trop longs pour le plan", "Vidéo 2, 1:06 : trois lignes à lire en quatre secondes.", "Deux lignes au plus, 80 caractères au plus, 4 s minimum par sous-titre (environ 17 caractères par seconde).", "Tous"),
 ("D07", "Accroche lente", "Les deux vidéos posent l’événement vers 0:08–0:10, avec un titre petit sur un fond chargé.", "Le réveil sonne dès la première image, le titre est grand et contrasté, le compteur commence à chuter à 0:03.", "P01, P02, P03"),
 ("D08", "Trop long, milieu répétitif", "1:53 et 2:42. La vidéo 2 enchaîne une quinzaine de faits au même rythme.", "78,5 s en trois actes ; chaque plan fait avancer le temps (jour, semaine, mois, aujourd’hui).", "Tous"),
 ("D09", "Temps morts", "Vidéo 2, 2:09 : deux secondes d’écran noir. Cartons finaux de sept secondes.", "Aucun plan vide. Carton final de 4 s qui boucle sur la nuit du premier plan.", "P19"),
 ("D10", "Chute « tout ça n’était qu’un rêve »", "Vidéo 2, 2:22 : le rêve annule tout l’enjeu de l’histoire.", "La fiction rejoint la réalité chiffrée : les fermes ne disparaissent pas d’un coup, elles disparaissent une par une.", "P14, P18"),
 ("D11", "Titre différent entre l’accroche et la fin", "Vidéo 1 : « What if every Woman on Earth disappeared? » au début, « What if all women disappeared? » à la fin.", "Titre identique au caractère près, typographie française (espaces insécables, guillemets).", "P01, P19"),
 ("D12", "Phrases ambiguës", "Vidéo 1, 0:44 : « Over a billion of them are children » (de qui parle-t-on ?).", "Chaque phrase a un sujet explicite.", "P03, P10, P19"),
 ("D13", "Le compteur change de sens sans prévenir", "Vidéo 2 : « PREGNANT MEN » reste affiché en année 2, bien après les naissances.", "Le libellé dit toujours ce que mesure le chiffre et change à chaque acte : agriculteurs au travail, réserves de Paris, fermes en France.", "P03, P06, P11, P16"),
 ("D14", "Chiffres sans source", "Vidéo 1 : « la criminalité augmente de 80 % », sans origine.", "Chaque chiffre réel renvoie à une source (tableau en bas de page). Les chiffres inventés sont marqués « fictif ».", "P04, P06, P08, P09, P16, P17"),
 ("D15", "Fautes de langue", "Vidéo 2, 1:52 : « 1 in 8 new mothers go ».", "Relecture orthographique et typographique du français.", "Tous"),
 ("D16", "Deux compteurs qui se disputent l’écran", "Vidéo 1, 1:02 : deux grands compteurs empilés.", "Un compteur principal et une ligne secondaire au plus, toujours à la même place.", "P06 à P10"),
]
DEF = {d[0]: d[1] for d in DEFECTS}

SOURCES = [
 ("S1", "Agreste, Recensement agricole 2020 : 496 365 chefs d’exploitation et coexploitants en France métropolitaine.", None, "P01–P03, P14, P15", "À recouper avec la publication Agreste avant mise en ligne"),
 ("S2", "Ministère de l’Agriculture, Recensement agricole 2020 (résultats de décembre 2021) : 389 000 exploitations en 2020 contre 490 000 en 2010. « Une toutes les 52 minutes » = 101 000 fermes sur 10 ans (5 259 600 minutes).", "https://www.terre-net.fr/installation/article/204174/en-10-ans-100-000-exploitations-de-moins-en-france-pour-une-sau-identique", "P16, P17", "Vérifié (chiffres provisoires du recensement)"),
 ("S3", "Réussir (2024) : 3,3 millions de vaches laitières en France au 1er septembre 2024.", "https://www.reussir.fr/combien-la-france-t-elle-perdu-de-vaches-en-2024", "P04", "Vérifié"),
 ("S4", "Apur et Ville de Paris (octobre 2024) : Paris dispose de cinq à sept jours d’autonomie alimentaire. Le chiffre de « 3 jours » souvent cité n’a pas de source.", "https://www.paris.fr/pages/resilience-alimentaire-une-etude-pour-renforcer-la-securite-alimentaire-de-paris-29121", "P06–P09", "Vérifié"),
 ("S5", "Rungis International : premier marché de gros de produits frais au monde.", "https://cms.rungisinternational.com/uploads/Guide_de_l_acheteur_BD_8fff7cfb51.pdf", "P07", "Vérifié"),
 ("S6", "Sénat, rapport sur la compétitivité de la « ferme France » (2022) : près d’un fruit et légume sur deux consommé en France est importé.", "https://www.senat.fr/presse/cp20230303.html", "P08", "Vérifié"),
 ("S7", "Hérodote : la carte de pain disparaît le 1er février 1949.", "https://www.herodote.net/almanach-ID-2925.php", "P09", "Vérifié"),
 ("S8", "INSEE (2024), Exploitants agricoles : la moitié des exploitations sont dirigées par au moins un exploitant de 55 ans ou plus, qui aura l’âge légal de la retraite d’ici 2030.", "https://www.insee.fr/fr/statistiques/7728869", "P16", "Vérifié"),
 ("S9", "INSEE (2020) : les agriculteurs exploitants représentaient 7,1 % de l’emploi en 1982 et 1,5 % en 2019.", "https://www.insee.fr/fr/statistiques/4806717", "P19", "Vérifié"),
]

def chips(ids, kind):
    out = []
    for i in ids:
        if kind == 'D':
            out.append(f'<a class="chip fix" href="#{i.lower()}" title="{html.escape(DEF[i])}">{i}</a>')
        else:
            out.append(f'<a class="chip src" href="#{i.lower()}">{i}</a>')
    return ''.join(out)

# ---------- act timeline ----------
segs = []
for a in (1, 2, 3):
    ss = [s for s in shots if s['act'] == a]
    a0 = ss[0]['t0']; a1 = ss[-1]['t0'] + ss[-1]['dur']
    segs.append((a, a0, a1))
timeline = '<div class="acts" role="img" aria-label="Répartition des 19 plans dans les trois actes, sur 78,5 secondes">'
for a, a0, a1 in segs:
    w = (a1 - a0) / TOTAL * 100
    timeline += f'<div class="act a{a}" style="flex:{a1 - a0:.2f}"><span class="act-n">{ACTS[a][0]} · {tc(a0)}–{tc(a1)}</span><span class="act-t">{e(ACTS[a][1])}</span></div>'
timeline += '</div><div class="ticks" aria-hidden="true">'
for s in shots:
    timeline += f'<a href="#{s["id"].lower()}" class="tick a{s["act"]}" style="flex:{s["dur"]:.2f}" title="{s["id"]} · {tc(s["t0"])}">{s["id"][1:]}</a>'
timeline += '</div>'

# ---------- defects table ----------
deft = ''.join(f'<tr id="{d[0].lower()}"><th scope="row"><span class="code">{d[0]}</span>{e(d[1])}</th><td>{e(d[2])}</td><td>{e(d[3])}</td><td class="where">{e(d[4])}</td></tr>' for d in DEFECTS)

# ---------- shot cards ----------
cards = ''
for s in shots:
    a = s['act']
    if s['set'] == 'endcard':
        onscreen = f'<p class="onscreen"><span class="lbl">À l’écran</span>{e(data["title"])}<br><span class="mono">{e(" ".join(s["end"]["mono"]))}</span><br><span class="mono">{e(" ".join(s["end"]["cta"]))}</span></p>'
        hud = '<dt>Compteur</dt><dd>Aucun : carton final.</dd>'
    else:
        txt = (f'<em>Titre :</em> {e(data["title"])}' if s.get('title') else '') + (e('« ' + s['cap'] + ' »') if s['cap'] else '')
        onscreen = f'<p class="onscreen"><span class="lbl">À l’écran</span>{txt}</p>'
        h = s['hud']; v = f'{e(h["label"])} · <b>{e(h["value"])}</b> · {e(h["tl"])}'
        if h.get('sub'): v += f'<br><span class="sub">{e(h["sub"][0])} · <b>{e(h["sub"][1])}</b></span>'
        if h.get('note'): v += f' <span class="note">({e(h["note"])})</span>'
        hud = f'<dt>Compteur</dt><dd>{v}</dd>'
    cards += f'''
<article class="shot a{a}" id="{s['id'].lower()}">
  <button class="frame" type="button" data-i="{shots.index(s)}" aria-label="Agrandir le plan {s['id']}"><img src="frames/{s['id']}.jpg" alt="Plan {s['id']} : {e(s['action'])}" width="720" height="1280" loading="lazy"></button>
  <div class="meta">
    <header><span class="id">{s['id']}</span><span class="tc">{tc(s['t0'])} → {tc(s['t0'] + s['dur'])}</span><span class="dur">{secs(s['dur'])}</span></header>
    {onscreen}
    <dl>{hud}<dt>Image</dt><dd>{e(s['action'])}</dd><dt>Caméra</dt><dd>{e(s['move'])}</dd><dt>Son</dt><dd>{e(s['sfx'])}</dd></dl>
    <div class="chips">{chips(s['fix'], 'D')}{chips(s['src'], 'S')}</div>
  </div>
</article>'''

srct = ''
for sid, txt, url, used, status in SOURCES:
    link = f'<a href="{url}" rel="noopener" target="_blank">{html.escape(url.split("/")[2])}</a>' if url else '<span class="muted">pas de lien direct consulté</span>'
    cls = 'ok' if status.startswith('Vérifié') else 'warn'
    srct += f'<tr id="{sid.lower()}"><th scope="row">{sid}</th><td>{e(txt)}<div class="lnk">{link}</div></td><td>{e(used)}</td><td><span class="status {cls}">{e(status)}</span></td></tr>'

frames_js = json.dumps([{'src': f"frames/{s['id']}.jpg", 'id': s['id'], 'tc': tc(s['t0'])} for s in shots])

page = f'''<title>Storyboard What if Agriculteurs</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Newsreader:ital,opsz,wght@0,6..72,400;0,6..72,500;0,6..72,600;1,6..72,400;1,6..72,500&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap">
<style>
/* Layout: production sheet. Header + act timeline, defect ledger, then a grid of horizontal shot cards (frame | notes), charter and sources. */
:root {{
  --bg: #eef0f3; --surface: #ffffff; --ink: #151a22; --muted: #5a6372; --line: #d6dbe3;
  --gold: #8a6a1f; --gold-soft: #f3ead3; --fix: #2f6b3a; --fix-soft: #e3efe4; --warn: #9a5a12; --warn-soft: #f6ead8;
  --a1: #2c4675; --a2: #8a5d1c; --a3: #a03b2a;
  --display: "Newsreader", Georgia, "Times New Roman", serif;
  --body: "IBM Plex Sans", system-ui, -apple-system, "Segoe UI", sans-serif;
  --mono: "IBM Plex Mono", ui-monospace, "SFMono-Regular", Menlo, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{
  --bg: #0e131c; --surface: #151c28; --ink: #e8ebf0; --muted: #9ba4b3; --line: #273142;
  --gold: #d8b766; --gold-soft: #2a2416; --fix: #86c48d; --fix-soft: #17271b; --warn: #e2a65a; --warn-soft: #2c2114;
  --a1: #86a3d8; --a2: #dcaa5c; --a3: #e98068; color-scheme: dark; }} }}
:root[data-theme="dark"] {{
  --bg: #0e131c; --surface: #151c28; --ink: #e8ebf0; --muted: #9ba4b3; --line: #273142;
  --gold: #d8b766; --gold-soft: #2a2416; --fix: #86c48d; --fix-soft: #17271b; --warn: #e2a65a; --warn-soft: #2c2114;
  --a1: #86a3d8; --a2: #dcaa5c; --a3: #e98068; color-scheme: dark; }}
* {{ box-sizing: border-box; }}
[hidden] {{ display: none !important; }}
.wrap > *, section {{ min-width: 0; }}
body {{ background: var(--bg); color: var(--ink); font: 15px/1.55 var(--body); padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px)); }}
.wrap {{ max-width: 1180px; margin: 0 auto; padding-block: 40px 72px; display: grid; gap: 56px; }}
a {{ color: inherit; }}
a:focus-visible, button:focus-visible {{ outline: 2px solid var(--gold); outline-offset: 2px; }}
.eyebrow {{ font: 500 12px/1.4 var(--mono); letter-spacing: .14em; text-transform: uppercase; color: var(--gold); }}
h1 {{ font: 500 clamp(30px, 5vw, 52px)/1.08 var(--display); margin: 10px 0 0; text-wrap: balance; max-width: 22ch; }}
h2 {{ font: 500 clamp(24px, 3vw, 32px)/1.15 var(--display); margin: 0; text-wrap: balance; }}
.lead {{ font-size: 17px; max-width: 68ch; margin: 18px 0 0; color: var(--ink); }}
.facts {{ display: flex; flex-wrap: wrap; gap: 8px; margin-top: 20px; padding: 0; list-style: none; }}
.facts li {{ font: 500 12.5px/1 var(--mono); padding: 8px 10px; border: 1px solid var(--line); border-radius: 4px; background: var(--surface); }}
section > header {{ display: grid; gap: 8px; margin-bottom: 20px; }}
section > header p {{ margin: 0; color: var(--muted); max-width: 72ch; }}
/* act timeline */
.timeline {{ margin-top: 28px; display: grid; gap: 6px; }}
.acts {{ display: flex; gap: 4px; }}
.act {{ min-width: 0; border-top: 4px solid; padding-top: 8px; display: grid; gap: 2px; }}
.act.a1 {{ border-color: var(--a1); }} .act.a2 {{ border-color: var(--a2); }} .act.a3 {{ border-color: var(--a3); }}
.act-n {{ font: 500 11.5px/1.3 var(--mono); color: var(--muted); }}
.act-t {{ font: 500 15px/1.25 var(--display); }}
.ticks {{ display: flex; gap: 2px; }}
.tick {{ min-width: 0; text-align: center; text-decoration: none; font: 500 10.5px/22px var(--mono); color: var(--muted); background: var(--surface); border: 1px solid var(--line); border-radius: 2px; overflow: hidden; }}
.tick:hover {{ color: var(--ink); border-color: var(--gold); }}
/* two-column analysis */
.split {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 340px), 1fr)); gap: 16px; }}
.panel {{ background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 20px 22px; min-width: 0; }}
.panel h3 {{ font: 600 13px/1.3 var(--mono); letter-spacing: .08em; text-transform: uppercase; margin: 0 0 10px; color: var(--muted); }}
.panel ul {{ margin: 0; padding-left: 18px; display: grid; gap: 6px; }}
/* tables */
.tbl {{ overflow-x: auto; border: 1px solid var(--line); border-radius: 6px; background: var(--surface); }}
table {{ border-collapse: collapse; width: 100%; min-width: 760px; font-size: 14px; }}
th, td {{ text-align: left; vertical-align: top; padding: 12px 14px; border-top: 1px solid var(--line); }}
thead th {{ border-top: 0; font: 600 11.5px/1.3 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); background: var(--bg); }}
tbody th {{ font-weight: 600; width: 22%; }}
.code {{ display: block; font: 600 12px/1.4 var(--mono); color: var(--fix); margin-bottom: 2px; }}
td.where {{ font: 500 12.5px/1.5 var(--mono); white-space: nowrap; color: var(--muted); }}
tr:target {{ background: var(--gold-soft); }}
/* storyboard */
.board {{ display: grid; grid-template-columns: repeat(auto-fill, minmax(min(100%, 500px), 1fr)); gap: 18px; }}
.shot {{ display: grid; grid-template-columns: clamp(112px, 32%, 176px) minmax(0, 1fr); gap: 16px; background: var(--surface); border: 1px solid var(--line); border-radius: 6px; padding: 14px; border-top: 4px solid; }}
.shot.a1 {{ border-top-color: var(--a1); }} .shot.a2 {{ border-top-color: var(--a2); }} .shot.a3 {{ border-top-color: var(--a3); }}
.shot:target {{ box-shadow: 0 0 0 2px var(--gold); }}
.frame {{ padding: 0; border: 0; background: #000; border-radius: 4px; overflow: hidden; cursor: zoom-in; align-self: start; display: block; width: 100%; }}
.frame img {{ display: block; width: 100%; height: auto; aspect-ratio: 9 / 16; object-fit: cover; }}
.meta {{ min-width: 0; display: grid; gap: 10px; align-content: start; }}
.meta header {{ display: flex; flex-wrap: wrap; align-items: baseline; gap: 6px 12px; font-family: var(--mono); }}
.id {{ font: 600 20px/1 var(--display); }}
.tc {{ font-size: 12.5px; color: var(--muted); font-variant-numeric: tabular-nums; }}
.dur {{ font-size: 12px; padding: 2px 6px; border: 1px solid var(--line); border-radius: 3px; }}
.onscreen {{ margin: 0; font: italic 400 17px/1.35 var(--display); }}
.onscreen em {{ font-style: normal; font-family: var(--body); font-size: 13px; color: var(--muted); }}
.onscreen .mono {{ font: 500 11.5px/1.6 var(--mono); font-style: normal; letter-spacing: .04em; color: var(--muted); }}
.lbl {{ display: block; font: 600 10.5px/1.4 var(--mono); font-style: normal; letter-spacing: .1em; text-transform: uppercase; color: var(--gold); margin-bottom: 2px; }}
dl {{ display: grid; grid-template-columns: 72px minmax(0, 1fr); gap: 4px 10px; margin: 0; font-size: 13.5px; line-height: 1.45; }}
dt {{ font: 600 10.5px/1.9 var(--mono); letter-spacing: .08em; text-transform: uppercase; color: var(--muted); }}
dd {{ margin: 0; }}
dd b {{ font-variant-numeric: tabular-nums; }}
.sub {{ color: var(--muted); }} .note {{ color: var(--warn); }}
.chips {{ display: flex; flex-wrap: wrap; gap: 6px; }}
.chip {{ font: 600 11.5px/1 var(--mono); padding: 5px 7px; border-radius: 3px; text-decoration: none; }}
.chip.fix {{ background: var(--fix-soft); color: var(--fix); }}
.chip.src {{ background: var(--gold-soft); color: var(--gold); }}
@media (max-width: 420px) {{ .shot {{ grid-template-columns: 1fr; }} .frame {{ max-width: 220px; }} }}
/* charter */
.spec {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(min(100%, 300px), 1fr)); gap: 16px; }}
.spec dl {{ grid-template-columns: 110px minmax(0, 1fr); font-size: 14px; }}
.status {{ font: 600 11.5px/1.3 var(--mono); padding: 4px 6px; border-radius: 3px; display: inline-block; }}
.status.ok {{ background: var(--fix-soft); color: var(--fix); }} .status.warn {{ background: var(--warn-soft); color: var(--warn); }}
.lnk {{ margin-top: 4px; font: 500 12.5px/1.4 var(--mono); }} .muted {{ color: var(--muted); }}
.next {{ background: var(--surface); border: 1px solid var(--line); border-left: 4px solid var(--gold); border-radius: 6px; padding: 20px 22px; max-width: 80ch; }}
.next p {{ margin: 0 0 8px; }} .next p:last-child {{ margin: 0; }}
/* viewer */
.viewer {{ position: fixed; inset: 0; z-index: 20; background: rgba(5, 7, 12, .92); display: grid; place-items: center; padding: max(16px, env(safe-area-inset-top, 0px)) max(16px, env(safe-area-inset-right, 0px)) max(16px, env(safe-area-inset-bottom, 0px)) max(16px, env(safe-area-inset-left, 0px)); }}
.viewer img {{ max-height: 86vh; max-width: 100%; width: auto; border-radius: 6px; }}
.viewer .bar {{ display: flex; gap: 10px; align-items: center; justify-content: center; margin-top: 12px; color: #e8ebf0; font: 500 13px/1 var(--mono); }}
.viewer button {{ font: 600 13px/1 var(--mono); color: #e8ebf0; background: #1b2331; border: 1px solid #36435a; border-radius: 4px; padding: 10px 12px; cursor: pointer; }}
@media (prefers-reduced-motion: no-preference) {{ .tick, .shot {{ transition: border-color .15s, box-shadow .15s; }} }}
</style>

<div class="wrap">
<header>
  <div class="eyebrow">Storyboard · What if · version française</div>
  <h1>{e(data["title"])}</h1>
  <p class="lead">Un matin, à 4 h 30, aucun agriculteur ne se lève. On suit Hélène, éleveuse, puis le pays qui se vide en six mois. À la fin, la fiction rejoint la réalité : les fermes ne disparaissent pas d’un coup, elles disparaissent une par une.</p>
  <ul class="facts"><li>9:16 · 1080 × 1920</li><li>78,5 s</li><li>19 plans</li><li>Sans voix off</li><li>Images rendues en 3D par code</li></ul>
  <div class="timeline">{timeline}</div>
</header>

<section aria-labelledby="h-ref">
  <header><div class="eyebrow">Analyse des deux vidéos de référence</div><h2 id="h-ref">Le style est repris, l’histoire est neuve</h2>
  <p>Les deux vidéos fournies (1:53 et 2:42) servent uniquement de référence visuelle. Aucune scène, réplique, prémisse ni personnage n’en est repris.</p></header>
  <div class="split">
    <div class="panel"><h3>Repris du style</h3><ul>
      <li>3D stylisée, personnages simples aux traits minimalistes, lumière de cinéma.</li>
      <li>Un compteur qui raconte l’histoire, avec un repère de temps (jour, semaine, mois).</li>
      <li>Sous-titres en serif italique, centrés, une idée par plan.</li>
      <li>Aucune voix off : le texte et le sound design portent le récit.</li>
      <li>Un personnage qui ouvre et ferme l’histoire.</li>
      <li>Carton final sombre avec un appel au partage.</li></ul></div>
    <div class="panel"><h3>Nouveau dans ce What if</h3><ul>
      <li>Sujet : l’arrêt des agriculteurs en France.</li>
      <li>Déclencheur : un réveil que personne n’éteint, pas un compte à rebours de minuit.</li>
      <li>Personnage : Hélène, 58 ans, éleveuse laitière.</li>
      <li>Chute : des chiffres réels, pas un rêve.</li>
      <li>Appel au partage : « Envoie ça à quelqu’un qui mange trois fois par jour. »</li>
      <li>Durée ramenée à 78,5 s.</li></ul></div>
  </div>
</section>

<section aria-labelledby="h-def">
  <header><div class="eyebrow">16 défauts relevés · 16 corrections</div><h2 id="h-def">Ce que le storyboard corrige</h2>
  <p>Chaque plan du storyboard renvoie aux codes ci-dessous (pastilles vertes).</p></header>
  <div class="tbl"><table><thead><tr><th scope="col">Défaut</th><th scope="col">Constaté dans les références</th><th scope="col">Correction</th><th scope="col">Plans</th></tr></thead><tbody>{deft}</tbody></table></div>
</section>

<section aria-labelledby="h-sb">
  <header><div class="eyebrow">19 plans · cliquer une image pour l’agrandir</div><h2 id="h-sb">Storyboard</h2>
  <p>Images de travail rendues en 3D, avec les textes à leur taille finale. Les pastilles vertes renvoient aux défauts corrigés, les dorées aux sources.</p></header>
  <div class="board">{cards}</div>
</section>

<section aria-labelledby="h-ch">
  <header><div class="eyebrow">Pour la fabrication</div><h2 id="h-ch">Charte de production</h2></header>
  <div class="spec">
    <div class="panel"><h3>Textes à l’écran</h3><dl>
      <dt>Compteur</dt><dd>Libellé Inter SemiBold 23 px, interlettrage 0,2 em. Valeur Newsreader Medium 90 px, chiffres tabulaires. Repère de temps Inter SemiBold 21 px.</dd>
      <dt>Sous-titres</dt><dd>Newsreader Medium Italique 54 px, interligne 1,2. Ombre portée et voile sombre local.</dd>
      <dt>Titre</dt><dd>Newsreader Medium 80 px, identique en P01 et P19.</dd>
      <dt>Carton</dt><dd>Newsreader 68 px, IBM Plex Mono 26 et 30 px.</dd></dl></div>
    <div class="panel"><h3>Règles</h3><dl>
      <dt>Lecture</dt><dd>Deux lignes et 80 caractères au plus, 4 s minimum par sous-titre.</dd>
      <dt>Nombres</dt><dd>Espace fine insécable pour les milliers (496 365), virgule décimale.</dd>
      <dt>Ponctuation</dt><dd>Espace insécable avant ? ! : ; et à l’intérieur des guillemets.</dd>
      <dt>Zones TikTok</dt><dd>Rien d’important dans les 160 px du haut, les 420 px du bas ni les 140 px de droite.</dd></dl></div>
    <div class="panel"><h3>Son et lumière</h3><dl>
      <dt>Voix</dt><dd>Aucune voix off. Ambiances et bruitages listés plan par plan.</dd>
      <dt>Musique</dt><dd>Piano et nappe qui entrent dans le silence de P03, passent en majeur en P14.</dd>
      <dt>Mixage</dt><dd>−14 LUFS intégrés, crêtes à −1 dBTP.</dd>
      <dt>Lumière</dt><dd>Acte 1 nuit bleue et aube dorée, acte 2 néons et sodium, acte 3 lampe chaude, coucher de soleil, nuit étoilée.</dd></dl></div>
  </div>
</section>

<section aria-labelledby="h-src">
  <header><div class="eyebrow">Chiffres réels</div><h2 id="h-src">Sources</h2>
  <p>Chiffres inventés pour la fiction, signalés comme tels : 187 512 (chute du compteur en P02), le compte à rebours des réserves (6, 4, 3, 0 jours, cohérent avec l’estimation de 5 à 7 jours), 12 870 et 41 302 citadins au travail, le prix de 9,80 € le kilo de tomates.</p></header>
  <div class="tbl"><table><thead><tr><th scope="col">Réf.</th><th scope="col">Donnée</th><th scope="col">Plans</th><th scope="col">Statut</th></tr></thead><tbody>{srct}</tbody></table></div>
</section>

<section aria-labelledby="h-next">
  <div class="next"><div class="eyebrow">Avant l’animation</div><h2 id="h-next" style="margin:6px 0 10px">À valider</h2>
  <p>Le sujet, le texte des 19 sous-titres et la chute. Une fois validés, les mêmes décors 3D servent à animer chaque plan (mouvements de caméra, compteurs qui défilent) et à monter la vidéo en 1080 × 1920.</p>
  <p>Le chiffre S1 (496 365) est à recouper sur le site d’Agreste avant la mise en ligne.</p></div>
</section>
</div>

<div class="viewer" id="viewer" hidden role="dialog" aria-modal="true" aria-label="Plan agrandi">
  <div><img id="v-img" alt=""><div class="bar"><button type="button" id="v-prev" aria-label="Plan précédent">←</button><span id="v-cap"></span><button type="button" id="v-next" aria-label="Plan suivant">→</button><button type="button" id="v-close">Fermer</button></div></div>
</div>
<script>
(() => {{
  const F = {frames_js};
  const v = document.getElementById('viewer'), img = document.getElementById('v-img'), cap = document.getElementById('v-cap');
  let i = 0;
  const show = (k) => {{ i = (k + F.length) % F.length; img.src = F[i].src; img.alt = 'Plan ' + F[i].id; cap.textContent = F[i].id + ' · ' + F[i].tc; v.hidden = false; }};
  document.querySelectorAll('.frame').forEach(b => b.addEventListener('click', () => show(+b.dataset.i)));
  document.getElementById('v-prev').addEventListener('click', (ev) => {{ ev.stopPropagation(); show(i - 1); }});
  document.getElementById('v-next').addEventListener('click', (ev) => {{ ev.stopPropagation(); show(i + 1); }});
  document.getElementById('v-close').addEventListener('click', () => {{ v.hidden = true; }});
  v.addEventListener('click', (ev) => {{ if (ev.target === v) v.hidden = true; }});
  document.addEventListener('keydown', (ev) => {{ if (v.hidden) return; if (ev.key === 'Escape') v.hidden = true; if (ev.key === 'ArrowRight') show(i + 1); if (ev.key === 'ArrowLeft') show(i - 1); }});
}})();
</script>
'''
open(os.path.join(OUT, 'index.html'), 'w', encoding='utf-8').write(page)
print('written', os.path.join(OUT, 'index.html'), len(page))
