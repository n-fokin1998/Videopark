/**
 * Lossless metadata inspection and stripping for JPEG and PNG (docs/architecture.md §6: EXIF/GPS never published).
 * Only metadata segments/chunks are removed; image data is copied byte for byte. ICC colour profiles are kept.
 */

export type MetadataReport = {
  format: 'jpeg' | 'png' | 'other';
  /** EXIF block present. */
  exif: boolean;
  /** EXIF contains a GPS IFD. */
  gps: boolean;
  /** XMP / IPTC / PNG text metadata present. */
  other: boolean;
  /** EXIF orientation (1 = normal). Stripping a non-1 orientation would rotate the image, so it is refused. */
  orientation: number | undefined;
};

const JPEG_SOI = 0xffd8;
const EXIF_HEADER = 'Exif\0\0';
const XMP_HEADER = 'http://ns.adobe.com/xap/1.0/\0';
const PNG_SIGNATURE = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
const PNG_METADATA_CHUNKS = new Set(['eXIf', 'tEXt', 'iTXt', 'zTXt', 'tIME']);

type Segment = { marker: number; start: number; end: number; payload: Buffer };

function jpegSegments(buf: Buffer): { segments: Segment[]; dataStart: number } {
  if (buf.length < 4 || buf.readUInt16BE(0) !== JPEG_SOI) throw new Error('exif: not a JPEG');
  const segments: Segment[] = [];
  let pos = 2;
  while (pos + 4 <= buf.length) {
    if (buf[pos] !== 0xff) throw new Error(`exif: corrupt JPEG marker at ${pos}`);
    const marker = buf[pos + 1] ?? 0;
    if (marker === 0xff) {
      pos += 1; // fill byte
      continue;
    }
    if (marker === 0xda || marker === 0xd9) break; // start of scan / end of image
    const length = buf.readUInt16BE(pos + 2);
    const end = pos + 2 + length;
    segments.push({ marker, start: pos, end, payload: buf.subarray(pos + 4, end) });
    pos = end;
  }
  return { segments, dataStart: pos };
}

/** Orientation and GPS presence from an EXIF payload (after the `Exif\0\0` header). */
function readExif(tiff: Buffer): { orientation: number | undefined; gps: boolean } {
  if (tiff.length < 8) return { orientation: undefined, gps: false };
  const little = tiff.toString('latin1', 0, 2) === 'II';
  const u16 = (o: number) => (little ? tiff.readUInt16LE(o) : tiff.readUInt16BE(o));
  const u32 = (o: number) => (little ? tiff.readUInt32LE(o) : tiff.readUInt32BE(o));
  const ifd = u32(4);
  if (ifd + 2 > tiff.length) return { orientation: undefined, gps: false };
  let orientation: number | undefined;
  let gps = false;
  const count = u16(ifd);
  for (let i = 0; i < count; i++) {
    const entry = ifd + 2 + i * 12;
    if (entry + 12 > tiff.length) break;
    const tag = u16(entry);
    if (tag === 0x0112) orientation = u16(entry + 8);
    if (tag === 0x8825) gps = true;
  }
  return { orientation, gps };
}

export function inspectMetadata(buf: Buffer): MetadataReport {
  if (buf.length >= 2 && buf.readUInt16BE(0) === JPEG_SOI) {
    const report: MetadataReport = { format: 'jpeg', exif: false, gps: false, other: false, orientation: undefined };
    for (const s of jpegSegments(buf).segments) {
      const head = s.payload.toString('latin1', 0, 32);
      if (s.marker === 0xe1 && head.startsWith(EXIF_HEADER)) {
        report.exif = true;
        const { orientation, gps } = readExif(s.payload.subarray(EXIF_HEADER.length));
        report.orientation = orientation;
        report.gps ||= gps;
      } else if ((s.marker === 0xe1 && head.startsWith(XMP_HEADER)) || s.marker === 0xed) {
        report.other = true;
      }
    }
    return report;
  }
  if (buf.subarray(0, 8).equals(PNG_SIGNATURE)) {
    const report: MetadataReport = { format: 'png', exif: false, gps: false, other: false, orientation: undefined };
    for (const chunk of pngChunks(buf)) {
      if (chunk.type === 'eXIf') {
        report.exif = true;
        const exif = readExif(chunk.data);
        report.gps ||= exif.gps;
        report.orientation = exif.orientation;
      } else if (PNG_METADATA_CHUNKS.has(chunk.type)) report.other = true;
    }
    return report;
  }
  return { format: 'other', exif: false, gps: false, other: false, orientation: undefined };
}

function* pngChunks(buf: Buffer) {
  let pos = 8;
  while (pos + 12 <= buf.length) {
    const length = buf.readUInt32BE(pos);
    const type = buf.toString('latin1', pos + 4, pos + 8);
    const end = pos + 12 + length;
    yield { type, start: pos, end, data: buf.subarray(pos + 8, pos + 8 + length) };
    pos = end;
  }
}

/** Remove EXIF, XMP and IPTC (JPEG) or eXIf/text chunks (PNG). Throws when the image relies on EXIF orientation. */
export function stripMetadata(buf: Buffer): Buffer {
  const report = inspectMetadata(buf);
  if (report.orientation !== undefined && report.orientation !== 1) {
    throw new Error(`exif: orientation ${report.orientation} — re-encode the image upright before stripping`);
  }
  if (report.format === 'jpeg') {
    const { segments, dataStart } = jpegSegments(buf);
    const keep = segments.filter((s) => {
      const head = s.payload.toString('latin1', 0, 32);
      const isExif = s.marker === 0xe1 && (head.startsWith(EXIF_HEADER) || head.startsWith(XMP_HEADER));
      return !isExif && s.marker !== 0xed;
    });
    return Buffer.concat([
      buf.subarray(0, 2),
      ...keep.map((s) => buf.subarray(s.start, s.end)),
      buf.subarray(dataStart),
    ]);
  }
  if (report.format === 'png') {
    const parts = [buf.subarray(0, 8)];
    for (const chunk of pngChunks(buf))
      if (!PNG_METADATA_CHUNKS.has(chunk.type)) parts.push(buf.subarray(chunk.start, chunk.end));
    return Buffer.concat(parts);
  }
  return buf;
}
