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
  const q=smartSearchText(query);
  if(!q)return [];
  return Object.entries(searchKeywords)
    .filter(([,words])=>words.some(word=>{
      const w=smartSearchText(word);
      return q===w || q.includes(w) || w.includes(q) || smartTokenMatch(w,q);
    }))
    .map(([key])=>key);
}
const legacyMain={kres:"egitim",dershane:"egitim",surucu:"egitim",ozel_ders:"egitim",dil_kursu:"egitim",etut:"egitim",ozel_okul:"egitim",yurt:"egitim",egitim:"egitim",oto:"otomotiv",oto_servis:"otomotiv",kaporta_boya:"otomotiv",oto_elektrik:"otomotiv",lastik_jant:"otomotiv",oto_yikama:"otomotiv",ekspertiz:"otomotiv",galeri:"otomotiv",rentacar:"otomotiv",yedek_parca:"otomotiv",motosiklet:"otomotiv",restoran:"yemeicme",kafe:"yemeicme",fastfood:"yemeicme",pastane:"yemeicme",pizza:"yemeicme",doner:"yemeicme",pide_lahmacun:"yemeicme",catering:"yemeicme",ev_yemekleri:"yemeicme",saglik:"saglikguzellik",dis_klinigi:"saglikguzellik",klinik:"saglikguzellik",psikolog:"saglikguzellik",diyetisyen:"saglikguzellik",fizyoterapi:"saglikguzellik",guzellik:"saglikguzellik",kuafor:"saglikguzellik",berber:"saglikguzellik",spor:"saglikguzellik",mobilya:"evyapi",dekorasyon:"evyapi",insaat:"evyapi",elektrikci:"evyapi",tesisatci:"evyapi",teknik_servis:"evyapi",evteknik:"evyapi",klima:"evyapi",cam_balkon:"evyapi",temizlik:"evyapi",emlak:"emlak",emlak_ofisi:"emlak",konut:"emlak",arsa:"emlak",ticari:"emlak",gunluk_kiralik:"emlak",turizm:"turizm",otel:"turizm",pansiyon:"turizm",apart:"turizm",bungalov:"turizm",seyahat:"turizm",kamp:"turizm",dugun:"organizasyonmedya",dugun_salonu:"organizasyonmedya",organizasyon:"organizasyonmedya",fotograf:"organizasyonmedya",medya:"organizasyonmedya",video:"organizasyonmedya",drone:"organizasyonmedya",gelinlik:"organizasyonmedya",cicekci:"organizasyonmedya",reklam:"organizasyonmedya",nakliyat:"tasimacilik",kurye:"tasimacilik",sehirici:"tasimacilik",depolama:"tasimacilik",hukuk:"profesyonel",muhasebe:"profesyonel",web:"profesyonel",sosyal_medya:"profesyonel",teknoloji:"profesyonel",bilgisayar:"profesyonel",danismanlik:"profesyonel",veteriner:"profesyonel",tarim:"profesyonel",perakende:"alisveris",giyim:"alisveris",ayakkabi:"alisveris",market:"alisveris",elektronik:"alisveris",kirtasiye:"alisveris",petshop:"alisveris",zuccaciye:"alisveris",esnaf:"alisveris",diger:"diger"};
const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").trim();

// Türkiye genelinde ilçe alanlarında posta kodunu otomatik temizler.
// Örn: "17200 Biga" -> "Biga", "34000 Kadıköy" -> "Kadıköy".
const cleanDistrictName=v=>String(v||"")
  .trim()
  .replace(/^\s*(?:TR[-\s]?)?\d{5}\s*[-,/]?\s*/i,"")
  .replace(/\s+/g," ")
  .trim();

const normDistrict=v=>norm(cleanDistrictName(v));

/* Daha esnek Türkçe arama:
   - sürücü kursu / sürücü kursları
   - restoran / restoranlar
   - anaokulu / anaokulları
   - Türkçe karakterli / karaktersiz yazımlar
*/
const searchAscii=v=>norm(v)
  .replace(/ç/g,"c").replace(/ğ/g,"g").replace(/ı/g,"i")
  .replace(/ö/g,"o").replace(/ş/g,"s").replace(/ü/g,"u");

const searchRoot=word=>{
  let w=searchAscii(word).replace(/[^a-z0-9]/g,"");
  if(w.length<=4)return w;
  const suffixes=[
    "larindan","lerinden","larinda","lerinde","larini","lerini","larinin","lerinin",
    "lardan","lerden","lara","lere","lari","leri","lar","ler",
    "dan","den","nin","nın","nun","nün","dir","dır","dur","dür",
    "yi","yı","yu","yü","in","ın","un","ün","i","ı","u","ü","a","e"
  ].map(searchAscii).sort((a,b)=>b.length-a.length);
  for(const suffix of suffixes){
    if(w.endsWith(suffix)&&w.length-suffix.length>=3){
      w=w.slice(0,-suffix.length);
      break;
    }
  }
  return w;
};

