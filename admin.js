const firebaseConfig={apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",authDomain:"dijiyer.firebaseapp.com",projectId:"dijiyer",storageBucket:"dijiyer.firebasestorage.app",messagingSenderId:"847787778815",appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"};
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
const ADMIN_EMAIL="ftmotiondesign@gmail.com";

const categories={egitim:"Eğitim",otomotiv:"Otomotiv",yemeicme:"Yeme & İçme",saglikguzellik:"Sağlık & Güzellik",evyapi:"Ev & Yapı",emlak:"Emlak",turizm:"Turizm & Konaklama",organizasyonmedya:"Organizasyon & Medya",tasimacilik:"Taşımacılık & Teslimat",profesyonel:"Profesyonel Hizmetler",alisveris:"Alışveriş & Yerel Esnaf",diger:"Diğer"};
let firms=[],applications=[],campaignFilter="all";

const $=id=>document.getElementById(id);
const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").trim();
const initials=v=>String(v||"F").split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join("").toLocaleUpperCase("tr-TR");

function showLogin(){ $("loginView").classList.remove("hidden");$("panelView").classList.add("hidden") }
function showPanel(){ $("loginView").classList.add("hidden");$("panelView").classList.remove("hidden");loadAll() }

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
  const titles={overview:["Genel Bakış","DijiyeSor yönetim merkezi"],firms:["Firmalar","Profil, görünürlük ve sponsor ayarları"],campaigns:["Kampanyalar & Reklamlar","Sponsorlu içerikleri yönet"],qr:["QR / NFC Kartlar","Kart siparişlerini ve firma kartlarını yönet"],applications:["Başvurular","Yeni firma başvurularını incele"],media:["360° & Medya","Medya hizmeti fırsatlarını takip et"],settings:["Ayarlar","Panel seçenekleri"]};
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
$("mobileMenuBtn").addEventListener("click",()=>document.querySelector(".sidebar").classList.toggle("open"));

