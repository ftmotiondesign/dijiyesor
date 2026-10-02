const firebaseConfig={apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",authDomain:"dijiyer.firebaseapp.com",projectId:"dijiyer",storageBucket:"dijiyer.firebasestorage.app",messagingSenderId:"847787778815",appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"};
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();
const subcategoryMap={"egitim":{"kres":"Kreş / Anaokulu","dershane":"Dershane / Kurs Merkezi","surucu":"Sürücü Kursu","ozel_ders":"Özel Ders","dil_kursu":"Dil Kursu","etut":"Etüt Merkezi","ozel_okul":"Özel Okul","yurt":"Öğrenci Yurdu"},"otomotiv":{"oto_servis":"Oto Servis","kaporta_boya":"Kaporta & Boya","oto_elektrik":"Oto Elektrik","lastik_jant":"Lastik & Jant","oto_yikama":"Oto Yıkama","ekspertiz":"Ekspertiz","galeri":"Oto Galeri","rentacar":"Rent a Car","yedek_parca":"Yedek Parça","motosiklet":"Motosiklet"},"yemeicme":{"restoran":"Restoran","kafe":"Kafe","fastfood":"Fast Food","pastane":"Pastane","pizza":"Pizza","doner":"Döner","pide_lahmacun":"Pide & Lahmacun","catering":"Catering","ev_yemekleri":"Ev Yemekleri"},"saglikguzellik":{"dis_klinigi":"Diş Kliniği","klinik":"Klinik","psikolog":"Psikolog","diyetisyen":"Diyetisyen","fizyoterapi":"Fizyoterapi","guzellik":"Güzellik Merkezi","kuafor":"Kuaför","berber":"Berber","spor":"Spor Merkezi"},"evyapi":{"mobilya":"Mobilya","dekorasyon":"Dekorasyon","insaat":"İnşaat","elektrikci":"Elektrikçi","tesisatci":"Tesisatçı","teknik_servis":"Teknik Servis","klima":"Klima","cam_balkon":"Cam Balkon","temizlik":"Temizlik"},"emlak":{"emlak_ofisi":"Emlak Ofisi","konut":"Konut","arsa":"Arsa","ticari":"Ticari Gayrimenkul","gunluk_kiralik":"Günlük Kiralık"},"turizm":{"otel":"Otel","pansiyon":"Pansiyon","apart":"Apart","bungalov":"Bungalov","seyahat":"Seyahat Acentesi","kamp":"Kamp"},"organizasyonmedya":{"dugun_salonu":"Düğün Salonu","organizasyon":"Organizasyon","fotograf":"Fotoğrafçı","video":"Video Prodüksiyon","drone":"Drone Çekimi","gelinlik":"Gelinlik","cicekci":"Çiçekçi","reklam":"Reklam Ajansı"},"tasimacilik":{"nakliyat":"Nakliyat","kurye":"Kurye","sehirici":"Şehir İçi Taşımacılık","depolama":"Depolama"},"profesyonel":{"hukuk":"Hukuk","muhasebe":"Muhasebe","web":"Web Tasarım","sosyal_medya":"Sosyal Medya","teknoloji":"Teknoloji","bilgisayar":"Bilgisayar","danismanlik":"Danışmanlık","veteriner":"Veteriner","tarim":"Tarım"},"alisveris":{"giyim":"Giyim","ayakkabi":"Ayakkabı","market":"Market","elektronik":"Elektronik","kirtasiye":"Kırtasiye","petshop":"Pet Shop","zuccaciye":"Züccaciye","esnaf":"Yerel Esnaf"},"diger":{"diger":"Diğer"}};
const categoryLabels={egitim:"Eğitim",otomotiv:"Otomotiv",yemeicme:"Yeme & İçme",saglikguzellik:"Sağlık & Güzellik",evyapi:"Ev & Yapı",emlak:"Emlak",turizm:"Turizm & Konaklama",organizasyonmedya:"Organizasyon & Medya",tasimacilik:"Taşımacılık & Teslimat",profesyonel:"Profesyonel Hizmetler",alisveris:"Alışveriş & Yerel Esnaf",diger:"Diğer"};
const searchKeywords={
  surucu:["sürücü kursu","surucu kursu","ehliyet","direksiyon","direksiyon dersi","b ehliyet","a ehliyet","a2 ehliyet","motor ehliyeti","motosiklet ehliyeti","otomobil ehliyeti","src","kurs ehliyet"],
  kres:["kreş","kres","anaokulu","ana okulu","gündüz bakımevi","gunduz bakimevi","çocuk bakım","cocuk bakim"],
  dershane:["dershane","kurs merkezi","lgs","tyt","ayt","yks","deneme kulübü","deneme kulubu","etüt","etut"],
  dil_kursu:["ingilizce kursu","dil kursu","almanca kursu","yabancı dil","yabanci dil"],
  yurt:["öğrenci yurdu","ogrenci yurdu","erkek yurdu","kız yurdu","kiz yurdu","yurt"],
  oto_servis:["oto servis","araç bakım","arac bakim","tamirci","oto tamir","mekanik servis"],
  kaporta_boya:["kaporta","boya","oto boya","göçük","gocuk"],
  oto_elektrik:["oto elektrik","oto elektrikçi","oto elektrikci"],
  ekspertiz:["ekspertiz","oto ekspertiz","araç ekspertiz","arac ekspertiz"],
  rentacar:["rent a car","araç kiralama","arac kiralama","oto kiralama"],
  restoran:["restoran","yemek","lokanta"],
  kafe:["kafe","cafe","kahve"],
  fastfood:["fast food","hamburger","burger"],
  pizza:["pizza","pizzacı","pizzaci"],
  doner:["döner","doner"],
  dis_klinigi:["diş","dis","diş kliniği","dis klinigi","dişçi","disci"],
  psikolog:["psikolog","psikoloji","terapi"],
  diyetisyen:["diyetisyen","beslenme","diyet"],
  guzellik:["güzellik merkezi","guzellik merkezi","cilt bakımı","cilt bakimi"],
  kuafor:["kuaför","kuafor","saç","sac"],
  berber:["berber","erkek kuaförü","erkek kuaforu"],
  spor:["spor salonu","fitness","gym","pilates"],
  mobilya:["mobilya","koltuk","yatak odası","yatak odasi"],
  dekorasyon:["dekorasyon","iç mimari","ic mimari"],
  insaat:["inşaat","insaat","müteahhit","muteahhit"],
  elektrikci:["elektrikçi","elektrikci","elektrik ustası","elektrik ustasi"],
  tesisatci:["tesisatçı","tesisatci","su tesisatı","su tesisati"],
  klima:["klima","klima servis","klima montaj"],
  emlak_ofisi:["emlak","emlakçı","emlakci","gayrimenkul"],
  otel:["otel","hotel","konaklama"],
  pansiyon:["pansiyon"],
  apart:["apart","apart otel"],
  bungalov:["bungalov","bungalow"],
  fotograf:["fotoğrafçı","fotografci","fotoğraf çekimi","fotograf cekimi"],
  video:["video çekimi","video cekimi","prodüksiyon","produksiyon"],
  drone:["drone","drone çekimi","hava çekimi","hava cekimi"],
  reklam:["reklam","ajans","reklam ajansı","reklam ajansi"],
  nakliyat:["nakliyat","evden eve","taşımacılık","tasimacilik"],
  kurye:["kurye","moto kurye","teslimat"],
  hukuk:["avukat","hukuk","hukuk bürosu","hukuk burosu"],
  muhasebe:["muhasebe","mali müşavir","mali musavir"],
  web:["web sitesi","web tasarım","web tasarim","site yaptırma","site yaptirma"],
  sosyal_medya:["sosyal medya","instagram yönetimi","instagram yonetimi","reels","reklam yönetimi","reklam yonetimi"],
  veteriner:["veteriner","hayvan hastanesi","pet klinik"],
  market:["market","bakkal","süpermarket","supermarket"],
  petshop:["pet shop","petshop","evcil hayvan"]
};

