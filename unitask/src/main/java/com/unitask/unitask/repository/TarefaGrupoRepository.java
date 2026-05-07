package com.unitask.unitask.repository;

import com.unitask.unitask.model.TarefaGrupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TarefaGrupoRepository extends JpaRepository<TarefaGrupo, TarefaGrupo.TarefaGrupoId> {
    List<TarefaGrupo> findByGrupoIdGrupo(Integer idGrupo);
    List<TarefaGrupo> findByTarefaIdTarefa(Integer idTarefa);

    @Modifying
    @Query("DELETE FROM TarefaGrupo tg WHERE tg.grupo.idGrupo = :idGrupo")
    void deleteAllByGrupoIdGrupo(Integer idGrupo);
}