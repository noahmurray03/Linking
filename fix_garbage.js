import fs from 'fs';
const path = './src/App.tsx';
let txt = fs.readFileSync(path, 'utf8');
const regex = /\n\s+>\s*\n\s+<MessageSquare size=\{16\} \/>\s*\n\s+<\/button>\s*\n\s+<\/div>\s*\n\s+<\/div>\s*\n\s+<\/div>/;
const newTxt = txt.replace(regex, '');
if (newTxt !== txt) {
    console.log("Patched garbage.");
    fs.writeFileSync(path, newTxt);
} else {
    console.log("Garbage not found with regex.");
}
