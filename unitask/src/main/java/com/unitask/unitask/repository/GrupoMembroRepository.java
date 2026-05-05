package com.unitask.unitask.repository;

import com.unitask.unitask.model.GrupoMembro;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface GrupoMembroRepository extends JpaRepository<GrupoMembro, GrupoMembro.GrupoMembroId> {
    List<GrupoMembro> findByGrupoIdGrupo(Integer idGrupo);
    List<GrupoMembro> findByUsuarioIdUsuario(Integer idUsuario);
    Optional<GrupoMembro> findByUsuarioIdUsuarioAndGrupoIdGrupo(Integer idUsuario, Integer idGrupo);
    boolean existsByUsuarioIdUsuarioAndGrupoIdGrupo(Integer idUsuario, Integer idGrupo);
}