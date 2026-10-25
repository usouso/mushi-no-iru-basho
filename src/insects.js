/** Pure, deterministic insect simulation. All coordinates are metres; y is absolute. */
export const SPECIES = Object.freeze({
  butterfly: { name: 'モンシロチョウ', label: 'モンシロチョウ', size: '初期試作の野外表示サイズ：開いた翅が約32cm（実際の虫の実寸ではありません）', observation: '白い翅の先に黒い模様。花のまわりをゆっくり飛び、蜜を吸うときは同じ場所にとまります。翅の開き方にも注目してみましょう。', hint: '草花の上でひと休み。ゆっくり近づくと観察できます。', color: '#f5efd5' },
  dragonfly: { name: 'アキアカネ', label: 'アキアカネ', size: '初期試作の野外表示サイズ：開いた翅が約40cm（実際の虫の実寸ではありません）', observation: '赤みのある細長い腹と、透きとおる四枚の翅。枝先などにとまると翅を横に開きます。飛び立ったあと、近くのとまり場所に戻ることもあります。', hint: '池のほとりの草先を探して。とまった瞬間がねらい目です。', color: '#b95136' },
  cicada: { name: 'アブラゼミ', label: 'アブラゼミ', size: '初期試作の野外表示サイズ：頭・触角から翅先まで約22.9cm（実際の虫の実寸ではありません）', observation: '茶色の翅を屋根のように重ねて、木の幹にとまっています。木肌に似た色なので、輪郭や大きな目を手がかりに探してみましょう。', hint: '大きな木の幹に注目。足音をひそめると逃げにくくなります。', color: '#8b6244' },
  morpho: { name: 'ペレイデスモルフォ', label: 'モルフォ', scientificName: 'Morpho helenor peleides', size: '自然の開張の紹介目安は約13〜20cm。試作の野外表示は約48cm（実寸ではありません）', observation: '中南米の熱帯の森林や川沿いに見られるチョウ。成虫は熟して傷んだ果実の汁を吸います。青い翅の表と、眼状紋のある褐色の裏を見比べてみましょう。青色は翅の微細な構造と光の作用によるものです。', hint: '林縁や小川沿いの明るい場所を探して。止まると翅を立て、茶色の裏が見えます。', color: '#377fc0' },
  grasshopper: { name: 'ショウリョウバッタ', label: 'ショウリョウバッタ', scientificName: 'Acrida cinerea', size: '自然の体長の紹介目安は雄約3.5cm、雌約8〜9cm。試作の胴と頭の表示長は約26cm（脚・触角を除き、実寸ではありません）', observation: 'イネ科の草が生える草原にすみ、植物の葉を食べます。細長い体、先の細い頭、長い後ろ脚が特徴です。跳んだ先を見つけて、止まった姿をそっと観察してみましょう。', hint: '草の足元を探して。跳んだ先を目で追い、止まったところへそっと近づこう。', color: '#81975a' },
  hercules: { name: 'ヘラクレスオオカブト（中米型）', label: 'ヘラクレスオオカブト', scientificName: 'Dynastes hercules septentrionalis（UF/IFASの分類表記）', size: 'ヘラクレスオオカブトの紹介では、雄の角を含む全長が17cm以上に達する個体もいます。試作表示は角込み全長約42cm、角を除く胴と頭は約22cm（実寸ではありません）', observation: '雄には頭と胸に長い角があり、雌には角がありません。成虫は腐熟した果実を食べ、薄明や夜間に飛びます。この試作では低い倒木で日中の休止や歩行を観察でき、果実台には寄りません。中米型を題材とし、種・亜種の分類には資料による扱いの違いがあります。', hint: '低い倒木の上を探して。止まった姿と、ゆっくり動く脚を観察してみよう。', color: '#8d8b4d' }
});

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const homes = [
  ['butterfly', 0, 5, 1.15], ['butterfly', -4.8, 5.6, 1.15], ['butterfly', 5, -3, 1.3],
  ['butterfly', -17, -1, 1.25], ['butterfly', 12, -13, 1.2], ['butterfly', -26, -21, 1.15],
  ['butterfly', 10.5, -.2, 1.25],
  ['dragonfly', 18, -14, 1.4], ['dragonfly', 19, -24, 1.25], ['dragonfly', 29, -13, 1.35],
  ['dragonfly', 31, -24, 1.2], ['dragonfly', 22, -29, 1.3], ['dragonfly', 10, -19, 1.2],
  ['cicada', -9.42, -7.82, 1.65], ['cicada', -10.45, -7.67, 2.05],
  ['cicada', -10.17, -8.57, 1.4], ['cicada', -9.75, -7.48, 2.7],
  ['butterfly', -6.8, 8.4, 1.2]
];

