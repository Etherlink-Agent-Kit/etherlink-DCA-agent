import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { agentId, newWalletAddress } = body;

    if (!agentId || !newWalletAddress) {
      return NextResponse.json({ error: 'Agent ID and new wallet address are required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    const { data, error } = await supabase
      .from('agents')
      .update({ user_wallet_address: newWalletAddress.toLowerCase() })
      .eq('id', agentId)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      message: 'Wallet address updated successfully',
      agent: data 
    });

  } catch (error: any) {
    console.error('Error updating wallet address:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 