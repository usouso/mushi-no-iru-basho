import {inverseEuropeIndividuals} from './fixtures/europe-individual-field-prior.mjs';
/** Six bounded field integration groups. CPU only; native whole-skin/ground,
 * model anatomy and numerical study paths have separate foundation suites. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {createHash} from 'node:crypto';
const sandbox={};vm.runInNewContext(fs.readFileSync(new URL('../assets/vendor/three.min.js',import.meta.url),'utf8'),sandbox);const T=sandbox.THREE;globalThis.window={THREE:T};const ctx=new Proxy({createLinearGradient:()=>({addColorStop(){}})},{get:(o,k)=>o[k]||(()=>{})});globalThis.document={createElement:()=>({getContext:()=>ctx})};
const {createWorld}=await import('../src/world.js'),{createInsects,SPECIES}=await import('../src/insects.js'),{createGiantWaterbugHabitat}=await import('../src/giant-waterbug-habitat.js'),{createGiantWaterbugModel,updateGiantWaterbugModel}=await import('../src/giant-waterbug-model.js'),{GIANT_WATERBUG_DIMENSIONS:D}=await import('../src/giant-waterbug-kinematics.js'),{GIANT_WATERBUG_SHORE:SHORE}=await import('../src/giant-waterbug-layout.js'),{createCaptureVisibility}=await import('../src/capture-visibility.js');
const scene=new T.Scene(),world=createWorld(scene),oldOccluders=[...world.captureOccluders],options={extraHomes:[...world.grasshopperHomes],grasshopperSupports:world.grasshopperSupports},habitats={};
for(const name of ['water','diving','mantis','ladybird','bee','swallowtail','jewel','longhorn','miyama']){const m=await import(`../src/${name}-habitat.js`),h=Object.values(m).find(v=>typeof v==='function')(world,scene);habitats[name]=h;options.extraHomes.push(...h.homes);oldOccluders.push(...(h.captureOccluders??[]));if(name==='swallowtail'){const[,x,z,a]=h.homes[0];options.swallowtailSupports=[{home:{x,y:world.heightAt(x,z)+a,z},perches:h.swallowtailSupports}];}else options[({water:'strider',diving:'diving',mantis:'mantis',ladybird:'ladybird',bee:'bee',jewel:'jewel',longhorn:'longhorn',miyama:'miyama'})[name]+'Supports']=h[name+'Supports']??h.supports;}
const habitat=createGiantWaterbugHabitat(world,scene),occluders=[...oldOccluders,...habitat.captureOccluders],los=createCaptureVisibility(occluders);options.extraHomes.push(...habitat.homes);options.giantWaterbugSupports=habitat.supports;options.hasLineOfSight=los;scene.updateMatrixWorld(true);
const make=(overrides={})=>createInsects(world.heightAt,{...options,...overrides}),bug=s=>s.items.find(i=>i.species==='giantwaterbug'),clone=v=>structuredClone(v),point=i=>({x:i.x,y:i.y,z:i.z}),pose=i=>({position:point(i),orientation:clone(i.orientation),heading:i.heading,pitch:i.pitch,grip:i.grip,stroke:i.stroke,strokeStrength:i.strokeStrength,forelegFold:i.forelegFold}),advance=(s,seconds,player=null)=>{for(let n=0;n<Math.round(seconds*120);n++)s.update(1/120,player);};
const shore={...SHORE,y:world.heightAt(SHORE.x,SHORE.z)+1.28,speed:0,quiet:true},aim=(p,i)=>{const d=new T.Vector3(i.x-p.x,i.y-p.y,i.z-p.z).normalize();return{x:d.x,y:d.y,z:d.z};};
function missedAim(p,i){const d=new T.Vector3(i.x-p.x,i.y-p.y,i.z-p.z).normalize(),side=new T.Vector3(d.z,0,-d.x).normalize();d.multiplyScalar(.7).addScaledVector(side,Math.sqrt(1-.7*.7));return{x:d.x,y:d.y,z:d.z};}
function block(){const i=bug(make()),m=new T.Mesh(new T.BoxGeometry(.5,.5,.15),new T.MeshBasicMaterial());m.position.set((shore.x+i.x)/2,(shore.y+i.y)/2,(shore.z+i.z)/2);scene.add(m);scene.updateMatrixWorld(true);const blocked=createCaptureVisibility([...occluders,m]);assert.equal(blocked(shore,i),false);return blocked;}

function inverseWetapunga(source) {
 const marker=/^[ \t]*\/\/ WETAPUNGA_BEGIN\n[\s\S]*?^[ \t]*\/\/ WETAPUNGA_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.47 additions');
 const normalized=blocks.join('').replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1$2');
 assert.equal(createHash('sha256').update(normalized).digest('hex'),'7d41ae436f3546d99692bf5c487e0c3ab654b416b8b93438f9ea4fd2d381a04d','exact wetapunga-only blocks');
 source=source.replace(marker,'');
 for(const added of [' wetapungaSupports = [],',"|| (item.species==='wetapunga'&&!['finishing','retreating'].includes(item.wetapungaPhase)) "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

function inverseDragonflyLanding(source) {
 const marker=/^[ \t]*\/\/ DRAGONFLY_LANDING_BEGIN\n[\s\S]*?^[ \t]*\/\/ DRAGONFLY_LANDING_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,2,'only two identified 0.46 render-only additions');
 assert.equal(createHash('sha256').update(blocks.join('')).digest('hex'),'fc12f729a856a1543b31a5e7c60f402616aba8f3008ac8056a2238b765c0172d','exact 0.46 render-only blocks');
 return source.replace(marker,'');
}

function inverseGiantWaterbug(source) {
 const marker=/^[ \t]*\/\/ GIANT_WATERBUG_BEGIN\n[\s\S]*?^[ \t]*\/\/ GIANT_WATERBUG_END\n/gm,blocks=source.match(marker)||[];
 assert.equal(blocks.length,10,'only ten identified 0.45 additions');
 assert.equal(createHash('sha256').update(blocks.join('').replace(/\?v=[^'"\s]+/g,'')).digest('hex'),'ab8672fea6e4443af29a4a8e051ec669ea05b1215d9df6db3f520f2d4ca4138d','literal new waterbug blocks remain exact');
 source=source.replace(marker,'');
 for(const added of [' giantWaterbugSupports = [],',"|| (item.species==='giantwaterbug'&&item.giantWaterbugPhase==='resting') "]){assert.equal(source.split(added).length-1,1);source=source.replace(added,'');}
 return source;
}

test('new literal inverse is exact frozen044 source; fixed unmeasured insect-31 appends without disturbing old thirty',()=>{
 const source=fs.readFileSync(new URL('../src/insects.js',import.meta.url),'utf8'),inverse=inverseGiantWaterbug(inverseDragonflyLanding(inverseWetapunga(inverseEuropeIndividuals(source)))).replace(/(from\s*['"]\.\/[^'"?\n]+)(?:\?[^'"\n]*)?(['"])/g,'$1?v=0.44.0&b=fc8f26cb61f4$2');assert.equal(createHash('sha256').update(inverse).digest('hex'),'6b44c70f180cc3bf90f73ea03583482d2a89b6deefbcaa12687e54465591ed40');
 const added=make(),old=make({extraHomes:options.extraHomes.slice(0,-1),giantWaterbugSupports:[]}),i=bug(added);assert.equal(added.items.length,31);assert.equal(i.id,'insect-31');assert.equal(Object.keys(SPECIES).length,34);assert.equal(SPECIES.giantwaterbug.scientificName,'Kirkaldyia deyrolli');assert.match(SPECIES.giantwaterbug.size,/45〜70mm.*約24cm/);assert.equal(SPECIES.giantwaterbug.observation.split('。').filter(Boolean).length,3);for(const key of ['encounterId','sizePermille','measureVersion','motionSeed'])assert.equal(key in i,false);
 for(let n=0;n<360;n++){old.update(1/60,null);added.update(1/60,null);assert.deepEqual(added.items.slice(0,30),old.items);}assert.deepEqual(added.items.slice(0,30).map(i=>i.id),Array.from({length:30},(_,n)=>`insect-${n+1}`));
});

test('strict copied support rejects malformed/accessor/shifted contracts and preserves reset after caller mutation',()=>{
 const good=clone(habitat.supports),bad=[];for(const edit of [g=>g.home.x+=.01,g=>g.orientation.pitch=0,g=>g.orientation.yaw=1,g=>g.waterY+=.01,g=>g.envelope.maxDepth=.6,g=>g.envelope.retreat.x=1,g=>g.radius=0,g=>g.axis.y=NaN,g=>g.groundAnchor.y=g.home.y,g=>g.extra=true]){const a=clone(good);edit(a[0]);bad.push(a);}bad.push(null,{},[...good,...good],new Array(1));let getterCalls=0;const accessor=clone(good);Object.defineProperty(accessor[0],'home',{get(){getterCalls++;return good[0].home;},enumerable:true});bad.push(accessor);const arrayGetter=[];Object.defineProperty(arrayGetter,'0',{get(){getterCalls++;return good[0];},enumerable:true});bad.push(arrayGetter);
 for(const giantWaterbugSupports of bad)assert.throws(()=>make({giantWaterbugSupports}),/Invalid giant waterbug supports/);assert.equal(getterCalls,0);assert.throws(()=>make({extraHomes:options.extraHomes.slice(0,-1)}),/Invalid giant waterbug supports/);assert.throws(()=>make({extraHomes:[...options.extraHomes.slice(0,-2),options.extraHomes.at(-1),options.extraHomes.at(-2)]}),/Invalid giant waterbug supports/);
 const a=make({giantWaterbugSupports:good}),b=make();good[0].home.x=99;good[0].orientation.pitch=0;good[0].envelope.retreat.z=99;advance(a,20);advance(b,20);assert.deepEqual(bug(a),bug(b));a.reset();b.reset();assert.deepEqual(bug(a),bug(b));assert.deepEqual(bug(a).home,habitat.home);
});

test('real shore LOS: fast approach and a nearby failed net swing disturb only this resting bug; quiet and occluded approaches do not',()=>{
 const slow=make(),fast=make(),hidden=make({hasLineOfSight:block()});assert.equal(los(shore,bug(slow)),true);advance(slow,.5,shore);assert.equal(bug(slow).giantWaterbugPhase,'resting');advance(fast,.5,{...shore,speed:3,quiet:false});assert.equal(bug(fast).giantWaterbugPhase,'warning');assert.ok(bug(fast).forelegFold>.5);advance(hidden,.5,{...shore,speed:3,quiet:false});assert.equal(bug(hidden).giantWaterbugPhase,'resting');
 const s=make(),i=bug(s),direction=missedAim(shore,i),old=clone(s.items.slice(0,30));assert.equal(s.swing(shore,direction).ok,false);assert.equal(s.startleFromNet(shore,direction)?.id,'insect-31');assert.equal(i.giantWaterbugPhase,'warning');assert.deepEqual(s.items.slice(0,30),old);assert.equal(s.startleFromNet(shore,direction),null);assert.equal(hidden.startleFromNet(shore,missedAim(shore,bug(hidden))),null);assert.equal(hidden.swing(shore,aim(shore,bug(hidden))).ok,false);
 assert.equal(slow.swing(shore,aim(shore,bug(slow))).item.id,'insect-31','quiet shore catch is possible');assert.equal(slow.retain(),null,'aquatic bug is not a battle companion');assert.equal(slow.caught.id,'insect-31');
});

test('capture freezes actual field pose in all nine phases; first released pose is continuous, controlled swim resumes, and reset keeps identity',()=>{
 const phases=['resting','warning','releasing','diving','swimming','turning','returning','gripping','settling'];
 for(const phase of phases){const s=make(),i=bug(s);if(phase!=='resting'){s.startleFromNet(shore,missedAim(shore,i));for(let n=0;n<1200&&i.giantWaterbugPhase!==phase;n++)s.update(1/120,null);}assert.equal(i.giantWaterbugPhase,phase);advance(s,.12);assert.equal(i.giantWaterbugPhase,phase);const before=pose(i);assert.equal(s.swing(shore,aim(shore,i)).item?.id,'insect-31');assert.deepEqual(pose(i),before);advance(s,3);assert.deepEqual(pose(i),before);assert.equal(i.state,'caught');assert.equal(s.release(shore).id,'insect-31');assert.deepEqual(pose(i),before);s.update(1/120,null);assert.ok(new T.Vector3(i.x,i.y,i.z).distanceTo(new T.Vector3(before.position.x,before.position.y,before.position.z))<1e-6);advance(s,.8);assert.notEqual(i.state,'caught');s.reset();assert.deepEqual(pose(bug(s)),pose(bug(make())));assert.equal(bug(s).id,'insect-31');assert.deepEqual(bug(s).home,habitat.home);}
});

test('field state drives finite native poses, real four-foot grip and water breathing independently from the pure study',()=>{
 const s=make(),i=bug(s),model=createGiantWaterbugModel(),phases=new Set();const ray=new T.Raycaster();let poses=0;updateGiantWaterbugModel(model,pose(i));
 for(const leg of model.userData.legs){if(leg.role==='front'){assert.equal(leg.contact,false);continue;}const p=new T.Vector3().fromBufferAttribute(leg.mesh.geometry.attributes.position,leg.tipVertex).applyMatrix4(leg.mesh.matrixWorld);ray.set(p.clone().add(new T.Vector3(leg.side*.03,0,0)),new T.Vector3(-leg.side,0,0));ray.far=.06;assert.ok(ray.intersectObject(habitat.stalk,false)[0].point.distanceTo(p)<2e-7);}
 for(const tip of D.breathingTips)assert.ok(Math.abs(new T.Vector3(tip.x,tip.y,tip.z).applyMatrix4(model.matrixWorld).y-habitat.waterY)<1e-7);
 s.startleFromNet(shore,missedAim(shore,i));for(let n=0;n<=960;n++){if(n)s.update(1/120,null);phases.add(i.giantWaterbugPhase);if(n%12!==0)continue;updateGiantWaterbugModel(model,pose(i));model.traverse(m=>{const a=m.geometry?.attributes.position;if(a)for(let j=0;j<a.count;j++)assert.ok(new T.Vector3().fromBufferAttribute(a,j).applyMatrix4(m.matrixWorld).toArray().every(Number.isFinite));});poses++;}
 assert.equal(phases.size,9);assert.equal(i.giantWaterbugPhase,'resting');assert.deepEqual(point(i),habitat.home);assert.equal(i.grip,1);assert.equal(poses,81);model.userData.dispose();
});

test('normal and sprint shore approach warn before first legal range; actual failed-net cooldown reports motion rather than promising escape',()=>{
 const metrics=[];
 for(const speed of [2,5]){const s=make(),i=bug(s),home=point(i);let noticed=null,first=null,player=null;
  for(let n=0;n<200;n++){const z=i.home.z+Math.max(1.4,4.2-n*speed/60);player={x:i.home.x,z,y:world.heightAt(i.home.x,z)+1.65,speed,quiet:false};s.update(1/60,player);const distance=Math.hypot(i.x-player.x,i.y-player.y,i.z-player.z);if(!noticed&&i.giantWaterbugPhase!=='resting')noticed={time:s.time,distance,phase:i.giantWaterbugPhase};if(distance<=2.6&&los(player,i)){first={time:s.time,distance,phase:i.giantWaterbugPhase,rootDistance:new T.Vector3(i.x,i.y,i.z).distanceTo(new T.Vector3(home.x,home.y,home.z)),forelegFold:i.forelegFold,grip:i.grip};break;}}
  assert.ok(noticed&&first);assert.ok(noticed.time<first.time);assert.ok(noticed.distance>2.6);assert.equal(s.swing(player,missedAim(player,i)).ok,false);s.startleFromNet(player,missedAim(player,i));const after=[];
  // main's existing net cooldown is .7s; this does not alter it or catch range.
  assert.match(fs.readFileSync(new URL('../src/main.js',import.meta.url),'utf8'),/state\.swing=\.001;state\.cooldown=\.7/);
  for(let k=1;k<=3;k++){advance(s,.7,{...player,speed:0});after.push({afterMissSeconds:k*.7,phase:i.giantWaterbugPhase,rootDistance:new T.Vector3(i.x,i.y,i.z).distanceTo(new T.Vector3(home.x,home.y,home.z)),grip:i.grip,forelegFold:i.forelegFold});}assert.ok(after[2].rootDistance>.01);metrics.push({speed,noticed,firstLegal:first,afterMiss:after});
 }
 console.log('Waterbug field notice/capture-range timeline (CPU, not guaranteed evasion):',JSON.stringify(metrics));
});
