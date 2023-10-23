import React from 'react';
import { ChatContainer, MessageList, Message } from '@chatscope/chat-ui-kit-react';
import '@chatscope/chat-ui-kit-styles/dist/default/styles.min.css';

interface ChatProps {
  sentences: string[];
  onChatClick: (result: string) => void;
}
const handleCopy = (message: string) => {
    navigator.clipboard.writeText(message);
};

const ChatComponent: React.FC<ChatProps> = ({ sentences, onChatClick }) => {
  const renderMessages = () => {
    let len = sentences && sentences.length;
    let date = new Date();
    if(!len){
        return <></>
    }
    return sentences.map((sentence, index) => (
        <div key={index} onClick={() => {
            onChatClick(sentence);
        }}>
            <Message key={index}
             model={{ message: `${len-index}: ${sentence}`, direction:"incoming", position: "normal" ,sentTime:"just now"}} />
      </div>
    ));
  };

  return (
    <ChatContainer>
      <MessageList>{renderMessages()}</MessageList>
    </ChatContainer>
  );
};

export default ChatComponent;
