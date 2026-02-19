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

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

const ElementPropertiesMenu: React.FC<Props> = ({ data, onClose, onSetTemperature, onSetPressure }) => {
  const { element, physicsState, x, y } = data;
  const [isOpen, setIsOpen] = useState(true);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [useScientific, setUseScientific] = useState(false);
  const [notes, setNotes] = useState('');

  const sourceInfo = SOURCE_DATA.elements.find((entry) => entry.symbol === element.symbol);
  const wikiUrl = sourceInfo?.source || 'https://en.wikipedia.org/wiki/Periodic_table';
  const side = x > window.innerWidth * 0.6 ? 'left' : 'right';

  const fmt = (value: number, unit = '') =>
    useScientific ? `${value.toExponential(4)}${unit}` : `${value.toLocaleString(undefined, { maximumFractionDigits: 3 })}${unit}`;

  const triplePoint = element.properties.triplePoint;
  const criticalPoint = element.properties.criticalPoint;
  const hasTriplePoint = Boolean(triplePoint && triplePoint.tempK > 0 && triplePoint.pressurePa > 0);
  const hasCriticalPoint = Boolean(criticalPoint && criticalPoint.tempK > 0 && criticalPoint.pressurePa > 0);

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

  return (
    <div className="fixed inset-0 z-[100] pointer-events-none">
      <Popover
        open={isOpen}
        onOpenChange={(next) => {
          setIsOpen(next);
          if (!next) onClose();
        }}
      >
        <Popover.Trigger>
          <span
            className="pointer-events-auto fixed h-2 w-2 rounded-full bg-transparent"
            style={{
              left: `${clamp(x, 8, window.innerWidth - 8)}px`,
              top: `${clamp(y, 8, window.innerHeight - 8)}px`,
            }}
          />
        </Popover.Trigger>

        <Popover.Content
          side={side}
          align="start"
          sideOffset={12}
          minWidth={340}
          maxWidth={420}
          className="pointer-events-auto rounded-3xl border border-default bg-surface-elevated shadow-xl"
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

            <Markdown>{element.summary || 'No summary available.'}</Markdown>

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
        </Popover.Content>
      </Popover>
    </div>
  );
};

export default ElementPropertiesMenu;
