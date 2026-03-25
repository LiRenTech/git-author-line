export const hslToRgb = (
	h: number,
	s: number,
	l: number,
): [number, number, number] => {
	const c = (1 - Math.abs(2 * l - 1)) * s;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l - c / 2;
	let r = 0,
		g = 0,
		b = 0;

	if (0 <= h && h < 60) {
		r = c;
		g = x;
		b = 0;
	} else if (60 <= h && h < 120) {
		r = x;
		g = c;
		b = 0;
	} else if (120 <= h && h < 180) {
		r = 0;
		g = c;
		b = x;
	} else if (180 <= h && h < 240) {
		r = 0;
		g = x;
		b = c;
	} else if (240 <= h && h < 300) {
		r = x;
		g = 0;
		b = c;
	} else if (300 <= h && h < 360) {
		r = c;
		g = 0;
		b = x;
	}

	return [
		Math.round((r + m) * 255),
		Math.round((g + m) * 255),
		Math.round((b + m) * 255),
	];
};


/**
 * 输入一个颜色作为背景色，获取它上面的文字应该是白色更好还是黑色更明显
 * @param backgroundColor 
 * @returns 
 */
export function getTextColor(backgroundColor: string): string {
	// Extract RGB components from hex color
	const hex = backgroundColor.replace("#", "");
	const r = parseInt(hex.substring(0, 2), 16);
	const g = parseInt(hex.substring(2, 4), 16);
	const b = parseInt(hex.substring(4, 6), 16);

	// Calculate relative luminance (perceived brightness)
	// Using formula from WCAG 2.0: https://www.w3.org/TR/WCAG20/#relativeluminancedef
	const [rs, gs, bs] = [r, g, b].map((c) => {
		const s = c / 255;
		return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
	});
	const luminance = 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;

	// Use black text for light backgrounds, white text for dark backgrounds
	// Threshold of 0.5 is a common choice
	return luminance > 0.5 ? "#000000" : "#FFFFFF";
}
