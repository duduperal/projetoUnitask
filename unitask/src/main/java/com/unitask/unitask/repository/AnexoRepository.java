package com.unitask.unitask.repository;

import com.unitask.unitask.model.Anexo;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface AnexoRepository extends JpaRepository<Anexo, Integer> {
    List<Anexo> findByTarefaIdTarefaOrderByCriadoEmAsc(Integer idTarefa);
}