async function loadAll(){
  await Promise.all([loadFirms(),loadApplications()]);
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
  renderRecentApplications();renderOverviewCampaigns();renderFirmFilters();renderFirms();renderCampaigns();renderApplications();renderMedia();fillCampaignFirmSelect();
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
function renderFirms(){
  const q=norm($("firmSearch").value),sector=$("firmSector").value,status=$("firmStatus").value;
  const list=firms.filter(f=>{
    const sponsor=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
    const matchesStatus=!status||(status==="sponsored"?sponsor:String(f.status||"active")===status);
    return (!q||norm([f.name,f.city,f.district,f.phone].join(" ")).includes(q))&&(!sector||String(f.mainCategory||"")===sector)&&matchesStatus;
  });
  $("firmList").innerHTML=list.length?list.map(f=>{
    const sponsor=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
    const logo=f.logoUrl?'<img src="'+esc(f.logoUrl)+'">':esc(initials(f.name));
    return '<div class="data-row"><div class="firm-ident"><div class="firm-logo">'+logo+'</div><div><strong>'+esc(f.name)+(sponsor?'<span class="sponsor-dot">Sponsor</span>':'')+'</strong><small>'+esc([f.city,f.district].filter(Boolean).join(" · "))+'</small></div></div><span>'+esc(categories[f.mainCategory]||f.mainCategory||"Diğer")+'</span><span>'+esc(f.phone||"Telefon yok")+'</span><div class="row-actions"><button data-edit-firm="'+esc(f.id)+'">Düzenle</button><button data-campaign-firm="'+esc(f.id)+'">Reklam</button><button data-qr-firm="'+esc(f.id)+'">QR/NFC</button><button class="danger" data-toggle-firm="'+esc(f.id)+'">'+(String(f.status||"active")==="passive"?"Aktif Yap":"Pasif")+'</button></div></div>'
  }).join(""):'<div class="empty">Firma bulunamadı.</div>';
}
["firmSearch","firmSector","firmStatus"].forEach(id=>$(id).addEventListener(id==="firmSearch"?"input":"change",renderFirms));

function openFirmModal(id){
  const f=firms.find(x=>x.id===id)||{};
  $("firmModalTitle").textContent=id?"Firma Düzenle":"Yeni Firma Ekle";$("firmId").value=id||"";
  $("editName").value=f.name||"";$("editStatus").value=f.status||"active";$("editMainCategory").value=f.mainCategory||"diger";$("editSubCategory").value=f.subCategory||f.category||"";
  $("editCity").value=f.city||"";$("editDistrict").value=f.district||"";$("editPhone").value=f.phone||"";$("editAddress").value=f.address||"";
  $("editWhatsapp").value=f.whatsapp||"";$("editWebsite").value=f.website||"";$("editInstagram").value=f.instagram||"";$("editDescription").value=f.description||"";
  $("editLogoUrl").value=f.logoUrl||"";$("editCoverUrl").value=f.coverUrl||"";$("editTourUrl").value=f.tour360Url||f.virtualTourUrl||f.tour360||"";$("editVideoUrl").value=f.videoUrl||f.youtubeUrl||"";
  $("editVip").checked=Boolean(f.vip);$("editSponsored").checked=Boolean(f.sponsored||f.isSponsored||f.vipSponsored||f.advertiser);
  $("firmFormMessage").className="message hidden";$("firmModal").classList.remove("hidden");
}
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
  $("campaignFirm").value=id||"";$("campaignFirmSearch").value=f.name||"";$("campaignFirmResults").classList.add("hidden");$("campaignBadge").value=f.campaignBadge||"Kampanya";$("campaignEnd").value=String(f.campaignEnd||"").slice(0,10);$("campaignTitle").value=f.campaignTitle||"";$("campaignText").value=f.campaignText||"";$("campaignImageUrl").value=f.campaignImageUrl||"";$("campaignUrl").value=f.campaignUrl||"";$("campaignActive").checked=Boolean(f.campaignActive);$("campaignSponsored").checked=Boolean(f.sponsored);
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
  $("campaignSponsored").checked=Boolean(f.sponsored);
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
    await db.collection("institutions").doc(id).set({campaignActive:$("campaignActive").checked,campaignBadge:$("campaignBadge").value.trim()||"Kampanya",campaignEnd:$("campaignEnd").value,campaignTitle:$("campaignTitle").value.trim(),campaignText:$("campaignText").value.trim(),campaignImageUrl:$("campaignImageUrl").value.trim(),campaignUrl:$("campaignUrl").value.trim(),sponsored:$("campaignSponsored").checked,campaignUpdatedAt:new Date().toISOString()},{merge:true});
    msg.className="message success";msg.textContent="Kampanya kaydedildi.";await loadFirms();renderAll();setTimeout(()=>$("campaignModal").classList.add("hidden"),600);
  }catch(err){msg.className="message error";msg.textContent=err.message||"Kaydedilemedi."}
});
function renderCampaigns(){
  let list=firms.filter(f=>f.campaignActive||f.campaignTitle||f.sponsored);
  if(campaignFilter==="active")list=list.filter(isCampaignActive);
  if(campaignFilter==="sponsored")list=list.filter(f=>f.sponsored);
  if(campaignFilter==="expired")list=list.filter(f=>f.campaignActive&&f.campaignEnd&&new Date(f.campaignEnd)<new Date());
  $("campaignList").innerHTML=list.length?list.map(f=>'<article class="campaign-card '+(f.sponsored?"sponsored":"")+'"><div class="campaign-card-head"><span>'+(f.sponsored?"SPONSOR":"KAMPANYA")+'</span><span class="status-pill">'+(isCampaignActive(f)?"Yayında":"Kapalı")+'</span></div><h3>'+esc(f.name)+'</h3><p>'+esc(f.campaignTitle||"Sponsorlu firma profili")+'</p><small>'+esc(f.campaignEnd?("Bitiş: "+f.campaignEnd):"Bitiş tarihi yok")+'</small><div class="campaign-actions"><button data-campaign-firm="'+esc(f.id)+'">Düzenle</button><button data-stop-campaign="'+esc(f.id)+'">Yayından Kaldır</button></div></article>').join(""):'<div class="empty">Bu filtrede kampanya yok.</div>';
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
  $("applicationDetailReject").style.display=status==="new"?"":"none";
  $("applicationDetailModal").classList.remove("hidden");
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
  $("qrOrderPanel")?.classList.toggle("active",mode==="order");
}
document.querySelectorAll("[data-qr-mode]").forEach(btn=>btn.addEventListener("click",()=>setQrMode(btn.dataset.qrMode)));

