import React, { useState, useEffect, useRef } from 'react';
import PeriodicTableSelector from './components/Simulator/PeriodicTableSelector';
import ControlPanel from './components/Simulator/ControlPanel';
import SimulationUnit from './components/Simulator/SimulationUnit';
import ElementPropertiesMenu from './components/Simulator/ElementPropertiesMenu';
import RecordingStatsModal from './components/Simulator/RecordingStatsModal';
import { ELEMENTS } from './data/elements';
import { ChemicalElement, PhysicsState } from './types';
// Import new hook
import { Settings, Play, Pause, RotateCcw, FastForward, Settings2, X, Circle, Square } from "lucide-react";


// --- Inline Icons to separate from external dependencies ---

const IconBookOpen = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M12 7v14" />
        <path d="M3 18a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h5a4 4 0 0 1 4 4 4 4 0 0 1 4-4h5a1 1 0 0 1 1 1v13a1 1 0 0 1-1 1h-6a3 3 0 0 0-3 3 3 3 0 0 0-3-3z" />
    </svg>
);

const IconPiP = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M2 10h6V4" />
        <path d="m2 4 6 6" />
        <path d="M21 10V7a2 2 0 0 0-2-2h-7" />
        <path d="M3 14v2a2 2 0 0 0 2 2h3" />
        <rect x="12" y="14" width="10" height="7" rx="1" />
    </svg>
);

const IconMaximize = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="M15 3h6v6" />
        <path d="m21 3-7 7" />
        <path d="m3 21 7-7" />
        <path d="M9 21H3v-6" />
    </svg>
);

const IconMinimize = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
    <svg
        xmlns="http://www.w3.org/2000/svg"
        width={size}
        height={size}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
    >
        <path d="m14 10 7-7" />
        <path d="M20 10h-6V4" />
        <path d="m3 21 7-7" />
        <path d="M4 14h6v6" />
    </svg>
);

interface ContextMenuData {
    x: number;
    y: number;
    element: ChemicalElement;
    physicsState: PhysicsState;
}


interface RecordingSnapshot {
    element: ChemicalElement;
    state: PhysicsState;
}

import { useElementViewerChat } from './hooks/useElementViewerChat';

// ... (existing interfaces)

