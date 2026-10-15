package com.grocery.grocery_backend.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.grocery.grocery_backend.model.dto.LoginRequest;
import com.grocery.grocery_backend.model.dto.RegisterRequest;
import com.grocery.grocery_backend.model.entity.Role;
import com.grocery.grocery_backend.model.entity.User;
import com.grocery.grocery_backend.repository.UserRepository;
import com.grocery.grocery_backend.security.AuthEntryPointJwt;
import com.grocery.grocery_backend.security.JwtUtils;
import com.grocery.grocery_backend.security.UserDetailsImpl;
import com.grocery.grocery_backend.security.UserDetailsServiceImpl;
import com.grocery.grocery_backend.security.WebSecurityConfig;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import(WebSecurityConfig.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @MockitoBean
    private AuthenticationManager authenticationManager;

    @MockitoBean
    private UserRepository userRepository;

    @MockitoBean
    private PasswordEncoder passwordEncoder;

    @MockitoBean
    private JwtUtils jwtUtils;

    @MockitoBean
    private UserDetailsServiceImpl userDetailsService;

    @MockitoBean
    private AuthEntryPointJwt unauthorizedHandler;

    @Test
    @DisplayName("Login - Thành công trả về JWT Token và thông tin User")
    void login_Success_ReturnsJwtToken() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("dattran");
        request.setPassword("password123");

        User sampleUser = User.builder()
                .id(1L)
                .username("dattran")
                .email("dattran@example.com")
                .password("hashedPassword")
                .role(Role.ROLE_USER)
                .enabled(true)
                .build();
        UserDetailsImpl userDetails = UserDetailsImpl.build(sampleUser);

        Authentication auth = mock(Authentication.class);
        when(auth.getPrincipal()).thenReturn(userDetails);
        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(auth);
        when(jwtUtils.generateJwtToken(auth)).thenReturn("mocked.jwt.token");

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("mocked.jwt.token"))
                .andExpect(jsonPath("$.type").value("Bearer"))
                .andExpect(jsonPath("$.username").value("dattran"))
                .andExpect(jsonPath("$.role").value("ROLE_USER"));
    }

    @Test
    @DisplayName("Login - Sai mật khẩu ném lỗi BadCredentialsException")
    void login_WrongPassword_ThrowsException() {
        LoginRequest request = new LoginRequest();
        request.setUsername("dattran");
        request.setPassword("wrongpassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class)))
                .thenThrow(new BadCredentialsException("Bad credentials"));

        org.assertj.core.api.Assertions.assertThatThrownBy(() ->
                mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
        ).hasCauseInstanceOf(BadCredentialsException.class);
    }

    @Test
    @DisplayName("Register - Thành công tạo tài khoản mới")
    void register_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser");
        request.setEmail("newuser@example.com");
        request.setPassword("password123");
        request.setFullName("Người Dùng Mới");

        when(userRepository.existsByUsername("newuser")).thenReturn(false);
        when(userRepository.existsByEmail("newuser@example.com")).thenReturn(false);
        when(passwordEncoder.encode("password123")).thenReturn("encodedPassword");

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(content().string("User registered successfully!"));

        verify(userRepository).save(any(User.class));
    }

    @Test
    @DisplayName("Register - Bị chặn khi Username đã tồn tại")
    void register_DuplicateUsername_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser");
        request.setEmail("new@example.com");
        request.setPassword("password123");

        when(userRepository.existsByUsername("existinguser")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Error: Username is already taken!"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Register - Bị chặn khi Email đã tồn tại")
    void register_DuplicateEmail_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("uniqueuser");
        request.setEmail("existing@example.com");
        request.setPassword("password123");

        when(userRepository.existsByUsername("uniqueuser")).thenReturn(false);
        when(userRepository.existsByEmail("existing@example.com")).thenReturn(true);

        mockMvc.perform(post("/api/auth/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(content().string("Error: Email is already in use!"));

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Forgot Password - Đặt lại mật khẩu thành công khi email tồn tại")
    void forgotPassword_Success() throws Exception {
        com.grocery.grocery_backend.model.dto.ForgotPasswordRequest request =
                new com.grocery.grocery_backend.model.dto.ForgotPasswordRequest("alice@example.com", "newpassword123");

        User existingUser = User.builder()
                .id(1L)
                .username("alice")
                .email("alice@example.com")
                .password("oldHashedPassword")
                .enabled(true)
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findByEmail("alice@example.com")).thenReturn(java.util.Optional.of(existingUser));
        when(passwordEncoder.encode("newpassword123")).thenReturn("newHashedPassword");

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.message").value("Đặt lại mật khẩu thành công! Vui lòng đăng nhập với mật khẩu mới."));

        verify(userRepository).save(existingUser);
    }

    @Test
    @DisplayName("Forgot Password - Báo 404 khi email không tồn tại")
    void forgotPassword_EmailNotFound_ReturnsNotFound() throws Exception {
        com.grocery.grocery_backend.model.dto.ForgotPasswordRequest request =
                new com.grocery.grocery_backend.model.dto.ForgotPasswordRequest("notfound@example.com", "newpassword123");

        when(userRepository.findByEmail("notfound@example.com")).thenReturn(java.util.Optional.empty());

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isNotFound());

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Forgot Password - Báo lỗi khi tài khoản bị vô hiệu hóa")
    void forgotPassword_DisabledUser_ReturnsBadRequest() throws Exception {
        com.grocery.grocery_backend.model.dto.ForgotPasswordRequest request =
                new com.grocery.grocery_backend.model.dto.ForgotPasswordRequest("locked@example.com", "newpassword123");

        User disabledUser = User.builder()
                .id(2L)
                .username("locked")
                .email("locked@example.com")
                .password("oldHashedPassword")
                .enabled(false)
                .role(Role.ROLE_USER)
                .build();

        when(userRepository.findByEmail("locked@example.com")).thenReturn(java.util.Optional.of(disabledUser));

        mockMvc.perform(post("/api/auth/forgot-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest());

        verify(userRepository, never()).save(any(User.class));
    }
}
