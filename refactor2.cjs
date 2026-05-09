const fs = require('fs');
const glob = require('glob');

function refactorFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');

  // Remove italic styling which looks amateurish when combined with uppercase
  content = content.replace(/ italic/g, '');
  content = content.replace(/italic /g, '');
  content = content.replace(/italic/g, '');

  // Lowercase some of the excessive all-caps UI strings
  content = content.replace(/PLATTFORMSGUIDE/g, 'Plattformsguide');
  content = content.replace(/AI CO-PILOT/g, 'AI Co-pilot');
  content = content.replace(/DET DETERMINISTISKA SYSTEMET/g, 'Det deterministiska systemet');
  content = content.replace(/STRATEGISK PLANERING/g, 'Strategisk planering');
  content = content.replace(/LÖNEBERÄKNINGSLOGIK/g, 'Löneberäkningslogik');

  // Change "RECOMPUTE (ALT+R)" to something cleaner
  content = content.replace(/RECOMPUTE \(ALT\+R\)/g, 'Kalkylera (Alt+R)');
  
  // Make borders a bit softer or removed where not needed
  content = content.replace(/border-2/g, 'border');

  // Smooth out some hard colors
  content = content.replace(/bg-slate-900 text-white/g, 'bg-slate-900 text-white');

  fs.writeFileSync(filePath, content, 'utf8');
  console.log('Refactored', filePath);
}

// Modify App.tsx and all components
const files = glob.sync('src/**/*.{tsx,jsx,ts,js}');
files.forEach(refactorFile);
