import { createHash } from 'node:crypto';
import { readFile, writeFile, mkdir, readdir, lstat } from 'node:fs/promises';
import path from 'node:path';
export const hash = data => createHash('sha256').update(data).digest('hex');
export const readJSON = async file => JSON.parse(await readFile(file, 'utf8'));
export async function json(file, value) { await mkdir(path.dirname(file),{recursive:true}); await writeFile(file, JSON.stringify(value,null,2)+'\n'); }
export async function manifest(root) {
  const result = {};
  async function walk(dir) { for(const name of (await readdir(dir)).sort()) {
    const file=path.join(dir,name), stat=await lstat(file);
    if(stat.isSymbolicLink())throw new Error(`Symlink not allowed: ${file}`);
    if(stat.isDirectory()) await walk(file); else result[path.relative(root,file)]=hash(await readFile(file));
  }}
  await walk(root);return result;
}