export function createInsects(heightAt = () => 0, { homes: habitatHomes = homes, extraHomes = [], grasshopperSupports = [], herculesSupports = [], bounds = 75, hasLineOfSight = () => true } = {}) {
  // Optional geometry adapter: the pure simulation never reads renderer meshes.
  if (typeof hasLineOfSight !== 'function') throw new TypeError('Invalid line-of-sight adapter');
  const validHomes = rows => Array.isArray(rows) && rows.every(row => Array.isArray(row) && typeof row[0] === 'string' && Object.prototype.hasOwnProperty.call(SPECIES,row[0]) && row.length === 4 && [row[1],row[2],row[3]].every(Number.isFinite));
  if (!validHomes(habitatHomes) || !habitatHomes.length || !validHomes(extraHomes)) throw new TypeError('Invalid habitat homes');
  const initialHomes = [...habitatHomes,...extraHomes].map(row=>[...row]);
  const flightBounds = Number.isFinite(bounds) && bounds > 6 ? Math.min(75, bounds) : 75;
  const hopperSupports = new Map(), hoppers = new Map();
  try {
    if (!Array.isArray(grasshopperSupports)) throw new Error();
    const point = value => {
      if (!value || ![Object.prototype,null].includes(Object.getPrototypeOf(value)) || !['x','y','z'].every(key=>Object.prototype.hasOwnProperty.call(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key) && Number.isFinite(value[key]))) throw new Error();
      const {x,y,z}=value,ground=heightAt(x,z);
      if (Math.abs(x)>flightBounds || Math.abs(z)>flightBounds || !Number.isFinite(ground) || y<ground || y>ground+.3) throw new Error();
      return {x,y,z};
    };
    const groups=grasshopperSupports.map(group=>{
      if (!group || !Array.isArray(group.points) || group.points.length!==3) throw new Error();
      const home=point(group.home),points=group.points.map(point);
      if (Math.hypot(home.x-points[0].x,home.y-points[0].y,home.z-points[0].z)>1e-6) throw new Error();
      for(let a=0;a<3;a++)for(let b=a+1;b<3;b++){const distance=Math.hypot(points[a].x-points[b].x,points[a].z-points[b].z);if(distance<.3 || distance>2.7+1e-6)throw new Error();}
      return {home,points};
    });
    const used=new Set();
    initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='grasshopper')return;
      const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1 || used.has(matches[0].i))throw new Error();
      used.add(matches[0].i);hopperSupports.set(index,matches[0].group.points);
    });
    if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid grasshopper supports'); }
  const beetleSupports=new Map(),beetles=new Map();
  try {
    if(!Array.isArray(herculesSupports))throw new Error();
    const point=value=>{
      if(!value || ![Object.prototype,null].includes(Object.getPrototypeOf(value)) || !['x','y','z'].every(key=>Object.prototype.hasOwnProperty.call(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key) && Number.isFinite(value[key])))throw new Error();
      const {x,y,z}=value,ground=heightAt(x,z);if(Math.abs(x)>flightBounds || Math.abs(z)>flightBounds || !Number.isFinite(ground) || y<ground || y>ground+3)throw new Error();return{x,y,z};
    };
    const groups=herculesSupports.map(group=>{
      if(!group || !Array.isArray(group.axis) || group.axis.length!==2)throw new Error();
      const home=point(group.home),axis=group.axis.map(point),dx=axis[1].x-axis[0].x,dz=axis[1].z-axis[0].z,length=Math.hypot(dx,dz);
      if(length<.4 || length>2 || Math.abs(axis[0].y-axis[1].y)>1e-6 || Math.abs(home.y-axis[0].y)>1e-6)throw new Error();
      const ux=dx/length,uz=dz/length,s=(home.x-axis[0].x)*ux+(home.z-axis[0].z)*uz;
      if(s<0 || s>length || Math.hypot(home.x-axis[0].x-ux*s,home.z-axis[0].z-uz*s)>1e-6)throw new Error();
      return{home,axis,length,ux,uz,homeS:s};
    });
    const used=new Set();initialHomes.forEach(([species,x,z,altitude],index)=>{
      if(species!=='hercules')return;const y=heightAt(x,z)+altitude,matches=groups.map((group,i)=>({group,i})).filter(({group})=>Math.hypot(group.home.x-x,group.home.y-y,group.home.z-z)<=1e-6);
      if(matches.length!==1 || used.has(matches[0].i))throw new Error();used.add(matches[0].i);beetleSupports.set(index,matches[0].group);
    });if(used.size!==groups.length)throw new Error();
  } catch { throw new TypeError('Invalid hercules supports'); }
  const items = [];
  let time = 0;
  let held = null;
  let catches = 0;
  let previousPlayer = null;
  let caughtFrom = null;
  let bait = null;
  const baitCooldown = new Map();
  const eye = p => ({ x: p.x, y: Number.isFinite(p.y) ? p.y : heightAt(p.x, p.z) + 1.65, z: p.z });
  function reset() {
    bait = null; baitCooldown.clear(); hoppers.clear(); beetles.clear();
    time = 0; held = null; catches = 0; previousPlayer = null; caughtFrom = null; items.length = 0;
    initialHomes.forEach(([species, x, z, altitude], index) => {
      const y = heightAt(x, z) + altitude;
      items.push({ id: `insect-${index + 1}`, species, x, y, z, home: { x, y, z },
        heading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        state: 'resting', resting: true, caught: false, phase: index * 1.837,
        wingPhase: index * 1.837, flightBlend: 0, fleeUntil: 0, releaseUntil: 0,
        fleeX: x, fleeZ: z, age: 0, beginner: index === 0,
        homeHeading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        alert: 0, nextScareAt: 0, settleUntil: 0, departures: 0, excursion: null });
      if (species === 'grasshopper') {
        const item=items[items.length-1];item.airborne=false;item.jumpProgress=0;item.jumpStart=null;item.jumpEnd=null;
        hoppers.set(item.id,{points:hopperSupports.get(index),perchIndex:0,jump:null});
      }
      if (species === 'hercules') {
        const item=items[items.length-1],support=beetleSupports.get(index);
        item.heading=item.homeHeading=Math.atan2(support.ux,support.uz);item.walkPhase=0;item.walkSpeed=0;item.turnProgress=0;
        beetles.set(item.id,{support,s:support.homeS,move:null,nextMoveAt:30+5*(1+Math.sin(item.phase)),reactAfter:0,near:false});
      }
    });
  }
  reset();

  const flightStyle = {
    butterfly: { duration: 6.6, reach: 3.0, lift: .85, flutter: .22, frequency: 4.6 },
    dragonfly: { duration: 5.2, reach: 3.7, lift: .55, flutter: .055, frequency: 2.4 },
    cicada: { duration: 6.0, reach: 3.2, lift: .95, flutter: .035, frequency: 3.1 },
    // A slower, wider wavering loop is a play tuning value, not a measured flight constant.
    morpho: { duration: 8.4, reach: 3.4, lift: .65, flutter: .18, frequency: 3.6 }
  };
  const finitePlayer = p => p && Number.isFinite(p.x) && Number.isFinite(p.z) ? eye(p) : null;
  function boundedControl(item, point) {
    // Excursions remain local, even if the insect was caught while already flying.
    const dx = point.x - item.home.x, dz = point.z - item.home.z, distance = Math.hypot(dx, dz);
    const scale = distance > 5.5 ? 5.5 / distance : 1;
    return { x: clamp(item.home.x + dx * scale, -flightBounds, flightBounds), y: point.y, z: clamp(item.home.z + dz * scale, -flightBounds, flightBounds) };
  }
  function depart(item, reason, player) {
    if (item.species === 'grasshopper') { beginJump(item,reason,player); return; }
    if (item.species === 'hercules') { beginBeetleWalk(item,reason,player); return; }
    if (bait?.visitorId === item.id) detachVisitor();
    const style = flightStyle[item.species], p = finitePlayer(player);
    let dx = p ? item.x - p.x : Math.sin(item.heading), dz = p ? item.z - p.z : Math.cos(item.heading);
    let length = Math.hypot(dx, dz);
    if (length < .001) { dx = Math.sin(item.phase + 1); dz = Math.cos(item.phase + 1); length = 1; }
    dx /= length; dz /= length;
    let sideX = -dz, sideZ = dx;
    if (item.species === 'cicada') {
      // The oak's outward normal takes priority over a player standing behind the
      // trunk. Both Bezier controls stay on the home-facing side of that plane.
      const rx = item.home.x + 10, rz = item.home.z + 8, radial = Math.hypot(rx, rz) || 1;
      const nx = rx / radial, nz = rz / radial;
      sideX = -nz; sideZ = nx;
      if (dx*nx + dz*nz < .2) {
        // With the player outside the bark, sidestep and rise rather than flying
        // through the trunk or charging straight through the player's position.
        const tangent = dx*sideX + dz*sideZ;
        const sign = Math.abs(tangent) > .05 ? Math.sign(tangent) : Math.sin(item.phase + (item.departures+1)*1.6) >= 0 ? 1 : -1;
        dx = nx*.22 + sideX*sign*.98; dz = nz*.22 + sideZ*sign*.98;
      } else { dx = nx*.85 + dx*.35; dz = nz*.85 + dz*.35; }
      length = Math.hypot(dx, dz); dx /= length; dz /= length;
    }
    const duration = style.duration * (reason === 'startled' ? .78 : 1);
    const reach = style.reach * (reason === 'startled' ? .85 : 1);
    const turn = Math.sin(item.phase + (++item.departures) * 1.6) >= 0 ? 1 : -1;
    const start = { x: item.x, y: item.y, z: item.z };
    // A fruit visitor can be farther than the ordinary home-local flight radius.
    // Keep its first escape control local to the actual capture/startle position.
    const firstControl = { x: start.x + dx * reach * 1.35, y: Math.max(start.y, item.home.y) + style.lift, z: start.z + dz * reach * 1.35 };
    const c1 = item.species === 'morpho' && Math.hypot(start.x-item.home.x,start.z-item.home.z)>5.5 ? fieldControl(firstControl) : boundedControl(item, firstControl);
    const c2 = boundedControl(item, { x: item.home.x + dx * reach * 1.1 + sideX * turn * .65, y: item.home.y + style.lift * 1.15, z: item.home.z + dz * reach * 1.1 + sideZ * turn * .65 });
    item.excursion = { reason, startedAt: time, duration, start, c1, c2, sideX, sideZ, turn };
    item.state = reason; item.resting = false; item.alert = 0;
    item.nextScareAt = time + (reason === 'released' ? .85 : 2.0);
    item.fleeUntil = reason === 'startled' ? time + duration : 0;
    // This is a flight deadline, not immunity and not a stationary seven-second hold.
    item.releaseUntil = reason === 'released' ? time + duration : 0;
    item.fleeX = c1.x; item.fleeZ = c1.z;
  }
  function fieldControl(point) {
    return { x: clamp(point.x,-flightBounds,flightBounds), y: point.y, z: clamp(point.z,-flightBounds,flightBounds) };
  }
  function detachVisitor() {
    if (!bait) return null;
    const visitor = items.find(item => item.id === bait.visitorId) || null;
    if (visitor) { baitCooldown.set(visitor.id,time+40);bait.nextInviteAt=time+18; }
    bait.visitorId = null; bait.status = 'waiting'; bait.feedUntil = 0;
    return visitor;
  }
  function placeBait(value) {
    if (bait) return false;
    try {
      if (!value || typeof value !== 'object' || ![Object.prototype,null].includes(Object.getPrototypeOf(value))) return false;
      const keys = Reflect.ownKeys(value);
      if (keys.length !== 4 || !['type','x','y','z'].every(key => Object.prototype.hasOwnProperty.call(value,key) && 'value' in Object.getOwnPropertyDescriptor(value,key))) return false;
      const {type,x,y,z} = value, ground = Number.isFinite(x) && Number.isFinite(z) ? heightAt(x,z) : NaN;
      if (type !== 'fermented-fruit' || ![x,y,z,ground].every(Number.isFinite) || Math.abs(x)>flightBounds || Math.abs(z)>flightBounds || y<ground+.45 || y>ground+3) return false;
      bait = {type,x,y,z,expiresAt:time+90,nextInviteAt:time+4,attempts:0,visitorId:null,status:'waiting',feedUntil:0};
      return true;
    } catch { return false; }
  }
  function removeBait() {
    if (!bait) return false;
    const visitor = detachVisitor(); bait = null;
    if (visitor && !visitor.caught) depart(visitor,'returning',previousPlayer);
    return true;
  }
  function updateBait(player,p) {
    if (!bait) return;
    if (time >= bait.expiresAt-1e-9) { removeBait(); return; }
    if (bait.status === 'feeding' && time >= bait.feedUntil) {
      const visitor = detachVisitor(); if (visitor && !visitor.caught) depart(visitor,'returning',player);
    }
    if (bait.visitorId || time < bait.nextInviteAt) return;
    bait.nextInviteAt = time + 3.5;
    if (p && Math.hypot(p.x-bait.x,p.z-bait.z)<=2.8) return;
    const attempt = ++bait.attempts;
    const candidates = items.filter(item => item.species === 'morpho' && !item.caught && item.resting && item.state === 'resting' && !item.excursion && item.alert === 0 && time >= item.nextScareAt && time >= (baitCooldown.get(item.id)||0) && Math.hypot(item.x-bait.x,item.z-bait.z)<=14 && Math.sin(item.phase+attempt*1.9)>-.25);
    candidates.sort((a,b)=>Math.hypot(a.x-bait.x,a.z-bait.z)-Math.hypot(b.x-bait.x,b.z-bait.z));
    const item = candidates[0]; if (!item) return;
    const start = {x:item.x,y:item.y,z:item.z}, end = {x:bait.x,y:bait.y,z:bait.z};
    const dx=end.x-start.x,dz=end.z-start.z,distance=Math.hypot(dx,dz),sideX=distance ? -dz/distance : 1,sideZ=distance ? dx/distance : 0;
    const c1=fieldControl({x:start.x+dx*.3+sideX*.65,y:Math.max(start.y,end.y)+.65,z:start.z+dz*.3+sideZ*.65});
    const c2=fieldControl({x:end.x-dx*.2-sideX*.35,y:end.y+.45,z:end.z-dz*.2-sideZ*.35});
    item.excursion={reason:'bait-approach',startedAt:time,duration:3+distance*.45,start,c1,c2,end,sideX,sideZ,turn:1};
    item.state='bait-approach';item.resting=false;item.alert=0;
    bait.visitorId=item.id; bait.status='approaching';
  }

  // Grasshoppers use local ground supports, never the flying insects' home loop.
  // Durations, lift and reaction radii are play tuning, not biological measurements.
  function beginJump(item,reason,player) {
    const hopper=hoppers.get(item.id),p=finitePlayer(player),start={x:item.x,y:item.y,z:item.z};
    const choices=hopper.points.map((end,index)=>({end,index,distance:Math.hypot(end.x-start.x,end.z-start.z)})).filter(choice=>choice.index!==hopper.perchIndex && choice.distance>.2 && choice.distance<=2.7+1e-6);
    choices.sort((a,b)=>p ? Math.hypot(b.end.x-p.x,b.end.z-p.z)-Math.hypot(a.end.x-p.x,a.end.z-p.z) || a.index-b.index : (a.index-hopper.perchIndex+3)%3-(b.index-hopper.perchIndex+3)%3);
    const choice=choices[0];if(!choice)return false;
    hopper.jump={start,end:choice.end,index:choice.index,startedAt:time,duration:.7+.2*choice.distance/2.7,lift:.6};
    item.jumpStart={...start};item.jumpEnd={...choice.end};
    item.departures++;item.state='jumping';item.resting=false;item.airborne=true;item.jumpProgress=0;item.alert=0;item.flightBlend=0;
    item.fleeUntil=reason==='startled'?time+hopper.jump.duration:0;item.releaseUntil=reason==='released'?time+hopper.jump.duration:0;
    return true;
  }
  function updateGrasshopper(item,dt,player,p) {
    const hopper=hoppers.get(item.id);
    if(!hopper.jump){
      let rate=0;
      if(p){
        const near=Math.hypot(item.x-p.x,item.z-p.z),gap=Math.max(0,item.y-(p.y+.25),heightAt(p.x,p.z)+.015-item.y);
        const speed=Number.isFinite(player.speed)?Math.max(0,player.speed):0;
        if(Math.hypot(near,gap)<.36)rate=10;
        else if(speed>=.12 && gap<1.5){const radius=player.quiet?.9:speed>4?3.0:2.2;if(near<radius)rate=(player.quiet?1.8:speed>4?4:2.5)*(1+(radius-near)/radius);}
      }
      item.alert=clamp(item.alert+dt*(rate||-3),0,1.2);
      if(rate && item.alert>=1 && time>=item.nextScareAt)beginJump(item,'startled',player);
    }
    const jump=hopper.jump;
    if(!jump){item.state='resting';item.resting=true;item.airborne=false;item.jumpProgress=0;return;}
    const u=clamp((time-jump.startedAt)/jump.duration,0,1);
    item.x=jump.start.x+(jump.end.x-jump.start.x)*u;
    item.z=jump.start.z+(jump.end.z-jump.start.z)*u;
    item.y=jump.start.y+(jump.end.y-jump.start.y)*u+4*jump.lift*u*(1-u);
    const heading=Math.atan2(jump.end.x-jump.start.x,jump.end.z-jump.start.z);
    item.heading+=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading))*(1-Math.exp(-dt*10));
    item.jumpProgress=u;item.airborne=true;item.resting=false;item.state='jumping';item.flightBlend=0;
    if(u>=1){item.x=jump.end.x;item.y=jump.end.y;item.z=jump.end.z;hopper.perchIndex=jump.index;hopper.jump=null;item.jumpStart=null;item.jumpEnd=null;item.state='resting';item.resting=true;item.airborne=false;item.jumpProgress=0;item.nextScareAt=time+1.7;item.alert=0;}
  }

  // Daytime beetles rest on a single horizontal support; no flight or fruit lure.
  // Stop distances are shortened by <25mm to retain a both-tripods-grounded phase.
  function restBeetle(item) {
    const beetle=beetles.get(item.id);beetle.move=null;beetle.nextMoveAt=time+30+5*(1+Math.sin(item.phase+item.departures*1.3));beetle.reactAfter=time+10;
    item.state='resting';item.resting=true;item.walkSpeed=0;item.turnProgress=0;
  }
  function beginBeetleWalk(item,reason,player) {
    const beetle=beetles.get(item.id),support=beetle.support,p=finitePlayer(player);
    const projected=p?(p.x-support.axis[0].x)*support.ux+(p.z-support.axis[0].z)*support.uz:beetle.s;
    let direction=p?(beetle.s>=projected?1:-1):(item.departures%2?-1:1);
    let available=direction>0?support.length-beetle.s:beetle.s;
    if(reason==='spontaneous' && available<.25){direction=-direction;available=direction>0?support.length-beetle.s:beetle.s;}
    const half=item.walkPhase/Math.PI,desired=Math.min(available,.25+.05*(item.departures%5));
    let targetHalf=Math.floor(half+desired/.025+1e-9),distance=Math.max(0,(targetHalf-half)*.025);
    if(distance<1e-8){
      // After a mid-stride capture at an edge, at most 25mm in the other safe
      // direction can finish the foot placement; never reset the gait phase.
      targetHalf=Math.ceil(half-1e-9);distance=Math.max(0,(targetHalf-half)*.025);
      const other=direction>0?beetle.s:support.length-beetle.s;
      if(distance<1e-8 || distance>other+1e-9){restBeetle(item);return false;}
      direction=-direction;
    }
    const endS=clamp(beetle.s+direction*distance,0,support.length),start={x:item.x,y:item.y,z:item.z};
    const end={x:support.axis[0].x+support.ux*endS,y:start.y,z:support.axis[0].z+support.uz*endS};
    const heading=Math.atan2(direction*support.ux,direction*support.uz),delta=Math.atan2(Math.sin(heading-item.heading),Math.cos(heading-item.heading));
    const speed=.12+.03*(1+Math.sin(item.phase+item.departures*.73));
    beetle.move={reason,start,end,startS:beetle.s,endS,distance,travelled:0,targetPhase:targetHalf*Math.PI,speed,turnStart:item.heading,delta,startedAt:time,turnDuration:Math.abs(delta)<.01?0:.5+.5*Math.abs(delta)/Math.PI};
    item.departures++;item.state=beetle.move.turnDuration?'turning':'walking';item.resting=false;item.walkSpeed=0;item.turnProgress=0;item.alert=0;item.flightBlend=0;
    return true;
  }
  function updateHercules(item,dt,player,p) {
    const beetle=beetles.get(item.id),near=!!p && Math.hypot(item.x-p.x,item.z-p.z)<(player.quiet?.8:1.5) && Math.abs(item.y-p.y)<2;
    const arrived=near&&!beetle.near;beetle.near=near;
    if(arrived && beetle.move?.reason==='spontaneous'){
      // A newly close observer interrupts an unprovoked walk at the next
      // grounded half-cycle, rather than making the beetle push into them.
      const move=beetle.move,targetHalf=Math.ceil(item.walkPhase/Math.PI-1e-9),left=Math.max(0,(targetHalf-item.walkPhase/Math.PI)*.025);
      if(left<1e-8)restBeetle(item);
      else{const total=Math.min(move.distance,move.travelled+left),ratio=total/move.distance;move.end={x:move.start.x+(move.end.x-move.start.x)*ratio,y:move.start.y,z:move.start.z+(move.end.z-move.start.z)*ratio};move.endS=move.startS+(move.endS-move.startS)*ratio;move.distance=total;move.targetPhase=targetHalf*Math.PI;}
    }
    if(!beetle.move){
      if(arrived && time>=beetle.reactAfter)beginBeetleWalk(item,'near',player);
      else if(!near && time>=beetle.nextMoveAt)beginBeetleWalk(item,'spontaneous',null);
    }
    const move=beetle.move;if(!move){item.walkSpeed=0;return;}
    if(item.state==='turning'){
      const u=clamp((time-move.startedAt)/move.turnDuration,0,1);item.heading=move.turnStart+move.delta*u;item.turnProgress=u;item.walkSpeed=0;
      if(u<1)return;item.state='walking';return;
    }
    const advance=Math.min(move.speed*dt,Math.max(0,move.distance-move.travelled));
    move.travelled+=advance;const u=clamp(move.travelled/move.distance,0,1);
    item.x=move.start.x+(move.end.x-move.start.x)*u;item.y=move.start.y;item.z=move.start.z+(move.end.z-move.start.z)*u;
    beetle.s=move.startS+(move.endS-move.startS)*u;item.walkPhase+=advance/.05*TAU;item.walkSpeed=dt>0?advance/dt:0;item.state='walking';item.resting=false;
    if(move.distance-move.travelled<1e-10){item.x=move.end.x;item.z=move.end.z;beetle.s=move.endS;item.walkPhase=move.targetPhase;restBeetle(item);}
  }

  function alertRate(item, player, p, dt) {
    if (!p) return 0;
    const near = Math.hypot(item.x - p.x, item.z - p.z);
    const verticalGap = Math.max(0, item.y - (p.y + .25), heightAt(p.x, p.z) + .15 - item.y);
    // Very close physical intrusion is not made invisible by quiet mode.
    if (Math.hypot(near, verticalGap) < .36) return 10;
    const speed = Number.isFinite(player.speed) ? Math.max(0, player.speed) : 0;
    if (speed < .12) return 0;
    const kind = item.species, quiet = !!player.quiet;
    let radius = quiet ? ({butterfly:.82,dragonfly:.94,cicada:1.02,morpho:.90}[kind]) :
      speed > 4 ? ({butterfly:2.65,dragonfly:3.0,cicada:3.25,morpho:3.0}[kind]) :
      ({butterfly:1.65,dragonfly:1.95,cicada:2.1,morpho:1.9}[kind]);
    // The first encounter is forgiving, not permanently immune to approaching it.
    if (item.beginner && item.age < 12 && item.departures === 0) radius *= .65;
    if (previousPlayer && dt > 0) {
      const oldDistance = Math.hypot(item.x - previousPlayer.x, item.z - previousPlayer.z);
      const closing = (oldDistance - near) / dt;
      if (closing < -.15) radius *= .7;
    }
    if (near >= radius || verticalGap > 1.5) return 0;
    const closeness = 1 + (radius - near) / radius;
    return (quiet ? 1.8 : speed > 4 ? 4 : 2.5) * closeness;
  }

  function update(dt, player) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    time += dt;
    const p = finitePlayer(player);
    updateBait(player,p);
    for (const item of items) {
      item.age += dt;
      if (item.species === 'grasshopper') { if (!item.caught) updateGrasshopper(item,dt,player,p); continue; }
      if (item.species === 'hercules') { if (!item.caught) updateHercules(item,dt,player,p); continue; }
      item.wingPhase += dt * (item.species === 'morpho' ? 8.5 : item.species === 'butterfly' ? 12 : 70);
      if (item.caught) continue;
      const rate = alertRate(item, player, p, dt);
      item.alert = clamp(item.alert + dt * (rate || -3), 0, 1.2);
      if (rate && item.alert >= 1 && time >= item.nextScareAt) depart(item, 'startled', player);
      let tx = item.home.x, ty = item.home.y, tz = item.home.z;
      let resting = true, flightStrength = 0, landing = false;
      if (item.excursion) {
        const route = item.excursion, u = clamp((time - route.startedAt) / route.duration, 0, 1);
        if (u < 1) {
          const v = 1 - u, style = flightStyle[item.species], end = route.end || item.home;
          tx = v*v*v*route.start.x + 3*v*v*u*route.c1.x + 3*v*u*u*route.c2.x + u*u*u*end.x;
          ty = v*v*v*route.start.y + 3*v*v*u*route.c1.y + 3*v*u*u*route.c2.y + u*u*u*end.y;
          tz = v*v*v*route.start.z + 3*v*v*u*route.c1.z + 3*v*u*u*route.c2.z + u*u*u*end.z;
          const envelope = Math.sin(Math.PI*u), flutter = Math.sin((time-route.startedAt)*style.frequency + item.phase)*style.flutter*envelope;
          tx += route.sideX*flutter; tz += route.sideZ*flutter;
          ty += Math.sin((time-route.startedAt)*style.frequency*1.3)*style.flutter*.45*envelope;
          ty = Math.max(ty, heightAt(tx,tz) + .45);
          resting = false; landing = u > .78;
          item.state = landing ? 'landing' : route.reason;
          flightStrength = landing ? clamp((1-u)/.22, .12, 1) : 1;
        } else {
          item.excursion = null; item.settleUntil = time + 3;
        }
      }
      const atBait = !item.excursion && bait?.visitorId === item.id;
      if (atBait) {
        tx=bait.x;ty=bait.y;tz=bait.z;
        const distance=Math.hypot(tx-item.x,ty-item.y,tz-item.z);
        resting=distance<.035;landing=!resting;flightStrength=resting?0:clamp(distance/.55,0,.5);
        item.state=resting?'feeding':'landing';
        if (resting && bait.status !== 'feeding') { bait.status='feeding';bait.feedUntil=time+7; }
      } else if (!item.excursion) {
        const settling = time < item.settleUntil;
        const homeDistance = Math.hypot(item.x-item.home.x,item.y-item.home.y,item.z-item.home.z);
        if (settling && homeDistance > .055) {
          resting = false; landing = true; item.state = 'landing'; flightStrength = clamp(homeDistance/.55, 0, .5);
        } else if (!settling && item.species !== 'cicada') {
          // Ordinary unprovoked perch / loop timing stays the same as v0.1.5.
          const period = item.species === 'morpho' ? 22 : item.species === 'butterfly' ? 17 : 15;
          const cycle = (time + (item.beginner ? 0 : item.phase * 2)) % period;
          const restTime = item.species === 'morpho' ? 13 : item.species === 'butterfly' ? 11 : 9;
          if (cycle > restTime) {
            resting = false;
            const u = (cycle - restTime) / (period - restTime), envelope = Math.sin(u * Math.PI);
            const radius = item.species === 'morpho' ? 2.5 : item.species === 'butterfly' ? 1.35 : 2.2;
            tx += Math.cos(u * TAU + item.phase) * radius * envelope;
            tz += Math.sin(u * TAU + item.phase) * radius * envelope;
            ty += envelope * (.35 + .14 * Math.sin(u * TAU * 2));
          }
          item.state = resting ? 'resting' : 'flying'; flightStrength = resting ? 0 : 1;
        } else item.state = 'resting';
      }
      // Perched bodies stay on their support; wing motion remains in the renderer.
      const smoothing = 1 - Math.exp(-dt * (item.state === 'startled' ? 3.2 : 5));
      const dx = tx - item.x, dz = tz - item.z;
      let targetHeading = null;
      if (atBait) targetHeading = 0;
      else if (item.species === 'cicada' && (resting || landing)) targetHeading = item.homeHeading;
      else if (!resting && Math.hypot(dx, dz) > .015) targetHeading = Math.atan2(dx, dz);
      if (targetHeading !== null) {
        const delta = Math.atan2(Math.sin(targetHeading - item.heading), Math.cos(targetHeading - item.heading));
        item.heading += delta * (1 - Math.exp(-dt * 4));
      }
      item.x += dx * smoothing; item.y += (ty - item.y) * smoothing; item.z += dz * smoothing;
      item.resting = resting;
      item.flightBlend += (flightStrength - item.flightBlend) * Math.min(1, dt * 8);
    }
    previousPlayer = p;
  }

  function candidates(player, direction) {
    if (!player || !direction || held) return [];
    const p = eye(player);
    const dl = Math.hypot(direction.x, direction.y, direction.z) || 1;
    return items.filter(i => !i.caught).map(item => {
      const dx = item.x - p.x, dy = item.y - p.y, dz = item.z - p.z;
      const distance = Math.hypot(dx, dy, dz);
      const dot = (dx * direction.x + dy * direction.y + dz * direction.z) / (Math.max(.001, distance) * dl);
      return { item, distance, dot };
    });
  }
  function describe(candidate) {
    const { item, distance, dot } = candidate;
    const catchable = distance <= 2.6 && dot >= .82;
    return { item, distance, catchable, reason: catchable ? 'あみが届きます' : distance > 2.6 ? 'そっと近づいてみよう' : '虫に向かってあみを構えよう' };
  }
  function findTarget(player, direction) {
    const list = candidates(player, direction).filter(c => c.distance <= 17 && c.dot > (c.distance <= 2.6 ? .82 : .97));
    list.sort((a,b) => ((1 - a.dot) * 18 + a.distance * .025) - ((1 - b.dot) * 18 + b.distance * .025));
    const from=player?eye(player):null,target=list.find(c=>hasLineOfSight(from,c.item) === true);
    return target ? describe(target) : null;
  }
  function swing(player, direction) {
    if (held) return { ok: false, reason: '観察した虫を、先に逃がしてあげよう' };
    const list = candidates(player, direction).filter(c => c.distance <= 2.6 && c.dot >= .82);
    list.sort((a,b) => (1-a.dot)*8+a.distance - ((1-b.dot)*8+b.distance));
    const from=player?eye(player):null,candidate=list.find(c=>hasLineOfSight(from,c.item) === true);
    if (!candidate) {
      const target = findTarget(player, direction);
      return { ok: false, reason: target ? target.reason : '空振り。虫に向かって、もう少し近くで' };
    }
    held = candidate.item; if (bait?.visitorId === held.id) detachVisitor(); held.caught = true; held.state = 'caught'; caughtFrom = eye(player); catches++;
    if (held.species === 'grasshopper') { hoppers.get(held.id).jump=null;held.airborne=false;held.jumpProgress=0;held.resting=true; }
    if (held.species === 'hercules') { beetles.get(held.id).move=null;held.walkSpeed=0;held.resting=true; }
    return { ok: true, item: held };
  }
  function release(player) {
    if (!held) return null;
    const item = held;
    item.caught = false;
    // Keep the actual capture position, including a catch made in mid-flight.
    // Start a continuous departure; never teleport to home or freeze on a perch.
    depart(item, 'released', finitePlayer(player) || caughtFrom || previousPlayer);
    held = null; caughtFrom = null;
    return item;
  }

  return { items, update, findTarget, swing, release, reset, placeBait, removeBait, get bait() { return bait ? {active:true,type:bait.type,x:bait.x,y:bait.y,z:bait.z,remaining:Math.max(0,bait.expiresAt-time),visitorId:bait.visitorId,status:bait.status} : null; }, get caught() { return held; }, get time() { return time; }, get catches() { return catches; } };
}
