import { hasVisibleText, sanitizeRichText } from './html-sanitizer';

const SAFE_LINK = 'target="_blank" rel="noopener noreferrer nofollow"';

describe('sanitizeRichText', () => {
    it('mantém a formatação produzida pelo editor', () => {
        const html = '<h2>Título</h2><p><strong>a</strong> <em>b</em> <u>c</u> <s>d</s></p>'
            + '<ul><li><p>item</p></li></ul><ol><li><p>1</p></li></ol>'
            + '<blockquote><p>cit</p></blockquote><pre><code>x</code></pre><hr />';

        expect(sanitizeRichText(html)).toBe(html);
    });

    it.each([
        ['<script>alert(1)</script><p>ok</p>', '<p>ok</p>'],
        ['<style>body{display:none}</style><p>ok</p>', '<p>ok</p>'],
        ['<img src=x onerror=alert(1)>', ''],
        ['<img src="https://evil.com/x.png" onerror="alert(1)">', ''],
        ['<img src="data:image/svg+xml;base64,PHN2Zz4=">', ''],
        ['<iframe src="https://evil"></iframe>', ''],
        ['<svg><script>alert(1)</script></svg>', ''],
        ['<form action="https://evil"><input name="a"></form>', ''],
        ['<p onclick="alert(1)" style="color:red" class="c" id="i">p</p>', '<p>p</p>'],
    ])('remove conteúdo perigoso: %s', (input, expected) => {
        expect(sanitizeRichText(input)).toBe(expected);
    });

    it.each([
        'javascript:alert(1)',
        'JAVASCRIPT:alert(1)',
        ' javascript:alert(1)',
        'java&#x09;script:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
        'vbscript:msgbox(1)',
        '//evil.com',
    ])('remove href inseguro: %s', (href) => {
        expect(sanitizeRichText(`<p><a href="${href}">link</a></p>`)).toBe('<p><a>link</a></p>');
    });

    it('mantém imagens em Base64 válidas e remove atributos inseguros', () => {
        const input = '<img src="data:image/png;base64,iVBORw0KGgo=" alt="Grafo" onclick="alert(1)" />';
        expect(sanitizeRichText(input)).toBe('<img src="data:image/png;base64,iVBORw0KGgo=" alt="Grafo" />');
    });

    it('mantém anexos PDF e documentos em Base64 com download e rel seguros', () => {
        const input = '<p><a href="data:application/pdf;base64,JVBERi0=" download="artigo.pdf">artigo.pdf</a></p>';
        expect(sanitizeRichText(input))
            .toBe(`<p><a href="data:application/pdf;base64,JVBERi0=" download="artigo.pdf" ${SAFE_LINK}>artigo.pdf</a></p>`);
    });

    it('força target e rel seguros nos links permitidos', () => {
        expect(sanitizeRichText('<p><a href="https://x.com" target="_self" rel="opener">l</a></p>'))
            .toBe(`<p><a href="https://x.com" ${SAFE_LINK}>l</a></p>`);
        expect(sanitizeRichText('<p><a href="mailto:a@b.com">m</a></p>'))
            .toBe(`<p><a href="mailto:a@b.com" ${SAFE_LINK}>m</a></p>`);
    });

    it('converte texto puro em parágrafos, escapando o texto', () => {
        expect(sanitizeRichText('a < b & c\n\nsegundo\nlinha'))
            .toBe('<p>a &lt; b &amp; c</p><p>segundo<br />linha</p>');
    });

    it('é idempotente', () => {
        const once = sanitizeRichText('<p>a &amp; <a href="https://x.com">b</a></p><img src="data:image/png;base64,iVBORw0KGgo=" alt="x" />');
        expect(sanitizeRichText(once)).toBe(once);
    });

    it.each([undefined, null, 42, {}, ['<p>x</p>'], '', '   '])('rejeita entrada inválida: %p', (input) => {
        expect(sanitizeRichText(input)).toBe('');
    });
});

describe('hasVisibleText', () => {
    it('detecta conteúdo sem texto e aceita imagem Base64 válida', () => {
        expect(hasVisibleText('')).toBe(false);
        expect(hasVisibleText('<p></p>')).toBe(false);
        expect(hasVisibleText('<p> </p><hr />')).toBe(false);
        expect(hasVisibleText('<img src="data:image/svg+xml;base64,PHN2Zz4=" />')).toBe(false);
        expect(hasVisibleText('<p>a</p>')).toBe(true);
        expect(hasVisibleText('<img src="data:image/png;base64,iVBORw0KGgo=" />')).toBe(true);
    });
});
