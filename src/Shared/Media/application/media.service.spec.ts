import { BadRequestException } from '@nestjs/common';
import { MediaService } from './media.service';

describe('MediaService', () => {
    const repository = {
        create: jest.fn(),
        findById: jest.fn(),
        delete: jest.fn(),
    };

    const storage = {
        putObject: jest.fn(),
        deleteObject: jest.fn(),
        getPublicUrl: jest.fn(),
        getSignedReadUrl: jest.fn(),
    };

    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('stores a valid PNG and persists metadata', async () => {
        const service = new MediaService(repository as any, storage as any);
        const file = {
            originalname: 'cover.png',
            mimetype: 'image/png',
            size: 12,
            buffer: Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 1, 2, 3, 4]),
        };

        storage.putObject.mockResolvedValue({ etag: 'etag' });
        repository.create.mockImplementation(async (data: any) => ({
            id: 'media-1',
            ...data,
            createdAt: new Date(),
            updatedAt: new Date(),
        }));

        const result = await service.uploadPublicImage(file, 1);

        expect(storage.putObject).toHaveBeenCalledTimes(1);
        expect(repository.create).toHaveBeenCalledWith(
            expect.objectContaining({
                originalName: 'cover.png',
                mimeType: 'image/png',
                kind: 'IMAGE',
                visibility: 'PUBLIC',
                uploadedById: 1,
            }),
        );
        expect(result.id).toBe('media-1');
    });

    it('rejects spoofed image MIME types', async () => {
        const service = new MediaService(repository as any, storage as any);

        await expect(
            service.uploadPublicImage(
                {
                    originalname: 'fake.png',
                    mimetype: 'image/png',
                    size: 4,
                    buffer: Buffer.from('nope'),
                },
                1,
            ),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(storage.putObject).not.toHaveBeenCalled();
    });
});
