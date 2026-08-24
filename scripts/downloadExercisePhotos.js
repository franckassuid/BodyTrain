import fs from 'node:fs';
import path from 'node:path';

const jsonPath = path.resolve('files/exercises.json');
const exercises = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const publicDir = path.resolve('public/exercises');
fs.mkdirSync(publicDir, { recursive: true });

async function downloadAll() {
  let downloaded = 0;
  let skipped = 0;
  let failed = 0;

  for (const ex of exercises) {
    const slug = ex.slug || ex.id;
    const exDir = path.join(publicDir, slug);

    for (const media of (ex.media || [])) {
      if (media.type === 'start_position' || media.type === 'end_position') {
        const ext = media.format === 'webp' ? 'webp' : 'jpg';
        const filename = media.type === 'start_position' ? `start.${ext}` : `end.${ext}`;
        const targetPath = path.join(exDir, filename);

        // Also save .jpg / .webp compatibility fallback
        const jpgPath = path.join(exDir, media.type === 'start_position' ? 'start.jpg' : 'end.jpg');
        const webpPath = path.join(exDir, media.type === 'start_position' ? 'start.webp' : 'end.webp');

        if (fs.existsSync(targetPath) || fs.existsSync(jpgPath) || fs.existsSync(webpPath)) {
          skipped++;
          continue;
        }

        if (media.sourceUrl) {
          try {
            fs.mkdirSync(exDir, { recursive: true });
            const res = await fetch(media.sourceUrl);
            if (res.ok) {
              const buffer = Buffer.from(await res.arrayBuffer());
              fs.writeFileSync(targetPath, buffer);
              fs.writeFileSync(jpgPath, buffer);
              fs.writeFileSync(webpPath, buffer);
              downloaded++;
              process.stdout.write(`\rDownloaded ${downloaded} photos...`);
            } else {
              failed++;
            }
          } catch (e) {
            failed++;
          }
        }
      }
    }
  }

  console.log(`\nDone! Downloaded: ${downloaded}, Skipped: ${skipped}, Failed: ${failed}`);
}

downloadAll();
