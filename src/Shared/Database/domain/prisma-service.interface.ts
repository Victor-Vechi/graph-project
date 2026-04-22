import { PrismaClient } from '@prisma/client';

export interface PrismaServiceInterface extends PrismaClient {
    onModuleInit(): Promise<void>;
}
