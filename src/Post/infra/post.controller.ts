import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PostService } from '../application/post.service';
import { JwtAuthGuard } from '../../Shared/Auth/jwt-auth.guard';

@Controller('api/posts')
export class PostController {
    constructor(private readonly postService: PostService) {}

    @Get()
    async findAll(@Res() res: Response) {
        try {
            const posts = await this.postService.findAll();
            return res.status(HttpStatus.OK).json(posts);
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching posts' });
        }
    }

    @Post('/create')
    @UseGuards(JwtAuthGuard)
    async create(@Body() body: any, @Res() res: Response) {
        try {
            const post = await this.postService.create(body);
            return post
                ? res.status(HttpStatus.OK).json({ message: 'Post created successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error creating post' });
        }
    }

    @Post('/search')
    async search(@Body() body: any, @Res() res: Response) {
        try {
            const posts = await this.postService.search(body);
            return posts
                ? res.status(HttpStatus.OK).json(posts)
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Post not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error searching post' });
        }
    }

    @Put('/:id')
    @UseGuards(JwtAuthGuard)
    async update(@Param('id') id: string, @Body() body: any, @Res() res: Response) {
        try {
            const result = await this.postService.update(parseInt(id), body);
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Post updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Post not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating post' });
        }
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@Param('id') id: string, @Res() res: Response) {
        try {
            const result = await this.postService.delete(parseInt(id));
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Post deleted successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Post not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting post' });
        }
    }
}
