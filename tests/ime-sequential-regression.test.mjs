/**
 * Durable sequential regression for the exact IME-fixed input.js bytes.
 * Run: node --test tests/ime-sequential-regression.test.mjs
 * Synthetic Node events only: no browser, journal UI, or physical OS IME claim.
 * Each test keeps one createInput instance through its entire event sequence.
 */
import test from 'node:test';
import assert from 'node:assert/strict';
import { createInput } from '../src/input.js';

function fixture(t, initial = 'playing') {
  const document = new EventTarget(), window = new EventTarget(), canvas = new EventTarget();
  for (const [key, value] of Object.entries({ document, window, navigator: { getGamepads: () => [] } })) {
    const previous = Object.getOwnPropertyDescriptor(globalThis, key);
    Object.defineProperty(globalThis, key, { configurable: true, value });
    t.after(() => previous ? Object.defineProperty(globalThis, key, previous) : delete globalThis[key]);
  }
  let mode = initial;
  const calls = { action: 0, pause: [], blur: 0 };
  const input = createInput(canvas, {
    mode: () => mode,
    action: () => calls.action++,
    pause: options => calls.pause.push(options),
    blur: () => calls.blur++,
    journal() {}, back() {}, lock() {},
  });
  function emit(target, type, props = {}) {
    const event = new Event(type, { cancelable: true });
    for (const [key, value] of Object.entries(props)) Object.defineProperty(event, key, { value });
    target.dispatchEvent(event);
    return event;
  }
  return {
    calls, input,
    key: (code, props = {}) => emit(document, 'keydown', { code, repeat: false, isComposing: false, ...props }),
    up: code => emit(document, 'keyup', { code }),
    blur: () => emit(window, 'blur'),
    mode: value => { mode = value; },
    read: () => input.read(1 / 60),
  };
}

function movement(f, z, run) {
  const state = f.read();
  assert.equal(state.z, z, 'forward movement continuity');
  assert.equal(state.run, run, 'run continuity');
}

// Existing tests cover individual guards and journal DOM; this file is portable
// into the source-only fixed Git candidate, and exercises state across recovery.
test('1 composing Escape then ordinary Escape preserves then clears held movement', t => {
  const f = fixture(t);
  f.key('KeyW'); f.key('ShiftLeft');
  assert.equal(f.key('Escape', { isComposing: true }).defaultPrevented, false);
  assert.deepEqual(f.calls.pause, []); movement(f, 1, true);
  assert.equal(f.key('Escape').defaultPrevented, true);
  assert.deepEqual(f.calls.pause, [{ lock: false }]); movement(f, 0, false);
});

test('2 keyCode 229 protects both keys even with explicit isComposing false, then resumes', t => {
  const f = fixture(t);
  for (const code of ['Escape', 'Space']) {
    assert.equal(f.key(code, { keyCode: 229, isComposing: false }).defaultPrevented, false);
  }
  assert.deepEqual(f.calls.pause, []); assert.equal(f.calls.action, 0);
  assert.equal(f.key('Space', { keyCode: 32 }).defaultPrevented, true);
  assert.equal(f.key('Escape', { keyCode: 27 }).defaultPrevented, true);
  assert.equal(f.calls.action, 1); assert.deepEqual(f.calls.pause, [{ lock: false }]);
});

test('3 Shift Space during running keeps movement and ordinary action available', t => {
  const f = fixture(t);
  f.key('KeyW'); f.key('ShiftLeft'); movement(f, 1, true);
  assert.equal(f.key('Space', { shiftKey: true }).defaultPrevented, true);
  assert.equal(f.calls.action, 1); movement(f, 1, true);
  f.up('Space'); f.up('ShiftLeft'); movement(f, 1, false);
  f.key('Space'); assert.equal(f.calls.action, 2);
  f.up('KeyW'); movement(f, 0, false);
});

test('4 Ctrl Alt Meta Space remain native on the same running instance, then normal Space works', t => {
  const f = fixture(t);
  f.key('KeyW'); f.key('ShiftRight');
  for (const modifier of ['ctrlKey', 'altKey', 'metaKey']) {
    assert.equal(f.key('Space', { [modifier]: true, shiftKey: true }).defaultPrevented, false);
    assert.equal(f.calls.action, 0); movement(f, 1, true); f.up('Space');
  }
  f.up('ShiftRight');
  assert.equal(f.key('Space').defaultPrevented, true);
  assert.equal(f.calls.action, 1); movement(f, 1, false);
});

test('5 repeats do not retrigger actions or re-arm movement after clear', t => {
  const f = fixture(t);
  f.key('KeyW'); f.key('Space');
  assert.equal(f.key('Space', { repeat: true }).defaultPrevented, true);
  f.key('Escape');
  assert.equal(f.key('Escape', { repeat: true }).defaultPrevented, true);
  f.key('KeyW', { repeat: true }); movement(f, 0, false);
  assert.equal(f.calls.action, 1); assert.deepEqual(f.calls.pause, [{ lock: false }]);
  f.up('KeyW'); f.key('KeyW'); f.up('Space'); f.key('Space');
  movement(f, 1, false); assert.equal(f.calls.action, 2);
});

test('6 blur recovery combines composing input, held repeats, shortcuts and mode continuity', t => {
  const f = fixture(t);
  f.key('KeyW'); f.key('ShiftLeft');
  assert.equal(f.key('Space', { isComposing: true }).defaultPrevented, false);
  f.blur(); assert.equal(f.calls.blur, 1); movement(f, 0, false);
  f.mode('paused');
  assert.equal(f.key('Space', { ctrlKey: true }).defaultPrevented, false);
  f.mode('playing');
  f.key('KeyW', { repeat: true }); f.key('ShiftLeft', { repeat: true });
  f.key('Space', { repeat: true }); movement(f, 0, false);
  assert.equal(f.calls.action, 0);
  f.up('KeyW'); f.up('ShiftLeft'); f.up('Space');
  f.key('KeyW'); f.key('ShiftLeft'); f.key('Space', { shiftKey: true });
  movement(f, 1, true); assert.equal(f.calls.action, 1);
});

test('7 composing Space then normal Space resumes without clearing held movement', t => {
  const f = fixture(t);
  f.key('KeyW');
  for (const repeat of [false, true]) {
    assert.equal(f.key('Space', { isComposing: true, repeat }).defaultPrevented, false);
    assert.equal(f.calls.action, 0); movement(f, 1, false);
  }
  f.up('Space'); assert.equal(f.key('Space').defaultPrevented, true);
  assert.equal(f.calls.action, 1); movement(f, 1, false);
});

test('8 mode transitions clear stale movement without losing subsequent IME/modifier guards', t => {
  const f = fixture(t);
  f.key('KeyW'); f.key('ShiftLeft'); movement(f, 1, true);
  for (const mode of ['journal', 'paused', 'inspect']) {
    f.mode(mode);
    assert.equal(f.key('Escape', { isComposing: true }).defaultPrevented, false);
    assert.equal(f.key('Space', { metaKey: true }).defaultPrevented, false);
    movement(f, 0, false);
    assert.deepEqual(f.calls.pause, []); assert.equal(f.calls.action, 0);
  }
  f.mode('playing'); f.key('KeyW', { repeat: true }); movement(f, 0, false);
  f.up('KeyW'); f.key('KeyW');
  f.key('Space'); movement(f, 1, false); assert.equal(f.calls.action, 1);
  f.key('Escape'); movement(f, 0, false); assert.deepEqual(f.calls.pause, [{ lock: false }]);
});
