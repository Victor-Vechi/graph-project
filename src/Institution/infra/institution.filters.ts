import { Prisma } from '@prisma/client';
import { ACTIVE_RESEARCHER } from '../../User/infra/user.filters';

// Instituição parceira = ativa e com ao menos um pesquisador ativo vinculado
export const PARTNER_INSTITUTION = {
    active: true,
    users: { some: ACTIVE_RESEARCHER },
} satisfies Prisma.InstitutionWhereInput;
