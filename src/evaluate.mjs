import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { hash, readJSON } from './io.mjs';
import { landmarks } from '../workers/vision.mjs';
export const tolerances={rms:.02,maximum:.05,eventMs:50,maxGapMs:50,repetitions:5,minPassing:4};
export async function observe(directory,requirements) {
  const recording=await readJSON(path.join(directory,'recording.json'));
  if(!recording.captureValid||!recording.cleanup)throw new Error('Invalid capture or cleanup');
  const points=[];
  for(const frame of recording.frames){const file=path.join(directory,frame.file);if(hash(await readFile(file))!==frame.sha256)throw new Error('Frame integrity mismatch');points.push({time:frame.time,points:await landmarks(file,requirements)});}
  return {recording,samples:points};
}
export function events(samples,height) {
  const baseline=samples[0].points.map(p=>p.y);
  const displacement=samples.map(s=>s.points.reduce((sum,p,i)=>sum+(p.y-baseline[i])/height,0)/baseline.length);
  const start=displacement.findIndex((v,i)=>v>.005&&displacement[i+1]>.005);
  if(start<0)return null;
  for(let i=start+2;i<samples.length;i++)if(Math.abs(displacement[i])<=.005) {
    const end=samples.findIndex((s,k)=>k>=i&&s.time>=samples[i].time+100);
    if(end>=0&&displacement.slice(i,end+1).every(v=>Math.abs(v)<=.005))return {departure:samples[start].time,landing:samples[i].time,airtime:samples[i].time-samples[start].time};
  }
  return null;
}
export function compare(reference,candidate,requirements) {
  for(const observed of [reference,candidate]){
    const {recording:r,samples}=observed;
    if(!r.captureValid||!r.cleanup||r.condition!=='controlled-clock-image-only-v1')return {decision:'inconclusive',reason:'Invalid capture condition or cleanup'};
    if(!samples.length||samples[0].time!==0||samples.at(-1).time!==r.scenario.duration)return {decision:'inconclusive',reason:'Incomplete observation window'};
    if(samples.some((s,i)=>!Number.isFinite(s.time)||(i>0&&s.time<=samples[i-1].time)))return {decision:'inconclusive',reason:'Invalid sample ordering'};
  }
  if(JSON.stringify(reference.recording.scenario)!==JSON.stringify(candidate.recording.scenario))return {decision:'inconclusive',reason:'Scenario mismatch'};
  if(reference.samples.length!==candidate.samples.length||reference.samples.length<2)return {decision:'inconclusive',reason:'Incomplete observation window'};
  let sum=0,maximum=0,count=0;
  for(let i=0;i<reference.samples.length;i++){
    const a=reference.samples[i],b=candidate.samples[i];
    if(a.time!==b.time||(i&&a.time-reference.samples[i-1].time>tolerances.maxGapMs))return {decision:'inconclusive',reason:'Clock mismatch or frame gap'};
    for(let j=0;j<requirements.landmarks.length;j++){
      const p=a.points[j],q=b.points[j];
      if(!p||!q||p.id!==requirements.landmarks[j].id||q.id!==p.id||p.pixels<50||q.pixels<50||![p.x,p.y,q.x,q.y].every(Number.isFinite))return {decision:'inconclusive',reason:'Missing landmark; cause requires review'};
      const distance=Math.hypot((p.x-q.x)/requirements.viewport.width,(p.y-q.y)/requirements.viewport.height);
      sum+=distance*distance;maximum=Math.max(maximum,distance);count++;
    }
  }
  const result={rms:Math.sqrt(sum/count),maximum,points:count};
  let pass=result.rms<=tolerances.rms&&maximum<=tolerances.maximum;
  if(reference.recording.scenario.behavior==='jumping'){
    const a=events(reference.samples,requirements.viewport.height),b=events(candidate.samples,requirements.viewport.height);
    if(!a)return {...result,decision:'inconclusive',reason:'Reference jump unobservable'};
    if(!b)return {...result,decision:'failure',reason:'Candidate jump events absent'};
    result.eventErrors=Object.fromEntries(Object.keys(a).map(k=>[k,Math.abs(a[k]-b[k])]));
    pass&&=Object.values(result.eventErrors).every(v=>v<=tolerances.eventMs);
  }
  return {...result,decision:pass?'success':'failure'};
}
export function summarize(pairs,stability) {
  if(stability.length!==4||stability.some(s=>s.decision!=='success'))return 'inconclusive';
  if(pairs.length!==5||pairs.some(p=>p.decision==='inconclusive'))return 'inconclusive';
  return pairs.filter(p=>p.decision==='success').length>=4?'success':'failure';
}
