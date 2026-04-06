import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { phoneNumbers, message, apiKey, username, mode } = await req.json()

    if (!phoneNumbers?.length || !message || !apiKey) {
      return new Response(
        JSON.stringify({ success: false, error: 'Missing required fields' }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const formattedPhones = phoneNumbers.map((phone: string) => {
      let digits = phone.replace(/\D/g, '')
      if (digits.startsWith('0')) digits = '27' + digits.substring(1)
      if (!digits.startsWith('27')) digits = '27' + digits
      return '+' + digits
    })

    const finalUsername = username || (mode === 'production' ? 'plus1rewards' : 'sandbox')
    
    const payload = {
      username: finalUsername,
      phoneNumbers: formattedPhones,
      message: message
    }

    const apiUrl = mode === 'production' 
      ? 'https://api.africastalking.com/version1/messaging/bulk'
      : 'https://api.sandbox.africastalking.com/version1/messaging/bulk'

    console.log('SMS Request:', {
      url: apiUrl,
      username: finalUsername,
      mode: mode,
      to: formattedPhones.join(','),
      apiKeyPrefix: apiKey.substring(0, 10) + '...'
    })

    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Apikey': apiKey
      },
      body: JSON.stringify(payload)
    })

    const responseText = await response.text()
    console.log('SMS Response Status:', response.status)
    console.log('SMS Response Text:', responseText)
    
    let data
    try {
      data = JSON.parse(responseText)
    } catch (e) {
      return new Response(
        JSON.stringify({
          success: false,
          error: 'Invalid response from Africa\'s Talking API',
          details: responseText.substring(0, 200)
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (response.ok && data.SMSMessageData?.Recipients) {
      const recipients = data.SMSMessageData.Recipients
      
      const successCount = recipients.filter((r: any) => r.status === 'Success' || r.statusCode === 101 || r.statusCode === 102).length

      return new Response(
        JSON.stringify({
          success: true,
          message: data.SMSMessageData.Message,
          recipientCount: recipients.length,
          successCount: successCount
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } else {
      return new Response(
        JSON.stringify({
          success: false,
          error: data?.error || 'Failed to send SMS',
          details: data
        }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
  } catch (error) {
    console.error('SMS Error:', error)
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
