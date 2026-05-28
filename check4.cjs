const fs = require('fs');
let code = fs.readFileSync('src/systems/collisionSystem.ts', 'utf8');

// Strip single line comments
code = code.replace(/\/\/.*$/gm, '');
// Strip multi line comments
code = code.replace(/\/\*[\s\S]*?\*\//g, '');
// Strip strings
code = code.replace(/(["'])(?:(?=(\\?))\2.)*?\1/g, '');
code = code.replace(/`([^`\\]|\\.)*`/g, '');

let pDepth = 0;
for (let i = 0; i < code.length; i++) {
  if (code[i] === '{') pDepth++;
  else if (code[i] === '}') pDepth--;
}
console.log('Final depth of whole file: ' + pDepth);
