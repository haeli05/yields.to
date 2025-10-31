import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { projectName, protocolName, website, contactEmail, description, tvl, apy } = body;

    // Validate required fields
    if (!projectName || !protocolName || !website || !contactEmail || !description) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    // Prepare email content
    const emailContent = `
New Project Submission for Yields.to

Project Name: ${projectName}
Protocol Name: ${protocolName}
Website: ${website}
Contact Email: ${contactEmail}

Description:
${description}

Additional Details:
- TVL (USD): ${tvl || 'Not provided'}
- APY (%): ${apy || 'Not provided'}

---
Submitted from Yields.to
    `.trim();

    // Send email using Resend
    const resendApiKey = process.env.RESEND_API_KEY;

    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured - project submission logged only");
      console.log("Project submission received:", emailContent);

      // Still return success so user doesn't see an error
      return NextResponse.json(
        { success: true, message: "Project submitted successfully" },
        { status: 200 }
      );
    }

    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: ["hj@chateau.capital"],
        subject: `New Project Submission: ${projectName}`,
        text: emailContent,
      }),
    });

    if (!emailResponse.ok) {
      const errorData = await emailResponse.json();
      console.error("Resend API error:", errorData);
      console.log("Project submission (email failed):", emailContent);

      // Still return success - at least it's logged
      return NextResponse.json(
        { success: true, message: "Project submitted successfully" },
        { status: 200 }
      );
    }

    return NextResponse.json(
      { success: true, message: "Project submitted successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error submitting project:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
