import sanitizeHtml from 'sanitize-html';

// Allowlist do conteúdo rich text dos posts. Deve ser a mesma usada no front
// (graph-project-react/src/service/security/sanitizeHtml.js): só as tags que o
// editor produz, atributos restritos e bloqueio de javascript:, data:text/html, vbscript: etc.,
// permitindo data: apenas para imagens raster e anexos seguros em Base64.
const ALLOWED_TAGS = [
    'p', 'br', 'hr',
    'h2', 'h3',
    'strong', 'b', 'em', 'i', 'u', 's',
    'ul', 'ol', 'li',
    'blockquote', 'pre', 'code',
    'a', 'img',
];

const LINK_REL = 'noopener noreferrer nofollow';

// eslint-disable-next-line no-control-regex
const URL_WHITESPACE = /[\x00-\x20\s]/g;

const SAFE_BASE64_IMAGE_SRC =
    /^data:image\/(?:png|jpe?g|webp|gif);base64,[a-z0-9+/]+={0,2}$/i;

const SAFE_BASE64_FILE_HREF =
    /^data:(?:application\/(?:pdf|msword|vnd\.openxmlformats-officedocument\.(?:wordprocessingml\.document|spreadsheetml\.sheet|presentationml\.presentation)|vnd\.ms-excel|vnd\.ms-powerpoint|zip|x-zip-compressed|json)|text\/(?:plain|csv));base64,[a-z0-9+/]+={0,2}$/i;

const RICH_TEXT_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
        a: ['href', 'download'],
        img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
        a: ['http', 'https', 'mailto', 'data'],
        img: ['data'],
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    // Tags fora da lista são removidas; script, style etc. perdem também o conteúdo
    disallowedTagsMode: 'discard',
};

// Segunda passada, sobre HTML já limpo: o transformTags roda antes do filtro de
// esquemas, por isso só aqui sabemos quais links/imagens mantiveram URLs seguras.
const LINK_ATTRIBUTES_OPTIONS: sanitizeHtml.IOptions = {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
        a: ['href', 'target', 'rel', 'download'],
        img: ['src', 'alt'],
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowedSchemesByTag: {
        a: ['http', 'https', 'mailto', 'data'],
        img: ['data'],
    },
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    allowProtocolRelative: false,
    transformTags: {
        a: (tagName, attribs) => {
            const rawHref = attribs.href ?? '';
            const cleanHref = rawHref.replace(URL_WHITESPACE, '');
            if (!rawHref) {
                return { tagName, attribs: {} };
            }

            const safeDownload = attribs.download?.trim().replace(/[/\\]/g, '_');

            if (/^data:/i.test(cleanHref)) {
                if (!SAFE_BASE64_FILE_HREF.test(cleanHref)) {
                    return { tagName, attribs: {} };
                }

                const safeAttribs: sanitizeHtml.Attributes = {
                    href: cleanHref,
                    ...(safeDownload ? { download: safeDownload } : {}),
                    target: '_blank',
                    rel: LINK_REL,
                };
                return { tagName, attribs: safeAttribs };
            }

            const safeAttribs: sanitizeHtml.Attributes = {
                href: rawHref,
                ...(safeDownload ? { download: safeDownload } : {}),
                target: '_blank',
                rel: LINK_REL,
            };
            return { tagName, attribs: safeAttribs };
        },
        img: (tagName, attribs) => {
            const cleanSrc = (attribs.src ?? '').replace(URL_WHITESPACE, '');
            if (!SAFE_BASE64_IMAGE_SRC.test(cleanSrc)) {
                return { tagName, attribs: {} };
            }

            const safeAlt = attribs.alt?.trim();
            const safeAttribs: sanitizeHtml.Attributes = {
                src: cleanSrc,
                ...(safeAlt ? { alt: safeAlt } : {}),
            };
            return { tagName, attribs: safeAttribs };
        },
    },
    exclusiveFilter: (frame) => frame.tag === 'img' && !frame.attribs.src,
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

// Indica se o HTML tem algum texto visível ou imagem válida em Base64
export const hasVisibleText = (html: string): boolean => {
    if (sanitizeHtml(html, TEXT_ONLY_OPTIONS).trim().length > 0) return true;
    const clean = sanitizeRichText(html);
    return /<img\b[^>]*\bsrc=["']data:image\//i.test(clean);
};
