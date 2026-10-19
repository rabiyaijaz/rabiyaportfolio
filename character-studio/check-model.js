import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { createCharacter,createClips,CharacterAnimator,ACTIONS } from './character.js';
const model=createCharacter(),clips=createClips(model);
assert.equal(clips.length,7);
const animator=new CharacterAnimator(model.root,clips);
for(const [name,{duration}] of Object.entries(ACTIONS)){
  animator.play(name);
  for(let i=0;i<Math.ceil(duration*30);i++)animator.update(1/30);
  model.root.updateMatrixWorld(true);
  model.root.traverse(node=>assert(node.matrixWorld.elements.every(Number.isFinite),`${name}: invalid transform`));
  assert(model.root.position.length()<.001,'Clips should be in place');
}
animator.dispose();
const bytes=await readFile(new URL('./public/rabiya-prototype.glb',import.meta.url));
const buffer=bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength);
const asset=await new GLTFLoader().parseAsync(buffer,'');
assert.deepEqual(asset.animations.map(c=>c.name),Object.keys(ACTIONS));
const reloaded=new CharacterAnimator(asset.scene,asset.animations);
for(const name of Object.keys(ACTIONS)){reloaded.play(name);reloaded.update(.5);}
assert(asset.scene.getObjectByName('glasses'));
assert(asset.scene.getObjectByName('cup'));
const bounds=new THREE.Box3().setFromObject(asset.scene);assert(bounds.max.y>3&&bounds.max.y<4);
let triangles=0,meshes=0;asset.scene.traverse(o=>{if(o.isMesh){meshes++;triangles+=(o.geometry.index?.count||o.geometry.attributes.position.count)/3;}});
console.log(`PASS: all 7 actions, finite transforms, stationary root, GLB round trip, accessories; ${meshes} meshes, ${triangles} triangles.`);
