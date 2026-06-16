import { useState, useEffect, useCallback, useRef } from "react";

// ─── Brand ────────────────────────────────────────────────────────────────────
const B = {
  beige:"#FBF9F3", beigeD:"#F0EDE4", beigeDD:"#E6E2D8",
  yellow:"#F2C01E", yellowPale:"#FEF8DC",
  green:"#CEE1D4", greenD:"#A8C9B2",
  black:"#1A1A18", gray:"#6B6B65", grayL:"#D9D7CF", white:"#FFFFFF",
};

const STATUS = {
  draft:       { label:"Draft",       bg:"#EFEFED", color:"#6B6B65", dot:"#9E9E96" },
  pripraveno:  { label:"Připraveno",  bg:"#FEF8DC", color:"#9A7800", dot:"#F2C01E" },
  schvaleno:   { label:"Schváleno",   bg:"#E8F5EC", color:"#2D7A4A", dot:"#CEE1D4" },
  publikovano: { label:"Publikováno", bg:"#E6F0FF", color:"#2B5BC7", dot:"#7BAAF7" },
};

const TYPES = {
  edukativni: { label:"Edukativní",  color:"#5B3E8F", bg:"#EDE8F8" },
  inspiracni: { label:"Inspirační",  color:"#B5510A", bg:"#FFF0E6" },
  produktovy: { label:"Produktový",  color:"#1A7A4A", bg:"#E6F5EE" },
  sezonni:    { label:"Sezónní",     color:"#0A7A6A", bg:"#E6F5F2" },
  trendovy:   { label:"Trendový",    color:"#2B5BC7", bg:"#E6F0FF" },
  faq:        { label:"FAQ",         color:"#7A3A0A", bg:"#F5EEE6" },
};

const KB_CATS = {
  brand:    { label:"Brand & Voice",    icon:"🎨" },
  seo:      { label:"SEO pravidla",     icon:"🔍" },
  produkty: { label:"Produkty",         icon:"📦" },
  inspirace:{ label:"Inspirace",        icon:"💡" },
  ostatni:  { label:"Ostatní",          icon:"📁" },
};

const STATUS_ORDER = ["draft","pripraveno","schvaleno","publikovano"];
const MONTH_CZ = ["Leden","Únor","Březen","Duben","Květen","Červen","Červenec","Srpen","Září","Říjen","Listopad","Prosinec"];
const DAY_CZ   = ["Po","Út","St","Čt","Pá","So","Ne"];

// ─── Goldea Brand System Prompt (vždy v základu) ────────────────────────────
const GOLDEA_BASE_SYSTEM = `Jsi senior content editor a SEO specialista značky Goldea – českého e-shopu s bytovým textilem (povlečení, závěsy, dekorace).

=== BRAND VOICE ===
Komunikace JE: klidná, lidská, důvěryhodná, inspirativní, estetická, přirozená.
Komunikace NENÍ: agresivně prodejní, přehnaně emotivní, nátlaková, bulvární.
Vykat čtenáři, ale přátelsky. Žádné VELKÁ PÍSMENA v textu.

=== ZAKÁZANÉ VÝRAZY (NIKDY NEPOUŽÍVAT) ===
nejlepší, nejlevnější, revoluční, převratný, ultimátní, dokonalý, bezkonkurenční,
musíte mít, kupte hned, nečekejte, pospěšte si, pouze dnes, jedinečná nabídka,
šokující, neuvěřitelný, game changer, luxus za hubičku, zaručeně, stoprocentně,
absolutně každý, tohle vám změní život, nikdo vám to neřekne

=== DOPORUČENÉ FORMULACE ===
"může pomoci", "často bývá", "mnoho domácností oceňuje", "stojí za zvážení",
"vytváří příjemnou atmosféru", "přináší pocit útulnosti", "pomáhá navodit harmonii",
"hodí se zejména", "je oblíbenou volbou", "inspirací může být",
"dobře funguje v kombinaci s", "dodává prostoru jemnost", "přirozeně zapadá do"

=== VHODNÉ CTA ===
"Prohlédněte si kolekci", "Nechte se inspirovat dalšími vzory",
"Objevte produkty, které ladí s tímto stylem", "Podívejte se na další tipy pro útulný domov"

=== ZAKÁZANÉ CTA ===
"Nakupujte nyní", "Objednejte hned", "Nenechte si ujít", "Kupte si ještě dnes"

=== SEO PRAVIDLA ===
- H1: pouze jeden, obsahuje hlavní KW, nesmí být clickbait
- H2: minimálně 4–6, každý rozvíjí část tématu, obsahuje sekundární KW
- Délka: minimálně 1200 slov, ideálně 1500–2000 slov
- Klíčová slova: přirozené použití, žádný keyword stuffing, povinná synonymizace
- Úvod: začíná situací nebo problémem čtenáře, BEZ "V tomto článku se dozvíte"
- FAQ: 3–5 otázek a stručných odpovědí
- CTA: jemné, na konci, nesmí působit reklamně
- Interní prolinky: alespoň 2 zmínky (lze označit jako [INTERNÍ ODKAZ: téma])

=== TYPY ČLÁNKŮ ===
EDUKATIVNÍ: 70% edukace, 20% inspirace, 10% produkty. Věcný, praktický styl.
INSPIRAČNÍ: 50% inspirace, 30% edukace, 20% produkty. Atmosferický, vizuální jazyk.
SEZÓNNÍ: 40% sezóna/kontext, 30% inspirace, 30% produkty. Uklidňující styl.
PRODUKTOVÝ: 50% produkt, 30% edukace, 20% inspirace. Jemně komerční, ne tvrdý prodej.
TRENDOVÝ: 50% trend/kontext, 30% inspirace, 20% produkty. Lehce editorial.
FAQ: 90% informace, 10% inspirace. Maximálně věcný.

=== FAKTICKÁ SPRÁVNOST ===
Nevymýšlet studie ani statistiky. Pokud si nejsi jistá, formuluj opatrně.
Nepoužívat zdravotní tvrzení bez ověřených zdrojů.

=== VÝSTUPNÍ FORMÁT ===
Na konci článku VŽDY přidej blok:
---META---
title: [meta title 50-60 znaků]
description: [meta description 140-160 znaků]
---KONEC META---`;

// ─── Helpers ──────────────────────────────────────────────────────────────────
const genId = () => Date.now().toString(36) + Math.random().toString(36).slice(2,6);
const fmtDate = s => { if (!s) return "—"; const [y,m,d]=s.split("-"); return `${+d}. ${+m}. ${y}`; };
const daysUntil = s => { if (!s) return null; const t=new Date();t.setHours(0,0,0,0); const d=new Date(s);d.setHours(0,0,0,0); return Math.round((d-t)/86400000); };
const buildCalMatrix = (y,m) => { const first=new Date(y,m,1).getDay(); const days=new Date(y,m+1,0).getDate(); const pad=first===0?6:first-1; const cells=Array(pad).fill(null); for(let d=1;d<=days;d++)cells.push(d); while(cells.length%7)cells.push(null); return cells; };
const fmtFileSize = b => b>1048576?`${(b/1048576).toFixed(1)} MB`:b>1024?`${(b/1024).toFixed(0)} KB`:`${b} B`;

// ─── API call (vždy přes Netlify proxy) ──────────────────────────────────────
// Nikdy nevoláme api.anthropic.com přímo z prohlížeče – CORS to zablokuje.
// Lokálně: `netlify dev` spustí proxy automaticky na stejném portu.
// Produkce: Netlify nasadí funkci na /.netlify/functions/claude-proxy.
const callClaude = async (system, userPrompt) => {
  const url = "/.netlify/functions/claude-proxy";

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 4000,
      system,
      messages: [{ role: "user", content: userPrompt }],
    }),
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
};

