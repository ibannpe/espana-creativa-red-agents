// Client-side email utilities that call server APIs

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function sendWelcomeEmailClient(email: string, name: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-welcome-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error }
  }
}

export async function sendProfileReminderClient(email: string, name: string, completionPct: number) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-profile-reminder`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, name, completionPct })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error sending profile reminder email:', error)
    return { success: false, error }
  }
}

export async function sendCustomEmail(to: string | string[], subject: string, html: string, from?: string) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ to, subject, html, from })
    })
    
    return await response.json()
  } catch (error) {
    console.error('Error sending custom email:', error)
    return { success: false, error }
  }
}