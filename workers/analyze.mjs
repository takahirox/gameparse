import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { landmarks, poseFromPixels, leastSquares } from './vision.mjs';
const input=process.argv[2],output=process.argv[3];
const req=JSON.parse(await readFile(path.join(input,'requirements.json')));
const index=JSON.parse(await readFile(path.join(input,'index.json')));
const measurements=[];
for(const trial of index.trials){
  const recording=JSON.parse(await readFile(path.join(input,trial,'recording.json')));
  let previous=[...req.camera.initialPosition,0,0];const samples=[];
  for(const frame of recording.frames){const points=await landmarks(path.join(input,trial,frame.file),req);const fit=poseFromPixels(points,req,previous);previous=fit.pose;samples.push({time:frame.time,...fit,frame:frame.file,sha256:frame.sha256});}
  measurements.push({trial,scenario:recording.scenario,samples});
}
const mean=values=>values.reduce((a,b)=>a+b,0)/values.length;
const rates=[], sensitivities=[], impulses=[], gravities=[];
for(const m of measurements){
  const events=m.scenario.events;
  if(m.scenario.behavior==='movement'){
    const start=events.find(e=>e.type==='down').at,end=events.find(e=>e.type==='up').at;
    const samples=m.samples.filter(p=>p.time>=start&&p.time<=end);
    const first=samples[0],last=samples.at(-1);
    rates.push(Math.hypot(last.pose[0]-first.pose[0],last.pose[2]-first.pose[2])/((last.time-first.time)/1000));
  }
  if(m.scenario.behavior==='aiming'){
    const e=events.find(e=>e.type==='mouse');
    const before=m.samples.findLast(s=>s.time<e.at),after=m.samples.find(s=>s.time>=e.at+32);
    if(e.dx)sensitivities.push((after.pose[3]-before.pose[3])/e.dx);
    if(e.dy)sensitivities.push((after.pose[4]-before.pose[4])/e.dy);
  }
  if(m.scenario.behavior==='jumping'){
    const start=events[0].at;
    const airborne=m.samples.filter(p=>p.time>start&&p.pose[1]>req.camera.height+.08);
    const rows=airborne.map(p=>{const t=(p.time-start)/1000;return [1,t,t*t];});
    const fit=leastSquares(rows,airborne.map(p=>p.pose[1]-req.camera.height));
    impulses.push(fit[1]);gravities.push(-2*fit[2]);
  }
}
for(const values of [rates,sensitivities,impulses,gravities])if(!values.length||!values.every(v=>Number.isFinite(v)&&v>0))throw new Error('Insufficient evidence for required behavior');
const parameters={movementRate:mean(rates),mouseRadiansPerPixel:mean(sensitivities),jumpImpulse:mean(impulses),gravity:mean(gravities)};
const claims=Object.entries(parameters).map(([name,value])=>({id:name,category:'inference',value,units:name==='movementRate'?'supplied-scene units/s':name==='mouseRadiansPerPixel'?'rad/input pixel':name==='gravity'?'supplied-scene units/s²':'supplied-scene units/s',evidence:measurements.filter(m=>m.scenario.behavior===(name==='movementRate'?'movement':name==='mouseRadiansPerPixel'?'aiming':'jumping')).map(m=>m.trial),method:name==='movementRate'?'Endpoint displacement over held-input interval':name==='mouseRadiansPerPixel'?'Fitted view rotation divided by recorded relative mouse input':'Quadratic least-squares fit to image-estimated vertical displacement',conditions:'Known supplied camera/landmark geometry; controlled browser clock; local flat scene',limitations:'Model family is an analyzer hypothesis; pixel quantization and pose fit introduce uncertainty; no claims about unseen mechanics'}));
const diagonal=measurements.find(m=>m.scenario.events.filter(e=>e.type==='down').length===2);
if(!diagonal||Math.max(...rates)-Math.min(...rates)>.1*parameters.movementRate)throw new Error('Constant-rate normalized movement hypothesis not supported');
claims.push({id:'diagonalNormalization',category:'inference',value:true,evidence:[diagonal.trial,...measurements.filter(m=>m.scenario.behavior==='movement').map(m=>m.trial)],method:'Compare diagonal and single-axis image-estimated displacement rates; require spread within 10%',conditions:'Observed planar directions and durations',limitations:'Does not establish arbitrary air-control or collision behavior'});
const spec={schemaVersion:1,condition:req.condition,requirements:req,parameters,claims,unknowns:['collision response','air control outside tested paths','pitch clamp','jump buffering','multiplayer','absolute scale without supplied geometry'],generatorRequirements:'Implement the inferred constant-rate planar movement, relative aiming, and ballistic jump model. Preserve supplied camera and landmark correspondences. Record every unobserved choice.'};
await writeFile(path.join(output,'specification.json'),JSON.stringify(spec,null,2));
await writeFile(path.join(output,'measurements.json'),JSON.stringify(measurements));
