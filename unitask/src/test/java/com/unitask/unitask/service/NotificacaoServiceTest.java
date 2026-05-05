package com.unitask.unitask.service;

import com.unitask.unitask.model.Notificacao;
import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.NotificacaoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.List;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class NotificacaoServiceTest {

    @Mock
    private NotificacaoRepository notificacaoRepository;

    @InjectMocks
    private NotificacaoService notificacaoService;

    @Test
    void deveCriarNotificacaoComSucesso() {
        Tarefa tarefa = new Tarefa();
        tarefa.setIdTarefa(1);

        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1);

        Notificacao notificacao = new Notificacao();
        notificacao.setTarefa(tarefa);
        notificacao.setUsuario(usuario);
        notificacao.setTipo(Notificacao.Tipo.h24);
        notificacao.setMensagem("Tarefa vence em 24h");
        notificacao.setLido(false);

        when(notificacaoRepository.save(any(Notificacao.class))).thenReturn(notificacao);

        Notificacao resultado = notificacaoService.criar(tarefa, usuario, Notificacao.Tipo.h24, "Tarefa vence em 24h");

        assertNotNull(resultado);
        assertEquals(Notificacao.Tipo.h24, resultado.getTipo());
        assertEquals(false, resultado.getLido());
        verify(notificacaoRepository, times(1)).save(any(Notificacao.class));
    }

    @Test
    void deveMarcarNotificacaoComoLida() {
        Notificacao notificacao = new Notificacao();
        notificacao.setIdNotificacao(1);
        notificacao.setLido(false);

        when(notificacaoRepository.findById(1)).thenReturn(Optional.of(notificacao));
        when(notificacaoRepository.save(any(Notificacao.class))).thenReturn(notificacao);

        Notificacao resultado = notificacaoService.marcarComoLida(1);

        assertTrue(resultado.getLido());
        verify(notificacaoRepository, times(1)).save(any(Notificacao.class));
    }

    @Test
    void deveLancarExcecaoQuandoNotificacaoNaoEncontrada() {
        when(notificacaoRepository.findById(99)).thenReturn(Optional.empty());

        RuntimeException excecao = assertThrows(RuntimeException.class, () -> {
            notificacaoService.marcarComoLida(99);
        });

        assertEquals("Notificação não encontrada", excecao.getMessage());
    }

    @Test
    void deveListarNotificacoesNaoLidas() {
        Notificacao notificacao = new Notificacao();
        notificacao.setLido(false);

        when(notificacaoRepository.findByUsuarioIdUsuarioAndLido(1, false))
                .thenReturn(List.of(notificacao));

        List<Notificacao> resultado = notificacaoService.listarNaoLidas(1);

        assertFalse(resultado.isEmpty());
        assertEquals(1, resultado.size());
        assertFalse(resultado.get(0).getLido());
    }
}