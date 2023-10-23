const isAzure = (process.env.gpt4 == "true");
export const DEFAULT_SYSTEM_PROMPT =
  process.env.NEXT_PUBLIC_DEFAULT_SYSTEM_PROMPT ||
  "You are ChatGPT, a large language model trained by OpenAI. Follow the user's instructions carefully. Respond using markdown.";

export const OPENAI_API_HOST = isAzure ? "https://dh-prod-openai.openai.azure.com" : ('https://api.openai.com' || process.env.OPENAI_API_HOST );

export const DEFAULT_TEMPERATURE = parseFloat(process.env.NEXT_PUBLIC_DEFAULT_TEMPERATURE || "1");

export const OPENAI_API_TYPE = isAzure ? 
'azure' : ( 'openai' ||process.env.OPENAI_API_TYPE);

export const OPENAI_API_VERSION = isAzure ?  '2023-07-01-preview' :  ('2023-03-15-preview' || process.env.OPENAI_API_VERSION);

export const OPENAI_ORGANIZATION =
  process.env.OPENAI_ORGANIZATION || '';

export const AZURE_DEPLOYMENT_ID =
  'GPT4' || process.env.AZURE_DEPLOYMENT_ID || 'gpt-4-pwa';

export const AZURE_GPT4_KEY = process.env.AZURE_GPT4_KEY || '8778e5ede6014d8a83b385c908149b12';  

export const RECEIVER_IP =  'http://192.168.1.189:4000'
//'http://localhost:4000';

export const KEYPRESS_COMBO = 'Control';

export const DIAGRAM_SEARCH_ENDPOINT = 'http://localhost:3001';

export const sysDesignPath = `/Users/pratheesh.pm/Documents/codebase/leetcode/`;

export const sysDesignFolder = `system-design-main`