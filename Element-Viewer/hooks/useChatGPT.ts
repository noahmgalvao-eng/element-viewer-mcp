import { useSyncExternalStore } from 'react';
import {
    SET_GLOBALS_EVENT_TYPE,
    SetGlobalsEvent,
    type OpenAiGlobals,
    type DisplayMode,
    type API
} from '../types';

/**
 * Hook to subscribe to a specific key in the ChatGPT global state.
 */
export function useChatGPTGlobal<K extends keyof OpenAiGlobals>(
    key: K
): OpenAiGlobals[K] | null {
    return useSyncExternalStore(
        (onChange) => {
            if (typeof window === 'undefined') {
                return () => { };
            }

            const handleSetGlobal = (event: SetGlobalsEvent) => {
                const value = event.detail.globals[key];
                if (value === undefined) {
                    return;
                }
                onChange();
            };

            window.addEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal, {
                passive: true,
            });

            return () => {
                window.removeEventListener(SET_GLOBALS_EVENT_TYPE, handleSetGlobal);
            };
        },
        () => window.openai?.[key] ?? null,
        () => window.openai?.[key] ?? null
    );
}

/**
 * Comprehensive hook for interacting with the ChatGPT environment.
 */
export function useChatGPT() {
    // Reactive State
    const displayMode = useChatGPTGlobal('displayMode') ?? 'inline';
    const theme = useChatGPTGlobal('theme');
    const toolInput = useChatGPTGlobal('toolInput');
    const toolOutput = useChatGPTGlobal('toolOutput');
    const userAgent = useChatGPTGlobal('userAgent');
    const safeArea = useChatGPTGlobal('safeArea');
    const maxHeight = useChatGPTGlobal('maxHeight');

    // Methods (wrapped for safety)
    const requestDisplayMode = async (mode: DisplayMode) => {
        if (window.openai?.requestDisplayMode) {
            return await window.openai.requestDisplayMode({ mode });
        }
        console.warn('window.openai.requestDisplayMode is not available');
        return { mode: 'inline' as DisplayMode };
    };

    const callTool = async (name: string, args: Record<string, unknown>) => {
        if (window.openai?.callTool) {
            return await window.openai.callTool(name, args);
        }
        console.warn('window.openai.callTool is not available');
        throw new Error('callTool not available');
    };

    const sendFollowUpMessage = async (prompt: string) => {
        if (window.openai?.sendFollowUpMessage) {
            return await window.openai.sendFollowUpMessage({ prompt });
        }
        console.warn('window.openai.sendFollowUpMessage is not available');
    };

    const openExternal = (href: string) => {
        if (window.openai?.openExternal) {
            window.openai.openExternal({ href });
        } else {
            console.warn('window.openai.openExternal is not available, falling back to window.open');
            window.open(href, '_blank');
        }
    };

    return {
        // State
        displayMode,
        theme,
        toolInput,
        toolOutput,
        userAgent,
        safeArea,
        maxHeight,
        isFullscreen: displayMode === 'fullscreen',

        // API
        requestDisplayMode,
        callTool,
        sendFollowUpMessage,
        openExternal,

        // Raw Access
        openai: typeof window !== 'undefined' ? window.openai : null
    };
}
