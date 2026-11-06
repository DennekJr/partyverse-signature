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
 */
import sharp from 'sharp';
import { mkdirSync, writeFileSync } from 'node:fs';

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

/* ---- the HTML: tables and inline styles only, which is what email keeps */
const img = (base, f, w, h, alt = '') =>
  `<img src="${base}${f}.png" width="${w}" height="${h}" alt="${alt}" style="display:block;border:0;outline:none;width:${w}px;height:${h}px;">`;
const font = 'Helvetica,Arial,sans-serif';
const line = (label, text, href) =>
  `<tr><td style="padding:0 0 13px 0;font-family:${font};font-size:15px;line-height:19px;color:${INK};">${label}: <a href="${href}" style="color:${INK};text-decoration:none;">${text}</a></td></tr>`;

function html(base) {
  const icons = SOCIAL.map(([k, label, href], i) =>
    `<tr><td style="padding:${i ? 32 : 0}px 0 0 0;"><a href="${href}" target="_blank">${img(base, 'icon-' + k, 32, 32, label)}</a></td></tr>`).join('');
  const midCells = mid.map((c) => {
    const pic = img(base, c.name, c.width, c.height, c.name === 'badge-google' ? 'Get it on Google Play' : c.name === 'badge-apple' ? 'Download on the App Store' : '');
    const href = c.name === 'badge-google' ? STORES.google : c.name === 'badge-apple' ? STORES.apple : '';
    return `<td width="${c.width}" style="padding:0;line-height:0;font-size:0;">${href ? `<a href="${href}" target="_blank">${pic}</a>` : pic}</td>`;
  }).join('');
  return `<table cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;background:#ffffff;">
<tr><td style="padding:0;">
  <table cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;">
  <tr>
    <td valign="top" height="234" style="height:234px;padding:26px 0 0 26px;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">
      <tr><td style="font-family:'Archivo Black','Arial Black',Arial,sans-serif;font-size:36px;line-height:40px;font-weight:900;letter-spacing:-0.5px;color:${INK};">${PERSON.name}</td></tr>
      <tr><td style="padding:4px 0 52px 0;font-family:${font};font-size:20px;line-height:24px;color:${GREY};">${PERSON.title}</td></tr>
      ${line('T', PERSON.phone, 'tel:' + PERSON.tel)}
      ${line('E', PERSON.email, 'mailto:' + PERSON.email)}
      ${line('W', SITE.label, SITE.href)}
      </table>
    </td>
    <td valign="top" width="72" style="width:72px;padding:64px 0 0 0;">
      <table cellpadding="0" cellspacing="0" border="0" style="border-collapse:collapse;">${icons}</table>
    </td>
  </tr>
  </table>
</td></tr>
<tr><td style="padding:0;line-height:0;font-size:0;"><a href="${SITE.href}" target="_blank">${img(base, rowTop.name, 600, rowTop.height, 'What are you celebrating next?! PartyVerse')}</a></td></tr>
<tr><td style="padding:0;line-height:0;font-size:0;"><table cellpadding="0" cellspacing="0" border="0" width="600" style="width:600px;border-collapse:collapse;"><tr>${midCells}</tr></table></td></tr>
<tr><td style="padding:0;line-height:0;font-size:0;">${img(base, rowBottom.name, 600, rowBottom.height)}</td></tr>
</table>`;
}

writeFileSync('signature.html', html(BASE) + '\n');
writeFileSync('preview.html', `<!doctype html><meta charset="utf-8"><title>PartyVerse signature</title><body style="margin:40px;background:#f4f4f4">\n${html('images/')}\n</body>\n`);
console.log('images/, preview.html, signature.html (images from ' + BASE + ')');
