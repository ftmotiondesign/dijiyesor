const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue, FieldPath } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");
const ADMIN_EMAIL = "ftmotiondesign@gmail.com";

const CATEGORY_MAP = {
  kres: { label: "Kreş Anaokulu", mainCategory: "egitim", subCategory: "kres" },
  dershane: { label: "Dershane Kurs Merkezi", mainCategory: "egitim", subCategory: "dershane" },
  surucu: { label: "Sürücü Kursu", mainCategory: "egitim", subCategory: "surucu" },
  src: { label: "SRC Kursu", mainCategory: "egitim", subCategory: "src" },
  psikoteknik: { label: "Psikoteknik Merkezi", mainCategory: "egitim", subCategory: "psikoteknik" },
  halk_egitim: { label: "Halk Eğitim Merkezi", mainCategory: "egitim", subCategory: "halk_egitim" },
  kamu_egitim: { label: "Kamu Eğitim Kurumu", mainCategory: "egitim", subCategory: "kamu_egitim" },
  mesleki_egitim: { label: "Mesleki Eğitim Merkezi", mainCategory: "egitim", subCategory: "mesleki_egitim" },
  e_sinav: { label: "E-Sınav Merkezi", mainCategory: "egitim", subCategory: "e_sinav" },
  ozel_ders: { label: "Özel Ders Merkezi", mainCategory: "egitim", subCategory: "ozel_ders" },
  dil_kursu: { label: "Dil Kursu", mainCategory: "egitim", subCategory: "dil_kursu" },
  etut: { label: "Etüt Merkezi", mainCategory: "egitim", subCategory: "etut" },
  ozel_okul: { label: "Özel Okul", mainCategory: "egitim", subCategory: "ozel_okul" },
  yurt: { label: "Öğrenci Yurdu", mainCategory: "egitim", subCategory: "yurt" },
  diger_egitim: { label: "Eğitim Kurumu", mainCategory: "egitim", subCategory: "diger_egitim" },

  oto_servis: { label: "Oto Servis", mainCategory: "otomotiv", subCategory: "oto_servis" },
  kaporta_boya: { label: "Kaporta Boya", mainCategory: "otomotiv", subCategory: "kaporta_boya" },
  oto_elektrik: { label: "Oto Elektrik", mainCategory: "otomotiv", subCategory: "oto_elektrik" },
  lastik_jant: { label: "Lastik Jant", mainCategory: "otomotiv", subCategory: "lastik_jant" },
  oto_yikama: { label: "Oto Yıkama", mainCategory: "otomotiv", subCategory: "oto_yikama" },
  ekspertiz: { label: "Oto Ekspertiz", mainCategory: "otomotiv", subCategory: "ekspertiz" },
  galeri: { label: "Oto Galeri", mainCategory: "otomotiv", subCategory: "galeri" },
  rentacar: { label: "Araç Kiralama Rent a Car", mainCategory: "otomotiv", subCategory: "rentacar" },
  yedek_parca: { label: "Oto Yedek Parça", mainCategory: "otomotiv", subCategory: "yedek_parca" },
  motosiklet: { label: "Motosiklet Bayi Servis", mainCategory: "otomotiv", subCategory: "motosiklet" },

  restoran: { label: "Restoran", mainCategory: "yemeicme", subCategory: "restoran" },
  kafe: { label: "Kafe Cafe", mainCategory: "yemeicme", subCategory: "kafe" },
  fastfood: { label: "Fast Food", mainCategory: "yemeicme", subCategory: "fastfood" },
  pastane: { label: "Pastane", mainCategory: "yemeicme", subCategory: "pastane" },
  pizza: { label: "Pizza Restoranı", mainCategory: "yemeicme", subCategory: "pizza" },
  doner: { label: "Döner Restoranı", mainCategory: "yemeicme", subCategory: "doner" },
  pide_lahmacun: { label: "Pide Lahmacun", mainCategory: "yemeicme", subCategory: "pide_lahmacun" },
  catering: { label: "Catering", mainCategory: "yemeicme", subCategory: "catering" },
  ev_yemekleri: { label: "Ev Yemekleri Lokanta", mainCategory: "yemeicme", subCategory: "ev_yemekleri" },

  dis_klinigi: { label: "Diş Kliniği", mainCategory: "saglikguzellik", subCategory: "dis_klinigi" },
  klinik: { label: "Özel Klinik", mainCategory: "saglikguzellik", subCategory: "klinik" },
  psikolog: { label: "Psikolog", mainCategory: "saglikguzellik", subCategory: "psikolog" },
  diyetisyen: { label: "Diyetisyen", mainCategory: "saglikguzellik", subCategory: "diyetisyen" },
  fizyoterapi: { label: "Fizyoterapi Merkezi", mainCategory: "saglikguzellik", subCategory: "fizyoterapi" },
  guzellik: { label: "Güzellik Merkezi", mainCategory: "saglikguzellik", subCategory: "guzellik" },
  kuafor: { label: "Kuaför", mainCategory: "saglikguzellik", subCategory: "kuafor" },
  berber: { label: "Berber", mainCategory: "saglikguzellik", subCategory: "berber" },
  spor: { label: "Spor Salonu Fitness", mainCategory: "saglikguzellik", subCategory: "spor" },

  mobilya: { label: "Mobilya Mağazası", mainCategory: "evyapi", subCategory: "mobilya" },
  dekorasyon: { label: "Dekorasyon", mainCategory: "evyapi", subCategory: "dekorasyon" },
  insaat: { label: "İnşaat Firması", mainCategory: "evyapi", subCategory: "insaat" },
  elektrikci: { label: "Elektrikçi", mainCategory: "evyapi", subCategory: "elektrikci" },
  tesisatci: { label: "Tesisatçı", mainCategory: "evyapi", subCategory: "tesisatci" },
  teknik_servis: { label: "Teknik Servis", mainCategory: "evyapi", subCategory: "teknik_servis" },
  klima: { label: "Klima Servisi", mainCategory: "evyapi", subCategory: "klima" },
  cam_balkon: { label: "Cam Balkon", mainCategory: "evyapi", subCategory: "cam_balkon" },
  temizlik: { label: "Temizlik Şirketi", mainCategory: "evyapi", subCategory: "temizlik" },

  emlak_ofisi: { label: "Emlak Ofisi", mainCategory: "emlak", subCategory: "emlak_ofisi" },
  konut: { label: "Konut Emlak", mainCategory: "emlak", subCategory: "konut" },
  arsa: { label: "Arsa Emlak", mainCategory: "emlak", subCategory: "arsa" },
  ticari: { label: "Ticari Gayrimenkul", mainCategory: "emlak", subCategory: "ticari" },
  gunluk_kiralik: { label: "Günlük Kiralık", mainCategory: "emlak", subCategory: "gunluk_kiralik" },

  otel: { label: "Otel Konaklama", mainCategory: "turizm", subCategory: "otel" },
  pansiyon: { label: "Pansiyon", mainCategory: "turizm", subCategory: "pansiyon" },
  apart: { label: "Apart Otel", mainCategory: "turizm", subCategory: "apart" },
  bungalov: { label: "Bungalov", mainCategory: "turizm", subCategory: "bungalov" },
  seyahat: { label: "Seyahat Acentesi", mainCategory: "turizm", subCategory: "seyahat" },
  kamp: { label: "Kamp Alanı", mainCategory: "turizm", subCategory: "kamp" },

  dugun_salonu: { label: "Düğün Salonu", mainCategory: "organizasyonmedya", subCategory: "dugun_salonu" },
  organizasyon: { label: "Organizasyon Firması", mainCategory: "organizasyonmedya", subCategory: "organizasyon" },
  fotograf: { label: "Fotoğrafçı", mainCategory: "organizasyonmedya", subCategory: "fotograf" },
  video: { label: "Video Prodüksiyon", mainCategory: "organizasyonmedya", subCategory: "video" },
  drone: { label: "Drone Çekimi", mainCategory: "organizasyonmedya", subCategory: "drone" },
  gelinlik: { label: "Gelinlik Mağazası", mainCategory: "organizasyonmedya", subCategory: "gelinlik" },
  cicekci: { label: "Çiçekçi", mainCategory: "organizasyonmedya", subCategory: "cicekci" },
  reklam: { label: "Reklam Ajansı", mainCategory: "organizasyonmedya", subCategory: "reklam" },

  nakliyat: { label: "Nakliyat", mainCategory: "tasimacilik", subCategory: "nakliyat" },
  kurye: { label: "Kurye", mainCategory: "tasimacilik", subCategory: "kurye" },
  sehirici: { label: "Şehir İçi Taşımacılık", mainCategory: "tasimacilik", subCategory: "sehirici" },
  depolama: { label: "Depolama", mainCategory: "tasimacilik", subCategory: "depolama" },

  hukuk: { label: "Avukat Hukuk Bürosu", mainCategory: "profesyonel", subCategory: "hukuk" },
  muhasebe: { label: "Muhasebe Mali Müşavir", mainCategory: "profesyonel", subCategory: "muhasebe" },
  web: { label: "Web Tasarım", mainCategory: "profesyonel", subCategory: "web" },
  sosyal_medya: { label: "Sosyal Medya Ajansı", mainCategory: "profesyonel", subCategory: "sosyal_medya" },
  teknoloji: { label: "Teknoloji Firması", mainCategory: "profesyonel", subCategory: "teknoloji" },
  bilgisayar: { label: "Bilgisayar Servisi Mağazası", mainCategory: "profesyonel", subCategory: "bilgisayar" },
  danismanlik: { label: "Danışmanlık", mainCategory: "profesyonel", subCategory: "danismanlik" },
  veteriner: { label: "Veteriner Kliniği", mainCategory: "profesyonel", subCategory: "veteriner" },
  tarim: { label: "Tarım Firması", mainCategory: "profesyonel", subCategory: "tarim" },

  giyim: { label: "Giyim Mağazası", mainCategory: "alisveris", subCategory: "giyim" },
  ayakkabi: { label: "Ayakkabı Mağazası", mainCategory: "alisveris", subCategory: "ayakkabi" },
  market: { label: "Market", mainCategory: "alisveris", subCategory: "market" },
  elektronik: { label: "Elektronik Mağazası", mainCategory: "alisveris", subCategory: "elektronik" },
  kirtasiye: { label: "Kırtasiye", mainCategory: "alisveris", subCategory: "kirtasiye" },
  petshop: { label: "Pet Shop", mainCategory: "alisveris", subCategory: "petshop" },
  zuccaciye: { label: "Züccaciye", mainCategory: "alisveris", subCategory: "zuccaciye" },
  esnaf: { label: "Yerel Esnaf", mainCategory: "alisveris", subCategory: "esnaf" },

  diger: { label: "Yerel İşletme", mainCategory: "diger", subCategory: "diger" }
}

