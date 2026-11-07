// Interfaz del prototipo. JavaScript simple, sin frameworks.
// Cada acción llama a /api/... del servidor del prototipo, que a su vez usa
// las funciones de @steply/database.

const $ = (sel) => document.querySelector(sel);
const vista = $('#vista');
const estado = { usuarioId: null, usuarios: [], vista: 'inicio', calendario: null, info: {} };

const guardar = (k, v) => { try { localStorage.setItem(k, v); } catch {} };
const leer = (k) => { try { return localStorage.getItem(k); } catch { return null; } };

const esc = (v) => String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]);
const dia = (d) => (d ? String(d).slice(0, 10) : '');
const hora = (d) => (d ? new Date(d).toLocaleString('es-CR', { dateStyle: 'short', timeStyle: 'short' }) : '');
const chip = (t) => `<span class="chip ${esc(t)}">${esc(String(t).replaceAll('_', ' ').toLowerCase())}</span>`;
const signo = (n) => `<span class="${n > 0 ? 'mas' : n < 0 ? 'menos' : ''}">${n > 0 ? '+' : ''}${n}</span>`;
const DIAS = ['', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom'];
const frecuenciaTexto = (r) =>
  r.frecuencia === 'DIARIA' ? 'Diario'
    : r.frecuencia === 'SEMANAL' ? `${r.vecesPorSemana} veces por semana`
      : r.diasSemana.map((d) => DIAS[d]).join(', ');

// ---------------------------------------------------------------------------
//  API
// ---------------------------------------------------------------------------

async function api(metodo, url, cuerpo) {
  const res = await fetch(url, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      'x-usuario-id': estado.usuarioId ?? '',
      'x-fecha-simulada': $('#fechaSimulada').value,
    },
    body: cuerpo ? JSON.stringify(cuerpo) : undefined,
  });
  const datos = await res.json().catch(() => ({}));
  if (!res.ok) {
    const e = new Error(datos.mensaje ?? 'Error');
    e.codigo = datos.codigo;
    throw e;
  }
  return datos;
}

let temporizador;
function aviso(texto, error = false) {
  const el = $('#aviso');
  el.textContent = texto;
  el.className = `aviso visible${error ? ' error' : ''}`;
  clearTimeout(temporizador);
  temporizador = setTimeout(() => (el.className = 'aviso'), error ? 6000 : 3000);
}

/** Ejecuta una acción, muestra el resultado o el error y refresca la vista. */
async function accion(fn, mensajeOk) {
  try {
    const r = await fn();
    if (mensajeOk) aviso(typeof mensajeOk === 'function' ? mensajeOk(r) : mensajeOk);
    await cargarUsuarios();
    await mostrar(estado.vista, estado.parametro);
    return r;
  } catch (e) {
    aviso(`${e.codigo ? `[${e.codigo}] ` : ''}${e.message}`, true);
    return null;
  }
}

// ---------------------------------------------------------------------------
//  Encabezado: usuario y fecha simulada
// ---------------------------------------------------------------------------

async function cargarUsuarios() {
  estado.usuarios = await api('GET', '/api/usuarios');
  const sel = $('#selUsuario');
  if (!estado.usuarios.some((u) => u.id === estado.usuarioId)) {
    estado.usuarioId = estado.usuarios.find((u) => u.correo === 'angie@ejemplo.com')?.id ?? estado.usuarios[0]?.id ?? null;
  }
  sel.innerHTML = estado.usuarios
    .map((u) => `<option value="${u.id}" ${u.id === estado.usuarioId ? 'selected' : ''}>${esc(u.nombre)} · ${u.puntosTotales} pts${u.rol === 'ADMIN_GENERAL' ? ' (admin)' : ''}</option>`)
    .join('');
  const pend = estado.usuarioId ? await api('GET', '/api/pendientes').catch(() => []) : [];
  $('#contPendientes').textContent = pend.length || '';
}