// ─── Extract text from files ──────────────────────────────────────────────────
const extractText = async (file) => {
  const name = file.name.toLowerCase();

  if (name.endsWith(".txt") || name.endsWith(".md") || name.endsWith(".csv")) {
    return await file.text();
  }

  if (name.endsWith(".xlsx") || name.endsWith(".xls")) {
    try {
      const XLSX = await import("xlsx");
      const buf = await file.arrayBuffer();
      const wb = XLSX.read(buf, { type: "array" });
      let text = "";
      wb.SheetNames.forEach(sn => {
        const ws = wb.Sheets[sn];
        text += `=== List: ${sn} ===\n`;
        text += XLSX.utils.sheet_to_csv(ws) + "\n\n";
      });
      return text;
    } catch { return "[Excel soubor – obsah nelze extrahovat bez knihovny xlsx]"; }
  }

  if (name.endsWith(".docx")) {
    try {
      const mammoth = await import("mammoth");
      const buf = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer: buf });
      return result.value;
    } catch { return "[Word dokument – obsah nelze extrahovat bez knihovny mammoth]"; }
  }

  if (file.type.startsWith("image/")) {
    return `[Obrázek: ${file.name}]`;
  }

  if (name.endsWith(".pdf")) {
    return `[PDF soubor: ${file.name} – pro extrakci textu z PDF je potřeba backend]`;
  }

  return `[Soubor: ${file.name} – typ ${file.type}]`;
};

// ─── Seed data ────────────────────────────────────────────────────────────────
const now = new Date();
const Y = now.getFullYear(); const M = String(now.getMonth()+1).padStart(2,"0");
const SEED_ARTICLES = [
  {id:"s1",title:"Jak pečovat o mušelínové povlečení, aby vydrželo roky",topic:"Péče o textil",type:"edukativni",tags:["mušelín","péče","povlečení"],status:"publikovano",date:`${Y}-${M}-03`,notes:"Evergreen",content:"",meta:{title:"",description:""}},
  {id:"s2",title:"Clean girl aesthetic – rituál, který začíná v posteli",topic:"Trend & lifestyle",type:"inspiracni",tags:["trend","estetika","ložnice"],status:"schvaleno",date:`${Y}-${M}-10`,notes:"",content:"",meta:{title:"",description:""}},
  {id:"s3",title:"Jak sladit barvy v interiéru",topic:"Interiérový design",type:"inspiracni",tags:["barvy","interiér","design"],status:"pripraveno",date:`${Y}-${M}-18`,notes:"Potřeba review",content:"",meta:{title:"",description:""}},
  {id:"s4",title:"Mušelín – materiál, do kterého se zamilujete",topic:"Materiály",type:"edukativni",tags:["mušelín","materiál"],status:"draft",date:`${Y}-${M}-25`,notes:"",content:"",meta:{title:"",description:""}},
  {id:"s5",title:"Nová kolekce Goldea Linen",topic:"Produktová prezentace",type:"produktovy",tags:["linen","kolekce"],status:"draft",date:`${Y}-${M}-28`,notes:"Čeká na fotky",content:"",meta:{title:"",description:""}},
];

const SEED_KB = [
  {id:"kb1",name:"Brand Writing Manual",category:"brand",type:"text",content:"Viz brandový manuál Goldea – klidný, jemný, inspirativní tón. Žádný agresivní marketing.",fileType:"text",size:0,created:Date.now()-86400000*3},
  {id:"kb2",name:"SEO Pravidla",category:"seo",type:"text",content:"H1 jedno, H2 min. 4-6, délka 1200-2000 slov, přirozená KW, FAQ povinné.",fileType:"text",size:0,created:Date.now()-86400000*2},
];

// ─── Tiny UI ──────────────────────────────────────────────────────────────────
const StatusDot = ({status}) => (
  <span style={{display:"inline-flex",alignItems:"center",gap:5,padding:"2px 9px",borderRadius:20,fontSize:11,fontWeight:600,background:STATUS[status]?.bg,color:STATUS[status]?.color,whiteSpace:"nowrap"}}>
    <span style={{width:5,height:5,borderRadius:"50%",background:STATUS[status]?.dot,flexShrink:0}}/>
    {STATUS[status]?.label}
  </span>
);
const TypePill = ({type}) => (
  <span style={{display:"inline-block",padding:"2px 7px",borderRadius:5,fontSize:10,fontWeight:600,background:TYPES[type]?.bg||B.beigeD,color:TYPES[type]?.color||B.gray}}>
    {TYPES[type]?.label||type}
  </span>
);
const Tag = ({label}) => (
  <span style={{display:"inline-block",padding:"1px 6px",borderRadius:4,fontSize:10,fontWeight:500,background:B.beigeD,color:B.gray,marginRight:3,marginBottom:2}}>{label}</span>
);
const Btn = ({children,onClick,variant="ghost",disabled,style:sx={}}) => {
  const v={primary:{background:B.yellow,color:B.black,border:"none",fontWeight:600},ghost:{background:"transparent",color:B.gray,border:`1px solid ${B.grayL}`},danger:{background:"#FFE8E8",color:"#C0392B",border:"none"},icon:{background:"transparent",color:B.gray,border:`1px solid ${B.grayL}`,padding:"4px 8px",fontSize:12}};
  return <button disabled={disabled} style={{fontFamily:"inherit",cursor:disabled?"not-allowed":"pointer",fontSize:13,fontWeight:500,borderRadius:8,padding:"7px 14px",opacity:disabled?.5:1,...v[variant],...sx}} onClick={onClick}>{children}</button>;
};
const FormRow = ({children}) => <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:16}}>{children}</div>;
const Field = ({label,children}) => <div style={{display:"flex",flexDirection:"column",gap:5}}>{label&&<label style={{fontSize:11,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:"0.06em"}}>{label}</label>}{children}</div>;
const inputStyle = {border:`1px solid ${B.grayL}`,borderRadius:8,padding:"9px 12px",fontSize:13,outline:"none",background:B.beige,color:B.black,fontFamily:"inherit",boxSizing:"border-box",width:"100%"};
const Inp = ({label,...p}) => <Field label={label}><input style={inputStyle} {...p}/></Field>;
const Sel = ({label,children,...p}) => <Field label={label}><select style={{...inputStyle,cursor:"pointer"}} {...p}>{children}</select></Field>;
const Textarea = ({label,...p}) => <Field label={label}><textarea style={{...inputStyle,resize:"vertical",minHeight:72}} {...p}/></Field>;

// ─── Modal ────────────────────────────────────────────────────────────────────
const Modal = ({title,onClose,children,footer,wide,extraWide}) => (
  <div style={{position:"fixed",inset:0,background:"rgba(26,26,24,.5)",zIndex:300,display:"flex",alignItems:"center",justifyContent:"center",padding:24}} onClick={e=>e.target===e.currentTarget&&onClose()}>
    <div style={{background:B.white,borderRadius:16,width:"100%",maxWidth:extraWide?1100:wide?800:620,maxHeight:"93vh",overflowY:"auto",boxShadow:"0 20px 60px rgba(0,0,0,.22)"}}>
      <div style={{padding:"20px 28px 16px",borderBottom:`1px solid ${B.grayL}`,display:"flex",justifyContent:"space-between",alignItems:"center",position:"sticky",top:0,background:B.white,zIndex:2}}>
        <span style={{fontSize:17,fontWeight:700,letterSpacing:"-.03em"}}>{title}</span>
        <Btn variant="icon" onClick={onClose}>✕</Btn>
      </div>
      <div style={{padding:"22px 28px"}}>{children}</div>
      {footer&&<div style={{padding:"16px 28px",borderTop:`1px solid ${B.grayL}`,display:"flex",justifyContent:"flex-end",gap:10,position:"sticky",bottom:0,background:B.white}}>{footer}</div>}
    </div>
  </div>
);

