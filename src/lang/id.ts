/**
 * @file id.ts
 * @description This is the Indonesian language file for the application.
 * @module lang
 * @author [Fikri Haykal for DPTSI ITS]
 * @version 1.5.14
 **/

import personalisasiLangId from "@/modules/personalisasi/lang/id"

const langId = {
	Common: {
		roles: {
			demo: 'Demo'
		},
		switch_role: 'Ganti Role',
		to_myits_portal: 'ke myITS Portal',
		sign_out: 'Keluar',
		switch: 'Ganti',
		switching_role: 'Mengubah role...',
		role_successfully_changed: 'Role berhasil diganti',
		role_changed_to_x: 'Role Anda berhasil diubah ke {x}',
		history: 'Riwayat',
		modules: {
			beranda: {
				title: 'Beranda',
				subtitle: 'Menu utama aplikasi',
			},
			alert: {
				title: 'Alert',
				subtitle: 'Desain Alert untuk aplikasi',
			},
			badge: {
				title: 'Badge',
				subtitle: 'Desain Badge untuk aplikasi',
			},
			button: {
				title: 'Button',
				subtitle: 'Desain Button untuk aplikasi',
			},
			card: {
				title: 'Card',
				subtitle: 'Desain Card untuk aplikasi',
			},
			menu: {
				title: 'Menu',
				subtitle: 'Desain Menu untuk aplikasi',
			},
			tab: {
				title: 'Tab',
				subtitle: 'Desain Tab untuk aplikasi',
			},
			toast: {
				title: 'Toast',
				subtitle: 'Desain Toast untuk aplikasi',
			},
			checkbox: {
				title: 'Checkbox',
				subtitle: 'Desain Checkbox untuk aplikasi',
			},
			input: {
				title: 'Input',
				subtitle: 'Desain Input untuk aplikasi',
			},
			radio: {
				title: 'Radio',
				subtitle: 'Desain Radio untuk aplikasi',
			},
			select: {
				title: 'Select',
				subtitle: 'Desain Select untuk aplikasi',
			},
			switch: {
				title: 'Switch',
				subtitle: 'Desain Switch untuk aplikasi',
			},
			textarea: {
				title: 'Textarea',
				subtitle: 'Desain Textarea untuk aplikasi',
			},
			upload_file: {
				title: 'Upload File',
				subtitle: 'Desain Upload File untuk aplikasi',
			},
			tamu: {
				title: 'Manajemen Tamu',
				subtitle: 'Kelola daftar tamu undangan pernikahan',
			},
			kategori_tamu: {
				title: 'Kategori Tamu',
				subtitle: 'Kelola kategori tamu undangan',
			},
			hubungan_tamu: {
				title: 'Hubungan Tamu',
				subtitle: 'Kelola hubungan tamu undangan',
			},

			personalisasi: {
				title: 'Personalisasi',
				subtitle: 'Personalisasi aplikasi',
			},
		},
		en: 'EN - English',
		id: 'ID - Indonesia',
		lang: 'id',
		all: 'Semua',
		add: 'Tambah',
		edit: 'Ubah',
		delete: 'Hapus',
		crop: 'Potong',
		cancel: 'Batal',
		save: 'Simpan',
		send: 'Kirim',
		close: 'Tutup',
		view: 'Lihat',
		show: 'Tampilkan',
		search: 'Cari',
		reject: 'Tolak',
		accept: 'Setujui',
		showing: 'Menampilkan halaman ke',
		or_new: 'atau buat baru',
		page: ' halaman',
		per_page: 'data per halaman',
		from: ' dari ',
		go_to_page: 'Pergi ke halaman ',
		loading: 'Memuat...',
		load_more: 'Muat Lagi',
		try_again: 'Coba Lagi',
		no_data: 'Tidak ada data',
		all_loaded: 'Semua data telah ditampilkan',
		error_load: 'Terjadi kesalahan. Silakan coba lagi.',
		reload: 'Muat Ulang',
		loading_data: 'Sedang mengambil data...',
	},
	PageLayout: {
		profile_picture_of: 'Foto profil dari {name}',
		user: 'pengguna',
	},
	ErrorPage: {
		halaman_tidak_ditemukan: 'Halaman Tidak Ditemukan',
		kesalahan_internal_server: 'Kesalahan Internal Server',
		muat_ulang: 'Muat ulang',
		kembali_ke_beranda: 'Kembali ke beranda',
	},
	Beranda: {
		hi: 'Hai, {name}',
	},
	Badge: {
		ModuleName: 'Badge',
		ModuleDescription: 'Badge adalah indikator visual kecil yang dapat digunakan untuk menampilkan status, jumlah, atau mengkategorikan item.',
	},
	Button: {
		ModuleName: 'Button',
		ModuleDescription: 'Button adalah elemen interaktif di web yang digunakan untuk memicu aksi atau respons saat diklik oleh pengguna.',
	},
	Card: {
		ModuleName: 'Card',
		ModuleDescription: 'Card adalah elemen kontainer di web yang digunakan untuk menampilkan konten dalam format kartu.',
	},
	Menu: {
		ModuleName: 'Menu',
		ModuleDescription: 'Menu adalah elemen navigasi di web yang digunakan untuk mengakses berbagai halaman atau fitur.',
	},
	Personalisasi: personalisasiLangId,
}

export default langId
