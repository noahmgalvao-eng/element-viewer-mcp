import React, { useState, useEffect, useRef } from 'react';
import PeriodicTableSelector from './components/Simulator/PeriodicTableSelector';
import ControlPanel from './components/Simulator/ControlPanel';
import SimulationUnit from './components/Simulator/SimulationUnit';
import ElementPropertiesMenu from './components/Simulator/ElementPropertiesMenu';
import RecordingStatsModal from './components/Simulator/RecordingStatsModal';
import { ELEMENTS } from './data/elements';
import { ChemicalElement, MatterState, PhysicsState } from './types';
import { predictMatterState } from './hooks/physics/phaseCalculations';
// Import new hook
import { Play, Pause, Settings2, X, Circle, Square } from "lucide-react";


// --- Inline Icons to separate from external dependencies ---

const IconIdeaBulb = ({ size = 24, className = "" }: { size?: number, className?: string }) => (
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
        <path d="M9 18h6" />
        <path d="M10 22h4" />
        <path d="M12 2a7 7 0 0 0-4 12c.53.53 1 1.39 1 2.2V17h6v-.8c0-.81.47-1.67 1-2.2A7 7 0 0 0 12 2z" />
        <path d="M12 6v1" />
        <path d="M18 8l-.7.7" />
        <path d="M6.7 8.7 6 8" />
        <path d="M20 13h-1" />
        <path d="M5 13H4" />
    </svg>
);

const roundTo = (value: number, digits = 2): number =>
    Number(value.toFixed(digits));

const phaseToReadable = (state: MatterState): string => {
    switch (state) {
        case MatterState.SOLID:
            return 'solido';
        case MatterState.MELTING:
            return 'fusao (solido -> liquido)';
        case MatterState.EQUILIBRIUM_MELT:
            return 'equilibrio solido-liquido';
        case MatterState.LIQUID:
            return 'liquido';
        case MatterState.BOILING:
            return 'ebulicao/vaporizacao (liquido -> gas)';
        case MatterState.EQUILIBRIUM_BOIL:
            return 'equilibrio liquido-gas';
        case MatterState.EQUILIBRIUM_TRIPLE:
            return 'ponto triplo (solido + liquido + gas)';
        case MatterState.SUBLIMATION:
            return 'sublimacao (solido -> gas)';
        case MatterState.EQUILIBRIUM_SUB:
            return 'equilibrio solido-gas';
        case MatterState.GAS:
            return 'gas';
        case MatterState.TRANSITION_SCF:
            return 'transicao de fluido supercritico';
        case MatterState.SUPERCRITICAL:
            return 'fluido supercritico';
        default:
            return 'estado desconhecido';
    }
};

const phaseToPresentPhases = (state: MatterState): string[] => {
    switch (state) {
        case MatterState.EQUILIBRIUM_TRIPLE:
            return ['solido', 'liquido', 'gas'];
        case MatterState.MELTING:
        case MatterState.EQUILIBRIUM_MELT:
            return ['solido', 'liquido'];
        case MatterState.BOILING:
        case MatterState.EQUILIBRIUM_BOIL:
            return ['liquido', 'gas'];
        case MatterState.SUBLIMATION:
        case MatterState.EQUILIBRIUM_SUB:
            return ['solido', 'gas'];
        case MatterState.TRANSITION_SCF:
        case MatterState.SUPERCRITICAL:
            return ['fluido supercritico'];
        case MatterState.LIQUID:
            return ['liquido'];
        case MatterState.GAS:
            return ['gas'];
        case MatterState.SOLID:
        default:
            return ['solido'];
    }
};

