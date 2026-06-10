package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.List;

import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.ReminderDTO;
import com.rfm.application.model.dto.ReminderRequest;
import com.rfm.application.model.entity.Reminder;
import com.rfm.application.repository.ProjectObjectRepository;
import com.rfm.application.repository.ReminderRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final ProjectObjectRepository projectObjectRepository;

    @Transactional
    public ReminderDTO create(ReminderRequest request) {
        LocalDateTime now = LocalDateTime.now();
        Reminder reminder = Reminder.builder()
                .title(request.title())
                .description(request.description())
                .reminderDate(request.reminderDate())
                .idUser(request.idUser())
                .idObject(request.idObject())
                .isCompleted(false)
                .createdAt(now)
                .build();

        reminder = reminderRepository.save(reminder);
        return mapToDTO(reminder);
    }

    public List<ReminderDTO> findByIdUser(Long idUser) {
        return reminderRepository.findByIdUser(idUser).stream().map(this::mapToDTO).toList();
    }
    
    public List<ReminderDTO> findByIdObject(Long idObject) {
        return reminderRepository.findByIdObject(idObject)
                .stream()
                .filter(reminder -> !reminder.getIsCompleted())
                .map(this::mapToDTO)
                .toList();
    }
    public List<ReminderDTO> findByIdUserAndIsCompleted(Long idUser, Boolean isCompleted) {
        return reminderRepository.findByIdUserAndIsCompleted(idUser, isCompleted)
                .stream().map(this::mapToDTO).toList();
    }

    public List<ReminderDTO> findWithFilters(Long idUser, Boolean isCompleted, LocalDateTime startDate, LocalDateTime endDate) {
        return reminderRepository.findWithFilters(idUser, isCompleted, startDate, endDate)
                .stream().map(this::mapToDTO).toList();
    }

    public ReminderDTO findById(Long id) {
        return reminderRepository.findById(id).map(this::mapToDTO).orElseThrow();
    }

    @Transactional
    public ReminderDTO update(Long id, ReminderRequest request) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));

        reminder.setTitle(request.title());
        reminder.setDescription(request.description());
        reminder.setReminderDate(request.reminderDate());
        reminder.setIdObject(request.idObject());

        reminder = reminderRepository.save(reminder);
        return mapToDTO(reminder);
    }

    @Transactional
    public ReminderDTO markAsCompleted(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));

        reminder.setIsCompleted(true);
        reminder.setCompletedAt(LocalDateTime.now());

        reminder = reminderRepository.save(reminder);
        return mapToDTO(reminder);
    }

    @Transactional
    public void delete(Long id) {
        reminderRepository.deleteById(id);
    }

    private ReminderDTO mapToDTO(Reminder reminder) {
        String username = userRepository.findById(reminder.getIdUser())
                .map(u -> u.getUsername())
                .orElse("Unknown User");

        String objectTitle = null;
        if (reminder.getIdObject() != null) {
            objectTitle = projectObjectRepository.findById(reminder.getIdObject())
                    .map(po -> po.getTitle())
                    .orElse(null);
        }

        return ReminderDTO.builder()
                .idReminder(reminder.getIdReminder())
                .title(reminder.getTitle())
                .description(reminder.getDescription())
                .reminderDate(reminder.getReminderDate())
                .idUser(reminder.getIdUser())
                .username(username)
                .idObject(reminder.getIdObject())
                .objectTitle(objectTitle)
                .isCompleted(reminder.getIsCompleted())
                .completedAt(reminder.getCompletedAt())
                .createdAt(reminder.getCreatedAt())
                .build();
    }
}
