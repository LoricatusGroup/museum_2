import sys
import re

with open("museum.html", "r", encoding="utf-8") as f:
    content = f.read()

# 1. Overlay Premium Text
content = re.sub(
    r'<div class="subtitle">─ 3 Szárny · 12 Mestermű ─</div>',
    r'<div class="subtitle">─ 4 Szárny · PRÉMIUM KIADÁS ─</div>',
    content
)

# 2. Add UI for Art Viewer and Crosshair
css_inject = """
#crosshair{position:fixed;top:50%;left:50%;width:10px;height:10px;transform:translate(-50%,-50%);border:2px solid rgba(255,255,255,0.7);border-radius:50%;pointer-events:none;z-index:45;display:none}
#crosshair.active{border-color:#ffcc00;box-shadow:0 0 8px #ffcc00}
#art-viewer{position:fixed;top:0;left:0;width:100%;height:100%;background:rgba(10,5,0,0.92);z-index:90;display:flex;flex-direction:column;align-items:center;justify-content:center;opacity:0;transition:opacity 0.4s;pointer-events:none}
#art-viewer.show{opacity:1;pointer-events:auto;backdrop-filter:blur(8px)}
#art-canvas-container{position:relative;width:90%;max-width:800px;display:flex;flex-direction:column;align-items:center}
#art-canvas-zoom{box-shadow:0 10px 40px rgba(0,0,0,0.9),0 0 0 6px #886622,0 0 0 10px #1a1005;max-width:100%;border-radius:3px;transform:scale(0.9);transition:transform 0.5s;object-fit:contain;background:#fff;}
#art-viewer.show #art-canvas-zoom{transform:scale(1)}
#art-title{color:#f0e6d3;font-family:'Press Start 2P',cursive;font-size:clamp(10px,2vw,18px);margin-top:20px;text-align:center;text-shadow:2px 2px 0 #000;line-height:1.5}
#art-desc{color:#aa9060;font-family:'VT323',monospace;font-size:clamp(16px,3vw,24px);margin-top:10px;text-align:center}
#art-desc p{max-width:600px;margin-top:10px;color:#c0b0a0;font-size:clamp(14px,2.5vw,20px);line-height:1.4}
#art-close{position:absolute;top:15px;right:25px;color:#c8a87a;font-family:'VT323',monospace;font-size:35px;cursor:pointer;width:40px;height:40px;line-height:35px;text-align:center;background:rgba(20,15,10,0.8);border-radius:50%;border:2px solid #a88833;transition:all 0.2s}
#art-close:hover{background:#c8a87a;color:#111;transform:scale(1.1)}
"""
content = content.replace("</style>", css_inject + "\n</style>")

ui_inject = """
<div id="crosshair"></div>
<div id="art-viewer">
  <div id="art-close">X</div>
  <div id="art-canvas-container">
    <canvas id="art-canvas-zoom"></canvas>
    <div id="art-title"></div>
    <div id="art-desc"></div>
  </div>
</div>
"""
content = content.replace('<div id="vignette"></div>', '<div id="vignette"></div>\n' + ui_inject)

# 3. Add South Wing constants
content = content.replace('var WEST = {x1:-70,x2:-10,z1:-10,z2:10};', 'var WEST = {x1:-70,x2:-10,z1:-10,z2:10};\nvar SOUTH = {x1:-10,x2:10,z1:10,z2:70};')

# 4. Update inBounds to include South Wing
inbounds_replacement = """  // South wing - overlap with hub at z=10
  if(x>=-9.2&&x<=9.2&&z>=8&&z<=69.2) return true;
  return false;"""
content = content.replace('return false;', inbounds_replacement, 1)

# 5. Update getWing to include South Wing
getwing_replacement = """  if(z>10) return "Déli Szárny · Szobrok";
  return "Központi Csarnok";"""
content = content.replace('return "Központi Csarnok";', getwing_replacement, 1)

