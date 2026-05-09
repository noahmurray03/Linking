const fs = require('fs');
const glob = require('glob');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Specific text replacements
  content = content.replace(/LINK<span className="text-amber-400">ING<\/span>/g, 'Linking');
  content = content.replace(/text-slate-900 tracking-tighter uppercase/g, 'text-slate-900 tracking-tight');
  
  // Replace heavy typography with lighter SaaS typography
  content = content.replace(/font-black/g, 'font-semibold');
  content = content.replace(/text-\[8px\]/g, 'text-xs');
  content = content.replace(/text-\[9px\]/g, 'text-xs');
  content = content.replace(/text-\[10px\]/g, 'text-xs');
  content = content.replace(/text-\[11px\]/g, 'text-xs');
  content = content.replace(/text-\[12px\]/g, 'text-sm');
  
  content = content.replace(/tracking-widest/g, 'tracking-wide');
  content = content.replace(/tracking-\[0\.2em\]/g, 'tracking-wider');
  content = content.replace(/tracking-\[0\.3em\]/g, 'tracking-wider');
  content = content.replace(/tracking-tighter/g, 'tracking-tight');
  
  // Remove excessive uppercase and italic unless it's a specific need, maybe keep uppercase but remove italic
  // Or just remove italic everywhere it's paired with uppercase
  content = content.replace(/uppercase italic/g, 'uppercase');
  content = content.replace(/italic uppercase/g, 'uppercase');

  // Change primary brand colors a bit to be more professional (amber-400 is fine, but maybe less garish)
  // The user said "ren, modern, premium SaaS". 
  
  // Button styles:
  // uppercase tracking-widest text-xs -> text-sm font-medium
  content = content.replace(/uppercase tracking-wide text-xs/g, 'text-sm font-medium');
  content = content.replace(/uppercase tracking-wide text-sm/g, 'text-sm font-medium');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', filePath);
}

// Modify App.tsx and all components
const files = glob.sync('src/**/*.{tsx,jsx,ts,js}');
files.forEach(refactorFile);
