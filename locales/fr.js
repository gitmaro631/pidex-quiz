export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX Quiz',
  'nav.quiz':       'Quiz',
  'nav.rank':       'Mon Rang',
  'nav.stats':      'Statistiques de la Communauté',
  'btn.next':       'Suivant →',
  'btn.again':      'Continuer',
  'btn.rank':       'Voir Mon Rang',
  'btn.share':      '📤 Partager le Résultat',
  'btn.intro':      'À propos',
  'btn.help':       'Aide',
  'btn.lang':       'Langue',
  'btn.close':      'Fermer',
  'btn.start':      'Commencer',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'Testez vos connaissances DEX et obtenez votre rang',
  'login.btn':      'Démarrer le Quiz',
  'login.note':     'Uniquement pour Pi Browser',
  'login.fail':     'Échec de connexion. Veuillez réessayer.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'Correct !',
  'quiz.wrong':     'Incorrect',
  'quiz.see_result':'Voir le Résultat',
  'quiz.session_stats': 'Cette session : {c}/{t} correctes ({p}%)',
  'quiz.next_rank': '{n} points pour atteindre {label}',
  'quiz.max_rank':  '🎉 Rang maximum atteint !',
  'quiz.allDone':   'Toutes les questions répondues ! 🎉',
  'quiz.start':     'Démarrer le Quiz',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'Sélectionner le Mode de Jeu',
  'mode.reset.note':      'Changer de mode réinitialisera vos vies et votre score',
  'mode.change':          'Changer de Mode',
  'mode.miner.desc':      '2 vies initiales\n+1 vie par 4 sondages\n+1 vie par consultation des statistiques/classement (toutes les 1 heure)\n+1 vie par 10 réponses correctes',
  'mode.pioneer.desc':    '2 vies initiales\n+1 vie par 4 sondages',
  'mode.validator.desc':  'Aucune vie\nUne mauvaise réponse = fin de jeu immédiate\nDéfiez le score le plus élevé !',
  'mode.lives.none':      'Aucune vie',
  'mode.validator.fail':  'Incorrect — Mode Validator terminé !',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'Plus de Vies !',
  'gameover.best':  '🎉 Nouveau Record Personnel !',
  'gameover.prev':  'Meilleur score : {n} pts',
  'gameover.desc':  'Votre score sera enregistré dans le classement\net le jeu recommencera.',
  'gameover.btn':   'Soumettre au Classement et Recommencer',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 Sondage Communautaire',
  'survey.submit':      'Soumettre',
  'survey.skip':        'Passer',
  'survey.edit':        'Modifier',
  'survey.write':       'Remplir',
  'survey.back':        '← Retour à la Liste',
  'survey.page.title':  '📋 Sondage',
  'survey.page.desc':   'Compléter des sondages octroie des vies et contribue aux statistiques de la communauté.',
  'survey.life.bonus':  '🎉 {n} sondages terminés ! +1 vie',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'Chargement...',
  'lb.empty':       'Aucun enregistrement pour l\'instant',
  'lb.fail':        'Échec du chargement',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'Dans quel pays êtes-vous ?',
  'S_COUNTRY.placeholder': '— Sélectionner un pays —',

  'S_JOIN_YEAR.q':         'Quand avez-vous rejoint Pi Network ?',
  'S_JOIN_YEAR.over1year': 'Il y a plus d\'un an',
  'S_JOIN_YEAR.under1year':'Il y a moins d\'un an',

  'S_MINING.q':            'Minez-vous encore Pi chaque jour ?',
  'S_MINING.daily':        'Mining tous les jours',
  'S_MINING.sometimes':    'Parfois j\'oublie',
  'S_MINING.rarely':       'Rarement',

  'S_KYC.q':               'Quel est votre statut KYC (vérification d\'identité) ?',
  'S_KYC.passed':          'Approuvé',
  'S_KYC.pending':         'Essayé mais en attente',
  'S_KYC.failed':          'Essayé mais échoué',
  'S_KYC.notTried':        'Pas encore essayé',

  'S_NODE_GROUP.ecosystemMsg': 'Les opérateurs de nœuds sont l\'épine dorsale de la décentralisation de Pi Network. Vos réponses contribuent directement au développement de l\'écosystème Pi 🌐',
  'S_NODE.q':              'Exécutez-vous un nœud Pi ?',
  'S_NODE.running':        'En cours d\'exécution',
  'S_NODE.stopped':        'L\'ai exécuté mais arrêté',
  'S_NODE.planning':       'Prévu de l\'exécuter',
  'S_NODE.noInterest':     'Pas intéressé',

  'S_NODE_PC.q':           'Dans quel environnement l\'exécutez-vous ?',
  'S_NODE_PC.dedicated':   'PC de nœud dédié',
  'S_NODE_PC.regular':     'PC normal',
  'S_NODE_PC.server':      'Serveur / Cloud',

  'S_NODE_REASON.q':       'Quelle est la raison de ne pas l\'exécuter, ou vos plans futurs ?',
  'S_NODE_REASON.cost':    'Coût d\'électricité / ordinateur',
  'S_NODE_REASON.unknown': 'Je ne sais pas comment',
  'S_NODE_REASON.noNeed':  'Je n\'en vois pas le besoin',
  'S_NODE_REASON.planSoon':'Prévu de commencer bientôt',

  'S_TRADE_EXP.q':         'Avez-vous de l\'expérience en trading de Pi ? (choix multiples)',
  'S_TRADE_EXP.p2p':       'Trade P2P direct',
  'S_TRADE_EXP.barter':    'Troc / échange de biens',
  'S_TRADE_EXP.exchange':  'Exchange (OKX, etc.)',
  'S_TRADE_EXP.dexApp':    'Paiement dans les apps Pi',
  'S_TRADE_EXP.none':      'Pas encore',

  'S_CRYPTO_EXP.q':        'Expérience générale en crypto ? (choix multiples)',
  'S_CRYPTO_EXP.hold':     'Détenu du BTC/ETH, etc.',
  'S_CRYPTO_EXP.dex':      'Utilisé un DEX',
  'S_CRYPTO_EXP.lp':       'Fourni de la liquidité (LP)',
  'S_CRYPTO_EXP.arb':      'Tenté l\'arbitrage',
  'S_CRYPTO_EXP.none':     'Aucune',

  'S_INFO_SOURCE.q':        'Où obtenez-vous principalement des informations sur Pi ?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Canal officiel Pi App',
  'S_INFO_SOURCE.community':'Forum de la communauté',
  'S_INFO_SOURCE.etc':      'Autre',
};