function keywordTargets(query){
  const q=norm(query);
  if(!q)return [];
  return Object.entries(searchKeywords)
    .filter(([,words])=>words.some(word=>q.includes(norm(word)) || norm(word).includes(q)))
    .map(([key])=>key);
}
const legacyMain={kres:"egitim",dershane:"egitim",surucu:"egitim",ozel_ders:"egitim",dil_kursu:"egitim",etut:"egitim",ozel_okul:"egitim",yurt:"egitim",egitim:"egitim",oto:"otomotiv",oto_servis:"otomotiv",kaporta_boya:"otomotiv",oto_elektrik:"otomotiv",lastik_jant:"otomotiv",oto_yikama:"otomotiv",ekspertiz:"otomotiv",galeri:"otomotiv",rentacar:"otomotiv",yedek_parca:"otomotiv",motosiklet:"otomotiv",restoran:"yemeicme",kafe:"yemeicme",fastfood:"yemeicme",pastane:"yemeicme",pizza:"yemeicme",doner:"yemeicme",pide_lahmacun:"yemeicme",catering:"yemeicme",ev_yemekleri:"yemeicme",saglik:"saglikguzellik",dis_klinigi:"saglikguzellik",klinik:"saglikguzellik",psikolog:"saglikguzellik",diyetisyen:"saglikguzellik",fizyoterapi:"saglikguzellik",guzellik:"saglikguzellik",kuafor:"saglikguzellik",berber:"saglikguzellik",spor:"saglikguzellik",mobilya:"evyapi",dekorasyon:"evyapi",insaat:"evyapi",elektrikci:"evyapi",tesisatci:"evyapi",teknik_servis:"evyapi",evteknik:"evyapi",klima:"evyapi",cam_balkon:"evyapi",temizlik:"evyapi",emlak:"emlak",emlak_ofisi:"emlak",konut:"emlak",arsa:"emlak",ticari:"emlak",gunluk_kiralik:"emlak",turizm:"turizm",otel:"turizm",pansiyon:"turizm",apart:"turizm",bungalov:"turizm",seyahat:"turizm",kamp:"turizm",dugun:"organizasyonmedya",dugun_salonu:"organizasyonmedya",organizasyon:"organizasyonmedya",fotograf:"organizasyonmedya",medya:"organizasyonmedya",video:"organizasyonmedya",drone:"organizasyonmedya",gelinlik:"organizasyonmedya",cicekci:"organizasyonmedya",reklam:"organizasyonmedya",nakliyat:"tasimacilik",kurye:"tasimacilik",sehirici:"tasimacilik",depolama:"tasimacilik",hukuk:"profesyonel",muhasebe:"profesyonel",web:"profesyonel",sosyal_medya:"profesyonel",teknoloji:"profesyonel",bilgisayar:"profesyonel",danismanlik:"profesyonel",veteriner:"profesyonel",tarim:"profesyonel",perakende:"alisveris",giyim:"alisveris",ayakkabi:"alisveris",market:"alisveris",elektronik:"alisveris",kirtasiye:"alisveris",petshop:"alisveris",zuccaciye:"alisveris",esnaf:"alisveris",diger:"diger"};
const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").trim();
const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const mainCategory=d=>d.mainCategory||legacyMain[d.subCategory||d.category]||"diger";
const initials=n=>String(n||"Firma").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("tr-TR");
let companies=[];

