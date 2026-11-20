import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { json, urlencoded } from 'express';
import helmet from 'helmet';
import { AppModule } from './app.module';

async function bootstrap() {
    const app = await NestFactory.create(AppModule);
    const bodyLimit = process.env.BODY_LIMIT ?? '150mb';

    app.use(helmet());
    app.use(json({ limit: bodyLimit }));
    app.use(urlencoded({ extended: true, limit: bodyLimit }));
    app.enableCors();
    await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
