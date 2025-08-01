import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server'; // Use admin client for cron
import { runDcaAgentCycle } from '@/lib/etherlink/agent-logic';

export async function POST(request: Request) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  
  // Allow development mode if CRON_SECRET is not set
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  const supabase = createAdminClient(); // Use admin client for cron
  const now = new Date().toISOString();
  
  console.log('Cron job triggered at:', now);
  
  const { data: agentsToRun, error } = await supabase
    .from('agents')
    .select('*')
    .eq('is_active', true)
    .lt('next_run_timestamp', now);

  if (error || !agentsToRun) {
    console.log('No agents to run or error:', error?.message || 'No agents found');
    return NextResponse.json({ error: error?.message || "No agents to run." }, { status: 500 });
  }

  console.log(`Found ${agentsToRun.length} agents to run:`, agentsToRun.map((a: any) => ({ id: a.id, name: a.agent_name, next_run: a.next_run_timestamp })));

  // This runs all agent cycles. In production, you might want a more robust queueing system.
  const results = await Promise.allSettled(
    agentsToRun.map(async (agent: any) => {
      console.log(`Running agent: ${agent.agent_name} (${agent.id})`);
      const result = await runDcaAgentCycle(agent);
      console.log(`Agent ${agent.agent_name} result:`, result);
      
      // Update next_run_timestamp
      const frequencyHours = parseFloat(agent.frequency_hours);
      const nextRun = new Date();
      nextRun.setHours(nextRun.getHours() + frequencyHours);
      
      await supabase
        .from('agents')
        .update({ next_run_timestamp: nextRun.toISOString() })
        .eq('id', agent.id);
      
      // TODO: Log result to your 'logs' table in Supabase
      return { agentId: agent.id, agentName: agent.agent_name, result };
    })
  );

  console.log('Cron job completed. Results:', results);
  return NextResponse.json({ message: "Cron job executed.", results });
}