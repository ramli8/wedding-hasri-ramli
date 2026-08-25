-- ============================================================
-- Invitation seeder — data dummy lengkap (idempotent)
-- Sumber nilai: frontend/src/domain/services/invitation-static-data.ts
-- Semua URL gambar merujuk file yang sudah ada di frontend/public/images/
-- Aman dijalankan berulang (WHERE NOT EXISTS / ON CONFLICT DO NOTHING).
-- ============================================================

-- ---------- Weddings (singleton id=1) ----------
INSERT INTO weddings (id, groom_name, bride_name, wedding_date, content, gift_shipping_address)
VALUES (
    1,
    'Ramli',
    'Hasri',
    '2026-12-12T20:00:00+07:00',
    $json${
        "cover": {
            "image_desktop": "/images/cover-1.png",
            "image_tablet": "/images/cover-3.png",
            "image_mobile": "/images/cover-5.png",
            "button_text": "Buka Undangan",
            "save_the_date_label": null,
            "guest_greeting_label": null
        },
        "music": { "file_url": "/audio/musik-undangan.mp3" },
        "opening": {
            "salam": "Assalamu''alaikum Warahmatullahi Wabarakatuh",
            "eyebrow": "Firman Allah",
            "arabic": "وَمِنْ ءَايَـٰتِهِۦٓ أَنْ خَلَقَ لَكُم مِّنْ أَنفُسِكُمْ أَزْوَٰجًا لِّتَسْكُنُوٓا۟ إِلَيْهَا وَجَعَلَ بَيْنَكُم مَّوَدَّةً وَرَحْمَةً ۚ إِنَّ فِى ذَٰلِكَ لَـَٔايَـٰتٍ لِّقَوْمٍ يَتَفَكَّرُونَ",
            "translation": "Dan di antara tanda-tanda (kebesaran)-Nya ialah Dia menciptakan pasangan-pasangan untukmu dari jenismu sendiri, agar kamu cenderung dan merasa tenteram kepadanya, dan Dia menjadikan di antaramu rasa kasih dan sayang. Sungguh, pada yang demikian itu benar-benar terdapat tanda-tanda (kebesaran Allah) bagi kaum yang berpikir.",
            "source": "Ar Rum: 21",
            "greeting": "Dengan memohon rahmat dan ridho Allah SWT, tanpa mengurangi rasa hormat, kami mengundang Bapak/Ibu/Saudara/i untuk hadir di acara pernikahan kami."
        }
    }$json$::jsonb,
    'Jl. Contoh Alamat No. 123, Kelurahan Sukamaju, Kota, 12345 — a/n Keluarga Ramli'
)
ON CONFLICT (id) DO NOTHING;

-- Lengkapi kunci konten yang belum ada (tanpa menimpa edit admin)
UPDATE weddings SET content = COALESCE(content, '{}'::jsonb) || $json${
    "dress_code": {
        "description": "Kami akan berbahagia jika Anda hadir dengan nuansa warna netral earth tone.",
        "color_palette": ["#4a3b3b", "#2f3e4e", "#5b6151", "#232c3d", "#7a6a54"],
        "image_url": null
    },
    "livestream": { "platform": null, "url": null, "datetime": null, "notes": null },
    "footer": {
        "thank_you_message": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
        "made_by_credit": "Hasri & Ramli — 2026",
        "social_links": []
    }
}$json$::jsonb
WHERE id = 1
  AND NOT (COALESCE(content, '{}'::jsonb) ? 'dress_code');

UPDATE weddings SET content = COALESCE(content, '{}'::jsonb) || $json${
    "livestream": { "platform": null, "url": null, "datetime": null, "notes": null },
    "footer": {
        "thank_you_message": "Merupakan suatu kehormatan dan kebahagiaan bagi kami apabila Bapak/Ibu/Saudara/i berkenan hadir dan memberikan doa restu.",
        "made_by_credit": "Hasri & Ramli — 2026",
        "social_links": []
    }
}$json$::jsonb
WHERE id = 1
  AND NOT (COALESCE(content, '{}'::jsonb) ? 'footer');

