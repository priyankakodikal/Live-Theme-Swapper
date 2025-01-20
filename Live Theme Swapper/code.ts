// code.ts
type ColorStyle = {
  name: string;
  color: string; // Change to string to accommodate HEX values
}

type ThemeColors = {
  [key: string]: string; // Change to string to accommodate HEX values
}

interface Themes {
  [key: string]: ThemeColors;
}

// Define multiple themes
const themes: Themes = {
  light: {
    'primary': '#3366CC',
    'secondary': '#993399',
    'background': '#FFFFFF',
    'text': '#1A1A1A'
  },
  dark: {
    'primary': '#6699FF',
    'secondary': '#CC66E5',
    'background': '#1A1A1A',
    'text': '#E5E5E5'
  },
  sunset: {
    'primary': '#F26633',
    'secondary': '#E59919',
    'background': '#FAF2E6',
    'text': '#4D1A1A'
  },
  forest: {
    'primary': '#33994D',
    'secondary': '#4D9933',
    'background': '#F2FAF2',
    'text': '#1A331A'
  }
};

// Function to extract color name from style name
function getColorName(styleName: string): string {
  // Assuming style names are in format "Theme/ColorName"
  const parts = styleName.split('/');
  return parts[parts.length - 1].toLowerCase();
}

// Function to get theme colors based on color name
function getThemeColor(colorName: string, theme: ThemeColors): string | null {
  return theme[colorName.toLowerCase()] || null;
}

// Function to process node and its children recursively
async function processNode(node: SceneNode, theme: ThemeColors): Promise<void> {
  // Handle fills
  if ('fills' in node && node.fills) {
    const fills = node.fills as Paint[];
    fills.forEach((fill, index) => {
      if (fill.type === 'SOLID' && node.fillStyleId) {
        const style = figma.getStyleById(node.fillStyleId as string);
        if (style) {
          const colorName = getColorName(style.name);
          const themeColor = getThemeColor(colorName, theme);
          if (themeColor) {
            fills[index] = { ...fill, color: hexToRgb(themeColor) } as SolidPaint;
          }
        }
      }
    });
  }

  // Handle strokes
  if ('strokes' in node && node.strokes) {
    const strokes = node.strokes as Paint[];
    strokes.forEach((stroke, index) => {
      if (stroke.type === 'SOLID' && node.strokeStyleId) {
        const style = figma.getStyleById(node.strokeStyleId as string);
        if (style) {
          const colorName = getColorName(style.name);
          const themeColor = getThemeColor(colorName, theme);
          if (themeColor) {
            strokes[index] = { ...stroke, color: hexToRgb(themeColor) } as SolidPaint;
          }
        }
      }
    });
  }

  // Process children recursively
  if ('children' in node) {
    for (const child of node.children) {
      await processNode(child, theme);
    }
  }
}

// Helper function to convert HEX to RGB
function hexToRgb(hex: string): RGB {
  const bigint = parseInt(hex.slice(1), 16);
  const r = (bigint >> 16) & 255;
  const g = (bigint >> 8) & 255;
  const b = bigint & 255;
  return { r: r / 255, g: g / 255, b: b / 255 };
}

// Main plugin code
figma.showUI(__html__, { width: 300, height: 600 });

figma.ui.onmessage = async (msg) => {
  if (msg.type === 'theme-switch') {
    const selectedNodes = figma.currentPage.selection;
    
    if (selectedNodes.length === 0) {
      figma.notify('Please select a frame to apply the theme');
      return;
    }

    // Process each selected node
    for (const node of selectedNodes) {
      if (node.type === 'FRAME') {
        // Clone the frame and its contents
        const clonedFrame = node.clone();
        
        // Position the cloned frame next to the original
        clonedFrame.x = node.x + node.width + 100;
        
        // Apply the new theme
        await processNode(clonedFrame, themes.dark); // You can switch between themes.light, themes.dark, etc.
        
        // Select the new frame
        figma.currentPage.selection = [clonedFrame];
      }
    }
    
    figma.notify('Theme applied successfully!');
  }
};