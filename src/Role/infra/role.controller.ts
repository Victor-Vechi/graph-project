import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { RoleService } from '../application/role.service';
import { AdminGuard } from '../../Shared/Auth/admin.guard';

@Controller('api/roles')
export class RoleController {
    constructor(private readonly roleService: RoleService) {}

    @Post('/register')
    @UseGuards(AdminGuard)
    async create(@Body() body: any, @Res() res: Response) {
        try {
            const role = await this.roleService.create(body);
            return role
                ? res.status(HttpStatus.OK).json({ message: 'Role registered successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error registering role' });
        }
    }

    @Get()
    @UseGuards(AdminGuard)
    async findAll(@Res() res: Response) {
        try {
            const roles = await this.roleService.findAll();
            return res.status(HttpStatus.OK).json({ roles });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching roles' });
        }
    }

    @Put('/:id')
    @UseGuards(AdminGuard)
    async update(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
        try {
            const result = await this.roleService.update(parseInt(id), body);
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Role updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating role' });
        }
    }

    @Delete('/:id')
    @UseGuards(AdminGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            const result = await this.roleService.delete(parseInt(id));
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Role deleted successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting role' });
        }
    }
}
