package com.unitask.unitask.controller;

import com.unitask.unitask.dto.TarefaDTO;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.service.TarefaService;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tarefas")
@RequiredArgsConstructor
public class TarefaController {

    private final TarefaService tarefaService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<TarefaDTO.Response> criar(@RequestBody TarefaDTO.Request request) {
        Usuario usuario = usuarioService.buscarPorId(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Tarefa tarefa = new Tarefa();
        tarefa.setUsuario(usuario);
        tarefa.setTitulo(request.getTitulo());
        tarefa.setDescricao(request.getDescricao());
        tarefa.setPrioridade(request.getPrioridade());
        if (request.getPrazo() != null) {
            tarefa.setPrazo(LocalDateTime.parse(request.getPrazo()));
        }

        Tarefa salva = tarefaService.criar(tarefa);
        return ResponseEntity.ok(toResponse(salva));
    }

    @GetMapping("/{id}")
    public ResponseEntity<TarefaDTO.Response> buscarPorId(@PathVariable Integer id) {
        return tarefaService.buscarPorId(id)
                .map(t -> ResponseEntity.ok(toResponse(t)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<TarefaDTO.Response>> listarPorUsuario(@PathVariable Integer idUsuario) {
        List<TarefaDTO.Response> lista = tarefaService.listarPorUsuario(idUsuario)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @PutMapping("/{id}")
    public ResponseEntity<TarefaDTO.Response> atualizar(@PathVariable Integer id, @RequestBody TarefaDTO.UpdateRequest request) {
        Tarefa tarefa = tarefaService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        tarefa.setTitulo(request.getTitulo());
        tarefa.setDescricao(request.getDescricao());
        tarefa.setPrioridade(request.getPrioridade());
        if (request.getPrazo() != null && !request.getPrazo().isEmpty()) {
            tarefa.setPrazo(LocalDateTime.parse(request.getPrazo()));
        } else {
            tarefa.setPrazo(null);
        }
        Tarefa atualizada = tarefaService.atualizar(tarefa);
        return ResponseEntity.ok(toResponse(atualizada));
    }

    @PutMapping("/{id}/reabrir")
    public ResponseEntity<TarefaDTO.Response> reabrir(@PathVariable Integer id) {
        Tarefa tarefa = tarefaService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        tarefa.setStatus(Tarefa.Status.pendente);
        tarefa.setConcluidoEm(null);
        Tarefa reaberta = tarefaService.atualizar(tarefa);
        return ResponseEntity.ok(toResponse(reaberta));
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<TarefaDTO.Response> concluir(@PathVariable Integer id) {
        Tarefa concluida = tarefaService.concluir(id);
        return ResponseEntity.ok(toResponse(concluida));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        tarefaService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private TarefaDTO.Response toResponse(Tarefa t) {
        TarefaDTO.Response response = new TarefaDTO.Response();
        response.setIdTarefa(t.getIdTarefa());
        response.setTitulo(t.getTitulo());
        response.setDescricao(t.getDescricao());
        response.setPrioridade(t.getPrioridade());
        response.setStatus(t.getStatus());
        response.setPrazo(t.getPrazo() != null ? t.getPrazo().toString() : null);
        response.setConcluidoEm(t.getConcluidoEm() != null ? t.getConcluidoEm().toString() : null);
        response.setCriadoEm(t.getCriadoEm() != null ? t.getCriadoEm().toString() : null);
        response.setIdUsuario(t.getUsuario().getIdUsuario());
        return response;
    }
}