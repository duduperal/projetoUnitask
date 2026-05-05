package com.unitask.unitask.dto;

import lombok.Data;

public class GrupoDTO {

    @Data
    public static class Request {
        private Integer idAdmin;
        private String nome;
        private String descricao;
    }

    @Data
    public static class Response {
        private Integer idGrupo;
        private String nome;
        private String descricao;
        private String codigoConvite;
        private String criadoEm;
        private Integer idAdmin;
    }

    @Data
    public static class EntrarRequest {
        private String codigoConvite;
        private Integer idUsuario;
    }
}