function openQrForFirm(id){
  const f=firms.find(x=>x.id===id);
  const base="https://ftmotiondesign.github.io/dijiyer/qr-kart-siparis.html";
  const url=f ? base+"?institutionId="+encodeURIComponent(f.id)+"&source=dijiyesor-admin" : base;
  $("qrOrderFrame").src=url;
  $("qrOpenExternal").href=url;
  $("qrSelectedFirmName").textContent=f?.name||"Henüz firma seçilmedi";
  $("qrSelectedFirmMeta").textContent=f
    ? [f.city,f.district,f.phone].filter(Boolean).join(" · ")
    : "Firmalar bölümünden QR/NFC butonuna basabilirsin.";
  setView("qr");
  setQrMode("order");
}
$("qrClearFirm").addEventListener("click",()=>openQrForFirm(""));

function renderMedia(){
  const list=applications.filter(a=>a.wantsPhoto||a.wantsVideo||a.wants360Tour||a.wantsVip);
  $("mediaList").innerHTML=list.length?list.map(a=>'<article class="media-card"><h3>'+esc(a.name)+'</h3><div class="media-tags">'+(a.wants360Tour?'<span>360° Tur</span>':'')+(a.wantsPhoto?'<span>Fotoğraf</span>':'')+(a.wantsVideo?'<span>Video</span>':'')+(a.wantsVip?'<span>VIP</span>':'')+'</div><p>'+esc([a.city,a.district].filter(Boolean).join(" · "))+'</p></article>').join(""):'<div class="empty">Medya hizmeti isteyen firma yok.</div>';
}

document.addEventListener("click",async e=>{
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
  const detailApp=e.target.closest("[data-detail-app]");if(detailApp)return openApplicationDetail(detailApp.dataset.detailApp);
  const qrBtn=e.target.closest("[data-qr-firm]");if(qrBtn)return openQrForFirm(qrBtn.dataset.qrFirm);
  const edit=e.target.closest("[data-edit-firm]");if(edit)return openFirmModal(edit.dataset.editFirm);
  const camp=e.target.closest("[data-campaign-firm]");if(camp)return openCampaignModal(camp.dataset.campaignFirm);
  const toggle=e.target.closest("[data-toggle-firm]");if(toggle){const f=firms.find(x=>x.id===toggle.dataset.toggleFirm);if(f){await db.collection("institutions").doc(f.id).update({status:String(f.status||"active")==="passive"?"active":"passive"});await loadFirms();renderAll()}return}
  const stop=e.target.closest("[data-stop-campaign]");if(stop){await db.collection("institutions").doc(stop.dataset.stopCampaign).set({campaignActive:false,sponsored:false},{merge:true});await loadFirms();renderAll();return}
  const approve=e.target.closest("[data-approve-app]");if(approve){
    const a=applications.find(x=>x.id===approve.dataset.approveApp);if(!a)return;
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
    await Promise.all([loadFirms(),loadApplications()]);renderAll();$("applicationDetailModal")?.classList.add("hidden");return
  }
  const reject=e.target.closest("[data-reject-app]");if(reject){await db.collection("institutionApplications").doc(reject.dataset.rejectApp).set({status:"rejected",rejectedAt:new Date().toISOString()},{merge:true});await loadApplications();renderAll();$("applicationDetailModal")?.classList.add("hidden")}
});
