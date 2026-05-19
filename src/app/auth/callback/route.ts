
import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { buildAppUrl } from '@/utils/siteUrl'

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url)
    const code = searchParams.get('code')
    const next = searchParams.get('next') ?? '/'

    if (code) {
        const supabase = await createClient()
        const { error, data } = await supabase.auth.exchangeCodeForSession(code)
        if (!error && data?.user) {
            const avatarUrl = data.user.user_metadata?.avatar_url;
            // Block fetching avatars from discord or google so users must upload their own
            if (avatarUrl && (avatarUrl.includes('googleusercontent') || avatarUrl.includes('discordapp') || avatarUrl.includes('githubusercontent'))) {
                await supabase.auth.updateUser({
                    data: { avatar_url: null }
                });
            }
            return NextResponse.redirect(buildAppUrl(next, request))
        }
    }

    return NextResponse.redirect(buildAppUrl('/auth/auth-code-error', request))
}
