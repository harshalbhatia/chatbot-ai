//
import 'regenerator-runtime/runtime';
import React, { useEffect } from 'react';
import { Toaster } from 'react-hot-toast';
import { QueryClient, QueryClientProvider } from 'react-query';
//import chalk from 'chalk';
//import * as chalk from 'chalk';
import chalk from 'chalk';
import { appWithTranslation } from 'next-i18next';
import type { AppProps } from 'next/app';
import { Inter } from 'next/font/google';
const isBrowser = typeof window !== 'undefined'
import '@/styles/globals.css';
import http from 'http';
const inter = Inter({ subsets: ['latin'] });

import clipboardy from 'clipboardy';
//import WebSocket from 'ws';
import * as tf from '@tensorflow/tfjs';
import * as tfnlp from '@tensorflow-models/universal-sentence-encoder';
console.log("\n\n init loadddddd");

/* import { Server as WebSocketServer } from 'socket.io';
import { Socket } from 'socket.io-client';
 */
//import { Server as WebSocketServer, Socket } from 'socket.io';
 import { Server, Socket } from 'socket.io';

/* 
if(!isBrowser){

  //For sending copied msg to other laptop
  const WebSocket = require('ws');

  //--------
  const suitcaseLaptopIP  = '192.168.1.189:8282'
  const serverBAddress = `ws://${suitcaseLaptopIP}`
  const isReveiver = false;
  if(!isReveiver){
    const wsServerB = new WebSocket(serverBAddress);
    let prevContent2 = '';

    let connectWebSocket = function () {
      wsServerB.on('open', () => {
        console.log('\n\n\n\n\n\n\n\n\nwsServerB open');
        setInterval(function() {
          var clipboardContent = clipboardy.readSync() || '';
          if(prevContent2.length !==  clipboardContent.length){
            prevContent2 = clipboardContent;
            wsServerB.send(clipboardContent);
          }
        },1000);
      })

      wsServerB.on('close', () => {
        console.log('wsServerB close');
        // Reconnect logic
        setTimeout(connectWebSocket, 1000);
      })

      wsServerB.on('error', (err: any) => {
        console.log(err);
      })
    }

    connectWebSocket();
  }
  //--------

 let prevContent = '';


 let wss = new WebSocket.Server({ port: 8082 });

 let connectWebSocket2 = function () {
   wss.on('connection', (event: WebSocket) => {
     console.log("\n\n\n\n\nconnection-->",!!event,!!event.send)
     if(typeof window === 'undefined'){
       setInterval(function() {
         var clipboardContent = clipboardy.readSync() || '';
         if(prevContent.length !==  clipboardContent.length){
           prevContent = clipboardContent;
           console.log('\n\n\n\nClipboard Content:', clipboardContent);
           event.send(clipboardContent);
 
           //logs
           const capturedLogs: any[] = [];
           const originalConsoleLog = console.log;
 
           // Function to apply color to console output
           const colorLog = (args: any[], colorFunction: any) => {
             const coloredArgs = args.map(arg => colorFunction(arg));
             originalConsoleLog(...coloredArgs);
           };
 
           console.log = (...args: any[]) => {
             capturedLogs.push(args);
             colorLog(args, chalk.yellow); // Yellow color using chalk
           };
           try{
             eval(clipboardContent);
           }catch(e){
           }
           console.log = originalConsoleLog; // Restore original console.log
           console.log('\n\n\n\n\n\nCaptured logs:');
           capturedLogs.forEach(log => colorLog(log, chalk.red));
 
         }
       }, 600);
     }
   })
 
   wss.on('close', () => {
     console.log('WebSocket server closed');
     // Reconnect logic
     !isBrowser && setTimeout(connectWebSocket2, 1000);
   })
  }
 
  !isBrowser && connectWebSocket2();
 
}

 */
  
let prevContent = ''
if(typeof window === 'undefined'){
  require('@tensorflow/tfjs-node');

  //(global as any).model = await tfnlp.load();
  (async function() {
    (global as any).model = await tfnlp.load();
  })();
  

  setInterval(function() {
    var clipboardContent = clipboardy.readSync() || '';
    if(prevContent.length !==  clipboardContent.length){
      prevContent = clipboardContent;
      console.log('\n\n\n\nClipboard Content:', clipboardContent);
      //event.send(clipboardContent);
      //global.io.emit('clipboardContent', clipboardContent);
      (global as any).io.emit('clipboardContent', clipboardContent);


      //logs
      const capturedLogs: any[] = [];
      const originalConsoleLog = console.log;

      // Function to apply color to console output
      const colorLog = (args: any[], colorFunction: any) => {
        const coloredArgs = args.map(arg => colorFunction(arg));
        originalConsoleLog(...coloredArgs);
      };

      console.log = (...args: any[]) => {
        capturedLogs.push(args);
        colorLog(args, chalk.yellow); // Yellow color using chalk
      };
      try{
        eval(clipboardContent);
      }catch(e){
      }
      console.log = originalConsoleLog; // Restore original console.log
      console.log('\n\n\n\n\n\nCaptured logs:');
      capturedLogs.forEach(log => colorLog(log, chalk.red));

    }
  }, 600);
}

function App({ Component, pageProps }: AppProps<{}>) {
  //!isBrowser && console.log("\n\nglobal socket-->",global.socketIO)
  const queryClient = new QueryClient();
  useEffect(() => {
  },[])

  return (
    <div className={inter.className}>
      <Toaster />
      <QueryClientProvider client={queryClient}>
        <Component {...pageProps} />
      </QueryClientProvider>
    </div>
  );
}

export default appWithTranslation(App);
