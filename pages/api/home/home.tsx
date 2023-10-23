import { useEffect, useRef, useState, useCallback } from 'react';
import { useQuery } from 'react-query';
const enableWebsockets = true;
import { GetServerSideProps } from 'next';
import { useTranslation } from 'next-i18next';
import { serverSideTranslations } from 'next-i18next/serverSideTranslations';
import Head from 'next/head';
import chalk from 'chalk';
import SpeechRecognitionComponent from '../../../components/SpeechRec/SpeechRecognitionComponent';
import { useCreateReducer } from '@/hooks/useCreateReducer';
import KeypressDetector from '../../../components/KeyPressDetector/KeyPressDetector';
const isBrowser = typeof window !== 'undefined';

import useErrorService from '@/services/errorService';
import useApiService from '@/services/useApiService';
import MsgCopy from '../../../components/MsgCopy';
import io from 'socket.io-client';
import { RECEIVER_IP, DIAGRAM_SEARCH_ENDPOINT, sysDesignFolder, sysDesignPath } from '@/utils/app/const';

import useSocket from '@/hooks/useSocket';
import {
  cleanConversationHistory,
  cleanSelectedConversation,
} from '@/utils/app/clean';
import { DEFAULT_SYSTEM_PROMPT, DEFAULT_TEMPERATURE } from '@/utils/app/const';
import {
  saveConversation,
  saveConversations,
  updateConversation,
} from '@/utils/app/conversation';
import { saveFolders } from '@/utils/app/folders';
import { savePrompts } from '@/utils/app/prompts';
import { getSettings } from '@/utils/app/settings';

import { Conversation } from '@/types/chat';
import { KeyValuePair } from '@/types/data';
import { FolderInterface, FolderType } from '@/types/folder';
import { OpenAIModelID, OpenAIModels, fallbackModelID } from '@/types/openai';
import { Prompt } from '@/types/prompt';

import { Chat } from '@/components/Chat/Chat';
import { Chatbar } from '@/components/Chatbar/Chatbar';
import { Navbar } from '@/components/Mobile/Navbar';
import Promptbar from '@/components/Promptbar';

import HomeContext from './home.context';
import { HomeInitialState, initialState } from './home.state';

import axios, { AxiosError, AxiosResponse } from 'axios';
import { useFilePicker } from 'use-file-picker';
import { v4 as uuidv4 } from 'uuid';
import Collapsible from 'react-collapsible';
//import { io, Socket } from 'socket.io-client';
//import { io, Socket } from 'socket.io-client/dist/socket.io.js';
//import io from 'socket.io-client';



//give me js code for this with explanation in code comments
const leetcodePrompt =
  'For the below questions, give me these: 1. what question number leetcode question it is. 2. brute force approach with time complexity in one line. 3. Efficient algo(try avoiding dyanmic programming if possible) approach with time and space complexity in 1 lines. 5. js code of efficient solution with explanation in code comments. Question: ';
const reactPrompt = 'For the below react question: 1. give short and simple functional modularized react components in js with css code with explanation in comments all in a single file. Question: ';
const codeOutputPrompt = `For the below code, what is the expected output. Code: `
const codeErrorPrompt = `For the below code, give the corrected code and tell me what is the error. Code: `
let clipboardData = '';
let sysDesignQuestion = '';
let feQs = '30secsJsStuff';
const labelStyle = {margin:'3px'}

let ws:WebSocket,ws2:WebSocket,wsReceiver: WebSocket,  ws3: any;
let socket: any, selfSocket: any;//, diagramSocket: any;
if(isBrowser){
  console.log("\n\nRECEIVER_IP-->",RECEIVER_IP)
   socket = io(RECEIVER_IP); 
   selfSocket = io(location.origin);
   //diagramSocket = io(DIAGRAM_SEARCH_ENDPOINT);
}

const isReveiver = 0;

const systemDesignPrompts = [
  'Assume you are giving system design interview For the below system design question, givefunctional and non functional requirements with what other possible questions we can ask the interviewer for more info gathering(highlight main ones). Question:',
  'give me the Requests Per Second, storage, bandwidth for a given 1 billion DAUs. with explanation.',
  'simple intro of top level HLD with detailed data flow using latest technologies',
  
  'Create an Entity-Relationship (ER) diagram with detailed db schema with relationships, sample apis(with data types) and major services',
  'High Level design with detailed explaination of data flow through the services',
  'Low level design of critical services involved and possible algorithms',
  
  'possible single point of failures and solutions for the same?'
]

