import React, {useEffect, useRef, useState} from 'react';
import SpeechRecognition, {  useSpeechRecognition, } from 'react-speech-recognition';
const isBrowser = typeof window !== 'undefined';
import CopyableChat from './DraggableChatBox';
import KeypressDetector from '../KeyPressDetector/KeyPressDetector';
import { stringSimilarity } from "string-similarity-js";//import { createSpeechlySpeechRecognition } from '@speechly/speech-recognition-polyfill';
import io from 'socket.io-client';
import axios, { AxiosResponse } from 'axios';
import { RECEIVER_IP } from '@/utils/app/const';

const autoPoppulateQuestion = false;
const isquestUrl = '/api/isquest';
const questSubstrings = ['how ','explain ', 'what ', 'where ','when ','why ','can ','tell ', 'code ','write ' ];

async function checkItsQuestion(url: string, data: any): Promise<any> {
  try {
    const response: AxiosResponse<any> = await axios.post(url, data);
    return response.data;
  } catch (error) {
    console.error('Error making POST request:', error);
    throw error;
  }
}


const continueConversation = `Assume interview going on, answer the question given the conversation: `
const appId = '89f21c9e-0e73-4305-8e29-b4f026bba552'

/* let socket: any, selfSocket: any;
if(isBrowser){
  console.log("\n\nRECEIVER_IP-->",RECEIVER_IP)
   socket = io(RECEIVER_IP); 
   selfSocket = io(location.origin);
}
 */
// const SpeechlySpeechRecognition = createSpeechlySpeechRecognition(appId);

const handleCopy = (message: string) => {
    navigator.clipboard.writeText(message);
};

const speechSeperator = ', '
let lastText = ''


