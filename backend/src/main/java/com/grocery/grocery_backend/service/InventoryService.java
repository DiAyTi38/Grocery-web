package com.grocery.grocery_backend.service;

import com.grocery.grocery_backend.model.dto.InventoryDto;
import com.grocery.grocery_backend.model.dto.InventoryUpdateRequest;
import com.grocery.grocery_backend.model.entity.Inventory;
import com.grocery.grocery_backend.repository.InventoryRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InventoryService {

    private final InventoryRepository inventoryRepository;

    @Transactional(readOnly = true)
    public List<InventoryDto> findAll() {
        return inventoryRepository.findAllDetailed().stream()
                .map(InventoryDto::from)
                .toList();
    }

    @Transactional(readOnly = true)
    public InventoryDto findByProductId(Long productId) {
        return InventoryDto.from(getByProductId(productId));
    }

    public InventoryDto update(Long productId, InventoryUpdateRequest request) {
        Inventory inventory = getByProductId(productId);
        if (request.getQuantity() < inventory.getReservedQuantity()) {
            throw new ResponseStatusException(
                    HttpStatus.BAD_REQUEST,
                    "Quantity cannot be lower than reserved quantity");
        }
        inventory.setQuantity(request.getQuantity());
        if (request.getLowStockThreshold() != null) {
            inventory.setLowStockThreshold(request.getLowStockThreshold());
        }
        return InventoryDto.from(inventoryRepository.save(inventory));
    }

    private Inventory getByProductId(Long productId) {
        return inventoryRepository.findByProductId(productId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Inventory not found"));
    }
}
