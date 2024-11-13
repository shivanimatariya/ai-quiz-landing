import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';
import { OpenAIService } from './openai/openai.service';

@Controller()
export class AppController {
  private readonly questions: string[] = [
    'What is 2 + 2?',
    "Which is the world's tallest mountain?",
    'What is the height of Mount Everest?',
    'How many wonders are there in the world?',
  ];

  constructor(
    private readonly appService: AppService,
    private readonly openaiService: OpenAIService,
  ) {}

  private getRandomQuestion(): string {
    const randomIndex = Math.floor(Math.random() * this.questions.length);
    return this.questions[randomIndex];
  }

  @Get()
  getCaptchaCheckPage() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>CAPTCHA Check</title>
        <script>
          function checkCaptcha() {
            const captcha = localStorage.getItem('captcha');
            const captchaTimestamp = new Date(localStorage.getItem('captchaTimestamp'));
            const now = new Date();

            if (captcha && now.getTime() - captchaTimestamp.getTime() < 30 * 60 * 1000) {
              window.location.href = '/qna';
            } else {
              window.location.href = '/verify';
            }
          }

          window.onload = checkCaptcha;
        </script>
      </head>
      <body>
        <p>Redirecting...</p>
      </body>
      </html>
    `;
  }

  @Get('/verify')
  getCaptchaForm() {
    return `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Captcha Verification</title>
        <script src="https://www.google.com/recaptcha/api.js" async defer></script>
      </head>
      <body>
        <div class="g-recaptcha" data-sitekey="${process.env.GOOGLE_RECAPTCHA_SITE_KEY}" data-callback="onRecaptchaSuccess"></div>
        <script>
          async function onRecaptchaSuccess(recaptchaResponse) {
            const response = await fetch('/verify-recaptcha', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ 'g-recaptcha-response': recaptchaResponse }),
            });
  
            const result = await response.json();
  
            if (result.success) {
              localStorage.setItem('captcha', 'true');
              localStorage.setItem('captchaTimestamp', new Date().toISOString());
              window.location.href = '/qna'; // Redirect to the Q&A page upon successful reCAPTCHA
            } else {
              alert('Captcha verification failed. Please try again.');
            }
          }
        </script>
      </body>
      </html>
    `;
  }

  @Post('/verify-recaptcha')
  async verifyRecaptcha(
    @Body('g-recaptcha-response') recaptchaResponse: string,
  ) {
    const isValid = await this.appService.verifyRecaptcha(recaptchaResponse);

    if (isValid) {
      return { success: true };
    } else {
      return { success: false };
    }
  }

  @Get('/qna')
  getQnaPage() {
    const selectedQuestion = this.getRandomQuestion();
    return `
      <!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Q&A</title>
  <style>
    body {
      height: 100vh;
      background-color: #f0f0f0;
      font-family: Arial, sans-serif;
      box-sizing: border-box;
    }
    .container {
      text-align: center;
      background: #fff;
      padding: 20px;
      box-shadow: 0px 0px 10px rgba(0, 0, 0, 0.1);
      border-radius: 5px;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 330px;
    }
    .question {
      margin-bottom: 20px;
      font-size: 18px;
    }
    .answer {
      padding: 10px;
      font-size: 16px;
      width: 100%;
      margin-bottom: 20px;
      border: 1px solid #bdbdbd;
      box-sizing: border-box;
      border-radius: 4px;
    }
    .answer:focus {
      border-color: #254cff;
      outline: #254cff;
    }
    .submit-btn {
      padding: 10px 20px;
      font-size: 16px;
      cursor: pointer;
      background: #254cff;
      color: white;
      font-size: 18px;
      border: none;
      border-radius: 6px;
      max-width: 140px;
      width: 100%;
      margin-top: 14px;
      transition: all 0.3s ease-in-out;
      position: relative;
    }
    .submit-btn:disabled {
      background: #bdbdbd;
      cursor: not-allowed;
    }
    .submit-btn:hover:not(:disabled) {
      background: #4caf50;
    }
    .spinner {
      width: 16px;
      height: 16px;
      border: 2px solid #f3f3f3;
      border-top: 2px solid #ffffff;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      display: none;
      margin-top: -9px;
      margin-left: -8px;
      
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .light {
      width: 30px;
      height: 30px;
      border-radius: 50%;
      display: inline-block;
    }
    .light.green {
      background-color: #4caf50;
    }
    .light.red {
      background-color: #f44336;
    }
    .light.off {
      background-color: #ccc;
    }
    .logo {
      padding: 16px;
      background: #254cff;
    }
    .logo a {
      font-size: 24px;
      font-weight: 600;
      color: #ffffff;
    }
    .submit-answer {
      display: flex;
      align-items: center;
      justify-content: center;
      flex-direction: column-reverse;
      gap: 16px;
    }
  </style>
</head>
<body>

<header>
  <div class="logo">
    <a>Quizzy</a>
  </div>
</header>

<div class="container">
  <div class="question">${selectedQuestion}</div>
  <input type="hidden" id="question" value="${selectedQuestion}" />
  <input type="text" id="answer" class="answer" required placeholder="Enter your answer..." oninput="checkInput()"/>
  <div class="submit-answer">
    <button type="button" id="submit-btn" class="submit-btn" onclick="submitAnswer()" disabled>
      <span id="btn-text">Submit</span>
      <div id="spinner" class="spinner"></div>
    </button>
    <div id="light" class="light off"></div>
  </div>
</div>

<script>

        const captcha = localStorage.getItem('captcha');
        const captchaTimestamp = localStorage.getItem('captchaTimestamp');
        if (!captcha || !captchaTimestamp) {
          window.location.href = '/verify';
        }
        const now = new Date();
        const timestamp = new Date(captchaTimestamp);
        if (now.getTime() - timestamp.getTime() < 30 * 60 * 1000) {
          // window.location.href = '/qna';
        } else {
          window.location.href = '/verify';
        }

  function checkInput() {
    const answer = document.getElementById('answer').value;
    const submitBtn = document.getElementById('submit-btn');
    submitBtn.disabled = answer.trim() === '';
  }

  async function submitAnswer() {
    const question = document.getElementById('question').value;
    const answer = document.getElementById('answer').value;
    const submitBtn = document.getElementById('submit-btn');
    const spinner = document.getElementById('spinner');
    const btnText = document.getElementById('btn-text');

    // Disable the button and show the spinner
    submitBtn.disabled = true;
    spinner.style.display = 'inline-block';
    btnText.style.visibility = 'hidden';

    try {
      const response = await fetch('/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question, answer }),
      });

      const result = await response.json();
      const light = document.getElementById('light');
      if (result.success) {
        light.className = 'light green';
      } else {
        light.className = 'light red';
      }
    } finally {
      // Re-enable the button and hide the spinner
      submitBtn.disabled = false;
      spinner.style.display = 'none';
      btnText.style.visibility = 'visible';
    }
  }

  // Initial check to disable/enable the submit button based on the input
  checkInput();
</script>

</body>
</html>
    `;
  }

  @Post('/submit')
  async checkAnswer(@Body() body: any) {
    const { question, answer } = body;

    const isCorrect = await this.openaiService.checkAnswer(question, answer);
    return { success: isCorrect };
  }
}
