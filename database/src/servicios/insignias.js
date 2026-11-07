// Insignias (RF-16, RF-18). El catálogo vive en la tabla `insignias` (ver
// prisma/seed.js); aquí se otorgan automáticamente según su criterio.

/**
 * Otorga al usuario todas las insignias cuyo umbral ya alcanzó.
 * @returns {Promise<object[]>} insignias recién obtenidas
 */
export async function evaluarInsignias(tx, usuarioId, { retoId = null } = {}) {
  const pendientes = await tx.insignia.findMany({
    where: { usuarios: { none: { usuarioId } } },
  });
  if (pendientes.length === 0) return [];

  const [usuario, rachaMax, completados, ganados] = await Promise.all([
    tx.usuario.findUniqueOrThrow({ where: { id: usuarioId }, select: { puntosTotales: true } }),
    tx.participanteReto.aggregate({ where: { usuarioId }, _max: { mejorRacha: true } }),
    tx.participanteReto.count({ where: { usuarioId, completado: true } }),
    tx.participanteReto.count({
      where: { usuarioId, posicionFinal: 1, reto: { tipo: 'GRUPAL' } },
    }),
  ]);
  const metrica = {
    RACHA: rachaMax._max.mejorRacha ?? 0,
    PUNTOS_TOTALES: usuario.puntosTotales,
    RETOS_COMPLETADOS: completados,
    RETOS_GANADOS: ganados,
  };

  const nuevas = pendientes.filter((i) => metrica[i.criterio] >= i.umbral);
  if (nuevas.length > 0) {
    await tx.insigniaUsuario.createMany({
      data: nuevas.map((i) => ({ usuarioId, insigniaId: i.id, retoId })),
      skipDuplicates: true,
    });
  }
  return nuevas;
}

/** Insignias del usuario (desbloqueadas y por desbloquear) para RF-18. */
export async function listarInsignias(db, usuarioId) {
  const [todas, obtenidas] = await Promise.all([
    db.insignia.findMany({ orderBy: [{ criterio: 'asc' }, { umbral: 'asc' }] }),
    db.insigniaUsuario.findMany({ where: { usuarioId } }),
  ]);
  const mapa = new Map(obtenidas.map((o) => [o.insigniaId, o]));
  return todas.map((i) => ({
    ...i,
    obtenida: mapa.has(i.id),
    obtenidaEn: mapa.get(i.id)?.obtenidaEn ?? null,
  }));
}
