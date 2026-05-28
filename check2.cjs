const fs = require('fs');
const code = fs.readFileSync('src/systems/collisionSystem.ts', 'utf8');
const lines = code.split('\n');
let stack = [];
for (let i = 0; i < 811; i++) {
  const line = lines[i];
  for (let j = 0; j < line.length; j++) {
    if (line[j] === '{') stack.push(i + 1);
    else if (line[j] === '}') {
      if (stack.length > 0) stack.pop();
    }
  }
}
console.log('Unclosed { before line 811 at lines: ', stack);
