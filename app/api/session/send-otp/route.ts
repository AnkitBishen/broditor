import { NextResponse } from "next/server";

import { createAndStoreOtp, OTP_EXPIRY_SECONDS } from "@/lib/otp-store";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      email?: string;
      fullName?: string;
    };
    const email = String(body.email || "").trim().toLowerCase();
    const fullName = String(body.fullName || "").trim();

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json(
        { message: "Please provide a valid email address." },
        { status: 400 }
      );
    }

    // Generate OTP (with rate limit check)
    const result = createAndStoreOtp(email);
    if (result.rateLimited) {
      return NextResponse.json(
        {
          message: `Please wait ${result.waitSeconds}s before requesting a new code.`,
        },
        { status: 429 }
      );
    }

    // Send OTP via Brevo transactional email API
    const brevoApiKey = process.env.BREVO_API_KEY;
    const senderEmail =
      process.env.BREVO_SENDER_EMAIL || "noreply@yourdomain.com";
    const senderName = process.env.BREVO_SENDER_NAME || "Broditor";

    if (!brevoApiKey) {
      console.error("BREVO_API_KEY is not configured");
      return NextResponse.json(
        {
          message:
            "Email service is not configured. Please contact support.",
        },
        { status: 500 }
      );
    }

    const brevoResponse = await fetch(
      "https://api.brevo.com/v3/smtp/email",
      {
        method: "POST",
        headers: {
          accept: "application/json",
          "content-type": "application/json",
          "api-key": brevoApiKey,
        },
        body: JSON.stringify({
          sender: { name: senderName, email: senderEmail },
          to: [{ email, name: fullName || email }],
          subject: `${result.code} is your verification code`,
          htmlContent: `
            <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 480px; margin: 0 auto; padding: 40px 20px;">
              <div style="text-align: center; margin-bottom: 32px;">
                <div style="display: inline-block; width: 48px; height: 48px; line-height: 48px; border-radius: 12px; background: linear-gradient(135deg, #f97316, #c2410c); color: white; font-weight: 700; font-size: 16px; text-align: center;">BA</div>
                <h2 style="margin: 16px 0 4px; color: #1f1b24; font-size: 22px;">Browser Audit</h2>
                <p style="color: #6b7280; font-size: 14px; margin: 0;">Email Verification</p>
              </div>
              <div style="background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 16px; padding: 32px; text-align: center;">
                <p style="color: #374151; font-size: 15px; margin: 0 0 8px;">Hi ${fullName || "there"},</p>
                <p style="color: #6b7280; font-size: 14px; margin: 0 0 24px;">Use the code below to verify your email and complete your workspace setup.</p>
                <div style="background: #1f1b24; border-radius: 12px; padding: 20px; margin: 0 auto; max-width: 240px;">
                  <span style="font-size: 32px; font-weight: 700; letter-spacing: 8px; color: #fc7142;">${result.code}</span>
                </div>
                <p style="color: #9ca3af; font-size: 13px; margin: 24px 0 0;">This code expires in 10 minutes.</p>
              </div>
              <p style="color: #9ca3af; font-size: 12px; text-align: center; margin-top: 24px;">
                If you didn't request this code, you can safely ignore this email.
              </p>
            </div>
          `,
        }),
      }
    );

    if (!brevoResponse.ok) {
      const errorData = await brevoResponse.text();
      console.error("Brevo API error:", brevoResponse.status, errorData);
      return NextResponse.json(
        {
          message:
            "Failed to send verification email. Please try again.",
        },
        { status: 502 }
      );
    }

    return NextResponse.json({
      message: "Verification code sent to your email.",
      expiresInSeconds: OTP_EXPIRY_SECONDS,
    });
  } catch (error) {
    console.error("send-otp error:", error);
    return NextResponse.json(
      { message: "An unexpected error occurred." },
      { status: 500 }
    );
  }
}
