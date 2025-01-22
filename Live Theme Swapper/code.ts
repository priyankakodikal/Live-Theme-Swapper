// code.ts
interface ColorRGB {  // Changed from RGB to ColorRGB
  r: number;
  g: number;
  b: number;
}

interface ThemeColors {
  [key: string]: string; // Hex values
}

interface Text {
  [key: string]: ThemeColors;
}

interface Control {
  [key: string]: ThemeColors;
}

interface Tree {
  [key: string]: ThemeColors;
}

interface Surface {
  [key: string]: ThemeColors;
}

interface Theme {
  [key: string]: ThemeColors;
}

interface State {
  [key: string]: ThemeColors;
}

// Define multiple themes using hex values
const themes: Text & Control & Tree & Surface & Theme = {
  Light: {
    'View Foreground (SurfaceBackground)': '#A5A5A5',
    'View Background (SurfaceArea)': '#6E6E6E',
    'Tree column for category foreground (TreeRowCategoryForeground)': '#4F4F4F',
    'View Text (ControlForeground)': '#121212',
    'Control Text-Icon On (ControlOnForeground)': '#121212',
    'Control Contrast Frame (ControlContrastFrame)': '#4F4F4F',
    'Control Fill Button (ControlBackground)': '#CFCFCF',
    'Selection/Selection Background (SelectionBackground)': '#CDF8FF',
    'Primary': '#FFB901'
  },
  Dark: {
    'View Foreground (SurfaceBackground)': '#363636',
    'View Background (SurfaceArea)': '#242424',
    'Tree column for category foreground (TreeRowCategoryForeground)': '#757575',
    'View Text (ControlForeground)': '#b5b5b5',
    'Control Text-Icon On (ControlOnForeground)': '#070707',
    'Control Contrast Frame (ControlContrastFrame)': '#111111',
    'Control Fill Button (ControlBackground)': '#1e1e1e',
    'Selection/Selection Background (SelectionBackground)': '#b0ddeb',
    'Primary': '#ffad56'
  },
  AngstRobot: {
    'View Foreground (SurfaceBackground)': '#372c6d',
    'View Background (SurfaceArea)': '#221746',
    'Tree column for category foreground (TreeRowCategoryForeground)': '#acbad3',
    'View Text (ControlForeground)': '#e5e6e8',
    'Control Text-Icon On (ControlOnForeground)': '#000001',
    'Control Contrast Frame (ControlContrastFrame)': '#060313',
    'Control Fill Button (ControlBackground)': '#1a1037',
    'Selection/Selection Background (SelectionBackground)': '#79c9ff',
    'Primary': '#b5ff63'
  },
  Immaterial: {
    'View Foreground (SurfaceBackground)': '#2f3138',
    'View Background (SurfaceArea)': '#1d1f23',
    'Tree column for category foreground (TreeRowCategoryForeground)': '#7d8088',
    'View Text (ControlForeground)': '#cbcbcd',
    'Control Text-Icon On (ControlOnForeground)': '#040506',
    'Control Contrast Frame (ControlContrastFrame)': '#0c0d10',
    'Control Fill Button (ControlBackground)': '#18191e',
    'Selection/Selection Background (SelectionBackground)': '#bbdbe3',
    'Primary': '#ff91c3'
  },
  Riparian: {
    'View Foreground (SurfaceBackground)': '#26383f',
    'View Background (SurfaceArea)': '#0f2026',
    'Tree column for category foreground (TreeRowCategoryForeground)': '#82918f',
    'View Text (ControlForeground)': '#d6cda8',
    'Control Text-Icon On (ControlOnForeground)': '#000102',
    'Control Contrast Frame (ControlContrastFrame)': '#000a0f',
    'Control Fill Button (ControlBackground)': '#08191f',
    'Selection/Selection Background (SelectionBackground)': '#b4eccd',
    'Primary': '#ffc658'
  },
  TwentyFourCarat: {
    'View Foreground (SurfaceBackground)': '#343434',
    'View Background (SurfaceArea)': '#222222',
    'Tree column for category foreground (TreeRowCategoryForeground)': '#8c7f6c',
    'View Text (ControlForeground)': '#e1c69c',
    'Control Text-Icon On (ControlOnForeground)': '#040404',
    'Control Contrast Frame (ControlContrastFrame)': '#0d0d0d',
    'Control Fill Button (ControlBackground)': '#1b1b1b',
    'Selection/Selection Background (SelectionBackground)': '#ffdd9f',
    'Primary': '#ffad56'
  }

};

