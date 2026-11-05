/* Subtype colours: the manuscript's locked palette (scripts/00b_figure_theme.R, subtype_colours). */
const SUB = {
  HGS:   {c:"#C2410C", name:"High-grade serous"},
  LGS:   {c:"#F59065", name:"Low-grade serous"},
  CC:    {c:"#0D9488", name:"Clear cell"},
  EC:    {c:"#7C3AED", name:"Endometrioid"},
  MC:    {c:"#A16207", name:"Mucinous"},
  MMMT:  {c:"#0369A1", name:"Carcinosarcoma"},
  SCCOHT:{c:"#64748B", name:"Small-cell, hypercalcaemic"}
};
let DATA=null, SYMBOLS=[], UP={}, state={sort:"subtype", scale:"rel"};
const $=id=>document.getElementById(id);
const esc=s=>String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));

function subColor(s){ return (SUB[s]&&SUB[s].c) || "#94A3B8"; }
function subName(s){ return SUB[s] ? SUB[s].name+" ("+s+")" : s; }
function fmtTPM(v){ if(v==null) return ""; if(v===0) return "0"; if(v>=100) return Math.round(v).toLocaleString("en");
  if(v>=1) return v.toFixed(1); if(v>=0.01) return v.toFixed(2); return v.toFixed(3); }
function fmtLog2(v){ return v==null? "" : v.toFixed(2); }

/* ---------- boot: decode the embedded gzipped payload in-browser ---------- */
async function boot(){
  try{
    if(typeof window.OVCAN_B64!=="string") throw new Error("data.js not loaded (window.OVCAN_B64 missing)");
    if(typeof DecompressionStream==="undefined")
      throw new Error("This browser lacks DecompressionStream. Use a current Chrome, Edge, Firefox or Safari.");
    const bin = Uint8Array.from(atob(window.OVCAN_B64), c=>c.charCodeAt(0));
    const txt = await new Response(new Blob([bin]).stream().pipeThrough(new DecompressionStream("gzip"))).text();
    DATA = JSON.parse(txt);
  }catch(e){
    $("result").innerHTML = '<div class="ov-state">Could not load the data.<br>'+esc(e.message)+'</div>';
    $("hint").textContent = "";
    return;
  }
  SYMBOLS = Array.from(new Set([...Object.keys(DATA.rna), ...Object.keys(DATA.prot)])).sort();
  for(const s of SYMBOLS) UP[s.toUpperCase()] = s;
  $("m_all").textContent=DATA.all_lines.length;
  $("m_rna").textContent=DATA.rna_lines.length; $("m_rnag").textContent=Object.keys(DATA.rna).length.toLocaleString("en");
  $("m_prot").textContent=DATA.prot_lines.length; $("m_protg").textContent=Object.keys(DATA.prot).length.toLocaleString("en");
  $("m_build").textContent=DATA.generated;
  $("hint").textContent = "";
  wire();
  const urlGene=new URLSearchParams(location.search).get("gene");
  show(urlGene || "WT1");   // ?gene=SYMBOL for shareable links; WT1 demo otherwise
}

/* ---------- typeahead ---------- */
function wire(){
  const q=$("q"), sug=$("suggest");
  let items=[], active=-1;
  const close=()=>{sug.classList.remove("on");q.setAttribute("aria-expanded","false");active=-1;};
  const open=()=>{sug.classList.add("on");q.setAttribute("aria-expanded","true");};
  q.addEventListener("input", ()=>{
    const v=q.value.trim().toUpperCase();
    if(!v){close();return;}
    const pre=[],inc=[];
    for(const s of SYMBOLS){const u=s.toUpperCase();
      if(u.startsWith(v)) pre.push(s); else if(u.includes(v)) inc.push(s);
      if(pre.length>=12) break;}
    items=pre.concat(inc).slice(0,12);
    if(!items.length){sug.innerHTML='<div class="ov-sug"><span class="a">No matching gene symbol</span></div>';open();return;}
    sug.innerHTML=items.map((s,i)=>{
      const inR=DATA.rna[s], inP=DATA.prot[s];
      const av=[inR?"RNA":"", inP?"protein":""].filter(Boolean).join(" and ")||"–";
      return '<div class="ov-sug" role="option" data-i="'+i+'"><span class="s">'+esc(s)+'</span><span class="a">'+av+'</span></div>';
    }).join("");
    active=-1; open();
    [...sug.children].forEach(el=>el.onclick=()=>{q.value=items[+el.dataset.i];close();show(items[+el.dataset.i]);});
  });
  q.addEventListener("keydown",e=>{
    if(!sug.classList.contains("on")){ if(e.key==="Enter"&&q.value.trim()) show(q.value.trim()); return; }
    if(e.key==="ArrowDown"){active=Math.min(active+1,items.length-1);paint();e.preventDefault();}
    else if(e.key==="ArrowUp"){active=Math.max(active-1,0);paint();e.preventDefault();}
    else if(e.key==="Enter"){const g=active>=0?items[active]:q.value.trim();q.value=g;close();show(g);e.preventDefault();}
    else if(e.key==="Escape") close();
  });
  function paint(){[...sug.children].forEach((el,i)=>{el.classList.toggle("active",i===active);
    el.setAttribute("aria-selected",i===active?"true":"false");});}
  document.addEventListener("click",e=>{ if(!sug.contains(e.target) && e.target!==q) close(); });
  document.querySelectorAll(".ov-chip").forEach(c=>c.onclick=()=>{$("q").value=c.dataset.g;close();show(c.dataset.g);});
}

