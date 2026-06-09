import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders } from '../_shared/cors.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Verify caller is an admin
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const token = authHeader.replace('Bearer ', '');

    // Use service role client for admin ops
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Verify caller is admin
    const { data: { user: callerUser }, error: callerError } = await supabaseAdmin.auth.getUser(token);
    if (callerError || !callerUser) {
      return new Response(JSON.stringify({ error: 'Invalid token' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: adminRow } = await supabaseAdmin
      .from('admins')
      .select('id, is_active')
      .eq('id', callerUser.id)
      .eq('is_active', true)
      .single();

    if (!adminRow) {
      return new Response(JSON.stringify({ error: 'Not authorized as admin' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const body = await req.json();
    const { action, riderId, email, password, name, name_ar, phone, area, vehicle } = body;

    // ── CREATE RIDER ──────────────────────────────────────────────────────
    if (action === 'create') {
      if (!email || !password || !name) {
        return new Response(JSON.stringify({ error: 'email, password, name are required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      // Create auth user
      const { data: newUser, error: signupError } = await supabaseAdmin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { username: name },
      });

      if (signupError || !newUser.user) {
        return new Response(JSON.stringify({ error: signupError?.message || 'Failed to create user' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const userId = newUser.user.id;

      // Wait briefly for trigger to create user_profiles row
      await new Promise(r => setTimeout(r, 500));

      // Insert rider profile
      const { data: rider, error: riderError } = await supabaseAdmin.from('riders').insert({
        id: userId,
        name,
        name_ar: name_ar || name,
        phone: phone || '',
        area: area || '',
        vehicle: vehicle || 'Motorcycle',
      }).select().single();

      if (riderError) {
        // Rollback auth user
        await supabaseAdmin.auth.admin.deleteUser(userId);
        return new Response(JSON.stringify({ error: riderError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      return new Response(JSON.stringify({ rider, email }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── DELETE RIDER ──────────────────────────────────────────────────────
    if (action === 'delete') {
      if (!riderId) {
        return new Response(JSON.stringify({ error: 'riderId is required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const { error: delError } = await supabaseAdmin.auth.admin.deleteUser(riderId);
      if (delError) {
        return new Response(JSON.stringify({ error: delError.message }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify({ success: true }), {
        status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), {
      status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('manage-rider error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
