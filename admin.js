const firebaseConfig={apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",authDomain:"dijiyer.firebaseapp.com",projectId:"dijiyer",storageBucket:"dijiyer.firebasestorage.app",messagingSenderId:"847787778815",appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"};
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
const legacyAccountRegistrationApp=firebase.apps.find(a=>a.name==="legacyInstitutionRegistration")||firebase.initializeApp(firebaseConfig,"legacyInstitutionRegistration");
const legacyAccountRegistrationAuth=legacyAccountRegistrationApp.auth();
const legacyAccountRegistrationDb=legacyAccountRegistrationApp.firestore();
const ADMIN_EMAIL="ftmotiondesign@gmail.com";
const CLOUDINARY_CLOUD_NAME="okefpzsy";
const CLOUDINARY_UPLOAD_PRESET="dijiyer_upload";

const categories={egitim:"Eğitim",otomotiv:"Otomotiv",yemeicme:"Yeme & İçme",saglikguzellik:"Sağlık & Güzellik",evyapi:"Ev & Yapı",emlak:"Emlak",turizm:"Turizm & Konaklama",organizasyonmedya:"Organizasyon & Medya",tasimacilik:"Taşımacılık & Teslimat",profesyonel:"Profesyonel Hizmetler",alisveris:"Alışveriş & Yerel Esnaf",diger:"Diğer"};
let firms=[],applications=[],members=[],tourLeads=[],campaignFilter="all",managedCategoryDocs=[];
const selectedMemberIds=new Set();
let visibleMemberIds=[];
const selectedFirmIds=new Set();
let visibleFirmIds=[];
let quickImportQueue=[];
let editingCoverUrls=[];
let googlePlaceResults=[];
const selectedGooglePlaceIds=new Set();
let googleMapsLoadPromise=null;

const $=id=>document.getElementById(id);
const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").trim();
const initials=v=>String(v||"F").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("tr-TR");
const CITY_BANNER_PROVINCES=["Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir","Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır","Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkari","Hatay","Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli","Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu","Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa","Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın","Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"];
const cityBannerKey=v=>String(v||"").trim().toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c").replace(/[^a-z0-9]+/g,"-").replace(/^-|-$/g,"");

function showLogin(){ $("loginView").classList.remove("hidden");$("panelView").classList.add("hidden") }
function showPanel(){
  $("loginView").classList.add("hidden");
  $("panelView").classList.remove("hidden");
  const requested=location.hash.replace("#","");
  setView(requested||"overview",{updateHash:false});
  loadAll();
}

auth.onAuthStateChanged(user=>{
  if(user && String(user.email||"").toLowerCase()===ADMIN_EMAIL){showPanel()}
  else{if(user)auth.signOut();showLogin()}
});

$("loginForm").addEventListener("submit",async e=>{
  e.preventDefault();
  const msg=$("loginMessage");msg.className="message";msg.textContent="Giriş yapılıyor...";
  try{
    const cred=await auth.signInWithEmailAndPassword($("loginEmail").value.trim(),$("loginPassword").value);
    if(String(cred.user.email||"").toLowerCase()!==ADMIN_EMAIL)throw new Error("Bu hesap yönetici hesabı değil.");
    msg.className="message success";msg.textContent="Giriş başarılı.";
  }catch(err){msg.className="message error";msg.textContent=err.message||"Giriş yapılamadı."}
});
$("logoutBtn").addEventListener("click",()=>auth.signOut());

function setView(name,opts={}){
  const panel=document.querySelector('[data-panel-view="'+name+'"]');
  if(!panel)name="overview";
  if(opts.updateHash!==false){
    const nextHash="#"+name;
    if(location.hash!==nextHash) history.replaceState(null,"",location.pathname+location.search+nextHash);
  }
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===name));
  document.querySelectorAll("[data-panel-view]").forEach(x=>x.classList.toggle("active",x.dataset.panelView===name));
  const titles={overview:["Genel Bakış","DijiyeSor yönetim merkezi"],firms:["Firmalar","Profil, görünürlük ve sponsor ayarları"],"auto-firm-import":["Otomatik Firma Topla","Şehir ve kategori seçerek firmaları taslak olarak içe aktar"],"google-import":["Hızlı Firma Ekle","Google’da gördüğün firmaları API kullanmadan toplu kaydet"],campaigns:["Kampanyalar & Reklamlar","Sponsorlu içerikleri yönet"],keywords:["Anahtar Kelimeler","Google arama önerilerini incele ve DijiyeSor’a ekle"],categories:["Kategori Yönetimi","Arama kategorileri ve alt kategorileri yönet"],"city-banners":["Şehir Görselleri","81 il görsellerini ve şehir sponsorlarını yönet"],qr:["QR / NFC Kartlar","Kart siparişlerini ve firma kartlarını yönet"],"menu-qr":["Menü QR","Menü QR siparişlerini yönet"],"google-qr":["Google QR","Google Yorum Kartı siparişlerini yönet"],applications:["Başvurular","Yeni firma başvurularını incele"],members:["Üyeler","Kurum hesaplarını ve onaylanan üyeleri yönet"],revenue:["Gelir Alanları","NFC / QR Kart, 360° mekan ve diğer gelir modülleri"],"sponsor-ads":["Sponsor Reklam Alanları","İlk arama popup reklamını yönet"],media:["360° Mekan","360° çekim taleplerini ve medya fırsatlarını takip et"],settings:["Ayarlar","Panel seçenekleri"]};
  $("pageTitle").textContent=titles[name]?.[0]||"Yönetim";
  $("pageSubtitle").textContent=titles[name]?.[1]||"";
  document.querySelector(".sidebar").classList.remove("open");
  if(name==="city-banners")initCityBannerAdmin();
}
document.addEventListener("click",e=>{
  const nav=e.target.closest("[data-view]");if(nav)setView(nav.dataset.view);
  const go=e.target.closest("[data-go]");if(go)setView(go.dataset.go);
  const quick=e.target.closest("[data-quick]");
  if(quick){
    if(quick.dataset.quick==="addFirm")openFirmModal();
    else { setView(quick.dataset.quick); if(quick.dataset.quick==="qr")setQrMode("orders"); }
  }
  const close=e.target.closest("[data-close]");if(close)$(close.dataset.close).classList.add("hidden");
});

$("keywordSectorFilter")?.addEventListener("change",renderKeywordTable);
$("keywordSearchInput")?.addEventListener("input",renderKeywordTable);
$("keywordGoogleFetchBtn")?.addEventListener("click",()=>{
  const msg=$("keywordMessage");
  if(msg){
    msg.textContent="Google arama hacmini çekmek için Google Ads Keyword Planner API bağlantısı gerekiyor. Arayüz hazır.";
    msg.className="message";
  }
});
document.addEventListener("click",e=>{
  const btn=e.target.closest("[data-add-keyword]");
  if(!btn)return;
  addKeywordToDijiyesor(btn.dataset.addKeyword,btn.dataset.keywordSector,btn);
});
loadAddedKeywords();

$("mobileMenuBtn").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));

window.addEventListener("hashchange",()=>{
  if(!$("panelView")?.classList.contains("hidden")){
    const requested=location.hash.replace("#","");
    setView(requested||"overview",{updateHash:false});
  }
});



let cityBannerAdminReady=false;
async function adminCommonsCityImage(city){
  try{
    const q=encodeURIComponent(city+" Turkey city landmark");
    const url="https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch="+q+"&gsrnamespace=6&gsrlimit=8&prop=imageinfo&iiprop=url&iiurlwidth=1600&format=json&origin=*";
    const res=await fetch(url),data=await res.json();
    const pages=Object.values(data?.query?.pages||{});
    const page=pages.find(p=>p?.imageinfo?.[0]?.thumburl||p?.imageinfo?.[0]?.url);
    return page?.imageinfo?.[0]?.thumburl||page?.imageinfo?.[0]?.url||"";
  }catch(_){return ""}
}
async function uploadCityBannerImage(file,msgEl){
  if(!file)return "";
  if(!/^image\/(jpeg|png|webp)$/i.test(file.type))throw new Error("Sadece JPG, PNG veya WEBP yükleyebilirsin.");
  if(file.size>10*1024*1024)throw new Error("Görsel en fazla 10 MB olabilir.");
  if(msgEl)msgEl.textContent="Yükleniyor...";
  const fd=new FormData();fd.append("file",file);fd.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
  const res=await fetch("https://api.cloudinary.com/v1_1/"+CLOUDINARY_CLOUD_NAME+"/image/upload",{method:"POST",body:fd});
  if(!res.ok)throw new Error("Görsel yüklenemedi.");
  const data=await res.json();return data.secure_url||data.url||"";
}

async function seedAllCityBannerImages({force=false}={}){
  const btn=$("seedCityBannerImagesBtn");
  const status=$("seedCityBannerImagesStatus");
  const old=btn?.textContent||"81 İlin Görsellerini Yükle";
  if(btn){btn.disabled=true;btn.textContent="Şehir görselleri hazırlanıyor...";}
  let done=0,skipped=0,failed=0;
  try{
    for(let i=0;i<CITY_BANNER_PROVINCES.length;i++){
      const city=CITY_BANNER_PROVINCES[i];
      const key=cityBannerKey(city);
      try{
        const ref=db.collection("cityBanners").doc(key);
        const snap=await ref.get();
        const current=snap.exists?(snap.data()||{}):{};
        if(!force&&String(current.imageUrl||"").trim()){
          skipped++;
        }else{
          const imageUrl=await adminCommonsCityImage(city);
          if(imageUrl){
            await ref.set({
              city,
              imageUrl,
              active:current.active!==false,
              imageSource:"Wikimedia Commons",
              autoSeeded:true,
              updatedAt:new Date().toISOString()
            },{merge:true});
            done++;
          }else failed++;
        }
      }catch(_){failed++}
      if(status)status.textContent=(i+1)+" / "+CITY_BANNER_PROVINCES.length+" il işlendi · "+done+" yüklendi · "+skipped+" zaten vardı";
      await new Promise(resolve=>setTimeout(resolve,120));
    }
    if(status)status.textContent="Tamamlandı: "+done+" görsel yüklendi, "+skipped+" mevcut korundu"+(failed?", "+failed+" il bulunamadı":"")+".";
    try{localStorage.setItem("dijiyesorCityImagesSeeded","1")}catch(_){}
    await loadCityBannerSettings();
  }finally{
    if(btn){btn.disabled=false;btn.textContent=old;}
  }
}

async function loadCityBannerSettings(){
  const city=$("cityBannerProvince")?.value;if(!city)return;
  const key=cityBannerKey(city);
  const preview=$("cityBannerPreview");
  if(preview)preview.innerHTML="<span>Önizleme yükleniyor...</span>";
  let data={};
  try{const snap=await db.collection("cityBanners").doc(key).get();if(snap.exists)data=snap.data()||{}}catch(_){}
  $("cityBannerActive").value=String(data.active===true);
  $("cityBannerTitle").value=data.title||"";
  $("cityBannerSubtitle").value=data.subtitle||"";
  $("cityBannerImageUrl").value=data.imageUrl||"";
  $("cityBannerSponsorActive").value=String(Boolean(data.sponsorActive));
  $("cityBannerSponsorName").value=data.sponsorName||"";
  $("cityBannerSponsorText").value=data.sponsorText||"";
  $("cityBannerSponsorStart").value=String(data.sponsorStartDate||"").slice(0,10);
  $("cityBannerSponsorEnd").value=String(data.sponsorEndDate||"").slice(0,10);
  $("cityBannerSponsorLogoUrl").value=data.sponsorLogoUrl||"";
  $("cityBannerSponsorButtonText").value=data.sponsorButtonText||"İncele";
  $("cityBannerSponsorUrl").value=data.sponsorUrl||"";
  const src=data.imageUrl||"";
  if(preview){
    preview.innerHTML=src?'<img src="'+esc(src)+'" alt="'+esc(city)+'"><div><strong>'+(data.title||city+"’de keşfet")+'</strong><small>'+(data.subtitle||city+" bölgesindeki işletmeleri incele")+'</small></div>':'<span>Henüz şehir görseli yüklenmedi. Görseli yükledikten sonra Durum → Aktif yap.</span>';
  }
}
function initCityBannerAdmin(){
  const sel=$("cityBannerProvince");if(!sel)return;
  if(!cityBannerAdminReady){
    sel.innerHTML=CITY_BANNER_PROVINCES.map(c=>'<option value="'+esc(c)+'">'+esc(c)+'</option>').join("");
    sel.value="Çanakkale";
    sel.addEventListener("change",loadCityBannerSettings);
    $("cityBannerImageUrl")?.addEventListener("input",e=>{
      const p=$("cityBannerPreview"),url=e.target.value.trim();
      if(p&&url)p.innerHTML='<img src="'+esc(url)+'" alt=""><div><strong>'+esc($("cityBannerTitle").value||sel.value+"’de keşfet")+'</strong></div>';
    });
    $("cityBannerImageUploadBtn")?.addEventListener("click",()=>$("cityBannerImageFile")?.click());
    $("cityBannerSponsorLogoUploadBtn")?.addEventListener("click",()=>$("cityBannerSponsorLogoFile")?.click());
    $("cityBannerImageFile")?.addEventListener("change",async e=>{
      const msg=$("cityBannerImageUploadMsg");
      try{const url=await uploadCityBannerImage(e.target.files?.[0],msg);if(url){$("cityBannerImageUrl").value=url;msg.textContent="Yüklendi ✓";loadCityBannerSettings()}}catch(err){msg.textContent=err.message||"Yüklenemedi"}finally{e.target.value=""}
    });
    $("cityBannerSponsorLogoFile")?.addEventListener("change",async e=>{
      const msg=$("cityBannerSponsorLogoUploadMsg");
      try{const url=await uploadCityBannerImage(e.target.files?.[0],msg);if(url){$("cityBannerSponsorLogoUrl").value=url;msg.textContent="Yüklendi ✓"}}catch(err){msg.textContent=err.message||"Yüklenemedi"}finally{e.target.value=""}
    });
    $("seedCityBannerImagesBtn")?.addEventListener("click",()=>seedAllCityBannerImages({force:false}));
    $("saveCityBannerBtn")?.addEventListener("click",async()=>{
      const city=sel.value,msg=$("cityBannerMessage");if(!city)return;
      const start=$("cityBannerSponsorStart").value,end=$("cityBannerSponsorEnd").value;
      if(start&&end&&end<start){msg.className="message error";msg.textContent="Sponsor bitiş tarihi başlangıçtan önce olamaz.";return}
      const data={
        city,active:$("cityBannerActive").value==="true",title:$("cityBannerTitle").value.trim(),subtitle:$("cityBannerSubtitle").value.trim(),
        imageUrl:$("cityBannerImageUrl").value.trim(),sponsorActive:$("cityBannerSponsorActive").value==="true",
        sponsorName:$("cityBannerSponsorName").value.trim(),sponsorText:$("cityBannerSponsorText").value.trim(),
        sponsorStartDate:start,sponsorEndDate:end,sponsorLogoUrl:$("cityBannerSponsorLogoUrl").value.trim(),
        sponsorButtonText:$("cityBannerSponsorButtonText").value.trim()||"İncele",sponsorUrl:$("cityBannerSponsorUrl").value.trim(),
        updatedAt:new Date().toISOString()
      };
      try{
        msg.className="message";msg.textContent="Kaydediliyor...";
        await db.collection("cityBanners").doc(cityBannerKey(city)).set(data,{merge:true});
        msg.className="message success";msg.textContent=city+" şehir görseli ve sponsor ayarları kaydedildi ✓";
        await loadCityBannerSettings();
      }catch(err){msg.className="message error";msg.textContent=err.message||"Kaydedilemedi."}
    });
    cityBannerAdminReady=true;
  }
  loadCityBannerSettings();
}

