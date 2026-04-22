import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { TagService } from '../application/tag.service';
import { AdminGuard } from '../../Shared/Auth/admin.guard';
import { JwtAuthGuard } from '../../Shared/Auth/jwt-auth.guard';

@Controller('api/tag')
export class TagController {
    constructor(private readonly tagService: TagService) {}

    @Post('/create')
    @UseGuards(AdminGuard)
    async create(@Body() body: any, @Res() res: Response) {
        try {
            const tag = await this.tagService.create(body);
            return tag
                ? res.status(HttpStatus.OK).json({ message: 'Tag created successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error creating tag' });
        }
    }

    @Get('/search/:name')
    @UseGuards(JwtAuthGuard)
    async findByName(@Param('name') name: string, @Res() res: Response) {
        try {
            const tag = await this.tagService.findByName(name);
            return tag
                ? res.status(HttpStatus.OK).json({ tag })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Tag not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error finding tag' });
        }
    }

    @Get()
    @UseGuards(JwtAuthGuard)
    async findAll(@Res() res: Response) {
        try {
            const tags = await this.tagService.findAll();
            return res.status(HttpStatus.OK).json({ tags });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error finding tags' });
        }
    }

    @Put('/:id')
    @UseGuards(AdminGuard)
    async update(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
        try {
            const tag = await this.tagService.update(parseInt(id), body);
            return tag
                ? res.status(HttpStatus.OK).json({ message: 'Tag updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating tag' });
        }
    }

    @Delete('/:id')
    @UseGuards(AdminGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            const result = await this.tagService.delete(parseInt(id));
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Tag deleted successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting tag' });
        }
    }
}
