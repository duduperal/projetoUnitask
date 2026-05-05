package com.unitask.unitask.repository;

import com.unitask.unitask.model.Tarefa;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TarefaRepository extends JpaRepository<Tarefa, Integer> {
    List<Tarefa> findByUsuarioIdUsuario(Integer idUsuario);
    List<Tarefa> findByUsuarioIdUsuarioAndStatus(Integer idUsuario, Tarefa.Status status);
    List<Tarefa> findByUsuarioIdUsuarioAndPrioridade(Integer idUsuario, Tarefa.Prioridade prioridade);
}