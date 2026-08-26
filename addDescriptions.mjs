import fs from 'fs';
import path from 'path';

const JSON_FILE = path.join(process.cwd(), 'src', 'data', 'catalogData.json');

const descriptions = {
    fuego: "Fabricado con telas de alto rendimiento antitranspirante y costuras reforzadas. Ideal para equipos que buscan destacar en la cancha con un estilo agresivo, cálido y profesional.",
    agua: "Diseño fresco y dinámico de la colección Agua. Su tecnología de microfibra ultraligera permite máxima movilidad y ventilación para un rendimiento superior en cada partido.",
    tierra: "Texturas sólidas y colores firmes. Este uniforme de la colección Tierra garantiza resistencia extrema ante tirones y roces, manteniendo la elegancia táctica de tu equipo.",
    tormenta: "Impacto visual instantáneo. Con colores eléctricos y vibrantes, esta indumentaria está diseñada para deslumbrar bajo los reflectores y potenciar la energía del equipo.",
    eter: "Elegancia minimalista y atemporal. Un diseño de alto contraste con corte aerodinámico que transmite seriedad, autoridad y un nivel premium en el terreno de juego."
};

function main() {
    const data = JSON.parse(fs.readFileSync(JSON_FILE, 'utf8'));
    for (let item of data) {
        item.description = `Diseño ${item.name} de la colección ${item.category.toUpperCase()}. ${descriptions[item.category] || descriptions.eter}`;
    }
    fs.writeFileSync(JSON_FILE, JSON.stringify(data, null, 2));
    console.log(`[SUCCESS] Added descriptions to ${data.length} uniforms.`);
}

main();
