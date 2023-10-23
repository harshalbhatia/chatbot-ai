#Note: The openai-python library support for Azure OpenAI is in preview.
import os
import openai
openai.api_type = "azure"
openai.api_base = "https://dh-prod-openai.openai.azure.com/"
openai.api_version = "2023-07-01-preview"
openai.api_key = os.getenv("OPENAI_API_KEY")

response = openai.ChatCompletion.create(
  engine="GPT4",
  messages=[
    {"role": "system", "content": "You are an AI assistant that helps people find information."},
    {"role": "user", "content": "hi"},
    {"role": "assistant", "content": "Hello! How can I help you today?"},
    {"role": "user", "content": "is this gpt 4 model im talking to"},
    {"role": "assistant", "content": "I am an AI model based on OpenAI's GPT-3 technology. How can I assist you today?"},
    {"role": "user", "content": "how are you? which ai model are you using"}
  ],
  temperature=0.7,
  max_tokens=800,
  top_p=0.95,
  frequency_penalty=0,
  presence_penalty=0,
  stop=None)
print(response)