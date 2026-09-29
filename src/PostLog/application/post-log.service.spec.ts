import { PostLogService } from './post-log.service';
import type { PostLogRepository } from '../infra/post-log.repository';

const user = { id: '7', name: 'Maria', email: 'maria@x.com', cargo: 'membro' };
const post = { title: 'Grafos', content: '<p>texto</p>', tags: ['a', 'b'] };

describe('PostLogService', () => {
    let create: jest.Mock;
    let service: PostLogService;

    beforeEach(() => {
        create = jest.fn().mockResolvedValue({});
        service = new PostLogService({ create } as unknown as PostLogRepository);
    });

    it('registra apenas os campos alterados numa edição', async () => {
        await service.register({
            action: 'UPDATE', postId: 1, user,
            before: post, after: { ...post, title: 'Grafos 2' },
        });

        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            action: 'UPDATE', postId: 1, userId: 7, userName: 'Maria',
            postTitle: 'Grafos 2', changes: ['title'],
        }));
    });

    it('não registra edição sem mudanças', async () => {
        await service.register({ action: 'UPDATE', postId: 1, user, before: post, after: { ...post } });
        expect(create).not.toHaveBeenCalled();
    });

    it('na exclusão guarda o título e desvincula a notícia', async () => {
        await service.register({ action: 'DELETE', postId: 1, user, before: post, after: null });

        expect(create).toHaveBeenCalledWith(expect.objectContaining({
            action: 'DELETE', postId: null, postTitle: 'Grafos', changes: ['title', 'content', 'tags'],
        }));
    });

    it('não propaga erro ao gravar o log', async () => {
        create.mockRejectedValue(new Error('db down'));
        jest.spyOn(service['logger'], 'error').mockImplementation(() => undefined);

        await expect(service.register({
            action: 'CREATE', postId: 1, user, before: null, after: post,
        })).resolves.toBeUndefined();
    });
});