const CATEGORY_SEARCH_TERMS = {
  // EĞİTİM
  kres:["Kreş","Anaokulu","Gündüz Bakımevi","Çocuk Gündüz Bakımevi"],
  dershane:["Dershane","Özel Öğretim Kursu","Kurs Merkezi","LGS YKS Kursu"],
  surucu:["Sürücü Kursu","Motorlu Taşıt Sürücü Kursu","Ehliyet Kursu"],
  src:["SRC Kursu","SRC Belgesi Kursu","Mesleki Yeterlilik SRC"],
  psikoteknik:["Psikoteknik Merkezi","Psikoteknik Değerlendirme Merkezi","Psikoteknik Belgesi"],
  halk_egitim:["Halk Eğitim Merkezi","Halk Eğitimi Merkezi","Halk Eğitim Kursları"],
  kamu_egitim:["Kamu Eğitim Kurumu","Milli Eğitim Merkezi","Resmi Eğitim Kurumu"],
  mesleki_egitim:["Mesleki Eğitim Merkezi","Meslek Eğitim Merkezi","Çıraklık Eğitim Merkezi"],
  e_sinav:["E-Sınav Merkezi","Elektronik Sınav Merkezi","MEB E-Sınav Merkezi"],
  ozel_ders:["Özel Ders Merkezi","Özel Ders","Birebir Eğitim Merkezi","Eğitim Koçluğu"],
  dil_kursu:["Dil Kursu","İngilizce Kursu","Yabancı Dil Kursu","Language School","İngilizce Dil Okulu"],
  etut:["Etüt Merkezi","Etüt Eğitim Merkezi","Öğrenci Etüt Merkezi","Eğitim ve Etüt Merkezi","Özel Öğretim Kursu"],
  ozel_okul:["Özel Okul","Özel Kolej","Kolej","Özel Eğitim Kurumu"],
  yurt:["Öğrenci Yurdu","Özel Öğrenci Yurdu","Kız Öğrenci Yurdu","Erkek Öğrenci Yurdu"],
  diger_egitim:["Eğitim Kurumu","Eğitim Merkezi","Kurs Merkezi"],

  // OTOMOTİV
  oto_servis:["Oto Servis","Oto Tamir","Araç Bakım Servisi","Özel Oto Servis"],
  kaporta_boya:["Kaporta Boya","Oto Kaporta","Oto Boya","Göçük Düzeltme"],
  oto_elektrik:["Oto Elektrik","Oto Elektrikçi","Araç Elektrik Servisi"],
  lastik_jant:["Lastikçi","Lastik Jant","Oto Lastik","Jant Lastik"],
  oto_yikama:["Oto Yıkama","Araç Yıkama","Oto Kuaför","Detaylı Araç Temizliği"],
  ekspertiz:["Oto Ekspertiz","Araç Ekspertiz","Oto Test Merkezi"],
  galeri:["Oto Galeri","Otomobil Galerisi","İkinci El Araç Satış"],
  rentacar:["Rent a Car","Araç Kiralama","Oto Kiralama"],
  yedek_parca:["Oto Yedek Parça","Otomotiv Yedek Parça","Araç Yedek Parça"],
  motosiklet:["Motosiklet Bayi","Motosiklet Servisi","Motor Bayi","Motor Servisi"],

  // YEME & İÇME
  restoran:["Restoran","Lokanta","Restaurant"],
  kafe:["Kafe","Cafe","Kahve Evi"],
  fastfood:["Fast Food","Hamburger Restoranı","Burger"],
  pastane:["Pastane","Patisserie","Tatlı Pastanesi"],
  pizza:["Pizza","Pizzacı","Pizza Restoranı"],
  doner:["Dönerci","Döner Restoranı","Döner Kebap"],
  pide_lahmacun:["Pideci","Lahmacun","Pide Lahmacun Restoranı"],
  catering:["Catering","Toplu Yemek","Yemek Organizasyonu"],
  ev_yemekleri:["Ev Yemekleri","Ev Yemekleri Lokantası","Sulu Yemek Lokantası"],

  // SAĞLIK & GÜZELLİK
  dis_klinigi:["Diş Kliniği","Diş Hekimi","Ağız ve Diş Sağlığı Kliniği"],
  klinik:["Özel Klinik","Tıp Merkezi","Sağlık Kliniği"],
  psikolog:["Psikolog","Psikolojik Danışmanlık","Terapi Merkezi"],
  diyetisyen:["Diyetisyen","Beslenme Danışmanlığı","Diyet Merkezi"],
  fizyoterapi:["Fizyoterapi Merkezi","Fizik Tedavi Merkezi","Fizyoterapist"],
  guzellik:["Güzellik Merkezi","Cilt Bakım Merkezi","Beauty Center"],
  kuafor:["Kuaför","Bayan Kuaförü","Saç Tasarım"],
  berber:["Berber","Erkek Kuaförü","Barber"],
  spor:["Spor Salonu","Fitness Salonu","Gym","Pilates Stüdyosu"],

  // EV & YAPI
  mobilya:["Mobilya Mağazası","Mobilyacı","Ev Mobilyası"],
  dekorasyon:["Dekorasyon","İç Dekorasyon","İç Mimarlık Dekorasyon"],
  insaat:["İnşaat Firması","Müteahhit","Yapı İnşaat"],
  elektrikci:["Elektrikçi","Elektrik Ustası","Elektrik Servisi"],
  tesisatci:["Tesisatçı","Su Tesisatçısı","Sıhhi Tesisat"],
  teknik_servis:["Teknik Servis","Beyaz Eşya Servisi","Elektronik Teknik Servis"],
  klima:["Klima Servisi","Klima Bakım","Klima Montaj"],
  cam_balkon:["Cam Balkon","Balkon Camlama","Cam Balkon Sistemleri"],
  temizlik:["Temizlik Şirketi","Temizlik Firması","Ev Temizliği"],

  // EMLAK
  emlak_ofisi:["Emlak Ofisi","Emlakçı","Gayrimenkul Danışmanlığı"],
  konut:["Konut Emlak","Satılık Daire","Kiralık Daire"],
  arsa:["Arsa Emlak","Satılık Arsa","Arsa Gayrimenkul"],
  ticari:["Ticari Gayrimenkul","İşyeri Emlak","Dükkan Emlak"],
  gunluk_kiralik:["Günlük Kiralık","Günlük Kiralık Daire","Apart Günlük Kiralık"],

  // TURİZM & KONAKLAMA
  otel:["Otel","Hotel","Konaklama Tesisi"],
  pansiyon:["Pansiyon","Guest House","Konukevi"],
  apart:["Apart Otel","Apart Hotel","Apart Konaklama"],
  bungalov:["Bungalov","Bungalow","Bungalov Ev"],
  seyahat:["Seyahat Acentesi","Turizm Acentesi","Tur Operatörü"],
  kamp:["Kamp Alanı","Camping","Karavan Kamp Alanı"],

  // ORGANİZASYON & MEDYA
  dugun_salonu:["Düğün Salonu","Davet Salonu","Balo Salonu"],
  organizasyon:["Organizasyon Firması","Etkinlik Organizasyon","Düğün Organizasyon"],
  fotograf:["Fotoğrafçı","Fotoğraf Stüdyosu","Profesyonel Fotoğrafçı"],
  video:["Video Prodüksiyon","Video Çekimi","Prodüksiyon Şirketi"],
  drone:["Drone Çekimi","Havadan Çekim","Drone Fotoğraf Video"],
  gelinlik:["Gelinlik Mağazası","Gelinlikçi","Bridal Shop"],
  cicekci:["Çiçekçi","Çiçekçilik","Flower Shop"],
  reklam:["Reklam Ajansı","Dijital Reklam Ajansı","Grafik Tasarım Ajansı"],

  // TAŞIMACILIK & TESLİMAT
  nakliyat:["Nakliyat","Evden Eve Nakliyat","Taşımacılık Firması"],
  kurye:["Kurye","Moto Kurye","Kurye Hizmeti"],
  sehirici:["Şehir İçi Taşımacılık","Şehir İçi Nakliye","Yük Taşıma"],
  depolama:["Depolama","Eşya Depolama","Depo Kiralama"],

  // PROFESYONEL HİZMETLER
  hukuk:["Avukat","Hukuk Bürosu","Avukatlık Bürosu"],
  muhasebe:["Muhasebe","Mali Müşavir","Serbest Muhasebeci Mali Müşavir"],
  web:["Web Tasarım","Web Tasarım Ajansı","Web Yazılım"],
  sosyal_medya:["Sosyal Medya Ajansı","Sosyal Medya Yönetimi","Dijital Pazarlama Ajansı"],
  teknoloji:["Teknoloji Firması","Yazılım Şirketi","Bilişim Firması"],
  bilgisayar:["Bilgisayar Servisi","Bilgisayar Tamiri","Bilgisayar Mağazası"],
  danismanlik:["Danışmanlık","Danışmanlık Firması","Kurumsal Danışmanlık"],
  veteriner:["Veteriner","Veteriner Kliniği","Hayvan Hastanesi"],
  tarim:["Tarım Firması","Zirai Ürünler","Tarım Ürünleri"],

  // ALIŞVERİŞ & YEREL ESNAF
  giyim:["Giyim Mağazası","Butik","Hazır Giyim"],
  ayakkabi:["Ayakkabı Mağazası","Ayakkabıcı","Shoe Store"],
  market:["Market","Süpermarket","Bakkal"],
  elektronik:["Elektronik Mağazası","Elektronikçi","Teknoloji Mağazası"],
  kirtasiye:["Kırtasiye","Kırtasiye Mağazası","Ofis Kırtasiye"],
  petshop:["Pet Shop","Evcil Hayvan Mağazası","Pet Market"],
  zuccaciye:["Züccaciye","Ev Gereçleri Mağazası","Mutfak Gereçleri"],
  esnaf:["Yerel Esnaf","Mağaza","Yerel İşletme"],

  // DİĞER
  diger:["Yerel İşletme","Firma","Hizmet İşletmesi"]
};

