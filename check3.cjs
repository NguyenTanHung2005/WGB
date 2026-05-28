const fs = require('fs');
let code = fs.readFileSync('src/systems/collisionSystem.ts', 'utf8');

// Strip single line comments
code = code.replace(/\/\/.*$/gm, '');
// Strip multi line comments
code = code.replace(/\/\*[\s\S]*?\*\//g, '');

const lines = code.split('\n');
let pDepth = 0;
let stack = [];
for (let i = 0; i < 811; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') { stack.push(i+1); pDepth++; }
    else if (line[j] === '}') { stack.pop(); pDepth--; }
  }
}
console.log('Final paren depth before 811: ' + pDepth);
console.log('Unclosed { lines: ', stack);
