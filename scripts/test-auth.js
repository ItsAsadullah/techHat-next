const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, key);

async function testLogin() {
  const { data, error } = await supabase.auth.signInWithPassword({
    email: 'techhat.shop@gmail.com',
    password: 'TechHat@321'
  });

  if (error) {
    console.error("Login Error:", error.message);
  } else {
    console.log("Login Success!");
  }
}

testLogin();
