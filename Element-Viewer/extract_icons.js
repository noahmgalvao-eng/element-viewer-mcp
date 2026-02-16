const { BookOpen, PictureInPicture, Maximize2, Minimize2, Info, PictureInPicture2 } = require('lucide-react');
const React = require('react');
const ReactDOMServer = require('react-dom/server');

const icons = { BookOpen, PictureInPicture, Maximize2, Minimize2, Info, PictureInPicture2 };

for (const [name, Icon] of Object.entries(icons)) {
    try {
        if (!Icon) {
            console.log(`\n--- ${name} ---`);
            console.log('NOT FOUND');
            continue;
        }
        // renderToString might not work perfectly with how Lucide is structured if it's strictly client-side, 
        // but typically these are simple components. 
        // Newer lucide-react might return an object with [tag, attrs, children] structure if inspected directly, 
        // or we can try to render it.

        // Inspecting the 'Icon' object itself often reveals the structure for Lucide icons
        console.log(`\n--- ${name} ---`);
        if (Array.isArray(Icon)) {
            console.log(JSON.stringify(Icon));
        } else {
            // Try rendering
            console.log(ReactDOMServer.renderToStaticMarkup(React.createElement(Icon)));
        }
    } catch (e) {
        console.error(`Error processing ${name}:`, e.message);
    }
}
