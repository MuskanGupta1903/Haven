import { IncidentResponse } from '../types';

/**
 * Google Sheets Webhook Integration
 *
 * This service allows real-time syncing to Google Sheets via a webhook URL.
 * Users can set up a Google Apps Script to receive submissions automatically.
 *
 * Setup Instructions (provided to users):
 * 1. Create a new Google Sheet
 * 2. Go to Extensions → Apps Script
 * 3. Paste the provided webhook script
 * 4. Deploy as Web App
 * 5. Copy the webhook URL and paste it into CrisisKit
 */

export interface WebhookConfig {
  webhookUrl: string;
  enabled: boolean;
}

export class GoogleSheetsWebhookService {
  private static STORAGE_KEY = 'crisiskit_webhook_config';

  /**
   * Save webhook configuration to localStorage
   */
  static saveConfig(incidentId: string, config: WebhookConfig): void {
    const allConfigs = this.getAllConfigs();
    allConfigs[incidentId] = config;
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(allConfigs));
  }

  /**
   * Get webhook configuration for an incident
   */
  static getConfig(incidentId: string): WebhookConfig | null {
    const allConfigs = this.getAllConfigs();
    return allConfigs[incidentId] || null;
  }

  /**
   * Get all webhook configurations
   */
  private static getAllConfigs(): Record<string, WebhookConfig> {
    const stored = localStorage.getItem(this.STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * Send a response to the configured Google Sheets webhook
   */
  static async sendToWebhook(
    incidentId: string,
    response: IncidentResponse
  ): Promise<{ success: boolean; error?: string }> {
    const config = this.getConfig(incidentId);

    if (!config || !config.enabled || !config.webhookUrl) {
      return { success: false, error: 'Webhook not configured or disabled' };
    }

    try {
      const payload = {
        timestamp: new Date(response.submittedAt).toISOString(),
        status: response.status || 'pending',
        name: response.name,
        contact: response.contact,
        region: response.region || '',
        district: response.district || '',
        location: response.location,
        needs: response.needs,
        urgency: response.aiClassification?.urgency || '',
        reasoning: response.aiClassification?.reasoning || '',
        assignedTo: response.assignedTo || '',
        notes: response.notes || ''
      };

      const result = await fetch(config.webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        mode: 'no-cors' // Google Apps Script requires no-cors
      });

      // Note: With no-cors mode, we can't read the response
      // We'll assume success if no error is thrown
      return { success: true };
    } catch (error) {
      console.error('Failed to send to webhook:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Test a webhook URL
   */
  static async testWebhook(webhookUrl: string): Promise<{ success: boolean; error?: string }> {
    try {
      const testPayload = {
        timestamp: new Date().toISOString(),
        status: 'pending',
        name: 'Test Submission',
        contact: '000-0000-0000',
        region: 'Test Region',
        district: 'Test District',
        location: 'Test Location',
        needs: 'This is a test submission from CrisisKit. If you see this, your webhook is working!',
        urgency: 'LOW',
        reasoning: 'Test submission',
        assignedTo: '',
        notes: 'Test'
      };

      await fetch(webhookUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload),
        mode: 'no-cors'
      });

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }
}

/**
 * Google Apps Script Code (to be provided to users)
 *
 * This is the code users need to paste into their Google Sheets Apps Script:
 */
export const APPS_SCRIPT_CODE = `
function doPost(e) {
  try {
    // Get the active spreadsheet
    var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();

    // Parse the incoming JSON data
    var data = JSON.parse(e.postData.contents);

    // Check if headers exist, if not, add them
    if (sheet.getLastRow() === 0) {
      sheet.appendRow([
        'Timestamp',
        'Status',
        'Name',
        'Contact',
        'Region',
        'District',
        'Location',
        'Needs',
        'Urgency',
        'AI Reasoning',
        'Assigned To',
        'Notes'
      ]);

      // Format header row
      var headerRange = sheet.getRange(1, 1, 1, 12);
      headerRange.setFontWeight('bold');
      headerRange.setBackground('#4285f4');
      headerRange.setFontColor('#ffffff');
    }

    // Append the new row
    sheet.appendRow([
      data.timestamp,
      data.status,
      data.name,
      data.contact,
      data.region,
      data.district,
      data.location,
      data.needs,
      data.urgency,
      data.reasoning,
      data.assignedTo,
      data.notes
    ]);

    // Auto-resize columns
    sheet.autoResizeColumns(1, 12);

    // Color code by urgency
    var lastRow = sheet.getLastRow();
    var urgencyCell = sheet.getRange(lastRow, 9); // Urgency column
    var rowRange = sheet.getRange(lastRow, 1, 1, 12);

    if (data.urgency === 'CRITICAL') {
      rowRange.setBackground('#fee');
      urgencyCell.setFontWeight('bold');
      urgencyCell.setFontColor('#c00');
    } else if (data.urgency === 'MODERATE') {
      rowRange.setBackground('#ffc');
      urgencyCell.setFontWeight('bold');
      urgencyCell.setFontColor('#f90');
    }

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success',
      row: lastRow
    })).setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error',
      message: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
`.trim();
