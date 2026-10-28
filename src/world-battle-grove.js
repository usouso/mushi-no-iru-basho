/** Additive single-field composition of the original summer meadow. This module
 * registers nothing, touches no saves, and never changes the original factory.
 * Resource counts are CPU diagnostics, not a rendered-quality certification. */
import {createWorld} from './world.js?v=0.67.0&b=06ee2abee345';
import {createBattleGroveSupports} from './battle-grove-supports.js?v=0.67.0&b=06ee2abee345';
import {GROVE_BOUNDS,GROVE_SPAWN,GROVE_ROUTE,GROVE_ARENA as A,GROVE_APPROACHES,GROVE_SPECIES,groveRouteDistance} from './battle-grove-layout.js?v=0.67.0&b=06ee2abee345';
const T=window.THREE;
export function createBattleGroveWorld(scene){
 if(!scene?.isScene)throw new TypeError('Battle grove requires a Three scene');
 const prior=new Set(scene.children),previous={background:scene.background,fog:scene.fog},base=createWorld(scene),ground=base.captureOccluders[0];
 ground.name='battle-grove-ground';
 // Exact interpolation of the original rendered 184m / 120-cell mesh, rather
 // than using the continuous analytic height between its vertices.
 const gp=ground.geometry.attributes.position,N=120,extent=92,step=184/N;
 function heightAt(x,z){const gx=Math.max(0,Math.min(N-1e-8,(x+extent)/step)),gz=Math.max(0,Math.min(N-1e-8,(z+extent)/step)),i=Math.floor(gx),j=Math.floor(gz),u=gx-i,v=gz-j,a=j*(N+1)+i,aa=gp.getY(a),b=gp.getY(a+1),c=gp.getY(a+N+1),d=gp.getY(a+N+2);return u+v<=1?aa+(b-aa)*u+(c-aa)*v:d+(c-d)*(1-u)+(b-d)*(1-v);}
 const clearAt=(x,z)=>groveRouteDistance(x,z)<1.45||Math.hypot(x-A.x,z-A.z)<3.9||Object.values(GROVE_APPROACHES).some(p=>Math.hypot(x-p.x,z-p.z)<1.15)||Math.hypot(x+4.8,z-2)<2.0||Math.hypot(x-10,z+5)<1.7;
 // Only this new scene loses low cards on its authored approach. Canopy, sky,
 // distant woodland, wind shaders and shared source factory remain untouched.
 let trimmedLowCards=0;const matrix=new T.Matrix4(),p=new T.Vector3(),color=new T.Color();
 for(const m of scene.children){if(prior.has(m)||!m.isInstancedMesh||m.geometry.attributes.position.count!==4)continue;let kept=0;const before=m.count;for(let i=0;i<before;i++){m.getMatrixAt(i,matrix);p.setFromMatrixPosition(matrix);if(p.y-heightAt(p.x,p.z)<2&&clearAt(p.x,p.z)){trimmedLowCards++;continue;}m.setMatrixAt(kept,matrix);if(m.instanceColor){m.getColorAt(i,color);m.setColorAt(kept,color);}kept++;}m.count=kept;m.instanceMatrix.needsUpdate=true;if(m.instanceColor)m.instanceColor.needsUpdate=true;}
 // Paint the route into the existing terrain vertices, not a floating overlay.
 const colors=ground.geometry.attributes.color,dirt=new T.Color('#b9a37c');
 for(let i=0;i<gp.count;i++){const x=gp.getX(i),z=gp.getZ(i),d=Math.min(groveRouteDistance(x,z),Math.max(0,Math.hypot(x-A.x,z-A.z)-2.5)),t=Math.max(0,Math.min(1,(2-d)/1.1));if(t){color.fromBufferAttribute(colors,i).lerp(dirt,t);colors.setXYZ(i,color.r,color.g,color.b);}}colors.needsUpdate=true;
 const supports=createBattleGroveSupports({...base,heightAt,ownedRoots:scene.children.filter(o=>!prior.has(o))},scene),arenaMeshes=[],arenaColliders=[];
 const bark=new T.MeshStandardMaterial({map:base.captureOccluders[1].material.map,color:'#a08d68',roughness:1}),wood=new T.MeshStandardMaterial({color:'#b5a07a',roughness:1}),stone=new T.MeshStandardMaterial({color:'#929383',roughness:1});
 function mesh(name,g,mat,pos){const m=new T.Mesh(g,mat);m.name=name;m.position.set(...pos);m.castShadow=m.receiveShadow=true;scene.add(m);arenaMeshes.push(m);return m;}
 function beam(name,a,b,r0,r1){const start=new T.Vector3(...a),delta=new T.Vector3(...b).sub(start),g=new T.CylinderGeometry(r1,r0,delta.length(),9),uv=g.attributes.uv;for(let i=0;i<uv.count;i++)uv.setY(i,uv.getY(i)*delta.length()*.65);const m=mesh(name,g,bark,start.clone().addScaledVector(delta,.5).toArray());m.quaternion.setFromUnitVectors(new T.Vector3(0,1,0),delta.normalize());return m;}
 const gy=heightAt(A.x,A.gateZ);
 for(const sign of[-1,1]){const x=A.x+sign*2.15,y=heightAt(x,A.gateZ);beam('battle-grove-gate-post',[x,y-.08,A.gateZ],[x-sign*.10,gy+3.25,A.gateZ],.20,.14);arenaColliders.push({x,z:A.gateZ,r:.23});}
 beam('battle-grove-gate-crossbeam',[A.x-2.45,gy+3.2,A.gateZ],[A.x+2.45,gy+3.2,A.gateZ],.16,.14);
 // Small crossed, upward curves give the timber gate a horn-like silhouette.
 for(const sign of[-1,1]){beam('battle-grove-carved-horn',[A.x+sign*.12,gy+3.23,A.gateZ],[A.x+sign*.45,gy+3.62,A.gateZ],.10,.055);beam('battle-grove-carved-horn-tip',[A.x+sign*.45,gy+3.62,A.gateZ],[A.x+sign*.27,gy+3.91,A.gateZ],.055,.015);}
 const cy=heightAt(A.x,A.z),tableTop=cy+.72;
 mesh('battle-grove-arena-stump',new T.CylinderGeometry(.95,1.05,.78,24),bark,[A.x,tableTop-.39,A.z]);
 mesh('battle-grove-arena-cutwood',new T.CylinderGeometry(.948,.948,.018,32),wood,[A.x,tableTop+.009,A.z]);
 for(const radius of[.25,.48,.72,.88]){const ring=mesh('battle-grove-wood-growth-ring',new T.TorusGeometry(radius,.004,3,48),bark,[A.x,tableTop+.020,A.z]);ring.rotation.x=Math.PI/2;}
 arenaColliders.push({x:A.x,z:A.z,r:1.06});
 for(let i=0;i<18;i++){const angle=i*Math.PI*2/18;if(Math.cos(angle)>.82)continue;const x=A.x+Math.sin(angle)*A.radius,z=A.z+Math.cos(angle)*A.radius;const rock=mesh('battle-grove-arena-stone',new T.IcosahedronGeometry(1,1),stone,[x,heightAt(x,z)+.08,z]);rock.rotation.set(i*.1,i*.47,0);rock.scale.set(.24,.15,.20);arenaColliders.push({x,z,r:.24});}
 const arenaAccess=Object.freeze({id:'battle-grove-arena',label:'虫相撲の広場',x:A.interactX,z:A.interactZ,y:heightAt(A.interactX,A.interactZ),interactRadius:A.interactRadius,center:Object.freeze({x:A.x,y:tableTop,z:A.z}),gate:Object.freeze({x:A.x,y:gy+3.2,z:A.gateZ})});
 scene.updateMatrixWorld(true);
 const owned=scene.children.filter(o=>!prior.has(o)),meshes=[];for(const root of owned)root.traverse(o=>{if(o.isMesh)meshes.push(o);});
 const colliders=[...base.colliders,...supports.colliders,...arenaColliders],captureOccluders=Object.freeze([...base.captureOccluders,...supports.captureOccluders,...arenaMeshes]);
 const geometry=new Set(),materials=new Set(),textures=new Set();for(const root of owned)root.traverse(o=>{if(o.geometry)geometry.add(o.geometry);for(const m of(o.material?(Array.isArray(o.material)?o.material:[o.material]):[])){materials.add(m);for(const v of Object.values(m))if(v?.isTexture)textures.add(v);}});
 const stats=Object.freeze({sourceMeadow:Object.freeze({...base.stats}),trees:base.stats.trees+1,trimmedLowCards,meshes:meshes.length,geometries:geometry.size,materials:materials.size,textures:textures.size,instances:meshes.reduce((n,m)=>n+(m.isInstancedMesh?m.count:0),0),triangles:meshes.reduce((n,m)=>n+(m.geometry.index?.count??m.geometry.attributes.position.count)/3*(m.isInstancedMesh?m.count:1),0),catchableSpecies:3,arenaAccesses:1});
 const background=scene.background,fog=scene.fog;let disposed=false;
 return{regionId:'battle-grove',heightAt,bounds:GROVE_BOUNDS,spawn:{...GROVE_SPAWN},colliders,captureOccluders,meshes:Object.freeze(meshes),insectHomes:supports.insectHomes,rhinoSupports:supports.rhinoSupports,stagSupports:supports.stagSupports,herculesSupports:supports.herculesSupports,herculesSupportAt:supports.herculesSupportAt,supportSurfaces:supports.surfaces,arenaAccess,route:GROVE_ROUTE,approaches:GROVE_APPROACHES,battleSpecies:GROVE_SPECIES,landmarks:{...base.landmarks,arena:arenaAccess.center},stats,
  simulationOptions(){return{homes:supports.insectHomes.map(h=>[...h]),bounds:GROVE_BOUNDS,rhinoSupports:supports.rhinoSupports,stagSupports:supports.stagSupports,herculesSupports:supports.herculesSupports};},
  locationLabel(x,z){return Math.hypot(x-A.x,z-A.z)<7?'虫相撲の広場':x<0?'樹液の木へ続く小道':'木漏れ日の採集林';},
  update(time,dt){if(!disposed)base.update(time,dt);},
  dispose(){if(disposed)return;disposed=true;for(const root of owned){root.traverse(o=>{if(o.isInstancedMesh)o.dispose();o.shadow?.map?.dispose?.();});scene.remove(root);}for(const g of geometry)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();if(scene.background===background)scene.background=previous.background;if(scene.fog===fog)scene.fog=previous.fog;}
 };
}
