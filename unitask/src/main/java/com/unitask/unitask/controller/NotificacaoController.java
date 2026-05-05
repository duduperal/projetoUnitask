package com.unitask.unitask.controller;

import com.unitask.unitask.dto.NotificacaoDTO;
import com.unitask.unitask.model.Notificacao;
import com.unitask.unitask.service.NotificacaoService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/notificacoes")
@RequiredArgsConstructor
public class NotificacaoController {

    private final NotificacaoService notificacaoService;

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<NotificacaoDTO.Response>> listarPorUsuario(@PathVariable Integer idUsuario) {
        List<NotificacaoDTO.Response> lista = notificacaoService.listarPorUsuario(idUsuario)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @GetMapping("/usuario/{idUsuario}/nao-lidas")
    public ResponseEntity<List<NotificacaoDTO.Response>> listarNaoLidas(@PathVariable Integer idUsuario) {
        List<NotificacaoDTO.Response> lista = notificacaoService.listarNaoLidas(idUsuario)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @PutMapping("/{id}/ler")
    public ResponseEntity<NotificacaoDTO.Response> marcarComoLida(@PathVariable Integer id) {
        Notificacao notificacao = notificacaoService.marcarComoLida(id);
        return ResponseEntity.ok(toResponse(notificacao));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        notificacaoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private NotificacaoDTO.Response toResponse(Notificacao n) {
        NotificacaoDTO.Response response = new NotificacaoDTO.Response();
        response.setIdNotificacao(n.getIdNotificacao());
        response.setIdTarefa(n.getTarefa().getIdTarefa());
        response.setIdUsuario(n.getUsuario().getIdUsuario());
        response.setTipo(n.getTipo());
        response.setMensagem(n.getMensagem());
        response.setEnviadoEm(n.getEnviadoEm() != null ? n.getEnviadoEm().toString() : null);
        response.setLido(n.getLido());
        return response;
    }
}