// Africa's Talking SMS Service
// Routes through Supabase Edge Function to avoid CORS issues

import { supabase } from './supabase';

interface SendSMSResponse {
  success: boolean;
  message?: string;
  error?: string;
  statusCode?: number;
  cost?: string;
  recipientCount?: number;
  successCount?: number;
}

export async function sendSMS(phoneNumber: string, message: string): Promise<SendSMSResponse> {
  return sendBulkSMS([phoneNumber], message);
}

export async function sendBulkSMS(phoneNumbers: string[], message: string): Promise<SendSMSResponse> {
  try {
    if (!phoneNumbers || phoneNumbers.length === 0) {
      return {
        success: false,
        error: 'No phone numbers provided'
      };
    }

    if (!message || typeof message !== 'string') {
      return {
        success: false,
        error: 'Invalid message'
      };
    }

    const apiKey = import.meta.env.VITE_AFRICAS_TALKING_API_KEY;
    const username = import.meta.env.VITE_AFRICAS_TALKING_USERNAME;
    const senderId = import.meta.env.VITE_AFRICAS_TALKING_SENDER_ID;
    const mode = import.meta.env.VITE_AFRICAS_TALKING_MODE || 'sandbox';

    if (!apiKey) {
      return {
        success: false,
        error: 'Africa\'s Talking API key not configured'
      };
    }

    console.log('Calling Edge Function with:', { phoneNumbers, message });

    const { data, error } = await supabase.functions.invoke('send-sms', {
      body: {
        phoneNumbers: phoneNumbers,
        message: message,
        apiKey: apiKey,
        username: username,
        senderId: senderId,
        mode: mode
      }
    });

    if (error) {
      console.error('Edge Function error:', error);
      return {
        success: false,
        error: error.message || 'Failed to send SMS'
      };
    }

    console.log('Edge Function response:', data);

    if (data?.success) {
      console.log(`SMS sent successfully to ${data.successCount}/${data.recipientCount} recipients`);
      return {
        success: true,
        message: data.message,
        recipientCount: data.recipientCount,
        successCount: data.successCount
      };
    } else {
      console.error('SMS sending failed:', data?.error);
      return {
        success: false,
        error: data?.error || 'Failed to send SMS'
      };
    }
  } catch (error: any) {
    console.error('SMS service error:', error);
    return {
      success: false,
      error: error.message || 'Failed to send SMS'
    };
  }
}

export async function sendRegistrationSMS(phoneNumber: string, memberName: string): Promise<SendSMSResponse> {
  const message = `Welcome to +1 Rewards, ${memberName}! 🎉 Your account has been created successfully. You can now start earning cashback that pays your Medical Cover. Log in with your phone number and PIN. Thank you for joining us!`;
  return sendSMS(phoneNumber, message);
}

export async function sendLoginDetailsSMS(phoneNumber: string, memberName: string): Promise<SendSMSResponse> {
  const message = `Hi ${memberName}, your +1 Rewards login details are: Phone: ${phoneNumber}. Use your 6-digit PIN to log in. Keep your PIN secure!`;
  return sendSMS(phoneNumber, message);
}
