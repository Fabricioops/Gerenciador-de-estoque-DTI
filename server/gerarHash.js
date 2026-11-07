const bcrypt = require('bcryptjs');
const readline = require('readline');

function readPassword() {
  if (!process.stdin.isTTY) {
    const chunks = [];
    process.stdin.setEncoding('utf8');
    return new Promise((resolve, reject) => {
      process.stdin.on('data', chunk => chunks.push(chunk));
      process.stdin.on('end', () => resolve(chunks.join('').trimEnd()));
      process.stdin.on('error', reject);
    });
  }

  const stdin = process.stdin;
  readline.emitKeypressEvents(stdin);
  stdin.setRawMode(true);
  stdin.resume();
  process.stdout.write('Digite a senha (mínimo 12 caracteres): ');

  return new Promise(resolve => {
    let password = '';
    const onKeypress = (text, key) => {
      if (key.ctrl && key.name === 'c') {
        process.stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        process.exitCode = 1;
        resolve('');
        return;
      }
      if (key.name === 'return' || key.name === 'enter') {
        process.stdout.write('\n');
        stdin.setRawMode(false);
        stdin.pause();
        stdin.off('keypress', onKeypress);
        resolve(password);
        return;
      }
      if (key.name === 'backspace') {
        password = [...password].slice(0, -1).join('');
        return;
      }
      if (text && !key.ctrl && !key.meta) password += text;
    };
    stdin.on('keypress', onKeypress);
  });
}

(async () => {
  const password = await readPassword();
  if (password.length < 12) {
    console.error('A senha deve ter pelo menos 12 caracteres.');
    process.exitCode = 1;
    return;
  }
  console.log(`Hash bcrypt para provisionamento manual: ${await bcrypt.hash(password, 10)}`);
})();