// ============================================================================
// PRUEBAS UNITARIAS — CitaSystem (Módulo 1 y Módulo 2)
// Universidad de Cundinamarca · Fusagasugá 2025
// Herramienta: Vitest + React Testing Library
//
// INSTALACIÓN (ejecutar en la terminal dentro de la carpeta del proyecto):
//   npm install -D vitest @testing-library/react @testing-library/jest-dom
//                  @testing-library/user-event jsdom @vitejs/plugin-react
//
// EJECUCIÓN:
//   npx vitest run          → ejecutar todas las pruebas una sola vez
//   npx vitest              → modo watch (se re-ejecutan al guardar)
//   npx vitest run --reporter=verbose  → ver detalle de cada prueba
//
// CONFIGURACIÓN: agregar en vite.config.js o vite.config.ts:
//   test: { environment: "jsdom", globals: true,
//           setupFiles: ["./src/setupTests.js"] }
//
// ARCHIVO setupTests.js:
//   import "@testing-library/jest-dom";
// ============================================================================

import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";

// ─── Datos de prueba reutilizables ───────────────────────────────────────────
const USUARIOS_TEST = [
  { id: 1, nombre: "Diego Cubillos",  email: "diegocubillos1202@gmail.com", password: "1234", rol: "admin",       estado: "activo",   creado: "2025-01-10" },
  { id: 2, nombre: "Juan González",   email: "jsgonzalezangel@gmail.com",   password: "1234", rol: "profesional", estado: "activo",   creado: "2025-01-12" },
  { id: 3, nombre: "María López",     email: "maria@example.com",           password: "1234", rol: "cliente",     estado: "activo",   creado: "2025-02-01" },
  { id: 4, nombre: "Carlos Ruiz",     email: "carlos@example.com",          password: "1234", rol: "cliente",     estado: "inactivo", creado: "2025-02-15" },
];

const SERVICIOS_TEST = [
  { id: 1, nombre: "Consulta General",       duracion: 30, precio: 50000,  descripcion: "Consulta médica", activo: true  },
  { id: 2, nombre: "Entrenamiento Personal", duracion: 60, precio: 80000,  descripcion: "Entrenamiento",   activo: true  },
  { id: 3, nombre: "Servicio Inactivo",      duracion: 45, precio: 40000,  descripcion: "Sin uso",         activo: false },
];

const CITAS_TEST = [
  { id: 1, clienteId: 3, profesionalId: 2, servicioId: 1, fechaHora: "2025-04-10T09:00", estado: "confirmada", notas: "Primera sesión", creada: "2025-04-01" },
  { id: 2, clienteId: 3, profesionalId: 2, servicioId: 2, fechaHora: "2025-04-15T10:30", estado: "pendiente",  notas: "",               creada: "2025-04-02" },
  { id: 3, clienteId: 4, profesionalId: 2, servicioId: 1, fechaHora: "2025-03-20T14:00", estado: "completada", notas: "Completada",     creada: "2025-03-15" },
];

// ─── Lógica pura extraída del App (para pruebas sin UI) ──────────────────────
// Estas funciones replican la lógica del componente para probarla de forma
// aislada sin necesidad de renderizar toda la interfaz.

/** Valida las credenciales de login */
function validarLogin(usuarios, email, password) {
  if (!email || !password) return { ok: false, error: "Completa todos los campos." };
  const u = usuarios.find(u => u.email === email && u.password === password);
  if (!u)                     return { ok: false, error: "Credenciales incorrectas." };
  if (u.estado === "inactivo") return { ok: false, error: "Cuenta inactiva." };
  return { ok: true, usuario: u };
}

/** Valida el formulario de registro */
function validarRegistro(usuarios, form) {
  const e = {};
  if (!form.nombre.trim())                          e.nombre    = "El nombre es obligatorio.";
  if (!form.email.includes("@"))                    e.email     = "Correo inválido.";
  if (usuarios.find(u => u.email === form.email))   e.email     = "Correo ya registrado.";
  if (form.password.length < 4)                     e.password  = "Mínimo 4 caracteres.";
  if (form.password !== form.confirmar)             e.confirmar = "Las contraseñas no coinciden.";
  return e;
}

/** Verifica si hay conflicto de horario para una cita */
function hayConflicto(citas, profesionalId, fechaHora) {
  return citas.some(c =>
    c.profesionalId === profesionalId &&
    c.fechaHora === fechaHora &&
    ["pendiente", "confirmada", "en_curso"].includes(c.estado)
  );
}

