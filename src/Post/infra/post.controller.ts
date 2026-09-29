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
    UploadedFile,
    UseGuards,
    UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { CurrentUser } from '../../Shared/Auth/infra/current-user.decorator';
import type { JwtPayload } from '../../Shared/Auth/domain/jwt.interface';
import { JwtAuthGuard } from '../../Shared/Auth/infra/jwt-auth.guard';
import type { UploadedMediaFile } from '../../Shared/Media/domain/media.entity';
import { PostService } from '../application/post.service';
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
    @UseInterceptors(FileInterceptor('cover', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async create(
        @CurrentUser() user: JwtPayload,
        @Body() body: any,
        @UploadedFile() cover: UploadedMediaFile | undefined,
        @Res() res: Response,
    ) {
        try {
            const post = await this.postService.create(body, parseInt(user.id), cover);
            if (post) {
                const postId = parseInt(post.id);
                const after = await this.postLogService.snapshot(postId);
                await this.postLogService.register({ action: 'CREATE', postId, user, before: null, after });
            }
            return post
                ? res.status(HttpStatus.CREATED).json({ message: 'Post created successfully', post })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Invalid data' });
        } catch (error) {
            if (error instanceof HttpException) throw error;
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
    @UseInterceptors(FileInterceptor('cover', { limits: { fileSize: 10 * 1024 * 1024 } }))
    async update(
        @CurrentUser() user: JwtPayload,
        @Param('id') id: string,
        @Body() body: any,
        @UploadedFile() cover: UploadedMediaFile | undefined,
        @Res() res: Response,
    ) {
        try {
            const postId = parseInt(id);
            const before = await this.postLogService.snapshot(postId);
            const result = await this.postService.update(postId, body, parseInt(user.id), cover);
            if (result) {
                const after = await this.postLogService.snapshot(postId);
                await this.postLogService.register({ action: 'UPDATE', postId, user, before, after });
            }
            return result
                ? res.status(HttpStatus.OK).json({ message: 'Post updated successfully', post: result })
                : res.status(HttpStatus.BAD_REQUEST).json({ error: 'Post not found or invalid data' });
        } catch (error) {
            if (error instanceof HttpException) throw error;
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
