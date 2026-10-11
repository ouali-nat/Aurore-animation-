import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js';

/* Aurore Animation — studio de personnages humains 3D.
   Modèles procéduraux paramétriques ; aucune image de sprite n'est utilisée pour le corps.
   Chaque partie (tête, cheveux, torse, bras, mains, jambes, chaussures) est un maillage 3D distinct.
*/
(() => {
'use strict';
const $ = id => document.getElementById(id);
const status = message => { $('status').textContent = message; };
const deepCopy = value => JSON.parse(JSON.stringify(value));
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const hex = value => /^#[0-9a-f]{6}$/i.test(value || '') ? value : '#808080';
let catalogue = [], currentIndex = 0, current = null, rig = null;
let scene, camera, renderer, clock, playing = false, elapsed = 0;
let orbit = { theta: 0.18, phi: 1.43, distance: 5.8, dragging: false, x: 0, y: 0 };
let recorder = null, recordChunks = [], stopRecordingAt = 0;

function material(color, roughness = .65, metalness = 0) {
  return new THREE.MeshStandardMaterial({ color: hex(color), roughness, metalness });
}
function addMesh(parent, geometry, mat, position = [0,0,0], scale = [1,1,1], name = '') {
  const mesh = new THREE.Mesh(geometry, mat);
  mesh.position.set(position[0], position[1], position[2]);
  mesh.scale.set(scale[0], scale[1], scale[2]);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  if (name) mesh.name = name;
  parent.add(mesh);
  return mesh;
}
function sphere(parent, mat, position, scale, name = '') {
  return addMesh(parent, new THREE.SphereGeometry(1, 32, 24), mat, position, scale, name);
}
function tube(parent, points, radius, mat, name = '') {
  const curve = new THREE.CatmullRomCurve3(points.map(p => new THREE.Vector3(p[0], p[1], p[2])));
  return addMesh(parent, new THREE.TubeGeometry(curve, Math.max(12, points.length * 8), radius, 8, false), mat, [0,0,0], [1,1,1], name);
}
function bone(parent, a, b, topRadius, bottomRadius, mat, name = '') {
  const va = new THREE.Vector3(...a), vb = new THREE.Vector3(...b);
  const dir = new THREE.Vector3().subVectors(vb, va);
  const mesh = addMesh(parent, new THREE.CylinderGeometry(topRadius, bottomRadius, dir.length(), 20, 1), mat,
    [(va.x+vb.x)/2,(va.y+vb.y)/2,(va.z+vb.z)/2], [1,1,1], name);
  mesh.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0), dir.normalize());
  return mesh;
}
function standardScene() {
  const canvas = $('stage');
  renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(canvas.clientWidth || 960, canvas.clientHeight || 600, false);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.16;
  scene = new THREE.Scene();
  scene.background = new THREE.Color('#12182b');
  scene.fog = new THREE.Fog('#12182b', 9, 22);
  camera = new THREE.PerspectiveCamera(34, 960 / 600, .1, 100);
  clock = new THREE.Clock();
  scene.add(new THREE.HemisphereLight('#dce8ff', '#343046', 2.15));
  const key = new THREE.DirectionalLight('#fff0dd', 3.2);
  key.position.set(-3.8, 6.5, 5.4); key.castShadow = true;
  key.shadow.mapSize.set(1536, 1536);
  key.shadow.camera.left = -5; key.shadow.camera.right = 5;
  key.shadow.camera.top = 6; key.shadow.camera.bottom = -4;
  scene.add(key);
  const fill = new THREE.DirectionalLight('#8bafff', 1.7); fill.position.set(4, 3, -2); scene.add(fill);
  const rim = new THREE.PointLight('#ffb58a', 18, 10); rim.position.set(-2, 2.7, -2.5); scene.add(rim);
  const floorMat = new THREE.MeshStandardMaterial({ color: '#252d42', roughness: .83, metalness: .08 });
  const floor = addMesh(scene, new THREE.PlaneGeometry(120, 120), floorMat, [0,-.045,0], [1,1,1], 'studio-floor');
  floor.rotation.x = -Math.PI / 2; floor.receiveShadow = true;
  const ring = new THREE.Mesh(new THREE.TorusGeometry(1.04, .012, 8, 120), new THREE.MeshStandardMaterial({ color:'#667bb8', roughness:.5, metalness:.25 }));
  ring.rotation.x = -Math.PI/2; ring.position.y = -.025; ring.receiveShadow = true; scene.add(ring);
  updateCamera();
  canvas.addEventListener('pointerdown', onPointerDown);
  window.addEventListener('pointermove', onPointerMove);
  window.addEventListener('pointerup', () => { orbit.dragging = false; });
  canvas.addEventListener('wheel', e => { e.preventDefault(); orbit.distance = clamp(orbit.distance + e.deltaY * .004, 3.1, 9.5); updateCamera(); }, { passive:false });
  window.addEventListener('resize', resize);
}
function updateCamera() {
  if (!camera) return;
  const target = new THREE.Vector3(0, 1.2, 0);
  camera.position.set(
    target.x + orbit.distance * Math.sin(orbit.phi) * Math.sin(orbit.theta),
    target.y + orbit.distance * Math.cos(orbit.phi),
    target.z + orbit.distance * Math.sin(orbit.phi) * Math.cos(orbit.theta)
  );
  camera.lookAt(target);
}
function onPointerDown(e) {
  orbit.dragging = true; orbit.x = e.clientX; orbit.y = e.clientY;
  if (e.currentTarget.setPointerCapture) e.currentTarget.setPointerCapture(e.pointerId);
}
function onPointerMove(e) {
  if (!orbit.dragging) return;
  const dx = e.clientX - orbit.x, dy = e.clientY - orbit.y;
  orbit.x = e.clientX; orbit.y = e.clientY;
  orbit.theta -= dx * .008;
  orbit.phi = clamp(orbit.phi + dy * .006, .3, 2.65);
  updateCamera();
}
function resize() {
  if (!renderer || !camera) return;
  const c = $('stage'), w = Math.max(1, c.clientWidth), h = Math.max(1, c.clientHeight);
  renderer.setSize(w, h, false); camera.aspect = w / h; camera.updateProjectionMatrix();
}

