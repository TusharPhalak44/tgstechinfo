/**
 * Widget Registration
 * Central file to register all builder widgets
 */

import widgetRegistry from './WidgetRegistry';
import { headingWidgetRegistration } from '../widgets/Heading';
import { paragraphWidgetRegistration } from '../widgets/Paragraph';
import { buttonWidgetRegistration } from '../widgets/Button';
import { imageWidgetRegistration } from '../widgets/Image';
import { dividerWidgetRegistration } from '../widgets/Divider';
import { spacerWidgetRegistration } from '../widgets/Spacer';
import { lineBreakWidgetRegistration } from '../widgets/LineBreak';
import { blockquoteWidgetRegistration } from '../widgets/Blockquote';
import { codeBlockWidgetRegistration } from '../widgets/CodeBlock';
import { tableWidgetRegistration } from '../widgets/Table';
import { bulletListWidgetRegistration } from '../widgets/BulletList';
import { numberedListWidgetRegistration } from '../widgets/NumberedList';
import { videoWidgetRegistration } from '../widgets/Video';
import { htmlWidgetRegistration } from '../widgets/HTML';
import { sectionBreakWidgetRegistration } from '../widgets/SectionBreak';
import { richTextWidgetRegistration } from '../widgets/RichText';
import { pdfWidgetRegistration } from '../widgets/PDF';
import { splitSectionWidgetRegistration } from '../widgets/SplitSection';
import { formWidgetRegistration } from '../widgets/Form';

/**
 * Register all widgets with the widget registry
 * This function should be called during app initialization
 */
export function registerAllWidgets() {
  // Register Heading widget
  widgetRegistry.register(headingWidgetRegistration);
  
  // Register Paragraph widget
  widgetRegistry.register(paragraphWidgetRegistration);
  
  // Register Button widget
  widgetRegistry.register(buttonWidgetRegistration);
  
  // Register Image widget
  widgetRegistry.register(imageWidgetRegistration);
  
  // Register Divider widget
  widgetRegistry.register(dividerWidgetRegistration);
  
  // Register Spacer widget
  widgetRegistry.register(spacerWidgetRegistration);
  
  // Register Line Break widget
  widgetRegistry.register(lineBreakWidgetRegistration);
  
  // Register Blockquote widget
  widgetRegistry.register(blockquoteWidgetRegistration);
  
  // Register Code Block widget
  widgetRegistry.register(codeBlockWidgetRegistration);
  
  // Register Table widget
  widgetRegistry.register(tableWidgetRegistration);
  
  // Register Bullet List widget
  widgetRegistry.register(bulletListWidgetRegistration);
  
  // Register Numbered List widget
  widgetRegistry.register(numberedListWidgetRegistration);
  
  // Register Video widget
  widgetRegistry.register(videoWidgetRegistration);
  
  // Register HTML widget
  widgetRegistry.register(htmlWidgetRegistration);
  
  // Register Section Break widget
  widgetRegistry.register(sectionBreakWidgetRegistration);
  
  // Register Rich Text widget
  widgetRegistry.register(richTextWidgetRegistration);
  
  // Register PDF widget
  widgetRegistry.register(pdfWidgetRegistration);
  
  // Register Split Section widget
  widgetRegistry.register(splitSectionWidgetRegistration);
  
  // Register Form widget
  widgetRegistry.register(formWidgetRegistration);
}

/**
 * Get all registered widgets
 */
export function getAllWidgets() {
  return widgetRegistry.getAll();
}

/**
 * Get widget by type
 */
export function getWidget(type) {
  return widgetRegistry.get(type);
}