const keywordSeedRows=[
  {keyword:"sürücü kursu",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"sürücü kursları",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"ehliyet kursu",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"direksiyon kursu",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"anaokulu",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"anaokulları",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"öğrenci yurdu",volume:"—",sector:"egitim",sectorLabel:"Eğitim"},
  {keyword:"oto servis",volume:"—",sector:"otomotiv",sectorLabel:"Otomotiv"},
  {keyword:"oto servisleri",volume:"—",sector:"otomotiv",sectorLabel:"Otomotiv"},
  {keyword:"restoran",volume:"—",sector:"yemeicme",sectorLabel:"Yeme & İçme"},
  {keyword:"restoranlar",volume:"—",sector:"yemeicme",sectorLabel:"Yeme & İçme"},
  {keyword:"emlak ofisi",volume:"—",sector:"emlak",sectorLabel:"Emlak"}
];
let keywordRows=[...keywordSeedRows];
let addedKeywordSet=new Set();

function renderKeywordTable(){
  const body=$("keywordTableBody");
  if(!body)return;
  const sector=$("keywordSectorFilter")?.value||"";
  const q=String($("keywordSearchInput")?.value||"").toLocaleLowerCase("tr-TR").trim();
  const rows=keywordRows.filter(r=>(!sector||r.sector===sector)&&(!q||r.keyword.toLocaleLowerCase("tr-TR").includes(q)));
  if(!rows.length){
    body.innerHTML='<tr><td colspan="4" class="keyword-empty">Bu filtreye uygun anahtar kelime yok.</td></tr>';
    return;
  }
  body.innerHTML=rows.map(r=>{
    const key=r.sector+"::"+r.keyword;
    const added=addedKeywordSet.has(key);
    return '<tr>'+
      '<td>'+escapeHtml(r.keyword)+'</td>'+
      '<td><span class="keyword-volume">'+escapeHtml(String(r.volume||"—"))+'</span></td>'+
      '<td><span class="keyword-sector">'+escapeHtml(r.sectorLabel||r.sector)+'</span></td>'+
      '<td><button type="button" class="keyword-add-btn'+(added?' added':'')+'" data-add-keyword="'+escapeHtml(r.keyword)+'" data-keyword-sector="'+escapeHtml(r.sector)+'" '+(added?'disabled':'')+'>'+(added?'Eklendi':'Ekle')+'</button></td>'+
    '</tr>';
  }).join("");
}

async function loadAddedKeywords(){
  try{
    const snap=await db.collection("searchKeywords").get();
    addedKeywordSet=new Set(snap.docs.map(d=>{
      const x=d.data()||{};
      return String(x.sector||"")+"::"+String(x.keyword||"");
    }));
  }catch(e){console.warn("Anahtar kelimeler yüklenemedi",e)}
  renderKeywordTable();
}

async function addKeywordToDijiyesor(keyword,sector,button){
  const msg=$("keywordMessage");
  try{
    const id=(sector+"-"+keyword).toLocaleLowerCase("tr-TR")
      .replace(/[^a-z0-9çğıöşü]+/g,"-")
      .replace(/^-+|-+$/g,"");
    await db.collection("searchKeywords").doc(id).set({
      keyword,sector,active:true,source:"admin",updatedAt:new Date().toISOString()
    },{merge:true});
    addedKeywordSet.add(sector+"::"+keyword);
    if(button){button.textContent="Eklendi";button.classList.add("added");button.disabled=true}
    if(msg){msg.textContent='"'+keyword+'" DijiyeSor arama sözlüğüne eklendi.';msg.className="message success"}
  }catch(e){
    console.error(e);
    if(msg){msg.textContent="Anahtar kelime eklenemedi.";msg.className="message error"}
  }
}

async function loadAll(){
  await Promise.all([loadFirms(),loadApplications(),loadMembers(),loadTourLeads(),loadManagedCategories()]);
  const existingAppIds=new Set(tourLeads.map(x=>String(x.applicationId||"")).filter(Boolean));
  const application360=applications
    .filter(a=>Boolean(a.wants360Tour) && !existingAppIds.has(String(a.id)))
    .map(a=>({
      id:a.id,
      applicationId:a.id,
      businessName:a.name||"İşletme",
      contactName:a.contactName||"",
      phone:a.phone||"",
      city:a.city||"",
      email:a.contactEmail||a.accountEmail||"",
      note:a.requestNote||"",
      status:a.tourLeadStatus||"new",
      createdAt:a.date||"",
      updatedAt:a.tourLeadUpdatedAt||a.date||"",
      source:a.source||"institutionApplications",
      _source:"institutionApplications"
    }));
  tourLeads=[...tourLeads.map(x=>({...x,_source:x._source||"tourLeads"})),...application360]
    .sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  renderAll();
}

const defaultSubcategories={
  egitim:{kres:"Kreş / Anaokulu",dershane:"Dershane / Kurs Merkezi",surucu:"Sürücü Kursu",ozel_ders:"Özel Ders",dil_kursu:"Dil Kursu",etut:"Etüt Merkezi",ozel_okul:"Özel Okul",yurt:"Öğrenci Yurdu"},
  otomotiv:{oto_servis:"Oto Servis",kaporta_boya:"Kaporta & Boya",oto_elektrik:"Oto Elektrik",lastik_jant:"Lastik & Jant",oto_yikama:"Oto Yıkama",ekspertiz:"Ekspertiz",galeri:"Oto Galeri",rentacar:"Rent a Car",yedek_parca:"Yedek Parça",motosiklet:"Motosiklet"},
  yemeicme:{restoran:"Restoran",kafe:"Kafe",fastfood:"Fast Food",pastane:"Pastane",pizza:"Pizza",doner:"Döner",pide_lahmacun:"Pide & Lahmacun",catering:"Catering",ev_yemekleri:"Ev Yemekleri"},
  saglikguzellik:{dis_klinigi:"Diş Kliniği",klinik:"Klinik",psikolog:"Psikolog",diyetisyen:"Diyetisyen",fizyoterapi:"Fizyoterapi",guzellik:"Güzellik Merkezi",kuafor:"Kuaför",berber:"Berber",spor:"Spor Merkezi"},
  evyapi:{mobilya:"Mobilya",dekorasyon:"Dekorasyon",insaat:"İnşaat",elektrikci:"Elektrikçi",tesisatci:"Tesisatçı",teknik_servis:"Teknik Servis",klima:"Klima",cam_balkon:"Cam Balkon",temizlik:"Temizlik"},
  emlak:{emlak_ofisi:"Emlak Ofisi",konut:"Konut",arsa:"Arsa",ticari:"Ticari Gayrimenkul",gunluk_kiralik:"Günlük Kiralık"},
  turizm:{otel:"Otel",pansiyon:"Pansiyon",apart:"Apart",bungalov:"Bungalov",seyahat:"Seyahat Acentesi",kamp:"Kamp"},
  organizasyonmedya:{dugun_salonu:"Düğün Salonu",organizasyon:"Organizasyon",fotograf:"Fotoğrafçı",video:"Video Prodüksiyon",drone:"Drone Çekimi",gelinlik:"Gelinlik",cicekci:"Çiçekçi",reklam:"Reklam Ajansı"},
  tasimacilik:{nakliyat:"Nakliyat",kurye:"Kurye",sehirici:"Şehir İçi Taşımacılık",depolama:"Depolama"},
  profesyonel:{hukuk:"Hukuk",muhasebe:"Muhasebe",web:"Web Tasarım",sosyal_medya:"Sosyal Medya",teknoloji:"Teknoloji",bilgisayar:"Bilgisayar",danismanlik:"Danışmanlık",veteriner:"Veteriner",tarim:"Tarım"},
  alisveris:{giyim:"Giyim",ayakkabi:"Ayakkabı",market:"Market",elektronik:"Elektronik",kirtasiye:"Kırtasiye",petshop:"Pet Shop",zuccaciye:"Züccaciye",esnaf:"Yerel Esnaf"},
  diger:{diger:"Diğer"}
};
const defaultCategoryDescriptions={
  egitim:"Kurs, sürücü kursu, anaokulu, yurt",otomotiv:"Servis, ekspertiz, galeri, kiralama",
  yemeicme:"Restoran, kafe, pizza, döner",saglikguzellik:"Diş, psikolog, kuaför, spor",
  evyapi:"Mobilya, dekorasyon, teknik servis",emlak:"Konut, arsa, emlak ofisi",
  turizm:"Otel, pansiyon, apart",organizasyonmedya:"Fotoğraf, video, organizasyon",
  tasimacilik:"Nakliyat, kurye, teslimat",profesyonel:"Hukuk, muhasebe, web, danışmanlık",
  alisveris:"Market, giyim, elektronik, pet shop",diger:"Diğer kurum ve hizmetler"
};
function categoryKey(v){
  return String(v||"").toLocaleLowerCase("tr-TR")
    .replace(/ı/g,"i").replace(/ğ/g,"g").replace(/ü/g,"u").replace(/ş/g,"s").replace(/ö/g,"o").replace(/ç/g,"c")
    .normalize("NFD").replace(/[\u0300-\u036f]/g,"").replace(/[^a-z0-9]+/g,"_").replace(/^_+|_+$/g,"").slice(0,48);
}
async function loadManagedCategories(){
  try{
    const snap=await db.collection("siteCategories").get();
    managedCategoryDocs=snap.docs.map(d=>({key:d.id,...d.data()}));
  }catch(_){managedCategoryDocs=[]}
  renderCategoryAdmin();
}
function mergedCategoryRows(){
  const map={};
  Object.entries(categories).forEach(([key,label])=>{
    map[key]={key,label,description:defaultCategoryDescriptions[key]||"",subcategories:{...(defaultSubcategories[key]||{})},isDefault:true};
  });
  managedCategoryDocs.forEach(doc=>{
    if(doc.active===false){delete map[doc.key];return}
    const base=map[doc.key]||{key:doc.key,label:doc.label||doc.key,description:"",subcategories:{},isDefault:false};
    map[doc.key]={...base,...doc,label:doc.label||base.label,description:doc.description??base.description,subcategories:{...base.subcategories,...(doc.subcategories||{})}};
  });
  return Object.values(map).sort((a,b)=>String(a.label).localeCompare(String(b.label),"tr"));
}
function renderCategoryAdmin(){
  const host=$("categoryAdminList"); if(!host)return;
  const rows=mergedCategoryRows();
  host.innerHTML=rows.map(row=>{
    const subs=Object.entries(row.subcategories||{}).sort((a,b)=>a[1].localeCompare(b[1],"tr"));
    return '<article class="category-admin-card" data-category-card="'+esc(row.key)+'">'+
      '<div class="category-admin-card-head"><div><strong>'+esc(row.label)+'</strong><small>'+esc(row.description||"Açıklama yok")+'</small></div><span>'+subs.length+' alt kategori</span></div>'+
      '<div class="category-admin-subs">'+(subs.length?subs.map(([k,v])=>'<span>'+esc(v)+'</span>').join(""):'<em>Henüz alt kategori yok.</em>')+'</div>'+
      '<div class="category-admin-addsub"><input data-sub-name="'+esc(row.key)+'" placeholder="Yeni alt kategori adı"><input data-sub-key="'+esc(row.key)+'" placeholder="Anahtar (otomatik)"><button type="button" class="secondary" data-add-subcategory="'+esc(row.key)+'">+ Alt Kategori Ekle</button></div>'+
    '</article>';
  }).join("");
}
$("addCategoryBtn")?.addEventListener("click",async()=>{
  const name=$("categoryNameInput")?.value.trim(),desc=$("categoryDescInput")?.value.trim();
  const key=categoryKey($("categoryKeyInput")?.value||name);
  const msg=$("categoryAdminMessage");
  if(!name||!key){msg.className="message error";msg.textContent="Kategori adı girin.";return}
  try{
    await db.collection("siteCategories").doc(key).set({label:name,description:desc,active:true,subcategories:{},updatedAt:new Date().toISOString()},{merge:true});
    msg.className="message success";msg.textContent="Kategori eklendi.";
    $("categoryNameInput").value="";$("categoryDescInput").value="";$("categoryKeyInput").value="";
    await loadManagedCategories();
  }catch(e){msg.className="message error";msg.textContent="Kategori eklenemedi: "+(e.message||"")}
});
document.addEventListener("click",async e=>{
  const btn=e.target.closest("[data-add-subcategory]"); if(!btn)return;
  const key=btn.dataset.addSubcategory;
  const name=document.querySelector('[data-sub-name="'+CSS.escape(key)+'"]')?.value.trim()||"";
  const keyInput=document.querySelector('[data-sub-key="'+CSS.escape(key)+'"]')?.value.trim()||"";
  const subKey=categoryKey(keyInput||name);
  if(!name||!subKey)return;
  const existing=managedCategoryDocs.find(x=>x.key===key);
  const currentSubs={...(existing?.subcategories||{})};
  currentSubs[subKey]=name;
  const baseLabel=categories[key]||mergedCategoryRows().find(x=>x.key===key)?.label||key;
  await db.collection("siteCategories").doc(key).set({label:existing?.label||baseLabel,active:true,subcategories:currentSubs,updatedAt:new Date().toISOString()},{merge:true});
  await loadManagedCategories();
});

