import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { storageService } from '../services/storage';
import { offlineQueue } from '../services/offlineQueue';
import { Incident } from '../types';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { ImageUpload } from '../components/ImageUpload';
import { CheckCircle, MapPin, ShieldAlert, X, AlertTriangle, WifiOff, MessageSquare, QrCode, ArrowRight, ArrowLeft } from 'lucide-react';
import { VoiceRecorder } from '../components/VoiceRecorder';
import { QRCodeModal } from '../components/QRCodeModal';

const QUICK_NEEDS = [
  { icon: '🚑', label: 'Medical' },
  { icon: '🍞', label: 'Food' },
  { icon: '💧', label: 'Water' },
  { icon: '🏠', label: 'Shelter' },
  { icon: '⚠️', label: 'Trapped' }
];

export const PublicSubmit: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [duplicateWarning, setDuplicateWarning] = useState<string | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [submittedPayload, setSubmittedPayload] = useState<any>(null);

  // Wizard state
  const [step, setStep] = useState(1);
  const [selectedNeeds, setSelectedNeeds] = useState<string[]>([]);

  // SOS & Location State
  const [isLocating, setIsLocating] = useState(false);
  const [locationError, setLocationError] = useState('');
  const [showSafetyTips, setShowSafetyTips] = useState(false);

  // Offline State
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [savedOffline, setSavedOffline] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    region: '',
    district: '',
    location: '',
    needs: '',
    images: [] as string[]
  });

  const availableDistricts = formData.region && incident?.regions
    ? incident.regions.find(r => r.name === formData.region)?.districts || []
    : [];

  useEffect(() => {
    const load = async () => {
      if (!id) return;
      const data = await storageService.getIncidentById(id);
      setIncident(data || null);
      setLoading(false);
    };
    load();
  }, [id]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const toggleNeed = (need: string) => {
    setSelectedNeeds(prev => 
      prev.includes(need) ? prev.filter(n => n !== need) : [...prev, need]
    );
  };

  const handleSOS = () => {
    setLocationError('');
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        const mapLink = `https://www.google.com/maps?q=${latitude},${longitude}`;
        const locString = `${latitude.toFixed(5)}, ${longitude.toFixed(5)} (±${Math.round(accuracy)}m) ${mapLink}`;
        
        setFormData(prev => ({
          ...prev,
          location: locString
        }));
        // Auto-select trapped/SOS if SOS button used
        if (!selectedNeeds.includes('Trapped')) {
           setSelectedNeeds(prev => [...prev, 'Trapped']);
        }
        setIsLocating(false);
      },
      (error) => {
        console.error(error);
        let msg = 'Unable to retrieve location.';
        if (error.code === 1) msg = 'Location permission denied.';
        if (error.code === 2) msg = 'Position unavailable.';
        if (error.code === 3) msg = 'Request timed out.';
        
        setLocationError(msg + ' Please enter manually.');
        setIsLocating(false);
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  const validateStep = () => {
    if (step === 1) {
      if (!formData.location) {
        setLocationError("Please provide your location so responders can find you.");
        return false;
      }
    }
    return true;
  };

  const handleNext = () => {
    setLocationError('');
    if (validateStep()) {
       setStep(s => Math.min(s + 1, 3));
    }
  };

  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || !formData.name) return;

    const finalNeeds = [
        ...selectedNeeds.map(n => `[${n}]`),
        formData.needs
    ].filter(Boolean).join(' ');

    const submissionData = {
      incidentId: id,
      name: formData.name,
      contact: formData.contact,
      needs: finalNeeds || 'No specific needs selected',
      location: formData.location,
      ...(formData.region && { region: formData.region }),
      ...(formData.district && { district: formData.district }),
      ...(formData.images.length > 0 && { images: formData.images })
    };

    if (!isOnline) {
      setIsSubmitting(true);
      try {
        await offlineQueue.add(submissionData);
        setSavedOffline(true);
        setSubmitted(true);
        setDuplicateWarning(null);
        window.scrollTo(0, 0);
      } catch (_error) {
        alert('Failed to save offline. Please try again.');
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    // Online: Check for duplicates
    try {
      const existingResponses = await storageService.getResponses(id);
      const recentDuplicates = existingResponses.filter(r =>
        r.contact === formData.contact &&
        (Date.now() - r.submittedAt) < 3600000
      );

      if (recentDuplicates.length > 0 && !duplicateWarning) {
        const lastSubmission = new Date(recentDuplicates[0].submittedAt).toLocaleTimeString();
        setDuplicateWarning(`You submitted a request at ${lastSubmission}. Click submit again to update your information.`);
        return;
      }
    } catch (_error) {
      // Silently ignore duplicate check errors
    }

    // Online: Submit directly
    setIsSubmitting(true);
    try {
      await storageService.submitResponse(submissionData);
      setSubmittedPayload(submissionData);
      setSubmitted(true);
      setDuplicateWarning(null);
      window.scrollTo(0, 0);
    } catch (_error) {
      try {
        await offlineQueue.add(submissionData);
        setSubmittedPayload(submissionData);
        setSavedOffline(true);
        setSubmitted(true);
      } catch (_offlineError) {
        alert('Failed to submit. Please try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendEmergencySMS = () => {
    const payload = submittedPayload || formData;
    const bodyText = `🚨SOS crisis request:\nName: ${payload.name}\nContact: ${payload.contact}\nNeeds: ${payload.needs}\nLoc: ${payload.location}`;
    window.location.href = `sms:?body=${encodeURIComponent(bodyText)}`;
  };

  if (loading) return <div className="p-8 text-center text-slate-500">Loading form...</div>;
  if (!incident) return <div className="p-8 text-center text-coral-500 font-bold">Form not found or expired.</div>;

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        <div className="fixed inset-0 bg-gradient-to-br from-ocean-500/10 to-primary-500/10 z-[-1]"></div>
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
           <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl py-10 px-6 shadow-xl rounded-[2rem] border border-white/60 dark:border-slate-700/50 text-center relative z-10">
             {savedOffline ? (
               <>
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-slate-100 dark:bg-slate-800 mb-6 shadow-inner border border-slate-200 dark:border-slate-700">
                   <WifiOff className="h-8 w-8 text-ocean-600 dark:text-ocean-400" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Saved Offline</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
                   Your submission has been saved securely on your device. It will automatically transmit to rescue teams when you're back online.
                 </p>
               </>
             ) : (
               <>
                 <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-success-50 dark:bg-success-900/30 mb-6 shadow-inner border border-success-200 dark:border-success-800">
                   <CheckCircle className="h-8 w-8 text-success-600 dark:text-success-400" />
                 </div>
                 <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-3 tracking-tight">Request Received</h2>
                 <p className="text-slate-600 dark:text-slate-400 mb-8 font-medium">
                   Your information has been securely transmitted. The response team is reviewing it and prioritizing help.
                 </p>
               </>
             )}

             <div className="space-y-4 mb-8 pt-4 border-t border-slate-200 dark:border-slate-700/50">
               <button
                 onClick={() => setShowQRModal(true)}
                 className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-slate-900 dark:bg-slate-800 text-white rounded-2xl font-bold text-sm shadow hover:bg-slate-800 dark:hover:bg-slate-700 transition"
               >
                 <QrCode className="w-5 h-5 text-ocean-400" />
                 Show SOS QR Code to Responders
               </button>

               <button
                 onClick={handleSendEmergencySMS}
                 className="w-full flex items-center justify-center gap-3 py-4 px-4 bg-coral-600 dark:bg-coral-700 text-white rounded-2xl font-bold text-sm shadow hover:bg-coral-700 dark:hover:bg-coral-600 transition"
               >
                 <MessageSquare className="w-5 h-5" />
                 Send Emergency SMS Backup
               </button>
             </div>

             <Button onClick={() => window.location.reload()} variant="ghost" className="w-full font-bold dark:text-slate-300">
               Submit Another Request
             </Button>
           </div>
        </div>

        {showQRModal && submittedPayload && (
          <QRCodeModal
            data={submittedPayload}
            title="SOS Response QR Payload"
            onClose={() => setShowQRModal(false)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 bg-gradient-to-br from-ocean-500/5 to-slate-500/10 dark:from-ocean-500/10 dark:to-slate-900 z-[-1] pointer-events-none"></div>

      {!isOnline && (
        <div className="fixed top-0 left-0 right-0 bg-coral-600 text-white px-4 py-3 text-center text-sm font-bold z-50 flex items-center justify-center gap-2 shadow-md">
          <WifiOff className="w-4 h-4" />
          Offline Mode - Submissions saved locally until connection returns
        </div>
      )}

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10 mb-8">
        <h2 className="text-center text-3xl font-black text-slate-900 dark:text-white tracking-tight">{incident.title}</h2>
        <p className="mt-3 text-center text-sm text-slate-600 dark:text-slate-400 max-w-sm mx-auto font-medium">
          {incident.description}
        </p>
      </div>

      <div className="sm:mx-auto sm:w-full sm:max-w-md relative z-10">
        
        {/* Step Indicator */}
        <div className="flex items-center justify-between mb-8 px-4">
            {[1, 2, 3].map((s) => (
                <div key={s} className={`flex flex-col items-center flex-1 ${s !== 3 ? 'relative' : ''}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm z-10 transition-colors ${step >= s ? 'bg-ocean-600 text-white border-2 border-ocean-600' : 'bg-white dark:bg-slate-800 text-slate-400 border-2 border-slate-200 dark:border-slate-700'}`}>
                        {s}
                    </div>
                    <span className={`text-[10px] mt-2 font-bold uppercase tracking-wider ${step >= s ? 'text-ocean-700 dark:text-ocean-400' : 'text-slate-400'}`}>
                        {s === 1 ? 'Location' : s === 2 ? 'Needs' : 'Details'}
                    </span>
                    {s !== 3 && (
                        <div className={`absolute top-4 left-1/2 w-full h-[2px] -z-10 ${step > s ? 'bg-ocean-600' : 'bg-slate-200 dark:bg-slate-700'}`}></div>
                    )}
                </div>
            ))}
        </div>

        {locationError && (
            <div className="mb-6 p-4 bg-coral-50 dark:bg-coral-900/30 border border-coral-200 dark:border-coral-800 text-coral-900 dark:text-coral-100 text-sm rounded-2xl flex items-start shadow-sm font-medium">
                <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-coral-600 dark:text-coral-400" />
                {locationError}
            </div>
        )}

        <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-xl py-8 px-6 shadow-xl sm:rounded-[2.5rem] rounded-[2rem] border border-white/60 dark:border-slate-700/50">
          <form className="space-y-8" onSubmit={handleSubmit}>
            
            {/* STEP 1: LOCATION */}
            {step === 1 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Where are you located?</h3>
                    
                    <div className="grid grid-cols-2 gap-4 mb-8">
                        <button
                            type="button"
                            onClick={handleSOS}
                            disabled={isLocating}
                            className="flex flex-col items-center justify-center p-5 bg-coral-50 dark:bg-coral-900/20 border-2 border-coral-200 dark:border-coral-800/50 rounded-2xl text-coral-700 dark:text-coral-400 hover:bg-coral-100 dark:hover:bg-coral-900/40 transition-all active:scale-95 group"
                        >
                            {isLocating ? (
                            <span className="animate-spin h-8 w-8 border-4 border-coral-600 border-t-transparent rounded-full mb-2"></span>
                            ) : (
                            <MapPin className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                            )}
                            <span className="font-bold text-sm uppercase tracking-wide">Auto GPS</span>
                        </button>

                        <button
                            type="button"
                            onClick={() => setShowSafetyTips(true)}
                            className="flex flex-col items-center justify-center p-5 bg-ocean-50 dark:bg-ocean-900/20 border-2 border-ocean-200 dark:border-ocean-800/50 rounded-2xl text-ocean-700 dark:text-ocean-400 hover:bg-ocean-100 dark:hover:bg-ocean-900/40 transition-all active:scale-95 group"
                        >
                            <ShieldAlert className="h-8 w-8 mb-2 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-sm uppercase tracking-wide">Safety Tips</span>
                        </button>
                    </div>

                    {incident?.regions && incident.regions.length > 0 && (
                        <div className="space-y-5 mb-6">
                            <div>
                                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                                    Region <span className="text-coral-500">*</span>
                                </label>
                                <select
                                    value={formData.region}
                                    onChange={e => setFormData({...formData, region: e.target.value, district: ''})}
                                    required
                                    className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-ocean-900 dark:text-ocean-100 focus:ring-2 focus:ring-ocean-500 outline-none"
                                >
                                    <option value="">-- Select Region --</option>
                                    {incident.regions.map(region => (
                                    <option key={region.name} value={region.name}>{region.name}</option>
                                    ))}
                                </select>
                            </div>

                            {formData.region && availableDistricts.length > 0 && (
                                <div>
                                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide mb-2">
                                        District <span className="text-coral-500">*</span>
                                    </label>
                                    <select
                                        value={formData.district}
                                        onChange={e => setFormData({...formData, district: e.target.value})}
                                        required
                                        className="w-full px-4 py-3 bg-white/80 dark:bg-slate-900/80 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-bold text-ocean-900 dark:text-ocean-100 focus:ring-2 focus:ring-ocean-500 outline-none"
                                    >
                                        <option value="">-- Select District --</option>
                                        {availableDistricts.map(district => (
                                        <option key={district} value={district}>{district}</option>
                                        ))}
                                    </select>
                                </div>
                            )}
                        </div>
                    )}

                    <div className="relative">
                        <Input
                            label="Detailed Address or Landmark"
                            placeholder="Room number, Building name, Street..."
                            value={formData.location}
                            onChange={e => setFormData({...formData, location: e.target.value})}
                            required
                            className={formData.location.includes('http') ? 'text-ocean-600 font-bold border-ocean-300 bg-ocean-50 dark:bg-ocean-900/20 dark:border-ocean-700' : ''}
                        />
                        {(formData.location.includes('Lat:') || formData.location.includes('http')) && (
                            <div className="absolute right-4 top-10 text-success-500 bg-success-50 dark:bg-success-900/50 p-1 rounded-full">
                                <MapPin className="h-4 w-4" />
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* STEP 2: NEEDS */}
            {step === 2 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">What do you need immediately?</h3>
                    
                    <div className="grid grid-cols-2 gap-3 mb-8">
                        {QUICK_NEEDS.map(need => (
                            <button
                                key={need.label}
                                type="button"
                                onClick={() => toggleNeed(need.label)}
                                className={`p-4 rounded-2xl border-2 font-bold text-sm flex flex-col items-center gap-2 transition-all active:scale-95 ${
                                    selectedNeeds.includes(need.label) 
                                        ? 'bg-ocean-100 dark:bg-ocean-900/40 border-ocean-500 text-ocean-800 dark:text-ocean-200 shadow-sm'
                                        : 'bg-white/50 dark:bg-slate-800/50 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:border-ocean-300 dark:hover:border-ocean-700'
                                }`}
                            >
                                <span className="text-2xl">{need.icon}</span>
                                {need.label}
                            </button>
                        ))}
                    </div>

                    <div className="mb-6">
                        <div className="flex items-center justify-between mb-2">
                            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wide">Specific Details</label>
                            <VoiceRecorder
                                onTranscription={(spokenText) => {
                                    setFormData(prev => ({
                                        ...prev,
                                        needs: prev.needs ? `${prev.needs}\n🎙️ ${spokenText}` : `🎙️ ${spokenText}`
                                    }));
                                }}
                            />
                        </div>
                        <TextArea
                            label=""
                            placeholder="Any specific medical conditions? Number of people? (Or tap Voice button to speak)"
                            value={formData.needs}
                            onChange={e => setFormData({...formData, needs: e.target.value})}
                            rows={3}
                        />
                    </div>

                    <ImageUpload
                        images={formData.images}
                        onChange={(images) => setFormData({...formData, images})}
                        maxImages={3}
                    />
                </div>
            )}

            {/* STEP 3: PERSONAL DETAILS */}
            {step === 3 && (
                <div className="animate-in fade-in slide-in-from-right-4 duration-300">
                    <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-6">How can responders reach you?</h3>
                    
                    <div className="space-y-6 mb-8">
                        <Input
                            label="Your Name"
                            placeholder="Full name"
                            value={formData.name}
                            onChange={e => setFormData({...formData, name: e.target.value})}
                            required
                        />
                        
                        <Input
                            label="Contact Info"
                            placeholder="Phone number, WhatsApp, or email"
                            value={formData.contact}
                            onChange={e => setFormData({...formData, contact: e.target.value})}
                            required
                        />
                    </div>

                    {duplicateWarning && (
                        <div className="mb-6 p-4 bg-warning-50 dark:bg-warning-900/30 border border-warning-300 dark:border-warning-700 text-warning-900 dark:text-warning-100 text-sm rounded-2xl flex items-start font-medium">
                            <AlertTriangle className="w-5 h-5 mr-3 mt-0.5 flex-shrink-0 text-warning-600" />
                            <div>
                                <p className="font-bold mb-1">Update Existing Request?</p>
                                <p>{duplicateWarning}</p>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between pt-6 border-t border-slate-200 dark:border-slate-700/50 mt-8">
                {step > 1 ? (
                    <Button type="button" onClick={handleBack} variant="ghost" className="dark:text-slate-300">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                ) : <div></div>}

                {step < 3 ? (
                    <Button type="button" onClick={handleNext} className="bg-ocean-600 hover:bg-ocean-700 text-white rounded-full px-8 shadow-md">
                        Next <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                ) : (
                    <Button type="submit" isLoading={isSubmitting} className="bg-success-600 hover:bg-success-700 text-white rounded-full px-8 shadow-md">
                        Submit Request
                    </Button>
                )}
            </div>

          </form>
        </div>
        <p className="text-center text-xs font-bold text-slate-400 dark:text-slate-600 mt-6 tracking-wider uppercase">
          Powered by HAVEN
        </p>
      </div>

      {/* Safety Tips Modal */}
      {showSafetyTips && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-md">
          <div className="bg-white dark:bg-slate-900 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200 border border-slate-200 dark:border-slate-700">
            <div className="bg-ocean-600 px-6 py-5 flex justify-between items-center">
              <h3 className="text-lg font-bold text-white flex items-center">
                <ShieldAlert className="mr-2 w-5 h-5" />
                Safety & Self-Rescue
              </h3>
              <button 
                onClick={() => setShowSafetyTips(false)}
                className="text-white/80 hover:text-white transition-colors p-1"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <div className="p-8">
              <div className="space-y-5 text-sm text-slate-700 dark:text-slate-300 font-medium">
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ocean-100 dark:bg-ocean-900/50 text-ocean-700 dark:text-ocean-400 flex items-center justify-center font-black">1</span>
                  <p className="mt-1"><strong>Stay Calm:</strong> Panic wastes energy. Take deep breaths to think clearly.</p>
                </div>
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ocean-100 dark:bg-ocean-900/50 text-ocean-700 dark:text-ocean-400 flex items-center justify-center font-black">2</span>
                  <p className="mt-1"><strong>Assess Safety:</strong> If you are in immediate danger (fire, rising water), move to a safer location immediately if possible.</p>
                </div>
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ocean-100 dark:bg-ocean-900/50 text-ocean-700 dark:text-ocean-400 flex items-center justify-center font-black">3</span>
                  <p className="mt-1"><strong>Conserve Battery:</strong> Turn on "Low Power Mode". Lower screen brightness. Close unused apps.</p>
                </div>
                <div className="flex gap-4">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-ocean-100 dark:bg-ocean-900/50 text-ocean-700 dark:text-ocean-400 flex items-center justify-center font-black">4</span>
                  <p className="mt-1"><strong>Share Location:</strong> Use the Auto GPS button on this form to attach your exact coordinates.</p>
                </div>
              </div>
              <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                <Button onClick={() => setShowSafetyTips(false)} className="w-full rounded-2xl py-4 bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900">
                  I Understand
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};