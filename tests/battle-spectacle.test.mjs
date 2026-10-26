/** Close camera / contact presentation and actual main event wiring. CPU, DOM
 * and audio doubles only: this does not certify rendered spectacle or listening. */
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const viewSource=fs.readFileSync(path.join(root,'tests/battle-view.test.mjs'),'utf8');
const viewHarness=viewSource.slice(0,viewSource.indexOf("\ntest(")).replace("path.resolve(import.meta.dirname,'..')",JSON.stringify(root)).replace("await import('../src/battle-view.js')",`await import(${JSON.stringify(new URL('../src/battle-view.js',import.meta.url).href)})`).replace("new URL('../src/battle-view.js',import.meta.url)",`new URL(${JSON.stringify(new URL('../src/battle-view.js',import.meta.url).href)})`)+'\nexport {T,ids,createBattleView,anchor,model,pose};';
const {T,ids,createBattleView,anchor,model,pose}=await import('data:text/javascript;base64,'+Buffer.from(viewHarness).toString('base64'));
const mainSource=fs.readFileSync(path.join(root,'tests/companions-main.test.mjs'),'utf8'),marker='\nconst legacy=';
const mainHarness=mainSource.slice(0,mainSource.indexOf(marker)).replace("const root=path.resolve(import.meta.dirname,'..');",`const root=${JSON.stringify(root)};`)+'\nexport {app,finishWatching};';
const {app,finishWatching}=await import('data:text/javascript;base64,'+Buffer.from(mainHarness).toString('base64'));
const click=(h,id)=>h.elements.get(id).click();
const extraExports='audio,roster,battle,battleView,battleSuspended,models,keepCaptured,battleCaptured,openCompanions,closeCompanions,releaseCompanion,startBattle,leaveBattle,returnFromBattle,applyCompanionPresence';
const exchange={number:1,playerAction:'push',opponentAction:'brace',positionBefore:0,positionAfter:.35,delta:.35,reason:'角を合わせて押し込みました。'};
const snapshot={phase:'watching',position:.35,exchanges:1,lastExchange:exchange};
function projectedBox(box,camera){let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;const p=new T.Vector3();for(const x of[box.min.x,box.max.x])for(const y of[box.min.y,box.max.y])for(const z of[box.min.z,box.max.z]){p.set(x,y,z).project(camera);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}return{minX,maxX,minY,maxY,width:maxX-minX,height:maxY-minY};}

 test('close camera makes the beetles substantially larger than the previous whole-table fit, including long-jawed portrait pairs',()=>{
 for(const playerSpecies of ids)for(const opponentSpecies of ids)for(const aspect of[.45,16/9]){
  const view=createBattleView({playerSpecies,opponentSpecies,aspect}),box=new T.Box3().setFromObject(anchor(view,'player')).union(new T.Box3().setFromObject(anchor(view,'opponent'))),current=projectedBox(box,view.camera),radius=view.scene.getObjectByName('battle-stump').geometry.parameters.radiusTop;
  // Published 0.18 framed the entire table with 46% lower-screen reservation.
  const height=Math.max(...['player','opponent'].map(side=>new T.Box3().setFromObject(anchor(view,side)).getSize(new T.Vector3()).y)),oldFit=new T.Box3(new T.Vector3(-radius*1.08,-.14,-radius*1.08),new T.Vector3(radius*1.08,height+.12,radius*1.08)),p=new T.Vector3();let minX=Infinity,maxX=-Infinity,minY=Infinity,maxY=-Infinity;
  for(const x of[oldFit.min.x,oldFit.max.x])for(const y of[oldFit.min.y,oldFit.max.y])for(const z of[oldFit.min.z,oldFit.max.z]){p.set(x,y,z).applyMatrix4(view.camera.matrixWorldInverse);minX=Math.min(minX,p.x);maxX=Math.max(maxX,p.x);minY=Math.min(minY,p.y);maxY=Math.max(maxY,p.y);}
  const oldSpan=Math.max((maxX-minX)/(.90*aspect),(maxY-minY)/.46),newSpan=view.camera.top-view.camera.bottom;assert.ok(oldSpan/newSpan>1.5,`${playerSpecies}/${opponentSpecies} ${aspect} close ratio ${oldSpan/newSpan}`);assert.ok(current.minX>-.88&&current.maxX<.88&&current.minY>-.58&&current.maxY<.58);view.dispose();
 }
});

