import { Controller, Post, Get, Put, Delete, Param, Body, UseGuards, Res, HttpStatus } from '@nestjs/common';
import type { Response } from 'express';
import { PostService } from '../application/post.service';
import { JwtAuthGuard } from '../../Shared/Auth/infra/jwt-auth.guard';
import { CurrentUser } from '../../Shared/Auth/infra/current-user.decorator';
import type { JwtPayload } from '../../Shared/Auth/domain/jwt.interface';
import { PostLogService } from '../../PostLog/application/post-log.service';

@Controller('api/posts')
export class PostController {
    constructor(
        private readonly postService: PostService,
        private readonly postLogService: PostLogService,
    ) {}

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
    async create(@CurrentUser() user: JwtPayload, @Body() body: any, @Res() res: Response) {
        try {
            const post = await this.postService.create(body);
            if (post) {
                const after = await this.postLogService.snapshot(post.id);
                await this.postLogService.register({ action: 'CREATE', postId: post.id, user, before: null, after });
            }
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
    async update(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Body() body: any, @Res() res: Response) {
        try {
            const postId = parseInt(id);
            const before = await this.postLogService.snapshot(postId);
            const result = await this.postService.update(postId, body);
            if (result) {
                const after = await this.postLogService.snapshot(postId);
                await this.postLogService.register({ action: 'UPDATE', postId, user, before, after });
            }
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Post updated successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Post not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error updating post' });
        }
    }

    @Delete('/:id')
    @UseGuards(JwtAuthGuard)
    async delete(@CurrentUser() user: JwtPayload, @Param('id') id: string, @Res() res: Response) {
        try {
            const postId = parseInt(id);
            const before = await this.postLogService.snapshot(postId);
            const result = await this.postService.delete(postId);
            if (result) {
                await this.postLogService.register({ action: 'DELETE', postId, user, before, after: null });
            }
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Post deleted successfully' })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Post not found' });
        } catch {
            return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({ error: 'Error deleting post' });
        }
    }
}
