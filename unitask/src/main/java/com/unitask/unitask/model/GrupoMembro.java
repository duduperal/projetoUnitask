package com.unitask.unitask.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "grupo_membro")
public class GrupoMembro {

    @EmbeddedId
    private GrupoMembroId id;

    @ManyToOne
    @MapsId("idUsuario")
    @JoinColumn(name = "id_usuario")
    private Usuario usuario;

    @ManyToOne
    @MapsId("idGrupo")
    @JoinColumn(name = "id_grupo")
    private Grupo grupo;

    @Enumerated(EnumType.STRING)
    @Column(name = "papel", nullable = false)
    private Papel papel;

    @Column(name = "entrou_em", nullable = false, updatable = false)
    private LocalDateTime entrouEm;

    public enum Papel { admin, membro }

    @Data
    @Embeddable
    public static class GrupoMembroId implements java.io.Serializable {
        @Column(name = "id_usuario")
        private Integer idUsuario;

        @Column(name = "id_grupo")
        private Integer idGrupo;
    }
}