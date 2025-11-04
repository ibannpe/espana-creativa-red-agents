import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://jbkzymvswvnkrxriyzdx.supabase.co'
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Impia3p5bXZzd3Zua3J4cml5emR4Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTczMDIxODk3MSwiZXhwIjoyMDQ1Nzk0OTcxfQ.rK4q6Vp4p2b7ZQEu3kgxJ_hMXmJn8CviD21bxc2eALY'

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

async function resetPassword() {
  const { data, error } = await supabase.auth.admin.updateUserById(
    '219f178d-1f91-442a-a507-6d4f2d90f156',
    { password: 'Admin123!' }
  )

  if (error) {
    console.error('Error:', error)
  } else {
    console.log('✅ Password reset successfully for iban.perezmi@gmail.com')
    console.log('New password: Admin123!')
  }
}

resetPassword()
