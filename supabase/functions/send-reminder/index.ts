import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface ReminderRequest {
  debtor_id: string;
  debtor_name: string;
  debtor_email: string;
  amount_owed: number;
  due_date: string | null;
  currency?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { debtor_id, debtor_name, debtor_email, amount_owed, due_date, currency = "SAR" }: ReminderRequest = await req.json();

    console.log("Sending reminder to:", debtor_email);

    // Validate email
    if (!debtor_email || !debtor_email.includes("@")) {
      return new Response(
        JSON.stringify({ error: "Invalid email address" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    const formattedAmount = new Intl.NumberFormat("en-SA", {
      style: "currency",
      currency: currency,
    }).format(amount_owed);

    const dueDateText = due_date 
      ? `Due date: ${new Date(due_date).toLocaleDateString()}`
      : "";

    // Use Resend API directly via fetch
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Payment Reminder <onboarding@resend.dev>",
        to: [debtor_email],
        subject: `Payment Reminder - ${formattedAmount} Outstanding`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333; border-bottom: 2px solid #007bff; padding-bottom: 10px;">Payment Reminder</h1>
            
            <p style="font-size: 16px; color: #555;">Dear ${debtor_name},</p>
            
            <p style="font-size: 16px; color: #555;">
              This is a friendly reminder that you have an outstanding balance of:
            </p>
            
            <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
              <span style="font-size: 32px; font-weight: bold; color: #007bff;">${formattedAmount}</span>
              ${dueDateText ? `<p style="margin-top: 10px; color: #666;">${dueDateText}</p>` : ""}
            </div>
            
            <p style="font-size: 16px; color: #555;">
              Please arrange for payment at your earliest convenience.
            </p>
            
            <p style="font-size: 14px; color: #888; margin-top: 30px;">
              If you have already made the payment, please disregard this message.
            </p>
            
            <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
            
            <p style="font-size: 12px; color: #999; text-align: center;">
              This is an automated reminder message.
            </p>
          </div>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    console.log("Email response:", emailData);

    if (!emailResponse.ok) {
      throw new Error(emailData.message || "Failed to send email");
    }

    // Log the reminder in the database
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { error: logError } = await supabase.from("reminder_logs").insert({
      debtor_id,
      reminder_type: "email",
      status: "sent",
      message: `Reminder sent for ${formattedAmount}`,
    });

    if (logError) {
      console.error("Failed to log reminder:", logError);
    }

    return new Response(
      JSON.stringify({ success: true, message: "Reminder sent successfully" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-reminder function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
