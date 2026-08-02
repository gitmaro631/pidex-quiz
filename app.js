import { initPiSDK, authenticate, currentAccessToken } from './pi-sdk.js';
import { detectCountry } from './util-i18n.js';
import { renderQuizPage }   from './page-quiz.js';
import { renderRankPage }   from './page-rank.js';
import { renderStatsPage }  from './page-stats.js';
import { renderSurveyPage } from './page-survey.js';
import { getScore, getLives, isSubscribed } from './util-storage.js';
import { initLang, t, getLang, setLang, SUPPORTED_LANGS } from './util-i18n.js';
import { renderHelpModal }    from './page-help.js';
import { renderOpinionPage }  from './page-opinion.js';
import { initFirebase, loadSurveyFromFirestore, updateLeaderboardCountry } from './firebase.js';
import { mergeSurveyFromCloud } from './util-storage.js';
const NOTICE_PREV = {
  version: '2026-08-01',
  ko: "📢 업데이트 안내 (2026-08-01)\n\n① 모험(RPG) 기능의 기본 뼈대가 완성됐습니다 — 사냥, 장비 강화, 용병 고용·성장, 영지 시설 육성까지 한 사이클이 전부 동작합니다.\n② 직업 밸런스를 계속 다듬고 있습니다. 궁수의 회피 능력이 다른 직업보다 과했던 부분을 확인해 수치를 조정했습니다.\n③ 모험 기능 번역은 한국어·영어·인도네시아어 3개 언어가 완료됐습니다. 나머지 언어는 안정화되는 대로 순차적으로 추가할 예정이며, 그 전까지는 영어로 표시됩니다.",
  en: "📢 Update Notice (2026-08-01)\n\n① The basic framework of the Adventure (RPG) feature is complete — hunting, equipment enhancement, hiring/growing mercenaries, and territory facility development all work as one full cycle now.\n② We're continuing to fine-tune class balance. We found the Archer's evasion ability was too strong compared to other classes and adjusted the numbers.\n③ Adventure feature translations are complete for Korean, English, and Indonesian. The remaining languages will be added progressively as the feature stabilizes — until then, they'll display in English.",
  zh: "📢 更新通知 (2026-08-01)\n\n① 冒险(RPG)功能的基本框架已经完成 — 狩猎、装备强化、雇佣/培养佣兵、领地设施建设都能完整运转了。\n② 我们仍在持续调整职业平衡。发现弓箭手的闪避能力相较其他职业过强，已经调整了数值。\n③ 冒险功能的翻译已完成韩语、英语、印尼语三种语言。其余语言将在功能稳定后陆续添加，在此之前将显示为英语。",
  id: "📢 Pemberitahuan Pembaruan (2026-08-01)\n\n① Kerangka dasar fitur Petualangan (RPG) sudah selesai — berburu, peningkatan perlengkapan, merekrut/mengembangkan tentara bayaran, hingga pengembangan fasilitas wilayah semuanya sudah berjalan dalam satu siklus penuh.\n② Kami terus menyempurnakan keseimbangan kelas. Kami menemukan kemampuan menghindar (evasion) Pemanah terlalu kuat dibanding kelas lain, sehingga angkanya sudah disesuaikan.\n③ Terjemahan fitur Petualangan sudah selesai untuk bahasa Korea, Inggris, dan Indonesia. Bahasa lainnya akan ditambahkan secara bertahap setelah fitur ini stabil — sampai saat itu, akan ditampilkan dalam bahasa Inggris.",
  ja: "📢 アップデートのお知らせ (2026-08-01)\n\n① 冒険(RPG)機能の基本的な骨組みが完成しました — 狩り、装備強化、傭兵の雇用・育成、領地施設の育成まで、一連のサイクルがすべて動作します。\n② 職業バランスを引き続き調整しています。弓使いの回避能力が他の職業に比べて強すぎた部分を確認し、数値を調整しました。\n③ 冒険機能の翻訳は韓国語・英語・インドネシア語の3言語が完了しました。残りの言語は機能が安定次第、順次追加する予定で、それまでは英語で表示されます。",
  es: "📢 Aviso de actualización (2026-08-01)\n\n① La estructura básica de la función de Aventura (RPG) está completa — la caza, la mejora de equipo, la contratación y crecimiento de mercenarios, y el desarrollo de instalaciones territoriales ya funcionan como un ciclo completo.\n② Seguimos ajustando el equilibrio entre clases. Detectamos que la habilidad de evasión del Arquero era demasiado fuerte comparada con otras clases y ajustamos los valores.\n③ Las traducciones de la función de Aventura están completas en coreano, inglés e indonesio. Los demás idiomas se irán añadiendo progresivamente a medida que la función se estabilice; hasta entonces se mostrará en inglés.",
  fr: "📢 Avis de mise à jour (2026-08-01)\n\n① La structure de base de la fonctionnalité Aventure (RPG) est terminée — la chasse, l'amélioration d'équipement, le recrutement et la progression des mercenaires, ainsi que le développement des installations territoriales fonctionnent désormais en un cycle complet.\n② Nous continuons à ajuster l'équilibre entre les classes. Nous avons constaté que la capacité d'esquive de l'Archer était trop forte par rapport aux autres classes et avons ajusté les valeurs.\n③ Les traductions de la fonctionnalité Aventure sont terminées en coréen, anglais et indonésien. Les autres langues seront ajoutées progressivement à mesure que la fonctionnalité se stabilise — en attendant, elles s'afficheront en anglais.",
  vi: "📢 Thông báo cập nhật (2026-08-01)\n\n① Khung cơ bản của tính năng Phiêu lưu (RPG) đã hoàn thành — săn bắn, nâng cấp trang bị, thuê/phát triển lính đánh thuê, phát triển cơ sở vật chất lãnh địa đều đã hoạt động trọn vẹn một chu trình.\n② Chúng tôi vẫn đang tiếp tục tinh chỉnh cân bằng giữa các lớp nhân vật. Chúng tôi nhận thấy khả năng né tránh của Cung thủ mạnh hơn hẳn so với các lớp khác nên đã điều chỉnh lại các chỉ số.\n③ Bản dịch tính năng Phiêu lưu đã hoàn tất cho tiếng Hàn, tiếng Anh và tiếng Indonesia. Các ngôn ngữ còn lại sẽ được bổ sung dần khi tính năng ổn định hơn — cho đến lúc đó sẽ hiển thị bằng tiếng Anh.",
  pt: "📢 Aviso de atualização (2026-08-01)\n\n① A estrutura básica do recurso de Aventura (RPG) está concluída — caça, aprimoramento de equipamentos, contratação/crescimento de mercenários e desenvolvimento de instalações territoriais já funcionam em um ciclo completo.\n② Continuamos ajustando o equilíbrio entre as classes. Percebemos que a habilidade de esquiva do Arqueiro estava muito forte em comparação com as outras classes e ajustamos os valores.\n③ As traduções do recurso de Aventura estão completas em coreano, inglês e indonésio. Os demais idiomas serão adicionados progressivamente conforme o recurso se estabiliza — até lá, serão exibidos em inglês.",
  ms: "📢 Notis Kemas Kini (2026-08-01)\n\n① Rangka asas ciri Pengembaraan (RPG) telah siap — memburu, menaik taraf perlengkapan, mengupah/membesarkan askar upahan, hingga pembangunan kemudahan wilayah semuanya berfungsi dalam satu kitaran penuh.\n② Kami terus menyelaraskan keseimbangan kelas. Kami mendapati keupayaan mengelak Pemanah terlalu kuat berbanding kelas lain, jadi nilainya telah diselaraskan.\n③ Terjemahan ciri Pengembaraan telah lengkap untuk bahasa Korea, Inggeris, dan Indonesia. Bahasa lain akan ditambah secara berperingkat apabila ciri ini stabil — sehingga itu, ia akan dipaparkan dalam bahasa Inggeris.",
  tl: "📢 Abiso sa Update (2026-08-01)\n\n① Kumpleto na ang batayang balangkas ng Adventure (RPG) feature — gumagana na nang buo ang isang cycle mula sa panghuhuli, pag-upgrade ng gamit, pag-hire/pagpapalago ng mersenaryo, hanggang sa pagpapaunlad ng mga pasilidad sa teritoryo.\n② Patuloy naming inaayos ang balance ng mga klase. Napansin namin na masyadong malakas ang evasion ability ng Archer kumpara sa ibang klase kaya inayos na ang mga numero.\n③ Kumpleto na ang salin ng Adventure feature sa Korean, English, at Indonesian. Idadagdag nang unti-unti ang ibang wika habang nagiging stable ang feature — samantala, ipapakita ito sa English.",
  hi: "📢 अपडेट सूचना (2026-08-01)\n\n① एडवेंचर (RPG) फीचर का बुनियादी ढांचा पूरा हो गया है — शिकार, उपकरण को उन्नत करना, भाड़े के सैनिकों को नियुक्त/विकसित करना और क्षेत्र की सुविधाओं का विकास — पूरा चक्र अब काम कर रहा है।\n② हम क्लास बैलेंस को लगातार बेहतर बना रहे हैं। हमने पाया कि तीरंदाज़ (Archer) की चकमा देने की क्षमता अन्य क्लास की तुलना में बहुत अधिक थी, इसलिए आंकड़ों को समायोजित किया गया है।\n③ एडवेंचर फीचर का अनुवाद कोरियाई, अंग्रेज़ी और इंडोनेशियाई भाषा में पूरा हो चुका है। बाकी भाषाएँ फीचर स्थिर होने के साथ धीरे-धीरे जोड़ी जाएंगी — तब तक अंग्रेज़ी में दिखाई देंगी।",
  ar: "📢 إشعار التحديث (2026-08-01)\n\n① اكتمل الهيكل الأساسي لميزة المغامرة (RPG) — الصيد، وتطوير المعدات، وتوظيف/تطوير المرتزقة، وتطوير مرافق الإقليم، كلها تعمل الآن كدورة كاملة.\n② نواصل ضبط توازن الفئات. لاحظنا أن قدرة المراوغة لدى الرامي كانت قوية جدًا مقارنة بالفئات الأخرى، فقمنا بتعديل القيم.\n③ اكتملت ترجمة ميزة المغامرة للغات الكورية والإنجليزية والإندونيسية. سيتم إضافة اللغات المتبقية تدريجيًا مع استقرار الميزة — وحتى ذلك الحين ستُعرض بالإنجليزية.",
  ru: "📢 Уведомление об обновлении (2026-08-01)\n\n① Базовая структура функции «Приключение» (RPG) завершена — охота, улучшение снаряжения, найм/развитие наёмников и развитие построек владений теперь работают как единый полный цикл.\n② Мы продолжаем настраивать баланс классов. Мы обнаружили, что способность уклонения Лучника была слишком сильной по сравнению с другими классами, и скорректировали значения.\n③ Перевод функции «Приключение» завершён для корейского, английского и индонезийского языков. Остальные языки будут добавляться постепенно по мере стабилизации функции — до тех пор они будут отображаться на английском.",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-08-01)\n\n① অভিযান (RPG) ফিচারের মূল কাঠামো সম্পূর্ণ হয়েছে — শিকার, সরঞ্জাম উন্নত করা, ভাড়াটে সেনা নিয়োগ/উন্নয়ন এবং অঞ্চলের সুবিধা উন্নয়ন — পুরো চক্রটি এখন কাজ করছে।\n② আমরা ক্লাস ব্যালেন্স ক্রমাগত ঠিক করে চলেছি। আমরা দেখেছি তীরন্দাজ (Archer)-এর পরিহার (evasion) ক্ষমতা অন্য ক্লাসের তুলনায় অনেক বেশি শক্তিশালী ছিল, তাই মানগুলো সমন্বয় করা হয়েছে।\n③ অভিযান ফিচারের অনুবাদ কোরিয়ান, ইংরেজি এবং ইন্দোনেশিয়ান ভাষায় সম্পূর্ণ হয়েছে। বাকি ভাষাগুলো ফিচার স্থিতিশীল হওয়ার সাথে সাথে ধাপে ধাপে যোগ করা হবে — ততক্ষণ পর্যন্ত ইংরেজিতে দেখানো হবে।",
  sw: "📢 Taarifa ya Sasisho (2026-08-01)\n\n① Muundo wa msingi wa kipengele cha Safari (RPG) umekamilika — kuwinda, kuboresha vifaa, kuajiri/kukuza mamluki, na kuendeleza vituo vya eneo sasa vinafanya kazi katika mzunguko mmoja kamili.\n② Tunaendelea kurekebisha uwiano wa madarasa. Tuligundua uwezo wa kukwepa wa Mpiga Mishale ulikuwa na nguvu kupita kiasi ikilinganishwa na madarasa mengine, hivyo tumerekebisha thamani zake.\n③ Tafsiri za kipengele cha Safari zimekamilika kwa Kikorea, Kiingereza, na Kiindonesia. Lugha zingine zitaongezwa hatua kwa hatua kadiri kipengele kinavyoimarika — hadi wakati huo, kitaonyeshwa kwa Kiingereza.",
  th: "📢 แจ้งอัปเดต (2026-08-01)\n\n① โครงสร้างพื้นฐานของฟีเจอร์การผจญภัย (RPG) เสร็จสมบูรณ์แล้ว — การล่าสัตว์ การอัปเกรดอุปกรณ์ การจ้าง/พัฒนาทหารรับจ้าง ไปจนถึงการพัฒนาสิ่งอำนวยความสะดวกในเขตแดน ทำงานครบวงจรแล้ว\n② เรายังคงปรับสมดุลของแต่ละอาชีพอย่างต่อเนื่อง เราพบว่าความสามารถในการหลบหลีกของนักธนูแข็งแกร่งเกินไปเมื่อเทียบกับอาชีพอื่น จึงได้ปรับค่าตัวเลขแล้ว\n③ การแปลฟีเจอร์การผจญภัยเสร็จสมบูรณ์แล้วสำหรับภาษาเกาหลี อังกฤษ และอินโดนีเซีย ภาษาที่เหลือจะถูกเพิ่มเข้ามาทีละภาษาเมื่อฟีเจอร์เสถียรขึ้น — ก่อนหน้านั้นจะแสดงเป็นภาษาอังกฤษ",
  tr: "📢 Güncelleme Bildirimi (2026-08-01)\n\n① Macera (RPG) özelliğinin temel iskeleti tamamlandı — avlanma, ekipman güçlendirme, paralı asker kiralama/geliştirme ve bölge tesisi geliştirme artık tam bir döngü olarak çalışıyor.\n② Sınıf dengesini ayarlamaya devam ediyoruz. Okçu'nun kaçınma yeteneğinin diğer sınıflara göre çok güçlü olduğunu fark ettik ve değerleri buna göre ayarladık.\n③ Macera özelliği çevirileri Korece, İngilizce ve Endonezcede tamamlandı. Diğer diller, özellik stabil hale geldikçe kademeli olarak eklenecek — o zamana kadar İngilizce olarak görüntülenecek.",
};

