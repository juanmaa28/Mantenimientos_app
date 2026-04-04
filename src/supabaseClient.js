import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://tcjkargroawcoprmwcfu.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRjamthcmdyb2F3Y29wcm13Y2Z1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM0MTY0NTcsImV4cCI6MjA4ODk5MjQ1N30.3kV4vA6qomHNTANQ6HLDYOq6kp7_FWO3vKTQM1vXvT8'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
