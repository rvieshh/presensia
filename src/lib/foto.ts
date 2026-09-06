import sharp from 'sharp';

export const MAKS_UNGGAH = 8 * 1024 * 1024; // 8 MB sebelum diproses
const LEBAR = 480;
const TINGGI = 640; // rasio 3:4 seperti foto identitas

export interface HasilFoto {
  data: Buffer;
  mime: string;
  info: string;
}

/**
 * Ubah unggahan menjadi JPEG 3:4 berukuran wajar.
 * Menyimpan hasil olahan (bukan berkas asli) menjaga ukuran baris
 * basis data tetap kecil dan menghilangkan metadata EXIF.
 */
export async function olahFoto(masuk: Buffer): Promise<HasilFoto> {
  const img = sharp(masuk, { failOn: 'none' }).rotate(); // hormati orientasi EXIF
  const meta = await img.metadata();

  if (!meta.width || !meta.height) {
    throw new Error('Berkas bukan gambar yang dikenali');
  }

  const data = await img
    .resize(LEBAR, TINGGI, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 82, mozjpeg: true })
    .toBuffer();

  return {
    data,
    mime: 'image/jpeg',
    info: `${meta.width}x${meta.height} ${meta.format} -> ${LEBAR}x${TINGGI} jpeg ${Math.round(data.length / 1024)}KB`,
  };
}
