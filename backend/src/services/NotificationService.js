const nodemailer = require('nodemailer');

/**
 * NOTIFICATION SERVICE
 * 
 * Handles all system notifications:
 * - Email notifications (booking confirmations, alerts)
 * - SMS notifications (capacity warnings) - Optional with Twilio
 * - Push notifications (future feature)
 */

class NotificationService {
    constructor() {
        // Email transporter configuration
        this.emailTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.gmail.com',
            port: process.env.SMTP_PORT || 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS
            }
        });

        // SMS configuration (optional - requires Twilio account)
        this.smsEnabled = process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN;
        if (this.smsEnabled) {
            const twilio = require('twilio');
            this.smsClient = twilio(
                process.env.TWILIO_ACCOUNT_SID,
                process.env.TWILIO_AUTH_TOKEN
            );
            this.twilioNumber = process.env.TWILIO_PHONE_NUMBER;
        }
    }

    /**
     * Send booking confirmation email
     */
    async sendBookingConfirmation(booking, temple) {
        try {
            const mailOptions = {
                from: `"Temple Management" <${process.env.SMTP_USER}>`,
                to: booking.userEmail,
                subject: `✅ Booking Confirmed - ${temple.name}`,
                html: this.getBookingConfirmationTemplate(booking, temple)
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            console.log(`📧 Booking confirmation sent to ${booking.userEmail}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error sending booking confirmation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send capacity alert to admins
     */
    async sendCapacityAlert(temple, alert) {
        try {
            // Get admin emails (you should fetch from DB)
            const adminEmails = process.env.ADMIN_EMAILS?.split(',') || ['admin@temple.com'];

            const mailOptions = {
                from: `"Temple Alert System" <${process.env.SMTP_USER}>`,
                to: adminEmails.join(','),
                subject: `🚨 ${alert.level} ALERT - ${temple.name}`,
                html: this.getCapacityAlertTemplate(temple, alert)
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            console.log(`🚨 Capacity alert sent to admins`);

            // Also send SMS if enabled and critical
            if (this.smsEnabled && alert.level === 'CRITICAL') {
                await this.sendSMS(
                    process.env.ADMIN_PHONE,
                    `CRITICAL: ${temple.name} at ${alert.percentage}% capacity!`
                );
            }

            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error sending capacity alert:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send booking cancellation notification
     */
    async sendCancellationNotification(booking, temple) {
        try {
            const mailOptions = {
                from: `"Temple Management" <${process.env.SMTP_USER}>`,
                to: booking.userEmail,
                subject: `❌ Booking Cancelled - ${temple.name}`,
                html: this.getCancellationTemplate(booking, temple)
            };

            const info = await this.emailTransporter.sendMail(mailOptions);
            console.log(`📧 Cancellation notification sent to ${booking.userEmail}`);
            return { success: true, messageId: info.messageId };
        } catch (error) {
            console.error('❌ Error sending cancellation:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Send SMS (requires Twilio)
     */
    async sendSMS(to, message) {
        if (!this.smsEnabled) {
            console.log('📱 SMS not configured (Twilio credentials missing)');
            return { success: false, error: 'SMS not configured' };
        }

        try {
            const result = await this.smsClient.messages.create({
                body: message,
                from: this.twilioNumber,
                to: to
            });

            console.log(`📱 SMS sent to ${to}`);
            return { success: true, sid: result.sid };
        } catch (error) {
            console.error('❌ Error sending SMS:', error);
            return { success: false, error: error.message };
        }
    }

    /**
     * Email Templates
     */
    getBookingConfirmationTemplate(booking, temple) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .booking-details { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                    .qr-code { text-align: center; margin: 20px 0; }
                    .footer { text-align: center; margin-top: 20px; color: #666; font-size: 12px; }
                    .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>🙏 Booking Confirmed!</h1>
                        <p>Your visit to ${temple.name} is confirmed</p>
                    </div>
                    <div class="content">
                        <p>Dear ${booking.userName || 'Devotee'},</p>
                        <p>Your booking has been successfully confirmed. Please find your details below:</p>
                        
                        <div class="booking-details">
                            <div class="detail-row">
                                <strong>Temple:</strong>
                                <span>${temple.name}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Date:</strong>
                                <span>${new Date(booking.date).toLocaleDateString()}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Time Slot:</strong>
                                <span>${booking.slot}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Visitors:</strong>
                                <span>${booking.visitors}</span>
                            </div>
                            <div class="detail-row">
                                <strong>Pass ID:</strong>
                                <span><code>${booking.passId}</code></span>
                            </div>
                        </div>

                        <div class="qr-code">
                            <p><strong>Your QR Code:</strong></p>
                            <img src="${booking.qr_code_url}" alt="QR Code" style="max-width: 250px;">
                            <p style="font-size: 12px; color: #666;">Show this QR code at the temple entrance</p>
                        </div>

                        <p><strong>Important:</strong></p>
                        <ul>
                            <li>Please arrive 15 minutes before your slot time</li>
                            <li>Carry a valid photo ID</li>
                            <li>Follow temple dress code and guidelines</li>
                            <li>Show this QR code at the entrance for entry</li>
                        </ul>

                        <p>May your visit be blessed! 🙏</p>
                    </div>
                    <div class="footer">
                        <p>This is an automated message. Please do not reply.</p>
                        <p>&copy; 2026 Temple Management System</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getCapacityAlertTemplate(temple, alert) {
        const emoji = alert.level === 'CRITICAL' ? '🚨' : '⚠️';
        const color = alert.level === 'CRITICAL' ? '#dc2626' : '#f59e0b';

        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .alert-header { background: ${color}; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                    .stats { background: white; padding: 20px; border-radius: 8px; margin: 20px 0; }
                    .stat-row { display: flex; justify-content: space-between; padding: 10px 0; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="alert-header">
                        <h1>${emoji} ${alert.level} CAPACITY ALERT</h1>
                        <h2>${temple.name}</h2>
                    </div>
                    <div class="content">
                        <p><strong>Alert Message:</strong></p>
                        <p>${alert.message}</p>

                        <div class="stats">
                            <div class="stat-row">
                                <strong>Current Count:</strong>
                                <span>${temple.live_count || 0}</span>
                            </div>
                            <div class="stat-row">
                                <strong>Total Capacity:</strong>
                                <span>${temple.capacity.total}</span>
                            </div>
                            <div class="stat-row">
                                <strong>Occupancy:</strong>
                                <span>${alert.percentage}%</span>
                            </div>
                            <div class="stat-row">
                                <strong>Status:</strong>
                                <span style="color: ${color};">${alert.level}</span>
                            </div>
                        </div>

                        <p><strong>Recommended Action:</strong></p>
                        <p>${alert.action}</p>

                        <p>Timestamp: ${new Date().toLocaleString()}</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    getCancellationTemplate(booking, temple) {
        return `
            <!DOCTYPE html>
            <html>
            <head>
                <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background: #dc2626; color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                    .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
                </style>
            </head>
            <body>
                <div class="container">
                    <div class="header">
                        <h1>❌ Booking Cancelled</h1>
                    </div>
                    <div class="content">
                        <p>Dear ${booking.userName || 'Devotee'},</p>
                        <p>Your booking for ${temple.name} has been cancelled.</p>
                        
                        <p><strong>Cancelled Booking Details:</strong></p>
                        <ul>
                            <li>Temple: ${temple.name}</li>
                            <li>Date: ${new Date(booking.date).toLocaleDateString()}</li>
                            <li>Time Slot: ${booking.slot}</li>
                            <li>Pass ID: ${booking.passId}</li>
                        </ul>

                        ${booking.payment.status === 'PAID' ? '<p><strong>Refund Status:</strong> Your payment will be refunded within 5-7 business days.</p>' : ''}

                        <p>You can make a new booking anytime through our system.</p>
                        <p>Thank you for your understanding.</p>
                    </div>
                </div>
            </body>
            </html>
        `;
    }
}

// Export singleton instance
module.exports = new NotificationService();
