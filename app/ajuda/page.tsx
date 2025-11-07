import { auth } from '@/lib/auth'
import { getCurrentUserProfile } from '@/lib/queries/profiles'
import { getAllTiers } from '@/lib/queries/subscriptions'
import { Navbar } from '@/components/layout/navbar'
import Link from 'next/link'

export default async function HelpPage() {
  // Handle potential JWT session errors gracefully
  let session = null
  let profile = null
  let isAdmin = false
  let allTiers: any[] = []

  try {
    session = await auth()
    if (session?.user) {
      profile = await getCurrentUserProfile()
      isAdmin = session.user.isAdmin || false
      allTiers = await getAllTiers()
    }
  } catch (error) {
    console.warn('Session error:', error)
  }

  const helpSections = [
    {
      id: 'getting-started',
      title: 'Como Começar',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
        </svg>
      ),
      items: [
        {
          question: 'Como criar uma conta?',
          answer: 'Clique em "Começar grátis" na página inicial ou acesse a página de cadastro. Preencha seus dados e confirme seu email. Você terá acesso imediato ao plano gratuito.',
        },
        {
          question: 'Como fazer login?',
          answer: 'Use o email e senha cadastrados na página de login. Se esqueceu sua senha, entre em contato com o suporte.',
        },
        {
          question: 'O que está incluído no plano gratuito?',
          answer: 'O plano gratuito oferece acesso a cursos básicos e materiais limitados. Para desbloquear todo o conteúdo, considere fazer upgrade para um plano pago.',
        },
      ],
    },
    {
      id: 'navigation',
      title: 'Navegação na Plataforma',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
      items: [
        {
          question: 'O que é o Dashboard?',
          answer: 'O Dashboard é sua página inicial após o login. Lá você encontra seu progresso geral, cursos em andamento, favoritos, certificados e acesso rápido aos seus materiais.',
        },
        {
          question: 'Como acessar meus cursos?',
          answer: 'Clique em "Cursos" no menu de navegação. Você verá todos os cursos disponíveis e pode filtrar por categoria, nível ou buscar por palavras-chave.',
        },
        {
          question: 'O que é a Biblioteca?',
          answer: 'A Biblioteca contém todos os arquivos e materiais disponíveis para download, como PDFs, apresentações e templates. Você pode filtrar por tipo, tier ou buscar arquivos específicos.',
        },
        {
          question: 'Como acessar meu perfil?',
          answer: 'Clique no seu nome no canto superior direito da navegação para acessar seu perfil. Lá você pode editar suas informações e ver suas estatísticas.',
        },
      ],
    },
    {
      id: 'courses',
      title: 'Cursos e Progresso',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
      items: [
        {
          question: 'Como assistir às aulas?',
          answer: 'Acesse um curso e clique na lição desejada. O player de vídeo abrirá automaticamente. Você pode pausar, avançar e ajustar a velocidade de reprodução.',
        },
        {
          question: 'Meu progresso é salvo automaticamente?',
          answer: 'Sim! Seu progresso é salvo automaticamente quando você assiste às aulas. Você pode retomar de onde parou a qualquer momento.',
        },
        {
          question: 'Como marcar um curso como favorito?',
          answer: 'Na página do curso, clique no ícone de estrela para adicionar aos favoritos. Você pode acessar seus cursos favoritos no Dashboard.',
        },
        {
          question: 'Como baixar materiais do curso?',
          answer: 'Na página do curso, você encontrará uma seção de anexos com materiais disponíveis para download. Clique no arquivo desejado para baixar.',
        },
        {
          question: 'O que são os módulos e lições?',
          answer: 'Os cursos são organizados em módulos, e cada módulo contém várias lições. Complete as lições em ordem para ter uma experiência de aprendizado estruturada.',
        },
      ],
    },
    {
      id: 'files',
      title: 'Biblioteca de Arquivos',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
      ),
      items: [
        {
          question: 'Como acessar os arquivos?',
          answer: 'Acesse a seção "Biblioteca" no menu. Lá você encontrará todos os arquivos disponíveis, organizados por tipo e tier.',
        },
        {
          question: 'Posso visualizar arquivos antes de baixar?',
          answer: 'Sim! Clique em um arquivo para abrir o visualizador. Você pode visualizar PDFs, imagens e outros formatos suportados diretamente no navegador.',
        },
        {
          question: 'Quais tipos de arquivo são suportados?',
          answer: 'A plataforma suporta PDFs, imagens, documentos e outros formatos comuns. O visualizador funciona melhor com PDFs e imagens.',
        },
        {
          question: 'Por que alguns arquivos não estão disponíveis?',
          answer: 'Alguns arquivos podem estar restritos ao seu tier atual. Faça upgrade do seu plano para acessar mais conteúdo.',
        },
      ],
    },
    {
      id: 'subscriptions',
      title: 'Planos e Assinaturas',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
        </svg>
      ),
      items: [
        {
          question: 'Como assinar um plano?',
          answer: 'Acesse a página "Planos" no menu. Escolha o plano desejado e clique em "Assinar". Você será redirecionado para o checkout seguro do Stripe.',
        },
        {
          question: 'Quais métodos de pagamento são aceitos?',
          answer: 'Aceitamos cartões de crédito e débito através do Stripe. O pagamento é processado de forma segura e criptografada.',
        },
        {
          question: 'Posso cancelar minha assinatura?',
          answer: 'Sim! Você pode cancelar sua assinatura a qualquer momento. Você continuará tendo acesso até o final do período pago.',
        },
        {
          question: 'Como fazer upgrade de plano?',
          answer: 'Acesse a página "Planos" e escolha um plano superior. Ao fazer upgrade, você terá acesso imediato aos novos recursos.',
        },
        {
          question: 'O que acontece se eu não renovar?',
          answer: 'Se você não renovar, seu acesso será reduzido ao plano gratuito ao final do período pago. Você não perderá seu progresso nos cursos.',
        },
      ],
    },
    {
      id: 'certificates',
      title: 'Certificados',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
        </svg>
      ),
      items: [
        {
          question: 'Como obter um certificado?',
          answer: 'Complete 100% do curso para receber automaticamente um certificado. Você será notificado quando o certificado estiver disponível.',
        },
        {
          question: 'Onde vejo meus certificados?',
          answer: 'Seus certificados aparecem no Dashboard e na página do seu Perfil. Você pode visualizar e baixar seus certificados a qualquer momento.',
        },
        {
          question: 'Os certificados são válidos?',
          answer: 'Sim! Nossos certificados são válidos e podem ser compartilhados no LinkedIn e incluídos no seu currículo.',
        },
        {
          question: 'Posso baixar meus certificados?',
          answer: 'Sim! Clique no certificado para visualizar e baixar em formato PDF. Você pode salvar e imprimir quantas cópias precisar.',
        },
      ],
    },
    {
      id: 'troubleshooting',
      title: 'Problemas Comuns',
      icon: (
        <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      ),
      items: [
        {
          question: 'O vídeo não está carregando',
          answer: 'Verifique sua conexão com a internet. Tente atualizar a página ou limpar o cache do navegador. Se o problema persistir, entre em contato com o suporte.',
        },
        {
          question: 'Não consigo fazer login',
          answer: 'Verifique se está usando o email e senha corretos. Se esqueceu sua senha, entre em contato com o suporte. Certifique-se de que as cookies estão habilitadas no navegador.',
        },
        {
          question: 'Meu progresso não está sendo salvo',
          answer: 'Certifique-se de que está logado e que sua conexão com a internet está estável. Tente atualizar a página. Se o problema persistir, entre em contato.',
        },
        {
          question: 'Não consigo baixar arquivos',
          answer: 'Verifique se você tem permissão para acessar o arquivo (verifique seu tier). Tente usar um navegador diferente ou desabilite bloqueadores de pop-up.',
        },
        {
          question: 'A página está lenta',
          answer: 'Tente limpar o cache do navegador, fechar outras abas e verificar sua conexão. Se o problema persistir, pode ser um problema temporário do servidor.',
        },
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-gray-50">
      {session?.user && profile ? (
        <Navbar
          userName={profile.name || null}
          currentPath="/ajuda"
          isAdmin={isAdmin}
          currentTierId={profile.tier_id}
          tiers={allTiers}
        />
      ) : (
        <nav className="border-b border-gray-200 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
            <div className="flex h-16 items-center justify-between">
              <Link href="/" className="flex items-center space-x-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600">
                  <svg
                    className="h-6 w-6 text-white"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <span className="text-xl font-bold text-gray-900">EduPlanner</span>
              </Link>
              <div className="flex items-center space-x-4">
                <Link
                  href="/login"
                  className="text-sm font-medium text-gray-700 hover:text-purple-600 transition-colors"
                >
                  Entrar
                </Link>
                <Link
                  href="/signup"
                  className="rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-4 py-2 text-sm font-semibold text-white transition-all hover:from-purple-700 hover:to-indigo-700"
                >
                  Começar grátis
                </Link>
              </div>
            </div>
          </div>
        </nav>
      )}

      {/* Header */}
      <div className="bg-gradient-to-br from-purple-600 via-indigo-600 to-blue-600">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-white mb-4 sm:text-5xl">
              Central de Ajuda
            </h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Encontre respostas para suas dúvidas e aprenda a usar todas as funcionalidades da plataforma
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
        {/* Quick Links */}
        <div className="mb-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <Link
            href="/dashboard"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Dashboard</h3>
            </div>
            <p className="text-sm text-gray-600">Acesse seu painel principal</p>
          </Link>

          <Link
            href="/courses"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Cursos</h3>
            </div>
            <p className="text-sm text-gray-600">Explore nossos cursos</p>
          </Link>

          <Link
            href="/plans"
            className="bg-white rounded-xl p-6 border border-gray-200 hover:border-purple-300 hover:shadow-lg transition-all group"
          >
            <div className="flex items-center space-x-3 mb-2">
              <div className="p-2 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <svg className="h-6 w-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">Planos</h3>
            </div>
            <p className="text-sm text-gray-600">Veja nossos planos</p>
          </Link>
        </div>

        {/* Help Sections */}
        <div className="space-y-8">
          {helpSections.map((section, sectionIndex) => (
            <div
              key={section.id}
              id={section.id}
              className="bg-white rounded-xl border border-gray-200 p-6 sm:p-8 animate-fade-in"
              style={{ animationDelay: `${sectionIndex * 0.1}s` }}
            >
              <div className="flex items-center space-x-3 mb-6">
                <div className="p-2 bg-purple-100 rounded-lg">
                  <div className="text-purple-600">{section.icon}</div>
                </div>
                <h2 className="text-2xl font-bold text-gray-900">{section.title}</h2>
              </div>

              <div className="space-y-6">
                {section.items.map((item, itemIndex) => (
                  <div key={itemIndex} className="border-b border-gray-100 last:border-0 pb-6 last:pb-0">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 flex items-start">
                      <span className="mr-2 text-purple-600">•</span>
                      {item.question}
                    </h3>
                    <p className="text-gray-600 ml-5">{item.answer}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Contact Section */}
        <div className="mt-12 bg-gradient-to-br from-purple-50 to-indigo-50 rounded-xl border border-purple-200 p-8">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Ainda precisa de ajuda?</h2>
            <p className="text-gray-600 mb-6 max-w-2xl mx-auto">
              Se você não encontrou a resposta que procurava, entre em contato com nossa equipe de suporte.
              Estamos aqui para ajudar!
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a
                href="mailto:suporte@eduplanner.com"
                className="inline-flex items-center space-x-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-3 text-sm font-semibold text-white hover:from-purple-700 hover:to-indigo-700 transition-all"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                <span>Enviar Email</span>
              </a>
              {session?.user ? (
                <Link
                  href="/dashboard"
                  className="inline-flex items-center space-x-2 rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
                >
                  <span>Voltar ao Dashboard</span>
                </Link>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex items-center space-x-2 rounded-lg border-2 border-purple-600 px-6 py-3 text-sm font-semibold text-purple-600 hover:bg-purple-50 transition-all"
                >
                  <span>Fazer Login</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

