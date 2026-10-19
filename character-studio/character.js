import * as THREE from 'three';

// A deliberately stylized, articulated prototype. Every surface is real geometry.
// Units are meters; +Y is up and +Z is forward. Locomotion belongs to the controller.
const TAU = Math.PI * 2;
const mat = (color, roughness = .8, metalness = 0) => new THREE.MeshStandardMaterial({ color, roughness, metalness });

export function createCharacter() {
  const root = new THREE.Group(); root.name = 'Rabiya';
  const joints = {};
  const materials = {
    skin: mat('#d99c76'), nose: mat('#d09370'), black: mat('#17191b'), pants: mat('#292a2c'),
    shoe: mat('#171819', .3), sole: mat('#101112'), hair: mat('#382116', .62),
    hairLight: mat('#58351f', .65), hairMid: mat('#46291a', .65), lips: mat('#934a43', .53),
    white: mat('#f5e5d7'), iris: mat('#39271f', .45), pupil: mat('#0c0b0a', .3), silver: mat('#bfc8ca', .24, .85),
    cup: mat('#8b9b72', .38), coffee: mat('#362118', .3),
  };
  function joint(name, parent, x = 0, y = 0, z = 0) {
    const g = new THREE.Group(); g.name = name; g.position.set(x,y,z); parent.add(g); joints[name] = g; return g;
  }
  function mesh(geo, material, parent, p = [0,0,0], s = [1,1,1]) {
    const m = new THREE.Mesh(geo, material); m.position.set(...p); m.scale.set(...s); m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  function ball(parent, material, p, s, detail = 24) { return mesh(new THREE.SphereGeometry(1,detail,16),material,parent,p,s); }
  function tube(parent, points, radius, material, segments = 32) {
    return mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,8,false),material,parent);
  }
  // Elliptical ring lofts make a fitted torso and flared trousers, avoiding box-shaped limbs.
  function loft(parent, rings, material, segments = 32) {
    const vertices = [], indices = [];
    for (const [y, rx, rz, z = 0] of rings) for (let i=0;i<=segments;i++) {
      const a = i / segments * TAU; vertices.push(Math.cos(a)*rx,y,Math.sin(a)*rz+z);
    }
    for(let j=0;j<rings.length-1;j++) for(let i=0;i<segments;i++) {
      const a=j*(segments+1)+i,b=a+segments+1; indices.push(a,b,a+1,b,b+1,a+1);
    }
    // Close both ends so elbows and knees remain solid from every viewing angle.
    for (const j of [0,rings.length-1]) {
      const center=vertices.length/3; vertices.push(0,rings[j][0],rings[j][3]||0);
      for(let i=0;i<segments;i++) {
        const a=j*(segments+1)+i; indices.push(...(j===0?[center,a,a+1]:[center,a+1,a]));
      }
    }
    if(rings[1][0]<rings[0][0])for(let i=0;i<indices.length;i+=3)[indices[i+1],indices[i+2]]=[indices[i+2],indices[i+1]];
    const g=new THREE.BufferGeometry(); g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();
    return mesh(g,material,parent);
  }
  const hips = joint('hips',root,0,1.38,0);
  ball(hips,materials.pants,[0,.05,0],[.34,.24,.2]);
  const torso = joint('torso',hips,0,.08,0);
  loft(torso,[[0,.32,.2],[.12,.30,.19],[.29,.255,.17],[.47,.29,.20],[.64,.34,.22],[.79,.35,.19],[.87,.29,.15],[.91,.16,.13]],materials.black);
  // Ribbing is geometry, so the export needs no external textures.
  for(let i=0;i<40;i++) {
    const a=i/40*TAU;
    tube(torso,[[.32*Math.cos(a),.02,.201*Math.sin(a)],[.256*Math.cos(a),.29,.172*Math.sin(a)],[.34*Math.cos(a),.64,.222*Math.sin(a)],[.29*Math.cos(a),.87,.152*Math.sin(a)]],.0028,materials.pants,12);
  }
  mesh(new THREE.CylinderGeometry(.147,.16,.22,32),materials.black,torso,[0,.95,0]);
  for(let i=0;i<28;i++) {
    const a=i/28*TAU;tube(torso,[[.158*Math.cos(a),.85,.158*Math.sin(a)],[.149*Math.cos(a),1.06,.149*Math.sin(a)]],.0035,materials.pants,2);
  }
  const head=joint('head',torso,0,1.27,0);
  ball(head,materials.skin,[0,-.01,.01],[.315,.395,.275],40);
  ball(head,materials.skin,[0,-.245,.06],[.228,.14,.185]);
  for(const s of [-1,1]) {
    ball(head,materials.skin,[s*.3,-.02,0],[.065,.103,.047]);
    const eye=joint(s<0?'eyeL':'eyeR',head,s*.127,.035,.244);
    ball(eye,materials.white,[0,0,0],[.093,.044,.032]);
    ball(eye,materials.iris,[0,0,.027],[.035,.035,.014]);
    ball(eye,materials.pupil,[0,0,.04],[.017,.023,.006]);
    ball(eye,materials.white,[-.008,.012,.045],[.006,.006,.003],12);
    tube(head,[[s*.21,.05,.255],[s*.14,.077,.277],[s*.06,.047,.268]],.008,materials.hair,12);
    tube(head,[[s*.215,.155,.228],[s*.14,.174,.25],[s*.075,.157,.254]],.018,materials.hair,12);
  }
  ball(head,materials.nose,[0,-.075,.274],[.047,.08,.056]);
  ball(head,materials.skin,[0,-.105,.303],[.055,.035,.04]);
  // Soft cupid's bow and lower lip, both following the face surface.
  tube(head,[[-.092,-.183,.251],[-.037,-.175,.281],[0,-.184,.285],[.035,-.176,.281],[.088,-.182,.251]],.018,materials.lips,20);
  tube(head,[[-.082,-.185,.253],[0,-.212,.283],[.082,-.184,.253]],.021,materials.lips,20);
  const glasses=joint('glasses',head,0,0,.01);
  for(const s of [-1,1]) {
    const pts=[];
    for(let i=0;i<=36;i++){const a=i/36*TAU;pts.push([s*.139+Math.cos(a)*.119,.027+Math.sin(a)*.078,.278-Math.abs(Math.cos(a))*.012]);}
    tube(glasses,pts,.011,materials.black,40);
    tube(glasses,[[s*.255,.05,.27],[s*.313,.065,.11],[s*.315,.025,-.04]],.009,materials.black,12);
    ball(glasses,materials.silver,[s*.244,.069,.276],[.005,.005,.005],8);
  }
  tube(glasses,[[-.024,.043,.278],[0,.057,.287],[.024,.043,.278]],.012,materials.black,8);
  const hoop=mesh(new THREE.TorusGeometry(.027,.005,8,28,Math.PI*1.75),materials.silver,head,[-.052,-.104,.315]);hoop.rotation.z=.4;
  ball(head,materials.silver,[.054,-.237,.249],[.009,.009,.009],12);

  const hair=joint('hair',head);
  mesh(new THREE.SphereGeometry(1,40,22,0,TAU,0,Math.PI*.51),materials.hair,hair,[0,.022,-.025],[.35,.43,.30]);
  // Tapered, flattened locks: chestnut waves with a few restrained highlights.
  function lock(parent,points,width,depth,material) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)));
    const g=new THREE.TubeGeometry(curve,36,1,8,false),pos=g.attributes.position;
    // Rebuild tube vertices using its local frames with a tapered elliptical cross-section.
    const frames=curve.computeFrenetFrames(36,false);
    for(let i=0;i<=36;i++) {
      const t=i/36,p=curve.getPointAt(t), taper=Math.pow(Math.sin(Math.PI*(.12+.88*t)),.55)*.9+.025;
      for(let j=0;j<=8;j++) {
        const a=j/8*TAU,v=p.clone().addScaledVector(frames.normals[i],Math.cos(a)*width*taper).addScaledVector(frames.binormals[i],Math.sin(a)*depth*taper);
        pos.setXYZ(i*9+j,v.x,v.y,v.z);
      }
    }
    g.computeVertexNormals(); return mesh(g,material,parent);
  }
  // Back curtain, covering the rear of the head and extending down the back.
  for(let i=0;i<11;i++) {
    const a=Math.PI*.12+i/10*Math.PI*.76,x=Math.cos(a)*.31,z=-Math.sin(a)*.23;
    lock(hair,[[x*.3,.38,z*.3],[x,.18,z-.03],[x*1.13,-.16,z-.08],[x*.85,-.43,z-.07],[x*1.2,-.7,z-.03],[x*.9,-.94,z]],.11,.055,i%3===0?materials.hairMid:materials.hair);
  }
  for(const s of [-1,1]) {
    for(let i=0;i<4;i++) {
      const x=.27+i*.025,z=.05+i*.045;
      lock(hair,[[s*.08,.4,-.02],[s*.29,.25,.02],[s*x,-.08,z],[s*(x+.075),-.32,z+.02],[s*(x-.01),-.56,z+.08],[s*(x+.055),-.78,z+.11],[s*(x-.045),-1.02+i*.06,z+.15]],.085,.05,i%2?materials.hairMid:materials.hairLight);
    }
    lock(hair,[[s*.025,.41,.035],[s*.12,.35,.22],[s*.2,.20,.287],[s*.29,.10,.23],[s*.35,.025,.12]],.11,.048,materials.hairMid);
    lock(hair,[[s*.06,.39,.06],[s*.15,.32,.23],[s*.24,.18,.29],[s*.34,.08,.18]],.045,.023,materials.hairLight);
  }
  for(const s of [-1,1]) {
    const suffix=s<0?'L':'R';
    const arm=joint('arm'+suffix,torso,s*.35,.78,0);
    ball(arm,materials.black,[s*.025,-.045,0],[.119,.15,.115]);
    loft(arm,[[.03,.1,.1],[-.15,.11,.105],[-.43,.083,.08],[-.49,.08,.08]],materials.black,24);
    const forearm=joint('forearm'+suffix,arm,0,-.47,0);
    ball(forearm,materials.black,[0,0,0],[.083,.085,.083]);
    loft(forearm,[[0,.082,.081],[-.2,.077,.07],[-.40,.062,.059]],materials.black,24);
    const hand=joint('hand'+suffix,forearm,0,-.43,0);
    ball(hand,materials.skin,[0,-.045,.008],[.068,.095,.039]);
    for(let i=0;i<4;i++)ball(hand,materials.skin,[(i-1.5)*.029,-.116+Math.abs(i-1.5)*.008,.014],[.016,.055,.018],12);
    const thumb=ball(hand,materials.skin,[-s*.062,-.048,.03],[.023,.057,.025],12);thumb.rotation.z=-s*.4;
    const thigh=joint('thigh'+suffix,hips,s*.17,-.03,0);
    loft(thigh,[[.07,.165,.185],[-.17,.17,.17],[-.38,.135,.14],[-.57,.115,.12]],materials.pants);
    const shin=joint('shin'+suffix,thigh,0,-.56,0);
    ball(shin,materials.pants,[0,0,0],[.116,.10,.12]);
    loft(shin,[[.03,.115,.12],[-.19,.126,.13],[-.4,.153,.15],[-.62,.174,.17]],materials.pants);
    tube(shin,[[0,0,.121],[0,-.27,.139],[0,-.60,.171]],.0035,materials.black,10);
    const foot=joint('foot'+suffix,shin,0,-.63,0);
    ball(foot,materials.sole,[0,-.087,.065],[.177,.073,.264]);
    ball(foot,materials.shoe,[0,-.027,.071],[.167,.095,.251]);
    for(let j=0;j<3;j++)tube(foot,[[-.07,.051,.035+j*.04],[0,.066,.045+j*.04],[.07,.051,.035+j*.04]],.007,materials.black,4);
  }
  const cup=joint('cup',joints.handR,.015,-.03,.12);
  mesh(new THREE.CylinderGeometry(.078,.059,.16,32),materials.cup,cup,[0,.08,0]);
  mesh(new THREE.CylinderGeometry(.069,.069,.006,32),materials.coffee,cup,[0,.161,0]);
  const handle=mesh(new THREE.TorusGeometry(.054,.012,10,24),materials.cup,cup,[-.078,.08,0]);handle.scale.y=.9;
  cup.scale.setScalar(.001);
  root.userData = { description:'Stylized articulated prototype inspired by supplied references; no skinned mesh.', forward:'+Z', units:'meters' };
  const rests={}; for(const [k,j] of Object.entries(joints))rests[k]={position:j.position.clone(),quaternion:j.quaternion.clone(),scale:j.scale.clone()};
  return {root,joints,materials,rests};
}