const Toast = ({msg,ok}) => (
  <div style={{position:"fixed",bottom:28,right:28,zIndex:999,background:ok?B.black:"#C0392B",color:B.white,padding:"12px 18px",borderRadius:10,fontSize:13,fontWeight:500,boxShadow:"0 8px 32px rgba(0,0,0,.25)",display:"flex",alignItems:"center",gap:8}}>
    {ok?"✓":"✕"} {msg}
  </div>
);

// ─── Article Viewer ───────────────────────────────────────────────────────────
const ArticleViewer = ({article,onClose,onEdit,onGenerate}) => {
  const [copied,setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(article.content||"").then(()=>{setCopied(true);setTimeout(()=>setCopied(false),2000);}); };
  return (
    <Modal title={article.title} onClose={onClose} extraWide
      footer={<>
        <Btn variant="ghost" onClick={copy}>{copied?"✓ Zkopírováno":"📋 Kopírovat text"}</Btn>
        <Btn variant="ghost" onClick={onClose}>Zavřít</Btn>
        <Btn variant="ghost" onClick={()=>{onClose();onEdit(article);}}>✎ Metadata</Btn>
        <Btn variant="primary" onClick={()=>{onClose();onGenerate(article);}}>✨ AI Generátor</Btn>
      </>}>
      <div style={{display:"flex",gap:10,marginBottom:18,flexWrap:"wrap",alignItems:"center"}}>
        <StatusDot status={article.status}/>
        <TypePill type={article.type}/>
        {article.tags.map(t=><Tag key={t} label={t}/>)}
        {article.date&&<span style={{fontSize:12,color:B.gray}}>📅 {fmtDate(article.date)}</span>}
      </div>
      {article.meta?.title&&(
        <div style={{background:B.beigeD,borderRadius:8,padding:"12px 14px",marginBottom:18,fontSize:12}}>
          <div><strong>Meta title:</strong> {article.meta.title} <span style={{color:B.gray}}>({article.meta.title.length} zn.)</span></div>
          <div style={{marginTop:4}}><strong>Meta desc.:</strong> {article.meta.description} <span style={{color:B.gray}}>({article.meta.description?.length||0} zn.)</span></div>
        </div>
      )}
      {article.content?(
        <div style={{fontSize:13,lineHeight:1.85,color:B.black,whiteSpace:"pre-wrap",fontFamily:"inherit"}}>{article.content}</div>
      ):(
        <div style={{padding:"48px 0",textAlign:"center",color:B.gray}}>
          <div style={{fontSize:36,marginBottom:12}}>✍️</div>
          <div style={{fontWeight:600}}>Článek ještě nemá obsah</div>
          <div style={{fontSize:13,marginTop:6}}>Použij AI generátor.</div>
        </div>
      )}
    </Modal>
  );
};

