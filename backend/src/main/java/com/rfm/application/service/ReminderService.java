package com.rfm.application.service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

import org.springframework.stereotype.Service;

import com.rfm.application.enums.RepeatType;
import com.rfm.application.model.dto.ReminderDTO;
import com.rfm.application.model.dto.ReminderRequest;
import com.rfm.application.model.entity.Reminder;
import com.rfm.application.repository.ProjectObjectRepository;
import com.rfm.application.repository.ReminderRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class ReminderService {

    private final ReminderRepository reminderRepository;
    private final UserRepository userRepository;
    private final ProjectObjectRepository projectObjectRepository;

    @Transactional
    public ReminderDTO create(ReminderRequest request) {
        LocalDateTime now = LocalDateTime.now();
        
        // Validar que el tipo de repetición no sea null
        RepeatType repeatType = request.repeatType() != null ? request.repeatType() : RepeatType.NONE;
        
        // Crear el primer recordatorio (padre)
        Reminder parentReminder = Reminder.builder()
                .title(request.title())
                .description(request.description())
                .reminderDate(request.reminderDate())
                .idUser(request.idUser())
                .idObject(request.idObject())
                .isCompleted(false)
                .createdAt(now)
                .repeatType(repeatType)
                .repeatEndDate(request.repeatEndDate())
                .parentReminderId(null) // Es el padre
                .build();

        // Guardar el padre primero
        parentReminder = reminderRepository.save(parentReminder);
        
        // Rolling recurrence: solo creamos la primera ocurrencia activa.
        // Las siguientes ocurrencias se crearán cuando se marque como completado.

        return mapToDTO(parentReminder);
    }

    @Transactional
    public ReminderDTO markAsCompleted(Long id) {
        return markAsCompletedAndCreateNext(id);
    }

    @Transactional
    public ReminderDTO markAsCompletedAndCreateNext(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));

        reminder.setIsCompleted(true);
        reminder.setCompletedAt(LocalDateTime.now());
        reminder = reminderRepository.save(reminder);

        // Si tiene repetición y aún hay fechas disponibles, crear el siguiente
        if (reminder.getRepeatType() != RepeatType.NONE && reminder.getRepeatEndDate() != null) {
            // Verificar si es un recordatorio padre o hijo
            Long parentId = reminder.getParentReminderId() != null ? 
                           reminder.getParentReminderId() : 
                           reminder.getIdReminder();
            
            // Buscar el último recordatorio creado para este padre
            List<Reminder> existingReminders = reminderRepository.findByParentReminderIdOrderByReminderDateDesc(parentId);
            LocalDateTime lastDate = reminder.getReminderDate();
            
            if (!existingReminders.isEmpty()) {
                lastDate = existingReminders.get(0).getReminderDate();
            }
            
            LocalDateTime nextDate = calculateNextDate(lastDate, reminder.getRepeatType());
            
            if (nextDate != null && (nextDate.isBefore(reminder.getRepeatEndDate()) || nextDate.isEqual(reminder.getRepeatEndDate()))) {
                Reminder nextReminder = createNextReminder(reminder, nextDate);
                reminderRepository.save(nextReminder);
            }
        }

        return mapToDTO(reminder);
    }

    public List<ReminderDTO> findByIdUser(Long idUser) {
        return reminderRepository.findByIdUser(idUser)
                .stream().map(this::mapToDTO).toList();
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

    public List<ReminderDTO> findWithFilters(Long idUser, Boolean isCompleted, 
                                            LocalDateTime startDate, LocalDateTime endDate) {
        return reminderRepository.findWithFilters(idUser, isCompleted, startDate, endDate)
                .stream().map(this::mapToDTO).toList();
    }

    public List<ReminderDTO> findWithFilters(Long idUser, Boolean isCompleted, 
                                            LocalDateTime startDate, LocalDateTime endDate, 
                                            RepeatType repeatType) {
        return reminderRepository.findWithFilters(idUser, isCompleted, startDate, endDate, repeatType)
                .stream().map(this::mapToDTO).toList();
    }

    public ReminderDTO findById(Long id) {
        return reminderRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));
    }

    @Transactional
    public ReminderDTO update(Long id, ReminderRequest request) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));

        // Si el reminder tiene repetición, actualizar también los hijos
        if (reminder.getRepeatType() != RepeatType.NONE && reminder.getParentReminderId() == null) {
            // Actualizar todos los recordatorios de la cadena
            List<Reminder> chain = reminderRepository.findByParentReminderId(reminder.getIdReminder());
            
            for (Reminder child : chain) {
                child.setTitle(request.title());
                child.setDescription(request.description());
                child.setIdObject(request.idObject());
                // No cambiar la fecha de los hijos
            }
            reminderRepository.saveAll(chain);
        }

        // Actualizar el recordatorio actual
        reminder.setTitle(request.title());
        reminder.setDescription(request.description());
        reminder.setIdObject(request.idObject());
        
        // Si cambia la fecha y es padre, actualizar la cadena
        if (reminder.getParentReminderId() == null && !reminder.getReminderDate().equals(request.reminderDate())) {
            // Eliminar hijos existentes y recrearlos con las nuevas fechas
            List<Reminder> children = reminderRepository.findByParentReminderId(reminder.getIdReminder());
            if (!children.isEmpty()) {
                reminderRepository.deleteAll(children);
                reminder.setReminderDate(request.reminderDate());
                createAllFutureReminders(reminder);
            }
        } else {
            reminder.setReminderDate(request.reminderDate());
        }
        
        // Actualizar campos de repetición si se proporcionan
        if (request.repeatType() != null) {
            reminder.setRepeatType(request.repeatType());
        }
        if (request.repeatEndDate() != null) {
            reminder.setRepeatEndDate(request.repeatEndDate());
        }

        reminder = reminderRepository.save(reminder);
        return mapToDTO(reminder);
    }

    public List<ReminderDTO> findActiveReminders(Long idUser) {
        return reminderRepository.findActiveReminders(idUser)
                .stream().map(this::mapToDTO).toList();
    }

    public List<ReminderDTO> findByRepeatType(Long idUser, RepeatType repeatType) {
        return reminderRepository.findByRepeatType(idUser, repeatType)
                .stream().map(this::mapToDTO).toList();
    }

    public List<ReminderDTO> findRemindersByDateRange(LocalDateTime startDate, LocalDateTime endDate) {
        return reminderRepository.findRemindersInDateRange(startDate, endDate)
                .stream().map(this::mapToDTO).toList();
    }

    public List<ReminderDTO> getReminderChain(Long id) {
        return reminderRepository.findReminderChain(id)
                .stream().map(this::mapToDTO).toList();
    }

    @Transactional
    public void delete(Long id) {
        if (!reminderRepository.existsById(id)) {
            throw new RuntimeException("Reminder not found with id: " + id);
        }
        reminderRepository.deleteById(id);
    }

    @Transactional
    public void deleteChain(Long id) {
        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));
        
        Long chainStartId = reminder.getParentReminderId() != null ? 
                            reminder.getParentReminderId() : id;
        
        reminderRepository.deleteChain(chainStartId);
    }

    private void createAllFutureReminders(Reminder parentReminder) {
        if (parentReminder.getRepeatType() == RepeatType.NONE || parentReminder.getRepeatEndDate() == null) {
            return;
        }

        LocalDateTime nextDate = calculateNextDate(parentReminder.getReminderDate(), parentReminder.getRepeatType());

        while (nextDate != null &&
               (nextDate.isBefore(parentReminder.getRepeatEndDate()) || nextDate.isEqual(parentReminder.getRepeatEndDate()))) {
            // Solo crear si no existe ya un recordatorio con esta fecha para este padre
            if (!reminderRepository.existsByParentReminderIdAndReminderDate(parentReminder.getIdReminder(), nextDate)) {
                Reminder child = createNextReminder(parentReminder, nextDate);
                reminderRepository.save(child);
            }
            nextDate = calculateNextDate(nextDate, parentReminder.getRepeatType());
        }
    }

    private Reminder createNextReminder(Reminder parent, LocalDateTime nextDate) {
        Long parentId = parent.getParentReminderId() != null ? 
                       parent.getParentReminderId() : 
                       parent.getIdReminder();
        
        return Reminder.builder()
                .title(parent.getTitle())
                .description(parent.getDescription())
                .reminderDate(nextDate)
                .idUser(parent.getIdUser())
                .idObject(parent.getIdObject())
                .isCompleted(false)
                .createdAt(LocalDateTime.now())
                .repeatType(parent.getRepeatType())
                .repeatEndDate(parent.getRepeatEndDate())
                .parentReminderId(parentId)
                .build();
    }

    private LocalDateTime calculateNextDate(LocalDateTime currentDate, RepeatType repeatType) {
        return switch (repeatType) {
            case DAILY -> currentDate.plusDays(1);
            case WEEKLY -> currentDate.plusWeeks(1);
            case MONTHLY -> currentDate.plusMonths(1);
            case QUARTERLY -> currentDate.plusMonths(3);
            case YEARLY -> currentDate.plusYears(1);
            default -> null;
        };
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
                .repeatType(reminder.getRepeatType())
                .nextReminderDate(reminder.getNextReminderDate())
                .lastReminderDate(reminder.getLastReminderDate())
                .repeatEndDate(reminder.getRepeatEndDate())
                .parentReminderId(reminder.getParentReminderId())
                .build();
    }
}