export interface PengaturanPernikahan {
  id: string;

  // Data Mempelai Pria
  nama_lengkap_pria: string;
  nama_panggilan_pria: string;
  nama_ayah_pria?: string;
  nama_ibu_pria?: string;
  anak_ke_pria?: string;

  // Data Mempelai Wanita
  nama_lengkap_wanita: string;
  nama_panggilan_wanita: string;
  nama_ayah_wanita?: string;
  nama_ibu_wanita?: string;
  anak_ke_wanita?: string;

  // Acara Akad/Pemberkatan
  tanggal_akad: string;
  jam_mulai_akad: string;
  jam_selesai_akad?: string;
  nama_tempat_akad: string;
  alamat_akad: string;
  link_maps_akad?: string;

  // Acara Resepsi (waktu diambil dari kategori_tamu)
  tanggal_resepsi: string;
  nama_tempat_resepsi: string;
  alamat_resepsi: string;
  link_maps_resepsi?: string;

  // Media
  musik_latar?: string;

  // Fitur Digital
  link_streaming?: string;

  // Gift/Amplop Digital - Bank 1
  bank_1?: string;
  nomor_rekening_1?: string;
  atas_nama_1?: string;

  // Gift/Amplop Digital - Bank 2
  bank_2?: string;
  nomor_rekening_2?: string;
  atas_nama_2?: string;

  // Template WhatsApp
  text_undangan?: string;
  text_pengingat_qr_code?: string;

  // SEO & Sharing
  meta_title?: string;
  meta_description?: string;
  og_image?: string;

  // Timestamps
  created_at: Date;
  updated_at: Date;
}

export interface UpdatePengaturanPernikahanInput {
  // Data Mempelai Pria
  nama_lengkap_pria?: string;
  nama_panggilan_pria?: string;
  nama_ayah_pria?: string;
  nama_ibu_pria?: string;
  anak_ke_pria?: string;

  // Data Mempelai Wanita
  nama_lengkap_wanita?: string;
  nama_panggilan_wanita?: string;
  nama_ayah_wanita?: string;
  nama_ibu_wanita?: string;
  anak_ke_wanita?: string;

  // Acara Akad/Pemberkatan
  tanggal_akad?: string;
  jam_mulai_akad?: string;
  jam_selesai_akad?: string;
  nama_tempat_akad?: string;
  alamat_akad?: string;
  link_maps_akad?: string;

  // Acara Resepsi (waktu diambil dari kategori_tamu)
  tanggal_resepsi?: string;
  nama_tempat_resepsi?: string;
  alamat_resepsi?: string;
  link_maps_resepsi?: string;

  // Media
  musik_latar?: string;

  // Fitur Digital
  link_streaming?: string;

  // Gift/Amplop Digital - Bank 1
  bank_1?: string;
  nomor_rekening_1?: string;
  atas_nama_1?: string;

  // Gift/Amplop Digital - Bank 2
  bank_2?: string;
  nomor_rekening_2?: string;
  atas_nama_2?: string;

  // Template WhatsApp
  text_undangan?: string;
  text_pengingat_qr_code?: string;

  // SEO & Sharing
  meta_title?: string;
  meta_description?: string;
  og_image?: string;
}
