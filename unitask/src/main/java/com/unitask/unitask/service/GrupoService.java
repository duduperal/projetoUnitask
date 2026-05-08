package com.unitask.unitask.service;

import com.unitask.unitask.model.Grupo;
import com.unitask.unitask.model.GrupoMembro;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.GrupoMembroRepository;
import com.unitask.unitask.repository.GrupoRepository;
import com.unitask.unitask.repository.TarefaGrupoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final GrupoMembroRepository grupoMembroRepository;
    private final TarefaGrupoRepository tarefaGrupoRepository;

    public Grupo criar(Grupo grupo) {
        grupo.setCriadoEm(LocalDateTime.now());
        grupo.setCodigoConvite(gerarCodigoConvite());
        Grupo grupoCriado = grupoRepository.save(grupo);

        GrupoMembro membro = new GrupoMembro();
        GrupoMembro.GrupoMembroId id = new GrupoMembro.GrupoMembroId();
        id.setIdUsuario(grupo.getAdmin().getIdUsuario());
        id.setIdGrupo(grupoCriado.getIdGrupo());
        membro.setId(id);
        membro.setUsuario(grupo.getAdmin());
        membro.setGrupo(grupoCriado);
        membro.setPapel(GrupoMembro.Papel.admin);
        membro.setEntrouEm(LocalDateTime.now());
        grupoMembroRepository.save(membro);

        return grupoCriado;
    }

    public Optional<Grupo> buscarPorId(Integer id) {
        return grupoRepository.findById(id);
    }

    public Optional<Grupo> buscarPorCodigoConvite(String codigo) {
        return grupoRepository.findByCodigoConvite(codigo);
    }

    public void entrarNoGrupo(String codigoConvite, Usuario usuario) {
        Grupo grupo = grupoRepository.findByCodigoConvite(codigoConvite)
                .orElseThrow(() -> new RuntimeException("Código de convite inválido"));

        if (grupoMembroRepository.existsByUsuarioIdUsuarioAndGrupoIdGrupo(
                usuario.getIdUsuario(), grupo.getIdGrupo())) {
            throw new RuntimeException("Usuário já é membro do grupo");
        }

        GrupoMembro membro = new GrupoMembro();
        GrupoMembro.GrupoMembroId id = new GrupoMembro.GrupoMembroId();
        id.setIdUsuario(usuario.getIdUsuario());
        id.setIdGrupo(grupo.getIdGrupo());
        membro.setId(id);
        membro.setUsuario(usuario);
        membro.setGrupo(grupo);
        membro.setPapel(GrupoMembro.Papel.membro);
        membro.setEntrouEm(LocalDateTime.now());
        grupoMembroRepository.save(membro);
    }

    public List<GrupoMembro> listarMembros(Integer idGrupo) {
        return grupoMembroRepository.findByGrupoIdGrupo(idGrupo);
    }

    public List<GrupoMembro> listarGruposDoUsuario(Integer idUsuario) {
        return grupoMembroRepository.findByUsuarioIdUsuario(idUsuario);
    }

    public void removerMembro(Integer idGrupo, Integer idSolicitante, Integer idAlvo) {
        Grupo grupo = grupoRepository.findById(idGrupo)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));

        GrupoMembro solicitante = grupoMembroRepository
                .findByUsuarioIdUsuarioAndGrupoIdGrupo(idSolicitante, idGrupo)
                .orElseThrow(() -> new RuntimeException("Você não pertence a este grupo"));

        if (solicitante.getPapel() != GrupoMembro.Papel.admin) {
            throw new RuntimeException("Apenas admins podem remover membros");
        }

        if (idAlvo.equals(grupo.getAdmin().getIdUsuario())) {
            throw new RuntimeException("O criador do grupo não pode ser removido");
        }

        if (idAlvo.equals(idSolicitante)) {
            throw new RuntimeException("Você não pode remover a si mesmo");
        }

        GrupoMembro alvo = grupoMembroRepository
                .findByUsuarioIdUsuarioAndGrupoIdGrupo(idAlvo, idGrupo)
                .orElseThrow(() -> new RuntimeException("Membro não encontrado no grupo"));

        grupoMembroRepository.delete(alvo);
    }

    public GrupoMembro alterarPapel(Integer idGrupo, Integer idSolicitante, Integer idAlvo, String novoPapel) {
        Grupo grupo = grupoRepository.findById(idGrupo)
                .orElseThrow(() -> new RuntimeException("Grupo não encontrado"));

        GrupoMembro solicitante = grupoMembroRepository
                .findByUsuarioIdUsuarioAndGrupoIdGrupo(idSolicitante, idGrupo)
                .orElseThrow(() -> new RuntimeException("Você não pertence a este grupo"));

        if (solicitante.getPapel() != GrupoMembro.Papel.admin) {
            throw new RuntimeException("Apenas admins podem alterar papéis");
        }

        GrupoMembro.Papel papel;
        try {
            papel = GrupoMembro.Papel.valueOf(novoPapel);
        } catch (IllegalArgumentException e) {
            throw new RuntimeException("Papel inválido");
        }

        if (idAlvo.equals(grupo.getAdmin().getIdUsuario()) && papel != GrupoMembro.Papel.admin) {
            throw new RuntimeException("O criador do grupo não pode ser rebaixado");
        }

        GrupoMembro alvo = grupoMembroRepository
                .findByUsuarioIdUsuarioAndGrupoIdGrupo(idAlvo, idGrupo)
                .orElseThrow(() -> new RuntimeException("Membro não encontrado no grupo"));

        alvo.setPapel(papel);
        return grupoMembroRepository.save(alvo);
    }

    @Transactional
    public void deletar(Integer id) {
        // Remove vinculos das tarefas com o grupo (sem deletar as tarefas em si)
        tarefaGrupoRepository.deleteAllByGrupoIdGrupo(id);
        // Remove todos os membros do grupo
        grupoMembroRepository.deleteAllByGrupoIdGrupo(id);
        // Forca o flush antes de deletar o grupo, garantindo que os
        // registros dependentes ja sairam da tabela quando o DELETE
        // do grupo for executado (evita violacao de FK constraint)
        grupoMembroRepository.flush();
        tarefaGrupoRepository.flush();
        // Finalmente, deleta o grupo
        grupoRepository.deleteById(id);
    }

    private String gerarCodigoConvite() {
        String codigo;
        do {
            codigo = UUID.randomUUID().toString().substring(0, 8).toUpperCase();
        } while (grupoRepository.existsByCodigoConvite(codigo));
        return codigo;
    }
}