import { prisma } from '../cliente.js';

/**
 * Borra imágenes solo cuando la base ya confirmó que no las necesita.
 * Si el proveedor falla, las filas pendientes se conservan para un reintento.
 */
export async function intentarLimpieza(almacenamiento, publicIds) {
  const explicita = Array.isArray(publicIds);
  const pedidos = explicita ? [...new Set(publicIds.filter((id) => typeof id === 'string' && id))] : [];
  let ids = pedidos;
  if (!explicita) {
    if (!prisma.limpiezaPendiente) return { eliminados: [], fallidos: [] };
    ids = (await prisma.limpiezaPendiente.findMany({ take: 100, select: { publicId: true } })).map((fila) => fila.publicId);
  }
  if (!ids.length) return { eliminados: [], fallidos: [] };
  if (!prisma.limpiezaPendiente) {
    console.error(`Quedaron ${ids.length} imágenes pendientes porque la base no tiene la tabla de limpieza.`);
    return { eliminados: [], fallidos: ids };
  }

  if (!almacenamiento?.eliminarVarios) {
    console.error(`Quedaron ${ids.length} imágenes pendientes porque no hay almacenamiento configurado.`);
    return { eliminados: [], fallidos: ids };
  }

  try {
    await almacenamiento.eliminarVarios(ids);
    await prisma.limpiezaPendiente.deleteMany({ where: { publicId: { in: ids } } });
    return { eliminados: ids, fallidos: [] };
  } catch (error) {
    const fallidos = Array.isArray(error?.fallidos) && error.fallidos.length ? error.fallidos : ids;
    const eliminados = ids.filter((id) => !fallidos.includes(id));
    if (eliminados.length) {
      await prisma.limpiezaPendiente.deleteMany({ where: { publicId: { in: eliminados } } }).catch(() => {});
    }
    console.error(`No se pudieron borrar ${fallidos.length} imágenes del almacenamiento. Se reintentará más tarde.`);
    return { eliminados, fallidos };
  }
}

/** Ejecuta la transacción completa y solo después intenta borrar las imágenes. */
export async function conLimpiezaPosterior(transaccion, almacenamiento) {
  const resultado = await transaccion();
  const ids = resultado?.evidenciasObsoletas ?? [];
  let limpieza = { eliminados: [], fallidos: [] };
  if (ids.length) {
    try {
      limpieza = await intentarLimpieza(almacenamiento, ids);
    } catch {
      console.error('No se pudieron borrar las imágenes obsoletas. Se reintentará más tarde.');
      limpieza = { eliminados: [], fallidos: ids };
    }
  }
  return { ...resultado, limpieza };
}

export async function anotarLimpieza(tx, publicIds) {
  const ids = [...new Set(publicIds.filter((id) => typeof id === 'string' && id))];
  if (!ids.length) return [];
  await tx.limpiezaPendiente.createMany({
    data: ids.map((publicId) => ({ publicId })),
    skipDuplicates: true,
  });
  return ids;
}
