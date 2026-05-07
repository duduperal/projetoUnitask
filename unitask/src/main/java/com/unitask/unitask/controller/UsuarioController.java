package com.unitask.unitask.controller;

import com.unitask.unitask.dto.UsuarioDTO;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.service.UsuarioService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;
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

    /**
     * Atualiza ou remove a foto de perfil do usuario autenticado.
     * Aceita data URL base64 ate ~700KB (cobertura para fotos comprimidas a 200KB
     * em base64). Passar fotoPerfil null/vazio remove a foto atual.
     */
    @PutMapping("/{id}/foto")
    public ResponseEntity<UsuarioDTO.Response> atualizarFoto(
            @PathVariable Integer id,
            @RequestBody UsuarioDTO.FotoRequest request,
            @AuthenticationPrincipal Usuario autenticado) {

        if (autenticado == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        if (!autenticado.getIdUsuario().equals(id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você só pode alterar sua própria foto");
        }

        String foto = request.getFotoPerfil();
        // Limita o tamanho da foto a 700.000 caracteres (~512KB de imagem real)
        if (foto != null && foto.length() > 700_000) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "A foto é muito grande. Tente uma imagem menor.");
        }

        Usuario usuario = usuarioService.buscarPorId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Usuário não encontrado"));

        usuario.setFotoPerfil(foto != null && !foto.isBlank() ? foto : null);
        Usuario salvo = usuarioService.atualizar(usuario);

        return ResponseEntity.ok(toResponse(salvo));
    }

    private UsuarioDTO.Response toResponse(Usuario u) {
        UsuarioDTO.Response response = new UsuarioDTO.Response();
        response.setIdUsuario(u.getIdUsuario());
        response.setNome(u.getNome());
        response.setEmail(u.getEmail());
        response.setCriadoEm(u.getCriadoEm() != null ? u.getCriadoEm().toString() : null);
        response.setFotoPerfil(u.getFotoPerfil());
        return response;
    }
}