function App() {
    // State for Selection (Array for Multi-Element)
    const [selectedElements, setSelectedElements] = useState<ChemicalElement[]>([ELEMENTS[0]]);
    const [isMultiSelect, setIsMultiSelect] = useState(false);

    // Default Physics State (STP) - Shared Global Environment
    const [temperature, setTemperature] = useState<number>(298.15);
    const [pressure, setPressure] = useState<number>(101325);

    // UI States
    const [showParticles, setShowParticles] = useState(false);
    const [isSidebarOpen, setSidebarOpen] = useState(true);
    const [timeScale, setTimeScale] = useState<number>(1);
    const [isPaused, setIsPaused] = useState(false);
    const [contextMenu, setContextMenu] = useState<ContextMenuData | null>(null);
    const [isInteracting, setIsInteracting] = useState(false);

    // Refs
    const sidebarRef = useRef<HTMLElement>(null);
    const simulationRegistry = useRef<Map<number, () => PhysicsState>>(new Map());

    // ChatGPT Integration Hook
    const {
        maxHeight,
        safeArea,
        isFullscreen,
        requestDisplayMode,
        handleInfoClick
    } = useElementViewerChat({
        globalTemperature: temperature,
        globalPressure: pressure,
        selectedElements,
        simulationRegistry
    });

    // Safe area insets from ChatGPT SDK (avoids overlapping ChatGPT's own controls)
    const insets = safeArea?.insets ?? { top: 0, bottom: 0, left: 0, right: 0 };

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStartData, setRecordingStartData] = useState<Map<number, PhysicsState>>(new Map());
    const [recordingResults, setRecordingResults] = useState<{ element: ChemicalElement, start: PhysicsState, end: PhysicsState }[] | null>(null);

    // Registry to access child physics states on demand
    // (Managed in hook now or declared above)


    // --- CHATGPT WIDGET STATE SYNC ---
    // Este effect sincroniza o estado da simulação com o ChatGPT em tempo real
    useEffect(() => {
        const syncStateToChatGPT = () => {
            if (typeof window !== 'undefined' && window.openai?.setWidgetState) {
                // Coleta os dados exatos do que o usuário está vendo agora
                const elementsData = selectedElements.map(el => {
                    const getter = simulationRegistry.current.get(el.atomicNumber);
                    const currentState = getter ? getter() : null;
                    return {
                        nome: el.name,
                        simbolo: el.symbol,
                        estado_da_materia: currentState ? currentState.state : "Desconhecido",
                        temperatura_atual_K: currentState ? currentState.temperature.toFixed(2) : temperature.toFixed(2)
                    };
                });

                // Envia para a memória invisível do ChatGPT
                window.openai.setWidgetState({
                    ambiente: {
                        temperatura_alvo_K: temperature.toFixed(2),
                        pressao_Pa: pressure.toExponential(2)
                    },
                    elementos_visiveis: elementsData
                });
            }
        };

        // Dispara sempre que houver mudanças na UI
        syncStateToChatGPT();

        // Configura um loop a cada 2 segundos para capturar as mudanças de fase (sólido -> líquido, etc)
        // enquanto a temperatura sobe/desce animadamente pelo seu motor de física
        const intervalId = setInterval(syncStateToChatGPT, 2000);

        return () => clearInterval(intervalId);
    }, [temperature, pressure, selectedElements]);

    // --- SELECTION LOGIC ---
    const handleElementSelect = (el: ChemicalElement) => {
        if (isRecording) return; // Prevent changing elements while recording

        if (!isMultiSelect) {
            // Single Mode: Replace
            setSelectedElements([el]);
        } else {
            // Multi Mode: Toggle / FIFO
            const exists = selectedElements.find(e => e.atomicNumber === el.atomicNumber);

            if (exists) {
                // Remove if exists
                const filtered = selectedElements.filter(e => e.atomicNumber !== el.atomicNumber);
                // If removing the last one, don't allow empty array (fallback to default or keep one)
                if (filtered.length === 0) return;
                setSelectedElements(filtered);
            } else {
                // Add new
                let newSelection = [...selectedElements, el];
                if (newSelection.length > 6) {
                    // FIFO: Remove first, add new to end
                    newSelection = newSelection.slice(1);
                }
                setSelectedElements(newSelection);
            }
        }
        // Close menu if switching elements
        setContextMenu(null);
    };

    const handleToggleMultiSelect = () => {
        if (isRecording) return;
        const newValue = !isMultiSelect;
        setIsMultiSelect(newValue);
        // If turning OFF, revert to just the last selected element
        if (!newValue && selectedElements.length > 1) {
            setSelectedElements([selectedElements[selectedElements.length - 1]]);
        }
    };
    // 2. FUNÇÃO DE TOGGLE
    const handleToggleSpeed = (e: React.MouseEvent) => {
        e.stopPropagation();
        setTimeScale(prev => {
            if (prev === 1) return 2;
            if (prev === 2) return 4;
            if (prev === 4) return 0.25;
            if (prev === 0.25) return 0.5;
            return 1;
        });
    };

    const handleTogglePause = (e: React.MouseEvent) => {
        e.stopPropagation();
        setIsPaused(!isPaused);
    };

    // --- RECORDING LOGIC ---
    const registerSimulationUnit = (id: number, getter: () => PhysicsState) => {
        simulationRegistry.current.set(id, getter);
    };

    const handleToggleRecord = (e: React.MouseEvent) => {
        e.stopPropagation();

        if (!isRecording) {
            // START RECORDING
            const startMap = new Map<number, PhysicsState>();
            selectedElements.forEach(el => {
                const getter = simulationRegistry.current.get(el.atomicNumber);
                if (getter) {
                    // Clone state to avoid mutation reference issues
                    startMap.set(el.atomicNumber, { ...getter() });
                }
            });
            setRecordingStartData(startMap);
            setIsRecording(true);
        } else {
            // STOP RECORDING
            const results: { element: ChemicalElement, start: PhysicsState, end: PhysicsState }[] = [];

            selectedElements.forEach(el => {
                const getter = simulationRegistry.current.get(el.atomicNumber);
                const startState = recordingStartData.get(el.atomicNumber);

                if (getter && startState) {
                    const endState = { ...getter() };
                    results.push({
                        element: el,
                        start: startState,
                        end: endState
                    });
                }
            });

            setRecordingResults(results);
            setIsRecording(false);
        }
    };

    // --- CONTEXT MENU HANDLER ---
    const handleInspect = (element: ChemicalElement) => (event: React.MouseEvent, physics: PhysicsState) => {
        if (isRecording) return; // Disable inspect during recording to avoid clutter
        setContextMenu({
            x: event.clientX,
            y: event.clientY,
            element,
            physicsState: physics
        });
    };

    // --- CLICK OUTSIDE HANDLER ---
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            // If sidebar is open, and click is NOT inside the sidebar ref
            if (isSidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
                setSidebarOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [isSidebarOpen]);

    // --- GRID LAYOUT LOGIC ---
    const count = selectedElements.length;

    // Grid Classes for seamless full-screen tiling
    // Default: Full screen single item
    let gridClass = "grid-cols-1 grid-rows-1";

    if (count === 2) gridClass = "grid-cols-2 grid-rows-1";
    else if (count >= 3 && count <= 4) gridClass = "grid-cols-2 grid-rows-2";
    else if (count >= 5) gridClass = "grid-cols-2 grid-rows-3 md:grid-cols-3 md:grid-rows-2";

    // Fixed quality scale as requested (Always 50 particles)
    const qualityScale = 1.0;

    // Visual Class for Sidebar Background
    const sidebarBgClass = isInteracting
        ? 'bg-transparent border-transparent shadow-none'
        : 'bg-slate-900/90 backdrop-blur-xl border border-slate-700 shadow-2xl';

    const contentOpacityClass = isInteracting ? 'opacity-0 pointer-events-none' : 'opacity-100';

    // Floating button base styles
    const floatingBtnClass = `
      p-3 bg-slate-800/60 backdrop-blur border border-slate-600 rounded-full 
      text-cyan-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-slate-700 hover:scale-110 transition-all duration-300
      flex items-center justify-center w-12 h-12
  `;

    // --- PIP HANDLER ---
    const handleTogglePiP = async (e: React.MouseEvent) => {
        e.stopPropagation();
        try {
            await requestDisplayMode('pip');
        } catch (error) {
            console.error("Failed to enter PiP mode:", error);
        }
    };

    // --- FULLSCREEN HANDLER ---
    const handleToggleFullscreen = async (e: React.MouseEvent) => {
        e.stopPropagation();
        const targetMode = isFullscreen ? 'inline' : 'fullscreen';

        try {
            await requestDisplayMode(targetMode);
        } catch (error) {
            console.error("Failed to toggle fullscreen:", error);
        }
    };

    return (
        <div
            className={`relative w-screen ${isFullscreen ? 'h-screen' : 'h-[600px]'} bg-slate-900 overflow-hidden flex`}
            style={{
                maxHeight: isFullscreen && maxHeight ? maxHeight : undefined,
                height: isFullscreen && maxHeight ? maxHeight : undefined,
            }}
        >

            {/* --- SIDEBAR (Floating Glass Panel) --- */}
            <aside
                ref={sidebarRef}
                className={`
           fixed top-4 left-4 bottom-4 w-96 z-50 transition-all duration-500 ease-in-out transform
           ${isSidebarOpen ? 'translate-x-0 opacity-100' : '-translate-x-[120%] opacity-0 pointer-events-none'}
           flex flex-col gap-4
        `}
            >
                <div className={`${sidebarBgClass} rounded-2xl p-4 overflow-y-auto max-h-full scrollbar-none flex flex-col gap-4 transition-all duration-500 ease-in-out`}>
                    <div className={`flex justify-between items-center pb-2 border-b border-slate-800 transition-opacity duration-500 ${contentOpacityClass}`}>
                        <span className="text-xs font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-600 tracking-widest">
                            MATTER SIMULATOR
                        </span>
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="p-1 hover:bg-slate-800 rounded-full transition-colors text-slate-400 hover:text-white"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className={`transition-opacity duration-500 ${contentOpacityClass}`}>
                        <PeriodicTableSelector
                            selectedElements={selectedElements}
                            onSelect={handleElementSelect}
                            isMultiSelect={isMultiSelect}
                            onToggleMultiSelect={handleToggleMultiSelect}
                        />
                    </div>

                    <ControlPanel
                        temperature={temperature}
                        setTemperature={setTemperature}
                        pressure={pressure}
                        setPressure={setPressure}
                        meltPoint={selectedElements[0].properties.meltingPointK}
                        boilPoint={selectedElements[0].properties.boilingPointK}
                        showParticles={showParticles}
                        setShowParticles={setShowParticles}
                        onInteractionChange={setIsInteracting}
                    />
                </div>
            </aside>

            {/* --- FLOATING CONTROLS (Settings, Pause, Speed, Record) --- */}
            <div
                className={`
            fixed z-40 flex flex-col gap-4 transition-all duration-300
            ${isSidebarOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}
                style={{ top: `${24 + insets.top}px`, left: `${24 + insets.left}px` }}

            >

                {/* Settings Button */}
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setSidebarOpen(true);
                    }}
                    className={floatingBtnClass}
                    title="Settings"
                >
                    <Settings2 size={24} />
                </button>

                {/* Pause/Play Button */}
                <button
                    onClick={handleTogglePause}
                    className={floatingBtnClass}
                    title={isPaused ? "Resume Simulation" : "Pause Simulation"}
                >
                    {isPaused ? <Play size={24} className="ml-1" /> : <Pause size={24} />}
                </button>

                {/* Record Button */}
                <button
                    onClick={handleToggleRecord}
                    className={`
                p-3 backdrop-blur border rounded-full shadow-[0_0_20px_rgba(0,0,0,0.5)] 
                hover:scale-110 transition-all duration-300 flex items-center justify-center w-12 h-12
                ${isRecording
                            ? 'bg-red-900/80 border-red-500 text-white animate-pulse'
                            : 'bg-slate-800/60 border-slate-600 text-red-500 hover:bg-slate-700'
                        }
            `}
                    title={isRecording ? "Stop Recording" : "Start Recording"}
                >
                    {isRecording ? <Square size={20} fill="currentColor" /> : <Circle size={20} fill="currentColor" />}
                </button>

                {/* Speed Button */}
                <button
                    onClick={handleToggleSpeed}
                    className={`${floatingBtnClass} text-white font-bold`}
                    title="Toggle Simulation Speed"
                >
                    <span className="text-xs">{timeScale}x</span>
                </button>

            </div>
            {/* --- DISPLAY MODES (Always visible, top-right, highest z-index) --- */}
            <div
                className="fixed z-[100] grid grid-cols-2 gap-2 pointer-events-auto"
                style={{ top: `${16 + insets.top}px`, right: `${16 + insets.right}px` }}
            >
                {/* Row 1, Col 1: PiP Toggle */}
                <button
                    onClick={handleTogglePiP}
                    className="p-3 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-full text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-slate-700 hover:scale-110 transition-all duration-300 flex items-center justify-center w-12 h-12"
                    title="Picture-in-Picture"
                >
                    <IconPiP size={20} />
                </button>

                {/* Row 1, Col 2: Fullscreen Toggle */}
                <button
                    onClick={handleToggleFullscreen}
                    className="p-3 bg-slate-800/80 backdrop-blur border border-slate-600 rounded-full text-white shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-slate-700 hover:scale-110 transition-all duration-300 flex items-center justify-center w-12 h-12"
                    title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
                >
                    {isFullscreen ? <IconMinimize size={20} /> : <IconMaximize size={20} />}
                </button>

                {/* Row 2, Col 1: Empty (Spacer) */}
                <div />

                {/* Row 2, Col 2: Info / AI Context Button */}
                <button
                    onClick={handleInfoClick}
                    className="p-3 bg-slate-800/80 backdrop-blur border border-cyan-500/50 rounded-full text-cyan-400 shadow-[0_0_20px_rgba(0,0,0,0.5)] hover:bg-slate-700 hover:scale-110 transition-all duration-300 flex items-center justify-center w-12 h-12"
                    title="Ask ChatGPT about this"
                >
                    <IconBookOpen size={24} />
                </button>
            </div>

            <main className={`w-full h-full grid gap-0 ${gridClass} bg-slate-950`}>
                {selectedElements.map((el) => (
                    <div
                        key={el.atomicNumber}
                        className="relative w-full h-full border-r border-b border-white/5 last:border-0"
                    >
                        <SimulationUnit
                            element={el}
                            globalTemp={temperature}
                            globalPressure={pressure}
                            layoutScale={{ quality: qualityScale, visual: 1.0 }}
                            showParticles={showParticles}
                            totalElements={count}
                            timeScale={timeScale}
                            isPaused={isPaused}
                            onInspect={handleInspect(el)}
                            onRegister={registerSimulationUnit}
                        />
                    </div>
                ))}
            </main>

            {/* --- CONTEXT MENU OVERLAY (Properties) --- */}
            {
                contextMenu && (
                    <ElementPropertiesMenu
                        data={contextMenu}
                        onClose={() => setContextMenu(null)}
                        onSetTemperature={(t) => {
                            setTemperature(t);
                            setContextMenu(null);
                        }}
                        onSetPressure={setPressure}
                    />
                )
            }

            {/* --- RECORDING STATS OVERLAY --- */}
            {
                recordingResults && (
                    <RecordingStatsModal
                        recordings={recordingResults}
                        onClose={() => setRecordingResults(null)}
                    />
                )
            }

        </div >
    );
}

export default App;