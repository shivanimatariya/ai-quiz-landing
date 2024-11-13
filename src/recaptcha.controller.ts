import { Body, Controller, Post, Logger } from '@nestjs/common';
import axios from 'axios';

@Controller()
export class RecaptchaController {
  private readonly recaptchaSecret = process.env.GOOGLE_RECAPTCHA_SECRET_KEY;
  private readonly logger = new Logger(RecaptchaController.name);

  @Post('/verify-recaptcha')
  async verifyRecaptcha(
    @Body('g-recaptcha-response') recaptchaResponse: string,
  ) {
    this.logger.log(`Received recaptcha response: ${recaptchaResponse}`);
    const verificationUrl = `https://www.google.com/recaptcha/api/siteverify?secret=${this.recaptchaSecret}&response=${recaptchaResponse}`;
    try {
      const response = await axios.post(verificationUrl);
      this.logger.log(
        `Recaptcha verification response: ${JSON.stringify(response.data)}`,
      );

      if (response.data.success) {
        return { redirect: '/qna' };
      } else {
        return { error: 'reCAPTCHA verification failed' };
      }
    } catch (error) {
      this.logger.error('Error during recaptcha verification', error.stack);
      return { error: 'Error during recaptcha verification' };
    }
  }
}
