import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { ChevronDown } from '@openai/apps-sdk-ui/components/Icon';
import { SegmentedControl } from '@openai/apps-sdk-ui/components/SegmentedControl';
import { Select } from '@openai/apps-sdk-ui/components/Select';
import { Slider } from '@openai/apps-sdk-ui/components/Slider';
import { Switch } from '@openai/apps-sdk-ui/components/Switch';
import { ELEMENTS } from '../../data/elements';
import { SOURCE_DATA } from '../../data/periodic_table_source';
import { ChemicalElement } from '../../types';
import {
  PRESSURE_UNITS,
  PressureUnit,
  TEMP_UNITS,
  TempUnit,
  fromKelvin,
  fromPascal
} from '../../utils/units';

interface Props {
  selectedElements: ChemicalElement[];
  onSelect: (el: ChemicalElement) => void;
  isMultiSelect: boolean;
  onToggleMultiSelect: () => void;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  temperature: number;
  setTemperature: (t: number) => void;
  pressure: number;
  setPressure: (p: number) => void;
  showParticles: boolean;
  setShowParticles: (v: boolean) => void;
}

const POSITION_BY_SYMBOL = new Map<string, { xpos: number; ypos: number }>(
  SOURCE_DATA.elements
    .filter((entry) => typeof entry.symbol === 'string' && typeof entry.xpos === 'number' && typeof entry.ypos === 'number')
    .map((entry) => [entry.symbol, { xpos: entry.xpos, ypos: entry.ypos }]),
);