async function loadFirms(){
  const snap=await db.collection("institutions").get();
  firms=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"tr"));
}
async function loadApplications(){
  const snap=await db.collection("institutionApplications").get();
  applications=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.date||0)-new Date(a.date||0));
}
async function loadMembers(){
  const snap=await db.collection("institutionUsers").get();
  members=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>String(a.institutionName||a.email||"").localeCompare(String(b.institutionName||b.email||""),"tr"));
}
async function loadTourLeads(){
  try{
    const snap=await db.collection("tourLeads").get();
    tourLeads=snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>new Date(b.createdAt||0)-new Date(a.createdAt||0));
  }catch(err){
    console.error("360 talepleri yüklenemedi",err);
    tourLeads=[];
  }
}
function isCampaignActive(f){
  if(!(f.campaignActive||f.hasCampaign)||!String(f.campaignTitle||f.promotionTitle||"").trim())return false;
  const end=f.campaignEnd||f.campaignEndDate||"";
  if(end){const d=new Date(end);if(!Number.isNaN(d.getTime())&&d.getTime()<Date.now())return false}
  return true;
}
function renderAll(){
  const activeFirms=firms.filter(f=>String(f.status||"active")!=="passive");
  const sponsors=activeFirms.filter(f=>f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
  const campaigns=activeFirms.filter(isCampaignActive);
  const pending=applications.filter(a=>String(a.status||"new")==="new");
  $("statFirms").textContent=activeFirms.length;$("navFirmCount").textContent=firms.length;
  $("statSponsors").textContent=sponsors.length;
  $("statCampaigns").textContent=campaigns.length;$("navCampaignCount").textContent=campaigns.length;
  $("statApplications").textContent=pending.length;$("navApplicationCount").textContent=pending.length;
  const newTourLeads=tourLeads.filter(x=>String(x.status||"new")==="new");
  if($("statTourLeads"))$("statTourLeads").textContent=newTourLeads.length;
  if($("navTourLeadCount"))$("navTourLeadCount").textContent=newTourLeads.length;
  if($("revenueTourBadge"))$("revenueTourBadge").textContent=newTourLeads.length+" yeni";
  $("navMemberCount").textContent=getMemberRows().length;
  renderRecentApplications();renderOverviewCampaigns();renderFirmFilters();renderFirms();renderCampaigns();renderApplications();renderMembers();renderMedia();fillCampaignFirmSelect();renderSponsorPopupManager();
}
function renderRecentApplications(){
  const list=applications.filter(a=>String(a.status||"new")==="new").slice(0,5);
  $("recentApplications").innerHTML=list.length?list.map(a=>'<div class="mini-item"><div><strong>'+esc(a.name)+'</strong><small>'+esc([a.city,a.district].filter(Boolean).join(" · "))+'</small></div><span class="status-pill">Bekliyor</span></div>').join(""):'<div class="empty">Bekleyen başvuru yok.</div>';
}
function renderOverviewCampaigns(){
  const list=firms.filter(f=>isCampaignActive(f)||f.sponsored).slice(0,6);
  $("overviewCampaigns").innerHTML=list.length?list.map(f=>'<article class="campaign-mini"><span class="sponsor">'+(f.sponsored?"SPONSOR":"KAMPANYA")+'</span><h3>'+esc(f.name)+'</h3><small>'+esc(f.campaignTitle||"Sponsorlu profil")+'</small></article>').join(""):'<div class="empty">Aktif kampanya veya sponsor firma yok.</div>';
}
function renderFirmFilters(){
  const sector=$("firmSector"),current=sector.value;
  sector.innerHTML='<option value="">Tüm sektörler</option>'+Object.entries(categories).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join("");
  sector.value=current;
  const edit=$("editMainCategory");
  if(!edit.options.length)edit.innerHTML=Object.entries(categories).map(([k,v])=>'<option value="'+k+'">'+v+'</option>').join("");
}
function updateFirmBulkUi(){
  const count=selectedFirmIds.size;
  if($("firmSelectedCount"))$("firmSelectedCount").textContent=count+" seçili";
  if($("firmSelectAll")){
    const visibleSelected=visibleFirmIds.filter(id=>selectedFirmIds.has(id)).length;
    $("firmSelectAll").checked=visibleFirmIds.length>0&&visibleSelected===visibleFirmIds.length;
    $("firmSelectAll").indeterminate=visibleSelected>0&&visibleSelected<visibleFirmIds.length;
  }
  ["firmBulkActive","firmBulkPassive","firmBulkSponsorOn","firmBulkSponsorOff","firmBulkVipOn","firmBulkVipOff","firmBulkClear","firmBulkDelete"].forEach(id=>{
    if($(id))$(id).disabled=count===0;
  });
}

function firmQualityInfo(f){
  const hasPhoto=Array.isArray(f.galleryUrls)&&f.galleryUrls.length>0;
  const has360=Boolean(f.has360Tour||f.tour360Url||f.virtualTourUrl||f.tour360);
  const checks=[
    ["Adres",Boolean(String(f.address||"").trim())],
    ["Telefon",Boolean(String(f.phone||"").trim())],
    ["WhatsApp",Boolean(String(f.whatsapp||"").trim())],
    ["Logo",Boolean(String(f.logoUrl||"").trim())],
    ["Fotoğraf",hasPhoto],
    ["360°",has360],
    ["Web",Boolean(String(f.website||"").trim())],
    ["Açıklama",Boolean(String(f.description||"").trim())]
  ];
  const done=checks.filter(x=>x[1]).length;
  return {
    percent:Math.round(done/checks.length*100),
    missing:checks.filter(x=>!x[1]).map(x=>x[0]),
    hasPhoto,has360
  };
}
function firmMatchesCompleteness(f,filter){
  if(!filter)return true;
  const q=firmQualityInfo(f);
  if(filter==="missing-address")return !String(f.address||"").trim();
  if(filter==="missing-phone")return !String(f.phone||"").trim();
  if(filter==="missing-logo")return !String(f.logoUrl||"").trim();
  if(filter==="missing-photo")return !q.hasPhoto;
  if(filter==="missing-360")return !q.has360;
  if(filter==="missing-whatsapp")return !String(f.whatsapp||"").trim();
  if(filter==="low-quality")return q.percent<50;
  return true;
}

function renderFirms(){
  const q=norm($("firmSearch").value),sector=$("firmSector").value,status=$("firmStatus").value,completeness=$("firmCompleteness")?.value||"";
  [...selectedFirmIds].forEach(id=>{if(!firms.some(x=>x.id===id))selectedFirmIds.delete(id)});
  const list=firms.filter(f=>{
    const sponsor=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
    const matchesStatus=!status||(status==="sponsored"?sponsor:String(f.status||"active")===status);
    return (!q||norm([f.name,f.city,f.district,f.phone,f.address].join(" ")).includes(q))&&(!sector||String(f.mainCategory||"")===sector)&&matchesStatus&&firmMatchesCompleteness(f,completeness);
  });
  visibleFirmIds=list.map(f=>f.id);
  $("firmList").innerHTML=list.length?list.map(f=>{
    const sponsor=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
    const logo=f.logoUrl?'<img src="'+esc(f.logoUrl)+'">':esc(initials(f.name));
    const quality=firmQualityInfo(f);
    const qualityClass=quality.percent>=75?"good":quality.percent>=50?"mid":"low";
    const qualityHtml='<div class="firm-quality"><b class="'+qualityClass+'">%'+quality.percent+'</b><small>'+(quality.missing.length?'Eksik: '+esc(quality.missing.slice(0,4).join(", ")):'Bilgiler tamam')+'</small></div>';
    return '<div class="data-row '+(selectedFirmIds.has(f.id)?'selected':'')+'">'+
      '<label class="firm-row-check"><input type="checkbox" data-firm-select="'+esc(f.id)+'" '+(selectedFirmIds.has(f.id)?'checked':'')+'><span></span></label>'+
      '<div class="firm-ident"><div class="firm-logo">'+logo+'</div><div><strong>'+esc(f.name)+(sponsor?'<span class="sponsor-dot">Sponsor</span>':'')+(f.vip?'<span class="vip-dot">VIP</span>':'')+'</strong><small>'+esc([f.city,f.district].filter(Boolean).join(" · "))+'</small>'+qualityHtml+'</div></div>'+
      '<span>'+esc(categories[f.mainCategory]||f.mainCategory||"Diğer")+'</span>'+
      '<span>'+esc(f.phone||"Telefon yok")+'</span>'+
      '<div class="row-actions"><button class="primary" data-quick-edit-firm="'+esc(f.id)+'">Hızlı Düzenle</button><button data-edit-firm="'+esc(f.id)+'">Detaylı Düzenle</button><button data-campaign-firm="'+esc(f.id)+'">Reklam</button><button data-qr-firm="'+esc(f.id)+'">QR/NFC</button><button data-toggle-firm="'+esc(f.id)+'">'+(String(f.status||"active")==="passive"?"Aktif Yap":"Pasif")+'</button><button class="danger" data-delete-firm="'+esc(f.id)+'">Sil</button></div>'+
    '</div>'
  }).join(""):'<div class="empty">Firma bulunamadı.</div>';
  updateFirmBulkUi();
}
["firmSearch","firmSector","firmStatus","firmCompleteness"].forEach(id=>$(id)?.addEventListener(id==="firmSearch"?"input":"change",renderFirms));

function openFirmModal(id){
  const f=firms.find(x=>x.id===id)||{};
  $("firmModalTitle").textContent=id?"Hızlı Düzenle":"Yeni Firma Ekle";$("firmId").value=id||"";
  if($("quickFirmViewBtn")){
    $("quickFirmViewBtn").href=id?"firma.html?id="+encodeURIComponent(id):"#";
    $("quickFirmViewBtn").style.display=id?"inline-flex":"none";
  }
  $("editName").value=f.name||"";$("editStatus").value=f.status||"active";if($("quickFirmStatusBtn")){$("quickFirmStatusBtn").textContent=String(f.status||"active")==="passive"?"Aktif Yap":"Pasife Al";$("quickFirmStatusBtn").classList.toggle("danger",String(f.status||"active")!=="passive");}$("editMainCategory").value=f.mainCategory||"diger";$("editSubCategory").value=f.subCategory||f.category||"";
  $("editCity").value=f.city||"";$("editDistrict").value=f.district||"";$("editPhone").value=f.phone||"";$("editAddress").value=f.address||"";
  $("editWhatsapp").value=f.whatsapp||"";$("editWebsite").value=f.website||"";$("editInstagram").value=f.instagram||"";$("editDescription").value=f.description||"";
  $("editLogoUrl").value=f.logoUrl||"";$("editCoverUrl").value=f.coverUrl||"";$("editTourUrl").value=f.tour360Url||f.virtualTourUrl||f.tour360||"";$("editVideoUrl").value=f.videoUrl||f.youtubeUrl||"";
  editingCoverUrls=Array.isArray(f.coverUrls)?f.coverUrls.filter(Boolean):[];
  renderCoverSliderPreview();
  updateFirmLogoPreview(f.logoUrl||"");
  updateFirmImagePreview(f.coverUrl||"");
  updateFirmVideoPreview(f.videoUrl||f.youtubeUrl||"");
  ["editLogoFile","editCoverFile","editVideoFile"].forEach(x=>{if($(x))$(x).value=""});
  ["logoUploadMessage","coverUploadMessage","videoUploadMessage"].forEach(x=>{if($(x)){ $(x).className="message hidden"; $(x).textContent=""; }});
  $("editVip").checked=Boolean(f.vip);$("editSponsored").checked=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
  $("firmFormMessage").className="message hidden";$("firmModal").classList.remove("hidden");
}
$("quickFirmStatusBtn")?.addEventListener("click",async()=>{
  const id=$("firmId")?.value||"";
  if(!id)return;
  const current=$("editStatus").value||"active";
  const next=current==="passive"?"active":"passive";
  try{
    $("quickFirmStatusBtn").disabled=true;
    await db.collection("institutions").doc(id).set({status:next,updatedAt:new Date().toISOString()},{merge:true});
    $("editStatus").value=next;
    $("quickFirmStatusBtn").textContent=next==="passive"?"Aktif Yap":"Pasife Al";
    $("quickFirmStatusBtn").classList.toggle("danger",next!=="passive");
    await loadFirms();
    renderAll();
  }catch(err){
    alert("Firma durumu değiştirilemedi: "+(err.message||"Bilinmeyen hata"));
  }finally{
    $("quickFirmStatusBtn").disabled=false;
  }
});

$("quickFirmViewBtn")?.addEventListener("click",e=>{
  e.preventDefault();
  const firmId=$("firmId")?.value||"";
  if(!firmId)return;
  const f=firms.find(x=>x.id===firmId)||{};
  $("quickFirmPreviewTitle").textContent=(f.name||"Firma")+" · Önizleme";
  $("quickFirmPreviewLoading").style.display="grid";
  $("quickFirmPreviewFrame").src="firma.html?id="+encodeURIComponent(firmId)+"&_="+Date.now();
  $("quickFirmPreviewModal").classList.remove("hidden");
});
$("quickFirmPreviewFrame")?.addEventListener("load",()=>{
  if($("quickFirmPreviewLoading"))$("quickFirmPreviewLoading").style.display="none";
});
function updateFirmLogoPreview(url){
  const box=$("firmLogoPreview"); if(!box)return;
  const value=String(url||"").trim();
  box.innerHTML=value?'<img src="'+esc(value)+'" alt="Firma logosu" style="object-fit:contain;background:#fff">':'<span>Logo yok</span>';
}
function renderCoverSliderPreview(){
  const box=$("coverSliderPreview");
  if(!box)return;
  box.innerHTML=editingCoverUrls.length
    ? editingCoverUrls.map((url,index)=>'<div class="cover-slider-thumb"><img src="'+esc(url)+'" alt="Slider görseli"><button type="button" data-remove-cover-slide="'+index+'" aria-label="Görseli kaldır">×</button><span>'+(index+1)+'</span></div>').join("")
    : '<div class="cover-slider-empty">Henüz kaydırmalı görsel eklenmedi.</div>';
}
document.addEventListener("click",e=>{
  const b=e.target.closest("[data-remove-cover-slide]");
  if(!b)return;
  editingCoverUrls.splice(Number(b.dataset.removeCoverSlide),1);
  renderCoverSliderPreview();
});

function updateFirmImagePreview(url){
  const box=$("firmImagePreview"); if(!box)return;
  const value=String(url||"").trim();
  box.innerHTML=value?'<img src="'+esc(value)+'" alt="Firma görseli önizleme">':'<span>Görsel yok</span>';
}
function updateFirmVideoPreview(url){
  const box=$("firmVideoPreview"); if(!box)return;
  const value=String(url||"").trim();
  box.innerHTML=value?'<video src="'+esc(value)+'" controls preload="metadata" style="width:100%;height:100%;object-fit:cover;background:#000"></video>':'<span>Video yok</span>';
}
$("editLogoUrl")?.addEventListener("input",e=>updateFirmLogoPreview(e.target.value));
$("editCoverUrl")?.addEventListener("input",e=>updateFirmImagePreview(e.target.value));
$("editVideoUrl")?.addEventListener("input",e=>updateFirmVideoPreview(e.target.value));

function uploadFirmMedia(file,kind,msgId){
  return new Promise((resolve,reject)=>{
    if(!file)return resolve("");
    if(!auth.currentUser)return reject(new Error("Oturum bulunamadı."));
    const isImage=file.type.startsWith("image/");
    const isVideo=file.type.startsWith("video/");
    if(kind==="image"&&!isImage)return reject(new Error("Lütfen bir görsel dosyası seçin."));
    if(kind==="video"&&!isVideo)return reject(new Error("Lütfen bir video dosyası seçin."));
    const limit=kind==="video"?100*1024*1024:10*1024*1024;
    if(file.size>limit)return reject(new Error(kind==="video"?"Video en fazla 100 MB olabilir.":"Görsel en fazla 10 MB olabilir."));
    const msg=$(msgId);
    const fd=new FormData();
    fd.append("file",file);
    fd.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
    const xhr=new XMLHttpRequest();
    const resource=kind==="video"?"video":"image";
    xhr.open("POST","https://api.cloudinary.com/v1_1/"+CLOUDINARY_CLOUD_NAME+"/"+resource+"/upload",true);
    xhr.timeout=kind==="video"?120000:45000;
    xhr.onload=()=>{
      let data={}; try{data=JSON.parse(xhr.responseText||"{}")}catch(_){}
      if(xhr.status>=200&&xhr.status<300&&data.secure_url)resolve(data.secure_url);
      else reject(new Error(data?.error?.message||("HTTP "+xhr.status)));
    };
    xhr.onerror=()=>reject(new Error("Dosya yükleme bağlantısı kurulamadı."));
    xhr.ontimeout=()=>reject(new Error("Yükleme zaman aşımına uğradı."));
    xhr.upload.onprogress=e=>{
      if(msg&&e.lengthComputable){msg.className="message";msg.textContent="%"+Math.round(e.loaded/e.total*100)+" yükleniyor...";}
    };
    xhr.send(fd);
  });
}

$("chooseLogoFileBtn")?.addEventListener("click",()=>$("editLogoFile")?.click());
$("clearLogoBtn")?.addEventListener("click",()=>{$("editLogoUrl").value="";$("editLogoFile").value="";updateFirmLogoPreview("");$("logoUploadMessage").className="message success";$("logoUploadMessage").textContent="Logo kaldırıldı. Kaydet'e basın.";});
$("editLogoFile")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return; const msg=$("logoUploadMessage");
  try{msg.className="message";msg.textContent="Logo yükleniyor...";const url=await uploadFirmMedia(file,"image","logoUploadMessage");$("editLogoUrl").value=url;updateFirmLogoPreview(url);msg.className="message success";msg.textContent="Logo yüklendi ✓ Kaydet'e basın.";}
  catch(err){msg.className="message error";msg.textContent="Logo yüklenemedi: "+(err.message||"Bilinmeyen hata");}
});

