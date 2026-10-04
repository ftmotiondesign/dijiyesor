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
let firms=[],applications=[],members=[],tourLeads=[],campaignFilter="all";
const selectedMemberIds=new Set();
let visibleMemberIds=[];
const selectedFirmIds=new Set();
let visibleFirmIds=[];
let quickImportQueue=[];
let googlePlaceResults=[];
const selectedGooglePlaceIds=new Set();
let googleMapsLoadPromise=null;

const $=id=>document.getElementById(id);
const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").trim();
const initials=v=>String(v||"F").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("tr-TR");

function showLogin(){ $("loginView").classList.remove("hidden");$("panelView").classList.add("hidden") }
function showPanel(){ $("loginView").classList.add("hidden");$("panelView").classList.remove("hidden");const requested=location.hash.replace("#","");if(requested)setView(requested);loadAll() }

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

function setView(name){
  document.querySelectorAll(".nav-item").forEach(x=>x.classList.toggle("active",x.dataset.view===name));
  document.querySelectorAll("[data-panel-view]").forEach(x=>x.classList.toggle("active",x.dataset.panelView===name));
  const titles={overview:["Genel Bakış","DijiyeSor yönetim merkezi"],firms:["Firmalar","Profil, görünürlük ve sponsor ayarları"],"google-import":["Hızlı Firma Ekle","Google’da gördüğün firmaları API kullanmadan toplu kaydet"],campaigns:["Kampanyalar & Reklamlar","Sponsorlu içerikleri yönet"],keywords:["Anahtar Kelimeler","Google arama önerilerini incele ve DijiyeSor’a ekle"],qr:["QR / NFC Kartlar","Kart siparişlerini ve firma kartlarını yönet"],"menu-qr":["Menü QR","Menü QR siparişlerini yönet"],"google-qr":["Google QR","Google Yorum Kartı siparişlerini yönet"],applications:["Başvurular","Yeni firma başvurularını incele"],members:["Üyeler","Kurum hesaplarını ve onaylanan üyeleri yönet"],revenue:["Gelir Alanları","NFC / QR Kart, 360° mekan ve diğer gelir modülleri"],media:["360° Mekan","360° çekim taleplerini ve medya fırsatlarını takip et"],settings:["Ayarlar","Panel seçenekleri"]};
  $("pageTitle").textContent=titles[name]?.[0]||"Yönetim";
  $("pageSubtitle").textContent=titles[name]?.[1]||"";
  document.querySelector(".sidebar").classList.remove("open");
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
  await Promise.all([loadFirms(),loadApplications(),loadMembers(),loadTourLeads()]);
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
  renderRecentApplications();renderOverviewCampaigns();renderFirmFilters();renderFirms();renderCampaigns();renderApplications();renderMembers();renderMedia();fillCampaignFirmSelect();
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
      '<div class="row-actions"><button data-edit-firm="'+esc(f.id)+'">Düzenle</button><button data-campaign-firm="'+esc(f.id)+'">Reklam</button><button data-qr-firm="'+esc(f.id)+'">QR/NFC</button><button data-toggle-firm="'+esc(f.id)+'">'+(String(f.status||"active")==="passive"?"Aktif Yap":"Pasif")+'</button><button class="danger" data-delete-firm="'+esc(f.id)+'">Sil</button></div>'+
    '</div>'
  }).join(""):'<div class="empty">Firma bulunamadı.</div>';
  updateFirmBulkUi();
}
["firmSearch","firmSector","firmStatus","firmCompleteness"].forEach(id=>$(id)?.addEventListener(id==="firmSearch"?"input":"change",renderFirms));

