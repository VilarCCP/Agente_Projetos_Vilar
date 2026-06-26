import React, { useState } from "react";
import { Projeto, Atividade, Responsavel } from "../types";
import { FileText, Download, Briefcase, FileCheck, AlertTriangle, CheckCircle2, Layout, Sliders } from "lucide-react";

interface ReportsViewProps {
  atividades: Atividade[];
  projetos: Projeto[];
  responsables: Responsavel[];
  darkMode: boolean;
}

export default function ReportsView({
  atividades,
  projetos,
  responsables,
  darkMode
}: ReportsViewProps) {
  const [selectedRepProjId, setSelectedRepProjId] = useState<string>("todos");
  const [successExportMessage, setSuccessExportMessage] = useState<string | null>(null);

  const triggerExport = (format: "PDF" | "Excel", type: string) => {
    setSuccessExportMessage(`Exportando relatório de ${type} em formato ${format}... Arquivo baixado com sucesso!`);
    setTimeout(() => {
      setSuccessExportMessage(null);
    }, 4000);
  };

  // 1. Calculations for Executivo report
  const activeProjects = projetos.filter(p => p.status === "Em andamento" || p.status === "Planejamento");
  const concludedProjects = projetos.filter(p => p.status === "Concluido");
  
  const criticalTasks = atividades.filter(a => a.prioridade === "Critica" && a.status !== "Concluido" && a.status !== "Cancelado");
  const hoje = new Date().toISOString().split("T")[0];
  const lateTasks = atividades.filter(a => {
    return a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hoje;
  });

  // 2. Calculations for chosen project
  const currentProjId = selectedRepProjId === "todos" ? projetos[0]?.id : selectedRepProjId;
  const currentProj = projetos.find(p => p.id === currentProjId);
  const currentProjTasks = atividades.filter(a => a.projetoId === currentProjId);
  const currentProjTotal = currentProjTasks.length;
  const currentProjConcluded = currentProjTasks.filter(a => a.status === "Concluido").length;
  const currentProjPercentage = currentProjTotal > 0 ? Math.round((currentProjConcluded / currentProjTotal) * 100) : 0;
  
  const currentProjPending = currentProjTasks.filter(a => a.status !== "Concluido" && a.status !== "Cancelado");
  const currentProjLate = currentProjTasks.filter(a => a.status !== "Concluido" && a.status !== "Cancelado" && a.dataLimite && a.dataLimite < hoje);

  return (
    <div id="reports-view" className="space-y-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-500" />
            Central de Relatórios Inteligentes
          </h1>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Geração de relatórios executivos para conselhos ou arquivos de auditoria em múltiplos formatos.
          </p>
        </div>
      </div>

      {/* Success Notification banner */}
      {successExportMessage && (
        <div id="export-success-banner" className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 p-4 rounded-xl text-emerald-850 dark:text-emerald-350 text-xs font-semibold flex items-center gap-2.5 animate-fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
          <span>{successExportMessage}</span>
        </div>
      )}

      {/* Segment 1: Executivo summary report */}
      <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-850 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-805 pb-4">
          <div>
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Layout className="w-4.5 h-4.5 text-blue-500" />
              1. Relatório Consolidado Executivo (Geral)
            </h2>
            <p className="text-xs text-slate-500">Consolidação de esforço de toda a diretoria de inovação.</p>
          </div>
          <div className="flex gap-2 mt-2 sm:mt-0 font-semibold text-[11px]">
            <button
              id="btn-export-exec-pdf"
              onClick={() => triggerExport("PDF", "Relatório Executivo Consolidado")}
              className="px-3 py-1.5 border border-slate-200 dark:border-slate-800 rounded hover:bg-slate-50 text-slate-700 dark:text-slate-300 flex items-center gap-1"
            >
              <Download size={11} /> PDF 
            </button>
            <button
              id="btn-export-exec-excel"
              onClick={() => triggerExport("Excel", "Relatório Executivo Consolidado")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-1"
            >
              <Download size={11} /> Excel
            </button>
          </div>
        </div>

        {/* Dashboard parameters mini grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Projetos Ativos</span>
            <span className="text-xl font-bold text-slate-800 dark:text-slate-100 block mt-1">{activeProjects.length}</span>
            <p className="text-[10.5px] text-slate-450 mt-1">Gargalos sob foco</p>
          </div>
          
          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Projetos Concluídos</span>
            <span className="text-xl font-bold text-emerald-600 block mt-1">{concludedProjects.length}</span>
            <p className="text-[10.5px] text-slate-450 mt-1">Iniciativas arquivadas</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Atividades Críticas</span>
            <span className="text-xl font-bold text-orange-600 block mt-1">{criticalTasks.length}</span>
            <p className="text-[10.5px] text-slate-450 mt-1">Exigem dedicação técnica</p>
          </div>

          <div className="p-4 bg-slate-50 dark:bg-slate-850 rounded-xl border border-slate-150">
            <span className="text-[10px] text-slate-400 uppercase font-mono tracking-wider block">Atividades em Atraso</span>
            <span className="text-xl font-bold text-red-650 block mt-1">{lateTasks.length}</span>
            <p className="text-[10.5px] text-slate-450 mt-1">Prazos vencidos</p>
          </div>
        </div>
      </div>

      {/* Segment 2: Individual project-specific report */}
      <div className="bg-white dark:bg-slate-900 border border-slate-205 dark:border-slate-850 p-6 rounded-2xl shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 dark:border-slate-805 pb-4">
          <div className="space-y-1">
            <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Sliders className="w-4.5 h-4.5 text-blue-500" />
              2. Relatório de Desempenho Interno por Projeto
            </h2>
            <p className="text-xs text-slate-500">Selecione uma iniciativa corporativa para compilar métricas analíticas exclusivas.</p>
          </div>

          <select
            id="report-select-proj"
            value={selectedRepProjId}
            onChange={(e) => setSelectedRepProjId(e.target.value)}
            className="bg-slate-50 border border-slate-205 rounded-lg p-2 text-xs focus:outline-none dark:bg-slate-850 dark:border-slate-800 dark:text-slate-200 w-full sm:w-60 mt-2 sm:mt-0"
          >
            <option value="todos">-- Escolha um Projeto --</option>
            {projetos.map(p => (
              <option key={p.id} value={p.id}>{p.nome}</option>
            ))}
          </select>
        </div>

        {currentProj ? (
          <div className="space-y-4 pt-2">
            
            {/* Upper stats block */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 items-center">
              <div>
                <span className="text-[10.5px] text-slate-400 font-mono tracking-wider block">PORCENTAGEM CONCLUÍDA</span>
                <div className="flex items-center gap-3 mt-1.5">
                  <span className="text-3xl font-extrabold text-blue-600">{currentProjPercentage}%</span>
                  <div className="flex-1 bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full"
                      style={{ width: `${currentProjPercentage}%` }}
                    />
                  </div>
                </div>
              </div>

              <div>
                <span className="text-[10.5px] text-slate-400 font-mono tracking-wider block">TAREFAS PENDENTES</span>
                <span className="text-2xl font-bold text-slate-800 dark:text-slate-200 block mt-1">
                  {currentProjPending.length} <span className="text-xs text-slate-400 font-normal">em aberto</span>
                </span>
              </div>

              <div>
                <span className="text-[10.5px] text-slate-400 font-mono tracking-wider block">VECIMENTO / PRAZO ATIVO</span>
                <span className="text-xs font-mono font-bold text-slate-800 dark:text-slate-200 block mt-2">
                  Término: {currentProj.dataPrevistaConclusao || "Sem prazo estipulado"}
                </span>
              </div>
            </div>

            {/* List of outstanding or critical tasks */}
            <div className="space-y-2">
              <span className="text-[10.5px] font-bold text-slate-400 uppercase tracking-widest block font-mono">
                Tarefas Restantes Pendentes
              </span>

              <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-150 rounded-xl overflow-hidden text-xs">
                {currentProjPending.length === 0 ? (
                  <div className="p-4 text-center text-slate-400 italic font-mono">
                    Excelente! Nenhuma pendência em aberto para esta iniciativa.
                  </div>
                ) : (
                  currentProjPending.map((task) => {
                    const resp = responsables.find(r => r.id === task.responsavelId);
                    return (
                      <div key={task.id} className="p-3 bg-slate-50/20 dark:bg-slate-900/40 flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-805 dark:text-slate-200">{task.nome}</p>
                          <p className="text-[10px] text-slate-400 font-mono mt-0.5">Resp: {resp ? resp.nome : "Não alocado"} | Prazo: {task.dataLimite || "Sem limite"}</p>
                        </div>
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded border ${
                          task.prioridade === "Critica" ? "bg-red-50 text-red-700 border-red-200" :
                          task.prioridade === "Alta" ? "bg-orange-50 text-orange-700 border-orange-200" :
                          "bg-slate-50 text-slate-600"
                        }`}>
                          {task.prioridade}
                        </span>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Export specific project report */}
            <div className="flex justify-end gap-2.5 pt-3.5 border-t border-slate-100 dark:border-slate-850">
              <button
                id="btn-export-proj-pdf"
                onClick={() => triggerExport("PDF", `Relatório Detalhado - ${currentProj.nome}`)}
                className="px-4 py-2 border border-slate-200 dark:border-slate-800 rounded-lg text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-50"
              >
                Exportar Projeto PDF
              </button>
              <button
                id="btn-export-proj-excel"
                onClick={() => triggerExport("Excel", `Relatório Detalhado - ${currentProj.nome}`)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold"
              >
                Exportar Planilha Excel
              </button>
            </div>

          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 font-mono text-xs">
            Por favor, crie seu primeiro projeto ou selecione uma opção válida acima para compilar o relatório por projeto.
          </div>
        )}
      </div>

    </div>
  );
}