// Convert hex to RGB
function hexToRgb(hex: string): RGB {  // Using Figma's RGB type instead of our custom one
  // Remove the hash if present
  hex = hex.replace(/^#/, '');

  // Parse the hex values
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Return RGB values normalized to 0-1 range
  return {
    r: r / 255,
    g: g / 255,
    b: b / 255
  };
}

function getColorName(styleName: string): string {
  const parts = styleName.split('/');
  return parts[parts.length - 1];
}

function getThemeColor(colorName: string, theme: ThemeColors): RGB | null {
  const hexColor = theme[colorName];
  return hexColor ? hexToRgb(hexColor) : null;
}

async function updateNodeColors(node: SceneNode, theme: ThemeColors): Promise<void> {
  // Handle fills
  if ('fills' in node) {
    if (node.fills !== figma.mixed && node.fills) {
      for (let i = 0; i < node.fills.length; i++) {
        const fill = node.fills[i] as Paint;
        if (fill.type === 'SOLID') {
          const solidFill = fill as SolidPaint;
          const fillStyle = node.fillStyleId;
          if (typeof fillStyle === 'string') {
            const style = await figma.getStyleByIdAsync(fillStyle);
            if (style) {
              const colorName = getColorName(style.name);
              const themeColor = getThemeColor(colorName, theme);
              if (themeColor) {
                // Create a new fill with the theme color
                const newFill: SolidPaint = {
                  ...solidFill,
                  color: themeColor
                };
                node.fills = node.fills.map((f, index) => 
                  index === i ? newFill : f
                );
              }
            }
          }
        }
      }
    }
  }

  // Handle strokes
  if ('strokes' in node) {
    if (Array.isArray(node.strokes) && node.strokes.length > 0) {
      for (let i = 0; i < node.strokes.length; i++) {
        const stroke = node.strokes[i];
        if (stroke.type === 'SOLID') {
          const strokeStyle = node.strokeStyleId;
          if (typeof strokeStyle === 'string') {
            const style = await figma.getStyleByIdAsync(strokeStyle);
            if (style) {
              const colorName = getColorName(style.name);
              const themeColor = getThemeColor(colorName, theme);
              if (themeColor) {
                // Create a new stroke with the theme color
                const newStroke = { ...stroke, color: themeColor };
                node.strokes = node.strokes.map((s, index) => 
                  index === i ? newStroke : s
                );
              }
            }
          }
        }
      }
    }
  }

  // Handle background color for frames
  // Handle background color for frames and rectangles
if (node.type === 'FRAME' || node.type === 'RECTANGLE') {
  if ('backgrounds' in node) { // For frames
    const backgrounds = node.backgrounds;
    if (backgrounds) {
      for (let i = 0; i < backgrounds.length; i++) {
        const background = backgrounds[i] as Paint;
        if (background.type === 'SOLID') {
          const solidBackground = background as SolidPaint;
          if (node.type === 'FRAME' && node.backgroundStyleId) {
            const style = await figma.getStyleByIdAsync(node.backgroundStyleId);
            if (style) {
              const colorName = getColorName(style.name);
              const themeColor = getThemeColor(colorName, theme);
              if (themeColor) {
                const newBackground: SolidPaint = {
                  ...solidBackground,
                  color: themeColor
                };
                node.backgrounds = node.backgrounds.map((bg, index) =>
                  index === i ? newBackground : bg
                );
              }
            }
          }
        }
      }
    }
  } else if ('fills' in node) { // For rectangles
    if (node.fills !== figma.mixed && node.fills) {
      for (let i = 0; i < node.fills.length; i++) {
        const fill = node.fills[i] as Paint;
        if (fill.type === 'SOLID') {
          const solidFill = fill as SolidPaint;
          if (node.fillStyleId && typeof node.fillStyleId === 'string') {
            const style = await figma.getStyleByIdAsync(node.fillStyleId);
            if (style) {
              const colorName = getColorName(style.name);
              const themeColor = getThemeColor(colorName, theme);
              if (themeColor) {
                const newFill: SolidPaint = {
                  ...solidFill,
                  color: themeColor
                };
                node.fills = node.fills.map((f, index) =>
                  index === i ? newFill : f
                );
              }
            }
          }
        }
      }
    }
  }
}

  // Handle text color
  if (node.type === 'TEXT') {
    if (node.textStyleId && typeof node.textStyleId === 'string') {
      const style = await figma.getStyleByIdAsync(node.textStyleId);
      if (style) {
        const colorName = getColorName(style.name);
        const themeColor = getThemeColor(colorName, theme);
        if (themeColor) {
          node.fills = [{
            type: 'SOLID',
            color: themeColor
          }];
        }
      }
    }
  }

  // Process children recursively
  if ('children' in node) {
    for (const child of node.children) {
      await updateNodeColors(child, theme);
    }
  }
}

figma.showUI(__html__, { width: 300, height: 400 });

// Error Handling:

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
      let progress = 0;
      const totalNodes = selectedNodes.length;
      figma.ui.postMessage({ type: 'progress', progress });

      for (const [index, node] of selectedNodes.entries()) {
        if (node.type === 'FRAME') {
          const clonedFrame = node.clone();
          clonedFrame.x = node.x + node.width + 100;
          await updateNodeColors(clonedFrame, selectedTheme);
          figma.currentPage.selection = [clonedFrame];
        }
        progress = Math.round(((index + 1) / totalNodes) * 100);
        figma.ui.postMessage({ type: 'progress', progress });
      }

      figma.notify(`${msg.themeName} theme applied successfully!`);
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error:', err);
        figma.notify('Error applying theme: ' + err.message);
      } else {
        console.error('Unknown error:', err);
        figma.notify('An unknown error occurred while applying the theme');
      }
    }
  }
};