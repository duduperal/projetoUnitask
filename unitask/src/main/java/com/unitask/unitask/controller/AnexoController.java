package com.unitask.unitask.controller;

import com.unitask.unitask.dto.AnexoDTO;
import com.unitask.unitask.model.Anexo;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.service.AnexoService;
import com.unitask.unitask.service.TarefaService;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/anexos")
@RequiredArgsConstructor
public class AnexoController {

    private final AnexoService anexoService;
    private final TarefaService tarefaService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<AnexoDTO.Response> criar(@RequestBody AnexoDTO.Request request) {
        Tarefa tarefa = tarefaService.buscarPorId(request.getIdTarefa())
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        Usuario usuario = usuarioService.buscarPorId(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Anexo anexo = new Anexo();
        anexo.setTarefa(tarefa);
        anexo.setUsuario(usuario);
        anexo.setNomeArquivo(request.getNomeArquivo());
        anexo.setUrl(request.getUrl());

        Anexo salvo = anexoService.criar(anexo);
        return ResponseEntity.ok(toResponse(salvo));
    }

    @GetMapping("/tarefa/{idTarefa}")
    public ResponseEntity<List<AnexoDTO.Response>> listarPorTarefa(@PathVariable Integer idTarefa) {
        List<AnexoDTO.Response> lista = anexoService.listarPorTarefa(idTarefa)
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        anexoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private AnexoDTO.Response toResponse(Anexo a) {
        AnexoDTO.Response response = new AnexoDTO.Response();
        response.setIdAnexo(a.getIdAnexo());
        response.setIdTarefa(a.getTarefa().getIdTarefa());
        response.setIdUsuario(a.getUsuario().getIdUsuario());
        response.setNomeUsuario(a.getUsuario().getNome());
        response.setNomeArquivo(a.getNomeArquivo());
        response.setUrl(a.getUrl());
        response.setCriadoEm(a.getCriadoEm() != null ? a.getCriadoEm().toString() : null);
        return response;
    }
}
