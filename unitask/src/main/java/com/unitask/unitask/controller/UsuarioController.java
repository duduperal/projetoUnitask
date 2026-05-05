package com.unitask.unitask.controller;

import com.unitask.unitask.dto.UsuarioDTO;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/usuarios")
@RequiredArgsConstructor
public class UsuarioController {

    private final UsuarioService usuarioService;

    @PostMapping
    public ResponseEntity<UsuarioDTO.Response> registrar(@RequestBody UsuarioDTO.Request request) {
        Usuario usuario = new Usuario();
        usuario.setNome(request.getNome());
        usuario.setEmail(request.getEmail());
        usuario.setSenhaHash(request.getSenha());

        Usuario salvo = usuarioService.registrar(usuario);
        return ResponseEntity.ok(toResponse(salvo));
    }

    @GetMapping("/{id}")
    public ResponseEntity<UsuarioDTO.Response> buscarPorId(@PathVariable Integer id) {
        return usuarioService.buscarPorId(id)
                .map(u -> ResponseEntity.ok(toResponse(u)))
                .orElse(ResponseEntity.notFound().build());
    }

    @GetMapping
    public ResponseEntity<List<UsuarioDTO.Response>> listarTodos() {
        List<UsuarioDTO.Response> lista = usuarioService.listarTodos()
                .stream()
                .map(this::toResponse)
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id) {
        usuarioService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private UsuarioDTO.Response toResponse(Usuario u) {
        UsuarioDTO.Response response = new UsuarioDTO.Response();
        response.setIdUsuario(u.getIdUsuario());
        response.setNome(u.getNome());
        response.setEmail(u.getEmail());
        response.setCriadoEm(u.getCriadoEm() != null ? u.getCriadoEm().toString() : null);
        return response;
    }
}