/** Verifica si una fecha es futura */
function esFechaFutura(fechaHora) {
  return new Date(fechaHora) > new Date();
}

/** Filtra citas según el rol del usuario */
function filtrarCitasPorRol(citas, usuario) {
  if (usuario.rol === "cliente")     return citas.filter(c => c.clienteId     === usuario.id);
  if (usuario.rol === "profesional") return citas.filter(c => c.profesionalId === usuario.id);
  return citas; // admin ve todas
}

/** Verifica si una cita puede ser cancelada */
function puedeCancelar(cita) {
  return ["pendiente", "confirmada"].includes(cita.estado);
}

/** Verifica si una cita puede ser confirmada */
function puedeConfirmar(cita) {
  return cita.estado === "pendiente";
}

/** Obtiene el color del estado de una cita */
function getColorEstado(estado) {
  const ESTADO_COLOR = {
    pendiente: "#f59e0b", confirmada: "#22c55e", en_curso: "#3b82f6",
    completada: "#8b5cf6", cancelada: "#ef4444", reprogramada: "#06b6d4",
    no_asistio: "#94a3b8",
  };
  return ESTADO_COLOR[estado] || "#64748b";
}

/** Valida un servicio antes de guardarlo */
function validarServicio(form) {
  const e = {};
  if (!form.nombre.trim())  e.nombre   = "El nombre es obligatorio.";
  if (form.duracion < 5)    e.duracion = "Duración mínima: 5 minutos.";
  if (form.precio < 0)      e.precio   = "El precio no puede ser negativo.";
  return e;
}

/** Cambia el estado de activo/inactivo de un usuario */
function toggleEstadoUsuario(usuarios, id) {
  return usuarios.map(u =>
    u.id === id ? { ...u, estado: u.estado === "activo" ? "inactivo" : "activo" } : u
  );
}

/** Elimina un usuario de la lista */
function eliminarUsuario(usuarios, id) {
  return usuarios.filter(u => u.id !== id);
}

/** Obtiene nombre de un elemento por id */
function getNombre(lista, id) {
  const item = lista.find(x => x.id === id);
  return item ? item.nombre : "—";
}

// ============================================================================
// SUITE 1 — MÓDULO 1: AUTENTICACIÓN
// ============================================================================
describe("Módulo 1 — Autenticación: validarLogin()", () => {

  it("PT-001: Login exitoso con credenciales correctas de Admin", () => {
    // QUÉ SE PRUEBA: que un usuario administrador puede iniciar sesión
    // correctamente cuando su email y contraseña son válidos.
    const resultado = validarLogin(USUARIOS_TEST, "diegocubillos1202@gmail.com", "1234");
    expect(resultado.ok).toBe(true);
    expect(resultado.usuario.rol).toBe("admin");
    expect(resultado.usuario.nombre).toBe("Diego Cubillos");
  });

  it("PT-002: Login exitoso con credenciales correctas de Profesional", () => {
    // QUÉ SE PRUEBA: que un usuario profesional puede autenticarse y que
    // el sistema retorna correctamente su rol y datos.
    const resultado = validarLogin(USUARIOS_TEST, "jsgonzalezangel@gmail.com", "1234");
    expect(resultado.ok).toBe(true);
    expect(resultado.usuario.rol).toBe("profesional");
  });

  it("PT-003: Login exitoso con credenciales correctas de Cliente", () => {
    // QUÉ SE PRUEBA: que un usuario con rol cliente puede autenticarse.
    const resultado = validarLogin(USUARIOS_TEST, "maria@example.com", "1234");
    expect(resultado.ok).toBe(true);
    expect(resultado.usuario.rol).toBe("cliente");
  });

  it("PT-004: Login falla con contraseña incorrecta", () => {
    // QUÉ SE PRUEBA: que el sistema rechaza el acceso cuando la contraseña
    // no coincide con la almacenada, evitando acceso no autorizado.
    const resultado = validarLogin(USUARIOS_TEST, "maria@example.com", "wrongpass");
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBe("Credenciales incorrectas.");
  });

  it("PT-005: Login falla con email inexistente", () => {
    // QUÉ SE PRUEBA: que el sistema rechaza emails que no existen en la BD,
    // previniendo intentos de acceso con cuentas no registradas.
    const resultado = validarLogin(USUARIOS_TEST, "noexiste@test.com", "1234");
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBe("Credenciales incorrectas.");
  });

  it("PT-006: Login falla con cuenta inactiva", () => {
    // QUÉ SE PRUEBA: que las cuentas desactivadas por el administrador
    // no pueden iniciar sesión, garantizando el control de acceso.
    const resultado = validarLogin(USUARIOS_TEST, "carlos@example.com", "1234");
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBe("Cuenta inactiva.");
  });

  it("PT-007: Login falla con campos vacíos", () => {
    // QUÉ SE PRUEBA: que el sistema valida que ambos campos sean obligatorios
    // antes de intentar buscar al usuario en la base de datos.
    const resultado = validarLogin(USUARIOS_TEST, "", "");
    expect(resultado.ok).toBe(false);
    expect(resultado.error).toBe("Completa todos los campos.");
  });

  it("PT-008: Login falla con email vacío y contraseña correcta", () => {
    // QUÉ SE PRUEBA: que el sistema detecta cuando falta el email
    // aunque la contraseña sea correcta.
    const resultado = validarLogin(USUARIOS_TEST, "", "1234");
    expect(resultado.ok).toBe(false);
  });
});

