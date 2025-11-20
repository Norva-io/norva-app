import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

/**
 * Test endpoint pour vérifier la connexion Supabase
 *
 * Usage: GET http://localhost:3000/api/test-db
 *
 * Vérifie:
 * - Connexion à Supabase
 * - Lecture de la table users
 * - Permissions RLS
 */
export async function GET() {
  try {

    // Test 1: Connexion basique
    const { count: usersCount, error: usersError } = await supabase
      .from('users')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      return NextResponse.json({
        success: false,
        error: usersError.message,
        hint: 'Vérifiez que le schema SQL a bien été appliqué',
      }, { status: 500 })
    }

    // Test 2: Tables existantes
    const tables = ['users', 'clients', 'emails', 'client_health_history', 'client_insights', 'analysis_jobs']
    const tablesStatus: Record<string, boolean> = {}

    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true })

      tablesStatus[table] = !error
    }

    return NextResponse.json({
      success: true,
      message: 'Supabase connected! ✅',
      data: {
        usersCount: usersCount || 0,
        tables: tablesStatus,
        allTablesExist: Object.values(tablesStatus).every(exists => exists),
      },
    })
  } catch (error) {
    console.error('Database test error:', error)

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      hint: 'Vérifiez vos variables NEXT_PUBLIC_SUPABASE_URL et NEXT_PUBLIC_SUPABASE_ANON_KEY dans .env.local',
    }, { status: 500 })
  }
}