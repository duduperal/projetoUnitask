package com.unitask.unitask.repository;

import com.unitask.unitask.model.Comentario;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface ComentarioRepository extends JpaRepository<Comentario, Integer> {
    List<Comentario> findByTarefaIdTarefaOrderByCriadoEmAsc(Integer idTarefa);
}