export const ACTIONS = {
  idle: {label:'At ease', duration:4, description:'A little breathing. A gentle shift in weight.'},
  walk: {label:'Walk', duration:1.1, description:'An easy stroll, ready for your portfolio map.'},
  wait: {label:'Wait for a reply', duration:6, description:'Sway, glance aside, and patiently wait.'},
  look: {label:'Look around', duration:5, description:'A curious glance from one side to the other.'},
  drink: {label:'Coffee break', duration:6, description:'Lift the mug, take a sip, and lower it.'},
  wave: {label:'Say hello', duration:3.6, description:'A friendly wave to welcome a visitor.'},
  play: {label:'Little dance', duration:3.2, description:'A small, happy dance between case studies.'},
};

function pose(model,name,t,duration) {
  const {joints:j,rests}=model;
  for(const [key,node] of Object.entries(j)){node.position.copy(rests[key].position);node.quaternion.copy(rests[key].quaternion);node.scale.copy(rests[key].scale);}
  const p=t/duration,phase=p*TAU,s=Math.sin(phase);
  j.armL.rotation.z=-.095;j.armR.rotation.z=.095;
  j.forearmL.rotation.x=-.075;j.forearmR.rotation.x=-.075;
  j.torso.rotation.z=.012*s;
  j.torso.scale.y=1+.006*Math.sin(phase);
  j.head.rotation.z=-.025+.012*s;
  if(name==='idle'){j.head.rotation.y=.06*s;j.hips.position.x=.012*s;}
  if(name==='walk'){
    j.torso.rotation.z=.025*s;j.torso.rotation.y=.055*s;
    j.hips.position.y+=.018*(1-Math.cos(phase*2));
    for(const [suffix,sign] of [['L',1],['R',-1]]) {
      const swing=s*sign;
      j['thigh'+suffix].rotation.x=.38*swing;
      j['shin'+suffix].rotation.x=.52*Math.max(0,-swing);
      j['foot'+suffix].rotation.x=-.12*Math.max(0,swing);
      j['arm'+suffix].rotation.x=-.28*swing;
      j['forearm'+suffix].rotation.x=-.13-.1*Math.max(0,swing);
    }
  }
  if(name==='wait'){
    j.hips.position.x=.035*s;j.torso.rotation.z=-.045*s;
    j.head.rotation.y=.26*Math.sin(phase);j.head.rotation.z=.045*Math.sin(phase);
    j.armR.rotation.z=.2+.035*s;j.forearmR.rotation.x=-.2;
    j.footL.rotation.x=-.08*Math.pow(Math.max(0,Math.sin(phase*3)),4);
  }
  if(name==='look'){j.head.rotation.y=.62*s;j.head.rotation.x=.08*(1-Math.cos(phase*2));j.torso.rotation.y=.12*s;}
  if(name==='drink'){
    const lift=THREE.MathUtils.smoothstep(p,.12,.35)*(1-THREE.MathUtils.smoothstep(p,.67,.91));
    j.cup.scale.setScalar(1);
    // Solve a two-segment arm toward the cup's sip position. The pole points
    // outward to keep the elbow away from the torso and the hair.
    const shoulder=j.armR.position.clone();
    const goal=new THREE.Vector3(.43,-.10,.15).lerp(new THREE.Vector3(-.025,.94,.145),lift);
    const direction=goal.clone().sub(shoulder),distance=direction.length();direction.normalize();
    const pole=new THREE.Vector3(1,-.25,.45);pole.addScaledVector(direction,-pole.dot(direction)).normalize();
    const along=(.47*.47-.43*.43+distance*distance)/(2*distance);
    const bend=Math.sqrt(Math.max(0,.47*.47-along*along));
    const elbow=shoulder.clone().addScaledVector(direction,along).addScaledVector(pole,bend);
    const down=new THREE.Vector3(0,-1,0);
    j.armR.quaternion.setFromUnitVectors(down,elbow.clone().sub(shoulder).normalize());
    const lowerDirection=goal.clone().sub(elbow).normalize().applyQuaternion(j.armR.quaternion.clone().invert());
    j.forearmR.quaternion.setFromUnitVectors(down,lowerDirection);
    const worldHand=new THREE.Quaternion().setFromEuler(new THREE.Euler(.10*lift,0,-.08*lift));
    j.handR.quaternion.copy(j.armR.quaternion).multiply(j.forearmR.quaternion).invert().multiply(worldHand);
    j.head.rotation.x=.08*lift;
    j.head.rotation.y=-.04*lift;
  }
  if(name==='wave'){
    const lift=Math.sin(Math.PI*p)**2;
    j.armR.rotation.z= .095+1.55*lift;
    j.armR.rotation.x=-.15*lift;
    j.forearmR.rotation.z=(.95+.22*Math.sin(phase*4))*lift;
    j.handR.rotation.z=.22*Math.sin(phase*4)*lift;
    j.head.rotation.z=-.07*lift;
  }
  if(name==='play'){
    j.hips.position.x=.10*s;j.hips.position.y+=.035*(1-Math.cos(phase*2));
    j.torso.rotation.z=-.1*s;j.head.rotation.z=.08*s;
    j.armL.rotation.z=-.5-.25*s;j.armR.rotation.z=.5-.25*s;
    j.forearmL.rotation.x=-.9;j.forearmR.rotation.x=-.9;
    j.thighL.rotation.x=.12*s;j.thighR.rotation.x=-.12*s;
  }
  // Blinking uses transforms and survives a GLB export.
  const blink=1-.92*Math.pow(Math.max(0,Math.cos(phase)),80);
  j.eyeL.scale.y=blink;j.eyeR.scale.y=blink;
  j.hair.rotation.z=-j.torso.rotation.z*.2;
}

