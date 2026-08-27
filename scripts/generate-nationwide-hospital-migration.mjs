import fs from "node:fs";
import path from "node:path";

const sourceDir = process.argv[2];
const outputFile = process.argv[3];
if (!sourceDir || !outputFile) throw new Error("usage: node script source-dir output-file");

const cities = [
  "Adana","Adıyaman","Afyonkarahisar","Ağrı","Amasya","Ankara","Antalya","Artvin","Aydın","Balıkesir",
  "Bilecik","Bingöl","Bitlis","Bolu","Burdur","Bursa","Çanakkale","Çankırı","Çorum","Denizli","Diyarbakır",
  "Edirne","Elazığ","Erzincan","Erzurum","Eskişehir","Gaziantep","Giresun","Gümüşhane","Hakkâri","Hatay",
  "Isparta","Mersin","İstanbul","İzmir","Kars","Kastamonu","Kayseri","Kırklareli","Kırşehir","Kocaeli",
  "Konya","Kütahya","Malatya","Manisa","Kahramanmaraş","Mardin","Muğla","Muş","Nevşehir","Niğde","Ordu",
  "Rize","Sakarya","Samsun","Siirt","Sinop","Sivas","Tekirdağ","Tokat","Trabzon","Tunceli","Şanlıurfa",
  "Uşak","Van","Yozgat","Zonguldak","Aksaray","Bayburt","Karaman","Kırıkkale","Batman","Şırnak","Bartın",
  "Ardahan","Iğdır","Yalova","Karabük","Kilis","Osmaniye","Düzce"
];

