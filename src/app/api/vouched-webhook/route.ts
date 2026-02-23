import { NextResponse } from 'next/server';

// In-memory store for webhook responses (in a real app, this would be a database)
// Using a global variable for demo purposes only
declare global {
  var vouchedWebhookResponses: Array<{ timestamp: string; data?: unknown; error?: string }>;
}

// Initialize the global store if it doesn't exist
if (!global.vouchedWebhookResponses) {
  global.vouchedWebhookResponses = [];
}

export async function POST(request: Request) {
  try {
    // Parse the webhook payload
    const webhookData = await request.json();

    // Log the webhook data
    console.log('Received Vouched webhook:', webhookData);

    // Store the webhook response in our in-memory store
    // In a production app, you would save this to a database
    global.vouchedWebhookResponses.unshift({
      timestamp: new Date().toISOString(),
      data: webhookData,
    });

    // Limit the stored responses to the last 10
    if (global.vouchedWebhookResponses.length > 10) {
      global.vouchedWebhookResponses = global.vouchedWebhookResponses.slice(0, 10);
    }

    // Return a success response to Vouched
    return NextResponse.json({
      success: true,
      message: 'Webhook received successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('Error processing Vouched webhook:', error);

    // Store the error in our in-memory store
    global.vouchedWebhookResponses.unshift({
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    });

    // Return an error response
    return NextResponse.json(
      {
        success: false,
        message: 'Error processing webhook',
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Endpoint to get webhook responses (for demo purposes)
export async function GET() {
  return NextResponse.json({
    responses: global.vouchedWebhookResponses || [],
  });
}
