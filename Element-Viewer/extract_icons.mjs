import { BookOpen, PictureInPicture, Maximize2, Minimize2, Info, PictureInPicture2 } from 'lucide-react';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const icons = { BookOpen, PictureInPicture, Maximize2, Minimize2, Info, PictureInPicture2 };

console.log("Starting extraction...");

for (const [name, Icon] of Object.entries(icons)) {
    try {
        if (!Icon) {
            console.log(`\n--- ${name} ---`);
            console.log('NOT FOUND');
            continue;
        }
        console.log(`\n--- ${name} ---`);
        // Render the icon to static markup to get the SVG string
        // We wrap it in a simple element because renderToStaticMarkup expects a React element
        console.log(renderToStaticMarkup(React.createElement(Icon, { size: 24, strokeWidth: 2 })));
    } catch (e) {
        console.error(`Error processing ${name}:`, e.message);
    }
}
