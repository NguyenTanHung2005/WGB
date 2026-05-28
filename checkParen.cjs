const fs = require('fs');
const code = fs.readFileSync('src/systems/collisionSystem.ts', 'utf8');
const lines = code.split('\n');
let pDepth = 0;
let stack = [];
for (let i = 0; i < 811; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '(') { pDepth++; stack.push(i+1); }
    else if (line[j] === ')') { pDepth--; stack.pop(); }
  }
}
console.log('Final paren depth before 811: ' + pDepth);
console.log('Unclosed ( lines: ', stack);