function moverFecha(dias) {
  const input = $('#fechaSimulada');
  const base = input.value || estado.info.hoyReal;
  const d = new Date(`${base}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  input.value = d.toISOString().slice(0, 10);
  guardar('steply-fecha', input.value);
}

$('#selUsuario').addEventListener('change', (e) => {
  estado.usuarioId = e.target.value;
  guardar('steply-usuario', estado.usuarioId);
  accion(async () => {});
});
$('#fechaSimulada').addEventListener('change', (e) => { guardar('steply-fecha', e.target.value); accion(async () => {}); });
$('#btnDiaMenos').addEventListener('click', () => { moverFecha(-1); accion(async () => {}); });
$('#btnHoy').addEventListener('click', () => { $('#fechaSimulada').value = estado.info.hoyReal; guardar('steply-fecha', ''); accion(async () => {}); });
$('#btnDiaMas').addEventListener('click', () => {
  moverFecha(1);
  accion(() => api('POST', '/api/cierre'), (r) =>
    `Cierre del ${$('#fechaSimulada').value}: ${r.incumplimientosAutomaticos} incumplimientos, ${r.castigosAplicados} castigos, ${r.retosFinalizados} retos finalizados`);
});

$('#pestanas').addEventListener('click', (e) => {
  const b = e.target.closest('button[data-vista]');
  if (b) mostrar(b.dataset.vista);
});

// ---------------------------------------------------------------------------
//  Vistas
// ---------------------------------------------------------------------------

async function mostrar(nombre, parametro) {
  estado.vista = nombre;
  estado.parametro = parametro;
  document.querySelectorAll('#pestanas button').forEach((b) => b.classList.toggle('activa', b.dataset.vista === nombre));
  if (!estado.usuarioId) {
    vista.innerHTML = `<div class="tarjeta vacio-msg">No hay usuarios. Ve a <b>Herramientas</b> y carga los datos demo o crea un usuario.</div>`;
    if (nombre !== 'herramientas') return;
  }
  try {
    await VISTAS[nombre](parametro);
  } catch (e) {
    vista.innerHTML = `<div class="tarjeta vacio-msg">${esc(e.message)}</div>`;
  }
}

const VISTAS = {
  // ----- Inicio (dashboard) -------------------------------------------------
  async inicio() {
    const [resumen, hoy] = await Promise.all([api('GET', '/api/resumen'), api('GET', '/api/hoy')]);
    const pendientes = hoy.filter((h) => h.estadoHoy === 'PENDIENTE').length;
    vista.innerHTML = `
      <h2>Hola, ${esc(resumen.usuario.nombre)} 👋</h2>
      <div class="rejilla">
        <div class="dato"><b>${resumen.puntosTotales}</b><span>puntos</span></div>
        <div class="dato"><b>${resumen.rachaActual}</b><span>racha actual</span></div>
        <div class="dato"><b>${resumen.mejorRacha}</b><span>mejor racha</span></div>
        <div class="dato"><b>${resumen.retosActivos}</b><span>retos activos</span></div>
        <div class="dato"><b>${resumen.grupos}</b><span>grupos</span></div>
        <div class="dato"><b>${resumen.retosGanados}</b><span>retos ganados</span></div>
      </div>
      <div class="tarjeta" style="margin-top:14px">
        <h3>Mis hábitos de hoy (${esc($('#fechaSimulada').value || estado.info.hoyReal)}) · ${pendientes} pendiente(s)</h3>
        ${hoy.length ? hoy.map(tarjetaHoy).join('') : '<p class="vacio-msg">No tienes retos activos. Crea uno en "Crear reto".</p>'}
      </div>
      <div class="tarjeta"><h3>Insignias</h3>
        ${resumen.insignias.length ? `<div class="fila">${resumen.insignias.map((i) => `<span class="chip">🏅 ${esc(i.nombre)}</span>`).join('')}</div>` : '<p class="suave">Aún no hay insignias.</p>'}
      </div>`;
    activarRegistro();
  },

  // ----- Mis hábitos --------------------------------------------------------
  async habitos(filtro = 'TODOS') {
    const terminados = leer('steply-terminados') === '1';
    const lista = await api('GET', `/api/retos?tipo=${filtro}&terminados=${terminados ? 1 : 0}`);
    vista.innerHTML = `
      <h2>Mis hábitos</h2>
      <div class="fila" style="margin-bottom:12px">
        ${['TODOS', 'PERSONAL', 'GRUPAL'].map((f) => `<button class="${f === filtro ? '' : 'sec'}" data-filtro="${f}">${{ TODOS: 'Todos', PERSONAL: 'Personales', GRUPAL: 'Grupales' }[f]}</button>`).join('')}
        <label class="linea"><input type="checkbox" id="chkTerminados" ${terminados ? 'checked' : ''}> incluir terminados / abandonados</label>
      </div>
      ${lista.length ? lista.map((p) => `
        <div class="item fila entre">
          <div>
            <h4>${esc(p.reto.nombre)} ${chip(p.reto.estado)} ${chip(p.estado)}</h4>
            <div class="suave">${p.reto.grupo ? esc(p.reto.grupo.nombre) : 'Personal'} · ${frecuenciaTexto(p.reto)} · racha ${p.rachaActual} (mejor ${p.mejorRacha}) · ${p.puntos} pts</div>
          </div>
          <button class="sec" data-ver="${p.reto.id}">Ver detalle</button>
        </div>`).join('') : '<p class="vacio-msg">No hay hábitos con ese filtro.</p>'}`;
    vista.querySelectorAll('[data-filtro]').forEach((b) => (b.onclick = () => mostrar('habitos', b.dataset.filtro)));
    $('#chkTerminados').onchange = (e) => { guardar('steply-terminados', e.target.checked ? '1' : '0'); mostrar('habitos', filtro); };
    activarVer();
  },

  // ----- Detalle de un reto -------------------------------------------------
  async detalle(retoId) {
    const { reto, ranking, historial, castigos, galeria } = await api('GET', `/api/retos/${retoId}`);
    const yo = reto.participantes.find((p) => p.usuarioId === estado.usuarioId);
    vista.innerHTML = `
      <div class="fila entre"><h2>${esc(reto.nombre)} ${chip(reto.estado)}</h2><button class="sec" id="btnVolver">← Volver</button></div>
      <div class="dos">
        <div class="tarjeta">
          <h3>Configuración</h3>
          <table>
            <tr><th>Tipo</th><td>${reto.tipo === 'GRUPAL' ? `Grupal · ${esc(reto.grupo?.nombre)}` : 'Personal'}</td></tr>
            <tr><th>Creado por</th><td>${esc(reto.creador.nombre)}</td></tr>
            <tr><th>Meta</th><td>${esc(reto.meta ?? '—')}</td></tr>
            <tr><th>Frecuencia</th><td>${frecuenciaTexto(reto)}</td></tr>
            <tr><th>Fechas</th><td>${dia(reto.fechaInicio)} → ${dia(reto.fechaFin) || 'sin fin'}</td></tr>
            <tr><th>Puntos</th><td>+${reto.puntosPorCumplimiento} al cumplir · −${reto.puntosPorIncumplimiento} al fallar${reto.bonoRachaCada ? ` · bono +${reto.bonoRachaPuntos} cada ${reto.bonoRachaCada} de racha` : ''}</td></tr>
            <tr><th>Evidencia</th><td>${reto.requiereEvidencia ? 'Obligatoria' : 'Opcional'} · ${reto.requiereAprobacion ? 'requiere aprobación' : 'sin aprobación'}</td></tr>
            <tr><th>Reglas</th><td>${reto.diasGraciaRegistro} día(s) de gracia · meta ${reto.porcentajeMinimoCumplimiento}% · ${reto.permiteAbandono ? 'se puede abandonar' : 'no se puede abandonar'}</td></tr>
            <tr><th>Castigo</th><td>${reto.castigo ? `${esc(reto.castigo.descripcion ?? '')} ${reto.castigo.puntos ? `(−${reto.castigo.puntos} pts)` : ''} · ${reto.castigo.periodo === 'SEMANAL' ? 'cada semana' : 'al finalizar'}` : 'Sin castigo'}</td></tr>
          </table>
        </div>
        <div class="tarjeta">
          <h3>Mis acciones</h3>
          ${yo ? `
            <p class="suave">Mi estado: ${chip(yo.estado)} · racha ${yo.rachaActual} · ${yo.puntos} pts</p>
            ${formRegistro(reto.id, true)}
            <hr style="border:0;border-top:1px solid var(--borde);margin:14px 0">
            <div class="fila">
              ${yo.estado === 'PAUSADO'
                ? '<button class="sec" id="btnReanudar">Reanudar</button>'
                : `<input type="date" id="pausaHasta" style="width:auto" title="Último día de pausa (opcional)"><input id="pausaMotivo" placeholder="Motivo (opcional)" style="width:auto"><button class="sec" id="btnPausar">Pausar</button>`}
              <button class="peligro" id="btnAbandonar">Abandonar</button>
            </div>` : '<p class="suave">No participas en este reto.</p>'}
          <hr style="border:0;border-top:1px solid var(--borde);margin:14px 0">
          <details><summary>Gestionar (creador o admin del grupo)</summary>
            <div class="rejilla-form">
              <label>Nombre<input id="edNombre" value="${esc(reto.nombre)}"></label>
              <label>Puntos al cumplir<input type="number" id="edPuntos" value="${reto.puntosPorCumplimiento}"></label>
              <label>Puntos al fallar<input type="number" id="edMenos" value="${reto.puntosPorIncumplimiento}"></label>
              <label>Fecha de fin<input type="date" id="edFin" value="${dia(reto.fechaFin)}"></label>
              <label class="linea"><input type="checkbox" id="edAprob" ${reto.requiereAprobacion ? 'checked' : ''}> Requiere aprobación</label>
            </div>
            <div class="fila" style="margin-top:10px">
              <button id="btnEditar">Guardar cambios</button>
              <button class="sec" id="btnCancelar">Cancelar reto</button>
              <button class="peligro" id="btnEliminar">Eliminar reto</button>
            </div>
          </details>
        </div>
      </div>
      <div class="dos">
        <div class="tarjeta"><h3>Tabla de posiciones</h3>
          <table><tr><th>#</th><th>Nombre</th><th>Puntos</th><th>Racha</th><th>Mejor</th></tr>
          ${ranking.map((f) => `<tr><td>${f.posicion}</td><td>${esc(f.usuario.nombre)} ${f.estado === 'PAUSADO' ? chip('PAUSADO') : ''}</td><td>${f.puntos}</td><td>${f.rachaActual}</td><td>${f.mejorRacha}</td></tr>`).join('')}</table>
        </div>
        <div class="tarjeta"><h3>Castigos aplicados</h3>
          ${castigos.length ? `<table><tr><th>Quién</th><th>Periodo</th><th>Cumplió</th><th>Castigo</th><th></th></tr>
          ${castigos.map((c) => `<tr><td>${esc(c.participante.usuario.nombre)}</td><td>${dia(c.periodoInicio)} → ${dia(c.periodoFin)}</td><td>${c.cumplidos}/${c.requeridos}</td><td>${esc(c.descripcion ?? '')} ${c.puntos ? `(−${c.puntos})` : ''}</td>
            <td>${c.saldado ? chip('APROBADO') : `<button class="sec" data-saldar="${c.id}">Saldado</button>`}</td></tr>`).join('')}</table>` : '<p class="suave">Nadie ha recibido castigos.</p>'}
        </div>
      </div>
      <div class="tarjeta"><h3>Mi historial (RF-07)</h3>
        ${historial.length ? `<div class="tabla"><table><tr><th>Día</th><th>Resultado</th><th>Estado</th><th>Registrado</th><th>Nota</th></tr>
        ${historial.map((r) => `<tr><td>${dia(r.fecha)}</td><td>${r.cumplido ? '✅ Cumplido' : '❌ No cumplido'}${r.automatico ? ' <span class="suave">(automático)</span>' : ''}</td><td>${chip(r.estado)}</td><td>${hora(r.registradoEn)}</td><td>${esc(r.nota ?? r.motivoRechazo ?? '')}</td></tr>`).join('')}</table></div>` : '<p class="suave">Sin registros.</p>'}
      </div>
      <div class="tarjeta"><h3>Evidencias</h3>
        ${galeria.length ? `<div class="galeria">${galeria.map((e) => `<a href="${esc(e.url)}" target="_blank" title="${esc(e.registro.participante.usuario.nombre)} · ${dia(e.registro.fecha)}"><img src="${esc(e.url)}" alt="evidencia"></a>`).join('')}</div>` : '<p class="suave">Sin fotos.</p>'}
      </div>`;

    $('#btnVolver').onclick = () => mostrar('habitos');
    activarRegistro();
    const id = reto.id;
    $('#btnPausar') && ($('#btnPausar').onclick = () => accion(() => api('POST', `/api/retos/${id}/pausa`, { hasta: $('#pausaHasta').value, motivo: $('#pausaMotivo').value }), 'Participación pausada: la racha queda congelada'));
    $('#btnReanudar') && ($('#btnReanudar').onclick = () => accion(() => api('DELETE', `/api/retos/${id}/pausa`), 'Pausa terminada'));
    $('#btnAbandonar') && ($('#btnAbandonar').onclick = () => confirm('¿Abandonar este reto?') && accion(() => api('POST', `/api/retos/${id}/abandonar`), 'Abandonaste el reto'));
    $('#btnEditar').onclick = () => accion(() => api('PATCH', `/api/retos/${id}`, {
      nombre: $('#edNombre').value,
      puntosPorCumplimiento: Number($('#edPuntos').value),
      puntosPorIncumplimiento: Number($('#edMenos').value),
      fechaFin: $('#edFin').value || null,
      requiereAprobacion: $('#edAprob').checked,
    }), 'Reto actualizado');
    $('#btnCancelar').onclick = () => confirm('¿Cancelar el reto? Se conserva el historial.') && accion(() => api('POST', `/api/retos/${id}/cancelar`), 'Reto cancelado');
    $('#btnEliminar').onclick = async () => {
      if (!confirm('¿Eliminar el reto y TODO su historial?')) return;
      const r = await accion(() => api('DELETE', `/api/retos/${id}`), 'Reto eliminado');
      if (r) mostrar('habitos');
    };
    vista.querySelectorAll('[data-saldar]').forEach((b) => (b.onclick = () => accion(() => api('POST', `/api/castigos/${b.dataset.saldar}/saldar`), 'Castigo marcado como saldado')));
  },

  // ----- Crear reto ---------------------------------------------------------
  async crear() {
    const grupos = await api('GET', '/api/grupos');
    vista.innerHTML = `
      <h2>Crear hábito-reto</h2>
      <form class="tarjeta" id="formReto">
        <div class="rejilla-form">
          <label>Nombre *<input name="nombre" placeholder="Leer" required></label>
          <label>Meta<input name="meta" placeholder="20 páginas"></label>
          <label>Tipo
            <select name="tipo"><option value="PERSONAL">Personal</option>${grupos.length ? '<option value="GRUPAL">Grupal</option>' : ''}</select>
          </label>
          <label id="campoGrupo" hidden>Grupo
            <select name="grupoId">${grupos.map((g) => `<option value="${g.id}">${esc(g.nombre)}</option>`).join('')}</select>
          </label>
          <label>Frecuencia
            <select name="frecuencia"><option value="DIARIA">Diaria</option><option value="SEMANAL">X veces por semana</option><option value="DIAS_ESPECIFICOS">Días específicos</option></select>
          </label>
          <label id="campoVeces" hidden>Veces por semana<input type="number" name="vecesPorSemana" min="1" max="7" value="3"></label>
          <label>Fecha de inicio<input type="date" name="fechaInicio" value="${esc($('#fechaSimulada').value || estado.info.hoyReal)}"></label>
          <label>Fecha de fin (opcional)<input type="date" name="fechaFin"></label>
        </div>
        <div id="campoDias" hidden style="margin-top:12px"><span class="suave">Días:</span>
          <div class="fila">${[1, 2, 3, 4, 5, 6, 7].map((d) => `<label class="linea"><input type="checkbox" name="dia" value="${d}"> ${DIAS[d]}</label>`).join('')}</div>
        </div>
        <div id="campoParticipantes" hidden style="margin-top:12px"><span class="suave">¿A quién se le pone el reto? (sin marcar = todo el grupo)</span>
          <div class="fila" id="listaParticipantes"></div>
        </div>
        <h3 style="margin-top:18px">Puntos</h3>
        <div class="rejilla-form">
          <label>Puntos al cumplir<input type="number" name="puntosPorCumplimiento" value="10" min="0"></label>
          <label>Puntos que se restan al fallar<input type="number" name="puntosPorIncumplimiento" value="5" min="0"></label>
          <label>Bono cada N de racha (opcional)<input type="number" name="bonoRachaCada" min="1" placeholder="7"></label>
          <label>Puntos del bono<input type="number" name="bonoRachaPuntos" value="0" min="0"></label>
        </div>
        <h3 style="margin-top:18px">Reglas</h3>
        <div class="rejilla-form">
          <label>Días de gracia para registrar<input type="number" name="diasGraciaRegistro" value="0" min="0" max="7"></label>
          <label>% mínimo para no recibir castigo<input type="number" name="porcentajeMinimoCumplimiento" value="100" min="1" max="100"></label>
          <label class="linea"><input type="checkbox" name="requiereEvidencia"> Exigir foto de evidencia</label>
          <label class="linea" id="campoAprob" hidden><input type="checkbox" name="requiereAprobacion"> Requiere aprobación del admin/creador</label>
          <label class="linea"><input type="checkbox" name="permiteAbandono" checked> Se puede abandonar</label>
        </div>
        <h3 style="margin-top:18px">Castigo (opcional)</h3>
        <div class="rejilla-form">
          <label>Descripción<input name="castigoDescripcion" placeholder="Invitar el café"></label>
          <label>Puntos que resta<input type="number" name="castigoPuntos" value="0" min="0"></label>
          <label>Cuándo se evalúa
            <select name="castigoPeriodo"><option value="">Sin castigo</option><option value="SEMANAL">Cada semana</option><option value="AL_FINALIZAR">Al finalizar el reto</option></select>
          </label>
        </div>
        <div class="fila" style="margin-top:16px"><button type="submit">Crear reto</button></div>
      </form>`;

    const f = $('#formReto');
    const actualizar = () => {
      const grupal = f.tipo.value === 'GRUPAL';
      $('#campoGrupo').hidden = !grupal;
      $('#campoAprob').hidden = !grupal;
      $('#campoParticipantes').hidden = !grupal;
      $('#campoVeces').hidden = f.frecuencia.value !== 'SEMANAL';
      $('#campoDias').hidden = f.frecuencia.value !== 'DIAS_ESPECIFICOS';
      const g = grupos.find((x) => x.id === f.grupoId.value);
      $('#listaParticipantes').innerHTML = (g?.miembros ?? [])
        .map((m) => `<label class="linea"><input type="checkbox" name="participante" value="${m.usuario.id}"> ${esc(m.usuario.nombre)}</label>`).join('');
    };
    f.onchange = (e) => { if (['tipo', 'frecuencia', 'grupoId'].includes(e.target.name)) actualizar(); };
    actualizar();

    f.onsubmit = async (e) => {
      e.preventDefault();
      const num = (n) => (f[n].value === '' ? null : Number(f[n].value));
      const datos = {
        tipo: f.tipo.value,
        grupoId: f.tipo.value === 'GRUPAL' ? f.grupoId.value : undefined,
        participantes: [...f.querySelectorAll('[name=participante]:checked')].map((c) => c.value),
        nombre: f.nombre.value,
        meta: f.meta.value,
        frecuencia: f.frecuencia.value,
        vecesPorSemana: f.frecuencia.value === 'SEMANAL' ? num('vecesPorSemana') : undefined,
        diasSemana: [...f.querySelectorAll('[name=dia]:checked')].map((c) => Number(c.value)),
        fechaInicio: f.fechaInicio.value || undefined,
        fechaFin: f.fechaFin.value || null,
        puntosPorCumplimiento: num('puntosPorCumplimiento'),
        puntosPorIncumplimiento: num('puntosPorIncumplimiento'),
        bonoRachaCada: num('bonoRachaCada'),
        bonoRachaPuntos: num('bonoRachaPuntos') ?? 0,
        diasGraciaRegistro: num('diasGraciaRegistro'),
        porcentajeMinimoCumplimiento: num('porcentajeMinimoCumplimiento'),
        requiereEvidencia: f.requiereEvidencia.checked,
        requiereAprobacion: f.tipo.value === 'GRUPAL' && f.requiereAprobacion.checked,
        permiteAbandono: f.permiteAbandono.checked,
        castigo: f.castigoPeriodo.value
          ? { periodo: f.castigoPeriodo.value, descripcion: f.castigoDescripcion.value || null, puntos: num('castigoPuntos') ?? 0 }
          : null,
      };
      const r = await accion(() => api('POST', '/api/retos', datos), (x) => `Reto "${x.nombre}" creado con ${x.participantes.length} participante(s)`);
      if (r) mostrar('detalle', r.id);
    };
  },

  // ----- Grupos -------------------------------------------------------------
  async grupos() {
    const grupos = await api('GET', '/api/grupos');
    const rankings = await Promise.all(grupos.map((g) => api('GET', `/api/grupos/${g.id}/ranking`)));
    const retosGrupo = await Promise.all(grupos.map((g) => api('GET', `/api/grupos/${g.id}/retos`)));
    vista.innerHTML = `
      <h2>Mis grupos</h2>
      ${grupos.map((g, i) => {
        const ids = new Set(g.miembros.map((m) => m.usuarioId));
        const fuera = estado.usuarios.filter((u) => !ids.has(u.id));
        return `
        <div class="tarjeta">
          <div class="fila entre"><h3>${esc(g.nombre)} <span class="suave">· ${g.miembros.length} integrantes</span></h3>
            <span class="suave">Código de invitación: <b>${esc(g.codigoInvitacion)}</b></span></div>
          <div class="dos">
            <div>
              <h3>Ranking del grupo</h3>
              <table><tr><th>#</th><th>Nombre</th><th>Rol</th><th>Puntos</th></tr>
              ${rankings[i].map((f) => `<tr><td>${f.posicion}</td><td>${esc(f.usuario.nombre)}</td><td>${chip(f.rol)}</td><td>${f.puntos}</td></tr>`).join('')}</table>
              ${fuera.length ? `<div class="fila" style="margin-top:10px"><select data-agregar-sel="${g.id}" style="width:auto">${fuera.map((u) => `<option value="${u.id}">${esc(u.nombre)}</option>`).join('')}</select><button class="sec" data-agregar="${g.id}">Agregar al grupo</button></div>` : ''}
            </div>
            <div>
              <h3>Retos del grupo</h3>
              ${retosGrupo[i].length ? retosGrupo[i].map((r) => `<div class="item fila entre"><div><h4>${esc(r.nombre)}</h4><span class="suave">${frecuenciaTexto(r)} · ${r._count.participantes} participantes</span></div><button class="sec" data-ver="${r.id}">Ver</button></div>`).join('') : '<p class="suave">Sin retos activos.</p>'}
            </div>
          </div>
        </div>`;
      }).join('') || '<p class="vacio-msg">No perteneces a ningún grupo.</p>'}
      <form class="tarjeta" id="formGrupo">
        <h3>Crear grupo</h3>
        <div class="rejilla-form">
          <label>Nombre<input name="nombre" placeholder="Study buddies"></label>
          <label class="linea"><input type="checkbox" name="soloAdmins"> Solo los admins crean retos</label>
        </div>
        <p class="suave">Integrantes (tú quedas como administrador):</p>
        <div class="fila">${estado.usuarios.filter((u) => u.id !== estado.usuarioId).map((u) => `<label class="linea"><input type="checkbox" name="miembro" value="${u.id}"> ${esc(u.nombre)}</label>`).join('')}</div>
        <div class="fila" style="margin-top:12px"><button type="submit">Crear grupo</button></div>
      </form>`;
    activarVer();
    vista.querySelectorAll('[data-agregar]').forEach((b) => (b.onclick = () => {
      const usuarioId = vista.querySelector(`[data-agregar-sel="${b.dataset.agregar}"]`).value;
      accion(() => api('POST', `/api/grupos/${b.dataset.agregar}/miembros`, { usuarioId }), 'Integrante agregado');
    }));
    $('#formGrupo').onsubmit = (e) => {
      e.preventDefault();
      const f = e.target;
      accion(() => api('POST', '/api/grupos', {
        nombre: f.nombre.value,
        soloAdminsCreanRetos: f.soloAdmins.checked,
        miembros: [...f.querySelectorAll('[name=miembro]:checked')].map((c) => c.value),
      }), 'Grupo creado');
    };
  },

  // ----- Revisar evidencias -------------------------------------------------
  async revisar() {
    const pendientes = await api('GET', '/api/pendientes');
    vista.innerHTML = `
      <h2>Cumplimientos por aprobar</h2>
      <p class="suave">Aparecen los registros de retos con "requiere aprobación" que tú puedes revisar (eres el creador del reto o admin del grupo). Nadie revisa sus propios registros.</p>
      ${pendientes.map((r) => `
        <div class="tarjeta">
          <div class="fila entre">
            <div><h3>${esc(r.participante.usuario.nombre)} · ${esc(r.participante.reto.nombre)}</h3>
            <span class="suave">Día ${dia(r.fecha)} · registrado ${hora(r.registradoEn)} ${r.nota ? `· “${esc(r.nota)}”` : ''}</span></div>
            <div class="fila">
              <input placeholder="Motivo si rechazas" data-motivo="${r.id}" style="width:auto">
              <button class="ok" data-aprobar="${r.id}">Aprobar</button>
              <button class="no" data-rechazar="${r.id}">Rechazar</button>
            </div>
          </div>
          <div class="galeria" style="margin-top:10px">${r.evidencias.map((e) => `<a href="${esc(e.url)}" target="_blank"><img src="${esc(e.url)}" alt="evidencia"></a>`).join('')}</div>
        </div>`).join('') || '<p class="vacio-msg">No hay nada pendiente de revisar.</p>'}`;
    vista.querySelectorAll('[data-aprobar]').forEach((b) => (b.onclick = () =>
      accion(() => api('POST', `/api/registros/${b.dataset.aprobar}/revision`, { aprobar: true }), 'Aprobado: se sumaron los puntos')));
    vista.querySelectorAll('[data-rechazar]').forEach((b) => (b.onclick = () =>
      accion(() => api('POST', `/api/registros/${b.dataset.rechazar}/revision`, { aprobar: false, motivo: vista.querySelector(`[data-motivo="${b.dataset.rechazar}"]`).value }), 'Rechazado: cuenta como incumplimiento')));
  },

  // ----- Calendario ---------------------------------------------------------
  async calendario() {
    const hoy = $('#fechaSimulada').value || estado.info.hoyReal;
    estado.calendario ??= { anio: Number(hoy.slice(0, 4)), mes: Number(hoy.slice(5, 7)) };
    const { anio, mes } = estado.calendario;
    const cal = await api('GET', `/api/calendario?anio=${anio}&mes=${mes}`);
    const primero = new Date(`${cal.dias[0].fecha}T12:00:00Z`).getUTCDay() || 7;
    const nombreMes = new Date(Date.UTC(anio, mes - 1, 15)).toLocaleString('es', { month: 'long', year: 'numeric' });
    vista.innerHTML = `
      <h2>Calendario</h2>
      <div class="tarjeta">
        <div class="fila entre" style="margin-bottom:12px">
          <button class="sec" id="mesAnt">‹</button><h3 style="margin:0;text-transform:capitalize">${nombreMes}</h3><button class="sec" id="mesSig">›</button>
        </div>
        <div class="calendario">
          ${DIAS.slice(1).map((d) => `<div class="cab">${d}</div>`).join('')}
          ${'<div class="dia vacio"></div>'.repeat(primero - 1)}
          ${cal.dias.map((d) => `<button class="dia ${d.conRegistro ? 'con' : ''} ${d.fecha === hoy ? 'hoy' : ''}" data-dia="${d.fecha}">
            ${Number(d.fecha.slice(8))}<small>${d.retos.length ? `${d.completados}/${d.retos.length}` : ''}</small></button>`).join('')}
        </div>
        <p class="suave">Morado: con registro · número pequeño: completados / programados · borde ámbar: fecha simulada</p>
      </div>
      <div class="tarjeta" id="detalleDia"><p class="suave">Selecciona un día.</p></div>`;
    const mover = (n) => {
      let m = mes + n, a = anio;
      if (m < 1) { m = 12; a--; } if (m > 12) { m = 1; a++; }
      estado.calendario = { anio: a, mes: m };
      mostrar('calendario');
    };
    $('#mesAnt').onclick = () => mover(-1);
    $('#mesSig').onclick = () => mover(1);
    vista.querySelectorAll('[data-dia]').forEach((b) => (b.onclick = () => {
      const d = cal.dias.find((x) => x.fecha === b.dataset.dia);
      $('#detalleDia').innerHTML = `<h3>${d.fecha} · hábitos del día</h3>` + (d.retos.length
        ? `<table><tr><th>Reto</th><th>Resultado</th><th>Estado</th><th>Registrado</th></tr>${d.retos.map((r) => `<tr><td>${esc(r.nombre)}</td><td>${r.cumplido === null ? 'Sin registro' : r.cumplido ? '✅' : '❌'}</td><td>${r.estado ? chip(r.estado) : ''}</td><td>${hora(r.registradoEn)}</td></tr>`).join('')}</table>`
        : '<p class="suave">Nada programado.</p>');
    }));
  },

  // ----- Puntos -------------------------------------------------------------
  async puntos() {
    const movs = await api('GET', '/api/movimientos');
    vista.innerHTML = `
      <h2>Historial de puntos</h2>
      <div class="tarjeta tabla">
        <table><tr><th>Cuándo</th><th>Tipo</th><th>Puntos</th><th>Detalle</th></tr>
        ${movs.map((m) => `<tr><td>${hora(m.creadoEn)}</td><td>${chip(m.tipo)}</td><td>${signo(m.puntos)}</td><td>${esc(m.descripcion)}</td></tr>`).join('') || '<tr><td colspan="4" class="vacio-msg">Sin movimientos.</td></tr>'}
        </table>
      </div>`;
  },

  // ----- Herramientas -------------------------------------------------------
  async herramientas() {
    vista.innerHTML = `
      <h2>Herramientas de prueba</h2>
      <div class="dos">
        <form class="tarjeta" id="formUsuario">
          <h3>Crear usuario</h3>
          <div class="rejilla-form">
            <label>Nombre<input name="nombre" placeholder="María"></label>
            <label>Correo<input name="correo" placeholder="maria@ejemplo.com"></label>
          </div>
          <p class="suave">Prueba repetir un correo (RN-01) o usar mayúsculas: la base de datos lo valida.</p>
          <button type="submit">Crear</button>
        </form>
        <div class="tarjeta">
          <h3>Procesos automáticos</h3>
          <p class="suave">El cierre marca los días sin registro, aplica castigos, recalcula rachas y finaliza retos. Usa la fecha simulada de arriba.</p>
          <div class="fila">
            <button id="btnCierre">Ejecutar cierre ahora</button>
            <button class="sec" id="btnIntegridad">Verificar integridad de puntos</button>
          </div>
        </div>
        <div class="tarjeta">
          <h3>Reiniciar datos</h3>
          <p class="suave">Borra todo y vuelve a cargar los datos demo (6 usuarios, grupo "Compu squad", 4 retos con 14 días de historial).</p>
          <button class="peligro" id="btnReiniciar">Reiniciar datos demo</button>
        </div>
        <div class="tarjeta">
          <h3>Ideas para probar</h3>
          <ul class="suave">
            <li>Crea un reto diario, márcalo y usa <b>+1 día y cierre</b> sin marcarlo: la racha se rompe y se restan puntos.</li>
            <li>Pausa un reto y avanza varios días: la racha se congela.</li>
            <li>Crea un reto grupal con castigo semanal y avanza 7 días.</li>
            <li>Activa "requiere aprobación", registra como un usuario y aprueba como otro.</li>
            <li>Intenta registrar un día futuro o crear un reto con fin antes del inicio.</li>
          </ul>
        </div>
      </div>`;
    $('#formUsuario').onsubmit = (e) => {
      e.preventDefault();
      accion(() => api('POST', '/api/usuarios', { nombre: e.target.nombre.value, correo: e.target.correo.value }), 'Usuario creado');
    };
    $('#btnCierre').onclick = () => accion(() => api('POST', '/api/cierre'), (r) =>
      `Cierre: ${r.participantesProcesados} participantes, ${r.incumplimientosAutomaticos} incumplimientos, ${r.castigosAplicados} castigos, ${r.retosFinalizados} finalizados`);
    $('#btnIntegridad').onclick = () => accion(() => api('GET', '/api/integridad'), (d) =>
      d.length ? `Hay ${d.length} diferencias entre cachés y movimientos` : 'Todo cuadra: las cachés coinciden con el libro de puntos ✔');
    $('#btnReiniciar').onclick = () => confirm('¿Borrar todos los datos y recargar los demo?') &&
      accion(async () => {
        aviso('Reiniciando… (tarda unos segundos)');
        $('#fechaSimulada').value = estado.info.hoyReal;
        guardar('steply-fecha', '');
        await api('POST', '/api/reiniciar');
      }, 'Datos demo cargados');
  },
};

// ---------------------------------------------------------------------------
//  Piezas reutilizables
// ---------------------------------------------------------------------------

function tarjetaHoy(h) {
  const r = h.reto;
  const semanal = r.frecuencia === 'SEMANAL' ? ` · semana ${h.semana.cumplidos}/${h.semana.requeridos}` : '';
  const puedeRegistrar = ['PENDIENTE', 'NO_COMPLETADO', 'COMPLETADO'].includes(h.estadoHoy) ||
    (r.frecuencia === 'SEMANAL' && h.estadoHoy !== 'PAUSADO');
  return `
    <div class="item">
      <div class="fila entre">
        <div>
          <h4>${esc(r.nombre)} ${chip(h.estadoHoy)}</h4>
          <div class="suave">${r.grupo ? esc(r.grupo.nombre) : 'Personal'} · ${frecuenciaTexto(r)}${semanal} · racha ${h.rachaActual} · ${h.puntos} pts${r.meta ? ` · meta: ${esc(r.meta)}` : ''}</div>
        </div>
        <button class="sec" data-ver="${r.id}">Ver</button>
      </div>
      ${puedeRegistrar && h.estadoHoy !== 'PENDIENTE_APROBACION' ? formRegistro(r.id, false, r.requiereEvidencia) : ''}
    </div>`;
}

function formRegistro(retoId, conFecha, exigeFoto = false) {
  return `
    <div class="fila" style="margin-top:8px" data-registro="${retoId}">
      ${conFecha ? '<input type="date" data-campo="fecha" style="width:auto" title="Día a registrar (vacío = hoy)">' : ''}
      <input data-campo="nota" placeholder="Nota (opcional)" style="width:auto;flex:1;min-width:120px">
      <label class="linea" title="Sube una foto o, si no eliges archivo, se usa una imagen de ejemplo">
        <input type="checkbox" data-campo="conFoto" ${exigeFoto ? 'checked' : ''}> foto
      </label>
      <input type="file" accept="image/*" data-campo="archivo" style="width:auto;max-width:190px">
      <button class="ok" data-si>Sí, lo completé</button>
      <button class="no" data-no>No lo completé</button>
    </div>`;
}

function activarRegistro() {
  activarVer();
  vista.querySelectorAll('[data-registro]').forEach((caja) => {
    const retoId = caja.dataset.registro;
    const campo = (n) => caja.querySelector(`[data-campo="${n}"]`);
    const enviar = async (cumplido) => {
      let foto = null;
      const archivo = campo('archivo')?.files?.[0];
      if (cumplido && (campo('conFoto')?.checked || archivo)) {
        foto = archivo ? { dataUrl: await new Promise((ok) => { const fr = new FileReader(); fr.onload = () => ok(fr.result); fr.readAsDataURL(archivo); }) } : {};
      }
      accion(() => api('POST', `/api/retos/${retoId}/registros`, {
        cumplido, nota: campo('nota')?.value, fecha: campo('fecha')?.value || undefined, foto,
      }), (r) => {
        const p = r.puntosRegistro;
        const pend = r.registro.estado === 'PENDIENTE' ? ' · pendiente de aprobación' : '';
        return `${cumplido ? '¡Bien!' : 'Registrado.'} ${p > 0 ? `+${p}` : p} pts · racha ${r.participante.rachaActual}${pend}`;
      });
    };
    caja.querySelector('[data-si]').onclick = () => enviar(true);
    caja.querySelector('[data-no]').onclick = () => enviar(false);
  });
}

function activarVer() {
  vista.querySelectorAll('[data-ver]').forEach((b) => (b.onclick = () => mostrar('detalle', b.dataset.ver)));
}

// ---------------------------------------------------------------------------
//  Arranque
// ---------------------------------------------------------------------------

(async () => {
  estado.info = await api('GET', '/api/info');
  estado.usuarioId = leer('steply-usuario');
  $('#fechaSimulada').value = leer('steply-fecha') || estado.info.hoyReal;
  await cargarUsuarios();
  mostrar('inicio');
})();
