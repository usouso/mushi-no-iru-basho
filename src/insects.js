/** Pure, deterministic insect simulation. All coordinates are metres; y is absolute. */
export const SPECIES = Object.freeze({
  butterfly: { name: 'モンシロチョウ', label: 'モンシロチョウ', size: '自然な大きさに寄せ、見やすさを少し補正：野外では開いた翅を約7cmで表現', observation: '白い翅の先に黒い模様。花のまわりをゆっくり飛び、蜜を吸うときは同じ場所にとまります。翅の開き方にも注目してみましょう。', hint: '草花の上でひと休み。ゆっくり近づくと観察できます。', color: '#f5efd5' },
  dragonfly: { name: 'アキアカネ', label: 'アキアカネ', size: '自然な大きさに寄せ、見やすさを少し補正：野外では開いた翅を約9cmで表現', observation: '赤みのある細長い腹と、透きとおる四枚の翅。枝先などにとまると翅を横に開きます。飛び立ったあと、近くのとまり場所に戻ることもあります。', hint: '池のほとりの草先を探して。とまった瞬間がねらい目です。', color: '#b95136' },
  cicada: { name: 'アブラゼミ', label: 'アブラゼミ', size: '自然な大きさに寄せ、見やすさを少し補正：野外では体と翅を約8cmで表現', observation: '茶色の翅を屋根のように重ねて、木の幹にとまっています。木肌に似た色なので、輪郭や大きな目を手がかりに探してみましょう。', hint: '大きな木の幹に注目。足音をひそめると逃げにくくなります。', color: '#8b6244' }
});

const TAU = Math.PI * 2;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const homes = [
  ['butterfly', 0, 5, 1.15], ['butterfly', -3.7, 1.8, 1.15], ['butterfly', 5, -3, 1.3],
  ['butterfly', -17, -1, 1.25], ['butterfly', 12, -13, 1.2], ['butterfly', -26, -21, 1.15],
  ['butterfly', 15, 15, 1.25],
  ['dragonfly', 18, -14, 1.4], ['dragonfly', 19, -24, 1.25], ['dragonfly', 29, -13, 1.35],
  ['dragonfly', 31, -24, 1.2], ['dragonfly', 22, -29, 1.3], ['dragonfly', 10, -19, 1.2],
  ['cicada', -9.42, -7.82, 1.65], ['cicada', -10.45, -7.67, 2.05],
  ['cicada', -10.17, -8.57, 1.4], ['cicada', -9.75, -7.48, 2.7],
  ['butterfly', -7, 15, 1.2]
];

