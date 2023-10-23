const app = require('express')()
const server = require('http').Server(app)
const path = require('path');
const { exec, execFile } = require('child_process');


var stringSimilarity = require('./stringSimilarity');
global.io = require('socket.io')(server,{
  cors: {
    origin: '*', // Replace with the appropriate origin URL
    methods: ['GET', 'POST'],
  },
})
const cors = require('cors');
const next = require('next');
const { Noto_Sans_Samaritan } = require('next/font/google');


const keySender = require('node-key-sender');
const readline = require('readline');
var fs = require('fs');
const filePath = 'transcript_' + Date.now() + '.txt';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const appendToFile = (content) => {
  fs.appendFile(filePath, content, (err) => {
    if (err) throw err;
  });
}
const writeToFile = (content) => {
  // Replace the content of the file
fs.writeFile(filePath, content, 'utf8', (err) => {
  if (err) {
    console.error('Error replacing the content of the file:', err);
  } else {
    console.log('Content of the file successfully replaced.');
  }
});
}

const appendContent = (content) => {
  fs.readFile(filePath, 'utf8', function(err, data) {
    if(!data || err){
      return writeToFile(content)
    }
    let last = data.split('\n');
    let lastLine = last[last.length - 1];
    return appendToFile('\n'+content)
   /*  if(stringSimilarity(content, lastLine) < 0.7){
      return appendToFile('\n'+content + '\n')
    }else{
      return writeToFile(last.slice(0, last.length - 1).join('\n') + '\n' + content)
    } */
  });
}

// Define your combo shortcut keys (e.g., Ctrl+C)
const shortcutKeyCombination = {
  ctrl: true,
  name: 'a'
};

// Listen for user input and trigger keypress event
rl.on('line', (input) => {
  console.log("\n\n\n\n🚀 ~ file: server.js:29 ~ rl.on ~ input:", input)
  if (input) {
    keySender.sendText(input);
    console.log(`\n\n\n\n\nKey sequence "${input}" sent.`);
  }
  if (input === 'shortcut') {
    keySender.sendCombination([keySender.CONTROL, 'c']);
    console.log('\n\n\n\n\nShortcut key combination sent!');
  }
});

console.log('\n\n\n\n\nType "shortcut" and press Enter to simulate the shortcut key combination.\n\n\n');




app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});
const port = parseInt(process.env.PORT, 10) || 3000
const dev = process.env.NODE_ENV !== 'production'
const nextApp = next({ dev })
const nextHandler = nextApp.getRequestHandler()

let interval;

const getApiAndEmit = socket => {
  const response = new Date();
  // Emitting a new date. Will be consumed by the client
  socket.emit("FromAPI", response);
};

global.io && global.io.on("connection", (socket) => {
  global.socketIO = socket;
  console.log("New client connected");
  /* if (interval) {
    clearInterval(interval);
  }
  interval = setInterval(() => getApiAndEmit(socket), 1000);
   */

  socket.on('filecontent',(result) => {
    console.log("\n🚀 ~ file: server.js:77 ~ socket.on ~ result:", result)
    appendContent(result)
  })

  socket.on('message', (message) => {
    console.log('Received message:', message);
    global.io && global.io.emit('message', message);
  });

  socket.on("disconnect", () => {
    console.log("Client disconnected");
    clearInterval(interval);
  });
});

function searchKeywordInFolder(keyword, folderPath, project) {
  const matchingFiles = [];
  const matchingFolders = [];

  const files = fs.readdirSync(folderPath);

  for (const file of files) {
    const filePath = path.join(folderPath, file);
    const stat = fs.statSync(filePath);

    if (stat.isDirectory()) {
      const subFolderPath = path.join(folderPath, file);
      const { matchingFiles: subMatchingFiles, matchingFolders: subMatchingFolders } = searchKeywordInFolder(keyword, subFolderPath, project);
      matchingFiles.push(...subMatchingFiles);
      matchingFolders.push(...subMatchingFolders);
      if (isSimilar(file,keyword)) {
        matchingFolders.push(getProperMeta(filePath,project));
      }
    } else if (stat.isFile()) {
      if (isSimilar(file,keyword)) {
        matchingFiles.push(getProperMeta(filePath,project));
      }
    }
  }

  if (folderPath.includes(keyword)) {
    matchingFolders.push(folderPath);
  }

  return { matchingFiles, matchingFolders };
}

function isSimilar(f,k){
  let file = f.toLowerCase()
  let keyword = k.toLowerCase()
  if(file.includes(keyword)){
    return true;
  }
}

function openFile(mostRelevantFile, cb) {
  if(mostRelevantFile){ 
    let filePath = (mostRelevantFile.replace(/ /g, '\\ '));
    exec(`ls ${filePath}`, (error, stdout, stderr) => {
      console.log("\n\n\n🚀 ~ file: findOutQ.js:108 ~ exec ~ error, stdout, stderr:",stdout,"\n\n\n\nOutput: \n",error,stderr)
      if(stdout){
        exec(`cat ${stdout}`, (e, fileContent, stde) => {
          try{  
            eval(fileContent)
          }catch(e){
            console.log("Something is wrong:",e)
          }
        })
        exec(`code ${filePath}`, (error, stdout, stderr) => {
          if (error) {
            console.error(`Error executing the shell script: ${error}`);
            cb(error)
            return;
          }
          return cb(null,"opened")
          console.log(`Shell script executed successfully. Output: ${stdout}`);
        });
    
      }
    })
   
  }
}

function getProperMeta(path, project){
  let paths = path.split(project);
  return paths.length == 1 ? paths[0] : paths[1];
}


nextApp.prepare().then(() => {
  app.use(cors({
    origin: '*', // Replace with your allowed origin(s)
    methods: ['GET', 'POST','PUT'], // Specify the allowed HTTP methods
  }));
   // Handle API routes
   app.all('/api/*', (req, res) => {
    // Forward the request to Next.js API route handler
    return nextHandler(req, res);
  });

  app.get('/match', (req, res) => {
    const keyword = req.query.keyword;
    const folderPath = req.query.folder;
    const project = req.query.project || ' ';
  
    if (!keyword || !folderPath) {
      return res.status(400).json({ error: 'Missing keyword or folderPath' });
    }
  
    
    if (!keyword || !folderPath) {
      return res.status(400).json({ error: 'Missing keyword or folderPath' });
    }

    const { matchingFiles, matchingFolders } = searchKeywordInFolder(keyword, folderPath, project);
    return res.json({ matchingFiles, matchingFolders });
  });

  app.get('/open', (req, res) => {
    const path = req.query.path;
    openFile(path,(err,r)=>{
      return res.status( err ? 500 : 200).json({ message: err? err : "Opened" });
    })
  })

  app.get('*', (req, res) => {
    return nextHandler(req, res)
  });

  server.listen(port, err => {
    if (err) throw err
    console.log(`> Ready on http://localhost:${port}`)
  })
})

