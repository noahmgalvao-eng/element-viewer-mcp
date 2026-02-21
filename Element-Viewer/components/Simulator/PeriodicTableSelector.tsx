import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Avatar, AvatarGroup } from '@openai/apps-sdk-ui/components/Avatar';
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
    .filter(
      (entry) =>
        typeof entry.symbol === 'string' &&
        typeof entry.xpos === 'number' &&
        typeof entry.ypos === 'number',
    )
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
  const sheetRef = useRef<HTMLElement | null>(null);
  const dragStartYRef = useRef<number | null>(null);
  const dragOffsetRef = useRef(0);
  const rafRef = useRef<number | null>(null);

  const pressureSliderValue = pressure <= 0.0001 ? -4 : Math.log10(pressure);
  const pressureLabel = `${(pressure / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kPa`;

  const applySheetTransform = (offsetY: number, animated: boolean) => {
    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = animated ? 'transform 220ms ease' : 'none';
    sheet.style.transform = `translateY(${offsetY}px)`;
  };

  useEffect(() => {
    if (isOpen) {
      applySheetTransform(0, true);
      return;
    }

    const sheet = sheetRef.current;
    if (!sheet) return;
    sheet.style.transition = 'transform 220ms ease';
    sheet.style.transform = `translateY(${Math.ceil(sheet.getBoundingClientRect().height) + 24}px)`;
  }, [isOpen]);

  useEffect(() => {
    if (!activeSlider) return;

    const finishSliderInteraction = () => {
      setActiveSlider(null);
    };

    window.addEventListener('pointerup', finishSliderInteraction);
    window.addEventListener('pointercancel', finishSliderInteraction);

    return () => {
      window.removeEventListener('pointerup', finishSliderInteraction);
      window.removeEventListener('pointercancel', finishSliderInteraction);
    };
  }, [activeSlider]);

  const onSheetPointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!isOpen) return;
    dragStartYRef.current = event.clientY;
    dragOffsetRef.current = 0;
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const onSheetPointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    const nextOffset = Math.max(0, event.clientY - dragStartYRef.current);
    dragOffsetRef.current = nextOffset;

    if (rafRef.current !== null) cancelAnimationFrame(rafRef.current);
    rafRef.current = requestAnimationFrame(() => {
      applySheetTransform(nextOffset, false);
    });
  };

  const onSheetPointerEnd = (event: React.PointerEvent<HTMLDivElement>) => {
    if (dragStartYRef.current === null) return;
    event.currentTarget.releasePointerCapture(event.pointerId);

    const shouldClose = dragOffsetRef.current > 92;
    dragStartYRef.current = null;

    if (shouldClose) {
      onOpenChange(false);
      return;
    }

    dragOffsetRef.current = 0;
    applySheetTransform(0, true);
  };

  const openSheet = () => {
    onOpenChange(true);
  };

  return (
    <>
      {!isOpen && (
        <div className="fixed bottom-4 left-1/2 z-40 -translate-x-1/2">
          <Button color="secondary" variant="soft" pill onClick={openSheet}>
            Open periodic table
          </Button>
        </div>
      )}

      <section
        ref={sheetRef}
        className="fixed inset-x-0 bottom-0 z-40 px-1.5 pb-1.5 md:px-2 md:pb-2"
        style={{
          transform: 'translateY(0px)',
          pointerEvents: isOpen ? 'auto' : 'none',
          touchAction: 'none',
        }}
      >
        <div className="mx-auto w-full max-w-5xl rounded-t-3xl border border-default bg-surface-elevated px-2 pb-1.5 pt-2 shadow-2xl md:px-3 md:pb-2">
          <div
            className="mx-auto mb-1.5 flex w-full max-w-xl cursor-grab touch-none flex-col items-center"
            onPointerDown={onSheetPointerDown}
            onPointerMove={onSheetPointerMove}
            onPointerUp={onSheetPointerEnd}
            onPointerCancel={onSheetPointerEnd}
          >
            <div className="mb-1 h-1.5 w-14 rounded-full bg-border" />
            <Button color="secondary" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </div>

          <div className="mb-1.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <SegmentedControl
                aria-label="Selection mode"
                value={isMultiSelect ? 'compare' : 'single'}
                onChange={(next) => {
                  if ((next === 'compare') !== isMultiSelect) onToggleMultiSelect();
                }}
              >
                <SegmentedControl.Option value="single">Single</SegmentedControl.Option>
                <SegmentedControl.Option value="compare">Compare</SegmentedControl.Option>
              </SegmentedControl>

              <Badge color={isMultiSelect ? 'info' : 'secondary'} variant="soft">
                {selectedElements.length}/6
              </Badge>

              <AvatarGroup size={22}>
                {selectedElements.map((el) => (
                  <Avatar key={el.atomicNumber} name={el.symbol} size={22} color="info" variant="soft" />
                ))}
              </AvatarGroup>
            </div>

            <Switch
              checked={showParticles}
              onCheckedChange={setShowParticles}
              label="X-Ray"
              size="sm"
            />
          </div>

          <div
            className={`grid grid-cols-[repeat(18,minmax(0,1fr))] grid-rows-[repeat(10,minmax(0,1fr))] gap-x-[2px] gap-y-[1px] md:gap-x-1 md:gap-y-0.5 ${
              activeSlider ? 'opacity-0 pointer-events-none' : 'opacity-100'
            }`}
          >
            <div className="col-start-4 col-end-16 row-start-1 row-end-2 rounded-lg border border-subtle bg-surface/95 px-2 py-1">
              <div
                className="mb-1"
                onPointerDown={() => setActiveSlider('temperature')}
                onPointerUp={() => setActiveSlider(null)}
                onPointerCancel={() => setActiveSlider(null)}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <p className="text-2xs text-secondary">Temperature</p>
                  <span className="text-2xs text-default">{Math.round(temperature)} K</span>
                </div>
                <Slider value={temperature} min={0} max={6000} step={10} onChange={setTemperature} />
              </div>

              <div
                onPointerDown={() => setActiveSlider('pressure')}
                onPointerUp={() => setActiveSlider(null)}
                onPointerCancel={() => setActiveSlider(null)}
              >
                <div className="mb-0.5 flex items-center justify-between">
                  <p className="text-2xs text-secondary">Pressure</p>
                  <span className="text-2xs text-default">{pressureLabel}</span>
                </div>
                <Slider
                  value={pressureSliderValue}
                  min={-4}
                  max={11}
                  step={0.05}
                  onChange={(value) => setPressure(value <= -3.9 ? 0 : Math.pow(10, value))}
                />
              </div>
            </div>

            {ELEMENTS.map((el) => {
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
                  className="!relative !aspect-square !h-auto !w-full !min-w-0 !rounded-md !px-0 !py-0 !gap-0 !items-center !justify-center"
                  style={{ gridColumn: position.xpos, gridRow: position.ypos }}
                >
                  <span className="pointer-events-none absolute left-0.5 top-0 text-[8px] leading-none text-tertiary">
                    {el.atomicNumber}
                  </span>
                  <span className="text-2xs font-semibold leading-none">{el.symbol}</span>

                  {isMultiSelect && isSelected && (
                    <span className="pointer-events-none absolute -bottom-[2px] left-1/2 flex size-3.5 -translate-x-1/2 items-center justify-center rounded-full bg-info text-[8px] font-semibold text-white shadow-sm">
                      {selectionIndex + 1}
                    </span>
                  )}
                </Button>
              );
            })}
          </div>

          {activeSlider && (
            <div className="rounded-xl border border-subtle bg-surface p-3">
              {activeSlider === 'temperature' ? (
                <div
                  onPointerDown={() => setActiveSlider('temperature')}
                  onPointerUp={() => setActiveSlider(null)}
                  onPointerCancel={() => setActiveSlider(null)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs text-secondary">Temperature</p>
                    <Badge color="secondary" variant="outline">
                      {Math.round(temperature)} K
                    </Badge>
                  </div>
                  <Slider value={temperature} min={0} max={6000} step={10} onChange={setTemperature} />
                </div>
              ) : (
                <div
                  onPointerDown={() => setActiveSlider('pressure')}
                  onPointerUp={() => setActiveSlider(null)}
                  onPointerCancel={() => setActiveSlider(null)}
                >
                  <div className="mb-1 flex items-center justify-between">
                    <p className="text-xs text-secondary">Pressure</p>
                    <Badge color="secondary" variant="outline">
                      {pressureLabel}
                    </Badge>
                  </div>
                  <Slider
                    value={pressureSliderValue}
                    min={-4}
                    max={11}
                    step={0.05}
                    onChange={(value) => setPressure(value <= -3.9 ? 0 : Math.pow(10, value))}
                  />
                </div>
              )}
            </div>
          )}
        </div>
      </section>
    </>
  );
};

export default PeriodicTableSelector;