test('real weapon contact drives the receiver with rear support, then releases and restores; reduced motion is static and dust-free',()=>{
 const view=createBattleView({playerSpecies:'stag',opponentSpecies:'metallifer'}),a=model(view,'player'),jaw=a.userData.jaws[0],initialJaw=jaw.rotation.y;
 for(let i=0;i<26;i++)view.update(snapshot,.02);assert.equal(view.getPresentation().contactActive,true);assert.notEqual(jaw.rotation.y,initialJaw);assert.equal(view.scene.getObjectByName('battle-contact-dust').visible,true);const atContact=pose(view);
 for(let i=0;i<16;i++){
  view.update(snapshot,.02);assert.ok(view.scene.userData.battleContact.distance<.006,'contact remains on the receiver body during the paired motion');
  for(const side of['player','opponent']){const m=model(view,side),feet=m.userData.battleRig.legs.map(l=>l.foot.clone().applyMatrix4(l.mesh.matrixWorld));assert.ok(feet.every(p=>p.y>=-2e-5));assert.ok(feet.filter(p=>Math.abs(p.y)<2e-5).length>=2,'rear support survives body tilt');}
 }
 assert.notDeepEqual(pose(view),atContact,'receiving body follows the attack, not a static name label');assert.notEqual(anchor(view,'opponent').rotation.x,0);
 for(let i=0;i<40;i++)view.update(snapshot,.02);assert.equal(view.getPresentation().settled,true);assert.equal(view.scene.getObjectByName('battle-contact-dust').visible,false);assert.equal(jaw.rotation.y,initialJaw);
 const reduced=createBattleView({playerSpecies:'stag',opponentSpecies:'metallifer'});reduced.update(snapshot,.1,{reducedMotion:true});const still=pose(reduced),camera=reduced.camera.projectionMatrix.toArray();for(let i=0;i<80;i++){reduced.update(snapshot,.03,{reducedMotion:true});assert.deepEqual(pose(reduced),still);assert.deepEqual(reduced.camera.projectionMatrix.toArray(),camera);assert.equal(reduced.scene.getObjectByName('battle-contact-dust').visible,false);}
 reduced.scene.traverse(n=>{if(n.isLight)assert.ok(n.intensity<=1.2,'no flash light');});view.dispose();reduced.dispose();
});

test('actual capture battle wires enter/exchange/result once, hides long prose, pauses and resumes without replay, preserves companions',async t=>{
 const h=await app(t,{extraExports,battleSeed:1}),{g,elements}=h;h.choose('night');h.catchEligible('rhino');const calls={battle:[],battleWindup:[],battleContact:[],battleResult:[],pause:[]};
 for(const key of Object.keys(calls)){const original=g.audio[key];assert.equal(typeof original,'function',key);g.audio[key]=(...args)=>{calls[key].push(args);return original(...args);};}
 click(h,'capture-battle-button');assert.equal(g.state.mode,'battle');assert.deepEqual(calls.battle,[[{fresh:true}]]);const owned=g.roster.entries;h.frame(220);assert.equal(calls.battleWindup.length,1);assert.equal(calls.battleWindup[0][0].number,1);assert.ok(elements.get('battle-move-player').textContent.length>=2);assert.ok(elements.get('battle-move-player').textContent.length<=7);assert.equal(elements.get('battle-moves').hidden,false);
 const exchangeCount=calls.battleWindup.length;document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));const frozen=g.battle;h.frame(240);assert.equal(g.battle,frozen);assert.ok(calls.pause.length>0);assert.equal(elements.get('battle-moves').hidden,true);document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await h.settle();assert.deepEqual(calls.battle.at(-1),[{fresh:false}]);assert.equal(calls.battleWindup.length,exchangeCount);
 window.dispatchEvent(new Event('blur'));h.frame(60);window.dispatchEvent(new Event('focus'));assert.equal(calls.battleWindup.length,exchangeCount);finishWatching(h);assert.equal(calls.battleWindup.length,g.battle.exchanges);assert.equal(calls.battleContact.length,g.battle.exchanges);assert.deepEqual(calls.battleWindup.map(args=>args[0].number),Array.from({length:g.battle.exchanges},(_,i)=>i+1));assert.equal(calls.battleResult.length,1);assert.equal(calls.battleResult[0][0],g.battle.winner);assert.equal(elements.get('battle-moves').hidden,true);assert.match(elements.get('battle-cue').textContent,/勝ち|引き分け/);h.frame(180);window.dispatchEvent(new Event('focus'));assert.equal(calls.battleResult.length,1);assert.deepEqual(g.roster.entries,owned);
 click(h,'battle-exit-button');assert.equal(g.state.mode,'companions');const stops=calls.pause.length;click(h,'battle-start-button');assert.deepEqual(calls.battle.at(-1),[{fresh:true}]);h.frame(220);assert.equal(calls.battleWindup.at(-1)[0].number,1);click(h,'battle-exit-button');assert.ok(calls.pause.length>stops);assert.deepEqual(g.roster.entries,owned);
 g.audio.setVolume(0);click(h,'battle-start-button');await h.settle();h.frame(220);assert.equal(h.master().value,0,'zero volume stays silent through battle entry/exchange');document.hidden=true;document.dispatchEvent(new Event('visibilitychange'));document.hidden=false;document.dispatchEvent(new Event('visibilitychange'));await h.settle();assert.equal(h.master().value,0,'focus/visibility resume never overrides zero');click(h,'battle-exit-button');
 const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),css=fs.readFileSync(path.join(root,'style.css'),'utf8');assert.match(html,/id="battle-result" class="battle-accessible-detail"/);assert.match(html,/id="battle-move-player"/);for(const id of['battle-push','battle-evade','battle-brace'])assert.ok(!html.includes('id="'+id+'"'));assert.ok(!css.includes('max-height:44dvh'));assert.match(css,/\.battle-moves\{[^}]*font-size:clamp\(26px/);assert.match(css,/@media\(prefers-reduced-motion:reduce\)/);
});
