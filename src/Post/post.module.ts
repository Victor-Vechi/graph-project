import { Module } from '@nestjs/common';
import { MediaModule } from '../Shared/Media/media.module';
import { PostService } from './application/post.service';
import { PostController } from './infra/post.controller';
import { PostRepository } from './infra/post.repository';
import { PostLogModule } from '../PostLog/post-log.module';

@Module({
    imports: [MediaModule, PostLogModule],
    controllers: [PostController],
    providers: [PostService, PostRepository],
})
export class PostModule {}
