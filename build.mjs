/* The PartyVerse email signature, built from reference.png (the design,
 * 600 x 410). Writes:
 *   images/      the banner cut into rows (so each store badge is its own
 *                link) and the three social icons, drawn at 2x;
 *   preview.html the signature with local images, to look at;
 *   signature.html the same with full image addresses, to paste into Zoho
 *                (Settings > Signature > Insert HTML). Email can only show
 *                images that live at a public address, so upload images/
 *                somewhere public first and build with that address:
 *
 *   node build.mjs https://example.com/partyverse-signature/
 *
 * To make one for someone else, change PERSON below.
 *
 * The name is drawn as an image in Owambe Sans Extended Black, the design's
 * face, since most mail apps can't load a font. That needs the font file at
 * fonts/OwambeSansExt-Black.otf (kept out of git: it is PartyVerse's, and
 * this repo is public) and Google Chrome, which draws it.
 */
import sharp from 'sharp';
import { chromium } from 'playwright-core';
import { mkdirSync, writeFileSync, readFileSync } from 'node:fs';

const PERSON = {
  name: 'Mobola Awe',
  title: 'General Manager, PartyVerse',
  phone: '(+234) 802 345 6789',
  tel: '+2348023456789',
  email: 'mobola@partyverse.com',
};
const SITE = { label: 'partyverse.com', href: 'https://www.partyverse.com' };
const SOCIAL = [
  ['x', 'X', 'https://x.com/partyverseapp'],
  ['instagram', 'Instagram', 'https://www.instagram.com/partyverseapp/'],
  ['linkedin', 'LinkedIn', 'https://www.linkedin.com/company/partyverseapp'],
];
const STORES = {
  google: 'https://play.google.com/store/apps/details?id=com.planaparty.app',
  apple: 'https://apps.apple.com/app/id6748926356',
};
const INK = '#121212', PINK = '#f02363', GREY = '#939598';

const BASE = process.argv[2] || 'https://YOUR-IMAGE-HOST/partyverse-signature/';
mkdirSync('images', { recursive: true });

/* ---- the banner: the design's black band (y 260 to 410), cut so the two
   badges are their own images. Badges sit at x 240-299 and 302-361,
   y 365-386. */
const band = { top: 260, h: 150 };
const cut = async (name, left, top, width, height) => {
  await sharp('reference.png').extract({ left, top, width, height }).png().toFile(`images/${name}.png`);
  return { name, width, height };
};
const rowTop = await cut('banner-top', 0, band.top, 600, 105);
const midY = band.top + 105, midH = 21;
const mid = [
  await cut('banner-left', 0, midY, 240, midH),
  await cut('badge-google', 240, midY, 59, midH),
  await cut('banner-gap', 299, midY, 3, midH),
  await cut('badge-apple', 302, midY, 59, midH),
  await cut('banner-right', 361, midY, 239, midH),
];
const rowBottom = await cut('banner-bottom', 0, midY + midH, 600, band.top + band.h - midY - midH);

/* ---- the icons: a dark disc with the mark in pink, drawn at 64px for a
   32px slot so they stay sharp on retina screens */