function openFirmModal(id){
  const f=firms.find(x=>x.id===id)||{};
  $("firmModalTitle").textContent=id?"Firma Düzenle":"Yeni Firma Ekle";$("firmId").value=id||"";
  $("editName").value=f.name||"";$("editStatus").value=f.status||"active";$("editMainCategory").value=f.mainCategory||"diger";$("editSubCategory").value=f.subCategory||f.category||"";
  $("editCity").value=f.city||"";$("editDistrict").value=f.district||"";$("editPhone").value=f.phone||"";$("editAddress").value=f.address||"";
  $("editWhatsapp").value=f.whatsapp||"";$("editWebsite").value=f.website||"";$("editInstagram").value=f.instagram||"";$("editDescription").value=f.description||"";
  $("editLogoUrl").value=f.logoUrl||"";$("editCoverUrl").value=f.coverUrl||"";$("editTourUrl").value=f.tour360Url||f.virtualTourUrl||f.tour360||"";$("editVideoUrl").value=f.videoUrl||f.youtubeUrl||"";
  updateFirmImagePreview(f.coverUrl||"");
  $("editCoverFile").value="";
  $("coverUploadMessage").className="message hidden";
  $("coverUploadMessage").textContent="";
  $("editVip").checked=Boolean(f.vip);$("editSponsored").checked=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
  $("firmFormMessage").className="message hidden";$("firmModal").classList.remove("hidden");
}
function updateFirmImagePreview(url){
  const box=$("firmImagePreview");
  if(!box)return;
  const value=String(url||"").trim();
  box.innerHTML=value
    ? '<img src="'+esc(value)+'" alt="Firma görseli önizleme">'
    : '<span>Görsel yok</span>';
}
$("editCoverUrl")?.addEventListener("input",e=>updateFirmImagePreview(e.target.value));
$("chooseCoverFileBtn")?.addEventListener("click",()=>$("editCoverFile")?.click());
$("clearCoverImageBtn")?.addEventListener("click",()=>{
  $("editCoverUrl").value="";
  $("editCoverFile").value="";
  updateFirmImagePreview("");
  const msg=$("coverUploadMessage");
  if(msg){msg.className="message success";msg.textContent="Görsel kaldırıldı. Kaydet butonuna basınca işlem tamamlanır."}
});
function uploadFirmImage(file){
  return new Promise((resolve,reject)=>{
    if(!file)return resolve("");
    if(!auth.currentUser)return reject(new Error("Oturum bulunamadı."));
    if(!file.type.startsWith("image/"))return reject(new Error("Sadece görsel dosyası yükleyebilirsiniz."));
    if(file.size>10*1024*1024)return reject(new Error("Görsel en fazla 10 MB olabilir."));
    const msg=$("coverUploadMessage");
    const fd=new FormData();
    fd.append("file",file);
    fd.append("upload_preset",CLOUDINARY_UPLOAD_PRESET);
    const xhr=new XMLHttpRequest();
    xhr.open("POST","https://api.cloudinary.com/v1_1/"+CLOUDINARY_CLOUD_NAME+"/image/upload",true);
    xhr.timeout=30000;
    xhr.onload=()=>{
      let data={};
      try{data=JSON.parse(xhr.responseText||"{}")}catch(_){}
      if(xhr.status>=200&&xhr.status<300&&data.secure_url){
        resolve(data.secure_url);
      }else{
        const detail=data?.error?.message||("HTTP "+xhr.status);
        reject(new Error(detail));
      }
    };
    xhr.onerror=()=>reject(new Error("Cloudinary bağlantısı kurulamadı."));
    xhr.ontimeout=()=>reject(new Error("Yükleme zaman aşımına uğradı."));
    xhr.upload.onprogress=e=>{
      if(e.lengthComputable){
        msg.className="message";
        msg.textContent="%"+Math.round(e.loaded/e.total*100)+" yükleniyor...";
      }
    };
    xhr.send(fd);
  });
}

$("editCoverFile")?.addEventListener("change",async e=>{
  const file=e.target.files?.[0];
  if(!file)return;
  const msg=$("coverUploadMessage");
  try{
    msg.className="message";msg.textContent="Görsel yükleniyor...";
    const url=await uploadFirmImage(file);
    $("editCoverUrl").value=url;
    updateFirmImagePreview(url);
    msg.className="message success";
    msg.textContent="Görsel yüklendi ✓ Şimdi Kaydet butonuna basın.";
  }catch(err){
    msg.className="message error";
    msg.textContent="Görsel yüklenemedi: "+(err.message||"Bilinmeyen hata");
  }
})

$("addFirmBtn").addEventListener("click",()=>openFirmModal());
$("newFirmBtn").addEventListener("click",()=>openFirmModal());

$("firmForm").addEventListener("submit",async e=>{
  e.preventDefault();const id=$("firmId").value;const msg=$("firmFormMessage");
  const data={name:$("editName").value.trim(),status:$("editStatus").value,mainCategory:$("editMainCategory").value,subCategory:$("editSubCategory").value.trim(),category:$("editSubCategory").value.trim()||$("editMainCategory").value,city:$("editCity").value.trim(),district:$("editDistrict").value.trim(),phone:$("editPhone").value.trim(),address:$("editAddress").value.trim(),whatsapp:$("editWhatsapp").value.trim(),website:$("editWebsite").value.trim(),instagram:$("editInstagram").value.trim(),description:$("editDescription").value.trim(),logoUrl:$("editLogoUrl").value.trim(),coverUrl:$("editCoverUrl").value.trim(),tour360Url:$("editTourUrl").value.trim(),videoUrl:$("editVideoUrl").value.trim(),has360Tour:Boolean($("editTourUrl").value.trim()),vip:$("editVip").checked,sponsored:$("editSponsored").checked,updatedAt:new Date().toISOString()};
  try{
    if(id)await db.collection("institutions").doc(id).set(data,{merge:true});
    else await db.collection("institutions").add({...data,createdAt:new Date().toISOString()});
    msg.className="message success";msg.textContent="Kaydedildi.";await loadFirms();renderAll();setTimeout(()=>$("firmModal").classList.add("hidden"),600);
  }catch(err){msg.className="message error";msg.textContent=err.message||"Kaydedilemedi."}
});

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
  if(!f)return;
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