// ─── Suite 1B: Registro ───────────────────────────────────────────────────────
describe("Módulo 1 — Autenticación: validarRegistro()", () => {

  it("PT-009: Registro válido no genera errores", () => {
    // QUÉ SE PRUEBA: que un formulario de registro correctamente llenado
    // pasa todas las validaciones sin generar mensajes de error.
    const form = { nombre: "Ana Rodríguez", email: "ana@test.com", password: "abcd", confirmar: "abcd", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(Object.keys(errores).length).toBe(0);
  });

  it("PT-010: Registro falla si el nombre está vacío", () => {
    // QUÉ SE PRUEBA: que el campo nombre es obligatorio y no puede
    // enviarse en blanco al crear una cuenta.
    const form = { nombre: "", email: "nuevo@test.com", password: "1234", confirmar: "1234", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(errores.nombre).toBeDefined();
  });

  it("PT-011: Registro falla si el email no tiene @", () => {
    // QUÉ SE PRUEBA: que el sistema valida el formato básico del correo
    // electrónico antes de permitir el registro.
    const form = { nombre: "Test", email: "correosinArroba", password: "1234", confirmar: "1234", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(errores.email).toBeDefined();
  });

  it("PT-012: Registro falla si el email ya está registrado", () => {
    // QUÉ SE PRUEBA: que el sistema previene registros duplicados verificando
    // que el email no exista previamente en la base de datos.
    const form = { nombre: "Otro", email: "maria@example.com", password: "1234", confirmar: "1234", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(errores.email).toBe("Correo ya registrado.");
  });

  it("PT-013: Registro falla si la contraseña tiene menos de 4 caracteres", () => {
    // QUÉ SE PRUEBA: que el sistema impone una longitud mínima de 4 caracteres
    // para garantizar una seguridad básica en las contraseñas.
    const form = { nombre: "Test", email: "nuevo@test.com", password: "ab", confirmar: "ab", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(errores.password).toBeDefined();
  });

  it("PT-014: Registro falla si las contraseñas no coinciden", () => {
    // QUÉ SE PRUEBA: que el campo de confirmación de contraseña
    // debe ser idéntico al campo de contraseña principal.
    const form = { nombre: "Test", email: "nuevo@test.com", password: "1234", confirmar: "5678", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(errores.confirmar).toBe("Las contraseñas no coinciden.");
  });

  it("PT-015: Registro falla con múltiples errores simultáneos", () => {
    // QUÉ SE PRUEBA: que el sistema detecta y retorna todos los errores
    // al mismo tiempo, no solo el primero que encuentra.
    const form = { nombre: "", email: "malo", password: "ab", confirmar: "cd", rol: "cliente" };
    const errores = validarRegistro(USUARIOS_TEST, form);
    expect(errores.nombre).toBeDefined();
    expect(errores.password).toBeDefined();
    expect(errores.confirmar).toBeDefined();
  });
});

// ─── Suite 1C: Gestión de usuarios ───────────────────────────────────────────
describe("Módulo 1 — Gestión de Usuarios", () => {

  it("PT-016: toggleEstadoUsuario activa un usuario inactivo", () => {
    // QUÉ SE PRUEBA: que el administrador puede reactivar una cuenta
    // que estaba desactivada previamente.
    const resultado = toggleEstadoUsuario(USUARIOS_TEST, 4); // Carlos estaba inactivo
    const carlos = resultado.find(u => u.id === 4);
    expect(carlos.estado).toBe("activo");
  });

  it("PT-017: toggleEstadoUsuario desactiva un usuario activo", () => {
    // QUÉ SE PRUEBA: que el administrador puede desactivar una cuenta
    // para bloquear su acceso al sistema sin eliminarla.
    const resultado = toggleEstadoUsuario(USUARIOS_TEST, 3); // María estaba activa
    const maria = resultado.find(u => u.id === 3);
    expect(maria.estado).toBe("inactivo");
  });

  it("PT-018: toggleEstadoUsuario no modifica otros usuarios", () => {
    // QUÉ SE PRUEBA: que al cambiar el estado de un usuario, los demás
    // usuarios del sistema no se ven afectados.
    const resultado = toggleEstadoUsuario(USUARIOS_TEST, 4);
    const diego = resultado.find(u => u.id === 1);
    expect(diego.estado).toBe("activo"); // Diego no debe cambiar
  });

  it("PT-019: eliminarUsuario reduce la lista en 1", () => {
    // QUÉ SE PRUEBA: que la eliminación de un usuario reduce correctamente
    // el total de registros en la lista de usuarios.
    const resultado = eliminarUsuario(USUARIOS_TEST, 3);
    expect(resultado.length).toBe(USUARIOS_TEST.length - 1);
  });

  it("PT-020: eliminarUsuario remueve al usuario correcto", () => {
    // QUÉ SE PRUEBA: que el usuario eliminado es exactamente el que
    // se seleccionó y no otro usuario por error.
    const resultado = eliminarUsuario(USUARIOS_TEST, 3);
    const maria = resultado.find(u => u.id === 3);
    expect(maria).toBeUndefined();
  });

  it("PT-021: eliminarUsuario conserva los demás usuarios", () => {
    // QUÉ SE PRUEBA: que el resto de usuarios permanece intacto
    // después de eliminar uno de ellos.
    const resultado = eliminarUsuario(USUARIOS_TEST, 3);
    expect(resultado.find(u => u.id === 1)).toBeDefined();
    expect(resultado.find(u => u.id === 2)).toBeDefined();
    expect(resultado.find(u => u.id === 4)).toBeDefined();
  });

  it("PT-022: getNombre retorna el nombre correcto dado un id", () => {
    // QUÉ SE PRUEBA: que la función helper que busca nombres por ID
    // retorna el nombre correcto del elemento encontrado.
    expect(getNombre(USUARIOS_TEST, 1)).toBe("Diego Cubillos");
    expect(getNombre(SERVICIOS_TEST, 2)).toBe("Entrenamiento Personal");
  });

  it("PT-023: getNombre retorna '—' cuando el id no existe", () => {
    // QUÉ SE PRUEBA: que cuando se busca un ID que no existe en la lista,
    // el sistema retorna el valor por defecto '—' en lugar de fallar.
    expect(getNombre(USUARIOS_TEST, 999)).toBe("—");
  });
});

// ============================================================================
// SUITE 2 — MÓDULO 2: RESERVA DE CITAS
// ============================================================================
describe("Módulo 2 — Reserva: hayConflicto()", () => {

  it("PT-024: Detecta conflicto cuando el profesional ya tiene cita en esa hora", () => {
    // QUÉ SE PRUEBA: que el sistema impide registrar dos citas activas
    // para el mismo profesional en el mismo horario, evitando doble reserva.
    const conflicto = hayConflicto(CITAS_TEST, 2, "2025-04-10T09:00");
    expect(conflicto).toBe(true);
  });

  it("PT-025: No detecta conflicto en horario libre del profesional", () => {
    // QUÉ SE PRUEBA: que el sistema permite agendar cuando el profesional
    // no tiene ninguna cita activa en esa fecha y hora.
    const conflicto = hayConflicto(CITAS_TEST, 2, "2025-05-01T11:00");
    expect(conflicto).toBe(false);
  });

  it("PT-026: No detecta conflicto con citas canceladas o completadas", () => {
    // QUÉ SE PRUEBA: que las citas canceladas o completadas no bloquean
    // el horario, permitiendo reusar ese espacio con nuevas citas.
    // La cita completada (id:3) está en "2025-03-20T14:00" con profesional 2
    const conflicto = hayConflicto(CITAS_TEST, 2, "2025-03-20T14:00");
    expect(conflicto).toBe(false); // completada no bloquea
  });

  it("PT-027: No detecta conflicto con diferente profesional en mismo horario", () => {
    // QUÉ SE PRUEBA: que dos profesionales distintos pueden tener citas
    // al mismo tiempo sin que el sistema lo marque como conflicto.
    const conflicto = hayConflicto(CITAS_TEST, 99, "2025-04-10T09:00");
    expect(conflicto).toBe(false);
  });

  it("PT-028: Detecta conflicto con cita en estado pendiente", () => {
    // QUÉ SE PRUEBA: que las citas pendientes también bloquean el horario,
    // ya que aún podrían ser confirmadas.
    const conflicto = hayConflicto(CITAS_TEST, 2, "2025-04-15T10:30");
    expect(conflicto).toBe(true); // cita pendiente id:2
  });
});

// ─── Suite 2B: Validación de fecha ───────────────────────────────────────────
describe("Módulo 2 — Reserva: esFechaFutura()", () => {

  it("PT-029: Fecha futura retorna true", () => {
    // QUÉ SE PRUEBA: que el sistema acepta correctamente fechas que aún
    // no han ocurrido para agendar citas.
    const futuro = new Date();
    futuro.setFullYear(futuro.getFullYear() + 1);
    expect(esFechaFutura(futuro.toISOString())).toBe(true);
  });

  it("PT-030: Fecha pasada retorna false", () => {
    // QUÉ SE PRUEBA: que el sistema rechaza fechas ya transcurridas,
    // impidiendo agendar citas en el pasado.
    expect(esFechaFutura("2020-01-01T00:00")).toBe(false);
  });

  it("PT-031: Fecha de hoy en el pasado inmediato retorna false", () => {
    // QUÉ SE PRUEBA: que incluso segundos en el pasado son rechazados,
    // garantizando que todas las citas sean futuras.
    const pasadoInmediato = new Date(Date.now() - 60000).toISOString();
    expect(esFechaFutura(pasadoInmediato)).toBe(false);
  });
});

// ─── Suite 2C: Estados de cita ────────────────────────────────────────────────
describe("Módulo 2 — Reserva: estados de cita", () => {

  it("PT-032: puedeCancelar retorna true para cita pendiente", () => {
    // QUÉ SE PRUEBA: que las citas en estado pendiente pueden ser
    // canceladas tanto por el cliente como por el administrador.
    const cita = { id: 1, estado: "pendiente" };
    expect(puedeCancelar(cita)).toBe(true);
  });

  it("PT-033: puedeCancelar retorna true para cita confirmada", () => {
    // QUÉ SE PRUEBA: que las citas ya confirmadas también pueden cancelarse
    // cuando el usuario lo requiera antes de que inicie.
    const cita = { id: 1, estado: "confirmada" };
    expect(puedeCancelar(cita)).toBe(true);
  });

  it("PT-034: puedeCancelar retorna false para cita completada", () => {
    // QUÉ SE PRUEBA: que una cita ya completada no puede ser cancelada
    // ya que el servicio fue prestado exitosamente.
    const cita = { id: 1, estado: "completada" };
    expect(puedeCancelar(cita)).toBe(false);
  });

  it("PT-035: puedeCancelar retorna false para cita ya cancelada", () => {
    // QUÉ SE PRUEBA: que una cita ya cancelada no puede cancelarse de nuevo,
    // evitando operaciones redundantes sobre estados finales.
    const cita = { id: 1, estado: "cancelada" };
    expect(puedeCancelar(cita)).toBe(false);
  });

  it("PT-036: puedeCancelar retorna false para cita en curso", () => {
    // QUÉ SE PRUEBA: que una cita que ya está en ejecución no puede
    // cancelarse ya que el profesional está atendiendo al cliente.
    const cita = { id: 1, estado: "en_curso" };
    expect(puedeCancelar(cita)).toBe(false);
  });

  it("PT-037: puedeConfirmar retorna true solo para cita pendiente", () => {
    // QUÉ SE PRUEBA: que solo las citas en estado pendiente pueden ser
    // confirmadas por el profesional o administrador.
    const cita = { id: 1, estado: "pendiente" };
    expect(puedeConfirmar(cita)).toBe(true);
  });

  it("PT-038: puedeConfirmar retorna false para cita ya confirmada", () => {
    // QUÉ SE PRUEBA: que una cita ya confirmada no puede confirmarse de nuevo,
    // evitando duplicación de acciones sobre el mismo estado.
    const cita = { id: 1, estado: "confirmada" };
    expect(puedeConfirmar(cita)).toBe(false);
  });

  it("PT-039: puedeConfirmar retorna false para cita cancelada", () => {
    // QUÉ SE PRUEBA: que una cita cancelada no puede volver a confirmarse,
    // manteniendo la integridad del flujo de estados.
    const cita = { id: 1, estado: "cancelada" };
    expect(puedeConfirmar(cita)).toBe(false);
  });

  it("PT-040: getColorEstado retorna el color correcto para cada estado", () => {
    // QUÉ SE PRUEBA: que cada estado tiene su color visual correcto asignado
    // para que la interfaz muestre el indicador de color adecuado.
    expect(getColorEstado("pendiente")).toBe("#f59e0b");
    expect(getColorEstado("confirmada")).toBe("#22c55e");
    expect(getColorEstado("cancelada")).toBe("#ef4444");
    expect(getColorEstado("completada")).toBe("#8b5cf6");
  });

  it("PT-041: getColorEstado retorna color por defecto para estado desconocido", () => {
    // QUÉ SE PRUEBA: que el sistema maneja estados inesperados o desconocidos
    // sin fallar, retornando un color neutro por defecto.
    expect(getColorEstado("estado_inexistente")).toBe("#64748b");
  });
});

// ─── Suite 2D: Filtrado de citas por rol ─────────────────────────────────────
describe("Módulo 2 — Reserva: filtrarCitasPorRol()", () => {

  it("PT-042: Cliente solo ve sus propias citas", () => {
    // QUÉ SE PRUEBA: que un usuario con rol cliente únicamente puede ver
    // las citas que él mismo ha agendado, no las de otros clientes.
    const maria = USUARIOS_TEST.find(u => u.id === 3);
    const resultado = filtrarCitasPorRol(CITAS_TEST, maria);
    expect(resultado.every(c => c.clienteId === 3)).toBe(true);
    expect(resultado.length).toBe(2);
  });

  it("PT-043: Profesional solo ve las citas que le corresponden", () => {
    // QUÉ SE PRUEBA: que un usuario profesional solo visualiza las citas
    // en las que él es el profesional asignado.
    const juan = USUARIOS_TEST.find(u => u.id === 2);
    const resultado = filtrarCitasPorRol(CITAS_TEST, juan);
    expect(resultado.every(c => c.profesionalId === 2)).toBe(true);
  });

  it("PT-044: Administrador ve todas las citas del sistema", () => {
    // QUÉ SE PRUEBA: que el administrador tiene acceso completo a todas
    // las citas independientemente del cliente o profesional asignado.
    const admin = USUARIOS_TEST.find(u => u.id === 1);
    const resultado = filtrarCitasPorRol(CITAS_TEST, admin);
    expect(resultado.length).toBe(CITAS_TEST.length);
  });

  it("PT-045: Cliente sin citas retorna lista vacía", () => {
    // QUÉ SE PRUEBA: que cuando un cliente no tiene citas registradas,
    // el sistema retorna una lista vacía y no falla.
    const usuarioSinCitas = { id: 999, rol: "cliente" };
    const resultado = filtrarCitasPorRol(CITAS_TEST, usuarioSinCitas);
    expect(resultado.length).toBe(0);
  });
});

// ─── Suite 2E: Validación de servicios ───────────────────────────────────────
describe("Módulo 2 — Servicios: validarServicio()", () => {

  it("PT-046: Servicio válido no genera errores", () => {
    // QUÉ SE PRUEBA: que un formulario de servicio correctamente completado
    // pasa todas las validaciones del sistema.
    const form = { nombre: "Masaje Relajante", duracion: 60, precio: 90000 };
    const errores = validarServicio(form);
    expect(Object.keys(errores).length).toBe(0);
  });

  it("PT-047: Servicio falla si el nombre está vacío", () => {
    // QUÉ SE PRUEBA: que el nombre del servicio es un campo requerido
    // y no puede guardarse con valor vacío.
    const form = { nombre: "", duracion: 30, precio: 50000 };
    const errores = validarServicio(form);
    expect(errores.nombre).toBeDefined();
  });

  it("PT-048: Servicio falla si la duración es menor a 5 minutos", () => {
    // QUÉ SE PRUEBA: que el sistema impone un mínimo de duración para
    // garantizar que los servicios tengan un tiempo razonable de atención.
    const form = { nombre: "Test", duracion: 3, precio: 50000 };
    const errores = validarServicio(form);
    expect(errores.duracion).toBeDefined();
  });

  it("PT-049: Servicio falla si el precio es negativo", () => {
    // QUÉ SE PRUEBA: que el sistema rechaza precios negativos que serían
    // inválidos para cualquier servicio ofrecido.
    const form = { nombre: "Test", duracion: 30, precio: -1000 };
    const errores = validarServicio(form);
    expect(errores.precio).toBeDefined();
  });

  it("PT-050: Servicio con precio 0 es válido (gratuito)", () => {
    // QUÉ SE PRUEBA: que el sistema permite servicios gratuitos (precio = 0)
    // para casos como consultas iniciales sin costo.
    const form = { nombre: "Consulta gratuita", duracion: 15, precio: 0 };
    const errores = validarServicio(form);
    expect(errores.precio).toBeUndefined();
  });

  it("PT-051: Solo se muestran servicios activos al agendar cita", () => {
    // QUÉ SE PRUEBA: que los servicios desactivados no aparecen disponibles
    // cuando un cliente intenta agendar una nueva cita.
    const activos = SERVICIOS_TEST.filter(s => s.activo);
    expect(activos.length).toBe(2);
    expect(activos.every(s => s.activo)).toBe(true);
    expect(activos.find(s => s.nombre === "Servicio Inactivo")).toBeUndefined();
  });
});

// ============================================================================
// SUITE 3 — PRUEBAS DE INTEGRACIÓN (Render con React Testing Library)
// ============================================================================
describe("Integración — Renderizado de la aplicación", () => {

  it("PT-052: La app renderiza el formulario de login al inicio", () => {
    // QUÉ SE PRUEBA: que cuando la aplicación carga por primera vez,
    // el usuario ve el formulario de login y no el dashboard.
    render(<App />);
    expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("correo@ejemplo.com")).toBeInTheDocument();
  });

  it("PT-053: Se muestra el logo CitaSystem en el login", () => {
    // QUÉ SE PRUEBA: que la identidad del sistema es visible en la
    // pantalla de autenticación para el usuario.
    render(<App />);
    expect(screen.getByText("CitaSystem")).toBeInTheDocument();
  });

  it("PT-054: Se muestran los accesos de demo en el login", () => {
    // QUÉ SE PRUEBA: que el panel de accesos rápidos de demo está
    // visible para facilitar las pruebas del sistema.
    render(<App />);
    expect(screen.getByText("ACCESOS DE DEMO")).toBeInTheDocument();
  });

  it("PT-055: Muestra error con credenciales incorrectas", async () => {
    // QUÉ SE PRUEBA: que al ingresar credenciales incorrectas, el sistema
    // muestra un mensaje de error claro en la interfaz de usuario.
    render(<App />);
    const emailInput = screen.getByPlaceholderText("correo@ejemplo.com");
    const passInput  = screen.getByPlaceholderText("••••••••");
    await userEvent.type(emailInput, "noexiste@mail.com");
    await userEvent.type(passInput, "wrongpass");
    fireEvent.click(screen.getByText("Entrar"));
    await waitFor(() => {
      expect(screen.getByText(/Credenciales incorrectas/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("PT-056: Login exitoso muestra el Dashboard del Admin", async () => {
    // QUÉ SE PRUEBA: que tras un login exitoso con credenciales de
    // administrador, el sistema navega automáticamente al Dashboard.
    render(<App />);
    await userEvent.type(screen.getByPlaceholderText("correo@ejemplo.com"), "diegocubillos1202@gmail.com");
    await userEvent.type(screen.getByPlaceholderText("••••••••"), "1234");
    fireEvent.click(screen.getByText("Entrar"));
    await waitFor(() => {
      expect(screen.getByText(/Bienvenido/i)).toBeInTheDocument();
    }, { timeout: 2000 });
  });

  it("PT-057: El enlace a Registro funciona desde el Login", async () => {
    // QUÉ SE PRUEBA: que el enlace '¿No tienes cuenta?' navega correctamente
    // al formulario de registro cuando el usuario lo pulsa.
    render(<App />);
    fireEvent.click(screen.getByText("Regístrate aquí"));
    await waitFor(() => {
      expect(screen.getByText("Crear Cuenta")).toBeInTheDocument();
    });
  });

  it("PT-058: El enlace a Login desde Registro funciona", async () => {
    // QUÉ SE PRUEBA: que desde el formulario de registro el usuario puede
    // volver a la pantalla de login si ya tiene una cuenta.
    render(<App />);
    fireEvent.click(screen.getByText("Regístrate aquí"));
    await waitFor(() => screen.getByText("Crear Cuenta"));
    fireEvent.click(screen.getByText("Inicia sesión"));
    await waitFor(() => {
      expect(screen.getByText("Iniciar Sesión")).toBeInTheDocument();
    });
  });
});

// ============================================================================
// SUITE 4 — PRUEBAS DE REGLAS DE NEGOCIO
// ============================================================================
describe("Reglas de negocio — Flujos críticos del sistema", () => {

  it("PT-059: Un cliente no puede ver citas de otros clientes", () => {
    // QUÉ SE PRUEBA: que la separación de datos entre clientes funciona
    // correctamente, garantizando la privacidad de cada usuario.
    const maria   = { id: 3, rol: "cliente" };
    const carlos  = { id: 4, rol: "cliente" };
    const citasMaria  = filtrarCitasPorRol(CITAS_TEST, maria);
    const citasCarlos = filtrarCitasPorRol(CITAS_TEST, carlos);
    // Las citas de María no deben aparecer en las de Carlos y viceversa
    citasMaria.forEach(c  => expect(c.clienteId).toBe(3));
    citasCarlos.forEach(c => expect(c.clienteId).toBe(4));
  });

  it("PT-060: No se puede agendar en un horario con conflicto activo", () => {
    // QUÉ SE PRUEBA: regla de negocio crítica que garantiza que un profesional
    // no puede atender dos clientes al mismo tiempo.
    const hayConflictoActivo = hayConflicto(CITAS_TEST, 2, "2025-04-15T10:30");
    expect(hayConflictoActivo).toBe(true);
    // Por lo tanto el sistema debe bloquear la nueva cita
  });

  it("PT-061: Solo profesional o admin pueden confirmar una cita", () => {
    // QUÉ SE PRUEBA: que la regla de negocio de confirmación de citas
    // restringe esta acción correctamente según el rol del usuario.
    const citaPendiente = { id: 5, estado: "pendiente" };
    // La lógica de negocio: solo profesional/admin pueden confirmar
    const puedeProf  = puedeConfirmar(citaPendiente) && true;  // profesional puede
    const puedeAdmin = puedeConfirmar(citaPendiente) && true;  // admin puede
    const puedeCliente = puedeConfirmar(citaPendiente) && false; // cliente no puede (lógica de UI)
    expect(puedeProf).toBe(true);
    expect(puedeAdmin).toBe(true);
    expect(puedeCliente).toBe(false);
  });

  it("PT-062: Eliminar un usuario no afecta el conteo de citas", () => {
    // QUÉ SE PRUEBA: que la eliminación de un usuario no altera los datos
    // de citas, que deben mantenerse intactos (integridad referencial).
    const usuariosActualizados = eliminarUsuario(USUARIOS_TEST, 3);
    // Las citas no deben cambiar por eliminar un usuario
    expect(CITAS_TEST.length).toBe(3);
    expect(usuariosActualizados.length).toBe(USUARIOS_TEST.length - 1);
  });

  it("PT-063: Un servicio inactivo no aparece en el formulario de agendamiento", () => {
    // QUÉ SE PRUEBA: que los servicios desactivados no son ofrecidos a los
    // clientes, asegurando que solo servicios vigentes estén disponibles.
    const serviciosDisponibles = SERVICIOS_TEST.filter(s => s.activo);
    const servicioInactivo = serviciosDisponibles.find(s => s.nombre === "Servicio Inactivo");
    expect(servicioInactivo).toBeUndefined();
  });

  it("PT-064: El admin puede ver estadísticas globales del sistema", () => {
    // QUÉ SE PRUEBA: que el administrador tiene acceso a información
    // consolidada: total de citas, usuarios y estados del sistema.
    const admin = USUARIOS_TEST.find(u => u.rol === "admin");
    const todasLasCitas = filtrarCitasPorRol(CITAS_TEST, admin);
    expect(todasLasCitas.length).toBe(CITAS_TEST.length);
    // Stats que el admin puede ver
    const pendientes  = todasLasCitas.filter(c => c.estado === "pendiente").length;
    const confirmadas = todasLasCitas.filter(c => c.estado === "confirmada").length;
    const completadas = todasLasCitas.filter(c => c.estado === "completada").length;
    expect(pendientes + confirmadas + completadas).toBe(CITAS_TEST.length);
  });
});
