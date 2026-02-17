
import React, { useState } from 'react';
import { Thermometer, Gauge, Zap } from 'lucide-react';
import {
  TempUnit, PressureUnit, TEMP_UNITS, PRESSURE_UNITS,
  toKelvin, fromKelvin, toPascal, fromPascal
} from '../../utils/units';

interface Props {
  temperature: number;
  setTemperature: (t: number) => void;
  pressure: number;
  setPressure: (p: number) => void;
  meltPoint: number;
  boilPoint: number;
  showParticles: boolean;
  setShowParticles: (v: boolean) => void;
  onInteractionChange: (isActive: boolean) => void;
  onSliderRelease?: () => void;
}

const ControlPanel: React.FC<Props> = ({
  temperature,
  setTemperature,
  pressure,
  setPressure,
  meltPoint,
  boilPoint,
  showParticles,
  setShowParticles,
  onInteractionChange,
  onSliderRelease
}) => {
  const [activeControl, setActiveControl] = useState<'temperature' | 'pressure' | null>(null);

  // Local State for Units
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('Pa');

  const handleInteractionStart = (control: 'temperature' | 'pressure') => {
    setActiveControl(control);
    onInteractionChange(true);
  };

  const handleInteractionEnd = () => {
    setActiveControl(null);
    onInteractionChange(false);
    onSliderRelease?.();
  };

  // --- TEMPERATURE LOGIC ---
  const currentTempDisplay = fromKelvin(temperature, tempUnit);
  const minTempK = 0;
  const maxTempK = 6000;

  // Dynamic Slider Bounds based on Unit
  const minSlider = fromKelvin(minTempK, tempUnit);
  const maxSlider = fromKelvin(maxTempK, tempUnit);

  const handleTempChange = (val: number) => {
    setTemperature(toKelvin(val, tempUnit));
  };

  // --- PRESSURE LOGIC (Logarithmic Slider, Linear Input) ---
  // Allow slider to go down to 10^-4 Pa, and force 0 below that.
  // Slider Range: -4 to 11
  let logPressureValue = -4;
  if (pressure > 0.0001) {
    logPressureValue = Math.log10(pressure);
  } else if (pressure <= 0) {
    logPressureValue = -4; // Represents slider minimum
  }

  const currentPressureDisplay = fromPascal(pressure, pressureUnit);

  const handleLogPressureSliderChange = (val: number) => {
    if (val <= -3.9) {
      setPressure(0);
    } else {
      const newPressurePa = Math.pow(10, val);
      setPressure(newPressurePa);
    }
  };

  const handlePressureInputChange = (val: number) => {
    if (val <= 0) {
      setPressure(0);
    } else {
      setPressure(toPascal(val, pressureUnit));
    }
  };

  // --- STYLING HELPERS ---
  const getOpacityClass = (target: 'temperature' | 'pressure') => {
    if (activeControl && activeControl !== target) return 'opacity-0 pointer-events-none duration-300';
    return 'opacity-100 duration-300';
  };

  const commonOpacityClass = activeControl ? 'opacity-0 pointer-events-none duration-300' : 'opacity-100 duration-300';

  const containerClass = `
      flex flex-col gap-6 p-6 w-full rounded-xl border shadow-xl transition-all duration-500
      ${activeControl
      ? "bg-transparent border-transparent shadow-none"
      : "bg-slate-800/90 border-slate-700"}
  `;

  const selectClass = "bg-transparent border-none text-sm font-bold cursor-pointer outline-none text-right appearance-none hover:text-white transition-colors text-slate-400 focus:text-white";

  return (
    <div className={containerClass}>
      <h3 className={`text-xs font-bold text-slate-400 uppercase tracking-widest mb-2 transition-opacity ${commonOpacityClass}`}>
        Environmental Controls
      </h3>

      {/* Temperature Control */}
      <div className={`space-y-3 transition-opacity ${getOpacityClass('temperature')}`}>
        <div className="flex justify-between items-end">
          <label className="flex items-center gap-2 text-cyan-400 font-semibold shrink-0">
            <Thermometer size={18} />
            <span>Temperature</span>
          </label>
          <div className="flex items-baseline gap-2 justify-end min-w-0">
            <input
              type="number"
              value={Number(currentTempDisplay.toFixed(tempUnit === 'K' ? 0 : 2))}
              onChange={(e) => handleTempChange(Number(e.target.value))}
              className="bg-transparent border-b border-slate-600 text-lg font-mono text-white w-20 focus:outline-none focus:border-cyan-400 text-right"
            />
            <div className="relative shrink-0">
              <select
                value={tempUnit}
                onChange={(e) => setTempUnit(e.target.value as TempUnit)}
                className={`${selectClass} w-auto`}
              >
                {TEMP_UNITS.map(u => (
                  <option key={u.value} value={u.value} className="bg-slate-800 text-slate-200">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <input
          type="range"
          min={minSlider}
          max={maxSlider}
          step={tempUnit === 'K' ? 10 : 1}
          value={currentTempDisplay}
          onChange={(e) => handleTempChange(Number(e.target.value))}
          onMouseDown={() => handleInteractionStart('temperature')}
          onTouchStart={() => handleInteractionStart('temperature')}
          onMouseUp={handleInteractionEnd}
          onTouchEnd={handleInteractionEnd}
          className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-cyan-500 hover:accent-cyan-400 transition-all"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
          <span>{Math.round(minSlider)} {tempUnit}</span>
          <span className="flex gap-4">
            <span className={Math.abs(temperature - meltPoint) < 50 ? "text-yellow-400 font-bold" : ""}>T<sub>melt</sub></span>
            <span className={Math.abs(temperature - boilPoint) < 100 ? "text-red-400 font-bold" : ""}>T<sub>boil</sub></span>
          </span>
          <span>{Math.round(maxSlider)} {tempUnit}</span>
        </div>
      </div>

      <div className={`h-[1px] bg-slate-700 w-full transition-opacity ${commonOpacityClass}`} />

      {/* Pressure Control */}
      <div className={`space-y-3 transition-opacity ${getOpacityClass('pressure')}`}>
        <div className="flex justify-between items-end">
          <label className="flex items-center gap-2 text-purple-400 font-semibold shrink-0">
            <Gauge size={18} />
            <span>Pressure</span>
          </label>
          <div className="flex items-baseline gap-2 justify-end min-w-0">
            <input
              type="number"
              step="any"
              value={Number(currentPressureDisplay.toPrecision(5))}
              onChange={(e) => handlePressureInputChange(Number(e.target.value))}
              className="bg-transparent border-b border-slate-600 text-lg font-mono text-white w-28 focus:outline-none focus:border-purple-400 text-right"
            />
            <div className="relative shrink-0">
              <select
                value={pressureUnit}
                onChange={(e) => setPressureUnit(e.target.value as PressureUnit)}
                className={`${selectClass} w-auto`}
              >
                {PRESSURE_UNITS.map(u => (
                  <option key={u.value} value={u.value} className="bg-slate-800 text-slate-200">
                    {u.label}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>
        <input
          type="range"
          min="-4"
          max="11"
          step="0.05"
          value={logPressureValue}
          onChange={(e) => handleLogPressureSliderChange(Number(e.target.value))}
          onMouseDown={() => handleInteractionStart('pressure')}
          onTouchStart={() => handleInteractionStart('pressure')}
          onMouseUp={handleInteractionEnd}
          onTouchEnd={handleInteractionEnd}
          className="w-full h-2 bg-slate-900 rounded-lg appearance-none cursor-pointer accent-purple-500 hover:accent-purple-400 transition-all"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono uppercase">
          <span>Vacuum</span>
          <span className={Math.abs(logPressureValue - 5) < 0.5 ? "text-purple-300 font-bold" : ""}>1 atm</span>
          <span>Max</span>
        </div>
      </div>

      <div className={`h-[1px] bg-slate-700 w-full transition-opacity ${commonOpacityClass}`} />

      {/* Particle Toggle */}
      <div className={`flex justify-between items-center transition-opacity ${commonOpacityClass}`}>
        <label className="flex items-center gap-2 text-slate-300 font-semibold cursor-pointer select-none">
          <Zap size={18} className={showParticles ? "text-yellow-400" : "text-slate-500"} />
          <span>X-Ray Vision</span>
        </label>
        <button
          onClick={() => setShowParticles(!showParticles)}
          className={`w-12 h-6 rounded-full p-1 transition-colors duration-300 ${showParticles ? 'bg-cyan-600' : 'bg-slate-700'}`}
        >
          <div className={`w-4 h-4 rounded-full bg-white shadow-md transform transition-transform duration-300 ${showParticles ? 'translate-x-6' : 'translate-x-0'}`} />
        </button>
      </div>

    </div>
  );
};

export default ControlPanel;
