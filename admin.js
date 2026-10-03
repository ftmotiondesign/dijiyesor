const firebaseConfig={apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",authDomain:"dijiyer.firebaseapp.com",projectId:"dijiyer",storageBucket:"dijiyer.firebasestorage.app",messagingSenderId:"847787778815",appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"};
if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
const auth=firebase.auth();
const db=firebase.firestore();
const legacyAccountRegistrationApp=firebase.apps.find(a=>a.name==="legacyInstitutionRegistration")||firebase.initializeApp(firebaseConfig,"legacyInstitutionRegistration");
const legacyAccountRegistrationAuth=legacyAccountRegistrationApp.auth();
const legacyAccountRegistrationDb=legacyAccountRegistrationApp.firestore();
const ADMIN_EMAIL="ftmotiondesign@gmail.com";

const categories={egitim:"Eğitim",otomotiv:"Otomotiv",yemeicme:"Yeme & İçme",saglikguzellik:"Sağlık & Güzellik",evyapi:"Ev & Yapı",emlak:"Emlak",turizm:"Turizm & Konaklama",organizasyonmedya:"Organizasyon & Medya",tasimacilik:"Taşımacılık & Teslimat",profesyonel:"Profesyonel Hizmetler",alisveris:"Alışveriş & Yerel Esnaf",diger:"Diğer"};
let firms=[],applications=[],members=[],campaignFilter="all";

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
  const titles={overview:["Genel Bakış","DijiyeSor yönetim merkezi"],firms:["Firmalar","Profil, görünürlük ve sponsor ayarları"],campaigns:["Kampanyalar & Reklamlar","Sponsorlu içerikleri yönet"],qr:["QR / NFC Kartlar","Kart siparişlerini ve firma kartlarını yönet"],applications:["Başvurular","Yeni firma başvurularını incele"],members:["Üyeler","Kurum hesaplarını ve onaylanan üyeleri yönet"],media:["360° & Medya","Medya hizmeti fırsatlarını takip et"],settings:["Ayarlar","Panel seçenekleri"]};
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
  await Promise.all([loadFirms(),loadApplications(),loadMembers()]);
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
      email:m.email||app?.accountEmail||"",
      status:m.status||"pending",
      date:m.date||app?.approvedAt||app?.date||"",
      hasAccount:true
    });
  });

  applications
    .filter(a=>String(a.status||"")==="approved")
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
        status:"approved",
        date:a.approvedAt||a.date||"",
        hasAccount:Boolean(a.authUid)
      });
    });

  return rows.sort((a,b)=>String(a.institutionName||a.email||"").localeCompare(String(b.institutionName||b.email||""),"tr"));
}

function renderMembers(){
  const q=norm($("memberSearch")?.value||"");
  const status=$("memberStatus")?.value||"";
  const allRows=getMemberRows();

  const list=allRows.filter(m=>{
    const firm=firms.find(f=>f.id===m.institutionId);
    const hay=[m.institutionName,m.email,firm?.name,firm?.city,firm?.district].join(" ");
    return (!q||norm(hay).includes(q))&&(!status||String(m.status||"pending")===status);
  });

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

    return '<article class="member-row">'+
      '<div class="member-avatar">'+esc(initials(m.institutionName||m.email))+'</div>'+
      '<div class="member-main"><strong>'+esc(m.institutionName||firm?.name||"Kurum")+'</strong><small>'+esc(m.email||"E-posta yok")+'</small>'+accountBadge+'</div>'+
      '<div class="member-place">'+esc([firm?.city,firm?.district].filter(Boolean).join(" · ")||"Konum yok")+'</div>'+
      '<span class="member-status '+esc(statusValue)+'">'+esc(memberStatusLabel(statusValue))+'</span>'+
      '<div class="member-actions"><button data-member-detail="'+esc(m.id)+'">Detay</button>'+(firm?'<button data-edit-firm="'+esc(firm.id)+'">Firma</button>':'')+'</div>'+
    '</article>';
  }).join(""):'<div class="empty">Üye bulunamadı.</div>';
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
  const openApprovedApp=e.target.closest("[data-open-approved-app]");if(openApprovedApp){
    $("memberDetailModal")?.classList.add("hidden");
    setView("applications");
    openApplicationDetail(openApprovedApp.dataset.openApprovedApp);
    return;
  }
  const memberDetail=e.target.closest("[data-member-detail]");if(memberDetail){openMemberDetail(memberDetail.dataset.memberDetail);return}
  const legacyCreate=e.target.closest("#createLegacyInstitutionAccount");if(legacyCreate){await createLegacyInstitutionAccount(legacyCreate.dataset.appId);return}
  const detailApp=e.target.closest("[data-detail-app]");if(detailApp)return openApplicationDetail(detailApp.dataset.detailApp);
  const qrBtn=e.target.closest("[data-qr-firm]");if(qrBtn)return openQrForFirm(qrBtn.dataset.qrFirm);
  const edit=e.target.closest("[data-edit-firm]");if(edit)return openFirmModal(edit.dataset.editFirm);
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
  setView("firms");
  openFirmModal(id);
});
