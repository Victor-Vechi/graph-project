import { StatsService } from './stats.service';
import type { StatsRepository } from '../infra/stats.repository';

describe('StatsService', () => {
    it('agrega as contagens do repositório', async () => {
        const repository = {
            countActiveResearchers: jest.fn().mockResolvedValue(12),
            countPosts: jest.fn().mockResolvedValue(30),
            countPartnerInstitutions: jest.fn().mockResolvedValue(4),
        };
        const service = new StatsService(repository as unknown as StatsRepository);

        await expect(service.getStats()).resolves.toEqual({ researchers: 12, posts: 30, institutions: 4 });
    });

    it('propaga erro do banco para o controller responder 500', async () => {
        const repository = {
            countActiveResearchers: jest.fn().mockResolvedValue(12),
            countPosts: jest.fn().mockRejectedValue(new Error('db down')),
            countPartnerInstitutions: jest.fn().mockResolvedValue(4),
        };
        const service = new StatsService(repository as unknown as StatsRepository);

        await expect(service.getStats()).rejects.toThrow('db down');
    });
});
