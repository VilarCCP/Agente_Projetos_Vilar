import express from "express";
import path from "path";
import fs from "fs";
import { createServer as createViteServer } from "vite";
import { Demanda, Projeto, Atividade, Responsavel, Comentario, Anexo, HistoricoAtividade } from "./src/types";

const app = express();
const PORT = 3000;

// Database File Path
const DB_FILE = path.join(process.cwd(), "database.json");

// Define Database Schema
interface DbSchema {
  demandas: Demanda[];
  projetos: Projeto[];
  responsables: Responsavel[];
  atividades: Atividade[];
  comentarios: Comentario[];
  anexos: Anexo[];
  historico: HistoricoAtividade[];
}

// Default Seed Data
const defaultDb: DbSchema = {
  responsables: [
    { id: "r1", nome: "Vilar", cargo: "Gerente de Inovação e Projetos", area: "Inovação", email: "vilar@empresa.com", telefone: "" }
  ],
  projetos: [],
  demandas: [],
  atividades: [],
  comentarios: [],
  anexos: [],
  historico: []
};

// Helper: Read DB
function getDb(): DbSchema {
  try {
    if (!fs.existsSync(DB_FILE)) {
      fs.writeFileSync(DB_FILE, JSON.stringify(defaultDb, null, 2), "utf8");
      return defaultDb;
    }
    const data = fs.readFileSync(DB_FILE, "utf8");
    return JSON.parse(data);
  } catch (err) {
    console.error("Erro ao ler banco de dados JSON:", err);
    return defaultDb;
  }
}

// Helper: Write DB
function saveDb(data: DbSchema) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), "utf8");
  } catch (err) {
    console.error("Erro ao salvar no banco de dados JSON:", err);
  }
}

app.use(express.json({ limit: "50mb" }));

// --- API ROUTES ---

// 1. DEMANDAS API
app.get("/api/demandas", (req, res) => {
  const db = getDb();
  res.json(db.demandas);
});

app.post("/api/demandas", (req, res) => {
  const db = getDb();
  const nova: Demanda = {
    id: "dem_" + Math.random().toString(36).substr(2, 9),
    titulo: req.body.titulo || "",
    descricao: req.body.descricao || "",
    solicitante: req.body.solicitante || "Não informado",
    dataRecebimento: req.body.dataRecebimento || new Date().toISOString().split("T")[0],
    prioridade: req.body.prioridade || "Media",
    status: req.body.status || "Nova",
  };
  db.demandas.push(nova);
  saveDb(db);
  res.status(201).json(nova);
});

app.put("/api/demandas/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const idx = db.demandas.findIndex((d) => d.id === id);
  if (idx !== -1) {
    db.demandas[idx] = { ...db.demandas[idx], ...req.body };
    saveDb(db);
    res.json(db.demandas[idx]);
  } else {
    res.status(404).json({ error: "Demanda não encontrada" });
  }
});

// Convert Demand to Project with One-Click
app.post("/api/demandas/:id/converter", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const idx = db.demandas.findIndex((d) => d.id === id);
  if (idx === -1) {
    return res.status(404).json({ error: "Demanda não encontrada" });
  }

  const demanda = db.demandas[idx];
  
  // Create Project based on demand details
  const novoProjetoId = "proj_" + Math.random().toString(36).substr(2, 9);
  const novoProjeto: Projeto = {
    id: novoProjetoId,
    nome: demanda.titulo,
    descricao: demanda.descricao,
    area: "Inovação", // Default area
    dataInicio: new Date().toISOString().split("T")[0],
    dataPrevistaConclusao: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000).toISOString().split("T")[0], // Default 60 days
    prioridade: demanda.prioridade,
    status: "Planejamento"
  };

  db.projetos.push(novoProjeto);

  // Update demand status and link
  demanda.status = "Transformada em Projeto";
  demanda.projetoCriadoId = novoProjetoId;

  saveDb(db);
  res.json({ success: true, projeto: novoProjeto, demanda });
});