const getSupportedEquilibria = (element: ChemicalElement): string[] => {
    const hasTriplePoint = !!element.properties.triplePoint;
    const canSublimationEq = hasTriplePoint && !!element.properties.enthalpyFusionJmol;

    const equilibria = [
        'EQUILIBRIUM_MELT (solido + liquido)',
        'EQUILIBRIUM_BOIL (liquido + gas)'
    ];

    if (canSublimationEq) {
        equilibria.push('EQUILIBRIUM_SUB (solido + gas)');
    }

    if (hasTriplePoint) {
        equilibria.push('EQUILIBRIUM_TRIPLE (solido + liquido + gas)');
    }

    return equilibria;
};

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
        selectedElements
    });

    // Safe area insets with robust fallback
    const insets = {
        top: safeArea?.insets?.top ?? 0,
        bottom: safeArea?.insets?.bottom ?? 0,
        left: safeArea?.insets?.left ?? 0,
        right: safeArea?.insets?.right ?? 0
    };

    // Recording State
    const [isRecording, setIsRecording] = useState(false);
    const [recordingStartData, setRecordingStartData] = useState<Map<number, PhysicsState>>(new Map());
    const [recordingResults, setRecordingResults] = useState<{ element: ChemicalElement, start: PhysicsState, end: PhysicsState }[] | null>(null);
    // --- CHATGPT STATE SYNC ---
    // Called only at app boot and when Info is pressed.
    const syncStateToChatGPT = async () => {
        if (typeof window === 'undefined' || !window.openai?.setWidgetState) return;

        const elementsData = selectedElements.map((el) => {
            const getter = simulationRegistry.current.get(el.atomicNumber);
            const currentState = getter ? getter() : null;
            const shouldFallbackToPredicted =
                !currentState ||
                (currentState.simTime === 0 && currentState.temperature === 0 && temperature > 0);

            const predicted = predictMatterState(el, temperature, pressure);
            const effectiveState = shouldFallbackToPredicted ? predicted.state : currentState.state;
            const effectiveTempK = shouldFallbackToPredicted ? temperature : currentState.temperature;
            const meltingPointCurrent = shouldFallbackToPredicted ? predicted.T_melt : currentState.meltingPointCurrent;
            const boilingPointCurrent = shouldFallbackToPredicted ? predicted.T_boil : currentState.boilingPointCurrent;
            const sublimationPointCurrent = shouldFallbackToPredicted ? predicted.T_sub : currentState.sublimationPointCurrent;

            const meltProgress = shouldFallbackToPredicted
                ? (effectiveState === MatterState.EQUILIBRIUM_MELT ? 0.5 : 0)
                : currentState.meltProgress;
            const boilProgress = shouldFallbackToPredicted
                ? (effectiveState === MatterState.EQUILIBRIUM_BOIL ? 0.5 : 0)
                : currentState.boilProgress;
            const sublimationProgress = shouldFallbackToPredicted
                ? (effectiveState === MatterState.EQUILIBRIUM_SUB ? 0.5 : 0)
                : currentState.sublimationProgress;
            const scfTransitionProgress = shouldFallbackToPredicted ? 0 : currentState.scfTransitionProgress;

            const deltaToTargetK = temperature - effectiveTempK;
            const absDelta = Math.abs(deltaToTargetK);
            const powerInput = shouldFallbackToPredicted ? 0 : currentState.powerInput;

            let tendenciaTermica = 'estavel';
            if (absDelta > 0.2) {
                tendenciaTermica = deltaToTargetK > 0 ? 'aquecendo em direcao ao alvo' : 'resfriando em direcao ao alvo';
            } else if (Math.abs(powerInput) > 0.05) {
                tendenciaTermica = powerInput > 0 ? 'aquecendo levemente' : 'resfriando levemente';
            }

            const hasTriplePoint = !!el.properties.triplePoint;
            const hasCriticalPoint = !!el.properties.criticalPoint;
            const isAtTriplePointNow =
                effectiveState === MatterState.EQUILIBRIUM_TRIPLE ||
                (!!el.properties.triplePoint &&
                    Math.abs(effectiveTempK - el.properties.triplePoint.tempK) < 1 &&
                    Math.max(pressure, el.properties.triplePoint.pressurePa) /
                    Math.min(Math.max(1e-9, pressure), el.properties.triplePoint.pressurePa) < 1.1);
            const isAtSupercriticalNow =
                effectiveState === MatterState.SUPERCRITICAL || effectiveState === MatterState.TRANSITION_SCF;

            return {
                numero_atomico: el.atomicNumber,
                nome: el.name,
                simbolo: el.symbol,
                estado_da_materia_codigo: effectiveState,
                estado_da_materia: phaseToReadable(effectiveState),
                fases_presentes: phaseToPresentPhases(effectiveState),
                tendencia_termica: tendenciaTermica,
                temperatura_efetiva_atual_K: roundTo(effectiveTempK, 2),
                delta_para_temperatura_alvo_K: roundTo(deltaToTargetK, 2),
                progresso: {
                    fusao: roundTo(Math.min(1, Math.max(0, meltProgress)), 3),
                    ebulicao: roundTo(Math.min(1, Math.max(0, boilProgress)), 3),
                    sublimacao: roundTo(Math.min(1, Math.max(0, sublimationProgress)), 3),
                    transicao_supercritica: roundTo(Math.min(1, Math.max(0, scfTransitionProgress)), 3)
                },
                limites_fase_K: {
                    fusao: roundTo(meltingPointCurrent, 2),
                    ebulicao: roundTo(boilingPointCurrent, 2),
                    sublimacao: sublimationPointCurrent > 0 ? roundTo(sublimationPointCurrent, 2) : null
                },
                pontos_termodinamicos: {
                    tem_ponto_triplo: hasTriplePoint,
                    tem_ponto_critico: hasCriticalPoint,
                    esta_no_ponto_triplo_agora: isAtTriplePointNow,
                    esta_em_regime_supercritico_agora: isAtSupercriticalNow
                },
                estados_de_equilibrio_suportados_no_modelo: getSupportedEquilibria(el)
            };
        });

        await window.openai.setWidgetState({
            ambiente: {
                temperatura_alvo_K: roundTo(temperature, 2),
                pressao_Pa: roundTo(pressure, 6),
                total_elementos_visiveis: selectedElements.length
            },
            elementos_selecionados_em_ordem: selectedElements.map((el) => el.symbol),
            elementos_visiveis: elementsData
        });
    };

    const handleInfoButtonClick = async (e: React.MouseEvent) => {
        e.stopPropagation();
        await syncStateToChatGPT();
        await handleInfoClick();
    };

    useEffect(() => {
        let cancelled = false;
        let raf1 = 0;
        let raf2 = 0;

        raf1 = requestAnimationFrame(() => {
            raf2 = requestAnimationFrame(async () => {
                if (cancelled) return;
                await syncStateToChatGPT();
            });
        });

        return () => {
            cancelled = true;
            cancelAnimationFrame(raf1);
            cancelAnimationFrame(raf2);
        };
    }, []);

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
    // 2. FUNÃ‡ÃƒO DE TOGGLE
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
                    onClick={handleInfoButtonClick}
                    className="group relative p-3 bg-slate-800/80 backdrop-blur border border-amber-400/70 rounded-full text-amber-300 shadow-[0_0_28px_rgba(251,191,36,0.35)] hover:bg-slate-700 hover:scale-110 transition-all duration-300 flex items-center justify-center w-12 h-12"
                    title="Ask ChatGPT about this"
                >
                    <span className="pointer-events-none absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-100 shadow-[0_0_12px_rgba(254,240,138,0.95)] animate-pulse" />
                    <IconIdeaBulb size={24} className="drop-shadow-[0_0_8px_rgba(251,191,36,0.7)]" />
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