const smartSearchText=v=>searchAscii(v)
  .replace(/['’`]/g," ")
  .replace(/[^a-z0-9\s]/g," ")
  .split(/\s+/).filter(Boolean)
  .map(searchRoot).filter(Boolean)
  .join(" ");

const smartTokenMatch=(haystack,needle)=>{
  const hs=smartSearchText(haystack).split(/\s+/).filter(Boolean);
  const ns=smartSearchText(needle).split(/\s+/).filter(Boolean);
  if(!ns.length)return true;
  return ns.every(n=>hs.some(h=>
    h===n ||
    (n.length>=4&&h.startsWith(n)) ||
    (h.length>=4&&n.startsWith(h))
  ));
};

function analyzeSearchIntent(query){
  const qSmart=smartSearchText(query);
  const tokens=qSmart.split(/\s+/).filter(Boolean);
  const targets=keywordTargets(query);
  const genericTokens=new Set();
  let longestMatchedPhrase="";
  Object.entries(searchKeywords).forEach(([key,words])=>{
    if(!targets.includes(key))return;
    words.forEach(word=>{
      const wSmart=smartSearchText(word);
      if(!wSmart)return;
      const wTokens=wSmart.split(/\s+/).filter(Boolean);
      const allPresent=wTokens.every(w=>tokens.some(t=>t===w||(w.length>=4&&t.startsWith(w))||(t.length>=4&&w.startsWith(t))));
      if(allPresent && wSmart.length>longestMatchedPhrase.length)longestMatchedPhrase=wSmart;
    });
  });
  longestMatchedPhrase.split(/\s+/).filter(Boolean).forEach(t=>genericTokens.add(t));

  const stopWords=new Set(["en","yakin","yakinda","yakindaki","yakınımda","yakınımdaki","bul","ara","firma","firmasi","kurum","hizmet","merkez"]);
  const cityTokens=new Set();
  turkiyeCitiesSearch.forEach(city=>{
    const cs=smartSearchText(city);
    if(cs&&tokens.includes(cs))cityTokens.add(cs);
  });

  const distinctive=tokens.filter(t=>!genericTokens.has(t)&&!stopWords.has(t)&&!cityTokens.has(t));
  return {qSmart,tokens,targets,genericTokens,cityTokens,distinctive,firmIntent:distinctive.length>0};
}

function smartNameTokenMatch(nameSmart,tokens){
  const hs=smartSearchText(nameSmart).split(/\s+/).filter(Boolean);
  return tokens.every(n=>hs.some(h=>h===n||(n.length>=3&&h.startsWith(n))||(h.length>=3&&n.startsWith(h))));
}
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

const turkiyeCitiesSearch=["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];

function resolveSearchLocation(d){
  // Önce yönetim panelindeki açık il/ilçe alanlarını kullan.
  // Eski kayıtlarda ilçe boşsa adres içinden tamamla.
  const explicitCity=String(d.city||"").trim();
  const canonicalExplicitCity=turkiyeCitiesSearch.find(
    x=>norm(x)===norm(explicitCity)
  );
  let city=canonicalExplicitCity||explicitCity;
  let district=String(d.district||"").trim();

  const addrLoc=locationFromAddress(d.address);

  if(!city && addrLoc?.city){
    city=addrLoc.city;
  }

  if(!district && addrLoc?.district){
    district=addrLoc.district;
  }

  if(!city){
    const sources=[d.location,d.address].map(v=>String(v||"").toLocaleLowerCase("tr-TR"));
    for(const source of sources){
      const found=turkiyeCitiesSearch.find(x=>source.includes(x.toLocaleLowerCase("tr-TR")));
      if(found){city=found;break}
    }
  }

  return {city,district};
}
let companies=[];
const RESULT_PAGE_SIZE=50;
let visibleResultCount=RESULT_PAGE_SIZE;
let lastRenderedResults=[];
let resultLoadObserver=null;

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
    snap.forEach(doc=>{const d=doc.data()||{};if(String(d.status||"active")==="passive")return;const fixedLoc=resolveSearchLocation(d);const fixedCity=fixedLoc.city||"";const fixedDistrict=cleanDistrictName(fixedLoc.district||"");companies.push({id:doc.id,name:d.name||"Firma",mainCategory:mainCategory(d),category:d.category||"",subCategory:d.subCategory||"",city:fixedCity,district:fixedDistrict,address:d.address||"",location:d.location||"",description:d.description||"",keywords:Array.isArray(d.searchKeywords)?d.searchKeywords:[],highlights:Array.isArray(d.highlights)?d.highlights:[],programs:Array.isArray(d.programs)?d.programs:(d.programs?[d.programs]:[]),logoUrl:d.logoUrl||d.profileImageUrl||"",cardImageUrl:d.cardImageUrl||d.profileImageUrl||"",coverUrl:d.coverUrl||"",coverUrls:Array.isArray(d.coverUrls)?d.coverUrls.filter(Boolean):[],phone:d.phone||"",website:d.website||"",whatsapp:d.whatsapp||d.phone||"",vip:Boolean(d.vip),has360Tour:valid360Url(d.tour360Url||d.virtualTourUrl||d.tour360||d.panoramaUrl),tour360Url:valid360Url(d.tour360Url||d.virtualTourUrl||d.tour360||d.panoramaUrl)?String(d.tour360Url||d.virtualTourUrl||d.tour360||d.panoramaUrl||"").trim():"",galleryUrls:Array.isArray(d.galleryUrls)?d.galleryUrls:[],
campaignActive:Boolean(d.campaignActive||d.hasCampaign),
campaignTitle:d.campaignTitle||d.promotionTitle||"",
campaignText:d.campaignText||d.campaignDescription||d.promotionText||"",
campaignBadge:d.campaignBadge||d.promotionBadge||"Kampanya",
campaignEnd:d.campaignEnd||d.campaignEndDate||"",
campaignImageUrl:d.campaignImageUrl||d.promotionImageUrl||"",
campaignUrl:d.campaignUrl||d.promotionUrl||"",
sponsored:Boolean(d.sponsored||d.isSponsored||d.vipSponsored||d.advertiser),
searchPopupActive:Boolean(d.searchPopupActive),
searchPopupStartDate:d.searchPopupStartDate||"",
searchPopupEndDate:d.searchPopupEndDate||"",
searchPopupCity:d.searchPopupCity||"",
searchPopupDistrict:d.searchPopupDistrict||"",
searchPopupTitle:d.searchPopupTitle||"",
searchPopupText:d.searchPopupText||"",
searchPopupMediaType:d.searchPopupMediaType||"image",
searchPopupFrequency:d.searchPopupFrequency||"session",
searchPopupScope:d.searchPopupScope||"search_results",
searchPopupPlacements:Array.isArray(d.searchPopupPlacements)?d.searchPopupPlacements:[],
searchPopupSector:d.searchPopupSector||"",
searchPopupSubCategory:d.searchPopupSubCategory||"",
searchPopupMediaUrl:d.searchPopupMediaUrl||"",
searchPopupButtonText:d.searchPopupButtonText||"Firmayı İncele",
searchPopupTargetUrl:d.searchPopupTargetUrl||"",
searchPopupOrder:Number(d.searchPopupOrder||999999),
mapUrl:d.mapUrl||d.googleMapsUrl||d.mapsUrl||"",
latitude:d.latitude||d.lat||"",
longitude:d.longitude||d.lng||d.lon||""
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
function automaticCategoryDescription(i){
  const sub=String(i.subCategory||i.category||"").trim();
  const descriptions={
    surucu:"Ehliyet eğitimi ve direksiyon dersleri sunar.",
    kres:"Okul öncesi eğitim ve çocuk gelişimi hizmetleri sunar.",
    dershane:"Sınav hazırlık ve akademik destek programları sunar.",
    yurt:"Öğrencilere konaklama ve yurt hizmetleri sunar.",
    oto_servis:"Araç bakım, onarım ve teknik servis hizmetleri sunar.",
    ekspertiz:"Araç ekspertiz ve kontrol hizmetleri sunar.",
    kafe:"Kafe ve yiyecek-içecek hizmetleri sunar.",
    restoran:"Yeme-içme ve restoran hizmetleri sunar.",
    dis_klinigi:"Ağız ve diş sağlığı hizmetleri sunar.",
    psikolog:"Psikolojik danışmanlık ve destek hizmetleri sunar.",
    guzellik:"Güzellik ve kişisel bakım hizmetleri sunar.",
    kuafor:"Saç bakım ve kuaförlük hizmetleri sunar.",
    mobilya:"Mobilya ve yaşam alanı çözümleri sunar.",
    emlak_ofisi:"Gayrimenkul danışmanlığı ve emlak hizmetleri sunar.",
    otel:"Konaklama ve misafir ağırlama hizmetleri sunar.",
    fotograf:"Fotoğraf çekimi ve görsel hizmetler sunar.",
    video:"Video çekimi ve prodüksiyon hizmetleri sunar.",
    nakliyat:"Taşımacılık ve nakliye hizmetleri sunar.",
    hukuk:"Hukuki danışmanlık ve avukatlık hizmetleri sunar.",
    muhasebe:"Muhasebe ve mali müşavirlik hizmetleri sunar.",
    web:"Web tasarım ve dijital çözümler sunar.",
    sosyal_medya:"Sosyal medya yönetimi ve dijital iletişim hizmetleri sunar.",
    veteriner:"Veterinerlik ve hayvan sağlığı hizmetleri sunar.",
    market:"Market ve günlük ihtiyaç ürünleri sunar."
  };
  return descriptions[sub]||"İhtiyacınıza yönelik hizmet ve çözümler sunar.";
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
  let images=Array.isArray(i.coverUrls)?i.coverUrls.map(x=>String(x||"").trim()).filter(Boolean):[];
  if(!images.length){
    const legacy=String(i.cardImageUrl||i.coverUrl||"").trim();
    if(legacy)images=[legacy];
  }
  images=[...new Set(images)].slice(0,6);

  if(images.length){
    const slides=images.map((url,index)=>'<img class="result-visual-slide'+(index===0?' active':'')+'" data-result-slide="'+index+'" data-result-image-open src="'+esc(url)+'" alt="'+esc(i.name)+' görseli '+(index+1)+'" loading="lazy">').join("");
    return '<div class="result-visual result-visual-slider" data-result-slider data-result-index="0" data-result-firm-id="'+esc(i.id)+'" data-result-firm-name="'+esc(i.name)+'">'+
      slides+
      (images.length>1?'<button type="button" class="result-slide-nav prev" data-result-slide-prev aria-label="Önceki görsel">‹</button><button type="button" class="result-slide-nav next" data-result-slide-next aria-label="Sonraki görsel">›</button><span class="result-slide-count">1 / '+images.length+'</span>':'')+
      '<span class="result-enlarge-hint" aria-hidden="true"><span class="result-enlarge-icon">⌕</span><span class="desktop-label">Büyüt</span><span class="mobile-label">Dokun</span></span>'+
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

const TURKEY_PROVINCES=["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];
const cityHeroCache=new Map();
let cityHeroRequestToken=0;
let cityBannersMasterActiveCache=null;
async function loadCityBannersMasterActive(){
  if(cityBannersMasterActiveCache!==null)return cityBannersMasterActiveCache;
  try{
    const snap=await db.collection("siteSettings").doc("cityBanners").get();
    cityBannersMasterActiveCache=snap.exists&&snap.data()?.active===true;
  }catch(_){cityBannersMasterActiveCache=false}
  return cityBannersMasterActiveCache;
}
function cityHeroKey(value){
  return String(value||"").trim().toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");
}
function sponsorDateActive(cfg){
  if(!cfg?.sponsorActive)return false;
  const today=new Date().toISOString().slice(0,10);
  const start=String(cfg.sponsorStartDate||"").slice(0,10);
  const end=String(cfg.sponsorEndDate||"").slice(0,10);
  return (!start||today>=start)&&(!end||today<=end);
}
async function commonsCityImage(city){
  const key="commons:"+cityHeroKey(city);
  if(cityHeroCache.has(key))return cityHeroCache.get(key);
  try{
    const q=encodeURIComponent(city+" Turkey city landmark");
    const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+q+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*";
    const res=await fetch(url);
    const data=await res.json();
    const pages=Object.values(data?.query?.pages||{});
    const page=pages.find(p=>p?.imageinfo?.[0]?.thumburl||p?.imageinfo?.[0]?.url);
    const image=page?.imageinfo?.[0]?.thumburl||page?.imageinfo?.[0]?.url||"";
    cityHeroCache.set(key,image);
    return image;
  }catch(_){return ""}
}
async function loadCityHeroConfig(city){
  const key=cityHeroKey(city);
  if(cityHeroCache.has("cfg:"+key))return cityHeroCache.get("cfg:"+key);
  try{
    const snap=await db.collection("cityBanners").doc(key).get();
    const cfg=snap.exists?snap.data()||{}:{};
    cityHeroCache.set("cfg:"+key,cfg);
    return cfg;
  }catch(_){return {}}
}
async function updateCityHero(){
  const token=++cityHeroRequestToken;
  const hero=document.getElementById("cityHero");
  const img=document.getElementById("cityHeroImage");
  const title=document.getElementById("cityHeroTitle");
  const subtitle=document.getElementById("cityHeroSubtitle");
  const sponsor=document.getElementById("cityHeroSponsor");
  const sponsorLogo=document.getElementById("cityHeroSponsorLogo");
  const sponsorName=document.getElementById("cityHeroSponsorName");
  const sponsorText=document.getElementById("cityHeroSponsorText");
  const sponsorLink=document.getElementById("cityHeroSponsorLink");
  const cityEl=document.getElementById("citySelect");
  const districtEl=document.getElementById("districtSelect");
  if(!hero||!img||!title||!subtitle||!cityEl)return;
  const city=String(cityEl.value||"").trim();
  const district=String(districtEl?.value||"").trim();
  const masterActive=await loadCityBannersMasterActive();
  if(!masterActive){
    hero.classList.add("hidden");hero.setAttribute("aria-hidden","true");img.removeAttribute("src");return;
  }
  if(!city){
    hero.classList.add("hidden");hero.setAttribute("aria-hidden","true");img.removeAttribute("src");
    return;
  }
  const cfg=await loadCityHeroConfig(city);
  const src=String(cfg.imageUrl||"").trim();
  if(token!==cityHeroRequestToken)return;
  if(cfg.active!==true||!src){
    hero.classList.add("hidden");hero.setAttribute("aria-hidden","true");img.removeAttribute("src");return;
  }
  img.src=src;
  img.alt=city+" şehir görünümü";
  title.textContent=String(cfg.title||"").trim()||city+"’de keşfet";
  subtitle.textContent=String(cfg.subtitle||"").trim()||(district?city+" / "+district+" bölgesindeki işletmeleri incele":city+" bölgesindeki işletmeleri incele");
  hero.classList.remove("hidden");
  hero.setAttribute("aria-hidden","false");
  const showSponsor=sponsorDateActive(cfg);
  if(sponsor){
    sponsor.classList.toggle("hidden",!showSponsor);
    if(showSponsor){
      if(sponsorLogo){
        const logo=String(cfg.sponsorLogoUrl||"").trim();
        sponsorLogo.src=logo||"";
        sponsorLogo.classList.toggle("hidden",!logo);
      }
      sponsorName.textContent=String(cfg.sponsorName||"Sponsor").trim()||"Sponsor";
      sponsorText.textContent=String(cfg.sponsorText||"").trim();
      sponsorText.classList.toggle("hidden",!String(cfg.sponsorText||"").trim());
      sponsorLink.href=String(cfg.sponsorUrl||"#").trim()||"#";
      sponsorLink.textContent=String(cfg.sponsorButtonText||"İncele").trim()||"İncele";
    }
  }
}
function render(data,{keepLimit=false}={}){
  const grid=document.getElementById("companyGrid"),sum=document.getElementById("resultSummary");
  if(!grid||!sum)return;

  lastRenderedResults=data;
  if(!keepLimit)visibleResultCount=RESULT_PAGE_SIZE;
  const visibleData=data.slice(0,visibleResultCount);

  sum.textContent=data.length+" firma";
  const title=document.getElementById("resultsTitle");
  const context=document.getElementById("resultsContext");
  const search=document.getElementById("searchInput");
  const city=document.getElementById("citySelect");
  const district=document.getElementById("districtSelect");
  updateCityHero();

  if(title){
    title.textContent="Arama sonuçları";
  }
  if(context){
    const loc=[city?.value,district?.value].filter(Boolean).join(" / ");
    const sectorEl=document.getElementById("sectorSelect");
    const subEl=document.getElementById("subCategorySelect");
    const sectorValue=sectorEl?.value||"";
    const subValue=subEl?.value||"";
    const sectorLabel=sectorValue ? (categoryLabels[sectorValue]||sectorEl?.options?.[sectorEl.selectedIndex]?.text||sectorValue) : "";
    const subLabel=subValue ? (subcategoryMap[sectorValue]?.[subValue]||subEl?.options?.[subEl.selectedIndex]?.text||subValue) : "";
    const q=String(search?.value||"").trim();

    const targetLabel=subLabel||sectorLabel||q;
    const targetSuffix=subLabel ? " alanındaki uygun işletmeler listeleniyor."
      : sectorLabel ? " sektöründeki uygun işletmeler listeleniyor."
      : q ? " aramasına uygun işletmeler listeleniyor."
      : "Aramana uygun işletmeler listeleniyor.";

    if(targetLabel){
      context.innerHTML=(loc ? '<strong>'+esc(loc)+'</strong> bölgesinde ' : '')
        +'<strong>'+esc(targetLabel)+'</strong>'+targetSuffix;
    }else{
      context.textContent="Aramana uygun işletmeler listeleniyor.";
    }
  }
  const locationNotice=document.getElementById("locationNotice");
  if(locationNotice){
    const hasCity=Boolean(city?.value);
    locationNotice.classList.toggle("hidden",hasCity);
    const noticeTitle=locationNotice.querySelector("strong");
    const noticeText=locationNotice.querySelector(".location-notice-left span");
    if(noticeTitle)noticeTitle.textContent=data.length>0 ? "Türkiye geneli sonuçlar" : "Konum seçerek tekrar deneyin";
    if(noticeText)noticeText.innerHTML=data.length>0
      ? '<strong class="location-prefix">Yakınındaki firmalar için</strong> konum seç.'
      : "İl veya ilçe seçerek aramanı daraltabilirsin.";
  }

  if(!data.length){
    grid.innerHTML='<div class="results-state no-result-state"><button type="button" class="no-result-mascot" data-open-category-search aria-label="Yeni arama yap"><img src="./assets/diji-mascot-v2.png" alt="Diji maskotu"></button><strong>Uygun firma bulunamadı.</strong><span>Arama kelimesini, sektör veya konum filtresini değiştirerek tekrar deneyin.</span><button type="button" class="new-search-popup-btn" data-open-category-search>Yeni arama yap</button></div>';
    return;
  }

  const normalCards=visibleData.map(i=>{
    const logo=i.logoUrl
      ? '<img src="'+esc(i.logoUrl)+'" alt="'+esc(i.name)+' logosu">'
      : '<span>'+esc(initials(i.name))+'</span>';
    const loc=[i.city,i.district].filter(Boolean).join(" · ")||i.location||"Konum bilgisi";
    const storedDesc=String(i.description||"").trim();
    const autoStored=/\bbölgesinde\s+hizmet\s+veren\b/i.test(storedDesc)
      || /\bişletmesidir\.?\s*$/i.test(storedDesc);
    const desc=(storedDesc && !autoStored)
      ? storedDesc
      : automaticCategoryDescription(i);
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
  const sponsored=visibleData.filter(campaignIsActive).map(campaignCard);
  const merged=[];
  normalCards.forEach((card,index)=>{
    merged.push(card);
    if(index===1 && sponsored.length)merged.push(sponsored[0]);
    if(index===5 && sponsored.length>1)merged.push(sponsored[1]);
  });
  if(!normalCards.length && sponsored.length)merged.push(...sponsored);

  const hasMore=visibleData.length<data.length;
  if(hasMore){
    merged.push('<div class="results-load-more" data-results-sentinel><button type="button" data-load-more-results>Daha fazla firma göster</button><span>'+visibleData.length+' / '+data.length+' gösteriliyor</span></div>');
  }
  grid.innerHTML=merged.join("");

  if(resultLoadObserver){
    resultLoadObserver.disconnect();
    resultLoadObserver=null;
  }
  const sentinel=grid.querySelector("[data-results-sentinel]");
  if(sentinel&&"IntersectionObserver" in window){
    resultLoadObserver=new IntersectionObserver(entries=>{
      if(!entries.some(entry=>entry.isIntersecting))return;
      resultLoadObserver?.disconnect();
      visibleResultCount=Math.min(visibleResultCount+RESULT_PAGE_SIZE,lastRenderedResults.length);
      render(lastRenderedResults,{keepLimit:true});
    },{rootMargin:"500px 0px"});
    resultLoadObserver.observe(sentinel);
  }
}

document.addEventListener("click",e=>{
  const btn=e.target.closest("[data-load-more-results]");
  if(!btn)return;
  visibleResultCount=Math.min(visibleResultCount+RESULT_PAGE_SIZE,lastRenderedResults.length);
  render(lastRenderedResults,{keepLimit:true});
});
async function loadManagedSearchCategories(){
  try{
    const snap=await db.collection("siteCategories").get();
    snap.docs.forEach(d=>{
      const x=d.data()||{},key=d.id;
      if(x.active===false){delete categoryLabels[key];delete subcategoryMap[key];return}
      if(x.label)categoryLabels[key]=x.label;
      if(!subcategoryMap[key])subcategoryMap[key]={};
      Object.assign(subcategoryMap[key],x.subcategories||{});
    });
  }catch(_){}
}
let currentSearchSponsorAd=null;

function maybeShowSearchSponsorPopup(cityValue,districtValue,sectorValue,subCategoryValue){
  const nc=norm(cityValue),nd=norm(districtValue);
  const candidates=companies.filter(x=>{
    if(!x.searchPopupActive)return false;
    const placements=Array.isArray(x.searchPopupPlacements)&&x.searchPopupPlacements.length
      ?x.searchPopupPlacements
      :(String(x.searchPopupScope||"search_results")==="all_pages"?["all_pages"]:["search_popup"]);
    if(!placements.includes("search_popup")&&!placements.includes("all_pages"))return false;

    const targetSector=String(x.searchPopupSector||"").trim();
    const targetSubCategory=String(x.searchPopupSubCategory||"").trim();
    if(targetSector&&String(sectorValue||"")!==targetSector)return false;
    if(targetSubCategory&&String(subCategoryValue||"")!==targetSubCategory)return false;
    if(x.searchPopupStartDate){
      const start=new Date(x.searchPopupStartDate+"T00:00:00");
      if(!Number.isNaN(start.getTime())&&Date.now()<start.getTime())return false;
    }
    if(x.searchPopupEndDate){
      const end=new Date(x.searchPopupEndDate+"T23:59:59");
      if(!Number.isNaN(end.getTime())&&Date.now()>end.getTime())return false;
    }
    // Reklam hedefleme:
    // İl + ilçe: yalnız o ilçe
    // Yalnız il: ilin tüm ilçeleri
    // İl boş veya "__ALL__": Tüm Türkiye
    const popupCityRaw=String(x.searchPopupCity||"").trim();
    const isAllTurkey=!popupCityRaw || popupCityRaw==="__ALL__";
    const adCity=norm(popupCityRaw),adDistrict=normDistrict(x.searchPopupDistrict);
    if(!isAllTurkey){
      if(!cityValue)return false;
      if(adCity!==nc)return false;
      if(adDistrict&&(!nd||adDistrict!==normDistrict(nd)))return false;
    }
    return true;
  });
  if(!candidates.length)return;
  candidates.sort((a,b)=>{
    const score=x=>{
      const popupCityRaw=String(x.searchPopupCity||"").trim();
      if(!popupCityRaw||popupCityRaw==="__ALL__")return 0;
      if(normDistrict(x.searchPopupDistrict)&&normDistrict(x.searchPopupDistrict)===normDistrict(nd))return 2;
      return 1;
    };
    return (score(b)-score(a)) || (Number(a.searchPopupOrder||999999)-Number(b.searchPopupOrder||999999));
  });
  const ad=candidates[0],modal=document.getElementById("searchSponsorPopup");
  if(!modal)return;
  currentSearchSponsorAd=ad;
  const freq=ad.searchPopupFrequency||"session";
  const adKey="djs_search_sponsor_"+ad.id;
  const locationKey=norm([cityValue,districtValue].filter(Boolean).join("|"));
  const now=Date.now();
  try{
    if(freq==="session"){
      if(sessionStorage.getItem(adKey)==="1")return;
    }else if(freq==="location"){
      if(sessionStorage.getItem(adKey+"_loc_"+locationKey)==="1")return;
    }else if(freq==="daily"||freq==="3days"){
      const last=Number(localStorage.getItem(adKey+"_ts")||0);
      const gap=freq==="daily"?86400000:259200000;
      if(last&&now-last<gap)return;
    }
  }catch(_){};
  const media=document.getElementById("searchSponsorMedia");
  if(media){
    if(ad.searchPopupMediaUrl){
      media.innerHTML=ad.searchPopupMediaType==="video"
        ? '<video src="'+esc(ad.searchPopupMediaUrl)+'" controls playsinline preload="metadata"></video>'
        : '<img src="'+esc(ad.searchPopupMediaUrl)+'" alt="'+esc(ad.name)+'">';
    }else{
      media.innerHTML='<div style="padding:40px;text-align:center;color:#7b8798;font-weight:800">'+esc(ad.name)+'</div>';
    }
  }
  const region=document.getElementById("searchSponsorRegion");
  if(region){
    const popupCityRaw=String(ad.searchPopupCity||"").trim();
    region.textContent=(!popupCityRaw||popupCityRaw==="__ALL__")
      ?"Tüm Türkiye"
      :[cityValue,districtValue].filter(Boolean).join(" / ");
  }
  const title=document.getElementById("searchSponsorTitle");
  if(title)title.textContent=ad.searchPopupTitle||ad.name||"Bölgenizde öne çıkan firma";
  const text=document.getElementById("searchSponsorText");
  if(text)text.textContent=ad.searchPopupText||"";
  const link=document.getElementById("searchSponsorLink");
  if(link){
    link.textContent=ad.searchPopupButtonText||"Firmayı İncele";
    link.href=ad.searchPopupTargetUrl||("firma.html?id="+encodeURIComponent(ad.id));
  }

  const mapBox=document.getElementById("searchSponsorMapBox");
  const mapFrame=document.getElementById("searchSponsorMap");
  const directions=document.getElementById("searchSponsorDirections");
  const mapLink=document.getElementById("searchSponsorMapLink");
  const lat=String(ad.latitude||"").trim(),lng=String(ad.longitude||"").trim();
  const addressQuery=[ad.address,ad.district,ad.city].filter(Boolean).join(", ").trim();
  const destination=(lat&&lng)?(lat+","+lng):addressQuery;
  if(mapBox&&destination){
    const encoded=encodeURIComponent(destination);
    mapBox.classList.remove("hidden");
    if(mapFrame)mapFrame.src="https://www.google.com/maps?q="+encoded+"&output=embed";
    const directionsUrl="https://www.google.com/maps/dir/?api=1&destination="+encoded;
    const viewUrl=ad.mapUrl||("https://www.google.com/maps/search/?api=1&query="+encoded);
    if(directions)directions.href=directionsUrl;
    if(mapLink)mapLink.href=viewUrl;
  }else if(mapBox){
    mapBox.classList.add("hidden");
    if(mapFrame)mapFrame.removeAttribute("src");
  }

  hideSearchSponsorReopen();
  modal.classList.remove("hidden");
  document.body.classList.add("djs-modal-open");
  document.body.style.overflow="hidden";
  try{
    if(freq==="session")sessionStorage.setItem(adKey,"1");
    else if(freq==="location")sessionStorage.setItem(adKey+"_loc_"+locationKey,"1");
    else if(freq==="daily"||freq==="3days")localStorage.setItem(adKey+"_ts",String(now));
  }catch(_){}
}
function ensureSearchSponsorReopenButton(){
  let btn=document.getElementById("searchSponsorReopen");
  if(btn)return btn;
  btn=document.createElement("button");
  btn.id="searchSponsorReopen";
  btn.type="button";
  btn.className="search-sponsor-reopen hidden";
  btn.innerHTML='<span class="search-sponsor-reopen-badge">AD · Sponsor</span><strong>Reklamı tekrar gör</strong>';
  btn.addEventListener("click",()=>{
    const modal=document.getElementById("searchSponsorPopup");
    if(!modal||!currentSearchSponsorAd)return;
    btn.classList.add("hidden");
    modal.classList.remove("hidden");
    document.body.classList.add("djs-modal-open");
    document.body.style.overflow="hidden";
  });
  document.body.appendChild(btn);
  return btn;
}
function showSearchSponsorReopen(){
  if(!currentSearchSponsorAd)return;
  ensureSearchSponsorReopenButton().classList.remove("hidden");
}
function hideSearchSponsorReopen(){
  document.getElementById("searchSponsorReopen")?.classList.add("hidden");
}

function initSearchSponsorPopup(){
  const modal=document.getElementById("searchSponsorPopup");if(!modal)return;
  const close=()=>{modal.classList.add("hidden");if(!document.querySelector(".category-modal:not(.hidden),.location-picker-modal:not(.hidden),.tour360-modal:not(.hidden)"))document.body.classList.remove("djs-modal-open");document.body.style.overflow="";const v=modal.querySelector("video");if(v)try{v.pause()}catch(_){};showSearchSponsorReopen()};
  modal.querySelectorAll("[data-close-search-sponsor]").forEach(x=>x.addEventListener("click",close));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.classList.contains("hidden"))close()});
}
document.addEventListener("DOMContentLoaded",initSearchSponsorPopup);

async function initHome(){
  const search=document.getElementById("searchInput"),city=document.getElementById("citySelect"),district=document.getElementById("districtSelect"),sector=document.getElementById("sectorSelect"),subCategory=document.getElementById("subCategorySelect"),btn=document.getElementById("searchBtn"),chips=[...document.querySelectorAll(".chip")];
  if(!search)return;
  await loadManagedSearchCategories();
  if(sector){const current=sector.value;sector.innerHTML='<option value="">Tüm Sektörler</option>'+Object.entries(categoryLabels).map(([k,v])=>'<option value="'+k+'">'+esc(v)+'</option>').join("");sector.value=current;}
  const fillSubcategories=()=>{if(!subCategory)return;const map=subcategoryMap[sector.value]||{};subCategory.innerHTML='<option value="">Tüm Alt Kategoriler</option>'+Object.entries(map).map(([value,label])=>'<option value="'+value+'">'+label+'</option>').join("");subCategory.disabled=!sector.value};

  const modal=document.getElementById("categoryPickerModal");
  const categoryGrid=document.getElementById("categoryPickerGrid");
  const locationModal=document.getElementById("locationPickerModal");
  const popupCity=document.getElementById("popupCitySelect");
  const popupDistrict=document.getElementById("popupDistrictSelect");
  const locationSearchLabel=document.getElementById("locationSearchLabel");
  const applyPopupLocation=document.getElementById("applyPopupLocation");
  const allTurkeyBtn=document.getElementById("allTurkeyBtn");
  const pickerDescriptions={egitim:"Kurs, sürücü kursu, anaokulu, yurt",otomotiv:"Servis, ekspertiz, galeri, kiralama",yemeicme:"Restoran, kafe, pizza, döner",saglikguzellik:"Diş, psikolog, kuaför, spor",evyapi:"Mobilya, dekorasyon, teknik servis",emlak:"Konut, arsa, emlak ofisi",turizm:"Otel, pansiyon, apart",organizasyonmedya:"Fotoğraf, video, organizasyon",tasimacilik:"Nakliyat, kurye, teslimat",profesyonel:"Hukuk, muhasebe, web, danışmanlık",alisveris:"Market, giyim, elektronik, pet shop",diger:"Diğer kurum ve hizmetler"};
  const pickerCategories=Object.entries(categoryLabels).map(([key,title])=>[key,title,pickerDescriptions[key]||Object.values(subcategoryMap[key]||{}).slice(0,4).join(", ")||"Firma ve hizmetler"]);
  if(categoryGrid){
    categoryGrid.innerHTML=pickerCategories.map(([key,title,desc])=>{
      const subs=Object.entries(subcategoryMap[key]||{}).map(([subKey,subTitle])=>'<button type="button" class="category-subpick" data-pick-sector="'+key+'" data-pick-subcategory="'+subKey+'">'+esc(subTitle)+'</button>').join("");
      return '<div class="category-picker-item"><button type="button" class="category-pick" data-toggle-picker-sector="'+key+'"><span class="category-pick-copy"><strong>'+esc(title)+'</strong><span>'+esc(desc)+'</span></span><span class="category-pick-chevron">⌄</span></button><div class="category-subpanel hidden"><button type="button" class="category-subpick all" data-pick-sector="'+key+'">Tüm '+esc(title)+'</button>'+subs+'</div></div>';
    }).join("");
  }
  const openCategoryModal=()=>{modal?.classList.remove("hidden");document.body.classList.add("djs-modal-open");document.body.style.overflow="hidden"};
  const closeCategoryModal=()=>{modal?.classList.add("hidden");if(!document.querySelector(".location-picker-modal:not(.hidden),.search-sponsor-popup:not(.hidden),.tour360-modal:not(.hidden)"))document.body.classList.remove("djs-modal-open");document.body.style.overflow=""};

  const currentSearchLabel=()=>{
    const q=search.value.trim();
    if(q)return "“"+q+"”";
    const sc=subCategory?.value||"";
    if(sc)return "“"+(subcategoryMap[sector.value]?.[sc]||subCategory.options[subCategory.selectedIndex]?.text||"Aramanız")+"”";
    if(sector.value)return "“"+(categoryLabels[sector.value]||sector.options[sector.selectedIndex]?.text||"Aramanız")+"”";
    return "Aramanız";
  };
  const syncPopupLocation=async()=>{
    if(!popupCity||!popupDistrict)return;
    popupCity.innerHTML=city.innerHTML;
    popupCity.value=city.value||"";
    if(popupCity.value){
      await fillDistricts(popupCity,popupDistrict);
      popupDistrict.value=district.value||"";
    }else{
      popupDistrict.innerHTML='<option value="">Tüm İlçeler</option>';
      popupDistrict.disabled=true;
    }
    if(locationSearchLabel)locationSearchLabel.textContent=currentSearchLabel();
  };
  const openLocationModal=async()=>{
    await syncPopupLocation();
    locationModal?.classList.remove("hidden");
    document.body.classList.add("djs-modal-open");
    document.body.style.overflow="hidden";
  };
  const closeLocationModal=()=>{
    locationModal?.classList.add("hidden");
    if(!document.querySelector(".category-modal:not(.hidden),.search-sponsor-popup:not(.hidden),.tour360-modal:not(.hidden)"))document.body.classList.remove("djs-modal-open");
    document.body.style.overflow="";
  };
  document.querySelectorAll("[data-close-category-modal]").forEach(el=>el.addEventListener("click",closeCategoryModal));
  document.querySelectorAll("[data-close-location]").forEach(el=>el.addEventListener("click",closeLocationModal));
  document.addEventListener("keydown",e=>{if(e.key==="Escape"){closeCategoryModal();closeLocationModal()}});
  document.addEventListener("click",e=>{
    if(e.target.closest("[data-open-category-search]"))openCategoryModal();
    if(e.target.closest("[data-open-location]"))openLocationModal();

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
      openLocationModal();
    }
  });
  popupCity?.addEventListener("change",async()=>{await fillDistricts(popupCity,popupDistrict)});
  applyPopupLocation?.addEventListener("click",async()=>{
    city.value=popupCity?.value||"";
    if(city.value){
      await fillDistricts(city,district);
      district.value=popupDistrict?.value||"";
    }else{
      district.value="";
      district.innerHTML='<option value="">Tüm İlçeler</option>';
      district.disabled=true;
    }
    closeLocationModal();
    filter();
  });
  allTurkeyBtn?.addEventListener("click",()=>{
    city.value="";
    district.value="";
    district.innerHTML='<option value="">Tüm İlçeler</option>';
    district.disabled=true;
    closeLocationModal();
    filter();
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
    setTimeout(scrollToResultsTop,80);
  }));

  const showInitialState=()=>{setSearchCompactMode(false);
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
  function setSearchCompactMode(compact){
    const searchArea=document.querySelector(".search-area");
    if(!searchArea)return;
    searchArea.classList.toggle("compact",Boolean(compact));
  }

  const scrollToResultsTop=()=>{
    const head=document.getElementById("resultsHead");
    if(!head)return;
    const topbar=document.querySelector(".top");
    const topbarH=topbar?.offsetHeight||0;
    const y=head.getBoundingClientRect().top+window.pageYOffset-topbarH-6;
    window.scrollTo({top:Math.max(0,y),behavior:"smooth"});
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
  const filter=()=>{
    renderActiveFilters();
    const q=norm(search.value),c=norm(city.value),d=norm(district.value),s=sector.value,sc=subCategory?.value||"";
    if(!q&&!c&&!d&&!s&&!sc&&!feature360&&!only360Active){showInitialState();return}
    setSearchCompactMode(true);
    document.getElementById("resultsHead")?.classList.remove("hidden");

    const intent=analyzeSearchIntent(search.value);
    const ranked=[];

    companies.forEach(i=>{
      const h=norm([i.name,i.description,i.city,i.district,i.address,i.location,i.category,i.subCategory,i.mainCategory,categoryLabels[i.mainCategory]||"",subcategoryMap[i.mainCategory]?.[i.subCategory]||"",...(searchKeywords[i.subCategory]||[]),(i.keywords||[]).join(" "),(i.highlights||[]).join(" "),(i.programs||[]).join(" ")].join(" "));
      const hSmart=smartSearchText(h);
      const nameSmart=smartSearchText(i.name);
      const keywordMatch=intent.targets.length>0&&intent.targets.some(t=>i.subCategory===t||i.category===t);
      // İl seçildiyse yalnızca o ile kayıtlı firmalar gösterilir.
      // İlçe seçildiyse yalnızca o ilçedeki firmalar gösterilir.
      // İlçe boşsa seçilen ilin tüm ilçeleri gösterilir.
      const cityMatch=!c||norm(i.city)===c;
      const districtMatch=!d||normDistrict(i.district)===normDistrict(d);
      const sectorMatch=!s||i.mainCategory===s;
      const subMatch=!sc||i.subCategory===sc||i.category===sc;
      const tourMatch=!(feature360||only360Active)||valid360Url(i.tour360Url);

      // Seçilen şehir/ilçe her zaman kesin filtre olarak uygulanır.
      // Örn. Adana seçildiyse Çanakkale'deki kurumlar sonuçlara girmez.
      if(!cityMatch||!districtMatch||!sectorMatch||!subMatch||!tourMatch)return;

      let textMatch=!q;
      let score=0;

      if(q){
        const exactName=nameSmart===intent.qSmart;
        const nameIncludes=nameSmart.includes(intent.qSmart);
        const distinctiveNameMatch=intent.distinctive.length>0&&smartNameTokenMatch(nameSmart,intent.distinctive);
        const fullTokenMatch=intent.tokens.length>0&&smartTokenMatch(hSmart,intent.qSmart);

        if(intent.firmIntent){
          // Firma adı gibi görünen aramalarda ortak kategori kelimeleri tek başına sonuç üretmesin.
          textMatch=exactName||nameIncludes||distinctiveNameMatch;
          if(exactName)score+=1000;
          else if(nameIncludes)score+=850;
          else if(distinctiveNameMatch)score+=650;
          if(keywordMatch)score+=80;
        }else{
          // "sürücü kursu", "anaokulu", "oto servis" gibi hizmet aramalarında geniş sonuç ver.
          textMatch=h.includes(q)||hSmart.includes(intent.qSmart)||fullTokenMatch||keywordMatch;
          if(nameIncludes)score+=350;
          if(keywordMatch)score+=220;
          if(fullTokenMatch)score+=120;
        }

        // Arama içinde şehir adı yazılmışsa ilgili şehirdeki firmaları öne çıkar.
        if(intent.cityTokens.size){
          const locSmart=smartSearchText([i.city,i.district,i.address,i.location].join(" "));
          const cityQueryMatch=[...intent.cityTokens].every(t=>locSmart.includes(t));
          if(!cityQueryMatch)return;
          score+=100;
        }
      }

      if(textMatch)ranked.push({item:i,score});
    });

    ranked.sort((a,b)=>b.score-a.score||String(a.item.name||"").localeCompare(String(b.item.name||""),"tr"));
    const filtered=ranked.map(x=>x.item);
    render(filtered);
    setTimeout(()=>maybeShowSearchSponsorPopup(city.value,district.value,sector.value,subCategory?.value||""),180);
    if(feature360){
      const title=document.getElementById("resultsTitle"),context=document.getElementById("resultsContext");
      if(title)title.textContent="360° Mekânlar";
      if(context)context.textContent="Sanal tur ile gezebileceğiniz işletmeler listeleniyor.";
    }
  };

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
    setTimeout(scrollToResultsTop,140);
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
  if(hasInitial){
    filter();
    requestAnimationFrame(()=>setTimeout(scrollToResultsTop,120));
  }else showInitialState();
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
      document.body.classList.add("djs-modal-open");
      document.body.style.overflow="hidden";
      return;
    }
    if(e.target.closest("[data-close-360]"))close();
  });
  document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!modal.classList.contains("hidden"))close()});
}
document.addEventListener("DOMContentLoaded",init360Popup);


function moveResultCardSlider(button,delta){
  const slider=button?.closest("[data-result-slider]");
  if(!slider)return;
  const slides=[...slider.querySelectorAll("[data-result-slide]")];
  if(slides.length<2)return;
  let index=Number(slider.dataset.resultIndex||0);
  index=(index+delta+slides.length)%slides.length;
  slider.dataset.resultIndex=String(index);
  slides.forEach((slide,i)=>slide.classList.toggle("active",i===index));
  const count=slider.querySelector(".result-slide-count");
  if(count)count.textContent=(index+1)+" / "+slides.length;
}
document.addEventListener("click",e=>{
  const prev=e.target.closest("[data-result-slide-prev]");
  const next=e.target.closest("[data-result-slide-next]");
  if(!prev&&!next)return;
  e.preventDefault();
  e.stopPropagation();
  moveResultCardSlider(prev||next,prev?-1:1);
});


function initResultImageLightbox(){
  let modal=document.getElementById("resultImageLightbox");
  if(!modal){
    modal=document.createElement("div");
    modal.id="resultImageLightbox";
    modal.className="result-image-lightbox hidden";
    modal.innerHTML=
      '<div class="result-image-lightbox-backdrop" data-lightbox-close></div>'+
      '<div class="result-image-lightbox-card" role="dialog" aria-modal="true" aria-label="Firma görsel galerisi">'+
        '<div class="result-image-lightbox-head">'+
          '<div><small>FİRMA GÖRSELLERİ</small><strong id="resultLightboxFirmName">Firma</strong></div>'+
          '<button type="button" class="result-image-lightbox-close" data-lightbox-close aria-label="Kapat">×</button>'+
        '</div>'+
        '<div class="result-image-lightbox-stage">'+
          '<img id="resultLightboxImage" alt="Firma görseli">'+
          '<button type="button" class="result-image-lightbox-nav prev" data-lightbox-prev aria-label="Önceki görsel">‹</button>'+
          '<button type="button" class="result-image-lightbox-nav next" data-lightbox-next aria-label="Sonraki görsel">›</button>'+
          '<span id="resultLightboxCount" class="result-image-lightbox-count"></span>'+
        '</div>'+
        '<div class="result-image-lightbox-foot">'+
          '<span>Görselleri sağ / sol oklarla veya mobilde kaydırarak gezebilirsin.</span>'+
          '<a id="resultLightboxFirmLink" href="arama.html">Firmayı İncele</a>'+
        '</div>'+
      '</div>';
    document.body.appendChild(modal);
  }

  const img=document.getElementById("resultLightboxImage");
  const name=document.getElementById("resultLightboxFirmName");
  const count=document.getElementById("resultLightboxCount");
  const link=document.getElementById("resultLightboxFirmLink");
  let images=[],index=0;

  const render=()=>{
    if(!images.length)return;
    index=(index+images.length)%images.length;
    img.src=images[index];
    count.textContent=(index+1)+" / "+images.length;
    const show=images.length>1;
    modal.querySelector("[data-lightbox-prev]").style.display=show?"grid":"none";
    modal.querySelector("[data-lightbox-next]").style.display=show?"grid":"none";
  };
  const open=(slider,clicked)=>{
    images=[...slider.querySelectorAll("[data-result-slide]")].map(x=>x.src).filter(Boolean);
    index=Math.max(0,[...slider.querySelectorAll("[data-result-slide]")].indexOf(clicked));
    name.textContent=slider.dataset.resultFirmName||"Firma";
    link.href="firma.html?id="+encodeURIComponent(slider.dataset.resultFirmId||"");
    render();
    modal.classList.remove("hidden");
    document.body.style.overflow="hidden";
  };
  const close=()=>{
    modal.classList.add("hidden");
    img.removeAttribute("src");
    document.body.style.overflow="";
  };
  const move=delta=>{if(images.length>1){index+=delta;render()}};

  document.addEventListener("click",e=>{
    const clicked=e.target.closest("[data-result-image-open]");
    if(clicked){
      e.preventDefault();
      e.stopPropagation();
      const slider=clicked.closest("[data-result-slider]");
      if(slider)open(slider,clicked);
      return;
    }
    if(e.target.closest("[data-lightbox-close]")){e.preventDefault();close();return}
    if(e.target.closest("[data-lightbox-prev]")){e.preventDefault();move(-1);return}
    if(e.target.closest("[data-lightbox-next]")){e.preventDefault();move(1);return}
  });

  let touchX=0;
  modal.addEventListener("touchstart",e=>{touchX=e.touches[0]?.clientX||0},{passive:true});
  modal.addEventListener("touchend",e=>{
    const end=e.changedTouches[0]?.clientX||0;
    const diff=end-touchX;
    if(Math.abs(diff)>45)move(diff<0?1:-1);
  },{passive:true});

  document.addEventListener("keydown",e=>{
    if(modal.classList.contains("hidden"))return;
    if(e.key==="Escape")close();
    if(e.key==="ArrowLeft")move(-1);
    if(e.key==="ArrowRight")move(1);
  });
}
document.addEventListener("DOMContentLoaded",initResultImageLightbox);


document.addEventListener("DOMContentLoaded",()=>{
  const img=document.getElementById("cityHeroImage");
  if(!img||img.dataset.cityHeroImageErrorBound)return;
  img.dataset.cityHeroImageErrorBound="1";
  img.addEventListener("error",()=>{
    const hero=document.getElementById("cityHero");
    if(hero){hero.classList.add("hidden");hero.setAttribute("aria-hidden","true")}
  });
});
