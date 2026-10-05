const { onCall, HttpsError } = require("firebase-functions/v2/https");
const { defineSecret } = require("firebase-functions/params");
const { initializeApp } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");

initializeApp();

const db = getFirestore();
const GOOGLE_PLACES_API_KEY = defineSecret("GOOGLE_PLACES_API_KEY");
const ADMIN_EMAIL = "ftmotiondesign@gmail.com";

const CATEGORY_MAP = {
  surucu: { label: "Sürücü Kursu", mainCategory: "egitim", subCategory: "surucu" },
  kres: { label: "Kreş Anaokulu", mainCategory: "egitim", subCategory: "kres" },
  dershane: { label: "Dershane Kurs Merkezi", mainCategory: "egitim", subCategory: "dershane" },
  yurt: { label: "Öğrenci Yurdu", mainCategory: "egitim", subCategory: "yurt" },
  oto_servis: { label: "Oto Servis", mainCategory: "otomotiv", subCategory: "oto_servis" },
  restoran: { label: "Restoran", mainCategory: "yemeicme", subCategory: "restoran" },
  dis_klinigi: { label: "Diş Kliniği", mainCategory: "saglikguzellik", subCategory: "dis_klinigi" },
  emlak_ofisi: { label: "Emlak Ofisi", mainCategory: "emlak", subCategory: "emlak_ofisi" },
  otel: { label: "Otel Konaklama", mainCategory: "turizm", subCategory: "otel" }
};

function requireAdmin(request) {
  const email = String(request.auth?.token?.email || "").toLowerCase();
  if (!request.auth || email !== ADMIN_EMAIL) {
    throw new HttpsError("permission-denied", "Bu işlem yalnızca DijiyeSor yöneticisi içindir.");
  }
}

function s(v) { return String(v || "").trim(); }

async function placesTextSearch(query) {
  const response = await fetch("https://places.googleapis.com/v1/places:searchText", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY.value(),
      "X-Goog-FieldMask":
        "places.id,places.displayName,places.formattedAddress,places.location,places.googleMapsUri,places.businessStatus"
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
  try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}

  if (!response.ok) {
    console.error("Places error", response.status, raw);
    throw new HttpsError("internal", data?.error?.message || "Google Places araması başarısız oldu.");
  }
  return data;
}

async function getPlaceDetails(placeId) {
  const fields = [
    "id","displayName","formattedAddress","location",
    "nationalPhoneNumber","internationalPhoneNumber",
    "websiteUri","googleMapsUri","businessStatus","types"
  ].join(",");

  const response = await fetch(
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?languageCode=tr&regionCode=TR`,
    {
      headers: {
        "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY.value(),
        "X-Goog-FieldMask": fields
      }
    }
  );

  const raw = await response.text();
  let data = {};
  try { data = raw ? JSON.parse(raw) : {}; } catch (_) {}

  if (!response.ok) {
    console.error("Place Details error", response.status, raw);
    throw new HttpsError("internal", data?.error?.message || "Firma detayları alınamadı.");
  }
  return data;
}

exports.searchPlaces = onCall(
  { region: "europe-west1", secrets: [GOOGLE_PLACES_API_KEY], timeoutSeconds: 30, memory: "256MiB" },
  async (request) => {
    requireAdmin(request);

    const city = s(request.data?.city);
    const district = s(request.data?.district);
    const categoryKey = s(request.data?.category);
    const category = CATEGORY_MAP[categoryKey];

    if (!city) throw new HttpsError("invalid-argument", "İl seçilmesi gerekiyor.");
    if (!category) throw new HttpsError("invalid-argument", "Geçersiz kategori.");

    const query = [district, city, category.label].filter(Boolean).join(" ");
    const result = await placesTextSearch(query);
    const placeIds = (result.places || []).map(p => p.id).filter(Boolean);

    let existingIds = new Set();
    if (placeIds.length) {
      const snap = await db.collection("institutions")
        .where("googlePlaceId", "in", placeIds.slice(0, 30)).get();
      existingIds = new Set(snap.docs.map(d => s(d.data()?.googlePlaceId)).filter(Boolean));
    }

    return {
      query,
      places: (result.places || []).map(p => ({
        placeId: p.id || "",
        name: p.displayName?.text || "",
        address: p.formattedAddress || "",
        latitude: p.location?.latitude ?? null,
        longitude: p.location?.longitude ?? null,
        googleMapsUrl: p.googleMapsUri || "",
        businessStatus: p.businessStatus || "",
        alreadyExists: existingIds.has(p.id)
      }))
    };
  }
);

exports.importPlaceDrafts = onCall(
  { region: "europe-west1", secrets: [GOOGLE_PLACES_API_KEY], timeoutSeconds: 120, memory: "256MiB" },
  async (request) => {
    requireAdmin(request);

    const city = s(request.data?.city);
    const district = s(request.data?.district);
    const categoryKey = s(request.data?.category);
    const category = CATEGORY_MAP[categoryKey];
    const placeIds = Array.isArray(request.data?.placeIds)
      ? [...new Set(request.data.placeIds.map(s).filter(Boolean))]
      : [];

    if (!city) throw new HttpsError("invalid-argument", "İl seçilmesi gerekiyor.");
    if (!category) throw new HttpsError("invalid-argument", "Geçersiz kategori.");
    if (!placeIds.length) throw new HttpsError("invalid-argument", "En az bir firma seçmelisin.");
    if (placeIds.length > 20) throw new HttpsError("invalid-argument", "Tek seferde en fazla 20 firma aktarılabilir.");

    const created = [];
    const skipped = [];

    for (const placeId of placeIds) {
      const existing = await db.collection("institutions").where("googlePlaceId", "==", placeId).limit(1).get();
      const draftExisting = await db.collection("institutionDrafts").where("googlePlaceId", "==", placeId).limit(1).get();

      if (!existing.empty || !draftExisting.empty) {
        skipped.push(placeId);
        continue;
      }

      const p = await getPlaceDetails(placeId);

      const draft = {
        name: p.displayName?.text || "Firma",
        mainCategory: category.mainCategory,
        subCategory: category.subCategory,
        category: category.subCategory,
        city,
        district,
        address: p.formattedAddress || "",
        phone: p.nationalPhoneNumber || p.internationalPhoneNumber || "",
        website: p.websiteUri || "",
        latitude: p.location?.latitude ?? null,
        longitude: p.location?.longitude ?? null,
        mapUrl: p.googleMapsUri || "",
        googlePlaceId: p.id || placeId,
        googleTypes: Array.isArray(p.types) ? p.types : [],
        googleBusinessStatus: p.businessStatus || "",
        source: "google_places",
        status: "draft",
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      const ref = await db.collection("institutionDrafts").add(draft);
      created.push({ id: ref.id, placeId, name: draft.name });
    }

    return {
      created,
      skipped,
      createdCount: created.length,
      skippedCount: skipped.length
    };
  }
);
