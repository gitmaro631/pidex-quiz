export default {
  // ── App common ────────────────────────────────────────
  'app.title':      'PiDEX Quiz',
  'nav.quiz':       'Quiz',
  'nav.rank':       'Minha Classificação',
  'nav.stats':      'Estatísticas da Comunidade',
  'btn.next':       'Próximo →',
  'btn.again':      'Continuar',
  'btn.rank':       'Ver Classificação',
  'btn.share':      '📤 Compartilhar Resultado',
  'btn.intro':      'Sobre',
  'btn.help':       'Ajuda',
  'btn.lang':       'Idioma',
  'btn.close':      'Fechar',
  'btn.start':      'Começar',

  // ── Login ─────────────────────────────────────────────
  'login.sub':      'Teste seu conhecimento em DEX e ganhe sua classificação',
  'login.btn':      'Iniciar Quiz',
  'login.note':     'Apenas para Pi Browser',
  'login.fail':     'Falha na conexão. Por favor, tente novamente.',

  // ── Quiz ─────────────────────────────────────────────
  'quiz.correct':   'Correto!',
  'quiz.wrong':     'Errado',
  'quiz.see_result':'Ver Resultado',
  'quiz.session_stats': 'Esta sessão: {c}/{t} corretas ({p}%)',
  'quiz.next_rank': '{n} pontos para {label}',
  'quiz.max_rank':  '🎉 Classificação máxima!',
  'quiz.allDone':   'Todas as perguntas respondidas! 🎉',
  'quiz.start':     'Iniciar Quiz',

  // ── Mode ─────────────────────────────────────────────
  'mode.select.title':    'Selecionar Modo de Jogo',
  'mode.reset.note':      'Mudar o modo reiniciará suas vidas e pontuação',
  'mode.change':          'Mudar Modo',
  'mode.miner.desc':      '2 vidas iniciais\n+1 vida a cada 4 pesquisas\n+1 vida ao ver estatísticas/classificação (a cada 1 hora)\n+1 vida a cada 10 respostas corretas',
  'mode.pioneer.desc':    '2 vidas iniciais\n+1 vida a cada 4 pesquisas',
  'mode.validator.desc':  'Sem vidas\nUma resposta errada = fim imediato do jogo\nDesafie a pontuação mais alta!',
  'mode.lives.none':      'Sem vidas',
  'mode.validator.fail':  'Errado — Modo Validator encerrado!',

  // ── Game over ─────────────────────────────────────────
  'gameover.title': 'Sem Vidas!',
  'gameover.best':  '🎉 Novo Recorde Pessoal!',
  'gameover.prev':  'Melhor pontuação: {n} pts',
  'gameover.desc':  'Sua pontuação será registrada no placar\ne o jogo reiniciará.',
  'gameover.btn':   'Enviar ao Placar e Reiniciar',

  // ── Survey ───────────────────────────────────────────
  'survey.badge':       '📋 Pesquisa da Comunidade',
  'survey.submit':      'Enviar',
  'survey.skip':        'Pular',
  'survey.edit':        'Editar',
  'survey.write':       'Preencher',
  'survey.back':        '← Voltar à Lista',
  'survey.page.title':  '📋 Pesquisa',
  'survey.page.desc':   'Completar pesquisas concede vidas e contribui para as estatísticas da comunidade.',
  'survey.life.bonus':  '🎉 {n} pesquisas concluídas! +1 vida',

  // ── Leaderboard ──────────────────────────────────────
  'lb.loading':     'Carregando...',
  'lb.empty':       'Nenhum registro ainda',
  'lb.fail':        'Falha ao carregar',

  // ── Survey questions ──────────────────────────────────
  'S_COUNTRY.q':           'Em qual país você está?',
  'S_COUNTRY.placeholder': '— Selecionar país —',

  'S_JOIN_YEAR.q':         'Quando você se juntou à Pi Network?',
  'S_JOIN_YEAR.over1year': 'Há mais de 1 ano',
  'S_JOIN_YEAR.under1year':'Há menos de 1 ano',

  'S_MINING.q':            'Você ainda minera Pi todos os dias?',
  'S_MINING.daily':        'Minerando todos os dias',
  'S_MINING.sometimes':    'Às vezes esqueço',
  'S_MINING.rarely':       'Raramente minero',

  'S_KYC.q':               'Qual é o seu status de KYC (verificação de identidade)?',
  'S_KYC.passed':          'Aprovado',
  'S_KYC.pending':         'Tentei mas está pendente',
  'S_KYC.failed':          'Tentei mas falhei',
  'S_KYC.notTried':        'Ainda não tentei',

  'S_NODE_GROUP.ecosystemMsg': 'Os operadores de nós são a espinha dorsal da descentralização da Pi Network. Suas respostas contribuem diretamente para o desenvolvimento do ecossistema Pi 🌐',
  'S_NODE.q':              'Você está executando um nó Pi?',
  'S_NODE.running':        'Atualmente em execução',
  'S_NODE.stopped':        'Executei mas parei',
  'S_NODE.planning':       'Planejando executar',
  'S_NODE.noInterest':     'Não tenho interesse',

  'S_NODE_PC.q':           'Em qual ambiente você o executa?',
  'S_NODE_PC.dedicated':   'PC de nó dedicado',
  'S_NODE_PC.regular':     'PC comum',
  'S_NODE_PC.server':      'Servidor / Nuvem',

  'S_NODE_REASON.q':       'Qual é o motivo de não executar, ou seus planos futuros?',
  'S_NODE_REASON.cost':    'Custo de eletricidade / computador',
  'S_NODE_REASON.unknown': 'Não sei como fazer',
  'S_NODE_REASON.noNeed':  'Não sinto necessidade',
  'S_NODE_REASON.planSoon':'Planejando começar em breve',

  'S_TRADE_EXP.q':         'Você tem experiência em trading de Pi? (múltipla escolha)',
  'S_TRADE_EXP.p2p':       'Trade P2P direto',
  'S_TRADE_EXP.barter':    'Troca / permuta de bens',
  'S_TRADE_EXP.exchange':  'Exchange (OKX, etc.)',
  'S_TRADE_EXP.dexApp':    'Pagamento em apps Pi',
  'S_TRADE_EXP.none':      'Ainda não',

  'S_CRYPTO_EXP.q':        'Experiência geral em cripto? (múltipla escolha)',
  'S_CRYPTO_EXP.hold':     'Tive BTC/ETH, etc.',
  'S_CRYPTO_EXP.dex':      'Usei um DEX',
  'S_CRYPTO_EXP.lp':       'Forneci liquidez (LP)',
  'S_CRYPTO_EXP.arb':      'Tentei arbitragem',
  'S_CRYPTO_EXP.none':     'Nenhuma',

  'S_INFO_SOURCE.q':        'Onde você obtém principalmente informações sobre Pi?',
  'S_INFO_SOURCE.youtube':  'YouTube',
  'S_INFO_SOURCE.telegram': 'Telegram',
  'S_INFO_SOURCE.piApp':    'Canal oficial do Pi App',
  'S_INFO_SOURCE.community':'Fórum da comunidade',
  'S_INFO_SOURCE.etc':      'Outro',
};