app.delete("/api/demandas/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  db.demandas = db.demandas.filter((d) => d.id !== id);
  saveDb(db);
  res.json({ success: true });
});


// 2. PROJETOS API
app.get("/api/projetos", (req, res) => {
  const db = getDb();
  res.json(db.projetos);
});

app.post("/api/projetos", (req, res) => {
  const db = getDb();
  const novo: Projeto = {
    id: "proj_" + Math.random().toString(36).substr(2, 9),
    nome: req.body.nome || "",
    descricao: req.body.descricao || "",
    area: req.body.area || "Geral",
    dataInicio: req.body.dataInicio || new Date().toISOString().split("T")[0],
    dataPrevistaConclusao: req.body.dataPrevistaConclusao || "",
    prioridade: req.body.prioridade || "Media",
    status: req.body.status || "Planejamento",
  };
  db.projetos.push(novo);
  saveDb(db);
  res.status(201).json(novo);
});

app.put("/api/projetos/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const idx = db.projetos.findIndex((p) => p.id === id);
  if (idx !== -1) {
    db.projetos[idx] = { ...db.projetos[idx], ...req.body };
    saveDb(db);
    res.json(db.projetos[idx]);
  } else {
    res.status(404).json({ error: "Projeto não encontrado" });
  }
});

app.delete("/api/projetos/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;

  // Cascade delete or keep orphan tasks? Let's cascade delete related tasks, comments, and attachments to function like directories/folders
  const tasksToDelete = db.atividades.filter((a) => a.projetoId === id).map((a) => a.id);
  
  db.projetos = db.projetos.filter((p) => p.id !== id);
  db.atividades = db.atividades.filter((a) => a.projetoId !== id);
  db.comentarios = db.comentarios.filter((c) => !tasksToDelete.includes(c.atividadeId));
  db.anexos = db.anexos.filter((ax) => !tasksToDelete.includes(ax.atividadeId));
  db.historico = db.historico.filter((h) => !tasksToDelete.includes(h.atividadeId));

  saveDb(db);
  res.json({ success: true });
});


// 3. RESPONSÁVEIS API
app.get("/api/responsables", (req, res) => {
  const db = getDb();
  res.json(db.responsables);
});

app.post("/api/responsables", (req, res) => {
  const db = getDb();
  const novo: Responsavel = {
    id: "resp_" + Math.random().toString(36).substr(2, 9),
    nome: req.body.nome || "",
    cargo: req.body.cargo || "",
    area: req.body.area || "",
    email: req.body.email || "",
    telefone: req.body.telefone || ""
  };
  db.responsables.push(novo);
  saveDb(db);
  res.status(201).json(novo);
});

app.put("/api/responsables/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const idx = db.responsables.findIndex((r) => r.id === id);
  if (idx !== -1) {
    db.responsables[idx] = { ...db.responsables[idx], ...req.body };
    saveDb(db);
    res.json(db.responsables[idx]);
  } else {
    res.status(404).json({ error: "Responsável não encontrado" });
  }
});

app.delete("/api/responsables/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  
  // Filter out the responsibles
  db.responsables = db.responsables.filter((r) => r.id !== id);
  
  // Reassign to default if needed (clear or assign to empty string in activities)
  db.atividades = db.atividades.map((a) => {
    if (a.responsavelId === id) {
      return { ...a, responsavelId: "" };
    }
    return a;
  });

  saveDb(db);
  res.json({ success: true });
});


// 4. ATIVIDADES API
app.get("/api/atividades", (req, res) => {
  const db = getDb();
  res.json(db.atividades);
});

