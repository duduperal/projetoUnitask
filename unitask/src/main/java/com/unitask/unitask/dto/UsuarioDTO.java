package com.unitask.unitask.dto;

import lombok.Data;

public class UsuarioDTO {

    @Data
    public static class Request {
        private String nome;
        private String email;
        private String senha;
    }

    @Data
    public static class Response {
        private Integer idUsuario;
        private String nome;
        private String email;
        private String criadoEm;
        private String fotoPerfil;
    }

    @Data
    public static class FotoRequest {
        private String fotoPerfil;
    }
}