-- Musik latar bila belum ada
UPDATE weddings SET content = jsonb_set(COALESCE(content, '{}'::jsonb), '{music,file_url}', '"/audio/musik-undangan.mp3"'::jsonb)
WHERE id = 1
  AND NOT COALESCE(jsonb_typeof(content->'music'->'file_url') = 'string', false);

-- Sapaan di atas nama tamu pada cover bila belum diisi admin
UPDATE weddings SET content = jsonb_set(COALESCE(content, '{}'::jsonb), '{cover,guest_greeting_label}', '"Kepada Yth."'::jsonb)
WHERE id = 1
  AND COALESCE(content->'cover'->>'guest_greeting_label', '') = '';

-- ---------- Mempelai ----------
INSERT INTO wedding_couples (side, full_name, gelar, photo_url)
VALUES
    ('wanita', 'Hasri', 'Putri dari Bpk. Ahmad & Ibu Siti', '/images/cover-2.png'),
    ('pria',   'Ramli', 'Putra dari Bpk. Hasan & Ibu Maryam', '/images/cover-3.png')
ON CONFLICT (side) DO NOTHING;

UPDATE wedding_couples SET gelar = 'Putri dari Bpk. Ahmad & Ibu Siti'
WHERE side = 'wanita' AND gelar IS NULL;
UPDATE wedding_couples SET gelar = 'Putra dari Bpk. Hasan & Ibu Maryam'
WHERE side = 'pria' AND gelar IS NULL;

-- ---------- Acara ----------
INSERT INTO wedding_events (name, event_date, start_time, venue_name, address_full, gmaps_url, notes, is_main_event, order_index)
SELECT 'Akad Nikah', '2026-12-11T08:00:00+07:00', '2026-12-11T08:00:00+07:00',
       'Ballroom Nama Venue', 'Jl. Contoh Alamat No. 123, Kota',
       'https://maps.google.com/?q=Ballroom+Nama+Venue',
       'Kehadiran hanya untuk keluarga dan kerabat terdekat.',
       FALSE, 1
WHERE NOT EXISTS (SELECT 1 FROM wedding_events WHERE lower(name) = lower('Akad Nikah'));

INSERT INTO wedding_events (name, event_date, start_time, venue_name, address_full, gmaps_url, notes, is_main_event, order_index)
SELECT 'Resepsi', '2026-12-12T11:00:00+07:00', '2026-12-12T11:00:00+07:00',
       'Ballroom Nama Venue', 'Jl. Contoh Alamat No. 123, Kota',
       'https://maps.google.com/?q=Ballroom+Nama+Venue',
       'Resepsi dilanjutkan hingga pukul 14.00 WITA.',
       TRUE, 2
WHERE NOT EXISTS (SELECT 1 FROM wedding_events WHERE lower(name) = lower('Resepsi'));

-- ---------- Kisah ----------
INSERT INTO wedding_story_events (event_date, title, description, detail, image_url, order_index)
SELECT '2013', 'Awal Bertemu',
       'Kami pertama kali dipertemukan di sebuah kejadian sederhana yang tidak pernah kami duga akan menjadi awal dari segalanya.',
       E'Dipertemukan di sebuah acara sederhana yang saat itu tidak kami anggap istimewa, kami sama sekali tidak menyangka bahwa pertemuan itu akan menjadi awal dari segalanya.\n\nSebuah obrolan singkat di sore hari ternyata menjadi pintu dari ribuan percakapan lain setelahnya — dari hal-hal ringan, tawa kecil, sampai cerita tentang rencana hidup masing-masing.\n\nTahun itu kami hanya saling mengenal sebagai teman. Namun waktu membuktikan bahwa benih yang ditanam dengan sederhana bisa tumbuh menjadi sesuatu yang besar.',
       '/images/cover-2.png', 1
WHERE NOT EXISTS (SELECT 1 FROM wedding_story_events WHERE title = 'Awal Bertemu');