const title = (value) => value
  .toLocaleLowerCase("tr-TR")
  .replace(/(^|[\s('/-])([a-zçğıöşü])/gu, (_, p, c) => p + c.toLocaleUpperCase("tr-TR"));
const clean = (value) => value.replace(/\s+/g, " ").replace(/Dr\.(?=\p{L})/gu, "Dr. ").trim();
const sql = (value) => `'${value.replaceAll("'", "''")}'`;

const hospitals = [];
for (let plate = 1; plate <= 81; plate += 1) {
  const file = path.join(sourceDir, `${String(plate).padStart(2, "0")}.json`);
  const buffer = fs.readFileSync(file);
  let raw = buffer.toString("utf8").trim();
  if (raw.includes("�")) raw = new TextDecoder("windows-1254").decode(buffer).trim();
  if (raw.startsWith('[{\\"')) raw = raw.replaceAll('\\"', '"');
  let records;
  try {
    records = JSON.parse(raw);
  } catch {
    // Üç eski kaynak dosyası Windows-1254 kodlamalı ve anahtar ayraçları bozuk.
    // Kurum alanlarını düzenli kayıt bloklarından güvenli biçimde geri kazan.
    raw = new TextDecoder("windows-1254").decode(buffer);
    records = [...raw.matchAll(/entity\{.*?,ad(.+?),yerelAdi.*?,turAdi(.+?),turKodu.*?,il\{.*?,ad(.+?)\},ilce\{.*?,ad(.+?)\}/gu)]
      .map((match) => ({ entity: { ad: match[1], turAdi: match[2], il: { ad: match[3] }, ilce: { ad: match[4] } } }));
    if (records.length === 0) throw new Error(`Could not recover ${file}`);
  }
  for (const { entity } of records) {
    const kind = clean(entity.turAdi ?? "").toLocaleUpperCase("tr-TR");
    if (!kind.includes("HASTANE") && kind !== "ENTEGRE") continue;
    if (kind.includes("AĞIZ") || kind.includes("DİŞ")) continue;
    const name = clean(entity.ad);
    const district = entity.ilce?.ad === "MERKEZ" ? "Merkez" : title(clean(entity.ilce?.ad ?? "Merkez"));
    const upperName = name.toLocaleUpperCase("tr-TR");
    const hospitalType = upperName.includes("ŞEHİR HASTANESİ") ? "city_hospital"
      : upperName.includes("ÜNİVERSİTE") || kind.includes("ÜNİVERSİTE") ? "university_hospital"
      : kind.includes("EĞİTİM") || upperName.includes("EĞİTİM VE ARAŞTIRMA") ? "training_and_research_hospital"
      : "state_hospital";
    hospitals.push({ name, city: cities[plate - 1], district, hospitalType });
  }
}

const unique = [...new Map(hospitals.map((h) => [`${h.name}|${h.city}|${h.district}`, h])).values()]
  .sort((a, b) => a.city.localeCompare(b.city, "tr-TR") || a.district.localeCompare(b.district, "tr-TR") || a.name.localeCompare(b.name, "tr-TR"));
const covered = new Set(unique.map((h) => h.city));
if (covered.size !== 81) throw new Error(`Expected 81 cities, got ${covered.size}`);
const citiesWithNewerProjectCatalogs = new Set([
  "Adıyaman","Ankara","Artvin","Bilecik","Hakkâri","Hatay","İstanbul","Sivas","Şırnak"
]);

const branches = [
  "Pratisyen Hekim Görevi","Acil Tıp","Adli Tıp","Aile Hekimliği","Anesteziyoloji ve Reanimasyon",
  "Beyin ve Sinir Cerrahisi","Çocuk Cerrahisi","Çocuk Sağlığı ve Hastalıkları","Çocuk ve Ergen Ruh Sağlığı ve Hastalıkları",
  "Çocuk Alerji ve İmmünoloji","Çocuk Endokrinolojisi","Çocuk Enfeksiyon Hastalıkları","Çocuk Gastroenterolojisi",
  "Çocuk Göğüs Hastalıkları","Çocuk Hematolojisi ve Onkolojisi","Çocuk Kardiyolojisi","Çocuk Nefrolojisi",
  "Çocuk Nörolojisi","Çocuk Romatolojisi","Çocuk Yoğun Bakım","Deri ve Zührevi Hastalıkları",
  "Endokrinoloji ve Metabolizma Hastalıkları","Enfeksiyon Hastalıkları ve Klinik Mikrobiyoloji",
  "Fiziksel Tıp ve Rehabilitasyon","Gastroenteroloji","Genel Cerrahi","Geriatri","Göğüs Cerrahisi",
  "Göğüs Hastalıkları","Göz Hastalıkları","Halk Sağlığı","Hematoloji","İç Hastalıkları",
  "Jinekolojik Onkoloji Cerrahisi","Kadın Hastalıkları ve Doğum","Kalp ve Damar Cerrahisi","Kardiyoloji",
  "Kulak Burun Boğaz Hastalıkları","Nefroloji","Neonatoloji","Nöroloji","Nükleer Tıp",
  "Ortopedi ve Travmatoloji","Perinatoloji","Plastik, Rekonstrüktif ve Estetik Cerrahi","Psikiyatri",
  "Radyasyon Onkolojisi","Radyoloji","Romatoloji","Tıbbi Biyokimya","Tıbbi Genetik","Tıbbi Mikrobiyoloji",
  "Tıbbi Onkoloji","Tıbbi Patoloji","Üroloji","Yoğun Bakım"
];

const values = unique
  .filter((h) => !citiesWithNewerProjectCatalogs.has(h.city))
  .map((h) => `    (${sql(h.name)}, ${sql(h.city)}, ${sql(h.district)}, ${sql(h.hospitalType)})`)
  .join(",\n");
const branchValues = branches.map((b) => `    (${sql(b)})`).join(",\n");
let migration = `-- Türkiye'nin 81 ilindeki kamu hastaneleri için ülke geneli başlangıç kataloğu.\n-- Kaynak taban: MHRS kamu sağlık tesisi verisi; projedeki daha yeni il kayıtları korunur.\n-- Ağız ve diş sağlığı merkezleri bu tıp kliniği kataloğuna dahil değildir.\n-- Standart klinik şablonu, projedeki mevcut il ekleme migrasyonlarıyla aynıdır.\n-- İdempotenttir; aynı kurum/klinik ikinci kez eklenmez.\n\nwith hospital_seed(name, city, district, hospital_type) as (\n  values\n${values}\n)\ninsert into public.hospitals (name, city, district, hospital_type)\nselect name, city, district, hospital_type::public.hospital_type\nfrom hospital_seed s\nwhere not exists (\n  select 1 from public.hospitals h\n  where lower(h.name)=lower(s.name) and h.city=s.city and h.district=s.district\n);\n\nwith hospital_seed(name, city, district) as (\n  values\n${unique.map((h) => `    (${sql(h.name)}, ${sql(h.city)}, ${sql(h.district)})`).join(",\n")}\n), branch_seed(branch) as (\n  values\n${branchValues}\n), target_hospitals as (\n  select distinct h.id\n  from public.hospitals h\n  join hospital_seed s\n    on lower(h.name)=lower(s.name) and h.city=s.city and h.district=s.district\n)\ninsert into public.clinics (hospital_id, branch)\nselect th.id, bs.branch\nfrom target_hospitals th cross join branch_seed bs\nwhere not exists (\n  select 1 from public.clinics c\n  where c.hospital_id=th.id and c.branch=bs.branch\n);\n`;

migration = migration.replace(
  "  select distinct h.id\n  from public.hospitals h\n  join hospital_seed s\n    on lower(h.name)=lower(s.name) and h.city=s.city and h.district=s.district",
  "  select id from public.hospitals"
);
fs.writeFileSync(outputFile, migration);
console.log(JSON.stringify({ hospitals: unique.length, cities: covered.size, branches: branches.length, outputFile }));
