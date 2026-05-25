import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { 
  Play, 
  Terminal as TermIcon, 
  CheckCircle2, 
  XCircle, 
  Hourglass,
  Server,
  Cpu,
  Database,
  ArrowRight,
  Clock,
  RefreshCw
} from 'lucide-react';

interface Pipeline {
  id: number;
  name: string;
  source_system: string;
  target_table: string;
  schedule_cron: string;
  last_run_status: 'SUCCESS' | 'FAILED' | 'RUNNING' | 'NEVER' | 'IDLE';
  last_run_time: string | null;
  is_active: boolean;
}

interface PipelineProgress {
  status: string;
  step: string;
  progress: number;
  records_processed: number;
  logs: string[];
}

const IDLE_PROGRESS: PipelineProgress = {
  status: 'IDLE',
  step: 'WAITING',
  progress: 0,
  records_processed: 0,
  logs: []
};

export const EtlOrchestrator: React.FC = () => {
  const { user, apiFetch } = useAuth();
  const [selectedPipelineId, setSelectedPipelineId] = useState<number>(1);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [progress, setProgress] = useState<PipelineProgress>(IDLE_PROGRESS);
  const [isLoadingPipelines, setIsLoadingPipelines] = useState<boolean>(true);
  const [isTriggeringId, setIsTriggeringId] = useState<number | null>(null);
  const [pollingInterval, setPollingInterval] = useState<ReturnType<typeof setInterval> | null>(null);
  const consoleEndRef = useRef<HTMLDivElement>(null);
  
  // Cleanup polling interval on unmount
  React.useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  // Auto-scroll terminal
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [progress.logs]);

  // Fetch pipeline catalog from backend
  const fetchPipelines = useCallback(async () => {
    try {
      const res = await apiFetch('/etl/pipelines');
      if (res.ok) {
        const data: Pipeline[] = await res.json();
        setPipelines(data);
      }
    } catch (e) {
      // silently fail during poll
    } finally {
      setIsLoadingPipelines(false);
    }
  }, [apiFetch]);

  useEffect(() => {
    fetchPipelines();
  }, [fetchPipelines]);

  // Poll progress for the selected pipeline while a run is active
  const pollProgress = useCallback(async (pipelineId: number) => {
    try {
      const res = await apiFetch(`/etl/progress/${pipelineId}`);
      if (res.ok) {
        const data: PipelineProgress = await res.json();
        setProgress(data);

        if (data.status === 'COMPLETED' || data.status === 'FAILED' || data.status === 'IDLE') {
          // Stop polling and refresh pipeline list to update last_run_status
          setPollingInterval(prev => { if (prev) clearInterval(prev); return null; });
          setIsTriggeringId(null);
          fetchPipelines();
        }
      }
    } catch (e) {
      // ignore transient errors during polling
    }
  }, [apiFetch, fetchPipelines]);

  // Start/stop polling when trigger is active
  useEffect(() => {
    if (isTriggeringId !== null) {
      const interval = setInterval(() => pollProgress(isTriggeringId), 1500);
      setPollingInterval(interval);
      return () => clearInterval(interval);
    }
    return undefined;
  }, [isTriggeringId, pollProgress]);

  const handleTrigger = async (pipelineId: number) => {
    if (user?.role !== 'Admin') {
      alert('Permission Denied: Only Administrator users can manually trigger ETL pipelines.');
      return;
    }
    setProgress(IDLE_PROGRESS);
    setIsTriggeringId(pipelineId);

    try {
      const res = await apiFetch(`/etl/trigger/${pipelineId}`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        alert(`Trigger failed: ${err.detail || 'Unknown error'}`);
        setIsTriggeringId(null);
      }
    } catch (e: any) {
      alert(`Trigger error: ${e.message}`);
      setIsTriggeringId(null);
    }
  };

  const selectedPipe = pipelines.find(p => p.id === selectedPipelineId);
  const isRunning = isTriggeringId === selectedPipelineId || selectedPipe?.last_run_status === 'RUNNING';

  const activeStep = isTriggeringId ? progress.step : 'IDLE';
  const progressVal = isTriggeringId ? progress.progress : 0;

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-2">
            SAP ETL Orchestrator <span className="text-xs bg-purple-950 text-darkspace-glowViolet font-bold px-2 py-0.5 rounded border border-purple-800">Thread-Safe</span>
          </h2>
          <p className="text-sm text-slate-400">Trigger, monitor, and configure analytical pipelines extracting from SAP ERP &amp; BW.</p>
        </div>
        <button
          onClick={fetchPipelines}
          className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-white/5 border border-white/10 hover:border-white/20 text-slate-300 hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Pipeline selection profile cards */}
        <div className="glass-panel p-5 rounded-xl space-y-4 shadow-xl">
          <h3 className="text-sm font-bold text-white uppercase tracking-wider">Pipelines Catalog</h3>
          
          {isLoadingPipelines ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-darkspace-glowViolet border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {pipelines.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPipelineId(p.id)}
                  className={`p-4 rounded-lg cursor-pointer border transition-all ${
                    selectedPipelineId === p.id 
                      ? 'bg-white/5 border-darkspace-glowViolet' 
                      : 'bg-white/[0.01] border-white/5 hover:border-white/20'
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-slate-200 truncate pr-2">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold flex-shrink-0 ${
                      p.last_run_status === 'RUNNING' || isTriggeringId === p.id
                        ? 'bg-indigo-950 text-indigo-400 border border-indigo-900/30 animate-pulse'
                        : p.last_run_status === 'SUCCESS'
                        ? 'bg-emerald-950 text-emerald-400 border border-emerald-900/30'
                        : p.last_run_status === 'FAILED'
                        ? 'bg-rose-950 text-rose-400 border border-rose-900/30'
                        : 'bg-slate-900 text-slate-400 border border-slate-800'
                    }`}>
                      {isTriggeringId === p.id ? 'RUNNING' : p.last_run_status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 space-y-1">
                    <p>Source: <span className="font-semibold text-slate-300 truncate">{p.source_system}</span></p>
                    <p>Schedule: <span className="font-mono text-indigo-300 font-semibold">{p.schedule_cron}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trigger Controller Panel */}
          {selectedPipe && (
            <div className="pt-4 border-t border-white/5 space-y-3">
              <div className="text-xs text-slate-300 space-y-1">
                <p className="font-bold text-white">Target Table: <span className="font-mono text-darkspace-glowTeal font-semibold">{selectedPipe.target_table}</span></p>
                <p>Last Sync Runtime: <span className="font-mono">{selectedPipe.last_run_time ?? 'Never'}</span></p>
                <p>Pipeline Status: <span className="font-mono font-bold text-neon-teal">{selectedPipe.last_run_status}</span></p>
              </div>

              {user?.role === 'Admin' ? (
                <button
                  disabled={isRunning}
                  onClick={() => handleTrigger(selectedPipe.id)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs font-bold transition-all ${
                    isRunning
                      ? 'bg-indigo-950 text-indigo-500 border border-indigo-900/50 cursor-not-allowed'
                      : 'bg-gradient-to-tr from-darkspace-glowViolet to-darkspace-glowIndigo hover:brightness-110 text-white neon-glow-violet shadow-lg'
                  }`}
                >
                  {isRunning ? (
                    <><div className="w-3.5 h-3.5 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin" /> Running Pipeline…</>
                  ) : (
                    <><Play className="w-4 h-4 fill-current" /> Manual ETL Run Execution</>
                  )}
                </button>
              ) : (
                <div className="p-3 rounded-lg bg-rose-950/20 border border-rose-900/30 text-[11px] text-rose-300 font-semibold leading-relaxed">
                  ⚠️ View Only: Your active RBAC role lacks permission to manually trigger data synchronization routines. Toggle 'Admin' in the sidebar to unlock.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Telemetry & Log Console */}
        <div className="lg:col-span-2 space-y-6">
          {/* Interactive Node DAG Visualizer */}
          <div className="glass-panel p-5 rounded-xl shadow-xl space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Active Execution DAG Topology</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-4 bg-black/20 rounded-xl relative overflow-hidden">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-indigo-950/20 via-transparent to-transparent"></div>
              
              {/* Node 1: SAP ERP */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-xl border transition-all ${
                activeStep === 'INITIALIZING' || activeStep === 'EXTRACTING'
                  ? 'bg-indigo-950/40 border-darkspace-glowViolet scale-105 shadow-lg shadow-purple-950/30 animate-pulse' 
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <Server className={`w-7 h-7 mb-1.5 ${activeStep === 'INITIALIZING' || activeStep === 'EXTRACTING' ? 'text-darkspace-glowViolet animate-bounce' : 'text-slate-400'}`} />
                <span className="text-[10px] font-extrabold text-white">SAP S/4HANA</span>
                <span className="text-[8px] text-slate-500 font-semibold">ODATA ENDPOINT</span>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

              {/* Node 2: Extracting */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-xl border transition-all ${
                activeStep === 'EXTRACTING' 
                  ? 'bg-indigo-950/40 border-darkspace-glowViolet scale-105 shadow-lg shadow-purple-950/30 animate-pulse' 
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <Clock className={`w-7 h-7 mb-1.5 ${activeStep === 'EXTRACTING' ? 'text-darkspace-glowViolet animate-spin' : 'text-slate-400'}`} />
                <span className="text-[10px] font-extrabold text-white">Extracting Zone</span>
                <span className="text-[8px] text-slate-500 font-semibold">BKPF / BSEG STAGE</span>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

              {/* Node 3: Transforming */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-xl border transition-all ${
                activeStep === 'TRANSFORMING' 
                  ? 'bg-indigo-950/40 border-darkspace-glowViolet scale-105 shadow-lg shadow-purple-950/30 animate-pulse' 
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <Cpu className={`w-7 h-7 mb-1.5 ${activeStep === 'TRANSFORMING' ? 'text-darkspace-glowTeal animate-pulse' : 'text-slate-400'}`} />
                <span className="text-[10px] font-extrabold text-white">Transforming</span>
                <span className="text-[8px] text-slate-500 font-semibold">CURRENCY & JOIN</span>
              </div>

              <ArrowRight className="w-5 h-5 text-slate-600 hidden md:block" />

              {/* Node 4: Target Cache DB */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-xl border transition-all ${
                activeStep === 'LOADING' 
                  ? 'bg-indigo-950/40 border-darkspace-glowViolet scale-105 shadow-lg shadow-purple-950/30 animate-pulse' 
                  : activeStep === 'COMPLETED'
                  ? 'bg-emerald-950/20 border-emerald-500/30'
                  : 'bg-white/[0.02] border-white/10'
              }`}>
                <Database className={`w-7 h-7 mb-1.5 ${
                  activeStep === 'LOADING' 
                    ? 'text-darkspace-glowViolet' 
                    : activeStep === 'COMPLETED'
                    ? 'text-emerald-400'
                    : 'text-slate-400'
                }`} />
                <span className="text-[10px] font-extrabold text-white">Aetheris Catalog</span>
                <span className="text-[8px] text-slate-500 font-semibold">POSTGRESQL CACHE</span>
              </div>
            </div>

            {/* Glowing Progress bar */}
            {isTriggeringId !== null && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-darkspace-glowViolet animate-spin" />
                    Current Step: <strong className="text-white">{activeStep}</strong>
                    {progress.records_processed > 0 && (
                      <span className="text-slate-400 font-normal">— {progress.records_processed} rows</span>
                    )}
                  </span>
                  <span>{progressVal}%</span>
                </div>
                <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden border border-white/10 p-[1px]">
                  <div 
                    className="h-full bg-gradient-to-r from-darkspace-glowViolet to-darkspace-glowTeal rounded-full shadow-inner transition-all duration-500"
                    style={{ width: `${progressVal}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Glowing Log Terminal */}
          <div className="glass-panel p-5 rounded-xl shadow-xl space-y-4 flex flex-col h-80">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TermIcon className="w-4 h-4 text-emerald-400" />
                Live Pipelines Console Logs
              </h3>
              <span className="text-[10px] text-emerald-400 font-mono tracking-widest uppercase bg-emerald-950/40 border border-emerald-900/30 px-2 py-0.5 rounded">
                Standard Out
              </span>
            </div>
            
            {/* Terminal log wrapper */}
            <div className="flex-1 bg-black/40 border border-white/5 rounded-lg p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1 shadow-inner min-h-[180px]">
              {progress.logs.length === 0 ? (
                <div className="text-slate-600 italic">No pipelines active. Waiting for manual trigger or scheduled cron trigger...</div>
              ) : (
                progress.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-emerald-950/20 px-1 py-0.5 rounded transition-all">
                    {log}
                  </div>
                ))
              )}
              {isTriggeringId !== null && progress.status !== 'COMPLETED' && progress.status !== 'FAILED' && (
                <div className="text-emerald-500 flex items-center gap-1.5 animate-pulse mt-2 font-bold">
                  <span>&gt; Sync routine in progress...</span>
                </div>
              )}
              {progress.status === 'COMPLETED' && (
                <div className="text-emerald-300 flex items-center gap-1.5 mt-2 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pipeline completed successfully.</span>
                </div>
              )}
              {progress.status === 'FAILED' && (
                <div className="text-rose-400 flex items-center gap-1.5 mt-2 font-bold">
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Pipeline execution failed. See logs above.</span>
                </div>
              )}
              <div ref={consoleEndRef} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
