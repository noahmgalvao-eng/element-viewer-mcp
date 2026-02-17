
import React, { useEffect, useRef, useState } from 'react';
import { ChemicalElement, PhysicsState } from '../../types';
import { X, Thermometer, ArrowRight, Activity, ChevronDown, ChevronUp, Beaker, Zap, Triangle, CloudFog, BookOpen, ExternalLink, Info } from 'lucide-react';
import { SOURCE_DATA } from '../../data/periodic_table_source';

interface Props {
    data: {
        x: number;
        y: number;
        element: ChemicalElement;
        physicsState: PhysicsState;
    };
    onClose: () => void;
    onSetTemperature: (temp: number) => void;
    onSetPressure: (pressure: number) => void;
}

const ElementPropertiesMenu: React.FC<Props> = ({ data, onClose, onSetTemperature, onSetPressure }) => {
    const menuRef = useRef<HTMLDivElement>(null);
    const { element, physicsState, x, y } = data;
    const [isExpanded, setIsExpanded] = useState(false);
    const [showReferences, setShowReferences] = useState(false);
    const [showDescription, setShowDescription] = useState(false);

    // Close on click outside or Escape
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                onClose();
            }
        };
        const handleEsc = (event: KeyboardEvent) => {
            if (event.key === 'Escape') onClose();
        };

        if (!showReferences && !showDescription) { // Only bind if modals are NOT open
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleEsc);
        }
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleEsc);
        };
    }, [onClose, showReferences, showDescription]);

    // --- Viewport Collision Detection ---
    const MENU_HEIGHT = isExpanded ? 550 : 350; // Estimated height based on state
    const MENU_WIDTH = 340;
    const SAFE_TOP_MARGIN = 20;

    const left = Math.min(x, window.innerWidth - MENU_WIDTH - 20);
    const isOverflowBottom = (y + MENU_HEIGHT) > window.innerHeight;

    let style: React.CSSProperties = { left: left };

    if (isOverflowBottom) {
        const projectedTop = y - MENU_HEIGHT;
        if (projectedTop < SAFE_TOP_MARGIN) {
            style.top = SAFE_TOP_MARGIN;
            style.bottom = 'auto';
        } else {
            style.bottom = window.innerHeight - y;
            style.top = 'auto';
        }
    } else {
        style.top = Math.max(SAFE_TOP_MARGIN, y);
        style.bottom = 'auto';
    }

    const criticalPoint = element.properties.criticalPoint;
    const hasCriticalPoint = !!criticalPoint;

    // Triple Point Logic
    const triplePoint = element.properties.triplePoint;
    const hasTriplePoint = !!triplePoint;

    // Determine if clickable: must have valid pressure (>0) and valid temp (>0)
    // If Pressure is 0, it came from "N/A"
    const isTriplePointValid = hasTriplePoint && triplePoint && triplePoint.pressurePa > 0 && triplePoint.tempK > 0;
    const isCriticalPointValid = hasCriticalPoint && criticalPoint && criticalPoint.pressurePa > 0 && criticalPoint.tempK > 0;

    // Check which regime we are in
    const isSublimationRegime = physicsState.sublimationPointCurrent > 0;
    const stdPressure = 101325;

    // Helper for Pressure Formatting
    const fmtP = (p: number) => {
        if (p <= 0) return 'N/A'; // Handle 0 as N/A display
        const kPa = p / 1000;
        if (kPa < 0.01) return kPa.toExponential(2) + ' kPa';
        if (kPa < 1) return kPa.toFixed(4) + ' kPa';
        return kPa.toFixed(2) + ' kPa';
    };

    // Triple Point Display Helpers
    const tpTempStr = element.properties.triplePointTempDisplay && element.properties.triplePointTempDisplay.includes('*')
        ? element.properties.triplePointTempDisplay
        : (triplePoint ? `${triplePoint.tempK} K` : 'N/A');

    const tpPressStr = element.properties.triplePointPressDisplay && element.properties.triplePointPressDisplay !== 'N/A'
        ? `${element.properties.triplePointPressDisplay} kPa`
        : (triplePoint ? fmtP(triplePoint.pressurePa) : 'N/A');

    const cpTempStr = element.properties.criticalPointTempDisplay && element.properties.criticalPointTempDisplay !== 'N/A'
        ? `${element.properties.criticalPointTempDisplay} K`
        : (criticalPoint ? `${criticalPoint.tempK} K` : 'N/A');

    const cpPressStr = element.properties.criticalPointPressDisplay && element.properties.criticalPointPressDisplay !== 'N/A'
        ? `${element.properties.criticalPointPressDisplay} kPa`
        : (criticalPoint ? fmtP(criticalPoint.pressurePa) : 'N/A');

    // Find source URL for current element
    const elementSourceData = SOURCE_DATA.elements.find(e => e.symbol === element.symbol);
    const wikiUrl = elementSourceData?.source || "https://en.wikipedia.org/wiki/Periodic_table";

    return (
        <>
            <div
                ref={menuRef}
                style={style}
                className="fixed z-[100] w-[340px] bg-slate-900/95 backdrop-blur-md border border-slate-600 rounded-xl shadow-2xl flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            >
                {/* 1. Header: Identity */}
                <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full flex items-center justify-center font-bold text-white shadow-inner" style={{ backgroundColor: element.visualDNA.solid.color }}>
                            <span className="text-lg drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]">{element.symbol}</span>
                        </div>
                        <div className="flex flex-col items-start">
                            <h3 className="font-bold text-slate-100 text-lg leading-tight">{element.name}</h3>
                            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
                                {elementSourceData?.category?.toUpperCase() || element.classification.groupName.toUpperCase()}
                            </p>
                            <button
                                onClick={() => setShowDescription(true)}
                                className="mt-1 flex items-center gap-1 text-[10px] text-cyan-400 hover:text-cyan-300 transition-colors"
                            >
                                <Info size={10} />
                                Ver descrição
                            </button>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors p-1 rounded-full hover:bg-slate-700/50">
                        <X size={18} />
                    </button>
                </div>

                {/* Content Scroll Area */}
                <div className="p-4 overflow-y-auto max-h-[70vh] scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-transparent space-y-5">

                    {/* 2. Interactive Phase Controls */}
                    <div className="space-y-3">
                        <h4 className="text-[10px] uppercase tracking-widest text-cyan-400 font-bold border-b border-cyan-900/50 pb-1 flex items-center gap-2">
                            <Activity size={12} /> Phase Boundaries
                        </h4>

                        {/* Standard Melting Point */}
                        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 hover:border-slate-600 transition-colors">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Melting Point (Std)</span>
                                <span className="flex items-center">
                                    {element.properties.meltingPointDisplay}
                                    {element.properties.meltingPointSource && <sup className="text-[8px] ml-0.5 text-slate-500">({element.properties.meltingPointSource})</sup>}
                                </span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-xs font-bold text-slate-200">
                                    {isSublimationRegime ? 'Go to Std (1 atm):' : 'Current (at P):'}
                                </span>
                                <button
                                    onClick={() => {
                                        if (isSublimationRegime) {
                                            onSetPressure(stdPressure);
                                            onSetTemperature(element.properties.meltingPointK);
                                        } else {
                                            onSetTemperature(physicsState.meltingPointCurrent);
                                        }
                                    }}
                                    className="flex items-center gap-2 px-2 py-1 rounded bg-cyan-900/30 border border-cyan-700/50 hover:bg-cyan-600 hover:text-white text-cyan-300 transition-all text-sm font-mono cursor-pointer"
                                >
                                    {isSublimationRegime
                                        ? (element.properties.meltingPointDisplay || 'N/A')
                                        : `${physicsState.meltingPointCurrent.toFixed(2)} K`
                                    }
                                    <ArrowRight size={12} />
                                </button>
                            </div>
                        </div>

                        {/* Standard Boiling Point */}
                        <div className="bg-slate-800/50 rounded-lg p-2 border border-slate-700/50 hover:border-slate-600 transition-colors">
                            <div className="flex justify-between text-xs text-slate-400 mb-1">
                                <span>Boiling Point (Std)</span>
                                <span className="flex items-center">
                                    {element.properties.boilingPointDisplay}
                                    {element.properties.boilingPointSource && <sup className="text-[8px] ml-0.5 text-slate-500">({element.properties.boilingPointSource})</sup>}
                                </span>
                            </div>
                            <div className="flex justify-between items-center group">
                                <span className="text-xs font-bold text-slate-200">
                                    {isSublimationRegime ? 'Go to Std (1 atm):' : 'Current (at P):'}
                                </span>
                                <button
                                    disabled={!isSublimationRegime && physicsState.boilingPointCurrent >= 49000}
                                    onClick={() => {
                                        if (isSublimationRegime) {
                                            onSetPressure(stdPressure);
                                            onSetTemperature(element.properties.boilingPointK);
                                        } else if (physicsState.boilingPointCurrent < 49000) {
                                            onSetTemperature(physicsState.boilingPointCurrent);
                                        }
                                    }}
                                    className={`flex items-center gap-2 px-2 py-1 rounded border transition-all text-sm font-mono ${(!isSublimationRegime && physicsState.boilingPointCurrent >= 49000)
                                            ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed"
                                            : "bg-red-900/30 border-red-700/50 hover:bg-red-600 hover:text-white text-red-300 cursor-pointer"
                                        }`}
                                >
                                    {isSublimationRegime
                                        ? (element.properties.boilingPointDisplay || 'N/A')
                                        : (physicsState.boilingPointCurrent >= 49000 ? "Undefined" : `${physicsState.boilingPointCurrent.toFixed(2)} K`)
                                    }
                                    {(isSublimationRegime || physicsState.boilingPointCurrent < 49000) && <ArrowRight size={12} />}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* 3. Details Toggle */}
                    <div>
                        <button
                            onClick={() => setIsExpanded(!isExpanded)}
                            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-slate-500 hover:text-slate-300 uppercase tracking-widest border-t border-b border-slate-800 transition-colors"
                        >
                            {isExpanded ? 'Hide Details' : 'Show Advanced Properties'}
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        </button>
                    </div>

                    {/* 4. Expanded Data Grids */}
                    {isExpanded && (
                        <div className="space-y-5 animate-in slide-in-from-top-2 duration-300">

                            {/* --- ADVANCED STATE JUMP CONTROLS --- */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-purple-400 uppercase flex items-center gap-2">
                                    <Zap size={12} /> Special States
                                </h5>

                                <div className="grid grid-cols-1 gap-2">
                                    {/* Triple Point (Only if exists) */}
                                    {hasTriplePoint && triplePoint && (
                                        <button
                                            onClick={() => {
                                                if (isTriplePointValid) {
                                                    onSetTemperature(triplePoint.tempK);
                                                    onSetPressure(triplePoint.pressurePa);
                                                }
                                            }}
                                            disabled={!isTriplePointValid}
                                            className={`flex items-center justify-between px-3 py-2 rounded border transition-all w-full
                                    ${isTriplePointValid
                                                    ? "bg-emerald-900/30 border-emerald-700/50 hover:bg-emerald-600 hover:text-white text-emerald-300 cursor-pointer group"
                                                    : "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                                                }
                                `}
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-[10px] font-bold uppercase flex items-center">
                                                    Go to Triple Point
                                                    {element.properties.triplePointSource && <sup className="text-[8px] ml-0.5 opacity-80">({element.properties.triplePointSource})</sup>}
                                                </span>
                                                <span className="text-[10px] font-mono opacity-80 group-hover:text-white">
                                                    {tpTempStr} / {tpPressStr}
                                                </span>
                                            </div>
                                            {isTriplePointValid && <Triangle size={14} fill="currentColor" className="rotate-180" />}
                                        </button>
                                    )}

                                    <button
                                        onClick={() => {
                                            if (isCriticalPointValid && criticalPoint) {
                                                onSetTemperature(criticalPoint.tempK + 50);
                                                onSetPressure(criticalPoint.pressurePa + 1000);
                                            }
                                        }}
                                        disabled={!isCriticalPointValid}
                                        className={`flex items-center justify-between px-3 py-2 rounded border transition-all w-full
                                    ${isCriticalPointValid
                                                ? "bg-purple-900/30 border-purple-700/50 hover:bg-purple-600 hover:text-white text-purple-300 cursor-pointer group"
                                                : "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                                            }
                                `}
                                    >
                                        <div className="flex flex-col items-start">
                                            <span className="text-[10px] font-bold uppercase flex items-center">
                                                Go Critical
                                                {element.properties.criticalPointSource && <sup className="text-[8px] ml-0.5 opacity-80">({element.properties.criticalPointSource})</sup>}
                                            </span>
                                            <span className="text-[10px] font-mono opacity-80 group-hover:text-white">
                                                {cpTempStr} / {cpPressStr}
                                            </span>
                                        </div>
                                        {isCriticalPointValid && <Zap size={14} fill="currentColor" />}
                                    </button>

                                    {/* Sublimation Point (Jump or Current) */}
                                    {hasTriplePoint && triplePoint && isTriplePointValid && element.properties.enthalpyFusionJmol && (
                                        <button
                                            onClick={() => {
                                                if (isSublimationRegime) {
                                                    // CURRENT: Just set Temperature
                                                    onSetTemperature(physicsState.sublimationPointCurrent);
                                                } else {
                                                    // JUMP: Go to Vacuum + Sublimation T
                                                    if (triplePoint) {
                                                        const targetP = triplePoint.pressurePa / 10;

                                                        // Calc T at this P using Clausius-Clapeyron
                                                        const R = 8.314;
                                                        const molarMassKg = element.mass / 1000;
                                                        const dH_vap_mol = element.properties.enthalpyVapJmol || (element.properties.latentHeatVaporization * molarMassKg);
                                                        const dH_sub_mol = element.properties.enthalpyFusionJmol + dH_vap_mol;

                                                        const logTerm = Math.log(targetP / triplePoint.pressurePa);
                                                        const invTsub = (1 / triplePoint.tempK) - ((R * logTerm) / dH_sub_mol);
                                                        const targetT = 1 / invTsub;

                                                        onSetPressure(targetP);
                                                        onSetTemperature(targetT);
                                                    }
                                                }
                                            }}
                                            className="flex items-center justify-between px-3 py-2 rounded bg-pink-900/30 border border-pink-700/50 hover:bg-pink-600 hover:text-white text-pink-300 transition-all cursor-pointer group w-full"
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-[10px] font-bold uppercase">
                                                    {isSublimationRegime ? "Sublimation Point" : "Go to Sublimation"}
                                                </span>
                                                <span className="text-[10px] font-mono opacity-80 group-hover:text-white">
                                                    {isSublimationRegime
                                                        ? `${physicsState.sublimationPointCurrent.toFixed(2)} K`
                                                        : `~${fmtP(triplePoint.pressurePa / 10)} (Vacuum)`
                                                    }
                                                </span>
                                            </div>
                                            <CloudFog size={14} />
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Chemical Properties */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-green-400 uppercase flex items-center gap-2">
                                    <Beaker size={12} /> Atomic & Chemical
                                </h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <PropBox label="Atomic Mass" value={`${element.mass} u`} />
                                    <PropBox label="Density" value={element.properties.densityDisplay || 'N/A'} source={element.properties.densitySource} />
                                    <PropBox label="At. Radius" value={element.properties.atomicRadiusDisplay || 'N/A'} source={element.properties.atomicRadiusSource} />
                                    <PropBox label="Electroneg." value={element.properties.electronegativityDisplay || 'N/A'} />

                                    <PropBox label="Eletroafinidade" value={element.properties.electronAffinityDisplay || 'N/A'} />
                                    <PropBox label="1ª E. Ionização" value={element.properties.ionizationEnergyDisplay || 'N/A'} />

                                    <div className="col-span-2 bg-slate-800/30 p-2 rounded border border-slate-700/30 flex flex-col">
                                        <span className="text-[9px] text-slate-500 uppercase">Estados de Oxidação</span>
                                        <span className="text-xs font-mono text-slate-300">
                                            {element.properties.oxidationStatesDisplay || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="col-span-2 bg-slate-800/30 p-2 rounded border border-slate-700/30">
                                        <span className="text-[9px] text-slate-500 block uppercase">Electron Configuration</span>
                                        <span className="text-xs font-mono text-slate-300">
                                            {element.properties.electronConfiguration || 'N/A'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Physics Properties */}
                            <div className="space-y-2">
                                <h5 className="text-[10px] font-bold text-orange-400 uppercase flex items-center gap-2">
                                    <Thermometer size={12} /> Physics
                                </h5>
                                <div className="grid grid-cols-2 gap-2">
                                    <PropBox
                                        label="Thermal Cond."
                                        value={element.properties.thermalConductivityDisplay || 'N/A'}
                                        source={element.properties.thermalConductivitySource}
                                    />
                                    <PropBox
                                        label="Cond. Elétrica"
                                        value={element.properties.electricalConductivityDisplay || 'N/A'}
                                    />
                                    <PropBox
                                        label="Bulk Modulus"
                                        value={element.properties.bulkModulusDisplay || 'N/A'}
                                    />

                                    <PropBox
                                        label="Specific Heat (Solid)"
                                        value={element.properties.specificHeatSolidDisplay === 'N/A' ? 'N/A' : (element.properties.specificHeatSolidDisplay
                                            ? `${element.properties.specificHeatSolidDisplay} J/kgK`
                                            : `${element.properties.specificHeatSolid} J/kgK`)}
                                        source={element.properties.specificHeatSolidSource}
                                    />
                                    <PropBox
                                        label="Specific Heat (Liquid)"
                                        value={element.properties.specificHeatLiquidDisplay === 'N/A' ? 'N/A' : (element.properties.specificHeatLiquidDisplay
                                            ? `${element.properties.specificHeatLiquidDisplay} J/kgK`
                                            : `${element.properties.specificHeatLiquid} J/kgK`)}
                                        source={element.properties.specificHeatLiquidSource}
                                    />
                                    <PropBox
                                        label="Specific Heat (Gas)"
                                        value={element.properties.specificHeatGasDisplay === 'N/A' ? 'N/A' : (element.properties.specificHeatGasDisplay
                                            ? `${element.properties.specificHeatGasDisplay} J/kgK`
                                            : `${element.properties.specificHeatGas} J/kgK`)}
                                        source={element.properties.specificHeatGasSource}
                                    />

                                    <PropBox
                                        label="Latent Heat (S→L)"
                                        value={element.properties.latentHeatFusionDisplay === 'N/A'
                                            ? 'N/A'
                                            : `${(element.properties.latentHeatFusion / 1000).toFixed(0)} kJ/kg`
                                        }
                                        source={element.properties.latentHeatFusionSource}
                                    />
                                    <PropBox
                                        label="Latent Heat (L→G)"
                                        value={element.properties.latentHeatVaporizationDisplay === 'N/A'
                                            ? 'N/A'
                                            : `${(element.properties.latentHeatVaporization / 1000).toFixed(0)} kJ/kg`
                                        }
                                        source={element.properties.latentHeatVaporizationSource}
                                    />

                                    {element.properties.enthalpyFusionJmol && (
                                        <PropBox label="Enthalpy Fusion (Molar)" value={`${(element.properties.enthalpyFusionJmol / 1000).toFixed(2)} kJ/mol`} />
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="bg-slate-950 p-2 text-[10px] text-center text-slate-600 font-mono">
                    Data based on standard state (STP) values.
                    <br />
                    * Valores estimados
                    <br />
                    <button
                        onClick={() => setShowReferences(true)}
                        className="mt-1 text-cyan-500 hover:text-cyan-400 hover:underline cursor-pointer"
                    >
                        Ver Referências
                    </button>
                </div>
            </div>

            {/* REFERENCES MODAL */}
            {showReferences && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-[340px] bg-slate-900 border border-slate-600 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <BookOpen size={16} /> Referências Bibliográficas
                            </h3>
                            <button onClick={() => setShowReferences(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 space-y-4 text-xs text-slate-300 font-mono overflow-y-auto overflow-x-hidden max-h-[60vh]">
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[1]</span>
                                <div>
                                    {element.name}. (2026, February 15). In Wikipedia.
                                    <a href={wikiUrl} target="_blank" rel="noopener noreferrer" className="block text-cyan-500 hover:underline break-all mt-1 flex items-center gap-1">
                                        {wikiUrl} <ExternalLink size={10} />
                                    </a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[2]</span>
                                <div>
                                    L. M. Mentel, mendeleev - A Python resource for properties of chemical elements, ions and isotopes. , 2014-- . Available at: <a href="https://github.com/lmmentel/mendeleev" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://github.com/lmmentel/mendeleev</a>.
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[3]</span>
                                <div>
                                    Serviços de dados fornecidos pelo PubChem PUG-REST API.
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[4]</span>
                                <div>
                                    Angstrom Sciences, Inc. (2026). Magnetron Sputtering Reference. Retrieved from <a href="https://www.angstromsciences.com/magnetron-sputtering-reference" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://www.angstromsciences.com/magnetron-sputtering-reference</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[5]</span>
                                <div>
                                    Wolfram Research, Inc. (2026). ElementData curated properties. Retrieved from <a href="https://periodictable.com" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://periodictable.com</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[6]</span>
                                <div>
                                    Wikipedia contributors. (2025). Template:Periodic table (melting point). Wikipedia, The Free Encyclopedia. Retrieved from: <a href="https://en.wikipedia.org/wiki/Template:Periodic_table_(melting_point)" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://en.wikipedia.org/wiki/Template:Periodic_table_(melting_point)</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[7]</span>
                                <div>
                                    Wikipedia contributors. (2026). Boiling points of the elements (data page). Wikipedia, The Free Encyclopedia. Retrieved from: <a href="https://en.wikipedia.org/wiki/Boiling_points_of_the_elements_(data_page)" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://en.wikipedia.org/wiki/Boiling_points_of_the_elements_(data_page)</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[8]</span>
                                <div>
                                    Wikipedia contributors. (2026). Melting points of the elements (data page). Wikipedia, The Free Encyclopedia. Retrieved from: <a href="https://en.wikipedia.org/wiki/Melting_points_of_the_elements_(data_page)" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://en.wikipedia.org/wiki/Melting_points_of_the_elements_(data_page)</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[9]</span>
                                <div>
                                    Wikipedia contributors. (2024). Template:Infobox oganesson. Wikipedia, The Free Encyclopedia. Retrieved from: <a href="https://en.wikipedia.org/wiki/Template:Infobox_oganesson" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://en.wikipedia.org/wiki/Template:Infobox_oganesson</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[10]</span>
                                <div>
                                    Thermodynamics of the Elements: A Comprehensive Analysis of Phase Transitions and Triple Point Coexistence. (2026). Consolidated Master Table of All 118 Chemical Elements.
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[11]</span>
                                <div>
                                    Helmenstine, A. (2023). Triple Point Definition – Triple Point of Water. Science Notes and Projects. Retrieved from: <a href="https://sciencenotes.org/triple-point-of-water/" target="_blank" rel="noopener noreferrer" className="text-cyan-500 hover:underline break-all">https://sciencenotes.org/triple-point-of-water/</a>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <span className="text-cyan-400 font-bold shrink-0">[12]</span>
                                <div>
                                    Thermodynamics of the Elements: A Comprehensive Analysis of Phase Transitions and Triple Point Coexistence. (2026). Critical temperature and critical pressure master table.
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* DESCRIPTION MODAL (NEW) */}
            {showDescription && (
                <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
                    <div className="w-[340px] bg-slate-900 border border-slate-600 rounded-xl shadow-2xl flex flex-col overflow-hidden">
                        <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                <Info size={16} /> Descrição
                            </h3>
                            <button onClick={() => setShowDescription(false)} className="text-slate-400 hover:text-white transition-colors">
                                <X size={18} />
                            </button>
                        </div>
                        <div className="p-4 overflow-y-auto max-h-[60vh] text-slate-300 text-sm leading-relaxed">
                            <p>
                                {element.summary}
                                <sup className="text-cyan-400 ml-1 font-bold">(1)</sup>
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Small Helper Component for Grid Items
const PropBox = ({ label, value, source }: { label: string, value: string | number, source?: number }) => (
    <div className="bg-slate-800/30 p-2 rounded border border-slate-700/30 flex flex-col">
        <span className="text-[9px] text-slate-500 uppercase">{label}</span>
        <span className="text-xs font-mono text-slate-300 flex items-center">
            {value}
            {source && <sup className="text-[8px] ml-0.5 text-slate-500">({source})</sup>}
        </span>
    </div>
);

export default ElementPropertiesMenu;
