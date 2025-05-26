import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://localhost:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = 'phucsystem@gmail.com'
const ADMIN_PASSWORD = 'abcd1234'

console.log('Using SUPABASE_URL:', SUPABASE_URL)
console.log('Using SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '[set]' : '[not set]')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  // 1. Create admin user
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true
  })
  
  if (error) {
    console.error('Error creating admin user:', error.message)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    process.exit(1)
  }
}

main() 