package com.unitask.unitask.service;

import com.unitask.unitask.model.Tarefa;
import com.unitask.unitask.repository.TarefaRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class TarefaService {

    private final TarefaRepository tarefaRepository;

    public Tarefa criar(Tarefa tarefa) {
        tarefa.setCriadoEm(LocalDateTime.now());
        tarefa.setStatus(Tarefa.Status.pendente);
        return tarefaRepository.save(tarefa);
    }

    public Optional<Tarefa> buscarPorId(Integer id) {
        return tarefaRepository.findById(id);
    }

    public List<Tarefa> listarPorUsuario(Integer idUsuario) {
        return tarefaRepository.findByUsuarioIdUsuario(idUsuario);
    }

    public List<Tarefa> listarPorUsuarioEStatus(Integer idUsuario, Tarefa.Status status) {
        return tarefaRepository.findByUsuarioIdUsuarioAndStatus(idUsuario, status);
    }

    public Tarefa concluir(Integer idTarefa) {
        Tarefa tarefa = tarefaRepository.findById(idTarefa)
                .orElseThrow(() -> new RuntimeException("Tarefa não encontrada"));
        tarefa.setStatus(Tarefa.Status.concluida);
        tarefa.setConcluidoEm(LocalDateTime.now());
        return tarefaRepository.save(tarefa);
    }

    public Tarefa atualizar(Tarefa tarefa) {
        return tarefaRepository.save(tarefa);
    }

    public void deletar(Integer id) {
        tarefaRepository.deleteById(id);
    }
}