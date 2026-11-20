import { PostService } from './post.service';
import type { PostRepository } from '../infra/post.repository';
import type { MediaService } from '../../Shared/Media/application/media.service';
import type { MediaAssetEntity } from '../../Shared/Media/domain/media.entity';

describe('PostService', () => {
    let repository: {
        create: jest.Mock;
        update: jest.Mock;
        findById: jest.Mock;
        findExactTitle: jest.Mock;
        delete: jest.Mock;
    };
    let mediaService: {
        uploadPublicImage: jest.Mock;
        deleteAsset: jest.Mock;
        toResponse: jest.Mock;
    };
    let service: PostService;

    beforeEach(() => {
        repository = {
            create: jest.fn().mockImplementation((data: object) => Promise.resolve({ id: 1, ...data })),
            update: jest.fn().mockImplementation((id: number, data: object) => Promise.resolve({ id, ...data })),
            findById: jest.fn().mockResolvedValue({ id: 1, coverMediaId: null }),
            findExactTitle: jest.fn().mockResolvedValue(null),
            delete: jest.fn().mockResolvedValue({ id: 1 }),
        };
        mediaService = {
            uploadPublicImage: jest.fn(),
            deleteAsset: jest.fn().mockResolvedValue(undefined),
            toResponse: jest.fn().mockImplementation((asset: MediaAssetEntity, alt?: string) => ({
                id: asset.id,
                originalName: asset.originalName,
                mimeType: asset.mimeType,
                sizeBytes: Number(asset.sizeBytes),
                kind: asset.kind,
                visibility: asset.visibility,
                url: `data:${asset.mimeType};base64,${asset.base64Data ?? ''}`,
                alt,
            })),
        };
        service = new PostService(
            repository as unknown as PostRepository,
            mediaService as unknown as MediaService,
        );
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

    it('faz upload da imagem de capa em base64 ao criar notícia', async () => {
        const asset: MediaAssetEntity = {
            id: 'media-cover',
            originalName: 'capa.png',
            mimeType: 'image/png',
            sizeBytes: BigInt(12),
            checksum: 'abc',
            base64Data: 'AAAA',
            kind: 'IMAGE',
            visibility: 'PUBLIC',
            uploadedById: 3,
            createdAt: new Date(),
            updatedAt: new Date(),
        };
        mediaService.uploadPublicImage.mockResolvedValue(asset);
        repository.create.mockImplementation((data: Record<string, unknown>) =>
            Promise.resolve({
                id: 10,
                ...data,
                tags: [{ tag: { id: 1, name: 'Pesquisa' } }],
                user: { id: 3, name: 'Ana' },
                coverMedia: asset,
            }),
        );

        const result = await service.create(
            {
                title: 'Notícia com Capa',
                content: '<p>Conteúdo válido</p>',
                tags: [1],
                cover: { base64: 'data:image/png;base64,AAAA', fileName: 'capa.png' },
                coverAlt: 'Capa da notícia',
            },
            3,
        );

        expect(mediaService.uploadPublicImage).toHaveBeenCalledWith(
            { base64: 'data:image/png;base64,AAAA', fileName: 'capa.png' },
            3,
            { fileName: undefined, mimeType: undefined },
        );
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                coverMediaId: 'media-cover',
                coverAlt: 'Capa da notícia',
                userId: 3,
            }),
        );
        expect(result?.cover?.url).toBe('data:image/png;base64,AAAA');
    });

    it('remove capa antiga ao editar com removeCover=true', async () => {
        repository.findById.mockResolvedValue({ id: 1, coverMediaId: 'old-cover' });

        await service.update(
            1,
            {
                title: 'Notícia Editada',
                content: '<p>Texto</p>',
                tags: [1],
                removeCover: true,
            },
            3,
        );

        expect(repository.update).toHaveBeenCalledWith(
            1,
            expect.objectContaining({ coverMediaId: null, coverAlt: null }),
        );
        expect(mediaService.deleteAsset).toHaveBeenCalledWith('old-cover');
    });
});
