import { BadRequestException, NotFoundException } from '@nestjs/common';
import { MediaService } from './media.service';
import type { MediaRepository } from '../infra/media.repository';
import type { MediaAssetEntity } from '../domain/media.entity';

describe('MediaService', () => {
    const repository = {
        create: jest.fn(),
        findById: jest.fn(),
        delete: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('armazena imagem enviada via Data URI base64 e retorna URL data:', async () => {
        const service = new MediaService(repository as unknown as MediaRepository);
        const pngBytes = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]);
        const dataUri = `data:image/png;base64,${pngBytes.toString('base64')}`;

        repository.create.mockImplementation((data: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>) =>
            Promise.resolve({
                id: 'media-1',
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        );

        const asset = await service.uploadPublicImage(
            { base64: dataUri, fileName: 'cover.png' },
            7,
        );

        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                originalName: 'cover.png',
                mimeType: 'image/png',
                base64Data: pngBytes.toString('base64'),
                kind: 'IMAGE',
                visibility: 'PUBLIC',
                uploadedById: 7,
            }),
        );
        expect(service.toResponse(asset, 'Capa')).toEqual(
            expect.objectContaining({
                id: 'media-1',
                url: dataUri,
                alt: 'Capa',
            }),
        );
    });

    it('armazena PDF enviado via objeto base64 puro e gera Data URI no download', async () => {
        const service = new MediaService(repository as unknown as MediaRepository);
        const pdfBytes = Buffer.from('%PDF-1.4\n%fake-pdf');
        const base64 = pdfBytes.toString('base64');

        repository.create.mockImplementation((data: Omit<MediaAssetEntity, 'id' | 'createdAt' | 'updatedAt'>) =>
            Promise.resolve({
                id: 'media-pdf',
                ...data,
                createdAt: new Date(),
                updatedAt: new Date(),
            }),
        );

        const created = await service.uploadPrivateMaterial(
            { base64, fileName: 'artigo.pdf', mimeType: 'application/pdf' },
            1,
        );

        expect(created.kind).toBe('PDF');
        expect(created.visibility).toBe('PRIVATE');
        expect(service.toResponse(created).url).toBeUndefined();

        repository.findById.mockResolvedValue(created);
        await expect(service.getDownloadUrl('media-pdf')).resolves.toEqual({
            url: `data:application/pdf;base64,${base64}`,
            originalName: 'artigo.pdf',
            mimeType: 'application/pdf',
            expiresIn: 0,
        });
    });

    it('rejeita MIME falsificado com assinatura binária incompatível', async () => {
        const service = new MediaService(repository as unknown as MediaRepository);
        const fakePng = Buffer.from('not-a-png').toString('base64');

        await expect(
            service.uploadPublicImage(
                { base64: `data:image/png;base64,${fakePng}`, fileName: 'fake.png' },
                1,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(repository.create).not.toHaveBeenCalled();
    });

    it('rejeita string base64 inválida', async () => {
        const service = new MediaService(repository as unknown as MediaRepository);

        await expect(
            service.uploadPublicImage({ base64: '!!!invalid-base64!!!', fileName: 'x.png' }, 1),
        ).rejects.toBeInstanceOf(BadRequestException);
    });

    it('lança NotFoundException ao solicitar download de mídia inexistente', async () => {
        const service = new MediaService(repository as unknown as MediaRepository);
        repository.findById.mockResolvedValue(null);

        await expect(service.getDownloadUrl('missing')).rejects.toBeInstanceOf(NotFoundException);
    });
});
