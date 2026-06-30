export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX Quiz',
  'nav.quiz':       'Quiz',
  'nav.rank':       'Mi Rango',
  'nav.stats':      'Estadísticas de la Comunidad',
  'btn.next':       'Siguiente →',
  'btn.again':      'Continuar',
  'btn.rank':       'Ver Mi Rango',
  'btn.share':      '📤 Compartir Resultado',
  'btn.intro':      'Acerca de',
  'btn.help':       'Ayuda',
  'btn.lang':       'Idioma',
  'btn.close':      'Cerrar',
  'btn.start':      'Comenzar',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'Pon a prueba tu conocimiento DEX y obtén tu rango',
  'login.btn':      'Iniciar Quiz',
  'login.note':     'Solo para Pi Browser',
  'login.fail':     'Error de conexión. Inténtalo de nuevo.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   '¡Correcto!',
  'quiz.wrong':     'Incorrecto',
  'quiz.see_result':'Ver Resultado',
  'quiz.session_stats': 'Esta sesión: {c}/{t} correctas ({p}%)',
  'quiz.next_rank': '{n} puntos más para {label}',
  'quiz.max_rank':  '🎉 ¡Rango máximo alcanzado!',
  'quiz.allDone':   '¡Todas las preguntas respondidas! 🎉',
  'quiz.start':     'Iniciar Quiz',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'Seleccionar Modo de Juego',
  'mode.reset.note':      'Cambiar de modo reiniciará tus vidas y puntuación',
  'mode.change':          'Cambiar Modo',
  'mode.miner.desc':      '2 vidas iniciales\n+1 vida por cada 4 encuestas\n+1 vida por ver estadísticas/clasificación (cada 1 hora)\n+1 vida por cada 10 respuestas correctas',
  'mode.pioneer.desc':    '2 vidas iniciales\n+1 vida por cada 4 encuestas',
  'mode.validator.desc':  'Sin vidas\nUna respuesta incorrecta = fin del juego inmediato\n¡Desafía el puntaje más alto!',
  'mode.lives.none':      'Sin vidas',
  'mode.validator.fail':  'Incorrecto — ¡Modo Validator terminado!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': '¡Sin Vidas!',
  'gameover.best':  '🎉 ¡Nuevo Récord Personal!',
  'gameover.prev':  'Récord personal: {n} pts',
  'gameover.desc':  'Tu puntuación se registrará en el marcador\ny el juego reiniciará.',
  'gameover.btn':   'Enviar al Marcador y Reiniciar',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 Encuesta Comunitaria',
  'survey.submit':      'Enviar',
  'survey.skip':        'Omitir',
  'survey.edit':        'Editar',
  'survey.write':       'Completar',
  'survey.back':        '← Volver a la Lista',
  'survey.page.title':  '📋 Encuesta',
  'survey.page.desc':   'Completar encuestas otorga vidas y contribuye a las estadísticas de la comunidad.',
  'survey.life.bonus':  '🎉 ¡{n} encuestas completadas! +1 vida',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'Cargando...',
  'lb.empty':       'Aún no hay registros',
  'lb.fail':        'Error al cargar',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           '¿En qué país te encuentras?',
  'S_COUNTRY.placeholder': '— Seleccionar país —',

  'S_JOIN_YEAR.q':         '¿Cuándo te uniste a Pi Network?',
  'S_JOIN_YEAR.over1year': 'Hace más de 1 año',
  'S_JOIN_YEAR.under1year':'Hace menos de 1 año',

  'S_MINING.q':            '¿Todavía minas Pi cada día?',
  'S_MINING.daily':        'Minando todos los días',
  'S_MINING.sometimes':    'A veces olvido',
  'S_MINING.rarely':       'Raramente mino',

  'S_KYC.q':               '¿Cuál es tu estado de KYC (verificación de identidad)?',
  'S_KYC.passed':          'Aprobado',
  'S_KYC.pending':         'Lo intenté pero está pendiente',
  'S_KYC.failed':          'Lo intenté pero fallé',
  'S_KYC.notTried':        'Aún no lo he intentado',

  'S_NODE_GROUP.ecosystemMsg': 'Los operadores de nodos son la columna vertebral de la descentralización de Pi Network. Tus respuestas contribuyen directamente al desarrollo del ecosistema Pi 🌐',
  'S_NODE.q':              '¿Estás ejecutando un nodo Pi?',
  'S_NODE.running':        'Actualmente en ejecución',
  'S_NODE.stopped':        'Lo ejecuté pero lo detuve',
  'S_NODE.planning':       'Planeando ejecutarlo',
  'S_NODE.noInterest':     'No me interesa',

  'S_NODE_PC.q':           '¿En qué entorno lo ejecutas?',
  'S_NODE_PC.dedicated':   'PC de nodo dedicado',
  'S_NODE_PC.regular':     'PC normal',
  'S_NODE_PC.server':      'Servidor / Nube',

  'S_NODE_REASON.q':       '¿Cuál es tu razón para no ejecutarlo, o tus planes futuros?',
  'S_NODE_REASON.cost':    'Costo de electricidad / computadora',
  'S_NODE_REASON.unknown': 'No sé cómo hacerlo',
  'S_NODE_REASON.noNeed':  'No lo veo necesario',
  'S_NODE_REASON.planSoon':'Planeando comenzar pronto',

  'S_TRADE_EXP.q':         '¿Tienes experiencia en trading de Pi? (selección múltiple)',
  'S_TRADE_EXP.p2p':       'Comercio P2P directo',
  'S_TRADE_EXP.barter':    'Trueque / intercambio de bienes',
  'S_TRADE_EXP.exchange':  'Exchange (OKX, etc.)',
  'S_TRADE_EXP.dexApp':    'Pago en apps de Pi',
  'S_TRADE_EXP.none':      'Todavía no',

  'S_CRYPTO_EXP.q':        '¿Experiencia general en cripto? (selección múltiple)',
  'S_CRYPTO_EXP.hold':     'Tuve BTC/ETH, etc.',
  'S_CRYPTO_EXP.dex':      'Usé un DEX',
  'S_CRYPTO_EXP.lp':       'Proporcioné liquidez (LP)',
  'S_CRYPTO_EXP.arb':      'Intenté arbitraje',
  'S_CRYPTO_EXP.none':     'Ninguna',

  'S_INFO_SOURCE.q':        '¿Dónde obtienes principalmente información sobre Pi?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Canal oficial de Pi App',
  'S_INFO_SOURCE.community':'Foro de la comunidad',
  'S_INFO_SOURCE.etc':      'Otro',
};
