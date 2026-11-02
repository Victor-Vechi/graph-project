import { Prisma } from '@prisma/client';

// Pesquisador ativo = usuário ativo e exibido no site. Note que /user/show usa só
// showUser, pois a página de membros também lista ex-membros (inativos).
export const ACTIVE_RESEARCHER = { active: true, showUser: true } satisfies Prisma.UserWhereInput;
