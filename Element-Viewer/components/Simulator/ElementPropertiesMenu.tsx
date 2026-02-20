import React, { useMemo, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button, ButtonLink } from '@openai/apps-sdk-ui/components/Button';
import { CopyTooltip } from '@openai/apps-sdk-ui/components/Tooltip';
import {
  ArrowUp,
  CloseBold,
  ExternalLink,
  MoreCircleMenuDots,
} from '@openai/apps-sdk-ui/components/Icon';
import { Markdown } from '@openai/apps-sdk-ui/components/Markdown';
import { Popover } from '@openai/apps-sdk-ui/components/Popover';
import { TextLink } from '@openai/apps-sdk-ui/components/TextLink';
import { Tooltip } from '@openai/apps-sdk-ui/components/Tooltip';
import { ChemicalElement, PhysicsState } from '../../types';
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

interface PropertyItem {
  label: string;
  value: string;
  unit?: string;
  sourceId?: number;
  estimated?: boolean;
  renderedValue?: React.ReactNode;
}

interface ReferenceItem {
  id: number;
  text: string;
  href?: string;
}

const FIXED_REFERENCES: ReferenceItem[] = [
  {
    id: 2,
    text: 'L. M. Mentel, mendeleev - A Python resource for properties of chemical elements, ions and isotopes.',
    href: 'https://github.com/lmmentel/mendeleev',
  },
  {
    id: 3,
    text: 'Servicos de dados fornecidos pelo PubChem PUG-REST API.',
  },
  {
    id: 4,
    text: 'Angstrom Sciences, Inc. (2026). Magnetron Sputtering Reference.',
    href: 'https://www.angstromsciences.com/magnetron-sputtering-reference',
  },
  {
    id: 5,
    text: 'Wolfram Research, Inc. (2026). ElementData curated properties.',
    href: 'https://periodictable.com',
  },
  {
    id: 6,
    text: 'Wikipedia contributors. (2025). Template:Periodic table (melting point).',
    href: 'https://en.wikipedia.org/wiki/Template:Periodic_table_(melting_point)',
  },
  {
    id: 7,
    text: 'Wikipedia contributors. (2026). Boiling points of the elements (data page).',
    href: 'https://en.wikipedia.org/wiki/Boiling_points_of_the_elements_(data_page)',
  },
  {
    id: 8,
    text: 'Wikipedia contributors. (2026). Melting points of the elements (data page).',
    href: 'https://en.wikipedia.org/wiki/Melting_points_of_the_elements_(data_page)',
  },
  {
    id: 9,
    text: 'Wikipedia contributors. (2024). Template:Infobox oganesson.',
    href: 'https://en.wikipedia.org/wiki/Template:Infobox_oganesson',
  },
  {
    id: 10,
    text: 'Thermodynamics of the Elements: Consolidated Master Table of All 118 Chemical Elements. (2026).',
  },
  {
    id: 11,
    text: 'Helmenstine, A. (2023). Triple Point Definition - Triple Point of Water.',
    href: 'https://sciencenotes.org/triple-point-of-water/',
  },
  {
    id: 12,
    text: 'Thermodynamics of the Elements: Critical temperature and critical pressure master table. (2026).',
  },
];

const SUPERSCRIPT_MAP: Record<string, string> = {
  '0': '\u2070',
  '1': '\u00b9',
  '2': '\u00b2',
  '3': '\u00b3',
  '4': '\u2074',
  '5': '\u2075',
  '6': '\u2076',
  '7': '\u2077',
  '8': '\u2078',
  '9': '\u2079',
};

const TOOLTIP_CLASS = 'tooltip-solid';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const formatNumber = (value: number, maxFractionDigits = 4) =>
  value.toLocaleString(undefined, { maximumFractionDigits: maxFractionDigits });

const cleanStringValue = (value: string) => value.replace(/\u00c2/g, '').trim();

const escapeRegex = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

