import { useState } from "react";


const USUARIOS_MOCK = [
  { id: 1, nombre: "Diego Cubillos",  email: "diegocubillos1202@gmail.com", password: "1234", rol: "admin",        estado: "activo",   creado: "2025-01-10" },
  { id: 2, nombre: "Juan González",   email: "jsgonzalezangel@gmail.com",   password: "1234", rol: "profesional",  estado: "activo",   creado: "2025-01-12" },
  { id: 3, nombre: "María López",     email: "maria@example.com",           password: "1234", rol: "cliente",      estado: "activo",   creado: "2025-02-01" },
  { id: 4, nombre: "Carlos Ruiz",     email: "carlos@example.com",          password: "1234", rol: "cliente",      estado: "inactivo", creado: "2025-02-15" },
];

const SERVICIOS_MOCK = [
  { id: 1, nombre: "Consulta General",       duracion: 30,  precio: 50000,  descripcion: "Consulta médica general",            activo: true },
  { id: 2, nombre: "Entrenamiento Personal", duracion: 60,  precio: 80000,  descripcion: "Sesión de entrenamiento personalizado", activo: true },
  { id: 3, nombre: "Asesoría Empresarial",   duracion: 90,  precio: 150000, descripcion: "Consultoría para tu negocio",         activo: true },
  { id: 4, nombre: "Terapia Física",         duracion: 45,  precio: 70000,  descripcion: "Rehabilitación y fisioterapia",       activo: true },
];

const CITAS_MOCK = [
  { id: 1, clienteId: 3, profesionalId: 2, servicioId: 2, fechaHora: "2025-04-10T09:00", estado: "confirmada", notas: "Primera sesión",    creada: "2025-04-01" },
  { id: 2, clienteId: 3, profesionalId: 2, servicioId: 1, fechaHora: "2025-04-15T10:30", estado: "pendiente",  notas: "",                  creada: "2025-04-02" },
  { id: 3, clienteId: 4, profesionalId: 2, servicioId: 3, fechaHora: "2025-03-20T14:00", estado: "completada", notas: "Sesión completada", creada: "2025-03-15" },
];

const ROLES     = { admin: "Administrador", profesional: "Profesional", cliente: "Cliente" };
const ROL_COLOR = { admin: "#ef4444", profesional: "#3b82f6", cliente: "#22c55e" };
const ROL_BG    = { admin: "#fef2f2", profesional: "#eff6ff", cliente: "#f0fdf4" };

const ESTADO_COLOR = { pendiente: "#f59e0b", confirmada: "#22c55e", en_curso: "#3b82f6", completada: "#8b5cf6", cancelada: "#ef4444", reprogramada: "#06b6d4", no_asistio: "#94a3b8" };
const ESTADO_BG    = { pendiente: "#fef3c7", confirmada: "#f0fdf4", en_curso: "#eff6ff",  completada: "#f5f3ff", cancelada: "#fef2f2",  reprogramada: "#ecfeff",  no_asistio: "#f8fafc" };
const ESTADO_LABEL = { pendiente: "Pendiente", confirmada: "Confirmada", en_curso: "En curso", completada: "Completada", cancelada: "Cancelada", reprogramada: "Reprogramada", no_asistio: "No asistió" };

export default function App() {
  const [vista, setVista]               = useState("login");
  const [usuarioActual, setUsuarioActual] = useState(null);
  const [usuarios, setUsuarios]         = useState(USUARIOS_MOCK);
  const [citas, setCitas]               = useState(CITAS_MOCK);
  const [servicios, setServicios]       = useState(SERVICIOS_MOCK);
  const [notif, setNotif]               = useState(null);

  const mostrarNotif = (msg, tipo = "exito") => {
    setNotif({ msg, tipo });
    setTimeout(() => setNotif(null), 3500);
  };

  const cerrarSesion = () => {
    setUsuarioActual(null);
    setVista("login");
    mostrarNotif("Sesión cerrada correctamente.", "info");
  };

  return (
    <div style={E.root}>
      {notif && (
        <div style={{ ...E.notif, background: notif.tipo === "exito" ? "#166534" : notif.tipo === "error" ? "#7f1d1d" : "#1e3a5f" }}>
          {notif.tipo === "exito" ? "✓" : notif.tipo === "error" ? "✗" : "ℹ"} {notif.msg}
        </div>
      )}
      {!usuarioActual ? (
        <AuthModule vista={vista} setVista={setVista} usuarios={usuarios} setUsuarios={setUsuarios} setUsuarioActual={setUsuarioActual} mostrarNotif={mostrarNotif} />
      ) : (
        <Dashboard usuarioActual={usuarioActual} setUsuarioActual={setUsuarioActual} usuarios={usuarios} setUsuarios={setUsuarios} citas={citas} setCitas={setCitas} servicios={servicios} setServicios={setServicios} cerrarSesion={cerrarSesion} mostrarNotif={mostrarNotif} />
      )}
    </div>
  );
}

function AuthModule({ vista, setVista, usuarios, setUsuarios, setUsuarioActual, mostrarNotif }) {
  return (
    <div style={E.authBg}>
      <div style={E.authCard}>
        <div style={E.authHeader}>
          <div style={E.logoIcon}>📅</div>
          <h1 style={E.logoTitulo}>CitaSystem</h1>
          <p style={E.logoSub}>Sistema Inteligente de Gestión de Citas</p>
          <p style={E.logoInst}>Universidad de Cundinamarca · Fusagasugá</p>
        </div>
        {vista === "login"
          ? <FormLogin usuarios={usuarios} setUsuarioActual={setUsuarioActual} setVista={setVista} mostrarNotif={mostrarNotif} />
          : <FormRegistro usuarios={usuarios} setUsuarios={setUsuarios} setVista={setVista} mostrarNotif={mostrarNotif} />}
      </div>
    </div>
  );
}

function FormLogin({ usuarios, setUsuarioActual, setVista, mostrarNotif }) {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleLogin = () => {
    setError("");
    if (!form.email || !form.password) { setError("Por favor completa todos los campos."); return; }
    setCargando(true);
    setTimeout(() => {
      const u = usuarios.find(u => u.email === form.email && u.password === form.password);
      if (!u)                    { setError("Credenciales incorrectas."); setCargando(false); return; }
      if (u.estado === "inactivo") { setError("Cuenta inactiva. Contacta al administrador."); setCargando(false); return; }
      setUsuarioActual(u);
      mostrarNotif(`Bienvenido, ${u.nombre.split(" ")[0]}!`);
      setCargando(false);
    }, 700);
  };

  return (
    <div>
      <h2 style={E.formTitulo}>Iniciar Sesión</h2>
      {error && <div style={E.errorBox}>{error}</div>}
      <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="correo@ejemplo.com" />
      <Campo label="Contraseña" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="••••••••" onEnter={handleLogin} />
      <Btn onClick={handleLogin} cargando={cargando}>{cargando ? "Verificando..." : "Entrar"}</Btn>
      <p style={E.linkTexto}>¿No tienes cuenta? <span style={E.link} onClick={() => setVista("registro")}>Regístrate aquí</span></p>
      <div style={E.demoBox}>
        <p style={{ margin: 0, fontSize: 12, color: "#64748b", fontWeight: 600, marginBottom: 6 }}>🔑 ACCESOS DE DEMO</p>
        {[{ email: "diegocubillos1202@gmail.com", rol: "Admin" }, { email: "jsgonzalezangel@gmail.com", rol: "Profesional" }, { email: "maria@example.com", rol: "Cliente" }].map(d => (
          <p key={d.email} style={{ margin: "2px 0", fontSize: 11, color: "#475569", cursor: "pointer" }} onClick={() => setForm({ email: d.email, password: "1234" })}>
            <span style={{ color: "#3b82f6" }}>{d.rol}:</span> {d.email} / 1234
          </p>
        ))}
      </div>
    </div>
  );
}

