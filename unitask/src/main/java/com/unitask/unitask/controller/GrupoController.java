package com.unitask.unitask.controller;

import com.unitask.unitask.dto.GrupoDTO;
import com.unitask.unitask.dto.TarefaDTO;
import com.unitask.unitask.model.Grupo;
import com.unitask.unitask.model.GrupoMembro;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.TarefaGrupo;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.GrupoMembroRepository;
import com.unitask.unitask.repository.TarefaGrupoRepository;
import com.unitask.unitask.service.GrupoService;
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
@RequestMapping("/api/grupos")
@RequiredArgsConstructor
public class GrupoController {

    private final GrupoService grupoService;
    private final UsuarioService usuarioService;
    private final TarefaService tarefaService;
    private final TarefaGrupoRepository tarefaGrupoRepository;
    private final GrupoMembroRepository grupoMembroRepository;

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
    public ResponseEntity<List<GrupoDTO.MembroResponse>> listarMembros(@PathVariable Integer id) {
        List<GrupoDTO.MembroResponse> membros = grupoService.listarMembros(id)
                .stream()
                .map(m -> {
                    GrupoDTO.MembroResponse r = new GrupoDTO.MembroResponse();
                    r.setIdUsuario(m.getUsuario().getIdUsuario());
                    r.setNome(m.getUsuario().getNome());
                    r.setPapel(m.getPapel().name());
                    r.setFotoPerfil(m.getUsuario().getFotoPerfil());
                    return r;
                })
                .collect(Collectors.toList());
        return ResponseEntity.ok(membros);
    }

    @DeleteMapping("/{id}/membros/{idUsuario}")
    public ResponseEntity<Void> removerMembro(@PathVariable Integer id,
                                              @PathVariable Integer idUsuario,
                                              @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        try {
            grupoService.removerMembro(id, usuario.getIdUsuario(), idUsuario);
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().contains("Apenas admins")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            throw new ResponseStatusException(status, e.getMessage());
        }
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/{id}/membros/{idUsuario}/papel")
    public ResponseEntity<GrupoDTO.MembroResponse> alterarPapel(@PathVariable Integer id,
                                                                @PathVariable Integer idUsuario,
                                                                @RequestBody GrupoDTO.AlterarPapelRequest request,
                                                                @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        try {
            GrupoMembro atualizado = grupoService.alterarPapel(
                    id, usuario.getIdUsuario(), idUsuario, request.getPapel());
            GrupoDTO.MembroResponse r = new GrupoDTO.MembroResponse();
            r.setIdUsuario(atualizado.getUsuario().getIdUsuario());
            r.setNome(atualizado.getUsuario().getNome());
            r.setPapel(atualizado.getPapel().name());
            r.setFotoPerfil(atualizado.getUsuario().getFotoPerfil());
            return ResponseEntity.ok(r);
        } catch (RuntimeException e) {
            HttpStatus status = e.getMessage() != null && e.getMessage().contains("Apenas admins")
                    ? HttpStatus.FORBIDDEN
                    : HttpStatus.BAD_REQUEST;
            throw new ResponseStatusException(status, e.getMessage());
        }
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

    @GetMapping("/{id}/tarefas")
    public ResponseEntity<List<TarefaDTO.Response>> listarTarefasDoGrupo(@PathVariable Integer id) {
        List<TarefaDTO.Response> lista = tarefaGrupoRepository.findByGrupoIdGrupo(id)
                .stream()
                .map(tg -> toTarefaResponse(tg.getTarefa()))
                .collect(Collectors.toList());
        return ResponseEntity.ok(lista);
    }

    @PostMapping("/{id}/tarefas/{idTarefa}")
    public ResponseEntity<Void> compartilharTarefa(@PathVariable Integer id,
                                                   @PathVariable Integer idTarefa,
                                                   @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        Grupo grupo = grupoService.buscarPorId(id)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));
        Tarefa tarefa = tarefaService.buscarPorId(idTarefa)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));

        // Qualquer membro do grupo (admin ou membro) pode compartilhar uma tarefa sua
        if (!grupoMembroRepository.existsByUsuarioIdUsuarioAndGrupoIdGrupo(
                usuario.getIdUsuario(), id)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Apenas membros do grupo podem compartilhar tarefas");
        }
        // Apenas o dono da tarefa pode compartilhá-la
        if (!tarefa.getUsuario().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Você só pode compartilhar suas próprias tarefas");
        }

        TarefaGrupo.TarefaGrupoId tgId = new TarefaGrupo.TarefaGrupoId();
        tgId.setIdTarefa(idTarefa);
        tgId.setIdGrupo(id);

        if (!tarefaGrupoRepository.existsById(tgId)) {
            TarefaGrupo tg = new TarefaGrupo();
            tg.setId(tgId);
            tg.setTarefa(tarefa);
            tg.setGrupo(grupo);
            tg.setCompartilhadoEm(LocalDateTime.now());
            tarefaGrupoRepository.save(tg);
        }
        return ResponseEntity.ok().build();
    }

    @DeleteMapping("/{id}/tarefas/{idTarefa}")
    public ResponseEntity<Void> removerTarefaDoGrupo(@PathVariable Integer id, @PathVariable Integer idTarefa) {
        TarefaGrupo.TarefaGrupoId tgId = new TarefaGrupo.TarefaGrupoId();
        tgId.setIdTarefa(idTarefa);
        tgId.setIdGrupo(id);
        tarefaGrupoRepository.deleteById(tgId);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deletar(@PathVariable Integer id,
                                        @AuthenticationPrincipal Usuario usuario) {
        if (usuario == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Não autenticado");
        }
        Grupo grupo = grupoService.buscarPorId(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Grupo não encontrado"));
        if (!grupo.getAdmin().getIdUsuario().equals(usuario.getIdUsuario())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Apenas o admin do grupo pode deletá-lo");
        }
        if (grupoMembroRepository.existsByGrupoIdGrupoAndPapel(id, GrupoMembro.Papel.membro)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT,
                    "O grupo ainda possui membros. Remova todos os membros antes de excluir o grupo.");
        }
        grupoService.deletar(id);
        return ResponseEntity.noContent().build();
    }

    private TarefaDTO.Response toTarefaResponse(Tarefa t) {
        TarefaDTO.Response r = new TarefaDTO.Response();
        r.setIdTarefa(t.getIdTarefa());
        r.setTitulo(t.getTitulo());
        r.setDescricao(t.getDescricao());
        r.setPrioridade(t.getPrioridade());
        r.setStatus(t.getStatus());
        r.setPrazo(t.getPrazo() != null ? t.getPrazo().toString() : null);
        r.setConcluidoEm(t.getConcluidoEm() != null ? t.getConcluidoEm().toString() : null);
        r.setCriadoEm(t.getCriadoEm() != null ? t.getCriadoEm().toString() : null);
        r.setIdUsuario(t.getUsuario().getIdUsuario());
        r.setIdsGrupos(tarefaGrupoRepository.findByTarefaIdTarefa(t.getIdTarefa())
                .stream()
                .map(tg -> tg.getGrupo().getIdGrupo())
                .collect(Collectors.toList()));
        return r;
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