const MARK = {
  x: `<path transform="translate(20 20) scale(1)" fill="${PINK}" d="M18.901 1.153h3.68l-8.04 9.19L24 22.846h-7.406l-5.8-7.584-6.638 7.584H.474l8.6-9.83L0 1.154h7.594l5.243 6.932ZM17.61 20.644h2.039L6.486 3.24H4.298Z"/>`,
  instagram: `<g fill="none" stroke="${PINK}" stroke-width="2.6"><rect x="20" y="20" width="24" height="24" rx="7"/><circle cx="32" cy="32" r="5.6"/></g><circle cx="38.6" cy="25.4" r="1.7" fill="${PINK}"/>`,
  linkedin: `<g fill="${PINK}"><rect x="21" y="27" width="5" height="16"/><circle cx="23.5" cy="21.8" r="3"/><path d="M30 27h4.8v2.3c.8-1.4 2.6-2.7 5.2-2.7 4.4 0 5 2.9 5 6.6V43h-5v-8.6c0-2 0-3.9-2.6-3.9s-2.4 1.9-2.4 3.8V43h-5z"/></g>`,
};
for (const [k] of SOCIAL) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><circle cx="32" cy="32" r="32" fill="${INK}"/>${MARK[k]}</svg>`;
  await sharp(Buffer.from(svg)).png().toFile(`images/icon-${k}.png`);
}

/* ---- the name, in the design's face: drawn by Chrome at 2x. 38.2px is the
   size at which "Mobola Awe" is as wide as in the design (271px). The image
   is cut to the name's own width, and from the top of the tall letters to
   the bottom of the low ones (measured on "Mbdgjpqy"), so every name sits
   the same way whatever its letters. */
const NAME_PX = 38.2;
const slug = PERSON.name.toLowerCase().normalize('NFD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const nameImg = await (async () => {
  const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', headless: true });
  const page = await browser.newPage({ deviceScaleFactor: 2 });
  const face = readFileSync('fonts/OwambeSansExt-Black.otf').toString('base64');
  const esc = (t) => t.replace(/[&<>]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' })[c]);
  const draw = async (text) => {
    await page.setContent(`<style>@font-face{font-family:N;src:url(data:font/otf;base64,${face})}body{margin:0}span{display:inline-block;font:${NAME_PX}px/1.6 N;color:${INK};padding:0 10px;white-space:nowrap}</style><span>${esc(text)}</span>`);
    await page.evaluate(() => document.fonts.ready);
    return page.locator('span').screenshot({ omitBackground: true });
  };
  const ink = async (png) => {
    const { info } = await sharp(png).trim().toBuffer({ resolveWithObject: true });
    return { left: -info.trimOffsetLeft, top: -info.trimOffsetTop, width: info.width, height: info.height };
  };
  const ref = await ink(await draw('Mbdgjpqy'));
  const png = await draw(PERSON.name);
  const own = await ink(png);
  await browser.close();
  // even sizes, so the 1x box is whole pixels
  const width = own.width + (own.width % 2), height = ref.height + (ref.height % 2);
  await sharp(png).extract({ left: own.left, top: ref.top, width, height }).png().toFile(`images/name-${slug}.png`);
  return { file: `name-${slug}`, width: width / 2, height: height / 2 };
})();

/* ---- the HTML: tables and inline styles only, which is what email keeps */
const img = (base, f, w, h, alt = '') =>
  `<img src="${base}${f}.png" width="${w}" height="${h}" alt="${alt}" style="display:block;border:0;outline:none;width:${w}px;height:${h}px;">`;
const font = 'Helvetica,Arial,sans-serif';
const line = (label, text, href) =>
  `<tr><td style="padding:0 0 13px 0;font-family:${font};font-size:15px;line-height:19px;color:${INK};">${label}: <a href="${href}" style="color:${INK};text-decoration:none;">${text}</a></td></tr>`;

/* Fluid: the signature fills the width it's given, up to 600px. The banner
   slices scale by the same ratio (each mid-row cell takes its slice's share
   of 600 as a percentage), on the banner's black so a rounding sliver can't
   show white. Desktop Outlook ignores max-width, so it gets a fixed 600px
   table from the conditional comments; the width/height attributes are for
   it too, the inline styles for everyone else. */
const fluid = (base, f, w, h, alt = '') =>
  `<img src="${base}${f}.png" width="${w}" height="${h}" alt="${alt}" style="display:block;border:0;outline:none;width:100%;max-width:${w}px;height:auto;">`;
const pct = (w) => +(w / 6).toFixed(4) + '%';

function html(base) {
  const icons = SOCIAL.map(([k, label, href], i) =>
    `<tr><td style="padding:${i ? 32 : 0}px 0 0 0;"><a href="${href}" target="_blank">${img(base, 'icon-' + k, 32, 32, label)}</a></td></tr>`).join('');
  const midCells = mid.map((c) => {
    const pic = fluid(base, c.name, c.width, c.height, c.name === 'badge-google' ? 'Get it on Google Play' : c.name === 'badge-apple' ? 'Download on the App Store' : '');
    const href = c.name === 'badge-google' ? STORES.google : c.name === 'badge-apple' ? STORES.apple : '';
    return `<td width="${pct(c.width)}" style="width:${pct(c.width)};padding:0;line-height:0;font-size:0;">${href ? `<a href="${href}" target="_blank" style="display:block;">${pic}</a>` : pic}</td>`;
  }).join('');
  const T = 'cellpadding="0" cellspacing="0" border="0" role="presentation"';
  /* On a phone, a smaller title so it keeps to one line (the name, an
     image, shrinks to fit by itself). Apps that drop <style> keep the
     inline size, and the title may wrap, which still reads fine. */
  const narrow = `<style>@media only screen and (max-width:420px){.pv-text{padding-left:18px!important}.pv-title{font-size:15px!important;line-height:19px!important;padding-bottom:36px!important}}</style>`;
  return `${narrow}
