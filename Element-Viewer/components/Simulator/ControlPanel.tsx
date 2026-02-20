import React, { useMemo, useState } from 'react';
import { Badge } from '@openai/apps-sdk-ui/components/Badge';
import { Input } from '@openai/apps-sdk-ui/components/Input';
import { Select } from '@openai/apps-sdk-ui/components/Select';
import { Slider } from '@openai/apps-sdk-ui/components/Slider';
import { Switch } from '@openai/apps-sdk-ui/components/Switch';
import {
  TempUnit,
  PressureUnit,
  TEMP_UNITS,
  PRESSURE_UNITS,
  toKelvin,
  fromKelvin,
  toPascal,
  fromPascal,
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
  onSliderRelease,
}) => {
  const [tempUnit, setTempUnit] = useState<TempUnit>('K');
  const [pressureUnit, setPressureUnit] = useState<PressureUnit>('Pa');
  const [activeControl, setActiveControl] = useState<'temperature' | 'pressure' | null>(null);

  const minTempK = 0;
  const maxTempK = 6000;
  const minSliderTemp = fromKelvin(minTempK, tempUnit);
  const maxSliderTemp = fromKelvin(maxTempK, tempUnit);

  const currentTempDisplay = fromKelvin(temperature, tempUnit);
  const currentPressureDisplay = fromPascal(pressure, pressureUnit);

  const logPressureValue = useMemo(() => {
    if (pressure > 0.0001) return Math.log10(pressure);
    return -4;
  }, [pressure]);

  const compactPressure = useMemo(
    () => `${(pressure / 1000).toLocaleString(undefined, { maximumFractionDigits: 2 })} kPa`,
    [pressure],
  );

  const startInteraction = (target: 'temperature' | 'pressure') => {
    if (activeControl !== target) {
      setActiveControl(target);
      onInteractionChange(true);
    }
  };

  const endInteraction = () => {
    if (!activeControl) return;
    setActiveControl(null);
    onInteractionChange(false);
    onSliderRelease?.();
  };

  const handleTempInputChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    setTemperature(toKelvin(value, tempUnit));
  };

  const handlePressureInputChange = (value: number) => {
    if (!Number.isFinite(value)) return;
    if (value <= 0) {
      setPressure(0);
      return;
    }
    setPressure(toPascal(value, pressureUnit));
  };

  const handlePressureSliderChange = (value: number) => {
    if (value <= -3.9) {
      setPressure(0);
      return;
    }
    setPressure(Math.pow(10, value));
  };

  if (activeControl === 'temperature') {
    return (
      <section
        className="rounded-3xl border border-transparent bg-transparent p-4 shadow-none"
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-default">Temperature</p>
            <Badge color="secondary" variant="outline">
              {Number(currentTempDisplay.toFixed(tempUnit === 'K' ? 0 : 2))} {tempUnit}
            </Badge>
          </div>
          <Slider
            value={currentTempDisplay}
            min={minSliderTemp}
            max={maxSliderTemp}
            step={tempUnit === 'K' ? 10 : 1}
            unit={tempUnit}
            onChange={(value) => {
              startInteraction('temperature');
              handleTempInputChange(value);
            }}
          />
        </div>
      </section>
    );
  }

  if (activeControl === 'pressure') {
    return (
      <section
        className="rounded-3xl border border-transparent bg-transparent p-4 shadow-none"
        onPointerUp={endInteraction}
        onPointerCancel={endInteraction}
      >
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-default">Pressure</p>
            <Badge color="secondary" variant="outline">
              {compactPressure}
            </Badge>
          </div>
          <Slider
            value={logPressureValue}
            min={-4}
            max={11}
            step={0.05}
            label="Log scale"
            onChange={(value) => {
              startInteraction('pressure');
              handlePressureSliderChange(value);
            }}
          />
        </div>
      </section>
    );
  }

  return (
    <section
      className="space-y-4 rounded-3xl border border-default bg-surface p-4 shadow-sm"
      onPointerUp={endInteraction}
      onPointerCancel={endInteraction}
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="heading-xs text-default">Environmental controls</h3>
          <p className="text-xs text-secondary">Adjust global temperature and pressure.</p>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-default">Temperature</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              value={Number(currentTempDisplay.toFixed(tempUnit === 'K' ? 0 : 2))}
              onChange={(event) => handleTempInputChange(Number(event.target.value))}
              className="w-28"
            />
            <Select
              options={TEMP_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
              value={tempUnit}
              onChange={(next) => setTempUnit(next.value as TempUnit)}
              block={false}
              size="sm"
            />
          </div>
        </div>

        <Slider
          value={currentTempDisplay}
          min={minSliderTemp}
          max={maxSliderTemp}
          step={tempUnit === 'K' ? 10 : 1}
          unit={tempUnit}
          onChange={(value) => {
            startInteraction('temperature');
            handleTempInputChange(value);
          }}
        />

        <div className="flex flex-wrap items-center gap-2">
          <Badge
            color={Math.abs(temperature - meltPoint) < 50 ? 'warning' : 'secondary'}
            variant="soft"
          >
            Tmelt {meltPoint.toFixed(2)} K
          </Badge>
          <Badge
            color={Math.abs(temperature - boilPoint) < 100 ? 'danger' : 'secondary'}
            variant="soft"
          >
            Tboil {boilPoint.toFixed(2)} K
          </Badge>
        </div>
      </div>

      <div className="border-t border-subtle pt-4" />

      <div className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm text-default">Pressure</p>
          <div className="flex items-center gap-2">
            <Input
              type="number"
              step="any"
              value={Number(currentPressureDisplay.toPrecision(6))}
              onChange={(event) => handlePressureInputChange(Number(event.target.value))}
              className="w-32"
            />
            <Select
              options={PRESSURE_UNITS.map((unit) => ({ value: unit.value, label: unit.label }))}
              value={pressureUnit}
              onChange={(next) => setPressureUnit(next.value as PressureUnit)}
              block={false}
              size="sm"
            />
          </div>
        </div>

        <Slider
          value={logPressureValue}
          min={-4}
          max={11}
          step={0.05}
          label="Log scale"
          onChange={(value) => {
            startInteraction('pressure');
            handlePressureSliderChange(value);
          }}
        />

        <Badge color="secondary" variant="outline">
          {compactPressure}
        </Badge>
      </div>

      <div className="border-t border-subtle pt-4" />

      <Switch
        checked={showParticles}
        onCheckedChange={setShowParticles}
        label="X-Ray Vision"
        labelPosition="start"
      />
    </section>
  );
};

export default ControlPanel;
