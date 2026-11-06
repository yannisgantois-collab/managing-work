# writes projets/canicule/shots.json (episode 3) — run from the tool folder
import json
T = 'TEMPÉRATURE À PARIS'
def hud(v, tl, label=T): return {'label': label, 'value': v, 'tl': tl}
S = [
 ('P01', 1, 3.0, 'roofs', 'noon', hud('36 °C', 'JOUR 1 · 14:00'), '',
  'Les toits en zinc de Paris sous un soleil blanc ; l’air tremble au-dessus des cheminées. Au loin, un dôme et des grues immobiles.',
  'Lent travelling latéral au ras des toits.', 'Vent chaud, rumeur lointaine de la ville, le zinc qui craque.', ['D07', 'D11', 'D05'], [], True),
 ('P02', 1, 4.0, 'attic', 'day', hud('37 °C', 'JOUR 1 · 15:10'), 'Jour 1. Le zinc du toit monte à 80 °C.\nInès, 21 ans, vit juste dessous.',
  'La chambre de bonne d’Inès, 9 m² sous le toit : le soleil tombe par le vasistas, le ventilateur souffle de l’air brûlant. Assise sur son lit, Inès s’évente avec un cahier.',
  'Plan fixe, léger zoom avant.', 'Ventilateur, le zinc qui claque en se dilatant.', ['D04', 'D01'], ['S7']),
 ('P03', 1, 4.0, 'street', 'pharmacy', hud('43 °C', 'JOUR 2 · 16:30'), 'Jour 2. 43 °C. Le record de Paris,\n42,6 °C en 2019, vient de tomber.',
  'Une rue haussmannienne écrasée de soleil : la croix verte de la pharmacie affiche 43 °C. Les passants rasent les murs, une femme s’abrite sous un parapluie.',
  'Travelling arrière lent.', 'Rue au ralenti, un bus au loin, le bip de la croix de pharmacie.', ['D03', 'D02', 'D14'], ['S4']),
 ('P04', 1, 4.0, 'rails', 'heat', hud('43 °C', 'JOUR 2 · 17:15'), 'Les rails chauffent jusqu’à 60 °C.\nLes trains doivent ralentir.',
  'Une voie de banlieue sous la chaleur : l’air ondule au-dessus des rails, un train avance au pas devant un panneau « 40 ».',
  'Plan fixe au ras du ballast.', 'Crissement des rails, grésillement des caténaires.', ['D01', 'D14'], ['S8']),
 ('P05', 1, 4.0, 'plant', 'river', hud('42 °C', 'JOUR 2 · 18:30'), 'Les rivières sont trop chaudes :\ndes centrales nucléaires ralentissent.',
  'Une centrale au bord d’une rivière basse : les tours de refroidissement fument à peine, les berges sont craquelées. Le panneau de mesure affiche « EAU 28 °C ».',
  'Lent panoramique.', 'Bourdonnement électrique qui baisse d’un ton.', ['D01', 'D03', 'D14'], ['S9']),
 ('P06', 1, 4.0, 'school', 'closed', hud('39 °C', 'JOUR 3 · 08:30'), 'Jour 3. Écoles fermées.\nLe brevet est reporté, comme en 2019.',
  'La grille d’une école élémentaire, fermée. Une affiche : « ÉCOLE FERMÉE – CANICULE. BREVET REPORTÉ. » La cour en bitume tremble de chaleur.',
  'Travelling avant vers l’affiche.', 'Cour vide, une alarme de voiture au loin.', ['D03', 'D14'], ['S10']),
 ('P07', 2, 4.0, 'facade', 'ac', hud('47 °C', 'JOUR 3 · 15:00'), 'Jour 3. 47 °C. Les climatiseurs\nrecrachent leur chaleur dans la rue.',
  'Une façade couverte de climatiseurs qui soufflent de l’air chaud ; en bas, un livreur à vélo pédale au ralenti dans l’air qui ondule.',
  'Contre-plongée qui descend le long de la façade.', 'Ronronnement de dizaines de compresseurs.', ['D01', 'D12'], []),
 ('P08', 2, 4.5, 'roofs', 'night', hud('34 °C', 'JOUR 4 · 00:30'), 'La nuit, Paris reste jusqu’à 8 °C\nplus chaud que la campagne.',
  'Paris la nuit, fenêtres grandes ouvertes, des silhouettes sur les balcons et sur les toits, sans un souffle d’air.',
  'Lent travelling latéral.', 'Ventilateurs aux fenêtres, une sirène lointaine.', ['D14', 'D13'], ['S11']),
 ('P09', 2, 4.0, 'attic', 'night', hud('33 °C', 'JOUR 4 · 02:00'), 'En 2003, vivre sous les toits\nmultipliait par 4 le risque de mourir.',
  'Dans sa chambre, Inès ne dort pas : drap mouillé, ventilateur, écran du téléphone. Le thermomètre de la chambre affiche 38 °C.',
  'Plan fixe en plongée.', 'Ventilateur, souffle court, horloge.', ['D04', 'D14'], ['S6']),
 ('P10', 2, 4.0, 'park', 'night', hud('32 °C', 'JOUR 4 · 04:00'), 'Les parcs restent ouverts toute la nuit.\nOn vient dormir sous les arbres.',
  'Un parc la nuit : des Parisiens dorment sur des draps dans l’herbe, sous les arbres et les réverbères. Inès arrive avec son oreiller.',
  'Lent travelling au ras de l’herbe.', 'Grillons, murmures, un arrosage automatique.', ['D04', 'D14'], ['S12']),
 ('P11', 2, 4.5, 'street', 'peak', hud('50,0 °C', 'JOUR 4 · 16:00'), 'Jour 4, 16 h. 50,0 °C.\nParis n’a jamais eu aussi chaud.',
  'La même rue qu’au jour 2, vide : la croix de la pharmacie passe à 50 °C, l’asphalte miroite, un brumisateur souffle dans le vide.',
  'Plan fixe, l’air ondule.', 'Silence, le brumisateur, la croix qui bipe.', ['D02', 'D16'], []),
 ('P12', 2, 4.0, 'street', 'ambulance', hud('50 °C', 'JOUR 4 · 16:40'), 'Les secours enchaînent les malaises.\nD’abord chez les plus âgés.',
  'Une ambulance gyrophares allumés devant un immeuble ; deux secouristes sortent un homme âgé sur un brancard.',
  'Plan moyen, caméra portée.', 'Sirène qui s’arrête, portes, radio des secours.', ['D12'], ['S2']),
 ('P13', 2, 4.0, 'roofs', 'storm', hud('29 °C', 'JOUR 5 · 18:00'), 'Jour 5. L’orage éclate enfin.\nLa température chute de 20 degrés.',
  'Les toits de Paris sous un ciel noir : un éclair, puis une pluie violente ; le zinc brûlant fume sous l’averse.',
  'Plan large fixe.', 'Tonnerre, pluie sur le zinc, sifflement de vapeur.', ['D08'], []),
 ('P14', 2, 4.0, 'attic', 'rain', hud('26 °C', 'JOUR 5 · 19:00'), 'Une fiction ? Paris s’est pourtant\nentraîné à ce scénario.',
  'Inès ouvre grand le vasistas et tend le visage à la pluie.',
  'Contre-plongée sous le vasistas.', 'Pluie, Inès qui rit.', ['D10'], []),
 ('P15', 3, 4.5, 'crisis', 'room', hud('50 °C', 'PARIS · 13 OCTOBRE 2023', 'CANICULE SIMULÉE'), '13 octobre 2023 : Paris simule\nune canicule à 50 °C, pour de vrai.',
  'Une salle de crise : des écrans montrent Paris en rouge et « DÔME DE CHALEUR · PIC À 50 °C » ; des agents au téléphone.',
  'Travelling latéral le long des tables.', 'Téléphones, voix posées, claviers.', ['D13', 'D14'], ['S1']),
 ('P16', 3, 4.5, 'heatmap', '2003', hud('14 802', 'FRANCE · 1ER–20 AOÛT 2003', 'MORTS EN EXCÈS'), 'Août 2003 : 14 802 morts de plus\nque d’habitude, en vingt jours.',
  'La France vue de nuit, teintée de rouge ; le compteur monte de 0 à 14 802.',
  'Lent zoom arrière.', 'Un battement grave et lent.', ['D02', 'D13', 'D14'], ['S2']),
 ('P17', 3, 5.0, 'heatmap', 'record', hud('46,0 °C', 'VÉRARGUES (HÉRAULT) · 28 JUIN 2019', 'RECORD DE FRANCE'), '46,0 °C en 2019. Pour Météo-France,\n50 °C sera possible dès 2050.',
  'Une épingle se plante dans l’Hérault : 46,0 °C. Puis toute la carte rougit.',
  'Plan fixe en plongée.', 'Le « clic » de l’épingle, puis un souffle chaud.', ['D02', 'D13', 'D14'], ['S3', 'S5']),
 ('P18', 3, 4.5, 'school', 'oasis', hud('203', 'BILAN 2025 · OBJECTIF 360', 'COURS OASIS À PARIS'), 'Pour tenir, Paris plante ses cours\nd’école : déjà 203 « cours oasis ».',
  'La même école qu’au jour 3, transformée : arbres, herbe, fontaine, enfants qui jouent à l’ombre.',
  'Lent travelling avant.', 'Rires d’enfants, oiseaux, fontaine. Piano en majeur.', ['D10', 'D13'], ['S13']),
]
shots, t0 = [], 0.0
for row in S:
    sid, act, dur, st, cam, h, cap, action, move, sfx, fix, src = row[:12]
    sh = {'id': sid, 'act': act, 't0': round(t0, 2), 'dur': dur, 'set': st, 'cam': cam}
    if len(row) > 12 and row[12]: sh['title'] = True
    sh.update({'hud': h, 'cap': cap, 'action': action, 'move': move, 'sfx': sfx, 'fix': fix, 'src': src})
    shots.append(sh); t0 += dur
