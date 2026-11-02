import sanitizeHtml from 'sanitize-html';

// Allowlist do conteúdo rich text dos posts. Deve ser a mesma usada no front
// (graph-project-react/src/service/security/sanitizeHtml.js): só as tags que o
// editor produz, nenhum atributo além de href e nenhum esquema de URL além de
// http(s)/mailto (bloqueia javascript:, data:, vbscript: etc.).
const ALLOWED_TAGS = [
    'p', 'br', 'hr',
    'h2', 'h3',
    'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a',
];

const LINK_REL = 'noopener noreferrer nofollow';

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    // Tags fora da lista são removidas; script, style etc. perdem também o conteúdo
    disallowedTagsMode: 'discard',
};

// Segunda passada, sobre HTML já limpo: o transformTags roda antes do filtro de
// esquemas, por isso só aqui sabemos quais links mantiveram um href seguro.
const LINK_ATTRIBUTES_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: { a: ['href', 'target', 'rel'] },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesAppliedToAttributes: ['href'],
    allowProtocolRelative: false,
    transformTags: {
        a: (tagName, attribs) => {
            const safeAttribs: sanitizeHtml.Attributes = attribs.href
                ? { href: attribs.href, target: '_blank', rel: LINK_REL }
                : {};
            return { tagName, attribs: safeAttribs };
        },
    },
};

const TEXT_ONLY_OPTIONS: sanitizeHtml.IOptions = { allowedTags: [], allowedAttributes: {} };

const looksLikeHtml = (content: string): boolean => /<\/?[a-z][\s\S]*>/i.test(content);

const escapeHtml = (text: string): string =>
    text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');

// Texto puro (clientes antigos) vira parágrafos, para que o banco guarde sempre HTML
const plainTextToHtml = (text: string): string =>
    text
        .split(/\n{2,}/)
        .map((paragraph) => paragraph.trim())
        .filter(Boolean)
        .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
        .join('');

export const sanitizeRichText = (content: unknown): string => {
    if (typeof content !== 'string' || !content.trim()) return '';
    const html = looksLikeHtml(content) ? content : plainTextToHtml(content);
    return sanitizeHtml(sanitizeHtml(html, RICH_TEXT_OPTIONS), LINK_ATTRIBUTES_OPTIONS);
};

// Indica se o HTML tem algum texto visível (ex.: "<p></p>" ou "<script>" sozinho não têm)
export const hasVisibleText = (html: string): boolean =>
    sanitizeHtml(html, TEXT_ONLY_OPTIONS).trim().length > 0;