const NOTICE = {
  version: '2026-08-03',
  ko: "📢 업데이트 안내 (2026-08-03)\n\n① 전 직업에 새로운 패시브 스킬을 추가했어요 (체력/기력 자동 회복 등)\n② 흑기사 밸런스를 크게 손봤어요 (체력 소모 완화, 흡혈 옵션 추가)\n③ 레벨업 성장 방식이 바뀌어서 스탯을 언제 찍는지가 실제로 중요해졌어요\n④ 용병을 최대 3명까지 고용할 수 있어요\n⑤ 궁수 밸런스를 살짝 하향했어요",
  en: "📢 Update Notice (2026-08-03)\n\n① Added new passive skills for every class (auto HP/resource regen, and more)\n② Big balance improvements for the Dark Knight (less HP drain, new lifesteal options)\n③ Leveling up now works differently — when you invest stat points actually matters\n④ You can now hire up to 3 mercenaries\n⑤ Slightly toned down the Archer's balance",
  zh: "📢 更新通知 (2026-08-03)\n\n① 为所有职业新增了被动技能（自动回复生命/资源等）\n② 大幅调整了黑骑士的平衡性（减少生命消耗，新增吸血选项）\n③ 升级成长方式有所改变，属性点投资的时机变得更重要了\n④ 现在最多可以雇佣3名佣兵\n⑤ 稍微下调了弓箭手的平衡性",
  id: "📢 Pemberitahuan Pembaruan (2026-08-03)\n\n① Menambahkan skill pasif baru untuk semua kelas (pemulihan otomatis HP/sumber daya, dll)\n② Perbaikan besar pada keseimbangan Dark Knight (mengurangi konsumsi HP, opsi lifesteal baru)\n③ Cara pertumbuhan saat naik level berubah — waktu kamu menaruh poin stat sekarang benar-benar berpengaruh\n④ Sekarang bisa merekrut hingga 3 tentara bayaran\n⑤ Sedikit menurunkan keseimbangan Pemanah",
  ja: "📢 アップデートのお知らせ (2026-08-03)\n\n① 全職業に新しいパッシブスキルを追加しました（体力/資源の自動回復など）\n② 黒騎士のバランスを大幅に調整しました（体力消耗の緩和、吸血オプション追加）\n③ レベルアップの成長方式が変わり、いつステータスを振るかが実際に重要になりました\n④ 傭兵を最大3人まで雇用できるようになりました\n⑤ 弓使いのバランスを少し下方修正しました",
  es: "📢 Aviso de actualización (2026-08-03)\n\n① Se añadieron nuevas habilidades pasivas para todas las clases (regeneración automática de HP/recursos, etc.)\n② Gran mejora de equilibrio para el Caballero Oscuro (menos consumo de HP, nuevas opciones de robo de vida)\n③ La forma de crecer al subir de nivel cambió — ahora importa de verdad cuándo inviertes los puntos de estadística\n④ Ahora puedes contratar hasta 3 mercenarios\n⑤ Se ajustó ligeramente a la baja el equilibrio del Arquero",
  fr: "📢 Avis de mise à jour (2026-08-03)\n\n① De nouvelles compétences passives ont été ajoutées pour toutes les classes (régénération automatique des PV/ressources, etc.)\n② Grande amélioration de l'équilibre du Chevalier Noir (moins de consommation de PV, nouvelles options de vol de vie)\n③ La façon de progresser en montant de niveau a changé — le moment où vous investissez vos points de statistiques compte désormais vraiment\n④ Vous pouvez maintenant recruter jusqu'à 3 mercenaires\n⑤ L'équilibre de l'Archer a été légèrement revu à la baisse",
  vi: "📢 Thông báo cập nhật (2026-08-03)\n\n① Đã thêm kỹ năng bị động mới cho tất cả các lớp nhân vật (tự động hồi máu/tài nguyên, v.v.)\n② Cải thiện lớn cân bằng cho Hắc Kỵ Sĩ (giảm tiêu hao máu, thêm tùy chọn hút máu)\n③ Cách phát triển khi lên cấp đã thay đổi — thời điểm bạn đầu tư điểm chỉ số giờ đây thực sự quan trọng\n④ Giờ đây bạn có thể thuê tối đa 3 lính đánh thuê\n⑤ Đã giảm nhẹ cân bằng của Cung Thủ",
  pt: "📢 Aviso de atualização (2026-08-03)\n\n① Novas habilidades passivas foram adicionadas para todas as classes (regeneração automática de HP/recursos, etc.)\n② Grande melhoria de equilíbrio para o Cavaleiro das Trevas (menos consumo de HP, novas opções de roubo de vida)\n③ A forma de crescimento ao subir de nível mudou — agora importa de verdade quando você investe pontos de atributo\n④ Agora você pode contratar até 3 mercenários\n⑤ O equilíbrio do Arqueiro foi levemente reduzido",
  ms: "📢 Notis Kemas Kini (2026-08-03)\n\n① Kemahiran pasif baharu ditambah untuk semua kelas (pemulihan automatik HP/sumber, dll.)\n② Penambahbaikan besar pada keseimbangan Dark Knight (kurangkan penggunaan HP, pilihan lifesteal baharu)\n③ Cara pertumbuhan naik tahap telah berubah — masa anda melabur mata statistik kini benar-benar penting\n④ Kini anda boleh mengupah sehingga 3 askar upahan\n⑤ Keseimbangan Pemanah diturunkan sedikit",
  tl: "📢 Abiso sa Update (2026-08-03)\n\n① Nagdagdag ng bagong passive skills para sa lahat ng klase (automatic na pagbawi ng HP/resource, atbp.)\n② Malaking pagbuti sa balance ng Dark Knight (mas kaunting pag-ubos ng HP, bagong lifesteal options)\n③ Nagbago ang paraan ng paglago pag level up — mahalaga na ngayon kung kailan mo ilalagay ang stat points\n④ Puwede ka nang mag-hire ng hanggang 3 mersenaryo\n⑤ Bahagyang binawasan ang balance ng Archer",
  hi: "📢 अपडेट सूचना (2026-08-03)\n\n① सभी क्लास के लिए नए पैसिव स्किल जोड़े गए हैं (HP/संसाधन की ऑटो रिकवरी आदि)\n② डार्क नाइट के बैलेंस में बड़ा सुधार किया गया है (HP खपत कम की गई, नए लाइफस्टील विकल्प जोड़े गए)\n③ लेवल-अप का ग्रोथ तरीका बदल गया है — अब यह मायने रखता है कि आप स्टैट पॉइंट कब लगाते हैं\n④ अब आप 3 भाड़े के सैनिकों तक नियुक्त कर सकते हैं\n⑤ तीरंदाज़ (Archer) का बैलेंस थोड़ा कम किया गया है",
  ar: "📢 إشعار التحديث (2026-08-03)\n\n① تمت إضافة مهارات سلبية جديدة لجميع الفئات (استعادة تلقائية للصحة/الموارد وغيرها)\n② تحسين كبير في توازن فارس الظلام (تقليل استهلاك الصحة، وإضافة خيارات امتصاص الحياة)\n③ تغيرت طريقة النمو عند رفع المستوى — أصبح توقيت استثمار نقاط الإحصائيات مهمًا فعليًا\n④ يمكنك الآن توظيف ما يصل إلى 3 مرتزقة\n⑤ تم تخفيف توازن الرامي قليلاً",
  ru: "📢 Уведомление об обновлении (2026-08-03)\n\n① Для всех классов добавлены новые пассивные навыки (автоматическое восстановление здоровья/ресурсов и др.)\n② Значительно улучшен баланс Тёмного рыцаря (снижен расход здоровья, добавлены новые варианты вампиризма)\n③ Изменилась система роста при повышении уровня — теперь важно, когда именно вы вкладываете очки характеристик\n④ Теперь можно нанимать до 3 наёмников\n⑤ Немного ослаблен баланс Лучника",
  bn: "📢 আপডেট বিজ্ঞপ্তি (2026-08-03)\n\n① সব ক্লাসের জন্য নতুন প্যাসিভ স্কিল যোগ করা হয়েছে (HP/রিসোর্স স্বয়ংক্রিয় পুনরুদ্ধার ইত্যাদি)\n② ডার্ক নাইটের ব্যালেন্স ব্যাপকভাবে উন্নত করা হয়েছে (HP খরচ কমানো হয়েছে, নতুন লাইফস্টিল অপশন যোগ হয়েছে)\n③ লেভেল আপের বৃদ্ধির পদ্ধতি বদলে গেছে — এখন আপনি কখন স্ট্যাট পয়েন্ট বিনিয়োগ করছেন তা সত্যিই গুরুত্বপূর্ণ\n④ এখন আপনি সর্বোচ্চ ৩ জন ভাড়াটে সেনা নিয়োগ করতে পারবেন\n⑤ তীরন্দাজ (Archer)-এর ব্যালেন্স সামান্য কমানো হয়েছে",
  sw: "📢 Taarifa ya Sasisho (2026-08-03)\n\n① Tumeongeza ujuzi mpya wa pasivu kwa madarasa yote (kupona kiotomatiki kwa HP/rasilimali, n.k.)\n② Uboreshaji mkubwa wa uwiano wa Dark Knight (kupunguza matumizi ya HP, chaguo jipya la lifesteal)\n③ Njia ya ukuaji wakati wa kupanda ngazi imebadilika — sasa muda unapowekeza pointi za takwimu unahusika kikamilifu\n④ Sasa unaweza kuajiri hadi mamluki 3\n⑤ Uwiano wa Mpiga Mishale umepunguzwa kidogo",
  th: "📢 แจ้งอัปเดต (2026-08-03)\n\n① เพิ่มสกิลพาสซีฟใหม่ให้ทุกอาชีพ (ฟื้นฟู HP/ทรัพยากรอัตโนมัติ และอื่นๆ)\n② ปรับสมดุลของ Dark Knight ครั้งใหญ่ (ลดการใช้ HP เพิ่มตัวเลือกดูดเลือด)\n③ วิธีการเติบโตตอนเลเวลอัพเปลี่ยนไป — ตอนนี้จังหวะที่คุณลงแต้มสเตตัสมีผลจริงๆ\n④ ตอนนี้จ้างทหารรับจ้างได้สูงสุด 3 คน\n⑤ ปรับลดสมดุลของนักธนูลงเล็กน้อย",
  tr: "📢 Güncelleme Bildirimi (2026-08-03)\n\n① Tüm sınıflara yeni pasif yetenekler eklendi (otomatik HP/kaynak yenilenmesi vb.)\n② Kara Şövalye'nin dengesinde büyük iyileştirme yapıldı (HP tüketimi azaltıldı, yeni can emme seçenekleri eklendi)\n③ Seviye atlarken büyüme şekli değişti — artık stat puanlarını ne zaman yatırdığınız gerçekten önemli\n④ Artık en fazla 3 paralı asker kiralayabilirsiniz\n⑤ Okçu'nun dengesi biraz düşürüldü",
};

