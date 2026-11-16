import {
    Body,
    Controller,
    Delete,
    Get,
    HttpException,
    HttpStatus,
    Param,
    Post,
    Put,
    Res,
    UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import type { JwtPayload } from '../../Shared/Auth/domain/jwt.interface';
import { AdminGuard } from '../../Shared/Auth/infra/admin.guard';
import { CurrentUser } from '../../Shared/Auth/infra/current-user.decorator';
import { MaterialService } from '../application/material.service';

@Controller('api/materials')
export class MaterialController {
    constructor(private readonly materialService: MaterialService) {}

    @Get()
    async findAll(@Res() res: Response) {
        try {
            const materials = await this.materialService.findAll();
            return res.status(HttpStatus.OK).json(materials);
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching materials' });
        }
    }

    @Get('/:id')
    async findById(@Param('id') id: string, @Res() res: Response) {
        try {
            const material = await this.materialService.findById(parseInt(id));
            return material
                ? res.status(HttpStatus.OK).json(material)
                : res.status(HttpStatus.NOT_FOUND).json({ error: 'Material not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error fetching material' });
        }
    }

    @Get('/:id/download-url')
    async getDownloadUrl(@Param('id') id: string, @Res() res: Response) {
        try {
            const result = await this.materialService.getDownloadUrl(parseInt(id));
            return result
                ? res.status(HttpStatus.OK).json(result)
                : res.status(HttpStatus.NOT_FOUND).json({ error: 'Material not found' });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error generating download URL' });
        }
    }

    @Post()
    @UseGuards(AdminGuard)
    async create(@CurrentUser() user: JwtPayload, @Body() body: any, @Res() res: Response) {
        try {
            const material = await this.materialService.create(body, parseInt(user.id));
            return material
                ? res.status(HttpStatus.CREATED).json({ message: 'Material created successfully', material })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid material data' });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error creating material' });
        }
    }

    @Put('/:id')
    @UseGuards(AdminGuard)
    async update(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() body: any,
        @Res() res: Response,
    ) {
        try {
            const material = await this.materialService.update(parseInt(id), body, parseInt(user.id));
            return material
                ? res.status(HttpStatus.OK).json({ message: 'Material updated successfully', material })
                : res.status(HttpStatus.NOT_FOUND).json({ error: 'Material not found' });
        } catch (error) {
            if (error instanceof HttpException) throw error;
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating material' });
        }
    }

    @Delete('/:id')
    @UseGuards(AdminGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            const deleted = await this.materialService.delete(parseInt(id));
            return deleted
                ? res.status(HttpStatus.OK).json({ message: 'Material deleted successfully' })
                : res.status(HttpStatus.NOT_FOUND).json({ error: 'Material not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting material' });
        }
    }
}
