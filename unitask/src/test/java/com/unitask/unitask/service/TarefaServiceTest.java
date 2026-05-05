package com.unitask.unitask.service;

import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.TarefaRepository;
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
class TarefaServiceTest {

    @Mock
    private TarefaRepository tarefaRepository;

    @InjectMocks
    private TarefaService tarefaService;

    @Test
    void deveCriarTarefaComSucesso() {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1);

        Tarefa tarefa = new Tarefa();
        tarefa.setTitulo("Estudar Spring Boot");
        tarefa.setUsuario(usuario);
        tarefa.setPrioridade(Tarefa.Prioridade.alta);

        when(tarefaRepository.save(any(Tarefa.class))).thenReturn(tarefa);

        Tarefa resultado = tarefaService.criar(tarefa);

        assertNotNull(resultado);
        assertEquals("Estudar Spring Boot", resultado.getTitulo());
        assertEquals(Tarefa.Status.pendente, resultado.getStatus());
        verify(tarefaRepository, times(1)).save(any(Tarefa.class));
    }

    @Test
    void deveConcluirTarefaComSucesso() {
        Tarefa tarefa = new Tarefa();
        tarefa.setIdTarefa(1);
        tarefa.setStatus(Tarefa.Status.pendente);

        when(tarefaRepository.findById(1)).thenReturn(Optional.of(tarefa));
        when(tarefaRepository.save(any(Tarefa.class))).thenReturn(tarefa);

        Tarefa resultado = tarefaService.concluir(1);

        assertEquals(Tarefa.Status.concluida, resultado.getStatus());
        assertNotNull(resultado.getConcluidoEm());
        verify(tarefaRepository, times(1)).save(any(Tarefa.class));
    }

    @Test
    void deveLancarExcecaoQuandoTarefaNaoEncontrada() {
        when(tarefaRepository.findById(99)).thenReturn(Optional.empty());

        RuntimeException excecao = assertThrows(RuntimeException.class, () -> {
            tarefaService.concluir(99);
        });

        assertEquals("Tarefa não encontrada", excecao.getMessage());
    }

    @Test
    void deveListarTarefasPorUsuario() {
        Tarefa tarefa = new Tarefa();
        tarefa.setTitulo("Tarefa 1");

        when(tarefaRepository.findByUsuarioIdUsuario(1)).thenReturn(List.of(tarefa));

        List<Tarefa> resultado = tarefaService.listarPorUsuario(1);

        assertFalse(resultado.isEmpty());
        assertEquals(1, resultado.size());
        assertEquals("Tarefa 1", resultado.get(0).getTitulo());
    }
}