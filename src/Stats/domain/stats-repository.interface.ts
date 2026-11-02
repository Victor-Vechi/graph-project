export interface IStatsRepository {
    countActiveResearchers(): Promise<number>;
    countPosts(): Promise<number>;
    countPartnerInstitutions(): Promise<number>;
}
