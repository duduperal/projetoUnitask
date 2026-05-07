package com.unitask.unitask.model;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Data
@Entity
@Table(name = "grupo")
public class Grupo {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id_grupo")
    private Integer idGrupo;

    @ManyToOne
    @JoinColumn(name = "id_admin", nullable = false)
    private Usuario admin;

    @Column(name = "nome", nullable = false, length = 100)
    private String nome;

    @Column(name = "descricao")
    private String descricao;

    @Column(name = "codigo_convite", nullable = false, unique = true, length = 20)
    private String codigoConvite;

    @Column(name = "criado_em", nullable = false, updatable = false)
    private LocalDateTime criadoEm;

    // Membros do grupo sao acessados via entidade GrupoMembro (grupo_membro table),
    // que ja inclui os campos extras 'papel' e 'entrou_em'.
    // Mapear @ManyToMany aqui causaria conflito de mapeamento da mesma tabela.
}