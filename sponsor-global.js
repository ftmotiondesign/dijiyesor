(function(){
  const cfg={apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",authDomain:"dijiyer.firebaseapp.com",projectId:"dijiyer",storageBucket:"dijiyer.firebasestorage.app",messagingSenderId:"847787778815",appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"};
  const norm=v=>String(v||"").toLocaleLowerCase("tr-TR").trim();
  const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
  function eligibleDate(x){
    if(x.searchPopupStartDate){
      const s=new Date(x.searchPopupStartDate+"T00:00:00");
      if(!Number.isNaN(s.getTime())&&Date.now()<s.getTime())return false;
    }
    if(x.searchPopupEndDate){
      const e=new Date(x.searchPopupEndDate+"T23:59:59");
      if(!Number.isNaN(e.getTime())&&Date.now()>e.getTime())return false;
    }
    return true;
  }
  function frequencyAllows(x){
    const key="djs_global_sponsor_"+x.id,now=Date.now(),freq=x.searchPopupFrequency||"session";
    try{
      if(freq==="session"&&sessionStorage.getItem(key)==="1")return false;
      if(freq==="daily"||freq==="3days"){
        const last=Number(localStorage.getItem(key+"_ts")||0);
        const gap=freq==="daily"?86400000:259200000;
        if(last&&now-last<gap)return false;
      }
    }catch(_){}
    return true;
  }
  function markShown(x){
    const key="djs_global_sponsor_"+x.id,now=Date.now(),freq=x.searchPopupFrequency||"session";
    try{
      if(freq==="session"||freq==="location")sessionStorage.setItem(key,"1");
      else if(freq==="daily"||freq==="3days")localStorage.setItem(key+"_ts",String(now));
    }catch(_){}
  }
  function currentLocationMatches(x){
    const params=new URLSearchParams(location.search);
    const city=params.get("city")||"";
    const district=params.get("district")||"";
    const adCity=String(x.searchPopupCity||"").trim();
    const adDistrict=String(x.searchPopupDistrict||"").trim();
    if(!adCity||adCity==="__ALL__")return true;
    if(!city)return false;
    if(norm(adCity)!==norm(city))return false;
    if(adDistrict&&norm(adDistrict)!==norm(district))return false;
    return true;
  }
  function render(x){
    const host=document.createElement("div");
    host.className="djs-global-ad";
    host.innerHTML='<div class="djs-global-ad-backdrop" data-djs-global-close></div>'+
      '<div class="djs-global-ad-card" role="dialog" aria-modal="true">'+
      '<button class="djs-global-ad-close" type="button" data-djs-global-close>×</button>'+
      '<span class="djs-global-ad-label">SPONSORLU</span>'+
      '<div class="djs-global-ad-media">'+(x.searchPopupMediaUrl?(x.searchPopupMediaType==="video"?'<video src="'+esc(x.searchPopupMediaUrl)+'" controls playsinline></video>':'<img src="'+esc(x.searchPopupMediaUrl)+'" alt="'+esc(x.name||"Sponsor")+'">'):'')+'</div>'+
      '<h2>'+esc(x.searchPopupTitle||x.name||"Sponsor")+'</h2>'+
      '<p>'+esc(x.searchPopupText||"")+'</p>'+
      '<a class="djs-global-ad-link" href="'+esc(x.searchPopupTargetUrl||("firma.html?id="+encodeURIComponent(x.id)))+'">'+esc(x.searchPopupButtonText||"Firmayı İncele")+'</a>'+
      '</div>';
    const close=()=>{host.remove();document.body.style.overflow=""};
    host.querySelectorAll("[data-djs-global-close]").forEach(el=>el.addEventListener("click",close));
    document.body.appendChild(host);
    document.body.style.overflow="hidden";
  }
  async function init(){
    if(document.getElementById("searchSponsorPopup"))return;
    if(!window.firebase||!firebase.firestore)return;
    try{
      if(!firebase.apps.length)firebase.initializeApp(cfg);
      const snap=await firebase.firestore().collection("institutions").get();
      const rows=snap.docs.map(d=>({id:d.id,...d.data()}))
        .filter(x=>x.searchPopupActive&&String(x.searchPopupScope||"search_results")==="all_pages"&&eligibleDate(x)&&currentLocationMatches(x))
        .sort((a,b)=>Number(a.searchPopupOrder||999999)-Number(b.searchPopupOrder||999999));
      const ad=rows.find(frequencyAllows);
      if(!ad)return;
      render(ad);
      markShown(ad);
    }catch(e){console.warn("Global sponsor reklamı yüklenemedi",e)}
  }
  if(document.readyState==="loading")document.addEventListener("DOMContentLoaded",init);else init();
})();