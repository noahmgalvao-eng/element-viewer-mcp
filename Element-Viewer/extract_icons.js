import { Sparkle, PictureInPicture, Expand, Collapse, InfoCircle, Flask } from '@openai/apps-sdk-ui/components/Icon';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';

const icons = { Sparkle, PictureInPicture, Expand, Collapse, InfoCircle, Flask };

for (const [name, Icon] of Object.entries(icons)) {
  try {
    if (!Icon) {
      console.log(`\n--- ${name} ---`);
      console.log('NOT FOUND');
      continue;
    }

    console.log(`\n--- ${name} ---`);
    console.log(renderToStaticMarkup(React.createElement(Icon, { size: 24 })));
  } catch (error) {
    console.error(`Error processing ${name}:`, error instanceof Error ? error.message : error);
  }
}
