import React, { useMemo, useRef, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { ChevronDown } from '@openai/apps-sdk-ui/components/Icon';
import { SegmentedControl } from '@openai/apps-sdk-ui/components/SegmentedControl';
import { Slider } from '@openai/apps-sdk-ui/components/Slider';
import { Switch } from '@openai/apps-sdk-ui/components/Switch';
import { ELEMENTS } from '../../data/elements';
import { SOURCE_DATA } from '../../data/periodic_table_source';
import { ChemicalElement } from '../../types';

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
  const [dragOffset, setDragOffset] = useState(0);
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
    if (dragOffset > 80) {
      onOpenChange(false);
    }
    pointerStartY.current = null;
    setDragOffset(0);
    pendingDragOffset.current = 0;
    if (dragRafRef.current) {
      cancelAnimationFrame(dragRafRef.current);
      dragRafRef.current = null;
    }
  };

  const pressureSliderValue = pressure <= 0.0001 ? -4 : Math.log10(pressure);

  const isSliderActive = activeSlider !== null;

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Button color="secondary" variant="soft" pill onClick={() => onOpenChange(true)}>
            Open periodic table
          </Button>
        </div>
      )}

      <section
        className="fixed inset-x-0 bottom-0 z-40 px-2 pb-1"
        style={{
          transform: `translateY(${isOpen ? dragOffset : 580}px)`,
          transition: pointerStartY.current ? 'none' : 'transform 180ms cubic-bezier(0.2, 0.8, 0.2, 1)',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="mx-auto w-full max-w-5xl rounded-t-3xl border border-default bg-surface-elevated px-2 pb-2 pt-2 shadow-2xl sm:p-3">
          <div
            className="mx-auto mb-1 flex w-full max-w-xl cursor-grab touch-none flex-col items-center"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
            style={{ touchAction: 'none' }}
          >
            <div className="mb-1 h-1.5 w-14 rounded-full bg-border" />
            <Button color="secondary" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </div>

          <div className="mb-2 flex items-start justify-between gap-2">
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

          <div className="mb-2 rounded-xl border border-subtle bg-surface p-2">
            <div className="mb-2 flex items-center justify-between gap-2">
              <p className="text-2xs text-secondary">Temperature (K)</p>
              <Badge color="secondary" variant="outline" size="sm">
                {Math.round(temperature)} K
              </Badge>
            </div>
            <div
              onPointerDown={() => setActiveSlider('temperature')}
              onPointerUp={() => setActiveSlider(null)}
              onPointerCancel={() => setActiveSlider(null)}
            >
              <Slider value={temperature} min={0} max={6000} step={10} onChange={setTemperature} />
            </div>

            <div className={`${activeSlider === 'temperature' ? 'opacity-0 pointer-events-none h-0 overflow-hidden' : 'mt-2'}`}>
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-2xs text-secondary">Pressure (Pa, log)</p>
                <Badge color="secondary" variant="outline" size="sm">
                  {pressure.toExponential(2)} Pa
                </Badge>
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
                  onChange={(value) => setPressure(value <= -3.9 ? 0 : Math.pow(10, value))}
                />
              </div>
            </div>
          </div>

          <div className="mb-1 flex justify-end">
            <Switch checked={showParticles} onCheckedChange={setShowParticles} label="X-Ray Vision" size="sm" />
          </div>

          <div className={`${isSliderActive ? 'opacity-0 pointer-events-none' : 'opacity-100'} transition-opacity duration-100`}>
            <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] grid-rows-[repeat(10,minmax(0,auto))] gap-[2px] sm:gap-1">
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
                    className="!relative !aspect-square !h-[2.1rem] sm:!h-8 !w-full !min-w-0 !rounded-md !px-0 !py-0 !gap-0 !text-center"
                    style={{ gridColumn: position.xpos, gridRow: position.ypos }}
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
