const fs = require('fs');
const file = 'src/app/api/telegram/webhook/route.ts';
let content = fs.readFileSync(file, 'utf8');

// Fix duplicates
content = content.replace(/\[\s*\{\s*text:\s*['"]👨‍⚕️ Сменить врача['"]\s*\}\s*\],\s*\[\s*\{\s*text:\s*['"]👨‍⚕️ Сменить врача['"]\s*\}\s*\]/g, '[{ text: "👨‍⚕️ Сменить врача" }]');

fs.writeFileSync(file, content);
console.log('Fixed duplicates');
