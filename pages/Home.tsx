import React, { useEffect, useState, useRef } from 'react';
import { Link } from 'react-router-dom';
import { storageService } from '../services/storage';
import { Incident, IncidentResponse } from '../types';
import { Button } from '../components/Button';
import { HeartHandshake, Plus, ArrowRight, BookOpen, Download, Upload, Moon, Sun } from 'lucide-react';
import { exportAllDataJSON, importDataJSON } from '../utils/dataPortability';

export const Home: React.FC = () => {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    loadIncidents();
    if (document.documentElement.classList.contains('dark')) {
      setIsDark(true);
    }
  }, []);

  const toggleTheme = () => {
    if (isDark) {
      document.documentElement.classList.remove('dark');
      setIsDark(false);
    } else {
      document.documentElement.classList.add('dark');
      setIsDark(true);
    }
  };

  const loadIncidents = async () => {
    const data = await storageService.getIncidents();
    setIncidents(data);
    setLoading(false);
  };

  const handleExportAll = async () => {
    setIsExporting(true);
    try {
      // Get all incidents
      const incidents = await storageService.getIncidents();

      // Get all responses for all incidents
      const responsesPromises = incidents.map(inc => storageService.getResponses(inc.id));
      const responsesArrays = await Promise.all(responsesPromises);
      const allResponses = responsesArrays.flat();

      exportAllDataJSON(incidents, allResponses);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsImporting(true);
    try {
      const { incidents: importedIncidents, responses: importedResponses } = await importDataJSON(file);

      // Confirm before overwriting
      const confirmMsg = `This will import ${importedIncidents.length} incidents and ${importedResponses.length} responses. This will MERGE with existing data. Continue?`;
      if (!confirm(confirmMsg)) {
        setIsImporting(false);
        return;
      }

      // Import incidents
      const existingIncidents = await storageService.getIncidents();
      const existingIds = new Set(existingIncidents.map(i => i.id));

      for (const incident of importedIncidents) {
        if (!existingIds.has(incident.id)) {
          // Create new incident by directly setting localStorage
          localStorage.setItem(
            'crisiskit_incidents',
            JSON.stringify([...existingIncidents, incident])
          );
          existingIncidents.push(incident);
        }
      }

      // Import responses
      const allExistingResponses: IncidentResponse[] = [];
      for (const incident of existingIncidents) {
        const responses = await storageService.getResponses(incident.id);
        allExistingResponses.push(...responses);
      }

      const existingResponseIds = new Set(allExistingResponses.map(r => r.id));
      const newResponses = importedResponses.filter(r => !existingResponseIds.has(r.id));

      if (newResponses.length > 0) {
        localStorage.setItem(
          'crisiskit_responses',
          JSON.stringify([...allExistingResponses, ...newResponses])
        );
      }

      alert(`Successfully imported ${importedIncidents.length} incidents and ${newResponses.length} new responses!`);
      loadIncidents(); // Reload
    } catch (error) {
      console.error('Import failed:', error);
      alert('Failed to import data. Please check the file format.');
    } finally {
      setIsImporting(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8 relative min-h-[90vh] flex flex-col">
      {/* Theme Toggle */}
      <div className="absolute top-4 right-4 z-50">
        <button onClick={toggleTheme} className="p-2 rounded-full bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-800 transition-colors shadow-sm">
          {isDark ? <Sun size={20} /> : <Moon size={20} />}
        </button>
      </div>

      {/* Background Planet Effect */}
      <div className="fixed -bottom-1/2 left-1/2 -translate-x-1/2 w-[180vw] sm:w-[120vw] lg:w-[100vw] max-w-[1200px] aspect-square pointer-events-none z-[-1]">
         <img src="https://upload.wikimedia.org/wikipedia/commons/2/22/Earth_Western_Hemisphere_transparent_background.png" alt="Earth" className="w-full h-full object-contain animate-spin-slow opacity-90 drop-shadow-2xl" />
      </div>
      <div className="text-center pt-16 pb-24 relative z-10">
        <div className="inline-block bg-white/20 dark:bg-slate-900/40 backdrop-blur-md px-8 py-10 rounded-[3rem] border border-white/40 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.04)]">
            <h2 className="text-xs md:text-sm font-bold tracking-[0.4em] text-slate-700 dark:text-slate-300 uppercase mb-4 drop-shadow-sm">Project</h2>
            <h1 className="font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-slate-900 dark:text-white tracking-tight mb-8 drop-shadow-md">
            HAVEN
            </h1>
            <p className="text-sm md:text-base text-slate-800 dark:text-slate-200 max-w-2xl mx-auto leading-relaxed mb-12 font-semibold drop-shadow-sm">
            Connecting those in need with those who can help, instantly.<br />
            Deploy a coordinated relief effort across the globe.
            </p>
            <div className="flex justify-center">
                <Link to="/create">
                    <Button size="lg" className="px-10 py-4 text-sm bg-ocean-600 hover:bg-ocean-700 dark:bg-ocean-500 dark:hover:bg-ocean-600 text-white border-none shadow-[0_4px_20px_rgba(0,0,0,0.15)] hover:shadow-[0_8px_30px_rgba(0,0,0,0.25)] rounded-full uppercase tracking-[0.2em] font-bold z-10 relative transition-all">
                        Get Started
                    </Button>
                </Link>
            </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md p-6 rounded-3xl border border-white/40 dark:border-slate-700 shadow-sm relative z-10">
        <h2 className="text-lg font-bold text-slate-900 dark:text-white tracking-wide uppercase">Active Relief Efforts</h2>
        <div className="flex gap-3 flex-wrap">
          <Button onClick={handleExportAll} variant="ghost" className="text-xs dark:text-slate-300 dark:hover:bg-slate-800" disabled={isExporting || incidents.length === 0}>
            <Download className="mr-2 h-4 w-4" />
            {isExporting ? 'Exporting...' : 'Backup'}
          </Button>
          <Button onClick={handleImportClick} variant="ghost" className="text-xs dark:text-slate-300 dark:hover:bg-slate-800" disabled={isImporting}>
            <Upload className="mr-2 h-4 w-4" />
            {isImporting ? 'Importing...' : 'Restore'}
          </Button>
        </div>
      </div>

      {/* Hidden file input for import */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileSelect}
        className="hidden"
      />

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="h-24 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : incidents.length === 0 ? (
        <div className="text-center py-12 bg-white/60 dark:bg-slate-900/60 backdrop-blur-md rounded-3xl border border-white/40 dark:border-slate-700 shadow-sm mb-12 relative z-10">
          <p className="text-slate-600 dark:text-slate-400 text-sm font-medium">No active relief efforts in your area.</p>
        </div>
      ) : (
        <div className="space-y-4 mb-16">
          {incidents.map((incident) => (
            <Link 
              key={incident.id} 
              to={`/incident/${incident.id}`}
              className="block group"
            >
              <div className="bg-white/70 dark:bg-slate-900/70 backdrop-blur-sm border border-white/50 dark:border-slate-700 rounded-3xl p-6 hover:shadow-lg transition-all duration-300 group">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xl font-serif font-bold text-slate-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
                      {incident.title}
                    </h3>
                    <p className="text-slate-700 dark:text-slate-300 mt-2 text-sm line-clamp-2">{incident.description}</p>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-3 font-mono">
                      Started {new Date(incident.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ArrowRight className="text-slate-400 dark:text-slate-500 group-hover:text-primary-500 dark:group-hover:text-primary-400 transition-colors ml-4 flex-shrink-0" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* About / README Section */}
      <div className="border-t border-slate-200 dark:border-slate-700/50 pt-12 mt-12 relative z-10 bg-white/50 dark:bg-slate-900/50 backdrop-blur-xl p-8 rounded-[3rem] mb-12 shadow-sm border border-white/40 dark:border-slate-700">
        <div className="prose prose-slate dark:prose-invert max-w-none">
          <div className="flex justify-between items-baseline mb-6">
            <h2 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
              About Haven <span className="ml-2 text-xl">🕊️</span>
            </h2>
            <Link to="/design" className="text-sm font-medium text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300 flex items-center">
              <BookOpen className="w-4 h-4 mr-1" />
              Read Design Philosophy
            </Link>
          </div>
          
          <p className="text-lg leading-relaxed mb-6 text-slate-800 dark:text-slate-200 font-semibold">
            <strong>Haven is a compassionate bridge between people in crisis and relief teams:</strong>
          </p>

          <div className="bg-primary-50/80 dark:bg-primary-900/30 border border-primary-200 dark:border-primary-800 p-6 rounded-3xl mb-8 text-center font-mono text-sm shadow-sm backdrop-blur-sm">
            <p className="text-primary-900 dark:text-primary-100">
              Affected People → <strong className="text-primary-700 dark:text-primary-400">Haven Guided Request</strong> → <strong className="text-primary-700 dark:text-primary-400">AI Triage</strong> → Relief Teams
            </p>
          </div>

          <div className="bg-ocean-50/80 dark:bg-ocean-900/30 border-l-4 border-ocean-500 dark:border-ocean-400 p-6 rounded-r-3xl mb-8 backdrop-blur-sm shadow-sm">
            <p className="font-semibold text-ocean-900 dark:ocean-100 mb-2">Built for Compassion and Speed</p>
            <p className="text-ocean-800 dark:text-ocean-200 mb-3 font-medium">
              Standard forms are stressful during emergencies. They lack triage, overwhelm victims with questions, and don't work offline.
            </p>
            <p className="text-ocean-800 dark:text-ocean-200 font-medium">
              <strong>Haven</strong> deploys in seconds, uses a guided wizard for victims (even offline), 
              and automatically helps responders prioritize care using AI triage.
            </p>
          </div>

          <p className="mb-4 text-slate-900 dark:text-slate-100 font-bold">
            What Haven Does:
          </p>
          <ul className="list-disc pl-5 space-y-3 mb-8 text-slate-800 dark:text-slate-300 font-medium">
             <li><strong>10-Second Deployment</strong> - No account, no setup, just create and share</li>
             <li><strong>Guided Victim UI</strong> - Stress-reducing flow, works on any phone</li>
             <li><strong>AI-Powered Triage</strong> - Gemini AI prioritizes requests so you know who needs help first</li>
             <li><strong>Visual Statistics</strong> - See urgency distribution, region heatmaps, and timeline trends at a glance</li>
             <li><strong>Reassuring Offline Mode</strong> - Captures requests when network fails, syncs automatically</li>
             <li><strong>Auto-Sync to Google Sheets</strong> - Connect instantly to ground volunteer teams</li>
             <li><strong>Region/District Selection</strong> - Pre-configured dropdowns for fast tracking</li>
          </ul>

          <div className="text-center mt-12">
            <Link to="/design">
                <Button variant="secondary" className="w-full sm:w-auto dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700 dark:hover:bg-slate-700">
                    Why we built this: The Story of Taipo Fire &rarr;
                </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Optional: Add a subtle overlay so text stays readable over the planet */}
      <div className="fixed inset-0 bg-gradient-to-t from-slate-100/50 dark:from-slate-950/70 to-transparent pointer-events-none z-[-1]"></div>
    </div>
  );
};