const FESystemDesignPrompts = [
  'Assume you r giving frontend system design interview to Google/Facebook, give me all possible functional and few non functional requirements with what other possible questions we can ask the interviewer for more info gathering(highlight main ones). Question: ',
  'give me MVP specific Component architecture with props(dependencies graph, component tree of important ones other than basic ones like app, navbar, sidebar,footer) and FE data model with api structure  against each of the main components(with props) for the same question?',
  'which all main feature specific(suitable to the question) third party libraries(other than react/redux/axios/reactRouter/lodash/ReduxSaga/ReactHelmet/anyDevtools) can be used for this given question? Explain against each library with the features',
  
  'where all can we use feature specific performance optimizations like virtualization/debounce/throttling/optimistic updates/iframes/webWorkers/indexDb/webSockets/ServiceWorker/BrowserStorages etc?',
  'Can we use any famous known algorithms or libraries for performance and optimizations and also mention against each where we use in this design question?',
  'Pick up the top 4 important features(other than user registration/auth, can use 3rd party libs) of this design question (for MVP) and explain in depth of functionality?',

  'what all can we cache in this question? and how can we use do to improve the performance and to get these metrics better: FP, FCP, FMP, TTI, TTFB? Answer against each'
]

const diagramPrompts = [
  "detailed requirementDiagram for frontend system design of ",
  "detailed graph  for  frontend system design of ",
  "detailed user journey  for  frontend system design of ",
  "detailed class diagram  for  frontend system design of ",
  "detailed component architecture diagram  for  frontend system design of ",
]
/*
 detailed requirementDiagram for system design of google calender
 detailed graph  for system design of google calender
 detailed user journey  for system design of google calender
*/
let diagramsOpened: boolean = false;
const openUpDiagrams = ((data: string) => {
  let counter = 0;
  const interval = setInterval(() => {
    if (counter < diagramPrompts.length) {
      //window.open(`${DIAGRAM_SEARCH_ENDPOINT}/?search=${data}&prefix=${diagramPrompts[counter]}`, '_blank');
      openNewTabStayOnCurrent(`${DIAGRAM_SEARCH_ENDPOINT}/?search=${data}&prefix=${diagramPrompts[counter]}`)
      counter++;
    } else {
      clearInterval(interval);
    }
  }, 100);
  //window.open(`${RECEIVER_IP}/?search=${data}&prefix=${diagramPrompts[0]}`, '_blank');
})

const openUpSearch = ((data: string) => {
  openNewTabStayOnCurrent(`${DIAGRAM_SEARCH_ENDPOINT}/summary?search=${data}&prefix=${"FE System Design for"}`)
})

const initialOpt = ''
if(enableWebsockets && typeof window !== 'undefined'){
    let domain = location.host.split(":")[0]
  // Connect to the WebSocket server
  ws = new WebSocket(`ws://${domain}:8080`);
  ws2 = new WebSocket(`ws://${domain}:8081`);
  //ws3 = new WebSocket('ws://localhost:8082');
}

interface Props {
  serverSideApiKeyIsSet: boolean;
  serverSidePluginKeysSet: boolean;
  defaultModelId: OpenAIModelID;
  startListening: () => void;
  stopListening: () => void;
  transcript: string;
  listening: boolean;
}



/* if(typeof window !== 'undefined'){
  const clipboard = navigator.clipboard;
  document.addEventListener('copy', function (e: ClipboardEvent) {
    // Get the selected text from the document
    const selectedText = window.getSelection()?.toString() || '';
    console.log("\n\n\n🚀 ~ file: home.tsx:64 ~ selectedText:", selectedText)
 
  });
  
  // Create a callback function to be called when the clipboard content changes.
  const clipboardChangeCallback = () => {
    // Get the current clipboard content.
    const clipboardContent = clipboard.readText();
  
    // Do something with the clipboard content.
    console.log(`\n\n\n\nClipboard content changed: ${clipboardContent}`);
  };
  
  // Register the callback function to be called when the clipboard content changes.
  clipboard.addEventListener('change', clipboardChangeCallback);
  
} */

// Function to open a new tab and stay on the current page
function openNewTabStayOnCurrent(url: string) {
  window.open(url,'_blank');
  //newTab.location.href = url;
  window.focus();
}

