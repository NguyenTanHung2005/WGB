const fs = require('fs');
const code = fs.readFileSync('src/systems/collisionSystem.ts', 'utf8');
let depth = 0;
for(let i=0; i<code.length; i++) {
  if (code[i] === '[') depth++;
  else if (code[i] === ']') depth--;
}
console.log('Final square bracket depth: ' + depth);
