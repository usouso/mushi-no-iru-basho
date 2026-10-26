/** Isolated contact study only. Numerical contact is not a visual-naturalness verdict. */
import test from 'node:test';
import assert from 'node:assert/strict';
import {DUNG_DIMENSIONS as D,sampleDungPose} from '../src/dung-kinematics.js';
import {createDungContactStudy} from '../src/dung-contact-study.js';
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z),rotateX=(p,a)=>({x:p.x,y:p.y*Math.cos(a)-p.z*Math.sin(a),z:p.y*Math.sin(a)+p.z*Math.cos(a)}),add=(a,b)=>({x:a.x+b.x,y:a.y+b.y,z:a.z+b.z});

test('two ground forelegs and four rolling-surface middle/hind legs retain multiple simultaneous supports',()=>{
 let minGround=2,minBall=4;
 for(let n=0;n<=1200;n++){const p=sampleDungPose({distance:n/1200*D.pathLength});assert.equal(p.legs.length,6);assert.equal(p.body.heading,Math.PI);assert.equal(p.ball.radius,.08);assert.equal(p.ball.angle,p.ball.position.z/.08);assert.equal(p.legs.filter(l=>l.role==='front'&&l.surface==='ground').length,2);assert.equal(p.legs.filter(l=>l.role!=='front'&&l.surface==='ball').length,4);minGround=Math.min(minGround,p.legs.filter(l=>l.surface==='ground'&&l.contact).length);minBall=Math.min(minBall,p.legs.filter(l=>l.surface==='ball'&&l.contact).length);for(const l of p.legs){for(const point of [l.hip,l.knee,l.foot,l.contactNormal,l.anchor])assert.ok(Object.values(point).every(Number.isFinite));assert.ok(Math.abs(Math.hypot(...Object.values(l.contactNormal))-1)<1e-12);if(l.contact)assert.ok(Math.abs(l.surface==='ground'?l.foot.y:dist(l.foot,p.ball.position)-D.ballRadius)<1e-12);else if(l.surface==='ground')assert.ok(l.foot.y>=0);else assert.ok(dist(l.foot,p.ball.position)>=D.ballRadius-1e-12);}}
 assert.ok(minGround>=1);assert.ok(minBall>=3);assert.equal(sampleDungPose({distance:0}).legs.filter(l=>l.contact).length,6);assert.equal(sampleDungPose({distance:D.pathLength}).legs.filter(l=>l.contact).length,6);
});
test('stance feet are world-fixed on ground and fixed to a rotating ball material point, never world-fixed to the ball',()=>{
 let groundPairs=0,ballPairs=0,movingBallPairs=0,previous=sampleDungPose({distance:0});
 for(let n=1;n<=4000;n++){const p=sampleDungPose({distance:n*.00002});p.legs.forEach((l,i)=>{const before=previous.legs[i];if(!l.contact||!before.contact||dist(l.anchor,before.anchor)>1e-12)return;if(l.surface==='ground'){groundPairs++;assert.deepEqual(l.foot,before.foot);}else{ballPairs++;const world=add(p.ball.position,rotateX(l.anchor,p.ball.angle));assert.ok(dist(l.foot,world)<1e-12);assert.ok(dist(l.foot,before.foot)>0);movingBallPairs++;}});previous=p;}
 assert.ok(groundPairs>1000&&ballPairs>5000&&movingBallPairs===ballPairs);
});
test('fixed bone lengths remain reachable, joints stay above ground, and bone centrelines stay outside the sphere',()=>{
 let minimumKneeMargin=Infinity;
 for(let n=0;n<=1000;n++){const p=sampleDungPose({distance:n/1000*.08});for(const l of p.legs){assert.ok(Math.abs(dist(l.hip,l.knee)-l.upperLength)<1e-12);assert.ok(Math.abs(dist(l.knee,l.foot)-l.lowerLength)<1e-12);if(l.surface==='ball'){const margin=(l.knee.x-l.foot.x)*l.contactNormal.x+(l.knee.y-l.foot.y)*l.contactNormal.y+(l.knee.z-l.foot.z)*l.contactNormal.z;minimumKneeMargin=Math.min(minimumKneeMargin,margin);}for(const [a,b]of[[l.hip,l.knee],[l.knee,l.foot]])for(let j=0;j<=20;j++){const q={x:a.x+(b.x-a.x)*j/20,y:a.y+(b.y-a.y)*j/20,z:a.z+(b.z-a.z)*j/20};assert.ok(q.y>=-1e-12);assert.ok(dist(q,p.ball.position)>=D.ballRadius-1e-12);}}}
 assert.ok(minimumKneeMargin>.002);
});
test('every stance/swing boundary is position-continuous and all reset/end feet meet their supports',()=>{
 for(const offset of [0,.25,.5,.75])for(const duty of [0,.65,.75,1]){const distance=(2+offset+duty)*D.cycleDistance,a=sampleDungPose({distance:distance-1e-9}),b=sampleDungPose({distance:distance+1e-9});a.legs.forEach((l,i)=>{assert.ok(dist(l.foot,b.legs[i].foot)<1e-7);assert.ok(dist(l.knee,b.legs[i].knee)<1e-7);});}
 for(const distance of [0,D.pathLength]){const p=sampleDungPose({distance});for(const l of p.legs)assert.ok(Math.abs(l.surface==='ground'?l.foot.y:dist(l.foot,p.ball.position)-D.ballRadius)<1e-12);}
});
test('one finite forward roll has no slipping ball or automatic reverse/reset and stops at its endpoint',()=>{
 const study=createDungContactStudy(),initial=study.state;let previous=initial;for(let n=0;n<100*60;n++){study.update(1/60);const s=study.state;assert.equal(s.ball.id,'ball-1');assert.ok(s.distance>=previous.distance&&s.distance<=D.pathLength);assert.ok(s.speed<=.035+1e-10);assert.equal(s.ball.angle,s.distance/D.ballRadius);assert.equal(s.ball.position.y,D.ballRadius);previous=s;}
 assert.equal(study.state.status,'resting');assert.equal(study.state.distance,D.pathLength);assert.equal(study.state.speed,0);const ended=study.state;for(const dt of [0,-1,NaN,Infinity,1e6])study.update(dt);assert.deepEqual(study.state,ended);assert.equal(study.capture(),true);const pose=study.pose;assert.equal(study.release(),true);assert.deepEqual(study.pose.body,pose.body);assert.deepEqual(study.pose.ball,pose.ball);study.update(.1);assert.deepEqual(study.state,ended);study.reset();assert.deepEqual(study.state,initial);
});
test('capture freezes the original ball and all contact phases; release restores the pose and smoothly resumes',()=>{
 const study=createDungContactStudy();while(study.state.distance<.013)study.update(1/60);const before=study.pose;assert.equal(study.capture(),true);assert.equal(study.capture(),false);for(let n=0;n<180;n++)study.update(1/60);assert.deepEqual(study.pose.body,before.body);assert.deepEqual(study.pose.ball,before.ball);assert.deepEqual(study.pose.legs,before.legs);assert.equal(study.state.speed,0);assert.equal(study.release(),true);assert.equal(study.release(),false);assert.deepEqual(study.pose,before);study.update(1/60);assert.ok(study.state.distance>before.ball.position.z);assert.ok(study.state.speed<.001);const exposed=study.state;exposed.ball.position.z=999;assert.notEqual(study.state.ball.position.z,999);study.reset();assert.equal(study.state.distance,0);assert.equal(study.pose.legs.filter(l=>l.contact).length,6);
});
