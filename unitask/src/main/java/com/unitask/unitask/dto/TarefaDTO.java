package com.unitask.unitask.dto;

import com.unitask.unitask.model.Tarefa;
import lombok.Data;

public class TarefaDTO {

    @Data
    public static class Request {
        private Integer idUsuario;
        private String titulo;
        private String descricao;
        private Tarefa.Prioridade prioridade;
        private String prazo;
    }

    @Data
    public static class UpdateRequest {
        private String titulo;
        private String descricao;
        private Tarefa.Prioridade prioridade;
        private String prazo;
    }

    @Data
    public static class Response {
        private Integer idTarefa;
        private String titulo;
        private String descricao;
        private Tarefa.Prioridade prioridade;
        private Tarefa.Status status;
        private String prazo;
        private String concluidoEm;
        private String criadoEm;
        private Integer idUsuario;
    }
}