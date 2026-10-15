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
       el.hidden=!hasRealImage;
       el.style.display=hasRealImage?"":"none";
     });
   });
 }
 const observer=new MutationObserver(markMissingCovers);
 observer.observe(grid,{childList:true,subtree:true,attributes:false});
 grid.addEventListener("load",e=>{if(e.target?.tagName==="IMG")markMissingCovers()},true);
 grid.addEventListener("error",e=>{if(e.target?.tagName==="IMG")markMissingCovers()},true);
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