// ── 공지 팝업 ────────────────────────────────────────
const _NOTICE_COL = 'notices_pidex_quiz';

async function fetchAllNotices() {
  let notices = [];
  try {
    if (typeof firebase !== 'undefined' && firebase.apps.length) {
      const db = firebase.firestore();
      for (const n of [NOTICE_PREV, NOTICE]) {
        if (!n) continue;
        const ref  = db.collection(_NOTICE_COL).doc(n.version);
        const snap = await ref.get();
        if (!snap.exists) await ref.set({ ...n, createdAt: firebase.firestore.FieldValue.serverTimestamp() });
      }
      const q = await db.collection(_NOTICE_COL).orderBy('createdAt', 'asc').get();
      notices = q.docs.map(d => d.data());
    }
  } catch {}
  if (!notices.length) notices = [NOTICE_PREV, NOTICE].filter(Boolean);
  return notices;
}

async function showNoticeIfNeeded() {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const notices = await fetchAllNotices();
  if (!notices.length) return;
  const latest = notices[notices.length - 1];
  const skipUntil   = parseInt(localStorage.getItem(SKIP_KEY) || '0', 10);
  const skipVersion = localStorage.getItem(VERSION_KEY) || '';
  if (skipVersion === latest.version && Date.now() < skipUntil) return;
  _showNoticePopup(notices, notices.length - 1);
}