shots.append({'id': 'P19', 'act': 3, 't0': round(t0, 2), 'dur': 4.0, 'set': 'endcard', 'cam': '',
  'end': {'mono': ['VOLETS FERMÉS LE JOUR, OUVERTS LA NUIT.', 'DE L’EAU. UN LIEU FRAIS PAS LOIN.'], 'cta': ['ENVOIE ÇA À QUELQU’UN', 'QUI VIT SOUS LES TOITS.']},
  'cap': '', 'action': 'Carton final : le même titre qu’en ouverture, deux conseils, la flèche de partage et l’appel à l’action.',
  'move': 'Fixe ; la flèche de partage s’anime.', 'sfx': 'La musique se pose, 0,5 s de silence, puis boucle sur les toits du premier plan.', 'fix': ['D09', 'D11', 'D05'], 'src': []})
assert abs(t0 + 4.0 - 78.5) < 1e-6, t0
SRC = [
 ('S1', 'Ville de Paris : exercice grandeur nature « Paris à 50 °C » le 13 octobre 2023 (13e et 19e arrondissements), dôme de chaleur fictif avec un pic à 50 °C, puis exercice en salle de crise le 17 octobre.', 'https://www.paris.fr/pages/paris-50-c-un-exercice-grandeur-nature-pour-se-preparer-aux-chaleurs-extremes-24322', 'P14, P15', 'Vérifié'),
 ('S2', 'Inserm, rapport d’étape du 25 septembre 2003 : 14 802 décès en excès en France du 1er au 20 août 2003 (+60 %), surtout des personnes âgées.', 'https://www.inserm.fr/wp-content/uploads/2017-11/inserm-rapportthematique-surmortalitecaniculeaout2003-rapportetape.pdf', 'P12, P16', 'Vérifié'),
 ('S3', 'Météo-France (validation du 19 juillet 2019) : record national de 46,0 °C à Vérargues (Hérault), le 28 juin 2019.', 'https://www.futura-sciences.com/planete/breves/meteorologie-record-absolu-temperature-france-eleve-finalement-46-c-919/', 'P17', 'Vérifié'),
 ('S4', 'Ville de Paris : record de 42,6 °C à Paris-Montsouris le 25 juillet 2019 (ancien record : 40,4 °C en 1947).', 'https://www.paris.fr/pages/temperatures-extremes-tempetes-tous-les-records-meteo-a-paris-20612', 'P03', 'Vérifié'),
 ('S5', 'Météo-France, synthèse sur le climat d’une France à +4 °C (mars 2025) : des records locaux de 50 °C « possibles dès l’horizon 2050 », « probables » en fin de siècle.', 'https://www.banquedesterritoires.fr/canicules-secheresses-inondations-quoi-se-preparer-dans-une-france-plus-chaude-de-4degc', 'P17', 'Vérifié'),
 ('S6', 'Santé publique France, synthèse des études InVS sur 2003 : avoir sa chambre sous les toits multipliait par 4 le risque de décès des personnes âgées vivant chez elles (OR 4,1).', 'https://www.santepubliquefrance.fr/index.php/climat/fortes-chaleurs-canicule/rapportsynthese/synthese-des-etudes-de-linvs-sur-les-facteurs-de-risquesimpacts-sanitaires-des-vagues-de-chaleur-en', 'P09', 'Vérifié'),
 ('S7', 'AFP / Euronews (juin 2026) : en plein soleil, le zinc des toits parisiens monte jusqu’à 70 à 80 °C ; les chambres de bonne comptent parmi les logements les plus dangereux en canicule.', 'https://fr.euronews.com/2026/06/25/a-paris-les-habitants-des-chambres-de-bonne-cuisent-sous-les-jolis-toits-en-zinc', 'P02', 'À recouper (70 ou 80 °C selon les sources)'),
 ('S8', 'SNCF Réseau (AFP) : le rail peut atteindre 60 °C quand l’air avoisine 40 °C ; l’acier se dilate et les trains doivent ralentir.', 'https://www.linfodurable.fr/sncf-la-canicule-met-les-rails-sous-tension-12199', 'P04', 'Vérifié'),
 ('S9', 'AFP : à Golfech, la réglementation oblige EDF à réduire ou arrêter la production quand la Garonne dépasse 28 °C.', 'https://www.linfodurable.fr/canicule-la-centrale-nucleaire-de-golfech-au-bord-de-la-garonne-arretee-57250', 'P05', 'Vérifié'),
 ('S10', 'Ministère de l’Éducation nationale : canicule de juin 2019, les épreuves écrites du brevet sont reportées aux 1er et 2 juillet.', 'https://www.education.gouv.fr/canicule-les-epreuves-ecrites-du-diplome-national-du-brevet-sont-reportees-aux-1er-et-2-juillet-456471', 'P06', 'Vérifié'),
 ('S11', 'Météo-France, brochure sur l’îlot de chaleur urbain : plus de 8 °C d’écart la nuit entre Paris et la campagne en août 2003.', 'https://meteofrance.fr/sites/meteofrance.fr/files/files/editorial/Brochure_ICU_web_V11.pdf', 'P08', 'Vérifié'),
 ('S12', 'Ville de Paris : en canicule, des parcs et jardins restent ouverts toute la nuit, en plus de ceux ouverts 24 h sur 24.', 'https://www.paris.fr/pages/canicule-a-chacun-son-coin-d-ombre-35681', 'P10', 'Vérifié'),
 ('S13', 'Ville de Paris : 203 « cours oasis » aménagées au début de 2025, objectif 360 en 2030.', 'https://www.paris.fr/pages/les-cours-oasis-7389', 'P18', 'À recouper (chiffre à mettre à jour)'),
]
page = {
 'eyebrow': 'Storyboard · What if · épisode 3',
 'lead': 'Paris s’enfonce dans une canicule de cinq jours qui culmine à 50 °C. On suit Inès, 21 ans, étudiante dans une chambre de bonne de 9 m² sous les toits en zinc. À la fin, la fiction rejoint la réalité : l’exercice « Paris à 50 °C » de 2023, la canicule de 2003 et le record de 2019.',
 'facts': ['9:16 · 1080 × 1920', '78,5 s', '19 plans', 'Sans voix off', 'Images rendues en 3D par code'],
 'acts': {'1': ['Acte 1', 'Le dôme de chaleur'], '2': ['Acte 2', '50 °C'], '3': ['Acte 3', 'Paris s’y prépare déjà']},
 'new': ['Sujet : une canicule qui pousse Paris jusqu’à 50 °C.', 'Déclencheur : les toits en zinc qui brûlent sous un soleil blanc.', 'Personnage : Inès, 21 ans, étudiante dans une chambre de bonne.', 'Chute : l’exercice « Paris à 50 °C », la canicule de 2003 et le record de 2019, puis les cours d’école plantées d’arbres.', 'Appel au partage : « Envoie ça à quelqu’un qui vit sous les toits. »', 'Durée : 78,5 s, comme les deux premiers épisodes.'],
 'defects': {
  'D01': ['Chaque conséquence suit une cause vérifiable : le zinc chauffe la chambre, l’acier des rails se dilate, l’eau des rivières refroidit les centrales, les climatiseurs rejettent leur chaleur dehors.', 'P02, P04, P05, P07'],
  'D02': ['Le compteur, la croix de la pharmacie et les sous-titres affichent le même chiffre, tiré d’une seule table.', 'P03, P11, P16, P17'],
  'D03': ['Tout texte du décor (croix de pharmacie, affiche de l’école, panneau de mesure, écrans de crise) est écrit proprement.', 'P03, P05, P06, P15'],
  'D04': ['Fiche personnage unique : Inès (débardeur jaune pâle, short en jean, chignon noir), identique dans chaque plan.', 'P02, P09, P10, P14'],
  'D06': ['Deux lignes au plus, coupées à la main sur les groupes de sens ; environ 17 caractères par seconde.', 'Tous'],
  'D07': ['Les toits brûlants dès la première image, sous un titre grand et contrasté ; le thermomètre grimpe dès 0:03.', 'P01, P02'],
  'D08': ['78,5 s en trois actes ; le thermomètre fait monter la tension de 36 à 50 °C, puis l’orage relâche.', 'Tous'],
  'D09': ['Aucun plan vide. Carton final de 4 s qui boucle sur les toits brûlants du premier plan.', 'P19'],
  'D10': ['La fiction rejoint la réalité chiffrée (2003, 2019, l’exercice de 2023), puis une note d’espoir : les cours d’école plantées d’arbres.', 'P14 à P18'],
  'D12': ['Chaque phrase a un sujet explicite.', 'P04, P05, P12'],
  'D13': ['Le libellé dit toujours ce que mesure le chiffre : température à Paris, canicule simulée, morts en excès, record de France, cours oasis.', 'P01, P15, P16, P17, P18'],
  'D14': ['Chaque chiffre réel renvoie à une source. Le zinc « jusqu’à 80 °C » reste à recouper : 70 ou 80 °C selon les sources.', 'P02 à P10, P15 à P18'],
  'D16': ['Un seul compteur à l’écran, toujours à la même place.', 'Tous'],
 },
 'sources': [list(s) for s in SRC],
 'fiction': 'Chiffres inventés pour la fiction : les températures de Paris (de 36 à 50 °C), les jours et les heures de la canicule, la chute de 20 degrés pendant l’orage et la température de la chambre d’Inès. Tous les autres chiffres sont réels et sourcés.',
 'validate': ['Le sujet, les 19 sous-titres et la chute.'],
 'page_title': 'Storyboard What if Canicule',
 'music': 'Une nappe sourde qui monte avec le thermomètre (P01 à P11), un silence écrasé à 50 °C (P11), l’orage qui libère la tension (P13), puis un piano en majeur sur la cour d’école plantée d’arbres (P18).',
 'light': 'Acte 1 soleil blanc et ombres dures, acte 2 nuits orangées sans fraîcheur puis l’orage, acte 3 lumière froide de la salle de crise, cartes vues de nuit et cour d’école verte à l’ombre.',
}
data = {'title': 'Et si Paris atteignait 50 °C ?', 'handle': '', 'page': page, 'shots': shots, 'anim': 'anim3.js'}
json.dump(data, open('projets/canicule/shots.json', 'w', encoding='utf-8'), ensure_ascii=False, indent=1)
print('ok', len(shots), 'shots', t0 + 4.0, 's')
