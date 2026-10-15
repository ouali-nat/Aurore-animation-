# Aurore Motion 🌱

Écris du JSON, vois ton animation en direct. Tout tourne dans le navigateur, sans dépendance ni installation.

## Utilisation

1. Ouvre `index.html` (GitHub Pages, Vercel ou serveur local).
2. Choisis un exemple ou modifie le JSON : l'aperçu se met à jour tout seul.
3. Les erreurs de JSON s'affichent sous l'éditeur.
4. Boutons : lecture/pause (relance à la fin), curseur de position, vitesse, partage par lien, copie du JSON.

## Format

```json
{
  "width": 360, "height": 360, "background": "#0d0b1f", "duration": 1400, "loop": true,
  "layers": [{
    "shape": "ball", "size": 120, "easing": "linear",
    "keyframes": [
      { "t": 0, "rotate": 0 },
      { "t": 1, "rotate": 360 }
    ]
  }]
}
```

- Formes : `circle`, `rect`, `triangle`, `ring`, `ball` (boule à 4 trous), `text`, `image`.
- Position `x`, `y` : centre de l'élément dans la scène.
- Keyframes : `t` de 0 à 1, puis `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`, `opacity`, `blur`, `glow`, `color`, `easing`.
- Calque : `delay`, `duration` (ms), `loop` (true, false ou nombre), `direction`, `easing`.
- Groupes : `groups` + `"group": "nom"` sur un calque. Un groupe sert aussi de **caméra** (zoom, rotation).
- Easings : `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `spring`, `bounce`, `easeOutExpo`, `easeInExpo`, `easeInOutExpo`, `easeOutBack`, `easeInOutCubic`, `easeOutCubic`, `easeInCubic`, `easeOutElastic`, ou `cubic-bezier(...)`.

## Nouveautés

- `gradient` + `angle` : dégradé sur `circle`, `rect`, `triangle` et `text`.
- `glow` (rayon en px, animable) + `glowColor` : halo lumineux.
- `weight`, `font`, `fontSize` sur le texte.
- `"split": true` + `stagger` (ms) sur un `text` : le texte arrive lettre par lettre.
- `"shape": "burst"` : gerbe de particules (`count`, `x`, `y`, `distance` [min,max], `pSize` [min,max], `colors`, `life`, `spread`, `gravity`, `delay`, `seed`).
- `"shape": "wordburst"` : mots projetés en étoile (`words`, `distance`, `fontSize` [min,max], `colors`, `stagger`, `life`, `rotate`, `delay`, `seed`).
- Exemples « Explosion (burst) » et « ChatGPT 45 s » (`examples/chatgpt-45s.json`, 1080×1920, 45 s, lecture unique).
- Le lien de partage ne contient le JSON que s'il est court (moins de 6000 caractères).

## Prochaines étapes

- Export vidéo ou GIF
- Courbes d'easing visuelles
- Import de fichiers JSON Lottie
