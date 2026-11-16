import { Module } from '@nestjs/common';
import { PostController } from './infra/post.controller';
import { PostService } from './application/post.service';
import { PostRepository } from './infra/post.repository';
import { PostLogModule } from '../PostLog/post-log.module';
import { MediaModule } from '../Shared/Media/media.module';

@Module({
    imports: [PostLogModule, MediaModule],
    controllers: [PostController],
    providers: [PostService, PostRepository],
})
export class PostModule {}
