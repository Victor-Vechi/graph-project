import { Injectable, OnModuleInit } from '@nestjs/common';
import { PrismaServiceInterface } from '../domain/prisma-service.interface';
import { PrismaClient } from '@prisma/client/extension';

@Injectable()
export class PrismaService extends PrismaClient implements PrismaServiceInterface {
    async onModuleInit() {
      	await this.$connect();
    }
}