async function loadProvinces(select,district){
  select.innerHTML='<option value="">İller yükleniyor...</option>';
  try{
    const r=await fetch("https://api.turkiyeapi.dev/v2/provinces?fields=id,name&limit=81");const j=await r.json();
    select.innerHTML='<option value="">Tüm İller</option>';
    (j.data||[]).sort((a,b)=>a.name.localeCompare(b.name,"tr")).forEach(c=>{const o=document.createElement("option");o.value=c.name;o.textContent=c.name;o.dataset.id=c.id;select.appendChild(o)});
  }catch(_){select.innerHTML='<option value="">Tüm İller</option>'}
  if(district){district.innerHTML='<option value="">Tüm İlçeler</option>';district.disabled=true}
}
async function fillDistricts(city,district){
  district.disabled=true;district.innerHTML='<option value="">İlçeler yükleniyor...</option>';
  const o=city.options[city.selectedIndex],id=o?.dataset?.id;
  if(!city.value){district.innerHTML='<option value="">Tüm İlçeler</option>';return}
  try{
    const r=await fetch("https://api.turkiyeapi.dev/v2/provinces/"+encodeURIComponent(id)+"/districts?fields=id,name&limit=100");const j=await r.json();
    district.innerHTML='<option value="">Tüm İlçeler</option>';
    (j.data||[]).sort((a,b)=>a.name.localeCompare(b.name,"tr")).forEach(d=>{const x=document.createElement("option");x.value=d.name;x.textContent=d.name;district.appendChild(x)});
    district.disabled=false;
  }catch(_){district.innerHTML='<option value="">Tüm İlçeler</option>';district.disabled=false}
}
async function loadCompanies(){
  const grid=document.getElementById("companyGrid"),sum=document.getElementById("resultSummary");
  try{
    const snap=await db.collection("institutions").get();companies=[];
    snap.forEach(doc=>{const d=doc.data()||{};if(String(d.status||"active")==="passive")return;companies.push({id:doc.id,name:d.name||"Firma",mainCategory:mainCategory(d),category:d.category||"",subCategory:d.subCategory||"",city:d.city||"",district:d.district||"",location:d.location||"",description:d.description||"",highlights:Array.isArray(d.highlights)?d.highlights:[],programs:Array.isArray(d.programs)?d.programs:(d.programs?[d.programs]:[]),logoUrl:d.logoUrl||"",coverUrl:d.coverUrl||"",phone:d.phone||"",website:d.website||"",whatsapp:d.whatsapp||d.phone||"",vip:Boolean(d.vip),has360Tour:Boolean(d.has360Tour||d.tour360Url||d.virtualTourUrl||d.tour360),galleryUrls:Array.isArray(d.galleryUrls)?d.galleryUrls:[],
campaignActive:Boolean(d.campaignActive||d.hasCampaign),
campaignTitle:d.campaignTitle||d.promotionTitle||"",
campaignText:d.campaignText||d.campaignDescription||d.promotionText||"",
campaignBadge:d.campaignBadge||d.promotionBadge||"Kampanya",
campaignEnd:d.campaignEnd||d.campaignEndDate||"",
campaignImageUrl:d.campaignImageUrl||d.promotionImageUrl||"",
campaignUrl:d.campaignUrl||d.promotionUrl||"",
sponsored:Boolean(d.sponsored||d.isSponsored||d.vipSponsored||d.advertiser)
})});
    companies.sort((a,b)=>a.name.localeCompare(b.name,"tr"));render(companies);
  }catch(e){console.error(e);sum.textContent="Firmalar yüklenemedi";grid.innerHTML='<div class="state"><strong>Firma kayıtlarına ulaşılamadı.</strong>Sayfayı yenileyip tekrar deneyin.</div>'}
}
function campaignIsActive(i){
  if(!i?.campaignActive || !String(i.campaignTitle||"").trim())return false;
  if(i.campaignEnd){
    const end=new Date(i.campaignEnd);
    if(!Number.isNaN(end.getTime()) && end.getTime()<Date.now())return false;
  }
  return true;
}
function campaignCard(i){
  const link=i.campaignUrl||("firma.html?id="+encodeURIComponent(i.id)+"#kampanya");
  const image=i.campaignImageUrl
    ? '<img class="sponsored-image" src="'+esc(i.campaignImageUrl)+'" alt="'+esc(i.campaignTitle)+'">'
    : '';
  return '<article class="sponsored-card">'+
    '<div class="sponsored-top"><span class="sponsored-label">SPONSORLU</span><span class="sponsored-brand">'+esc(i.name)+'</span></div>'+
    image+
    '<div class="sponsored-body">'+
      '<span class="campaign-badge">'+esc(i.campaignBadge||"Kampanya")+'</span>'+
      '<h3>'+esc(i.campaignTitle)+'</h3>'+
      (i.campaignText?'<p>'+esc(i.campaignText)+'</p>':'')+
      (i.campaignEnd?'<small>Son tarih: '+esc(new Date(i.campaignEnd).toLocaleDateString("tr-TR"))+'</small>':'')+
      '<a href="'+esc(link)+'">Kampanyayı Gör</a>'+
    '</div>'+
  '</article>';
}
function render(data){
  const grid=document.getElementById("companyGrid"),sum=document.getElementById("resultSummary");
  if(!grid||!sum)return;

  sum.textContent=data.length+" firma";
  const title=document.getElementById("resultsTitle");
  const context=document.getElementById("resultsContext");
  const search=document.getElementById("searchInput");
  const city=document.getElementById("citySelect");
  const district=document.getElementById("districtSelect");

  if(title){
    const q=String(search?.value||"").trim();
    title.textContent=q ? "“"+q+"” için sonuçlar" : "Arama sonuçları";
  }
  if(context){
    const loc=[city?.value,district?.value].filter(Boolean).join(" / ");
    context.textContent=loc ? loc+" bölgesindeki uygun işletmeler." : "Aramana uygun işletmeler listeleniyor.";
  }

  if(!data.length){
    grid.innerHTML='<div class="results-state"><strong>Uygun firma bulunamadı.</strong><span>Arama kelimesini, sektör veya konum filtresini değiştirerek tekrar deneyin.</span><a href="index.html">Yeni arama yap</a></div>';
    return;
  }

  const normalCards=data.map(i=>{
    const logo=i.logoUrl
      ? '<img src="'+esc(i.logoUrl)+'" alt="'+esc(i.name)+' logosu">'
      : '<span>'+esc(initials(i.name))+'</span>';
    const loc=[i.city,i.district].filter(Boolean).join(" · ")||i.location||"Konum bilgisi";
    const desc=i.description||(i.highlights||[]).slice(0,2).join(" · ")||"Firma hakkında ayrıntılı bilgi için tanıtım sayfasını inceleyin.";
    const badges=[
      i.vip?'<span class="result-badge vip">VIP</span>':'',
      i.has360Tour?'<span class="result-badge">360° Tur</span>':'',
      i.galleryUrls?.length?'<span class="result-badge">📷 Fotoğraflı</span>':''
    ].filter(Boolean).join("");

    return '<article class="result-card'+(i.sponsored?' is-sponsored':'')+'">'+
      '<div class="result-card-top">'+
        '<div class="result-logo">'+logo+'</div>'+
        '<div class="result-card-copy">'+
          '<div class="result-name-row"><h2>'+esc(i.name)+'</h2>'+(i.sponsored?'<span class="mini-sponsor">Sponsor</span>':'')+badges+'</div>'+
          '<div class="result-location">📍 '+esc(loc)+'</div>'+
          '<span class="result-category">'+esc(categoryLabels[i.mainCategory]||"Diğer")+'</span>'+
        '</div>'+
      '</div>'+
      '<p class="result-desc">'+esc(desc)+'</p>'+
      '<div class="result-actions">'+
        '<a class="result-primary" href="firma.html?id='+encodeURIComponent(i.id)+'">Firmayı İncele</a>'+
        '<button type="button" class="result-secondary bilgi-al-open" data-bilgi-al data-institution-id="'+esc(i.id)+'" data-institution-name="'+esc(i.name||'')+'" data-main-category="'+esc(i.mainCategory||'')+'" data-sub-category="'+esc(i.subCategory||i.category||'')+'" data-city="'+esc(i.city||'')+'" data-district="'+esc(i.district||'')+'">Bilgi Al</button>'+
      '</div>'+
    '</article>';
  });
  const sponsored=data.filter(campaignIsActive).map(campaignCard);
  const merged=[];
  normalCards.forEach((card,index)=>{
    merged.push(card);
    if(index===1 && sponsored.length)merged.push(sponsored[0]);
    if(index===5 && sponsored.length>1)merged.push(sponsored[1]);
  });
  if(!normalCards.length && sponsored.length)merged.push(...sponsored);
  grid.innerHTML=merged.join("");
}
async function initHome(){
  const search=document.getElementById("searchInput"),city=document.getElementById("citySelect"),district=document.getElementById("districtSelect"),sector=document.getElementById("sectorSelect"),subCategory=document.getElementById("subCategorySelect"),btn=document.getElementById("searchBtn"),chips=[...document.querySelectorAll(".chip")];
  if(!search)return;
  const fillSubcategories=()=>{if(!subCategory)return;const map=subcategoryMap[sector.value]||{};subCategory.innerHTML='<option value="">Tüm Alt Kategoriler</option>'+Object.entries(map).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join("");subCategory.disabled=!sector.value};
  const filter=()=>{const q=norm(search.value),c=norm(city.value),d=norm(district.value),s=sector.value,sc=subCategory?.value||"",targets=keywordTargets(q);render(companies.filter(i=>{const h=norm([i.name,i.description,i.city,i.district,i.location,i.category,i.subCategory,i.mainCategory,categoryLabels[i.mainCategory]||"",subcategoryMap[i.mainCategory]?.[i.subCategory]||"",...(searchKeywords[i.subCategory]||[]),(i.highlights||[]).join(" "),(i.programs||[]).join(" ")].join(" "));const keywordMatch=targets.length&&targets.some(t=>i.subCategory===t||i.category===t);return(!q||h.includes(q)||keywordMatch)&&(!c||norm(i.city)===c)&&(!d||norm(i.district)===d)&&(!s||i.mainCategory===s)&&(!sc||i.subCategory===sc||i.category===sc)}))};
  const params=new URLSearchParams(location.search);
  await loadProvinces(city,district);
  if(params.get("q"))search.value=params.get("q");
  if(params.get("city")){
    city.value=params.get("city");
    if(city.value){
      await fillDistricts(city,district);
      if(params.get("district"))district.value=params.get("district");
    }
  }
  if(params.get("sector"))sector.value=params.get("sector");
  fillSubcategories();
  if(params.get("subCategory")&&subCategory){subCategory.value=params.get("subCategory");}
  city.addEventListener("change",async()=>{await fillDistricts(city,district);filter()});
  district.addEventListener("change",filter);
  sector.addEventListener("change",()=>{chips.forEach(x=>x.classList.toggle("active",x.dataset.sector===sector.value));fillSubcategories();filter()});
  subCategory?.addEventListener("change",filter);
  search.addEventListener("input",filter);btn.addEventListener("click",filter);
  search.addEventListener("keydown",e=>{if(e.key==="Enter")filter()});
  document.getElementById("clearFiltersBtn")?.addEventListener("click",async()=>{
    search.value="";
    city.value="";
    sector.value="";
    if(subCategory){subCategory.innerHTML='<option value="">Tüm Alt Kategoriler</option>';subCategory.disabled=true;}
    district.innerHTML='<option value="">Tüm İlçeler</option>';
    district.disabled=true;
    history.replaceState({}, "", "arama.html");
    filter();
  });
  chips.forEach(x=>x.addEventListener("click",()=>{chips.forEach(y=>y.classList.remove("active"));x.classList.add("active");sector.value=x.dataset.sector;filter()}));
  await loadCompanies();
  filter();
}
document.addEventListener("DOMContentLoaded",initHome);