const parseDisplayValue = (
  rawValue: string | number | undefined,
  unit?: string,
  fallbackNumber?: number,
) => {
  try {
    if (typeof rawValue === 'number' && Number.isFinite(rawValue)) {
      return { value: formatNumber(rawValue), estimated: false, na: false };
    }

    if (typeof rawValue === 'string') {
      const normalized = cleanStringValue(rawValue);
      if (!normalized || normalized.toUpperCase() === 'N/A') {
        return { value: 'N/A', estimated: false, na: true };
      }

      const estimated = normalized.includes('*');
      let value = normalized.replace(/\*/g, '').trim();
      if (unit && value) {
        const unitPattern = new RegExp(`\\s*${escapeRegex(unit)}$`, 'i');
        value = value.replace(unitPattern, '').trim();
      }

      if (!value || value.toUpperCase() === 'N/A') {
        return { value: 'N/A', estimated: false, na: true };
      }

      return { value, estimated, na: false };
    }

    if (typeof fallbackNumber === 'number' && Number.isFinite(fallbackNumber)) {
      return { value: formatNumber(fallbackNumber), estimated: false, na: false };
    }
  } catch {
    return { value: 'N/A', estimated: false, na: true };
  }

  return { value: 'N/A', estimated: false, na: true };
};

const formatElectronConfiguration = (config?: string) => {
  try {
    if (!config || config.trim() === '' || config.trim().toUpperCase() === 'N/A') return 'N/A';

    const tokens = config.trim().split(/\s+/);
    return tokens.map((token, index) => {
      const match = token.match(/^(\d+[spdfghijklm])(\d+)$/i);
      const spacer = index < tokens.length - 1 ? ' ' : '';

      if (!match) return `${token}${spacer}`;

      const exponent = match[2]
        .split('')
        .map((digit) => SUPERSCRIPT_MAP[digit] || digit)
        .join('');

      return `${match[1]}${exponent}${spacer}`;
    });
  } catch {
    return config || 'N/A';
  }
};

const PropertyCard: React.FC<{ item: PropertyItem }> = ({ item }) => {
  const isNA = item.value === 'N/A';
  const finalText = isNA ? 'N/A' : `${item.value}${item.unit ? ` ${item.unit}` : ''}`;

  return (
    <div className="rounded-xl border border-subtle bg-surface-secondary p-2.5">
      <p className="break-words text-3xs uppercase tracking-wide text-secondary">{item.label}</p>
      <div className="mt-1 flex flex-wrap items-center gap-1.5 text-3xs text-tertiary">
        {typeof item.sourceId === 'number' && <span>[{item.sourceId}]</span>}
        {item.estimated && <span>*estimado</span>}
      </div>
      <div className="mt-1 break-words text-xs font-mono leading-snug text-default">
        {item.renderedValue && !isNA ? item.renderedValue : finalText}
      </div>
    </div>
  );
};

