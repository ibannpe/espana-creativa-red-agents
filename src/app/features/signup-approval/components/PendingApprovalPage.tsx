// ABOUTME: Pending approval page component showing status while waiting for admin approval
// ABOUTME: Displays informational message with timeline and next steps for the user

export function PendingApprovalPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 md:p-12 space-y-8">
          {/* Icon */}
          <div className="flex justify-center">
            <div className="w-20 h-20 bg-yellow-100 rounded-full flex items-center justify-center">
              <svg className="w-10 h-10 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Title */}
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-3">
              Solicitud en Revisión
            </h1>
            <p className="text-lg text-gray-600">
              Tu solicitud de acceso está siendo revisada por nuestro equipo
            </p>
          </div>

          {/* Info Cards */}
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-blue-900 mb-2">
                ⏰ Tiempo de Respuesta
              </h3>
              <p className="text-blue-800">
                Nuestro equipo revisará tu solicitud en las próximas <strong>24-48 horas</strong>.
                Te enviaremos un correo electrónico tan pronto como tu cuenta sea aprobada.
              </p>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                📧 Revisa tu Email
              </h3>
              <p className="text-green-800">
                Una vez aprobada, recibirás un <strong>enlace mágico</strong> para acceder a tu cuenta
                por primera vez. El enlace será válido por 1 hora.
              </p>
            </div>

            <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-purple-900 mb-2">
                ✨ ¿Qué sigue?
              </h3>
              <ul className="text-purple-800 space-y-2 list-disc list-inside">
                <li>Recibirás un email de confirmación cuando seas aprobado</li>
                <li>Haz clic en el enlace para crear tu cuenta</li>
                <li>Completa tu perfil y empieza a conectar con la comunidad</li>
              </ul>
            </div>
          </div>

          {/* Help Section */}
          <div className="border-t border-gray-200 pt-6">
            <p className="text-center text-gray-600 text-sm">
              ¿Tienes alguna pregunta? Contáctanos en{' '}
              <a href="mailto:info@espanacreativa.org" className="text-primary font-semibold hover:underline">
                info@espanacreativa.org
              </a>
            </p>
          </div>

          {/* Return Button */}
          <div className="flex justify-center">
            <button
              onClick={() => window.location.href = '/'}
              className="modern-button modern-button-outline"
            >
              Volver al Inicio
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
