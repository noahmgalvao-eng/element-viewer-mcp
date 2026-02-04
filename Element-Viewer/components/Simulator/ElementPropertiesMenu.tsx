
import React, { useEffect, useRef, useState } from 'react';
import { ChemicalElement, PhysicsState } from '../../types';
import { X, Thermometer, ArrowRight, Activity, ChevronDown, ChevronUp, Beaker, Zap, Triangle, CloudFog } from 'lucide-react';

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

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEsc);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

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

  const hasCriticalPoint = !!element.properties.criticalPoint;
  const hasTriplePoint = !!element.properties.triplePoint;

  // Check which regime we are in
  const isSublimationRegime = physicsState.sublimationPointCurrent > 0;
  const stdPressure = 101325;
  
  // Helper for Pressure Formatting
  const fmtP = (p: number) => {
    if (p < 0.01) return p.toExponential(2) + ' Pa';
    if (p < 1000) return p.toFixed(2) + ' Pa';
    if (p < 1000000) return (p/1000).toFixed(2) + ' kPa';
    return (p/1000000).toFixed(2) + ' MPa';
  };

  return (
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
          <div>
            <h3 className="font-bold text-slate-100 text-lg leading-tight">{element.name}</h3>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-wider">
               {element.classification.groupBlock} - {element.classification.groupName}
            </p>
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
                    <span>{element.properties.meltingPointK} K</span>
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
                            ? `${element.properties.meltingPointK} K`
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
                    <span>{element.properties.boilingPointK} K</span>
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
                        className={`flex items-center gap-2 px-2 py-1 rounded border transition-all text-sm font-mono ${
                            (!isSublimationRegime && physicsState.boilingPointCurrent >= 49000)
                            ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed" 
                            : "bg-red-900/30 border-red-700/50 hover:bg-red-600 hover:text-white text-red-300 cursor-pointer"
                        }`}
                    >
                        {isSublimationRegime 
                            ? `${element.properties.boilingPointK} K`
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
                        {hasTriplePoint && element.properties.triplePoint && (
                            <button 
                                onClick={() => {
                                    if (element.properties.triplePoint) {
                                        onSetTemperature(element.properties.triplePoint.tempK); 
                                        onSetPressure(element.properties.triplePoint.pressurePa);
                                    }
                                }}
                                className="flex items-center justify-between px-3 py-2 rounded bg-emerald-900/30 border border-emerald-700/50 hover:bg-emerald-600 hover:text-white text-emerald-300 transition-all cursor-pointer group w-full"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase">Go to Triple Point</span>
                                    <span className="text-[10px] font-mono opacity-80 group-hover:text-white">
                                        {element.properties.triplePoint.tempK} K / {fmtP(element.properties.triplePoint.pressurePa)}
                                    </span>
                                </div>
                                <Triangle size={14} fill="currentColor" className="rotate-180" /> 
                            </button>
                        )}

                        {/* Critical Point (Only if exists) */}
                        {hasCriticalPoint && element.properties.criticalPoint && (
                            <button 
                                onClick={() => {
                                    if (element.properties.criticalPoint) {
                                        onSetTemperature(element.properties.criticalPoint.tempK + 50); 
                                        onSetPressure(element.properties.criticalPoint.pressurePa + 1000);
                                    }
                                }}
                                className="flex items-center justify-between px-3 py-2 rounded bg-purple-900/30 border border-purple-700/50 hover:bg-purple-600 hover:text-white text-purple-300 transition-all cursor-pointer group w-full"
                            >
                                <div className="flex flex-col items-start">
                                    <span className="text-[10px] font-bold uppercase">Go Critical</span>
                                    <span className="text-[10px] font-mono opacity-80 group-hover:text-white">
                                        {element.properties.criticalPoint.tempK} K / {fmtP(element.properties.criticalPoint.pressurePa)}
                                    </span>
                                </div>
                                <Zap size={14} fill="currentColor" />
                            </button>
                        )}

                        {/* Sublimation Point (Jump or Current) */}
                        {hasTriplePoint && element.properties.triplePoint && element.properties.enthalpyFusionJmol && (
                             <button 
                                onClick={() => {
                                    if (isSublimationRegime) {
                                        // CURRENT: Just set Temperature
                                        onSetTemperature(physicsState.sublimationPointCurrent);
                                    } else {
                                        // JUMP: Go to Vacuum + Sublimation T
                                        if (element.properties.triplePoint) {
                                            const targetP = element.properties.triplePoint.pressurePa / 10;
                                            
                                            // Calc T at this P using Clausius-Clapeyron
                                            const R = 8.314;
                                            const molarMassKg = element.mass / 1000;
                                            const dH_vap_mol = element.properties.enthalpyVapJmol || (element.properties.latentHeatVaporization * molarMassKg);
                                            const dH_sub_mol = element.properties.enthalpyFusionJmol + dH_vap_mol;
                                            
                                            const logTerm = Math.log(targetP / element.properties.triplePoint.pressurePa);
                                            const invTsub = (1 / element.properties.triplePoint.tempK) - ((R * logTerm) / dH_sub_mol);
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
                                            : `~${fmtP(element.properties.triplePoint.pressurePa / 10)} (Vacuum)`
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
                        <PropBox label="Density" value={element.properties.density ? `${element.properties.density} g/cm³` : 'N/A'} />
                        <PropBox label="At. Radius" value={element.properties.atomicRadiusPm ? `${element.properties.atomicRadiusPm} pm` : 'N/A'} />
                        <PropBox label="Electroneg." value={element.properties.electronegativity?.toFixed(2) ?? 'N/A'} />
                        
                        {/* New Fields */}
                        <PropBox label="Eletroafinidade" value={element.properties.electronAffinity !== undefined ? `${element.properties.electronAffinity} kJ/mol` : 'N/A'} />
                        <PropBox label="1ª E. Ionização" value={element.properties.ionizationEnergy !== undefined ? `${element.properties.ionizationEnergy} kJ/mol` : 'N/A'} />
                        
                        <div className="col-span-2 bg-slate-800/30 p-2 rounded border border-slate-700/30 flex flex-col">
                            <span className="text-[9px] text-slate-500 uppercase">Estados de Oxidação</span>
                            <span className="text-xs font-mono text-slate-300">
                                {element.properties.oxidationStates ? element.properties.oxidationStates.map(s => s > 0 ? `+${s}` : `${s}`).join(', ') : 'N/A'}
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

                {/* Physics Properties (Renamed from Thermal Physics) */}
                <div className="space-y-2">
                    <h5 className="text-[10px] font-bold text-orange-400 uppercase flex items-center gap-2">
                        <Thermometer size={12} /> Physics
                    </h5>
                    <div className="grid grid-cols-2 gap-2">
                        <PropBox label="Thermal Cond." value={element.properties.thermalConductivity ? `${element.properties.thermalConductivity} W/mK` : 'N/A'} />
                        <PropBox 
                            label="Cond. Elétrica" 
                            value={element.properties.electricalConductivity !== undefined 
                                ? `${(element.properties.electricalConductivity / 1e6).toFixed(1)} MS/m` 
                                : 'N/A'} 
                        />
                        <PropBox label="Bulk Modulus" value={element.properties.bulkModulusGPa ? `${element.properties.bulkModulusGPa} GPa` : 'N/A'} />
                        
                        <PropBox label="Specific Heat (Solid)" value={`${element.properties.specificHeatSolid} J/kgK`} />
                        <PropBox label="Specific Heat (Liquid)" value={`${element.properties.specificHeatLiquid} J/kgK`} />
                        <PropBox label="Specific Heat (Gas)" value={`${element.properties.specificHeatGas} J/kgK`} />
                        
                        <PropBox label="Latent Heat (S→L)" value={`${(element.properties.latentHeatFusion / 1000).toFixed(0)} kJ/kg`} />
                        <PropBox label="Latent Heat (L→G)" value={`${(element.properties.latentHeatVaporization / 1000).toFixed(0)} kJ/kg`} />
                        
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
      </div>
    </div>
  );
};

// Small Helper Component for Grid Items
const PropBox = ({ label, value }: { label: string, value: string | number }) => (
    <div className="bg-slate-800/30 p-2 rounded border border-slate-700/30 flex flex-col">
        <span className="text-[9px] text-slate-500 uppercase">{label}</span>
        <span className="text-xs font-mono text-slate-300">{value}</span>
    </div>
);

export default ElementPropertiesMenu;
