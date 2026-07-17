import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const API_KEYS = [
  'JdKUdFyYFpJQsAgyRNoCGfVV',
  'P62dWoEQrE7UdiM89VDsH6ma',
  'EjERDGmzHK5S5maXf8DpXRM7'
];
let currentKeyIndex = 0;

const SOURCE_DIR = 'C:\\Users\\Alex Toscano\\Pictures\\uniformes master\\colecciones';
const TARGET_DIR = path.join(process.cwd(), 'public', 'catalog', 'colecciones');
const JSON_OUTPUT = path.join(process.cwd(), 'src', 'data', 'catalogData.json');

// Crear directorio de destino si no existe
if (!fs.existsSync(TARGET_DIR)) {
  fs.mkdirSync(TARGET_DIR, { recursive: true });
}

// Función recursiva para leer archivos
function getAllFiles(dirPath, arrayOfFiles) {
  const files = fs.readdirSync(dirPath);

  arrayOfFiles = arrayOfFiles || [];

  files.forEach(function(file) {
    if (fs.statSync(dirPath + "/" + file).isDirectory()) {
      arrayOfFiles = getAllFiles(dirPath + "/" + file, arrayOfFiles);
    } else {
      if (file.toLowerCase().match(/\.(jpg|jpeg|png)$/)) {
        arrayOfFiles.push(path.join(dirPath, "/", file));
      }
    }
  });

  return arrayOfFiles;
}

// Categorización basada en nombre
function categorize(filename) {
  const name = filename.toLowerCase();
  
  if (name.match(/rojo|naranja|fuego|rosa|fuccia|vino/)) {
    return { category: 'fuego', glow: 'rgba(255, 50, 50, 0.5)' };
  }
  if (name.match(/azul|celeste|cyan|turquesa|marino/)) {
    return { category: 'agua', glow: 'rgba(0, 150, 255, 0.5)' };
  }
  if (name.match(/verde|tierra|militar|camuflaje|musgo/)) {
    return { category: 'tierra', glow: 'rgba(50, 200, 50, 0.5)' };
  }
  if (name.match(/amarillo|dorado|neon|fluor|storm/)) {
    return { category: 'tormenta', glow: 'rgba(212, 255, 0, 0.5)' };
  }
  // Fallback a Eter
  return { category: 'eter', glow: 'rgba(255, 255, 255, 0.3)' };
}

async function removeBackground(filePath, outputFilePath) {
  const fileData = fs.readFileSync(filePath);
  const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
  
  let head = `--${boundary}\r\n`;
  head += `Content-Disposition: form-data; name="size"\r\n\r\n`;
  head += `auto\r\n`;
  head += `--${boundary}\r\n`;
  head += `Content-Disposition: form-data; name="image_file"; filename="${path.basename(filePath)}"\r\n`;
  head += `Content-Type: application/octet-stream\r\n\r\n`;
  
  const tail = `\r\n--${boundary}--\r\n`;

  const body = Buffer.concat([
    Buffer.from(head, 'utf8'),
    fileData,
    Buffer.from(tail, 'utf8')
  ]);

  while (currentKeyIndex < API_KEYS.length) {
    try {
      const response = await fetch('https://api.remove.bg/v1.0/removebg', {
        method: 'POST',
        headers: {
          'X-Api-Key': API_KEYS[currentKeyIndex],
          'Content-Type': `multipart/form-data; boundary=${boundary}`
        },
        body: body
      });

      if (response.ok) {
        const arrayBuffer = await response.arrayBuffer();
        fs.writeFileSync(outputFilePath, Buffer.from(arrayBuffer));
        console.log(`[SUCCESS] Processed: ${path.basename(filePath)} with Key ${currentKeyIndex + 1}`);
        return true;
      } 
      
      const errorText = await response.text();
      console.error(`[ERROR] API Key ${currentKeyIndex + 1} failed: ${response.status} - ${errorText}`);
      
      // Si el error es 402 (Pago Requerido / Créditos insuficientes) o 429 (Límite), rotar llave
      if (response.status === 402 || response.status === 429 || response.status === 403) {
        console.log(`[INFO] Rotating to next API Key...`);
        currentKeyIndex++;
      } else {
        // Error de la imagen en sí (ej. formato), saltarla
        return false;
      }
    } catch (e) {
      console.error(`[NETWORK ERROR]`, e);
      return false;
    }
  }
  
  console.log('[FATAL] All API keys exhausted.');
  return false;
}

async function main() {
  console.log('Scanning directories...');
  const files = getAllFiles(SOURCE_DIR);
  console.log(`Found ${files.length} images to process.`);

  const catalogData = [];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    const filename = path.basename(file);
    const safeName = filename.replace(/[^a-zA-Z0-9]/g, '_').toLowerCase();
    const finalFilename = `${safeName}.png`;
    const outputPath = path.join(TARGET_DIR, finalFilename);
    const publicPath = `/catalog/colecciones/${finalFilename}`;

    const { category, glow } = categorize(filename);
    const sku = `SKU-${category.toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    const cleanName = filename.replace(/\.(jpg|jpeg|png)$/i, '');

    // Check if already processed
    if (fs.existsSync(outputPath)) {
      console.log(`[SKIPPED] ${filename} already exists.`);
      catalogData.push({ id: `um-${i}`, sku, name: cleanName, category, glow, image: publicPath });
      continue;
    }

    console.log(`[${i+1}/${files.length}] Processing ${filename}...`);
    const success = await removeBackground(file, outputPath);
    
    if (success) {
      catalogData.push({ id: `um-${i}`, sku, name: cleanName, category, glow, image: publicPath });
    } else {
      console.log(`[FAIL] Could not remove background for ${filename}. Saving as original...`);
      // Copiar original como fallback
      const fallbackPath = path.join(TARGET_DIR, filename);
      fs.copyFileSync(file, fallbackPath);
      catalogData.push({ id: `um-${i}`, sku, name: cleanName, category, glow, image: `/catalog/colecciones/${filename}` });
    }
    
    // Parar si se acabaron las llaves
    if (currentKeyIndex >= API_KEYS.length) {
      console.log('Stopping process as all keys are exhausted. Remaining files will just be copied.');
      for (let j = i + 1; j < files.length; j++) {
         const remainingFile = files[j];
         const remainingName = path.basename(remainingFile);
         const { category, glow } = categorize(remainingName);
         const rSku = `SKU-${category.toUpperCase()}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
         
         const rFallbackPath = path.join(TARGET_DIR, remainingName);
         if(!fs.existsSync(rFallbackPath)) fs.copyFileSync(remainingFile, rFallbackPath);
         
         catalogData.push({ id: `um-${j}`, sku: rSku, name: remainingName.replace(/\.(jpg|jpeg|png)$/i, ''), category, glow, image: `/catalog/colecciones/${remainingName}` });
      }
      break;
    }
  }

  // Asegurar directorio data
  const dataDir = path.dirname(JSON_OUTPUT);
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  fs.writeFileSync(JSON_OUTPUT, JSON.stringify(catalogData, null, 2));
  console.log(`\nDone! Saved ${catalogData.length} items to catalogData.json`);
}

main();
