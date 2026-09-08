#!/usr/bin/env node
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { mkdir, cp, readFile, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { randomBytes } from 'node:crypto';
import { chromium } from 'playwright';
import { serve } from './server.mjs';
import { capture } from './capture.mjs';
import { recorded, finalCases, development } from './scenarios.mjs';
import { hash, json, readJSON, manifest } from './io.mjs';
import { stage } from './isolation.mjs';
import { observe, compare, summarize, tolerances } from './evaluate.mjs';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const exec=promisify(execFile);
const options=process.argv.slice(3);
function option(name,fallback){const i=options.indexOf(name);return i<0?fallback:options[i+1];}
async function browser(){return chromium.launch({channel:'chrome',headless:true});}
async function run(smoke=false){
  const id=option('--id',new Date().toISOString().replace(/[:.]/g,'-'));
  if(!/^[a-zA-Z0-9_-]+$/.test(id))throw new Error('ID must contain only letters, digits, underscores, hyphens');
  await mkdir(path.join(root,'artifacts'),{recursive:true});
  const output=path.join(root,'artifacts',id);await mkdir(output); // Never overwrite a previous experiment.
  const requirements=await readJSON(path.join(root,'fixture/requirements.json'));
  const report={id,condition:requirements.condition,completion:'incomplete',validity:'unresolved',reconstruction:'inconclusive',results:[],cleanup:false,limitations:['Controlled browser clock; no real-time latency claim','Known supplied camera and landmark geometry','Deterministic model-based analyzer/generator, not a general game agent','No claim about unobserved collisions, networking, or arbitrary game engines']};
  let reference,candidate,b;
  try {
    reference=await serve(path.join(root,'fixture'));b=await browser();
    if(smoke){await capture(b,reference.url,development[0],path.join(output,'smoke'));report.completion='complete';report.limitations.push('Capture smoke test only; no reconstruction experiment');return;}
    const image=(await exec('docker',['image','inspect','node:24-alpine','--format','{{.Id}}'])).stdout.trim();
    const plan={condition:requirements.condition,tolerances,clock:{kind:'controlled',stepMs:16,wallGates:'Not applicable; this is a separate intervention condition'},recorded,finalFamilies:['unseen hold duration','unseen mouse-input temporal spacing','unseen jump hold duration','forward-left combination','forward plus aiming'],repetitions:5,attemptCap:7,referenceReuse:'The five reference stability captures are paired by index with five candidate captures',appearance:'Descriptive separate assessment; colors and landmark identities supplied; background/grid intentionally substituted',unknowns:requirements.unknowns};
    await json(path.join(output,'preregistration.json'),plan);
    await mkdir(path.join(output,'analysis-input'));
    await cp(path.join(root,'fixture/requirements.json'),path.join(output,'analysis-input/requirements.json'));
    for(const s of recorded){console.log(`analysis capture ${s.id}`);await capture(b,reference.url,s,path.join(output,'analysis-input',s.id));}
    await json(path.join(output,'analysis-input/index.json'),{trials:recorded.map(s=>s.id)});
    console.log('isolated analysis');
    const analysisAudit=await stage('analyze',path.join(output,'analysis-input'),path.join(output,'analysis-output'),output,image);
    await mkdir(path.join(output,'generator-input'));
    await cp(path.join(output,'analysis-output/specification.json'),path.join(output,'generator-input/specification.json'));
    console.log('isolated generation');
    const generationAudit=await stage('generate',path.join(output,'generator-input'),path.join(output,'reconstruction'),output,image);
    // Private cases are chosen only after generation. The algorithm and ranges were preregistered.
    const seed=randomBytes(4).readUInt32LE();let state=seed;
    const random=()=>{state=(Math.imul(1664525,state)+1013904223)>>>0;return state/2**32;};
    const held=finalCases(random);await json(path.join(output,'private-final.json'),{seed,cases:held});
    const frozen={createdAt:new Date().toISOString(),image,plan:hash(await readFile(path.join(output,'preregistration.json'))),privateFinal:hash(await readFile(path.join(output,'private-final.json'))),requirements:hash(await readFile(path.join(root,'fixture/requirements.json'))),protocol:hash(await readFile(path.join(root,'docs/initial-experiment.md'))),lockfile:hash(await readFile(path.join(root,'package-lock.json'))),source:{src:await manifest(path.join(root,'src')),workers:await manifest(path.join(root,'workers')),fixture:await manifest(path.join(root,'fixture'))},analysisInputs:analysisAudit.inputManifest,analysisOutputs:analysisAudit.outputManifest,generatorInputs:generationAudit.inputManifest,reconstruction:generationAudit.outputManifest,browser:b.version(),node:process.version,platform:process.platform};
    await json(path.join(output,'freeze.json'),frozen);
    candidate=await serve(path.join(output,'reconstruction'));
    for(const [group,cases] of [['recorded',recorded],['final-held-out',held]])for(const scenario of cases){
      const refs=[],candidates=[],attempts=[];
      for(const [kind,url,observations] of [['reference',reference.url,refs],['candidate',candidate.url,candidates]]){
        for(let attempt=0;observations.length<5&&attempt<7;attempt++){
          const dir=path.join(output,'evaluation',group,scenario.id,`${kind}-${attempt+1}`);
          console.log(`evaluate ${group}/${scenario.id} ${kind} ${attempt+1}`);
          try {await capture(b,url,scenario,dir);observations.push(await observe(dir,requirements));attempts.push({kind,attempt:attempt+1,valid:true,path:path.relative(output,dir)});}
          catch(error){attempts.push({kind,attempt:attempt+1,valid:false,error:error.message});}
        }
      }
      const stability=refs.slice(1).map(r=>compare(refs[0],r,requirements));
      const pairs=refs.map((r,i)=>candidates[i]?compare(r,candidates[i],requirements):{decision:'inconclusive',reason:'Missing candidate capture'});
      const result={group,scenario:scenario.id,behavior:scenario.behavior,attempts,stability,pairs,decision:refs.length===5&&candidates.length===5?summarize(pairs,stability):'inconclusive'};
      report.results.push(result);await json(path.join(output,'progress.json'),{id,finishedScenarios:report.results.length});
    }
    // Detect post-freeze changes, including any mutation of the implementation or hidden cases.
    if(JSON.stringify(await manifest(path.join(output,'reconstruction')))!==JSON.stringify(frozen.reconstruction)||hash(await readFile(path.join(output,'private-final.json')))!==frozen.privateFinal)throw new Error('Frozen artifacts changed during evaluation');
    report.completion='complete';report.validity=analysisAudit.success&&generationAudit.success?'valid':'invalid';
    report.reconstruction=report.results.every(r=>r.decision==='success')?'success':report.results.some(r=>r.decision==='failure')?'failure':'inconclusive';
    report.finalCasesConsumed=true;report.freeze=hash(await readFile(path.join(output,'freeze.json')));
    report.appearance='Substitute background/grid; landmark colors and geometry supplied for measurement. No fidelity score claimed.';
    report.specification=await readJSON(path.join(output,'analysis-output/specification.json'));
    report.implementation=await readJSON(path.join(output,'reconstruction/implementation-map.json'));
  } catch(error){report.failure=error.message;process.exitCode=1;console.error(error.message);}
  finally {
    const cleanup=await Promise.allSettled([b?.close(),reference?.close(),candidate?.close()]);
    report.cleanup=cleanup.every(r=>r.status==='fulfilled');report.cleanupErrors=cleanup.filter(r=>r.status==='rejected').map(r=>String(r.reason));
    if(!report.cleanup){report.validity='invalid';report.reconstruction='inconclusive';process.exitCode=1;}
    await json(path.join(output,'report.json'),report);
    console.log(`Report: ${path.join(output,'report.json')} (${report.completion}; ${report.validity}; ${report.reconstruction})`);
  }
}
try {
  const command=process.argv[2];
  if(command==='experiment')await run();
  else if(command==='smoke')await run(true);
  else if(command==='serve'){
    const server=await serve(path.resolve(option('--dir',path.join(root,'fixture'))),Number(option('--port',4173)));
    console.log(server.url);const close=async()=>{await server.close();process.exit();};process.once('SIGINT',close);process.once('SIGTERM',close);
  } else {console.log('Usage: node src/cli.mjs experiment|smoke [--id ID]\n       node src/cli.mjs serve [--dir GAME_DIRECTORY] [--port PORT]');process.exitCode=command?1:0;}
} catch(error){console.error(error.message);process.exitCode=1;}
