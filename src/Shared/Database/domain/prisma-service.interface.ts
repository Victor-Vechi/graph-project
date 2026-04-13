import { PrismaClient } from "@prisma/client/extension";

export interface PrismaServiceInterface extends PrismaClient {
    onModuleInit(): Promise<void>;
}
