import { useChatGPT } from './useChatGPT';
import { ChemicalElement } from '../types';

interface UseElementViewerChatProps {
    globalTemperature: number;
    globalPressure: number;
    selectedElements: ChemicalElement[];
}

export function useElementViewerChat({
    globalTemperature,
    globalPressure,
    selectedElements
}: UseElementViewerChatProps) {

    const {
        displayMode,
        theme,
        maxHeight,
        safeArea,
        isFullscreen,
        requestDisplayMode,
        sendFollowUpMessage
    } = useChatGPT();

    const handleInfoClick = async () => {
        if (!sendFollowUpMessage) {
            console.warn('ChatGPT SDK: sendFollowUpMessage not available');
            return;
        }

        const isMulti = selectedElements.length > 1;
        const baseContext = `Target temperature ${globalTemperature.toFixed(1)} K and pressure ${globalPressure.toExponential(2)} Pa.`;

        const prompt = isMulti
            ? `${baseContext} Briefly explain what is happening, quickly compare the differences between the selected elements under these conditions, and include one educational science fact. Keep the response natural and conversational, not rigid bullet points.`
            : `${baseContext} Briefly explain what is happening with the selected element and include one educational science fact. Keep the response natural and conversational, not rigid bullet points.`;
        await sendFollowUpMessage(prompt);
    };

    return {
        displayMode,
        theme,
        maxHeight,
        safeArea,
        isFullscreen,
        isPiP: displayMode === 'pip',
        requestDisplayMode,
        handleInfoClick
    };
}