export function createInsects(heightAt = () => 0) {
  const items = [];
  let time = 0;
  let held = null;
  let catches = 0;
  let previousPlayer = null;
  let caughtFrom = null;
  const eye = p => ({ x: p.x, y: Number.isFinite(p.y) ? p.y : heightAt(p.x, p.z) + 1.65, z: p.z });
  function reset() {
    time = 0; held = null; catches = 0; previousPlayer = null; caughtFrom = null; items.length = 0;
    homes.forEach(([species, x, z, altitude], index) => {
      const y = heightAt(x, z) + altitude;
      items.push({ id: `insect-${index + 1}`, species, x, y, z, home: { x, y, z },
        heading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        state: 'resting', resting: true, caught: false, phase: index * 1.837,
        wingPhase: index * 1.837, flightBlend: 0, fleeUntil: 0, releaseUntil: 0,
        fleeX: x, fleeZ: z, age: 0, beginner: index === 0,
        homeHeading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        alert: 0, nextScareAt: 0, settleUntil: 0, departures: 0, excursion: null });
    });
  }
  reset();

  const flightStyle = {
    butterfly: { duration: 6.6, reach: 3.0, lift: .85, flutter: .22, frequency: 4.6 },
    dragonfly: { duration: 5.2, reach: 3.7, lift: .55, flutter: .055, frequency: 2.4 },
    cicada: { duration: 6.0, reach: 3.2, lift: .95, flutter: .035, frequency: 3.1 }
  };
  const finitePlayer = p => p && Number.isFinite(p.x) && Number.isFinite(p.z) ? eye(p) : null;
  function boundedControl(item, point) {
    // Excursions remain local, even if the insect was caught while already flying.
    const dx = point.x - item.home.x, dz = point.z - item.home.z, distance = Math.hypot(dx, dz);
    const scale = distance > 5.5 ? 5.5 / distance : 1;
    return { x: clamp(item.home.x + dx * scale, -75, 75), y: point.y, z: clamp(item.home.z + dz * scale, -75, 75) };
  }
  function depart(item, reason, player) {
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
    const c1 = boundedControl(item, { x: start.x + dx * reach * 1.35, y: Math.max(start.y, item.home.y) + style.lift, z: start.z + dz * reach * 1.35 });
    const c2 = boundedControl(item, { x: item.home.x + dx * reach * 1.1 + sideX * turn * .65, y: item.home.y + style.lift * 1.15, z: item.home.z + dz * reach * 1.1 + sideZ * turn * .65 });
    item.excursion = { reason, startedAt: time, duration, start, c1, c2, sideX, sideZ, turn };
    item.state = reason; item.resting = false; item.alert = 0;
    item.nextScareAt = time + (reason === 'released' ? .85 : 2.0);
    item.fleeUntil = reason === 'startled' ? time + duration : 0;
    // This is a flight deadline, not immunity and not a stationary seven-second hold.
    item.releaseUntil = reason === 'released' ? time + duration : 0;
    item.fleeX = c1.x; item.fleeZ = c1.z;
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
    let radius = quiet ? ({butterfly:.82,dragonfly:.94,cicada:1.02}[kind]) :
      speed > 4 ? ({butterfly:2.65,dragonfly:3.0,cicada:3.25}[kind]) :
      ({butterfly:1.65,dragonfly:1.95,cicada:2.1}[kind]);
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
    for (const item of items) {
      item.age += dt;
      item.wingPhase += dt * (item.species === 'butterfly' ? 12 : 70);
      if (item.caught) continue;
      const rate = alertRate(item, player, p, dt);
      item.alert = clamp(item.alert + dt * (rate || -3), 0, 1.2);
      if (rate && item.alert >= 1 && time >= item.nextScareAt) depart(item, 'startled', player);
      let tx = item.home.x, ty = item.home.y, tz = item.home.z;
      let resting = true, flightStrength = 0, landing = false;
      if (item.excursion) {
        const route = item.excursion, u = clamp((time - route.startedAt) / route.duration, 0, 1);
        if (u < 1) {
          const v = 1 - u, style = flightStyle[item.species];
          tx = v*v*v*route.start.x + 3*v*v*u*route.c1.x + 3*v*u*u*route.c2.x + u*u*u*item.home.x;
          ty = v*v*v*route.start.y + 3*v*v*u*route.c1.y + 3*v*u*u*route.c2.y + u*u*u*item.home.y;
          tz = v*v*v*route.start.z + 3*v*v*u*route.c1.z + 3*v*u*u*route.c2.z + u*u*u*item.home.z;
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
      if (!item.excursion) {
        const settling = time < item.settleUntil;
        const homeDistance = Math.hypot(item.x-item.home.x,item.y-item.home.y,item.z-item.home.z);
        if (settling && homeDistance > .055) {
          resting = false; landing = true; item.state = 'landing'; flightStrength = clamp(homeDistance/.55, 0, .5);
        } else if (!settling && item.species !== 'cicada') {
          // Ordinary unprovoked perch / loop timing stays the same as v0.1.5.
          const period = item.species === 'butterfly' ? 17 : 15;
          const cycle = (time + (item.beginner ? 0 : item.phase * 2)) % period;
          const restTime = item.species === 'butterfly' ? 11 : 9;
          if (cycle > restTime) {
            resting = false;
            const u = (cycle - restTime) / (period - restTime), envelope = Math.sin(u * Math.PI);
            const radius = item.species === 'butterfly' ? 1.35 : 2.2;
            tx += Math.cos(u * TAU + item.phase) * radius * envelope;
            tz += Math.sin(u * TAU + item.phase) * radius * envelope;
            ty += envelope * (.35 + .14 * Math.sin(u * TAU * 2));
          }
          item.state = resting ? 'resting' : 'flying'; flightStrength = resting ? 0 : 1;
        } else item.state = 'resting';
      }
      if (resting && item.species === 'butterfly') ty += Math.sin(time * 1.8 + item.phase) * .018;
      const smoothing = 1 - Math.exp(-dt * (item.state === 'startled' ? 3.2 : 5));
      const dx = tx - item.x, dz = tz - item.z;
      let targetHeading = null;
      if (item.species === 'cicada' && (resting || landing)) targetHeading = item.homeHeading;
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
    return list.length ? describe(list[0]) : null;
  }
  function swing(player, direction) {
    if (held) return { ok: false, reason: '観察した虫を、先に逃がしてあげよう' };
    const list = candidates(player, direction).filter(c => c.distance <= 2.6 && c.dot >= .82);
    list.sort((a,b) => (1-a.dot)*8+a.distance - ((1-b.dot)*8+b.distance));
    if (!list.length) {
      const target = findTarget(player, direction);
      return { ok: false, reason: target ? target.reason : '空振り。虫に向かって、もう少し近くで' };
    }
    held = list[0].item; held.caught = true; held.state = 'caught'; caughtFrom = eye(player); catches++;
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

  return { items, update, findTarget, swing, release, reset, get caught() { return held; }, get time() { return time; }, get catches() { return catches; } };
}
