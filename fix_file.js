import fs from 'fs';

const filePath = './src/App.tsx';
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Fix correlated line 2522 (index 2521)
// We look for the line containing "dras fr"
const corruptionIndex = lines.findIndex(l => l.includes('dras fr'));
if (corruptionIndex !== -1) {
  console.log(`Found corruption at line ${corruptionIndex + 1}`);
  lines[corruptionIndex] = `                                Både <span className="text-slate-900 font-bold">ränta och amortering</span> dras från ditt likvida kassaflöde.
                              </p>
                            </div>
                          </div>
                        </div>

                        <div className="col-span-full space-y-8">`;
}

// Fix garbage at 2596 area
const garbageIndex = lines.findIndex(l => l.trim() === '>');
if (garbageIndex !== -1 && garbageIndex > 2500) {
    console.log(`Found garbage at line ${garbageIndex + 1}`);
    // lines 2596 to 2601 should be removed or cleaned
    // Let's trace back from line 2585
    // Actually, we can just remove the specific block
    lines.splice(garbageIndex, 6); 
}

fs.writeFileSync(filePath, lines.join('\n'));
console.log('File patched.');
