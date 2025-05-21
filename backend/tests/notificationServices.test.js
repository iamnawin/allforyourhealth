const mongoose = require('mongoose');
const { expect } = require('chai');
const sinon = require('sinon');
const axios = require('axios');
const admin = require('firebase-admin');

const User = require('../models/userModel');
const whatsappService = require('../services/whatsappService');
const pushNotificationService = require('../services/pushNotificationService');

describe('Notification Services Tests', () => {
  // Sample test data
  const testUser = {
    _id: new mongoose.Types.ObjectId(),
    firstName: 'Test',
    lastName: 'User',
    email: 'test@example.com',
    phone: '+919876543210',
    deviceTokens: ['test-device-token-1', 'test-device-token-2'],
    notificationPreferences: {
      whatsappNotifications: true,
      pushNotifications: true,
      caregiverNotifications: true
    },
    caregiver: {
      name: 'Test Caregiver',
      phone: '+919876543211',
      relationship: 'Family'
    }
  };

  const testMedication = {
    _id: new mongoose.Types.ObjectId(),
    name: 'Test Medication',
    dosage: '10mg',
    time: '09:00 AM'
  };

  const testAppointment = {
    _id: new mongoose.Types.ObjectId(),
    doctorName: 'Dr. Test',
    date: '2025-05-25',
    time: '10:00 AM',
    location: 'Test Clinic'
  };

  const testDietPlan = {
    _id: new mongoose.Types.ObjectId(),
    mealType: 'Breakfast',
    time: '08:00 AM',
    description: 'Oatmeal with fruits'
  };

  const testVitalsCheck = {
    _id: new mongoose.Types.ObjectId(),
    type: 'Blood Pressure',
    time: '07:00 PM'
  };

  beforeEach(() => {
    // Stub User.findById to return test user
    sinon.stub(User, 'findById').resolves(testUser);
    
    // Stub axios.post for WhatsApp API calls
    sinon.stub(axios, 'post').resolves({ data: { messages: [{ id: 'test-whatsapp-message-id' }] } });
    
    // Stub Firebase messaging for push notifications
    sinon.stub(admin.messaging(), 'send').resolves('test-fcm-message-id');
    sinon.stub(admin.messaging(), 'sendMulticast').resolves({ 
      successCount: 2, 
      failureCount: 0 
    });
  });

  afterEach(() => {
    // Restore all stubs
    sinon.restore();
  });

  describe('WhatsApp Notification Service', () => {
    it('should send medication reminder to user', async () => {
      const result = await whatsappService.sendMedicationReminder(testUser._id, testMedication);
      
      expect(result.success).to.be.true;
      expect(axios.post.calledOnce).to.be.true;
      
      const callArgs = axios.post.getCall(0).args;
      expect(callArgs[1].template.name).to.equal('medication_reminder');
      expect(callArgs[1].to).to.equal(testUser.phone);
    });

    it('should send medication reminder to caregiver', async () => {
      const result = await whatsappService.sendMedicationReminder(testUser._id, testMedication);
      
      expect(result.success).to.be.true;
      expect(axios.post.calledTwice).to.be.true;
      
      const callArgs = axios.post.getCall(1).args;
      expect(callArgs[1].template.name).to.equal('caregiver_medication_reminder');
      expect(callArgs[1].to).to.equal(testUser.caregiver.phone);
    });

    it('should handle missing user phone number', async () => {
      // Modify test user to have no phone number
      const noPhoneUser = { ...testUser, phone: null };
      User.findById.resolves(noPhoneUser);
      
      const result = await whatsappService.sendMedicationReminder(testUser._id, testMedication);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('phone number not available');
      expect(axios.post.called).to.be.false;
    });

    it('should respect user WhatsApp notification preferences', async () => {
      // Modify test user to disable WhatsApp notifications
      const noWhatsappUser = { 
        ...testUser, 
        notificationPreferences: { 
          ...testUser.notificationPreferences, 
          whatsappNotifications: false 
        } 
      };
      User.findById.resolves(noWhatsappUser);
      
      const result = await whatsappService.sendMedicationReminder(testUser._id, testMedication);
      
      // Should still return success but not call WhatsApp API for user
      expect(result.success).to.be.true;
      expect(axios.post.calledOnce).to.be.true; // Only for caregiver
      
      const callArgs = axios.post.getCall(0).args;
      expect(callArgs[1].to).to.equal(testUser.caregiver.phone);
    });
  });

  describe('Push Notification Service', () => {
    it('should send medication reminder push notification', async () => {
      const result = await pushNotificationService.sendMedicationReminder(testUser._id, testMedication);
      
      expect(result.success).to.be.true;
      expect(admin.messaging().sendMulticast.calledOnce).to.be.true;
      
      const callArgs = admin.messaging().sendMulticast.getCall(0).args[0];
      expect(callArgs.tokens).to.deep.equal(testUser.deviceTokens);
      expect(callArgs.notification.title).to.equal('Medication Reminder');
      expect(callArgs.data.medicationName).to.equal(testMedication.name);
    });

    it('should handle missing device tokens', async () => {
      // Modify test user to have no device tokens
      const noTokensUser = { ...testUser, deviceTokens: [] };
      User.findById.resolves(noTokensUser);
      
      const result = await pushNotificationService.sendMedicationReminder(testUser._id, testMedication);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('no device tokens available');
      expect(admin.messaging().sendMulticast.called).to.be.false;
    });

    it('should respect user push notification preferences', async () => {
      // Modify test user to disable push notifications
      const noPushUser = { 
        ...testUser, 
        notificationPreferences: { 
          ...testUser.notificationPreferences, 
          pushNotifications: false 
        } 
      };
      User.findById.resolves(noPushUser);
      
      const result = await pushNotificationService.sendMedicationReminder(testUser._id, testMedication);
      
      expect(result.success).to.be.false;
      expect(result.error).to.include('Push notifications not enabled');
      expect(admin.messaging().sendMulticast.called).to.be.false;
    });
  });

  describe('Integration Tests', () => {
    it('should send both WhatsApp and push notifications for appointment reminder', async () => {
      const whatsappResult = await whatsappService.sendAppointmentReminder(testUser._id, testAppointment);
      const pushResult = await pushNotificationService.sendAppointmentReminder(testUser._id, testAppointment);
      
      expect(whatsappResult.success).to.be.true;
      expect(pushResult.success).to.be.true;
      
      expect(axios.post.calledTwice).to.be.true; // User and caregiver
      expect(admin.messaging().sendMulticast.calledOnce).to.be.true;
    });

    it('should send both WhatsApp and push notifications for diet plan reminder', async () => {
      const whatsappResult = await whatsappService.sendDietPlanReminder(testUser._id, testDietPlan);
      const pushResult = await pushNotificationService.sendDietPlanReminder(testUser._id, testDietPlan);
      
      expect(whatsappResult.success).to.be.true;
      expect(pushResult.success).to.be.true;
      
      expect(axios.post.calledTwice).to.be.true; // User and caregiver
      expect(admin.messaging().sendMulticast.calledOnce).to.be.true;
    });

    it('should send both WhatsApp and push notifications for vitals check reminder', async () => {
      const whatsappResult = await whatsappService.sendVitalsCheckReminder(testUser._id, testVitalsCheck);
      const pushResult = await pushNotificationService.sendVitalsCheckReminder(testUser._id, testVitalsCheck);
      
      expect(whatsappResult.success).to.be.true;
      expect(pushResult.success).to.be.true;
      
      expect(axios.post.calledTwice).to.be.true; // User and caregiver
      expect(admin.messaging().sendMulticast.calledOnce).to.be.true;
    });
  });
});
