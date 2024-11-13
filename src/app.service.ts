import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AppService {
  getHello(): string {
    return 'Hello World!';
  }

  async verifyRecaptcha(recaptchaResponse: string): Promise<boolean> {
    const secretKey = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;

    try {
      const response = await axios.post(
        `https://www.google.com/recaptcha/api/siteverify`,
        null,
        {
          params: {
            secret: secretKey,
            response: recaptchaResponse,
          },
        },
      );

      return response.data.success;
    } catch (error) {
      console.error('Error verifying reCAPTCHA:', error);
      return false;
    }
  }
}
