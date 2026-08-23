import React, { useState } from 'react';
import { Sheet, CheckCircle, AlertCircle, ExternalLink, Copy, X } from 'lucide-react';
import { Button } from './Button';
import { GoogleSheetsWebhookService, APPS_SCRIPT_CODE } from '../services/googleSheetsWebhook';

interface GoogleSheetsSetupProps {
  incidentId: string;
  onClose: () => void;
}

export const GoogleSheetsSetup: React.FC<GoogleSheetsSetupProps> = ({ incidentId, onClose }) => {
  const [webhookUrl, setWebhookUrl] = useState('');
  const [isTesting, setIsTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showScript, setShowScript] = useState(false);

  // Load existing config
  React.useEffect(() => {
    const config = GoogleSheetsWebhookService.getConfig(incidentId);
    if (config) {
      setWebhookUrl(config.webhookUrl);
    }
  }, [incidentId]);

  const handleTest = async () => {
    if (!webhookUrl.trim()) {
      setTestResult({ success: false, message: 'Please enter a webhook URL' });
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    const result = await GoogleSheetsWebhookService.testWebhook(webhookUrl.trim());

    if (result.success) {
      setTestResult({
        success: true,
        message: 'Test submission sent! Check your Google Sheet to confirm it arrived.'
      });
    } else {
      setTestResult({
        success: false,
        message: `Test failed: ${result.error || 'Unknown error'}. Please check your webhook URL and Apps Script deployment.`
      });
    }

    setIsTesting(false);
  };

  const handleSave = () => {
    if (!webhookUrl.trim()) {
      alert('Please enter a webhook URL');
      return;
    }

    GoogleSheetsWebhookService.saveConfig(incidentId, {
      webhookUrl: webhookUrl.trim(),
      enabled: true
    });

    alert('✅ Auto-sync to Google Sheets enabled! New submissions will appear in your sheet automatically.');
    onClose();
  };

  const handleDisable = () => {
    GoogleSheetsWebhookService.saveConfig(incidentId, {
      webhookUrl: '',
      enabled: false
    });

    setWebhookUrl('');
    alert('Auto-sync disabled.');
    onClose();
  };

  const copyScript = () => {
    navigator.clipboard.writeText(APPS_SCRIPT_CODE);
    alert('✅ Script copied to clipboard!');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="bg-green-600 px-6 py-4 flex justify-between items-center sticky top-0">
          <h3 className="text-lg font-bold text-white flex items-center">
            <Sheet className="mr-2 w-5 h-5" />
            Connect Google Sheets Auto-Sync
          </h3>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Step 1: Create Google Sheet</h4>
            <p className="text-sm text-gray-600 mb-3">
              Create a new Google Sheet where submissions will be synced.
            </p>
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-green-600 hover:text-green-800 font-medium"
            >
              Open Google Sheets <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Step 2 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Step 2: Setup Apps Script</h4>
            <p className="text-sm text-gray-600 mb-3">
              In your Google Sheet:
            </p>
            <ol className="text-sm text-gray-700 space-y-1 list-decimal list-inside mb-3">
              <li>Click <strong>Extensions</strong> → <strong>Apps Script</strong></li>
              <li>Delete any existing code</li>
              <li>Paste the script below</li>
              <li>Click <strong>Deploy</strong> → <strong>New deployment</strong></li>
              <li>Type: <strong>Web app</strong></li>
              <li>Execute as: <strong>Me</strong></li>
              <li>Who has access: <strong>Anyone</strong></li>
              <li>Click <strong>Deploy</strong></li>
              <li>Copy the <strong>Web app URL</strong></li>
            </ol>

            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 relative">
              <button
                onClick={() => setShowScript(!showScript)}
                className="text-sm font-medium text-green-600 hover:text-green-800 mb-2 flex items-center"
              >
                {showScript ? '▼' : '▶'} {showScript ? 'Hide' : 'Show'} Apps Script Code
              </button>

              {showScript && (
                <div className="relative">
                  <pre className="text-xs bg-gray-900 text-green-400 p-4 rounded overflow-x-auto max-h-64 overflow-y-auto">
                    {APPS_SCRIPT_CODE}
                  </pre>
                  <button
                    onClick={copyScript}
                    className="absolute top-2 right-2 p-2 bg-gray-800 hover:bg-gray-700 rounded text-white text-xs flex items-center gap-1"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div className="border-l-4 border-green-500 pl-4">
            <h4 className="font-bold text-gray-900 mb-2">Step 3: Paste Webhook URL</h4>
            <p className="text-sm text-gray-600 mb-3">
              Paste the Web app URL you copied from Apps Script:
            </p>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>

          {/* Test Section */}
          {webhookUrl && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <p className="text-sm text-gray-700 mb-3">
                Test your connection by sending a test submission to your sheet:
              </p>
              <Button
                onClick={handleTest}
                variant="secondary"
                disabled={isTesting}
                className="w-full"
              >
                {isTesting ? 'Sending test...' : 'Send Test Submission'}
              </Button>

              {testResult && (
                <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                  testResult.success ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t">
            <Button onClick={handleSave} className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Enable Auto-Sync
            </Button>
            <Button onClick={handleDisable} variant="secondary">
              Disable
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
            <p className="text-xs text-gray-600">
              <strong>Note:</strong> Once enabled, all new submissions will automatically appear in your Google Sheet in real-time.
              You can still use the "Open in Sheets" button to export existing data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
