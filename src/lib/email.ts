import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER, 
    pass: process.env.SMTP_PASS, 
  },
})

interface SendDigitalGoodsEmailProps {
  toEmail: string;
  orderNumber: number;
  customerName: string;
  items: {
    productName: string;
    quantity: number;
    // For digital products, we might have a download link or access code
    downloadUrl?: string; 
    accessCode?: string;
  }[];
}

export async function sendDigitalGoodsEmail({ toEmail, orderNumber, customerName, items }: SendDigitalGoodsEmailProps) {
  if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.warn("⚠️ SMTP settings missing. Skipping email sending.")
    console.log(`Mock Email to ${toEmail} for Order #${orderNumber}`)
    return { success: true, mocked: true }
  }

  try {
    const itemsHtml = items.map(item => `
      <div style="margin-bottom: 20px; padding: 15px; border: 1px solid #eee; border-radius: 8px;">
        <h3 style="margin-top: 0;">${item.productName} (x${item.quantity})</h3>
        <p>Таны дижитал барааны холбоос:</p>
        <a href="${item.downloadUrl || 'https://krono.mn/downloads/example'}" style="display: inline-block; padding: 10px 20px; background-color: #F26522; color: #fff; text-decoration: none; border-radius: 5px; font-weight: bold;">Энд дарж татах</a>
        ${item.accessCode ? `<p>Хандах код: <strong>${item.accessCode}</strong></p>` : ''}
      </div>
    `).join('')

    const info = await transporter.sendMail({
      from: `"Krono Digital" <${process.env.SMTP_USER}>`,
      to: toEmail,
      subject: `Таны захиалга баталгаажлаа! Захиалга #${orderNumber}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w-md; margin: 0 auto; color: #333;">
          <h2 style="color: #1B3561;">Сайн байна уу, ${customerName}!</h2>
          <p>Таны худалдан авалт амжилттай баталгаажлаа. Таны худалдаж авсан дижитал бараанууд доор байна.</p>
          ${itemsHtml}
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 12px; color: #888;">Баярлалаа!<br/>Krono Team</p>
        </div>
      `,
    })

    console.log("Message sent: %s", info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error("Error sending email:", error)
    return { success: false, error }
  }
}