const Home = ({
  serverSideApiKeyIsSet,
  serverSidePluginKeysSet,
  defaultModelId,
  
}: Props) => {
  const { t } = useTranslation('chat');
  const { getModels } = useApiService();
  const { getModelsError } = useErrorService();
  const [initialRender, setInitialRender] = useState<boolean>(true);
  const [fileContent, setFileContent] = useState<string>('');
  const [selectedOption, setSelectedOption] = useState<string>('leetcode');
  const [messagedCopied, setMessageCopied] = useState(false);
  const [sysDesignCounter, setSysDesignCounter] = useState<any>('none');
  const [selectedSystemDesign, setSelectedSystemDesign] = useState<string>('FE');
  const [relevantFiles, setRelevantFiles] = useState<any>();
  const [fileSearch, setFileSearch] = useState<string>('');

  const [speechResult, setSpeechResult] = useState('');
  const handleSpeechResult = (result: string) => {
    setSpeechResult(result);
  };
  //  console.log("🚀 ~ file: home.tsx:71 ~ selectedOption:", selectedOption)


  const [openFileSelector, { filesContent, loading, errors }] = useFilePicker({
    readAs: 'DataURL',
    accept: 'image/*',
    multiple: true,
    limitFilesConfig: { max: 2 },
    // minFileSize: 1,
    maxFileSize: 50, // in megabytes
    onFilesSelected: ({ plainFiles, filesContent, errors }) => {
      // this callback is always called, even if there are errors
      var base64Data =
        filesContent && filesContent[0] && filesContent[0].content;
      let data = JSON.stringify({
        data: base64Data.split(';base64,')[1],
      });
      let config = {
        method: 'post',
        maxBodyLength: Infinity,
        url: '/api/ocr',
        headers: {
          'Content-Type': 'application/json',
        },
        data: data,
      };

      axios
        .request(config)
        .then((response: AxiosResponse) => {
          let prompt = ''
          console.log('RSP------->', JSON.stringify(response.data));
          switch(selectedOption){
            case 'finderror':
              prompt = codeErrorPrompt;
              break;
            case 'leetcode':
              prompt = leetcodePrompt;
              break;
            case 'react':
              prompt = reactPrompt;
              break;
            case 'codeoutput':
              prompt = codeOutputPrompt;
              break;
            default:    
          }
          let correctPropmpt = `${prompt}${JSON.stringify(response.data)}`
          setFileContent(correctPropmpt);
          console.log("🚀 ~ file: home.tsx:119 ~ .then ~ correctPropmpt:", correctPropmpt)
        })
        .catch((error: AxiosError) => {
          console.log(error);
        });
      console.log(
        '🚀 ~ file: ocr.js:25 ~ Dashboard ~ base64Data:',
        base64Data && base64Data.split(';base64,')[1],
      );
    },
    onFilesRejected: ({ errors }) => {
      // this callback is called when there were validation errors
      console.log('onFilesRejected', errors);
    },
    onFilesSuccessfulySelected: ({ plainFiles, filesContent }) => {
      // this callback is called when there were no validation errors
      //console.log('onFilesSuccessfulySelected', plainFiles, filesContent);
    },
  });




  useSocket('clipboardContent', data => {
    if(data){
      socket.emit('clipboardContent',data);
      console.log("\n\n\n\n\npratheesh🚀 ~ file: home.tsx:225 ~ useEffect ~ sysDesignCounter:", data)
      if(sysDesignCounter === 0 ){
        data && setFileContent(`${ selectedSystemDesign == 'FE' ? FESystemDesignPrompts[0] :  systemDesignPrompts[0]} ${data}`);
        executeClick()
        sysDesignQuestion = data;
        //openUpDiagrams(data);
        diagramsOpened = true;
        fetchRelevantFiles(data);
        return;
      }
      //data && setFileContent(data)
      console.log("\n\n\npratheesh--->",selectedOption,data)
      data && onMsgHandler({data: data})
      if(selectedOption == 'leetcode'){
        console.log("\n\n pratheesh should come here")
        window.open(`http://localhost:3001/search?term=${data}&from=chatbotai`, '_blank');
      }
      setTimeout(()=>{
        // Simulating a click event on the button
          let button = document.getElementById('send-button');

          if (button) 
            button.click();

          let clipboardContent = data;
          const capturedLogs: any[] = [];
          const originalConsoleLog = console.log;
          
          // Function to apply color to console output
          const colorLog = (args: any[], colorFunction: any) => {
            const coloredArgs = args.map(arg => {
              return colorFunction(arg)
            });
            originalConsoleLog(...coloredArgs);
          };
          
          console.log = (...args: any[]) => {
            capturedLogs.push(args);
            colorLog(args, chalk.yellow); // Yellow color using chalk
          };
          try{

            eval(clipboardContent);
          }catch(e){}
          console.log = originalConsoleLog; // Restore original console.log
          console.log('\n\n\n\n\n\nCaptured logs:');
          capturedLogs.forEach(log => colorLog(log, chalk.red));
              

      },1000);
    }
  })

  const fetchRelevantFiles = async (file: string = sysDesignQuestion, path: string = '', project: string = '') => {
    console.log("\n\nurl-->",`/match?keyword=${file}&folder=${path ? path : `${sysDesignPath}${sysDesignFolder}`}`,project);
    //const res = await axios.get(`/match?keyword=${file}&folder=${sysDesignPath}${sysDesignFolder}&project=${sysDesignFolder}`);
    const res = await axios.get(`/match?keyword=${file}&folder=${path ? path : `${sysDesignPath}${sysDesignFolder}`}&project=${project ? project : sysDesignFolder}`);
    const files = res.data;
    console.log("🚀 ~ file: home.tsx:333 ~ fetchRelevantFiles ~ res.data:", res.data)
    setRelevantFiles(files);
    return files;
  }

  const executeClick = () => {
    setTimeout(()=>{
      // Simulating a click event on the button
      let button = document.getElementById('send-button');

      if (button) 
        button.click();
    },1000)
    return;
  }
  const handleOptionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedOption(event.target.value);
  };
  //  console.log("🚀 ~ file: home.tsx:60 ~ fileContent:", fileContent)

  const onMsgHandler = (event: any) => {
    console.log(
      '🚀 ~ file: home.tsx:116 ~ useEffect ~ event.data:',
      event.data,
    );
    let prompt = ''
    switch(selectedOption){
      case 'finderror':
        prompt = codeErrorPrompt;
        break;
      case 'leetcode':
        prompt = leetcodePrompt;
        break;
      case 'react':
        prompt = reactPrompt;
        break;
      case 'codeoutput':
        prompt = codeOutputPrompt;
        break;
      case 'systemdesign':
        prompt =  selectedSystemDesign == 'FE' ? FESystemDesignPrompts[sysDesignCounter] :  systemDesignPrompts[sysDesignCounter];    
        break;
      default:    
    }
    let correctPropmpt = `${prompt}${event.data}`
    setFileContent(correctPropmpt);
    console.log("🚀 ~ file: home.tsx:119 ~ .then ~ correctPropmpt:", correctPropmpt)
  }

  useEffect(() => {
    if(isReveiver){ 
      wsReceiver.onmessage = onMsgHandler;
    }
    if(enableWebsockets){
      // When a message is received from the server
        ws.onmessage = onMsgHandler;
        ws2.onmessage = onMsgHandler;
    }
    //const button = document.getElementById('send-button');
  

/*     ws3.on('clipboardContent',(event: MessageEvent) => {
      
      if(event.data){
        console.log("\n\n\n\n\npratheesh🚀 ~ file: home.tsx:225 ~ useEffect ~ sysDesignCounter:", sysDesignCounter)
        if(sysDesignCounter === 0){
          event.data && setFileContent(`${ selectedSystemDesign == 'FE' ? FESystemDesignPrompts[0] :  systemDesignPrompts[0]} ${event.data}`);
          executeClick()
          return;
        }
        event.data && setFileContent(event.data)
        setTimeout(()=>{
          // Simulating a click event on the button
            let button = document.getElementById('send-button');

            if (button) 
              button.click();

            let clipboardContent = event.data;
            const capturedLogs: any[] = [];
            const originalConsoleLog = console.log;
            
            // Function to apply color to console output
            const colorLog = (args: any[], colorFunction: any) => {
              const coloredArgs = args.map(arg => {
                return colorFunction(arg)
              });
              originalConsoleLog(...coloredArgs);
            };
            
            console.log = (...args: any[]) => {
              capturedLogs.push(args);
              colorLog(args, chalk.yellow); // Yellow color using chalk
            };
            try{

              eval(clipboardContent);
            }catch(e){}
            console.log = originalConsoleLog; // Restore original console.log
            console.log('\n\n\n\n\n\nCaptured logs:');
            capturedLogs.forEach(log => colorLog(log, chalk.red));
                

        },1000);
      }
      })

 */    // Clean up the WebSocket connection when component unmounts
    return () => {
      // ws.close();
      // ws2.close();
      // ws3.close();
    };
  }, [selectedOption, sysDesignCounter]);

  const contextValue = useCreateReducer<HomeInitialState>({
    initialState,
  });

  const {
    state: {
      apiKey,
      lightMode,
      folders,
      conversations,
      selectedConversation,
      prompts,
      temperature,
    },
    dispatch,
  } = contextValue;

  const stopConversationRef = useRef<boolean>(false);

  const { data, error, refetch } = useQuery(
    ['GetModels', apiKey, serverSideApiKeyIsSet],
    ({ signal }) => {
      if (!apiKey && !serverSideApiKeyIsSet) return null;

      return getModels(
        {
          key: apiKey,
        },
        signal,
      );
    },
    { enabled: true, refetchOnMount: false },
  );

  useEffect(() => {
    if (data) dispatch({ field: 'models', value: data });
  }, [data, dispatch]);

  useEffect(() => {
    dispatch({ field: 'modelError', value: getModelsError(error) });
  }, [dispatch, error, getModelsError]);

  // FETCH MODELS ----------------------------------------------

  const handleSelectConversation = (conversation: Conversation) => {
    dispatch({
      field: 'selectedConversation',
      value: conversation,
    });

    saveConversation(conversation);
  };

  // FOLDER OPERATIONS  --------------------------------------------

  const handleCreateFolder = (name: string, type: FolderType) => {
    const newFolder: FolderInterface = {
      id: uuidv4(),
      name,
      type,
    };

    const updatedFolders = [...folders, newFolder];

    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);
  };

  const handleDeleteFolder = (folderId: string) => {
    const updatedFolders = folders.filter((f) => f.id !== folderId);
    dispatch({ field: 'folders', value: updatedFolders });
    saveFolders(updatedFolders);

    const updatedConversations: Conversation[] = conversations.map((c) => {
      if (c.folderId === folderId) {
        return {
          ...c,
          folderId: null,
        };
      }

      return c;
    });

    dispatch({ field: 'conversations', value: updatedConversations });
    saveConversations(updatedConversations);

    const updatedPrompts: Prompt[] = prompts.map((p) => {
      if (p.folderId === folderId) {
        return {
          ...p,
          folderId: null,
        };
      }

      return p;
    });

    dispatch({ field: 'prompts', value: updatedPrompts });
    savePrompts(updatedPrompts);
  };

  const handleUpdateFolder = (folderId: string, name: string) => {
    const updatedFolders = folders.map((f) => {
      if (f.id === folderId) {
        return {
          ...f,
          name,
        };
      }

      return f;
    });

    dispatch({ field: 'folders', value: updatedFolders });

    saveFolders(updatedFolders);
  };

  // CONVERSATION OPERATIONS  --------------------------------------------

  const handleNewConversation = () => {
    const lastConversation = conversations[conversations.length - 1];

    const newConversation: Conversation = {
      id: uuidv4(),
      name: t('New Conversation'),
      messages: [],
      model: lastConversation?.model || {
        id: OpenAIModels[defaultModelId].id,
        name: OpenAIModels[defaultModelId].name,
        maxLength: OpenAIModels[defaultModelId].maxLength,
        tokenLimit: OpenAIModels[defaultModelId].tokenLimit,
      },
      prompt: DEFAULT_SYSTEM_PROMPT,
      temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
      folderId: null,
    };

    const updatedConversations = [...conversations, newConversation];

    dispatch({ field: 'selectedConversation', value: newConversation });
    dispatch({ field: 'conversations', value: updatedConversations });

    saveConversation(newConversation);
    saveConversations(updatedConversations);

    dispatch({ field: 'loading', value: false });
  };

  const handleUpdateConversation = (
    conversation: Conversation,
    data: KeyValuePair,
  ) => {
    const updatedConversation = {
      ...conversation,
      [data.key]: data.value,
    };

    const { single, all } = updateConversation(
      updatedConversation,
      conversations,
    );

    dispatch({ field: 'selectedConversation', value: single });
    dispatch({ field: 'conversations', value: all });
  };

  // EFFECTS  --------------------------------------------

  useEffect(() => {
    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
    }
  }, [selectedConversation]);

  useEffect(() => {
    defaultModelId &&
      dispatch({ field: 'defaultModelId', value: defaultModelId });
    serverSideApiKeyIsSet &&
      dispatch({
        field: 'serverSideApiKeyIsSet',
        value: serverSideApiKeyIsSet,
      });
    serverSidePluginKeysSet &&
      dispatch({
        field: 'serverSidePluginKeysSet',
        value: serverSidePluginKeysSet,
      });
  }, [defaultModelId, serverSideApiKeyIsSet, serverSidePluginKeysSet]);


  const copyOnClick = (prompt: string, execute: boolean = false) => {
    if (!navigator.clipboard) return;
    clipboardData = prompt;
    setFileContent(prompt)
    execute && executeClick()
    /* navigator.clipboard.writeText(prompt).then(() => {
      setMessageCopied(true);
      setTimeout(() => {
        setMessageCopied(false);
      }, 2000);
    }); */
  };

  // diagram n search
  const fetchDiagramNSearch = () => {
    console.log('fetchDiagramNSearch');
    openUpDiagrams(sysDesignQuestion);
    openUpSearch(sysDesignQuestion)
  }
  
  // ON LOAD --------------------------------------------

  useEffect(() => {
    const settings = getSettings();
    if (settings.theme) {
      dispatch({
        field: 'lightMode',
        value: settings.theme,
      });
    }

    const apiKey = localStorage.getItem('apiKey');

    if (serverSideApiKeyIsSet) {
      dispatch({ field: 'apiKey', value: '' });

      localStorage.removeItem('apiKey');
    } else if (apiKey) {
      dispatch({ field: 'apiKey', value: apiKey });
    }

    const pluginKeys = localStorage.getItem('pluginKeys');
    if (serverSidePluginKeysSet) {
      dispatch({ field: 'pluginKeys', value: [] });
      localStorage.removeItem('pluginKeys');
    } else if (pluginKeys) {
      dispatch({ field: 'pluginKeys', value: pluginKeys });
    }

    if (window.innerWidth < 640) {
      dispatch({ field: 'showChatbar', value: false });
      dispatch({ field: 'showPromptbar', value: false });
    }

    const showChatbar = localStorage.getItem('showChatbar');
    if (showChatbar) {
      dispatch({ field: 'showChatbar', value: showChatbar === 'true' });
    }

    const showPromptbar = localStorage.getItem('showPromptbar');
    if (showPromptbar) {
      dispatch({ field: 'showPromptbar', value: showPromptbar === 'true' });
    }

    const folders = localStorage.getItem('folders');
    if (folders) {
      dispatch({ field: 'folders', value: JSON.parse(folders) });
    }

    const prompts = localStorage.getItem('prompts');
    if (prompts) {
      dispatch({ field: 'prompts', value: JSON.parse(prompts) });
    }

    const conversationHistory = localStorage.getItem('conversationHistory');
    if (conversationHistory) {
      const parsedConversationHistory: Conversation[] =
        JSON.parse(conversationHistory);
      const cleanedConversationHistory = cleanConversationHistory(
        parsedConversationHistory,
      );

      dispatch({ field: 'conversations', value: cleanedConversationHistory });
    }

    const selectedConversation = localStorage.getItem('selectedConversation');
    if (selectedConversation) {
      const parsedSelectedConversation: Conversation =
        JSON.parse(selectedConversation);
      const cleanedSelectedConversation = cleanSelectedConversation(
        parsedSelectedConversation,
      );

      dispatch({
        field: 'selectedConversation',
        value: cleanedSelectedConversation,
      });
    } else {
      const lastConversation = conversations[conversations.length - 1];
      dispatch({
        field: 'selectedConversation',
        value: {
          id: uuidv4(),
          name: t('New Conversation'),
          messages: [],
          model: OpenAIModels[defaultModelId],
          prompt: DEFAULT_SYSTEM_PROMPT,
          temperature: lastConversation?.temperature ?? DEFAULT_TEMPERATURE,
          folderId: null,
        },
      });
    }
  }, [
    defaultModelId,
    dispatch,
    serverSideApiKeyIsSet,
    serverSidePluginKeysSet,
  ]);

  return (
    <HomeContext.Provider
      value={{
        ...contextValue,
        handleNewConversation,
        handleCreateFolder,
        handleDeleteFolder,
        handleUpdateFolder,
        handleSelectConversation,
        handleUpdateConversation,
      }}
    >
      <Head>
        <title>Chatbot UI</title>
        <meta name="description" content="ChatGPT but better." />
        <meta
          name="viewport"
          content="height=device-height ,width=device-width, initial-scale=1, user-scalable=no"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>


      {selectedConversation && (
        <main
          className={`flex h-screen w-screen flex-col text-sm text-white dark:text-white ${lightMode}`}
        >
          <div className="fixed top-0 w-full sm:hidden">
            <Navbar
              selectedConversation={selectedConversation}
              onNewConversation={handleNewConversation}
            />
            
          </div>
          

          <div className="flex h-full w-full pt-[48px] sm:pt-0">
            <Chatbar />
            <div className="flex flex-1">
              <Chat
                key={fileContent.length}
                stopConversationRef={stopConversationRef}
                prompt={fileContent}
              />
            </div>
            <div style={{width:'250px'}}>
              <button style={{color:'yellow'}} onClick={() => openFileSelector()}>Select to auto-gen OCR </button>
              {filesContent.map((file, index) => {
                //console.log("file-->",file)
                return (
                  <div key={index}>
                    <h2>{file.name}</h2>
                    <br />
                  </div>
                );
              })}
              <div>---------</div>



              <Collapsible trigger={(<div style={{color:'yellow'}}>{`CODING -->`}</div>)}>
                <div style={{display:'grid', padding:'10px'}}>
                    <label style={labelStyle}>
                      <input
                        type="radio"
                        value="leetcode"
                        checked={selectedOption === 'leetcode'}
                        onChange={handleOptionChange}
                      />
                      Leetcode
                    </label>

                    <label style={labelStyle}>
                      <input
                        type="radio"
                        value="react"
                        checked={selectedOption === 'react'}
                        onChange={handleOptionChange}
                      />
                      React
                    </label>

                    <label style={labelStyle}>
                      <input
                        type="radio"
                        value="codeoutput"
                        checked={selectedOption === 'codeoutput'}
                        onChange={handleOptionChange}
                      />
                      Code Output
                    </label>

                    <label style={labelStyle}>
                      <input
                        type="radio"
                        value="finderror"
                        checked={selectedOption === 'finderror'}
                        onChange={handleOptionChange}
                      />
                      Find Error
                    </label>

                    <label style={labelStyle}>
                      <input
                        type="radio"
                        value="plain"
                        checked={selectedOption === 'plain'}
                        onChange={handleOptionChange}
                      />
                      Plain text
                    </label>

                    {/* You can display the selected option */}
                    <p>Selected Option: {selectedOption}</p>

                    <div>---------</div>

                    <div style={{width:'150px',marginTop:'5px'}}>
                      Copy Prompts:
                      <button style={{color:'yellow', margin:'3px'}} onClick={() => copyOnClick(leetcodePrompt)}>Leetcode prompt</button>
                      <button style={{color:'yellow', margin:'3px'}} onClick={() => copyOnClick(reactPrompt)}>React prompt</button>
                      <button style={{color:'yellow', margin:'3px'}} onClick={() => copyOnClick(codeOutputPrompt)}>Code-Output prompt</button>
                      <button style={{color:'yellow', margin:'3px'}} onClick={() => copyOnClick(codeErrorPrompt)}>Code-Error prompt</button>
                      {messagedCopied && <p>{`Copied: ${clipboardData}`}</p>}
                    </div>
                    <div>
                    <input type="text"  style={{ color: 'black' }} value={fileSearch} placeholder="Search..." onChange={(e)=>{setFileSearch(e.target.value)}} />
                    <button onClick={()=>{
                      
                      fetchRelevantFiles(fileSearch,`${sysDesignPath}${feQs}`,feQs);
                    }}>Search</button>
                     <div>
                  {relevantFiles && relevantFiles.matchingFolders && (<div>Folders:</div>)}
                  {relevantFiles && relevantFiles.matchingFolders && relevantFiles.matchingFolders.map((file : string, index: number) => {
                    if(file && !file.includes('node_modules')){
                      console.log("file-->",file)
                      return (
                        <div key={index}>
                          <button style={{textAlign:'left'}} onClick={()=>{
                            console.log("\n\n\nCLicked on file-->",file)
                            axios.get(`/open?path=${sysDesignPath}${feQs}${file}`)
                          }}>{`->${file}`}</button>
                          <br />
                        </div>
                      );
                      }
                  })}
                  <div>------</div>
                  {relevantFiles && relevantFiles.matchingFiles && (<div>Files:</div>)}
                  {relevantFiles && relevantFiles.matchingFiles && relevantFiles.matchingFiles.map((file : string, index: number) => {
                    if(file && !file.includes('node_modules')){
                      console.log("file-->",file)
                      return (
                        <div key={index}>
                          <button  style={{textAlign:'left'}}  onClick={()=>{
                            console.log("\n\n\nCLicked on file-->",file)
                            axios.get(`/open?path=${sysDesignPath}${feQs}${file}`)
                          }}>{`->${file}`}</button>
                          <br />
                        </div>
                      );
                    }
                  })}
                </div>
                </div>
                </div>


              </Collapsible>
              
              <div>---------</div>

              <Collapsible trigger={(<div style={{color:'yellow'}}>{`SYSTEM DESIGN -->`}</div>)}>
                <div style={{display:'grid', padding:'10px',marginTop:'5px'}}>
                  <label style={labelStyle}>
                    <input
                      type="radio"
                      value="FE"
                      checked={selectedSystemDesign === 'FE'}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>{
                        setSelectedSystemDesign(event.target.value);
                      }}  
                    />
                    FE
                  </label>

                  <label style={labelStyle}>
                    <input
                      type="radio"
                      value="BE"
                      checked={selectedSystemDesign === 'BE'}
                      onChange={(event: React.ChangeEvent<HTMLInputElement>) =>{
                        setSelectedSystemDesign(event.target.value);
                      }}
                    />
                    BE
                  </label>
                </div>
                <div style={{width:'150px'}}>
                    <button style={{color:'yellow', margin:'3px'}} onClick={() =>{
                      console.log("\n\n\n clicked on next",sysDesignCounter)
                        if(sysDesignCounter === 'none'){
                          copyOnClick( selectedSystemDesign == 'FE' ? FESystemDesignPrompts[0] :  systemDesignPrompts[0])
                            setSysDesignCounter(0);
                            setSelectedOption('systemdesign');
                            return;
                        }
                        if(!isNaN(sysDesignCounter) && sysDesignCounter <= 5){
                            copyOnClick( selectedSystemDesign == 'FE' ? FESystemDesignPrompts[sysDesignCounter + 1] :  systemDesignPrompts[sysDesignCounter + 1])
                            setSysDesignCounter(parseInt(sysDesignCounter) + 1);
                            executeClick()
                            return;
                        }
                        //copyOnClick(leetcodePrompt)
                    }}> Click To Next</button>
                    <button style={{color:'yellow', margin:'3px'}} onClick={() => {
                       console.log("\n\n\n clicked on next")
                       copyOnClick(`give more other than the above mentioned`,true)
                    }
                      
                    }>Click for details</button>
                    <button style={{color:'yellow', margin:'3px'}} onClick={() => {
                       console.log("\n\n\n clicked on Diagram n search")
                       fetchDiagramNSearch()
                    }
                      
                    }>Diagram & Search</button>
                </div>
                <div>---RelevantFiles:----</div>
                <div>
                  <input type="text"  style={{ color: 'black' }} value={fileSearch} placeholder="Search..." onChange={(e)=>{setFileSearch(e.target.value)}} />
                  <button onClick={()=>{
                    fetchRelevantFiles(fileSearch);
                  }}>Search</button>
                </div>
                <div>
                  {relevantFiles && relevantFiles.matchingFolders && (<div>Folders:</div>)}
                  {relevantFiles && relevantFiles.matchingFolders && relevantFiles.matchingFolders.map((file : string, index: number) => {
                    //console.log("file-->",file)
                    return (
                      <div key={index}>
                        <button  style={{textAlign:'left'}} onClick={()=>{
                          console.log("\n\n\nCLicked on file-->",file)
                          axios.get(`/open?path=${sysDesignPath}${sysDesignFolder}${file}`)
                        }}>{`->${file}`}</button>
                        <br />
                      </div>
                    );
                  })}
                  <div>------</div>
                  {relevantFiles && relevantFiles.matchingFiles && (<div>Files:</div>)}
                  {relevantFiles && relevantFiles.matchingFiles && relevantFiles.matchingFiles.map((file : string, index: number) => {
                    //console.log("file-->",file)
                    return (
                      <div key={index}>
                        <button style={{textAlign:'left'}}  onClick={()=>{
                          console.log("\n\n\nCLicked on file-->",file)
                          axios.get(`/open?path=${sysDesignPath}${sysDesignFolder}${file}`)
                        }}>{file}</button>
                        <br />
                      </div>
                    );
                  })}
                </div>

              </Collapsible>

              <div>---------</div>

              <Collapsible trigger={(<div style={{color:'yellow'}}>{`Transcripts -->`}</div>)}>
                  <div>
                      <KeypressDetector onPress={(keys: string)=>{
                            console.log("\n\n\n\nPressedKEyssss-->",keys)
                          }}/>
                      <SpeechRecognitionComponent socket={socket} selfSocket={selfSocket} handleSpeechResult={handleSpeechResult} onPressKey={( result: string) => {
                        console.log("🚀 ~ file: home.tsx:882 ~ result:", result)
                        setFileContent(result);
                      }}/>
                      {/* <MsgCopy/> */}
                  </div>

              </Collapsible>
              




                
            </div>
            <Promptbar />
          </div>
        </main>
      )}
    </HomeContext.Provider>
  );
};
export default (Home);

export const getServerSideProps: GetServerSideProps = async ({ locale }) => {
  const defaultModelId =
    (process.env.DEFAULT_MODEL &&
      Object.values(OpenAIModelID).includes(
        process.env.DEFAULT_MODEL as OpenAIModelID,
      ) &&
      process.env.DEFAULT_MODEL) ||
    fallbackModelID;

  let serverSidePluginKeysSet = false;

  const googleApiKey = process.env.GOOGLE_API_KEY;
  const googleCSEId = process.env.GOOGLE_CSE_ID;

  if (googleApiKey && googleCSEId) {
    serverSidePluginKeysSet = true;
  }

  return {
    props: {
      serverSideApiKeyIsSet: !!process.env.OPENAI_API_KEY,
      defaultModelId,
      serverSidePluginKeysSet,
      ...(await serverSideTranslations(locale ?? 'en', [
        'common',
        'chat',
        'sidebar',
        'markdown',
        'promptbar',
        'settings',
      ])),
    },
  };
};