function FormRegistro({ usuarios, setUsuarios, setVista, mostrarNotif }) {
  const [form, setForm] = useState({ nombre: "", email: "", password: "", confirmar: "", rol: "cliente" });
  const [errores, setErrores] = useState({});
  const [cargando, setCargando] = useState(false);

  const validar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "El nombre es obligatorio.";
    if (!form.email.includes("@")) e.email = "Correo inválido.";
    if (usuarios.find(u => u.email === form.email)) e.email = "Este correo ya está registrado.";
    if (form.password.length < 4) e.password = "Mínimo 4 caracteres.";
    if (form.password !== form.confirmar) e.confirmar = "Las contraseñas no coinciden.";
    return e;
  };

  const handleRegistro = () => {
    const e = validar(); setErrores(e);
    if (Object.keys(e).length > 0) return;
    setCargando(true);
    setTimeout(() => {
      setUsuarios([...usuarios, { id: Date.now(), nombre: form.nombre, email: form.email, password: form.password, rol: form.rol, estado: "activo", creado: new Date().toISOString().split("T")[0] }]);
      mostrarNotif("¡Cuenta creada! Ahora puedes iniciar sesión.");
      setVista("login"); setCargando(false);
    }, 700);
  };

  return (
    <div>
      <h2 style={E.formTitulo}>Crear Cuenta</h2>
      <Campo label="Nombre completo" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} placeholder="Tu nombre completo" error={errores.nombre} />
      <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} placeholder="correo@ejemplo.com" error={errores.email} />
      <div style={{ marginBottom: 14 }}>
        <label style={E.label}>Tipo de usuario</label>
        <select style={E.select} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
          <option value="cliente">Cliente</option>
          <option value="profesional">Profesional</option>
        </select>
      </div>
      <Campo label="Contraseña" type="password" value={form.password} onChange={v => setForm({ ...form, password: v })} placeholder="Mínimo 4 caracteres" error={errores.password} />
      <Campo label="Confirmar contraseña" type="password" value={form.confirmar} onChange={v => setForm({ ...form, confirmar: v })} placeholder="Repite tu contraseña" error={errores.confirmar} onEnter={handleRegistro} />
      <Btn onClick={handleRegistro} cargando={cargando}>{cargando ? "Registrando..." : "Crear cuenta"}</Btn>
      <p style={E.linkTexto}>¿Ya tienes cuenta? <span style={E.link} onClick={() => setVista("login")}>Inicia sesión</span></p>
    </div>
  );
}


function Dashboard({ usuarioActual, setUsuarioActual, usuarios, setUsuarios, citas, setCitas, servicios, setServicios, cerrarSesion, mostrarNotif }) {
  const [seccion, setSeccion] = useState("inicio");

  const navItems = [
    { id: "inicio",    icon: "🏠", label: "Inicio" },
    { id: "perfil",    icon: "👤", label: "Mi Perfil" },
    ...(usuarioActual.rol === "admin" ? [{ id: "usuarios", icon: "👥", label: "Usuarios" }] : []),
    { id: "citas",     icon: "📅", label: "Mis Citas" },
    ...(usuarioActual.rol === "cliente" ? [{ id: "agendar", icon: "➕", label: "Agendar Cita" }] : []),
    ...(usuarioActual.rol === "admin"   ? [{ id: "servicios", icon: "💼", label: "Servicios" }] : []),
    { id: "agenda",    icon: "📋", label: "Agenda",   disabled: true, badge: "Módulo 3" },
    { id: "reportes",  icon: "📊", label: "Reportes", disabled: true, badge: "Módulo 4" },
  ];

  return (
    <div style={E.dashLayout}>
      <aside style={E.sidebar}>
        <div style={E.sideHeader}>
          <span style={{ fontSize: 22 }}>📅</span>
          <div>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#fff" }}>CitaSystem</div>
            <div style={{ fontSize: 10, color: "#94a3b8" }}>U. de Cundinamarca</div>
          </div>
        </div>
        <div style={E.sideUser}>
          <div style={E.avatar}>{usuarioActual.nombre.charAt(0)}</div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 13, color: "#e2e8f0", maxWidth: 130, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{usuarioActual.nombre}</div>
            <div style={{ fontSize: 11, color: ROL_COLOR[usuarioActual.rol], fontWeight: 600 }}>{ROLES[usuarioActual.rol]}</div>
          </div>
        </div>
        <nav style={{ flex: 1 }}>
          {navItems.map(item => (
            <div key={item.id} onClick={() => !item.disabled && setSeccion(item.id)}
              style={{ ...E.navItem, ...(seccion === item.id ? E.navItemActive : {}), opacity: item.disabled ? 0.4 : 1, cursor: item.disabled ? "default" : "pointer" }}>
              <span style={{ fontSize: 15 }}>{item.icon}</span>
              <span style={{ flex: 1 }}>{item.label}</span>
              {item.badge && <span style={E.badge}>{item.badge}</span>}
            </div>
          ))}
        </nav>
        <div style={E.sideFooter} onClick={cerrarSesion}>🚪 Cerrar sesión</div>
      </aside>

      <main style={E.mainContent}>
        {seccion === "inicio"    && <SeccionInicio usuario={usuarioActual} usuarios={usuarios} citas={citas} servicios={servicios} setSeccion={setSeccion} />}
        {seccion === "perfil"    && <SeccionPerfil usuario={usuarioActual} setUsuarioActual={setUsuarioActual} usuarios={usuarios} setUsuarios={setUsuarios} mostrarNotif={mostrarNotif} />}
        {seccion === "usuarios"  && usuarioActual.rol === "admin" && <SeccionUsuarios usuarios={usuarios} setUsuarios={setUsuarios} usuarioActual={usuarioActual} mostrarNotif={mostrarNotif} />}
        {seccion === "citas"     && <SeccionCitas citas={citas} setCitas={setCitas} usuarios={usuarios} servicios={servicios} usuarioActual={usuarioActual} mostrarNotif={mostrarNotif} setSeccion={setSeccion} />}
        {seccion === "agendar"   && <SeccionAgendar citas={citas} setCitas={setCitas} usuarios={usuarios} servicios={servicios} usuarioActual={usuarioActual} mostrarNotif={mostrarNotif} setSeccion={setSeccion} />}
        {seccion === "servicios" && usuarioActual.rol === "admin" && <SeccionServicios servicios={servicios} setServicios={setServicios} mostrarNotif={mostrarNotif} />}
      </main>
    </div>
  );
}


