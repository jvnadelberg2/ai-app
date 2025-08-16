const fs = require("fs");
const path = require("path");
const { embed } = require("./providers");
const DB_PATH = process.env.RAG_DB || "data/rag.json";

function load(){ try { return JSON.parse(fs.readFileSync(DB_PATH,"utf8")); } catch { return { dims:null, items:[] }; } }
function save(db){ fs.mkdirSync(path.dirname(DB_PATH),{recursive:true}); fs.writeFileSync(DB_PATH, JSON.stringify(db)); }
function isText(p){ return /\.(md|txt|json|yaml|yml)$/i.test(p); }
function chunk(s,size=800,overlap=200){ const out=[]; for(let i=0;i<s.length;i+=size-overlap) out.push(s.slice(i,i+size)); return out; }
function dot(a,b){ let s=0; for(let i=0;i<a.length;i++) s+=a[i]*b[i]; return s; }
function norm(a){ return Math.sqrt(dot(a,a)); }
function cos(a,b){ return dot(a,b)/(norm(a)*norm(b)||1); }

async function indexPaths(paths){
  const files=[];
  for (const p of paths){
    const st = fs.statSync(p);
    if (st.isDirectory()){
      for (const f of fs.readdirSync(p)){ const fp=path.join(p,f); if (fs.statSync(fp).isFile() && isText(fp)) files.push(fp); }
    } else if (st.isFile() && isText(p)){ files.push(p); }
  }
  const db = load();
  let added=0;
  for (const fp of files){
    const text = fs.readFileSync(fp,"utf8");
    const chunks = chunk(text);
    const vecs = await embed({ input: chunks });
    if (!db.dims) db.dims = vecs[0]?.length || null;
    for (let i=0;i<chunks.length;i++){
      db.items.push({ path: fp, idx: i, vec: vecs[i] });
      added++;
    }
  }
  save(db);
  return { files: files.length, chunks: added };
}

async function queryRag(q,k=5){
  const db = load();
  if (!db.items.length) return { results: [] };
  const [qv] = await embed({ input: q });
  const scored = db.items.map(it=>({ score: cos(qv,it.vec), path: it.path, idx: it.idx }));
  scored.sort((a,b)=>b.score-a.score);
  return { results: scored.slice(0,k) };
}

module.exports = { indexPaths, queryRag };