/* ---------- scaling ---------- */
function rnaFrac(tpm,gmax){ if(tpm==null) return 0;
  const denom = state.scale==="abs" ? Math.log10(DATA.scale.rna_max+1) : Math.log10(gmax+1);
  return denom>0 ? Math.min(Math.log10(tpm+1)/denom,1) : 0; }
function protFrac(v,gmin,gmax){ if(v==null) return 0;
  let lo,hi; if(state.scale==="abs"){lo=DATA.scale.prot_lo;hi=DATA.scale.prot_hi;} else {lo=gmin;hi=gmax;}
  return hi>lo ? Math.max(0,Math.min((v-lo)/(hi-lo),1)) : 1; }

/* ---------- render one gene ---------- */
function show(input){
  const key=(input||"").trim().toUpperCase();
  const gene=UP[key];
  const R=$("result");
  if(!gene){
    R.innerHTML='<div class="ov-state">No gene symbol <span class="gs">'+esc(input||"")+'</span> in this resource.<br>'
      +'Check the spelling, or use the HGNC symbol (<span class="gs">ERBB2</span>, not HER2).</div>';
    return;
  }
  $("q").value=gene;
  try{ history.replaceState(null,"", "?gene="+encodeURIComponent(gene)); }catch(e){}
  const rna=DATA.rna[gene]||null, prot=DATA.prot[gene]||null;
  const ens=DATA.rna_gene_id[gene], bt=DATA.rna_biotype_nonpc[gene]||(rna?"protein_coding":null);

  // per-gene extents
  let gmaxR=0; if(rna) for(const v of rna) if(v>gmaxR) gmaxR=v;
  let gminP=Infinity,gmaxP=-Infinity,nP=0; if(prot) for(const v of prot) if(v!=null){nP++; if(v<gminP)gminP=v; if(v>gmaxP)gmaxP=v;}
  const nRdet = rna? rna.filter(v=>v>=1).length : 0;

  // rows over the full panel (union of lines), each with both assays
  const rows = DATA.all_lines.map(ln=>{
    const m=DATA.lines[ln];
    const ri=DATA.rna_lines.indexOf(ln), pi=DATA.prot_lines.indexOf(ln);
    return {ln, sub:m.subtype, site:m.site, plex:m.plex, conflict:m.conflict,
      rna: (rna&&ri>=0)? rna[ri] : (ri>=0?0:null),   // 0 if line has RNA assay; null if no RNA assay for line
      hasRnaAssay: ri>=0,
      prot:(prot&&pi>=0)? prot[pi] : null,
      hasProtAssay: pi>=0};
  });

  // sorting / grouping
  const order = DATA.subtype_order;
  const grouped = state.sort==="subtype";
  if(grouped){
    rows.sort((a,b)=> (order.indexOf(a.sub)-order.indexOf(b.sub)) || (b.rna??-1)-(a.rna??-1) || a.ln.localeCompare(b.ln));
  } else if(state.sort==="rna"){ rows.sort((a,b)=>(b.rna??-1)-(a.rna??-1)); }
  else if(state.sort==="prot"){ rows.sort((a,b)=>(b.prot??-Infinity)-(a.prot??-Infinity)); }
  else { rows.sort((a,b)=>a.ln.localeCompare(b.ln)); }

  // gene name, identifiers, and how many lines express it
  let h='<div class="ov-gene"><h2 class="ov-symbol">'+esc(gene)+'</h2><span class="ov-ids">'
    + (ens? 'Ensembl '+ens.split(', ').map(id=>'<a href="https://www.ensembl.org/Homo_sapiens/Gene/Summary?g='+encodeURIComponent(id)+'" target="_blank" rel="noopener">'+esc(id)+'</a>').join(', ') : 'No Ensembl or RNA record')
    + (bt&&bt!=="protein_coding"? ' · '+esc(bt.replace(/_/g," ")) : '')
    + '</span></div>';
  // a missing assay is explained once, in the note below
  const det=[];
  if(rna) det.push('RNA at ≥1 TPM in <span class="n">'+nRdet+'</span> of '+DATA.rna_lines.length+' lines');
  if(prot) det.push((rna?'protein':'Protein')+' quantified in <span class="n">'+nP+'</span> of '+DATA.prot_lines.length+(rna?'':' lines'));
  h+='<p class="ov-line">'+det.join(' · ')+'</p>';

  if(!rna) h+='<p class="ov-note">No RNA record for <span class="gs">'+esc(gene)+'</span>: the symbol does not match an Ensembl gene in release 93. Protein is shown where available.</p>';
  if(!prot) h+='<p class="ov-note">No protein record for <span class="gs">'+esc(gene)+'</span> in the TMT data (not quantified, or listed under another symbol). RNA is shown where available.</p>';

  // controls
  h+='<div class="ov-toolbar">'
    + '<div class="ov-ctl" role="group" aria-label="Sort lines by"><span class="ov-ctl-l">Sort by</span><span class="ov-seg" id="seg-sort">'
    +   btn("subtype","Subtype","sort")+btn("rna","RNA","sort")+btn("prot","Protein","sort")+btn("name","Name","sort")
    + '</span></div>'
    + '<div class="ov-ctl" role="group" aria-label="Bar scale"><span class="ov-ctl-l">Bars</span><span class="ov-seg" id="seg-scale">'
    +   btn("rel","Per gene","scale")+btn("abs","Shared axis","scale")
    + '</span></div>'
    + '</div>';

  // legend: only when rows are not grouped under subtype headings
  const present=[...new Set(rows.map(r=>r.sub))].filter(s=>SUB[s]).sort((a,b)=>order.indexOf(a)-order.indexOf(b));
  if(!grouped) h+='<div class="ov-legend">'+present.map(s=>'<span class="ov-lg"><span class="ov-sw" style="background:'+SUB[s].c+'"></span>'+subName(s)+'</span>').join('')+'</div>';

  // column heads
  h+='<div class="ov-chart"><div class="ov-cols"><div></div>'
    + '<div class="ov-colh">RNA<span>TPM · log-scale bars</span></div>'
    + '<div class="ov-colh">Protein<span>log₂ abundance</span></div></div>';

  // rows
  const counts={}; for(const r of rows) counts[r.sub]=(counts[r.sub]||0)+1;
  let curSub=null;
  for(const r of rows){
    if(grouped && r.sub!==curSub){ curSub=r.sub;
      h+='<div class="ov-grp"><span class="ov-sw" style="background:'+subColor(r.sub)+'"></span>'+subName(r.sub)
        +' <span class="c">'+counts[r.sub]+(counts[r.sub]===1?' line':' lines')+'</span></div>'; }
    const dot=grouped? '' : '<span class="ov-dot" style="background:'+subColor(r.sub)+'" title="'+esc(subName(r.sub))+'"></span>';
    const conf=r.conflict?'<span class="ov-conf" title="Subtype label conflict; see the resource notes">‡</span>':'';
    // RNA cell
    let rnaCell;
    if(!rna) rnaCell='<span class="ov-na">–</span>';                          // gene absent from RNA dataset
    else if(!r.hasRnaAssay) rnaCell='<span class="ov-na">Not profiled</span>'; // this line has no RNA assay
    else { const f=rnaFrac(r.rna,gmaxR);
      rnaCell='<div class="ov-cell"><div class="ov-track"><div class="ov-fill" style="width:'+(f*100).toFixed(1)+'%;background:'+subColor(r.sub)+'"></div></div>'
        +'<span class="ov-val">'+fmtTPM(r.rna)+'</span></div>'; }
    // protein cell
    let protCell;
    if(!prot) protCell='<span class="ov-na">–</span>';                          // gene absent from protein dataset
    else if(!r.hasProtAssay) protCell='<span class="ov-na">Not profiled</span>'; // this line has no protein assay
    else if(r.prot==null) protCell='<div class="ov-cell"><div class="ov-track"></div><span class="ov-val nd">n.d.</span></div>';
    else { const f=protFrac(r.prot,gminP,gmaxP);
      protCell='<div class="ov-cell"><div class="ov-track"><div class="ov-fill" style="width:'+(f*100).toFixed(1)+'%;background:'+subColor(r.sub)+'"></div></div>'
        +'<span class="ov-val">'+fmtLog2(r.prot)+'</span></div>'; }
    h+='<div class="ov-row"><div class="ov-ln">'+dot+'<span class="t">'+esc(r.ln)+'</span>'+conf+'</div>'+rnaCell+protCell+'</div>';
  }
  h+='</div>';

  R.innerHTML=h;
  // wire controls
  document.querySelectorAll('#seg-sort button').forEach(b=>b.onclick=()=>{state.sort=b.dataset.v;show(gene);});
  document.querySelectorAll('#seg-scale button').forEach(b=>b.onclick=()=>{state.scale=b.dataset.v;show(gene);});
}
function btn(v,label,grp){ return '<button type="button" aria-pressed="'+(state[grp]===v)+'" data-v="'+v+'">'+label+'</button>'; }

boot();