$("chooseCoverFileBtn")?.addEventListener("click",()=>$("editCoverFile")?.click());
$("chooseCoverSliderFilesBtn")?.addEventListener("click",()=>$("editCoverSliderFiles")?.click());
$("clearCoverSliderBtn")?.addEventListener("click",()=>{
  editingCoverUrls=[];
  if($("editCoverSliderFiles"))$("editCoverSliderFiles").value="";
  renderCoverSliderPreview();
  const msg=$("coverSliderUploadMessage");
  if(msg){msg.className="message success";msg.textContent="Kaydırmalı görseller kaldırıldı. Kaydet'e basın.";}
});
$("editCoverSliderFiles")?.addEventListener("change",async e=>{
  const files=[...(e.target.files||[])].slice(0,6);
  if(!files.length)return;
  const msg=$("coverSliderUploadMessage");
  try{
    if(msg){msg.className="message";msg.textContent="Görseller yükleniyor...";}
    const uploaded=[];
    for(const file of files){
      uploaded.push(await uploadFirmMedia(file,"image","coverSliderUploadMessage"));
    }
    editingCoverUrls=[...editingCoverUrls,...uploaded].slice(0,6);
    renderCoverSliderPreview();
    if(msg){msg.className="message success";msg.textContent=uploaded.length+" görsel yüklendi ✓ Kaydet'e basın.";}
  }catch(err){
    if(msg){msg.className="message error";msg.textContent=err?.message||"Görseller yüklenemedi.";}
  }finally{
    e.target.value="";
  }
});
$("clearCoverImageBtn")?.addEventListener("click",()=>{$("editCoverUrl").value="";$("editCoverFile").value="";updateFirmImagePreview("");$("coverUploadMessage").className="message success";$("coverUploadMessage").textContent="Görsel kaldırıldı. Kaydet'e basın.";});
$("editCoverFile")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return; const msg=$("coverUploadMessage");
  try{msg.className="message";msg.textContent="Görsel yükleniyor...";const url=await uploadFirmMedia(file,"image","coverUploadMessage");$("editCoverUrl").value=url;updateFirmImagePreview(url);msg.className="message success";msg.textContent="Görsel yüklendi ✓ Kaydet'e basın.";}
  catch(err){msg.className="message error";msg.textContent="Görsel yüklenemedi: "+(err.message||"Bilinmeyen hata");}
});

$("chooseVideoFileBtn")?.addEventListener("click",()=>$("editVideoFile")?.click());
$("clearVideoBtn")?.addEventListener("click",()=>{$("editVideoUrl").value="";$("editVideoFile").value="";updateFirmVideoPreview("");$("videoUploadMessage").className="message success";$("videoUploadMessage").textContent="Video kaldırıldı. Kaydet'e basın.";});
$("editVideoFile")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0]; if(!file)return; const msg=$("videoUploadMessage");
  try{msg.className="message";msg.textContent="Video yükleniyor...";const url=await uploadFirmMedia(file,"video","videoUploadMessage");$("editVideoUrl").value=url;updateFirmVideoPreview(url);msg.className="message success";msg.textContent="Video yüklendi ✓ Kaydet'e basın.";}
  catch(err){msg.className="message error";msg.textContent="Video yüklenemedi: "+(err.message||"Bilinmeyen hata");}
});

$("addFirmBtn").addEventListener("click",()=>openFirmModal());
$("newFirmBtn").addEventListener("click",()=>openFirmModal());

$("firmForm").addEventListener("submit",async e=>{
  e.preventDefault();const id=$("firmId").value;const msg=$("firmFormMessage");
  const data={name:$("editName").value.trim(),status:$("editStatus").value,mainCategory:$("editMainCategory").value,subCategory:$("editSubCategory").value.trim(),category:$("editSubCategory").value.trim()||$("editMainCategory").value,city:$("editCity").value.trim(),district:$("editDistrict").value.trim(),phone:$("editPhone").value.trim(),address:$("editAddress").value.trim(),whatsapp:$("editWhatsapp").value.trim(),website:$("editWebsite").value.trim(),instagram:$("editInstagram").value.trim(),description:$("editDescription").value.trim(),logoUrl:$("editLogoUrl").value.trim(),coverUrl:$("editCoverUrl").value.trim(),coverUrls:[...editingCoverUrls],tour360Url:$("editTourUrl").value.trim(),videoUrl:$("editVideoUrl").value.trim(),has360Tour:Boolean($("editTourUrl").value.trim()),vip:$("editVip").checked,sponsored:$("editSponsored").checked,updatedAt:new Date().toISOString()};
  try{
    if(id)await db.collection("institutions").doc(id).set(data,{merge:true});
    else await db.collection("institutions").add({...data,createdAt:new Date().toISOString()});
    msg.className="message success";msg.textContent="Kaydedildi.";await loadFirms();renderAll();setTimeout(()=>$("firmModal").classList.add("hidden"),600);
  }catch(err){msg.className="message error";msg.textContent=err.message||"Kaydedilemedi."}
});


function sponsorPopupRows(){
  return firms
    .filter(f=>f.searchPopupTitle||f.searchPopupMediaUrl||f.searchPopupActive||f.searchPopupStartDate||f.searchPopupEndDate)
    .sort((a,b)=>{
      const ao=Number.isFinite(Number(a.searchPopupOrder))?Number(a.searchPopupOrder):999999;
      const bo=Number.isFinite(Number(b.searchPopupOrder))?Number(b.searchPopupOrder):999999;
      return ao-bo || String(a.name||"").localeCompare(String(b.name||""),"tr");
    });
}
function sponsorPopupScheduleState(f){
  const enabled=f.searchPopupActive!==false && Boolean(f.searchPopupActive);
  const today=new Date();today.setHours(0,0,0,0);
  const start=f.searchPopupStartDate?new Date(f.searchPopupStartDate+"T00:00:00"):null;
  const end=f.searchPopupEndDate?new Date(f.searchPopupEndDate+"T23:59:59"):null;
  if(!enabled)return {key:"passive",label:"Pasif",live:false};
  if(start&&!Number.isNaN(start.getTime())&&Date.now()<start.getTime())return {key:"scheduled",label:"Planlandı",live:false};
  if(end&&!Number.isNaN(end.getTime())&&Date.now()>end.getTime())return {key:"expired",label:"Süresi Doldu",live:false};
  return {key:"active",label:"Aktif",live:true};
}
function sponsorPopupDateLabel(f){
  const s=f.searchPopupStartDate||"",e=f.searchPopupEndDate||"";
  const fmt=v=>{if(!v)return "";const d=new Date(v+"T00:00:00");return Number.isNaN(d.getTime())?v:d.toLocaleDateString("tr-TR")};
  if(s&&e)return fmt(s)+" – "+fmt(e);
  if(s)return fmt(s)+" itibarıyla";
  if(e)return "Bitiş: "+fmt(e);
  return "Süresiz";
}
function renderSponsorPopupManager(){
  const firmInput=$("sponsorPopupFirmSearch");
  if(firmInput && $("sponsorPopupFirm")?.value){
    const current=firms.find(f=>f.id===$("sponsorPopupFirm").value);
    if(current&&!firmInput.value)firmInput.value=current.name||"";
  }
  const list=$("sponsorPopupList");
  if(list){
    const rows=sponsorPopupRows();
    list.innerHTML=rows.length?rows.map(f=>{
      const st=sponsorPopupScheduleState(f);
      const order=rows.indexOf(f)+1;
      return '<article class="sponsor-popup-row" draggable="true" data-sponsor-popup-row="'+esc(f.id)+'">'+
        '<div class="sponsor-popup-drag" title="Sürükleyerek sırala">⋮⋮</div>'+
        '<div class="sponsor-popup-order">'+order+'</div>'+
        '<div><strong>'+esc(f.name)+'</strong><small>'+esc((f.searchPopupCity==="__ALL__"?"Tüm Türkiye":[f.searchPopupCity||f.city,f.searchPopupDistrict].filter(Boolean).join(" / "))||"Bölge yok")+'</small><small style="display:block;margin-top:4px;font-weight:800">📅 '+esc(sponsorPopupDateLabel(f))+'</small></div>'+
        '<span class="status-pill">'+esc(st.label)+'</span>'+
        '<div class="row-actions"><button data-toggle-sponsor-popup="'+esc(f.id)+'">'+(st.key==="passive"?"Aktif Yap":"Pasif Yap")+'</button><button data-edit-sponsor-popup="'+esc(f.id)+'">Düzenle</button><button class="danger" data-remove-sponsor-popup="'+esc(f.id)+'">Kaldır</button></div>'+
      '</article>';
    }).join(""):'<div class="empty">Henüz popup reklamı oluşturulmadı.</div>';
  }
}
async function loadSponsorCities(){
  const city=$("sponsorPopupCity"),district=$("sponsorPopupDistrict");
  if(!city||!district||city.options.length>1)return;
  city.innerHTML='<option value="">İller yükleniyor...</option>';
  try{
    const r=await fetch("https://api.turkiyeapi.dev/v2/provinces?fields=id,name&limit=100");
    const j=await r.json();
    city.innerHTML='<option value="">İl seçin</option><option value="__ALL__">Tüm Türkiye</option>';
    (j.data||[]).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"tr")).forEach(x=>{
      const o=document.createElement("option");o.value=x.name;o.textContent=x.name;o.dataset.id=x.id;city.appendChild(o);
    });
  }catch(_){city.innerHTML='<option value="">İl seçin</option>'}
}
async function loadSponsorDistricts(selectedValue=""){
  const city=$("sponsorPopupCity"),district=$("sponsorPopupDistrict");
  if(!city||!district)return;
  district.disabled=true;district.innerHTML='<option value="">Tüm İlçeler</option>';
  const id=city.options[city.selectedIndex]?.dataset?.id;
  if(!city.value||city.value==="__ALL__"||!id)return;
  try{
    const r=await fetch("https://api.turkiyeapi.dev/v2/provinces/"+encodeURIComponent(id)+"/districts?fields=id,name&limit=100");
    const j=await r.json();
    (j.data||[]).sort((a,b)=>String(a.name||"").localeCompare(String(b.name||""),"tr")).forEach(x=>{
      const o=document.createElement("option");o.value=x.name;o.textContent=x.name;district.appendChild(o);
    });
    district.disabled=false;
    if(selectedValue)district.value=selectedValue;
  }catch(_){district.disabled=false}
}
async function fillSponsorPopupForm(id){
  await loadSponsorCities();
  const f=firms.find(x=>x.id===id); if(!f)return;
  $("sponsorPopupFirm").value=f.id;
  if($("sponsorPopupFirmSearch"))$("sponsorPopupFirmSearch").value=f.name||"";
  $("sponsorPopupActive").value=String(Boolean(f.searchPopupActive));
  $("sponsorPopupStartDate").value=String(f.searchPopupStartDate||"").slice(0,10);
  $("sponsorPopupEndDate").value=String(f.searchPopupEndDate||"").slice(0,10);
  $("sponsorPopupCity").value=f.searchPopupCity||f.city||"";
  await loadSponsorDistricts(f.searchPopupDistrict||"");
  $("sponsorPopupTitle").value=f.searchPopupTitle||f.name||"";
  $("sponsorPopupText").value=f.searchPopupText||"";
  $("sponsorPopupMediaType").value=f.searchPopupMediaType||"image";
  $("sponsorPopupFrequency").value=f.searchPopupFrequency||"session";
  $("sponsorPopupMediaUrl").value=f.searchPopupMediaUrl||"";
  $("sponsorPopupButtonText").value=f.searchPopupButtonText||"Firmayı İncele";
  $("sponsorPopupTargetUrl").value=f.searchPopupTargetUrl||"";
}
function clearSponsorPopupForm(){
  ["sponsorPopupFirm","sponsorPopupFirmSearch","sponsorPopupCity","sponsorPopupTitle","sponsorPopupText","sponsorPopupMediaUrl","sponsorPopupTargetUrl","sponsorPopupStartDate","sponsorPopupEndDate"].forEach(id=>{if($(id))$(id).value=""});
  if($("sponsorPopupDistrict")){$("sponsorPopupDistrict").innerHTML='<option value="">Tüm İlçeler</option>';$("sponsorPopupDistrict").disabled=true}
  if($("sponsorPopupActive"))$("sponsorPopupActive").value="true";
  if($("sponsorPopupMediaType"))$("sponsorPopupMediaType").value="image";
  if($("sponsorPopupFrequency"))$("sponsorPopupFrequency").value="session";
  if($("sponsorPopupButtonText"))$("sponsorPopupButtonText").value="Firmayı İncele";
  if($("sponsorPopupMediaFile"))$("sponsorPopupMediaFile").value="";
  if($("sponsorPopupFirmResults"))$("sponsorPopupFirmResults").classList.add("hidden");
  if($("sponsorPopupEditorTitle"))$("sponsorPopupEditorTitle").textContent="Yeni reklam oluştur";
}
function uploadSponsorMedia(file){
  return new Promise((resolve,reject)=>{
    if(!file)return reject(new Error("Dosya seçilmedi."));
    if(file.size>80*1024*1024)return reject(new Error("Dosya en fazla 80 MB olabilir."));
    const fd=new FormData();fd.append("file",file);fd.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
    const xhr=new XMLHttpRequest();
    xhr.open("POST","https://api.cloudinary.com/v1_1/"+CLOUDINARY_CLOUD_NAME+"/auto/upload",true);
    xhr.timeout=120000;
    xhr.onload=()=>{
      let d={};try{d=JSON.parse(xhr.responseText||"{}")}catch(_){}
      if(xhr.status>=200&&xhr.status<300&&d.secure_url)resolve({url:d.secure_url,type:d.resource_type==="video"?"video":"image"});
      else reject(new Error(d?.error?.message||("HTTP "+xhr.status)));
    };
    xhr.onerror=()=>reject(new Error("Yükleme bağlantısı kurulamadı."));
    xhr.ontimeout=()=>reject(new Error("Yükleme zaman aşımına uğradı."));
    xhr.send(fd);
  });
}
$("sponsorPopupCity")?.addEventListener("change",()=>loadSponsorDistricts());
function renderSponsorFirmResults(query){
  const host=$("sponsorPopupFirmResults");if(!host)return;
  const q=norm(query);
  const list=firms.filter(f=>!q||norm([f.name,f.city,f.district].join(" ")).includes(q)).slice(0,20);
  host.innerHTML=list.length?list.map(f=>
    '<button type="button" class="firm-picker-option" data-pick-sponsor-firm="'+esc(f.id)+'"><strong>'+esc(f.name)+'</strong><small>'+esc([f.city,f.district].filter(Boolean).join(" · "))+'</small></button>'
  ).join(""):'<div class="firm-picker-empty">Firma bulunamadı.</div>';
}
$("sponsorPopupFirmSearch")?.addEventListener("focus",e=>{renderSponsorFirmResults(e.target.value);$("sponsorPopupFirmResults")?.classList.remove("hidden")});
$("sponsorPopupFirmSearch")?.addEventListener("input",e=>{$("sponsorPopupFirm").value="";renderSponsorFirmResults(e.target.value);$("sponsorPopupFirmResults")?.classList.remove("hidden")});
document.addEventListener("click",async e=>{
  const pick=e.target.closest("[data-pick-sponsor-firm]");
  if(pick){
    const f=firms.find(x=>x.id===pick.dataset.pickSponsorFirm);if(!f)return;
    $("sponsorPopupFirm").value=f.id;
    $("sponsorPopupFirmSearch").value=f.name||"";
    $("sponsorPopupFirmResults").classList.add("hidden");
    await loadSponsorCities();
    $("sponsorPopupCity").value=f.city||"";
    await loadSponsorDistricts(f.district||"");
    if(!$("sponsorPopupTitle").value)$("sponsorPopupTitle").value=f.name||"";
    return;
  }
  if(!e.target.closest(".firm-picker"))$("sponsorPopupFirmResults")?.classList.add("hidden");
});
$("sponsorPopupUploadBtn")?.addEventListener("click",async()=>{
  const file=$("sponsorPopupMediaFile")?.files?.[0],msg=$("sponsorPopupUploadMessage");if(!file)return;
  try{
    msg.textContent="Yükleniyor...";
    const x=await uploadSponsorMedia(file);
    $("sponsorPopupMediaUrl").value=x.url;$("sponsorPopupMediaType").value=x.type;
    msg.textContent="Yüklendi ✓";
  }catch(e){msg.textContent="Yüklenemedi: "+(e.message||"")}
});
$("saveSponsorPopupBtn")?.addEventListener("click",async()=>{
  const id=$("sponsorPopupFirm")?.value,msg=$("sponsorPopupMessage");
  if(!id){msg.className="message error";msg.textContent="Önce sponsor firma seçin.";return}
  const start=$("sponsorPopupStartDate").value,end=$("sponsorPopupEndDate").value;
  if(start&&end&&start>end){msg.className="message error";msg.textContent="Bitiş tarihi başlangıç tarihinden önce olamaz.";return}
  const patch={
    searchPopupActive:$("sponsorPopupActive").value==="true",
    searchPopupStartDate:$("sponsorPopupStartDate").value,
    searchPopupEndDate:$("sponsorPopupEndDate").value,
    searchPopupCity:$("sponsorPopupCity").value,
    searchPopupDistrict:$("sponsorPopupDistrict").value,
    searchPopupTitle:$("sponsorPopupTitle").value.trim(),
    searchPopupText:$("sponsorPopupText").value.trim(),
    searchPopupMediaType:$("sponsorPopupMediaType").value,
    searchPopupFrequency:$("sponsorPopupFrequency").value||"session",
    searchPopupMediaUrl:$("sponsorPopupMediaUrl").value.trim(),
    searchPopupButtonText:$("sponsorPopupButtonText").value.trim()||"Firmayı İncele",
    searchPopupTargetUrl:$("sponsorPopupTargetUrl").value.trim(),
    searchPopupUpdatedAt:new Date().toISOString()
  };
  try{
    await db.collection("institutions").doc(id).set(patch,{merge:true});
    msg.className="message success";msg.textContent="Popup reklamı kaydedildi.";
    await loadFirms();renderAll();
    setTimeout(()=>$("sponsorPopupEditorModal")?.classList.add("hidden"),700);
  }catch(e){msg.className="message error";msg.textContent="Kaydedilemedi: "+(e.message||"")}
});
$("clearSponsorPopupBtn")?.addEventListener("click",clearSponsorPopupForm);
$("newSponsorPopupBtn")?.addEventListener("click",async()=>{
  clearSponsorPopupForm();
  await loadSponsorCities();
  $("sponsorPopupEditorTitle").textContent="Yeni reklam oluştur";
  $("sponsorPopupEditorModal").classList.remove("hidden");
  setTimeout(()=>$("sponsorPopupFirmSearch")?.focus(),50);
});
document.addEventListener("click",async e=>{
  const toggle=e.target.closest("[data-toggle-sponsor-popup]");
  if(toggle){
    const f=firms.find(x=>x.id===toggle.dataset.toggleSponsorPopup);if(!f)return;
    const next=!Boolean(f.searchPopupActive);
    await db.collection("institutions").doc(f.id).set({searchPopupActive:next,searchPopupUpdatedAt:new Date().toISOString()},{merge:true});
    await loadFirms();renderAll();return;
  }
  const edit=e.target.closest("[data-edit-sponsor-popup]");
  if(edit){
    await fillSponsorPopupForm(edit.dataset.editSponsorPopup);
    if($("sponsorPopupEditorTitle"))$("sponsorPopupEditorTitle").textContent="Reklamı Düzenle";
    $("sponsorPopupEditorModal")?.classList.remove("hidden");
    return;
  }
  const remove=e.target.closest("[data-remove-sponsor-popup]");
  if(remove){
    const id=remove.dataset.removeSponsorPopup;
    if(!confirm("Bu popup reklamını kaldırmak istiyor musunuz?"))return;
    const del=firebase.firestore.FieldValue.delete();
    await db.collection("institutions").doc(id).set({
      searchPopupActive:del,
      searchPopupStartDate:del,
      searchPopupEndDate:del,
      searchPopupCity:del,
      searchPopupDistrict:del,
      searchPopupTitle:del,
      searchPopupText:del,
      searchPopupMediaType:del,
      searchPopupFrequency:del,
      searchPopupMediaUrl:del,
      searchPopupButtonText:del,
      searchPopupTargetUrl:del,
      searchPopupOrder:del,
      searchPopupUpdatedAt:del
    },{merge:true});
    await loadFirms();renderAll();return;
  }
});
let sponsorPopupDraggingId="";
document.addEventListener("dragstart",e=>{
  const row=e.target.closest("[data-sponsor-popup-row]");
  if(!row)return;
  sponsorPopupDraggingId=row.dataset.sponsorPopupRow||"";
  row.classList.add("dragging");
  if(e.dataTransfer){e.dataTransfer.effectAllowed="move";e.dataTransfer.setData("text/plain",sponsorPopupDraggingId)}
});
document.addEventListener("dragend",e=>{
  e.target.closest("[data-sponsor-popup-row]")?.classList.remove("dragging");
  sponsorPopupDraggingId="";
});
document.addEventListener("dragover",e=>{
  const row=e.target.closest("[data-sponsor-popup-row]");
  if(!row||!sponsorPopupDraggingId)return;
  e.preventDefault();
  const list=$("sponsorPopupList"),dragging=list?.querySelector('[data-sponsor-popup-row="'+CSS.escape(sponsorPopupDraggingId)+'"]');
  if(!list||!dragging||dragging===row)return;
  const rect=row.getBoundingClientRect();
  const after=e.clientY>rect.top+rect.height/2;
  list.insertBefore(dragging,after?row.nextSibling:row);
  [...list.querySelectorAll("[data-sponsor-popup-row]")].forEach((r,i)=>{
    const badge=r.querySelector(".sponsor-popup-order");if(badge)badge.textContent=String(i+1);
  });
});
$("saveSponsorPopupOrderBtn")?.addEventListener("click",async()=>{
  const rows=[...$("sponsorPopupList")?.querySelectorAll("[data-sponsor-popup-row]")||[]];
  if(!rows.length)return;
  const btn=$("saveSponsorPopupOrderBtn"),old=btn.textContent;
  btn.disabled=true;btn.textContent="Kaydediliyor...";
  try{
    const batch=db.batch();
    rows.forEach((row,i)=>{
      batch.set(db.collection("institutions").doc(row.dataset.sponsorPopupRow),{
        searchPopupOrder:i+1,
        searchPopupUpdatedAt:new Date().toISOString()
      },{merge:true});
    });
    await batch.commit();
    await loadFirms();
    renderSponsorPopupManager();
    btn.textContent="Sıralama Kaydedildi ✓";
    setTimeout(()=>{btn.textContent=old;btn.disabled=false},1200);
  }catch(e){
    btn.textContent="Kaydedilemedi";
    btn.disabled=false;
    setTimeout(()=>btn.textContent=old,1400);
  }
});
loadSponsorCities();