// 관리자가 QuizPi 로고를 클릭하면 스킵 여부와 무관하게 공지창(통계 탭 포함)을 바로 연다.
async function openNoticePopupManually() {
  const notices = await fetchAllNotices();
  if (!notices.length) return;
  _showNoticePopup(notices, notices.length - 1);
}

function _showNoticePopup(notices, idx) {
  const SKIP_KEY    = 'notice_skip_until';
  const VERSION_KEY = 'notice_skip_version';
  const latest  = notices[notices.length - 1];
  const notice  = notices[idx];
  const lang    = getLang();
  const text    = notice[lang] || notice.en;
  const total   = notices.length;
  const isAdmin = currentUsername === ADMIN_USERNAME;
  document.getElementById('notice-overlay')?.remove();
  const overlay = document.createElement('div');
  overlay.id = 'notice-overlay';
  overlay.className = 'notice-overlay';
  overlay.innerHTML = `
    <div class="notice-box">
      ${isAdmin ? `
      <div style="display:flex;gap:4px;margin-bottom:10px;">
        <button class="admin-notice-tab active" data-tab="notice" style="flex:1;padding:6px;border:none;border-radius:6px;background:var(--primary,#6c5ce7);color:#fff;font-size:12px;cursor:pointer;">📢 공지</button>
        <button class="admin-notice-tab" data-tab="stats" style="flex:1;padding:6px;border:none;border-radius:6px;background:rgba(255,255,255,0.08);color:#ccc;font-size:12px;cursor:pointer;">📊 통계</button>
        <button class="admin-notice-tab" data-tab="messages" style="flex:1;padding:6px;border:none;border-radius:6px;background:rgba(255,255,255,0.08);color:#ccc;font-size:12px;cursor:pointer;">${t('admin_tab_messages')}</button>
      </div>` : ''}
      <div id="notice-panel-notice">
        <div class="notice-body">${text.replace(/\n/g, '<br>')}</div>
        ${total > 1 ? `
        <div class="notice-nav">
          <button class="notice-nav-btn" id="notice-prev"${idx === 0 ? ' disabled' : ''}>←</button>
          <span class="notice-nav-page">${idx + 1} / ${total}</span>
          <button class="notice-nav-btn" id="notice-next"${idx === total - 1 ? ' disabled' : ''}>→</button>
        </div>` : ''}
        <label class="notice-skip-label">
          <input type="checkbox" id="notice-skip-check">
          <span>${t('notice_skip_week')}</span>
        </label>
        <button class="notice-close-btn" id="notice-close-btn">${t('notice_confirm')}</button>
      </div>
      ${isAdmin ? `<div id="notice-panel-stats" class="hidden" style="max-height:60vh;overflow-y:auto;background:var(--surface2,#22263a);border-radius:10px;padding:12px;"></div>` : ''}
      ${isAdmin ? `<div id="notice-panel-messages" class="hidden" style="max-height:60vh;overflow-y:auto;background:var(--surface2,#22263a);border-radius:10px;padding:12px;"></div>` : ''}
    </div>
  `;
  document.body.appendChild(overlay);
  overlay.querySelector('#notice-prev')?.addEventListener('click', () => { overlay.remove(); _showNoticePopup(notices, idx - 1); });
  overlay.querySelector('#notice-next')?.addEventListener('click', () => { overlay.remove(); _showNoticePopup(notices, idx + 1); });
  overlay.querySelector('#notice-close-btn').addEventListener('click', () => {
    if (overlay.querySelector('#notice-skip-check').checked) {
      localStorage.setItem(SKIP_KEY, String(Date.now() + 24 * 60 * 60 * 1000));
      localStorage.setItem(VERSION_KEY, latest.version);
    }
    overlay.remove();
  });

  if (isAdmin) {
    const tabs         = overlay.querySelectorAll('.admin-notice-tab');
    const noticePanel  = overlay.querySelector('#notice-panel-notice');
    const statsPanel   = overlay.querySelector('#notice-panel-stats');
    const messagesPanel = overlay.querySelector('#notice-panel-messages');
    const panels = { notice: noticePanel, stats: statsPanel, messages: messagesPanel };
    tabs.forEach(btn => {
      btn.addEventListener('click', () => {
        tabs.forEach(b => {
          const on = b === btn;
          b.classList.toggle('active', on);
          b.style.background = on ? 'var(--primary,#6c5ce7)' : 'rgba(255,255,255,0.08)';
          b.style.color = on ? '#fff' : '#ccc';
        });
        const activeTab = btn.dataset.tab;
        Object.entries(panels).forEach(([key, el]) => el.classList.toggle('hidden', key !== activeTab));
        if (activeTab === 'stats' && !statsPanel.dataset.loaded) {
          statsPanel.dataset.loaded = '1';
          loadAndRenderAdminStats(statsPanel);
        }
        if (activeTab === 'messages' && !messagesPanel.dataset.loaded) {
          messagesPanel.dataset.loaded = '1';
          loadAndRenderAdminMessages(messagesPanel);
        }
      });
    });
  }
}

