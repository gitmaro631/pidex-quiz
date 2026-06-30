export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX ควิซ',
  'nav.quiz':       'ควิซ',
  'nav.rank':       'อันดับของฉัน',
  'nav.stats':      'สถิติชุมชน',
  'btn.next':       'ถัดไป →',
  'btn.again':      'ดำเนินการต่อ',
  'btn.rank':       'ดูอันดับ',
  'btn.share':      '📤 แชร์ผลลัพธ์',
  'btn.intro':      'เกี่ยวกับ',
  'btn.help':       'ช่วยเหลือ',
  'btn.lang':       'ภาษา',
  'btn.close':      'ปิด',
  'btn.start':      'เริ่มต้น',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'ทดสอบความรู้ DEX และรับอันดับของคุณ',
  'login.btn':      'เริ่มควิซ',
  'login.note':     'สำหรับ Pi Browser เท่านั้น',
  'login.fail':     'การเชื่อมต่อล้มเหลว กรุณาลองอีกครั้ง',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'ถูกต้อง!',
  'quiz.wrong':     'ผิด',
  'quiz.see_result':'ดูผลลัพธ์',
  'quiz.session_stats': 'เซสชันนี้: {c}/{t} ถูก ({p}%)',
  'quiz.next_rank': 'ต้องการอีก {n} คะแนนถึง {label}',
  'quiz.max_rank':  '🎉 อันดับสูงสุด!',
  'quiz.allDone':   'ตอบครบทุกข้อแล้ว! 🎉',
  'quiz.start':     'เริ่มควิซ',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'เลือกโหมดเกม',
  'mode.reset.note':      'การเปลี่ยนโหมดจะรีเซ็ตชีวิตและคะแนน',
  'mode.change':          'เปลี่ยนโหมด',
  'mode.miner.desc':      'เริ่มต้น 2 ชีวิต\n+1 ชีวิตทุก 4 แบบสอบถาม\n+1 ชีวิตเมื่อดูสถิติ/อันดับ (ทุก 1 ชั่วโมง)\n+1 ชีวิตทุก 10 คำตอบที่ถูก',
  'mode.pioneer.desc':    'เริ่มต้น 2 ชีวิต\n+1 ชีวิตทุก 4 แบบสอบถาม',
  'mode.validator.desc':  'ไม่มีชีวิต\nตอบผิดหนึ่งข้อ = เกมจบทันที\nท้าทายคะแนนสูง!',
  'mode.lives.none':      'ไม่มีชีวิต',
  'mode.validator.fail':  'ผิด — โหมด Validator จบแล้ว!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'ชีวิตหมด!',
  'gameover.best':  '🎉 สถิติส่วนตัวใหม่!',
  'gameover.prev':  'สถิติดีสุด: {n} คะแนน',
  'gameover.desc':  'คะแนนของคุณจะถูกบันทึกในลีดเดอร์บอร์ด\nและเกมจะเริ่มใหม่',
  'gameover.btn':   'บันทึกลีดเดอร์บอร์ดและเริ่มใหม่',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 แบบสอบถามชุมชน',
  'survey.submit':      'ส่ง',
  'survey.skip':        'ข้าม',
  'survey.edit':        'แก้ไข',
  'survey.write':       'กรอกข้อมูล',
  'survey.back':        '← กลับไปรายการ',
  'survey.page.title':  '📋 แบบสอบถาม',
  'survey.page.desc':   'การทำแบบสอบถามจะได้รับชีวิตและมีส่วนร่วมในสถิติชุมชน',
  'survey.life.bonus':  '🎉 ทำแบบสอบถามครบ {n} ข้อ! +1 ชีวิต',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'กำลังโหลด...',
  'lb.empty':       'ยังไม่มีบันทึก',
  'lb.fail':        'โหลดไม่สำเร็จ',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'คุณอยู่ในประเทศไหน?',
  'S_COUNTRY.placeholder': '— เลือกประเทศ —',

  'S_JOIN_YEAR.q':         'คุณเข้าร่วม Pi Network เมื่อไหร่?',
  'S_JOIN_YEAR.over1year': 'มากกว่า 1 ปีที่แล้ว',
  'S_JOIN_YEAR.under1year':'น้อยกว่า 1 ปีที่แล้ว',

  'S_MINING.q':            'คุณยังขุด Pi ทุกวันอยู่ไหม?',
  'S_MINING.daily':        'ขุดทุกวัน',
  'S_MINING.sometimes':    'บางครั้งลืม',
  'S_MINING.rarely':       'แทบไม่ขุด',

  'S_KYC.q':               'สถานะ KYC (การยืนยันตัวตน) ของคุณ?',
  'S_KYC.passed':          'ผ่านแล้ว',
  'S_KYC.pending':         'ยื่นแล้วแต่รอการตรวจสอบ',
  'S_KYC.failed':          'ยื่นแล้วแต่ไม่ผ่าน',
  'S_KYC.notTried':        'ยังไม่เคยลอง',

  'S_NODE_GROUP.ecosystemMsg': 'ผู้ดำเนินการ Node คือกระดูกสันหลังของการกระจายอำนาจ Pi Network คำตอบของคุณมีส่วนร่วมโดยตรงในการพัฒนาระบบนิเวศ Pi 🌐',
  'S_NODE.q':              'คุณกำลังรัน Pi node อยู่ไหม?',
  'S_NODE.running':        'กำลังรันอยู่',
  'S_NODE.stopped':        'เคยรันแต่หยุดแล้ว',
  'S_NODE.planning':       'วางแผนจะรัน',
  'S_NODE.noInterest':     'ไม่สนใจ',

  'S_NODE_PC.q':           'คุณรันบนสภาพแวดล้อมไหน?',
  'S_NODE_PC.dedicated':   'PC node เฉพาะทาง',
  'S_NODE_PC.regular':     'PC ทั่วไป',
  'S_NODE_PC.server':      'เซิร์ฟเวอร์ / Cloud',

  'S_NODE_REASON.q':       'เหตุผลที่ไม่รัน หรือแผนในอนาคต?',
  'S_NODE_REASON.cost':    'ค่าไฟ / ค่าคอมพิวเตอร์',
  'S_NODE_REASON.unknown': 'ไม่รู้วิธี',
  'S_NODE_REASON.noNeed':  'ไม่รู้สึกว่าจำเป็น',
  'S_NODE_REASON.planSoon':'วางแผนจะเริ่มเร็วๆ นี้',

  'S_TRADE_EXP.q':         'คุณมีประสบการณ์การเทรด Pi ไหม? (เลือกหลายข้อ)',
  'S_TRADE_EXP.p2p':       'เทรด P2P โดยตรง',
  'S_TRADE_EXP.barter':    'แลกเปลี่ยนสินค้า',
  'S_TRADE_EXP.exchange':  'Exchange (OKX ฯลฯ)',
  'S_TRADE_EXP.dexApp':    'ชำระเงินในแอป Pi',
  'S_TRADE_EXP.none':      'ยังไม่มี',

  'S_CRYPTO_EXP.q':        'ประสบการณ์คริปโตทั่วไป? (เลือกหลายข้อ)',
  'S_CRYPTO_EXP.hold':     'เคยถือ BTC/ETH ฯลฯ',
  'S_CRYPTO_EXP.dex':      'เคยใช้ DEX',
  'S_CRYPTO_EXP.lp':       'เคยจัดหาสภาพคล่อง (LP)',
  'S_CRYPTO_EXP.arb':      'เคยลอง Arbitrage',
  'S_CRYPTO_EXP.none':     'ไม่มี',

  'S_INFO_SOURCE.q':        'คุณส่วนใหญ่รับข้อมูลเกี่ยวกับ Pi จากที่ไหน?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'ช่องทางการ Pi App',
  'S_INFO_SOURCE.community':'ฟอรัมชุมชน',
  'S_INFO_SOURCE.etc':      'อื่นๆ',
};