function fillCampaignFirmSelect(){
  const search=$("campaignFirmSearch");
  if(search && !$("campaignFirm").value)search.value="";
  renderCampaignFirmResults("");
}
function renderCampaignFirmResults(query){
  const host=$("campaignFirmResults");
  if(!host)return;
  const q=norm(query);
  const list=firms.filter(f=>!q||norm([f.name,f.city,f.district].join(" ")).includes(q)).slice(0,20);
  host.innerHTML=list.length
    ? list.map(f=>'<button type="button" class="firm-picker-option" data-pick-campaign-firm="'+esc(f.id)+'"><strong>'+esc(f.name)+'</strong><small>'+esc([f.city,f.district].filter(Boolean).join(" · "))+'</small></button>').join("")
    : '<div class="firm-picker-empty">Firma bulunamadı.</div>';
}
function openCampaignModal(id){
  const f=firms.find(x=>x.id===id)||{};
  $("campaignFirm").value=id||"";$("campaignFirmSearch").value=f.name||"";$("campaignFirmResults").classList.add("hidden");$("campaignBadge").value=f.campaignBadge||"Kampanya";$("campaignEnd").value=String(f.campaignEnd||"").slice(0,10);$("campaignTitle").value=f.campaignTitle||"";$("campaignText").value=f.campaignText||"";$("campaignImageUrl").value=f.campaignImageUrl||"";$("campaignUrl").value=f.campaignUrl||"";$("campaignActive").checked=Boolean(f.campaignActive);$("campaignSponsored").checked=Boolean(f.sponsored||f.campaignSponsorRequested);
  $("campaignFormMessage").className="message hidden";$("campaignModal").classList.remove("hidden");
}
$("newCampaignBtn").addEventListener("click",()=>openCampaignModal(""));
function loadCampaignFirmData(f){
  if(!f){editingCoverUrls=[];renderCoverSliderPreview();return;}
  $("campaignBadge").value=f.campaignBadge||"Kampanya";
  $("campaignEnd").value=String(f.campaignEnd||"").slice(0,10);
  $("campaignTitle").value=f.campaignTitle||"";
  $("campaignText").value=f.campaignText||"";
  $("campaignImageUrl").value=f.campaignImageUrl||"";
  $("campaignUrl").value=f.campaignUrl||"";
  $("campaignActive").checked=Boolean(f.campaignActive);
  $("campaignSponsored").checked=Boolean(f.sponsored||f.campaignSponsorRequested);
}
$("campaignFirmSearch").addEventListener("focus",()=>{
  renderCampaignFirmResults($("campaignFirmSearch").value);
  $("campaignFirmResults").classList.remove("hidden");
});
$("campaignFirmSearch").addEventListener("input",()=>{
  $("campaignFirm").value="";
  renderCampaignFirmResults($("campaignFirmSearch").value);
  $("campaignFirmResults").classList.remove("hidden");
});

$("campaignForm").addEventListener("submit",async e=>{
  e.preventDefault();const id=$("campaignFirm").value,msg=$("campaignFormMessage");if(!id)return;
  try{
    await db.collection("institutions").doc(id).set({campaignActive:$("campaignActive").checked,campaignBadge:$("campaignBadge").value.trim()||"Kampanya",campaignEnd:$("campaignEnd").value,campaignTitle:$("campaignTitle").value.trim(),campaignText:$("campaignText").value.trim(),campaignImageUrl:$("campaignImageUrl").value.trim(),campaignUrl:$("campaignUrl").value.trim(),sponsored:$("campaignSponsored").checked,campaignSponsorRequested:false,campaignApprovalStatus:"approved",campaignApprovedAt:new Date().toISOString(),campaignUpdatedAt:new Date().toISOString()},{merge:true});
    msg.className="message success";msg.textContent="Kampanya kaydedildi.";await loadFirms();renderAll();setTimeout(()=>$("campaignModal").classList.add("hidden"),600);
  }catch(err){msg.className="message error";msg.textContent=err.message||"Kaydedilemedi."}
});
function renderCampaigns(){
  let list=firms.filter(f=>f.campaignActive||f.campaignTitle||f.sponsored);
  if(campaignFilter==="active")list=list.filter(isCampaignActive);
  if(campaignFilter==="sponsored")list=list.filter(f=>f.sponsored);
  if(campaignFilter==="expired")list=list.filter(f=>f.campaignActive&&f.campaignEnd&&new Date(f.campaignEnd)<new Date());
  $("campaignList").innerHTML=list.length?list.map(f=>{const pending=String(f.campaignApprovalStatus||"")==="pending";const sponsor=Boolean(f.sponsored||f.campaignSponsorRequested);return '<article class="campaign-card '+(sponsor?"sponsored":"")+'"><div class="campaign-card-head"><span>'+(pending?(f.campaignSponsorRequested?"SPONSOR TALEBİ":"ONAY BEKLİYOR"):(f.sponsored?"SPONSOR":"KAMPANYA"))+'</span><span class="status-pill">'+(pending?"Onay Bekliyor":(isCampaignActive(f)?"Yayında":"Kapalı"))+'</span></div><h3>'+esc(f.name)+'</h3><p>'+esc(f.campaignTitle||"Sponsorlu firma profili")+'</p><small>'+esc(f.campaignEnd?("Bitiş: "+f.campaignEnd):"Bitiş tarihi yok")+'</small><div class="campaign-actions"><button data-campaign-firm="'+esc(f.id)+'">'+(pending?"İncele & Onayla":"Düzenle")+'</button><button data-stop-campaign="'+esc(f.id)+'">Yayından Kaldır</button></div></article>'}).join(""):'<div class="empty">Bu filtrede kampanya yok.</div>';
}
document.querySelectorAll("[data-campaign-filter]").forEach(b=>b.addEventListener("click",()=>{campaignFilter=b.dataset.campaignFilter;document.querySelectorAll("[data-campaign-filter]").forEach(x=>x.classList.toggle("active",x===b));renderCampaigns()}));

function formatApplicationDate(value){
  if(!value)return "-";
  const d=new Date(value);
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleString("tr-TR");
}

function applicationStatusLabel(status){
  return ({new:"Bekliyor",approved:"Onaylandı",rejected:"Reddedildi"})[String(status||"new")]||String(status||"-");
}

function detailRow(label,value){
  return '<div class="application-detail-row"><span>'+esc(label)+'</span><strong>'+esc(value||"-")+'</strong></div>';
}

function legacyAccountCreateHtml(a){
  if(a.authUid){
    return '<section class="application-account-state ready"><div><span>✓ HESAP HAZIR</span><strong>Kurum hesabı kayıt sırasında oluşturulmuş.</strong><small>'+esc(a.accountEmail||"-")+'</small></div></section>';
  }
  return '<section class="application-account-state missing">'+
    '<div class="application-account-warning"><span>! HESAP YOK</span><strong>Bu eski başvuruda e-posta ve şifre oluşturulmamış.</strong><small>Onaylamadan önce kurum giriş hesabını oluştur.</small></div>'+
    '<div class="legacy-account-form">'+
      '<label>E-posta<input id="legacyAccountEmail" type="email" placeholder="ornek@firma.com" autocomplete="off"></label>'+
      '<label>Geçici şifre<input id="legacyAccountPassword" type="text" minlength="8" placeholder="En az 8 karakter" autocomplete="off"></label>'+
      '<button type="button" class="primary" id="createLegacyInstitutionAccount" data-app-id="'+esc(a.id)+'">Kurum Hesabı Oluştur</button>'+
    '</div>'+
    '<div id="legacyAccountMessage" class="message"></div>'+
  '</section>';
}

