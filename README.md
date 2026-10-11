# Aurore Animation

Site web pour animer des personnages par JSON, avec export vidéo. Gratuit et illimité : tout tourne dans le navigateur.

## Utilisation

1. Ouvre `index.html` (serveur local, GitHub Pages ou Vercel).
2. Les personnages par défaut sont intégrés. La planche d'images est facultative : `assets/planche.jpg` ou bouton « Planche ».
3. Modifie le JSON de la scène puis clique sur « Appliquer ».
4. « Exporter la vidéo » télécharge le fichier.

## Personnages par défaut (`"char"`)

Modèles : `robo`, `blob`, `tri`, `bulb`, `cube`.

```json
{ "char": { "model": "robo", "color": "#5ee1ff", "fill": "#0b1a14", "eye": "#ffffff", "glow": 8, "seed": 1 },
  "x": 400, "y": 480, "scale": 1.5 }
```

## Contrôler le corps

Os : `head`, `body`, `armL`, `armR`, `legL`, `legR` (degrés, 0 = le long du corps, positif = écarté vers l'extérieur). Visage : `mouth` (`smile`, `open`, `sad`, `o`, `flat`, `talk`) et `eyes` (`open`, `happy`, `sad`, `blink`).

Poses clés (interpolées) :

```json
"pose": [ { "t": 0, "armR": 0, "mouth": "smile" }, { "t": 2, "armR": 150, "head": -10 } ]
```

Mouvement d'un os : `{ "type": "bone", "bone": "armL", "base": 30, "amp": 40, "freq": 1.5 }`

## Animations

Corps : `walk`, `jump`, `wave`, `dance`, `cry`, `laugh`, `say` (avec `text`), `face`, `bone`.
Mouvements : `pop`, `bounce`, `sway`, `float`, `squash`, `spin`, `shake`.

Chaque animation accepte `from` et `to` (temps de la scène en secondes).

## Monde

`worldWidth`, `camera: { follow, lead }`, `sky`, `ground`, `layers` (collines et arbres avec `parallax`), `path` pour les trajets.

## Prochaines étapes

- Voix (Piper TTS) et bouche synchronisée
- Rendu serveur Node + ffmpeg pour de longues vidéos