// ── 관리자에게 메시지 보내기 (헤더 아이디 클릭) ───────────────
const MESSAGES_COL = 'admin_messages';

function openAdminMessageDialog() {
  const username = currentUsername || _headerUsername;
  if (!username || username === ADMIN_USERNAME) return;
  const overlay = document.createElement('div');
  overlay.className = 'modal-overlay';
  overlay.innerHTML = `
    <div class="modal-box" style="max-width:340px;">
      <div class="modal-header"><span>${t('msg_dialog_title')}</span><button class="modal-close" id="am-x">✕</button></div>
      <div id="am-body" style="padding:16px;">
        <textarea id="am-text" rows="5" class="form-input" placeholder="${t('msg_dialog_placeholder')}" style="width:100%;resize:vertical;"></textarea>
        <p id="am-err" style="color:#f87171;font-size:11px;min-height:16px;margin-top:4px;"></p>
        <div style="display:flex;gap:8px;margin-top:8px;">
          <button class="btn-outline" id="am-cancel" style="flex:1;">${t('msg_cancel')}</button>
          <button class="btn-primary" id="am-send" style="flex:1;">${t('msg_send')}</button>
        </div>
      </div>
    </div>`;
  document.body.appendChild(overlay);
  const close = () => overlay.remove();
  overlay.querySelector('#am-x').onclick = close;
  overlay.querySelector('#am-cancel').onclick = close;
  overlay.querySelector('#am-send').onclick = async () => {
    const text  = overlay.querySelector('#am-text').value.trim();
    const errEl = overlay.querySelector('#am-err');
    const btn   = overlay.querySelector('#am-send');
    if (!text) { errEl.textContent = t('msg_required'); return; }
    if (typeof firebase === 'undefined' || !firebase.apps.length) { errEl.textContent = t('msg_error'); return; }
    btn.disabled = true;
    try {
      const db = firebase.firestore();
      await db.collection(MESSAGES_COL).add({
        username, app: 'pidex_quiz', text,
        createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      });
      overlay.querySelector('#am-body').innerHTML = `<p style="text-align:center;padding:20px 0;color:#22c55e;">✅ ${t('msg_sent')}</p>`;
      setTimeout(close, 900);
    } catch {
      errEl.textContent = t('msg_send_fail');
      btn.disabled = false;
    }
  };
}

