import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { OpenAIService } from './openai/openai.service';
import { ConfigModule } from '@nestjs/config';
import { GoogleRecaptchaModule } from '@nestlab/google-recaptcha';
import { RecaptchaController } from './recaptcha.controller';

@Module({
  imports: [
    ConfigModule.forRoot(),
    GoogleRecaptchaModule.forRoot({
      secretKey: process.env.GOOGLE_RECAPTCHA_SECRET_KEY,
      response: (req) => req.headers['recaptcha'],
    }),
  ],
  controllers: [AppController, RecaptchaController],
  providers: [AppService, OpenAIService],
})
export class AppModule {}
