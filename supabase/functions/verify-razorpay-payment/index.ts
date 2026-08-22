// Supabase Edge Function: verify-razorpay-payment
// Server-side HMAC-SHA256 signature verification for Razorpay checkout payments.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

async function verifyHmacSha256(
  orderId: string,
  paymentId: string,
  signature: string,
  secret: string
): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const messageData = encoder.encode(`${orderId}|${paymentId}`);

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signatureBuffer = await crypto.subtle.sign("HMAC", cryptoKey, messageData);
  const computedSignature = Array.from(new Uint8Array(signatureBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return computedSignature.toLowerCase() === signature.trim().toLowerCase();
}

serve(async (req: Request) => {
  // Handle CORS preflight request
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const razorpayKeySecret = Deno.env.get("RAZORPAY_KEY_SECRET");
    if (!razorpayKeySecret) {
      console.error("Missing RAZORPAY_KEY_SECRET in edge function environment.");
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Server configuration missing Razorpay secret.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { order_id, razorpay_payment_id, razorpay_signature } = await req.json();

    if (!order_id || !razorpay_payment_id || !razorpay_signature) {
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Missing required payment verification parameters (order_id, razorpay_payment_id, razorpay_signature).",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const isValid = await verifyHmacSha256(
      order_id,
      razorpay_payment_id,
      razorpay_signature,
      razorpayKeySecret
    );

    // Initialize Supabase Admin client to update payments status
    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    if (supabaseUrl && supabaseServiceKey) {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      if (isValid) {
        await supabaseAdmin
          .from("payments")
          .update({
            razorpay_payment_id,
            razorpay_signature,
            status: "verified",
            verified_at: new Date().toISOString(),
          })
          .eq("order_id", order_id);
      } else {
        await supabaseAdmin
          .from("payments")
          .update({
            razorpay_payment_id,
            razorpay_signature,
            status: "failed",
          })
          .eq("order_id", order_id);
      }
    }

    if (!isValid) {
      console.warn(`[Razorpay] Invalid signature attempt for order: ${order_id}`);
      return new Response(
        JSON.stringify({
          verified: false,
          error: "Invalid Razorpay payment signature.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        verified: true,
        order_id,
        payment_id: razorpay_payment_id,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err: any) {
    console.error("Edge function verify-razorpay-payment unexpected error:", err);
    return new Response(
      JSON.stringify({
        verified: false,
        error: err.message || "Internal verification error.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
