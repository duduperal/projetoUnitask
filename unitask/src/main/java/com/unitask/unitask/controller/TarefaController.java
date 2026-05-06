package com.unitask.unitask.controller;

import com.unitask.unitask.dto.TarefaDTO;
import com.unitask.unitask.model.GrupoMembro;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.TarefaGrupo;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.GrupoMembroRepository;
import com.unitask.unitask.repository.TarefaGrupoRepository;
import com.unitask.unitask.service.TarefaService;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/tarefas")
@RequiredArgsConstructor
public class TarefaController {

    private final TarefaService tarefaService;
    private final UsuarioService usuarioService;
    private final TarefaGrupoRepository tarefaGrupoRepository;
    private final GrupoMembroRepository grupoMembroRepository;

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
    public ResponseEntity<TarefaDTO.Response> reabrir(@PathVariable Integer id,
                                                     @AuthenticationPrincipal Usuario usuario) {
        Tarefa tarefa = tarefaService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        verificarPodeAlterarStatus(tarefa, usuario);
        tarefa.setStatus(Tarefa.Status.pendente);
        tarefa.setConcluidoEm(null);
        Tarefa reaberta = tarefaService.atualizar(tarefa);
        return ResponseEntity.ok(toResponse(reaberta));
    }

    @PutMapping("/{id}/concluir")
    public ResponseEntity<TarefaDTO.Response> concluir(@PathVariable Integer id,
                                                      @AuthenticationPrincipal Usuario usuario) {
        Tarefa tarefa = tarefaService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        verificarPodeAlterarStatus(tarefa, usuario);
        Tarefa concluida = tarefaService.concluir(id);
        return ResponseEntity.ok(toResponse(concluida));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        tarefaService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    /**
     * Regra: se a tarefa está compartilhada em algum grupo,
     * apenas o admin do grupo pode marcar/reabrir.
     * Se não está em nenhum grupo, apenas o dono da tarefa pode.
     */
    private void verificarPodeAlterarStatus(Tarefa tarefa, Usuario usuario) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        List<TarefaGrupo> grupos = tarefaGrupoRepository.findByTarefaIdTarefa(tarefa.getIdTarefa());

        if (grupos.isEmpty()) {
            // Tarefa pessoal — só o dono pode
            if (!tarefa.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Apenas o dono da tarefa pode alterar o status");
            }
            return;
        }

        // Tarefa em grupo — só admin de algum grupo onde está compartilhada
        boolean ehAdminDeAlgumGrupo = grupos.stream().anyMatch(tg ->
                grupoMembroRepository.findByUsuarioIdUsuarioAndGrupoIdGrupo(
                        usuario.getIdUsuario(), tg.getGrupo().getIdGrupo())
                        .map(m -> m.getPapel() == GrupoMembro.Papel.admin)
                        .orElse(false));

        if (!ehAdminDeAlgumGrupo) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Apenas o admin do grupo pode marcar tarefas compartilhadas como concluídas");
        }
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
        response.setIdsGrupos(tarefaGrupoRepository.findByTarefaIdTarefa(t.getIdTarefa())
                .stream()
                .map(tg -> tg.getGrupo().getIdGrupo())
                .collect(Collectors.toList()));
        return response;
    }
}
