package com.grocery.grocery_backend.controller;

import com.grocery.grocery_backend.model.entity.Role;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.UserRepository;
import com.grocery.grocery_backend.security.AuthEntryPointJwt;
import com.grocery.grocery_backend.security.JwtUtils;
import com.grocery.grocery_backend.security.UserDetailsServiceImpl;
import com.grocery.grocery_backend.security.WebSecurityConfig;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc
@Import(WebSecurityConfig.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private AuthEntryPointJwt unauthorizedHandler;

    @MockitoBean
    private JwtUtils jwtUtils;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @Test
    void getProfileReturnsCurrentUserWithoutPassword() throws Exception {
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(sampleUser(1L, "alice", Role.ROLE_USER, true)));

        mockMvc.perform(get("/api/users/profile").with(user("alice").roles("USER")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"))
                .andExpect(jsonPath("$.enabled").value(true))
                .andExpect(jsonPath("$.password").doesNotExist());
    }

    @Test
    void updateProfileAllowsDeliveryFieldsOnly() throws Exception {
        User saved = sampleUser(1L, "alice", Role.ROLE_USER, true);
        saved.setFullName("Alice Nguyen");
        saved.setPhone("0901234567");
        saved.setAddress("12 Nguyen Trai");
        when(userRepository.findByUsername("alice")).thenReturn(Optional.of(sampleUser(1L, "alice", Role.ROLE_USER, true)));
        when(userRepository.save(any(User.class))).thenReturn(saved);

        mockMvc.perform(put("/api/users/profile")
                        .with(user("alice").roles("USER"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {"fullName":"Alice Nguyen","phone":"0901234567","address":"12 Nguyen Trai","username":"hacker"}
                                """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fullName").value("Alice Nguyen"))
                .andExpect(jsonPath("$.username").value("alice"));
    }

    @Test
    void listUsersForbiddenForNormalUser() throws Exception {
        mockMvc.perform(get("/api/users").with(user("alice").roles("USER")))
                .andExpect(status().isForbidden());
    }

    @Test
    void listUsersAllowedForAdmin() throws Exception {
        when(userRepository.findAll()).thenReturn(List.of(sampleUser(1L, "alice", Role.ROLE_USER, true)));

        mockMvc.perform(get("/api/users").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].username").value("alice"));
    }

    @Test
    void disableUserSoftDeletesInsteadOfRemovingRow() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser(10L, "admin", Role.ROLE_ADMIN, true)));
        when(userRepository.findById(1L)).thenReturn(Optional.of(sampleUser(1L, "alice", Role.ROLE_USER, true)));
        when(userRepository.save(any(User.class))).thenAnswer(invocation -> invocation.getArgument(0));

        mockMvc.perform(delete("/api/users/1").with(user("admin").roles("ADMIN")))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.enabled").value(false));

        verify(userRepository, never()).delete(any(User.class));
    }

    @Test
    void adminCannotChangeOwnStatus() throws Exception {
        when(userRepository.findByUsername("admin")).thenReturn(Optional.of(sampleUser(10L, "admin", Role.ROLE_ADMIN, true)));

        mockMvc.perform(delete("/api/users/10").with(user("admin").roles("ADMIN")))
                .andExpect(status().isBadRequest());

        mockMvc.perform(patch("/api/users/10/status")
                        .with(user("admin").roles("ADMIN"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"enabled\":false}"))
                .andExpect(status().isBadRequest());
    }

    private User sampleUser(Long id, String username, Role role, boolean enabled) {
        return User.builder()
                .id(id)
                .username(username)
                .email(username + "@example.com")
                .password("secret")
                .fullName("Sample")
                .role(role)
                .enabled(enabled)
                .build();
    }
}
