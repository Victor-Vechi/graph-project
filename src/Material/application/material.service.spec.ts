import { BadRequestException } from '@nestjs/common';
import { MaterialService } from './material.service';
import type { MaterialRepository } from '../infra/material.repository';
import type { MediaService } from '../../Shared/Media/application/media.service';
import type { MediaAssetEntity } from '../../Shared/Media/domain/media.entity';

describe('MaterialService', () => {
    let repository: {
        create: jest.Mock;
        findById: jest.Mock;
        findAll: jest.Mock;
        update: jest.Mock;
        delete: jest.Mock;
    };
    let mediaService: {
        uploadPrivateMaterial: jest.Mock;
        deleteAsset: jest.Mock;
        getDownloadUrl: jest.Mock;
        toResponse: jest.Mock;
    };
    let service: MaterialService;

    beforeEach(() => {
        repository = {
            create: jest.fn(),
            findById: jest.fn(),
            findAll: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
        };
        mediaService = {
            uploadPrivateMaterial: jest.fn(),
            deleteAsset: jest.fn().mockResolvedValue(undefined),
            getDownloadUrl: jest.fn(),
            toResponse: jest.fn().mockImplementation((asset: MediaAssetEntity) => ({
                id: asset.id,
                originalName: asset.originalName,
                mimeType: asset.mimeType,
                sizeBytes: Number(asset.sizeBytes),
                kind: asset.kind,
                visibility: asset.visibility,
            })),
        };
        service = new MaterialService(
            repository as unknown as MaterialRepository,
            mediaService as unknown as MediaService,
        );
    });

    it('cria material com arquivo em base64 e retorna metadados adaptados', async () => {
        const media = {
            id: 'media-1',
            originalName: 'aula.pdf',
            mimeType: 'application/pdf',
            sizeBytes: BigInt(1024),
            kind: 'PDF',
            visibility: 'PRIVATE',
        };
        mediaService.uploadPrivateMaterial.mockResolvedValue(media);
        repository.create.mockResolvedValue({
            id: 5,
            title: 'Grafos PDF',
            description: 'Material de aula',
            category: 'notas-aula',
            year: 2026,
            tags: ['Grafos', 'PDF'],
            mediaId: 'media-1',
            uploadedById: 1,
            createdAt: new Date('2026-01-01'),
            updatedAt: new Date('2026-01-01'),
            active: true,
            media,
            uploadedBy: { id: 1, name: 'Admin' },
        });

        const result = await service.create(
            {
                title: 'Grafos PDF',
                description: 'Material de aula',
                category: 'notas-aula',
                year: '2026',
                tags: 'Grafos, PDF',
                file: { base64: 'data:application/pdf;base64,JVBERi0=', fileName: 'aula.pdf' },
            },
            1,
        );

        expect(mediaService.uploadPrivateMaterial).toHaveBeenCalledWith(
            { base64: 'data:application/pdf;base64,JVBERi0=', fileName: 'aula.pdf' },
            1,
            { fileName: undefined, mimeType: undefined },
        );
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                title: 'Grafos PDF',
                year: 2026,
                tags: ['Grafos', 'PDF'],
                mediaId: 'media-1',
            }),
        );
        expect(result?.id).toBe('5');
        expect(result?.media.url).toBeUndefined();
    });

    it('rejeita criação sem título ou arquivo', async () => {
        await expect(service.create({ title: 'Sem arquivo' }, 1)).resolves.toBeNull();
        expect(mediaService.uploadPrivateMaterial).not.toHaveBeenCalled();
    });

    it('rejeita ano inválido', async () => {
        mediaService.uploadPrivateMaterial.mockResolvedValue({ id: 'media-1' });

        await expect(
            service.create({ title: 'Teste', year: 1800, file: 'JVBERi0=' }, 1),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(mediaService.deleteAsset).toHaveBeenCalledWith('media-1');
    });

    it('atualiza material substituindo arquivo antigo', async () => {
        const oldMedia = {
            id: 'media-old',
            originalName: 'v1.pdf',
            mimeType: 'application/pdf',
            sizeBytes: BigInt(100),
            kind: 'PDF',
            visibility: 'PRIVATE',
        };
        const newMedia = {
            ...oldMedia,
            id: 'media-new',
            originalName: 'v2.pdf',
        };

        repository.findById.mockResolvedValue({ id: 5, mediaId: 'media-old', media: oldMedia });
        mediaService.uploadPrivateMaterial.mockResolvedValue(newMedia);
        repository.update.mockResolvedValue({
            id: 5,
            title: 'Atualizado',
            description: null,
            category: 'slides',
            year: 2026,
            tags: [],
            mediaId: 'media-new',
            createdAt: new Date(),
            updatedAt: new Date(),
            active: true,
            media: newMedia,
            uploadedBy: null,
        });

        const updated = await service.update(5, { title: 'Atualizado', file: 'JVBERi0=' }, 1);

        expect(updated?.media.id).toBe('media-new');
        expect(mediaService.deleteAsset).toHaveBeenCalledWith('media-old');
    });

    it('exclui material e remove mídia associada', async () => {
        repository.findById.mockResolvedValue({ id: 5, mediaId: 'media-1' });
        repository.delete.mockResolvedValue({ id: 5 });

        await expect(service.delete(5)).resolves.toBe(true);
        expect(repository.delete).toHaveBeenCalledWith(5);
        expect(mediaService.deleteAsset).toHaveBeenCalledWith('media-1');
    });

    it('retorna Data URI e metadados em getDownloadUrl', async () => {
        repository.findById.mockResolvedValue({ id: 5, mediaId: 'media-1' });
        mediaService.getDownloadUrl.mockResolvedValue({
            url: 'data:application/pdf;base64,JVBERi0=',
            originalName: 'aula.pdf',
            mimeType: 'application/pdf',
            expiresIn: 0,
        });

        await expect(service.getDownloadUrl(5)).resolves.toEqual({
            url: 'data:application/pdf;base64,JVBERi0=',
            originalName: 'aula.pdf',
            mimeType: 'application/pdf',
            expiresIn: 0,
        });
    });
});
