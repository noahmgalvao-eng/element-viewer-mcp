import React, { useMemo, useState } from 'react';
import { Alert } from '@openai/apps-sdk-ui/components/Alert';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Button, ButtonLink } from '@openai/apps-sdk-ui/components/Button';
import { Checkbox } from '@openai/apps-sdk-ui/components/Checkbox';
import { CodeBlock } from '@openai/apps-sdk-ui/components/CodeBlock';
import { CopyTooltip } from '@openai/apps-sdk-ui/components/Tooltip';
import {
  ArrowUp,
  Bolt,
  CloseBold,
  ExternalLink,
  InfoCircle,
  MoreCircleMenuDots,
} from '@openai/apps-sdk-ui/components/Icon';
import { Markdown } from '@openai/apps-sdk-ui/components/Markdown';
import { Menu } from '@openai/apps-sdk-ui/components/Menu';
import { Popover } from '@openai/apps-sdk-ui/components/Popover';
import { TextLink } from '@openai/apps-sdk-ui/components/TextLink';
import { Textarea } from '@openai/apps-sdk-ui/components/Textarea';
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

interface ReferenceItem {
  label: string;
  href?: string;
  note?: string;
}

const SOURCE_ID_LABELS: Record<number, string> = {
  1: 'Wikipedia',
  2: 'Mendeleev',
  3: 'PubChem',
  4: 'Angstrom',
  5: 'Wolfram',
};

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ElementPropertiesMenu: React.FC<Props> = ({ data, onClose, onSetTemperature, onSetPressure }) => {
  const { element, physicsState, x, y } = data;
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useScientific, setUseScientific] = useState(false);
  const [notes, setNotes] = useState('');

  const sourceInfo = SOURCE_DATA.elements.find((entry) => entry.symbol === element.symbol) as
    | Record<string, any>
    | undefined;
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

    sourceIds.forEach((id) => {
      items.push({
        label: `Fonte de dado #${id}`,
        note: SOURCE_ID_LABELS[id] || 'Fonte científica interna do app',
      });
    });

    return items;
  }, [sourceInfo, sourceIds]);

  const quickFactsCode = useMemo(
    () =>
      JSON.stringify(
        {
          symbol: element.symbol,
          name: element.name,
          phase: physicsState.state,
          temperatureK: physicsState.temperature,
          pressurePa: physicsState.pressure,
          meltingPointCurrentK: physicsState.meltingPointCurrent,
          boilingPointCurrentK: physicsState.boilingPointCurrent,
          sublimationPointCurrentK: physicsState.sublimationPointCurrent,
        },
        null,
        2,
      ),
    [element.name, element.symbol, physicsState],
  );

  const side = x > window.innerWidth * 0.6 ? 'left' : 'right';
  const panelLeft = side === 'right'
    ? clamp(x + 12, 8, window.innerWidth - 428)
    : clamp(x - 428, 8, window.innerWidth - 428);
  const panelTop = clamp(y - 24, 8, window.innerHeight - 584);

  return (
    <div className="fixed inset-0 z-[100]" onMouseDown={onClose}>
      <div
        className="pointer-events-auto fixed w-[min(92vw,26rem)] max-h-[min(82vh,36.5rem)] overflow-y-auto rounded-3xl border border-default bg-surface shadow-xl"
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

          <Alert
            color="info"
            variant="soft"
            title="Current phase"
            description={`${physicsState.state} at ${fmt(physicsState.temperature, ' K')} and ${fmt(physicsState.pressure, ' Pa')}`}
          />

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Tooltip content="Set global temperature to this pressure-adjusted melting point">
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

            <Tooltip content="Set global temperature to this pressure-adjusted boiling point">
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
              {hasTriplePoint && triplePoint && (
                <Menu.Item
                  onClick={() => {
                    onSetTemperature(triplePoint.tempK);
                    onSetPressure(triplePoint.pressurePa);
                  }}
                >
                  Go to triple point ({fmt(triplePoint.tempK, ' K')} / {fmt(triplePoint.pressurePa, ' Pa')})
                </Menu.Item>
              )}
              {hasCriticalPoint && criticalPoint && (
                <Menu.Item
                  onClick={() => {
                    onSetTemperature(criticalPoint.tempK + 25);
                    onSetPressure(criticalPoint.pressurePa + 1000);
                  }}
                >
                  Enter supercritical region ({fmt(criticalPoint.tempK, ' K')}+)
                </Menu.Item>
              )}
              {hasTriplePoint && triplePoint && (
                <Menu.Item
                  onClick={() => {
                    onSetPressure(Math.max(1, triplePoint.pressurePa / 10));
                    onSetTemperature(Math.max(1, physicsState.sublimationPointCurrent));
                  }}
                >
                  Force sublimation regime
                </Menu.Item>
              )}
            </Menu.Content>
          </Menu>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Popover>
              <Popover.Trigger>
                <Button color="secondary" variant="soft" block>
                  <InfoCircle className="size-4" />
                  Ver descrição
                </Button>
              </Popover.Trigger>
              <Popover.Content
                side="top"
                align="start"
                sideOffset={8}
                minWidth={300}
                maxWidth={360}
                className="rounded-2xl border border-default bg-surface shadow-lg"
              >
                <div className="max-h-56 space-y-2 overflow-y-auto p-3">
                  <p className="text-xs font-medium text-secondary">Descrição do elemento</p>
                  <Markdown>{element.summary || 'No summary available.'}</Markdown>
                </div>
              </Popover.Content>
            </Popover>

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

          <div className="space-y-2 rounded-2xl border border-subtle bg-surface p-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold text-default">Session notes</p>
              <Badge color="secondary" variant="outline">
                Optional
              </Badge>
            </div>
            <Textarea
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Write temporary notes for this element..."
              rows={3}
              autoResize
              variant="soft"
            />
          </div>

          <div className="space-y-2 rounded-2xl border border-subtle bg-surface p-3">
            <Checkbox
              checked={showAdvanced}
              onCheckedChange={(next) => setShowAdvanced(next)}
              label="Show advanced data block"
            />
            <Checkbox
              checked={useScientific}
              onCheckedChange={(next) => setUseScientific(next)}
              label="Use scientific notation for values"
            />

            {showAdvanced && <CodeBlock language="json">{quickFactsCode}</CodeBlock>}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <ButtonLink as="a" href={wikiUrl} external color="secondary" variant="soft" size="sm">
              <ExternalLink className="size-4" />
              Open source page
            </ButtonLink>
            <TextLink as="a" href="https://developers.openai.com/apps-sdk" forceExternal>
              <InfoCircle className="mr-1 inline size-4" />
              Apps SDK docs
            </TextLink>
            <Button color="secondary" variant="ghost" size="sm" onClick={onClose}>
              <Bolt className="size-4" />
              Close
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ElementPropertiesMenu;
