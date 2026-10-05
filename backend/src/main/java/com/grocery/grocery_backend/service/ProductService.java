package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.ProductDto;
import com.grocery.grocery_backend.model.dto.ProductRequest;
import com.grocery.grocery_backend.model.entity.Category;
import com.grocery.grocery_backend.model.entity.Inventory;
import com.grocery.grocery_backend.model.entity.Product;
import com.grocery.grocery_backend.repository.CategoryRepository;
import com.grocery.grocery_backend.repository.ProductRepository;
import com.grocery.grocery_backend.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ProductService {

    private final ProductRepository productRepository;
    private final CategoryRepository categoryRepository;

    @Transactional(readOnly = true)
    public List<ProductDto> search(Long categoryId, String q, boolean includeInactive, Authentication authentication) {
        boolean activeOnly = !(includeInactive && SecurityUtils.isAdmin(authentication));
        return productRepository.search(categoryId, q, activeOnly).stream()
                .map(ProductDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public ProductDto findById(Long id, Authentication authentication) {
        Product product = getDetailedProduct(id);
        if (!product.isActive() && !SecurityUtils.isAdmin(authentication)) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found");
        }
        return ProductDto.from(product);
    }

    public ProductDto create(ProductRequest request) {
        if (productRepository.existsBySkuIgnoreCase(request.getSku().trim())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SKU already exists");
        }

        Product product = Product.builder()
                .category(getCategory(request.getCategoryId()))
                .sku(request.getSku().trim())
                .name(request.getName().trim())
                .description(trimToNull(request.getDescription()))
                .unit(request.getUnit().trim())
                .price(request.getPrice())
                .imageUrl(trimToNull(request.getImageUrl()))
                .active(request.getActive() == null || request.getActive())
                .build();

        Inventory inventory = Inventory.builder()
                .product(product)
                .quantity(request.getInitialQuantity() == null ? 0 : request.getInitialQuantity())
                .reservedQuantity(0)
                .lowStockThreshold(request.getLowStockThreshold() == null ? 5 : request.getLowStockThreshold())
                .build();
        product.setInventory(inventory);

        return ProductDto.from(productRepository.save(product));
    }

    public ProductDto update(Long id, ProductRequest request) {
        Product product = getDetailedProduct(id);
        String sku = request.getSku().trim();
        if (productRepository.existsBySkuIgnoreCaseAndIdNot(sku, id)) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "SKU already exists");
        }

        product.setCategory(getCategory(request.getCategoryId()));
        product.setSku(sku);
        product.setName(request.getName().trim());
        product.setDescription(trimToNull(request.getDescription()));
        product.setUnit(request.getUnit().trim());
        product.setPrice(request.getPrice());
        product.setImageUrl(trimToNull(request.getImageUrl()));
        if (request.getActive() != null) {
            product.setActive(request.getActive());
        }
        return ProductDto.from(productRepository.save(product));
    }

    public ProductDto deactivate(Long id) {
        Product product = getDetailedProduct(id);
        product.setActive(false);
        return ProductDto.from(productRepository.save(product));
    }

    private Product getDetailedProduct(Long id) {
        return productRepository.findDetailedById(id)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Product not found"));
    }

    private Category getCategory(Long categoryId) {
        return categoryRepository.findById(categoryId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Category not found"));
    }

    private String trimToNull(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        return value.trim();
    }
}
