import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
export async function serve(root, port=0) {
  // Explicit routes: no traversal, directory listing, source outside the game, or arbitrary host reads.
  const routes={'/':'index.html','/index.html':'index.html','/game.mjs':'game.mjs','/requirements.json':'requirements.json'};
  const server=http.createServer(async(req,res)=>{
    const file=routes[req.url];if(!file){res.writeHead(404);res.end();return;}
    try { const body=await readFile(path.join(root,file));res.writeHead(200,{'Content-Type':file.endsWith('.mjs')?'text/javascript':file.endsWith('.json')?'application/json':'text/html','Cache-Control':'no-store'});res.end(body); }
    catch {res.writeHead(404);res.end();}
  });
  await new Promise((resolve,reject)=>{server.once('error',reject);server.listen(port,'127.0.0.1',resolve);});
  return {url:`http://127.0.0.1:${server.address().port}`, close:()=>new Promise((resolve,reject)=>{server.closeAllConnections();server.close(error=>error?reject(error):resolve());})};
}
