// code.ts
interface RGB {
  readonly r: number;
  readonly g: number;
  readonly b: number;
}

interface ThemeColors {
  [key: string]: RGB;
}

interface Themes {
  [key: string]: ThemeColors;
}

// Define multiple themes
const themes: Themes = {
  light: {
    'primary': { r: 0.2, g: 0.4, b: 0.8 },
    'secondary': { r: 0.6, g: 0.2, b: 0.7 },
    'background': { r: 1, g: 1, b: 1 },
    'text': { r: 0.1, g: 0.1, b: 0.1 }
  },
  dark: {
    'primary': { r: 0.4, g: 0.6, b: 1 },
    'secondary': { r: 0.8, g: 0.4, b: 0.9 },
    'background': { r: 0.1, g: 0.1, b: 0.1 },
    'text': { r: 0.9, g: 0.9, b: 0.9 }
  },
  sunset: {
    'primary': { r: 0.95, g: 0.4, b: 0.2 },
    'secondary': { r: 0.9, g: 0.6, b: 0.1 },
    'background': { r: 0.98, g: 0.95, b: 0.9 },
    'text': { r: 0.3, g: 0.1, b: 0.1 }
  },
  forest: {
    'primary': { r: 0.2, g: 0.5, b: 0.3 },
    'secondary': { r: 0.3, g: 0.6, b: 0.2 },
    'background': { r: 0.95, g: 0.98, b: 0.95 },
    'text': { r: 0.1, g: 0.2, b: 0.1 }
  }
};

function getColorName(styleName: string): string {
  const parts = styleName.split('/');
  return parts[parts.length - 1].toLowerCase();
}

function getThemeColor(colorName: string, theme: ThemeColors): RGB | null {
  return theme[colorName.toLowerCase()] || null;
}

async function processNode(node: SceneNode, theme: ThemeColors): Promise<void> {
  if ('fills' in node && node.fills) {
    const fills = node.fills as Paint[];
    fills.forEach((fill, index) => {
      if (fill.type === 'SOLID' && node.fillStyleId) {
        const style = figma.getStyleById(node.fillStyleId as string);
        if (style) {
          const colorName = getColorName(style.name);
          const themeColor = getThemeColor(colorName, theme);
          if (themeColor) {
            const newFill: SolidPaint = {
              ...fill,
              color: themeColor
            };
            fills[index] = newFill;
          }
        }
      }
    });
  }

  if ('strokes' in node && node.strokes) {
    const strokes = node.strokes as Paint[];
    strokes.forEach((stroke, index) => {
      if (stroke.type === 'SOLID' && node.strokeStyleId) {
        const style = figma.getStyleById(node.strokeStyleId as string);
        if (style) {
          const colorName = getColorName(style.name);
          const themeColor = getThemeColor(colorName, theme);
          if (themeColor) {
            const newStroke: SolidPaint = {
              ...stroke,
              color: themeColor
            };
            strokes[index] = newStroke;
          }
        }
      }
    });
  }

  if ('children' in node) {
    for (const child of node.children) {
      await processNode(child, theme);
    }
  }
}

figma.showUI(__html__, { width: 300, height: 400 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'apply-theme') {
    const selectedNodes = figma.currentPage.selection;
    const selectedTheme = themes[msg.themeName];
    
    if (selectedNodes.length === 0) {
      figma.notify('Please select a frame to apply the theme');
      return;
    }

    if (!selectedTheme) {
      figma.notify('Invalid theme selected');
      return;
    }

    try {
      for (const node of selectedNodes) {
        if (node.type === 'FRAME') {
          const clonedFrame = node.clone();
          clonedFrame.x = node.x + node.width + 100;
          await processNode(clonedFrame, selectedTheme);
          figma.currentPage.selection = [clonedFrame];
        }
      }
      figma.notify(`${msg.themeName} theme applied successfully!`);
    } catch (error) {
      figma.notify('Error applying theme: ' + (error as Error).message);
    }
  }
};