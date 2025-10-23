// ABOUTME: Page component for handling admin approval/rejection actions from email links
// ABOUTME: Shows loading state, executes action, and displays success/error feedback

import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useApproveSignupMutation } from '../hooks/mutations/useApproveSignupMutation'
import { useRejectSignupMutation } from '../hooks/mutations/useRejectSignupMutation'
import { Button } from '@/components/ui/button'
import { CheckCircle2, XCircle, Loader2, ArrowLeft } from 'lucide-react'

type ActionType = 'approve' | 'reject'

export function ApprovalActionPage() {
  const { action, token } = useParams<{ action: ActionType; token: string }>()
  const navigate = useNavigate()
  const [isProcessing, setIsProcessing] = useState(true)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)

  const approveMutation = useApproveSignupMutation()
  const rejectMutation = useRejectSignupMutation()

  useEffect(() => {
    if (!token || !action) {
      setResult({ success: false, message: 'Invalid approval link' })
      setIsProcessing(false)
      return
    }

    const executeAction = async () => {
      try {
        if (action === 'approve') {
          await approveMutation.mutateAsync({ token })
          setResult({
            success: true,
            message: 'Solicitud aprobada correctamente. El usuario recibirá un email con el enlace de acceso.'
          })
        } else if (action === 'reject') {
          await rejectMutation.mutateAsync({ token })
          setResult({
            success: true,
            message: 'Solicitud rechazada. El usuario ha sido notificado por email.'
          })
        }
      } catch (error: any) {
        setResult({
          success: false,
          message: error.message || 'Error al procesar la solicitud'
        })
      } finally {
        setIsProcessing(false)
      }
    }

    executeAction()
  }, [token, action])

  if (isProcessing) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center">
          <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Procesando solicitud...
          </h1>
          <p className="text-gray-600">
            Por favor, espera un momento mientras procesamos la {action === 'approve' ? 'aprobación' : 'rechazo'}.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-6">
          {result?.success ? (
            <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
          ) : (
            <XCircle className="w-20 h-20 text-red-500 mx-auto mb-4" />
          )}

          <h1 className={`text-2xl font-bold mb-2 ${result?.success ? 'text-green-700' : 'text-red-700'}`}>
            {result?.success ? '¡Acción completada!' : 'Error'}
          </h1>

          <p className="text-gray-700 text-lg">
            {result?.message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Button
            onClick={() => navigate('/admin/pending-signups')}
            className="w-full"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Ver solicitudes pendientes
          </Button>

          <Button
            onClick={() => navigate('/dashboard')}
            variant="outline"
            className="w-full"
          >
            Ir al dashboard
          </Button>
        </div>
      </div>
    </div>
  )
}