function SeccionInicio({ usuario, usuarios, citas, servicios, setSeccion }) {
  const misCitas = citas.filter(c => usuario.rol === "cliente" ? c.clienteId === usuario.id : usuario.rol === "profesional" ? c.profesionalId === usuario.id : true);
  return (
    <div>
      <div style={E.pageHeader}>
        <div>
          <h2 style={E.pageTitle}>Bienvenido, {usuario.nombre.split(" ")[0]} 👋</h2>
          <p style={E.pageSub}>Panel principal del sistema</p>
        </div>
        <span style={{ ...E.rolTag, background: ROL_BG[usuario.rol], color: ROL_COLOR[usuario.rol] }}>{ROLES[usuario.rol]}</span>
      </div>

      {usuario.rol === "admin" && (
        <div style={E.statsGrid}>
          {[["👥", usuarios.length, "Usuarios", "#3b82f6"], ["📅", citas.length, "Citas total", "#8b5cf6"],
            ["⏳", citas.filter(c=>c.estado==="pendiente").length, "Pendientes", "#f59e0b"],
            ["✅", citas.filter(c=>c.estado==="confirmada").length, "Confirmadas", "#22c55e"]].map(([ic,n,l,col]) => (
            <div key={l} style={E.statCard}><div style={{ fontSize: 26 }}>{ic}</div><div style={{ fontSize: 30, fontWeight: 800, color: col }}>{n}</div><div style={{ fontSize: 12, color: "#64748b" }}>{l}</div></div>
          ))}
        </div>
      )}

      {usuario.rol !== "admin" && (
        <div style={E.statsGrid}>
          {[["📅", misCitas.length, "Mis citas", "#3b82f6"],
            ["⏳", misCitas.filter(c=>c.estado==="pendiente").length,  "Pendientes", "#f59e0b"],
            ["✅", misCitas.filter(c=>c.estado==="confirmada").length,  "Confirmadas","#22c55e"],
            ["✔️", misCitas.filter(c=>c.estado==="completada").length, "Completadas","#8b5cf6"]].map(([ic,n,l,col]) => (
            <div key={l} style={E.statCard}><div style={{ fontSize: 26 }}>{ic}</div><div style={{ fontSize: 30, fontWeight: 800, color: col }}>{n}</div><div style={{ fontSize: 12, color: "#64748b" }}>{l}</div></div>
          ))}
        </div>
      )}

      <div style={E.modulosGrid}>
        {[
          { num:"01", titulo:"Autenticación y Usuarios", desc:"Registro, login, roles y gestión de perfiles.", activo: true,  icon:"🔐" },
          { num:"02", titulo:"Reserva de Citas",         desc:"Agendar, cancelar, confirmar y gestionar citas.", activo: true,  icon:"📅" },
          { num:"03", titulo:"Gestión de Agenda",        desc:"Control de horarios por profesional.",          activo: false, icon:"📋" },
          { num:"04", titulo:"Reportes y Estadísticas",  desc:"Historial, análisis y reportes del sistema.",   activo: false, icon:"📊" },
        ].map(m => (
          <div key={m.num} style={{ ...E.moduloCard, ...(m.activo ? E.moduloActivo : E.moduloProximo) }}>
            <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:6 }}>
              <span style={{ fontSize:20 }}>{m.icon}</span>
              <span style={{ fontWeight:800, fontSize:11, color: m.activo ? "#166534" : "#64748b" }}>{m.activo ? "✓ ACTIVO" : "PRÓXIMO"}</span>
            </div>
            <div style={{ fontWeight:700, fontSize:13, color:"#1e293b", marginBottom:4 }}>Módulo {m.num}: {m.titulo}</div>
            <div style={{ fontSize:12, color:"#64748b" }}>{m.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SeccionPerfil({ usuario, setUsuarioActual, usuarios, setUsuarios, mostrarNotif }) {
  const [editando, setEditando] = useState(false);
  const [form, setForm] = useState({ nombre: usuario.nombre, email: usuario.email });
  const [cambioPass, setCambioPass] = useState({ actual: "", nueva: "", confirmar: "" });
  const [errPass, setErrPass] = useState("");

  const guardarPerfil = () => {
    if (!form.nombre.trim()) { mostrarNotif("El nombre no puede estar vacío.", "error"); return; }
    const act = { ...usuario, nombre: form.nombre, email: form.email };
    setUsuarioActual(act);
    setUsuarios(usuarios.map(u => u.id === usuario.id ? act : u));
    mostrarNotif("Perfil actualizado."); setEditando(false);
  };

  const cambiarPassword = () => {
    setErrPass("");
    if (cambioPass.actual !== usuario.password) { setErrPass("Contraseña actual incorrecta."); return; }
    if (cambioPass.nueva.length < 4) { setErrPass("Mínimo 4 caracteres."); return; }
    if (cambioPass.nueva !== cambioPass.confirmar) { setErrPass("Las contraseñas no coinciden."); return; }
    const act = { ...usuario, password: cambioPass.nueva };
    setUsuarioActual(act); setUsuarios(usuarios.map(u => u.id === usuario.id ? act : u));
    mostrarNotif("Contraseña actualizada."); setCambioPass({ actual: "", nueva: "", confirmar: "" });
  };

  return (
    <div>
      <div style={E.pageHeader}><div><h2 style={E.pageTitle}>Mi Perfil</h2><p style={E.pageSub}>Información personal y credenciales</p></div></div>
      <div style={E.dosCol}>
        <div style={E.card}>
          <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
            <div style={E.cardTitle}>Información Personal</div>
            <button style={E.btnSecundario} onClick={() => setEditando(!editando)}>{editando ? "Cancelar" : "✏️ Editar"}</button>
          </div>
          <div style={E.avatarGrande}>{usuario.nombre.charAt(0)}</div>
          {editando ? (
            <>
              <Campo label="Nombre completo" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} />
              <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
              <Btn onClick={guardarPerfil}>Guardar cambios</Btn>
            </>
          ) : (
            [["Nombre", usuario.nombre], ["Correo", usuario.email], ["Rol", ROLES[usuario.rol]], ["Estado", usuario.estado], ["Miembro desde", usuario.creado]].map(([k,v]) => (
              <div key={k} style={E.infoRow}><span style={E.infoKey}>{k}</span><span style={E.infoVal}>{v}</span></div>
            ))
          )}
        </div>
        <div style={E.card}>
          <div style={E.cardTitle}>Cambiar Contraseña</div>
          {errPass && <div style={E.errorBox}>{errPass}</div>}
          <Campo label="Contraseña actual" type="password" value={cambioPass.actual} onChange={v => setCambioPass({ ...cambioPass, actual: v })} />
          <Campo label="Nueva contraseña"  type="password" value={cambioPass.nueva}  onChange={v => setCambioPass({ ...cambioPass, nueva: v })} />
          <Campo label="Confirmar nueva"   type="password" value={cambioPass.confirmar} onChange={v => setCambioPass({ ...cambioPass, confirmar: v })} onEnter={cambiarPassword} />
          <Btn onClick={cambiarPassword}>Actualizar contraseña</Btn>
          <div style={{ marginTop:16, padding:12, background:"#f0fdf4", borderRadius:8, fontSize:12, color:"#166534" }}>🔒 Nunca compartas tu contraseña.</div>
        </div>
      </div>
    </div>
  );
}

function SeccionUsuarios({ usuarios, setUsuarios, usuarioActual, mostrarNotif }) {
  const [busqueda, setBusqueda] = useState("");
  const [filtroRol, setFiltroRol] = useState("todos");
  const [modalEditar, setModalEditar] = useState(null);
  const [modalNuevo, setModalNuevo] = useState(false);
  const [confirmEliminar, setConfirmEliminar] = useState(null);

  const filtrados = usuarios.filter(u => {
    const txt = u.nombre.toLowerCase().includes(busqueda.toLowerCase()) || u.email.toLowerCase().includes(busqueda.toLowerCase());
    return txt && (filtroRol === "todos" || u.rol === filtroRol);
  });

  const toggleEstado = id => { setUsuarios(usuarios.map(u => u.id === id ? { ...u, estado: u.estado === "activo" ? "inactivo" : "activo" } : u)); mostrarNotif("Estado actualizado."); };
  const eliminar    = id => { setUsuarios(usuarios.filter(u => u.id !== id)); setConfirmEliminar(null); mostrarNotif("Usuario eliminado."); };

  return (
    <div>
      <div style={E.pageHeader}>
        <div><h2 style={E.pageTitle}>Gestión de Usuarios</h2><p style={E.pageSub}>{usuarios.length} usuarios registrados</p></div>
        <button style={E.btnPrimario} onClick={() => setModalNuevo(true)}>+ Nuevo Usuario</button>
      </div>
      <div style={{ display:"flex", gap:12, marginBottom:20, flexWrap:"wrap" }}>
        <input style={{ ...E.input, flex:1, minWidth:200 }} placeholder="🔍 Buscar..." value={busqueda} onChange={e => setBusqueda(e.target.value)} />
        <select style={{ ...E.select, width:"auto" }} value={filtroRol} onChange={e => setFiltroRol(e.target.value)}>
          <option value="todos">Todos los roles</option>
          <option value="admin">Administradores</option>
          <option value="profesional">Profesionales</option>
          <option value="cliente">Clientes</option>
        </select>
      </div>
      <div style={{ ...E.card, padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              {["Usuario","Correo","Rol","Estado","Registrado","Acciones"].map(h => <th key={h} style={E.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtrados.map(u => (
              <tr key={u.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                <td style={E.td}><div style={{ display:"flex", alignItems:"center", gap:10 }}><div style={{ ...E.avatarSmall, background: ROL_COLOR[u.rol] }}>{u.nombre.charAt(0)}</div><span style={{ fontWeight:600 }}>{u.nombre}</span></div></td>
                <td style={{ ...E.td, fontSize:12, color:"#64748b" }}>{u.email}</td>
                <td style={E.td}><span style={{ ...E.rolChip, background:ROL_BG[u.rol], color:ROL_COLOR[u.rol] }}>{ROLES[u.rol]}</span></td>
                <td style={E.td}><span style={{ ...E.estadoChip, background:u.estado==="activo"?"#f0fdf4":"#fef2f2", color:u.estado==="activo"?"#166534":"#991b1b" }}>{u.estado==="activo"?"● Activo":"● Inactivo"}</span></td>
                <td style={{ ...E.td, fontSize:12, color:"#94a3b8" }}>{u.creado}</td>
                <td style={E.td}><div style={{ display:"flex", gap:6 }}>
                  <button style={E.btnTabla} onClick={() => setModalEditar(u)}>✏️</button>
                  {u.id !== usuarioActual.id && <>
                    <button style={{ ...E.btnTabla, background:u.estado==="activo"?"#fef3c7":"#dcfce7" }} onClick={() => toggleEstado(u.id)}>{u.estado==="activo"?"🔒":"🔓"}</button>
                    <button style={{ ...E.btnTabla, background:"#fef2f2" }} onClick={() => setConfirmEliminar(u)}>🗑️</button>
                  </>}
                </div></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtrados.length === 0 && <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>No se encontraron usuarios.</div>}
      </div>
      {modalEditar && <ModalEditarUsuario usuario={modalEditar} usuarios={usuarios} setUsuarios={setUsuarios} onClose={() => setModalEditar(null)} mostrarNotif={mostrarNotif} />}
      {modalNuevo  && <ModalNuevoUsuario  usuarios={usuarios} setUsuarios={setUsuarios} onClose={() => setModalNuevo(false)} mostrarNotif={mostrarNotif} />}
      {confirmEliminar && (
        <div style={E.overlay}><div style={{ ...E.modal, maxWidth:360, textAlign:"center" }}>
          <div style={{ fontSize:36, marginBottom:12 }}>⚠️</div>
          <h3 style={{ margin:"0 0 8px", color:"#1e293b" }}>¿Eliminar usuario?</h3>
          <p style={{ fontSize:13, color:"#64748b", marginBottom:20 }}>Se eliminará a <strong>{confirmEliminar.nombre}</strong> permanentemente.</p>
          <div style={{ display:"flex", gap:12, justifyContent:"center" }}>
            <button style={E.btnSecundario} onClick={() => setConfirmEliminar(null)}>Cancelar</button>
            <button style={{ ...E.btnPrimario, background:"#ef4444" }} onClick={() => eliminar(confirmEliminar.id)}>Sí, eliminar</button>
          </div>
        </div></div>
      )}
    </div>
  );
}

function ModalEditarUsuario({ usuario, usuarios, setUsuarios, onClose, mostrarNotif }) {
  const [form, setForm] = useState({ nombre: usuario.nombre, email: usuario.email, rol: usuario.rol, estado: usuario.estado });
  const guardar = () => { setUsuarios(usuarios.map(u => u.id === usuario.id ? { ...u, ...form } : u)); mostrarNotif("Usuario actualizado."); onClose(); };
  return (
    <div style={E.overlay}><div style={E.modal}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, color:"#1e293b" }}>Editar Usuario</h3>
        <button style={E.btnCerrar} onClick={onClose}>✕</button>
      </div>
      <Campo label="Nombre completo" value={form.nombre} onChange={v => setForm({ ...form, nombre: v })} />
      <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setForm({ ...form, email: v })} />
      <div style={{ marginBottom:14 }}><label style={E.label}>Rol</label>
        <select style={E.select} value={form.rol} onChange={e => setForm({ ...form, rol: e.target.value })}>
          <option value="admin">Administrador</option><option value="profesional">Profesional</option><option value="cliente">Cliente</option>
        </select></div>
      <div style={{ marginBottom:20 }}><label style={E.label}>Estado</label>
        <select style={E.select} value={form.estado} onChange={e => setForm({ ...form, estado: e.target.value })}>
          <option value="activo">Activo</option><option value="inactivo">Inactivo</option>
        </select></div>
      <div style={{ display:"flex", gap:12 }}><button style={E.btnSecundario} onClick={onClose}>Cancelar</button><Btn onClick={guardar}>Guardar</Btn></div>
    </div></div>
  );
}

function ModalNuevoUsuario({ usuarios, setUsuarios, onClose, mostrarNotif }) {
  const [form, setForm] = useState({ nombre:"", email:"", password:"", rol:"cliente" });
  const [errores, setErrores] = useState({});
  const guardar = () => {
    const e = {};
    if (!form.nombre.trim()) e.nombre = "Obligatorio";
    if (!form.email.includes("@")) e.email = "Correo inválido";
    if (usuarios.find(u => u.email === form.email)) e.email = "Correo ya registrado";
    if (form.password.length < 4) e.password = "Mínimo 4 caracteres";
    setErrores(e);
    if (Object.keys(e).length > 0) return;
    setUsuarios([...usuarios, { id: Date.now(), ...form, estado:"activo", creado: new Date().toISOString().split("T")[0] }]);
    mostrarNotif(`Usuario ${form.nombre} creado.`); onClose();
  };
  return (
    <div style={E.overlay}><div style={E.modal}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0, color:"#1e293b" }}>Nuevo Usuario</h3>
        <button style={E.btnCerrar} onClick={onClose}>✕</button>
      </div>
      <Campo label="Nombre completo" value={form.nombre} onChange={v => setForm({ ...form, nombre:v })} error={errores.nombre} />
      <Campo label="Correo electrónico" type="email" value={form.email} onChange={v => setForm({ ...form, email:v })} error={errores.email} />
      <Campo label="Contraseña temporal" type="password" value={form.password} onChange={v => setForm({ ...form, password:v })} error={errores.password} />
      <div style={{ marginBottom:20 }}><label style={E.label}>Rol</label>
        <select style={E.select} value={form.rol} onChange={e => setForm({ ...form, rol:e.target.value })}>
          <option value="admin">Administrador</option><option value="profesional">Profesional</option><option value="cliente">Cliente</option>
        </select></div>
      <div style={{ display:"flex", gap:12 }}><button style={E.btnSecundario} onClick={onClose}>Cancelar</button><Btn onClick={guardar}>Crear</Btn></div>
    </div></div>
  );
}



function getNombre(lista, id) {
  const item = lista.find(x => x.id === id);
  return item ? (item.nombre || item.nombre) : "—";
}

// ── Lista de citas ─────────────────────────────────────────────────────────
function SeccionCitas({ citas, setCitas, usuarios, servicios, usuarioActual, mostrarNotif, setSeccion }) {
  const [filtroEstado, setFiltroEstado] = useState("todos");
  const [citaDetalle, setCitaDetalle]   = useState(null);

  const misCitas = citas.filter(c => {
    if (usuarioActual.rol === "cliente")     return c.clienteId === usuarioActual.id;
    if (usuarioActual.rol === "profesional") return c.profesionalId === usuarioActual.id;
    return true;
  });
  const filtradas = filtroEstado === "todos" ? misCitas : misCitas.filter(c => c.estado === filtroEstado);

  const stats = {
    total:      misCitas.length,
    pendientes: misCitas.filter(c => c.estado === "pendiente").length,
    confirmadas:misCitas.filter(c => c.estado === "confirmada").length,
    completadas:misCitas.filter(c => c.estado === "completada").length,
  };

  const cambiarEstado = (id, nuevoEstado) => {
    setCitas(citas.map(c => c.id === id ? { ...c, estado: nuevoEstado } : c));
    mostrarNotif(`Cita ${nuevoEstado} correctamente.`);
    setCitaDetalle(null);
  };

  return (
    <div>
      <div style={E.pageHeader}>
        <div><h2 style={E.pageTitle}>📅 Mis Citas</h2><p style={E.pageSub}>Gestiona tus reservas</p></div>
        {usuarioActual.rol === "cliente" && (
          <button style={E.btnPrimario} onClick={() => setSeccion("agendar")}>+ Agendar Cita</button>
        )}
      </div>

      {/* Stats */}
      <div style={E.statsGrid}>
        {[["📋", stats.total, "Total", "#3b82f6"], ["⏳", stats.pendientes, "Pendientes", "#f59e0b"],
          ["✅", stats.confirmadas, "Confirmadas", "#22c55e"], ["🏁", stats.completadas, "Completadas", "#8b5cf6"]].map(([ic,n,l,col]) => (
          <div key={l} style={E.statCard}><div style={{ fontSize:22 }}>{ic}</div><div style={{ fontSize:28, fontWeight:800, color:col }}>{n}</div><div style={{ fontSize:12, color:"#64748b" }}>{l}</div></div>
        ))}
      </div>

      {/* Filtro */}
      <div style={{ display:"flex", gap:10, marginBottom:20, flexWrap:"wrap" }}>
        {["todos","pendiente","confirmada","en_curso","completada","cancelada"].map(est => (
          <button key={est} onClick={() => setFiltroEstado(est)}
            style={{ padding:"6px 14px", borderRadius:20, border:"1px solid", fontSize:12, fontWeight:600, cursor:"pointer",
              background: filtroEstado===est ? (est==="todos" ? "#1e3a5f" : ESTADO_COLOR[est]) : "#f8fafc",
              color:       filtroEstado===est ? "#fff" : "#64748b",
              borderColor: filtroEstado===est ? "transparent" : "#e2e8f0" }}>
            {est === "todos" ? "Todas" : ESTADO_LABEL[est]}
          </button>
        ))}
      </div>

      {/* Tabla */}
      <div style={{ ...E.card, padding:0, overflow:"hidden" }}>
        <table style={{ width:"100%", borderCollapse:"collapse" }}>
          <thead>
            <tr style={{ background:"#f8fafc" }}>
              {["#","Servicio", usuarioActual.rol!=="cliente"?"Cliente":"", usuarioActual.rol!=="profesional"?"Profesional":"","Fecha y hora","Estado","Acciones"].filter(Boolean).map(h => <th key={h} style={E.th}>{h}</th>)}
            </tr>
          </thead>
          <tbody>
            {filtradas.map(c => (
              <tr key={c.id} style={{ borderBottom:"1px solid #f1f5f9" }}>
                <td style={{ ...E.td, color:"#94a3b8", fontWeight:600 }}>#{c.id}</td>
                <td style={E.td}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{getNombre(servicios, c.servicioId)}</div>
                  <div style={{ fontSize:11, color:"#94a3b8" }}>{servicios.find(s=>s.id===c.servicioId)?.duracion} min</div>
                </td>
                {usuarioActual.rol !== "cliente"     && <td style={{ ...E.td, fontSize:13 }}>{getNombre(usuarios, c.clienteId)}</td>}
                {usuarioActual.rol !== "profesional" && <td style={{ ...E.td, fontSize:13 }}>{getNombre(usuarios, c.profesionalId)}</td>}
                <td style={E.td}>
                  <div style={{ fontWeight:600, fontSize:13 }}>{c.fechaHora.split("T")[0].split("-").reverse().join("/")}</div>
                  <div style={{ fontSize:11, color:"#64748b" }}>{c.fechaHora.split("T")[1]}</div>
                </td>
                <td style={E.td}>
                  <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:ESTADO_BG[c.estado], color:ESTADO_COLOR[c.estado] }}>
                    {ESTADO_LABEL[c.estado]}
                  </span>
                </td>
                <td style={E.td}>
                  <div style={{ display:"flex", gap:6 }}>
                    <button style={E.btnTabla} onClick={() => setCitaDetalle(c)}>👁️ Ver</button>
                    {c.estado === "pendiente" && (usuarioActual.rol === "profesional" || usuarioActual.rol === "admin") && (
                      <button style={{ ...E.btnTabla, background:"#f0fdf4", color:"#16a34a" }} onClick={() => cambiarEstado(c.id,"confirmada")}>✅ Confirmar</button>
                    )}
                    {["pendiente","confirmada"].includes(c.estado) && (usuarioActual.id === c.clienteId || usuarioActual.rol === "admin") && (
                      <button style={{ ...E.btnTabla, background:"#fef2f2", color:"#dc2626" }} onClick={() => cambiarEstado(c.id,"cancelada")}>❌ Cancelar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtradas.length === 0 && (
          <div style={{ textAlign:"center", padding:40, color:"#94a3b8" }}>
            No hay citas {filtroEstado !== "todos" ? `con estado "${ESTADO_LABEL[filtroEstado]}"` : ""}.
            {usuarioActual.rol === "cliente" && <div style={{ marginTop:8 }}><button style={{ ...E.btnPrimario, padding:"8px 18px", fontSize:12 }} onClick={() => setSeccion("agendar")}>+ Agendar mi primera cita</button></div>}
          </div>
        )}
      </div>

      {/* Modal detalle */}
      {citaDetalle && <ModalDetalleCita cita={citaDetalle} usuarios={usuarios} servicios={servicios} usuarioActual={usuarioActual} onClose={() => setCitaDetalle(null)} cambiarEstado={cambiarEstado} />}
    </div>
  );
}

function ModalDetalleCita({ cita, usuarios, servicios, usuarioActual, onClose, cambiarEstado }) {
  const servicio    = servicios.find(s => s.id === cita.servicioId);
  const cliente     = usuarios.find(u => u.id === cita.clienteId);
  const profesional = usuarios.find(u => u.id === cita.profesionalId);
  return (
    <div style={E.overlay}>
      <div style={{ ...E.modal, maxWidth:500 }}>
        <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
          <div>
            <h3 style={{ margin:0, color:"#1e293b" }}>Cita #{cita.id}</h3>
            <span style={{ padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:700, background:ESTADO_BG[cita.estado], color:ESTADO_COLOR[cita.estado] }}>{ESTADO_LABEL[cita.estado]}</span>
          </div>
          <button style={E.btnCerrar} onClick={onClose}>✕</button>
        </div>
        {[
          ["Servicio",    servicio?.nombre],
          ["Duración",    servicio?.duracion + " minutos"],
          ["Precio",      "$" + servicio?.precio?.toLocaleString()],
          ["Cliente",     cliente?.nombre],
          ["Profesional", profesional?.nombre],
          ["Fecha",       cita.fechaHora.split("T")[0].split("-").reverse().join("/")],
          ["Hora",        cita.fechaHora.split("T")[1]],
          ["Registrada",  cita.creada],
        ].map(([k,v]) => (
          <div key={k} style={E.infoRow}><span style={E.infoKey}>{k}</span><span style={E.infoVal}>{v}</span></div>
        ))}
        {cita.notas && <div style={{ marginTop:14, padding:12, background:"#f8fafc", borderRadius:8, fontSize:13, color:"#475569" }}><strong>Notas:</strong> {cita.notas}</div>}
        <div style={{ display:"flex", gap:10, marginTop:20, flexWrap:"wrap" }}>
          {cita.estado === "pendiente" && (usuarioActual.rol === "profesional" || usuarioActual.rol === "admin") && (
            <button style={{ ...E.btnPrimario, background:"#16a34a", flex:1 }} onClick={() => cambiarEstado(cita.id,"confirmada")}>✅ Confirmar cita</button>
          )}
          {cita.estado === "confirmada" && (usuarioActual.rol === "profesional" || usuarioActual.rol === "admin") && (
            <button style={{ ...E.btnPrimario, background:"#8b5cf6", flex:1 }} onClick={() => cambiarEstado(cita.id,"completada")}>🏁 Marcar completada</button>
          )}
          {["pendiente","confirmada"].includes(cita.estado) && (usuarioActual.id === cita.clienteId || usuarioActual.rol === "admin") && (
            <button style={{ ...E.btnPrimario, background:"#ef4444", flex:1 }} onClick={() => cambiarEstado(cita.id,"cancelada")}>❌ Cancelar</button>
          )}
          <button style={{ ...E.btnSecundario, flex:1 }} onClick={onClose}>Cerrar</button>
        </div>
      </div>
    </div>
  );
}

function SeccionAgendar({ citas, setCitas, usuarios, servicios, usuarioActual, mostrarNotif, setSeccion }) {
  const profesionales = usuarios.filter(u => u.rol === "profesional" && u.estado === "activo");
  const [paso, setPaso]               = useState(1);
  const [servSelec, setServSelec]     = useState(null);
  const [profSelec, setProfSelec]     = useState(null);
  const [fechaHora, setFechaHora]     = useState("");
  const [notas, setNotas]             = useState("");
  const [error, setError]             = useState("");

  const validarConflicto = () => {
    return citas.some(c => c.profesionalId === profSelec?.id && c.fechaHora === fechaHora && ["pendiente","confirmada","en_curso"].includes(c.estado));
  };

  const confirmar = () => {
    setError("");
    if (!fechaHora) { setError("Selecciona una fecha y hora."); return; }
    if (new Date(fechaHora) < new Date()) { setError("La fecha debe ser futura."); return; }
    if (validarConflicto()) { setError("El profesional ya tiene una cita en ese horario. Elige otro."); return; }
    const nueva = { id: Date.now(), clienteId: usuarioActual.id, profesionalId: profSelec.id, servicioId: servSelec.id, fechaHora, estado: "pendiente", notas, creada: new Date().toISOString().split("T")[0] };
    setCitas([...citas, nueva]);
    mostrarNotif(`¡Cita agendada para el ${fechaHora.split("T")[0].split("-").reverse().join("/")} a las ${fechaHora.split("T")[1]}!`);
    setSeccion("citas");
  };

  const pasos = ["Servicio", "Profesional", "Fecha y hora", "Confirmar"];

  return (
    <div>
      <div style={E.pageHeader}>
        <div><h2 style={E.pageTitle}>➕ Agendar Cita</h2><p style={E.pageSub}>Reserva tu cita en 4 pasos</p></div>
        <button style={E.btnSecundario} onClick={() => setSeccion("citas")}>← Volver</button>
      </div>

      {/* Indicador de pasos */}
      <div style={{ display:"flex", gap:0, marginBottom:28 }}>
        {pasos.map((p,i) => (
          <div key={p} style={{ display:"flex", alignItems:"center", flex:1 }}>
            <div style={{ display:"flex", flexDirection:"column", alignItems:"center", flex:1 }}>
              <div style={{ width:32, height:32, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", fontWeight:700, fontSize:13,
                background: paso>i+1 ? "#22c55e" : paso===i+1 ? "#1e3a5f" : "#e2e8f0",
                color: paso>=i+1 ? "#fff" : "#94a3b8" }}>
                {paso>i+1 ? "✓" : i+1}
              </div>
              <div style={{ fontSize:11, color: paso===i+1 ? "#1e3a5f" : "#94a3b8", fontWeight: paso===i+1 ? 700 : 400, marginTop:4 }}>{p}</div>
            </div>
            {i < pasos.length-1 && <div style={{ flex:1, height:2, background: paso>i+1 ? "#22c55e" : "#e2e8f0", marginBottom:20 }} />}
          </div>
        ))}
      </div>

      <div style={E.card}>
        {/* PASO 1: Servicio */}
        {paso === 1 && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:"#1e293b", marginBottom:16 }}>Selecciona el servicio</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(220px,1fr))", gap:14 }}>
              {servicios.filter(s=>s.activo).map(s => (
                <div key={s.id} onClick={() => setServSelec(s)}
                  style={{ border:`2px solid ${servSelec?.id===s.id ? "#1e3a5f" : "#e2e8f0"}`, borderRadius:12, padding:18, cursor:"pointer",
                    background: servSelec?.id===s.id ? "#eff6ff" : "#fff", transition:"all 0.15s" }}>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1e293b", marginBottom:6 }}>{s.nombre}</div>
                  <div style={{ display:"flex", gap:16, marginBottom:6 }}>
                    <span style={{ fontSize:12, color:"#3b82f6", fontWeight:600 }}>⏱ {s.duracion} min</span>
                    <span style={{ fontSize:12, color:"#22c55e", fontWeight:600 }}>💰 ${s.precio?.toLocaleString()}</span>
                  </div>
                  <div style={{ fontSize:12, color:"#64748b" }}>{s.descripcion}</div>
                </div>
              ))}
            </div>
            <div style={{ display:"flex", justifyContent:"flex-end", marginTop:20 }}>
              <button style={{ ...E.btnPrimario, opacity: servSelec ? 1 : 0.4 }} disabled={!servSelec} onClick={() => setPaso(2)}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* PASO 2: Profesional */}
        {paso === 2 && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:"#1e293b", marginBottom:16 }}>Elige el profesional</div>
            <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(200px,1fr))", gap:14 }}>
              {profesionales.map(p => (
                <div key={p.id} onClick={() => setProfSelec(p)}
                  style={{ border:`2px solid ${profSelec?.id===p.id ? "#1e3a5f" : "#e2e8f0"}`, borderRadius:12, padding:18, cursor:"pointer",
                    background: profSelec?.id===p.id ? "#eff6ff" : "#fff", transition:"all 0.15s" }}>
                  <div style={{ width:44, height:44, borderRadius:"50%", background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:18, marginBottom:10 }}>{p.nombre.charAt(0)}</div>
                  <div style={{ fontWeight:700, fontSize:14, color:"#1e293b" }}>{p.nombre}</div>
                  <div style={{ fontSize:12, color:"#64748b", marginTop:2 }}>Profesional</div>
                </div>
              ))}
              {profesionales.length === 0 && <p style={{ color:"#94a3b8", fontSize:13 }}>No hay profesionales disponibles.</p>}
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
              <button style={E.btnSecundario} onClick={() => setPaso(1)}>← Anterior</button>
              <button style={{ ...E.btnPrimario, opacity: profSelec ? 1 : 0.4 }} disabled={!profSelec} onClick={() => setPaso(3)}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* PASO 3: Fecha y hora */}
        {paso === 3 && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:"#1e293b", marginBottom:16 }}>Selecciona fecha y hora</div>
            {error && <div style={E.errorBox}>{error}</div>}
            <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:20, maxWidth:500 }}>
              <div>
                <label style={E.label}>Fecha y hora</label>
                <input style={E.input} type="datetime-local" value={fechaHora} onChange={e => { setFechaHora(e.target.value); setError(""); }}
                  min={new Date().toISOString().slice(0,16)} />
              </div>
              <div style={{ background:"#f8fafc", borderRadius:10, padding:14 }}>
                <div style={{ fontSize:12, fontWeight:700, color:"#475569", marginBottom:8, textTransform:"uppercase" }}>Resumen</div>
                <div style={E.infoRow}><span style={E.infoKey}>Servicio</span><span style={E.infoVal}>{servSelec?.nombre}</span></div>
                <div style={E.infoRow}><span style={E.infoKey}>Duración</span><span style={E.infoVal}>{servSelec?.duracion} min</span></div>
                <div style={E.infoRow}><span style={E.infoKey}>Precio</span><span style={E.infoVal}>${servSelec?.precio?.toLocaleString()}</span></div>
                <div style={E.infoRow}><span style={E.infoKey}>Profesional</span><span style={E.infoVal}>{profSelec?.nombre}</span></div>
              </div>
            </div>
            <div style={{ marginTop:16 }}>
              <label style={E.label}>Notas adicionales (opcional)</label>
              <textarea style={{ ...E.input, height:80, resize:"vertical" }} placeholder="Información adicional para el profesional..." value={notas} onChange={e => setNotas(e.target.value)} />
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", marginTop:20 }}>
              <button style={E.btnSecundario} onClick={() => setPaso(2)}>← Anterior</button>
              <button style={{ ...E.btnPrimario, opacity: fechaHora ? 1 : 0.4 }} disabled={!fechaHora} onClick={() => { setError(""); setPaso(4); }}>Siguiente →</button>
            </div>
          </div>
        )}

        {/* PASO 4: Confirmar */}
        {paso === 4 && (
          <div>
            <div style={{ fontWeight:700, fontSize:16, color:"#1e293b", marginBottom:16 }}>Confirma tu cita</div>
            {error && <div style={E.errorBox}>{error}</div>}
            <div style={{ background:"#f0fdf4", border:"2px solid #bbf7d0", borderRadius:12, padding:20, marginBottom:20 }}>
              <div style={{ fontSize:14, fontWeight:700, color:"#166534", marginBottom:14 }}>✅ Resumen de tu cita</div>
              {[
                ["Servicio",    servSelec?.nombre],
                ["Profesional", profSelec?.nombre],
                ["Fecha",       fechaHora ? fechaHora.split("T")[0].split("-").reverse().join("/") : "—"],
                ["Hora",        fechaHora ? fechaHora.split("T")[1] : "—"],
                ["Duración",    servSelec?.duracion + " minutos"],
                ["Precio",      "$" + servSelec?.precio?.toLocaleString()],
              ].map(([k,v]) => (
                <div key={k} style={E.infoRow}><span style={E.infoKey}>{k}</span><span style={{ ...E.infoVal, color:"#166534" }}>{v}</span></div>
              ))}
              {notas && <div style={{ marginTop:10, fontSize:13, color:"#475569" }}><strong>Notas:</strong> {notas}</div>}
            </div>
            <div style={{ background:"#fef3c7", borderRadius:10, padding:12, fontSize:13, color:"#92400e", marginBottom:20 }}>
              ⚠️ Tu cita quedará en estado <strong>Pendiente</strong> hasta que el profesional la confirme.
            </div>
            <div style={{ display:"flex", justifyContent:"space-between", gap:12 }}>
              <button style={E.btnSecundario} onClick={() => setPaso(3)}>← Anterior</button>
              <button style={{ ...E.btnPrimario, flex:1, background:"#16a34a", fontSize:15, padding:"13px 20px" }} onClick={confirmar}>
                ✅ Confirmar y Agendar Cita
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function SeccionServicios({ servicios, setServicios, mostrarNotif }) {
  const [modalNuevo, setModalNuevo]   = useState(false);
  const [modalEditar, setModalEditar] = useState(null);

  const toggleActivo = id => {
    setServicios(servicios.map(s => s.id === id ? { ...s, activo: !s.activo } : s));
    mostrarNotif("Estado del servicio actualizado.");
  };

  return (
    <div>
      <div style={E.pageHeader}>
        <div><h2 style={E.pageTitle}>💼 Servicios</h2><p style={E.pageSub}>Administra los servicios del sistema</p></div>
        <button style={E.btnPrimario} onClick={() => setModalNuevo(true)}>+ Nuevo Servicio</button>
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"repeat(auto-fill,minmax(260px,1fr))", gap:16 }}>
        {servicios.map(s => (
          <div key={s.id} style={{ ...E.card, borderTop:`4px solid ${s.activo ? "#22c55e" : "#e2e8f0"}`, marginBottom:0 }}>
            <div style={{ display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:10 }}>
              <div style={{ fontWeight:700, fontSize:15, color:"#1e293b" }}>{s.nombre}</div>
              <span style={{ padding:"2px 8px", borderRadius:20, fontSize:11, fontWeight:700, background:s.activo?"#f0fdf4":"#fef2f2", color:s.activo?"#166534":"#991b1b" }}>{s.activo?"Activo":"Inactivo"}</span>
            </div>
            <p style={{ fontSize:12, color:"#64748b", marginBottom:12 }}>{s.descripcion}</p>
            <div style={{ display:"flex", gap:10, marginBottom:14 }}>
              <div style={{ flex:1, textAlign:"center", background:"#eff6ff", borderRadius:8, padding:10 }}>
                <div style={{ fontWeight:800, fontSize:18, color:"#3b82f6" }}>{s.duracion}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>minutos</div>
              </div>
              <div style={{ flex:1, textAlign:"center", background:"#f0fdf4", borderRadius:8, padding:10 }}>
                <div style={{ fontWeight:800, fontSize:18, color:"#16a34a" }}>${s.precio?.toLocaleString()}</div>
                <div style={{ fontSize:11, color:"#64748b" }}>precio</div>
              </div>
            </div>
            <div style={{ display:"flex", gap:8 }}>
              <button style={{ ...E.btnTabla, flex:1 }} onClick={() => setModalEditar(s)}>✏️ Editar</button>
              <button style={{ ...E.btnTabla, flex:1, background:s.activo?"#fef3c7":"#f0fdf4" }} onClick={() => toggleActivo(s.id)}>{s.activo?"🔒 Desactivar":"🔓 Activar"}</button>
            </div>
          </div>
        ))}
      </div>
      {modalNuevo  && <ModalServicio onClose={() => setModalNuevo(false)} onGuardar={datos => { setServicios([...servicios, { id:Date.now(), ...datos }]); mostrarNotif("Servicio creado."); setModalNuevo(false); }} />}
      {modalEditar && <ModalServicio servicio={modalEditar} onClose={() => setModalEditar(null)} onGuardar={datos => { setServicios(servicios.map(s => s.id===modalEditar.id ? { ...s, ...datos } : s)); mostrarNotif("Servicio actualizado."); setModalEditar(null); }} />}
    </div>
  );
}

