import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button } from '@openai/apps-sdk-ui/components/Button';
import { ChevronDown } from '@openai/apps-sdk-ui/components/Icon';
import { Popover } from '@openai/apps-sdk-ui/components/Popover';
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

const CATEGORY_BY_SYMBOL = new Map<string, string>(
  SOURCE_DATA.elements
    .filter((entry) => typeof entry.symbol === 'string')
    .map((entry) => [entry.symbol, typeof entry.category === 'string' ? entry.category.toLowerCase() : '']),
);

const AMETAIS = new Set(['H', 'C', 'N', 'O', 'P', 'S', 'Se']);
const METAIS_ALCALINOS = new Set(['Li', 'Na', 'K', 'Rb', 'Cs', 'Fr']);
const METAIS_ALCALINOS_TERROSOS = new Set(['Be', 'Mg', 'Ca', 'Sr', 'Ba', 'Ra']);
const GASES_NOBRES = new Set(['He', 'Ne', 'Ar', 'Kr', 'Xe', 'Rn', 'Og']);
const HALOGENIOS = new Set(['F', 'Cl', 'Br', 'I', 'At', 'Ts']);
const SEMIMETAIS = new Set(['B', 'Si', 'Ge', 'As', 'Sb', 'Te', 'Po']);
const OUTROS_METAIS = new Set(['Al', 'Ga', 'In', 'Sn', 'Tl', 'Pb', 'Bi', 'Nh', 'Fl', 'Mc', 'Lv']);

type ElementTone =
  | 'ametais'
  | 'metaisAlcalinos'
  | 'metaisAlcalinoTerrosos'
  | 'gasesNobres'
  | 'halogenios'
  | 'semimetais'
  | 'outrosMetais'
  | 'lantanideos'
  | 'actinidios'
  | 'metaisTransicao';

type ToneStyle = {
  base: string;
  hover: string;
  active: string;
  ring: string;
};

const TONE_STYLES: Record<ElementTone, ToneStyle> = {
  ametais: {
    base: 'var(--green-100)',
    hover: 'var(--green-200)',
    active: 'var(--green-300)',
    ring: '#0f5132',
  },
  metaisAlcalinos: {
    base: 'var(--orange-200)',
    hover: 'var(--orange-300)',
    active: 'var(--orange-400)',
    ring: '#7a3c14',
  },
  metaisAlcalinoTerrosos: {
    base: 'var(--yellow-200)',
    hover: 'var(--yellow-300)',
    active: 'var(--yellow-400)',
    ring: '#6f5500',
  },
  gasesNobres: {
    base: 'var(--blue-200)',
    hover: 'var(--blue-300)',
    active: 'var(--blue-400)',
    ring: '#104f95',
  },
  halogenios: {
    base: 'var(--blue-100)',
    hover: 'var(--blue-200)',
    active: 'var(--blue-300)',
    ring: '#1e5f9f',
  },
  semimetais: {
    base: 'color-mix(in oklab, var(--blue-200) 72%, var(--green-100) 28%)',
    hover: 'color-mix(in oklab, var(--blue-300) 72%, var(--green-200) 28%)',
    active: 'color-mix(in oklab, var(--blue-400) 72%, var(--green-300) 28%)',
    ring: '#0f5f6e',
  },
  outrosMetais: {
    base: 'var(--gray-150)',
    hover: 'var(--gray-200)',
    active: 'var(--gray-250)',
    ring: '#6d6d6d',
  },
  lantanideos: {
    base: 'var(--blue-75)',
    hover: 'var(--blue-100)',
    active: 'var(--blue-200)',
    ring: '#3f6fa9',
  },
  actinidios: {
    base: 'var(--purple-200)',
    hover: 'var(--purple-300)',
    active: 'var(--purple-400)',
    ring: '#5b3c8a',
  },
  metaisTransicao: {
    base: 'var(--red-100)',
    hover: 'var(--red-200)',
    active: 'var(--red-300)',
    ring: '#8d3b38',
  },
};

