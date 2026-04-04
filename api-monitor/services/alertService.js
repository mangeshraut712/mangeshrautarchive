const nodemailer = require('nodemailer');
const { WebClient } = require('@slack/web-api');
const LoggerService = require('./logger');

class AlertService {
  constructor() {
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: process.env.SMTP_PORT || 587,
      secure: false,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    this.slackClient = process.env.SLACK_TOKEN ? new WebClient(process.env.SLACK_TOKEN) : null;
  }

  async sendEmailAlert(to, subject, message) {
    if (!process.env.SMTP_USER) {
      console.warn('SMTP not configured, skipping email alert');
      return;
    }

    try {
      await this.emailTransporter.sendMail({
        from: process.env.SMTP_USER,
        to,
        subject,
        text: message,
      });
      LoggerService.logAlertSent('email', null, message);
    } catch (error) {
      console.error('Failed to send email alert:', error);
    }
  }

  async sendSlackAlert(channel, message) {
    if (!this.slackClient) {
      console.warn('Slack not configured, skipping Slack alert');
      return;
    }

    try {
      await this.slackClient.chat.postMessage({
        channel,
        text: message,
      });
      LoggerService.logAlertSent('slack', null, message);
    } catch (error) {
      console.error('Failed to send Slack alert:', error);
    }
  }

  async alertEndpointDown(endpoint, error) {
    const message = `🚨 API Endpoint Down: ${endpoint.method} ${endpoint.url}\nError: ${error}\nTime: ${new Date().toISOString()}`;

    // Send email if configured
    if (process.env.ALERT_EMAIL) {
      await this.sendEmailAlert(
        process.env.ALERT_EMAIL,
        'API Monitor Alert: Endpoint Down',
        message
      );
    }

    // Send Slack if configured
    if (process.env.SLACK_CHANNEL) {
      await this.sendSlackAlert(process.env.SLACK_CHANNEL, message);
    }
  }

  async alertEndpointSlow(endpoint, responseTime) {
    const threshold = process.env.RESPONSE_TIME_THRESHOLD || 5000; // 5 seconds default
    if (responseTime < threshold) return;

    const message = `⚠️ API Endpoint Slow: ${endpoint.method} ${endpoint.url}\nResponse Time: ${responseTime}ms\nThreshold: ${threshold}ms\nTime: ${new Date().toISOString()}`;

    if (process.env.ALERT_EMAIL) {
      await this.sendEmailAlert(
        process.env.ALERT_EMAIL,
        'API Monitor Alert: Slow Response',
        message
      );
    }

    if (process.env.SLACK_CHANNEL) {
      await this.sendSlackAlert(process.env.SLACK_CHANNEL, message);
    }
  }
}

module.exports = new AlertService();