async function loadAndRenderAdminMessages(el) {
  el.innerHTML = `<p style="color:#888;font-size:13px;padding:16px 0;text-align:center;">${t('admin_msg_loading')}</p>`;
  try {
    if (typeof firebase === 'undefined' || !firebase.apps.length) throw new Error('no db');
    const db = firebase.firestore();
    const snap = await db.collection(MESSAGES_COL).orderBy('createdAt', 'desc').limit(100).get();
    if (snap.empty) { el.innerHTML = `<p style="color:#888;font-size:13px;padding:16px 0;text-align:center;">${t('admin_msg_empty')}</p>`; return; }
    el.innerHTML = snap.docs.map(d => {
      const m = d.data();
      const date = m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : '';
      return `
        <div style="padding:8px 0;border-bottom:1px solid rgba(255,255,255,0.06);">
          <div style="display:flex;justify-content:space-between;font-size:12px;color:#888;margin-bottom:3px;">
            <span>👤 ${m.username || '?'} · ${m.app === 'pidex_app' ? '파이덱스' : '퀴즈파이'}</span>
            <span>${date}</span>
          </div>
          <div style="font-size:13px;color:#eee;white-space:pre-wrap;">${(m.text || '').replace(/</g,'&lt;')}</div>
        </div>`;
    }).join('');
  } catch (e) {
    el.innerHTML = `<p style="color:#f87171;font-size:13px;padding:16px 0;">${t('admin_msg_load_fail')}: ${e.message}</p>`;
  }
}

// ── 관리자 전용 통계 (공지창 "통계" 탭) ─────────────────────
const ADMIN_USERNAME    = 'cam1998pi';
const STATS_HISTORY_COL = 'admin_stats_history';
const QUIZ_MODES_LIST   = ['miner', 'pioneer', 'validator'];

async function safeGet(db, col) {
  try { return await db.collection(col).get(); } catch { return null; }
}
function sumField(snap, field) {
  if (!snap) return 0;
  return snap.docs.reduce((s, d) => s + (d.data()[field]?.length || 0), 0);
}
function userIdsOf(snap) {
  return snap ? snap.docs.map(d => d.id) : [];
}

async function computeAdminStats(db) {
  const [hackSnap, pidexSnap, watchSnap, tradeSnap, reportSnap, opinionSnap, surveySnap, rpgSnap, ...leaderboardSnaps] = await Promise.all([
    safeGet(db, 'hack_pending_wallets'),
    safeGet(db, 'pidex_wallets'),
    safeGet(db, 'pidex_watch_list'),
    safeGet(db, 'pidex_trade_wallets'),
    safeGet(db, 'hack_reports'),
    safeGet(db, 'quiz_opinions'),
    safeGet(db, 'surveys'),
    safeGet(db, 'rpg_characters'),
    ...QUIZ_MODES_LIST.map(m => safeGet(db, `leaderboard_${m}`)),
  ]);

  const walletUsers = new Set([...userIdsOf(hackSnap), ...userIdsOf(pidexSnap)]);
  const quizUsers = new Set();
  leaderboardSnaps.forEach(snap => userIdsOf(snap).forEach(id => quizUsers.add(id)));

  // rpg_characters 문서 id는 "username__slot" 형태 - 실제로 모험(존)을 한 번이라도 완료한
  // 캐릭터만 "참가"로 치고, 계정 단위(username)로 중복 제거해서 셈
  const rpgAdventureUsers = new Set();
  (rpgSnap?.docs || []).forEach(d => {
    const data = d.data();
    if (!data.visitedZones || !data.visitedZones.length) return;
    const username = d.id.split('__').slice(0, -1).join('__') || d.id;
    rpgAdventureUsers.add(username);
  });

  return {
    walletUsers: walletUsers.size,
    walletCount: sumField(hackSnap, 'wallets') + sumField(pidexSnap, 'wallets'),
    watchUsers: watchSnap ? watchSnap.size : 0,
    watchCount: sumField(watchSnap, 'watchList'),
    tradeUsers: tradeSnap ? tradeSnap.size : 0,
    tradeCount: sumField(tradeSnap, 'mainnet'),
    reportCount: reportSnap ? reportSnap.size : 0,
    opinionCount: opinionSnap ? opinionSnap.size : 0,
    quizUsers: quizUsers.size,
    surveyUsers: surveySnap ? surveySnap.size : 0,
    rpgAdventureUsers: rpgAdventureUsers.size,
  };
}

async function loadAdminStatsWithGrowth(db) {
  const current = await computeAdminStats(db);
  let prev = null;
  try {
    const histSnap = await db.collection(STATS_HISTORY_COL).orderBy('date', 'desc').limit(2).get();
    const docs  = histSnap.docs.map(d => d.data());
    const today = new Date().toISOString().slice(0, 10);
    prev = docs.find(d => d.date !== today) || null;
    await db.collection(STATS_HISTORY_COL).doc(today).set({
      date: today, ...current, updatedAt: firebase.firestore.FieldValue.serverTimestamp(),
    });
  } catch { /* 기록 실패해도 현재 통계는 보여줌 */ }
  return { current, prev };
}

