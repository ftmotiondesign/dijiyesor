const firebaseConfig={apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",authDomain:"dijiyer.firebaseapp.com",projectId:"dijiyer",storageBucket:"dijiyer.firebasestorage.app",messagingSenderId:"847787778815",appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"};
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const db=firebase.firestore();
const subcategoryMap={"egitim":{"kres":"Kreş / Anaokulu","dershane":"Dershane / Kurs Merkezi","surucu":"Sürücü Kursu","ozel_ders":"Özel Ders","dil_kursu":"Dil Kursu","etut":"Etüt Merkezi","ozel_okul":"Özel Okul","yurt":"Öğrenci Yurdu"},"otomotiv":{"oto_servis":"Oto Servis","kaporta_boya":"Kaporta & Boya","oto_elektrik":"Oto Elektrik","lastik_jant":"Lastik & Jant","oto_yikama":"Oto Yıkama","ekspertiz":"Ekspertiz","galeri":"Oto Galeri","rentacar":"Rent a Car","yedek_parca":"Yedek Parça","motosiklet":"Motosiklet"},"yemeicme":{"restoran":"Restoran","kafe":"Kafe","fastfood":"Fast Food","pastane":"Pastane","pizza":"Pizza","doner":"Döner","pide_lahmacun":"Pide & Lahmacun","catering":"Catering","ev_yemekleri":"Ev Yemekleri"},"saglikguzellik":{"dis_klinigi":"Diş Kliniği","klinik":"Klinik","psikolog":"Psikolog","diyetisyen":"Diyetisyen","fizyoterapi":"Fizyoterapi","guzellik":"Güzellik Merkezi","kuafor":"Kuaför","berber":"Berber","spor":"Spor Merkezi"},"evyapi":{"mobilya":"Mobilya","dekorasyon":"Dekorasyon","insaat":"İnşaat","elektrikci":"Elektrikçi","tesisatci":"Tesisatçı","teknik_servis":"Teknik Servis","klima":"Klima","cam_balkon":"Cam Balkon","temizlik":"Temizlik"},"emlak":{"emlak_ofisi":"Emlak Ofisi","konut":"Konut","arsa":"Arsa","ticari":"Ticari Gayrimenkul","gunluk_kiralik":"Günlük Kiralık"},"turizm":{"otel":"Otel","pansiyon":"Pansiyon","apart":"Apart","bungalov":"Bungalov","seyahat":"Seyahat Acentesi","kamp":"Kamp"},"organizasyonmedya":{"dugun_salonu":"Düğün Salonu","organizasyon":"Organizasyon","fotograf":"Fotoğrafçı","video":"Video Prodüksiyon","drone":"Drone Çekimi","gelinlik":"Gelinlik","cicekci":"Çiçekçi","reklam":"Reklam Ajansı"},"tasimacilik":{"nakliyat":"Nakliyat","kurye":"Kurye","sehirici":"Şehir İçi Taşımacılık","depolama":"Depolama"},"profesyonel":{"hukuk":"Hukuk","muhasebe":"Muhasebe","web":"Web Tasarım","sosyal_medya":"Sosyal Medya","teknoloji":"Teknoloji","bilgisayar":"Bilgisayar","danismanlik":"Danışmanlık","veteriner":"Veteriner","tarim":"Tarım"},"alisveris":{"giyim":"Giyim","ayakkabi":"Ayakkabı","market":"Market","elektronik":"Elektronik","kirtasiye":"Kırtasiye","petshop":"Pet Shop","zuccaciye":"Züccaciye","esnaf":"Yerel Esnaf"},"diger":{"diger":"Diğer"}};
const categoryLabels={egitim:"Eğitim",otomotiv:"Otomotiv",yemeicme:"Yeme & İçme",saglikguzellik:"Sağlık & Güzellik",evyapi:"Ev & Yapı",emlak:"Emlak",turizm:"Turizm & Konaklama",organizasyonmedya:"Organizasyon & Medya",tasimacilik:"Taşımacılık & Teslimat",profesyonel:"Profesyonel Hizmetler",alisveris:"Alışveriş & Yerel Esnaf",diger:"Diğer"};
const searchKeywords={
  surucu:["sürücü kursu","surucu kursu","ehliyet","direksiyon","direksiyon dersi","b ehliyet","a ehliyet","a2 ehliyet","motor ehliyeti","motosiklet ehliyeti","otomobil ehliyeti","kurs ehliyet"],
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

function valid360Url(value){
  const raw=String(value||"").trim();
  if(!/^https?:\/\//i.test(raw))return false;
  try{
    const u=new URL(raw);
    if(!u.hostname)return false;
    return true;
  }catch(_){return false}
}

function locationFromAddress(address){
  const s=String(address||"").trim();
  if(!s)return null;
  const m=s.match(/([^,;\/]+)\s*\/\s*([^,;]+?)(?:\s*,?\s*(?:Türkiye|Turkey))?$/i);
  if(!m)return null;
  const district=String(m[1]||"").trim();
  const city=String(m[2]||"").trim().replace(/\s+Türkiye$/i,"").trim();
  if(!district||!city)return null;
  return {district,city};
}
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
    snap.forEach(doc=>{const d=doc.data()||{};if(String(d.status||"active")==="passive")return;const addrLoc=locationFromAddress(d.address);const fixedCity=addrLoc?.city||d.city||"";const fixedDistrict=addrLoc?.district||d.district||"";companies.push({id:doc.id,name:d.name||"Firma",mainCategory:mainCategory(d),category:d.category||"",subCategory:d.subCategory||"",city:fixedCity,district:fixedDistrict,address:d.address||"",location:d.location||"",description:d.description||"",keywords:Array.isArray(d.searchKeywords)?d.searchKeywords:[],highlights:Array.isArray(d.highlights)?d.highlights:[],programs:Array.isArray(d.programs)?d.programs:(d.programs?[d.programs]:[]),logoUrl:d.logoUrl||"",cardImageUrl:d.cardImageUrl||"",coverUrl:d.coverUrl||"",phone:d.phone||"",website:d.website||"",whatsapp:d.whatsapp||d.phone||"",vip:Boolean(d.vip),has360Tour:valid360Url(d.tour360Url||d.virtualTourUrl||d.tour360||d.panoramaUrl),tour360Url:valid360Url(d.tour360Url||d.virtualTourUrl||d.tour360||d.panoramaUrl)?String(d.tour360Url||d.virtualTourUrl||d.tour360||d.panoramaUrl||"").trim():"",galleryUrls:Array.isArray(d.galleryUrls)?d.galleryUrls:[],
campaignActive:Boolean(d.campaignActive||d.hasCampaign),
campaignTitle:d.campaignTitle||d.promotionTitle||"",
campaignText:d.campaignText||d.campaignDescription||d.promotionText||"",
campaignBadge:d.campaignBadge||d.promotionBadge||"Kampanya",
campaignEnd:d.campaignEnd||d.campaignEndDate||"",
campaignImageUrl:d.campaignImageUrl||d.promotionImageUrl||"",
campaignUrl:d.campaignUrl||d.promotionUrl||"",
sponsored:Boolean(d.sponsored||d.isSponsored||d.vipSponsored||d.advertiser)
})});
    companies.sort((a,b)=>a.name.localeCompare(b.name,"tr"));
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
function resultCardFallback(i){
  const main=String(i.mainCategory||"diger");
  const sub=String(i.subCategory||i.category||"");
  const mainMap={
    egitim:{icon:"🎓",label:"Eğitim",tone:"education"},
    otomotiv:{icon:"🚗",label:"Otomotiv",tone:"automotive"},
    yemeicme:{icon:"🍽️",label:"Yeme & İçme",tone:"food"},
    saglikguzellik:{icon:"✚",label:"Sağlık & Güzellik",tone:"health"},
    evyapi:{icon:"🏠",label:"Ev & Yapı",tone:"home"},
    emlak:{icon:"🏢",label:"Emlak",tone:"estate"},
    turizm:{icon:"🧳",label:"Turizm & Konaklama",tone:"tourism"},
    organizasyonmedya:{icon:"🎬",label:"Organizasyon & Medya",tone:"media"},
    tasimacilik:{icon:"🚚",label:"Taşımacılık",tone:"transport"},
    profesyonel:{icon:"💼",label:"Profesyonel Hizmetler",tone:"professional"},
    alisveris:{icon:"🛍️",label:"Yerel Esnaf",tone:"shopping"},
    diger:{icon:"📍",label:"Yerel İşletme",tone:"other"}
  };
  const subMap={
    surucu:{icon:"🚘",label:"Sürücü Kursu"},
    kres:{icon:"🧸",label:"Kreş & Anaokulu"},
    dershane:{icon:"📚",label:"Kurs Merkezi"},
    yurt:{icon:"🛏️",label:"Öğrenci Yurdu"},
    oto_servis:{icon:"🔧",label:"Oto Servis"},
    ekspertiz:{icon:"🔎",label:"Oto Ekspertiz"},
    restoran:{icon:"🍽️",label:"Restoran"},
    kafe:{icon:"☕",label:"Kafe"}
  };
  const base=mainMap[main]||mainMap.diger;
  const detail=subMap[sub]||{};
  return {icon:detail.icon||base.icon,label:detail.label||base.label,tone:base.tone};
}
function resultCardVisual(i){
  const image=String(i.cardImageUrl||i.coverUrl||i.galleryUrls?.[0]||"").trim();
  if(image){
    return '<div class="result-visual"><img src="'+esc(image)+'" alt="'+esc(i.name)+' görseli" loading="lazy">'+
      (i.has360Tour?'<span class="result-visual-badge">360° Mekân</span>':'')+
      (i.sponsored?'<span class="result-visual-sponsor">Sponsor</span>':'')+
    '</div>';
  }
  const c=resultCardFallback(i);
  return '<div class="result-visual result-visual-fallback '+esc(c.tone)+'">'+
    '<div class="result-visual-fallback-icon">'+c.icon+'</div>'+
    '<div><small>DİJİYESOR</small><strong>'+esc(c.label)+'</strong></div>'+
    (i.has360Tour?'<span class="result-visual-badge">360° Mekân</span>':'')+
    (i.sponsored?'<span class="result-visual-sponsor">Sponsor</span>':'')+
  '</div>';
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
  const locationNotice=document.getElementById("locationNotice");
  if(locationNotice){
    const hasCity=Boolean(city?.value);
    locationNotice.classList.toggle("hidden",hasCity);
    const noticeTitle=locationNotice.querySelector("strong");
    const noticeText=locationNotice.querySelector(".location-notice-left > span");
    if(noticeTitle)noticeTitle.textContent=data.length>0
      ? "Konumunu seç, sana en yakın sonuçları gösterelim"
      : "Konumunu seç, daha doğru sonuçlara ulaş";
    if(noticeText)noticeText.textContent=data.length>0
      ? "Şu anda Türkiye geneli sonuçları görüyorsunuz."
      : "Sonuç bulunamadı. İl veya ilçe seçerek aramanızı daraltabilirsiniz.";
    if(!hasCity && !locationNotice.querySelector("[data-focus-city]")){
      const action=document.createElement("button");
      action.type="button";
      action.className="location-select-btn";
      action.dataset.focusCity="";
      action.textContent="📍 İl Seç";
      locationNotice.appendChild(action);
    }
  }

  if(!data.length){
    grid.innerHTML='<div class="results-state no-result-state"><button type="button" class="no-result-mascot" data-open-category-search aria-label="Yeni arama yap"><img src="./assets/diji-mascot-v2.png" alt="Diji maskotu"></button><strong>Uygun firma bulunamadı.</strong><span>Arama kelimesini, sektör veya konum filtresini değiştirerek tekrar deneyin.</span><button type="button" class="new-search-popup-btn" data-open-category-search>Yeni arama yap</button></div>';
    return;
  }

  const normalCards=data.map(i=>{
    const logo=i.logoUrl
      ? '<img src="'+esc(i.logoUrl)+'" alt="'+esc(i.name)+' logosu">'
      : '<span>'+esc(initials(i.name))+'</span>';
    const loc=[i.city,i.district].filter(Boolean).join(" · ")||i.location||"Konum bilgisi";
    const storedDesc=String(i.description||"");
    const desc=(storedDesc && (!i.city || norm(storedDesc).includes(norm(i.city)))) ? storedDesc : ((i.highlights||[]).slice(0,2).join(" · ")||([i.district,i.city].filter(Boolean).join(", ") ? i.name+"; "+[i.district,i.city].filter(Boolean).join(", ")+" bölgesinde hizmet veren işletmedir." : "Firma hakkında ayrıntılı bilgi için tanıtım sayfasını inceleyin."));
    const badges=[
      i.vip?'<span class="result-badge vip">VIP</span>':'',
      i.has360Tour?'<span class="result-badge">360° Tur</span>':'',
      i.galleryUrls?.length?'<span class="result-badge">📷 Fotoğraflı</span>':''
    ].filter(Boolean).join("");

    return '<article class="result-card'+(i.sponsored?' is-sponsored':'')+'">'+
      '<div class="result-card-body">'+
      '<div class="result-card-top">'+
        '<div class="result-logo">'+logo+'</div>'+
        '<div class="result-card-copy">'+
          '<div class="result-name-row"><h2>'+esc(i.name)+'</h2>'+(i.sponsored?'<span class="mini-sponsor">Sponsor</span>':'')+badges+'</div>'+
          '<div class="result-location">📍 '+esc(loc)+'</div>'+
          '<span class="result-category">'+esc(categoryLabels[i.mainCategory]||"Diğer")+'</span>'+
        '</div>'+
        resultCardVisual(i)+
      '</div>'+
      '<p class="result-desc">'+esc(desc)+'</p>'+
      (i.has360Tour&&i.tour360Url?'<button type="button" class="result-360-btn" data-open-360 data-tour-url="'+esc(i.tour360Url)+'" data-tour-name="'+esc(i.name)+'"><span>360°</span> Mekânı Gez</button>':'')+
      '<div class="result-actions">'+
        '<a class="result-primary" href="firma.html?id='+encodeURIComponent(i.id)+'">Firmayı İncele</a>'+
        '<button type="button" class="result-secondary bilgi-al-open" data-bilgi-al data-institution-id="'+esc(i.id)+'" data-institution-name="'+esc(i.name||'')+'" data-main-category="'+esc(i.mainCategory||'')+'" data-sub-category="'+esc(i.subCategory||i.category||'')+'" data-city="'+esc(i.city||'')+'" data-district="'+esc(i.district||'')+'">Bilgi Al</button>'+
      '</div>'+
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

  const modal=document.getElementById("categoryPickerModal");
  const categoryGrid=document.getElementById("categoryPickerGrid");
  const pickerCategories=[
    ["egitim","Eğitim","Kurs, sürücü kursu, anaokulu, yurt"],
    ["otomotiv","Otomotiv","Servis, ekspertiz, galeri, kiralama"],
    ["yemeicme","Yeme & İçme","Restoran, kafe, pizza, döner"],
    ["saglikguzellik","Sağlık & Güzellik","Diş, psikolog, kuaför, spor"],
    ["evyapi","Ev & Yapı","Mobilya, dekorasyon, teknik servis"],
    ["emlak","Emlak","Konut, arsa, emlak ofisi"],
    ["turizm","Turizm & Konaklama","Otel, pansiyon, apart"],
    ["organizasyonmedya","Organizasyon & Medya","Fotoğraf, video, organizasyon"],
    ["tasimacilik","Taşımacılık","Nakliyat, kurye, teslimat"],
    ["profesyonel","Profesyonel Hizmetler","Hukuk, muhasebe, web, danışmanlık"],
    ["alisveris","Yerel Esnaf","Market, giyim, elektronik, pet shop"],
    ["diger","Diğer","Diğer kurum ve hizmetler"]
  ];
  if(categoryGrid){
    categoryGrid.innerHTML=pickerCategories.map(([key,title,desc])=>{
      const subs=Object.entries(subcategoryMap[key]||{}).map(([subKey,subTitle])=>'<button type="button" class="category-subpick" data-pick-sector="'+key+'" data-pick-subcategory="'+subKey+'">'+esc(subTitle)+'</button>').join("");
      return '<div class="category-picker-item"><button type="button" class="category-pick" data-toggle-picker-sector="'+key+'"><span class="category-pick-copy"><strong>'+esc(title)+'</strong><span>'+esc(desc)+'</span></span><span class="category-pick-chevron">⌄</span></button><div class="category-subpanel hidden"><button type="button" class="category-subpick all" data-pick-sector="'+key+'">Tüm '+esc(title)+'</button>'+subs+'</div></div>';
    }).join("");
  }
  const openCategoryModal=()=>{modal?.classList.remove("hidden");document.body.style.overflow="hidden"};
  const closeCategoryModal=()=>{modal?.classList.add("hidden");document.body.style.overflow=""};
  document.querySelectorAll("[data-close-category-modal]").forEach(el=>el.addEventListener("click",closeCategoryModal));
  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeCategoryModal()});
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-open-category-search]"))openCategoryModal();

    const focusSearch=e.target.closest("[data-focus-search]");
    if(focusSearch){
      e.preventDefault();
      const line=search.closest(".search-line");
      search.focus({preventScroll:true});
      if(search.value)search.select?.();
      search.scrollIntoView({behavior:"smooth",block:"center"});
      line?.classList.add("search-attention");
      setTimeout(()=>line?.classList.remove("search-attention"),1100);
    }

    const quick=e.target.closest("[data-quick-sub]");
    if(quick){
      sector.value=quick.dataset.quickSector||"";
      fillSubcategories();
      if(subCategory)subCategory.value=quick.dataset.quickSub||"";
      filter();
    }

    const focusCity=e.target.closest("[data-focus-city]");
    if(focusCity){
      city.focus();
      city.scrollIntoView({behavior:"smooth",block:"center"});
    }
  });
  categoryGrid?.querySelectorAll("[data-toggle-picker-sector]").forEach(btn=>btn.addEventListener("click",()=>{
    const item=btn.closest(".category-picker-item"),panel=item?.querySelector(".category-subpanel");
    if(!item||!panel)return;
    const wasOpen=!panel.classList.contains("hidden");
    categoryGrid.querySelectorAll(".category-subpanel").forEach(p=>p.classList.add("hidden"));
    categoryGrid.querySelectorAll(".category-picker-item").forEach(i=>i.classList.remove("open"));
    if(!wasOpen){panel.classList.remove("hidden");item.classList.add("open")}
  }));
  categoryGrid?.querySelectorAll("[data-pick-sector]").forEach(el=>el.addEventListener("click",()=>{
    sector.value=el.dataset.pickSector;
    fillSubcategories();
    subCategory.value=el.dataset.pickSubcategory||"";
    closeCategoryModal();
    filter();
  }));

  const showInitialState=()=>{
    const grid=document.getElementById("companyGrid");
    document.getElementById("resultsHead")?.classList.add("hidden");
    if(grid){
      grid.innerHTML=
        '<div class="initial-search-state smart-start">'+
          '<button type="button" class="smart-start-mascot" data-open-category-search aria-label="Kategori seç"><img src="./assets/diji-mascot-search.png" alt="Diji arama maskotu"></button>'+
          '<strong>Ne arıyorsunuz?</strong>'+
          '<span>Bir kategori seçin veya firma / hizmet adını yazarak arayın.</span>'+
          '<div class="smart-start-actions">'+
            '<button type="button" class="smart-start-primary" data-open-category-search>Kategori Seç</button>'+
          '</div>'+
          '<div class="smart-start-quick">'+
            '<button type="button" data-quick-sub="surucu" data-quick-sector="egitim">Sürücü Kursu</button>'+
            '<button type="button" data-quick-sub="kres" data-quick-sector="egitim">Kreş / Anaokulu</button>'+
            '<button type="button" data-quick-sub="dershane" data-quick-sector="egitim">Kurs Merkezi</button>'+
            '<button type="button" data-quick-sub="yurt" data-quick-sector="egitim">Öğrenci Yurdu</button>'+
            '<button type="button" data-quick-sub="oto_servis" data-quick-sector="otomotiv">Oto Servis</button>'+
            '<button type="button" data-quick-sub="restoran" data-quick-sector="yemeicme">Restoran</button>'+
          '</div>'+
        '</div>';
    }
  };
  const params=new URLSearchParams(location.search);

  const force360Only=window.DJS_FORCE_360_ONLY===true;
  const is360Directory=/\/360-mekanlar\.html$/i.test(location.pathname);
  const feature360=is360Directory || force360Only;
  const only360Btn=document.getElementById("only360Btn");
  let only360Active=feature360;
  const sync360Button=()=>{
    if(!only360Btn)return;
    only360Btn.classList.toggle("active",only360Active);
    only360Btn.setAttribute("aria-pressed",String(only360Active));
  };
  const filter=()=>{renderActiveFilters();const q=norm(search.value),c=norm(city.value),d=norm(district.value),s=sector.value,sc=subCategory?.value||"";if(!q&&!c&&!d&&!s&&!sc&&!feature360&&!only360Active){showInitialState();return}document.getElementById("resultsHead")?.classList.remove("hidden");const targets=keywordTargets(q),tokens=q.split(/\s+/).filter(Boolean);const filtered=companies.filter(i=>{const h=norm([i.name,i.description,i.city,i.district,i.address,i.location,i.category,i.subCategory,i.mainCategory,categoryLabels[i.mainCategory]||"",subcategoryMap[i.mainCategory]?.[i.subCategory]||"",...(searchKeywords[i.subCategory]||[]),(i.keywords||[]).join(" "),(i.highlights||[]).join(" "),(i.programs||[]).join(" ")].join(" "));const tokenMatch=tokens.length>1&&tokens.every(t=>h.includes(t));const keywordMatch=tokens.length===1&&targets.length&&targets.some(t=>i.subCategory===t||i.category===t);const cityText=norm([i.city,i.address,i.location].join(" "));const districtText=norm([i.district,i.address,i.location].join(" "));const cityMatch=!c||norm(i.city)===c||cityText.includes(c);const districtMatch=!d||norm(i.district)===d||districtText.includes(d);return(!q||h.includes(q)||tokenMatch||keywordMatch)&&cityMatch&&districtMatch&&(!s||i.mainCategory===s)&&(!sc||i.subCategory===sc||i.category===sc)&&(!(feature360||only360Active)||valid360Url(i.tour360Url))});render(filtered);if(feature360){const title=document.getElementById("resultsTitle"),context=document.getElementById("resultsContext");if(title)title.textContent="360° Mekânlar";if(context)context.textContent="Sanal tur ile gezebileceğiniz işletmeler listeleniyor."}};

  const renderActiveFilters=()=>{
    const host=document.getElementById("activeFilters");
    if(!host)return;
    const items=[];
    if(city.value)items.push({key:"city",label:city.value});
    if(district.value)items.push({key:"district",label:district.value});
    if(sector.value)items.push({key:"sector",label:categoryLabels[sector.value]||sector.options[sector.selectedIndex]?.text||sector.value});
    if(subCategory?.value)items.push({key:"subCategory",label:subcategoryMap[sector.value]?.[subCategory.value]||subCategory.options[subCategory.selectedIndex]?.text||subCategory.value});
    if(search.value.trim())items.push({key:"q",label:search.value.trim()});
    if(only360Active&&!feature360)items.push({key:"only360",label:"360° Sanal Tur"});

    host.innerHTML=items.length
      ? items.map(x=>'<button type="button" data-remove-filter="'+x.key+'">'+esc(x.label)+' <span>×</span></button>').join("")
      : "";
    host.classList.toggle("visible",items.length>0);
  };

  document.getElementById("activeFilters")?.addEventListener("click",async e=>{
    const btn=e.target.closest("[data-remove-filter]");
    if(!btn)return;
    const key=btn.dataset.removeFilter;

    if(key==="q")search.value="";
    if(key==="city"){
      city.value="";
      district.value="";
      district.innerHTML='<option value="">Tüm İlçeler</option>';
      district.disabled=true;
    }
    if(key==="district")district.value="";
    if(key==="sector"){
      sector.value="";
      if(subCategory){
        subCategory.innerHTML='<option value="">Tüm Alt Kategoriler</option>';
        subCategory.disabled=true;
      }
      chips.forEach(x=>x.classList.remove("active"));
    }
    if(key==="subCategory"&&subCategory)subCategory.value="";
    if(key==="only360"&&!feature360){
      only360Active=false;
      sync360Button();
    }
    filter();
    renderActiveFilters();
  });

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
  sync360Button();
  only360Btn?.addEventListener("click",()=>{
    if(feature360)return;
    only360Active=!only360Active;
    sync360Button();
    filter();
  });
  renderActiveFilters();
  city.addEventListener("change",async()=>{await fillDistricts(city,district);filter()});
  district.addEventListener("change",filter);
  sector.addEventListener("change",()=>{chips.forEach(x=>x.classList.toggle("active",x.dataset.sector===sector.value));fillSubcategories();filter()});
  subCategory?.addEventListener("change",filter);
  search.addEventListener("input",()=>{if(search.value.trim())filter();else if(!city.value&&!sector.value)showInitialState()});

  const submitSearch=()=>{
    if(!search.value.trim()){
      openCategoryModal();
      return;
    }
    filter();
    search.blur();
    try{
      const url=new URL(location.href);
      url.searchParams.set("q",search.value.trim());
      history.replaceState(null,"",url.pathname+"?"+url.searchParams.toString());
    }catch(_){}
    setTimeout(()=>{
      const grid=document.getElementById("companyGrid");
      if(grid)grid.scrollIntoView({behavior:"smooth",block:"start"});
    },120);
  };

  btn.addEventListener("click",submitSearch);
  search.addEventListener("keydown",e=>{
    if(e.key==="Enter"){
      e.preventDefault();
      submitSearch();
    }
  });
  
  chips.forEach(x=>x.addEventListener("click",()=>{chips.forEach(y=>y.classList.remove("active"));x.classList.add("active");sector.value=x.dataset.sector;filter()}));
  await loadCompanies();
  const hasInitial=params.get("q")||params.get("city")||params.get("district")||params.get("sector")||params.get("subCategory")||feature360;
  if(hasInitial)filter();else showInitialState();
}
document.addEventListener("DOMContentLoaded",initHome);


function init360Popup(){
  const modal=document.getElementById("tour360Modal");
  const frame=document.getElementById("tour360Frame");
  const title=document.getElementById("tour360Title");
  const external=document.getElementById("tour360External");
  if(!modal||!frame)return;

  const close=()=>{
    modal.classList.add("hidden");
    document.body.style.overflow="";
    frame.src="about:blank";
  };

  document.addEventListener("click",e=>{
    const btn=e.target.closest("[data-open-360]");
    if(btn){
      const url=String(btn.dataset.tourUrl||"").trim();
      if(!url)return;
      if(title)title.textContent=(btn.dataset.tourName||"Firma")+" · 360° Mekân Turu";
      frame.src=url;
      if(external)external.href=url;
      modal.classList.remove("hidden");
      document.body.style.overflow="hidden";
      return;
    }
    if(e.target.closest("[data-close-360]"))close();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.classList.contains("hidden"))close()});
}
document.addEventListener("DOMContentLoaded",init360Popup);
