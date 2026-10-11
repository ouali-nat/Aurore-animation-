# Aurore Animation

Site web pour animer des mascottes à partir d'une planche d'images, piloté par un fichier JSON, avec export vidéo. Gratuit et illimité : tout tourne dans le navigateur.

## Utilisation

1. Ouvre le site déployé ou sers `index.html` depuis un serveur local.
2. Ajoute ta planche dans `assets/planche.jpg`, ou choisis-la avec le bouton « Planche » sur la page.
3. Les personnages sont découpés automatiquement et numérotés (galerie en bas de page).
4. Édite le JSON de la scène (`scene.json`) puis clique sur « Appliquer ».
5. Clique sur « Exporter la vidéo » pour télécharger le fichier.

## Déploiement Vercel

Le projet est relié au dépôt GitHub `ouali-nat/Aurore-animation-`. La branche de production attendue est `main`, et le site est un projet statique : aucun framework ni commande de compilation n'est nécessaire. Après un push sur `main`, Vercel peut lancer automatiquement un nouveau déploiement à partir de la racine du dépôt. Vérifie que le déploiement affiche l'état **Ready** dans le tableau de bord avant de partager son URL.

## Format de scène

```json
{
  "width": 720, "height": 720, "fps": 30, "duration": 6, "background": "#000",
  "tracks": [
    { "sprite": 0, "x": 120, "y": 300, "scale": 2, "start": 0,
      "anims": [ { "type": "pop" }, { "type": "bounce", "amp": 40, "freq": 1 } ] }
  ]
}
```

Animations disponibles : `pop`, `bounce`, `sway`, `float`, `squash`, `spin`, `shake`.

## Prochaines étapes

- Voix (Piper TTS) et mouvement de bouche synchronisé
- Rendu serveur Node + ffmpeg pour de longues vidéos
