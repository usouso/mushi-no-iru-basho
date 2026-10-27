/** Additive log-fruit adapter. No bait logic, old-world edits or random draws. */
import {LOG_FRUIT_LAYOUT as L} from './log-fruit-layout.js?v=0.64.0&b=3616c2fe808e';
const THREE=window.THREE;
export function createLogFruitHabitat(world,scene){
 const logs=scene?.getObjectByName('tropical-beetle-logs');
 if(!scene?.isScene||!logs?.isMesh||!Array.isArray(world?.herculesSupports)||typeof world?.herculesSupportAt!=='function')throw new TypeError('Existing tropical logs and Hercules supports required');
 const support=world.herculesSupports.find(s=>Math.abs(s.home.x-L.supportX)<1e-6&&Math.abs(s.home.z-L.supportZ)<1e-6);
 if(!support||!Array.isArray(support.axis)||support.axis.length!==2)throw new Error('First log support missing');
 const home={...support.home},target={...support.axis.reduce((a,b)=>a.x>b.x?a:b)};
 if(![home.x,home.y,home.z,target.x,target.y,target.z].every(Number.isFinite)||Math.abs(target.z-home.z)>1e-6||Math.abs(target.y-home.y)>1e-6||Math.abs(target.x-home.x-.6)>1e-6)throw new Error('Existing horizontal log axis changed');
 const surface=world.herculesSupportAt(target),topY=target.y-L.rootAboveBark;
 if(!surface||Math.abs(surface.point.y-topY)>1e-6||surface.normal.y<.999999)throw new Error('Expected original horizontal bark support');
 const x=target.x+L.forwardOffset,z=target.z;
 // One actual-mesh check, not a new terrain sampler or broad entry sweep.
 logs.updateWorldMatrix(true,false);const ray=new THREE.Raycaster(new THREE.Vector3(x,topY+1,z),new THREE.Vector3(0,-1,0),0,2),hit=ray.intersectObject(logs,false)[0];
 if(!hit||Math.abs(hit.point.y-topY)>1e-6)throw new Error('Fruit would not rest on the actual log');
 const station=Object.freeze({id:'tropical-log-fruit',label:'倒木の果実',type:'fermented-fruit',x,z,topY,interactRadius:L.interactRadius});
 const simulationStation=Object.freeze({supportHome:Object.freeze(home),target:Object.freeze(target),heading:L.heading});
 const positions=[],colors=[],color=new THREE.Color(),base=[];
 for(let i=0;i<8;i++){const a=i*Math.PI/4;base.push([Math.cos(a)*L.radiusX,0,Math.sin(a)*L.radiusZ]);}
 function triangle(a,b,c,tint){positions.push(...a,...b,...c);color.set(tint);for(let j=0;j<3;j++)colors.push(color.r,color.g,color.b);}
 for(let i=0;i<8;i++){const a=base[i],b=base[(i+1)%8];triangle([0,L.height,0],b,a,i%3===0?'#99804c':i%3===1?'#b59b5c':'#aa9052');triangle([0,0,0],a,b,'#887144');}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));geometry.computeVertexNormals();geometry.computeBoundingSphere();
 const fruit=new THREE.Mesh(geometry,new THREE.MeshLambertMaterial({vertexColors:true}));fruit.name='tropical-log-fermented-fruit';fruit.position.set(x,topY,z);fruit.receiveShadow=true;fruit.visible=false;scene.add(fruit);fruit.updateMatrixWorld(true);
 // No collider or capture-occluder mutation. Existing scene-root disposal owns
 // this sole mesh's private geometry/material; no texture/cache/new timer.
 function setActive(active){fruit.visible=Boolean(active);}
 return{station,simulationStation,setActive,stats:Object.freeze({addedMeshes:1,addedTriangles:16,addedTextures:0,entryRays:1})};
}