INSERT INTO wedding_story_events (event_date, title, description, detail, image_url, order_index)
SELECT '2019', 'Menjalin Komitmen',
       'Tahun demi tahun kami lalui bersama, saling mengenal lebih dalam, hingga akhirnya memutuskan untuk berjalan ke arah yang sama.',
       E'Tahun demi tahun kami lalui bersama — melengkapi satu sama lain, menumbuhkan yang baik, dan terkadang saling menegur demi kebaikan.\n\nDi masa inilah kami belajar bahwa hubungan bukan tentang kesempurnaan, melainkan tentang dua orang yang memilih untuk tetap bertahan dan berjalan ke arah yang sama.\n\nPerlahan kedua keluarga kami mulai saling mengenal. Doa-doa baik pun diucapkan dari banyak pihak yang menyaksikan perjalanan kami.',
       '/images/cover-3.png', 2
WHERE NOT EXISTS (SELECT 1 FROM wedding_story_events WHERE title = 'Menjalin Komitmen');

INSERT INTO wedding_story_events (event_date, title, description, detail, image_url, order_index)
SELECT '2026', 'Lamaran & Selamanya',
       'Dengan restu kedua keluarga, kami sepakat mengikat janji suci untuk membangun keluarga yang sakinah, mawaddah, warahmah.',
       E'Dengan restu kedua keluarga, sebuah lamaran sederhana diucapkan — dan dijawab dengan bahagia.\n\nKini kami mempersiapkan babak baru dalam hidup: mengikat janji suci, membangun rumah yang penuh canda dan doa, serta keluarga yang sakinah, mawaddah, warahmah.\n\nDan tak ada hal yang lebih membahagiakan bagi kami selain Anda turut hadir menjadi bagian dari hari paling berharga dalam perjalanan ini.',
       '/images/cover-4.png', 3
WHERE NOT EXISTS (SELECT 1 FROM wedding_story_events WHERE title = 'Lamaran & Selamanya');

-- ---------- Galeri (12 foto) ----------
INSERT INTO wedding_gallery_items (image_url, caption, order_index)
SELECT v.image_url, v.caption, v.ord
FROM (VALUES
    ('/images/cover-1.png', NULL::varchar, 1),
    ('/images/gallery-a.jpg', NULL, 2),
    ('/images/gallery-b.jpg', NULL, 3),
    ('/images/gallery-c.jpg', NULL, 4),
    ('/images/cover-3.png', 'Awal cerita kami', 5),
    ('/images/gallery-f.jpg', NULL, 6),
    ('/images/gallery-e.jpg', NULL, 7),
    ('/images/gallery-d.jpg', NULL, 8),
    ('/images/gallery-g.jpg', NULL, 9),
    ('/images/cover-ori.jpg', 'Tawa kecil yang selalu ingin kami ulang', 10),
    ('/images/gallery-h.jpg', NULL, 11),
    ('/images/cover-5.png', NULL, 12)
) AS v(image_url, caption, ord)
WHERE NOT EXISTS (SELECT 1 FROM wedding_gallery_items g WHERE g.image_url = v.image_url);

-- ---------- FAQ ----------
INSERT INTO wedding_faqs (question, answer, order_index)
SELECT 'Apakah saya bisa membawa pendamping?',
       'Mohon datang sesuai jumlah yang tertera pada undangan agar akomodasi tempat dapat kami siapkan dengan nyaman.', 1
WHERE NOT EXISTS (SELECT 1 FROM wedding_faqs WHERE question = 'Apakah saya bisa membawa pendamping?');

INSERT INTO wedding_faqs (question, answer, order_index)
SELECT 'Kapan saya harus hadir?',
       'Kami menyarankan untuk hadir 15 menit sebelum acara dimulai agar prosesi dapat berjalan lancar.', 2
WHERE NOT EXISTS (SELECT 1 FROM wedding_faqs WHERE question = 'Kapan saya harus hadir?');

INSERT INTO wedding_faqs (question, answer, order_index)
SELECT 'Apakah tersedia parkir?',
       'Ya, area parkir tersedia di lokasi venue dan gratis untuk seluruh tamu undangan.', 3
WHERE NOT EXISTS (SELECT 1 FROM wedding_faqs WHERE question = 'Apakah tersedia parkir?');

-- ---------- Rekening bank ----------
INSERT INTO wedding_bank_accounts (bank_name, account_number, account_holder_name)
SELECT 'BCA', '1234567890', 'Ramli'
WHERE NOT EXISTS (SELECT 1 FROM wedding_bank_accounts WHERE bank_name = 'BCA');