async function searchPlacesForCategory({ city, district, categoryKey, category }) {
  const terms = CATEGORY_SEARCH_TERMS[categoryKey] || [category.label];
  const uniqueTerms = [...new Set(terms.map(s).filter(Boolean))];

  const settled = await Promise.allSettled(
    uniqueTerms.map((term) => {
      const query = [district, city, term].filter(Boolean).join(" ");
      return placesTextSearch(query).then((result) => ({
        query,
        places: Array.isArray(result?.places) ? result.places : []
      }));
    })
  );

  const placeMap = new Map();
  const queries = [];
  let successfulQueries = 0;

  for (const item of settled) {
    if (item.status !== "fulfilled") {
      console.warn("Kategori alternatif sorgusu başarısız:", item.reason?.message || item.reason);
      continue;
    }
    successfulQueries++;
    queries.push(item.value.query);
    for (const place of item.value.places) {
      const id = s(place?.id);
      if (id && !placeMap.has(id)) placeMap.set(id, place);
    }
  }

  if (!successfulQueries) {
    throw new HttpsError("internal", "Google Places kategori aramaları başarısız oldu.");
  }

  return {
    query: queries[0] || [district, city, category.label].filter(Boolean).join(" "),
    queries,
    places: [...placeMap.values()]
  };
}