function openApplicationDetail(id){
  const a=applications.find(x=>x.id===id);
  if(!a)return;

  const status=String(a.status||"new");
  const interests=[
    a.wantsPhoto?"Profesyonel mekan fotoğrafı":"",
    a.wantsVideo?"Tanıtım videosu":"",
    a.wants360Tour?"360° mekan turu":"",
    a.wantsVip?"VIP / öne çıkan profil":"",
    a.wantsQrNfc?"QR / NFC Akıllı Firma Kartı":"",
    a.wantsCampaign?"Kampanya / reklam":""
  ].filter(Boolean);

  let campaignHtml="";
  if(a.wantsCampaign || a.campaignRequest){
    const c=a.campaignRequest||{};
    campaignHtml='<section class="application-detail-section campaign">'+
      '<div class="application-detail-section-head"><span>KAMPANYA TALEBİ</span><strong>'+esc(c.title||"Kampanya talebi")+'</strong></div>'+
      '<div class="application-detail-grid">'+
        detailRow("Tür",c.type||"-")+
        detailRow("Bitiş",c.end||"-")+
        detailRow("Sponsor",c.sponsored?"Evet":"Hayır")+
        detailRow("Bağlantı",c.url||"-")+
      '</div>'+
      (c.text?'<div class="application-detail-description"><span>Açıklama</span><p>'+esc(c.text)+'</p></div>':'')+
    '</section>';
  }

  $("applicationDetailTitle").textContent=a.name||"Başvuru Detayı";
  $("applicationDetailBody").innerHTML=
    legacyAccountCreateHtml(a)+
    '<section class="application-detail-status"><div><span>BAŞVURU DURUMU</span><strong>'+esc(applicationStatusLabel(status))+'</strong></div><small>'+esc(formatApplicationDate(a.date))+'</small></section>'+
    '<section class="application-detail-section">'+
      '<div class="application-detail-section-head"><span>HESAP BİLGİLERİ</span><strong>Üye bilgileri</strong></div>'+
      '<div class="application-detail-grid">'+
        detailRow("Yetkili",a.contactName||"-")+
        detailRow("E-posta",a.accountEmail||"-")+
        detailRow("Telefon",a.phone||"-")+
        detailRow("Hesap UID",a.authUid||"-")+
      '</div>'+
    '</section>'+
    '<section class="application-detail-section">'+
      '<div class="application-detail-section-head"><span>FİRMA BİLGİLERİ</span><strong>'+esc(a.name||"Firma")+'</strong></div>'+
      '<div class="application-detail-grid">'+
        detailRow("Sektör",categories[a.mainCategory]||a.mainCategory||"-")+
        detailRow("Alt kategori",a.subCategory||a.category||"-")+
        detailRow("İl",a.city||"-")+
        detailRow("İlçe",a.district||"-")+
        detailRow("WhatsApp",a.whatsapp||"-")+
        detailRow("Web sitesi",a.website||"-")+
        detailRow("Instagram",a.instagram||"-")+
        detailRow("Başvuru kaynağı",a.source||"-")+
      '</div>'+
      '<div class="application-detail-description"><span>Adres</span><p>'+esc(a.address||"-")+'</p></div>'+
      '<div class="application-detail-description"><span>Firma açıklaması</span><p>'+esc(a.description||"-")+'</p></div>'+
    '</section>'+
    '<section class="application-detail-section">'+
      '<div class="application-detail-section-head"><span>EK HİZMETLER</span><strong>Talep edilenler</strong></div>'+
      '<div class="application-detail-tags">'+(interests.length?interests.map(x=>'<span>'+esc(x)+'</span>').join(""):'<em>Ek hizmet seçilmemiş.</em>')+'</div>'+
    '</section>'+
    campaignHtml;

  $("applicationDetailApprove").dataset.approveApp=a.id;
  $("applicationDetailReject").dataset.rejectApp=a.id;
  $("applicationDetailApprove").style.display=status==="new"?"":"none";
  $("applicationDetailApprove").disabled=status==="new"&&!a.authUid;
  $("applicationDetailApprove").title=!a.authUid?"Önce kurum hesabı oluşturulmalı":"";
  $("applicationDetailReject").style.display=status==="new"?"":"none";
  $("applicationDetailModal").classList.remove("hidden");
}

async function createLegacyInstitutionAccount(applicationId){
  const a=applications.find(x=>x.id===applicationId);
  if(!a)return;

  const email=String($("legacyAccountEmail")?.value||"").trim();
  const password=String($("legacyAccountPassword")?.value||"");
  const message=$("legacyAccountMessage");
  const button=$("createLegacyInstitutionAccount");

  if(!email){
    message.className="message error";
    message.textContent="E-posta adresini yazın.";
    return;
  }
  if(password.length<8){
    message.className="message error";
    message.textContent="Geçici şifre en az 8 karakter olmalı.";
    return;
  }

  button.disabled=true;
  button.textContent="Hesap oluşturuluyor...";
  message.className="message";
  message.textContent="Firebase hesabı hazırlanıyor...";

  let createdUser=null;
  try{
    if(legacyAccountRegistrationAuth.currentUser){
      await legacyAccountRegistrationAuth.signOut();
    }

    const credential=await legacyAccountRegistrationAuth.createUserWithEmailAndPassword(email,password);
    createdUser=credential.user;

    const pendingInstitutionId=a.approvedInstitutionId||a.requestedInstitutionId||a.id;

    await legacyAccountRegistrationDb.collection("institutionUsers").doc(createdUser.uid).set({
      email,
      institutionId:pendingInstitutionId,
      institutionName:a.name||"Firma",
      status:"pending",
      date:a.date||new Date().toISOString()
    });

    if(String(a.status||"")==="approved" || a.approvedInstitutionId){
      await db.collection("institutionUsers").doc(createdUser.uid).set({
        institutionId:pendingInstitutionId,
        institutionName:a.name||"Firma",
        status:"approved",
        approvedAt:new Date().toISOString()
      },{merge:true});
    }

    await db.collection("institutionApplications").doc(a.id).set({
      authUid:createdUser.uid,
      accountEmail:email,
      accountCreatedAt:new Date().toISOString()
    },{merge:true});

    await legacyAccountRegistrationAuth.signOut();

    await Promise.all([loadApplications(),loadMembers()]);
    renderAll();

    const refreshed=applications.find(x=>x.id===a.id);
    if(refreshed)openApplicationDetail(refreshed.id);

    const msg=$("legacyAccountMessage");
    if(msg){
      msg.className="message success";
      msg.textContent="Kurum hesabı oluşturuldu. Bu e-posta ve geçici şifre müşteriye gönderilebilir.";
    }
  }catch(err){
    console.error("Eski başvuru için kurum hesabı oluşturulamadı:",err);
    if(createdUser){
      try{await createdUser.delete();}catch(_){}
    }
    message.className="message error";
    const map={
      "auth/email-already-in-use":"Bu e-posta ile zaten bir Firebase hesabı var.",
      "auth/invalid-email":"Geçerli bir e-posta adresi yazın.",
      "auth/weak-password":"Şifre yeterince güçlü değil."
    };
    message.textContent=map[err.code]||err.message||"Kurum hesabı oluşturulamadı.";
  }finally{
    if(button){
      button.disabled=false;
      button.textContent="Kurum Hesabı Oluştur";
    }
  }
}

function renderApplications(){
  const q=norm($("applicationSearch").value),filter=$("applicationFilter").value;
  const list=applications.filter(a=>(!q||norm([a.name,a.contactName,a.accountEmail,a.city,a.district,a.phone].join(" ")).includes(q))&&(!filter||String(a.status||"new")===filter));
  $("applicationList").innerHTML=list.length?list.map(a=>{
    const status=String(a.status||"new");
    const serviceTags=[
      a.wantsCampaign?"Kampanya":"",
      a.wants360Tour?"360° Tur":"",
      a.wantsVip?"VIP":"",
      a.wantsQrNfc?"QR/NFC":""
    ].filter(Boolean);
    return '<article class="application-card">'+
      '<div><h3>'+esc(a.name||"İsimsiz firma")+'</h3><p>'+esc([categories[a.mainCategory]||a.mainCategory,a.city,a.district].filter(Boolean).join(" · "))+'</p>'+
      (a.contactName?'<small class="application-submeta">Yetkili: '+esc(a.contactName)+'</small>':'')+'</div>'+
      '<div class="application-meta">'+esc(a.phone||"")+
      (a.accountEmail?'<br>'+esc(a.accountEmail):'')+
      (serviceTags.length?'<div class="application-mini-tags">'+serviceTags.map(x=>'<span>'+esc(x)+'</span>').join("")+'</div>':'')+
      '</div>'+
      '<div class="application-actions">'+
      '<button class="secondary" data-detail-app="'+esc(a.id)+'">Detay</button>'+
      (status==="new"?'<button class="approve" data-approve-app="'+esc(a.id)+'">Onayla</button><button class="reject" data-reject-app="'+esc(a.id)+'">Reddet</button>':'<span class="status-pill">'+esc(status)+'</span>')+
      '</div></article>';
  }).join(""):'<div class="empty">Başvuru bulunamadı.</div>';
}
$("applicationSearch").addEventListener("input",renderApplications);$("applicationFilter").addEventListener("change",renderApplications);

function setQrMode(mode){
  document.querySelectorAll("[data-qr-mode]").forEach(btn=>btn.classList.toggle("active",btn.dataset.qrMode===mode));
  $("qrOrdersPanel")?.classList.toggle("active",mode==="orders");
  $("qrManagerPanel")?.classList.toggle("active",mode==="manager");
  $("qrMenuPanel")?.classList.toggle("active",mode==="menu");
  $("qrOrderPanel")?.classList.toggle("active",mode==="order");
}
document.querySelectorAll("[data-qr-mode]").forEach(btn=>btn.addEventListener("click",()=>setQrMode(btn.dataset.qrMode)));

function openQrForFirm(id){
  const f=firms.find(x=>x.id===id);
  const base="https://ftmotiondesign.github.io/dijiyer/qr-kart-siparis.html";
  const url=f ? base+"?institutionId="+encodeURIComponent(f.id)+"&source=dijiyesor-admin" : base;
  $("qrOrderFrame").src=url;
  $("qrOpenFull").href=url;
  $("qrSelectedFirmName").textContent=f?.name||"Henüz firma seçilmedi";
  $("qrSelectedFirmMeta").textContent=f
    ? [f.city,f.district,f.phone].filter(Boolean).join(" · ")
    : "Firmalar bölümünden QR/NFC butonuna basabilirsin.";
  setView("qr");
  setQrMode("order");
}
$("qrClearFirm").addEventListener("click",()=>openQrForFirm(""));

function memberStatusLabel(status){
  return ({approved:"Aktif",pending:"Bekleyen",rejected:"Reddedildi"})[String(status||"pending")]||String(status||"-");
}
function getMemberRows(){
  const rows=[];
  const seenApplicationIds=new Set();
  const seenInstitutionIds=new Set();

  members.forEach(m=>{
    const app=applications.find(a=>
      (a.authUid && a.authUid===m.id) ||
      (a.approvedInstitutionId && a.approvedInstitutionId===m.institutionId)
    );
    if(app?.id)seenApplicationIds.add(app.id);
    if(m.institutionId)seenInstitutionIds.add(m.institutionId);

    rows.push({
      source:"account",
      id:m.id,
      memberId:m.id,
      applicationId:app?.id||"",
      institutionId:m.institutionId||app?.approvedInstitutionId||"",
      institutionName:m.institutionName||app?.name||"",
      email:(m.email&&String(m.email).endsWith("@dijiyesor.app"))?"":(m.email||app?.accountEmail||""),
      status:m.status||"pending",
      date:m.date||app?.approvedAt||app?.date||"",
      hasAccount:true
    });
  });

  applications
    .filter(a=>String(a.status||"")==="approved" && !a.membershipRemoved)
    .forEach(a=>{
      if(seenApplicationIds.has(a.id))return;
      if(a.approvedInstitutionId && seenInstitutionIds.has(a.approvedInstitutionId))return;

      rows.push({
        source:"approved_application",
        id:"app:"+a.id,
        memberId:"",
        applicationId:a.id,
        institutionId:a.approvedInstitutionId||a.requestedInstitutionId||"",
        institutionName:a.name||"",
        email:a.accountEmail||"",
        status:a.membershipStatus||"approved",
        date:a.approvedAt||a.date||"",
        hasAccount:Boolean(a.authUid)
      });
    });

  return rows.sort((a,b)=>String(a.institutionName||a.email||"").localeCompare(String(b.institutionName||b.email||""),"tr"));
}

function updateMemberBulkUi(){
  const count=selectedMemberIds.size;
  if($("memberSelectedCount"))$("memberSelectedCount").textContent=count+" seçili";
  if($("memberSelectAll")){
    const visibleSelected=visibleMemberIds.filter(id=>selectedMemberIds.has(id)).length;
    $("memberSelectAll").checked=visibleMemberIds.length>0&&visibleSelected===visibleMemberIds.length;
    $("memberSelectAll").indeterminate=visibleSelected>0&&visibleSelected<visibleMemberIds.length;
  }
  ["memberBulkApprove","memberBulkPending","memberBulkReject","memberBulkCopyEmails","memberBulkClear","memberBulkDelete"].forEach(id=>{
    if($(id))$(id).disabled=count===0;
  });
}
function renderMembers(){
  const q=norm($("memberSearch")?.value||"");
  const status=$("memberStatus")?.value||"";
  const allRows=getMemberRows();

  [...selectedMemberIds].forEach(id=>{if(!allRows.some(x=>x.id===id))selectedMemberIds.delete(id)});

  const list=allRows.filter(m=>{
    const firm=firms.find(f=>f.id===m.institutionId);
    const hay=[m.institutionName,m.email,firm?.name,firm?.city,firm?.district].join(" ");
    return (!q||norm(hay).includes(q))&&(!status||String(m.status||"pending")===status);
  });
  visibleMemberIds=list.map(x=>x.id);

  $("memberStatTotal").textContent=allRows.length;
  $("memberStatApproved").textContent=allRows.filter(m=>m.status==="approved").length;
  $("memberStatPending").textContent=allRows.filter(m=>m.status==="pending").length;
  $("navMemberCount").textContent=allRows.length;

  $("memberList").innerHTML=list.length?list.map(m=>{
    const firm=firms.find(f=>f.id===m.institutionId);
    const statusValue=String(m.status||"pending");
    const accountBadge=m.hasAccount
      ? '<span class="member-account-badge ready">Hesap Hazır</span>'
      : '<span class="member-account-badge missing">Hesap Yok</span>';

    return '<article class="member-row'+(selectedMemberIds.has(m.id)?' selected':'')+'">'+
      '<label class="member-check"><input type="checkbox" data-member-select="'+esc(m.id)+'" '+(selectedMemberIds.has(m.id)?'checked':'')+'><span></span></label>'+
      '<div class="member-avatar">'+esc(initials(m.institutionName||m.email))+'</div>'+
      '<div class="member-main"><strong>'+esc(m.institutionName||firm?.name||"Kurum")+'</strong><small>'+esc(m.email||"E-posta yok")+'</small>'+accountBadge+'</div>'+
      '<div class="member-place">'+esc([firm?.city,firm?.district].filter(Boolean).join(" · ")||"Konum yok")+'</div>'+
      '<span class="member-status '+esc(statusValue)+'">'+esc(memberStatusLabel(statusValue))+'</span>'+
      '<div class="member-actions"><button data-member-detail="'+esc(m.id)+'">Detay</button>'+(firm?'<button data-edit-firm="'+esc(firm.id)+'">Firma</button>':'')+'<button class="danger" data-delete-member="'+esc(m.id)+'">Sil</button></div>'+
    '</article>';
  }).join(""):'<div class="empty">Üye bulunamadı.</div>';
  updateMemberBulkUi();
}
function openMemberDetail(id){
  const m=getMemberRows().find(x=>x.id===id);
  if(!m)return;
  const firm=firms.find(f=>f.id===m.institutionId);
  const app=applications.find(a=>a.id===m.applicationId);

  $("memberDetailTitle").textContent=m.institutionName||firm?.name||"Üye Detayı";
  $("memberDetailBody").innerHTML=
    '<div class="member-detail-status '+esc(String(m.status||"pending"))+'"><span>HESAP DURUMU</span><strong>'+esc(memberStatusLabel(m.status))+'</strong></div>'+
    (!m.hasAccount
      ? '<div class="member-no-account"><span>! HESAP YOK</span><strong>Bu onaylı firma için kurum giriş hesabı bulunamadı.</strong><small>E-posta ve geçici şifre girerek hesabı burada oluşturabilirsiniz.</small>'+(app?'<div class="member-create-account-form"><label>E-posta<input id="memberCreateEmail" type="email" placeholder="ornek@firma.com"></label><label>Geçici şifre<input id="memberCreatePassword" type="text" minlength="8" placeholder="En az 8 karakter"></label><button type="button" class="primary" data-create-member-account="'+esc(app.id)+'">Kurum Hesabı Oluştur</button></div><div id="memberCreateAccountMessage" class="message"></div>':'<div class="message error">Bu üyeye bağlı başvuru kaydı bulunamadı.</div>')+'</div>'
      : '<div class="member-account-ready">✓ Kurum giriş hesabı hazır</div>')+
    '<div class="member-detail-grid">'+
      detailRow("Firma",m.institutionName||firm?.name||"-")+
      detailRow("E-posta",m.email||"-")+
      detailRow("Kurum ID",m.institutionId||"-")+
      detailRow("Kullanıcı UID",m.memberId||"-")+
      detailRow("İl",firm?.city||app?.city||"-")+
      detailRow("İlçe",firm?.district||app?.district||"-")+
      detailRow("Telefon",firm?.phone||app?.phone||"-")+
      detailRow("Kayıt tarihi",formatApplicationDate(m.date))+
    '</div>';

  $("memberOpenFirm").dataset.firmId=firm?.id||"";
  $("memberOpenFirm").disabled=!firm;
  $("memberCopyLogin").dataset.loginUrl="https://ftmotiondesign.github.io/dijiyesor/firma-ekle.html?kurumgiris=1";
  $("memberCopyLogin").disabled=!m.hasAccount;
  $("memberDetailModal").classList.remove("hidden");
}

