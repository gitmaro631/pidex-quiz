export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX Викторина',
  'nav.quiz':       'Викторина',
  'nav.rank':       'Мой Ранг',
  'nav.stats':      'Статистика Сообщества',
  'btn.next':       'Далее →',
  'btn.again':      'Продолжить',
  'btn.rank':       'Посмотреть Ранг',
  'btn.share':      '📤 Поделиться Результатом',
  'btn.intro':      'О приложении',
  'btn.help':       'Помощь',
  'btn.lang':       'Язык',
  'btn.close':      'Закрыть',
  'btn.start':      'Начать',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'Проверьте знания DEX и получите свой ранг',
  'login.btn':      'Начать Викторину',
  'login.note':     'Только для Pi Browser',
  'login.fail':     'Ошибка подключения. Попробуйте снова.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'Правильно!',
  'quiz.wrong':     'Неправильно',
  'quiz.see_result':'Посмотреть Результат',
  'quiz.session_stats': 'Эта сессия: {c}/{t} правильных ({p}%)',
  'quiz.next_rank': 'Ещё {n} очков до {label}',
  'quiz.max_rank':  '🎉 Максимальный ранг достигнут!',
  'quiz.allDone':   'Все вопросы завершены! 🎉',
  'quiz.start':     'Начать Викторину',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'Выбрать Режим Игры',
  'mode.reset.note':      'Смена режима сбросит жизни и очки',
  'mode.change':          'Сменить Режим',
  'mode.miner.desc':      '2 начальные жизни\n+1 жизнь за каждые 4 опроса\n+1 жизнь за просмотр статистики/рейтинга (каждый 1 час)\n+1 жизнь за каждые 10 правильных ответов',
  'mode.pioneer.desc':    '2 начальные жизни\n+1 жизнь за каждые 4 опроса',
  'mode.validator.desc':  'Без жизней\nОдин неправильный ответ = немедленный конец игры\nПобедите в соревновании за высокий счёт!',
  'mode.lives.none':      'Без жизней',
  'mode.validator.fail':  'Неправильно — Режим Validator завершён!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'Жизни Закончились!',
  'gameover.best':  '🎉 Новый Личный Рекорд!',
  'gameover.prev':  'Личный рекорд: {n} очков',
  'gameover.desc':  'Ваш счёт будет добавлен в таблицу лидеров\nи игра начнётся заново.',
  'gameover.btn':   'Отправить в Таблицу Лидеров и Начать Снова',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 Опрос Сообщества',
  'survey.submit':      'Отправить',
  'survey.skip':        'Пропустить',
  'survey.edit':        'Редактировать',
  'survey.write':       'Заполнить',
  'survey.back':        '← Вернуться к Списку',
  'survey.page.title':  '📋 Опрос',
  'survey.page.desc':   'Участие в опросах даёт жизни и вносит вклад в статистику сообщества.',
  'survey.life.bonus':  '🎉 Завершено {n} опросов! +1 жизнь',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'Загрузка...',
  'lb.empty':       'Записей пока нет',
  'lb.fail':        'Ошибка загрузки',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'В какой стране вы находитесь?',
  'S_COUNTRY.placeholder': '— Выберите страну —',

  'S_JOIN_YEAR.q':         'Когда вы присоединились к Pi Network?',
  'S_JOIN_YEAR.over1year': 'Более 1 года назад',
  'S_JOIN_YEAR.under1year':'Менее 1 года назад',

  'S_MINING.q':            'Вы всё ещё майните Pi каждый день?',
  'S_MINING.daily':        'Майню каждый день',
  'S_MINING.sometimes':    'Иногда забываю',
  'S_MINING.rarely':       'Редко майню',

  'S_KYC.q':               'Каков ваш статус KYC (верификации личности)?',
  'S_KYC.passed':          'Пройдено',
  'S_KYC.pending':         'Пробовал, но ожидаю',
  'S_KYC.failed':          'Пробовал, но не прошёл',
  'S_KYC.notTried':        'Ещё не пробовал',

  'S_NODE_GROUP.ecosystemMsg': 'Операторы нод — основа децентрализации Pi Network. Ваши ответы напрямую способствуют развитию экосистемы Pi 🌐',
  'S_NODE.q':              'Вы запускаете ноду Pi?',
  'S_NODE.running':        'В настоящее время работает',
  'S_NODE.stopped':        'Запускал, но остановил',
  'S_NODE.planning':       'Планирую запустить',
  'S_NODE.noInterest':     'Не интересуюсь',

  'S_NODE_PC.q':           'В какой среде вы её запускаете?',
  'S_NODE_PC.dedicated':   'Выделенный ПК для ноды',
  'S_NODE_PC.regular':     'Обычный ПК',
  'S_NODE_PC.server':      'Сервер / Облако',

  'S_NODE_REASON.q':       'Причина незапуска или будущие планы?',
  'S_NODE_REASON.cost':    'Стоимость электричества / компьютера',
  'S_NODE_REASON.unknown': 'Не знаю, как это сделать',
  'S_NODE_REASON.noNeed':  'Не чувствую необходимости',
  'S_NODE_REASON.planSoon':'Планирую начать скоро',

  'S_TRADE_EXP.q':         'Есть ли у вас опыт торговли Pi? (несколько вариантов)',
  'S_TRADE_EXP.p2p':       'Прямая P2P торговля',
  'S_TRADE_EXP.barter':    'Бартер / обмен товарами',
  'S_TRADE_EXP.exchange':  'Биржа (OKX и др.)',
  'S_TRADE_EXP.dexApp':    'Оплата в приложениях Pi',
  'S_TRADE_EXP.none':      'Пока нет',

  'S_CRYPTO_EXP.q':        'Общий опыт с криптовалютами? (несколько вариантов)',
  'S_CRYPTO_EXP.hold':     'Держал BTC/ETH и т.д.',
  'S_CRYPTO_EXP.dex':      'Использовал DEX',
  'S_CRYPTO_EXP.lp':       'Предоставлял ликвидность (LP)',
  'S_CRYPTO_EXP.arb':      'Пробовал арбитраж',
  'S_CRYPTO_EXP.none':     'Нет',

  'S_INFO_SOURCE.q':        'Где вы в основном получаете информацию о Pi?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Официальный канал Pi App',
  'S_INFO_SOURCE.community':'Форум сообщества',
  'S_INFO_SOURCE.etc':      'Другое',
};
