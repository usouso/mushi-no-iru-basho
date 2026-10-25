/** Physical input is mapped to actions here, outside gameplay state. */
export function createInput(canvas, callbacks) {
  const keys=new Set();
  let lookX=0,lookY=0,drag=false,lastX=0,lastY=0,padLast=[],padActive=false;
  const controls=new Set(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowLeft','ArrowDown','ArrowRight','ShiftLeft','ShiftRight','Space']);
  const elementIsControl=e=>/INPUT|BUTTON|TEXTAREA|SELECT/.test(e.target?.tagName||'');
  document.addEventListener('keydown',e=>{
    if(e.code==='Escape'){ e.preventDefault(); if(!e.repeat) callbacks.pause(); return; }
    if(elementIsControl(e)) return;
    if(controls.has(e.code)) e.preventDefault();
    if(e.code==='Space'&&!e.repeat) callbacks.action();
    keys.add(e.code);
  });
  document.addEventListener('keyup',e=>keys.delete(e.code));
  window.addEventListener('blur',()=>{ keys.clear();drag=false;callbacks.blur(); });
  document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();callbacks.blur();}});
  canvas.addEventListener('mousedown',e=>{
    if(e.button!==0) return;
    if(callbacks.mode()==='inspect'){drag=true;lastX=e.clientX;lastY=e.clientY;return;}
    if(callbacks.mode()!=='playing')return;
    if(document.pointerLockElement===canvas){callbacks.action();}
    else {drag=true;lastX=e.clientX;lastY=e.clientY;callbacks.lock();}
  });
  document.addEventListener('mouseup',()=>drag=false);
  document.addEventListener('mousemove',e=>{
    if(document.pointerLockElement===canvas){lookX+=e.movementX;lookY+=e.movementY;}
    else if(drag){lookX+=e.clientX-lastX;lookY+=e.clientY-lastY;lastX=e.clientX;lastY=e.clientY;}
  });
  canvas.addEventListener('contextmenu',e=>e.preventDefault());
  const dead=v=>Math.abs(v)<.16?0:Math.sign(v)*(Math.abs(v)-.16)/.84;
  return {
    clear(){keys.clear();lookX=lookY=0;drag=false;},
    read(dt){
      let x=(keys.has('KeyD')||keys.has('ArrowRight')?1:0)-(keys.has('KeyA')||keys.has('ArrowLeft')?1:0);
      let z=(keys.has('KeyW')||keys.has('ArrowUp')?1:0)-(keys.has('KeyS')||keys.has('ArrowDown')?1:0);
      let quiet=keys.has('ShiftLeft')||keys.has('ShiftRight');
      let yaw=lookX,pitch=lookY;
      lookX=lookY=0;
      const pads=navigator.getGamepads?.()||[];
      const pad=Array.from(pads).find(p=>p?.connected);
      if(pad){
        x+=dead(pad.axes[0]||0);z-=dead(pad.axes[1]||0);
        yaw+=dead(pad.axes[2]||0)*dt*800;pitch+=dead(pad.axes[3]||0)*dt*650;
        quiet=quiet||!!pad.buttons[4]?.pressed;
        const b=pad.buttons.map(b=>b.pressed);
        if((b[0]&&!padLast[0])||(b[7]&&!padLast[7]))callbacks.action();
        if(b[9]&&!padLast[9])callbacks.pause();
        if(b[1]&&!padLast[1])callbacks.back();
        padLast=b;padActive=true;
      }else {padLast=[];padActive=false;}
      const mag=Math.hypot(x,z);if(mag>1){x/=mag;z/=mag;}
      return {x,z,quiet,yaw,pitch,gamepad:padActive};
    }
  };
}