function requireAdmin(request) {
  const email = String(request.auth?.token?.email || "").toLowerCase();
  if (!request.auth || email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Bu işlem yalnızca DijiyeSor yöneticisi içindir.");
  }
}

function s(v) {
  return String(v || "").trim();
}

function formatFirmTitle(value) {
  const text = s(value).replace(/\s+/g, " ");
  if (!text) return "";
  const keepUpper = new Set(["SRC","MEB","LGS","TYT","AYT","YKS","KPSS","DGS","AÖF","MYO","VIP","A1","A2","B","B1","C","C1","D","D1","BE","CE","DE"]);
  return text.split(" ").map((word) => {
    const bare = word.replace(/^[^\p{L}\p{N}]+|[^\p{L}\p{N}]+$/gu, "");
    if (!bare) return word;
    const upper = bare.toLocaleUpperCase("tr-TR");
    if (keepUpper.has(upper)) return word.replace(bare, upper);
    const low = bare.toLocaleLowerCase("tr-TR");
    const fixed = low.charAt(0).toLocaleUpperCase("tr-TR") + low.slice(1);
    return word.replace(bare, fixed);
  }).join(" ");
}

function normText(v) {
  return s(v)
    .toLocaleLowerCase("tr-TR")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ı/g, "i")
    .replace(/ş/g, "s")
    .replace(/ğ/g, "g")
    .replace(/ü/g, "u")
    .replace(/ö/g, "o")
    .replace(/ç/g, "c")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normPhone(v) {
  const digits = s(v).replace(/\D/g, "");
  if (!digits) return "";
  return digits.length > 10 ? digits.slice(-10) : digits;
}

