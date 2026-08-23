import React, { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { storageService } from '../services/storage';
import { geminiService } from '../services/gemini';
import { Incident, IncidentResponse } from '../types';
import { Button } from '../components/Button';
import { UrgencyBadge } from '../components/UrgencyBadge';
import { StatusBadge } from '../components/StatusBadge';
import { RelativeTime } from '../components/RelativeTime';
import { exportToCSV } from '../utils/csvExport';
import { exportToGoogleSheets } from '../utils/googleSheetsExport';
import { ResponseStatus } from '../types';
import { ArrowLeft, Share2, RefreshCw, AlertCircle, FileText, ExternalLink, Download, Sheet, Settings, BarChart3, Map, List, FileJson, Upload, QrCode, Radio, Navigation, Loader2 } from 'lucide-react';
import { GoogleSheetsSetup } from '../components/GoogleSheetsSetup';
import { StatisticsChart } from '../components/StatisticsChart';
import { MapView } from '../components/MapView';
import { ImageGallery } from '../components/ImageGallery';
import { EmergencyAudioAlert } from '../components/EmergencyAudioAlert';
import { QRScannerModal } from '../components/QRScannerModal';
import { PeerBroadcastModal } from '../components/PeerBroadcastModal';

import { calculateDistanceKm, parseLocationCoords } from '../utils/geoDistance';

export const IncidentDashboard: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [incident, setIncident] = useState<Incident | null>(null);
  const [responses, setResponses] = useState<IncidentResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [regionFilter, setRegionFilter] = useState<string>('');
  const [districtFilter, setDistrictFilter] = useState<string>('');
  const [showSheetsSetup, setShowSheetsSetup] = useState(false);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showPeerSync, setShowPeerSync] = useState(false);
  const [viewMode, setViewMode] = useState<'table' | 'map'>('table');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [responderCoords, setResponderCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [sortByDistance, setSortByDistance] = useState(false);

  const loadData = useCallback(async () => {
    if (!id) return;
    const [incData, resData] = await Promise.all([
      storageService.getIncidentById(id),
      storageService.getResponses(id)
    ]);
    setIncident(incData || null);

    // Sort responses: CRITICAL first, then MODERATE, then LOW, then UNKNOWN
    const sortedResponses = resData.sort((a, b) => {
      const urgencyOrder = { CRITICAL: 0, MODERATE: 1, LOW: 2, UNKNOWN: 3 };
      const aUrgency = a.aiClassification?.urgency || 'UNKNOWN';
      const bUrgency = b.aiClassification?.urgency || 'UNKNOWN';

      // First sort by urgency
      const urgencyDiff = urgencyOrder[aUrgency] - urgencyOrder[bUrgency];
      if (urgencyDiff !== 0) return urgencyDiff;

      // Then by submission time (newest first)
      return b.submittedAt - a.submittedAt;
    });

    setResponses(sortedResponses);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const runAIAnalysis = async () => {
    if (responses.length === 0) return;
    setIsAnalyzing(true);
    
    // Process only unclassified responses to save tokens/time
    const unclassified = responses.filter(r => !r.aiClassification);
    
    for (const res of unclassified) {
      const classification = await geminiService.classifyUrgency(res.needs, res.location, res.images);
      const updated = { ...res, aiClassification: classification };
      await storageService.updateResponse(updated);
      
      // Update local state progressively
      setResponses(prev => prev.map(p => p.id === updated.id ? updated : p));
    }
    
    setIsAnalyzing(false);
  };

  const copyPublicLink = () => {
    const url = `${window.location.origin}/#/submit/${id}`;
    navigator.clipboard.writeText(url);
    alert('Public link copied to clipboard!');
  };

  const handleExportCSV = () => {
    if (!incident || responses.length === 0) return;
    exportToCSV(responses, incident.title);
  };

  const handleExportJSON = () => {
    if (!incident || responses.length === 0) return;
    const backupData = {
      incident,
      responses,
      exportedAt: new Date().toISOString()
    };
    const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `haven_${incident.title.replace(/\s+/g, '_')}_backup.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJSON = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !id) return;
    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (Array.isArray(data.responses)) {
        for (const res of data.responses) {
          await storageService.submitResponse({ ...res, incidentId: id });
        }
        await loadData();
        alert(`Successfully imported ${data.responses.length} responses!`);
      }
    } catch (_err) {
      alert('Failed to import JSON file. Format may be invalid.');
    }
  };

  const handleExportToSheets = async () => {
    if (!incident || responses.length === 0) return;
    const result = await exportToGoogleSheets(incident, responses);
    alert(result.message);
  };

  const updateResponseStatus = async (responseId: string, newStatus: ResponseStatus) => {
    const response = responses.find(r => r.id === responseId);
    if (!response) return;

    const updated = {
      ...response,
      status: newStatus,
      resolvedAt: newStatus === 'resolved' ? Date.now() : response.resolvedAt
    };

    await storageService.updateResponse(updated);
    setResponses(prev => prev.map(r => r.id === responseId ? updated : r));
  };

  const handleBatchUpdateStatus = async (newStatus: ResponseStatus) => {
    if (selectedIds.length === 0) return;
    for (const resId of selectedIds) {
      await updateResponseStatus(resId, newStatus);
    }
    setSelectedIds([]);
  };

  // Helper to render location with potential links
  const renderLocation = (text: string) => {
    const urlRegex = /(https?:\/\/[^\s]+)/g;
    const parts = text.split(urlRegex);
    
    return parts.map((part, i) => {
      if (part.match(urlRegex)) {
        return (
          <a 
            key={i} 
            href={part} 
            target="_blank" 
            rel="noopener noreferrer" 
            className="text-ocean-400 hover:text-ocean-300 hover:underline inline-flex items-center"
            onClick={(e) => e.stopPropagation()}
          >
            Maps Link <ExternalLink className="w-3 h-3 ml-1" />
          </a>
        );
      }
      return <span key={i}>{part}</span>;
    });
  };

  const handleToggleProximitySort = () => {
    if (!responderCoords) {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setResponderCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
            setSortByDistance(true);
          },
          (_err) => alert('Could not fetch responder location for proximity sorting.')
        );
      }
    } else {
      setSortByDistance(!sortByDistance);
    }
  };

  // ── Loading & Error States ──────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-ocean-950 to-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 text-ocean-400 animate-spin" />
          <p className="text-slate-400 text-sm font-medium">Loading incident data...</p>
        </div>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-ocean-950 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-coral-400 text-lg font-semibold">Incident not found.</p>
          <Link to="/" className="mt-4 inline-block text-ocean-400 hover:text-ocean-300 text-sm underline">
            Return to Home
          </Link>
        </div>
      </div>
    );
  }

  // Get unique regions and districts for filtering
  const uniqueRegions = [...new Set(responses.map(r => r.region).filter(Boolean))];
  const filteredByRegion = regionFilter
    ? responses.filter(r => r.region === regionFilter)
    : responses;
  const uniqueDistricts = [...new Set(filteredByRegion.map(r => r.district).filter(Boolean))];

  // Apply filters & distance sorting
  let filteredResponses = responses.filter(r => {
    if (regionFilter && r.region !== regionFilter) return false;
    if (districtFilter && r.district !== districtFilter) return false;
    return true;
  });

  if (sortByDistance && responderCoords) {
    filteredResponses = [...filteredResponses].sort((a, b) => {
      const coordsA = parseLocationCoords(a.location);
      const coordsB = parseLocationCoords(b.location);
      const distA = coordsA ? calculateDistanceKm(responderCoords.lat, responderCoords.lng, coordsA.lat, coordsA.lng) : 9999;
      const distB = coordsB ? calculateDistanceKm(responderCoords.lat, responderCoords.lng, coordsB.lat, coordsB.lng) : 9999;
      return distA - distB;
    });
  }

  // ── Shared style tokens ─────────────────────────────────────────────────
  const glassCard = 'bg-white/5 dark:bg-slate-900/60 backdrop-blur-xl border border-white/10 rounded-2xl';
  const selectClass =
    'px-3 py-2 bg-slate-800/80 border border-ocean-800/60 text-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-ocean-500 focus:border-ocean-500 transition-all';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-ocean-950 to-slate-900">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">

        {/* ── Header ────────────────────────────────────────────────────── */}
        <div className="mb-8">
          <Link
            to="/"
            className="inline-flex items-center text-slate-400 hover:text-ocean-300 mb-4 transition-colors text-sm group"
          >
            <ArrowLeft className="mr-2 h-4 w-4 group-hover:-translate-x-0.5 transition-transform" />
            Back to All Incidents
          </Link>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
            <div>
              {/* Brand badge */}
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-ocean-900/60 border border-ocean-700/50 text-ocean-300 text-xs font-semibold tracking-widest uppercase mb-3">
                <span className="w-1.5 h-1.5 bg-ocean-400 rounded-full animate-pulse" />
                HAVEN Command
              </div>
              <h1 className="text-3xl sm:text-4xl font-serif font-bold text-white leading-tight">
                {incident.title}
              </h1>
              <p className="text-slate-400 mt-2 text-sm">
                <span className="text-ocean-400 font-semibold">{responses.length}</span> responses collected
                <span className="text-slate-600 mx-2">·</span>
                Created {new Date(incident.createdAt).toLocaleDateString()}
              </p>
            </div>

            {/* ── Action Toolbar ─────────────────────────────────────── */}
            <div className="flex flex-wrap gap-2 items-center">
              <EmergencyAudioAlert responses={responses} />

              {/* View Mode Segment Control */}
              <div className="flex items-center bg-slate-800/80 border border-white/10 rounded-xl p-1 gap-1">
                <button
                  onClick={() => setViewMode('table')}
                  disabled={responses.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'table'
                      ? 'bg-ocean-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
                  }`}
                >
                  <List className="h-3.5 w-3.5" />
                  List
                </button>
                <button
                  onClick={() => setViewMode('map')}
                  disabled={responses.length === 0}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    viewMode === 'map'
                      ? 'bg-ocean-600 text-white shadow-lg'
                      : 'text-slate-400 hover:text-slate-200 disabled:opacity-40'
                  }`}
                >
                  <Map className="h-3.5 w-3.5" />
                  Map
                </button>
              </div>

              <Button
                onClick={() => setShowStatistics(!showStatistics)}
                variant={showStatistics ? 'primary' : 'secondary'}
                disabled={responses.length === 0}
              >
                <BarChart3 className="mr-1.5 h-4 w-4" />
                {showStatistics ? 'Hide Analytics' : 'Analytics'}
              </Button>

              <Button
                onClick={handleToggleProximitySort}
                variant={sortByDistance ? 'primary' : 'secondary'}
                title="Sort responses by distance to responder GPS"
              >
                <Navigation className="mr-1.5 h-4 w-4" />
                {sortByDistance ? 'Nearest First' : 'Proximity'}
              </Button>

              <Button onClick={runAIAnalysis} variant="secondary" disabled={isAnalyzing || responses.length === 0}>
                <RefreshCw className={`mr-1.5 h-4 w-4 ${isAnalyzing ? 'animate-spin' : ''}`} />
                {isAnalyzing ? 'Analyzing...' : 'AI Triage'}
              </Button>

              <Button onClick={() => setShowQRScanner(true)} variant="primary">
                <QrCode className="mr-1.5 h-4 w-4" />
                Scan QR
              </Button>

              <Button onClick={() => setShowPeerSync(true)} variant="secondary" title="Offline WebRTC P2P Emergency Mesh Broadcast">
                <Radio className="mr-1.5 h-4 w-4 text-ocean-300" />
                P2P Mesh
              </Button>

              <Button onClick={copyPublicLink}>
                <Share2 className="mr-1.5 h-4 w-4" />
                Share Link
              </Button>

              {/* Export group */}
              <div className="flex items-center gap-1.5">
                <Button onClick={() => setShowSheetsSetup(true)} variant="secondary">
                  <Settings className="mr-1.5 h-4 w-4" />
                  Sync Setup
                </Button>
                <Button onClick={handleExportToSheets} variant="secondary" disabled={responses.length === 0}>
                  <Sheet className="mr-1.5 h-4 w-4" />
                  Sheets
                </Button>
                <Button onClick={handleExportCSV} variant="secondary" disabled={responses.length === 0}>
                  <Download className="mr-1.5 h-4 w-4" />
                  CSV
                </Button>
                <Button onClick={handleExportJSON} variant="secondary" disabled={responses.length === 0} title="Backup Incident Data">
                  <FileJson className="mr-1.5 h-4 w-4" />
                  JSON
                </Button>
                <label className="inline-flex items-center px-3 py-2 border border-white/10 rounded-xl text-xs font-semibold text-slate-300 bg-white/5 hover:bg-white/10 cursor-pointer transition-all">
                  <Upload className="mr-1.5 h-4 w-4" />
                  Restore
                  <input type="file" accept=".json" onChange={handleImportJSON} className="hidden" />
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* ── Batch Action Toolbar ──────────────────────────────────────── */}
        {selectedIds.length > 0 && (
          <div className={`mb-4 p-3 ${glassCard} border-ocean-700/50 flex items-center justify-between`}>
            <span className="text-sm font-semibold text-ocean-300">
              {selectedIds.length} item{selectedIds.length > 1 ? 's' : ''} selected
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => handleBatchUpdateStatus('in_progress')}
                className="px-3 py-1.5 bg-ocean-600 hover:bg-ocean-500 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Mark In Progress
              </button>
              <button
                onClick={() => handleBatchUpdateStatus('resolved')}
                className="px-3 py-1.5 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg text-xs font-semibold transition-all"
              >
                Mark Resolved
              </button>
              <button
                onClick={() => setSelectedIds([])}
                className="px-3 py-1.5 text-slate-400 hover:text-slate-200 text-xs font-medium transition-colors"
              >
                Deselect All
              </button>
            </div>
          </div>
        )}

        {/* ── Statistics Panel ──────────────────────────────────────────── */}
        {showStatistics && responses.length > 0 && (
          <div className="mb-6">
            <StatisticsChart responses={responses} />
          </div>
        )}

        {/* ── Region/District Filters ───────────────────────────────────── */}
        {uniqueRegions.length > 0 && (
          <div className="mb-5 flex flex-wrap gap-3 items-center">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Filter:</span>
            <select
              value={regionFilter}
              onChange={(e) => {
                setRegionFilter(e.target.value);
                setDistrictFilter('');
              }}
              className={selectClass}
            >
              <option value="">All Regions ({responses.length})</option>
              {uniqueRegions.map(region => (
                <option key={region} value={region}>
                  {region} ({responses.filter(r => r.region === region).length})
                </option>
              ))}
            </select>

            {regionFilter && uniqueDistricts.length > 0 && (
              <select
                value={districtFilter}
                onChange={(e) => setDistrictFilter(e.target.value)}
                className={selectClass}
              >
                <option value="">All Districts ({filteredByRegion.length})</option>
                {uniqueDistricts.map(district => (
                  <option key={district} value={district}>
                    {district} ({filteredByRegion.filter(r => r.district === district).length})
                  </option>
                ))}
              </select>
            )}

            {(regionFilter || districtFilter) && (
              <button
                onClick={() => {
                  setRegionFilter('');
                  setDistrictFilter('');
                }}
                className="text-xs text-ocean-400 hover:text-ocean-300 font-semibold transition-colors"
              >
                Clear filters
              </button>
            )}
          </div>
        )}

        {/* ── Map View ──────────────────────────────────────────────────── */}
        {viewMode === 'map' && (
          <div className={`mb-6 ${glassCard} overflow-hidden`}>
            <MapView responses={filteredResponses} />
          </div>
        )}

        {/* ── Table View ────────────────────────────────────────────────── */}
        {viewMode === 'table' && (
          <div className={`${glassCard} overflow-hidden`}>
            {filteredResponses.length === 0 ? (
              responses.length === 0 ? (
                <div className="p-16 text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-slate-800/60 border border-white/10 mb-4">
                    <FileText className="h-7 w-7 text-slate-500" />
                  </div>
                  <h3 className="text-lg font-semibold text-white">No responses yet</h3>
                  <p className="text-slate-400 mt-1 mb-6 text-sm">Share the public link to start collecting needs from citizens.</p>
                  <Button onClick={copyPublicLink} variant="secondary">
                    <Share2 className="mr-2 h-4 w-4" />
                    Copy Public Link
                  </Button>
                </div>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-slate-400 text-sm">No responses match the selected filters.</p>
                  <button
                    onClick={() => {
                      setRegionFilter('');
                      setDistrictFilter('');
                    }}
                    className="mt-3 text-sm text-ocean-400 hover:text-ocean-300 font-semibold transition-colors"
                  >
                    Clear filters
                  </button>
                </div>
              )
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th scope="col" className="px-4 py-4 text-left">
                        <input
                          type="checkbox"
                          checked={selectedIds.length > 0 && selectedIds.length === filteredResponses.length}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSelectedIds(filteredResponses.map(r => r.id));
                            } else {
                              setSelectedIds([]);
                            }
                          }}
                          className="rounded border-slate-600 bg-slate-700 text-ocean-500 focus:ring-ocean-500 h-4 w-4"
                        />
                      </th>
                      {['Status', 'Urgency', 'Name / Contact', 'Needs & Location', 'Time', 'Actions'].map(col => (
                        <th key={col} scope="col" className="px-6 py-4 text-left text-xs font-semibold text-ocean-300 uppercase tracking-widest">
                          {col}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {filteredResponses.map((response) => {
                      const urgency = response.aiClassification?.urgency || 'UNKNOWN';
                      const isSelected = selectedIds.includes(response.id);

                      const rowBorderClass =
                        urgency === 'CRITICAL'
                          ? 'border-l-2 border-coral-500 bg-coral-900/10 hover:bg-coral-900/20'
                          : urgency === 'MODERATE'
                          ? 'border-l-2 border-amber-500 bg-amber-900/10 hover:bg-amber-900/20'
                          : 'hover:bg-white/5';

                      return (
                        <tr
                          key={response.id}
                          className={`transition-colors ${rowBorderClass} ${isSelected ? 'bg-ocean-900/20' : ''}`}
                        >
                          <td className="px-4 py-4 whitespace-nowrap">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setSelectedIds(prev => [...prev, response.id]);
                                } else {
                                  setSelectedIds(prev => prev.filter(id => id !== response.id));
                                }
                              }}
                              className="rounded border-slate-600 bg-slate-700 text-ocean-500 focus:ring-ocean-500 h-4 w-4"
                            />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <StatusBadge status={response.status || 'pending'} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            {response.aiClassification ? (
                              <div className="flex flex-col gap-1">
                                <UrgencyBadge level={response.aiClassification.urgency} />
                                <span className="text-xs text-slate-500 max-w-[150px] truncate" title={response.aiClassification.reasoning}>
                                  {response.aiClassification.reasoning}
                                </span>
                              </div>
                            ) : (
                              <span className="text-xs text-slate-500 italic flex items-center gap-1">
                                <AlertCircle className="w-3 h-3" /> Pending AI
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-semibold text-white">{response.name}</div>
                            <div className="text-xs text-slate-400 mt-0.5">{response.contact}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-slate-200 line-clamp-2">{response.needs}</div>
                            <div className="text-xs text-slate-500 mt-1.5 space-y-0.5">
                              {response.region && (
                                <div className="font-medium text-slate-400">
                                  📍 {response.region}{response.district && ` · ${response.district}`}
                                </div>
                              )}
                              <div className="break-words">
                                {renderLocation(response.location)}
                              </div>
                              {responderCoords && (() => {
                                const victimCoords = parseLocationCoords(response.location);
                                if (victimCoords) {
                                  const dist = calculateDistanceKm(responderCoords.lat, responderCoords.lng, victimCoords.lat, victimCoords.lng);
                                  return (
                                    <div className="inline-block mt-1 px-2 py-0.5 bg-ocean-900/60 text-ocean-300 border border-ocean-700/50 rounded-lg font-semibold text-[11px]">
                                      🧭 {dist} km away
                                    </div>
                                  );
                                }
                                return null;
                              })()}
                            </div>
                            {response.images && response.images.length > 0 && (
                              <div className="mt-2">
                                <ImageGallery images={response.images} compact />
                              </div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <RelativeTime timestamp={response.submittedAt} />
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex gap-2">
                              {response.status !== 'in_progress' && response.status !== 'resolved' && (
                                <button
                                  onClick={() => updateResponseStatus(response.id, 'in_progress')}
                                  className="text-xs px-2.5 py-1.5 bg-ocean-700/80 hover:bg-ocean-600 text-white rounded-lg transition-all font-medium"
                                >
                                  Start
                                </button>
                              )}
                              {response.status !== 'resolved' && (
                                <button
                                  onClick={() => updateResponseStatus(response.id, 'resolved')}
                                  className="text-xs px-2.5 py-1.5 bg-emerald-800/80 hover:bg-emerald-700 text-white rounded-lg transition-all font-medium"
                                >
                                  Resolve
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Modals ────────────────────────────────────────────────────── */}
        {showSheetsSetup && id && (
          <GoogleSheetsSetup incidentId={id} onClose={() => setShowSheetsSetup(false)} />
        )}

        {showQRScanner && id && (
          <QRScannerModal
            incidentId={id}
            onScanSuccess={async (scannedData) => {
              await storageService.submitResponse({
                incidentId: id,
                name: scannedData.name || 'Anonymous',
                contact: scannedData.contact || 'N/A',
                needs: scannedData.needs || 'No details provided',
                location: scannedData.location || 'Unknown',
                region: scannedData.region,
                district: scannedData.district,
                images: scannedData.images || [],
              });
              await loadData();
            }}
            onClose={() => setShowQRScanner(false)}
          />
        )}

        {showPeerSync && (
          <PeerBroadcastModal
            isOpen={showPeerSync}
            onClose={() => setShowPeerSync(false)}
            incidents={incident ? [incident] : []}
            onImportIncidents={async (importedIncidents) => {
              for (const inc of importedIncidents) {
                await storageService.createIncident(inc);
              }
              await loadData();
            }}
          />
        )}
      </div>
    </div>
  );
};