// Supabase Edge Function: create-razorpay-order
// Handles server-side Razorpay order creation and logs initial state in Supabase payments table.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const razorpayKeyId =
      Deno.env.get("RAZORPAY_KEY_ID") ||
      Deno.env.get("EXPO_PUBLIC_RAZORPAY_KEY_ID");
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");

    if (!razorpayKeyId || !razorpayKeySecret) {
      console.error("Missing Razorpay credentials in environment secrets.");
      return new Response(
        JSON.stringify({
          error: "Razorpay server configuration is missing API keys.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { amount, student } = await req.json();

    // Standardize amount into paise (e.g. ₹100 = 10000 paise)
    let amountInPaise = 10000;
    if (typeof amount === "number") {
      amountInPaise = amount < 1000 ? Math.round(amount * 100) : Math.round(amount);
    }

    const receiptId = `rcpt_${student?.id || "stu"}_${Date.now()}`.slice(0, 40);

    // Call Razorpay Orders API
    const authHeader = `Basic ${btoa(`${razorpayKeyId}:${razorpayKeySecret}`)}`;
    const rzpResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId,
        notes: {
          student_id: student?.id || "",
          student_name: student?.name || "",
          enrollment: student?.enrollment || "",
          email: student?.email || "",
          purpose: "Sports Complex Stay Pass",
        },
      }),
    });

    const rzpData = await rzpResponse.json();

    if (!rzpResponse.ok) {
      console.error("Razorpay Order API error:", rzpData);
      return new Response(
        JSON.stringify({
          error: rzpData.error?.description || "Failed to create Razorpay order.",
        }),
        {
          status: rzpResponse.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert order record into payments table using Supabase Service Role
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      const { error: dbError } = await supabaseAdmin.from("payments").insert({
        order_id: rzpData.id,
        student_id: student?.id || "unknown",
        amount: amountInPaise / 100,
        status: "created",
        created_at: new Date().toISOString(),
      });

      if (dbError) {
        console.warn("Notice: payments table record insert warning:", dbError.message);
      }
    }

    return new Response(
      JSON.stringify({
        order_id: rzpData.id,
        amount: rzpData.amount,
        currency: rzpData.currency,
        key_id: razorpayKeyId,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Edge function create-razorpay-order unexpected error:", err);
    return new Response(
      JSON.stringify({ error: err.message || "Internal server error." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