// const speechRecognition = new SpeechlySpeechRecognition();
// speechRecognition.continuous = true;
// speechRecognition.interimResults = true;
interface Props {
  handleSpeechResult: (result: string) => void;
  onPressKey: (result: string) => void;
  socket: any,
  selfSocket: any,
}
const SpeechRecognitionComponent: React.FC<Props> = ({ handleSpeechResult, onPressKey, socket, selfSocket }) => {
  const {
    transcript,
    listening,
    browserSupportsSpeechRecognition,
    resetTranscript,
  } = useSpeechRecognition();
  const [speechHistory, setSpeechHistory] = React.useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.scrollTop = textareaRef.current.scrollHeight;
    }
  }, [speechHistory.length]);

  React.useEffect(() => {
    if (typeof window !== 'undefined' && !listening) {
        SpeechRecognition.startListening();
    }
    if(!listening){
      if(transcript !== '' && transcript !== lastText){
        selfSocket.emit('filecontent', transcript);
        if(socket.connected){
          socket.emit('message', transcript);
        }
        console.log("🚀 ~ file: SpeechRecognitionComponent.tsx:51 ~ React.useEffect ~ transcript:", transcript)
        lastText = transcript;
        let lastHistory: string[];
        setSpeechHistory((prevHistory) => { 
          lastHistory = prevHistory;
          let cleanScript = [...(prevHistory.slice(-30)), transcript]
          console.log("🚀 ~ file: SpeechRecognitionComponent.tsx:54 ~ setSpeechHistory ~ cleanScript:", cleanScript)
          // if(socket.connected){
          //   socket.emit('message', cleanScript);
          // }
          //socket.emit('message', cleanScript);
          return cleanScript;
        })
        const fetchData = async () => {
          if(questSubstrings.some(str => transcript.toLowerCase().startsWith(str.toLowerCase()))){
            return autoPoppulateQuestion && onPressKey(`${continueConversation}${transcript}`);
          }
          const data = { inputString: transcript };
          const resp = await checkItsQuestion(location.origin +  isquestUrl, data);
          console.log("🚀 ~ file: SpeechRecognitionComponent.tsx:79 ~ fetchData ~ resp:", resp.isQuestion,transcript)
          if(resp && resp.isQuestion){
            //onPressKey(`${continueConversation}${lastHistory.slice(-2).join(speechSeperator)}${transcript}`);
            if(autoPoppulateQuestion){
              return onPressKey(`${continueConversation}${transcript}`);
            }
            return;
            //return onPressKey(`${continueConversation}${transcript}`);
          }
        };
    
        fetchData();
      }
    }
    return () => {
        //SpeechRecognition.stopListening();
    };
  }, [listening, SpeechRecognition.startListening, SpeechRecognition.stopListening]);
  React.useEffect(() => {
   /*  if (transcript) {
        const aggregatedTranscript = getAggregatedTranscript(transcript);
        
        setSpeechHistory((prevHistory) => { 
            let array = [...prevHistory, aggregatedTranscript];
            let cleanScript = removeSimilarSentences(array);
            let last = cleanScript[cleanScript.length-1];
            if(last !== lastText){
              console.log("🚀 ~ file: SpeechRecognitionComponent.tsx:59 ~ setSpeechHistory ~ cleanScript:", last)
              lastText = last;
            }
            socket.emit('message', cleanScript);
            return cleanScript
        });
    } */
  }, [transcript, SpeechRecognition.startListening]);
  const removeSimilarSentences = (sentences: string[]): string[] => {
    if (sentences.length < 4) {
      return sentences;
    }
  
    const lastSentence = sentences[sentences.length - 1]; // Get the last sentence in the array
    const similarSentences = sentences.slice(0, -1); // Get all the sentences except the last one
    const filteredSentences = similarSentences.filter((sentence) => {
        if(lastSentence.indexOf(sentence)!==-1){
            return false
        }
      const similarityScore = stringSimilarity(sentence, lastSentence); // Calculate similarity score
      return similarityScore <= 0.5; // Keep the sentence if the similarity score is less than or equal to 0.5
    });
    console.log("🚀 ~ file: SpeechRecognitionComponent.tsx:80 ~ filteredSentences ~ filteredSentences:", filteredSentences)
  
    const result = [...filteredSentences, lastSentence]; // Combine the filtered sentences with the last sentence
    //selfSocket.emit('filecontent', lastSentence)
    return result.slice(-20);
  };
  
  
  const getAggregatedTranscript = (newTranscript: string) => {
    let aggregatedTranscript = newTranscript;
    if (speechHistory.length > 0) {
        const lastTranscript = speechHistory[speechHistory.length - 1];
        const rating = stringSimilarity(newTranscript, lastTranscript);
        if (rating > 0.5) {
          aggregatedTranscript = newTranscript.substring(lastTranscript.length).trim();
        }
  
    }
    return aggregatedTranscript;
  };


  if (!browserSupportsSpeechRecognition) {
    return <div>Your browser doesn't support speech recognition.</div>;
  }
  return (
    <div>
{/*       <p>Microphone: {listening ? 'on' : 'off'}</p>
      <button onClick={SpeechRecognition.startListening}>Start</button>
      <button onClick={SpeechRecognition.stopListening}>Stop</button>
      <button onClick={resetTranscript}>Reset</button>
 */}      {isBrowser && (
         <div style={{ position: 'relative', height: `${window.innerHeight - 150}px`, width: '250px' }}>
            {/* <textarea ref={textareaRef} style={{color:'black'}} rows={10} cols={30} value={speechHistory.join(' ')} readOnly></textarea>
             */}<div
                style={{
                    position: 'absolute',
                    top: '27%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: '0 2px 10px rgba(0, 0, 0, 0.2)',
                    borderRadius: '8px',
                    overflow: 'hidden',
                    height: '400px',
                    width: '250px',
                }}
            >
                <CopyableChat sentences={speechHistory} onChatClick={(  result: string) => {
                    onPressKey(`${continueConversation}${result}`);
                }}/>
            </div>
            <KeypressDetector onPress={(keys: string)=>{
                let seqFull = keys.split('+');
                let seq = seqFull && seqFull[1];
                const slicedSpeechHistory = seq && speechHistory.slice(-seq);
                const joinedSpeechHistory = slicedSpeechHistory && slicedSpeechHistory.join(speechSeperator);
                onPressKey(`${continueConversation}${joinedSpeechHistory}`);
                //handleCopy(`${continueConversation}${joinedSpeechHistory}`)
                console.log("\n\n\n\nPressedKEyssss-->",keys,seq,speechHistory,joinedSpeechHistory)
            }}/>
         </div>
      )}
      {/* {speechHistory.map((speech, index) => (
        <p key={index}>{speech}</p>
      ))} */}
    </div>
  );
};

export default SpeechRecognitionComponent;
