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

  const stepBorder = 'border-l-2 border-ocean-600 pl-4';
  const stepHeading = 'font-bold text-white mb-2 text-sm';
  const stepBody = 'text-sm text-slate-400 mb-3';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-ocean-800/60 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto text-white">
        {/* Header */}
        <div className="bg-gradient-to-r from-ocean-800 to-ocean-700 border-b border-ocean-600/60 px-6 py-4 flex justify-between items-center sticky top-0 z-10 rounded-t-2xl">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Sheet className="w-5 h-5 text-ocean-300" />
            Integration Settings — Google Sheets
          </h3>
          <button onClick={onClose} className="text-ocean-200 hover:text-white transition-colors p-1 rounded-lg hover:bg-white/10">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Step 1 */}
          <div className={stepBorder}>
            <h4 className={stepHeading}>Step 1: Create Google Sheet</h4>
            <p className={stepBody}>
              Create a new Google Sheet where submissions will be synced automatically.
            </p>
            <a
              href="https://sheets.new"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center text-sm text-ocean-400 hover:text-ocean-300 font-medium transition-colors"
            >
              Open Google Sheets <ExternalLink className="w-4 h-4 ml-1" />
            </a>
          </div>

          {/* Step 2 */}
          <div className={stepBorder}>
            <h4 className={stepHeading}>Step 2: Setup Apps Script</h4>
            <p className={stepBody}>In your Google Sheet:</p>
            <ol className="text-sm text-slate-400 space-y-1 list-decimal list-inside mb-3">
              <li>Click <strong className="text-white">Extensions</strong> → <strong className="text-white">Apps Script</strong></li>
              <li>Delete any existing code</li>
              <li>Paste the script below</li>
              <li>Click <strong className="text-white">Deploy</strong> → <strong className="text-white">New deployment</strong></li>
              <li>Type: <strong className="text-white">Web app</strong></li>
              <li>Execute as: <strong className="text-white">Me</strong></li>
              <li>Who has access: <strong className="text-white">Anyone</strong></li>
              <li>Click <strong className="text-white">Deploy</strong></li>
              <li>Copy the <strong className="text-white">Web app URL</strong></li>
            </ol>

            <div className="bg-slate-900/80 border border-white/5 rounded-xl p-3 relative">
              <button
                onClick={() => setShowScript(!showScript)}
                className="text-sm font-medium text-ocean-400 hover:text-ocean-300 mb-2 flex items-center transition-colors"
              >
                {showScript ? '▼' : '▶'} {showScript ? 'Hide' : 'Show'} Apps Script Code
              </button>

              {showScript && (
                <div className="relative">
                  <pre className="text-xs bg-slate-950 text-emerald-400 p-4 rounded-xl overflow-x-auto max-h-64 overflow-y-auto border border-white/5">
                    {APPS_SCRIPT_CODE}
                  </pre>
                  <button
                    onClick={copyScript}
                    className="absolute top-2 right-2 p-2 bg-slate-800 hover:bg-slate-700 border border-white/10 rounded-lg text-white text-xs flex items-center gap-1 transition-all"
                  >
                    <Copy className="w-3 h-3" /> Copy
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Step 3 */}
          <div className={stepBorder}>
            <h4 className={stepHeading}>Step 3: Paste Webhook URL</h4>
            <p className={stepBody}>
              Paste the Web app URL you copied from Apps Script:
            </p>
            <input
              type="url"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              placeholder="https://script.google.com/macros/s/..."
              className="w-full px-4 py-3 bg-slate-800 border border-ocean-700/60 text-white placeholder-slate-500 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Test Section */}
          {webhookUrl && (
            <div className="bg-ocean-900/30 border border-ocean-700/50 rounded-xl p-4">
              <p className="text-sm text-slate-300 mb-3">
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
                <div className={`mt-3 p-3 rounded-xl flex items-start gap-2 ${
                  testResult.success
                    ? 'bg-emerald-900/30 text-emerald-300 border border-emerald-600/40'
                    : 'bg-coral-900/30 text-coral-300 border border-coral-600/40'
                }`}>
                  {testResult.success ? (
                    <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5 text-coral-400" />
                  )}
                  <span className="text-sm">{testResult.message}</span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3 pt-4 border-t border-white/5">
            <Button onClick={handleSave} className="flex-1">
              <CheckCircle className="mr-2 h-4 w-4" />
              Enable Auto-Sync
            </Button>
            <Button onClick={handleDisable} variant="secondary">
              Disable
            </Button>
          </div>

          {/* Info Box */}
          <div className="bg-slate-900/50 border border-slate-700/50 rounded-xl p-4">
            <p className="text-xs text-slate-500">
              <strong className="text-slate-400">Note:</strong> Once enabled, all new submissions will automatically appear in your Google Sheet in real-time.
              You can still use the "Open in Sheets" button to export existing data.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
