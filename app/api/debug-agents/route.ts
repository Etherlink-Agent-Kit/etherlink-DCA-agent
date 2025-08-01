import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  try {
    const supabase = createAdminClient();
    const now = new Date().toISOString();
    
    console.log('Debug: Current time:', now);
    
    // Get all active agents
    const { data: allAgents, error: allError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true);
    
    if (allError) {
      console.error('Error fetching all agents:', allError);
      return NextResponse.json({ error: allError.message }, { status: 500 });
    }
    
    console.log('Debug: All active agents:', allAgents);
    
    // Get agents that should run
    const { data: agentsToRun, error: runError } = await supabase
      .from('agents')
      .select('*')
      .eq('is_active', true)
      .lt('next_run_timestamp', now);
    
    if (runError) {
      console.error('Error fetching agents to run:', runError);
      return NextResponse.json({ error: runError.message }, { status: 500 });
    }
    
    console.log('Debug: Agents to run:', agentsToRun);
    
    return NextResponse.json({ 
      currentTime: now,
      allActiveAgents: allAgents,
      agentsToRun: agentsToRun
    });
    
  } catch (error: any) {
    console.error('Debug error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 