export function createClips(model) {
  const clips=[];
  for(const [name,{duration}] of Object.entries(ACTIONS)){
    const count=Math.ceil(duration*30),times=[],values={};
    for(const key of Object.keys(model.joints))values[key]={position:[],quaternion:[],scale:[]};
    for(let i=0;i<=count;i++){
      const t=i/count*duration;times.push(t);pose(model,name,t,duration);
      for(const [key,node] of Object.entries(model.joints))for(const property of ['position','quaternion','scale'])values[key][property].push(...node[property].toArray());
    }
    const tracks=[];
    for(const [key,props] of Object.entries(values))for(const [property,data] of Object.entries(props)){
      const Track=property==='quaternion'?THREE.QuaternionKeyframeTrack:THREE.VectorKeyframeTrack;
      tracks.push(new Track(`${key}.${property}`,times,data));
    }
    clips.push(new THREE.AnimationClip(name,duration,tracks).optimize());
  }
  for(const [key,node] of Object.entries(model.joints)){node.position.copy(model.rests[key].position);node.quaternion.copy(model.rests[key].quaternion);node.scale.copy(model.rests[key].scale);}
  return clips;
}

export class CharacterAnimator {
  constructor(root,clips) {
    this.mixer=new THREE.AnimationMixer(root);this.actions=Object.fromEntries(clips.map(c=>[c.name,this.mixer.clipAction(c)]));this.current=null;
    this.play('idle');
  }
  play(name,{once=false}={}) {
    if(!this.actions[name])throw new Error(`Unknown animation: ${name}`);
    if(this.current===name && !once)return;
    const previous=this.actions[this.current],next=this.actions[name];
    next.reset().setEffectiveTimeScale(1).setEffectiveWeight(1).setLoop(once?THREE.LoopOnce:THREE.LoopRepeat,once?1:Infinity);
    next.clampWhenFinished=once;next.play();if(previous&&previous!==next)previous.crossFadeTo(next,.28,false);
    this.current=name;
  }
  update(dt){this.mixer.update(dt);}
  dispose(){this.mixer.stopAllAction();this.mixer.uncacheRoot(this.mixer.getRoot());}
}
