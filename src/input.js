/** Physical input is mapped to actions here, outside gameplay state. */
export function createInput(canvas, callbacks) {
  const keys = new Set();
  let lookX = 0, lookY = 0, drag = false, lastX = 0, lastY = 0;
  let mouseQuiet = false, padLast = [], padActive = false, clearVersion = 0;
  let mode = callbacks.mode();
  const blockedPadModifiers = new Set();
  const movement = new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight']);
  const controls = new Set([...movement, 'Space', 'KeyJ']);
  const elementIsControl = e => /^(INPUT|BUTTON|TEXTAREA|SELECT)$/.test(e.target?.tagName || '') || e.target?.isContentEditable;
  const currentPad = () => Array.from(navigator.getGamepads?.() || []).find(p => p?.connected);
  const buttons = pad => pad?.buttons.map(b => !!b.pressed) || [];
  const dead = v => Math.abs(v) < .16 ? 0 : Math.sign(v) * (Math.abs(v) - .16) / .84;

  function clear() {
    keys.clear(); lookX = lookY = 0; drag = false; mouseQuiet = false;
    clearVersion++;
    // A held shoulder button must be released after leaving/resuming a mode.
    // Sample now: modifiers already released at clear are ready for a new press.
    const b = buttons(currentPad());
    blockedPadModifiers.clear();
    for (const index of [4, 5]) if (b[index]) blockedPadModifiers.add(index);
    padLast = b;
  }
  function syncMode() {
    const next = callbacks.mode();
    if (next !== mode) { mode = next; clear(); }
    return mode;
  }
  document.addEventListener('keydown', e => {
    syncMode();
    if (e.code === 'Escape') {
      e.preventDefault();
      if (!e.repeat) { clear(); callbacks.pause({ lock: false }); }
      return;
    }
    if (elementIsControl(e)) return;
    if (controls.has(e.code)) e.preventDefault();
    if (e.repeat) return; // Held keys cannot re-arm themselves after clear/blur.
    if (e.code === 'Space') callbacks.action();
    if (e.code === 'KeyJ') callbacks.journal?.();
    if (movement.has(e.code) && syncMode() === 'playing') keys.add(e.code);
  });
  document.addEventListener('keyup', e => keys.delete(e.code));
  window.addEventListener('blur', () => { clear(); callbacks.blur(); });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { clear(); callbacks.blur(); }
  });
  canvas.addEventListener('mousedown', e => {
    const currentMode = syncMode();
    if (e.button === 2) {
      if (currentMode === 'playing') mouseQuiet = true;
      return;
    }
    if (e.button !== 0) return;
    if (currentMode === 'inspect') { drag = true; lastX = e.clientX; lastY = e.clientY; return; }
    if (currentMode !== 'playing') return;
    if (document.pointerLockElement === canvas) callbacks.action();
    else { drag = true; lastX = e.clientX; lastY = e.clientY; callbacks.lock(); }
  });
  document.addEventListener('mouseup', e => {
    if (e.button === 2) mouseQuiet = false;
    if (e.button === 0) drag = false;
  });
  document.addEventListener('mousemove', e => {
    const currentMode = syncMode();
    if (currentMode !== 'playing' && currentMode !== 'inspect') return;
    if (document.pointerLockElement === canvas) { lookX += e.movementX; lookY += e.movementY; }
    else if (drag) { lookX += e.clientX - lastX; lookY += e.clientY - lastY; lastX = e.clientX; lastY = e.clientY; }
  });
  canvas.addEventListener('contextmenu', e => {
    if (syncMode() === 'playing') e.preventDefault();
  });
  return {
    clear,
    read(dt) {
      syncMode();
      const version = clearVersion;
      let x = (keys.has('KeyD') || keys.has('ArrowRight') ? 1 : 0) - (keys.has('KeyA') || keys.has('ArrowLeft') ? 1 : 0);
      let z = (keys.has('KeyW') || keys.has('ArrowUp') ? 1 : 0) - (keys.has('KeyS') || keys.has('ArrowDown') ? 1 : 0);
      let quiet = mouseQuiet;
      let run = keys.has('ShiftLeft') || keys.has('ShiftRight');
      let yaw = lookX, pitch = lookY;
      lookX = lookY = 0;
      const pad = currentPad();
      if (pad) {
        x += dead(pad.axes[0] || 0); z -= dead(pad.axes[1] || 0);
        yaw += dead(pad.axes[2] || 0) * dt * 800; pitch += dead(pad.axes[3] || 0) * dt * 650;
        const b = buttons(pad), previous = padLast;
        for (const index of [4, 5]) if (!b[index]) blockedPadModifiers.delete(index);
        quiet = quiet || (!!b[4] && !blockedPadModifiers.has(4));
        run = run || (!!b[5] && !blockedPadModifiers.has(5));
        // A callback can clear input/change mode. Do not carry another action
        // or pre-clear movement into the new mode during the same frame.
        if ((b[0] && !previous[0]) || (b[7] && !previous[7])) callbacks.action();
        if (version === clearVersion && b[9] && !previous[9]) callbacks.pause();
        if (version === clearVersion && b[8] && !previous[8]) callbacks.journal?.();
        if (version === clearVersion && b[1] && !previous[1]) callbacks.back();
        padLast = b; padActive = true;
      } else { padLast = []; padActive = false; }
      const currentMode = syncMode();
      if (version !== clearVersion) x = z = yaw = pitch = 0;
      if (version !== clearVersion || currentMode !== 'playing') { x = z = 0; quiet = run = false; }
      if (currentMode !== 'playing' && currentMode !== 'inspect') yaw = pitch = 0;
      const mag = Math.hypot(x, z); if (mag > 1) { x /= mag; z /= mag; }
      return { x, z, quiet, run: run && !quiet, yaw, pitch, gamepad: padActive };
    }
  };
}
