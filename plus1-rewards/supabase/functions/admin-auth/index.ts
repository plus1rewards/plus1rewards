// Admin Authentication Edge Function
// Handles secure server-side pattern verification and session management

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LoginRequest {
  phone: string;
  pattern: number[];
  gridSize: number;
  ipAddress?: string;
  userAgent?: string;
}

interface VerifyRequest {
  sessionToken: string;
  ipAddress?: string;
}

// PBKDF2 hashing function
async function hashPattern(canonical: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(canonical),
    'PBKDF2',
    false,
    ['deriveBits']
  );

  const hashBuffer = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: encoder.encode(salt),
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );

  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function generateCanonicalPattern(sequence: number[], gridSize: number): string {
  return `g${gridSize}:${sequence.join('-')}`;
}

// Generate cryptographically secure session token
function generateSessionToken(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return Array.from(array, b => b.toString(16).padStart(2, '0')).join('');
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    );

    const url = new URL(req.url);
    const action = url.pathname.split('/').pop();

    // LOGIN endpoint
    if (action === 'login' && req.method === 'POST') {
      const { phone, pattern, gridSize, ipAddress, userAgent }: LoginRequest = await req.json();

      // Rate limiting check - max 5 attempts per 15 minutes
      const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000).toISOString();
      const { data: recentAttempts } = await supabaseClient
        .from('admin_audit_log')
        .select('id')
        .eq('action', 'login_attempt')
        .eq('success', false)
        .eq('ip_address', ipAddress)
        .gte('created_at', fifteenMinutesAgo);

      if (recentAttempts && recentAttempts.length >= 5) {
        await supabaseClient.from('admin_audit_log').insert({
          action: 'login_attempt',
          ip_address: ipAddress,
          user_agent: userAgent,
          success: false,
          error_message: 'Rate limit exceeded'
        });

        return new Response(
          JSON.stringify({ success: false, error: 'Too many attempts. Try again in 15 minutes.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Get admin user
      const { data: adminUser, error: userError } = await supabaseClient
        .from('admin_users')
        .select('*')
        .eq('phone', phone)
        .eq('is_active', true)
        .single();

      if (userError || !adminUser) {
        await supabaseClient.from('admin_audit_log').insert({
          action: 'login_attempt',
          ip_address: ipAddress,
          user_agent: userAgent,
          success: false,
          error_message: 'Invalid phone number'
        });

        return new Response(
          JSON.stringify({ success: false, error: 'Invalid credentials' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Check if account is locked
      if (adminUser.locked_until && new Date(adminUser.locked_until) > new Date()) {
        await supabaseClient.from('admin_audit_log').insert({
          admin_user_id: adminUser.id,
          action: 'login_attempt',
          ip_address: ipAddress,
          user_agent: userAgent,
          success: false,
          error_message: 'Account locked'
        });

        return new Response(
          JSON.stringify({ success: false, error: 'Account temporarily locked. Try again later.' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Verify pattern
      const canonical = generateCanonicalPattern(pattern, gridSize);
      const hashedPattern = await hashPattern(canonical, adminUser.pattern_salt);

      if (hashedPattern !== adminUser.pattern_hash) {
        // Increment failed attempts
        const newFailedAttempts = (adminUser.failed_attempts || 0) + 1;
        const lockAccount = newFailedAttempts >= 5;

        await supabaseClient
          .from('admin_users')
          .update({
            failed_attempts: newFailedAttempts,
            locked_until: lockAccount ? new Date(Date.now() + 30 * 60 * 1000).toISOString() : null
          })
          .eq('id', adminUser.id);

        await supabaseClient.from('admin_audit_log').insert({
          admin_user_id: adminUser.id,
          action: 'login_attempt',
          ip_address: ipAddress,
          user_agent: userAgent,
          success: false,
          error_message: 'Invalid pattern'
        });

        return new Response(
          JSON.stringify({ 
            success: false, 
            error: lockAccount 
              ? 'Too many failed attempts. Account locked for 30 minutes.' 
              : 'Invalid pattern' 
          }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Successful login - create session
      const sessionToken = generateSessionToken();
      const expiresAt = new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(); // 2 hours

      await supabaseClient.from('admin_sessions').insert({
        admin_user_id: adminUser.id,
        session_token: sessionToken,
        ip_address: ipAddress,
        user_agent: userAgent,
        expires_at: expiresAt
      });

      // Reset failed attempts
      await supabaseClient
        .from('admin_users')
        .update({
          failed_attempts: 0,
          locked_until: null,
          last_login_at: new Date().toISOString(),
          last_login_ip: ipAddress
        })
        .eq('id', adminUser.id);

      // Log successful login
      await supabaseClient.from('admin_audit_log').insert({
        admin_user_id: adminUser.id,
        action: 'login_success',
        ip_address: ipAddress,
        user_agent: userAgent,
        success: true
      });

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionToken,
          expiresAt,
          phone: adminUser.phone
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // VERIFY endpoint - validates session token
    if (action === 'verify' && req.method === 'POST') {
      const { sessionToken, ipAddress }: VerifyRequest = await req.json();

      const { data: session, error: sessionError } = await supabaseClient
        .from('admin_sessions')
        .select('*, admin_users(*)')
        .eq('session_token', sessionToken)
        .gt('expires_at', new Date().toISOString())
        .single();

      if (sessionError || !session) {
        return new Response(
          JSON.stringify({ valid: false, error: 'Invalid or expired session' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      // Update last activity
      await supabaseClient
        .from('admin_sessions')
        .update({
          last_activity_at: new Date().toISOString(),
          expires_at: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        })
        .eq('session_token', sessionToken);

      return new Response(
        JSON.stringify({ 
          valid: true,
          phone: session.admin_users.phone,
          expiresAt: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // LOGOUT endpoint
    if (action === 'logout' && req.method === 'POST') {
      const { sessionToken } = await req.json();

      await supabaseClient
        .from('admin_sessions')
        .delete()
        .eq('session_token', sessionToken);

      return new Response(
        JSON.stringify({ success: true }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid endpoint' }),
      { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