function headGeometry(face) {
  const geometry = new THREE.SphereGeometry(1, 48, 40);
  const p = geometry.attributes.position;
  for (let i = 0; i < p.count; i++) {
    let x = p.getX(i), y = p.getY(i), z = p.getZ(i);
    const chin = clamp((-y + .05) / 1.05, 0, 1);
    let jaw = face.jaw ?? 1;
    if (face.shape === 'round') jaw = Math.max(jaw, .96);
    if (face.shape === 'heart') jaw *= 1 - .18 * chin;
    if (face.shape === 'square') jaw *= 1 + .13 * chin;
    if (face.shape === 'long') y *= 1.08;
    x *= 1 + (jaw - 1) * chin;
    if (face.shape === 'heart') x *= 1 + .08 * (1 - Math.abs(y));
    p.setXYZ(i, x, y, z);
  }
  geometry.computeVertexNormals();
  return geometry;
}
function makeClothTorso(parent, preset, cloth) {
  const body = preset.body || {}, outfit = preset.outfit || {};
  const pts = [
    new THREE.Vector2(.155,-.42), new THREE.Vector2(.205,-.34),
    new THREE.Vector2(.235,-.17), new THREE.Vector2(.255,-.04),
    new THREE.Vector2(.295,.17), new THREE.Vector2(.365,.32),
    new THREE.Vector2(.34,.405), new THREE.Vector2(.23,.47),
    new THREE.Vector2(.15,.47)
  ];
  const geom = new THREE.LatheGeometry(pts, 48);
  const pos = geom.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const y = pos.getY(i);
    let f = y < -.1 ? (body.waist || 1) : (body.shoulderWidth || 1);
    pos.setX(i, pos.getX(i) * f);
    pos.setZ(i, pos.getZ(i) * f);
  }
  geom.computeVertexNormals();
  const torso = addMesh(parent, geom, cloth, [0,1.25,0], [1,1,1], 'torso-clothing');
  const neckMat = material(preset.skin, .76);
  bone(parent, [0,1.57,0], [0,1.79,0], .09, .105, neckMat, 'neck');
  sphere(parent, neckMat, [0,1.64,0], [.10,.10,.105], 'neck-joint');

  const trim = material(outfit.trimColor || '#d8c79a', .48, .08);
  if (outfit.style === 'shirt' || outfit.style === 'uniform') {
    // Collar points and a subtle front placket make the garment read as tailored clothing.
    const collarGeom = new THREE.BufferGeometry();
    const vertices = new Float32Array([
      -.105,1.65,.205, -.015,1.60,.245, -.035,1.48,.248,
       .105,1.65,.205,  .015,1.60,.245,  .035,1.48,.248
    ]);
    collarGeom.setAttribute('position', new THREE.BufferAttribute(vertices,3));
    collarGeom.setIndex([0,1,2,3,5,4]); collarGeom.computeVertexNormals();
    const collar = new THREE.Mesh(collarGeom, trim); collar.material.side = THREE.DoubleSide; parent.add(collar);
    bone(parent,[0,1.55,.26],[0,.97,.255],.008,.008,trim,'shirt-placket');
    for(let i=0;i<3;i++) sphere(parent, trim, [0,1.42-i*.13,.264], [.012,.012,.008], 'shirt-button');
  } else if (outfit.style === 'jacket' || outfit.style === 'hoodie') {
    bone(parent,[-.018,1.66,.23],[-.018,.88,.245],.014,.018,trim,'jacket-seam');
    bone(parent,[.018,1.66,.23],[.018,.88,.245],.014,.018,trim,'jacket-seam');
    if(outfit.style === 'hoodie') {
      const hood = sphere(parent, cloth, [0,1.65,-.09],[.22,.22,.17],'hood-back');
      hood.material = cloth;
      tube(parent,[[-.13,1.68,.12],[-.1,1.76,.06],[0,1.79,.03],[.1,1.76,.06],[.13,1.68,.12]],.025,trim,'hood-edge');
      bone(parent,[-.055,1.26,.25],[-.055,1.03,.29],.009,.009,trim,'hood-string');
      bone(parent,[.055,1.26,.25],[.055,1.03,.29],.009,.009,trim,'hood-string');
    }
  } else if (outfit.style === 'tshirt') {
    tube(parent,[[-.17,1.55,.16],[-.1,1.61,.22],[0,1.63,.25],[.1,1.61,.22],[.17,1.55,.16]],.014,trim,'tshirt-collar');
  } else if (outfit.style === 'dress') {
    const belt = new THREE.Mesh(new THREE.TorusGeometry(.20,.025,8,48), trim);
    belt.position.set(0,.91,0); belt.scale.z=.8; parent.add(belt);
  }
  if (outfit.style === 'dress') {
    const skirt = new THREE.Mesh(new THREE.CylinderGeometry(.42,.57,.58,48,1,false), cloth);
    skirt.position.set(0,.83,0); skirt.scale.z=.78; skirt.castShadow=true; skirt.receiveShadow=true; parent.add(skirt);
    const hem = new THREE.Mesh(new THREE.TorusGeometry(.53,.014,6,64), trim);
    hem.position.set(0,.54,0); hem.scale.z=.78; parent.add(hem);
  }
  return torso;
}
function makeHair(parent, p, headScaleX, headScaleY, headScaleZ) {
  const hair = p.hair || {}, style = hair.style || 'short';
  const hc = material(hair.color || '#251c1c', .45);
  const secondary = material(hair.color || '#251c1c', .53);
  const hs = new THREE.Group(); hs.position.set(0,.015,-.005); parent.add(hs);
  if (style === 'buzz') {
    // Very short hair still follows the whole skull silhouette instead of leaving a bare cap-shaped gap.
    sphere(hs,hc,[0,.375,-.015],[.405*headScaleX,.145*headScaleY,.38*headScaleZ],'buzz-cut');
    return hs;
  }
  // An upper hemisphere covers the scalp while keeping the brows and eyes visible.
  addMesh(hs,new THREE.SphereGeometry(1,40,24,0,Math.PI*2,0,Math.PI/2),hc,
    [0,.16,-.015],[.405*headScaleX,.355*headScaleY,.38*headScaleZ],'hair-cap');
  if (style === 'afro') {
    for (let i=0;i<38;i++) {
      const a = i*2.39996, yy = .11 + ((i%7)/7)*.37;
      const rr = Math.sqrt(Math.max(.03,1-Math.pow((yy-.22)/.43,2)));
      sphere(hs, i%4===0?secondary:hc, [Math.cos(a)*.39*rr,yy,Math.sin(a)*.34*rr-.015],
        [.075,.075,.072],'afro-curl');
    }
    return hs;
  }
  if (style === 'curls' || style === 'messy') {
    const n = style === 'messy' ? 15 : 23;
    for(let i=0;i<n;i++){
      const a=i*2.39996, rad=.30+(.035*(i%3));
      sphere(hs,i%4===0?secondary:hc,[Math.cos(a)*rad,.22+((i%5)*.035),Math.sin(a)*rad*.78],
        style==='messy'?[.105,.105,.095]:[.078,.075,.074],'curl');
    }
    if(style==='messy') for(let i=0;i<5;i++) {
      const x=(i-2)*.11;
      sphere(hs,hc,[x,.42+(.04*(i%2)),.20],[.105,.13,.10],'messy-fringe');
    }
  }
  if (style === 'long' || style === 'bob' || style === 'sidepart' || style === 'ponytail' || style === 'braids') {
    const len = style==='bob'?.32:style==='long'?.63:style==='braids'?.53:.43;
    sphere(hs,hc,[0,-.08,-.12],[.37,len+.18,.255],'back-hair');
    for (const side of [-1,1]) {
      const yEnd = style==='bob' ? -.30 : style==='long' ? -.62 : style==='braids' ? -.51 : -.4;
      sphere(hs,hc,[side*.30,-.04,-.005],[.115,.30,.125],'side-lock');
      bone(hs,[side*.3,-.08,.02],[side*.32,yEnd,.02],style==='braids'?.062:.086,style==='braids'?.045:.07,hc,'long-hair-lock');
      if (style === 'braids') {
        for(let j=0;j<8;j++){
          const y=-.08-j*.055;
          sphere(hs,j%2?hc:secondary,[side*(.32+(j%2?-.018:.018)),y,.035],[.064,.043,.06],'braid-link');
        }
      }
    }
  }
  if (style === 'ponytail') {
    sphere(hs,hc,[0,.06,-.34],[.16,.18,.16],'ponytail-tie');
    bone(hs,[0,.03,-.36],[.02,-.34,-.47],.12,.085,hc,'ponytail');
    sphere(hs,hc,[.02,-.35,-.47],[.09,.12,.09],'ponytail-tip');
  }
  if (style === 'short' || style === 'sidepart') {
    for(let i=0;i<6;i++) {
      const x=(i-2.5)*.105;
      sphere(hs,hc,[x,.35+((i%2)*.025),.20],[.09,.13,.095],'fringe');
    }
    if(style==='sidepart') {
      const sweep=sphere(hs,hc,[-.08,.37,.24],[.24,.105,.10],'side-swept-fringe');
      sweep.rotation.z=-.22;
    }
  }
  if(style==='bob') {
    for(const side of [-1,1]) sphere(hs,hc,[side*.31,-.23,.055],[.105,.19,.12],'bob-end');
  }
  if (style === 'long') {
    for(let i=-2;i<=2;i++) sphere(hs,hc,[i*.12,.32,.19],[.085,.12,.08],'front-fringe');
  }
  return hs;
}
function makeFace(headGroup, p, face, headScales) {
  const skinMat=material(p.skin,.72), shadowSkin=material(p.skin,.77);
  const featureScale=headScales[0];
  // Shape and scale of the underlying skull, with a separate mesh for every facial feature.
  const headMesh=addMesh(headGroup,headGeometry(face),skinMat,[0,0,0],[.405*(face.width||1)*featureScale,.515*(face.height||1)*headScales[1],.355*headScales[2]],'face-head');
  headMesh.geometry.computeVertexNormals();
  for(const side of [-1,1]) {
    sphere(headGroup,skinMat,[side*.395,0,0],[.083,.12,.08],'ear');
    sphere(headGroup,shadowSkin,[side*.424,-.005,.035],[.032,.059,.026],'inner-ear');
  }
  const eyeMat=material('#fff7ed',.22), irisMat=material(face.irisColor||'#5d806b',.27,.05);
  const pupilMat=material('#12121a',.15), highlight=new THREE.MeshStandardMaterial({color:'#ffffff',roughness:.06,emissive:'#525252'});
  const lineMat=material('#39251f',.52), browMat=material(p.hair?.color||'#251c1c',.7);
  const eyeS=face.eyeScale||1, spacing=face.eyeSpacing||1;
  const ex=.143*spacing*(face.width||1), eyeY=.063, eyeZ=.324;
  for(const side of [-1,1]) {
    const eg=new THREE.Group(); eg.position.set(side*ex,eyeY,eyeZ); eg.rotation.z=side*(face.eyeTilt||0)*Math.PI/180; headGroup.add(eg);
    sphere(eg,eyeMat,[0,0,0],[.071*eyeS,.087*eyeS,.037],'eye-white');
    sphere(eg,irisMat,[.008,.001,.032],[.038*eyeS,.046*eyeS,.014],'iris');
    sphere(eg,pupilMat,[.009,.002,.044],[.020*eyeS,.027*eyeS,.009],'pupil');
    sphere(eg,highlight,[-.006,.022,.052],[.010,.012,.006],'eye-highlight');
    sphere(eg,highlight,[.025,-.012,.05],[.004,.005,.003],'eye-glint');
    tube(eg,[[-.068*eyeS,.012,.022],[-.045*eyeS,.067*eyeS,.027],[0,.078*eyeS,.027],[.047*eyeS,.061*eyeS,.027],[.068*eyeS,.018,.022]],.008,lineMat,'upper-eyelid');
    const browY=.136*eyeS;
    tube(eg,[[-.073*eyeS,browY-.004,.01],[-.035*eyeS,browY+.012*(face.browThickness||1),.014],[.025*eyeS,browY+.015*(face.browThickness||1),.014],[.073*eyeS,browY-.006,.01]],.009*(face.browThickness||1),browMat,'eyebrow');
    if(face.blush) {
      const blushMat=new THREE.MeshStandardMaterial({color:'#d96f76',transparent:true,opacity:.30,roughness:1});
      sphere(eg.parent,blushMat,[side*.205,-.075,.245],[.07,.027,.012],'blush');
    }
  }
  // Soft nose bridge, tip and small nostril shadows create real depth rather than printed lines.
  const noseMat=material(p.skin,.75);
  sphere(headGroup,noseMat,[0,-.012,.343],[.052,.105,.070*(face.noseSize||1)],'nose-bridge');
  sphere(headGroup,noseMat,[0,-.075,.395],[.071,.049,.060*(face.noseSize||1)],'nose-tip');
  const nostril=material('#754535',.85);
  for(const side of [-1,1]) sphere(headGroup,nostril,[side*.035,-.091,.431],[.013,.009,.008],'nostril');
  // Inner mouth + sculpted lip curves. Animation changes the inner mouth height.
  const mouth = new THREE.Group(); mouth.position.set(0,-.175,.343); headGroup.add(mouth);
  const lipMat=material(face.lipColor||'#a6535b',.42), innerMat=material('#4b2028',.8);
  const inner=sphere(mouth,innerMat,[0,0,.028],[.073*(face.mouthWidth||1),.020,.012],'mouth-inner');
  tube(mouth,[[-.078,0,.032],[-.046,.014,.037],[0,.006,.039],[.045,.015,.037],[.078,0,.032]],.008,lipMat,'upper-lip');
  tube(mouth,[[-.071,-.005,.032],[-.04,-.022,.035],[0,-.027,.036],[.042,-.02,.035],[.071,-.005,.032]],.007,lipMat,'lower-lip');
  let defaultExpression=face.expression||'smile';
  if(defaultExpression==='flat') { inner.scale.y=.003; }
  if(defaultExpression==='sad') mouth.rotation.z=Math.PI;
  if(defaultExpression==='surprised') { inner.scale.y=.032; inner.scale.x=.035; }
  if(face.freckles) {
    const freckleMat=material('#9b5c47',.9);
    for(const side of [-1,1]) for(let i=0;i<4;i++)
      sphere(headGroup,freckleMat,[side*(.145+(i%2)*.026),-.03-Math.floor(i/2)*.022,.321],[.006,.006,.004],'freckle');
  }
  return {headMesh, mouth, mouthInner:inner};
}
function addAccessories(root, preset, headGroup) {
  const a=preset.outfit?.accessory;
  if(!a||a==='none') return;
  const metal=material('#e6c77e',.27,.72), frame=material('#2e3143',.28,.4);
  if(a==='earrings') for(const s of [-1,1]) {
    const r=new THREE.Mesh(new THREE.TorusGeometry(.027,.006,8,18),metal);
    r.position.set(s*.42,-.12,.015); root.add(r);
  }
  if(a==='glasses') {
    for(const s of [-1,1]) {
      const lens=new THREE.Mesh(new THREE.TorusGeometry(.071,.007,8,32),frame);
      lens.position.set(s*.145,.063,.365); headGroup.add(lens);
    }
    bone(headGroup,[-.08,.07,.365],[.08,.07,.365],.008,.008,frame,'glasses-bridge');
    bone(headGroup,[-.22,.08,.32],[-.26,.05,.20],.008,.007,frame,'glasses-arm');
    bone(headGroup,[.22,.08,.32],[.26,.05,.20],.008,.007,frame,'glasses-arm');
  }
  if(a==='wristband') for(const s of [-1,1]) {
    const br=new THREE.Mesh(new THREE.TorusGeometry(.073,.014,8,24),metal);
    br.position.set(s*.38,1.03,.0); br.rotation.x=Math.PI/2; root.add(br);
  }
  if(a==='stethoscope') {
    const tubing=material('#304f65',.5);
    tube(root,[[-.11,1.53,.23],[-.14,1.36,.27],[-.10,1.17,.29],[0,1.13,.30],[.10,1.17,.29]],.014,tubing,'stethoscope-tube');
    sphere(root,metal,[.1,1.16,.30],[.038,.045,.018],'stethoscope-chestpiece');
  }
}
function createHuman(preset) {
  const root=new THREE.Group(); root.name=preset.id||preset.name||'humanoid';
  const outfit=preset.outfit||{}, body=preset.body||{}, face=preset.face||{}, hair=preset.hair||{};
  const skin=material(preset.skin||'#b78060',.72);
  const top=material(outfit.topColor||'#4c6f9b',.7), bottom=material(outfit.bottomColor||'#283248',.76);
  const trim=material(outfit.trimColor||'#d4bd83',.5,.1), shoe=material(outfit.shoeColor||'#262633',.48);
  const factor=body.height||1;
  root.scale.set(1,factor,1);
  root.position.y=0;
  const headScale=body.headScale||1;
  const faceNode=new THREE.Group(); faceNode.position.set(0,1.99,0); faceNode.scale.set(headScale,headScale,headScale); root.add(faceNode);
  const hScales=[1,1,1];
  const facial=makeFace(faceNode,preset,face,hScales);
  makeHair(faceNode,preset,face.width||1,face.height||1,1);
  // Torso and waistline.
  makeClothTorso(root,preset,top);
  sphere(root,skin,[0,.885,0],[.22,.13,.19],'hip');
  // Tailored waistband.
  const waist=new THREE.Mesh(new THREE.CylinderGeometry(.245*(body.waist||1),.25*(body.waist||1),.07,32),trim);
  waist.position.set(0,.90,0); root.add(waist);
  // Legs are independent articulated thigh/shin joints with separate footwear.
  const legs=[];
  for(const side of [-1,1]) {
    const hip=new THREE.Group(); hip.position.set(side*.16,.88,0); root.add(hip);
    const thighLength=.47*(body.legLength||1), shinLength=.42*(body.legLength||1);
    bone(hip,[0,0,0],[0,-thighLength,0],.115*(body.muscle||1),.083*(body.muscle||1),bottom,'thigh');
    sphere(hip,skin,[0,-thighLength,0],[.085,.083,.087],'knee-joint');
    bone(hip,[0,-thighLength,0],[0,-thighLength-shinLength,0],.078,.058, bottom,'shin-pants');
    // Subtle seam and shaped shoe, toe facing the camera (+Z).
    bone(hip,[side*.012,-.09,.073],[side*.012,-thighLength-shinLength+.02,.073],.004,.004,trim,'trouser-seam');
    sphere(hip,shoe,[0,-thighLength-shinLength-.015,.085],[.105,.067,.18],'shoe');
    sphere(hip,trim,[0,-thighLength-shinLength-.005,.10],[.063,.014,.012],'shoe-detail');
    legs.push({hip, side});
  }
  // For a dress, keep legs underneath and let the skirt form the silhouette.
  // Arms include upper sleeves, exposed forearms, palms and individual fingers.
  const arms=[];
  for(const side of [-1,1]) {
    const shoulder=new THREE.Group(); shoulder.position.set(side*.34,1.59,0); root.add(shoulder);
    sphere(shoulder,top,[0,-.015,0],[.115,.125,.115],'shoulder');
    const upper=.34*(body.armLength||1), lower=.29*(body.armLength||1);
    bone(shoulder,[0,0,0],[0,-upper,0],.092,.067,top,'upper-sleeve');
    sphere(shoulder,skin,[0,-upper,0],[.071,.071,.071],'elbow');
    bone(shoulder,[0,-upper,0],[0,-upper-lower,0],.064,.043,skin,'forearm');
    const hand=new THREE.Group(); hand.position.set(0,-upper-lower,0); shoulder.add(hand);
    sphere(hand,skin,[0,-.045,.006],[.058*(body.handSize||1),.078,.035],'palm');
    for(let i=0;i<4;i++) {
      const fx=(i-1.5)*.026*(body.handSize||1), fl=.065+(1-Math.abs(i-1.5))*.009;
      bone(hand,[fx,-.085,.008],[fx,-.085-fl,.012],.012,.008,skin,'finger');
    }
    bone(hand,[side*.043,-.04,.006],[side*.071,-.091,.02],.017,.009,skin,'thumb');
    arms.push({shoulder,hand,side});
  }
  // Outfit details are separate meshes so accessories and clothing colors can be swapped.
  if(outfit.style==='jacket') {
    for(const side of [-1,1]) {
      const lapel=addMesh(root,new THREE.BoxGeometry(.085,.40,.025),trim,[side*.12,1.40,.245],[1,1,1],'lapel');
      lapel.rotation.z=side*.2;
    }
  }
  if(outfit.style==='uniform') {
    const patch=addMesh(root,new THREE.BoxGeometry(.095,.065,.012),trim,[-.18,1.40,.241],[1,1,1],'uniform-patch');
  }
  if(outfit.style==='tshirt') {
    const logo=addMesh(root,new THREE.CircleGeometry(.055,24),trim,[0,1.34,.255],[1,1,1],'shirt-emblem');
  }
  addAccessories(root,preset,faceNode);
  return {root, head:faceNode, facial, arms, legs, torso:root.getObjectByName('torso-clothing'), preset};
}
function disposeRig(old) {
  if(!old) return;
  scene.remove(old.root);
  old.root.traverse(o => {
    if(o.geometry) o.geometry.dispose();
    if(o.material) {
      if(Array.isArray(o.material)) o.material.forEach(m=>m.dispose());
      else o.material.dispose();
    }
  });
}
function showCurrent() {
  if(!scene || !catalogue.length) return;
  if(rig) disposeRig(rig);
  current=catalogue[currentIndex];
  rig=createHuman(current);
  scene.add(rig.root);
  $('animation').value=current.animation?.type||'idle';
  fillControls(current);
  $('json').value=JSON.stringify(current,null,2);
  renderCatalog();
  status(current.name+' — personnage 3D prêt. Modifie ses traits puis applique le JSON.');
  elapsed=0;
}
function fillControls(p) {
  $('skin').value=hex(p.skin);
  $('hairColor').value=hex(p.hair?.color);
  $('topColor').value=hex(p.outfit?.topColor);
  $('bottomColor').value=hex(p.outfit?.bottomColor);
  $('eyesColor').value=hex(p.face?.irisColor);
  $('hairStyle').value=p.hair?.style||'short';
  $('faceShape').value=p.face?.shape||'oval';
  $('headScale').value=String(p.body?.headScale||1);
}
function renderCatalog() {
  const el=$('catalog'); el.replaceChildren();
  catalogue.forEach((p,i)=>{
    const b=document.createElement('button'); b.className='person'+(i===currentIndex?' active':'');
    const name=document.createElement('strong'); name.textContent=p.name||('Personnage '+(i+1));
    const role=document.createElement('small'); role.textContent=p.role||'Personnage';
    b.append(name,role); b.title='Afficher '+(p.name||'ce personnage');
    b.addEventListener('click',()=>{currentIndex=i; showCurrent();});
    el.appendChild(b);
  });
}
function applyColors() {
  if(!current) return;
  current.skin=$('skin').value;
  current.hair=current.hair||{}; current.hair.color=$('hairColor').value; current.hair.style=$('hairStyle').value;
  current.outfit=current.outfit||{}; current.outfit.topColor=$('topColor').value; current.outfit.bottomColor=$('bottomColor').value;
  current.face=current.face||{}; current.face.irisColor=$('eyesColor').value; current.face.shape=$('faceShape').value;
  current.body=current.body||{}; current.body.headScale=Number($('headScale').value);
  $('json').value=JSON.stringify(current,null,2);
  if(rig) disposeRig(rig);
  rig=createHuman(current); scene.add(rig.root);
  renderCatalog();
}
function applyJSON() {
  try {
    const value=JSON.parse($('json').value);
    if(value && Array.isArray(value.characters)) {
      if(value.characters.length!==20) throw new Error('Le catalogue doit contenir 20 personnages.');
      catalogue=value.characters;
      currentIndex=clamp(catalogue.findIndex(p=>p.id===current?.id),0,catalogue.length-1);
    } else if(value && typeof value==='object' && value.id) {
      const idx=catalogue.findIndex(p=>p.id===value.id);
      if(idx<0) throw new Error('ID inconnu. Modifie un personnage existant ou importe un catalogue complet de 20 personnes.');
      catalogue[idx]=value; currentIndex=idx;
    } else {
      throw new Error('JSON attendu : un personnage avec son champ id, ou un catalogue {"characters":[...]} de 20 personnages.');
    }
    showCurrent();
    status('JSON valide et appliqué. Clique sur « Enregistrer les 20 personnages » pour télécharger le catalogue.');
  } catch(err) {
    status('JSON non appliqué : '+err.message);
  }
}
function downloadCatalogue() {
  const data={version:1,description:'Catalogue de personnages 3D Aurore Animation personnalisable par JSON.',characters:catalogue};
  const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json;charset=utf-8'});
  const url=URL.createObjectURL(blob), a=document.createElement('a');
  a.href=url; a.download='aurore-personnages-3d.json'; a.click();
  setTimeout(()=>URL.revokeObjectURL(url),1000);
  status('Catalogue JSON téléchargé. Réimporte-le après une nouvelle session pour retrouver les modifications.');
}
function importJSON(file) {
  if(!file) return;
  const reader=new FileReader();
  reader.onload=()=>{
    try{
      const data=JSON.parse(reader.result);
      const list=Array.isArray(data)?data:data.characters;
      if(!Array.isArray(list)||list.length!==20) throw new Error('Le fichier doit contenir exactement 20 personnages dans characters.');
      if(list.some(p=>!p||!p.id||!p.name)) throw new Error('Chaque personnage doit posséder id et name.');
      catalogue=list; currentIndex=0; showCurrent(); status('Catalogue de 20 personnages importé.');
    }catch(e){status('Import impossible : '+e.message);}
  };
  reader.onerror=()=>status('Lecture du fichier JSON impossible.');
  reader.readAsText(file);
}
function animatePose(time, dt) {
  if(!rig) return;
  const p=rig.preset, anim=p.animation||{}, speed=Number(anim.speed||1), phase=Number(anim.phase||0);
  const t=(playing?time:elapsed)*speed+phase, type=anim.type||'idle';
  rig.root.position.y=0; rig.root.rotation.y=0;
  rig.head.rotation.set(0,0,0);
  rig.arms.forEach(a=>{a.shoulder.rotation.set(0,0,a.side*.055);a.hand.rotation.set(0,0,0);});
  rig.legs.forEach(l=>{l.hip.rotation.set(0,0,0);});
  if(rig.torso) rig.torso.scale.y=1+Math.sin(t*2.15)*.009;
  rig.head.rotation.y=Math.sin(t*.63)*.035;
  rig.head.rotation.z=Math.sin(t*.9)*.018;
  const L=side=>rig.legs.find(l=>l.side===side);
  const A=side=>rig.arms.find(a=>a.side===side);
  if(type==='walk'||type==='run') {
    const f=type==='run'?8.8:5.2, amp=type==='run'?.75:.48;
    rig.legs.forEach(l=>l.hip.rotation.x=Math.sin(t*f+(l.side===1?Math.PI:0))*amp);
    rig.arms.forEach(a=>a.shoulder.rotation.x=Math.sin(t*f+(a.side===1?0:Math.PI))*amp*.65);
    rig.root.position.y=Math.abs(Math.sin(t*f))* (type==='run'?.07:.025);
    rig.root.rotation.z=Math.sin(t*f)*.018;
  } else if(type==='wave') {
    const arm=A(1); if(arm){arm.shoulder.rotation.z=2.55+Math.sin(t*8)*.25;arm.shoulder.rotation.x=-.22;arm.hand.rotation.z=Math.sin(t*8)*.48;}
    const other=A(-1); if(other) other.shoulder.rotation.z=-.08;
    rig.head.rotation.z=Math.sin(t*2)*.035;
  } else if(type==='jump') {
    const f=(t%1.45)/1.45, height=Math.sin(Math.PI*f);
    rig.root.position.y=height*.56;
    rig.legs.forEach(l=>{l.hip.rotation.x=(l.side===1?1:-1)*height*.38;});
    rig.arms.forEach(a=>{a.shoulder.rotation.z=a.side* (1.85+height*.32);});
  } else if(type==='dance') {
    rig.root.rotation.y=Math.sin(t*2.7)*.28; rig.root.position.y=Math.abs(Math.sin(t*5.4))*.11;
    rig.head.rotation.z=Math.sin(t*5.4)*.07;
    rig.arms.forEach(a=>{a.shoulder.rotation.z=a.side*(1.05+Math.sin(t*5.4+a.side)*.62);a.shoulder.rotation.x=Math.cos(t*2.7)*.2;});
    rig.legs.forEach(l=>l.hip.rotation.x=Math.sin(t*5.4+l.side)*.4);
  } else if(type==='pose') {
    const arm=A(1); if(arm){arm.shoulder.rotation.z=1.85;arm.shoulder.rotation.x=-.18;}
    const arm2=A(-1); if(arm2) arm2.shoulder.rotation.z=-.7;
    rig.head.rotation.z=-.06;
  } else if(type==='sad') {
    rig.head.rotation.z=.1; rig.head.rotation.x=.12;
    rig.arms.forEach(a=>a.shoulder.rotation.z=-a.side*.15);
  } else if(type==='talk') {
    rig.head.rotation.y=Math.sin(t*1.6)*.07;
    rig.arms.forEach(a=>{a.shoulder.rotation.z=a.side*(.12+Math.max(0,Math.sin(t*4))* .24);});
  } else {
    rig.arms.forEach(a=>{a.shoulder.rotation.z+=a.side*(.025+Math.sin(t*1.5+a.side)*.025);});
  }
  if(rig.facial?.mouthInner) {
    const m=rig.facial.mouthInner;
    const base=(type==='talk')?(.35+Math.abs(Math.sin(t*12))*.9):(type==='jump'&&rig.root.position.y>.3?.8:.55);
    m.scale.y=.020*base;
  }
}
function renderLoop() {
  requestAnimationFrame(renderLoop);
  const dt=Math.min(clock.getDelta(),.05);
  if(playing) elapsed+=dt;
  animatePose(elapsed,dt);
  if(renderer&&scene&&camera) renderer.render(scene,camera);
  if(recorder&&recorder.state==='recording'&&performance.now()>=stopRecordingAt) recorder.stop();
}
function togglePlay() {
  playing=!playing;
  $('play').textContent=playing?'Ⅱ Pause':'▶ Lecture';
  if(playing) clock.getDelta();
  status(playing?'Animation en lecture.':'Animation en pause.');
}
function restart() { elapsed=0; playing=true; $('play').textContent='Ⅱ Pause'; }
function startRecording() {
  if(!renderer?.domElement?.captureStream||!window.MediaRecorder) {
    status('Cet navigateur ne prend pas en charge la capture vidéo WebGL. Essaie Chrome ou Firefox récent.');
    return;
  }
  const types=['video/webm;codecs=vp9','video/webm','video/mp4'];
  const mime=types.find(t=>MediaRecorder.isTypeSupported(t));
  if(!mime){status('Aucun format vidéo pris en charge par ce navigateur.');return;}
  recordChunks=[];
  try {
    const stream=renderer.domElement.captureStream(30);
    recorder=new MediaRecorder(stream,mime?{mimeType:mime,videoBitsPerSecond:6000000}:{videoBitsPerSecond:6000000});
    recorder.ondataavailable=e=>{if(e.data&&e.data.size)recordChunks.push(e.data);};
    recorder.onerror=()=>status('Erreur pendant la capture vidéo.');
    recorder.onstop=()=>{
      const type=mime.split(';')[0], blob=new Blob(recordChunks,{type});
      const url=URL.createObjectURL(blob), a=document.createElement('a');
      a.href=url; a.download='aurore-'+(current?.id||'personnage')+'.'+(mime.includes('mp4')?'mp4':'webm'); a.click();
      setTimeout(()=>URL.revokeObjectURL(url),1000);
      recorder=null; $('record').disabled=false; $('record').textContent='Exporter la vidéo';
      status('Capture terminée. La vidéo a été téléchargée.');
    };
    elapsed=0; playing=true; $('play').textContent='Ⅱ Pause';
    stopRecordingAt=performance.now()+8000;
    $('record').disabled=true; $('record').textContent='Capture…';
    recorder.start(200); status('Enregistrement de 8 secondes en cours…');
  }catch(e){recorder=null;$('record').disabled=false;$('record').textContent='Exporter la vidéo';status('Capture impossible : '+e.message);}
}

