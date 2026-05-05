package com.unitask.unitask.service;

import com.unitask.unitask.model.Comentario;
import com.unitask.unitask.repository.ComentarioRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ComentarioService {

    private final ComentarioRepository comentarioRepository;

    public Comentario criar(Comentario comentario) {
        comentario.setCriadoEm(LocalDateTime.now());
        return comentarioRepository.save(comentario);
    }

    public List<Comentario> listarPorTarefa(Integer idTarefa) {
        return comentarioRepository.findByTarefaIdTarefaOrderByCriadoEmAsc(idTarefa);
    }

    public void deletar(Integer id) {
        comentarioRepository.deleteById(id);
    }
}
