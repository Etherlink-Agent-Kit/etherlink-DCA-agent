import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase/server';

export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PATCH request for agent:', params.id);
    
    const body = await request.json();
    console.log('Request body:', body);

    // Validate that we have at least one field to update
    if (Object.keys(body).length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }

    const supabase = createAdminClient();
    console.log('Supabase admin client created');
    
    // Update the agent with any provided fields
    const { data: updatedAgent, error } = await supabase
      .from('agents')
      .update({ 
        ...body,
        updated_at: new Date().toISOString()
      })
      .eq('id', params.id)
      .select()
      .single();

    if (error) {
      console.error('Database error:', error);
      throw new Error(error.message);
    }

    console.log('Agent updated successfully:', updatedAgent);
    return NextResponse.json({ agent: updatedAgent });
  } catch (error: any) {
    console.error('Error updating agent:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
} 