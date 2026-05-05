package com.unitask.unitask.dto;

import com.unitask.unitask.model.Notificacao;
import lombok.Data;

public class NotificacaoDTO {

    @Data
    public static class Response {
        private Integer idNotificacao;
        private Integer idTarefa;
        private Integer idUsuario;
        private Notificacao.Tipo tipo;
        private String mensagem;
        private String enviadoEm;
        private Boolean lido;
    }
}