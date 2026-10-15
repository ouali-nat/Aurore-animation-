# Aurore Motion 🌱

Écris du JSON, vois ton animation en direct. Tout tourne dans le navigateur, sans dépendance ni installation.

## Utilisation

1. Ouvre `index.html` (GitHub Pages, Vercel ou serveur local).
2. Choisis un exemple ou modifie le JSON : l'aperçu se met à jour tout seul.
3. Les erreurs de JSON s'affichent sous l'éditeur.
4. Boutons : lecture/pause, curseur de position, vitesse, partage par lien, copie du JSON.

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

- Formes : `circle`, `rect`, `triangle`, `ring`, `ball` (boule à 4 trous), `text`.
- Position `x`, `y` : centre de l'élément dans la scène.
- Keyframes : `t` de 0 à 1, puis `x`, `y`, `scale`, `scaleX`, `scaleY`, `rotate`, `opacity`, `blur`, `color`, `easing`.
- Calque : `delay`, `duration`, `loop` (true, false ou nombre), `direction`, `easing`.
- Easings : `linear`, `ease`, `ease-in`, `ease-out`, `ease-in-out`, `spring`, `bounce`, ou `cubic-bezier(...)`.

## Prochaines étapes

- Export vidéo ou GIF
- Courbes d'easing visuelles
- Import de fichiers JSON Lottie
