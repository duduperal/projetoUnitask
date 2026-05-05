package com.unitask.unitask.service;

import com.unitask.unitask.model.Anexo;
import com.unitask.unitask.repository.AnexoRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AnexoService {

    private final AnexoRepository anexoRepository;

    public Anexo criar(Anexo anexo) {
        anexo.setCriadoEm(LocalDateTime.now());
        return anexoRepository.save(anexo);
    }

    public List<Anexo> listarPorTarefa(Integer idTarefa) {
        return anexoRepository.findByTarefaIdTarefaOrderByCriadoEmAsc(idTarefa);
    }

    public void deletar(Integer id) {
        anexoRepository.deleteById(id);
    }
}
