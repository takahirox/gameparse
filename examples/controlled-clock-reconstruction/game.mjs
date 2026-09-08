const settings={"movementRate":3.246528518098055,"mouseRadiansPerPixel":0.002440657748335767,"jumpImpulse":5.358457889945452,"gravity":10.791179402128584};
const world={"condition":"controlled-clock-image-only-v1","viewport":{"width":1280,"height":720},"camera":{"height":1.6,"focalPixels":620,"initialPosition":[0,1.6,0],"initialYaw":0,"initialPitch":0},"landmarks":[{"id":"cyan","position":[-4,1,16],"rgb":[0,255,255]},{"id":"magenta","position":[4,2.8,18],"rgb":[255,0,255]},{"id":"yellow","position":[0,4,22],"rgb":[255,255,0]},{"id":"orange","position":[-2,5,20],"rgb":[255,128,0]}],"controls":{"forward":"w","backward":"s","left":"a","right":"d","jump":"Space","reset":"r","aim":"drag with left mouse button; optional double-click pointer lock for manual play"},"suppliedFacts":["viewport","camera projection and initial pose","landmark geometry and colors","control bindings","flat ground"],"unknowns":["movement rate","mouse response","jump impulse","vertical acceleration","simultaneous-input normalization","unobserved actions"]};
const surface=document.querySelector('canvas'),paint=surface.getContext('2d');
const held=new Set();let position,heading,elevation,flight,elapsed,last;
function restart(){position=[0,world.camera.height,0];heading=elevation=0;flight=null;elapsed=0;held.clear();}
restart();
window.onkeydown=e=>{if(e.code==='Space')e.preventDefault();if(e.code==='KeyR')restart();else held.add(e.code);};
window.onkeyup=e=>held.delete(e.code);window.onblur=()=>held.clear();
surface.ondblclick=()=>surface.requestPointerLock().catch(()=>{});
window.onmousemove=e=>{if(document.pointerLockElement===surface||(e.buttons&1)){heading+=e.movementX*settings.mouseRadiansPerPixel;elevation=Math.max(-1,Math.min(1,elevation+e.movementY*settings.mouseRadiansPerPixel));}};
function screen(point){const relative=point.map((p,i)=>p-position[i]);
 const side=relative[0]*Math.cos(heading)-relative[2]*Math.sin(heading),depth=relative[0]*Math.sin(heading)+relative[2]*Math.cos(heading);
 const up=relative[1]*Math.cos(elevation)+depth*Math.sin(elevation),distance=depth*Math.cos(elevation)-relative[1]*Math.sin(elevation);
 return distance>.1?[640+world.camera.focalPixels*side/distance,360-world.camera.focalPixels*up/distance]:null;}
function tick(time){const seconds=last===undefined?0:Math.min((time-last)/1000,.05);last=time;
 let dx=Number(held.has('KeyD'))-Number(held.has('KeyA')),dz=Number(held.has('KeyW'))-Number(held.has('KeyS'));
 const norm=Math.hypot(dx,dz)||1;dx/=norm;dz/=norm;
 position[0]+=settings.movementRate*seconds*(dx*Math.cos(heading)+dz*Math.sin(heading));
 position[2]+=settings.movementRate*seconds*(dz*Math.cos(heading)-dx*Math.sin(heading));
 if(flight===null&&held.has('Space')){flight=0;}
 if(flight!==null){flight+=seconds;position[1]=world.camera.height+settings.jumpImpulse*flight-settings.gravity*flight*flight/2;
  if(position[1]<=world.camera.height){position[1]=world.camera.height;flight=null;}}
 paint.fillStyle='#182b30';paint.fillRect(0,0,1280,720);
 for(let z=2;z<=40;z+=2){const a=screen([-20,0,z]),b=screen([20,0,z]);if(a&&b){paint.strokeStyle='#345252';paint.beginPath();paint.moveTo(...a);paint.lineTo(...b);paint.stroke();}}
 for(const mark of world.landmarks){const p=screen(mark.position);if(p){paint.fillStyle='rgb('+mark.rgb.join(',')+')';paint.fillRect(Math.round(p[0])-5,Math.round(p[1])-5,10,10);}}
 paint.strokeStyle='#e1f1e8';paint.beginPath();paint.moveTo(634,360);paint.lineTo(646,360);paint.moveTo(640,354);paint.lineTo(640,366);paint.stroke();requestAnimationFrame(tick);}
requestAnimationFrame(tick);surface.dataset.ready='true';