INSERT INTO wedding_bank_accounts (bank_name, account_number, account_holder_name)
SELECT 'Mandiri', '0987654321', 'Hasri'
WHERE NOT EXISTS (SELECT 1 FROM wedding_bank_accounts WHERE bank_name = 'Mandiri');

-- ---------- E-Wallet ----------
INSERT INTO wedding_ewallets (provider_name, account_id, qr_code_image_url)
SELECT 'QRIS', 'Hasri & Ramli', '/images/dummy-qris.png'
WHERE NOT EXISTS (SELECT 1 FROM wedding_ewallets WHERE provider_name = 'QRIS');

INSERT INTO wedding_ewallets (provider_name, account_id)
SELECT 'GoPay', '0812 3456 7890'
WHERE NOT EXISTS (SELECT 1 FROM wedding_ewallets WHERE provider_name = 'GoPay');

INSERT INTO wedding_ewallets (provider_name, account_id)
SELECT 'ShopeePay', '0812 3456 7890'
WHERE NOT EXISTS (SELECT 1 FROM wedding_ewallets WHERE provider_name = 'ShopeePay');

-- ---------- Wishlist (klaim mulai kosong) ----------
INSERT INTO wedding_wishlist_items (item_name, item_link, stock_total)
SELECT 'Air Fryer 4.5L', 'https://www.tokopedia.com/search?q=air+fryer+4.5l', 2
WHERE NOT EXISTS (SELECT 1 FROM wedding_wishlist_items WHERE item_name = 'Air Fryer 4.5L');

INSERT INTO wedding_wishlist_items (item_name, stock_total)
SELECT 'Rice Cooker Digital', 1
WHERE NOT EXISTS (SELECT 1 FROM wedding_wishlist_items WHERE item_name = 'Rice Cooker Digital');

INSERT INTO wedding_wishlist_items (item_name, item_link, stock_total)
SELECT 'Set Panci Granit', 'https://www.tokopedia.com/search?q=set+panci+granit', 3
WHERE NOT EXISTS (SELECT 1 FROM wedding_wishlist_items WHERE item_name = 'Set Panci Granit');

INSERT INTO wedding_wishlist_items (item_name, stock_total)
SELECT 'Vacuum Cleaner Portable', 1
WHERE NOT EXISTS (SELECT 1 FROM wedding_wishlist_items WHERE item_name = 'Vacuum Cleaner Portable');

INSERT INTO wedding_wishlist_items (item_name, item_link, stock_total)
SELECT 'Mesin Kopi Espresso', 'https://www.tokopedia.com/search?q=mesin+kopi+espresso', 2
WHERE NOT EXISTS (SELECT 1 FROM wedding_wishlist_items WHERE item_name = 'Mesin Kopi Espresso');

INSERT INTO wedding_wishlist_items (item_name, stock_total)
SELECT 'Sprei King Size 180×200', 2
WHERE NOT EXISTS (SELECT 1 FROM wedding_wishlist_items WHERE item_name = 'Sprei King Size 180×200');

-- ---------- Section visibilitas (13 section) ----------
INSERT INTO invitation_sections (section_key, order_index)
VALUES
    ('cover', 1), ('ayat', 2), ('mempelai', 3), ('countdown', 4),
    ('acara', 5), ('kisah', 6), ('galeri', 7), ('rsvp', 8),
    ('ucapan', 9), ('hadiah', 10), ('dresscode', 11), ('faq', 12),
    ('penutup', 13)
ON CONFLICT (section_key) DO NOTHING;

-- ---------- Ucapan (guestbook): percakapan langsung terlihat ----------
INSERT INTO guestbook_entries (guest_name, message_text)
SELECT 'Budi', 'Selamat menempuh hidup baru, semoga menjadi keluarga yang sakinah, mawaddah, warahmah!'
WHERE NOT EXISTS (SELECT 1 FROM guestbook_entries WHERE guest_name = 'Budi');

UPDATE guestbook_entries
SET reply_text = 'Terima kasih banyak atas doa dan kehadirannya, Budi! Semoga kita semua senantiasa dalam lindungan Allah SWT.',
    replied_at = now()
WHERE guest_name = 'Budi' AND reply_text IS NULL;