$('play').addEventListener('click',togglePlay);
$('reset').addEventListener('click',restart);
$('record').addEventListener('click',startRecording);
$('apply').addEventListener('click',applyJSON);
$('download').addEventListener('click',downloadCatalogue);
$('import').addEventListener('change',e=>importJSON(e.target.files?.[0]));
['skin','hairColor','topColor','bottomColor','eyesColor','hairStyle','faceShape','headScale'].forEach(id=>{
  $(id).addEventListener('change',applyColors);
  if(id==='headScale') $(id).addEventListener('input',applyColors);
});
$('animation').addEventListener('change',()=>{
  if(!current)return;
  current.animation=current.animation||{};current.animation.type=$('animation').value;
  $('json').value=JSON.stringify(current,null,2);
  status('Animation « '+$('animation').selectedOptions[0].textContent+' » sélectionnée. Enregistre le JSON pour la conserver.');
});

standardScene();
fetch('./characters-3d.json').then(r=>{if(!r.ok)throw new Error('HTTP '+r.status);return r.json();}).then(data=>{
  if(!Array.isArray(data.characters)||data.characters.length!==20)throw new Error('Le catalogue ne contient pas exactement 20 personnages.');
  catalogue=data.characters;
  showCurrent();
  resize();
  renderLoop();
}).catch(err=>{
  status('Impossible de charger characters-3d.json : '+err.message+'. Vérifie que le fichier est publié à côté de cette page.');
  renderLoop();
});
})();
