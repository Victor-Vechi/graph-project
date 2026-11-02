import { PostService } from './post.service';
import type { PostRepository } from '../infra/post.repository';

describe('PostService', () => {
    let repository: { create: jest.Mock; update: jest.Mock; findById: jest.Mock; findExactTitle: jest.Mock };
    let service: PostService;

    beforeEach(() => {
        repository = {
            create: jest.fn().mockImplementation((data: object) => Promise.resolve({ id: 1, ...data })),
            update: jest.fn().mockImplementation((id: number, data: object) => Promise.resolve({ id, ...data })),
            findById: jest.fn().mockResolvedValue({ id: 1 }),
            findExactTitle: jest.fn().mockResolvedValue(null),
        };
        service = new PostService(repository as unknown as PostRepository);
    });

    it('sanitiza o conteúdo antes de criar', async () => {
        await service.create({
            title: 'Grafos',
            content: '<p onclick="x()">texto</p><script>alert(1)</script>',
            tags: [1],
        });

        expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ content: '<p>texto</p>' }));
    });

    it('sanitiza o conteúdo antes de editar', async () => {
        await service.update(1, {
            title: 'Grafos',
            content: '<p><a href="javascript:alert(1)">l</a></p>',
            tags: [1],
        });

        expect(repository.update).toHaveBeenCalledWith(1, expect.objectContaining({ content: '<p><a>l</a></p>' }));
    });

    it.each([
        '<script>alert(1)</script>',
        '<p></p>',
        '<img src=x onerror=alert(1)>',
    ])('rejeita conteúdo que fica vazio após sanitizar: %s', async (content) => {
        await expect(service.create({ title: 'Grafos', content, tags: [1] })).resolves.toBeNull();
        await expect(service.update(1, { title: 'Grafos', content, tags: [1] })).resolves.toBeNull();

        expect(repository.create).not.toHaveBeenCalled();
        expect(repository.update).not.toHaveBeenCalled();
    });
});