function ModalServicio({ servicio, onClose, onGuardar }) {
  const [form, setForm] = useState({ nombre: servicio?.nombre||"", descripcion: servicio?.descripcion||"", duracion: servicio?.duracion||30, precio: servicio?.precio||0, activo: servicio?.activo!==false });
  const [error, setError] = useState("");
  const guardar = () => {
    if (!form.nombre.trim()) { setError("El nombre es obligatorio."); return; }
    if (form.duracion < 5)   { setError("Duración mínima: 5 minutos."); return; }
    if (form.precio < 0)     { setError("El precio no puede ser negativo."); return; }
    onGuardar(form);
  };
  return (
    <div style={E.overlay}><div style={E.modal}>
      <div style={{ display:"flex", justifyContent:"space-between", alignItems:"center", marginBottom:20 }}>
        <h3 style={{ margin:0 }}>{servicio ? "Editar Servicio" : "Nuevo Servicio"}</h3>
        <button style={E.btnCerrar} onClick={onClose}>✕</button>
      </div>
      {error && <div style={E.errorBox}>{error}</div>}
      <Campo label="Nombre del servicio" value={form.nombre} onChange={v => setForm({ ...form, nombre:v })} />
      <div style={{ marginBottom:14 }}>
        <label style={E.label}>Descripción</label>
        <textarea style={{ ...E.input, height:70, resize:"vertical" }} value={form.descripcion} onChange={e => setForm({ ...form, descripcion:e.target.value })} placeholder="Descripción del servicio..." />
      </div>
      <div style={{ display:"grid", gridTemplateColumns:"1fr 1fr", gap:12 }}>
        <Campo label="Duración (min)" type="number" value={String(form.duracion)} onChange={v => setForm({ ...form, duracion:parseInt(v)||0 })} />
        <Campo label="Precio ($)" type="number" value={String(form.precio)} onChange={v => setForm({ ...form, precio:parseInt(v)||0 })} />
      </div>
      <div style={{ display:"flex", alignItems:"center", gap:8, marginBottom:20 }}>
        <input type="checkbox" id="activo-cb" checked={form.activo} onChange={e => setForm({ ...form, activo:e.target.checked })} style={{ width:16, height:16 }} />
        <label htmlFor="activo-cb" style={{ fontSize:13, color:"#475569", cursor:"pointer" }}>Servicio activo</label>
      </div>
      <div style={{ display:"flex", gap:12 }}>
        <button style={E.btnSecundario} onClick={onClose}>Cancelar</button>
        <Btn onClick={guardar}>{servicio ? "Guardar cambios" : "Crear servicio"}</Btn>
      </div>
    </div></div>
  );
}


