package com.unitask.unitask.repository;

import com.unitask.unitask.model.Grupo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface GrupoRepository extends JpaRepository<Grupo, Integer> {
    Optional<Grupo> findByCodigoConvite(String codigoConvite);
    boolean existsByCodigoConvite(String codigoConvite);
}