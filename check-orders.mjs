import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabaseUrl = "https://xkqzlwhkagsrqpmfuhzp.supabase.co";
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.argv[2];

async function checkOrders() {
  const { createClient } = await import('@supabase/supabase-js');
  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log("Fetching recent orders...");
  const { data: orders, error } = await supabase
    .from('orders')
    .select('id, order_number, created_at')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error("Error fetching orders:", error);
    return;
  }

  console.log("Recent Orders:");
  console.table(orders);
}

checkOrders();
