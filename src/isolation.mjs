import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { mkdir, cp, writeFile, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { manifest, json } from './io.mjs';
const exec=promisify(execFile),root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
export async function stage(role,input,output,work,image) {
  if(!['analyze','generate'].includes(role))throw new Error('Unknown isolated role');
  if(!/^sha256:[a-f0-9]{64}$/.test(image))throw new Error('Docker image must be pinned to local immutable ID');
  const tool=path.join(work,`${role}-tool`);await mkdir(tool,{recursive:true});await mkdir(output,{recursive:true});
  await cp(path.join(root,'workers',`${role}.mjs`),path.join(tool,`${role}.mjs`));
  if(role==='analyze') {
    await cp(path.join(root,'workers/vision.mjs'),path.join(tool,'vision.mjs'));
    await mkdir(path.join(tool,'node_modules'),{recursive:true});
    await cp(path.join(root,'node_modules/pngjs'),path.join(tool,'node_modules/pngjs'),{recursive:true});
  }
  const probe=`import fs from 'node:fs';import net from 'node:net';
const denied=[];for(const p of ['/private/reference-sentinel',${JSON.stringify(path.join(root,'fixture/game.mjs'))},'/root/.ssh/id_rsa','/var/run/docker.sock']){try{fs.readFileSync(p);throw new Error('Privileged read succeeded: '+p);}catch(e){if(!['ENOENT','EACCES','EPERM'].includes(e.code))throw e;denied.push(p);}}
try{fs.writeFileSync('/input/forbidden-write','x');throw new Error('Input mount writable');}catch(e){if(!['EROFS','EACCES','EPERM'].includes(e.code))throw e;}
await new Promise((resolve,reject)=>{const s=net.connect({host:'1.1.1.1',port:80});s.setTimeout(1000);s.on('connect',()=>{s.destroy();reject(new Error('Network allowed'));});s.on('error',()=>resolve());s.on('timeout',()=>{s.destroy();resolve();});});
fs.writeFileSync('/output/boundary-probe.json',JSON.stringify({denied,readOnlyInput:true,networkConnectionDenied:true,history:'Fresh deterministic process; no conversation or credentials supplied'}));`;
  await writeFile(path.join(tool,'probe.mjs'),probe);
  const inputManifest=await manifest(input),toolManifest=await manifest(tool);
  const name=`gameparse-${role}-${process.pid}-${Date.now()}`;
  const args=['run','--rm','--name',name,'--pull','never','--network','none','--read-only','--cap-drop','ALL','--security-opt','no-new-privileges','--pids-limit','64','--memory','512m','--user',`${process.getuid?.()??1000}:${process.getgid?.()??1000}`,'--tmpfs','/tmp:rw,noexec,nosuid,size=64m','--mount',`type=bind,src=${path.resolve(input)},dst=/input,readonly`,'--mount',`type=bind,src=${tool},dst=/tool,readonly`,'--mount',`type=bind,src=${path.resolve(output)},dst=/output`,image];
  const audit={role,image,inputManifest,toolManifest,policy:{network:'none',readOnlyRoot:true,capabilities:'none',mounts:['input:ro','tool:ro','output:rw'],history:'none'},cleanup:false};
  try {
    await exec('docker',[...args,'node','/tool/probe.mjs'],{timeout:15000,maxBuffer:1024*1024});
    const result=await exec('docker',[...args,'node',`/tool/${role}.mjs`,'/input','/output'],{timeout:300000,maxBuffer:1024*1024});
    audit.stdout=result.stdout;audit.stderr=result.stderr;
    if(JSON.stringify(await manifest(input))!==JSON.stringify(inputManifest))throw new Error('Stage inputs changed');
    audit.outputManifest=await manifest(output);audit.success=true;
  } catch(error){audit.success=false;audit.failure=String(error.message).slice(0,4000);throw error;}
  finally {
    try {await exec('docker',['rm','-f',name],{timeout:10000});audit.cleanup=true;}catch(error){if(String(error.stderr).includes('No such container'))audit.cleanup=true;else audit.cleanupError=String(error.message);}
    await json(path.join(work,`${role}-audit.json`),audit);
  }
  return audit;
}