function addressLooksSame(a, b) {
  const x = normText(a);
  const y = normText(b);
  if (!x || !y) return false;
  if (x === y) return true;
  const shorter = x.length <= y.length ? x : y;
  const longer = x.length > y.length ? x : y;
  return shorter.length >= 18 && longer.includes(shorter);
}

function duplicateReason(candidate, row) {
  const candidatePlaceId = s(candidate.googlePlaceId || candidate.placeId);
  const rowPlaceId = s(row.googlePlaceId || row.placeId);

  if (candidatePlaceId && rowPlaceId && candidatePlaceId === rowPlaceId) {
    return "google_place_id";
  }

  const candidatePhone = normPhone(candidate.phone || candidate.whatsapp);
  const rowPhone = normPhone(row.phone || row.whatsapp);
  if (candidatePhone && rowPhone && candidatePhone === rowPhone) {
    return "phone";
  }

  const candidateName = normText(candidate.name);
  const rowName = normText(row.name);
  const sameName = candidateName && rowName && candidateName === rowName;

  if (sameName && addressLooksSame(candidate.address, row.address)) {
    return "name_address";
  }

  return "";
}

function findDuplicate(candidate, rows) {
  for (const row of rows) {
    const reason = duplicateReason(candidate, row);
    if (reason) return { row, reason };
  }
  return null;
}

function placeSearchMatchScore(row, place) {
  const rowName = normText(row.name);
  const placeName = normText(place.displayName?.text || "");
  if (!rowName || !placeName) return 0;

  let score = 0;

  if (rowName === placeName) score += 100;
  else if (rowName.includes(placeName) || placeName.includes(rowName)) score += 55;

  const rowAddress = normText(row.address);
  const placeAddress = normText(place.formattedAddress || "");
  if (rowAddress && placeAddress) {
    if (rowAddress === placeAddress) score += 70;
    else if (addressLooksSame(rowAddress, placeAddress)) score += 45;
  }

  const city = normText(row.city);
  const district = normText(row.district);
  if (city && placeAddress.includes(city)) score += 20;
  if (district && placeAddress.includes(district)) score += 20;

  return score;
}

async function findPlaceForLegacyFirm(row) {
  const query = [row.name, row.district, row.city, row.address]
    .map(s)
    .filter(Boolean)
    .join(" ");

  if (!s(row.name) || !query) return null;

  const result = await placesTextSearch(query);
  const candidates = Array.isArray(result.places) ? result.places : [];

  let best = null;
  let bestScore = 0;

  for (const place of candidates) {
    const score = placeSearchMatchScore(row, place);
    if (score > bestScore) {
      best = place;
      bestScore = score;
    }
  }

  // Güvenli otomatik eşleşme eşiği:
  // tam isim + konum/adres veya güçlü isim/adres benzerliği.
  if (!best || bestScore < 100) return null;

  return {
    placeId: s(best.id),
    score: bestScore
  };
}

async function placesTextSearch(query) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY.value(),
      "X-Goog-FieldMask": "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.businessStatus,places.photos"
    },
    body: JSON.stringify({
      textQuery: query,
      languageCode: "tr",
      regionCode: "TR",
      pageSize: 20
    })
  });

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_) {}

  if (!response.ok) {
    console.error("Places error", response.status, raw);
    throw new HttpsError("internal", data?.error?.message || "Google Places araması başarısız oldu.");
  }

  return data;
}

async function getPlaceDetails(placeId) {
  const fields = [
    "id",
    "displayName",
    "formattedAddress",
    "location",
    "nationalPhoneNumber",
    "internationalPhoneNumber",
    "websiteUri",
    "googleMapsUri",
    "businessStatus",
    "types",
    "photos"
  ].join(",");

  const response = await fetch(
    "https://places.googleapis.com/v1/places/" +
      encodeURIComponent(placeId) +
      "?languageCode=tr&regionCode=TR",
    {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY.value(),
        "X-Goog-FieldMask": fields
      }
    }
  );

  const raw = await response.text();
  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch (_) {}

  if (!response.ok) {
    console.error("Place Details error", response.status, raw);
    throw new HttpsError("internal", data?.error?.message || "Firma detayları alınamadı.");
  }

  return data;
}

