import Light from '../themes/Default Light Neutral Medium';
import Dark from '../themes/Default Dark Neutral Medium';
import angstRobot from '../themes/Angst Robot';
import immaterial from '../themes/Immaterial';
import riparian from '../themes/Riparian';
import twentyFourCarat from '../themes/Twenty-Four Carat';

// code.ts
interface ColorRGB {  // Changed from RGB to ColorRGB
  r: number;
  g: number;
  b: number;
}

interface ThemeColors {
  [key: string]: string; // Hex values
}
interface Theme {
  [key: string]: ThemeColors;
}

// Define multiple themes using hex values
const themes: Theme = {
  Light: Light,
  Dark: Dark,
  AngstRobot: angstRobot,
  Immaterial: immaterial,
  Riparian: riparian,
  TwentyFourCarat: twentyFourCarat
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
  const match = styleName.match(/\(([^)]+)\)/);
  return match ? match[1] : styleName;
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
      // Initialize progress tracking
      let progress = 0;
      let progressNotification = figma.notify(`🎨 Applying ${msg.themeName} Theme: ▓░░░░░░░░░ ${progress}%`, { timeout: 1000 });
      
      const totalSteps = selectedNodes.length;
      
      for (const [index, node] of selectedNodes.entries()) {
        if (node.type === 'FRAME') {
          // Clone and position the frame
          const clonedFrame = node.clone();
          clonedFrame.x = node.x + node.width + 100;
          
          // Update colors
          await updateNodeColors(clonedFrame, selectedTheme);
          figma.currentPage.selection = [clonedFrame];
          
          // Calculate progress
          progress = Math.round(((index + 1) / totalSteps) * 100);
          
          // Create progress bar visual using blocks
          const totalBlocks = 10;
          const filledBlocks = Math.round((progress / 100) * totalBlocks);
          const progressBar = '▓'.repeat(filledBlocks) + '░'.repeat(totalBlocks - filledBlocks);
          
          // Close previous notification and create new one with visual progress bar
          progressNotification.cancel();
          progressNotification = figma.notify(
            `🎨 Applying ${msg.themeName} Theme: ${progressBar} ${progress}% (${index + 1}/${totalSteps} Frames)`, 
            { timeout: 1000 }
          );
        }
        
        // Add a small delay to make the progress visible
        await new Promise(resolve => setTimeout(resolve, 150));
      }
      
      // Show completion
      progressNotification.cancel();
      figma.notify(`✨ ${msg.themeName} theme applied successfully to ${totalSteps} frames!`, { timeout: 2000 });
    } catch (err) {
      if (err instanceof Error) {
        console.error('Error:', err);
        figma.notify('❌ Error applying theme: ' + err.message);
      } else {
        console.error('Unknown error:', err);
        figma.notify('❌ An unknown error occurred while applying the theme');
      }
    }
  }
};