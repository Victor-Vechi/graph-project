import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { InstitutionService } from '../application/institution.service';
import { AdminGuard } from '../../Shared/Auth/infra/admin.guard';

@Controller('api/institutions')
export class InstitutionController {
    constructor(private readonly institutionService: InstitutionService) {}

    @Post('/register')
    @UseGuards(AdminGuard)
    async create(@Body() body: any, @Res() res: Response) {
        try {
            const institution = await this.institutionService.create(body);
            return institution
                ? res.status(HttpStatus.OK).json({ message: 'Institution registered successfully', institution })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data or institution already exists' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error registering institution' });
        }
    }

    @Get()
    @UseGuards(AdminGuard)
    async findAll(@Res() res: Response) {
        try {
            const institutions = await this.institutionService.findAll();
            return res.status(HttpStatus.OK).json({ institutions });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching institutions' });
        }
    }

    @Get('/partners')
    async findPartners(@Res() res: Response) {
        try {
            const partners = await this.institutionService.findPartners();
            return res.status(HttpStatus.OK).json(partners);
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching partner institutions' });
        }
    }

    @Put('/:id')
    @UseGuards(AdminGuard)
    async update(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
        try {
            const result = await this.institutionService.update(parseInt(id), body);
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Institution updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating institution' });
        }
    }

    @Delete('/:id')
    @UseGuards(AdminGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            const result = await this.institutionService.delete(parseInt(id));
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Institution deleted successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting institution' });
        }
    }
}
