package com.unitask.unitask.controller;

import com.unitask.unitask.dto.GrupoDTO;
import com.unitask.unitask.model.Grupo;
import com.unitask.unitask.model.GrupoMembro;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.service.GrupoService;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/grupos")
@RequiredArgsConstructor
public class GrupoController {

    private final GrupoService grupoService;
    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<GrupoDTO.Response> criar(@RequestBody GrupoDTO.Request request) {
        Usuario admin = usuarioService.buscarPorId(request.getIdAdmin())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));

        Grupo grupo = new Grupo();
        grupo.setAdmin(admin);
        grupo.setNome(request.getNome());
        grupo.setDescricao(request.getDescricao());

        Grupo salvo = grupoService.criar(grupo);
        return ResponseEntity.ok(toResponse(salvo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GrupoDTO.Response> buscarPorId(@PathVariable Integer id) {
        return grupoService.buscarPorId(id)
                .map(g -> ResponseEntity.ok(toResponse(g)))
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping("/entrar")
    public ResponseEntity<Void> entrarNoGrupo(@RequestBody GrupoDTO.EntrarRequest request) {
        Usuario usuario = usuarioService.buscarPorId(request.getIdUsuario())
                .orElseThrow(() -> new RuntimeException("Usuário não encontrado"));
        grupoService.entrarNoGrupo(request.getCodigoConvite(), usuario);
        return ResponseEntity.ok().build();
    }

    @GetMapping("/{id}/membros")
    public ResponseEntity<List<String>> listarMembros(@PathVariable Integer id) {
        List<String> membros = grupoService.listarMembros(id)
                .stream()
                .map(m -> m.getUsuario().getNome() + " (" + m.getPapel() + ")")
                .collect(Collectors.toList());
        return ResponseEntity.ok(membros);
    }

    @GetMapping("/usuario/{idUsuario}")
    public ResponseEntity<List<GrupoDTO.Response>> listarGruposDoUsuario(@PathVariable Integer idUsuario) {
        List<GrupoDTO.Response> lista = grupoService.listarGruposDoUsuario(idUsuario)
                .stream()
                .map(GrupoMembro::getGrupo)
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        grupoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private GrupoDTO.Response toResponse(Grupo g) {
        GrupoDTO.Response response = new GrupoDTO.Response();
        response.setIdGrupo(g.getIdGrupo());
        response.setNome(g.getNome());
        response.setDescricao(g.getDescricao());
        response.setCodigoConvite(g.getCodigoConvite());
        response.setCriadoEm(g.getCriadoEm() != null ? g.getCriadoEm().toString() : null);
        response.setIdAdmin(g.getAdmin().getIdUsuario());
        return response;
    }
}