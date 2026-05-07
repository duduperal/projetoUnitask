package com.unitask.unitask.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.server.ResponseStatusException;
import java.util.HashMap;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * ResponseStatusException carrega seu proprio HttpStatus — preservamos.
     * Sem este handler, o handler de RuntimeException abaixo as transformaria
     * em 400 (Bad Request) por engano.
     */
    @ExceptionHandler(ResponseStatusException.class)
    public ResponseEntity<Map<String, Object>> handleResponseStatusException(ResponseStatusException ex) {
        Map<String, Object> erro = new HashMap<>();
        erro.put("erro", ex.getReason() != null ? ex.getReason() : ex.getMessage());
        erro.put("status", ex.getStatusCode().value());
        return ResponseEntity.status(ex.getStatusCode()).body(erro);
    }

    @ExceptionHandler(RuntimeException.class)
    public ResponseEntity<Map<String, Object>> handleRuntimeException(RuntimeException ex) {
        Map<String, Object> erro = new HashMap<>();
        erro.put("erro", ex.getMessage());
        erro.put("status", HttpStatus.BAD_REQUEST.value());
        return ResponseEntity.badRequest().body(erro);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleException(Exception ex) {
        ex.printStackTrace();
        Map<String, Object> erro = new HashMap<>();
        erro.put("erro", "Erro interno do servidor: " + ex.getMessage());
        erro.put("status", HttpStatus.INTERNAL_SERVER_ERROR.value());
        return ResponseEntity.internalServerError().body(erro);
    }
}