function googlePhotoProxyUrl(photoName) {
  const name = s(photoName);
  if (!name) return "";
  return "https://europe-west1-dijiyer.cloudfunctions.net/placePhoto?name=" +
    encodeURIComponent(name);
}

exports.placePhoto = onRequest(
  {
    region: "europe-west1",
    secrets: [GOOGLE_PLACES_API_KEY],
    timeoutSeconds: 30,
    memory: "256MiB",
    cors: true
  },
  async (request, response) => {
    try {
      const name = s(request.query?.name);
      if (!/^places\/[^/]+\/photos\/[^/]+$/.test(name)) {
        response.status(400).send("Geçersiz fotoğraf.");
        return;
      }

      const requestedSize = Math.max(
        240,
        Math.min(1200, Number(request.query?.w || request.query?.size || 900))
      );

      const mediaResponse = await fetch(
        "https://places.googleapis.com/v1/" +
          name +
          "/media?maxWidthPx=" + requestedSize + "&maxHeightPx=" + requestedSize,
        {
          redirect: "follow",
          headers: {
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY.value()
          }
        }
      );

      if (!mediaResponse.ok) {
        console.error("Place photo media error", mediaResponse.status, await mediaResponse.text());
        response.status(404).send("Fotoğraf bulunamadı.");
        return;
      }

      const contentType = mediaResponse.headers.get("content-type") || "image/jpeg";
      if (!contentType.toLowerCase().startsWith("image/")) {
        console.error("Place photo invalid content type", contentType);
        response.status(404).send("Fotoğraf bulunamadı.");
        return;
      }

      const bytes = Buffer.from(await mediaResponse.arrayBuffer());
      response.set("Content-Type", contentType);
      response.set("Cache-Control", "public, max-age=86400, s-maxage=86400");
      response.status(200).send(bytes);
    } catch (err) {
      console.error("Place photo error", err);
      response.status(500).send("Fotoğraf alınamadı.");
    }
  }
);

exports.searchPlaces = onCall(
  {
    region: "europe-west1",
    secrets: [GOOGLE_PLACES_API_KEY],
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (request) => {
    requireAdmin(request);

    const city = s(request.data?.city);
    const district = s(request.data?.district);
    const categoryKey = s(request.data?.category);
    const category = CATEGORY_MAP[categoryKey];

    if (!city) {
      throw new HttpsError("invalid-argument", "İl seçilmesi gerekiyor.");
    }
    if (!category) {
      throw new HttpsError("invalid-argument", "Geçersiz kategori.");
    }

    const result = await searchPlacesForCategory({
      city,
      district,
      categoryKey,
      category
    });
    const query = result.query;

    const [institutionSnap, draftSnap] = await Promise.all([
      db.collection("institutions").get(),
      db.collection("institutionDrafts").get()
    ]);

    const existingRows = [
      ...institutionSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _collection: "institutions"
      })),
      ...draftSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _collection: "institutionDrafts"
      }))
    ];

    return {
      query,
      queries: result.queries || [query],
      searchedTerms: (CATEGORY_SEARCH_TERMS[categoryKey] || [category.label]),
      places: (result.places || []).map((p) => {
        const candidate = {
          placeId: p.id || "",
          googlePlaceId: p.id || "",
          name: p.displayName?.text || "",
          address: p.formattedAddress || "",
          city,
          district
        };

        const duplicate = findDuplicate(candidate, existingRows);

        return {
          placeId: candidate.placeId,
          name: candidate.name,
          address: candidate.address,
          latitude: p.location?.latitude ?? null,
          longitude: p.location?.longitude ?? null,
          googleMapsUrl: p.googleMapsUri || "",
          businessStatus: p.businessStatus || "",
          googlePhotoName: p.photos?.[0]?.name || "",
          profileImageUrl: googlePhotoProxyUrl(p.photos?.[0]?.name || ""),
          alreadyExists: Boolean(duplicate),
          duplicateReason: duplicate?.reason || "",
          duplicateSource: duplicate?.row?._collection || ""
        };
      })
    };
  }
);

