import nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

let transporter: Transporter | null = null;

function getTransporter(): Transporter {
  if (!transporter) {
    const emailUser = process.env.EMAIL_USER;
    const emailPassword = process.env.EMAIL_PASSWORD;

    if (!emailUser || !emailPassword) {
      console.warn("EMAIL_USER or EMAIL_PASSWORD not set - email functionality will be disabled");
      return null as any;
    }

    transporter = nodemailer.createTransporter({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPassword,
      },
    });
  }

  return transporter;
}

function generateICSFile(name: string, date: string, time: string): string {
  const startDateTime = `${date.replace(/-/g, "")}T${time.replace(/:/g, "")}00`;
  const endDateTime = `${date.replace(/-/g, "")}T${(parseInt(time.split(":")[0]) + 1).toString().padStart(2, "0")}:${time.split(":")[1]}:00`;
  const now = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";

  return `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//PropCraft Studio//Meeting Request//EN
CALSCALE:GREGORIAN
METHOD:REQUEST
BEGIN:VEVENT
UID:${Date.now()}@propcraft.com
DTSTAMP:${now}
DTSTART:${startDateTime}
DTEND:${endDateTime}
SUMMARY:Consultation Meeting with ${name}
DESCRIPTION:Thank you for requesting a consultation. We'll confirm this appointment shortly.
LOCATION:Online via video conference
STATUS:CONFIRMED
SEQUENCE:0
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Reminder: Consultation Meeting
END:VALARM
END:VEVENT
END:VCALENDAR`;
}

export async function sendMeetingConfirmation(
  to: string,
  name: string,
  date: string,
  time: string
): Promise<void> {
  const transporter = getTransporter();

  if (!transporter) {
    console.log("Email service not configured - skipping email send");
    return;
  }

  const icsContent = generateICSFile(name, date, time);
  const formattedDate = new Date(date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const formattedTime = new Date(`2000-01-01T${time}`).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: to,
    subject: `Meeting Confirmation - ${formattedDate}`,
    text: `
Hello ${name},

Thank you for requesting a consultation with PropCraft Studio!

Your requested appointment:
Date: ${formattedDate}
Time: ${formattedTime}

We'll review your request and send you a confirmation email within 24 hours.
If you need to reschedule, please reply to this email.

Best regards,
PropCraft Studio Team
    `,
    html: `
<html>
  <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
    <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
      <h2 style="color: #6366f1;">Meeting Request Confirmation</h2>

      <p>Hello <strong>${name}</strong>,</p>

      <p>Thank you for requesting a consultation with PropCraft Studio!</p>

      <div style="background-color: #f3f4f6; padding: 15px; border-radius: 5px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Your Requested Appointment:</h3>
        <p><strong>Date:</strong> ${formattedDate}</p>
        <p><strong>Time:</strong> ${formattedTime}</p>
      </div>

      <p>We'll review your request and send you a confirmation email within 24 hours.
      If you need to reschedule, please reply to this email.</p>

      <p>Best regards,<br><strong>PropCraft Studio Team</strong></p>
    </div>
  </body>
</html>
    `,
    attachments: [
      {
        filename: "meeting.ics",
        content: Buffer.from(icsContent),
        contentType: "text/calendar; charset=utf-8",
      },
    ],
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully:", info.messageId);
  } catch (error) {
    console.error("Error sending email:", error);
    throw error;
  }
}

