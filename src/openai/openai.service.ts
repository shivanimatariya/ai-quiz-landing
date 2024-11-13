import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class OpenAIService {
  private readonly openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  async checkAnswer(question: string, userAnswer: string): Promise<boolean> {
    const prompt = `Question: ${question}\nAnswer: ${userAnswer}\nIs this answer correct? Yes or No?`;
    const response = await this.openai.chat.completions.create({
      model: 'gpt-3.5-turbo',
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 10,
      temperature: 0.3,
    });

    const answer = response.choices[0].message.content.trim().toLowerCase();
    console.log('Ansssss-=-=->', answer);
    return answer === 'yes';
  }
}