exports.importPlaceDrafts = onCall(
  {
    region: "europe-west1",
    secrets: [GOOGLE_PLACES_API_KEY],
    timeoutSeconds: 540,
    memory: "512MiB"
  },
  async (request) => {
    requireAdmin(request);

    const city = s(request.data?.city);
    const district = s(request.data?.district);
    const categoryKey = s(request.data?.category);
    const category = CATEGORY_MAP[categoryKey];
    const placeIds = Array.isArray(request.data?.placeIds)
      ? [...new Set(request.data.placeIds.map(s).filter(Boolean))]
      : [];

    if (!city) {
      throw new HttpsError("invalid-argument", "İl seçilmesi gerekiyor.");
    }
    if (!category) {
      throw new HttpsError("invalid-argument", "Geçersiz kategori.");
    }
    if (!placeIds.length) {
      throw new HttpsError("invalid-argument", "En az bir firma seçmelisin.");
    }
    const [institutionSnap, draftSnap] = await Promise.all([
      db.collection("institutions").get(),
      db.collection("institutionDrafts").get()
    ]);

    const existingRows = [
      ...institutionSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _collection: "institutions"
      })),
      ...draftSnap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
        _collection: "institutionDrafts"
      }))
    ];

    const created = [];
    const skipped = [];

    // Uygulama tarafında adet sınırı yok. Google Place detaylarını küçük gruplar
    // halinde paralel alarak yüksek sayıda seçimi daha hızlı işle.
    const detailRows = [];
    const DETAIL_CONCURRENCY = 10;

    for (let i = 0; i < placeIds.length; i += DETAIL_CONCURRENCY) {
      const chunk = placeIds.slice(i, i + DETAIL_CONCURRENCY);
      const chunkResults = await Promise.all(
        chunk.map(async (placeId) => ({
          placeId,
          place: await getPlaceDetails(placeId)
        }))
      );
      detailRows.push(...chunkResults);
    }

    // Tekrarlı firma kontrolü güvenilir kalsın diye kayıt aşamasını sırayla yap.
    for (const item of detailRows) {
      const placeId = item.placeId;
      const p = item.place;

      const candidate = {
        googlePlaceId: p.id || placeId,
        name: p.displayName?.text || "Firma",
        address: p.formattedAddress || "",
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
        city,
        district
      };

      const duplicate = findDuplicate(candidate, existingRows);

      if (duplicate) {
        skipped.push({
          placeId,
          name: candidate.name,
          reason: duplicate.reason,
          existingId: duplicate.row.id || "",
          collection: duplicate.row._collection || ""
        });
        continue;
      }

      const photoName = s(p.photos?.[0]?.name);
      const imageUrl = googlePhotoProxyUrl(photoName);

      const draft = {
        name: candidate.name,
        mainCategory: category.mainCategory,
        subCategory: category.subCategory,
        category: category.subCategory,
        city,
        district,
        address: candidate.address,
        phone: candidate.phone,
        website: p.websiteUri || "",
        latitude: p.location?.latitude ?? null,
        longitude: p.location?.longitude ?? null,
        mapUrl: p.googleMapsUri || "",
        googlePlaceId: p.id || placeId,
        googleTypes: Array.isArray(p.types) ? p.types : [],
        googleBusinessStatus: p.businessStatus || "",
        googlePhotoName: photoName,
        profileImageUrl: imageUrl,
        cardImageUrl: imageUrl,
        galleryUrls: imageUrl ? [imageUrl] : [],
        source: "google_places",
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const ref = await db.collection("institutionDrafts").add(draft);
      created.push({ id: ref.id, placeId, name: draft.name });
      existingRows.push({
        id: ref.id,
        ...draft,
        _collection: "institutionDrafts"
      });
    }

    return {
      created,
      skipped,
      createdCount: created.length,
      skippedCount: skipped.length
    };
  }
);

exports.backfillFirmPhotos = onCall(
  {
    region: "europe-west1",
    secrets: [GOOGLE_PLACES_API_KEY],
    timeoutSeconds: 120,
    memory: "512MiB"
  },
  async (request) => {
    requireAdmin(request);

    const collectionName = s(request.data?.collection || "institutions");
    if (!["institutions", "institutionDrafts"].includes(collectionName)) {
      throw new HttpsError("invalid-argument", "Geçersiz koleksiyon.");
    }

    const pageSize = Math.max(1, Math.min(50, Number(request.data?.limit || 25)));
    const afterId = s(request.data?.afterId);

    let query = db.collection(collectionName)
      .orderBy(FieldPath.documentId())
      .limit(pageSize);

    if (afterId) query = query.startAfter(afterId);

    const snap = await query.get();

    let scanned = 0;
    let updated = 0;
    let skipped = 0;
    let noPhoto = 0;
    let noPlaceId = 0;
    let errorCount = 0;

    for (const doc of snap.docs) {
      scanned++;
      const data = doc.data() || {};

      if (s(data.profileImageUrl || data.cardImageUrl)) {
        skipped++;
        continue;
      }

      let placeId = s(data.googlePlaceId || data.placeId);
      let placeIdRecovered = false;

      try {
        if (!placeId) {
          const found = await findPlaceForLegacyFirm({
            name: data.name,
            city: data.city,
            district: data.district,
            address: data.address
          });

          if (!found?.placeId) {
            noPlaceId++;
            continue;
          }

          placeId = found.placeId;
          placeIdRecovered = true;
        }

        const place = await getPlaceDetails(placeId);
        const photoName = s(place.photos?.[0]?.name);

        if (!photoName) {
          if (placeIdRecovered) {
            await doc.ref.set({
              googlePlaceId: placeId,
              updatedAt: FieldValue.serverTimestamp()
            }, { merge: true });
          }
          noPhoto++;
          continue;
        }

        const imageUrl = googlePhotoProxyUrl(photoName);
        await doc.ref.set({
          googlePlaceId: placeId,
          googlePhotoName: photoName,
          profileImageUrl: imageUrl,
          cardImageUrl: imageUrl,
          galleryUrls: Array.isArray(data.galleryUrls) && data.galleryUrls.length
            ? data.galleryUrls
            : [imageUrl],
          updatedAt: FieldValue.serverTimestamp()
        }, { merge: true });

        updated++;
      } catch (err) {
        console.error("Backfill photo error", collectionName, doc.id, err);
        errorCount++;
      }
    }

    const nextAfterId = snap.docs.length
      ? snap.docs[snap.docs.length - 1].id
      : "";

    return {
      collection: collectionName,
      scanned,
      updated,
      skipped,
      noPhoto,
      noPlaceId,
      errorCount,
      nextAfterId,
      done: snap.docs.length < pageSize
    };
  }
);

