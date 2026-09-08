import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
// Independent model-based generator. This tool contains no reference implementation import.
// Its model family is declared; only specification values determine behavioral constants.
const spec = JSON.parse(
  await readFile(path.join(process.argv[2], "specification.json")),
);
const output = process.argv[3];
for (const k of [
  "movementRate",
  "mouseRadiansPerPixel",
  "jumpImpulse",
  "gravity",
])
  if (!Number.isFinite(spec.parameters[k]) || spec.parameters[k] <= 0)
    throw new Error(`Invalid inferred ${k}`);
const source = `const settings=${JSON.stringify(spec.parameters)};
const world=${JSON.stringify(spec.requirements)};
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
requestAnimationFrame(tick);surface.dataset.ready='true';`;
await writeFile(path.join(output, "game.mjs"), source);
await writeFile(
  path.join(output, "requirements.json"),
  JSON.stringify(spec.requirements, null, 2),
);
await writeFile(
  path.join(output, "index.html"),
  '<!doctype html><html lang="en"><meta charset="utf-8"><title>Gameparse reconstruction</title><style>body{margin:0;background:#182b30;overflow:hidden;color:white;font:14px system-ui}aside{position:fixed;top:20px;left:24px;pointer-events:none}</style><canvas width="1280" height="720"></canvas><aside>Reconstruction · Drag to aim · WASD move · Space jump · R reset</aside><script type="module" src="game.mjs"></script></html>',
);
await writeFile(
  path.join(output, "implementation-map.json"),
  JSON.stringify(
    {
      claims: spec.claims.map((c) => ({
        specificationId: c.id,
        implementation: "game.mjs",
      })),
      generatorAdditions: [
        "background/grid/crosshair styling",
        "pitch clamp ±1 rad",
        "repeat jumping while held",
        "flat ground, no collision geometry",
      ],
      modelFamily:
        "Constant-rate movement, relative mouse rotation, ballistic jump; not arbitrary game synthesis",
    },
    null,
    2,
  ),
);
