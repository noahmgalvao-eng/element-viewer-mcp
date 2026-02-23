import type React from 'react';
import { useCallback } from 'react';
import { DisplayMode } from '../types';

interface UseAppChatControlsProps {
  requestDisplayMode: (mode: DisplayMode) => Promise<unknown>;
  isFullscreen: boolean;
  syncStateToChatGPT: () => Promise<void>;
  handleInfoClick: () => Promise<void>;
}

export function useAppChatControls({
  requestDisplayMode,
  isFullscreen,
  syncStateToChatGPT,
  handleInfoClick,
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

  return {
    handleTogglePiP,
    handleToggleFullscreen,
    handleInfoButtonClick,
  };
}
