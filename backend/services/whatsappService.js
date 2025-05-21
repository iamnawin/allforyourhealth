const axios = require('axios');
const User = require('../models/userModel');
const config = require('../config/config');

/**
 * WhatsApp Notification Service
 * 
 * This service handles sending WhatsApp notifications using the WhatsApp Business API
 * It supports sending notifications to both users and their caregivers
 */
class WhatsappService {
  constructor() {
    this.apiUrl = config.whatsapp.apiUrl;
    this.authToken = config.whatsapp.authToken;
    this.fromPhoneNumberId = config.whatsapp.phoneNumberId;
  }

  /**
   * Send a WhatsApp message
   * @param {string} to - Recipient phone number with country code (e.g., +919876543210)
   * @param {string} templateName - Name of the template to use
   * @param {Array} templateParams - Parameters to fill in the template
   * @returns {Promise} - Response from WhatsApp API
   */
  async sendTemplateMessage(to, templateName, templateParams) {
    try {
      // Format the phone number if needed
      const formattedNumber = this.formatPhoneNumber(to);
      
      // Prepare template components
      const components = [];
      if (templateParams && templateParams.length > 0) {
        components.push({
          type: "body",
          parameters: templateParams.map(param => ({
            type: "text",
            text: param
          }))
        });
      }

      // Prepare the request payload
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedNumber,
        type: "template",
        template: {
          name: templateName,
          language: {
            code: "en"
          },
          components: components.length > 0 ? components : undefined
        }
      };

      // Send the request to WhatsApp API
      const response = await axios.post(
        `${this.apiUrl}/v1/${this.fromPhoneNumberId}/messages`,
        payload,
        {
          headers: {
            'Authorization': `Bearer ${this.authToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('WhatsApp message sent successfully:', response.data);
      return response.data;
    } catch (error) {
      console.error('Error sending WhatsApp message:', error.response?.data || error.message);
      throw error;
    }
  }

  /**
   * Format phone number to ensure it has country code
   * @param {string} phoneNumber - Phone number to format
   * @returns {string} - Formatted phone number
   */
  formatPhoneNumber(phoneNumber) {
    // Remove any spaces, dashes, or parentheses
    let formatted = phoneNumber.replace(/[\s\-\(\)]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  /**
   * Send medication reminder
   * @param {string} userId - User ID
   * @param {Object} medication - Medication details
   * @returns {Promise} - Response from WhatsApp API
   */
  async sendMedicationReminder(userId, medication) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.phone) {
        throw new Error('User not found or phone number not available');
      }

      // Send to user
      if (user.notificationPreferences?.whatsappNotifications) {
        await this.sendTemplateMessage(
          user.phone,
          'medication_reminder',
          [
            medication.name,
            medication.dosage,
            medication.time || 'now'
          ]
        );
      }

      // Send to caregiver if configured
      if (user.caregiver && user.caregiver.phone && user.notificationPreferences?.caregiverNotifications) {
        await this.sendTemplateMessage(
          user.caregiver.phone,
          'caregiver_medication_reminder',
          [
            user.firstName,
            medication.name,
            medication.dosage,
            medication.time || 'now'
          ]
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending medication reminder via WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send appointment reminder
   * @param {string} userId - User ID
   * @param {Object} appointment - Appointment details
   * @returns {Promise} - Response from WhatsApp API
   */
  async sendAppointmentReminder(userId, appointment) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.phone) {
        throw new Error('User not found or phone number not available');
      }

      // Send to user
      if (user.notificationPreferences?.whatsappNotifications) {
        await this.sendTemplateMessage(
          user.phone,
          'appointment_reminder',
          [
            appointment.doctorName || 'your doctor',
            appointment.date,
            appointment.time,
            appointment.location || 'the clinic'
          ]
        );
      }

      // Send to caregiver if configured
      if (user.caregiver && user.caregiver.phone && user.notificationPreferences?.caregiverNotifications) {
        await this.sendTemplateMessage(
          user.caregiver.phone,
          'caregiver_appointment_reminder',
          [
            user.firstName,
            appointment.doctorName || 'the doctor',
            appointment.date,
            appointment.time,
            appointment.location || 'the clinic'
          ]
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending appointment reminder via WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send diet plan reminder
   * @param {string} userId - User ID
   * @param {Object} dietPlan - Diet plan details
   * @returns {Promise} - Response from WhatsApp API
   */
  async sendDietPlanReminder(userId, dietPlan) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.phone) {
        throw new Error('User not found or phone number not available');
      }

      // Send to user
      if (user.notificationPreferences?.whatsappNotifications) {
        await this.sendTemplateMessage(
          user.phone,
          'diet_reminder',
          [
            dietPlan.mealType || 'meal',
            dietPlan.time || 'now',
            dietPlan.description || 'as per your diet plan'
          ]
        );
      }

      // Send to caregiver if configured
      if (user.caregiver && user.caregiver.phone && user.notificationPreferences?.caregiverNotifications) {
        await this.sendTemplateMessage(
          user.caregiver.phone,
          'caregiver_diet_reminder',
          [
            user.firstName,
            dietPlan.mealType || 'meal',
            dietPlan.time || 'now'
          ]
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending diet plan reminder via WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Send vitals check reminder
   * @param {string} userId - User ID
   * @param {Object} vitalsCheck - Vitals check details
   * @returns {Promise} - Response from WhatsApp API
   */
  async sendVitalsCheckReminder(userId, vitalsCheck) {
    try {
      const user = await User.findById(userId);
      if (!user || !user.phone) {
        throw new Error('User not found or phone number not available');
      }

      // Send to user
      if (user.notificationPreferences?.whatsappNotifications) {
        await this.sendTemplateMessage(
          user.phone,
          'vitals_reminder',
          [
            vitalsCheck.type || 'vitals',
            vitalsCheck.time || 'now'
          ]
        );
      }

      // Send to caregiver if configured
      if (user.caregiver && user.caregiver.phone && user.notificationPreferences?.caregiverNotifications) {
        await this.sendTemplateMessage(
          user.caregiver.phone,
          'caregiver_vitals_reminder',
          [
            user.firstName,
            vitalsCheck.type || 'vitals',
            vitalsCheck.time || 'now'
          ]
        );
      }

      return { success: true };
    } catch (error) {
      console.error('Error sending vitals check reminder via WhatsApp:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new WhatsappService();
