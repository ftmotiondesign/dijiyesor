(function(){
  const firebaseConfig={
    apiKey:"AIzaSyD4SHYRiuSuHB-wSl8oWUFMCsfVu6j164E",
    authDomain:"dijiyer.firebaseapp.com",
    projectId:"dijiyer",
    storageBucket:"dijiyer.firebasestorage.app",
    messagingSenderId:"847787778815",
    appId:"1:847787778815:web:57058aa8dcc4143ec5a2ca"
  };
  if(!firebase.apps.length)firebase.initializeApp(firebaseConfig);
  const db=firebase.firestore();

  const labels={
    egitim:"Eğitim",otomotiv:"Otomotiv",yemeicme:"Yeme & İçme",saglikguzellik:"Sağlık & Güzellik",
    evyapi:"Ev & Yapı",emlak:"Emlak",turizm:"Turizm & Konaklama",organizasyonmedya:"Organizasyon & Medya",
    tasimacilik:"Taşımacılık & Teslimat",profesyonel:"Profesyonel Hizmetler",alisveris:"Alışveriş & Yerel Esnaf",diger:"Diğer"
  };

  const esc=v=>String(v||"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

  function ensureModal(){
    if(document.getElementById("bilgiModal"))return;
    const wrap=document.createElement("div");
    wrap.innerHTML=`
      <div id="bilgiModal" class="bilgi-modal" hidden>
        <div class="bilgi-dialog" role="dialog" aria-modal="true" aria-labelledby="bilgiTitle">
          <button class="bilgi-close" type="button" aria-label="Kapat">×</button>
          <div class="bilgi-head">
            <span>BİLGİ AL</span>
            <h2 id="bilgiTitle">Firma ile iletişime geç</h2>
            <p id="bilgiFirmText">Talebini gönder.</p>
          </div>

          <form id="bilgiForm">
            <div class="bilgi-grid">
              <label>Ad Soyad
                <input id="bilgiName" required autocomplete="name" placeholder="Adınız Soyadınız">
              </label>
              <label>Telefon
                <input id="bilgiPhone" required type="tel" autocomplete="tel" placeholder="05xx xxx xx xx">
              </label>
            </div>

            <label>E-posta <small>(opsiyonel)</small>
              <input id="bilgiEmail" type="email" autocomplete="email" placeholder="ornek@email.com">
            </label>

            <label>Ne hakkında bilgi almak istiyorsun?
              <textarea id="bilgiNote" required rows="4" placeholder="Sorunu veya ihtiyacını kısaca yaz."></textarea>
            </label>

            <label class="bilgi-check">
              <input id="bilgiBroadcast" type="checkbox">
              <span><strong>Aynı sektördeki diğer firmalara da gönder</strong><small>Seçersen bu talep aynı sektördeki uygun kayıtlı firmalara da ulaşır.</small></span>
            </label>

            <label class="bilgi-consent">
              <input id="bilgiConsent" type="checkbox" required>
              <span>İletişim bilgilerimin talebime yanıt verecek firmalarla paylaşılmasını kabul ediyorum.</span>
            </label>

            <div id="bilgiMessage" class="bilgi-message hidden"></div>
            <button id="bilgiSubmit" type="submit">Talebi Gönder</button>
          </form>
        </div>
      </div>`;
    document.body.appendChild(wrap.firstElementChild);
  }

  let current={};

  function openModal(btn){
    ensureModal();
    current={
      institutionId:btn.dataset.institutionId||"",
      institutionName:btn.dataset.institutionName||"",
      mainCategory:btn.dataset.mainCategory||"",
      subCategory:btn.dataset.subCategory||"",
      city:btn.dataset.city||"",
      district:btn.dataset.district||""
    };
    document.getElementById("bilgiFirmText").innerHTML=
      '<strong>'+esc(current.institutionName||"Seçili firma")+'</strong> için bilgi talebi gönderiyorsun.';
    document.getElementById("bilgiMessage").className="bilgi-message hidden";
    document.getElementById("bilgiMessage").textContent="";
    document.getElementById("bilgiBroadcast").checked=false;
    document.getElementById("bilgiModal").hidden=false;
    document.body.classList.add("bilgi-modal-open");
    setTimeout(()=>document.getElementById("bilgiName")?.focus(),50);
  }

  function closeModal(){
    const m=document.getElementById("bilgiModal");
    if(!m)return;
    m.hidden=true;
    document.body.classList.remove("bilgi-modal-open");
  }

  document.addEventListener("click",e=>{
    const open=e.target.closest("[data-bilgi-al]");
    if(open){e.preventDefault();openModal(open);return}
    if(e.target.closest(".bilgi-close")){closeModal();return}
    if(e.target.id==="bilgiModal"){closeModal()}
  });

  document.addEventListener("keydown",e=>{if(e.key==="Escape")closeModal()});

  document.addEventListener("submit",async e=>{
    if(e.target.id!=="bilgiForm")return;
    e.preventDefault();

    const phone=document.getElementById("bilgiPhone").value.trim();
    if(phone.replace(/\D/g,"").length<10){
      const msg=document.getElementById("bilgiMessage");
      msg.className="bilgi-message error";
      msg.textContent="Telefon numarasını kontrol edin.";
      return;
    }

    const broadcast=document.getElementById("bilgiBroadcast").checked;
    const btn=document.getElementById("bilgiSubmit");
    const msg=document.getElementById("bilgiMessage");
    btn.disabled=true;btn.textContent="Gönderiliyor...";
    msg.className="bilgi-message";
    msg.textContent="Talebin gönderiliyor...";

    const request={
      mainCategory:current.mainCategory||"diger",
      subCategory:current.subCategory||"diger",
      category:current.subCategory||current.mainCategory||"diger",
      service:labels[current.mainCategory]||"Bilgi Talebi",
      city:current.city||"",
      district:broadcast ? "" : (current.district||""),
      name:document.getElementById("bilgiName").value.trim(),
      phone,
      email:document.getElementById("bilgiEmail").value.trim().toLowerCase(),
      note:document.getElementById("bilgiNote").value.trim(),
      status:"new",
      requestType:broadcast ? "bulk" : "direct",
      targetInstitutionId:current.institutionId||"",
      targetInstitutionName:current.institutionName||"",
      allowAlternativeInstitutions:broadcast,
      source:"dijiyesor-popup",
      date:new Date().toISOString()
    };

    try{
      const ref=await db.collection("quoteRequests").add(request);
      msg.className="bilgi-message success";
      msg.innerHTML=broadcast
        ? "<strong>Talebin gönderildi.</strong><br>Seçtiğin firma ve aynı sektördeki uygun diğer firmalar talebi görebilecek."
        : "<strong>Talebin gönderildi.</strong><br>Sadece seçtiğin firmaya iletildi.";
      e.target.reset();
      setTimeout(closeModal,1800);
    }catch(err){
      console.error(err);
      msg.className="bilgi-message error";
      msg.textContent="Talep gönderilemedi. Lütfen tekrar deneyin.";
    }finally{
      btn.disabled=false;btn.textContent="Talebi Gönder";
    }
  });
})();