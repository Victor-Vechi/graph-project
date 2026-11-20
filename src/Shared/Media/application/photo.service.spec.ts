import { BadRequestException } from '@nestjs/common';
import { PhotoService } from './photo.service';
import { MediaService } from './media.service';

describe('PhotoService', () => {
    const media = {
        uploadPublicImage: jest.fn(),
        deleteAsset: jest.fn(),
        toResponse: jest.fn(),
    };
    let service: PhotoService;

    beforeEach(() => {
        jest.resetAllMocks();
        media.deleteAsset.mockResolvedValue(undefined);
        service = new PhotoService(media as unknown as MediaService);
    });

    it('preserves the existing photo when only other fields are edited', async () => {
        const persist = jest.fn().mockResolvedValue({ id: 1 });
        await expect(service.save({}, 'old', 1, persist)).resolves.toEqual({ id: 1 });
        expect(persist).toHaveBeenCalledWith(undefined);
        expect(media.uploadPublicImage).not.toHaveBeenCalled();
        expect(media.deleteAsset).not.toHaveBeenCalled();
    });

    it('removes the previous photo only after its replacement is saved', async () => {
        const photo = { base64: 'image' };
        media.uploadPublicImage.mockResolvedValue({ id: 'new' });
        const persist = jest.fn().mockImplementation(() => {
            expect(media.deleteAsset).not.toHaveBeenCalled();
            return Promise.resolve({ id: 1 });
        });
        await service.save({ photo }, 'old', 1, persist);
        expect(media.uploadPublicImage).toHaveBeenCalledWith(photo, 1);
        expect(persist).toHaveBeenCalledWith('new');
        expect(media.deleteAsset).toHaveBeenCalledWith('old');
    });

    it('cleans up the new upload and keeps the old photo if saving fails', async () => {
        media.uploadPublicImage.mockResolvedValue({ id: 'new' });
        const error = new Error('save failed');
        const persist = jest.fn().mockRejectedValue(error);
        await expect(service.save({ photo: 'image' }, 'old', 1, persist)).rejects.toBe(error);
        expect(media.deleteAsset).toHaveBeenCalledTimes(1);
        expect(media.deleteAsset).toHaveBeenCalledWith('new');
    });

    it('clears the reference before removing a photo explicitly', async () => {
        const persist = jest.fn().mockResolvedValue({ id: 1 });
        await service.save({ removePhoto: true }, 'old', 1, persist);
        expect(persist).toHaveBeenCalledWith(null);
        expect(media.deleteAsset).toHaveBeenCalledWith('old');
    });

    it('does not change the record or old photo when an upload is invalid', async () => {
        media.uploadPublicImage.mockRejectedValue(new BadRequestException('Invalid image'));
        const persist = jest.fn();
        await expect(service.save({ photo: 'invalid' }, 'old', 1, persist)).rejects.toBeInstanceOf(BadRequestException);
        expect(persist).not.toHaveBeenCalled();
        expect(media.deleteAsset).not.toHaveBeenCalled();
    });

    it('prefers a replacement upload over a stale remove flag', async () => {
        media.uploadPublicImage.mockResolvedValue({ id: 'new' });
        const persist = jest.fn().mockResolvedValue({ id: 1 });
        await service.save({ photo: 'image', removePhoto: true }, 'old', 1, persist);
        expect(persist).toHaveBeenCalledWith('new');
    });
});
