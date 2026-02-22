﻿import type React from 'react';
import { useCallback } from 'react';
import { ChemicalElement, DisplayMode } from '../types';
import { roundTo } from '../app/appDefinitions';

interface UseAppChatControlsProps {
  requestDisplayMode: (mode: DisplayMode) => Promise<unknown>;
  isFullscreen: boolean;
  syncStateToChatGPT: () => Promise<void>;
  handleInfoClick: () => Promise<void>;
  selectedElements: ChemicalElement[];
  temperature: number;
  pressure: number;
}

export function useAppChatControls({
  requestDisplayMode,
  isFullscreen,
  syncStateToChatGPT,
  handleInfoClick,
  selectedElements,
  temperature,
  pressure,
}: UseAppChatControlsProps) {
  const handleTogglePiP = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await requestDisplayMode('pip');
    } catch (error) {
      console.error('Failed to enter PiP mode:', error);
    }
  }, [requestDisplayMode]);

  const handleToggleFullscreen = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    const targetMode = isFullscreen ? 'inline' : 'fullscreen';

    try {
      await requestDisplayMode(targetMode);
    } catch (error) {
      console.error('Failed to toggle fullscreen:', error);
    }
  }, [isFullscreen, requestDisplayMode]);

  const handleInfoButtonClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    await syncStateToChatGPT();
    await handleInfoClick();
  }, [syncStateToChatGPT, handleInfoClick]);

  const handleReactionButtonClick = useCallback(async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.openai?.sendFollowUpMessage) return;

    const selectedSymbols = selectedElements.map((el) => `${el.name} (${el.symbol})`).join(', ');
    const prompt = `At temperature ${roundTo(temperature, 2)} K and pressure ${roundTo(pressure, 2)} Pa, what product would likely result from these reacting elements: ${selectedSymbols}? Provide a single concise answer, briefly explain assumptions and limits, then call inject_reaction_substance with all required fields.`;
    await window.openai.sendFollowUpMessage({ prompt });
  }, [selectedElements, temperature, pressure]);

  return {
    handleTogglePiP,
    handleToggleFullscreen,
    handleInfoButtonClick,
    handleReactionButtonClick,
  };
}