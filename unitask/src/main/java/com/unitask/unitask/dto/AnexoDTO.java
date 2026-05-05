package com.unitask.unitask.dto;

import lombok.Data;

public class AnexoDTO {

    @Data
    public static class Request {
        private Integer idTarefa;
        private Integer idUsuario;
        private String nomeArquivo;
        private String url;
    }

    @Data
    public static class Response {
        private Integer idAnexo;
        private Integer idTarefa;
        private Integer idUsuario;
        private String nomeUsuario;
        private String nomeArquivo;
        private String url;
        private String criadoEm;
    }
}
