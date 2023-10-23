import { OPENAI_API_HOST, OPENAI_API_TYPE, OPENAI_API_VERSION, OPENAI_ORGANIZATION } from '@/utils/app/const';

import { OpenAIModel, OpenAIModelID, OpenAIModels } from '@/types/openai';

export const config = {
  runtime: 'edge',
};

const handler = async (req: Request): Promise<Response> => {
  try {
    const { key } = (await req.json()) as {
      key: string;
    };

    let url = `${OPENAI_API_HOST}/v1/models`;
    if (OPENAI_API_TYPE === 'azure') {
      url = `${OPENAI_API_HOST}/openai/deployments?api-version=${OPENAI_API_VERSION}`;
      return new Response(JSON.stringify( [
        { id: 'gpt-4', name: 'GPT-4' },
        { id: 'gpt-3.5-turbo', name: 'GPT-3.5' }
      ]
      ),{status: 200})
    }
    console.log("🚀 ~ file: models.ts:17 ~ handler ~ url:",OPENAI_API_TYPE, url, process.env.OPENAI_API_KEY)
    let otherHeaders = {};
    if(OPENAI_API_TYPE === 'openai'){
      otherHeaders = {Authorization: `Bearer ${key ? key : process.env.OPENAI_API_KEY}`}
      if(OPENAI_ORGANIZATION){
        otherHeaders = {...otherHeaders, 'OpenAI-Organization': OPENAI_ORGANIZATION}
      }
    }else {
      otherHeaders = {'api-key': `${key ? key : process.env.OPENAI_API_KEY}`}
    }

    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...otherHeaders,
      },
    });

    if (response.status === 401) {
      return new Response(response.body, {
        status: 500,
        headers: response.headers,
      });
    } else if (response.status !== 200) {
      console.error(
        `OpenAI API returned an error ${
          response.status
        }: ${await response.text()}`,
      );
      throw new Error('OpenAI API returned an error');
    }

    const json = await response.json();
    //console.log("🚀 ~ file: models.ts:51 ~ handler ~ json:", json)

    const models: OpenAIModel[] = json.data
      .map((model: any) => {
        const model_name = (OPENAI_API_TYPE === 'azure') ? model.model : model.id;
        for (const [key, value] of Object.entries(OpenAIModelID)) {
          if (value === model_name) {
            return {
              id: model.id,
              name: OpenAIModels[value].name,
            };
          }
        }
      })
      .filter(Boolean);
console.log("\n\n\n\n\nmodels--->",models)
    return new Response(JSON.stringify(models), { status: 200 });
  } catch (error) {
    console.error(error);
    return new Response('Error', { status: 500 });
  }
};

export default handler;
