/** Pure, deterministic insect simulation. All coordinates are metres; y is absolute. */
export const SPECIES = Object.freeze({
  butterfly: { name: 'モンシロチョウ', label: 'モンシロチョウ', size: '見やすさのため、翅を広げた姿を約32cmで表現', observation: '白い翅の先に黒い模様。花のまわりをゆっくり飛び、蜜を吸うときは同じ場所にとまります。翅の開き方にも注目してみましょう。', hint: '草花の上でひと休み。ゆっくり近づくと観察できます。', color: '#f5efd5' },
  dragonfly: { name: 'アキアカネ', label: 'アキアカネ', size: '見やすさのため、翅を広げた姿を約40cmで表現', observation: '赤みのある細長い腹と、透きとおる四枚の翅。枝先などにとまると翅を横に開きます。飛び立ったあと、近くのとまり場所に戻ることもあります。', hint: '池のほとりの草先を探して。とまった瞬間がねらい目です。', color: '#b95136' },
  cicada: { name: 'アブラゼミ', label: 'アブラゼミ', size: '見やすさのため、体と翅を約23cmで表現', observation: '茶色の翅を屋根のように重ねて、木の幹にとまっています。木肌に似た色なので、輪郭や大きな目を手がかりに探してみましょう。', hint: '大きな木の幹に注目。足音をひそめると逃げにくくなります。', color: '#8b6244' }
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
  const eye = p => ({ x: p.x, y: Number.isFinite(p.y) ? p.y : heightAt(p.x, p.z) + 1.65, z: p.z });
  function reset() {
    time = 0; held = null; catches = 0; items.length = 0;
    homes.forEach(([species, x, z, altitude], index) => {
      const y = heightAt(x, z) + altitude;
      items.push({ id: `insect-${index + 1}`, species, x, y, z, home: { x, y, z },
        heading: species === 'cicada' ? Math.atan2(x + 10, z + 8) + Math.PI : index * 2.399,
        state: 'resting', resting: true, caught: false, phase: index * 1.837,
        wingPhase: index * 1.837, flightBlend: 0, fleeUntil: 0, releaseUntil: 0,
        fleeX: x, fleeZ: z, age: 0, beginner: index === 0 });
    });
  }
  reset();

  function update(dt, player) {
    dt = clamp(Number.isFinite(dt) ? dt : 0, 0, .1);
    time += dt;
    for (const item of items) {
      item.age += dt;
      item.wingPhase += dt * (item.species === 'butterfly' ? 12 : 70);
      if (item.caught) continue;
      const p = player ? eye(player) : null;
      const near = p ? Math.hypot(item.x - p.x, item.z - p.z) : Infinity;
      // Quiet walking never forces an escape: this is an observation game, not a reflex test.
      const noisy = player && !player.quiet && (player.speed || 0) > 2.5;
      const scareDistance = item.species === 'cicada' ? 3.1 : item.species === 'dragonfly' ? 2.8 : 1.8;
      if (noisy && near < scareDistance && time > item.fleeUntil + 3 && time > item.releaseUntil && !item.beginner) {
        item.fleeUntil = time + (item.species === 'cicada' ? 3.4 : 2.6);
        const dx = item.x - p.x, dz = item.z - p.z;
        const len = Math.hypot(dx, dz) || 1;
        item.fleeX = clamp(item.home.x + dx / len * 2.4, -75, 75);
        item.fleeZ = clamp(item.home.z + dz / len * 2.4, -75, 75);
      }
      let tx = item.home.x, ty = item.home.y, tz = item.home.z;
      let resting = true;
      if (time < item.fleeUntil) {
        item.state = 'startled'; resting = false;
        tx = item.fleeX; tz = item.fleeZ;
        ty = Math.max(item.home.y + .65, heightAt(tx, tz) + 1.8);
      } else if (item.species !== 'cicada' && time > item.releaseUntil) {
        const period = item.species === 'butterfly' ? 17 : 15;
        const cycle = (time + (item.beginner ? 0 : item.phase * 2)) % period;
        const restTime = item.species === 'butterfly' ? 11 : 9;
        // A complete, smooth out-and-back route always ends at the same perch.
        if (cycle > restTime) {
          resting = false;
          const u = (cycle - restTime) / (period - restTime);
          const envelope = Math.sin(u * Math.PI);
          const radius = item.species === 'butterfly' ? 1.35 : 2.2;
          tx += Math.cos(u * TAU + item.phase) * radius * envelope;
          tz += Math.sin(u * TAU + item.phase) * radius * envelope;
          ty += envelope * (.35 + .14 * Math.sin(u * TAU * 2));
        }
        item.state = resting ? 'resting' : 'flying';
      } else item.state = 'resting';
      if (resting && item.species === 'butterfly') ty += Math.sin(time * 1.8 + item.phase) * .018;
      const smoothing = 1 - Math.exp(-dt * (item.state === 'startled' ? 3.2 : 5));
      const dx = tx - item.x, dz = tz - item.z;
      if (!resting && Math.hypot(dx, dz) > .015) {
        const targetHeading = Math.atan2(dx, dz);
        const delta = Math.atan2(Math.sin(targetHeading - item.heading), Math.cos(targetHeading - item.heading));
        item.heading += delta * (1 - Math.exp(-dt * 4));
      }
      item.x += dx * smoothing; item.y += (ty - item.y) * smoothing; item.z += dz * smoothing;
      item.resting = resting;
      item.flightBlend += ((resting ? 0 : 1) - item.flightBlend) * Math.min(1, dt * 8);
    }
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
    held = list[0].item; held.caught = true; held.state = 'caught'; catches++;
    return { ok: true, item: held };
  }
  function release() {
    if (!held) return null;
    const item = held;
    item.caught = false; item.state = 'resting'; item.resting = true;
    item.x = item.home.x; item.y = item.home.y; item.z = item.home.z;
    item.releaseUntil = time + 7; item.fleeUntil = 0; item.flightBlend = 0;
    held = null;
    return item;
  }
  return { items, update, findTarget, swing, release, reset, get caught() { return held; }, get time() { return time; }, get catches() { return catches; } };
}