app.post("/api/atividades", (req, res) => {
  const db = getDb();
  const nova: Atividade = {
    id: "ativ_" + Math.random().toString(36).substr(2, 9),
    projetoId: req.body.projetoId || "",
    nome: req.body.nome || "",
    descricao: req.body.descricao || "",
    responsavelId: req.body.responsavelId || "",
    dataInicio: req.body.dataInicio || new Date().toISOString().split("T")[0],
    dataLimite: req.body.dataLimite || "",
    prioridade: req.body.prioridade || "Media",
    status: req.body.status || "Pendente"
  };
  
  db.atividades.push(nova);

  // Add initial history entry
  const hist: HistoricoAtividade = {
    id: "hist_" + Math.random().toString(36).substr(2, 9),
    atividadeId: nova.id,
    descricao: `Atividade criada`,
    data: new Date().toISOString().replace("T", " ").substring(0, 16)
  };
  db.historico.push(hist);

  saveDb(db);
  res.status(201).json(nova);
});

app.put("/api/atividades/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const idx = db.atividades.findIndex((a) => a.id === id);
  if (idx !== -1) {
    const antiga = db.atividades[idx];
    const novaVal = { ...antiga, ...req.body };
    db.atividades[idx] = novaVal;

    // Detect modifications for automated history logs
    const hists: HistoricoAtividade[] = [];
    const timestamp = new Date().toISOString().replace("T", " ").substring(0, 16);

    if (antiga.status !== novaVal.status) {
      hists.push({
        id: "hist_" + Math.random().toString(36).substr(2, 9),
        atividadeId: id,
        descricao: `Status alterado para ${novaVal.status}`,
        data: timestamp
      });
    }

    if (antiga.dataLimite !== novaVal.dataLimite) {
      hists.push({
        id: "hist_" + Math.random().toString(36).substr(2, 9),
        atividadeId: id,
        descricao: `Prazo alterado para ${novaVal.dataLimite}`,
        data: timestamp
      });
    }

    if (antiga.responsavelId !== novaVal.responsavelId) {
      const resp = db.responsables.find(r => r.id === novaVal.responsavelId);
      hists.push({
        id: "hist_" + Math.random().toString(36).substr(2, 9),
        atividadeId: id,
        descricao: `Responsável alterado para ${resp ? resp.nome : 'Nenhum'}`,
        data: timestamp
      });
    }

    db.historico.push(...hists);
    saveDb(db);
    res.json(db.atividades[idx]);
  } else {
    res.status(404).json({ error: "Atividade não encontrada" });
  }
});

app.delete("/api/atividades/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  db.atividades = db.atividades.filter((a) => a.id !== id);
  db.comentarios = db.comentarios.filter((c) => c.atividadeId !== id);
  db.anexos = db.anexos.filter((ax) => ax.atividadeId !== id);
  db.historico = db.historico.filter((h) => h.atividadeId !== id);
  
  saveDb(db);
  res.json({ success: true });
});


// 5. COMENTARIOS API
app.get("/api/atividades/:ativId/comentarios", (req, res) => {
  const db = getDb();
  const { ativId } = req.params;
  const filtered = db.comentarios.filter((c) => c.atividadeId === ativId);
  res.json(filtered);
});

app.post("/api/atividades/:ativId/comentarios", (req, res) => {
  const db = getDb();
  const { ativId } = req.params;
  const novo: Comentario = {
    id: "com_" + Math.random().toString(36).substr(2, 9),
    atividadeId: ativId,
    autor: req.body.autor || "Vilar",
    texto: req.body.texto || "",
    data: new Date().toISOString().replace("T", " ").substring(0, 16)
  };
  db.comentarios.push(novo);

  // Log in activity history too
  const hist: HistoricoAtividade = {
    id: "hist_" + Math.random().toString(36).substr(2, 9),
    atividadeId: ativId,
    descricao: "Comentário adicionado",
    data: novo.data
  };
  db.historico.push(hist);

  saveDb(db);
  res.status(201).json(novo);
});


// 6. HISTORICO API
app.get("/api/atividades/:ativId/historico", (req, res) => {
  const db = getDb();
  const { ativId } = req.params;
  const filtered = db.historico.filter((h) => h.atividadeId === ativId);
  res.json(filtered);
});


