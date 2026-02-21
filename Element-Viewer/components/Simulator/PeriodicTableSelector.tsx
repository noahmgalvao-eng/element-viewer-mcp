import React, { useMemo, useRef, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { Search, ChevronDown } from '@openai/apps-sdk-ui/components/Icon';
import { Input } from '@openai/apps-sdk-ui/components/Input';
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
  const [searchValue, setSearchValue] = useState('');
  const [dragOffset, setDragOffset] = useState(0);
  const pointerStartY = useRef<number | null>(null);

  const filteredElements = useMemo(() => {
    const query = searchValue.trim().toLowerCase();
    if (!query) return ELEMENTS;
    return ELEMENTS.filter(
      (el) => el.symbol.toLowerCase().includes(query) || el.name.toLowerCase().includes(query),
    );
  }, [searchValue]);

  const handleDragStart = (event: React.PointerEvent<HTMLDivElement>) => {
    pointerStartY.current = event.clientY;
  };

  const handleDragMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (pointerStartY.current === null) return;
    const delta = event.clientY - pointerStartY.current;
    setDragOffset(Math.max(0, delta));
  };

  const handleDragEnd = () => {
    if (dragOffset > 80) {
      onOpenChange(false);
    }
    pointerStartY.current = null;
    setDragOffset(0);
  };

  const pressureSliderValue = pressure <= 0.0001 ? -4 : Math.log10(pressure);

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
        className="fixed inset-x-0 bottom-0 z-40 px-2 pb-2"
        style={{
          transform: `translateY(${isOpen ? dragOffset : 580}px)`,
          transition: pointerStartY.current ? 'none' : 'transform 220ms ease',
          pointerEvents: isOpen ? 'auto' : 'none',
        }}
      >
        <div className="mx-auto w-full max-w-5xl rounded-t-3xl border border-default bg-surface-elevated p-3 shadow-2xl">
          <div
            className="mx-auto mb-2 flex w-full max-w-xl cursor-grab touch-none flex-col items-center"
            onPointerDown={handleDragStart}
            onPointerMove={handleDragMove}
            onPointerUp={handleDragEnd}
            onPointerCancel={handleDragEnd}
          >
            <div className="mb-1 h-1.5 w-14 rounded-full bg-border" />
            <Button color="secondary" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </div>

          <div className="mb-2 flex items-center justify-between gap-2">
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
            <Badge color={isMultiSelect ? 'info' : 'secondary'} variant="soft">
              {selectedElements.length}/6
            </Badge>
          </div>

          <Input
            value={searchValue}
            onChange={(event) => setSearchValue(event.target.value)}
            placeholder="Search by name or symbol"
            startAdornment={<Search className="size-4 text-secondary" />}
            className="mb-2"
          />

          <div className="grid grid-cols-[repeat(18,minmax(0,1fr))] grid-rows-[repeat(12,minmax(0,1fr))] gap-1">
            <div className="col-start-4 col-end-16 row-start-1 row-end-4 rounded-xl border border-subtle bg-surface p-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <p className="text-2xs text-secondary">Temperature (K)</p>
                  <Slider value={temperature} min={0} max={6000} step={10} onChange={setTemperature} />
                </div>
                <div>
                  <p className="text-2xs text-secondary">Pressure (Pa, log)</p>
                  <Slider
                    value={pressureSliderValue}
                    min={-4}
                    max={11}
                    step={0.05}
                    onChange={(value) => setPressure(value <= -3.9 ? 0 : Math.pow(10, value))}
                  />
                </div>
              </div>
              <div className="mt-1">
                <Switch checked={showParticles} onCheckedChange={setShowParticles} label="X-Ray Vision" size="sm" />
              </div>
            </div>

            {filteredElements.map((el) => {
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
                  className="!relative !h-8 !min-w-0 !rounded-md !px-0.5 !py-0 !gap-0 !text-center"
                  style={{ gridColumn: position.xpos, gridRow: position.ypos }}
                >
                  <span className="pointer-events-none absolute left-0.5 top-0 text-[9px] leading-none text-tertiary">
                    {el.atomicNumber}
                  </span>
                  <span className="text-2xs font-semibold leading-none">{el.symbol}</span>
                  {isMultiSelect && isSelected && (
                    <Badge
                      color="info"
                      variant="outline"
                      size="sm"
                      className="!pointer-events-none !absolute bottom-0 right-0 !min-w-0 !px-1 !text-[9px]"
                    >
                      {selectionIndex + 1}
                    </Badge>
                  )}
                </Button>
              );
            })}
          </div>
        </div>
      </section>
    </>
  );
};

export default PeriodicTableSelector;
