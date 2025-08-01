import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const walletAddress = searchParams.get('wallet');
    
    if (!walletAddress) {
      return NextResponse.json({ error: 'Wallet address is required' }, { status: 400 });
    }

    const supabase = createAdminClient();
    
    // Get agents for this wallet
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id, agent_name')
      .eq('user_wallet_address', walletAddress.toLowerCase());

    if (agentsError) {
      console.error('Error fetching agents:', agentsError);
      return NextResponse.json({ error: agentsError.message }, { status: 500 });
    }

    if (!agents || agents.length === 0) {
      return NextResponse.json({ trades: [] });
    }

    const agentIds = agents.map(agent => agent.id);

    // Get recent logs for these agents (last 24 hours)
    const { data: logs, error: logsError } = await supabase
      .from('agent_logs')
      .select('*')
      .in('agent_id', agentIds)
      .gte('execution_timestamp', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())
      .order('execution_timestamp', { ascending: false })
      .limit(50);

    if (logsError) {
      console.error('Error fetching logs:', logsError);
      return NextResponse.json({ error: logsError.message }, { status: 500 });
    }

    // Combine agent info with logs
    const trades = logs?.map(log => {
      const agent = agents.find(a => a.id === log.agent_id);
      return {
        ...log,
        agent_name: agent?.agent_name || 'Unknown Agent'
      };
    }) || [];

    return NextResponse.json({ trades });
    
  } catch (error: any) {
    console.error('Error fetching trades:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 