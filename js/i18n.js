/* EHA Institute: English / Bahasa Indonesia.
   Default is English. The visitor's choice is remembered (localStorage 'eha_lang'); ?lang=id|en overrides it;
   a first visit from an Indonesian browser opens in Indonesian.
   Fixed text on the pages is translated here (the English text in the HTML stays the source and the fallback).
   Text from the database uses the *_id / *_alt columns, picked in cms.js. */
(() => {
  'use strict';
  const doc = document.documentElement;
  const norm = s => s.replace(/\s+/g, ' ').trim().replace(/[’‘]/g, "'");

  /* ---------- which language ---------- */
  const pick = () => {
    const q = new URLSearchParams(location.search).get('lang');
    if (q === 'id' || q === 'en') { try { localStorage.setItem('eha_lang', q); } catch {} return q; }
    try { const s = localStorage.getItem('eha_lang'); if (s === 'id' || s === 'en') return s; } catch {}
    return /^id\b/i.test((navigator.languages && navigator.languages[0]) || navigator.language || '') ? 'id' : 'en';
  };
  let LANG = pick();
  window.EHA_LANG = () => LANG;

  /* ---------- dictionary (English -> Indonesian) ---------- */
  const PAIRS = [
    ['Skip to content', 'Langsung ke konten'],
    ['EHA Institute, home', 'EHA Institute, beranda'],
    ['Publications', 'Publikasi'], ['Collaborators', 'Kolaborator'], ['Primary', 'Utama'],
    ['Our Work', 'Karya Kami'],
    ['Research, education and community programs that turn environmental and health science into practical, evidence-based solutions.', 'Program riset, edukasi, dan pemberdayaan masyarakat yang mengubah ilmu lingkungan dan kesehatan menjadi solusi praktis berbasis bukti.'],
    ['Research & Innovation', 'Riset & Inovasi'], ['Main Research Areas', 'Bidang Riset Utama'], ['Consultation Services', 'Layanan Konsultasi'],
    ['Scientific Writing', 'Penulisan Ilmiah'], ['Soon', 'Segera'], ['Education & Literacy', 'Edukasi & Literasi'], ['Webinar Series', 'Seri Webinar'],
    ['Podcast', 'Podcast'], ['Training', 'Pelatihan'], ['Conference Meeting', 'Pertemuan Konferensi'], ['Community Development', 'Pengembangan Masyarakat'],
    ['Initiating & Developing', 'Memulai & Mengembangkan'], ['Empowerment Programs', 'Program Pemberdayaan'], ['Campaign', 'Kampanye'],
    ['Our People', 'Insan EHA'],
    ['EHA Institute is driven by a curiosity to learn how science, technology and community can protect environmental and public health.', 'EHA Institute digerakkan oleh rasa ingin tahu tentang bagaimana sains, teknologi, dan masyarakat dapat melindungi kesehatan lingkungan dan publik.'],
    ['Our Team', 'Tim Kami'], ['Meet the researchers, academics and practitioners behind EHA.', 'Kenali para peneliti, akademisi, dan praktisi di balik EHA.'],
    ['Life at EHA', 'Kehidupan di EHA'], ['Get an insider\'s look at how our team works together.', 'Intip bagaimana tim kami bekerja bersama.'],
    ['News', 'Berita'], ['About', 'Tentang'],
    ['An independent non-profit research institute advancing science and technology for environmental and public health.', 'Lembaga riset nirlaba independen yang memajukan sains dan teknologi untuk kesehatan lingkungan dan publik.'],
    ['Who We Are', 'Siapa Kami'], ['Our story, our focus and the people behind EHA.', 'Kisah, fokus, dan orang-orang di balik EHA.'],
    ['Mission & Values', 'Misi & Nilai'], ['The principles that guide every project we take on.', 'Prinsip yang memandu setiap proyek kami.'],
    ['Universities and institutions we work with.', 'Universitas dan institusi mitra kerja kami.'],
    ['Search the site', 'Cari di situs'], ['Open menu', 'Buka menu'], ['Close menu', 'Tutup menu'], ['Page title', 'Judul halaman'], ['Breadcrumb', 'Jejak halaman'], ['Home', 'Beranda'],
    ['About | EHA Institute', 'Tentang | EHA Institute'],
    ['Who EHA Institute is, what it believes in, and who it works with.', 'Siapa EHA Institute, apa yang diyakininya, dan dengan siapa ia bekerja.'],
    ['EHA, which stands for Environment, Health, and Advanced Technology Institute, is an independent research organization committed to advancing science and technology in the fields of environmental and public health.', 'EHA, singkatan dari Environment, Health, and Advanced Technology Institute, adalah organisasi riset independen yang berkomitmen memajukan sains dan teknologi di bidang kesehatan lingkungan dan kesehatan masyarakat.'],
    ['The institute addresses pressing environmental and health challenges through a multidisciplinary approach and fosters innovation through evidence-based research. EHA Institute integrates scientific research, technological development, and community empowerment to develop sustainable, impactful solutions.', 'Lembaga ini menjawab tantangan lingkungan dan kesehatan yang mendesak melalui pendekatan multidisiplin dan mendorong inovasi lewat riset berbasis bukti. EHA Institute memadukan riset ilmiah, pengembangan teknologi, dan pemberdayaan masyarakat untuk menghasilkan solusi yang berkelanjutan dan berdampak.'],
    ['EHA Institute is a non-profit organization focused on research, study, and development in the fields of science, technology, and sustainable environmental practices.', 'EHA Institute adalah organisasi nirlaba yang berfokus pada riset, kajian, dan pengembangan di bidang sains, teknologi, dan praktik lingkungan berkelanjutan.'],
    ['Vision', 'Visi'],
    ['The institute was founded in response to the growing need for sustainable living amid major changes in the environment and in the way people live, with the aim of producing innovative solutions for a healthier, more sustainable future.', 'Lembaga ini didirikan untuk menjawab kebutuhan hidup berkelanjutan di tengah perubahan besar pada lingkungan dan cara hidup masyarakat, dengan tujuan menghasilkan solusi inovatif bagi masa depan yang lebih sehat dan berkelanjutan.'],
    ['Our core values spell S-U-S-T-A-I-N.', 'Nilai inti kami membentuk kata S-U-S-T-A-I-N.'],
    ['Science', 'Sains'], ['Commitment to evidence-based research and scientific integrity.', 'Komitmen pada riset berbasis bukti dan integritas ilmiah.'],
    ['Unity', 'Kebersamaan'], ['Building interdisciplinary and cross-sector partnerships to co-create solutions.', 'Membangun kemitraan lintas disiplin dan lintas sektor untuk menciptakan solusi bersama.'],
    ['Sustainable', 'Berkelanjutan'], ['Prioritizing long-term outcomes for the environment and public health.', 'Mengutamakan hasil jangka panjang bagi lingkungan dan kesehatan publik.'],
    ['Technology', 'Teknologi'], ['Embracing and developing advanced technologies for complex challenges.', 'Merangkul dan mengembangkan teknologi maju untuk tantangan yang kompleks.'],
    ['Accessibility', 'Keterjangkauan'], ['Keeping knowledge, tools and programs inclusive and open.', 'Menjaga pengetahuan, perangkat, dan program tetap inklusif dan terbuka.'],
    ['Integrity', 'Integritas'], ['Honesty and transparency in research, partnerships and reporting.', 'Kejujuran dan transparansi dalam riset, kemitraan, dan pelaporan.'],
    ['Nurture', 'Merawat'], ['Supporting the growth of knowledge, people and communities.', 'Mendukung tumbuhnya pengetahuan, individu, dan komunitas.'],
    ['What We Do', 'Apa yang Kami Lakukan'],
    ['Through collaboration with academics, industry, and communities, this organization strives to make a real contribution in addressing global challenges in the fields of environmental and green technology.', 'Melalui kolaborasi dengan akademisi, industri, dan masyarakat, organisasi ini berupaya memberi kontribusi nyata dalam menjawab tantangan global di bidang lingkungan dan teknologi hijau.'],
    ['Explore', 'Jelajahi'], ['Why Choose EHA?', 'Mengapa Memilih EHA?'],
    ['Behind every initiative at EHA Institute is a multidisciplinary team of researchers, academics, technology practitioners, environmental advocates, and community facilitators united by a shared passion for driving sustainable change.', 'Di balik setiap inisiatif EHA Institute ada tim multidisiplin yang terdiri dari peneliti, akademisi, praktisi teknologi, pegiat lingkungan, dan fasilitator masyarakat yang disatukan oleh semangat bersama untuk mendorong perubahan berkelanjutan.'],
    ['We believe that cross-disciplinary collaboration is essential to crafting innovative solutions for today\'s global challenges. With diverse backgrounds in environmental science, renewable energy, digital technology, and community empowerment, our team works in synergy to design impactful, data-driven, and future-oriented programs.', 'Kami percaya kolaborasi lintas disiplin sangat penting untuk merumuskan solusi inovatif bagi tantangan global saat ini. Dengan latar belakang beragam di ilmu lingkungan, energi terbarukan, teknologi digital, dan pemberdayaan masyarakat, tim kami bekerja sinergis merancang program yang berdampak, berbasis data, dan berorientasi masa depan.'],
    ['Meet the team', 'Kenali tim kami'],
    ['Team members', 'Anggota tim'], ['Partner institutions', 'Institusi mitra'], ['Countries', 'Negara'], ['Stories & publications', 'Cerita & publikasi'],
    ['Partners & Collaborators', 'Mitra & Kolaborator'],
    ['EHA Institute is always open to building meaningful partnerships and collaborations that drive national progress and create lasting impact for the future.', 'EHA Institute selalu terbuka untuk membangun kemitraan dan kolaborasi bermakna yang mendorong kemajuan bangsa dan menciptakan dampak jangka panjang.'],
    ['Indonesia', 'Indonesia'], ['China', 'Tiongkok'], ['Ireland', 'Irlandia'], ['Thailand', 'Thailand'], ['Malaysia', 'Malaysia'], ['Japan', 'Jepang'], ['Taiwan', 'Taiwan'],
    ['Stay Connected', 'Tetap Terhubung'], ['Receive the latest EHA Institute news.', 'Terima kabar terbaru dari EHA Institute.'],
    ['Your email address', 'Alamat email Anda'], ['Subscribe', 'Berlangganan'], ['EHA Institute on social media', 'EHA Institute di media sosial'],
    ['Email', 'Email'], ['© 2026 EHA Institute. All rights reserved.', '© 2026 EHA Institute. Hak cipta dilindungi.'],
    ['Back to top ↑', 'Kembali ke atas ↑'], ['Search', 'Cari'], ['Close search', 'Tutup pencarian'], ['Search EHA Institute', 'Cari di EHA Institute'],
    ['Search news, programs, people', 'Cari berita, program, orang'],
    ['Story | EHA Institute', 'Cerita | EHA Institute'], ['News, events and publications from EHA Institute.', 'Berita, acara, dan publikasi dari EHA Institute.'],
    ['Story', 'Cerita'], ['Loading…', 'Memuat…'], ['Details', 'Detail'], ['More stories', 'Cerita lainnya'], ['All news', 'Semua berita'],
    ['Story not found', 'Cerita tidak ditemukan'],
    ['This story may have been moved or unpublished.', 'Cerita ini mungkin telah dipindahkan atau tidak lagi dipublikasikan.'], ['Browse all news', 'Lihat semua berita'],
    ['Consultation Services | EHA Institute', 'Layanan Konsultasi | EHA Institute'],
    ['Research design, scientific writing, data and AI support, and environmental health collaboration from EHA Institute.', 'Desain riset, penulisan ilmiah, dukungan data dan AI, serta kolaborasi kesehatan lingkungan dari EHA Institute.'],
    ['Where we can support you', 'Bidang yang dapat kami dukung'],
    ['Research design and methods', 'Desain dan metode riset'],
    ['Evidence synthesis, systematic reviews and cross-disciplinary research methodology.', 'Sintesis bukti, tinjauan sistematis, dan metodologi riset lintas disiplin.'],
    ['Related', 'Terkait'],
    ['Scientific writing and publication', 'Penulisan ilmiah dan publikasi'],
    ['Writing scientific papers and posters, and mentoring toward publication in reputable journals.', 'Menulis makalah dan poster ilmiah, serta pendampingan menuju publikasi di jurnal bereputasi.'],
    ['Data and AI for research', 'Data dan AI untuk riset'],
    ['Using big data and artificial intelligence to support research and journal writing.', 'Memanfaatkan big data dan kecerdasan buatan untuk mendukung riset dan penulisan jurnal.'],
    ['Environmental and public health topics', 'Topik kesehatan lingkungan dan masyarakat'],
    ['Joint work on pollution, climate, toxicology and maternal health with academic and community partners.', 'Kerja bersama mitra akademik dan masyarakat tentang polusi, iklim, toksikologi, dan kesehatan ibu.'],
    ['Contact', 'Kontak'], ['Let\'s Talk Ideas for Change!', 'Mari Bicara Ide untuk Perubahan!'],
    ['Tell us about your research, your institution or your community. We will reply by email.', 'Ceritakan tentang riset, institusi, atau komunitas Anda. Kami akan membalas lewat email.'],
    ['Phone', 'Telepon'], ['Address', 'Alamat'], ['Your name', 'Nama Anda'], ['Email address', 'Alamat email'], ['How can we help?', 'Apa yang bisa kami bantu?'], ['Send message', 'Kirim pesan'],
    ['EHA Institute | Environment, Health and Advanced Technology', 'EHA Institute | Lingkungan, Kesehatan, dan Teknologi Maju'],
    ['EHA Institute is an independent non-profit research organization advancing science and technology for environmental and public health.', 'EHA Institute adalah organisasi riset nirlaba independen yang memajukan sains dan teknologi untuk kesehatan lingkungan dan publik.'],
    ['Introduction', 'Pengantar'],
    ['Science and technology in service of environmental and public health.', 'Sains dan teknologi untuk kesehatan lingkungan dan masyarakat.'],
    ['Our Story', 'Kisah Kami'], ['Our story', 'Kisah kami'], ['The Latest', 'Terbaru'], ['News Brief', 'Ringkasan Berita'], ['Read more', 'Selengkapnya'],
    ['Webinar Series #1', 'Seri Webinar #1'], ['Webinar Series #2', 'Seri Webinar #2'], ['Webinar Series #3', 'Seri Webinar #3'],
    ['Artificial Intelligence (AI) for Research & International Journal Writing', 'Kecerdasan Buatan (AI) untuk Riset & Penulisan Jurnal Internasional'],
    ['A practical session for lecturers, researchers and students on using AI to support research and the writing of international academic journals, initiated by Ruangkreatif in collaboration with EHA Institute.', 'Sesi praktis bagi dosen, peneliti, dan mahasiswa tentang pemanfaatan AI untuk mendukung riset dan penulisan jurnal akademik internasional, diinisiasi Ruangkreatif bersama EHA Institute.'],
    ['Introduction to Evidence Synthesis & Systematic Reviews', 'Pengantar Sintesis Bukti & Tinjauan Sistematis'],
    ['KM Saif-Ur-Rahman, Ph.D, of Evidence Synthesis Ireland & Cochrane Ireland at the University of Galway, on why systematic reviews produce credible, objective, evidence-based research. Moderated by Fitri Kurniasari, Ph.D.', 'KM Saif-Ur-Rahman, Ph.D, dari Evidence Synthesis Ireland & Cochrane Ireland di University of Galway, tentang mengapa tinjauan sistematis menghasilkan riset yang kredibel, objektif, dan berbasis bukti. Dimoderatori Fitri Kurniasari, Ph.D.'],
    ['Big Data Unlocked: Empowering Research and Digital Innovation', 'Big Data Unlocked: Memberdayakan Riset dan Inovasi Digital'],
    ['The session drew around 70 participants, including university students, lecturers and professionals from across Indonesia.', 'Sesi ini diikuti sekitar 70 peserta, termasuk mahasiswa, dosen, dan profesional dari berbagai penjuru Indonesia.'],
    ['Previous news brief', 'Ringkasan berita sebelumnya'], ['Next news brief', 'Ringkasan berita berikutnya'], ['View all', 'Lihat semua'],
    ['Upcoming Events', 'Acara Mendatang'], ['Recent Events', 'Acara Terkini'], ['Previous event', 'Acara sebelumnya'], ['Next event', 'Acara berikutnya'],
    ['Featured', 'Pilihan'], ['Event', 'Acara'], ['Events', 'Acara'],
    ['Main research areas, consultation services, scientific writing', 'Bidang riset utama, layanan konsultasi, penulisan ilmiah'],
    ['Webinars, podcast, training, conference meetings', 'Webinar, podcast, pelatihan, pertemuan konferensi'],
    ['Initiating & developing, empowerment programs, campaigns', 'Memulai & mengembangkan, program pemberdayaan, kampanye'],
    ['Resources', 'Sumber Daya'], ['Open research, shared with everyone.', 'Riset terbuka, dibagikan untuk semua.'],
    ['Journal articles, conference papers and field studies from EHA researchers and partners, from E. coli contamination in street food stalls to image processing and educational technology.', 'Artikel jurnal, makalah konferensi, dan studi lapangan dari peneliti dan mitra EHA, dari kontaminasi E. coli pada warung makan kaki lima hingga pengolahan citra dan teknologi pendidikan.'],
    ['Show previous images', 'Tampilkan gambar sebelumnya'], ['Show next images', 'Tampilkan gambar berikutnya'],
    ['About EHA Institute', 'Tentang EHA Institute'], ['An independent research institute for environmental and public health.', 'Lembaga riset independen untuk kesehatan lingkungan dan masyarakat.'],
    ['EHA stands for Environment, Health, and Advanced Technology Institute. We combine scientific research, technology development and community empowerment to build sustainable, evidence-based solutions.', 'EHA adalah singkatan dari Environment, Health, and Advanced Technology Institute. Kami memadukan riset ilmiah, pengembangan teknologi, dan pemberdayaan masyarakat untuk membangun solusi berkelanjutan berbasis bukti.'],
    ['Partners and collaborators', 'Mitra dan kolaborator'], ['Close video', 'Tutup video'],
    ['News | EHA Institute', 'Berita | EHA Institute'], ['All stories', 'Semua cerita'], ['Filter stories', 'Saring cerita'], ['All', 'Semua'],
    ['No stories in this category yet.', 'Belum ada cerita dalam kategori ini.'], ['Publication', 'Publikasi'],
    ['Study Abroad Talk #Series1: Scholarship and Academic Research for Study Abroad in Taiwan & Japan', 'Study Abroad Talk #Series1: Beasiswa dan Riset Akademik untuk Studi di Taiwan & Jepang'],
    ['Study Abroad Talk #Series1: Scholarship and Academic Research in Taiwan & Japan', 'Study Abroad Talk #Series1: Beasiswa dan Riset Akademik di Taiwan & Jepang'],
    ['EHA Institute and Ruangkreatif held the first Study Abroad Talk online on Friday, 24 October 2025, on scholarships and research experience for studying in Japan and Taiwan.', 'EHA Institute dan Ruangkreatif menggelar Study Abroad Talk pertama secara daring pada Jumat, 24 Oktober 2025, membahas beasiswa dan pengalaman riset untuk studi di Jepang dan Taiwan.'],
    ['The Department of Environmental Health, Faculty of Public Health Universitas Indonesia, in collaboration with EHA Institute and Ruangkreatif.', 'Departemen Kesehatan Lingkungan, Fakultas Kesehatan Masyarakat Universitas Indonesia, bekerja sama dengan EHA Institute dan Ruangkreatif.'],
    ['A linkage of personal, food, and environmental hygiene to presence of E. coli in Warmindo Food Stall', 'Hubungan higiene perorangan, makanan, dan lingkungan dengan keberadaan E. coli pada warung Warmindo'],
    ['Our People | EHA Institute', 'Insan EHA | EHA Institute'], ['Meet the researchers and team of EHA Institute.', 'Kenali para peneliti dan tim EHA Institute.'],
    ['Director & Researcher', 'Direktur & Peneliti'], ['Steering & Researcher', 'Dewan Pengarah & Peneliti'], ['Researcher', 'Peneliti'], ['Junior Researcher', 'Peneliti Muda'],
    ['Webinars, public lectures, partner visits and field work from the people of EHA Institute.', 'Webinar, kuliah umum, kunjungan mitra, dan kerja lapangan dari tim EHA Institute.'],
    ['Publications | EHA Institute', 'Publikasi | EHA Institute'],
    ['Journal articles, conference papers and reports by EHA Institute researchers.', 'Artikel jurnal, makalah konferensi, dan laporan karya peneliti EHA Institute.'],
    ['Research output', 'Luaran riset'],
    ['Peer-reviewed articles, conference papers and reports from EHA Institute researchers and collaborators.', 'Artikel telaah sejawat, makalah konferensi, dan laporan dari peneliti serta kolaborator EHA Institute.'],
    ['Search publications', 'Cari publikasi'], ['Search title, author or journal', 'Cari judul, penulis, atau jurnal'], ['Year', 'Tahun'], ['All years', 'Semua tahun'], ['Type', 'Jenis'],
    ['Journal', 'Jurnal'], ['Conference', 'Konferensi'], ['Report', 'Laporan'], ['Book', 'Buku'], ['Other', 'Lainnya'],
    ['Journal article', 'Artikel jurnal'], ['Conference paper', 'Makalah konferensi'],
    ['No publications match your search.', 'Tidak ada publikasi yang cocok dengan pencarian Anda.'], ['Publications will be listed here soon.', 'Publikasi akan segera tampil di sini.'],
    ['Abstract', 'Abstrak'], ['Read', 'Baca'], ['Cite APA', 'Kutip APA'], ['Copied ✓', 'Tersalin ✓'], ['BibTeX', 'BibTeX'],
    ['Main Research Areas | EHA Institute', 'Bidang Riset Utama | EHA Institute'],
    ['The environment, health and technology topics EHA Institute researches with academic and community partners.', 'Topik lingkungan, kesehatan, dan teknologi yang diteliti EHA Institute bersama mitra akademik dan masyarakat.'],
    ['Where our research is active', 'Bidang yang sedang kami teliti'],
    ['Environmental pollution and human health', 'Pencemaran lingkungan dan kesehatan manusia'],
    ['How air, water and chemical exposures reach people. Recent work covers mercury exposure from small-scale gold mining and the health effects of microplastics in offices and factories in Indonesia and Malaysia.', 'Bagaimana paparan udara, air, dan bahan kimia sampai kepada manusia. Kajian terbaru mencakup paparan merkuri dari tambang emas skala kecil dan dampak mikroplastik di perkantoran dan pabrik di Indonesia dan Malaysia.'],
    ['Climate change and child health', 'Perubahan iklim dan kesehatan anak'],
    ['Adapting to smoke haze to protect children\'s health in Southeast Asia and Australia, as part of the RCCC UI x HEAL HAZE Network.', 'Adaptasi terhadap kabut asap untuk melindungi kesehatan anak di Asia Tenggara dan Australia, bagian dari Jejaring RCCC UI x HEAL HAZE.'],
    ['Environmental toxicology and data-driven research', 'Toksikologi lingkungan dan riset berbasis data'],
    ['Epigenetic influences on chronic disease, the potential hazards of benzophenone-3, and environmental health research built on large databases, with Hangzhou Medical College.', 'Pengaruh epigenetik pada penyakit kronis, potensi bahaya benzophenone-3, dan riset kesehatan lingkungan berbasis basis data besar, bersama Hangzhou Medical College.'],
    ['Maternal and mental health', 'Kesehatan ibu dan mental'],
    ['A study with Nagoya University on how common postpartum depression is among mothers in Jakarta, screening more than 600 mothers at 42 community health centers.', 'Studi bersama Nagoya University tentang prevalensi depresi pascapersalinan pada ibu di Jakarta, dengan skrining lebih dari 600 ibu di 42 puskesmas.'],
    ['Evidence synthesis and research methods', 'Sintesis bukti dan metode riset'],
    ['Systematic reviews, scientific writing and publication mentoring for researchers, lecturers and students.', 'Tinjauan sistematis, penulisan ilmiah, dan pendampingan publikasi bagi peneliti, dosen, dan mahasiswa.'],
    ['Digital technology and computing', 'Teknologi digital dan komputasi'],
    ['Applied computing research from EHA researchers, from image smoothing with Gaussian filters to 3D CGI compositing and forecasting.', 'Riset komputasi terapan dari peneliti EHA, dari penghalusan citra dengan filter Gaussian hingga compositing CGI 3D dan peramalan.'],
    ['Public health services', 'Layanan kesehatan masyarakat'],
    ['Evidence for services and prevention: cervical cancer early detection in Jakarta, and food hygiene and E. coli in street food stalls.', 'Bukti untuk layanan dan pencegahan: deteksi dini kanker serviks di Jakarta, serta higiene makanan dan E. coli pada warung kaki lima.'],
    ['Have a research question, a collaboration in mind, or a community that could use evidence? Get in touch with the EHA team.', 'Punya pertanyaan riset, rencana kolaborasi, atau komunitas yang membutuhkan bukti ilmiah? Hubungi tim EHA.'],
    ['WhatsApp us', 'Hubungi via WhatsApp'],
    /* search panel and dynamic UI */
    ['Search results', 'Hasil pencarian'], ['Clear search', 'Hapus pencarian'], ['Close search', 'Tutup pencarian'],
    ['move', 'pindah'], ['open', 'buka'], ['close', 'tutup'], ['Recent', 'Terakhir'], ['Clear', 'Hapus'], ['Try searching', 'Coba cari'], ['Quick links', 'Tautan cepat'],
    ['Latest stories', 'Cerita terbaru'], ['Pages', 'Halaman'], ['People', 'Orang'], ['Services', 'Layanan'], ['Research', 'Riset'], ['Service', 'Layanan'],
    ['Webinar', 'Webinar'], ['Team', 'Tim'], ['Mercury', 'Merkuri'],
    ['Main research areas', 'Bidang riset utama'], ['Consultation services', 'Layanan konsultasi'], ['Our team', 'Tim kami'],
    ['Where our research is active', 'Bidang yang sedang kami teliti'], ['Design, writing, data and AI support', 'Dukungan desain, penulisan, data, dan AI'],
    ['Researchers and practitioners', 'Peneliti dan praktisi'], ['Papers and open research', 'Makalah dan riset terbuka'],
    ['Check the spelling or try one of these.', 'Periksa ejaan atau coba salah satu kata ini.'],
    ['Please fill in your name, a valid email and a message.', 'Mohon isi nama, email yang valid, dan pesan Anda.'],
    ['Opening your email app to send the message…', 'Membuka aplikasi email untuk mengirim pesan…'],
    ['Opening your email app to send the request…', 'Membuka aplikasi email untuk mengirim permintaan…'],
    ['Open story video', 'Buka video kisah kami'], ['Play', 'Putar'], ['Watch our story', 'Tonton kisah kami'],
    ['Previous', 'Sebelumnya'], ['Next', 'Berikutnya'], ['Language', 'Bahasa'],
    ['Sources', 'Sumber'], ['Reading time', 'Waktu baca']
  ];
  const DICT = new Map(PAIRS.map(([e, i]) => [norm(e), i]));
  const MONTH_ID = { January: 'Januari', February: 'Februari', March: 'Maret', April: 'April', May: 'Mei', June: 'Juni', July: 'Juli', August: 'Agustus', September: 'September', October: 'Oktober', November: 'November', December: 'Desember' };
  const ABBR_ID = { JAN: 'JAN', FEB: 'FEB', MAR: 'MAR', APR: 'APR', MAY: 'MEI', JUN: 'JUN', JUL: 'JUL', AUG: 'AGU', SEP: 'SEP', OCT: 'OKT', NOV: 'NOV', DEC: 'DES' };
  const RULES = [
    [/^Published (\w+) (\d{4})\. Authors?: (.+)$/, (m, mo, y, a) => `Dipublikasikan ${MONTH_ID[mo] || mo} ${y}. Penulis: ${a}`],
    [/^(\d+) results?$/, (m, n) => `${n} hasil`],
    [/^(\d+) of (\d+) publications?$/, (m, a, b) => `${a} dari ${b} publikasi`],
    [/^Nothing found for (.+)$/, (m, q) => `Tidak ditemukan hasil untuk ${q}`],
    [/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC) (\d{4})$/, (m, a, y) => `${ABBR_ID[a]} ${y}`],
    [/^(JAN|FEB|MAR|APR|MAY|JUN|JUL|AUG|SEP|OCT|NOV|DEC)$/, (m, a) => ABBR_ID[a]]
  ];
  const tr = raw => {
    const k = norm(raw); if (!k) return null;
    let v = DICT.get(k);
    if (v == null) for (const [re, fn] of RULES) { const m = re.exec(k); if (m) { v = fn(...m); break; } }
    if (v == null) return null;
    const lead = raw.match(/^\s*/)[0], trail = raw.match(/\s*$/)[0];
    return lead + v + trail;
  };
  window.EHA_T = s => (LANG === 'id' ? (tr(s) || s).trim() : s);

  /* ---------- DOM pass ---------- */
  const TXT = new WeakMap();   // text node -> original English text
  const ATT = new WeakMap();   // element -> { attr: original }
  const ATTRS = ['aria-label', 'placeholder', 'title', 'alt', 'aria-roledescription'];
  const SKIP = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'CODE', 'KBD']);
  const keepAsIs = el => el.closest && el.closest('[data-i18n="off"], [lang="id"][data-keep], #a-body, .pub__authors, .partner h3');

  function doText(n) {
    const p = n.parentNode; if (!p || SKIP.has(p.nodeName)) return;
    if (LANG === 'id') {
      if (TXT.has(n)) return;
      if (keepAsIs(p)) return;
      const v = tr(n.data); if (v != null && v !== n.data) { TXT.set(n, n.data); n.data = v; }
    } else if (TXT.has(n)) { n.data = TXT.get(n); TXT.delete(n); }
  }
  function doEl(el) {
    if (SKIP.has(el.nodeName)) return;
    for (const a of ATTRS) {
      if (!el.hasAttribute(a)) continue;
      let o = ATT.get(el); if (!o) { o = {}; ATT.set(el, o); }
      if (LANG === 'id') {
        if (a in o) continue;
        const v = tr(el.getAttribute(a)); if (v != null) { o[a] = el.getAttribute(a); el.setAttribute(a, v); }
      } else if (a in o) { el.setAttribute(a, o[a]); delete o[a]; }
    }
  }
  function walk(root) {
    if (root.nodeType === 3) { doText(root); return; }
    if (root.nodeType !== 1 && root.nodeType !== 9 && root.nodeType !== 11) return;
    if (root.nodeType === 1) { doEl(root); if (SKIP.has(root.nodeName)) return; }
    const w = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT);
    let n; while ((n = w.nextNode())) { if (n.nodeType === 3) doText(n); else doEl(n); }
  }
  const metas = () => {
    const d = document.querySelector('meta[name="description"]');
    if (d) { if (!d._en) d._en = d.content; d.content = LANG === 'id' ? (tr(d._en) || d._en) : d._en; }
    if (!document._enTitle) document._enTitle = document.title;
    if (!document.body.dataset.dyntitle) document.title = LANG === 'id' ? (tr(document._enTitle) || document._enTitle) : document._enTitle;
  };

  let mo;
  const observe = () => {
    mo = mo || new MutationObserver(list => {
      if (LANG !== 'id') return;
      for (const m of list) m.addedNodes.forEach(n => walk(n));
    });
    mo.observe(document.body, { childList: true, subtree: true });
  };

  /* ---------- switcher ---------- */
  function mount() {
    const search = document.querySelector('.nav__item--search');
    if (!search || document.querySelector('.nav__item--lang')) return;
    const li = document.createElement('li');
    li.className = 'nav__item nav__item--search nav__item--lang';
    li.innerHTML = '<div class="lang" role="group" aria-label="Language"><button type="button" class="lang__b" data-l="en" lang="en" aria-label="English">EN</button><button type="button" class="lang__b" data-l="id" lang="id" aria-label="Bahasa Indonesia">ID</button></div>';
    search.after(li);
    li.addEventListener('click', e => { const b = e.target.closest('[data-l]'); if (b) set(b.dataset.l); });
    paint();
  }
  const paint = () => document.querySelectorAll('.lang__b').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.l === LANG)));

  function apply() {
    doc.lang = LANG;
    paint();
    walk(document.body);
    metas();
  }
  function set(l) {
    if (l === LANG) return;
    LANG = l;
    try { localStorage.setItem('eha_lang', l); } catch {}
    try { const u = new URL(location.href); if (u.searchParams.has('lang')) { u.searchParams.set('lang', l); history.replaceState(null, '', u); } } catch {}
    doc.lang = l;
    document.querySelectorAll('h1.is-split').forEach(h => { if (h.dataset.plain) h.textContent = h.dataset.plain; });   // split headline back to plain text
    document.dispatchEvent(new CustomEvent('eha:lang', { detail: l }));   // cms.js re-renders database content
    apply();
  }
  window.EHA_SETLANG = set;

  const start = () => { mount(); apply(); observe(); };
  doc.lang = LANG;
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start); else start();
})();