# 6. Build Museum: Add South Wing walls, floors, ceilings
build_replacement = """
  // Floors & Ceilings
  addFloor(20,60,0,40,floorMat);        // South
  addCeil(20,60,0,40);

  // South wing: left & right walls, end wall
  addBox(0.3,5,60,wallMat,-10,2.5,40);
  addBox(0.3,5,60,wallMat,10,2.5,40);
  addBox(20.3,5,0.3,wallMat,0,2.5,70);

  // South baseboards
  addBox(0.1,0.25,60,baseMat2,-9.7,0.125,40);
  addBox(0.1,0.25,60,baseMat2,9.7,0.125,40);
  
  // South ceiling beams
  for(var z=15;z<=65;z+=10){addBox(20,0.12,0.3,new THREE.MeshStandardMaterial({color:0xc8b898}),0,4.93,z);}
  
  // South entrance arch
  addBox(1,0.2,0.3,accentMat,0,4.6,10);
  
  // South bench
  [30,50].forEach(function(z){addBox(3,0.12,1,benchMat,0,0.6,z);});
  
  // -- Glass Dome in Central Hub --
  var domeMat = new THREE.MeshPhysicalMaterial({color:0x88aacc,transmission:0.9,opacity:1,metalness:0,roughness:0,ior:1.5,thickness:0.5,side:THREE.DoubleSide});
  var dome = new THREE.Mesh(new THREE.SphereGeometry(8,16,16,0,Math.PI*2,0,Math.PI/2), domeMat);
  dome.position.set(0,5,0);scene.add(dome);
  var domeFrameMat = new THREE.MeshStandardMaterial({color:0x334455,roughness:0.8,metalness:0.4});
  for(var i=0;i<8;i++){
    var rib=new THREE.Mesh(new THREE.CylinderGeometry(0.1,0.1,13,8),domeFrameMat);
    rib.rotation.z=Math.PI/2;rib.rotation.y=i*Math.PI/8;
    rib.position.set(0,5,0);scene.add(rib);
  }
  
  // Remove the flat ceiling of the hub replacing it with dome implicitly by opening a hole (we didn't cut a hole, so let's hide the hub flat ceiling slightly by layering... actually, the easiest tweak is just to have the dome poke through the ceiling or let's just make the hub ceiling a frame). Let's patch addCeil(20,20,0,0);
"""
content = re.sub(r'addBox\(20\.3,5,0\.3,wallMat,0,2\.5,10\);', '// Removed south wall to open South wing', content)
content = re.sub(r'addBox\(20,0\.25,0\.1,baseMat2,0,0\.125,9\.7\);', '// Removed south baseboard', content)
content = content.replace('addCeil(20,20,0,0);', '// Hub ceiling removed for dome')
content = content.replace('// Floors & Ceilings', build_replacement)

