package com.unitask.unitask.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "tarefa_grupo")
public class TarefaGrupo {

    @EmbeddedId
    private TarefaGrupoId id;

    @ManyToOne
    @MapsId("idTarefa")
    @JoinColumn(name = "id_tarefa")
    private Tarefa tarefa;

    @ManyToOne
    @MapsId("idGrupo")
    @JoinColumn(name = "id_grupo")
    private Grupo grupo;

    @Column(name = "compartilhado_em", nullable = false, updatable = false)
    private LocalDateTime compartilhadoEm;

    @Data
    @Embeddable
    public static class TarefaGrupoId implements java.io.Serializable {
        @Column(name = "id_tarefa")
        private Integer idTarefa;

        @Column(name = "id_grupo")
        private Integer idGrupo;
    }
}