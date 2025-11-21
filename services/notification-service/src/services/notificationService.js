const Notification = require('../models/Notification');

class NotificationService {
  constructor(logger) {
    this.logger = logger;
  }

  async sendEmail(to, subject, body) {
    // Mock email sending
    this.logger.info('Mock email sent', { to, subject });
    return { success: true, provider: 'mock' };
  }

  async sendSMS(to, message) {
    // Mock SMS sending
    this.logger.info('Mock SMS sent', { to, message });
    return { success: true, provider: 'mock' };
  }

  async createNotification(notificationData) {
    try {
      const notification = new Notification(notificationData);
      await notification.save();

      // Send notification based on type
      if (notification.type === 'email') {
        const result = await this.sendEmail(
          notification.recipientEmail,
          notification.subject,
          notification.body
        );
        
        if (result.success) {
          notification.status = 'sent';
          notification.sentAt = new Date();
        } else {
          notification.status = 'failed';
          notification.failureReason = 'Email sending failed';
        }
        
        await notification.save();
      }

      this.logger.info('Notification created', { 
        notificationId: notification._id,
        category: notification.category 
      });

      return notification;
    } catch (error) {
      this.logger.error('Create notification error:', { error: error.message });
      throw error;
    }
  }

  async handlePledgeCompleted(event) {
    const { pledgeId, donorUserId, amount, campaignTitle, donorEmail } = event;

    await this.createNotification({
      recipientEmail: donorEmail,
      recipientId: donorUserId,
      type: 'email',
      category: 'payment_success',
      subject: 'Thank you for your donation!',
      body: `Your donation of ${amount} BDT to ${campaignTitle} has been successfully processed. Thank you for your generosity!`,
      metadata: { pledgeId, amount }
    });
  }
}

module.exports = NotificationService;
