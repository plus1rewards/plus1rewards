#!/usr/bin/env node

/**
 * Supplier Cleanup Script
 * 
 * This script automatically removes expired suppliers (30+ days old) from the database.
 * It should be run daily via a cron job or task scheduler.
 * 
 * Usage:
 * node scripts/cleanup-suppliers.js
 * 
 * Cron job example (daily at 2 AM):
 * 0 2 * * * cd /path/to/plus1-rewards && node scripts/cleanup-suppliers.js
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Use service role key for admin operations

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables:');
  console.error('- VITE_SUPABASE_URL');
  console.error('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function cleanupExpiredSuppliers() {
  try {
    console.log('Starting supplier cleanup process...');
    
    // Calculate the cutoff date (30 days ago)
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30);
    
    console.log(`Looking for suppliers updated before: ${cutoffDate.toISOString()}`);
    
    // Find partners with expired suppliers
    const { data: partnersWithExpiredSuppliers, error: fetchError } = await supabase
      .from('partners')
      .select('id, shop_name, suppliers, suppliers_updated_at')
      .not('suppliers', 'is', null)
      .neq('suppliers', '[]')
      .not('suppliers_updated_at', 'is', null)
      .lte('suppliers_updated_at', cutoffDate.toISOString());

    if (fetchError) {
      throw fetchError;
    }

    if (!partnersWithExpiredSuppliers || partnersWithExpiredSuppliers.length === 0) {
      console.log('No expired suppliers found.');
      return;
    }

    console.log(`Found ${partnersWithExpiredSuppliers.length} partners with expired suppliers:`);
    
    let cleanupCount = 0;
    
    for (const partner of partnersWithExpiredSuppliers) {
      console.log(`- ${partner.shop_name} (ID: ${partner.id}) - ${partner.suppliers.length} suppliers`);
      
      // Clear suppliers and reset timestamp
      const { error: updateError } = await supabase
        .from('partners')
        .update({
          suppliers: [],
          suppliers_updated_at: null
        })
        .eq('id', partner.id);

      if (updateError) {
        console.error(`Failed to cleanup suppliers for ${partner.shop_name}:`, updateError);
        continue;
      }

      cleanupCount++;
      console.log(`✓ Cleaned up suppliers for ${partner.shop_name}`);
    }

    console.log(`\nCleanup completed successfully!`);
    console.log(`Total partners processed: ${cleanupCount}`);
    
  } catch (error) {
    console.error('Error during supplier cleanup:', error);
    process.exit(1);
  }
}

async function checkExpiringSoon() {
  try {
    // Find suppliers expiring within 7 days
    const warningDate = new Date();
    warningDate.setDate(warningDate.getDate() - 23); // 23 days ago = 7 days until expiry
    
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 30); // 30 days ago = expired
    
    const { data: expiringSoon, error } = await supabase
      .from('partners')
      .select('id, shop_name, email, suppliers_updated_at')
      .not('suppliers', 'is', null)
      .neq('suppliers', '[]')
      .not('suppliers_updated_at', 'is', null)
      .lte('suppliers_updated_at', warningDate.toISOString())
      .gt('suppliers_updated_at', cutoffDate.toISOString());

    if (error) {
      throw error;
    }

    if (expiringSoon && expiringSoon.length > 0) {
      console.log(`\nFound ${expiringSoon.length} partners with suppliers expiring soon:`);
      
      expiringSoon.forEach(partner => {
        const updatedAt = new Date(partner.suppliers_updated_at);
        const now = new Date();
        const daysPassed = Math.floor((now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60 * 24));
        const daysRemaining = 30 - daysPassed;
        
        console.log(`- ${partner.shop_name} (${partner.email}) - ${daysRemaining} days remaining`);
      });
      
      // Here you could send notification emails to partners about upcoming expiry
      console.log('\nConsider sending expiry notifications to these partners.');
    }
    
  } catch (error) {
    console.error('Error checking expiring suppliers:', error);
  }
}

// Main execution
async function main() {
  console.log('=== Supplier Cleanup Script ===');
  console.log(`Started at: ${new Date().toISOString()}`);
  
  await cleanupExpiredSuppliers();
  await checkExpiringSoon();
  
  console.log(`\nCompleted at: ${new Date().toISOString()}`);
  console.log('=== End of Script ===');
}

// Run the script
main().catch(console.error);