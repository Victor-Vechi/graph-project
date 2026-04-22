import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class CaptchaService {
    async verify(token: string): Promise<boolean> {
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        if (!token || !secretKey) return false;

        try {
            const { data } = await axios.post(
                'https://www.google.com/recaptcha/api/siteverify',
                null,
                { params: { secret: secretKey, response: token } },
            );
            return data.success === true && data.score >= 0.5;
        } catch {
            return false;
        }
    }
}
