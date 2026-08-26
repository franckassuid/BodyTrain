import fs from "node:fs";
import path from "node:path";
import { Communicate } from "edge-tts-universal";

const CUES = [
  { id: "countdown_5", text: "Cinq" },
  { id: "countdown_4", text: "Quatre" },
  { id: "countdown_3", text: "Trois" },
  { id: "countdown_2", text: "Deux" },
  { id: "countdown_1", text: "Un" },
  { id: "start", text: "C'est parti !" },
  { id: "prep", text: "Préparez-vous pour le prochain mouvement." },
  { id: "rest", text: "Repos, respirez calmement." },
  { id: "halfway", text: "À mi-parcours, gardez le rythme !" },
  { id: "complete", text: "Séance terminée ! Félicitations pour votre réveil en mouvement !" },
];

const VOICES = [
  { gender: "male", voice: "fr-FR-HenriNeural" },
  { gender: "female", voice: "fr-FR-DeniseNeural" },
];

async function generateAll() {
  for (const { gender, voice } of VOICES) {
    const dir = path.resolve(`public/audio/cues/${gender}`);
    fs.mkdirSync(dir, { recursive: true });

    console.log(`Generating studio cues for ${gender} (${voice})...`);
    for (const cue of CUES) {
      const filePath = path.join(dir, `${cue.id}.mp3`);
      if (fs.existsSync(filePath)) {
        console.log(`  ✓ ${cue.id}.mp3 already exists`);
        continue;
      }

      try {
        const comm = new Communicate(cue.text, { voice, rate: "+2%" });
        const chunks = [];
        for await (const chunk of comm.stream()) {
          if (chunk.type === "audio") chunks.push(chunk.data);
        }
        const buffer = Buffer.concat(chunks);
        fs.writeFileSync(filePath, buffer);
        console.log(`  ✓ Created ${cue.id}.mp3 (${buffer.length} bytes)`);
      } catch (err) {
        console.error(`  ✗ Error creating ${cue.id}.mp3:`, err.message);
      }
    }
  }
  console.log("All studio cues generated successfully!");
}

generateAll();
