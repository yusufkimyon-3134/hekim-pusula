# Hekim Pusula — Veritabanı Şeması (taslak)

> Bu şema **henüz uygulanmamıştır** (Sprint 1 kapsamı yalnızca proje iskeletidir). Sprint 2'de Supabase migration'ı olarak yazılması önerilir. Aşağıdaki alan tipleri Postgres/Supabase varsayılarak yazılmıştır.

## Genel ilişki özeti

- Bir **kullanıcı**, birden fazla **kurum bağlantısına** sahip olabilir (çalıştığı/çalışmış olduğu kurumlar).
- Bir **kurum**, birden fazla **klinik** (branş) içerebilir.
- Bir **yorum**, bir kurum ve isteğe bağlı bir klinikle ilişkilidir, bir kullanıcı tarafından yazılır ve bir puanlama kaydına sahiptir.
- Bir **iletişim talebi**, bir gönderen ve alıcı kullanıcı arasında, belirli bir kurum bağlamında oluşur ve mesajlar içerir.

## Tablolar

### `kullanicilar`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | Supabase `auth.users.id` ile eşleşir |
| unvan | enum: pratisyen, uzman, yandal, asistan | |
| brans | text | |
| atama_turu | enum: dhy, ilk_yeniden, naklen, yandal, belirtilmedi | Kayıt sırasında seçilir |
| dogrulanmis | boolean | Hekim kimliği onaylandı mı |
| katki_sayisi | integer | Ver-gör kilidi için sayaç |
| created_at | timestamptz | |

### `dogrulama_belgeleri`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| kullanici_id | uuid (fk → kullanicilar) | |
| tur | enum: diploma, ttb_no | |
| belge_url | text | Şifreli/private storage path, herkese açık değil |
| onay_durumu | enum: bekliyor, onaylandi, reddedildi | |
| created_at | timestamptz | |

### `kurumlar`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| ad | text | |
| il | text | |
| ilce | text | |
| created_at | timestamptz | |

### `klinikler`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| kurum_id | uuid (fk → kurumlar) | |
| brans | text | |

### `kurum_baglantilari`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| kullanici_id | uuid (fk → kullanicilar) | |
| kurum_id | uuid (fk → kurumlar) | |
| baslangic_tarihi | date | |
| bitis_tarihi | date, null olabilir | Boşsa "aktif çalışıyor" |
| durum | enum: aktif, onceden_calisti | `bitis_tarihi`'ne göre türetilir |
| belge_url | text | SGK hizmet dökümü, private storage |
| onay_durumu | enum: bekliyor, onaylandi, reddedildi | |
| son_teyit_tarihi | timestamptz | 60 günlük periyodik "hâlâ aktif misin" teyidi için |

### `yorumlar`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| kullanici_id | uuid (fk → kullanicilar) | |
| kurum_id | uuid (fk → kurumlar) | |
| klinik_id | uuid (fk → klinikler), null olabilir | |
| metin | text | |
| atama_turu_etiketi | text | Yorum anındaki `atama_turu` kopyalanır (kullanıcı sonradan değiştirse bile yorum geçmişi tutarlı kalır) |
| created_at | timestamptz | |

### `puanlamalar`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| yorum_id | uuid (fk → yorumlar, 1-1) | |
| nobet_yuku | integer (0-100) | |
| yonetim_tutumu | integer (0-100) | |
| ulasim_zorlugu | integer (0-100) | |
| sosyal_imkan_kisiti | integer (0-100) | |
| is_yuku | integer (0-100) | |

### `iletisim_talepleri`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| gonderen_id | uuid (fk → kullanicilar) | |
| alici_id | uuid (fk → kullanicilar) | Rastgele (ağırlıklı) seçilen aktif hekim |
| kurum_id | uuid (fk → kurumlar) | |
| durum | enum: bekliyor, kabul, red, suresi_doldu | |
| created_at | timestamptz | |
| yanit_son_tarih | timestamptz | `created_at + 7 gün` |

### `mesajlar`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| talep_id | uuid (fk → iletisim_talepleri) | |
| gonderen_id | uuid (fk → kullanicilar) | |
| metin | text | |
| created_at | timestamptz | |

### `sikayetler`
| Alan | Tip | Açıklama |
|---|---|---|
| id | uuid (pk) | |
| yorum_id | uuid (fk → yorumlar) | |
| bildiren_id | uuid (fk → kullanicilar) | |
| gerekce | text | |
| durum | enum: inceleniyor, kaldirildi, reddedildi | |
| created_at | timestamptz | |

## Güvenlik notları (Sprint 2+ için)

- Tüm tablolarda **Supabase Row Level Security (RLS)** açık olmalı.
- `dogrulama_belgeleri.belge_url` ve `kurum_baglantilari.belge_url` yalnızca ilgili kullanıcı ve moderatör rolü tarafından okunabilmeli — herkese açık storage bucket'ında **olmamalı**.
- `kullanicilar` tablosunda isim/TC gibi kimlik bilgisi **tutulmamalı**; kimlik doğrulama Supabase Auth (e-posta) üzerinden, gerçek ad/soyad hiçbir tabloya yazılmamalı.
