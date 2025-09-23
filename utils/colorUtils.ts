/**
 * Calculates the most appropriate text color (black or white) for a given background hex color
 * to ensure sufficient contrast and readability.
 * Uses the W3C luminance algorithm to determine if the background color is light or dark.
 * @param hexColor - The background color in hex format (e.g., "#RRGGBB" or "#RGB").
 * @returns '#000000' (black) for light backgrounds, or '#FFFFFF' (white) for dark backgrounds.
 */
export const getTextColorForBackground = (hexColor: string): string => {
  if (!hexColor || hexColor.length < 7) {
    return '#000000'; // Default to black for invalid or short hex codes
  }

  try {
    // Parse the R, G, B values from the hex string
    const r = parseInt(hexColor.slice(1, 3), 16);
    const g = parseInt(hexColor.slice(3, 5), 16);
    const b = parseInt(hexColor.slice(5, 7), 16);

    // Calculate luminance using the W3C formula.
    // A value greater than 0.5 is considered a light color.
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

    return luminance > 0.5 ? '#000000' : '#FFFFFF';
  } catch (e) {
    console.error("Could not parse color:", hexColor, e);
    return '#000000'; // Fallback to black on any parsing error
  }
};
