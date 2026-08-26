import fs from 'fs';
import path from 'path';
import Vibrant from 'node-vibrant';

const JSON_INPUT = path.join(process.cwd(), 'src', 'data', 'catalogData.json');
const JSON_OUTPUT = path.join(process.cwd(), 'src', 'data', 'catalogData.json');

// HSV conversion function
function rgbToHsv(r, g, b) {
    r /= 255, g /= 255, b /= 255;
    let max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, v = max;
    let d = max - min;
    s = max == 0 ? 0 : d / max;
    if (max == min) {
        h = 0; // achromatic
    } else {
        switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return [h * 360, s, v];
}

// Categorize based on Hue and Saturation
function getCategoryAndGlow(r, g, b) {
    const [h, s, v] = rgbToHsv(r, g, b);
    const glow = `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, 0.7)`; // Resplandor exacto!
    
    // Eter for low saturation (white, black, gray)
    if (s < 0.15 || v < 0.15) {
        return { category: 'eter', glow };
    }
    
    // Fuego: Reds, Oranges, Pinks (Hue 0-30 or 315-360)
    if (h >= 315 || h <= 30) {
        return { category: 'fuego', glow };
    }
    // Tormenta: Yellows (Hue 31-70)
    if (h > 30 && h <= 70) {
        return { category: 'tormenta', glow };
    }
    // Tierra: Greens (Hue 71-150)
    if (h > 70 && h <= 150) {
        return { category: 'tierra', glow };
    }
    // Agua: Blues, Cyans, Purples (Hue 151-314)
    if (h > 150 && h < 315) {
        return { category: 'agua', glow };
    }
    
    return { category: 'eter', glow };
}

async function main() {
    const catalogData = JSON.parse(fs.readFileSync(JSON_INPUT, 'utf8'));
    console.log(`Starting visual analysis of ${catalogData.length} items...`);
    
    for (let i = 0; i < catalogData.length; i++) {
        const item = catalogData[i];
        const imagePath = path.join(process.cwd(), 'public', item.image);
        
        if (fs.existsSync(imagePath)) {
            try {
                // Instanciar Vibrant para analizar los píxeles
                const palette = await Vibrant.from(imagePath).getPalette();
                // Buscar el color más dominante
                const dominantSwatch = palette.Vibrant || palette.DarkVibrant || palette.LightVibrant || palette.Muted || palette.DarkMuted || palette.LightMuted;
                if (dominantSwatch) {
                    const [r, g, b] = dominantSwatch.rgb;
                    const { category, glow } = getCategoryAndGlow(r, g, b);
                    catalogData[i].category = category;
                    catalogData[i].glow = glow; // ¡El resplandor ahora es el color exacto!
                    console.log(`[OK] ${item.name} -> ${category} (RGB: ${Math.round(r)},${Math.round(g)},${Math.round(b)})`);
                } else {
                    console.log(`[WARN] No swatch found for ${item.name}`);
                }
            } catch (e) {
                console.error(`[ERROR] analyzing ${item.name}: ${e.message}`);
            }
        }
    }
    
    fs.writeFileSync(JSON_OUTPUT, JSON.stringify(catalogData, null, 2));
    console.log('Finished visual categorization!');
}

main();
