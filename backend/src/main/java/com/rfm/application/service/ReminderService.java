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
                .repeatEndDate(null)
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
        if (id != null && id < 0) {
            long pos = -id;
            long timeCode = pos % 1000000000L;
            long parentId = pos / 1000000000L;
            long epochDay = timeCode / 1440L;
            long minuteOfDay = timeCode % 1440L;
            LocalDateTime occDate = java.time.LocalDate.ofEpochDay(epochDay).atTime((int) (minuteOfDay / 60), (int) (minuteOfDay % 60));

            Reminder parent = reminderRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent reminder not found for virtual occurrence"));

            // Verificar si ya fue persistido
            List<Reminder> chain = reminderRepository.findByParentReminderId(parentId);
            Reminder existing = chain.stream().filter(r -> occDate.equals(r.getReminderDate())).findFirst().orElse(null);
            if (existing != null) {
                existing.setIsCompleted(true);
                existing.setCompletedAt(LocalDateTime.now());
                return mapToDTO(reminderRepository.save(existing));
            }

            Reminder child = Reminder.builder()
                    .title(parent.getTitle())
                    .description(parent.getDescription())
                    .reminderDate(occDate)
                    .idUser(parent.getIdUser())
                    .idObject(parent.getIdObject())
                    .isCompleted(true)
                    .completedAt(LocalDateTime.now())
                    .createdAt(LocalDateTime.now())
                    .repeatType(parent.getRepeatType())
                    .repeatEndDate(parent.getRepeatEndDate())
                    .parentReminderId(parentId)
                    .build();

            return mapToDTO(reminderRepository.save(child));
        }

        return markAsCompletedAndCreateNext(id);
    }

    @Transactional
    public ReminderDTO markAsCompletedAndCreateNext(Long id) {
        if (id != null && id < 0) {
            return markAsCompleted(id);
        }

        Reminder reminder = reminderRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));

        reminder.setIsCompleted(true);
        reminder.setCompletedAt(LocalDateTime.now());
        reminder = reminderRepository.save(reminder);

        // Si tiene repetición y aún hay fechas disponibles, crear el siguiente
        if (reminder.getRepeatType() != RepeatType.NONE && (reminder.getRepeatEndDate() == null || reminder.getReminderDate().isBefore(reminder.getRepeatEndDate()))) {
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
            
            if (nextDate != null && (reminder.getRepeatEndDate() == null || nextDate.isBefore(reminder.getRepeatEndDate()) || nextDate.isEqual(reminder.getRepeatEndDate()))) {
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
        return findWithFilters(idUser, isCompleted, startDate, endDate, null);
    }

    public List<ReminderDTO> findWithFilters(Long idUser, Boolean isCompleted, 
                                            LocalDateTime startDate, LocalDateTime endDate, 
                                            RepeatType repeatType) {
        List<Reminder> dbReminders = reminderRepository.findWithFilters(idUser, isCompleted, startDate, endDate, repeatType);
        List<ReminderDTO> resultList = new ArrayList<>(dbReminders.stream().map(this::mapToDTO).toList());

        // Proyección virtual de recordatorios recurrentes en el rango de calendario
        if (startDate != null && endDate != null) {
            List<Reminder> rootRecurring = reminderRepository.findRootRecurringReminders(idUser);
            for (Reminder root : rootRecurring) {
                if (root.getReminderDate() == null || root.getRepeatType() == null || root.getRepeatType() == RepeatType.NONE) {
                    continue;
                }
                if (repeatType != null && root.getRepeatType() != repeatType) {
                    continue;
                }

                Long parentId = root.getIdReminder();
                LocalDateTime occDate = root.getReminderDate();
                LocalDateTime limitEnd = root.getRepeatEndDate();

                while (occDate != null && !occDate.isAfter(endDate)) {
                    if (limitEnd != null && occDate.isAfter(limitEnd)) {
                        break;
                    }

                    if (!occDate.isBefore(startDate)) {
                        final LocalDateTime currentOccDate = occDate;
                        // Evitar duplicar si ya existe en la lista de BD para este padre en esta fecha
                        boolean alreadyInDb = resultList.stream().anyMatch(dto -> 
                            (parentId.equals(dto.getParentReminderId()) || parentId.equals(dto.getIdReminder())) &&
                            currentOccDate.equals(dto.getReminderDate())
                        );

                        if (!alreadyInDb && (isCompleted == null || !isCompleted)) {
                            long timeCode = currentOccDate.toLocalDate().toEpochDay() * 1440L + currentOccDate.getHour() * 60 + currentOccDate.getMinute();
                            long virtualId = -(parentId * 1000000000L + timeCode);

                            String username = userRepository.findById(root.getIdUser()).map(u -> u.getUsername()).orElse("Unknown User");
                            String objectTitle = root.getIdObject() != null ? projectObjectRepository.findById(root.getIdObject()).map(po -> po.getTitle()).orElse(null) : null;

                            ReminderDTO virtualDto = ReminderDTO.builder()
                                    .idReminder(virtualId)
                                    .title(root.getTitle())
                                    .description(root.getDescription())
                                    .reminderDate(currentOccDate)
                                    .idUser(root.getIdUser())
                                    .username(username)
                                    .idObject(root.getIdObject())
                                    .objectTitle(objectTitle)
                                    .isCompleted(false)
                                    .completedAt(null)
                                    .createdAt(root.getCreatedAt())
                                    .repeatType(root.getRepeatType())
                                    .repeatEndDate(root.getRepeatEndDate())
                                    .parentReminderId(parentId)
                                    .build();

                            resultList.add(virtualDto);
                        }
                    }

                    occDate = calculateNextDate(occDate, root.getRepeatType());
                }
            }
        }

        // Ordenar cronológicamente
        resultList.sort((a, b) -> {
            if (a.getReminderDate() == null) return 1;
            if (b.getReminderDate() == null) return -1;
            return a.getReminderDate().compareTo(b.getReminderDate());
        });

        return resultList;
    }

    public ReminderDTO findById(Long id) {
        if (id != null && id < 0) {
            long pos = -id;
            long timeCode = pos % 1000000000L;
            long parentId = pos / 1000000000L;
            long epochDay = timeCode / 1440L;
            long minuteOfDay = timeCode % 1440L;
            LocalDateTime occDate = java.time.LocalDate.ofEpochDay(epochDay).atTime((int) (minuteOfDay / 60), (int) (minuteOfDay % 60));

            Reminder parent = reminderRepository.findById(parentId)
                    .orElseThrow(() -> new RuntimeException("Parent reminder not found for virtual occurrence"));

            ReminderDTO dto = mapToDTO(parent);
            dto.setIdReminder(id);
            dto.setReminderDate(occDate);
            dto.setIsCompleted(false);
            dto.setCompletedAt(null);
            dto.setParentReminderId(parentId);
            return dto;
        }

        return reminderRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + id));
    }

    @Transactional
    public ReminderDTO update(Long id, ReminderRequest request) {
        Long targetId = id;
        if (id != null && id < 0) {
            long pos = -id;
            targetId = pos / 1000000000L;
        }
        final Long lookupId = targetId;
        Reminder reminder = reminderRepository.findById(lookupId)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + lookupId));

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
        reminder.setRepeatEndDate(null);

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
        Long targetId = id;
        if (id != null && id < 0) {
            long pos = -id;
            targetId = pos / 1000000000L;
        }
        if (!reminderRepository.existsById(targetId)) {
            throw new RuntimeException("Reminder not found with id: " + targetId);
        }
        reminderRepository.deleteById(targetId);
    }

    @Transactional
    public void deleteChain(Long id) {
        Long targetId = id;
        if (id != null && id < 0) {
            long pos = -id;
            targetId = pos / 1000000000L;
        }
        final Long lookupId = targetId;
        Reminder reminder = reminderRepository.findById(lookupId)
                .orElseThrow(() -> new RuntimeException("Reminder not found with id: " + lookupId));
        
        Long chainStartId = reminder.getParentReminderId() != null ? 
                            reminder.getParentReminderId() : lookupId;
        
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