function Campo({ label, type="text", value, onChange, placeholder, error, onEnter }) {
  return (
    <div style={{ marginBottom:14 }}>
      <label style={E.label}>{label}</label>
      <input style={{ ...E.input, ...(error ? { borderColor:"#ef4444" } : {}) }}
        type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        onKeyDown={e => e.key==="Enter" && onEnter && onEnter()} />
      {error && <p style={{ margin:"4px 0 0", fontSize:11, color:"#ef4444" }}>{error}</p>}
    </div>
  );
}

function Btn({ children, onClick, cargando }) {
  return (
    <button style={{ ...E.btnPrimario, width:"100%", opacity: cargando ? 0.7 : 1 }} onClick={onClick} disabled={cargando}>
      {children}
    </button>
  );
}


const E = {
  root:        { fontFamily:"'Segoe UI', system-ui, sans-serif", minHeight:"100vh", background:"#f1f5f9" },
  notif:       { position:"fixed", top:20, right:20, zIndex:9999, padding:"12px 20px", borderRadius:10, color:"#fff", fontWeight:600, fontSize:13, boxShadow:"0 4px 20px rgba(0,0,0,0.2)" },
  authBg:      { minHeight:"100vh", background:"linear-gradient(135deg, #0f172a 0%, #1e3a5f 50%, #0f172a 100%)", display:"flex", alignItems:"center", justifyContent:"center", padding:20 },
  authCard:    { background:"#fff", borderRadius:20, padding:"36px 40px", width:"100%", maxWidth:420, boxShadow:"0 25px 60px rgba(0,0,0,0.4)" },
  authHeader:  { textAlign:"center", marginBottom:28 },
  logoIcon:    { fontSize:40, marginBottom:8 },
  logoTitulo:  { margin:"0 0 4px", fontSize:26, fontWeight:800, color:"#0f172a", letterSpacing:-0.5 },
  logoSub:     { margin:"0 0 4px", fontSize:12, color:"#475569" },
  logoInst:    { margin:0, fontSize:11, color:"#94a3b8" },
  formTitulo:  { margin:"0 0 20px", fontSize:18, fontWeight:700, color:"#1e293b" },
  errorBox:    { background:"#fef2f2", border:"1px solid #fecaca", borderRadius:8, padding:"10px 14px", marginBottom:14, fontSize:12, color:"#dc2626" },
  linkTexto:   { textAlign:"center", fontSize:13, color:"#64748b", marginTop:16 },
  link:        { color:"#3b82f6", fontWeight:600, cursor:"pointer", textDecoration:"underline" },
  demoBox:     { marginTop:16, padding:12, background:"#f8fafc", borderRadius:8, border:"1px dashed #e2e8f0" },
  dashLayout:  { display:"flex", minHeight:"100vh" },
  sidebar:     { width:220, background:"#0f172a", display:"flex", flexDirection:"column", flexShrink:0 },
  sideHeader:  { display:"flex", alignItems:"center", gap:10, padding:"20px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)" },
  sideUser:    { display:"flex", alignItems:"center", gap:10, padding:"14px 16px", borderBottom:"1px solid rgba(255,255,255,0.08)", marginBottom:8 },
  avatar:      { width:36, height:36, borderRadius:"50%", background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:15, flexShrink:0 },
  navItem:     { display:"flex", alignItems:"center", gap:10, padding:"10px 16px", fontSize:13, color:"#94a3b8", cursor:"pointer", borderRadius:8, margin:"2px 8px", transition:"all 0.15s" },
  navItemActive:{ background:"#1e3a5f", color:"#fff" },
  badge:       { fontSize:9, background:"#334155", color:"#94a3b8", padding:"2px 6px", borderRadius:10, fontWeight:600 },
  sideFooter:  { padding:"14px 16px", fontSize:13, color:"#64748b", cursor:"pointer", display:"flex", alignItems:"center", gap:8, borderTop:"1px solid rgba(255,255,255,0.08)" },
  mainContent: { flex:1, padding:30, overflowY:"auto" },
  pageHeader:  { display:"flex", justifyContent:"space-between", alignItems:"flex-start", marginBottom:24, flexWrap:"wrap", gap:12 },
  pageTitle:   { margin:"0 0 4px", fontSize:22, fontWeight:800, color:"#0f172a" },
  pageSub:     { margin:0, fontSize:13, color:"#64748b" },
  rolTag:      { padding:"6px 14px", borderRadius:20, fontSize:12, fontWeight:700 },
  statsGrid:   { display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:16, marginBottom:24 },
  statCard:    { background:"#fff", borderRadius:12, padding:20, textAlign:"center", boxShadow:"0 1px 4px rgba(0,0,0,0.06)" },
  modulosGrid: { display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:16 },
  moduloCard:  { borderRadius:12, padding:20, border:"2px solid" },
  moduloActivo:{ background:"#f0fdf4", borderColor:"#22c55e" },
  moduloProximo:{ background:"#f8fafc", borderColor:"#e2e8f0" },
  card:        { background:"#fff", borderRadius:14, padding:24, boxShadow:"0 1px 4px rgba(0,0,0,0.06)", marginBottom:20 },
  cardTitle:   { margin:"0 0 16px", fontSize:15, fontWeight:700, color:"#1e293b" },
  dosCol:      { display:"grid", gridTemplateColumns:"1fr 1fr", gap:20 },
  avatarGrande:{ width:64, height:64, borderRadius:"50%", background:"#3b82f6", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:800, fontSize:28, margin:"0 auto 20px" },
  infoRow:     { display:"flex", justifyContent:"space-between", padding:"10px 0", borderBottom:"1px solid #f1f5f9" },
  infoKey:     { fontSize:12, color:"#94a3b8", fontWeight:600, textTransform:"uppercase", letterSpacing:0.5 },
  infoVal:     { fontSize:13, color:"#1e293b", fontWeight:500 },
  th:          { padding:"12px 14px", textAlign:"left", fontSize:11, fontWeight:700, color:"#64748b", textTransform:"uppercase", letterSpacing:0.5 },
  td:          { padding:"12px 14px", fontSize:13 },
  avatarSmall: { width:28, height:28, borderRadius:"50%", display:"flex", alignItems:"center", justifyContent:"center", color:"#fff", fontWeight:700, fontSize:12, flexShrink:0 },
  rolChip:     { padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 },
  estadoChip:  { padding:"3px 10px", borderRadius:20, fontSize:11, fontWeight:600 },
  btnTabla:    { border:"none", background:"#f1f5f9", borderRadius:6, padding:"5px 10px", cursor:"pointer", fontSize:13 },
  label:       { display:"block", fontSize:12, fontWeight:600, color:"#475569", marginBottom:6, textTransform:"uppercase", letterSpacing:0.3 },
  input:       { width:"100%", padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1e293b", outline:"none", boxSizing:"border-box", background:"#f8fafc" },
  select:      { width:"100%", padding:"10px 14px", border:"1px solid #e2e8f0", borderRadius:8, fontSize:13, color:"#1e293b", background:"#f8fafc", boxSizing:"border-box" },
  btnPrimario: { background:"#1e3a5f", color:"#fff", border:"none", borderRadius:10, padding:"12px 20px", fontSize:13, fontWeight:700, cursor:"pointer", letterSpacing:0.3 },
  btnSecundario:{ background:"#f1f5f9", color:"#475569", border:"1px solid #e2e8f0", borderRadius:10, padding:"10px 16px", fontSize:13, fontWeight:600, cursor:"pointer" },
  overlay:     { position:"fixed", inset:0, background:"rgba(0,0,0,0.5)", display:"flex", alignItems:"center", justifyContent:"center", zIndex:1000, padding:20 },
  modal:       { background:"#fff", borderRadius:16, padding:28, width:"100%", maxWidth:460, boxShadow:"0 25px 60px rgba(0,0,0,0.3)", maxHeight:"90vh", overflowY:"auto" },
  btnCerrar:   { background:"#f1f5f9", border:"none", borderRadius:8, width:32, height:32, cursor:"pointer", fontSize:14, color:"#64748b" },
};
