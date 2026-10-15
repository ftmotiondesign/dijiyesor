/* Layout only: leave app.js rendering, filtering, comparison and sponsor insertion intact. */
(function(){
 "use strict";
 const grid=document.getElementById("companyGrid");
 const controls=document.getElementById("resultsViewToggle");
 if(!grid||!controls)return;
 const buttons=Array.from(controls.querySelectorAll("[data-results-view]"));
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
})();