function tourLeadStatusLabel(status){
  return {new:"Yeni",called:"Arandı",planned:"Planlandı",completed:"Tamamlandı"}[String(status||"new")]||"Yeni";
}
function tourLeadWhatsapp(phone){
  const digits=String(phone||"").replace(/\D/g,"");
  if(!digits)return "";
  return digits.startsWith("0")?"90"+digits.slice(1):(digits.startsWith("90")?digits:"90"+digits);
}
function openTourLeadDetail(id){
  const x=tourLeads.find(item=>String(item.id)===String(id));
  if(!x)return;
  const date=x.createdAt?new Date(x.createdAt).toLocaleString("tr-TR"):"-";
  $("tourLeadDetailTitle").textContent=x.businessName||"360° Talep Detayı";
  $("tourLeadDetailBody").innerHTML=
    '<section class="tour-lead-detail-status"><div><span>DURUM</span><strong>'+esc(tourLeadStatusLabel(x.status))+'</strong></div><small>'+esc(date)+'</small></section>'+
    '<div class="tour-lead-detail-grid">'+
      '<div><span>İşletme</span><strong>'+esc(x.businessName||"-")+'</strong></div>'+
      '<div><span>Yetkili</span><strong>'+esc(x.contactName||"-")+'</strong></div>'+
      '<div><span>Telefon</span><strong>'+esc(x.phone||"-")+'</strong></div>'+
      '<div><span>E-posta</span><strong>'+esc(x.email||"-")+'</strong></div>'+
      '<div><span>İl</span><strong>'+esc(x.city||"-")+'</strong></div>'+
      '<div><span>İlçe</span><strong>'+esc(x.district||"-")+'</strong></div>'+
    '</div>'+
    '<section class="tour-lead-note"><span>KISA NOT</span><p>'+esc(x.note||"Not eklenmemiş.")+'</p></section>'+
    '<section class="tour-lead-source"><span>KAYNAK</span><strong>'+esc(x.source||x._source||"-")+'</strong></section>';

  const phoneDigits=String(x.phone||"").replace(/\D/g,"");
  const call=$("tourLeadDetailCall");
  const wa=$("tourLeadDetailWhatsapp");
  call.href=phoneDigits?("tel:"+String(x.phone||"")):"#";
  call.style.display=phoneDigits?"":"none";
  const waDigits=tourLeadWhatsapp(x.phone);
  wa.href=waDigits?("https://wa.me/"+waDigits):"#";
  wa.style.display=waDigits?"":"none";
  $("tourLeadDetailDelete").dataset.deleteTourLead=x.id;
  $("tourLeadDetailDelete").dataset.deleteTourLeadSource=x._source||"tourLeads";
  $("tourLeadDetailModal").classList.remove("hidden");
}

function renderTourLeads(){
  const host=$("tourLeadList");
  if(!host)return;
  const filter=$("tourLeadFilter")?.value||"";
  const list=tourLeads.filter(x=>!filter||String(x.status||"new")===filter);
  host.innerHTML=list.length?list.map(x=>{
    const wa=tourLeadWhatsapp(x.phone);
    const date=x.createdAt?new Date(x.createdAt).toLocaleString("tr-TR"):"";
    return '<article class="tour-lead-row">'+
      '<div class="tour-lead-main"><div class="tour-lead-title"><strong>'+esc(x.businessName||"İşletme")+'</strong><span class="tour-lead-status '+esc(String(x.status||"new"))+'">'+esc(tourLeadStatusLabel(x.status))+'</span></div>'+
      '<small>'+esc([x.city,x.contactName,x.phone].filter(Boolean).join(" · "))+'</small>'+
      (x.email?'<small>E-posta: '+esc(x.email)+'</small>':'')+
      (x.note?'<p><strong>Not:</strong> '+esc(x.note)+'</p>':'')+
      '<em>'+esc(date)+'</em></div>'+
      '<div class="tour-lead-actions">'+
        '<select data-tour-lead-status="'+esc(x.id)+'" data-tour-lead-source="'+esc(x._source||"tourLeads")+'">'+
          '<option value="new" '+(String(x.status||"new")==="new"?"selected":"")+'>Yeni</option>'+
          '<option value="called" '+(x.status==="called"?"selected":"")+'>Arandı</option>'+
          '<option value="planned" '+(x.status==="planned"?"selected":"")+'>Planlandı</option>'+
          '<option value="completed" '+(x.status==="completed"?"selected":"")+'>Tamamlandı</option>'+
        '</select>'+
        '<button type="button" class="tour-lead-detail-btn" data-tour-lead-detail="'+esc(x.id)+'">Detay</button>'+
        (x.phone?'<a class="tour-lead-call" href="tel:'+esc(x.phone)+'">Ara</a>':'')+
        (wa?'<a class="tour-lead-wa" target="_blank" rel="noopener" href="https://wa.me/'+wa+'">WhatsApp</a>':'')+
        '<button type="button" class="tour-lead-delete-btn" data-delete-tour-lead="'+esc(x.id)+'" data-delete-tour-lead-source="'+esc(x._source||"tourLeads")+'">Sil</button>'+
      '</div>'+
    '</article>';
  }).join(""):'<div class="empty">Bu durumda 360° çekim talebi yok.</div>';
}
function renderMedia(){
  renderTourLeads();
  const list=applications.filter(a=>a.wantsPhoto||a.wantsVideo||a.wantsVip);
  $("mediaList").innerHTML=list.length?list.map(a=>'<article class="media-card"><h3>'+esc(a.name)+'</h3><div class="media-tags">'+(a.wantsPhoto?'<span>Fotoğraf</span>':'')+(a.wantsVideo?'<span>Video</span>':'')+(a.wantsVip?'<span>VIP</span>':'')+'</div><p>'+esc([a.city,a.district].filter(Boolean).join(" · "))+'</p></article>').join(""):'<div class="empty">Diğer medya talebi yok.</div>';
}

document.addEventListener("click",async e=>{
  const tourDetail=e.target.closest("[data-tour-lead-detail]");
  if(tourDetail){openTourLeadDetail(tourDetail.dataset.tourLeadDetail);return}

  const deleteTour=e.target.closest("[data-delete-tour-lead]");
  if(deleteTour){
    const id=deleteTour.dataset.deleteTourLead;
    const source=deleteTour.dataset.deleteTourLeadSource||"tourLeads";
    const x=tourLeads.find(item=>String(item.id)===String(id));
    if(!confirm((x?.businessName||"Bu talep")+" silinsin mi?"))return;
    try{
      if(source==="institutionApplications")await db.collection("institutionApplications").doc(id).delete();
      else await db.collection("tourLeads").doc(id).delete();
      $("tourLeadDetailModal")?.classList.add("hidden");
      await loadAll();
    }catch(err){
      alert("360° talep silinemedi: "+(err.message||"Bilinmeyen hata"));
    }
    return;
  }

  const pick=e.target.closest("[data-pick-campaign-firm]");
  if(pick){
    const f=firms.find(x=>x.id===pick.dataset.pickCampaignFirm);
    if(f){
      $("campaignFirm").value=f.id;
      $("campaignFirmSearch").value=f.name||"";
      $("campaignFirmResults").classList.add("hidden");
      loadCampaignFirmData(f);
    }
    return;
  }
  if(!e.target.closest(".firm-picker"))$("campaignFirmResults")?.classList.add("hidden");
  const createMemberAccount=e.target.closest("[data-create-member-account]");if(createMemberAccount){
    const appId=createMemberAccount.dataset.createMemberAccount;
    const email=String($("memberCreateEmail")?.value||"").trim();
    const password=String($("memberCreatePassword")?.value||"");
    const msg=$("memberCreateAccountMessage");
    const app=applications.find(a=>a.id===appId);
    if(!app)return;

    if(!email){
      if(msg){msg.className="message error";msg.textContent="E-posta adresini yazın."}
      return;
    }
    if(password.length<8){
      if(msg){msg.className="message error";msg.textContent="Geçici şifre en az 8 karakter olmalı."}
      return;
    }

    createMemberAccount.disabled=true;
    createMemberAccount.textContent="Hesap oluşturuluyor...";
    if(msg){msg.className="message";msg.textContent="Kurum hesabı hazırlanıyor..."}

    const hiddenEmail=document.createElement("input");
    const hiddenPassword=document.createElement("input");
    hiddenEmail.id="legacyAccountEmail";hiddenEmail.value=email;hiddenEmail.type="hidden";
    hiddenPassword.id="legacyAccountPassword";hiddenPassword.value=password;hiddenPassword.type="hidden";
    document.body.appendChild(hiddenEmail);document.body.appendChild(hiddenPassword);

    try{
      await createLegacyInstitutionAccount(appId);
      await Promise.all([loadApplications(),loadMembers(),loadFirms()]);
      renderAll();
      $("memberDetailModal")?.classList.add("hidden");
      const row=getMemberRows().find(x=>x.applicationId===appId);
      if(row)openMemberDetail(row.id);
    }finally{
      hiddenEmail.remove();hiddenPassword.remove();
      if(createMemberAccount){
        createMemberAccount.disabled=false;
        createMemberAccount.textContent="Kurum Hesabı Oluştur";
      }
    }
    return;
  }
  const memberSelect=e.target.closest("[data-member-select]");if(memberSelect){
    const id=memberSelect.dataset.memberSelect;
    if(memberSelect.checked)selectedMemberIds.add(id);else selectedMemberIds.delete(id);
    memberSelect.closest(".member-row")?.classList.toggle("selected",memberSelect.checked);
    updateMemberBulkUi();
    return;
  }
  const deleteMember=e.target.closest("[data-delete-member]");if(deleteMember){
    const row=getMemberRows().find(x=>x.id===deleteMember.dataset.deleteMember);
    if(!row)return;
    const firmName=row.institutionName||"Bu üye";
    if(!confirm(firmName+" üyeliğini silmek istiyor musunuz? Firma profili silinmeyecek, yalnızca kurum giriş yetkisi kaldırılacak."))return;
    try{
      if(row.memberId){
        await db.collection("institutionUsers").doc(row.memberId).delete();
      }
      if(row.applicationId){
        await db.collection("institutionApplications").doc(row.applicationId).set({
          authUid:"",
          accountEmail:"",
          membershipRemoved:true,
          accountRemovedAt:new Date().toISOString()
        },{merge:true});
      }
      selectedMemberIds.delete(row.id);
      await Promise.all([loadMembers(),loadApplications()]);
      renderAll();
      $("memberDetailModal")?.classList.add("hidden");
      alert("Üyelik silindi. Firma kaydı korunuyor.");
    }catch(err){
      alert("Üye silinemedi: "+(err.message||"Bilinmeyen hata"));
    }
    return;
  }
  const openApprovedApp=e.target.closest("[data-open-approved-app]");if(openApprovedApp){
    $("memberDetailModal")?.classList.add("hidden");
    setView("applications");
    openApplicationDetail(openApprovedApp.dataset.openApprovedApp);
    return;
  }
  const memberDetail=e.target.closest("[data-member-detail]");if(memberDetail){openMemberDetail(memberDetail.dataset.memberDetail);return}
  const legacyCreate=e.target.closest("#createLegacyInstitutionAccount");if(legacyCreate){await createLegacyInstitutionAccount(legacyCreate.dataset.appId);return}
  const detailApp=e.target.closest("[data-detail-app]");if(detailApp)return openApplicationDetail(detailApp.dataset.detailApp);
  const firmSelect=e.target.closest("[data-firm-select]");if(firmSelect){
    const id=firmSelect.dataset.firmSelect;
    if(firmSelect.checked)selectedFirmIds.add(id);else selectedFirmIds.delete(id);
    firmSelect.closest(".data-row")?.classList.toggle("selected",firmSelect.checked);
    updateFirmBulkUi();
    return;
  }
  const deleteFirm=e.target.closest("[data-delete-firm]");if(deleteFirm){
    const f=firms.find(x=>x.id===deleteFirm.dataset.deleteFirm);if(!f)return;
    if(!confirm((f.name||"Bu firma")+" kaydını silmek istiyor musunuz? Bu işlem firma profilini tamamen kaldırır."))return;
    try{
      await db.collection("institutions").doc(f.id).delete();
      selectedFirmIds.delete(f.id);
      await loadFirms();renderAll();
      const m=$("firmBulkMessage");if(m){m.className="message success";m.textContent="Firma silindi."}
    }catch(err){
      alert("Firma silinemedi: "+(err.message||"Bilinmeyen hata"));
    }
    return;
  }
  const qrBtn=e.target.closest("[data-qr-firm]");if(qrBtn)return openQrForFirm(qrBtn.dataset.qrFirm);
  const quickEdit=e.target.closest("[data-quick-edit-firm]");if(quickEdit){openFirmModal(quickEdit.dataset.quickEditFirm);return}
  const edit=e.target.closest("[data-edit-firm]");if(edit){const f=firms.find(x=>x.id===edit.dataset.editFirm);location.href="firma-duzenle.html?id="+encodeURIComponent(edit.dataset.editFirm)+"&name="+encodeURIComponent(f?.name||"");return}
  const camp=e.target.closest("[data-campaign-firm]");if(camp)return openCampaignModal(camp.dataset.campaignFirm);
  const toggle=e.target.closest("[data-toggle-firm]");if(toggle){const f=firms.find(x=>x.id===toggle.dataset.toggleFirm);if(f){await db.collection("institutions").doc(f.id).update({status:String(f.status||"active")==="passive"?"active":"passive"});await loadFirms();renderAll()}return}
  const stop=e.target.closest("[data-stop-campaign]");if(stop){await db.collection("institutions").doc(stop.dataset.stopCampaign).set({campaignActive:false,sponsored:false},{merge:true});await loadFirms();renderAll();return}
  const approve=e.target.closest("[data-approve-app]");if(approve){
    const a=applications.find(x=>x.id===approve.dataset.approveApp);if(!a)return;
    if(!a.authUid){
      openApplicationDetail(a.id);
      const m=$("legacyAccountMessage");
      if(m){m.className="message error";m.textContent="Önce bu başvuru için Kurum Hesabı Oluştur. Sonra onaylayabilirsin."}
      return;
    }
    const data={name:a.name||"Firma",mainCategory:a.mainCategory||"diger",subCategory:a.subCategory||a.category||"",category:a.subCategory||a.category||a.mainCategory||"diger",city:a.city||"",district:a.district||"",address:a.address||"",phone:a.phone||"",whatsapp:a.whatsapp||"",website:a.website||"",instagram:a.instagram||"",description:a.description||"",status:"active",createdAt:new Date().toISOString(),vip:false,sponsored:false};
    const ref=await db.collection("institutions").add(data);
    await db.collection("institutionApplications").doc(a.id).set({status:"approved",approvedInstitutionId:ref.id,approvedAt:new Date().toISOString()},{merge:true});
    if(a.authUid){
      await db.collection("institutionUsers").doc(a.authUid).set({
        email:a.accountEmail||"",
        institutionId:ref.id,
        institutionName:a.name||"Firma",
        status:"approved",
        date:a.date||new Date().toISOString()
      },{merge:true});
    }
    await Promise.all([loadFirms(),loadApplications(),loadMembers()]);renderAll();$("applicationDetailModal")?.classList.add("hidden");return
  }
  const reject=e.target.closest("[data-reject-app]");if(reject){await db.collection("institutionApplications").doc(reject.dataset.rejectApp).set({status:"rejected",rejectedAt:new Date().toISOString()},{merge:true});await loadApplications();renderAll();$("applicationDetailModal")?.classList.add("hidden")}
});

