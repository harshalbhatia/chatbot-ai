// minify-server.js
const fs = require('fs');
const terser = require('terser');

// Read the original server.js file
const originalCode = fs.readFileSync('./server.js', 'utf8');

// Minify and obfuscate the code
terser.minify(originalCode)
  .then((result) => {
    if (result.error) {
      console.error('Error minifying server.js:', result.error);
    } else {
      // Write the minified code to a new file (minified-server.js)
      fs.writeFileSync('./minifiedServer.js', result.code);
      console.log('minified-server.js has been created.');
    }
  })
  .catch((error) => {
    console.error('Error minifying server.js:', error);
  });
