package com.unitask.unitask.service;

import com.unitask.unitask.model.Usuario;
import com.unitask.unitask.repository.UsuarioRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import java.time.LocalDateTime;
import java.util.Optional;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UsuarioServiceTest {

    @Mock
    private UsuarioRepository usuarioRepository;

    @InjectMocks
    private UsuarioService usuarioService;

    @Test
    void deveRegistrarUsuarioComSucesso() {
        Usuario usuario = new Usuario();
        usuario.setNome("João");
        usuario.setEmail("joao@email.com");
        usuario.setSenhaHash("123456");

        when(usuarioRepository.existsByEmail("joao@email.com")).thenReturn(false);
        when(usuarioRepository.save(any(Usuario.class))).thenReturn(usuario);

        Usuario resultado = usuarioService.registrar(usuario);

        assertNotNull(resultado);
        assertEquals("João", resultado.getNome());
        verify(usuarioRepository, times(1)).save(any(Usuario.class));
    }

    @Test
    void deveLancarExcecaoQuandoEmailJaCadastrado() {
        Usuario usuario = new Usuario();
        usuario.setEmail("joao@email.com");

        when(usuarioRepository.existsByEmail("joao@email.com")).thenReturn(true);

        RuntimeException excecao = assertThrows(RuntimeException.class, () -> {
            usuarioService.registrar(usuario);
        });

        assertEquals("Email já cadastrado", excecao.getMessage());
        verify(usuarioRepository, never()).save(any(Usuario.class));
    }

    @Test
    void deveBuscarUsuarioPorEmail() {
        Usuario usuario = new Usuario();
        usuario.setEmail("joao@email.com");

        when(usuarioRepository.findByEmail("joao@email.com")).thenReturn(Optional.of(usuario));

        Optional<Usuario> resultado = usuarioService.buscarPorEmail("joao@email.com");

        assertTrue(resultado.isPresent());
        assertEquals("joao@email.com", resultado.get().getEmail());
    }

    @Test
    void deveRetornarVazioQuandoEmailNaoEncontrado() {
        when(usuarioRepository.findByEmail("naoexiste@email.com")).thenReturn(Optional.empty());

        Optional<Usuario> resultado = usuarioService.buscarPorEmail("naoexiste@email.com");

        assertFalse(resultado.isPresent());
    }
}