// ─── AI Generator ────────────────────────────────────────────────────────────
const AIGenerator = ({initial,kbItems,onSave,onClose}) => {
  const [form,setForm] = useState({
    title:initial?.title||"",topic:initial?.topic||"",type:initial?.type||"edukativni",
    tags:initial?.tags?.join(", ")||"",date:initial?.date||"",status:initial?.status||"draft",
    notes:initial?.notes||"",kw:"",audience:"",extras:"",
  });
  const [phase,setPhase] = useState("form");
  const [generated,setGenerated] = useState(initial?.content||"");
  const [meta,setMeta] = useState(initial?.meta||{title:"",description:""});
  const [error,setError] = useState("");

  const set = (k,v) => setForm(f=>({...f,[k]:v}));

  // Build system prompt with KB context
  const buildSystem = () => {
    let system = GOLDEA_BASE_SYSTEM;
    const relevant = kbItems.filter(k=>k.content&&k.content.length>10);
    if (relevant.length>0) {
      system += "\n\n=== ZNALOSTNÍ BÁZE (nahrané podklady) ===\n";
      relevant.forEach(k=>{
        system += `\n--- ${k.name} (${KB_CATS[k.category]?.label||k.category}) ---\n`;
        system += k.content.slice(0,3000);
        system += "\n";
      });
      system += "\nPoužívej tyto podklady jako referenci při psaní článku.";
    }
    return system;
  };

  const buildPrompt = () => {
    const typeLabel = TYPES[form.type]?.label||form.type;
    return `Napiš kompletní SEO článek pro blog Goldea.cz.

ZADÁNÍ:
- Název / H1: ${form.title}
- Téma: ${form.topic||form.title}
- Typ článku: ${typeLabel}
- Hlavní klíčové slovo: ${form.kw||form.title}
- Tagy / sekundární KW: ${form.tags||"—"}
- Cílová skupina: ${form.audience||"ženy 25–45 let, zákaznice se zájmem o útulný domov a bytový textil"}
${form.extras?`- Speciální pokyny: ${form.extras}`:""}

Napiš celý, publikovatelný článek (min. 1400 slov) přesně podle brand voice Goldea a SEO pravidel z briefu.`;
  };

  const generate = async () => {
    if (!form.title.trim()) { setError("Vyplň název článku."); return; }
    setError(""); setPhase("generating"); setGenerated(""); setMeta({title:"",description:""});
    try {
      const data = await callClaude(buildSystem(), buildPrompt());
      const raw = data.content?.[0]?.text||"";
      const metaMatch = raw.match(/---META---([\s\S]*?)---KONEC META---/);
      let text = raw; let pm = {title:"",description:""};
      if (metaMatch) {
        const mb = metaMatch[1];
        pm = { title:(mb.match(/title:\s*(.+)/)?.[1]||"").trim(), description:(mb.match(/description:\s*(.+)/)?.[1]||"").trim() };
        text = raw.replace(/---META---([\s\S]*?)---KONEC META---/,"").trim();
      }
      setGenerated(text); setMeta(pm); setPhase("done");
    } catch(e) {
      setError("Generování selhalo: "+e.message); setPhase("form");
    }
  };

  const handleSave = (status="draft") => {
    const tags = form.tags.split(",").map(t=>t.trim()).filter(Boolean);
    onSave({id:initial?.id||genId(),title:form.title,topic:form.topic,type:form.type,tags,date:form.date,status,notes:form.notes,content:generated,meta});
  };

  const activeKb = kbItems.filter(k=>k.content&&k.content.length>10);

  return (
    <Modal title={initial?.content?"Přegenerovat článek":"✨ Vytvořit článek s AI"} onClose={onClose} extraWide
      footer={phase==="done"?(
        <><Btn variant="ghost" onClick={()=>setPhase("form")}>← Upravit zadání</Btn>
          <Btn variant="ghost" onClick={()=>handleSave("draft")}>Uložit jako Draft</Btn>
          <Btn variant="primary" onClick={()=>handleSave("pripraveno")}>Uložit jako Připraveno</Btn></>
      ):phase==="form"?(
        <><Btn variant="ghost" onClick={onClose}>Zrušit</Btn>
          <Btn variant="primary" onClick={generate}>✨ Vygenerovat článek</Btn></>
      ):null}>

      {phase!=="done"&&(
        <div style={{display:"flex",flexDirection:"column",gap:18}}>
          {error&&<div style={{background:"#FFE8E8",color:"#C0392B",padding:"10px 14px",borderRadius:8,fontSize:13}}>{error}</div>}

          {/* KB status */}
          <div style={{background:activeKb.length>0?B.green+"40":B.beigeD,borderRadius:8,padding:"10px 14px",fontSize:12,color:activeKb.length>0?"#2D7A4A":B.gray}}>
            {activeKb.length>0
              ? `✓ AI bude pracovat s ${activeKb.length} dokumenty ze Znalostní báze`
              : "ℹ️ Znalostní báze je prázdná – AI bude používat pouze výchozí brand pravidla Goldea"}
          </div>

          {/* Info */}
          <div style={{background:B.yellowPale,borderRadius:8,padding:"12px 14px",fontSize:13,color:"#7A6000",lineHeight:1.6}}>
            <strong>Jak to funguje:</strong> Vyplň základní info → AI vygeneruje kompletní SEO článek ve stylu Goldea včetně meta dat. Čím více dokumentů nahraješ do Znalostní báze, tím přesnější bude výstup.
          </div>

          <div style={{display:"flex",gap:24}}>
            {/* Left col */}
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontSize:11,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:"0.06em"}}>Základní údaje</div>
              <Inp label="Název článku (H1) *" value={form.title} onChange={e=>set("title",e.target.value)} placeholder="Jak pečovat o mušelínové povlečení..."/>
              <FormRow>
                <Inp label="Téma" value={form.topic} onChange={e=>set("topic",e.target.value)} placeholder="Péče o textil"/>
                <Sel label="Typ článku" value={form.type} onChange={e=>set("type",e.target.value)}>
                  {Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </Sel>
              </FormRow>
              <Inp label="Tagy (oddělené čárkou)" value={form.tags} onChange={e=>set("tags",e.target.value)} placeholder="mušelín, péče, letní, ložnice"/>
              <FormRow>
                <Inp label="Datum publikace" type="date" value={form.date} onChange={e=>set("date",e.target.value)}/>
                <Sel label="Počáteční stav" value={form.status} onChange={e=>set("status",e.target.value)}>
                  {Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
                </Sel>
              </FormRow>
              <Textarea label="Interní poznámky" value={form.notes} onChange={e=>set("notes",e.target.value)} placeholder="Poznámky pro redakci (neposílají se do AI)" style={{minHeight:56}}/>
            </div>

            {/* Right col */}
            <div style={{flex:1,display:"flex",flexDirection:"column",gap:14}}>
              <div style={{fontSize:11,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:"0.06em"}}>SEO & AI pokyny</div>
              <Inp label="Hlavní klíčové slovo" value={form.kw} onChange={e=>set("kw",e.target.value)} placeholder="mušelínové povlečení (výchozí = název)"/>
              <Inp label="Cílová skupina" value={form.audience} onChange={e=>set("audience",e.target.value)} placeholder="ženy 25–45 let, zájem o bytový textil"/>
              <Textarea label="Extra pokyny pro AI" value={form.extras} onChange={e=>set("extras",e.target.value)} placeholder="Zaměř se na srovnání s bavlnou, zmiň péči při praní, přidej tipy na kombinace..."/>

              {/* KB summary */}
              {activeKb.length>0&&(
                <div style={{background:B.beigeD,borderRadius:8,padding:"10px 12px"}}>
                  <div style={{fontSize:11,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:"0.05em",marginBottom:8}}>Dokumenty v kontextu</div>
                  {activeKb.map(k=>(
                    <div key={k.id} style={{fontSize:11,color:B.gray,display:"flex",alignItems:"center",gap:6,marginBottom:4}}>
                      <span>{KB_CATS[k.category]?.icon||"📄"}</span>
                      <span>{k.name}</span>
                      <span style={{color:B.grayL}}>({KB_CATS[k.category]?.label})</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {phase==="generating"&&(
        <div style={{padding:"64px 0",textAlign:"center"}}>
          <div style={{fontSize:44,marginBottom:20,display:"inline-block",animation:"spin 1.4s linear infinite"}}>✨</div>
          <div style={{fontSize:16,fontWeight:600,marginBottom:8}}>Generuji článek...</div>
          <div style={{fontSize:13,color:B.gray}}>AI píše SEO článek ve stylu Goldea včetně meta dat. Může to trvat 20–40 sekund.</div>
          <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
        </div>
      )}

      {phase==="done"&&(
        <div>
          {meta.title&&(
            <div style={{background:B.beigeD,borderRadius:10,padding:"14px 16px",marginBottom:18}}>
              <div style={{fontSize:11,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:"0.06em",marginBottom:8}}>Meta data</div>
              <div style={{fontSize:13,marginBottom:4}}>
                <strong>Title:</strong> {meta.title}
                <span style={{marginLeft:8,fontSize:11,color:meta.title.length>60?"#C0392B":B.gray}}>({meta.title.length} zn.)</span>
              </div>
              <div style={{fontSize:13}}>
                <strong>Popis:</strong> {meta.description}
                <span style={{marginLeft:8,fontSize:11,color:(meta.description?.length||0)>160?"#C0392B":B.gray}}>({meta.description?.length||0} zn.)</span>
              </div>
            </div>
          )}
          <div style={{background:B.green+"30",borderRadius:8,padding:"8px 14px",fontSize:12,color:"#2D7A4A",marginBottom:16}}>
            ✓ Vygenerováno · cca {generated.split(/\s+/).length} slov
          </div>
          <div style={{fontSize:13,lineHeight:1.9,color:B.black,whiteSpace:"pre-wrap",fontFamily:"inherit",maxHeight:520,overflowY:"auto",border:`1px solid ${B.grayL}`,borderRadius:10,padding:"18px 20px"}}>
            {generated}
          </div>
        </div>
      )}
    </Modal>
  );
};

// ─── Meta Edit ────────────────────────────────────────────────────────────────
const MetaEdit = ({article,onSave,onClose}) => {
  const [f,setF] = useState({...article,tagsStr:article.tags?.join(", ")||""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Modal title="Upravit metadata" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Zrušit</Btn><Btn variant="primary" onClick={()=>{const tags=f.tagsStr.split(",").map(t=>t.trim()).filter(Boolean);onSave({...f,tags});}}>Uložit</Btn></>}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Inp label="Název" value={f.title} onChange={e=>set("title",e.target.value)}/>
        <FormRow><Inp label="Téma" value={f.topic} onChange={e=>set("topic",e.target.value)}/><Sel label="Typ" value={f.type} onChange={e=>set("type",e.target.value)}>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel></FormRow>
        <FormRow><Sel label="Stav" value={f.status} onChange={e=>set("status",e.target.value)}>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}</Sel><Inp label="Datum" type="date" value={f.date} onChange={e=>set("date",e.target.value)}/></FormRow>
        <Inp label="Tagy (čárkou)" value={f.tagsStr} onChange={e=>set("tagsStr",e.target.value)}/>
        <Textarea label="Poznámky" value={f.notes} onChange={e=>set("notes",e.target.value)}/>
      </div>
    </Modal>
  );
};

const DeleteConfirm = ({article,onConfirm,onClose}) => (
  <Modal title="Smazat článek?" onClose={onClose}
    footer={<><Btn variant="ghost" onClick={onClose}>Ne</Btn><Btn variant="danger" onClick={onConfirm}>Ano, smazat</Btn></>}>
    <p style={{fontSize:14,color:B.gray}}>Opravdu smazat <strong style={{color:B.black}}>„{article.title}"</strong>? Nelze vrátit.</p>
  </Modal>
);

// ─── Knowledge Base ───────────────────────────────────────────────────────────
const KnowledgeBase = ({items,onAdd,onDelete,onEdit}) => {
  const [uploading,setUploading] = useState(false);
  const [dragOver,setDragOver] = useState(false);
  const [addModal,setAddModal] = useState(false);
  const [editItem,setEditItem] = useState(null);
  const [filterCat,setFilterCat] = useState("");
  const fileRef = useRef();

  const handleFiles = async (files) => {
    setUploading(true);
    for (const file of Array.from(files)) {
      try {
        const content = await extractText(file);
        const ext = file.name.split(".").pop().toLowerCase();
        const isImage = file.type.startsWith("image/");
        onAdd({
          id: genId(),
          name: file.name.replace(/\.[^.]+$/,""),
          category: "ostatni",
          type: isImage?"image":"document",
          fileType: ext,
          content: isImage?"":content,
          imageUrl: isImage ? URL.createObjectURL(file) : null,
          size: file.size,
          created: Date.now(),
        });
      } catch(e) { console.error(e); }
    }
    setUploading(false);
  };

  const filtered = filterCat ? items.filter(i=>i.category===filterCat) : items;

  const fileIcons = {txt:"📄",md:"📝",docx:"📘",xlsx:"📊",xls:"📊",csv:"📊",pdf:"📕",image:"🖼️",text:"✏️"};
  const getIcon = i => i.type==="image"?"🖼️":fileIcons[i.fileType]||"📄";

  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:20}}>
        <h2 style={{fontSize:20,fontWeight:700,letterSpacing:"-.04em"}}>
          Znalostní báze
          <span style={{fontSize:13,color:B.gray,fontWeight:400,marginLeft:8}}>{items.length} dokumentů</span>
        </h2>
        <div style={{display:"flex",gap:10}}>
          <button onClick={()=>fileRef.current?.click()}
            style={{padding:"7px 14px",borderRadius:8,border:`1px solid ${B.grayL}`,background:B.white,cursor:"pointer",fontSize:13,color:B.gray,fontFamily:"inherit"}}>
            📎 Nahrát soubor
          </button>
          <Btn variant="primary" onClick={()=>setAddModal(true)}>+ Přidat text</Btn>
        </div>
        <input ref={fileRef} type="file" multiple accept=".txt,.md,.docx,.xlsx,.xls,.csv,.pdf,.png,.jpg,.jpeg,.webp" style={{display:"none"}} onChange={e=>handleFiles(e.target.files)}/>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={e=>{e.preventDefault();setDragOver(true);}}
        onDragLeave={()=>setDragOver(false)}
        onDrop={e=>{e.preventDefault();setDragOver(false);handleFiles(e.dataTransfer.files);}}
        style={{border:`2px dashed ${dragOver?B.yellow:B.grayL}`,borderRadius:12,padding:"28px 24px",textAlign:"center",marginBottom:20,background:dragOver?B.yellowPale:B.beigeD,transition:"all .2s",cursor:"pointer"}}
        onClick={()=>fileRef.current?.click()}>
        <div style={{fontSize:28,marginBottom:8}}>{uploading?"⏳":"📂"}</div>
        <div style={{fontSize:14,fontWeight:600,color:B.black,marginBottom:4}}>
          {uploading?"Nahrávám a zpracovávám...":"Přetáhni soubory sem nebo klikni"}
        </div>
        <div style={{fontSize:12,color:B.gray}}>Podporované formáty: .txt, .md, .docx, .xlsx, .csv, .pdf, obrázky (.png, .jpg, .webp)</div>
      </div>

      {/* Info banner */}
      <div style={{background:B.green+"40",borderRadius:8,padding:"10px 14px",fontSize:12,color:"#1A5C35",marginBottom:18,lineHeight:1.6}}>
        <strong>Jak Znalostní báze funguje:</strong> Každý nahraný dokument je automaticky přidán do kontextu AI generátoru. Čím více relevantních podkladů přidáš (brand manuál, produktové listy, inspirační texty), tím přesnější a autentičtější budou generované články.
      </div>

      {/* Filter */}
      <div style={{display:"flex",gap:8,marginBottom:16,flexWrap:"wrap"}}>
        <button onClick={()=>setFilterCat("")} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${!filterCat?B.yellow:B.grayL}`,background:!filterCat?B.yellowPale:"transparent",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:!filterCat?600:400,color:!filterCat?"#7A6000":B.gray}}>
          Vše ({items.length})
        </button>
        {Object.entries(KB_CATS).map(([k,v])=>{
          const count = items.filter(i=>i.category===k).length;
          if(count===0)return null;
          return <button key={k} onClick={()=>setFilterCat(k)} style={{padding:"5px 12px",borderRadius:20,border:`1px solid ${filterCat===k?B.yellow:B.grayL}`,background:filterCat===k?B.yellowPale:"transparent",fontSize:12,cursor:"pointer",fontFamily:"inherit",fontWeight:filterCat===k?600:400,color:filterCat===k?"#7A6000":B.gray}}>
            {v.icon} {v.label} ({count})
          </button>;
        })}
      </div>

      {/* Items grid */}
      {filtered.length===0?(
        <div style={{padding:"48px 0",textAlign:"center",color:B.gray}}>
          <div style={{fontSize:36,marginBottom:10}}>📚</div>
          <div style={{fontWeight:600}}>Znalostní báze je prázdná</div>
          <div style={{fontSize:13,marginTop:6}}>Nahraj brand manuál, SEO pravidla, produktové listy nebo jakékoli podklady pro AI.</div>
        </div>
      ):(
        <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",gap:12}}>
          {filtered.map(item=>(
            <div key={item.id} style={{background:B.white,borderRadius:10,padding:"14px 16px",border:`1px solid ${B.grayL}`,display:"flex",flexDirection:"column",gap:8}}>
              <div style={{display:"flex",alignItems:"flex-start",justifyContent:"space-between",gap:8}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flex:1,minWidth:0}}>
                  <span style={{fontSize:22,flexShrink:0}}>{getIcon(item)}</span>
                  <div style={{minWidth:0}}>
                    <div style={{fontWeight:600,fontSize:13,lineHeight:1.3,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{item.name}</div>
                    <div style={{fontSize:10,color:B.gray,marginTop:2}}>{item.fileType?.toUpperCase()||"TEXT"} · {item.size?fmtFileSize(item.size):"vlastní text"}</div>
                  </div>
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button onClick={()=>setEditItem(item)} style={{padding:"3px 7px",borderRadius:5,border:`1px solid ${B.grayL}`,background:"transparent",cursor:"pointer",fontSize:11,color:B.gray}}>✎</button>
                  <button onClick={()=>onDelete(item.id)} style={{padding:"3px 7px",borderRadius:5,border:"1px solid #C0392B",background:"transparent",cursor:"pointer",fontSize:11,color:"#C0392B"}}>✕</button>
                </div>
              </div>

              {/* Category selector */}
              <select value={item.category} onChange={e=>onEdit({...item,category:e.target.value})}
                style={{border:`1px solid ${B.grayL}`,borderRadius:6,padding:"4px 8px",fontSize:11,background:B.beige,color:B.gray,cursor:"pointer",outline:"none",fontFamily:"inherit"}}>
                {Object.entries(KB_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
              </select>

              {item.type==="image"&&item.imageUrl&&(
                <img src={item.imageUrl} alt={item.name} style={{width:"100%",height:100,objectFit:"cover",borderRadius:6}}/>
              )}

              {item.content&&item.type!=="image"&&(
                <div style={{fontSize:11,color:B.gray,lineHeight:1.5,maxHeight:56,overflow:"hidden",WebkitLineClamp:3,display:"-webkit-box",WebkitBoxOrient:"vertical"}}>
                  {item.content.slice(0,200)}...
                </div>
              )}

              <div style={{fontSize:10,color:B.grayL}}>
                Přidáno {new Date(item.created).toLocaleDateString("cs-CZ")}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add text modal */}
      {addModal&&(
        <AddTextModal onSave={d=>{onAdd({...d,id:genId(),type:"text",fileType:"text",size:0,created:Date.now()});setAddModal(false);}} onClose={()=>setAddModal(false)}/>
      )}
      {editItem&&(
        <EditKbModal item={editItem} onSave={d=>{onEdit(d);setEditItem(null);}} onClose={()=>setEditItem(null)}/>
      )}
    </div>
  );
};

const AddTextModal = ({onSave,onClose}) => {
  const [f,setF] = useState({name:"",category:"brand",content:""});
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Modal title="Přidat text / poznámku" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Zrušit</Btn><Btn variant="primary" onClick={()=>{if(f.name&&f.content)onSave(f);}}>Přidat</Btn></>}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Inp label="Název dokumentu" value={f.name} onChange={e=>set("name",e.target.value)} placeholder="Brand pravidla, Produktový list, Inspirace..."/>
        <Sel label="Kategorie" value={f.category} onChange={e=>set("category",e.target.value)}>
          {Object.entries(KB_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </Sel>
        <Field label="Obsah">
          <textarea value={f.content} onChange={e=>set("content",e.target.value)}
            style={{...inputStyle,minHeight:220,resize:"vertical"}}
            placeholder="Vlož text, pravidla, produktové popisy, inspiraci, pokyny..."/>
        </Field>
      </div>
    </Modal>
  );
};

const EditKbModal = ({item,onSave,onClose}) => {
  const [f,setF] = useState(item);
  const set=(k,v)=>setF(p=>({...p,[k]:v}));
  return (
    <Modal title="Upravit dokument" onClose={onClose}
      footer={<><Btn variant="ghost" onClick={onClose}>Zrušit</Btn><Btn variant="primary" onClick={()=>onSave(f)}>Uložit</Btn></>}>
      <div style={{display:"flex",flexDirection:"column",gap:16}}>
        <Inp label="Název" value={f.name} onChange={e=>set("name",e.target.value)}/>
        <Sel label="Kategorie" value={f.category} onChange={e=>set("category",e.target.value)}>
          {Object.entries(KB_CATS).map(([k,v])=><option key={k} value={k}>{v.icon} {v.label}</option>)}
        </Sel>
        {f.type!=="image"&&(
          <Field label="Obsah">
            <textarea value={f.content||""} onChange={e=>set("content",e.target.value)} style={{...inputStyle,minHeight:200,resize:"vertical"}}/>
          </Field>
        )}
      </div>
    </Modal>
  );
};

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = ({articles,onGenerate,onEdit,onView,onDelete,onStatus,onNew}) => {
  const [search,setSearch]=useState(""); const [fType,setFType]=useState(""); const [fStatus,setFStatus]=useState(""); const [hov,setHov]=useState(null);
  const next=s=>STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(s)+1,STATUS_ORDER.length-1)];
  const filtered = articles.filter(a=>{const q=search.toLowerCase();return(!q||a.title.toLowerCase().includes(q)||a.topic?.toLowerCase().includes(q)||a.tags?.some(t=>t.toLowerCase().includes(q)))&&(!fType||a.type===fType)&&(!fStatus||a.status===fStatus);});
  const counts = Object.keys(STATUS).reduce((acc,k)=>{acc[k]=articles.filter(a=>a.status===k).length;return acc;},{});
  const col="2.5fr 1fr 0.9fr 1fr 1fr 1fr 0.85fr";
  return (
    <div>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12,marginBottom:20}}>
        {[{n:articles.length,l:"Celkem článků",a:B.grayL},{n:counts.pripraveno,l:"Čeká na schválení",a:STATUS.pripraveno.dot},{n:counts.schvaleno,l:"Schváleno",a:STATUS.schvaleno.dot},{n:counts.publikovano,l:"Publikováno",a:STATUS.publikovano.dot}].map((s,i)=>(
          <div key={i} style={{background:B.white,borderRadius:10,padding:"14px 18px",borderLeft:`3px solid ${s.a}`}}>
            <div style={{fontSize:26,fontWeight:700,letterSpacing:"-.04em",lineHeight:1}}>{s.n}</div>
            <div style={{fontSize:11,color:B.gray,marginTop:3,fontWeight:500}}>{s.l}</div>
          </div>
        ))}
      </div>
      <div style={{background:B.white,borderRadius:10,padding:"11px 16px",display:"flex",gap:10,alignItems:"center",marginBottom:14,flexWrap:"wrap"}}>
        <span style={{fontSize:11,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:".06em",flexShrink:0}}>Filtr</span>
        <input style={{flex:1,minWidth:160,border:`1px solid ${B.grayL}`,borderRadius:7,padding:"6px 10px",fontSize:13,outline:"none",background:B.beige,color:B.black,fontFamily:"inherit"}} placeholder="Hledej název, téma, tag…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select style={{border:`1px solid ${B.grayL}`,borderRadius:7,padding:"6px 8px",fontSize:13,background:B.beige,color:B.black,cursor:"pointer",outline:"none",fontFamily:"inherit"}} value={fType} onChange={e=>setFType(e.target.value)}>
          <option value="">Všechny typy</option>{Object.entries(TYPES).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        <select style={{border:`1px solid ${B.grayL}`,borderRadius:7,padding:"6px 8px",fontSize:13,background:B.beige,color:B.black,cursor:"pointer",outline:"none",fontFamily:"inherit"}} value={fStatus} onChange={e=>setFStatus(e.target.value)}>
          <option value="">Všechny stavy</option>{Object.entries(STATUS).map(([k,v])=><option key={k} value={k}>{v.label}</option>)}
        </select>
        {(search||fType||fStatus)&&<Btn variant="ghost" style={{fontSize:12,padding:"5px 10px"}} onClick={()=>{setSearch("");setFType("");setFStatus("");}}>Zrušit</Btn>}
        <div style={{flex:1}}/>
        <Btn variant="primary" onClick={onNew}>✨ Nový článek s AI</Btn>
      </div>
      <div style={{background:B.white,borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"grid",gridTemplateColumns:col,padding:"8px 16px",background:B.beigeD,borderBottom:`1px solid ${B.grayL}`,gap:8}}>
          {["Název","Téma","Typ","Tagy","Stav","Datum","Akce"].map(h=><div key={h} style={{fontSize:10,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:".07em"}}>{h}</div>)}
        </div>
        {filtered.length===0?(
          <div style={{padding:"48px 0",textAlign:"center",color:B.gray}}>
            <div style={{fontSize:32,marginBottom:10}}>📄</div>
            <div style={{fontWeight:600}}>Žádné články</div>
            <div style={{fontSize:13,marginTop:4,color:B.grayL}}>Přidej nový nebo uprav filtry.</div>
          </div>
        ):filtered.map(a=>{
          const days=daysUntil(a.date);
          return (
            <div key={a.id} style={{display:"grid",gridTemplateColumns:col,padding:"11px 16px",borderBottom:`1px solid ${B.beigeD}`,gap:8,alignItems:"center",background:hov===a.id?B.beige:B.white,transition:"background .1s"}} onMouseEnter={()=>setHov(a.id)} onMouseLeave={()=>setHov(null)}>
              <div onClick={()=>onView(a)} style={{cursor:"pointer"}}>
                <div style={{fontWeight:600,fontSize:13,lineHeight:1.4}}>{a.title}{a.content&&<span style={{marginLeft:5,fontSize:9,background:B.green+"80",color:"#2D7A4A",borderRadius:3,padding:"1px 4px"}}>✓ text</span>}</div>
                {a.notes&&<div style={{fontSize:11,color:B.gray,marginTop:1}}>{a.notes}</div>}
              </div>
              <div style={{fontSize:12,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{a.topic||"—"}</div>
              <div><TypePill type={a.type}/></div>
              <div style={{overflow:"visible",whiteSpace:"normal"}}>{a.tags?.slice(0,2).map(t=><Tag key={t} label={t}/>)}</div>
              <div style={{cursor:"pointer"}} onClick={()=>onStatus(a.id,next(a.status))} title="Klikni pro posun do dalšího stavu"><StatusDot status={a.status}/></div>
              <div>
                <div style={{fontSize:12,fontWeight:500}}>{fmtDate(a.date)}</div>
                {a.date&&days!==null&&<div style={{fontSize:10,marginTop:1,color:days<0?"#C0392B":days<7?"#B5510A":B.gray}}>{days<0?`před ${Math.abs(days)} d.`:days===0?"dnes":`za ${days} d.`}</div>}
              </div>
              <div style={{display:"flex",gap:4}}>
                <button style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${B.grayL}`,background:"transparent",cursor:"pointer",fontSize:11,color:B.gray}} title="AI generátor" onClick={()=>onGenerate(a)}>✨</button>
                <button style={{padding:"3px 7px",borderRadius:6,border:`1px solid ${B.grayL}`,background:"transparent",cursor:"pointer",fontSize:11,color:B.gray}} title="Upravit" onClick={()=>onEdit(a)}>✎</button>
                <button style={{padding:"3px 7px",borderRadius:6,border:"1px solid #C0392B",background:"transparent",cursor:"pointer",fontSize:11,color:"#C0392B"}} title="Smazat" onClick={()=>onDelete(a)}>✕</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Pipeline ─────────────────────────────────────────────────────────────────
const Pipeline = ({articles,onView,onStatus,onGenerate}) => {
  const next=s=>STATUS_ORDER[Math.min(STATUS_ORDER.indexOf(s)+1,STATUS_ORDER.length-1)];
  return (
    <div>
      <h2 style={{fontSize:20,fontWeight:700,letterSpacing:"-.04em",marginBottom:18}}>Workflow pipeline</h2>
      <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:12}}>
        {STATUS_ORDER.map(s=>{
          const items=articles.filter(a=>a.status===s);
          return (
            <div key={s} style={{background:B.beigeD,borderRadius:10,padding:10,minHeight:260}}>
              <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:9,paddingBottom:8,borderBottom:`1px solid ${B.grayL}`}}>
                <span style={{fontSize:10,fontWeight:700,textTransform:"uppercase",letterSpacing:".07em",color:STATUS[s].color}}>{STATUS[s].label}</span>
                <span style={{fontSize:10,fontWeight:700,color:B.gray,background:B.white,borderRadius:10,padding:"1px 6px"}}>{items.length}</span>
              </div>
              {items.length===0&&<div style={{fontSize:11,color:B.grayL,textAlign:"center",paddingTop:18}}>Prázdno</div>}
              {items.map(a=>(
                <div key={a.id} style={{background:B.white,borderRadius:8,padding:"10px 12px",marginBottom:7,boxShadow:"0 1px 3px rgba(0,0,0,.05)",cursor:"pointer"}} onClick={()=>onView(a)}>
                  <div style={{fontSize:12,fontWeight:600,lineHeight:1.4,marginBottom:5}}>{a.title}{a.content&&<span style={{marginLeft:4,fontSize:9,background:B.green+"80",color:"#2D7A4A",borderRadius:3,padding:"1px 4px"}}>✓</span>}</div>
                  <TypePill type={a.type}/>
                  {a.date&&<div style={{fontSize:10,color:B.gray,marginTop:5}}>📅 {fmtDate(a.date)}</div>}
                  <div style={{display:"flex",gap:5,marginTop:7}}>
                    <button style={{flex:1,padding:"3px 0",borderRadius:5,border:`1px solid ${B.grayL}`,background:"transparent",fontSize:10,cursor:"pointer",color:B.gray,fontFamily:"inherit"}} onClick={e=>{e.stopPropagation();onGenerate(a);}}>✨ AI</button>
                    {s!=="publikovano"&&<button style={{flex:1,padding:"3px 0",borderRadius:5,border:`1px solid ${STATUS[next(s)].color}`,background:"transparent",fontSize:10,cursor:"pointer",color:STATUS[next(s)].color,fontFamily:"inherit"}} onClick={e=>{e.stopPropagation();onStatus(a.id,next(s));}}>→ {STATUS[next(s)].label}</button>}
                  </div>
                </div>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ─── Calendar (fully functional) ──────────────────────────────────────────────
const CalendarView = ({articles,onView}) => {
  const now=new Date();
  const [cur,setCur]=useState({y:now.getFullYear(),m:now.getMonth()});
  const prev=()=>setCur(c=>c.m===0?{y:c.y-1,m:11}:{y:c.y,m:c.m-1});
  const next=()=>setCur(c=>c.m===11?{y:c.y+1,m:0}:{y:c.y,m:c.m+1});
  const cells=buildCalMatrix(cur.y,cur.m);
  const todayStr=`${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,"0")}-${String(now.getDate()).padStart(2,"0")}`;
  const byDate={};
  articles.forEach(a=>{if(a.date){if(!byDate[a.date])byDate[a.date]=[];byDate[a.date].push(a);}});
  const monthKey=`${cur.y}-${String(cur.m+1).padStart(2,"0")}`;
  const monthCount=articles.filter(a=>a.date?.startsWith(monthKey)).length;
  return (
    <div>
      <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",marginBottom:18}}>
        <h2 style={{fontSize:20,fontWeight:700,letterSpacing:"-.04em"}}>Redakční kalendář</h2>
        <div style={{fontSize:13,color:B.gray}}>{monthCount} článků v tomto měsíci</div>
      </div>
      <div style={{background:B.white,borderRadius:10,overflow:"hidden"}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"16px 20px 14px",borderBottom:`1px solid ${B.grayL}`}}>
          <button style={{width:30,height:30,borderRadius:7,border:`1px solid ${B.grayL}`,background:"transparent",cursor:"pointer",fontSize:14,color:B.gray}} onClick={prev}>‹</button>
          <span style={{fontSize:16,fontWeight:700,letterSpacing:"-.03em"}}>{MONTH_CZ[cur.m]} {cur.y}</span>
          <button style={{width:30,height:30,borderRadius:7,border:`1px solid ${B.grayL}`,background:"transparent",cursor:"pointer",fontSize:14,color:B.gray}} onClick={next}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",background:B.beigeD,borderBottom:`1px solid ${B.grayL}`}}>
          {DAY_CZ.map(d=><div key={d} style={{textAlign:"center",fontSize:10,fontWeight:700,color:B.gray,textTransform:"uppercase",letterSpacing:".06em",padding:"7px 0"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",borderLeft:`1px solid ${B.grayL}`}}>
          {cells.map((day,i)=>{
            if(!day)return <div key={i} style={{minHeight:90,borderRight:`1px solid ${B.grayL}`,borderBottom:`1px solid ${B.grayL}`,background:B.beigeD,opacity:.4}}/>;
            const ds=`${cur.y}-${String(cur.m+1).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const isToday=ds===todayStr;
            const dayArts=byDate[ds]||[];
            return (
              <div key={i} style={{minHeight:90,borderRight:`1px solid ${B.grayL}`,borderBottom:`1px solid ${B.grayL}`,padding:"6px 6px 4px",background:isToday?"#FFFBE8":B.white}}>
                <div style={{fontSize:12,marginBottom:4,display:"inline-flex",alignItems:"center",justifyContent:"center",width:22,height:22,borderRadius:"50%",background:isToday?B.yellow:"transparent",fontWeight:isToday?700:400,color:isToday?B.black:B.gray}}>{day}</div>
                {dayArts.map(a=>(
                  <div key={a.id} onClick={()=>onView(a)} title={a.title} style={{display:"block",padding:"2px 5px",borderRadius:4,fontSize:9,fontWeight:500,marginBottom:2,overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap",cursor:"pointer",background:STATUS[a.status]?.bg,color:STATUS[a.status]?.color}}>
                    {a.title}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
        <div style={{padding:"10px 20px",borderTop:`1px solid ${B.grayL}`,display:"flex",gap:14,flexWrap:"wrap"}}>
          {Object.entries(STATUS).map(([k,v])=>(
            <div key={k} style={{display:"flex",alignItems:"center",gap:5}}>
              <span style={{width:10,height:10,borderRadius:2,background:v.bg,border:`1px solid ${v.dot}`,flexShrink:0,display:"inline-block"}}/>
              <span style={{fontSize:11,color:B.gray}}>{v.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// ─── ROOT APP ─────────────────────────────────────────────────────────────────
export default function GoldeaContentHub() {
  const [articles,setArticles] = useState(()=>{try{const s=localStorage.getItem("goldea_articles_v3");return s?JSON.parse(s):SEED_ARTICLES;}catch{return SEED_ARTICLES;}});
  const [kbItems,setKbItems]   = useState(()=>{try{const s=localStorage.getItem("goldea_kb_v1");return s?JSON.parse(s):SEED_KB;}catch{return SEED_KB;}});
  const [view,setView]   = useState("dashboard");
  const [modal,setModal] = useState(null);
  const [toast,setToast] = useState(null);

  useEffect(()=>{try{localStorage.setItem("goldea_articles_v3",JSON.stringify(articles));}catch{};},[articles]);
  useEffect(()=>{try{localStorage.setItem("goldea_kb_v1",JSON.stringify(kbItems));}catch{};},[kbItems]);

  const showToast = useCallback((msg,ok=true)=>{setToast({msg,ok});setTimeout(()=>setToast(null),2800);},[]);

  const saveArticle = useCallback(a=>{
    setArticles(p=>{const e=p.find(x=>x.id===a.id);return e?p.map(x=>x.id===a.id?a:x):[a,...p];});
    setModal(null); showToast(a.content?"Článek vygenerován a uložen ✓":"Uloženo ✓");
  },[showToast]);

  const deleteArticle = useCallback(a=>{setArticles(p=>p.filter(x=>x.id!==a.id));setModal(null);showToast("Smazáno.");},[showToast]);
  const changeStatus  = useCallback((id,s)=>{setArticles(p=>p.map(a=>a.id===id?{...a,status:s}:a));showToast(`Stav: ${STATUS[s]?.label}`);},[showToast]);

  const addKb    = useCallback(item=>{setKbItems(p=>[item,...p]);showToast("Dokument přidán do Znalostní báze.");},[showToast]);
  const deleteKb = useCallback(id=>{setKbItems(p=>p.filter(i=>i.id!==id));showToast("Dokument odstraněn.");},[showToast]);
  const editKb   = useCallback(item=>{setKbItems(p=>p.map(i=>i.id===item.id?item:i));},[]);

  const TABS=[{id:"dashboard",label:"📋 Přehled"},{id:"pipeline",label:"⚡ Pipeline"},{id:"calendar",label:"📅 Kalendář"},{id:"kb",label:"📚 Znalostní báze"}];

  return (
    <div style={{minHeight:"100vh",background:B.beige,fontFamily:"Inter,'Helvetica Neue',Arial,sans-serif",color:B.black}}>
      <header style={{background:B.white,borderBottom:`1px solid ${B.grayL}`,padding:"0 28px",display:"flex",alignItems:"center",justifyContent:"space-between",height:54,position:"sticky",top:0,zIndex:100}}>
        <div style={{display:"flex",alignItems:"center",gap:8}}>
          <div style={{width:26,height:26,background:B.yellow,borderRadius:"50%",display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:700}}>G</div>
          <span style={{fontWeight:700,fontSize:14,letterSpacing:"-.02em"}}>Goldea</span>
          <span style={{fontSize:11,color:B.gray,marginLeft:1}}>Content Hub</span>
        </div>
        <nav style={{display:"flex",gap:2}}>
          {TABS.map(t=>(
            <button key={t.id} style={{padding:"5px 13px",borderRadius:7,border:"none",fontFamily:"inherit",cursor:"pointer",fontSize:12,background:view===t.id?B.yellow:"transparent",color:view===t.id?B.black:B.gray,fontWeight:view===t.id?600:400}} onClick={()=>setView(t.id)}>{t.label}</button>
          ))}
        </nav>
        <div style={{width:160,display:"flex",justifyContent:"flex-end"}}>
          <span style={{fontSize:11,color:B.gray,background:B.beigeD,padding:"3px 10px",borderRadius:20}}>
            📚 {kbItems.length} dok. v KB
          </span>
        </div>
      </header>

      <main style={{padding:"24px 28px",maxWidth:1360,margin:"0 auto"}}>
        {view==="dashboard"&&(
          <>
            <h1 style={{fontSize:22,fontWeight:700,letterSpacing:"-.04em",marginBottom:20}}>Přehled článků</h1>
            <Dashboard articles={articles} onGenerate={a=>setModal({type:"generate",article:a})} onEdit={a=>setModal({type:"edit",article:a})} onView={a=>setModal({type:"view",article:a})} onDelete={a=>setModal({type:"delete",article:a})} onStatus={changeStatus} onNew={()=>setModal({type:"generate",article:null})}/>
          </>
        )}
        {view==="pipeline"&&<Pipeline articles={articles} onView={a=>setModal({type:"view",article:a})} onStatus={changeStatus} onGenerate={a=>setModal({type:"generate",article:a})}/>}
        {view==="calendar"&&<CalendarView articles={articles} onView={a=>setModal({type:"view",article:a})}/>}
        {view==="kb"&&<KnowledgeBase items={kbItems} onAdd={addKb} onDelete={deleteKb} onEdit={editKb}/>}
      </main>

      {modal?.type==="generate"&&<AIGenerator initial={modal.article} kbItems={kbItems} onSave={saveArticle} onClose={()=>setModal(null)}/>}
      {modal?.type==="edit"&&<MetaEdit article={modal.article} onSave={saveArticle} onClose={()=>setModal(null)}/>}
      {modal?.type==="view"&&<ArticleViewer article={modal.article} onClose={()=>setModal(null)} onEdit={a=>setModal({type:"edit",article:a})} onGenerate={a=>setModal({type:"generate",article:a})}/>}
      {modal?.type==="delete"&&<DeleteConfirm article={modal.article} onConfirm={()=>deleteArticle(modal.article)} onClose={()=>setModal(null)}/>}
      {toast&&<Toast msg={toast.msg} ok={toast.ok}/>}
    </div>
  );
}
