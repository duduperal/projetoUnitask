package com.unitask.unitask.service;

import com.unitask.unitask.model.Notificacao;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.NotificacaoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class NotificacaoService {

    private final NotificacaoRepository notificacaoRepository;

    public Notificacao criar(Tarefa tarefa, Usuario usuario, Notificacao.Tipo tipo, String mensagem) {
        Notificacao notificacao = new Notificacao();
        notificacao.setTarefa(tarefa);
        notificacao.setUsuario(usuario);
        notificacao.setTipo(tipo);
        notificacao.setMensagem(mensagem);
        notificacao.setEnviadoEm(LocalDateTime.now());
        notificacao.setLido(false);
        return notificacaoRepository.save(notificacao);
    }

    public List<Notificacao> listarPorUsuario(Integer idUsuario) {
        return notificacaoRepository.findByUsuarioIdUsuario(idUsuario);
    }

    public List<Notificacao> listarNaoLidas(Integer idUsuario) {
        return notificacaoRepository.findByUsuarioIdUsuarioAndLido(idUsuario, false);
    }

    public Notificacao marcarComoLida(Integer idNotificacao) {
        Notificacao notificacao = notificacaoRepository.findById(idNotificacao)
                .orElseThrow(() -> new RuntimeException("Notificação não encontrada"));
        notificacao.setLido(true);
        return notificacaoRepository.save(notificacao);
    }

    public void deletar(Integer id) {
        notificacaoRepository.deleteById(id);
    }
}