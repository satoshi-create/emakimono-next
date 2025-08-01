import os
from openai import OpenAI
from dotenv import load_dotenv

load_dotenv()  # .env を読み込む
api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=api_key)

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

response = client.chat.completions.create(
    model="gpt-3.5-turbo",
    messages=[
        {"role": "user", "content": "こんにちは！"}
    ],
    temperature=0.7,
    max_tokens=100,
)

print(response.choices[0].message.content)
