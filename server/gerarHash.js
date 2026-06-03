const bcrypt = require('bcryptjs');

async function gerar() {

   const hash = await bcrypt.hash('123456', 10);

   console.log(hash);

}

gerar();