const PeriodicTableSelector: React.FC<Props> = ({
  selectedElements,
  onSelect,
  isMultiSelect,
  onToggleMultiSelect,
  isOpen,
  onOpenChange,
  temperature,
  setTemperature,
  pressure,
  setPressure,
  showParticles,
  setShowParticles,
}) => {
  const [activeSlider, setActiveSlider] = useState<'temperature' | 'pressure' | null>(null);
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('Pa');
  const [dragOffset, setDragOffset] = useState(0);
  const [isDraggingSheet, setIsDraggingSheet] = useState(false);
  const pointerStartY = useRef<number | null>(null);
  const dragRafRef = useRef<number | null>(null);
  const pendingDragOffset = useRef(0);

  const visibleElements = useMemo(() => ELEMENTS, []);

  const selectedPreview = useMemo(() => selectedElements.slice(0, 6), [selectedElements]);

  const flushDragOffset = () => {
    setDragOffset(pendingDragOffset.current);
    dragRafRef.current = null;
  };

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartY.current = event.clientY;
    setIsDraggingSheet(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null) return;
    const delta = event.clientY - pointerStartY.current;
    pendingDragOffset.current = Math.max(0, delta);
    if (!dragRafRef.current) {
      dragRafRef.current = requestAnimationFrame(flushDragOffset);
    }
  };

  const handleDragEnd = () => {
    const finalOffset = Math.max(dragOffset, pendingDragOffset.current);
    if (finalOffset > 80) {
      onOpenChange(false);
    }
    pointerStartY.current = null;
    setDragOffset(0);
    setIsDraggingSheet(false);
    pendingDragOffset.current = 0;
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  };

  const pressureSliderValue = pressure <= 0.0001 ? -4 : Math.log10(pressure);

  const displayedTemperature = fromKelvin(temperature, tempUnit);
  const displayedPressure = fromPascal(pressure, pressureUnit);
  const isSliderActive = activeSlider !== null;

  useEffect(() => {
    if (!isSliderActive) return;

    const releaseSlider = () => setActiveSlider(null);
    window.addEventListener('pointerup', releaseSlider);
    window.addEventListener('pointercancel', releaseSlider);

    return () => {
      window.removeEventListener('pointerup', releaseSlider);
      window.removeEventListener('pointercancel', releaseSlider);
    };
  }, [isSliderActive]);

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Button color="secondary" variant="soft" pill onClick={() => onOpenChange(true)}>
            <ChevronDown className="size-4 rotate-180" />
            Open periodic table
          </Button>
        </div>
      )}

      <section
        className="fixed inset-x-0 bottom-0 z-40 px-0 pb-0"
        style={{
          transform: `translateY(${isOpen ? dragOffset : 580}px)`,
          transition: isDraggingSheet ? 'none' : 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className={`periodic-sheet mx-auto w-full max-w-5xl rounded-t-3xl sm:p-3 transition-all duration-100 ${isSliderActive ? "border-transparent bg-transparent shadow-none" : "border border-default bg-surface-elevated shadow-2xl"}`}>
          <div
            className="mx-auto mb-1 flex w-full max-w-xl cursor-grab touch-none flex-col items-center"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            onPointerLeave={handleDragEnd}
            style={{ touchAction: 'none' }}
          >
            <div className="h-1.5 w-14 rounded-full bg-border" />
          </div>
          <div className="mb-1 flex justify-center">
            <Button color="secondary" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </div>

          <div className={`mb-1.5 flex items-start justify-between gap-2 transition-opacity duration-100 ${isSliderActive ? 'opacity-0 pointer-events-none' : 'opacity-100'}`}>
            <SegmentedControl
              aria-label="Selection mode"
              value={isMultiSelect ? 'compare' : 'single'}
              onChange={(next) => {
                if ((next === 'compare') !== isMultiSelect) {
                  onToggleMultiSelect();
                }
              }}
            >
              <SegmentedControl.Option value="single">Single</SegmentedControl.Option>
              <SegmentedControl.Option value="compare">Compare</SegmentedControl.Option>
            </SegmentedControl>
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {selectedPreview.map((element) => (
                  <span
                    key={element.atomicNumber}
                    className="flex size-6 items-center justify-center rounded-full border border-default bg-surface text-[10px] font-semibold"
                    title={element.name}
                  >
                    {element.symbol}
                  </span>
                ))}
              </div>
              <Badge color={isMultiSelect ? 'info' : 'secondary'} variant="soft">
                {selectedElements.length}/6
              </Badge>
            </div>
          </div>

          <div className={`mb-1 rounded-xl p-2 transition-all duration-100 ${isSliderActive ? 'border-transparent bg-transparent shadow-none' : 'border border-subtle bg-surface'}`}>
            <div className={`${isSliderActive && activeSlider !== 'temperature' ? 'opacity-0 pointer-events-none absolute' : ''}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-2xs text-secondary">Temperature</p>
                <div className="flex items-center gap-1">
                  <Badge color="secondary" variant="outline" size="sm">
                    {Number(displayedTemperature.toFixed(tempUnit === 'K' ? 0 : 2)).toLocaleString()} {tempUnit}
                  </Badge>
                  <Select
                    options={TEMP_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
                    value={tempUnit}
                    onChange={(next) => setTempUnit(next.value as TempUnit)}
                    block={false}
                    size="sm"
                  />
                </div>
              </div>
              <div
                onPointerDown={() => setActiveSlider('temperature')}
                onPointerUp={() => setActiveSlider(null)}
                onPointerCancel={() => setActiveSlider(null)}
              >
                <Slider
                  value={temperature}
                  min={0}
                  max={6000}
                  step={10}
                  unit="K"
                  className="hide-slider-value"
                  onChange={setTemperature}
                />
              </div>
            </div>

            <div className={`mt-1.5 ${isSliderActive && activeSlider !== 'pressure' ? 'opacity-0 pointer-events-none absolute' : ''}`}>
              <div className="mb-1 flex items-center justify-between gap-2">
                <p className="text-2xs text-secondary">Pressure</p>
                <div className="flex items-center gap-1">
                  <Badge color="secondary" variant="outline" size="sm">
                    {pressure > 0
                      ? `${Number(displayedPressure.toPrecision(6)).toLocaleString()} ${pressureUnit}`
                      : `0 ${pressureUnit}`}
                  </Badge>
                  <Select
                    options={PRESSURE_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
                    value={pressureUnit}
                    onChange={(next) => setPressureUnit(next.value as PressureUnit)}
                    block={false}
                    size="sm"
                  />
                </div>
              </div>
              <div
                onPointerDown={() => setActiveSlider('pressure')}
                onPointerUp={() => setActiveSlider(null)}
                onPointerCancel={() => setActiveSlider(null)}
              >
                <Slider
                  value={pressureSliderValue}
                  min={-4}
                  max={11}
                  step={0.05}
                  className="hide-slider-value"
                  onChange={(value) => setPressure(value <= -3.9 ? 0 : Math.pow(10, value))}
                />
              </div>
            </div>
          </div>

          <div className={`mb-1 flex justify-end transition-opacity duration-100 ${isSliderActive ? 'opacity-0' : 'opacity-100'}`}>
            <Switch checked={showParticles} onCheckedChange={setShowParticles} label="X-Ray Vision" size="sm" />
          </div>

          <div className={`${isSliderActive ? 'opacity-0' : 'opacity-100'} transition-opacity duration-100`}>
            <div className="periodic-grid">
              {visibleElements.map((el) => {
                const position = POSITION_BY_SYMBOL.get(el.symbol);
                if (!position) return null;

                const isSelected = selectedElements.some((selected) => selected.atomicNumber === el.atomicNumber);
                const selectionIndex = selectedElements.findIndex(
                  (selected) => selected.atomicNumber === el.atomicNumber,
                );

                return (
                  <Button
                    key={el.atomicNumber}
                    color={isSelected ? 'primary' : 'secondary'}
                    variant={isSelected ? 'solid' : 'soft'}
                    size="sm"
                    onClick={() => onSelect(el)}
                    className="periodic-cell"
                    style={{ gridColumn: position.xpos, gridRow: position.ypos, marginTop: position.ypos >= 9 ? "3px" : undefined }}
                  >
                    <span className="pointer-events-none absolute left-0.5 top-0 text-[8px] leading-none text-tertiary">
                      {el.atomicNumber}
                    </span>
                    <span className="text-[10px] font-semibold leading-none sm:text-2xs">{el.symbol}</span>
                    {isMultiSelect && isSelected && (
                      <span className="pointer-events-none absolute right-0.5 top-0.5 flex size-3.5 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
                        {selectionIndex + 1}
                      </span>
                    )}
                  </Button>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default PeriodicTableSelector;