<!--[if mso]><table ${T} width="600"><tr><td><![endif]-->
<table ${T} width="100%" style="width:100%;max-width:600px;border-collapse:collapse;background:#ffffff;">
<tr><td style="padding:0;">
  <table ${T} width="100%" style="width:100%;border-collapse:collapse;">
  <tr>
    <td valign="top" height="234" class="pv-text" style="height:234px;padding:26px 10px 0 26px;">
      <table ${T} style="border-collapse:collapse;">
      <tr><td style="padding:8px 0 0 3px;line-height:0;font-size:0;"><img src="${base}${nameImg.file}.png" width="${nameImg.width}" height="${nameImg.height}" alt="${PERSON.name}" style="display:block;border:0;outline:none;width:${nameImg.width}px;max-width:100%;height:auto;font-family:'Arial Black',Arial,sans-serif;font-size:30px;line-height:34px;font-weight:900;color:${INK};"></td></tr>
      <tr><td class="pv-title" style="padding:5px 0 47px 0;font-family:${font};font-size:20px;line-height:24px;color:${GREY};">${PERSON.title}</td></tr>
      ${line('T', PERSON.phone, 'tel:' + PERSON.tel)}
      ${line('E', PERSON.email, 'mailto:' + PERSON.email)}
      ${line('W', SITE.label, SITE.href)}
      </table>
    </td>
    <td valign="top" width="72" style="width:72px;padding:64px 0 0 0;">
      <table ${T} style="border-collapse:collapse;">${icons}</table>
    </td>
  </tr>
  </table>
</td></tr>
<tr><td style="padding:0;line-height:0;font-size:0;background:${INK};"><a href="${SITE.href}" target="_blank" style="display:block;">${fluid(base, rowTop.name, 600, rowTop.height, 'What are you celebrating next?! PartyVerse')}</a></td></tr>
<tr><td style="padding:0;line-height:0;font-size:0;background:${INK};"><table ${T} width="100%" style="width:100%;border-collapse:collapse;table-layout:fixed;"><tr>${midCells}</tr></table></td></tr>
<tr><td style="padding:0;line-height:0;font-size:0;background:${INK};">${fluid(base, rowBottom.name, 600, rowBottom.height)}</td></tr>
</table>
<!--[if mso]></td></tr></table><![endif]-->`;
}

writeFileSync('signature.html', html(BASE) + '\n');
writeFileSync('preview.html', `<!doctype html><meta charset="utf-8"><title>PartyVerse signature</title><body style="margin:40px;background:#f4f4f4">\n${html('images/')}\n</body>\n`);
console.log('images/, preview.html, signature.html (images from ' + BASE + ')');
