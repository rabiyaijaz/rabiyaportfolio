import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createCharacter, createClips, CharacterAnimator, ACTIONS } from './character.js';

const $=s=>document.querySelector(s);
const stage=$('#stage');
const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
let renderer;
try {renderer=new THREE.WebGLRenderer({antialias:true,alpha:false});}
catch(error){$('#failure').hidden=false;throw error;}
renderer.setPixelRatio(Math.min(devicePixelRatio,2));renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;
renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.25;stage.appendChild(renderer.domElement);
const scene=new THREE.Scene();scene.background=new THREE.Color('#eeefe7');scene.fog=new THREE.Fog('#eeefe7',18,38);
const camera=new THREE.PerspectiveCamera(33,1,.05,70);
const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=2;controls.maxDistance=15;controls.maxPolarAngle=Math.PI*.49;controls.target.set(0,1.65,0);
scene.add(new THREE.HemisphereLight('#fff8ec','#a5ae95',2.6));
const key=new THREE.DirectionalLight('#fff0d9',3.4);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(2048,2048);key.shadow.normalBias=.025;Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.5,far:20});scene.add(key);
const rim=new THREE.DirectionalLight('#f1f6ed',2.0);rim.position.set(3,4,-4);scene.add(rim);
const floor=new THREE.Mesh(new THREE.PlaneGeometry(100,100),new THREE.MeshStandardMaterial({color:'#eeefe7',roughness:1}));floor.rotation.x=-Math.PI/2;floor.position.y=-.04;floor.receiveShadow=true;scene.add(floor);
const pad=new THREE.Mesh(new THREE.CylinderGeometry(1.44,1.48,.06,96),new THREE.MeshStandardMaterial({color:'#e1e5d7',roughness:.9}));pad.position.y=-.035;pad.receiveShadow=true;scene.add(pad);
const ring=new THREE.Mesh(new THREE.RingGeometry(1.56,1.565,96),new THREE.MeshBasicMaterial({color:'#bac6ab',side:THREE.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=-.025;scene.add(ring);
const model=createCharacter();const clips=createClips(model);scene.add(model.root);
const animator=new CharacterAnimator(model.root,clips);
const diamond=new THREE.Mesh(new THREE.OctahedronGeometry(.105),new THREE.MeshStandardMaterial({color:'#8cae68',metalness:.15,roughness:.28}));diamond.scale.y=1.65;diamond.position.y=3.5;scene.add(diamond);
let mode='studio',paused=reduced,autoIdle=!reduced,speed=1,selected='idle',destination=null,arrivalIndex=null,lastInput=0,elapsed=0;
const keys=new Set();const raycaster=new THREE.Raycaster(),pointer=new THREE.Vector2();const movement=new THREE.Vector3();
const icons=['◌','↗','◷','⌕','♧','✋','✳'];
Object.entries(ACTIONS).forEach(([name,action],index)=>{
  const b=document.createElement('button');b.className='action';b.dataset.action=name;b.setAttribute('aria-pressed',String(name==='idle'));
  b.innerHTML=`<span class="icon" aria-hidden="true">${icons[index]}</span>${action.label}<small>${String(index+1).padStart(2,'0')}</small>`;
  b.onclick=()=>{destination=null;arrivalIndex=null;$('#arrival').hidden=true;paused=false;updatePause();choose(name);};$('#actions').appendChild(b);
});
function choose(name){selected=name;animator.play(name);$('#status').textContent=ACTIONS[name].label;$('#action-description').textContent=ACTIONS[name].description;document.querySelectorAll('[data-action]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.action===name)));lastInput=elapsed;}
function updatePause(){$('#pause').textContent=paused?'▶':'Ⅱ';$('#pause').setAttribute('aria-pressed',String(paused));$('#pause').setAttribute('aria-label',paused?'Resume animation':'Pause animation');}
updatePause();$('#motion').setAttribute('aria-pressed',String(autoIdle));
$('#pause').onclick=()=>{paused=!paused;updatePause();};
$('#motion').onclick=()=>{autoIdle=!autoIdle;$('#motion').setAttribute('aria-pressed',String(autoIdle));if(!autoIdle&&selected==='wait')choose('idle');lastInput=elapsed;};
$('#speed').oninput=e=>{speed=Number(e.target.value);$('#speed-value').value=`${speed}×`;};
$('#timeline').oninput=e=>{
  paused=true;updatePause();animator.mixer.stopAllAction();
  const action=animator.actions[selected];action.reset().setEffectiveWeight(1).play();
  action.time=Number(e.target.value)/100*ACTIONS[selected].duration;animator.mixer.update(0);
};

function frame(kind='front') {
  const x=model.root.position.x,z=model.root.position.z;
  if(kind==='portrait'){camera.position.set(x+.18,2.83,z+2.5);controls.target.set(x,2.65,z);}
  else if(mode==='explore'){camera.position.set(7,8,10);controls.target.set(0,.5,0);}
  else {camera.position.set(.75,2.7,7.4);controls.target.set(-.32,1.64,0);}
  controls.update();
}
$('#front').onclick=()=>{if(mode==='studio')model.root.rotation.y=0;frame();};$('#portrait').onclick=()=>frame('portrait');
$('#reset').onclick=()=>{destination=null;arrivalIndex=null;keys.clear();model.root.position.set(0,0,0);model.root.rotation.set(0,0,0);choose('idle');$('#arrival').hidden=true;frame();};
frame();
const map=new THREE.Group();map.visible=false;scene.add(map);
const lots=[{name:'CysterCare',x:-2.6,z:-2,color:'#b8a4bb'},{name:'Vettio',x:2.6,z:-2,color:'#92aab7'},{name:'Access Adda',x:0,z:2.5,color:'#c4ad80'}];
function label(text){
  const c=document.createElement('canvas');c.width=512;c.height=100;const ctx=c.getContext('2d');
  ctx.fillStyle='#f8faf2';ctx.beginPath();ctx.roundRect(8,8,496,84,20);ctx.fill();ctx.fillStyle='#425139';ctx.font='500 32px Arial';ctx.textAlign='center';ctx.fillText(text,256,62);
  const texture=new THREE.CanvasTexture(c);texture.colorSpace=THREE.SRGBColorSpace;
  const sprite=new THREE.Sprite(new THREE.SpriteMaterial({map:texture,depthTest:false}));sprite.scale.set(1.8,.35,1);return sprite;
}
lots.forEach((lot,i)=>{
  const tile=new THREE.Mesh(new THREE.CylinderGeometry(.65,.68,.08,48),new THREE.MeshStandardMaterial({color:lot.color,roughness:.9}));tile.position.set(lot.x,0,lot.z);tile.receiveShadow=true;map.add(tile);
  const l=label(`${String(i+1).padStart(2,'0')}  ${lot.name}`);l.position.set(lot.x,.55,lot.z);map.add(l);
});
const grid=new THREE.GridHelper(10,20,'#c3cdb9','#dce2d2');grid.position.y=-.024;map.add(grid);
const targetMarker=new THREE.Mesh(new THREE.RingGeometry(.13,.19,40),new THREE.MeshBasicMaterial({color:'#7b9861',side:THREE.DoubleSide}));targetMarker.rotation.x=-Math.PI/2;targetMarker.visible=false;scene.add(targetMarker);
function setMode(next){mode=next;document.body.classList.toggle('exploring',mode==='explore');document.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.mode===mode)));map.visible=mode==='explore';pad.visible=ring.visible=mode==='studio';$('#destinations').hidden=mode!=='explore';$('#hint').textContent=mode==='explore'?'Click to walk · WASD / arrows · Drag to orbit':'Drag to orbit · Scroll to zoom';destination=null;arrivalIndex=null;targetMarker.visible=false;model.root.position.set(0,0,0);model.root.rotation.y=0;$('#arrival').hidden=true;choose('idle');frame();}
document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
function go(x,z,index=null){destination=new THREE.Vector3(THREE.MathUtils.clamp(x,-4.5,4.5),0,THREE.MathUtils.clamp(z,-4.5,4.5));arrivalIndex=index;targetMarker.position.set(destination.x,.065,destination.z);targetMarker.visible=true;$('#arrival').hidden=true;paused=false;updatePause();choose('walk');}
document.querySelectorAll('[data-destination]').forEach(b=>b.onclick=()=>{const i=Number(b.dataset.destination);go(lots[i].x,lots[i].z,i);});
$('#dismiss').onclick=()=>{$('#arrival').hidden=true;};
let down=null;
renderer.domElement.addEventListener('pointerdown',e=>{down={x:e.clientX,y:e.clientY};});
renderer.domElement.addEventListener('pointerup',e=>{
  if(mode!=='explore'||!down||Math.hypot(e.clientX-down.x,e.clientY-down.y)>6||e.button!==0)return;
  const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(pointer,camera);
  const p=new THREE.Vector3();if(raycaster.ray.intersectPlane(new THREE.Plane(new THREE.Vector3(0,1,0),0),p))go(p.x,p.z);stage.focus({preventScroll:true});
});
stage.addEventListener('keydown',e=>{if(mode==='explore'&&['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(e.key)){e.preventDefault();keys.add(e.key);destination=null;arrivalIndex=null;paused=false;updatePause();}});
window.addEventListener('keyup',e=>keys.delete(e.key));window.addEventListener('blur',()=>keys.clear());stage.addEventListener('blur',()=>keys.clear());
const dialog=$('#reference-dialog');$('#reference-open').onclick=()=>dialog.showModal();$('#reference-close').onclick=()=>dialog.close();
new ResizeObserver(()=>{const {width,height}=stage.getBoundingClientRect();renderer.setSize(width,height);camera.aspect=width/height;camera.updateProjectionMatrix();}).observe(stage);
let previous=performance.now();
function tick(now){
  const dt=Math.min((now-previous)/1000,.05);previous=now;
  if(!paused){
    elapsed+=dt;let moving=false;
    if(mode==='explore'){
      movement.set(0,0,0);
      if(keys.size){
        const forward=new THREE.Vector3();camera.getWorldDirection(forward);forward.y=0;forward.normalize();const right=new THREE.Vector3().crossVectors(forward,new THREE.Vector3(0,1,0));
        if(keys.has('w')||keys.has('ArrowUp'))movement.add(forward);if(keys.has('s')||keys.has('ArrowDown'))movement.sub(forward);if(keys.has('d')||keys.has('ArrowRight'))movement.add(right);if(keys.has('a')||keys.has('ArrowLeft'))movement.sub(right);
      }else if(destination){movement.copy(destination).sub(model.root.position);if(movement.length()<.07){model.root.position.copy(destination);destination=null;targetMarker.visible=false;const at=arrivalIndex??lots.findIndex(l=>Math.hypot(l.x-model.root.position.x,l.z-model.root.position.z)<.7);if(at>=0){$('#arrival-title').textContent=lots[at].name;$('#arrival').hidden=false;}choose('idle');movement.set(0,0,0);}}
      if(movement.lengthSq()>.0001){
        const step=Math.min(movement.length(),1.12*dt*speed);movement.normalize();model.root.position.addScaledVector(movement,step);model.root.position.x=THREE.MathUtils.clamp(model.root.position.x,-4.5,4.5);model.root.position.z=THREE.MathUtils.clamp(model.root.position.z,-4.5,4.5);
        const angle=Math.atan2(movement.x,movement.z),delta=Math.atan2(Math.sin(angle-model.root.rotation.y),Math.cos(angle-model.root.rotation.y));model.root.rotation.y+=delta*Math.min(1,dt*12);moving=true;if(selected!=='walk')choose('walk');
      }
      if(!moving&&selected==='walk'&&!destination&&keys.size===0)choose('idle');
    }
    if(autoIdle&&!moving&&selected==='idle'&&elapsed-lastInput>9)choose('wait');
    animator.update(dt*speed);$('#timeline').value=animator.actions[selected].time/ACTIONS[selected].duration*100;diamond.position.set(model.root.position.x,3.5+(!reduced?.035*Math.sin(elapsed*2):0),model.root.position.z);if(!reduced)diamond.rotation.y+=dt*.35;
  }
  controls.update();renderer.render(scene,camera);requestAnimationFrame(tick);
}
requestAnimationFrame(tick);
window.addEventListener('pagehide',()=>{animator.dispose();controls.dispose();renderer.dispose();});
