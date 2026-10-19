import { writeFile, mkdir } from 'node:fs/promises';
import { GLTFExporter } from 'three/addons/exporters/GLTFExporter.js';
import { createCharacter, createClips } from './character.js';

// GLTFExporter uses the browser FileReader interface even for texture-free assets.
globalThis.FileReader = class {
  readAsArrayBuffer(blob){blob.arrayBuffer().then(result=>{this.result=result;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
  readAsDataURL(blob){blob.arrayBuffer().then(result=>{this.result=`data:${blob.type};base64,${Buffer.from(result).toString('base64')}`;this.onloadend?.();}).catch(error=>this.onerror?.(error));}
};
const model=createCharacter(),animations=createClips(model);
const binary=await new GLTFExporter().parseAsync(model.root,{binary:true,animations,onlyVisible:false});
await mkdir(new URL('./public/',import.meta.url),{recursive:true});
await writeFile(new URL('./public/rabiya-prototype.glb',import.meta.url),Buffer.from(binary));
console.log(`Exported rabiya-prototype.glb: ${(binary.byteLength/1048576).toFixed(2)} MB; ${animations.map(a=>a.name).join(', ')}`);
