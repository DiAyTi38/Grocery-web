package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.CategoryDto;
import com.grocery.grocery_backend.model.dto.CategoryRequest;
import com.grocery.grocery_backend.model.entity.Category;
import com.grocery.grocery_backend.repository.CategoryRepository;
import com.grocery.grocery_backend.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CategoryService {

    private final CategoryRepository categoryRepository;
    private final ProductRepository productRepository;

    @Transactional(readOnly = true)
    public List<CategoryDto> findAll() {
        return categoryRepository.findAll().stream()
                .map(CategoryDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public CategoryDto findById(Long id) {
        return CategoryDto.from(getCategory(id));
    }

    public CategoryDto create(CategoryRequest request) {
        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCase(name)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        }

        Category category = Category.builder()
                .name(name)
                .description(trimToNull(request.getDescription()))
                .build();
        return CategoryDto.from(categoryRepository.save(category));
    }

    public CategoryDto update(Long id, CategoryRequest request) {
        Category category = getCategory(id);
        String name = request.getName().trim();
        if (categoryRepository.existsByNameIgnoreCaseAndIdNot(name, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Category name already exists");
        }
        category.setName(name);
        category.setDescription(trimToNull(request.getDescription()));
        return CategoryDto.from(categoryRepository.save(category));
    }

    public void delete(Long id) {
        Category category = getCategory(id);
        if (productRepository.existsByCategoryId(id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Cannot delete category that still has products");
        }
        categoryRepository.delete(category);
    }

    private Category getCategory(Long id) {
        return categoryRepository.findById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
