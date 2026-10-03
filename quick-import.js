(()=>{
  const $=id=>document.getElementById(id);
  const q=$("quickImportText");
  const previewBtn=$("quickImportPreview");
  const addBtn=$("quickImportAddAll");
  const cityInput=$("quickImportCity");
  const districtInput=$("quickImportDistrict");
  const categorySelect=$("quickImportCategory");
  const previewList=$("quickImportPreviewList");
  const message=$("quickImportMessage");
  if(!q||!previewBtn||!addBtn||!previewList)return;

  const db=firebase.firestore();
  let queue=[];

  const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").replace(/\s+/g," ").trim();
  const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

  function show(text,type=""){
    message.className="message"+(type?" "+type:"");
    message.textContent=text;
    message.classList.remove("hidden");
  }
  function clean(v){return String(v||"").replace(/\s+/g," ").replace(/^[•·\-–—]\s*/,"").trim()}
  function phoneFrom(text){
    const m=String(text||"").match(/(?:\+?90\s*)?(?:\(?0?\d{3}\)?)[\s.-]*\d{3}[\s.-]*\d{2}[\s.-]*\d{2}/);
    return m?m[0].trim():"";
  }
  function webFrom(text){
    const m=String(text||"").match(/https?:\/\/\S+|www\.\S+/i);
    return m?m[0].trim():"";
  }
  function isNoise(line){
    const s=norm(line);
    return !s ||
      /^(\d(?:[,.]\d)?\s*)?[★☆]?\s*\(?\d+\)?/.test(line) ||
      /gerçek mekanda hizmet|gercek mekanda hizmet/.test(s) ||
      /^\d+\s*(yıldan|yildan)\s+daha\s+uzun/.test(s);
  }
  function isAddress(line){
    const s=norm(line);
    return /mah\.?|mahalle|cad\.?|caddesi|sok\.?|sokak|bulvar|blv\.?|no[:\s]|kat[:\s]|merkez\s*\/|\/[a-zçğıöşü]+/.test(s);
  }
  function parseBlock(block){
    const lines=block.split(/\r?\n/).map(clean).filter(Boolean);
    if(!lines.length)return null;
    const joined=lines.join(" ");
    let phone=phoneFrom(joined);
    let website=webFrom(joined);
    let address="";

    for(const line of lines){
      if(line.includes("·")){
        const parts=line.split("·").map(clean).filter(Boolean);
        const tail=parts[parts.length-1]||"";
        if(isAddress(tail)){address=tail;break}
      }
    }
    if(!address){
      address=lines.find((x,i)=>i>0&&isAddress(x))||"";
    }

    let useful=lines.filter(x=>!isNoise(x) && !phoneFrom(x) && !webFrom(x));
    let name=useful[0]||lines[0]||"";

    const embedded=phoneFrom(name);
    if(embedded){
      if(!phone)phone=embedded;
      const parts=name.split(embedded);
      name=(parts[0]||"").trim();
      if(!address)address=(parts.slice(1).join(" ")||"").trim();
    }

    name=name
      .replace(/\s+-\s+Ehliyet.*$/i,"")
      .replace(/\s+\d{5,}.*$/,"")
      .trim();

    return {name,phone,address,website};
  }
  function parseInput(){
    const raw=String(q.value||"").trim();
    if(!raw)return [];
    if(raw.includes("|")){
      return raw.split(/\r?\n/).map(line=>line.trim()).filter(Boolean).map(line=>{
        const p=line.split("|").map(x=>x.trim());
        return {name:p[0]||"",phone:p[1]||"",address:p[2]||"",website:p[3]||""};
      }).filter(x=>x.name);
    }
    const blocks=raw.split(/\n\s*\n+/).map(x=>x.trim()).filter(Boolean);
    if(blocks.length>1)return blocks.map(parseBlock).filter(x=>x&&x.name);

    const lines=raw.split(/\r?\n/).map(clean).filter(Boolean);
    const starts=[0];
    for(let i=1;i<lines.length;i++){
      const prev=lines[i-1]||"";
      const cur=lines[i]||"";
      const next=lines[i+1]||"";
      const looksName=!isNoise(cur)&&!phoneFrom(cur)&&!isAddress(cur)&&cur.length>3;
      const prevEnd=phoneFrom(prev)||/gerçek mekanda hizmet|gercek mekanda hizmet|kapalı|kapali|açık|acik/i.test(prev);
      const nextMeta=/sürücü kursu|kursu|restoran|kafe|otel|anaokulu|dershane|servis|emlak|klinik/i.test(next)||/^(\d(?:[,.]\d)?)/.test(next);
      if(looksName&&prevEnd&&nextMeta)starts.push(i);
    }
    if(starts.length>1){
      const out=[];
      for(let i=0;i<starts.length;i++){
        const from=starts[i],to=i+1<starts.length?starts[i+1]:lines.length;
        out.push(lines.slice(from,to).join("\n"));
      }
      return out.map(parseBlock).filter(x=>x&&x.name);
    }
    return [parseBlock(raw)].filter(x=>x&&x.name);
  }
  function inferSub(row,main){
    const t=norm(row.name+" "+row.address);
    if(main==="egitim"){
      if(/sürücü kursu|surucu kursu|ehliyet|direksiyon/.test(t))return "surucu";
      if(/anaokulu|ana okulu|kreş|kres/.test(t))return "kres";
      if(/dershane|kurs merkezi|tyt|ayt|yks|lgs/.test(t))return "dershane";
      if(/yurt/.test(t))return "yurt";
    }
    return "diger";
  }
  function desc(row,main,city,district){
    const labels={egitim:"eğitim",otomotiv:"otomotiv",yemeicme:"yeme & içme",saglikguzellik:"sağlık & güzellik",evyapi:"ev & yapı",emlak:"emlak",turizm:"turizm & konaklama",organizasyonmedya:"organizasyon & medya",tasimacilik:"taşımacılık",profesyonel:"profesyonel hizmet",alisveris:"alışveriş & yerel esnaf",diger:"yerel işletme"};
    const loc=[district,city].filter(Boolean).join(", ");
    return loc?row.name+"; "+loc+" bölgesinde hizmet veren "+(labels[main]||"yerel")+" işletmesidir.":row.name+" hakkında temel firma bilgileri DijiyeSor üzerinden görüntülenebilir.";
  }
  function key(r){return [norm(r.name),norm(r.phone),norm(r.address),norm(r.city),norm(r.district)].join("|")}
  function render(){
    if(!queue.length){previewList.innerHTML='<div class="empty">Henüz firma listesi girilmedi.</div>';return}
    previewList.innerHTML=queue.map((r,i)=>'<article class="quick-import-row">'+
      '<div><strong>'+esc(r.name)+'</strong><small>'+esc(r.phone||"Telefon yok")+'</small></div>'+
      '<div><span>'+esc(r.address||"Adres yok")+'</span><small>'+esc([r.city,r.district].filter(Boolean).join(" / ")||"Konum yok")+' · '+esc(r.website||"Web sitesi yok")+'</small></div>'+
      '<div class="quick-row-actions"><em>Hazır</em><button type="button" data-quick-remove="'+i+'">Kaldır</button></div>'+
    '</article>').join("");
  }

  previewBtn.addEventListener("click",()=>{
    const city=String(cityInput?.value||"").trim();
    const district=String(districtInput?.value||"").trim();
    const main=categorySelect?.value||"diger";
    if(!city){show("Önce ili yazın.","error");return}
    const rows=parseInput();
    if(!rows.length){show("Firma bilgileri okunamadı. Metni tekrar yapıştırın.","error");return}
    const seen=new Set(queue.map(key));
    let added=0;
    rows.forEach(row=>{
      const item={...row,city,district,mainCategory:main,subCategory:inferSub(row,main)};
      item.description=desc(item,main,city,district);
      const k=key(item);
      if(seen.has(k))return;
      seen.add(k);queue.push(item);added++;
    });
    render();
    q.value="";
    show(added+" firma listeye eklendi. Toplam "+queue.length+" firma hazır.","success");
  });

  previewList.addEventListener("click",e=>{
    const b=e.target.closest("[data-quick-remove]");
    if(!b)return;
    const i=Number(b.dataset.quickRemove);
    if(!Number.isNaN(i)){queue.splice(i,1);render();show("Listede "+queue.length+" firma kaldı.","success")}
  });

  addBtn.addEventListener("click",async()=>{
    if(!queue.length){show("Önce Listeyi Kontrol Et ile firmaları listeye ekleyin.","error");return}
    if(!confirm(queue.length+" firmayı DijiyeSor’a ayrı ayrı eklemek istiyor musunuz?"))return;
    addBtn.disabled=true;addBtn.textContent="Ekleniyor...";
    let added=0,skipped=0;
    try{
      const snap=await db.collection("institutions").get();
      const existing=snap.docs.map(d=>({id:d.id,...d.data()}));
      for(const row of queue){
        const dup=existing.some(f=>norm(f.name)===norm(row.name)&&norm(f.city)===norm(row.city)&&norm(f.district)===norm(row.district));
        if(dup){skipped++;continue}
        const now=new Date().toISOString();
        await db.collection("institutions").add({
          name:row.name,
          mainCategory:row.mainCategory,
          subCategory:row.subCategory,
          category:row.subCategory==="diger"?row.mainCategory:row.subCategory,
          city:row.city,
          district:row.district,
          address:row.address||"",
          phone:row.phone||"",
          whatsapp:row.phone||"",
          website:row.website||"",
          instagram:"",
          description:row.description||"",
          status:"active",
          vip:false,
          sponsored:false,
          source:"manual_quick_import",
          createdAt:now,
          updatedAt:now
        });
        added++;
      }
      queue=[];render();
      show(added+" firma eklendi."+(skipped?" "+skipped+" firma zaten kayıtlıydı.":""),"success");
      if(typeof loadFirms==="function"&&typeof renderAll==="function"){await loadFirms();renderAll()}
    }catch(err){
      show("Firmalar eklenemedi: "+(err.message||"Bilinmeyen hata"),"error");
    }finally{
      addBtn.disabled=false;addBtn.textContent="Tümünü DijiyeSor’a Ekle";
    }
  });
})();