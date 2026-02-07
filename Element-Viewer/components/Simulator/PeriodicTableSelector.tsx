
import React from 'react';
import { ELEMENTS } from '../../data/elements';
import { ChemicalElement } from '../../types';

interface Props {
  selectedElements: ChemicalElement[];
  onSelect: (el: ChemicalElement) => void;
  isMultiSelect: boolean;
  onToggleMultiSelect: () => void;
}

const PeriodicTableSelector: React.FC<Props> = ({ selectedElements, onSelect, isMultiSelect, onToggleMultiSelect }) => {
  return (
    <div className="p-4 bg-slate-800 rounded-xl border border-slate-700 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Select Element</h3>

        {/* Multi-Select Toggle */}
        <button
          onClick={onToggleMultiSelect}
          className={`
                flex items-center gap-2 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all duration-300 border
                ${isMultiSelect
              ? 'bg-blue-600/30 border-blue-500 text-blue-300 shadow-[0_0_10px_rgba(37,99,235,0.3)]'
              : 'bg-slate-700 border-slate-600 text-slate-500 hover:bg-slate-600'}
             `}
        >
          <div className={`w-2 h-2 rounded-full ${isMultiSelect ? 'bg-blue-400 animate-pulse' : 'bg-slate-500'}`} />
          {isMultiSelect ? 'Compare (Max 6)' : 'Single View'}
        </button>
      </div>

      <div className="max-h-[350px] overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800/50">
        <div className="grid grid-cols-4 gap-2">
          {ELEMENTS.map((el) => {
            // Allow any element present in the database to be selectable
            const isImplemented = true;

            // Check if this specific element is in the selected array
            const isSelected = selectedElements.some(s => s.atomicNumber === el.atomicNumber);
            // Find its index to show selection order if multi-select
            const selectionIndex = selectedElements.findIndex(s => s.atomicNumber === el.atomicNumber);

            return (
              <button
                key={el.symbol}
                onClick={() => onSelect(el)}
                disabled={!isImplemented}
                className={`
                    relative h-16 w-full rounded-lg flex flex-col items-center justify-center transition-all duration-200
                    ${isSelected ? 'bg-cyan-600 ring-2 ring-cyan-300 z-10' : 'bg-slate-700 hover:bg-slate-600'}
                    ${!isImplemented ? 'opacity-40 cursor-not-allowed grayscale' : 'cursor-pointer'}
                `}
              >
                <span className="text-[10px] absolute top-1 left-2 text-slate-300 font-mono">{el.atomicNumber}</span>
                <span className={`text-xl font-bold ${isSelected ? 'text-white' : 'text-slate-200'}`}>{el.symbol}</span>

                {/* Order Badge for Multi-Select */}
                {isMultiSelect && isSelected && (
                  <span className="absolute top-1 right-2 w-4 h-4 rounded-full bg-slate-900 text-[9px] flex items-center justify-center text-cyan-400 font-mono border border-cyan-500/50">
                    {selectionIndex + 1}
                  </span>
                )}

                {!isImplemented && <span className="text-[8px] text-red-300 absolute bottom-1">N/A</span>}
              </button>
            );
          })}
          {/* Fillers for grid aesthetic */}
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg border-2 border-dashed border-slate-800/50 flex items-center justify-center">
              <span className="text-slate-800 text-xs">?</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PeriodicTableSelector;