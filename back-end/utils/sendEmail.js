const nodemailer = require('nodemailer');

/**
 * Sends an email with a PDF attachment
 * @param {Object} options - { email, subject, message, pdfBuffer, filename }
 */
const sendEmail = async (options) => {
    // 1. Create Transporter (Configure with your SMTP provider)
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false, // true for 465, false for other ports
        auth: {
            user: process.env.SMTP_EMAIL,
            pass: process.env.SMTP_PASSWORD,
        },
    });

    // 2. Define Email Options
    const message = {
        from: `${process.env.FROM_NAME} <${process.env.FROM_EMAIL}>`,
        to: options.email,
        subject: options.subject,
        text: options.message, // Plain text body
        html: `<p>${options.message.replace(/\n/g, '<br>')}</p>`, // HTML body
        attachments: [
            {
                filename: options.filename,
                content: options.pdfBuffer, // attach the buffer directly
                contentType: 'application/pdf'
            }
        ]
    };

    // 3. Send
    const info = await transporter.sendMail(message);
    console.log('📧 Email sent: %s', info.messageId);
};

module.exports = sendEmail;