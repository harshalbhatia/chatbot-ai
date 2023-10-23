
const express = require('express');
const chokidar = require('chokidar');
const fs = require('fs');
const app = express();
const PORT = 3001;
const Tesseract = require('tesseract.js');
const WebSocket = require('ws');

const wss = new WebSocket.Server({ port: 8080 });

const basepath = '/Users/pratheesh.pm/'
let desktopPath = basepath + 'Desktop';
let downloandPath = basepath + 'Downloads';
console.log("🚀 ~ file: filewatcher.js:15 ~ desktopPath:", desktopPath)



// Read clipboard content


// Set clipboard content
//clipboardy.writeSync('New clipboard content');
///


// Create a Chokidar watcher to monitor the directory
const watcher = chokidar.watch(desktopPath, {
  persistent: true,
});
  // Initialize an empty variable to store the latest file path
  let latestFilePath = null;


wss.on('connection', (ws) => {
    console.log('Client connected');
    // When a message is received from a client
    ws.on('message', (message) => {
      console.log(`Received message: ${message}`);
      
    
    });

    // When the client disconnects
    ws.on('close', () => {
      console.log('Client disconnected');
    });


    // Event listener for when a new file is added to the directory
    watcher.on('add', (filePath) => {
      latestFilePath = filePath;
      console.log("🚀 ~ file: filewatcher.js:43 ~ watcher.on ~ filePath:", filePath)

      imageToBase64(filePath, (err, base64Image) => {
        console.log("\n\n🚀 ~ file: filewatcher.js:42 ~ imageToBase64 ~ err, base64Image:", err, filePath)
        ocrHandler(base64Image).then((r)=>{
          console.log('Returned OCR Result:', r);
          ws.send(r);
        }).catch((e)=>{})
  
        console.log('New file added:', filePath);
        // Echo the message back to the client
        //ws.send(`Server sending: ${filePath}`);
      });
      });
})


  // Express route to get the latest file path
  app.get('/latest', (req, res) => {
    if (latestFilePath) {
      res.status(200).json({ latestFile: latestFilePath });
    } else {
      res.status(404).json({ error: 'No files found' });
    }
  });

  // Start the Express server
  app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  });

function imageToBase64(filePath,callback) {
  // Read the image file asynchronously
  fs.readFile(filePath, (err, data) => {
    if (err) {
      return callback(err);
      console.error('Error reading the file:', err);
    } else {
      // Encode the image data to base64
      const base64Image = data.toString('base64');
      console.log(base64Image); // Print the base64-encoded image data
      return callback(null, base64Image);
    }
  });
}

function ocrHandler(imgBase64) {
  var imageBuffer = Buffer.from(imgBase64, "base64");

  return Tesseract.recognize(
    imageBuffer,
    'eng',
    { logger: function (info) { console.log(info); } }
  )
  .then(function (result) {
    var text = result.data.text;
    console.log('OCR Result:', text);
    return text;
  })
  .catch(function (error) {
    console.error('Error during OCR:', error);
  });
}