# 7. Add Particles (Dust) and Sculptures + Audio setup
script_end_inject = """
// ── AMBIENT & AUDIO ──
var actx = null, pGain = null, ambOsc = null, ambGain = null;
var lastStep = 0, stepFlip = false;
function initAudio(){
  if(actx)return;
  var AudioContext = window.AudioContext || window.webkitAudioContext;
  actx = new AudioContext();
  pGain = actx.createGain(); pGain.gain.value = 0.15; pGain.connect(actx.destination);
  
  // Ambient rumble
  var bufSize = actx.sampleRate * 2;
  var buf = actx.createBuffer(1, bufSize, actx.sampleRate);
  var out = buf.getChannelData(0);
  for(var i=0;i<bufSize;i++) out[i] = Math.random()*2-1;
  var noise = actx.createBufferSource();
  noise.buffer = buf; noise.loop = true;
  var filter = actx.createBiquadFilter();
  filter.type = 'lowpass'; filter.frequency.value = 400;
  ambGain = actx.createGain(); ambGain.gain.value = 0.05;
  noise.connect(filter); filter.connect(ambGain); ambGain.connect(actx.destination);
  noise.start(0);
}

function playStep(){
  if(!actx)return;
  var o = actx.createOscillator();
  var gn = actx.createGain();
  o.type = 'sine'; o.frequency.setValueAtTime(stepFlip?200:240, actx.currentTime);
  o.frequency.exponentialRampToValueAtTime(40, actx.currentTime+0.05);
  gn.gain.setValueAtTime(1, actx.currentTime);
  gn.gain.exponentialRampToValueAtTime(0.01, actx.currentTime+0.08);
  o.connect(gn); gn.connect(pGain);
  o.start(); o.stop(actx.currentTime+0.1);
  stepFlip=!stepFlip;
}

// ── SCULPTURES (VOXEL) ──
function buildVoxelSculpture(x, z, ry, name, artist, year, voxels, hOff) {
  var grp = new THREE.Group();
  var mat = new THREE.MeshStandardMaterial({color:0xddeeee, roughness:0.2, metalness:0.1});
  var vs=0.15;
  for(var i=0;i<voxels.length;i++){
    for(var j=0;j<voxels[i].length;j++){
      var row=voxels[i][j];
      for(var k=0;k<row.length;k++){
         if(row[k]) {
           var m=new THREE.Mesh(new THREE.BoxGeometry(vs,vs,vs),mat);
           m.position.set(k*vs - row.length/2*vs, (voxels.length-i)*vs, j*vs - voxels[i].length/2*vs);
           m.castShadow=true;m.receiveShadow=true;grp.add(m);
         }
      }
    }
  }
  // Pedestal
  var pedMat = new THREE.MeshStandardMaterial({color:0x3a2a1a});
  var ped = new THREE.Mesh(new THREE.BoxGeometry(1.2, hOff, 1.2),pedMat);
  ped.position.y = -hOff/2; grp.add(ped);
  
  grp.position.set(x, hOff, z);
  grp.rotation.y = ry;
  grp.userData = {name:name, artist:artist, year:year, isSculpture:true};
  
  var plaqueMat=new THREE.MeshStandardMaterial({color:0xccaa44,roughness:0.3,metalness:0.6});
  var plaque=new THREE.Mesh(new THREE.BoxGeometry(0.8,0.2,0.03),plaqueMat);
  plaque.position.set(x, hOff*0.7, z+(ry===0?0.62:-0.62));
  scene.add(plaque);
  
  var sl=new THREE.SpotLight(0xffffff,2,10,Math.PI/6,0.3,1);
  sl.position.set(x,5,z);sl.target=grp;sl.castShadow=true;scene.add(sl);
  
  scene.add(grp); artMeshes.push(grp);
}

// ── PARTICLES ──
var pts;
function addDust(){
  var geo=new THREE.BufferGeometry();
  var pos=new Float32Array(1500*3);
  for(var i=0;i<1500*3;i++) pos[i]=(Math.random()-0.5)*140;
  geo.setAttribute('position',new THREE.BufferAttribute(pos,3));
  var mat=new THREE.PointsMaterial({color:0xffeedd,size:0.15,transparent:true,opacity:0.4,blending:THREE.AdditiveBlending,depthWrite:false});
  pts=new THREE.Points(geo,mat);
  pts.position.y=2.5;scene.add(pts);
}
"""

content = content.replace('function startMuseum(){', script_end_inject + '\nfunction startMuseum(){')

# Call addDust and buildVoxelSculpture in setup()
setup_addition = """
  addDust();
  // Bust 1
  buildVoxelSculpture(0, 25, 0, "Dávid (Voxel Mása)", "Michelangelo (Pixel Demake)", "1504", [
    [[0,0,0],[0,1,0],[0,0,0]],
    [[0,1,0],[1,1,1],[0,1,0]],
    [[0,1,0],[1,1,1],[0,1,0]],
    [[0,1,0],[0,1,0],[0,1,0]],
    [[1,1,1],[1,1,1],[1,1,1]]
  ], 1.5);
  // Bust 2
  buildVoxelSculpture(0, 45, Math.PI, "Milói Vénusz (Voxel)", "Alexandrosz", "i.e. 100", [
    [[0,1,0],[0,1,0],[0,0,0]],
    [[0,1,0],[1,1,1],[0,1,0]],
    [[0,1,0],[0,1,0],[0,0,0]],
    [[1,1,1],[1,1,1],[1,1,1]],
    [[1,1,1],[1,1,1],[1,1,1]]
  ], 1.5);
"""
content = content.replace('addLights();', 'addLights();\n' + setup_addition)

