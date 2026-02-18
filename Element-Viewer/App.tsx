import React, { useState, useEffect, useRef } from 'react';
import PeriodicTableSelector from './components/Simulator/PeriodicTableSelector';
import ControlPanel from './components/Simulator/ControlPanel';
import SimulationUnit from './components/Simulator/SimulationUnit';
import ElementPropertiesMenu from './components/Simulator/ElementPropertiesMenu';
import RecordingStatsModal from './components/Simulator/RecordingStatsModal';
import { ELEMENTS } from './data/elements';
import { ChemicalElement, MatterState, PhysicsState } from './types';
import { predictMatterState } from './hooks/physics/phaseCalculations';
import { Play, Pause, Settings2, X, Circle, Square, FlaskConical } from 'lucide-react';
import { useElementViewerChat } from './hooks/useElementViewerChat';
import { useAppChatControls } from './hooks/useAppChatControls';
import {
    ContextMenuData,
    IAReactionSubstance,
    IAStructuredContent,
    clampPositive,
    formatCompact,
    getSupportedEquilibria,
    IconIdeaBulb,
    IconMaximize,
    IconMinimize,
    IconPiP,
    normalizeElementLookup,
    phaseToPresentPhases,
    phaseToReadable,
    readOpenAiStructuredContent,
    roundTo,
    safeHexColor,
} from './app/appDefinitions';

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
    const [aiMessage, setAiMessage] = useState<string | null>(null);

    // Refs
    const sidebarRef = useRef<HTMLElement>(null);
    const simulationRegistry = useRef<Map<number, () => PhysicsState>>(new Map());
    const aiMessageTimeoutRef = useRef<number | null>(null);
    const lastProcessedAiTimestampRef = useRef(0);
    const reactionAtomicNumberRef = useRef(900000);
    const syncStateToChatGPTRef = useRef<() => Promise<void>>(async () => { });

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
    // Called at app boot, when Info is pressed and when the user sends a new prompt.
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
    syncStateToChatGPTRef.current = syncStateToChatGPT;


    const {
        handleTogglePiP,
        handleToggleFullscreen,
        handleInfoButtonClick,
        handleReactionButtonClick,
    } = useAppChatControls({
        requestDisplayMode,
        isFullscreen,
        syncStateToChatGPT,
        handleInfoClick,
        selectedElements,
        temperature,
        pressure,
    });

    const buildReactionElement = (reaction: IAReactionSubstance): ChemicalElement => {
        const atomicNumber = reactionAtomicNumberRef.current++;
        const color = safeHexColor(reaction.suggestedColorHex);

        return {
            atomicNumber,
            symbol: reaction.formula,
            name: reaction.substanceName,
            summary: 'Substância gerada por reação estimada pelo modelo.',
            mass: clampPositive(reaction.mass, 18),
            category: 'reaction_product',
            classification: {
                group: 'N/A',
                groupBlock: 'N/A',
                period: 0,
                electronShells: 0,
            },
            visualDNA: {
                solid: { color, opacidade: 1 },
                liquid: { color, opacidade: 0.8 },
                gas: { color, opacidade: 0.4 },
            },
            properties: {
                meltingPointK: clampPositive(reaction.meltingPointK, 273.15),
                boilingPointK: clampPositive(reaction.boilingPointK, 373.15),
                specificHeatSolid: clampPositive(reaction.specificHeatSolid, 1000),
                specificHeatLiquid: clampPositive(reaction.specificHeatLiquid, 1000),
                specificHeatGas: clampPositive(reaction.specificHeatGas, 1000),
                latentHeatFusion: clampPositive(reaction.latentHeatFusion, 100000),
                latentHeatVaporization: clampPositive(reaction.latentHeatVaporization, 1000000),
                enthalpyVapJmol: clampPositive(reaction.enthalpyVapJmol, 40000),
                enthalpyFusionJmol: clampPositive(reaction.enthalpyFusionJmol, 6000),
                triplePoint: {
                    tempK: clampPositive(reaction.triplePoint.tempK, 200),
                    pressurePa: clampPositive(reaction.triplePoint.pressurePa, 100),
                },
                criticalPoint: {
                    tempK: clampPositive(reaction.criticalPoint.tempK, 500),
                    pressurePa: clampPositive(reaction.criticalPoint.pressurePa, 100000),
                },
                meltingPointDisplay: formatCompact(clampPositive(reaction.meltingPointK, 273.15), 'K'),
                boilingPointDisplay: formatCompact(clampPositive(reaction.boilingPointK, 373.15), 'K'),
                specificHeatSolidDisplay: `${roundTo(clampPositive(reaction.specificHeatSolid, 1000), 2)}`,
                specificHeatLiquidDisplay: `${roundTo(clampPositive(reaction.specificHeatLiquid, 1000), 2)}`,
                specificHeatGasDisplay: `${roundTo(clampPositive(reaction.specificHeatGas, 1000), 2)}`,
                latentHeatFusionDisplay: `${roundTo(clampPositive(reaction.latentHeatFusion, 100000) / 1000, 2)}`,
                latentHeatVaporizationDisplay: `${roundTo(clampPositive(reaction.latentHeatVaporization, 1000000) / 1000, 2)}`,
                triplePointTempDisplay: `${roundTo(clampPositive(reaction.triplePoint.tempK, 200), 2)}`,
                triplePointPressDisplay: `${roundTo(clampPositive(reaction.triplePoint.pressurePa, 100) / 1000, 4)}`,
                criticalPointTempDisplay: `${roundTo(clampPositive(reaction.criticalPoint.tempK, 500), 2)}`,
                criticalPointPressDisplay: `${roundTo(clampPositive(reaction.criticalPoint.pressurePa, 100000) / 1000, 2)}`,
            },
        };
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

    const scheduleSyncStateToChatGPT = () => {
        requestAnimationFrame(() => {
            requestAnimationFrame(() => {
                void syncStateToChatGPTRef.current();
            });
        });
    };

    const handleSliderRelease = () => {
        scheduleSyncStateToChatGPT();
    };

    // --- RADAR REATIVO DO CHATGPT (ATUALIZACAO EM TEMPO REAL) ---
    useEffect(() => {
        if (typeof window === 'undefined') return;

        const clearAiMessageTimeout = () => {
            if (aiMessageTimeoutRef.current !== null) {
                window.clearTimeout(aiMessageTimeoutRef.current);
                aiMessageTimeoutRef.current = null;
            }
        };

        const showAiMessage = (message: string) => {
            setAiMessage(message);
            clearAiMessageTimeout();
            aiMessageTimeoutRef.current = window.setTimeout(() => {
                setAiMessage(null);
                aiMessageTimeoutRef.current = null;
            }, 8000);
        };

        const verificarAtualizacoesIA = () => {
            const rawContent = readOpenAiStructuredContent();
            if (!rawContent || typeof rawContent !== 'object') return;

            const content = rawContent as IAStructuredContent;
            const { configuracao_ia, timestamp_atualizacao, substancia_reacao } = content;

            if (typeof timestamp_atualizacao !== 'number' || timestamp_atualizacao <= lastProcessedAiTimestampRef.current) {
                return;
            }

            lastProcessedAiTimestampRef.current = timestamp_atualizacao;

            if (configuracao_ia) {
                if (
                    typeof configuracao_ia.interpretacao_do_modelo === 'string' &&
                    configuracao_ia.interpretacao_do_modelo.trim().length > 0
                ) {
                    showAiMessage(configuracao_ia.interpretacao_do_modelo);
                }

                if (typeof configuracao_ia.temperatura_K === 'number') {
                    setTemperature(Math.min(configuracao_ia.temperatura_K, 6000));
                }

                if (typeof configuracao_ia.pressao_Pa === 'number') {
                    setPressure(Math.min(configuracao_ia.pressao_Pa, 100000000000));
                }

                if (Array.isArray(configuracao_ia.elementos) && configuracao_ia.elementos.length > 0) {
                    const novosElementos = configuracao_ia.elementos
                        .map((simboloIA) => {
                            const lookup = normalizeElementLookup(simboloIA);
                            return ELEMENTS.find((el) =>
                                el.symbol.toLowerCase() === lookup ||
                                el.name.toLowerCase() === lookup
                            );
                        })
                        .filter((el): el is ChemicalElement => Boolean(el));

                    if (novosElementos.length > 0) {
                        setSelectedElements(novosElementos.slice(0, 6));
                    }
                }
            }

            if (substancia_reacao) {
                const novaSubstancia = buildReactionElement(substancia_reacao);
                setSelectedElements([novaSubstancia]);
                setIsMultiSelect(false);
            }
        };

        const intervalId = window.setInterval(verificarAtualizacoesIA, 500);
        verificarAtualizacoesIA();

        return () => {
            window.clearInterval(intervalId);
            clearAiMessageTimeout();
        };
    }, []);

    // --- SELECTION LOGIC ---
    const handleElementSelect = (el: ChemicalElement) => {
        if (isRecording) return; // Prevent changing elements while recording
        let didChangeSelection = false;

        if (!isMultiSelect) {
            // Single Mode: Replace
            setSelectedElements([el]);
            didChangeSelection = true;
        } else {
            // Multi Mode: Toggle / FIFO
            const exists = selectedElements.find(e => e.atomicNumber === el.atomicNumber);

            if (exists) {
                // Remove if exists
                const filtered = selectedElements.filter(e => e.atomicNumber !== el.atomicNumber);
                // If removing the last one, don't allow empty array (fallback to default or keep one)
                if (filtered.length === 0) return;
                setSelectedElements(filtered);
                didChangeSelection = true;
            } else {
                // Add new
                let newSelection = [...selectedElements, el];
                if (newSelection.length > 6) {
                    // FIFO: Remove first, add new to end
                    newSelection = newSelection.slice(1);
                }
                setSelectedElements(newSelection);
                didChangeSelection = true;
            }
        }

        if (didChangeSelection) {
            scheduleSyncStateToChatGPT();
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
            scheduleSyncStateToChatGPT();
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
    // --- FULLSCREEN HANDLER ---
    return (
        <div
            className={`relative w-screen ${isFullscreen ? 'h-screen' : 'h-[600px]'} bg-slate-900 overflow-hidden flex`}
            style={{
                maxHeight: isFullscreen && maxHeight ? maxHeight : undefined,
                height: isFullscreen && maxHeight ? maxHeight : undefined,
            }}
        >
            {/* Banner inteligente flutuante */}
            {aiMessage && (
                <div className="absolute top-4 left-1/2 z-50 flex max-w-[90%] -translate-x-1/2 transform items-center gap-3 rounded-2xl border border-gray-200 bg-white/90 px-5 py-3 text-center text-sm text-gray-800 shadow-xl backdrop-blur-sm animate-in fade-in duration-300 md:max-w-md">
                    <span className="text-xl">✨</span>
                    <p className="font-medium leading-tight">{aiMessage}</p>
                </div>
            )}


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
                        onSliderRelease={handleSliderRelease}
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

                {/* Row 3, Col 1: Empty (Spacer) */}
                <div />

                {/* Row 3, Col 2: Reagir */}
                <button
                    onClick={handleReactionButtonClick}
                    className="group relative p-3 bg-slate-800/80 backdrop-blur border border-emerald-400/70 rounded-full text-emerald-300 shadow-[0_0_28px_rgba(16,185,129,0.35)] hover:bg-slate-700 hover:scale-110 transition-all duration-300 flex items-center justify-center w-12 h-12"
                    title="Reagir"
                >
                    <FlaskConical size={20} className="drop-shadow-[0_0_8px_rgba(16,185,129,0.7)]" />
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