const LEGEND_ITEMS: Array<{ tone: ElementTone; label: string }> = [
  { tone: 'ametais', label: 'Verde claro - Ametais' },
  { tone: 'metaisAlcalinos', label: 'Laranja - Metais alcalinos' },
  { tone: 'metaisAlcalinoTerrosos', label: 'Amarelo - Metais alcalino-terrosos' },
  { tone: 'gasesNobres', label: 'Azul - Gases nobres' },
  { tone: 'halogenios', label: 'Azul-claro - Halogenios' },
  { tone: 'semimetais', label: 'Azul-ciano - Semimetais' },
  { tone: 'outrosMetais', label: 'Cinza - Outros metais' },
  { tone: 'lantanideos', label: 'Azul bebe - Lantanideos' },
  { tone: 'actinidios', label: 'Roxo - Actinidios' },
  { tone: 'metaisTransicao', label: 'Vermelho-claro - Metais de transicao' },
];

type PeriodicCellStyle = React.CSSProperties & {
  '--button-background-color'?: string;
  '--button-background-color-hover'?: string;
  '--button-background-color-active'?: string;
  '--button-text-color'?: string;
  '--button-ring-color'?: string;
  '--periodic-cell-muted'?: string;
};

type LegendSwatchStyle = React.CSSProperties & {
  '--legend-swatch-color'?: string;
};

type PreviewAvatarStyle = React.CSSProperties & {
  '--preview-avatar-color'?: string;
};

const getElementTone = (symbol: string, position: { xpos: number; ypos: number }): ElementTone => {
  if (AMETAIS.has(symbol)) return 'ametais';
  if (METAIS_ALCALINOS.has(symbol)) return 'metaisAlcalinos';
  if (METAIS_ALCALINOS_TERROSOS.has(symbol)) return 'metaisAlcalinoTerrosos';
  if (GASES_NOBRES.has(symbol)) return 'gasesNobres';
  if (HALOGENIOS.has(symbol)) return 'halogenios';
  if (SEMIMETAIS.has(symbol)) return 'semimetais';
  if (OUTROS_METAIS.has(symbol)) return 'outrosMetais';
  if (position.ypos === 9) return 'lantanideos';
  if (position.ypos === 10) return 'actinidios';

  const sourceCategory = CATEGORY_BY_SYMBOL.get(symbol) ?? '';
  if (sourceCategory.includes('transition metal')) return 'metaisTransicao';

  return 'metaisTransicao';
};

