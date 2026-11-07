// Adaptador de almacenamiento de evidencias en Cloudinary.
//
// La base de datos guarda solo la URL segura y el public_id. Hay dos formas de
// subir una foto:
//
//  1. Desde el backend (p. ej. con multer en memoria):
//       const almacen = crearAlmacenamientoCloudinary();
//       const evidencia = await subirEvidencia(req.file, { almacenamiento: almacen });
//       await registrarCumplimiento(usuarioId, retoId, { cumplido: true, evidencias: [evidencia] });
//
//  2. Directo desde el frontend con una firma generada por el backend
//     (firmarSubida()); luego el frontend manda { url, publicId, formato,
//     bytes } y el backend los pasa en `evidencias`.
//
// Configuración: variable CLOUDINARY_URL=cloudinary://API_KEY:API_SECRET@CLOUD_NAME
// o CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY y CLOUDINARY_API_SECRET.

import { v2 as cloudinary } from 'cloudinary';

export function crearAlmacenamientoCloudinary({
  cloudName = process.env.CLOUDINARY_CLOUD_NAME,
  apiKey = process.env.CLOUDINARY_API_KEY,
  apiSecret = process.env.CLOUDINARY_API_SECRET,
  carpeta = process.env.CLOUDINARY_CARPETA ?? 'steply/evidencias',
} = {}) {
  if (!process.env.CLOUDINARY_URL) {
    if (!cloudName || !apiKey || !apiSecret) {
      throw new Error('Faltan las credenciales de Cloudinary (CLOUDINARY_URL o CLOUDINARY_CLOUD_NAME/API_KEY/API_SECRET)');
    }
    cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
  } else {
    cloudinary.config({ secure: true });
  }
  const nombreNube = cloudinary.config().cloud_name;

  return {
    nombre: 'cloudinary',
    carpeta,

    /** Sube un buffer y devuelve los datos que se guardan en la tabla evidencias. */
    subir(buffer) {
      return new Promise((resolve, reject) => {
        const flujo = cloudinary.uploader.upload_stream(
          { folder: carpeta, resource_type: 'image' },
          (error, r) => {
            if (error) return reject(error);
            resolve({
              url: r.secure_url,
              publicId: r.public_id,
              formato: r.format,
              bytes: r.bytes,
              ancho: r.width,
              alto: r.height,
            });
          },
        );
        flujo.end(buffer);
      });
    },

    async eliminar(publicId) {
      await cloudinary.uploader.destroy(publicId, { resource_type: 'image' });
    },

    async eliminarVarios(publicIds) {
      // La API admite hasta 100 public_id por llamada.
      for (let i = 0; i < publicIds.length; i += 100) {
        await cloudinary.api.delete_resources(publicIds.slice(i, i + 100), { resource_type: 'image' });
      }
    },

    /** Firma para que el frontend suba directamente a Cloudinary. */
    firmarSubida() {
      const timestamp = Math.round(Date.now() / 1000);
      const signature = cloudinary.utils.api_sign_request(
        { timestamp, folder: carpeta },
        cloudinary.config().api_secret,
      );
      return { timestamp, signature, folder: carpeta, apiKey: cloudinary.config().api_key, cloudName: nombreNube };
    },

    /** Confirma que una URL recibida del frontend es de nuestra cuenta y carpeta. */
    esUrlPropia(url, publicId) {
      return (
        typeof url === 'string' &&
        url.startsWith(`https://res.cloudinary.com/${nombreNube}/`) &&
        typeof publicId === 'string' &&
        publicId.startsWith(`${carpeta}/`)
      );
    },
  };
}

/** Almacenamiento en memoria para pruebas y desarrollo sin Cloudinary. */
export function crearAlmacenamientoMemoria() {
  const archivos = new Map();
  let contador = 0;
  return {
    nombre: 'memoria',
    archivos,
    async subir(buffer, { formato = 'jpg' } = {}) {
      const publicId = `steply/evidencias/prueba-${++contador}`;
      archivos.set(publicId, buffer);
      return {
        url: `https://res.cloudinary.com/demo/image/upload/${publicId}.${formato}`,
        publicId,
        formato,
        bytes: buffer.length,
        ancho: null,
        alto: null,
      };
    },
    async eliminar(publicId) {
      archivos.delete(publicId);
    },
    async eliminarVarios(ids) {
      ids.forEach((id) => archivos.delete(id));
    },
    esUrlPropia: () => true,
  };
}