exports.listDraftFirms = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (request) => {
    requireAdmin(request);

    const snap = await db.collection("institutionDrafts").get();

    const drafts = snap.docs
      .map((d) => {
        const x = d.data() || {};
        return {
          id: d.id,
          name: formatFirmTitle(x.name),
          phone: s(x.phone),
          city: s(x.city),
          district: s(x.district),
          address: s(x.address),
          website: s(x.website),
          mapUrl: s(x.mapUrl),
          profileImageUrl: s(x.profileImageUrl || x.cardImageUrl),
          googlePhotoName: s(x.googlePhotoName),
          googlePlaceId: s(x.googlePlaceId),
          mainCategory: s(x.mainCategory),
          subCategory: s(x.subCategory),
          category: s(x.category),
          latitude: x.latitude ?? null,
          longitude: x.longitude ?? null,
          source: s(x.source),
          status: s(x.status || "draft")
        };
      })
      .sort((a, b) => a.name.localeCompare(b.name, "tr"));

    return { drafts, count: drafts.length };
  }
);

exports.updateDraftFirm = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (request) => {
    requireAdmin(request);

    const id = s(request.data?.id);
    if (!id) {
      throw new HttpsError("invalid-argument", "Taslak kimliği eksik.");
    }

    const ref = db.collection("institutionDrafts").doc(id);
    const snap = await ref.get();

    if (!snap.exists) {
      throw new HttpsError("not-found", "Taslak firma bulunamadı.");
    }

    const allowed = ["name", "phone", "city", "district", "address", "website"];
    const data = {};

    for (const key of allowed) {
      if (
        request.data?.data &&
        Object.prototype.hasOwnProperty.call(request.data.data, key)
      ) {
        data[key] = s(request.data.data[key]);
      }
    }

    data.updatedAt = FieldValue.serverTimestamp();
    await ref.set(data, { merge: true });

    return { ok: true };
  }
);

exports.deleteDraftFirm = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (request) => {
    requireAdmin(request);

    const id = s(request.data?.id);
    if (!id) {
      throw new HttpsError("invalid-argument", "Taslak kimliği eksik.");
    }

    await db.collection("institutionDrafts").doc(id).delete();

    return { ok: true };
  }
);

exports.publishDraftFirm = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 30,
    memory: "256MiB"
  },
  async (request) => {
    requireAdmin(request);

    const id = s(request.data?.id);
    if (!id) {
      throw new HttpsError("invalid-argument", "Taslak kimliği eksik.");
    }

    const draftRef = db.collection("institutionDrafts").doc(id);
    const snap = await draftRef.get();

    if (!snap.exists) {
      throw new HttpsError("not-found", "Taslak firma bulunamadı.");
    }

    const data = snap.data() || {};
    const institutionSnap = await db.collection("institutions").get();
    const existingRows = institutionSnap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    const duplicate = findDuplicate(
      {
        googlePlaceId: data.googlePlaceId,
        name: data.name,
        phone: data.phone,
        address: data.address,
        city: data.city
      },
      existingRows
    );

    if (duplicate) {
      throw new HttpsError(
        "already-exists",
        "Bu firma normal firma listesinde zaten bulunuyor."
      );
    }

    const publishData = {
      ...data,
      status: "active",
      publishedAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp()
    };

    const ref = await db.collection("institutions").add(publishData);
    await draftRef.delete();

    return { ok: true, id: ref.id };
  }
);

exports.publishDraftFirmsBatch = onCall(
  {
    region: "europe-west1",
    timeoutSeconds: 540,
    memory: "512MiB"
  },
  async (request) => {
    requireAdmin(request);

    const ids = Array.isArray(request.data?.ids)
      ? [...new Set(request.data.ids.map(s).filter(Boolean))]
      : [];

    if (!ids.length) {
      throw new HttpsError("invalid-argument", "En az bir taslak seçmelisin.");
    }

    const institutionSnap = await db.collection("institutions").get();
    const existingRows = institutionSnap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    const published = [];
    const skipped = [];

    // Kullanıcı istediği kadar taslak seçebilir.
    // Firestore yazma limitlerine takılmamak için içeride küçük gruplar halinde yayınlıyoruz.
    // Her firma için 2 yazma işlemi var: institutions'a ekle + institutionDrafts'tan sil.
    const CHUNK_SIZE = 200;

    for (let startIndex = 0; startIndex < ids.length; startIndex += CHUNK_SIZE) {
      const chunkIds = ids.slice(startIndex, startIndex + CHUNK_SIZE);
      const draftRefs = chunkIds.map((id) =>
        db.collection("institutionDrafts").doc(id)
      );

      const draftSnaps = await db.getAll(...draftRefs);
      const batch = db.batch();

      for (const snap of draftSnaps) {
        const id = snap.id;

        if (!snap.exists) {
          skipped.push({ id, reason: "not_found" });
          continue;
        }

        const data = snap.data() || {};

        const duplicate = findDuplicate(
          {
            googlePlaceId: data.googlePlaceId,
            name: data.name,
            phone: data.phone,
            address: data.address,
            city: data.city
          },
          existingRows
        );

        if (duplicate) {
          skipped.push({
            id,
            reason: "duplicate",
            existingId: duplicate.row.id || ""
          });
          continue;
        }

        const publishData = {
          ...data,
          status: "active",
          publishedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp()
        };

        const newRef = db.collection("institutions").doc();

        batch.set(newRef, publishData);
        batch.delete(snap.ref);

        published.push({
          id,
          newId: newRef.id,
          name: data.name || ""
        });

        existingRows.push({
          id: newRef.id,
          ...publishData
        });
      }

      await batch.commit();
    }

    return {
      ok: true,
      published,
      skipped,
      publishedCount: published.length,
      skippedCount: skipped.length
    };
  }
);