const getToneStyleBySymbol = (symbol: string): ToneStyle | null => {
  const position = POSITION_BY_SYMBOL.get(symbol);
  if (!position) return null;
  return TONE_STYLES[getElementTone(symbol, position)];
};

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
        <div className="periodic-sheet periodic-sheet-surface mx-auto w-full max-w-5xl rounded-t-3xl border border-default shadow-2xl sm:p-3">
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
          <div className="mb-0.5 flex justify-center">
            <Button color="secondary" variant="ghost" size="sm" onClick={() => onOpenChange(false)}>
              <ChevronDown className="size-4" />
              Hide
            </Button>
          </div>

          <div className={`mb-1 flex justify-end ${isSliderActive ? 'pointer-events-none' : ''}`}>
            <Switch checked={showParticles} onCheckedChange={setShowParticles} label="X-Ray Vision" size="sm" />
          </div>

          <div className="mb-1 rounded-xl border border-subtle bg-surface p-2">
            <div
              className={isSliderActive && activeSlider !== 'temperature' ? 'pointer-events-none opacity-0 invisible' : ''}
            >
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
                  trackColor="var(--red-100)"
                  rangeColor="var(--red-500)"
                  onChange={setTemperature}
                />
              </div>
            </div>

            <div
              className={`mt-1.5 ${isSliderActive && activeSlider !== 'pressure' ? 'pointer-events-none opacity-0 invisible' : ''}`}
            >
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
                  trackColor="var(--purple-100)"
                  rangeColor="var(--purple-500)"
                  onChange={(value) => setPressure(value <= -3.9 ? 0 : Math.pow(10, value))}
                />
              </div>
            </div>
          </div>

          <div className={`relative mb-1.5 flex items-center justify-between gap-2 ${isSliderActive ? 'pointer-events-none' : ''}`}>
            <div className="pointer-events-none absolute left-1/2 top-1/2 z-10 -translate-x-1/2 -translate-y-1/2">
              <div className="pointer-events-auto">
                <Popover>
                  <Popover.Trigger>
                    <Button color="secondary" variant="outline" size="sm">
                      Legenda
                    </Button>
                  </Popover.Trigger>
                  <Popover.Content
                    side="top"
                    align="center"
                    sideOffset={8}
                    minWidth={260}
                    maxWidth={320}
                    className="periodic-legend-popover"
                  >
                    <div className="p-3">
                      <ul className="periodic-legend-list">
                        {LEGEND_ITEMS.map((item) => (
                          <li key={item.label} className="periodic-legend-item">
                            <span
                              className="periodic-legend-swatch"
                              style={{ '--legend-swatch-color': TONE_STYLES[item.tone].base } as LegendSwatchStyle}
                            />
                            <p className="periodic-legend-label">{item.label}</p>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </Popover.Content>
                </Popover>
              </div>
            </div>
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
                {selectedPreview.map((element) => {
                  const toneStyle = getToneStyleBySymbol(element.symbol);
                  const avatarStyle: PreviewAvatarStyle | undefined = toneStyle
                    ? { '--preview-avatar-color': toneStyle.base }
                    : undefined;

                  return (
                    <span
                      key={element.atomicNumber}
                      className="periodic-preview-avatar flex size-6 items-center justify-center rounded-full border border-default text-[10px] font-semibold"
                      style={avatarStyle}
                      title={element.name}
                    >
                      {element.symbol}
                    </span>
                  );
                })}
              </div>
              <Badge color={isMultiSelect ? 'info' : 'secondary'} variant="soft">
                {selectedElements.length}/6
              </Badge>
            </div>
          </div>

          <div className={isSliderActive ? 'pointer-events-none' : ''}>
            <div className="periodic-grid">
              {visibleElements.map((el) => {
                const position = POSITION_BY_SYMBOL.get(el.symbol);
                if (!position) return null;

                const isSelected = selectedElements.some((selected) => selected.atomicNumber === el.atomicNumber);
                const selectionIndex = selectedElements.findIndex(
                  (selected) => selected.atomicNumber === el.atomicNumber,
                );
                const tone = getElementTone(el.symbol, position);
                const toneStyle = TONE_STYLES[tone];
                const cellStyle: PeriodicCellStyle = {
                  gridColumn: position.xpos,
                  gridRow: position.ypos,
                  marginTop: position.ypos === 9 ? '12px' : position.ypos === 10 ? '3px' : undefined,
                  '--button-background-color': toneStyle.base,
                  '--button-background-color-hover': toneStyle.hover,
                  '--button-background-color-active': toneStyle.active,
                  '--button-text-color': '#111111',
                  '--button-ring-color': toneStyle.ring,
                  '--periodic-cell-muted': 'color-mix(in oklab, #111111 62%, transparent)',
                };

                return (
                  <Button
                    key={el.atomicNumber}
                    color="secondary"
                    variant="solid"
                    size="sm"
                    onClick={() => onSelect(el)}
                    className={`periodic-cell ${isSelected ? 'periodic-cell-selected' : ''}`}
                    style={cellStyle}
                  >
                    {isSelected && <span className="periodic-cell-selection-ring" aria-hidden />}
                    <span
                      className="pointer-events-none absolute left-1 top-1 text-[8px] leading-none"
                      style={{ color: 'var(--periodic-cell-muted)' }}
                    >
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
