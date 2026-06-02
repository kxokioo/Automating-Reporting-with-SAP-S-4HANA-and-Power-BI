import React, { useState, useEffect, useRef, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
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
  RefreshCw,
  AlertTriangle
} from "lucide-react";

interface Pipeline {
  id: number;
  name: string;
  source_system: string;
  target_table: string;
  schedule_cron: string;
  last_run_status: "SUCCESS" | "FAILED" | "RUNNING" | "NEVER" | "IDLE";
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
  status: "IDLE",
  step: "WAITING",
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
  useEffect(() => {
    return () => {
      if (pollingInterval) clearInterval(pollingInterval);
    };
  }, [pollingInterval]);

  // Auto-scroll terminal logs
  useEffect(() => {
    if (consoleEndRef.current) {
      consoleEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [progress.logs]);

  // Fetch pipeline catalog from backend
  const fetchPipelines = useCallback(async () => {
    try {
      const res = await apiFetch("/etl/pipelines");
      if (res.ok) {
        const data: Pipeline[] = await res.json();
        setPipelines(data);
      }
    } catch (e) {
      // Fail silently during background poll
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

        if (data.status === "COMPLETED" || data.status === "FAILED" || data.status === "IDLE") {
          // Stop polling and refresh pipeline list
          setPollingInterval(prev => { if (prev) clearInterval(prev); return null; });
          setIsTriggeringId(null);
          fetchPipelines();
        }
      }
    } catch (e) {
      // Ignore transient errors during polling
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
    if (user?.role !== "Admin") {
      alert("Permission Denied: Only users with the Admin role can manually trigger database synchronization routines.");
      return;
    }
    setProgress(IDLE_PROGRESS);
    setIsTriggeringId(pipelineId);

    try {
      const res = await apiFetch(`/etl/trigger/${pipelineId}`, { method: "POST" });
      if (!res.ok) {
        const err = await res.json();
        alert(`Integration error: ${err.detail || "Verification failed"}`);
        setIsTriggeringId(null);
      }
    } catch (e: any) {
      alert(`Connection error: ${e.message}`);
      setIsTriggeringId(null);
    }
  };

  const selectedPipe = pipelines.find(p => p.id === selectedPipelineId);
  const isRunning = isTriggeringId === selectedPipelineId || selectedPipe?.last_run_status === "RUNNING";

  const activeStep = isTriggeringId ? progress.step : "IDLE";
  const progressVal = isTriggeringId ? progress.progress : 0;

  return (
    <div className="space-y-6">
      {/* Top Title */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-white flex items-center gap-2">
            SAP Integration Pipelines
            <span className="text-xs bg-zinc-800 text-zinc-300 font-semibold px-2 py-0.5 rounded border border-zinc-700">
              OData Sync
            </span>
          </h2>
          <p className="text-sm text-zinc-400">
            Monitor and coordinate database extraction jobs pulling data from SAP S/4HANA instances.
          </p>
        </div>
        <button
          onClick={fetchPipelines}
          className="flex items-center gap-1.5 px-3 py-2 rounded-md text-xs font-semibold bg-zinc-900 border border-zinc-800 hover:border-zinc-700 text-zinc-300 hover:text-white transition-all"
        >
          <RefreshCw className="w-3.5 h-3.5" /> Refresh Pipelines
        </button>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Left: Pipeline selection profile cards */}
        <div className="glass-panel p-5 rounded-lg space-y-4 border border-zinc-850 bg-zinc-900">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Pipelines Catalog</h3>
          
          {isLoadingPipelines ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : (
            <div className="space-y-3">
              {pipelines.map((p) => (
                <div 
                  key={p.id}
                  onClick={() => setSelectedPipelineId(p.id)}
                  className={`p-4 rounded-md cursor-pointer border transition-all ${
                    selectedPipelineId === p.id 
                      ? "bg-zinc-800 border-blue-600" 
                      : "bg-zinc-950/20 border-zinc-800 hover:border-zinc-700"
                  }`}
                >
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="text-xs font-bold text-zinc-200 truncate pr-2">{p.name}</h4>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-extrabold flex-shrink-0 ${
                      p.last_run_status === "RUNNING" || isTriggeringId === p.id
                        ? "bg-blue-950/20 text-blue-450 border border-blue-900/30"
                        : p.last_run_status === "SUCCESS"
                        ? "bg-emerald-950/20 text-emerald-450 border border-emerald-900/20"
                        : p.last_run_status === "FAILED"
                        ? "bg-rose-950/20 text-rose-450 border border-rose-900/20"
                        : "bg-zinc-950 text-zinc-400 border border-zinc-800"
                    }`}>
                      {isTriggeringId === p.id ? "RUNNING" : p.last_run_status}
                    </span>
                  </div>
                  <div className="text-[10px] text-zinc-400 space-y-1">
                    <p>Source System: <span className="font-semibold text-zinc-300 truncate">{p.source_system}</span></p>
                    <p>Cron Schedule: <span className="font-mono text-zinc-300 font-semibold">{p.schedule_cron}</span></p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Trigger Controller Panel */}
          {selectedPipe && (
            <div className="pt-4 border-t border-zinc-800 space-y-3">
              <div className="text-xs text-zinc-300 space-y-1.5">
                <p className="font-bold text-white">Target Table: <span className="font-mono text-zinc-300 font-semibold">{selectedPipe.target_table}</span></p>
                <p>Last Run Timestamp: <span className="font-mono text-zinc-400">{selectedPipe.last_run_time ?? "Never"}</span></p>
                <p>Gateway Status: <span className="font-mono font-bold text-zinc-200">{selectedPipe.last_run_status}</span></p>
              </div>

              {user?.role === "Admin" ? (
                <button
                  disabled={isRunning}
                  onClick={() => handleTrigger(selectedPipe.id)}
                  className={`w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-md text-xs font-bold transition-all border ${
                    isRunning
                      ? "bg-zinc-800 text-zinc-550 border-zinc-800 cursor-not-allowed"
                      : "bg-blue-600 hover:bg-blue-700 text-white border-blue-600 shadow-sm"
                  }`}
                >
                  {isRunning ? (
                    <><div className="w-3.5 h-3.5 border-2 border-zinc-500 border-t-transparent rounded-full animate-spin" /> Synchronizing...</>
                  ) : (
                    <><Play className="w-3.5 h-3.5 fill-current" /> Execute Manual Job Sync</>
                  )}
                </button>
              ) : (
                <div className="p-3 rounded-md bg-rose-950/20 border border-rose-900/30 text-[11px] text-rose-300 font-semibold leading-relaxed flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-450 flex-shrink-0 mt-0.5" />
                  <span>Manual runs are restricted to Admin accounts. You can change your active role in the sidebar.</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right: Telemetry & Log Console */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Node DAG Visualizer */}
          <div className="glass-panel p-5 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-wider">Execution Pipeline Topology</h3>
            
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 py-6 px-4 bg-zinc-950 border border-zinc-800 rounded-lg relative">
              
              {/* Node 1: SAP ERP */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-lg border transition-all ${
                activeStep === "INITIALIZING" || activeStep === "EXTRACTING"
                  ? "bg-zinc-850 border-blue-600 scale-105" 
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                <Server className={`w-6 h-6 mb-1.5 ${activeStep === "INITIALIZING" || activeStep === "EXTRACTING" ? "text-blue-500" : "text-zinc-500"}`} />
                <span className="text-[10px] font-extrabold text-white">SAP ERP S/4HANA</span>
                <span className="text-[8px] text-zinc-500 font-semibold">OData Interface</span>
              </div>

              <ArrowRight className="w-4 h-4 text-zinc-700 hidden md:block" />

              {/* Node 2: Extracting */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-lg border transition-all ${
                activeStep === "EXTRACTING" 
                  ? "bg-zinc-850 border-blue-600 scale-105" 
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                <Clock className={`w-6 h-6 mb-1.5 ${activeStep === "EXTRACTING" ? "text-blue-500" : "text-zinc-500"}`} />
                <span className="text-[10px] font-extrabold text-white">Extraction Layer</span>
                <span className="text-[8px] text-zinc-500 font-semibold">Ledger Aggregation</span>
              </div>

              <ArrowRight className="w-4 h-4 text-zinc-700 hidden md:block" />

              {/* Node 3: Transforming */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-lg border transition-all ${
                activeStep === "TRANSFORMING" 
                  ? "bg-zinc-850 border-blue-600 scale-105" 
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                <Cpu className={`w-6 h-6 mb-1.5 ${activeStep === "TRANSFORMING" ? "text-blue-500" : "text-zinc-500"}`} />
                <span className="text-[10px] font-extrabold text-white">Transformation</span>
                <span className="text-[8px] text-zinc-500 font-semibold">Currency Mapping</span>
              </div>

              <ArrowRight className="w-4 h-4 text-zinc-700 hidden md:block" />

              {/* Node 4: Target Cache DB */}
              <div className={`z-10 flex flex-col items-center justify-center w-28 h-24 rounded-lg border transition-all ${
                activeStep === "LOADING" 
                  ? "bg-zinc-850 border-blue-600 scale-105" 
                  : activeStep === "COMPLETED"
                  ? "bg-emerald-950/20 border-emerald-500/30"
                  : "bg-zinc-900 border-zinc-800"
              }`}>
                <Database className={`w-6 h-6 mb-1.5 ${
                  activeStep === "LOADING" 
                    ? "text-blue-500" 
                    : activeStep === "COMPLETED"
                    ? "text-emerald-400"
                    : "text-zinc-500"
                }`} />
                <span className="text-[10px] font-extrabold text-white">Relational Cache</span>
                <span className="text-[8px] text-zinc-500 font-semibold">Postgres Storage</span>
              </div>
            </div>

            {/* Standard Progress bar */}
            {isTriggeringId !== null && (
              <div className="space-y-1.5 pt-2">
                <div className="flex justify-between text-xs font-semibold text-zinc-300">
                  <span className="flex items-center gap-1.5">
                    <Hourglass className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                    Synchronisation Step: <strong className="text-white">{activeStep}</strong>
                    {progress.records_processed > 0 && (
                      <span className="text-zinc-400 font-normal">— {progress.records_processed} rows loaded</span>
                    )}
                  </span>
                  <span>{progressVal}%</span>
                </div>
                <div className="w-full h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800 p-[1px]">
                  <div 
                    className="h-full bg-blue-600 rounded-full transition-all duration-500"
                    style={{ width: `${progressVal}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* Standard Log Terminal */}
          <div className="glass-panel p-5 rounded-lg border border-zinc-800 bg-zinc-900 space-y-4 flex flex-col h-80">
            <div className="flex justify-between items-center">
              <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <TermIcon className="w-4 h-4 text-emerald-400" />
                Live Pipelines Console Logs
              </h3>
              <span className="text-[9px] text-zinc-400 font-semibold bg-zinc-950 border border-zinc-800 px-2 py-0.5 rounded">
                Console standard-out
              </span>
            </div>
            
            {/* Terminal log wrapper */}
            <div className="flex-1 bg-zinc-950 border border-zinc-800 rounded-md p-4 font-mono text-[11px] text-emerald-400 overflow-y-auto space-y-1 shadow-inner min-h-[180px]">
              {progress.logs.length === 0 ? (
                <div className="text-zinc-650 italic">No pipelines active. Waiting for database synchronization routines...</div>
              ) : (
                progress.logs.map((log, idx) => (
                  <div key={idx} className="leading-relaxed hover:bg-emerald-950/20 px-1 py-0.5 rounded transition-all">
                    {log}
                  </div>
                ))
              )}
              {isTriggeringId !== null && progress.status !== "COMPLETED" && progress.status !== "FAILED" && (
                <div className="text-emerald-500 flex items-center gap-1.5 mt-2 font-semibold">
                  <span>&gt; Sync routine in progress...</span>
                </div>
              )}
              {progress.status === "COMPLETED" && (
                <div className="text-emerald-400 flex items-center gap-1.5 mt-2 font-bold">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Pipeline completed successfully.</span>
                </div>
              )}
              {progress.status === "FAILED" && (
                <div className="text-rose-455 flex items-center gap-1.5 mt-2 font-bold">
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
