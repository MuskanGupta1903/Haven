import React, { useState, useEffect } from 'react';
import { Incident } from '../types';
import { P2PSyncManager } from '../utils/p2pSync';
import { Radio } from 'lucide-react';

interface PeerBroadcastModalProps {
  isOpen: boolean;
  onClose: () => void;
  incidents: Incident[];
  onImportIncidents: (newIncidents: Incident[]) => void;
}

export const PeerBroadcastModal: React.FC<PeerBroadcastModalProps> = ({
  isOpen,
  onClose,
  incidents,
  onImportIncidents
}) => {
  const [role, setRole] = useState<'host' | 'join'>('host');
  const [manager, setManager] = useState<P2PSyncManager | null>(null);
  const [offerToken, setOfferToken] = useState<string>('');
  const [answerTokenInput, setAnswerTokenInput] = useState<string>('');
  const [answerTokenOutput, setAnswerTokenOutput] = useState<string>('');
  const [status, setStatus] = useState<string>('Ready to initialize P2P mesh connection');
  const [copied, setCopied] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const mgr = new P2PSyncManager();
      mgr.onConnectionStateChange((state) => {
        const connected = state === 'connected';
        setIsConnected(connected);
        setStatus(`P2P State: ${state}`);
      });
      mgr.onIncidentsReceived((received) => {
        onImportIncidents(received);
        setStatus(`Successfully synced ${received.length} incident reports from peer!`);
      });
      setManager(mgr);
    } else {
      manager?.close();
      setManager(null);
      setOfferToken('');
      setAnswerTokenInput('');
      setAnswerTokenOutput('');
      setStatus('Ready');
      setIsConnected(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleGenerateOffer = async () => {
    if (!manager) return;
    try {
      setStatus('Generating P2P Connection Token...');
      const token = await manager.createOfferToken();
      setOfferToken(token);
      setStatus('Token generated! Share this token with your nearby rescue peer.');
    } catch (e: any) {
      setStatus(`Failed to generate token: ${e.message}`);
    }
  };

  const handleConnectAnswer = async () => {
    if (!manager || !answerTokenInput) return;
    try {
      await manager.acceptAnswerToken(answerTokenInput);
      setStatus('Connection established! Syncing data...');
    } catch (e: any) {
      setStatus(`Connection failed: ${e.message}`);
    }
  };

  const handleJoinOffer = async () => {
    if (!manager || !answerTokenInput) return;
    try {
      setStatus('Connecting to host token...');
      const ansToken = await manager.acceptOfferToken(answerTokenInput);
      setAnswerTokenOutput(ansToken);
      setStatus('Answer token generated! Send this back to host.');
    } catch (e: any) {
      setStatus(`Failed: ${e.message}`);
    }
  };

  const handleSendIncidents = () => {
    if (!manager) return;
    const ok = manager.sendIncidents(incidents);
    if (ok) {
      setStatus(`Sent ${incidents.length} incidents to peer!`);
    } else {
      setStatus('Data channel not open yet. Make sure connection is connected.');
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const inputClass =
    'w-full bg-slate-800 border border-ocean-800 text-xs rounded-xl px-3 py-2 text-slate-300 placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-ocean-500 focus:border-ocean-600';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
      <div className="bg-slate-950/95 backdrop-blur-xl border border-ocean-800/60 rounded-2xl shadow-2xl max-w-lg w-full p-6 text-white relative">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-ocean-500/20 rounded-xl border border-ocean-500/30">
              <Radio className="w-5 h-5 text-ocean-400" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">P2P Mesh Broadcast</h3>
              <p className="text-xs text-slate-500">WebRTC · Offline · Device-to-Device</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-500 hover:text-white hover:bg-white/10 rounded-full p-1.5 transition-all text-lg font-bold"
          >
            ✕
          </button>
        </div>

        {/* Role Toggle */}
        <div className="flex gap-1 mb-5 bg-slate-900 p-1 rounded-xl border border-white/5">
          {(['host', 'join'] as const).map((r) => (
            <button
              key={r}
              onClick={() => setRole(r)}
              className={`flex-1 py-2 text-sm rounded-lg font-semibold transition-all ${
                role === r
                  ? 'bg-ocean-600 text-white shadow-lg shadow-ocean-900/50'
                  : 'text-slate-500 hover:text-slate-300'
              }`}
            >
              {r === 'host' ? '📡 Host / Broadcast' : '📥 Join / Receive'}
            </button>
          ))}
        </div>

        {role === 'host' ? (
          <div className="space-y-4 text-sm">
            {!offerToken ? (
              <button
                onClick={handleGenerateOffer}
                className="w-full bg-ocean-600 hover:bg-ocean-500 text-white font-bold py-2.5 rounded-xl transition-all shadow-lg shadow-ocean-900/40"
              >
                Generate Connection Token
              </button>
            ) : (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                  1. Share this token with your nearby rescue peer:
                </label>
                <div className="flex gap-2">
                  <input readOnly value={offerToken} className={inputClass} />
                  <button
                    onClick={() => copyToClipboard(offerToken)}
                    className="bg-ocean-700 hover:bg-ocean-600 border border-ocean-600 px-3 py-1.5 text-xs rounded-xl font-semibold text-ocean-200 whitespace-nowrap transition-all"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}

            {offerToken && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                  2. Paste peer's Answer Token:
                </label>
                <textarea
                  rows={2}
                  value={answerTokenInput}
                  onChange={(e) => setAnswerTokenInput(e.target.value)}
                  placeholder="Paste the Answer Token here..."
                  className={`${inputClass} resize-none`}
                />
                <button
                  onClick={handleConnectAnswer}
                  className="w-full mt-2 bg-emerald-700 hover:bg-emerald-600 text-white font-bold py-2 rounded-xl transition-all"
                >
                  Establish P2P Link
                </button>
              </div>
            )}
          </div>
        ) : (
          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                1. Paste Host's Broadcast Token:
              </label>
              <textarea
                rows={2}
                value={answerTokenInput}
                onChange={(e) => setAnswerTokenInput(e.target.value)}
                placeholder="Paste Host token here..."
                className={`${inputClass} resize-none`}
              />
              <button
                onClick={handleJoinOffer}
                className="w-full mt-2 bg-ocean-600 hover:bg-ocean-500 text-white font-bold py-2 rounded-xl transition-all"
              >
                Generate Answer Token
              </button>
            </div>

            {answerTokenOutput && (
              <div>
                <label className="block text-xs text-slate-400 mb-1.5 uppercase tracking-wider">
                  2. Send this Answer Token back to host:
                </label>
                <div className="flex gap-2">
                  <input readOnly value={answerTokenOutput} className={inputClass} />
                  <button
                    onClick={() => copyToClipboard(answerTokenOutput)}
                    className="bg-ocean-700 hover:bg-ocean-600 border border-ocean-600 px-3 py-1.5 text-xs rounded-xl font-semibold text-ocean-200 whitespace-nowrap transition-all"
                  >
                    {copied ? '✓ Copied' : 'Copy'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Status Bar */}
        <div className="mt-5 pt-4 border-t border-ocean-900/60 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <span
              className={`w-2 h-2 rounded-full flex-shrink-0 ${
                isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
              }`}
            />
            <span className="text-xs text-ocean-300 font-mono truncate">{status}</span>
          </div>
          <button
            onClick={handleSendIncidents}
            className="bg-emerald-700 hover:bg-emerald-600 text-white font-bold px-4 py-1.5 text-xs rounded-xl whitespace-nowrap transition-all flex-shrink-0"
          >
            Broadcast ({incidents.length})
          </button>
        </div>
      </div>
    </div>
  );
};