$("memberCopyLogin")?.addEventListener("click",async()=>{
  const url=$("memberCopyLogin").dataset.loginUrl||"https://ftmotiondesign.github.io/dijiyesor/firma-ekle.html?kurumgiris=1";
  try{
    await navigator.clipboard.writeText(url);
    const old=$("memberCopyLogin").textContent;
    $("memberCopyLogin").textContent="Kopyalandı ✓";
    setTimeout(()=>$("memberCopyLogin").textContent=old,1400);
  }catch(_){}
});
$("memberOpenFirm")?.addEventListener("click",()=>{
  const id=$("memberOpenFirm").dataset.firmId;
  if(!id)return;
  $("memberDetailModal").classList.add("hidden");
  location.href="firma-duzenle.html?id="+encodeURIComponent(id);
});


async function runMemberBulkStatus(status){
  const rows=getMemberRows().filter(x=>selectedMemberIds.has(x.id));
  if(!rows.length)return;
  const label={approved:"aktif",pending:"bekleyen",rejected:"reddedilen"}[status]||status;
  if(!confirm(rows.length+" üyeyi "+label+" duruma almak istiyor musunuz?"))return;
  let changed=0,skipped=0;
  try{
    for(const row of rows){
      if(!row.memberId){skipped++;continue}
      await db.collection("institutionUsers").doc(row.memberId).set({status,updatedAt:new Date().toISOString()},{merge:true});
      if(row.applicationId){
        await db.collection("institutionApplications").doc(row.applicationId).set({membershipStatus:status,membershipRemoved:false},{merge:true});
      }
      changed++;
    }
    await Promise.all([loadMembers(),loadApplications()]);
    selectedMemberIds.clear();renderAll();
    const detail=skipped?" "+skipped+" hesap kaydı olmayan üye atlandı.":"";
    const m=$("memberBulkMessage");m.className="message success";m.textContent=changed+" üye güncellendi."+detail;
  }catch(err){
    const m=$("memberBulkMessage");m.className="message error";m.textContent="Toplu işlem tamamlanamadı: "+(err.message||"Bilinmeyen hata");
  }
}
async function runMemberBulkDelete(){
  const rows=getMemberRows().filter(x=>selectedMemberIds.has(x.id));
  if(!rows.length)return;
  if(!confirm(rows.length+" üyeliği toplu olarak silmek istiyor musunuz? Firma profilleri korunacak; kurum giriş yetkileri kaldırılacak."))return;
  try{
    for(const row of rows){
      if(row.memberId)await db.collection("institutionUsers").doc(row.memberId).delete();
      if(row.applicationId){
        await db.collection("institutionApplications").doc(row.applicationId).set({
          authUid:"",
          accountEmail:"",
          membershipRemoved:true,
          accountRemovedAt:new Date().toISOString()
        },{merge:true});
      }
    }
    selectedMemberIds.clear();
    await Promise.all([loadMembers(),loadApplications()]);
    renderAll();
    const m=$("memberBulkMessage");m.className="message success";m.textContent=rows.length+" üyelik silindi. Firma profilleri korundu.";
  }catch(err){
    const m=$("memberBulkMessage");m.className="message error";m.textContent="Toplu silme tamamlanamadı: "+(err.message||"Bilinmeyen hata");
  }
}
$("memberSelectAll")?.addEventListener("change",e=>{
  if(e.target.checked)visibleMemberIds.forEach(id=>selectedMemberIds.add(id));
  else visibleMemberIds.forEach(id=>selectedMemberIds.delete(id));
  renderMembers();
});
$("memberBulkClear")?.addEventListener("click",()=>{selectedMemberIds.clear();renderMembers()});
$("memberBulkApprove")?.addEventListener("click",()=>runMemberBulkStatus("approved"));
$("memberBulkPending")?.addEventListener("click",()=>runMemberBulkStatus("pending"));
$("memberBulkReject")?.addEventListener("click",()=>runMemberBulkStatus("rejected"));
$("memberBulkDelete")?.addEventListener("click",runMemberBulkDelete);
$("memberBulkCopyEmails")?.addEventListener("click",async()=>{
  const rows=getMemberRows().filter(x=>selectedMemberIds.has(x.id));
  const emails=[...new Set(rows.map(x=>String(x.email||"").trim()).filter(Boolean))];
  if(!emails.length){const m=$("memberBulkMessage");m.className="message error";m.textContent="Seçili üyelerde e-posta adresi bulunamadı.";return}
  try{
    await navigator.clipboard.writeText(emails.join(", "));
    const m=$("memberBulkMessage");m.className="message success";m.textContent=emails.length+" e-posta adresi kopyalandı.";
  }catch(_){
    const m=$("memberBulkMessage");m.className="message error";m.textContent="E-postalar kopyalanamadı.";
  }
});
updateMemberBulkUi();






async function runFirmBulkPatch(patch,label){
  const rows=firms.filter(f=>selectedFirmIds.has(f.id));
  if(!rows.length)return;
  if(!confirm(rows.length+" firma için '"+label+"' işlemi uygulansın mı?"))return;
  try{
    for(const f of rows){
      await db.collection("institutions").doc(f.id).set({...patch,updatedAt:new Date().toISOString()},{merge:true});
    }
    await loadFirms();selectedFirmIds.clear();renderAll();
    const m=$("firmBulkMessage");m.className="message success";m.textContent=rows.length+" firma güncellendi: "+label+".";
  }catch(err){
    const m=$("firmBulkMessage");m.className="message error";m.textContent="Toplu işlem tamamlanamadı: "+(err.message||"Bilinmeyen hata");
  }
}
async function runFirmBulkDelete(){
  const rows=firms.filter(f=>selectedFirmIds.has(f.id));
  if(!rows.length)return;
  if(!confirm(rows.length+" firmayı tamamen silmek istiyor musunuz? Bu işlem geri alınamaz."))return;
  try{
    for(const f of rows)await db.collection("institutions").doc(f.id).delete();
    selectedFirmIds.clear();await loadFirms();renderAll();
    const m=$("firmBulkMessage");m.className="message success";m.textContent=rows.length+" firma silindi.";
  }catch(err){
    const m=$("firmBulkMessage");m.className="message error";m.textContent="Toplu silme tamamlanamadı: "+(err.message||"Bilinmeyen hata");
  }
}
$("firmSelectAll")?.addEventListener("change",e=>{
  if(e.target.checked)visibleFirmIds.forEach(id=>selectedFirmIds.add(id));
  else visibleFirmIds.forEach(id=>selectedFirmIds.delete(id));
  renderFirms();
});
$("firmBulkClear")?.addEventListener("click",()=>{selectedFirmIds.clear();renderFirms()});
$("firmBulkActive")?.addEventListener("click",()=>runFirmBulkPatch({status:"active"},"Aktif Yap"));
$("firmBulkPassive")?.addEventListener("click",()=>runFirmBulkPatch({status:"passive"},"Pasif Yap"));
$("firmBulkSponsorOn")?.addEventListener("click",()=>runFirmBulkPatch({sponsored:true},"Sponsor Yap"));
$("firmBulkSponsorOff")?.addEventListener("click",()=>runFirmBulkPatch({sponsored:false},"Sponsoru Kaldır"));
$("firmBulkVipOn")?.addEventListener("click",()=>runFirmBulkPatch({vip:true},"VIP Yap"));
$("firmBulkVipOff")?.addEventListener("click",()=>runFirmBulkPatch({vip:false},"VIP Kaldır"));
$("firmBulkDelete")?.addEventListener("click",runFirmBulkDelete);
updateFirmBulkUi();

$("tourLeadFilter")?.addEventListener("change",renderTourLeads);
document.addEventListener("change",async e=>{
  const select=e.target.closest("[data-tour-lead-status]");
  if(!select)return;
  try{
    const id=select.dataset.tourLeadStatus;
    const source=select.dataset.tourLeadSource||"tourLeads";
    if(source==="institutionApplications"){
      await db.collection("institutionApplications").doc(id).set({
        tourLeadStatus:select.value,
        tourLeadUpdatedAt:new Date().toISOString()
      },{merge:true});
    }else{
      await db.collection("tourLeads").doc(id).set({
        status:select.value,
        updatedAt:new Date().toISOString()
      },{merge:true});
    }
    await loadAll();
  }catch(err){
    alert("360° talep durumu güncellenemedi: "+(err.message||"Bilinmeyen hata"));
  }
});

$("tourLeadDetailDelete")?.addEventListener("click",e=>{
  const btn=e.currentTarget;
  const fake=document.createElement("button");
  fake.dataset.deleteTourLead=btn.dataset.deleteTourLead||"";
  fake.dataset.deleteTourLeadSource=btn.dataset.deleteTourLeadSource||"tourLeads";
  document.body.appendChild(fake);
  fake.click();
  fake.remove();
});


function removeLegacyUploadNotice(){
  const needles=[
    "Şimdilik bilgisayardan doğrudan yükleme kapalı",
    "Görsel URL'sini ilgili alana yapıştır",
    "Görsel URL’sini ilgili alana yapıştır"
  ];
  document.querySelectorAll("body *").forEach(el=>{
    if(el.children.length) return;
    const t=String(el.textContent||"").trim();
    if(needles.some(n=>t.includes(n))) el.remove();
  });
}
document.addEventListener("DOMContentLoaded",()=>{
  removeLegacyUploadNotice();
  const obs=new MutationObserver(removeLegacyUploadNotice);
  obs.observe(document.body,{childList:true,subtree:true});
});


/* Otomatik Firma Topla - arayüz hazırlığı */
(function initAutoFirmImport(){
  const city=document.getElementById("autoImportCity");
  const district=document.getElementById("autoImportDistrict");
  const category=document.getElementById("autoImportCategory");
  const allDistricts=document.getElementById("autoImportAllDistricts");
  const searchBtn=document.getElementById("autoImportSearchBtn");
  const message=document.getElementById("autoImportMessage");
  const preview=document.getElementById("autoImportQueryPreview");
  if(!city||!district||!category)return;

  const categoryLabels={
    surucu:"Sürücü Kursu",kres:"Kreş / Anaokulu",dershane:"Dershane / Kurs Merkezi",
    yurt:"Öğrenci Yurdu",oto_servis:"Oto Servis",restoran:"Restoran",
    dis_klinigi:"Diş Kliniği",emlak_ofisi:"Emlak Ofisi",otel:"Otel / Konaklama"
  };

  async function loadCities(){
    city.innerHTML='<option value="">İller yükleniyor...</option>';
    try{
      const r=await fetch("https://api.turkiyeapi.dev/v2/provinces?fields=id,name&limit=81");
      const j=await r.json();
      city.innerHTML='<option value="">İl seç</option>';
      (j.data||[]).sort((a,b)=>a.name.localeCompare(b.name,"tr")).forEach(x=>{
        const o=document.createElement("option");
        o.value=x.name;o.textContent=x.name;o.dataset.id=x.id;city.appendChild(o);
      });
    }catch(_){ city.innerHTML='<option value="">İl seç</option>'; }
    updatePreview();
  }

  async function loadDistricts(){
    district.disabled=true;
    district.innerHTML='<option value="">İlçe yükleniyor...</option>';
    const id=city.options[city.selectedIndex]?.dataset?.id;
    if(!id){district.innerHTML='<option value="">Önce il seç</option>';updatePreview();return;}
    try{
      const r=await fetch("https://api.turkiyeapi.dev/v2/provinces/"+encodeURIComponent(id)+"/districts?fields=id,name&limit=100");
      const j=await r.json();
      district.innerHTML='<option value="">Tüm İlçeler</option>';
      (j.data||[]).sort((a,b)=>a.name.localeCompare(b.name,"tr")).forEach(x=>{
        const o=document.createElement("option");o.value=x.name;o.textContent=x.name;district.appendChild(o);
      });
      district.disabled=Boolean(allDistricts?.checked);
    }catch(_){district.innerHTML='<option value="">Tüm İlçeler</option>';district.disabled=false;}
    updatePreview();
  }

  function updatePreview(){
    const parts=[city.value||"İl",allDistricts?.checked?"Tüm İlçeler":(district.value||"İlçe"),categoryLabels[category.value]||category.options[category.selectedIndex]?.text].filter(Boolean);
    preview.textContent=parts.join(" / ");
  }

  city.addEventListener("change",loadDistricts);
  district.addEventListener("change",updatePreview);
  category.addEventListener("change",updatePreview);
  allDistricts?.addEventListener("change",()=>{
    district.disabled=allDistricts.checked||!city.value;
    updatePreview();
  });

  searchBtn?.addEventListener("click",()=>{
    message.classList.remove("hidden","success");
    message.classList.add("error");
    if(!city.value){
      message.textContent="Önce bir il seç.";
      return;
    }
    message.textContent="Arayüz hazır. Sıradaki adım Google Places API bağlantısını kurmak. Bağlantı tamamlandığında bu buton gerçek firmaları otomatik getirecek.";
  });

  loadCities();
})();
