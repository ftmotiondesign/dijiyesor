const { onCall, onRequest, HttpsError } = require("firebase-functions/v2/https");
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

function s(v) {
  return String(v || "").trim();
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

      const mediaResponse = await fetch(
        "https://places.googleapis.com/v1/" +
          name +
          "/media?maxWidthPx=900&maxHeightPx=900&skipHttpRedirect=true",
        {
          headers: {
            "X-Goog-Api-Key": GOOGLE_PLACES_API_KEY.value()
          }
        }
      );

      if (!mediaResponse.ok) {
        response.status(404).send("Fotoğraf bulunamadı.");
        return;
      }

      const data = await mediaResponse.json();
      const photoUri = s(data.photoUri);
      if (!/^https:\/\//i.test(photoUri)) {
        response.status(404).send("Fotoğraf bulunamadı.");
        return;
      }

      response.set("Cache-Control", "public, max-age=86400");
      response.redirect(302, photoUri);
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

    const query = [district, city, category.label].filter(Boolean).join(" ");
    const result = await placesTextSearch(query);

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
    timeoutSeconds: 120,
    memory: "256MiB"
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
    if (placeIds.length > 20) {
      throw new HttpsError("invalid-argument", "Tek seferde en fazla 20 firma aktarılabilir.");
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

    for (const placeId of placeIds) {
      const p = await getPlaceDetails(placeId);

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
        googlePhotoName: p.photos?.[0]?.name || "",
        profileImageUrl: googlePhotoProxyUrl(p.photos?.[0]?.name || ""),
        cardImageUrl: googlePhotoProxyUrl(p.photos?.[0]?.name || ""),
        galleryUrls: p.photos?.[0]?.name ? [googlePhotoProxyUrl(p.photos[0].name)] : [],
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
          name: s(x.name),
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
    timeoutSeconds: 300,
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
    if (ids.length > 200) {
      throw new HttpsError("invalid-argument", "Tek seferde en fazla 200 taslak yayınlanabilir.");
    }

    const draftRefs = ids.map((id) =>
      db.collection("institutionDrafts").doc(id)
    );

    const draftSnaps = await db.getAll(...draftRefs);
    const institutionSnap = await db.collection("institutions").get();
    const existingRows = institutionSnap.docs.map((d) => ({
      id: d.id,
      ...d.data()
    }));

    const batch = db.batch();
    const published = [];
    const skipped = [];

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
          name: s(data.name)
        });
        continue;
      }

      const newRef = db.collection("institutions").doc();
      const publishData = {
        ...data,
        status: "active",
        publishedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp()
      };

      batch.set(newRef, publishData);
      batch.delete(snap.ref);

      existingRows.push({
        id: newRef.id,
        ...data,
        status: "active"
      });

      published.push({
        id: newRef.id,
        draftId: id,
        name: s(data.name)
      });
    }

    if (published.length) {
      await batch.commit();
    }

    return {
      published,
      skipped,
      publishedCount: published.length,
      skippedCount: skipped.length
    };
  }
);
