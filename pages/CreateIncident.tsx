import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { storageService } from '../services/storage';
import { Region } from '../types';
import { Button } from '../components/Button';
import { Input, TextArea } from '../components/Input';
import { ArrowLeft, Plus, X, Sparkles } from 'lucide-react';
import { CRISIS_TEMPLATES, TEMPLATE_CATEGORIES, getTemplateById } from '../utils/crisisTemplates';

// Preset region templates
const REGION_PRESETS = {
  global: [
    { name: "North America", districts: ["East Coast", "West Coast", "Central", "Canada"] },
    { name: "Europe", districts: ["Western EU", "Eastern EU", "UK", "Nordic"] },
    { name: "Asia-Pacific", districts: ["East Asia", "South Asia", "Southeast Asia", "Oceania"] }
  ],
  grid: [
    { name: "Sector Alpha", districts: ["Zone 1", "Zone 2", "Zone 3"] },
    { name: "Sector Bravo", districts: ["Zone 4", "Zone 5", "Zone 6"] }
  ],
  none: []
};

export const CreateIncident: React.FC = () => {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [enableRegions, setEnableRegions] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState<string>('none');
  const [regions, setRegions] = useState<Region[]>([]);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [showTemplates, setShowTemplates] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
  });

  const handleTemplateSelect = (templateId: string) => {
    const template = getTemplateById(templateId);
    if (!template) return;

    setSelectedTemplate(templateId);
    setFormData({
      title: template.name,
      description: template.formDescription
    });

    if (template.regions && template.regions.length > 0) {
      setRegions(template.regions);
      setEnableRegions(true);
    }

    setShowTemplates(false);
  };

  const handlePresetChange = (preset: string) => {
    setSelectedPreset(preset);
    if (preset !== 'none' && REGION_PRESETS[preset as keyof typeof REGION_PRESETS]) {
      setRegions(REGION_PRESETS[preset as keyof typeof REGION_PRESETS]);
    } else {
      setRegions([]);
    }
  };

  const addCustomRegion = () => {
    setRegions([...regions, { name: '', districts: [] }]);
  };

  const removeRegion = (index: number) => {
    setRegions(regions.filter((_, i) => i !== index));
  };

  const updateRegionName = (index: number, name: string) => {
    const updated = [...regions];
    updated[index].name = name;
    setRegions(updated);
  };

  const updateRegionDistricts = (index: number, districtsStr: string) => {
    const updated = [...regions];
    updated[index].districts = districtsStr.split(',').map(d => d.trim()).filter(d => d);
    setRegions(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    setIsSubmitting(true);
    try {
      const incidentData = {
        ...formData,
        regions: enableRegions && regions.length > 0 ? regions : undefined
      };
      const newIncident = await storageService.createIncident(incidentData);
      navigate(`/incident/${newIncident.id}`);
    } catch (error) {
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-16 px-4 sm:px-6 lg:px-8 relative min-h-screen flex flex-col">
      {/* Subtle Background Elements */}
      <div className="fixed inset-0 bg-slate-50 dark:bg-slate-950 pointer-events-none z-[-2]"></div>
      <div className="fixed top-[-10%] right-[-5%] w-[40vw] h-[40vw] bg-ocean-500/10 dark:bg-ocean-500/5 blur-[100px] rounded-full pointer-events-none z-[-1]"></div>
      
      <Link to="/" className="inline-flex items-center text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 mb-8 font-bold tracking-wide uppercase text-xs transition-colors">
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Headquarters
      </Link>

      <div className="bg-white/60 dark:bg-slate-900/60 backdrop-blur-xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] rounded-[2.5rem] border border-white/60 dark:border-slate-700/50 p-8 sm:p-12 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-ocean-400 to-primary-400"></div>
        <h1 className="text-3xl sm:text-4xl font-serif font-bold text-slate-900 dark:text-white mb-3">Launch Relief Effort</h1>
        <p className="text-slate-600 dark:text-slate-300 mb-10 font-medium leading-relaxed">Configure a new emergency response channel to coordinate ground efforts and receive AI-triaged requests instantly.</p>

        {/* Template Selection */}
        {showTemplates && (
          <div className="mb-10 p-6 bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm border border-slate-200 dark:border-slate-600/50 rounded-3xl shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-5 h-5 text-ocean-600 dark:text-ocean-400" />
              <h2 className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wider">Quick Deploy Templates</h2>
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300 mb-8 font-medium">
              Select a pre-configured scenario to instantly set up regions and optimal response parameters.
            </p>

            {TEMPLATE_CATEGORIES.map(category => {
              const templates = CRISIS_TEMPLATES.filter(t => t.category === category.id);
              return (
                <div key={category.id} className="mb-8">
                  <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 mb-4 flex items-center gap-2 tracking-widest uppercase">
                    <span className="text-base">{category.icon}</span>
                    {category.name}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {templates.map(template => (
                      <button
                        key={template.id}
                        type="button"
                        onClick={() => handleTemplateSelect(template.id)}
                        className="text-left p-5 bg-white/80 dark:bg-slate-900/80 border border-slate-200 dark:border-slate-700/80 rounded-2xl hover:border-ocean-400 dark:hover:border-ocean-500 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-start gap-4">
                          <span className="text-2xl flex-shrink-0 bg-slate-50 dark:bg-slate-800 p-2 rounded-xl">{template.icon}</span>
                          <div className="flex-1 min-w-0">
                            <h4 className="font-bold text-slate-900 dark:text-white group-hover:text-ocean-600 dark:group-hover:text-ocean-400 transition-colors">
                              {template.name}
                            </h4>
                            <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium">
                              {template.description}
                            </p>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}

            <div className="pt-6 border-t border-slate-200 dark:border-slate-700/50 mt-8 text-center">
              <button
                type="button"
                onClick={() => setShowTemplates(false)}
                className="text-xs text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white font-bold tracking-wide uppercase transition-colors"
              >
                Skip presets & configure manually &rarr;
              </button>
            </div>
          </div>
        )}

        {selectedTemplate && (
          <div className="mb-8 p-5 bg-primary-50/80 dark:bg-primary-900/30 backdrop-blur-sm border border-primary-200 dark:border-primary-800 rounded-2xl flex items-center gap-4 shadow-sm">
            <div className="text-3xl bg-white dark:bg-slate-800 p-2 rounded-xl shadow-sm">{getTemplateById(selectedTemplate)?.icon}</div>
            <div className="flex-1">
              <p className="text-xs font-bold text-primary-900 dark:text-primary-100 uppercase tracking-wide">
                Active Protocol: {getTemplateById(selectedTemplate)?.name}
              </p>
              <p className="text-xs text-primary-700 dark:text-primary-300 mt-1 font-medium">
                Parameters pre-loaded. You can adjust the configuration below before launching.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSelectedTemplate('');
                setShowTemplates(true);
                setFormData({ title: '', description: '' });
                setRegions([]);
                setEnableRegions(false);
              }}
              className="text-primary-600 hover:text-primary-800 dark:text-primary-400 dark:hover:text-primary-300 p-2 hover:bg-primary-100 dark:hover:bg-primary-800/50 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          <Input 
            label="Mission / Effort Title" 
            placeholder="e.g. Global Sector 4 Relief"
            value={formData.title}
            onChange={(e) => setFormData({...formData, title: e.target.value})}
            required
            autoFocus
          />
          
          <TextArea
            label="Public Instructions & Protocol"
            placeholder="Describe the situation and what critical information is needed from affected individuals."
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            rows={4}
            required
          />

          {/* Region Configuration (Optional) */}
          <div className="border-t border-slate-200 dark:border-slate-700/50 pt-8">
            <div className="flex items-center justify-between mb-6">
              <div>
                <label className="text-xs font-bold text-slate-900 dark:text-white uppercase tracking-wide block">
                  Geographic Sectors
                </label>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-medium">
                  Pre-define zones to help AI automatically route requests to the correct ground teams.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setEnableRegions(!enableRegions)}
                className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors shadow-inner ${
                  enableRegions ? 'bg-ocean-500' : 'bg-slate-300 dark:bg-slate-600'
                }`}
              >
                <span
                  className={`inline-block h-5 w-5 transform rounded-full bg-white transition-transform shadow-sm ${
                    enableRegions ? 'translate-x-6' : 'translate-x-1'
                  }`}
                />
              </button>
            </div>

            {enableRegions && (
              <div className="space-y-5 bg-slate-50/50 dark:bg-slate-800/30 p-6 rounded-3xl border border-slate-200 dark:border-slate-700/50">
                <div>
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300 mb-3 block uppercase tracking-wider">
                    Sector Presets
                  </label>
                  <select
                    value={selectedPreset}
                    onChange={(e) => handlePresetChange(e.target.value)}
                    className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-xl text-sm font-medium focus:ring-2 focus:ring-ocean-500 focus:border-transparent transition-all outline-none dark:text-white"
                  >
                    <option value="none">-- Custom Sectors --</option>
                    <option value="global">Global Macro-Regions</option>
                    <option value="grid">Standard Grid System (Alpha/Bravo)</option>
                  </select>
                </div>

                {regions.length > 0 && (
                  <div className="space-y-4">
                    {regions.map((region, idx) => (
                      <div key={idx} className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 relative shadow-sm group">
                        <button
                          type="button"
                          onClick={() => removeRegion(idx)}
                          className="absolute top-3 right-3 text-slate-400 hover:text-coral-500 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X className="w-5 h-5" />
                        </button>
                        <input
                          type="text"
                          placeholder="Sector Name (e.g., Sector Alpha)"
                          value={region.name}
                          onChange={(e) => updateRegionName(idx, e.target.value)}
                          className="w-full px-2 py-2 text-sm font-bold bg-transparent border-b border-slate-200 dark:border-slate-700 mb-3 focus:outline-none focus:border-ocean-500 dark:text-white transition-colors"
                        />
                        <input
                          type="text"
                          placeholder="Sub-zones (comma-separated: Zone 1, Zone 2)"
                          value={region.districts.join(', ')}
                          onChange={(e) => updateRegionDistricts(idx, e.target.value)}
                          className="w-full px-2 py-1 text-xs text-slate-600 dark:text-slate-400 font-medium bg-transparent border-0 focus:outline-none"
                        />
                      </div>
                    ))}
                  </div>
                )}

                <button
                  type="button"
                  onClick={addCustomRegion}
                  className="w-full py-4 px-4 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl text-xs text-slate-600 dark:text-slate-400 font-bold uppercase tracking-widest hover:border-ocean-400 dark:hover:border-ocean-500 hover:text-ocean-600 dark:hover:text-ocean-400 transition-colors flex items-center justify-center mt-2"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Define New Sector
                </button>
              </div>
            )}
          </div>

          <div className="pt-8 flex justify-end">
            <Button type="submit" isLoading={isSubmitting} size="lg" className="w-full sm:w-auto shadow-[0_4px_20px_rgba(0,0,0,0.1)]">
              Launch Effort & Get Secure Link
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};