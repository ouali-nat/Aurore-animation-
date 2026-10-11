/* Aurore Animation — portraits 3D en relief, construits à partir des SVG originaux.
   On conserve le dessin validé du catalogue 2D (visage, proportions, coiffure, vêtements,
   lunettes, traits et couleurs). La faible extrusion donne du volume sans réinventer
   ni déformer les personnages en primitives géométriques. */
(function (g) {
  const T = g.THREE;
  const cache = new Map();
  const loader = new T.TextureLoader();
  const MODEL_HEIGHT = 4.55;
  const MODEL_WIDTH = MODEL_HEIGHT * 200 / 450;
  const DEPTH = 0.15;
  const LAYERS = 18;

  function setColorSpace(texture) {
    // Three.js r149 utilisait "encoding"; les versions recentes utilisent "colorSpace".
    if ('colorSpace' in texture && T.SRGBColorSpace) texture.colorSpace = T.SRGBColorSpace;
    else if ('encoding' in texture && T.sRGBEncoding) texture.encoding = T.sRGBEncoding;
  }

  function buildAssets(c) {
    if (cache.has(c.id)) return cache.get(c.id);
    if (typeof g.drawCharacterFull !== 'function') {
      throw new Error('Le dessin vectoriel complet drawCharacterFull() est introuvable.');
    }

    const sw = 1024, sh = Math.round(sw * 450 / 200);
    let svg = g.drawCharacterFull(c, sw);
    // SVGLoader/TextureLoader doit recevoir des dimensions explicites pour mobile et desktop.
    svg = svg.replace('width="' + sw + '"', 'width="' + sw + '" height="' + sh + '"');
    const uri = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);

    const assets = {
      front: null,
      sideTexture: null,
      frontMaterial: null,
      sideMaterial: null,
      ready: false,
      error: null,
      listeners: []
    };

    assets.front = loader.load(uri, function (texture) {
      setColorSpace(texture);
      texture.needsUpdate = true;

      try {
        const image = texture.image;
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth || sw;
        canvas.height = image.naturalHeight || sh;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-in';
        ctx.fillStyle = '#34231f';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.globalCompositeOperation = 'source-over';
        assets.sideTexture = new T.CanvasTexture(canvas);
        setColorSpace(assets.sideTexture);
        assets.sideTexture.needsUpdate = true;
        assets.sideMaterial.map = assets.sideTexture;
        assets.sideMaterial.needsUpdate = true;
        assets.ready = true;
        assets.listeners.forEach(fn => fn(null));
        assets.listeners.length = 0;
      } catch (err) {
        assets.error = 'Impossible de préparer le relief : ' + err.message;
        assets.listeners.forEach(fn => fn(assets.error));
        assets.listeners.length = 0;
      }
    }, undefined, function (err) {
      assets.error = 'Le dessin SVG ne peut pas être chargé.';
      assets.listeners.forEach(fn => fn(assets.error));
      assets.listeners.length = 0;
      console.error('Échec du chargement du portrait 2D', c.id, err);
    });

    assets.frontMaterial = new T.MeshBasicMaterial({
      map: assets.front,
      transparent: true,
      alphaTest: 0.015,
      side: T.DoubleSide,
      depthWrite: true
    });
    assets.sideMaterial = new T.MeshBasicMaterial({
      transparent: true,
      alphaTest: 0.015,
      side: T.DoubleSide,
      depthWrite: true
    });
    cache.set(c.id, assets);
    return assets;
  }

  g.buildCharacter3D = function (c) {
    const assets = buildAssets(c);
    const root = new T.Group();
    root.name = c.name || c.id || 'Personnage Aurore';
    const geometry = new T.PlaneGeometry(MODEL_WIDTH, MODEL_HEIGHT);

    // Les couches sombres se superposent comme une tranche découpée dans une figurine.
    // Elles restent entièrement transparentes hors du contour SVG réel du personnage.
    for (let i = 0; i < LAYERS; i++) {
      const z = -DEPTH / 2 + (DEPTH * i / (LAYERS - 1));
      const edge = new T.Mesh(geometry, assets.sideMaterial);
      edge.position.set(0, MODEL_HEIGHT / 2, z);
      edge.scale.set(1.006, 1.006, 1);
      edge.renderOrder = i + 1;
      edge.name = 'relief-' + i;
      root.add(edge);
    }

    // Le plan frontal affiche exactement le SVG source — sans recréer les traits en primitives.
    const face = new T.Mesh(geometry, assets.frontMaterial);
    face.position.set(0, MODEL_HEIGHT / 2, DEPTH / 2 + 0.002);
    face.renderOrder = 100;
    face.name = 'illustration-2d-originale';
    root.add(face);

    const o = {
      root,
      c,
      anim: 'idle',
      pivot: 0,
      ready: assets.ready,
      error: assets.error,
      onReady(fn) {
        if (assets.ready) fn(null);
        else if (assets.error) fn(assets.error);
        else assets.listeners.push(err => {
          o.ready = !err;
          o.error = err || null;
          fn(err || null);
        });
      }
    };
    return o;
  };

  // Les mouvements restent volontairement doux pour préserver l'expression graphique des SVG.
  g.poseCharacter3D = function (o, t) {
    const a = o.anim || 'idle';
    const s = Math.sin(t * (a === 'run' ? 8 : a === 'dance' ? 5 : 3.2));
    let bounce = 0, tilt = 0, turn = 0;

    if (a === 'walk') { bounce = Math.abs(s) * 0.022; tilt = s * 0.018; }
    if (a === 'run') { bounce = Math.abs(s) * 0.055; tilt = s * 0.032; }
    if (a === 'wave') { tilt = Math.sin(t * 4) * 0.026 - 0.018; }
    if (a === 'dance') { bounce = Math.abs(s) * 0.045; tilt = s * 0.055; turn = s * 0.12; }
    if (a === 'talk') { tilt = Math.sin(t * 2.3) * 0.018; }
    if (a === 'jump') { bounce = Math.abs(Math.sin(t * 3)) * 0.18; tilt = Math.sin(t * 3) * 0.015; }
    if (a === 'pose') { tilt = -0.025; turn = 0.02; }

    o.root.position.y = bounce + (a === 'idle' ? Math.sin(t * 1.7) * 0.008 : 0);
    o.root.rotation.z = tilt;
    o.root.rotation.x = Math.sin(t * 1.2) * 0.008;
    o.pivot = turn;
  };
})(window);
