package com.unitask.unitask.repository;

import com.unitask.unitask.model.Notificacao;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface NotificacaoRepository extends JpaRepository<Notificacao, Integer> {
    List<Notificacao> findByUsuarioIdUsuario(Integer idUsuario);
    List<Notificacao> findByUsuarioIdUsuarioAndLido(Integer idUsuario, Boolean lido);
    List<Notificacao> findByTarefaIdTarefa(Integer idTarefa);
}