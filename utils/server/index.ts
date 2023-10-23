import { Message } from '@/types/chat';
import { OpenAIModel } from '@/types/openai';
import  { OpenAIClient, AzureKeyCredential } from "@azure/openai";
import { AZURE_DEPLOYMENT_ID, OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION, AZURE_GPT4_KEY } from '../app/const';

import {
  ParsedEvent,
  ReconnectInterval,
  createParser,
} from 'eventsource-parser';

export class OpenAIError extends Error {
  type: string;
  param: string;
  code: string;

  constructor(message: string, type: string, param: string, code: string) {
    super(message);
    this.name = 'OpenAIError';
    this.type = type;
    this.param = param;
    this.code = code;
  }
}

export const OpenAIStream = async (
  model: OpenAIModel,
  systemPrompt: string,
  temperature : number,
  key: string,
  messages: Message[],
) => {
  let url = `${OPENAI_API_HOST}/v1/chat/completions`;
  let res: any;
  //url = `${OPENAI_API_HOST}/openai/deployments/${AZURE_DEPLOYMENT_ID}/chat/completions?api-version=${OPENAI_API_VERSION}`;
  if(OPENAI_API_TYPE === 'azure'){
    const client = new OpenAIClient(
      OPENAI_API_HOST,
    new AzureKeyCredential(AZURE_GPT4_KEY));
    console.log("🚀 ~ file: index.ts:43 ~ client:",messages)
    res = await client.getChatCompletions(
      AZURE_DEPLOYMENT_ID, // assumes a matching model deployment or model name
      [
        {
          role: 'system',
          content: systemPrompt,
        },
        ...messages,
      ],
      /* { stream: true } */
      )
    console.log("\n\n\n🚀 ~ file: index.ts:53 ~ res:",res)
  }else{
    let otherHeaders = {};
    if(OPENAI_API_TYPE === 'openai'){
      otherHeaders = {Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`}
      if(OPENAI_ORGANIZATION){
        otherHeaders = {...otherHeaders, 'OpenAI-Organization': OPENAI_ORGANIZATION}
      }
    }else {
      otherHeaders = {'api-key': `${key ? key : process.env.OPENAI_API_KEY}`}
    }
    res = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...otherHeaders
      },
      method: 'POST',
      body: JSON.stringify({
        ...(OPENAI_API_TYPE === 'openai' && {model: model.id}),
        messages: [
          {
            role: 'system',
            content: systemPrompt,
          },
          ...messages,
        ],
        max_tokens: 1000,
        temperature: temperature,
        stream: true,
      }),
    });
  
  }

  const encoder = new TextEncoder();
  const decoder = new TextDecoder();

  if (OPENAI_API_TYPE === 'openai' && res.status !== 200) {
    const result = await res.json();
    if (result.error) {
      throw new OpenAIError(
        result.error.message,
        result.error.type,
        result.error.param,
        result.error.code,
      );
    } else {
      throw new Error(
        `OpenAI API returned an error: ${
          decoder.decode(result?.value) || result.statusText
        }`,
      );
    }
  }else{
    if(OPENAI_API_TYPE === 'azure')
      return res && res.choices &&res.choices[0] &&res.choices[0]['message']['content']
  }

  const stream = new ReadableStream({
    async start(controller) {
      const onParse = (event: ParsedEvent | ReconnectInterval) => {
        //console.log("\n\n\n🚀 ~ file: index.ts:112 ~ onParse ~ event:", event)
        if (event.type === 'event') {
          const data = event.data;

          try {
            const json = JSON.parse(data);
            //console.log("\n\n\n🚀 ~ file: index.ts:123 ~ onParse ~ json:", json)
            if (json.choices[0].finish_reason != null) {
              controller.close();
              return;
            }
            const text = json.choices[0].delta.content;
            const queue = encoder.encode(text);
            controller.enqueue(queue);
          } catch (e) {
            controller.error(e);
          }
        }
      };

      const parser = createParser(onParse);
     // console.log("🚀 ~ file: index.ts:134 ~ forawait ~ chunk:", (OPENAI_API_TYPE === 'openai') ? res.body : res)
      // let resBody = ;
      for await (const chunk of ((OPENAI_API_TYPE === 'openai') ? res.body : res) as any) {
       // console.log("🚀 ~ file: index.ts:134 ~ forawait ~ chunk:", chunk,decoder.decode(chunk))
        parser.feed(decoder.decode(chunk));
      }
    },
  });

  return stream;
};
