import React, { useState } from 'react';
import { useTelemetryStream } from '@/hooks/useTelemetryStream';
import { useRaceRecording } from '@/hooks/useRaceRecording';
import { RaceHeader } from '@/components/dashboard/RaceHeader';
import { DriverCard } from '@/components/dashboard/DriverCard';
import { IncidentLog } from '@/components/dashboard/IncidentLog';
import { SystemHealthPanel } from '@/components/dashboard/SystemHealthPanel';
import { ControlPanel } from '@/components/dashboard/ControlPanel';
import { ArchitectureDiagram } from '@/components/dashboard/ArchitectureDiagram';
import { ReplayControls } from '@/components/dashboard/ReplayControls';
import { ReplayMode } from '@/components/dashboard/ReplayMode';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { LayoutDashboard, GitBranch, Users } from 'lucide-react';

const Index = () => {
  const { 
    drivers, 
    anomalies, 
    systemHealth, 
    raceInfo, 
    isPaused, 
    togglePause,
    clearAnomalies 
  } = useTelemetryStream(150);

  const {
    replayState,
    currentSnapshot,
    startRecording,
    stopRecording,
    startPlayback,
    pausePlayback,
    seekToIndex,
    seekToIncident,
    setPlaybackSpeed,
    clearSession
  } = useRaceRecording({
    drivers,
    anomalies,
    systemHealth,
    raceInfo,
    isPaused
  });

  const [selectedTab, setSelectedTab] = useState('telemetry');
  const [showReplayMode, setShowReplayMode] = useState(false);

  // Get drivers with active anomalies
  const driversWithAnomalies = new Set(
    anomalies
      .filter(a => Date.now() - a.timestamp.getTime() < 5000)
      .map(a => a.driverId)
  );

  // Handle entering replay mode
  const handleEnterReplayMode = () => {
    if (replayState.session) {
      setShowReplayMode(true);
    }
  };

  const handleExitReplayMode = () => {
    setShowReplayMode(false);
    pausePlayback();
  };

  // Show replay mode if active
  if (showReplayMode && replayState.session) {
    return (
      <ReplayMode
        session={replayState.session}
        currentSnapshot={currentSnapshot}
        currentIndex={replayState.currentIndex}
        isPlaying={replayState.isPlaying}
        playbackSpeed={replayState.playbackSpeed}
        onSeek={seekToIndex}
        onSeekToIncident={seekToIncident}
        onPlay={startPlayback}
        onPause={pausePlayback}
        onSetSpeed={setPlaybackSpeed}
        onExitReplay={handleExitReplayMode}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <RaceHeader raceInfo={raceInfo} systemHealth={systemHealth} />

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Tabs */}
        <div className="flex-1 flex flex-col min-w-0">
          <Tabs value={selectedTab} onValueChange={setSelectedTab} className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 border-b border-border bg-card/50">
              <TabsList className="bg-secondary/50">
                <TabsTrigger value="telemetry" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <LayoutDashboard className="w-4 h-4" />
                  <span className="font-orbitron text-xs">TELEMETRY</span>
                </TabsTrigger>
                <TabsTrigger value="architecture" className="gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
                  <GitBranch className="w-4 h-4" />
                  <span className="font-orbitron text-xs">ARCHITECTURE</span>
                </TabsTrigger>
              </TabsList>

              <div className="flex items-center gap-3">
                {/* Replay Controls */}
                <ReplayControls
                  isRecording={replayState.isRecording}
                  hasSession={!!replayState.session}
                  onStartRecording={startRecording}
                  onStopRecording={stopRecording}
                  onEnterReplayMode={handleEnterReplayMode}
                  onClearSession={clearSession}
                  snapshotCount={replayState.session?.snapshots.length}
                  incidentCount={replayState.session?.incidents.length}
                />

                <div className="w-px h-6 bg-border" />

                <ControlPanel 
                  isPaused={isPaused} 
                  onTogglePause={togglePause} 
                />
              </div>
            </div>

            <TabsContent value="telemetry" className="flex-1 m-0 overflow-hidden">
              <ScrollArea className="h-full">
                <div className="p-4 space-y-4">
                  {/* Top 5 Drivers - Larger Cards */}
                  <div className="space-y-3">
                    <h2 className="font-orbitron text-sm font-semibold text-muted-foreground flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      LIVE TELEMETRY - ALL DRIVERS
                      {replayState.isRecording && (
                        <span className="ml-2 px-2 py-0.5 bg-critical/20 rounded text-critical text-xs animate-pulse">
                          ● RECORDING
                        </span>
                      )}
                    </h2>
                    {drivers.slice(0, 5).map(driver => (
                      <DriverCard 
                        key={driver.id} 
                        driver={driver}
                        hasAnomaly={driversWithAnomalies.has(driver.id)}
                      />
                    ))}
                  </div>

                  {/* Remaining Drivers - Compact Grid */}
                  {drivers.length > 5 && (
                    <div className="space-y-3">
                      <h2 className="font-orbitron text-sm font-semibold text-muted-foreground">
                        REMAINING FIELD
                      </h2>
                      <div className="grid grid-cols-1 xl:grid-cols-2 gap-3">
                        {drivers.slice(5).map(driver => (
                          <DriverCard 
                            key={driver.id} 
                            driver={driver}
                            hasAnomaly={driversWithAnomalies.has(driver.id)}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="architecture" className="flex-1 m-0 overflow-hidden p-4">
              <ArchitectureDiagram />
              
              {/* Additional Documentation */}
              <div className="mt-4 grid grid-cols-3 gap-4">
                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="font-orbitron text-sm font-semibold text-primary mb-2">Data Flow</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Telemetry @ 100Hz per car</li>
                    <li>• WebSocket streaming</li>
                    <li>• Target latency &lt;15ms</li>
                    <li>• Buffered event queue</li>
                  </ul>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="font-orbitron text-sm font-semibold text-warning mb-2">Anomaly Rules</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Tyre temp &gt;105°C = Warning</li>
                    <li>• Tyre temp &gt;115°C = Critical</li>
                    <li>• Fuel &lt;15% = Warning</li>
                    <li>• Fuel &lt;8% = Critical</li>
                  </ul>
                </div>
                
                <div className="bg-card rounded-lg border border-border p-4">
                  <h4 className="font-orbitron text-sm font-semibold text-success mb-2">Reliability</h4>
                  <ul className="space-y-1 text-xs text-muted-foreground">
                    <li>• Auto-reconnect on drop</li>
                    <li>• Packet loss tracking</li>
                    <li>• Structured logging</li>
                    <li>• Health monitoring</li>
                  </ul>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>

        {/* Right Panel - Incidents & Health */}
        <div className="w-80 border-l border-border flex flex-col bg-card/30">
          <div className="flex-1 min-h-0">
            <IncidentLog anomalies={anomalies} onClear={clearAnomalies} />
          </div>
          <div className="border-t border-border">
            <SystemHealthPanel health={systemHealth} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
