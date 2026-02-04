import React, { useState } from 'react';
import { ChemicalElement, PhysicsState, Bounds } from '../../types';
import { X, ChevronLeft, ChevronRight, Activity, Thermometer, Gauge, Zap, ArrowRight, BoxSelect } from 'lucide-react';

interface RecordingData {
  element: ChemicalElement;
  start: PhysicsState;
  end: PhysicsState;
}

interface Props {
  recordings: RecordingData[];
  onClose: () => void;
}

const RecordingStatsModal: React.FC<Props> = ({ recordings, onClose }) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentData = recordings[currentIndex];
  const { element, start, end } = currentData;

  const handleNext = () => setCurrentIndex((prev) => (prev + 1) % recordings.length);
  const handlePrev = () => setCurrentIndex((prev) => (prev - 1 + recordings.length) % recordings.length);

  // --- Statistics Calculations ---
  const deltaH = end.enthalpy - start.enthalpy;
  const duration = (end.simTime - start.simTime).toFixed(2);
  const isHeating = deltaH > 0;
  
  // Volume Calculations
  const getVolume = (bounds: Bounds) => (bounds.maxX - bounds.minX) * (bounds.maxY - bounds.minY);
  const volStart = getVolume(start.gasBounds);
  const volEnd = getVolume(end.gasBounds);
  const volChange = volEnd - volStart;
  const volPercent = volStart !== 0 ? (volChange / volStart) * 100 : 0;
  
  // Helper to format numbers
  const fmt = (n: number, unit: string = '') => `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}${unit}`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-slate-900/95 border border-slate-600 rounded-2xl shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* HEADER */}
        <div className="flex items-center justify-between p-4 bg-slate-800/50 border-b border-slate-700">
          <div className="flex items-center gap-3">
             <div className="p-2 rounded-lg bg-red-500/20 text-red-400">
                <Activity size={20} />
             </div>
             <div>
                <h2 className="text-lg font-bold text-white">Recording Statistics</h2>
                <p className="text-xs text-slate-400 font-mono">Duration: {duration}s (Simulated Time)</p>
             </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-800 rounded-full text-slate-400 hover:text-white transition-colors">
            <X size={20} />
          </button>
        </div>

        {/* CONTENT */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin scrollbar-thumb-slate-700">
            
            {/* ELEMENT NAVIGATOR */}
            <div className="flex items-center justify-between mb-6 bg-slate-800 rounded-xl p-2">
                <button 
                    onClick={handlePrev} 
                    disabled={recordings.length <= 1}
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronLeft size={20} />
                </button>
                
                <div className="flex items-center gap-3">
                    <div 
                        className="w-8 h-8 rounded-full flex items-center justify-center font-bold text-slate-900 text-sm shadow-lg" 
                        style={{ backgroundColor: element.visualDNA.solid.color }}
                    >
                        {element.symbol}
                    </div>
                    <div className="text-center">
                        <h3 className="font-bold text-slate-100">{element.name}</h3>
                        {recordings.length > 1 && <span className="text-[10px] text-slate-500 uppercase tracking-widest">Element {currentIndex + 1} of {recordings.length}</span>}
                    </div>
                </div>

                <button 
                    onClick={handleNext}
                    disabled={recordings.length <= 1} 
                    className="p-2 hover:bg-slate-700 rounded-lg text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                
                {/* 1. THERMODYNAMICS CARD */}
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-4">
                    <h4 className="text-xs font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
                        <Thermometer size={14} /> State Variables
                    </h4>
                    
                    {/* Temperature */}
                    <div className="space-y-1">
                        <div className="flex justify-between text-xs text-slate-400">
                            <span>Temperature</span>
                            <span className={end.temperature > start.temperature ? 'text-red-400' : 'text-blue-400'}>
                                Δ {fmt(end.temperature - start.temperature, ' K')}
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded text-sm font-mono text-slate-200">
                            <span>{fmt(start.temperature, ' K')}</span>
                            <ArrowRight size={14} className="text-slate-600" />
                            <span className="font-bold">{fmt(end.temperature, ' K')}</span>
                        </div>
                    </div>

                    {/* Pressure */}
                    <div className="space-y-1">
                         <div className="flex justify-between text-xs text-slate-400">
                            <span>Pressure</span>
                            <span className={end.pressure !== start.pressure ? 'text-purple-400' : 'text-slate-500'}>
                                {end.pressure === start.pressure ? 'Constant' : 'Changed'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded text-sm font-mono text-slate-200">
                            <span className="flex items-center gap-1"><Gauge size={12} className="text-purple-500" /> {fmt(start.pressure / 1000, ' kPa')}</span>
                            <ArrowRight size={14} className="text-slate-600" />
                            <span className="flex items-center gap-1"><Gauge size={12} className="text-purple-500" /> {fmt(end.pressure / 1000, ' kPa')}</span>
                        </div>
                    </div>
                </div>

                {/* 2. ENERGETICS CARD */}
                <div className="bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 space-y-4">
                    <h4 className="text-xs font-bold text-yellow-400 uppercase tracking-wider flex items-center gap-2">
                        <Zap size={14} /> Energetics
                    </h4>

                    {/* Enthalpy */}
                    <div className="space-y-1">
                         <div className="flex justify-between text-xs text-slate-400">
                            <span>Total Enthalpy Change</span>
                            <span className="text-[10px] text-slate-500">(System Energy)</span>
                        </div>
                        <div className={`flex items-center justify-center p-3 rounded text-lg font-bold font-mono border ${isHeating ? 'bg-red-900/20 border-red-500/30 text-red-300' : 'bg-blue-900/20 border-blue-500/30 text-blue-300'}`}>
                            {isHeating ? '+' : ''}{fmt(deltaH, ' J')}
                        </div>
                        <div className="text-[10px] text-center text-slate-500">
                            {isHeating ? 'Energy Absorbed from Environment' : 'Energy Released to Environment'}
                        </div>
                    </div>

                    {/* Phase */}
                    <div className="space-y-1 pt-2">
                        <div className="text-xs text-slate-400">Phase Transition</div>
                        <div className="flex items-center justify-between bg-slate-900/50 p-2 rounded text-xs font-bold font-mono text-slate-200">
                            <span className="text-slate-400">{start.state.replace('_', ' ')}</span>
                            <ArrowRight size={14} className="text-slate-500" />
                            <span className={start.state !== end.state ? 'text-white' : 'text-slate-400'}>{end.state.replace('_', ' ')}</span>
                        </div>
                    </div>
                </div>

                {/* 3. VOLUME CARD (NEW) */}
                <div className="col-span-1 md:col-span-2 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4 flex flex-col md:flex-row gap-4 items-center justify-between">
                     <div className="flex flex-col gap-1 w-full">
                         <h4 className="text-xs font-bold text-green-400 uppercase tracking-wider flex items-center gap-2 mb-2">
                            <BoxSelect size={14} /> Gas Expansion (Volume)
                         </h4>
                         <div className="flex items-center justify-between w-full gap-4">
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 uppercase">Initial Area</span>
                                <span className="text-xs font-mono text-slate-300">{fmt(volStart, ' px²')}</span>
                            </div>
                            <ArrowRight size={14} className="text-slate-600" />
                            <div className="flex flex-col gap-1">
                                <span className="text-[10px] text-slate-500 uppercase">Final Area</span>
                                <span className="text-xs font-mono text-white">{fmt(volEnd, ' px²')}</span>
                            </div>
                            <div className="flex flex-col gap-1 items-end ml-auto">
                                <span className="text-[10px] text-slate-500 uppercase">Variation</span>
                                <span className={`text-sm font-bold font-mono ${volChange > 0 ? 'text-green-400' : volChange < 0 ? 'text-red-400' : 'text-slate-400'}`}>
                                    {volChange > 0 ? '+' : ''}{fmt(volPercent, '%')}
                                </span>
                            </div>
                         </div>
                     </div>
                </div>

                {/* 4. BOUNDARIES CARD (Full Width) */}
                <div className="col-span-1 md:col-span-2 bg-slate-800/40 rounded-xl border border-slate-700/50 p-4">
                     <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Phase Boundaries (Pressure Dependent)</h4>
                     <div className="grid grid-cols-2 gap-4">
                         {/* Melting Point */}
                         <div className="bg-slate-900/50 p-2 rounded flex justify-between items-center">
                             <span className="text-xs text-slate-400">T<sub>melt</sub></span>
                             <div className="flex items-center gap-2 text-xs font-mono">
                                 <span className="text-slate-500">{fmt(start.meltingPointCurrent)}</span>
                                 <ArrowRight size={10} className="text-slate-700" />
                                 <span className="text-cyan-200">{fmt(end.meltingPointCurrent)}</span>
                             </div>
                         </div>
                         {/* Boiling Point */}
                         <div className="bg-slate-900/50 p-2 rounded flex justify-between items-center">
                             <span className="text-xs text-slate-400">T<sub>boil</sub></span>
                             <div className="flex items-center gap-2 text-xs font-mono">
                                 <span className="text-slate-500">{fmt(start.boilingPointCurrent)}</span>
                                 <ArrowRight size={10} className="text-slate-700" />
                                 <span className="text-red-200">{fmt(end.boilingPointCurrent)}</span>
                             </div>
                         </div>
                     </div>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
};

export default RecordingStatsModal;