// 관리자가 통계 탭을 안 열어도, 아무 유저나 접속하면 그날 스냅샷이 자동으로 한 번 기록됨
async function maybeRecordDailyStatsSnapshot() {
  try {
    if (typeof firebase === 'undefined' || !firebase.apps.length) return;
    const db    = firebase.firestore();
    const today = new Date().toISOString().slice(0, 10);
    const ref   = db.collection(STATS_HISTORY_COL).doc(today);
    const snap  = await ref.get();
    if (snap.exists) return;
    const current = await computeAdminStats(db);
    await ref.set({ date: today, ...current, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
  } catch { /* 조용히 무시 — 일반 유저 경험에 영향 없어야 함 */ }
}

async function fetchSubscriberCount() {
  try {
    const r = await fetch(`/api/admin-stats?accessToken=${encodeURIComponent(currentAccessToken ?? '')}`);
    if (!r.ok) return null;
    const data = await r.json();
    return data.subscriberCount ?? null;
  } catch { return null; }
}

async function loadAndRenderAdminStats(el) {
  el.innerHTML = `<p style="color:#888;font-size:13px;padding:16px 0;text-align:center;">불러오는 중...</p>`;
  try {
    const db = firebase.firestore();
    const [{ current, prev }, subscriberCount] = await Promise.all([
      loadAdminStatsWithGrowth(db),
      fetchSubscriberCount(),
    ]);
    const row = (label, value, prevValue) => {
      const delta = (prevValue != null) ? value - prevValue : null;
      const deltaStr = delta == null ? '' :
        (delta > 0 ? ` <span style="color:#22c55e;">+${delta}</span>` :
         delta < 0 ? ` <span style="color:#f87171;">${delta}</span>` :
                      ` <span style="color:#888;">±0</span>`);
      return `<div style="display:flex;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06);font-size:13px;">
        <span style="color:#ccc;">${label}</span><span style="font-weight:600;">${value}${deltaStr}</span>
      </div>`;
    };
    el.innerHTML = `
      <div style="font-size:11px;color:#888;margin-bottom:8px;">${prev ? `지난 확인(${prev.date}) 대비 증감` : '첫 확인 — 다음부터 증감이 표시돼요'}</div>
      ${row('지갑 등록 유저 수 (두 앱 합산)', current.walletUsers, prev?.walletUsers)}
      ${row('등록된 지갑 개수 (두 앱 합산)', current.walletCount, prev?.walletCount)}
      ${row('관심지갑 등록 유저 수', current.watchUsers, prev?.watchUsers)}
      ${row('관심지갑 개수', current.watchCount, prev?.watchCount)}
      ${row('별칭지갑 등록 유저 수', current.tradeUsers, prev?.tradeUsers)}
      ${row('별칭지갑 개수', current.tradeCount, prev?.tradeCount)}
      ${row('해킹 신고 건수', current.reportCount, prev?.reportCount)}
      ${row('의견 게시글 수', current.opinionCount, prev?.opinionCount)}
      ${row('퀴즈 참여 유저 수', current.quizUsers, prev?.quizUsers)}
      ${row('설문조사 참여 유저 수', current.surveyUsers, prev?.surveyUsers)}
      ${row('모험(RPG) 참여 유저 수', current.rpgAdventureUsers, prev?.rpgAdventureUsers)}
      ${row('구독자 수 (퀴즈파이 앱)', subscriberCount ?? '?', null)}
    `;
  } catch (e) {
    el.innerHTML = `<p style="color:#f87171;font-size:13px;padding:16px 0;">통계 로드 실패: ${e.message}</p>`;
  }
}

// ── 현재 로그인한 Pi UID / Username ─────────────────────────
let currentUid = null;
export let currentUsername = '';
export function getCurrentUid() { return currentUid; }
export function getCurrentUsername() { return currentUsername; }

// ── 페이지 라우팅 ──────────────────────────────────────────
let activePage = 'quiz';
const renderedPages = new Set();
const MORE_PAGES = new Set(['rank', 'stats', 'survey']);

const PAGE_RENDERERS = {
  quiz:     (el) => renderQuizPage(el),
  tracker: async (el) => {
    const { renderTrackerPage } = await import('./page-tracker.js');
    renderTrackerPage(el, currentUsername, currentUid);
  },
  survey:   (el) => renderSurveyPage(el),
  rank:     (el) => renderRankPage(el),
  stats:    (el) => renderStatsPage(el),
  opinion:  (el) => renderOpinionPage(el),
  rpg: async (el) => {
    const { renderRpgPage } = await import('./page-rpg.js');
    renderRpgPage(el, currentUsername);
  },
};

function switchPage(pageKey) {
  document.querySelectorAll('.page').forEach(p => p.classList.add('hidden'));
  const pageEl = document.getElementById(`page-${pageKey}`);
  if (pageEl) pageEl.classList.remove('hidden');

  // 네비 하이라이트: rank/stats/survey는 더보기 버튼 표시
  document.querySelectorAll('.nav-tab').forEach(t => t.classList.remove('active'));
  if (MORE_PAGES.has(pageKey)) {
    document.getElementById('btn-more-tab')?.classList.add('active');
  } else {
    document.querySelector(`.nav-tab[data-page="${pageKey}"]`)?.classList.add('active');
  }

  activePage = pageKey;

  // quiz 탭일 때만 lives/score 표시
  const statusEl = document.getElementById('header-status');
  if (statusEl) statusEl.style.display = pageKey === 'quiz' ? '' : 'none';

  if (pageKey === 'opinion') renderedPages.delete('opinion');
  if (!renderedPages.has(pageKey)) {
    renderedPages.add(pageKey);
    PAGE_RENDERERS[pageKey]?.(pageEl);
  }
}

export function rerenderPage(pageKey) {
  renderedPages.delete(pageKey);
  switchPage(pageKey);
}

// ── 헤더 업데이트 ─────────────────────────────────────────
let _headerUsername = 'Pioneer';
let _headerUsernameClickBound = false;
export function updateHeaderUsername(name) {
  if (name) _headerUsername = name;
  const el = document.getElementById('header-username');
  if (el) {
    el.textContent = isSubscribed() ? `⭐ ${_headerUsername}` : _headerUsername;
    if (!_headerUsernameClickBound) {
      _headerUsernameClickBound = true;
      el.style.cursor = 'pointer';
      el.addEventListener('click', () => openAdminMessageDialog());
    }
  }
}

export function updateHeaderScore() {
  const el = document.getElementById('header-score');
  if (el) el.textContent = `${getScore()}${t('quiz.score_unit')}`;
}

export function updateHeaderLives() {
  const el = document.getElementById('header-lives');
  if (!el) return;
  const n = getLives();
  if (n === null) {
    el.textContent = '🔱';
  } else {
    el.textContent = '❤️'.repeat(Math.max(0, n)) || '💀';
  }
}

function applyNavLabels() {
  const quizEl     = document.getElementById('nav-label-quiz');
  const rpgEl      = document.getElementById('nav-label-rpg');
  const trackerEl  = document.getElementById('nav-label-tracker');
  const surveyEl   = document.getElementById('nav-label-survey');
  const moreEl     = document.getElementById('nav-label-more');
  const rankEl     = document.getElementById('more-label-rank');
  const statsEl    = document.getElementById('more-label-stats');
  const opinionEl  = document.getElementById('more-label-opinion');
  if (quizEl)     quizEl.textContent     = t('nav.quiz');
  if (rpgEl)      rpgEl.textContent      = t('nav.rpg');
  if (trackerEl)  trackerEl.textContent  = t('nav.tracker');
  if (surveyEl)   surveyEl.textContent   = t('nav.survey');
  if (moreEl)     moreEl.textContent     = t('nav.more');
  if (rankEl)     rankEl.textContent     = t('nav.rank');
  if (statsEl)    statsEl.textContent    = t('nav.stats');
  if (opinionEl)  opinionEl.textContent  = t('nav.opinion');
  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.textContent = `❓ ${t('btn.help')}`;
}

// ── 로그인 ────────────────────────────────────────────────
async function doLogin() {
  const btn   = document.getElementById('btn-login');
  const errEl = document.getElementById('login-error');
  btn.disabled = true;
  btn.textContent = t('login.connecting');
  if (errEl) errEl.style.display = 'none';
  try {
    const auth = await authenticate();
    const user = auth.user;
    currentUid      = user?.uid ?? user?.username ?? null;
    currentUsername = user?.username ?? 'Pioneer';

    updateHeaderUsername(currentUsername);
    document.getElementById('login-screen').classList.add('hidden');
    document.getElementById('app-screen').classList.remove('hidden');

    if (currentUid) {
      initFirebase();
      const cloudData = await loadSurveyFromFirestore(currentUid);
      if (cloudData) {
        mergeSurveyFromCloud(cloudData.answers, cloudData.completedIds);
      }
      const country = detectCountry();
      if (country && currentUsername) {
        updateLeaderboardCountry(currentUsername, country).catch(console.warn);
      }
    }

    updateHeaderScore();
    updateHeaderLives();
    applyNavLabels();
    switchPage('quiz');
    showNoticeIfNeeded();
    maybeRecordDailyStatsSnapshot();
  } catch (e) {
    btn.disabled = false;
    btn.textContent = t('login.btn');
    if (errEl) { errEl.textContent = t('login.fail'); errEl.style.display = 'block'; }
    console.error(e);
  }
}

// ── 언어 선택 ─────────────────────────────────────────────
function buildLangPicker() {
  const btn      = document.getElementById('btn-lang');
  const dropdown = document.getElementById('lang-dropdown');
  if (!btn || !dropdown) return;

  function updateBtn() {
    const cur = SUPPORTED_LANGS.find(l => l.code === getLang()) ?? SUPPORTED_LANGS[0];
    btn.innerHTML = `<span>${cur.flag}</span><span>${cur.label}</span><span class="lang-arrow">▾</span>`;
  }
  updateBtn();

  dropdown.innerHTML = SUPPORTED_LANGS.map(l => `
    <button class="lang-option ${l.code === getLang() ? 'active' : ''}" data-lang="${l.code}">
      ${l.flag} ${l.label}
    </button>
  `).join('');

  btn.addEventListener('click', (e) => {
    e.stopPropagation();
    dropdown.classList.toggle('open');
  });

  document.addEventListener('click', () => dropdown.classList.remove('open'));

  dropdown.querySelectorAll('.lang-option').forEach(opt => {
    opt.addEventListener('click', () => {
      setLang(opt.dataset.lang);
      dropdown.classList.remove('open');
      dropdown.querySelectorAll('.lang-option').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      updateBtn();
      applyNavLabels();
      // tracker는 언어 변경 시 다시 렌더
      if (activePage === 'tracker') {
        renderedPages.delete(activePage);
        switchPage(activePage);
      } else {
        rerenderPage(activePage);
      }
    });
  });
}

// ── 더보기 시트 ────────────────────────────────────────────
function openMoreSheet() {
  const sheet = document.getElementById('more-sheet');
  if (sheet) sheet.classList.remove('hidden');
}

function closeMoreSheet() {
  const sheet = document.getElementById('more-sheet');
  if (sheet) sheet.classList.add('hidden');
}

// ── 유틸모음 오버레이 ────────────────────────────────────────
function renderUtilsOverlay() {
  const panel = document.getElementById('utils-panel');
  if (!panel) return;
  panel.innerHTML = `
    <div class="utils-header">
      <span class="utils-title">🚀 Pi Hub</span>
      <button class="utils-close-btn" id="utils-close-btn">${t('btn.close')} ✕</button>
    </div>
    <div class="utils-body">

    <a class="util-card" href="#" onclick="window.open('https://apppidexutillaac6961.pinet.com/', '_hub_'+Date.now());return false;">
      <div class="util-card-icon">
        <img src="icons/pidex-util.png" width="64" height="64" style="border-radius:14px;display:block;object-fit:cover;" alt="PiDEX Util">
      </div>
      <div class="util-card-body">
        <div class="util-card-name">PiDEX Util</div>
        <div class="util-card-tags">
          <span class="util-tag">Arbitrage Finder</span>
          <span class="util-tag">LP Calculator</span>
          <span class="util-tag">Swap Simulator</span>
        </div>
        <div class="util-card-desc">${t('hub.pidex.desc')}</div>
        <div class="util-card-link">${t('hub.open')}</div>
      </div>
    </a>
    </div>
  `;

  panel.querySelector('#utils-close-btn').addEventListener('click', () => {
    document.getElementById('utils-overlay').classList.add('hidden');
  });
}

// ── 초기화 ────────────────────────────────────────────────
function initLoginScreen() {
  const titleEl = document.getElementById('login-title');
  const subEl   = document.getElementById('login-sub');
  const btn     = document.getElementById('btn-login');
  const note    = document.getElementById('login-note');
  if (titleEl) titleEl.textContent = t('app.title');
  if (subEl)   subEl.textContent   = t('login.sub');
  if (btn)     btn.textContent     = t('login.btn');
  if (note)    note.textContent    = t('login.note');
}

async function init() {
  initLang();
  initLoginScreen();
  try { await initPiSDK(); } catch (e) { console.warn('Pi SDK init:', e); }

  // 네비 탭 (quiz/rpg/tracker/survey)
  document.querySelectorAll('.nav-tab[data-page]').forEach(btn => {
    btn.addEventListener('click', () => rerenderPage(btn.dataset.page));
  });

  // 더보기 버튼
  document.getElementById('btn-more-tab')?.addEventListener('click', openMoreSheet);

  // 더보기 시트 배경 클릭 닫기
  document.getElementById('more-sheet-bg')?.addEventListener('click', closeMoreSheet);

  // 더보기 시트 아이템 (rank/stats/survey)
  document.querySelectorAll('.more-sheet-item[data-page]').forEach(btn => {
    btn.addEventListener('click', () => {
      closeMoreSheet();
      rerenderPage(btn.dataset.page);
    });
  });

  document.getElementById('btn-login').addEventListener('click', doLogin);

  const helpBtn = document.getElementById('btn-help');
  if (helpBtn) helpBtn.addEventListener('click', () => renderHelpModal());

  // 관리자 모드에서만: 좌측 상단 "QuizPi π" 클릭 시 공지창(관리자 통계 탭 포함) 오픈
  document.getElementById('header-title')?.addEventListener('click', () => {
    if (currentUsername === ADMIN_USERNAME) openNoticePopupManually();
  });

  const utilsOverlayBtn = document.getElementById('btn-intro-overlay');
  if (utilsOverlayBtn) utilsOverlayBtn.addEventListener('click', () => {
    const overlay = document.getElementById('utils-overlay');
    overlay.classList.toggle('hidden');
    if (!overlay.classList.contains('hidden')) renderUtilsOverlay();
  });

  document.getElementById('utils-overlay')?.addEventListener('click', e => {
    if (e.target === document.getElementById('utils-overlay')) {
      document.getElementById('utils-overlay').classList.add('hidden');
    }
  });

  buildLangPicker();

  window.addEventListener('sub:synced', () => updateHeaderUsername());
}

init();
