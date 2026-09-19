import { redirect } from 'next/navigation'

import { createClient } from '@/utils/supabase/server'

export default async function PrivatePage() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/login')
  }

  // Check if user is authenticated (approved)
  if (data.user.user_metadata?.authenticated !== true) {
    // For now, redirect to login, but ideally show approval screen
    redirect('/login')
  }

  return <p>Hello {data.user.email}</p>
}