// 7. ANEXOS API
app.get("/api/atividades/:ativId/anexos", (req, res) => {
  const db = getDb();
  const { ativId } = req.params;
  const filtered = db.anexos.filter((ax) => ax.atividadeId === ativId);
  res.json(filtered);
});

app.post("/api/atividades/:ativId/anexos", (req, res) => {
  const db = getDb();
  const { ativId } = req.params;

  let ext = "PNG";
  const name = req.body.nomeArquivo || "anexo.png";
  if (name.toLowerCase().endsWith(".pdf")) ext = "PDF";
  else if (name.toLowerCase().endsWith(".docx")) ext = "DOCX";
  else if (name.toLowerCase().endsWith(".xlsx")) ext = "XLSX";
  else if (name.toLowerCase().endsWith(".jpg") || name.toLowerCase().endsWith(".jpeg")) ext = "JPG";

  const novo: Anexo = {
    id: "ax_" + Math.random().toString(36).substr(2, 9),
    atividadeId: ativId,
    nomeArquivo: name,
    tipo: ext as any,
    tamanho: req.body.tamanho || "150 KB",
    dataAnexo: new Date().toISOString().split("T")[0]
  };

  db.anexos.push(novo);

  // Log in history
  const hist: HistoricoAtividade = {
    id: "hist_" + Math.random().toString(36).substr(2, 9),
    atividadeId: ativId,
    descricao: `Anexo adicionado: ${novo.nomeArquivo}`,
    data: new Date().toISOString().replace("T", " ").substring(0, 16)
  };
  db.historico.push(hist);

  saveDb(db);
  res.status(201).json(novo);
});

app.delete("/api/anexos/:id", (req, res) => {
  const db = getDb();
  const { id } = req.params;
  const target = db.anexos.find((a) => a.id === id);
  db.anexos = db.anexos.filter((a) => a.id !== id);
  
  if (target) {
    const hist: HistoricoAtividade = {
      id: "hist_" + Math.random().toString(36).substr(2, 9),
      atividadeId: target.atividadeId,
      descricao: `Anexo removido: ${target.nomeArquivo}`,
      data: new Date().toISOString().replace("T", " ").substring(0, 16)
    };
    db.historico.push(hist);
  }

  saveDb(db);
  res.json({ success: true });
});


// 8. DASHBOARD METRICS API (Cálculos centralizados)
app.get("/api/dashboard", (req, res) => {
  const db = getDb();
  const totalProjetos = db.projetos.length;
  const projetosAtivos = db.projetos.filter((p) => p.status === "Em andamento" || p.status === "Planejamento").length;
  const projetosPausados = db.projetos.filter((p) => p.status === "Pausado").length;
  const projetosConcluidos = db.projetos.filter((p) => p.status === "Concluido").length;

  const totalAtividades = db.atividades.length;
  const atividadesPendentes = db.atividades.filter((a) => a.status === "Pendente").length;
  const atividadesEmAndamento = db.atividades.filter((a) => a.status === "Em andamento" || a.status === "Em validacao" || a.status === "Pausado").length;
  const atividadesConcluidas = db.atividades.filter((a) => a.status === "Concluido").length;

  // Calculo de atrasadas: status != Concluido e dataLimite anterior a data atual
  const hojeStr = new Date().toISOString().split("T")[0];
  const atividadesAtrasadas = db.atividades.filter((a) => {
    return a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hojeStr;
  }).length;

  res.json({
    totalProjetos,
    projetosAtivos,
    projetosPausados,
    projetosConcluidos,
    totalAtividades,
    atividadesPendentes,
    atividadesEmAndamento,
    atividadesConcluidas,
    atividadesAtrasadas
  });
});


// 9. SYSTEM MAINTENANCE API (Reset Database)
app.post("/api/reset-db", (req, res) => {
  saveDb(defaultDb);
  res.json({ success: true, message: "Banco de dados limpo com sucesso!" });
});


// Vite connection logic for SPA / server serving
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    // Support SPA router callback
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
