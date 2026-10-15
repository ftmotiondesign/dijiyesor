/* Layout only: leave app.js rendering, filtering, comparison and sponsor insertion intact. */
(function(){
 "use strict";
 const grid=document.getElementById("companyGrid");
 const controls=document.getElementById("resultsViewToggle");
 if(!grid||!controls)return;
 const buttons=Array.from(controls.querySelectorAll("[data-results-view]"));
 // Mark cards with no real cover image so the empty placeholder can be compacted.
 function markMissingCovers(){
   grid.querySelectorAll(".result-card").forEach(card=>{
     const visual=card.querySelector(".result-visual");
     if(!visual)return;
     const images=Array.from(visual.querySelectorAll("img"));
     const loaded=images.some(img=>img.complete && img.naturalWidth>0);
     const pending=images.some(img=>!img.complete && !!img.getAttribute("src"));
     const hasRealImage=loaded || pending;
     card.classList.toggle("djs-no-cover",!hasRealImage);
     const badge=card.querySelectorAll(".result-badge");
     badge.forEach(el=>{
       if(!el.textContent.includes("Fotoğraflı"))return;
       el.hidden=!loaded;
       el.style.display=loaded?"":"none";
     });
   });
 }
 const observer=new MutationObserver(markMissingCovers);
 observer.observe(grid,{childList:true,subtree:true,attributes:false});
 grid.addEventListener("load",e=>{if(e.target?.tagName==="IMG")markMissingCovers()},true);
 grid.addEventListener("error",e=>{if(e.target?.tagName==="IMG")markMissingCovers()},true);

 // Test only: show the existing firm page in an accessible overlay.
 let firmDialog=null, firmFrame=null, priorFocus=null, previousOverflow="";
 function closeFirmPopup(){
   if(!firmDialog || firmDialog.hidden)return;
   firmDialog.hidden=true;
   firmFrame.src="about:blank";
   document.body.style.overflow=previousOverflow;
   if(priorFocus?.isConnected)priorFocus.focus();
 }
 function openFirmPopup(href,name){
   if(!firmDialog){
     const style=document.createElement("style");
     style.textContent=`
       .djs-firm-dialog[hidden]{display:none!important}
       .djs-firm-dialog{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:center;justify-content:center;padding:24px;background:rgba(12,22,40,.72)}
       .djs-firm-shell{display:flex;flex-direction:column;width:min(1050px,100%);height:min(92dvh,900px);overflow:hidden;border-radius:20px;background:#fff;box-shadow:0 24px 80px rgba(0,0,0,.3)}
       .djs-firm-bar{display:flex;align-items:center;gap:12px;min-height:60px;padding:10px 16px;border-bottom:1px solid #e5e7eb}
       .djs-firm-title{font-weight:800;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;flex:1}
       .djs-firm-bar button,.djs-firm-bar a{border:1px solid #dbe3ee;background:#f8fafc;border-radius:10px;padding:9px 12px;font:inherit;text-decoration:none;color:#1e40af;cursor:pointer}
       .djs-firm-bar .djs-firm-close{background:#1e80f0;color:white;border-color:#1e80f0}
       .djs-firm-frame{flex:1;width:100%;border:0;background:white}
       @media(max-width:680px){.djs-firm-dialog{padding:0}.djs-firm-shell{width:100%;height:100dvh;border-radius:0}.djs-firm-bar{padding:8px 10px;min-height:54px;gap:7px}.djs-firm-bar button,.djs-firm-bar a{font-size:13px;padding:8px}}
     `;
     document.head.appendChild(style);
     firmDialog=document.createElement("div");
     firmDialog.className="djs-firm-dialog";
     firmDialog.hidden=true;
     firmDialog.setAttribute("role","dialog");
     firmDialog.setAttribute("aria-modal","true");
     firmDialog.setAttribute("aria-label","Firma tanıtımı");
     firmDialog.innerHTML='<div class="djs-firm-shell"><div class="djs-firm-bar"><button type="button" class="djs-firm-close" data-close-firm>✕ Kapat</button><strong class="djs-firm-title"></strong><a class="djs-firm-external" href="#" target="_blank" rel="noopener">Tam ekran ↗</a></div><iframe class="djs-firm-frame" title="Firma tanıtım sayfası" allowfullscreen></iframe></div>';
     document.body.appendChild(firmDialog);
     firmFrame=firmDialog.querySelector("iframe");
     firmDialog.addEventListener("click",e=>{if(e.target===firmDialog || e.target.closest("[data-close-firm]"))closeFirmPopup()});
     document.addEventListener("keydown",e=>{
       if(firmDialog.hidden)return;
       if(e.key==="Escape"){e.preventDefault();closeFirmPopup()}
       if(e.key==="Tab"){
         const focusable=[...firmDialog.querySelectorAll("button,a,iframe")];
         const first=focusable[0],last=focusable[focusable.length-1];
         if(e.shiftKey && document.activeElement===first){e.preventDefault();last.focus()}
         else if(!e.shiftKey && document.activeElement===last){e.preventDefault();first.focus()}
       }
     });
   }
   priorFocus=document.activeElement;
   previousOverflow=document.body.style.overflow;
   firmDialog.querySelector(".djs-firm-title").textContent=name||"Firma tanıtımı";
   const url=new URL(href,document.baseURI);
   firmDialog.querySelector(".djs-firm-external").href=url.href;
   firmFrame.src=url.href;
   firmDialog.hidden=false;
   document.body.style.overflow="hidden";
   firmDialog.querySelector("[data-close-firm]").focus();
 }
 grid.addEventListener("click",e=>{
   const link=e.target.closest(".result-card a.result-primary");
   if(!link || !grid.contains(link) || e.defaultPrevented || e.button!==0 || e.ctrlKey || e.metaKey || e.shiftKey || e.altKey)return;
   const url=new URL(link.href,document.baseURI);
   if(url.origin!==location.origin || !url.pathname.endsWith("/firma.html"))return;
   e.preventDefault();
   openFirmPopup(url.href,link.closest(".result-card")?.querySelector(".result-name-row h2")?.textContent);
 });
 const key="dijiyesor-search-view-v1";
 let stored=null;
 try{stored=localStorage.getItem(key)}catch(_){}
 let mode=stored==="grid"||stored==="list"?stored:(window.matchMedia("(max-width: 680px)").matches?"grid":"list");
 function apply(){
   grid.classList.toggle("djs-view-grid",mode==="grid");
   grid.classList.toggle("djs-view-list",mode==="list");
   buttons.forEach(b=>b.setAttribute("aria-pressed",String(b.dataset.resultsView===mode)));
 }
 controls.addEventListener("click",function(e){
   const button=e.target.closest("[data-results-view]");
   if(!button||!controls.contains(button))return;
   mode=button.dataset.resultsView;
   try{localStorage.setItem(key,mode)}catch(_){}
   apply();
 });
 apply();
 markMissingCovers();
})();
