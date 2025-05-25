import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = 'http://localhost:54321'
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

const ADMIN_EMAIL = 'phucsystem@gmail.com'
const ADMIN_PASSWORD = 'abcd@1234'

console.log('Using SUPABASE_URL:', SUPABASE_URL)
console.log('Using SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '[set]' : '[not set]')

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

async function main() {
  // 1. Create admin user
  const { data: user, error } = await supabase.auth.admin.createUser({
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    email_confirm: true,
    user_metadata: { role: 'admin' }
  })
  if (error) {
    console.error('Error creating admin user:', error)
    console.error('Full error object:', JSON.stringify(error, null, 2))
    process.exit(1)
  }
  const userId = user.user.id

  // 2. Assign admin role in user_roles table
  const { error: insertError } = await supabase
    .from('user_roles')
    .insert([{ user_id: userId, role: 'admin' }])
  if (insertError) {
    console.error('Error assigning admin role:', insertError)
    process.exit(1)
  }

  console.log('Admin user created and role assigned!')
}

main() 