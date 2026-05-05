package com.unitask.unitask.service;

import com.unitask.unitask.model.Grupo;
import com.unitask.unitask.model.GrupoMembro;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.GrupoMembroRepository;
import com.unitask.unitask.repository.GrupoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class GrupoService {

    private final GrupoRepository grupoRepository;
    private final GrupoMembroRepository grupoMembroRepository;

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

    public void deletar(Integer id) {
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