import { Resend } from 'resend';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Initialize Resend instance inside the handler function instead of at module level
    const resend = new Resend(process.env.RESEND_API_KEY);

    const body = await request.json();
    const { _subject, ...formData } = body;
    
    // Format form data as a table
    const formattedData = Object.entries(formData)
      .map(([key, value]) => `${key}: ${value}`)
      .join('\n');
    
    await resend.emails.send({
      from: 'Dynamia AI <noreply@dynamia.ai>',
      to: 'info@dynamia.ai',
      subject: _subject || 'New Form Submission',
      text: formattedData,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Email sending failed:', error);
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
} 