# Add south wing lights
south_lights = """
  // South wing lights
  for(var z=15;z<=65;z+=8){
    var l=new THREE.PointLight(0xffffff,0.5,16);l.position.set(0,4.8,z);scene.add(l);
    var l2=new THREE.PointLight(0xfff8f0,0.2,10);l2.position.set(-5,4.5,z);scene.add(l2);
    var l3=new THREE.PointLight(0xfff8f0,0.2,10);l3.position.set(5,4.5,z);scene.add(l3);
  }
"""
content = content.replace('// Spotlights on artworks', south_lights + '\n  // Spotlights on artworks')

# Sound init on startMuseum
content = content.replace('document.getElementById(\'vignette\').style.display=\'block\';', 'document.getElementById(\'vignette\').style.display=\'block\';\n  document.getElementById(\'crosshair\').style.display=\'block\';\n  initAudio();')

# Update loop for dust, footsteps, and raycaster interact
loop_addition = """
  if(pts){
     pts.rotation.y+=0.0005;
     var p=pts.geometry.attributes.position.array;
     for(var i=1;i<p.length;i+=3){
       p[i]-=0.01; if(p[i]<-2.5)p[i]=5;
     }
     pts.geometry.attributes.position.needsUpdate=true;
  }
  
  if(dx!==0||dz!==0){
     if(actx && actx.currentTime - lastStep > 0.45){ playStep(); lastStep=actx.currentTime; }
  }
"""
content = content.replace('if(dx!==0||dz!==0){', loop_addition + '\n  if(dx!==0||dz!==0){')

# Interactive Zoom Raycaster
raycast_inject = """
var targetArt = null;
var raycaster = new THREE.Raycaster();
var pointer = new THREE.Vector2(0,0);
renderer.domElement.addEventListener('click', function(e){
  if(dragging && Math.abs(e.clientX-dragX)>5) return;
  raycaster.setFromCamera(pointer, camera);
  var intersects = raycaster.intersectObjects(artMeshes, true);
  if(intersects.length > 0){
    var obj = intersects[0].object;
    while(obj.parent && obj.parent.type==='Group') obj = obj.parent;
    if(obj.userData.name && !obj.userData.isSculpture){
      openArt(obj);
    }
  }
});
document.getElementById('art-close').addEventListener('click', function(){
  document.getElementById('art-viewer').classList.remove('show');
});
function openArt(obj){
  var ud = obj.userData;
  document.getElementById('art-title').innerHTML = ud.name + " <br><span style='font-size:0.6em;color:#da0'>" + ud.year + "</span>";
  document.getElementById('art-desc').innerHTML = "Festette: " + ud.artist + "<p>Ez a pixel art reprodukció tisztelgés a világ egyik legcsodálatosabb alkotása előtt.</p>";
  
  // Find painting data to redraw on big canvas
  var artData = paintings.find(function(p){return p.name===ud.name;});
  if(artData){
    var tmp = document.createElement('canvas'); tmp.width = artData.pw; tmp.height = artData.ph;
    artData.paint(tmp.getContext('2d'));
    var zc = document.getElementById('art-canvas-zoom');
    var maxW = Math.min(window.innerWidth*0.8, 600);
    var sc = Math.floor(maxW / artData.pw);
    if(sc<1)sc=1;
    zc.width = artData.pw * sc; zc.height = artData.ph * sc;
    var zx = zc.getContext('2d');
    zx.imageSmoothingEnabled = false;
    zx.fillRect(0,0,zc.width,zc.height);
    zx.drawImage(tmp, 0, 0, zc.width, zc.height);
  }
  document.getElementById('art-viewer').classList.add('show');
}
"""
content = content.replace('setup();', raycast_inject + '\nsetup();')

# Minimap fix for South Wing
minimap_fix = """
    mx.fillRect(ox-10*s,oy+10*s,20*s,60*s); // South
    mx.strokeRect(ox-10*s,oy+10*s,20*s,60*s);
"""
content = content.replace('mx.fillRect(ox-10*s,oy-10*s,20*s,20*s); // Hub', 'mx.fillRect(ox-10*s,oy-10*s,20*s,20*s); // Hub\n'+minimap_fix)

with open("museum.html", "w", encoding="utf-8") as f:
    f.write(content)
