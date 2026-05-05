package com.unitask.unitask.controller;

import com.unitask.unitask.dto.ComentarioDTO;
import com.unitask.unitask.model.Comentario;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.service.ComentarioService;
import com.unitask.unitask.service.TarefaService;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/comentarios")
@RequiredArgsConstructor
public class ComentarioController {

    private final ComentarioService comentarioService;
    private final TarefaService tarefaService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<ComentarioDTO.Response> criar(@RequestBody ComentarioDTO.Request request) {
        Tarefa tarefa = tarefaService.buscarPorId(request.getIdTarefa())
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        Usuario usuario = usuarioService.buscarPorId(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Comentario comentario = new Comentario();
        comentario.setTarefa(tarefa);
        comentario.setUsuario(usuario);
        comentario.setConteudo(request.getConteudo());

        Comentario salvo = comentarioService.criar(comentario);
        return ResponseEntity.ok(toResponse(salvo));
    }

    @GetMapping("/tarefa/{idTarefa}")
    public ResponseEntity<List<ComentarioDTO.Response>> listarPorTarefa(@PathVariable Integer idTarefa) {
        List<ComentarioDTO.Response> lista = comentarioService.listarPorTarefa(idTarefa)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        comentarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private ComentarioDTO.Response toResponse(Comentario c) {
        ComentarioDTO.Response response = new ComentarioDTO.Response();
        response.setIdComentario(c.getIdComentario());
        response.setIdTarefa(c.getTarefa().getIdTarefa());
        response.setIdUsuario(c.getUsuario().getIdUsuario());
        response.setNomeUsuario(c.getUsuario().getNome());
        response.setConteudo(c.getConteudo());
        response.setCriadoEm(c.getCriadoEm() != null ? c.getCriadoEm().toString() : null);
        return response;
    }
}
