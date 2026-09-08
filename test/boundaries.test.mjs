import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, symlink, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { manifest } from '../src/io.mjs';
import { serve } from '../src/server.mjs';
import { finalCases, recorded } from '../src/scenarios.mjs';
test('manifest rejects symlink escapes instead of hashing private host content',async()=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'gameparse-test-'));
  try {await symlink('/etc/passwd',path.join(directory,'escape'));await assert.rejects(manifest(directory),/Symlink/);}finally{await rm(directory,{recursive:true,force:true});}
});
test('server serves only explicitly allowed game routes',async()=>{
  const directory=await mkdtemp(path.join(os.tmpdir(),'gameparse-test-'));let server;
  try {await writeFile(path.join(directory,'index.html'),'game');await writeFile(path.join(directory,'private.json'),'private');server=await serve(directory);
    assert.equal(await (await fetch(server.url)).text(),'game');
    for(const route of ['/private.json','/../private.json','/%2e%2e/private.json','/game.mjs?file=private.json'])assert.equal((await fetch(server.url+route)).status,404);
  } finally {await server?.close();await rm(directory,{recursive:true,force:true});}
});
test('final cases use new event sequences on the declared input clock grid',()=>{
  const existing=new Set(recorded.map(s=>JSON.stringify(s.events)));
  for(const random of [()=>0,()=>.3,()=>.6,()=>.99])for(const s of finalCases(random)){
    assert.ok(!existing.has(JSON.stringify(s.events)));assert.ok(s.events.every(e=>e.at%16===0&&e.at<=s.duration));
  }
});
