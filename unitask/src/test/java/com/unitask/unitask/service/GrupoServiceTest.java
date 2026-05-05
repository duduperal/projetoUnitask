package com.unitask.unitask.service;

import com.unitask.unitask.model.Grupo;
import com.unitask.unitask.model.GrupoMembro;
import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.GrupoMembroRepository;
import com.unitask.unitask.repository.GrupoRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class GrupoServiceTest {

    @Mock
    private GrupoRepository grupoRepository;

    @Mock
    private GrupoMembroRepository grupoMembroRepository;

    @InjectMocks
    private GrupoService grupoService;

    @Test
    void deveCriarGrupoComSucesso() {
        Usuario admin = new Usuario();
        admin.setIdUsuario(1);
        admin.setNome("Admin");

        Grupo grupo = new Grupo();
        grupo.setNome("Grupo TCC");
        grupo.setAdmin(admin);

        when(grupoRepository.existsByCodigoConvite(anyString())).thenReturn(false);
        when(grupoRepository.save(any(Grupo.class))).thenReturn(grupo);
        when(grupoMembroRepository.save(any(GrupoMembro.class))).thenReturn(new GrupoMembro());

        Grupo resultado = grupoService.criar(grupo);

        assertNotNull(resultado);
        assertEquals("Grupo TCC", resultado.getNome());
        verify(grupoRepository, times(1)).save(any(Grupo.class));
        verify(grupoMembroRepository, times(1)).save(any(GrupoMembro.class));
    }

    @Test
    void deveLancarExcecaoQuandoCodigoConviteInvalido() {
        when(grupoRepository.findByCodigoConvite("INVALIDO")).thenReturn(Optional.empty());

        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1);

        RuntimeException excecao = assertThrows(RuntimeException.class, () -> {
            grupoService.entrarNoGrupo("INVALIDO", usuario);
        });

        assertEquals("Código de convite inválido", excecao.getMessage());
    }

    @Test
    void deveLancarExcecaoQuandoUsuarioJaEMembro() {
        Usuario usuario = new Usuario();
        usuario.setIdUsuario(1);

        Grupo grupo = new Grupo();
        grupo.setIdGrupo(1);

        when(grupoRepository.findByCodigoConvite("ABC123")).thenReturn(Optional.of(grupo));
        when(grupoMembroRepository.existsByUsuarioIdUsuarioAndGrupoIdGrupo(1, 1)).thenReturn(true);

        RuntimeException excecao = assertThrows(RuntimeException.class, () -> {
            grupoService.entrarNoGrupo("ABC123", usuario);
        });

        assertEquals("Usuário já é membro do grupo", excecao.getMessage());
    }

    @Test
    void deveBuscarGrupoPorCodigoConvite() {
        Grupo grupo = new Grupo();
        grupo.setNome("Grupo TCC");

        when(grupoRepository.findByCodigoConvite("ABC123")).thenReturn(Optional.of(grupo));

        Optional<Grupo> resultado = grupoService.buscarPorCodigoConvite("ABC123");

        assertTrue(resultado.isPresent());
        assertEquals("Grupo TCC", resultado.get().getNome());
    }
}