const ElementPropertiesMenu: React.FC<Props> = ({ data, onClose, onSetTemperature, onSetPressure }) => {
  const { element, physicsState, x, y } = data;
  const [useScientific, setUseScientific] = useState(false);
  const [showFullDescription, setShowFullDescription] = useState(false);

  const sourceInfo = SOURCE_DATA.elements.find((entry) => entry.symbol === element.symbol) as
    | Record<string, any>
    | undefined;
  const periodicSourceRef = sourceInfo ? 1 : undefined;
  const wikiUrl = typeof sourceInfo?.source === 'string'
    ? sourceInfo.source
    : 'https://en.wikipedia.org/wiki/Periodic_table';

  const fmt = (value: number, unit = '') =>
    useScientific
      ? `${value.toExponential(4)}${unit}`
      : `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}${unit}`;

  const triplePoint = element.properties.triplePoint;
  const criticalPoint = element.properties.criticalPoint;
  const hasTriplePoint = Boolean(triplePoint && triplePoint.tempK > 0 && triplePoint.pressurePa > 0);
  const hasCriticalPoint = Boolean(criticalPoint && criticalPoint.tempK > 0 && criticalPoint.pressurePa > 0);

  const sourceIds = useMemo(() => {
    const values = [
      element.properties.meltingPointSource,
      element.properties.boilingPointSource,
      element.properties.densitySource,
      element.properties.atomicRadiusSource,
      element.properties.thermalConductivitySource,
      element.properties.specificHeatSolidSource,
      element.properties.specificHeatLiquidSource,
      element.properties.specificHeatGasSource,
      element.properties.latentHeatFusionSource,
      element.properties.latentHeatVaporizationSource,
      element.properties.electronegativitySource,
      element.properties.electronAffinitySource,
      element.properties.ionizationEnergySource,
      element.properties.triplePointSource,
      element.properties.criticalPointSource,
    ].filter((id): id is number => typeof id === 'number' && Number.isFinite(id));

    return Array.from(new Set(values)).sort((a, b) => a - b);
  }, [element.properties]);

  const references = useMemo<ReferenceItem[]>(() => {
    const items: ReferenceItem[] = [];

    if (typeof sourceInfo?.source === 'string') {
      items.push({ label: 'Página principal do elemento', href: sourceInfo.source });
    }
    if (typeof sourceInfo?.spectral_img === 'string') {
      items.push({ label: 'Imagem espectral', href: sourceInfo.spectral_img });
    }
    if (typeof sourceInfo?.bohr_model_image === 'string') {
      items.push({ label: 'Imagem do modelo de Bohr', href: sourceInfo.bohr_model_image });
    }
    if (typeof sourceInfo?.bohr_model_3d === 'string') {
      items.push({ label: 'Modelo 3D de Bohr', href: sourceInfo.bohr_model_3d });
    }
    if (typeof sourceInfo?.image?.url === 'string') {
      items.push({ label: 'Imagem do elemento', href: sourceInfo.image.url });
    }
    if (typeof sourceInfo?.image?.attribution === 'string') {
      items.push({
        label: 'Créditos da imagem',
        note: sourceInfo.image.attribution,
      });
    }

    Array.from({ length: 12 }, (_, index) => index + 1).forEach((id) => {
      const presentForElement = sourceIds.includes(id);
      const sourceLabel = SOURCE_ID_LABELS[id] || `Fonte científica #${id}`;
      items.push({
        label: `Fonte de dado #${id}`,
        note: `${sourceLabel} — referência detectada pelo sufixo _${id} no scientific_data${presentForElement ? '' : ' (sem uso neste elemento)'}`,
      });
    });

    return items;
  }, [sourceInfo, sourceIds]);

  const propertyRows = [
    { label: 'Ponto de fusão', value: element.properties.meltingPointDisplay ?? fmt(element.properties.meltingPointK, ' K'), sourceId: element.properties.meltingPointSource },
    { label: 'Ponto de ebulição', value: element.properties.boilingPointDisplay ?? fmt(element.properties.boilingPointK, ' K'), sourceId: element.properties.boilingPointSource },
    { label: 'Densidade', value: element.properties.densityDisplay ?? (element.properties.density ? `${fmt(element.properties.density * 1000, '')} kg/m³` : 'N/A'), sourceId: element.properties.densitySource },
    { label: 'Raio atômico', value: element.properties.atomicRadiusDisplay ?? (element.properties.atomicRadiusPm ? `${fmt(element.properties.atomicRadiusPm, ' pm')}` : 'N/A'), sourceId: element.properties.atomicRadiusSource },
    { label: 'Eletronegatividade', value: element.properties.electronegativityDisplay ?? (element.properties.electronegativity ? `${element.properties.electronegativity}` : 'N/A'), sourceId: element.properties.electronegativitySource },
    { label: 'Afinidade eletrônica', value: element.properties.electronAffinityDisplay ?? (element.properties.electronAffinity ? `${element.properties.electronAffinity} kJ/mol` : 'N/A'), sourceId: element.properties.electronAffinitySource },
    { label: 'Energia de ionização', value: element.properties.ionizationEnergyDisplay ?? (element.properties.ionizationEnergy ? `${element.properties.ionizationEnergy} kJ/mol` : 'N/A'), sourceId: element.properties.ionizationEnergySource },
    { label: 'Estados de oxidação', value: element.properties.oxidationStatesDisplay ?? (element.properties.oxidationStates?.join(', ') || 'N/A') },
    { label: 'Condutividade térmica', value: element.properties.thermalConductivityDisplay ?? (element.properties.thermalConductivity ? `${element.properties.thermalConductivity} W/mK` : 'N/A'), sourceId: element.properties.thermalConductivitySource },
    { label: 'Condutividade elétrica', value: element.properties.electricalConductivityDisplay ?? (element.properties.electricalConductivity ? `${element.properties.electricalConductivity} S/m` : 'N/A') },
    { label: 'Ponto triplo (T)', value: element.properties.triplePointTempDisplay ?? (triplePoint ? `${triplePoint.tempK} K` : 'N/A'), sourceId: element.properties.triplePointSource },
    { label: 'Ponto triplo (P)', value: element.properties.triplePointPressDisplay ? `${element.properties.triplePointPressDisplay} kPa` : (triplePoint ? `${fmt(triplePoint.pressurePa / 1000, '')} kPa` : 'N/A'), sourceId: element.properties.triplePointSource },
    { label: 'Ponto crítico (T)', value: element.properties.criticalPointTempDisplay ? `${element.properties.criticalPointTempDisplay} K` : (criticalPoint ? `${criticalPoint.tempK} K` : 'N/A'), sourceId: element.properties.criticalPointSource },
    { label: 'Ponto crítico (P)', value: element.properties.criticalPointPressDisplay ? `${element.properties.criticalPointPressDisplay} kPa` : (criticalPoint ? `${fmt(criticalPoint.pressurePa / 1000, '')} kPa` : 'N/A'), sourceId: element.properties.criticalPointSource },
  ];

  const descriptionPreview = (element.summary || 'No summary available.').slice(0, 220);
  const hasLongDescription = (element.summary || '').length > 220;

  const side = x > window.innerWidth * 0.6 ? 'left' : 'right';
  const panelWidth = 432;
  const panelLeft = side === 'right'
    ? clamp(x + 12, 8, window.innerWidth - panelWidth)
    : clamp(x - panelWidth, 8, window.innerWidth - panelWidth);
  const panelTop = clamp(y - 24, 8, window.innerHeight - 640);

  return (
    <div className="fixed inset-0 z-[100]" onMouseDown={onClose}>
      <div
        className="pointer-events-auto fixed w-[min(96vw,27rem)] max-h-[min(86vh,40rem)] overflow-y-auto rounded-3xl border border-default bg-surface shadow-xl"
        style={{ left: `${panelLeft}px`, top: `${panelTop}px` }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="space-y-4 p-4">
          <div className="flex items-start justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <CopyTooltip copyValue={element.symbol}>
                  <span>
                    <Badge color="info" variant="soft">
                      {element.symbol}
                    </Badge>
                  </span>
                </CopyTooltip>
                <Badge color="secondary" variant="outline">
                  Atomic #{element.atomicNumber}
                </Badge>
              </div>
              <h3 className="heading-xs text-default">{element.name}</h3>
              <p className="text-xs text-secondary">
                {sourceInfo?.category || element.classification.groupName || 'Generated substance'}
              </p>
            </div>

            <Button color="secondary" variant="ghost" pill uniform onClick={onClose} aria-label="Close details">
              <CloseBold className="size-4" />
            </Button>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Tooltip
              content="Set global temperature to this pressure-adjusted melting point"
              contentClassName={TOOLTIP_CLASS}
            >
              <span>
                <Button
                  color="warning"
                  variant="soft"
                  block
                  onClick={() => onSetTemperature(physicsState.meltingPointCurrent)}
                >
                  <ArrowUp className="size-4" />
                  Melt {fmt(physicsState.meltingPointCurrent, ' K')}
                </Button>
              </span>
            </Tooltip>

            <Tooltip
              content="Set global temperature to this pressure-adjusted boiling point"
              contentClassName={TOOLTIP_CLASS}
            >
              <span>
                <Button
                  color="danger"
                  variant="soft"
                  block
                  disabled={physicsState.boilingPointCurrent >= 49000}
                  onClick={() => onSetTemperature(physicsState.boilingPointCurrent)}
                >
                  <ArrowUp className="size-4" />
                  Boil{' '}
                  {physicsState.boilingPointCurrent >= 49000
                    ? 'undefined'
                    : fmt(physicsState.boilingPointCurrent, ' K')}
                </Button>
              </span>
            </Tooltip>
          </div>

          <Menu>
            <Menu.Trigger>
              <Button color="secondary" variant="outline" block>
                <MoreCircleMenuDots className="size-4" />
                More phase actions
              </Button>
            </Menu.Trigger>
            <Menu.Content minWidth={300} align="start">
              <Menu.Item
                disabled={!hasTriplePoint || !triplePoint}
                onClick={() => {
                  if (!triplePoint) return;
                  onSetTemperature(triplePoint.tempK);
                  onSetPressure(triplePoint.pressurePa);
                }}
              >
                Ir para ponto triplo {hasTriplePoint && triplePoint ? `(${fmt(triplePoint.tempK, ' K')} / ${fmt(triplePoint.pressurePa, ' Pa')})` : '(indisponível)'}
              </Menu.Item>
              <Menu.Item
                disabled={!hasCriticalPoint || !criticalPoint}
                onClick={() => {
                  if (!criticalPoint) return;
                  onSetTemperature(criticalPoint.tempK + 25);
                  onSetPressure(criticalPoint.pressurePa + 1000);
                }}
              >
                Entrar na região supercrítica {hasCriticalPoint && criticalPoint ? `(${fmt(criticalPoint.tempK, ' K')}+)` : '(indisponível)'}
              </Menu.Item>
              <Menu.Item
                disabled={!hasTriplePoint || !triplePoint}
                onClick={() => {
                  if (!triplePoint) return;
                  onSetPressure(Math.max(1, triplePoint.pressurePa / 10));
                  onSetTemperature(Math.max(1, physicsState.sublimationPointCurrent));
                }}
              >
                Forçar regime de sublimação {hasTriplePoint ? '' : '(indisponível)'}
              </Menu.Item>
            </Menu.Content>
          </Menu>

          <div className="space-y-2 rounded-2xl border border-subtle bg-surface p-3">
            <p className="text-xs font-medium text-secondary">Descrição do elemento</p>
            <div className="text-xs text-default">
              <Markdown>{showFullDescription ? (element.summary || 'No summary available.') : `${descriptionPreview}${hasLongDescription ? '…' : ''}`}</Markdown>
            </div>
            {hasLongDescription && (
              <Button color="secondary" variant="ghost" size="sm" onClick={() => setShowFullDescription((prev) => !prev)}>
                {showFullDescription ? 'Ver menos' : 'Ver mais'}
              </Button>
            )}
          </div>

          <div className="space-y-3 rounded-2xl border border-subtle bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-default">Propriedades</p>
              <Button color="secondary" variant="ghost" size="sm" onClick={() => setUseScientific((prev) => !prev)}>
                {useScientific ? 'Notação normal' : 'Notação científica'}
              </Button>
            </div>
            <ul className="space-y-2">
              {propertyRows.map((item) => {
                const value = item.value || 'N/A';
                const isEstimated = value.includes('*');
                return (
                  <li key={item.label} className="rounded-xl border border-subtle bg-surface-secondary px-2 py-1.5">
                    <div className="flex items-center justify-between gap-2">
                      <p className="text-xs text-secondary">{item.label}</p>
                      <div className="flex items-center gap-1">
                        {typeof item.sourceId === 'number' && (
                          <Badge color="secondary" variant="outline">[{item.sourceId}]</Badge>
                        )}
                        {isEstimated && <Badge color="warning" variant="soft">estimado*</Badge>}
                      </div>
                    </div>
                    <p className="text-sm text-default">{value}</p>
                  </li>
                );
              })}
            </ul>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink as="a" href={wikiUrl} external color="secondary" variant="soft" size="sm">
              <ExternalLink className="size-4" />
              Open source page
            </ButtonLink>
            <Button color="secondary" variant="ghost" size="sm" onClick={onClose}>
              <Bolt className="size-4" />
              Close
            </Button>
          </div>

          <Popover>
            <Popover.Trigger>
              <Button color="secondary" variant="soft" block>
                <ExternalLink className="size-4" />
                Ver referências
              </Button>
            </Popover.Trigger>
            <Popover.Content
              side="top"
              align="end"
              sideOffset={8}
              minWidth={300}
              maxWidth={360}
              className="rounded-2xl border border-default bg-surface shadow-lg"
            >
              <div className="max-h-56 space-y-2 overflow-y-auto p-3">
                <p className="text-xs font-medium text-secondary">Referências definidas no app</p>

                {references.length === 0 ? (
                  <p className="text-sm text-tertiary">Nenhuma referência disponível para este elemento.</p>
                ) : (
                  <ul className="space-y-2">
                    {references.map((reference, index) => (
                      <li key={`${reference.label}-${index}`} className="rounded-xl border border-subtle bg-surface-secondary p-2">
                        {reference.href ? (
                          <TextLink as="a" href={reference.href} forceExternal>
                            {reference.label}
                          </TextLink>
                        ) : (
                          <p className="text-sm text-default">{reference.label}</p>
                        )}
                        {reference.note && (
                          <p className="mt-1 break-words text-3xs text-secondary">{reference.note}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </Popover.Content>
          </Popover>
        </div>
      </div>
    </div>
  );
};

export default ElementPropertiesMenu;
