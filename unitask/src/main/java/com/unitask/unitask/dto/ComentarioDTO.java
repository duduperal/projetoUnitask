package com.unitask.unitask.dto;

import lombok.Data;

public class ComentarioDTO {

    @Data
    public static class Request {
        private Integer idTarefa;
        private Integer idUsuario;
        private String conteudo;
    }

    @Data
    public static class Response {
        private Integer idComentario;
        private Integer idTarefa;
        private Integer idUsuario;
        private String nomeUsuario;
        private String conteudo;
        private String criadoEm;
    }
}
