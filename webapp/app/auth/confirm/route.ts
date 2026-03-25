import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/utils/supabase/server'

export async function GET(request: NextRequest) {
  const supabase = await createClient()
  const requestUrl = new URL(request.url)

  const code = requestUrl.searchParams.get('code')

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code)

    if (!error) {
      return NextResponse.redirect(`${requestUrl.origin}/sites`)
    }
  }

  return NextResponse.redirect(`${requestUrl.origin}/auth/auth-code-error`)
}