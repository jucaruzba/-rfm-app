package com.rfm.application.scheduler;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.rfm.application.email.service.NotificacionCorreoService;
import com.rfm.application.model.entity.Task;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.NotificationRepository;
import com.rfm.application.repository.TaskRepository;
import com.rfm.application.repository.UserRepository;
import com.rfm.application.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class TaskAlertScheduler {

    private final TaskRepository taskRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificacionCorreoService emailService;

    // Cache en memoria para prevenir alertas duplicadas en runtime
    private final Set<String> sentAlertsCache = ConcurrentHashMap.newKeySet();

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy");

    /**
     * Revisa periódicamente las tareas activas (no completadas) y envía alertas
     * en los hitos de 7 días, 3 días y 1 día antes de la fecha de vencimiento.
     *
     * Reglas de prioridad:
     * - LOW / NORMAL: Notificación por campana / WebSocket únicamente (sin email).
     * - HIGH: Notificación por campana / WebSocket Y correo electrónico con alta prioridad.
     */
    @Scheduled(fixedRate = 60000) // Cada minuto
    public void processUpcomingTaskAlerts() {
        LocalDate today = LocalDate.now();
        List<Task> allTasks = taskRepository.findAll();

        List<Task> activeTasks = allTasks.stream()
                .filter(t -> t.getStatus() == null || !t.getStatus().equalsIgnoreCase("COMPLETED"))
                .filter(t -> t.getIdUserAssigned() != null)
                .filter(t -> (t.getEndDate() != null ? t.getEndDate() : t.getStartDate()) != null)
                .toList();

        for (Task task : activeTasks) {
            checkAndSendTaskMilestones(task, today);
        }
    }

    private void checkAndSendTaskMilestones(Task task, LocalDate today) {
        LocalDate dueDate = task.getEndDate() != null ? task.getEndDate() : task.getStartDate();
        if (dueDate == null) return;

        // Milestone 1: 7 days before
        LocalDate sevenDaysBefore = dueDate.minusDays(7);
        LocalDate threeDaysBefore = dueDate.minusDays(3);
        if ((today.isEqual(sevenDaysBefore) || today.isAfter(sevenDaysBefore)) && today.isBefore(threeDaysBefore)) {
            dispatchTaskAlert(task, "7 days", dueDate, today);
        }

        // Milestone 2: 3 days before
        LocalDate oneDayBefore = dueDate.minusDays(1);
        if ((today.isEqual(threeDaysBefore) || today.isAfter(threeDaysBefore)) && today.isBefore(oneDayBefore)) {
            dispatchTaskAlert(task, "3 days", dueDate, today);
        }

        // Milestone 3: 1 day before
        if ((today.isEqual(oneDayBefore) || today.isAfter(oneDayBefore)) && (today.isBefore(dueDate) || today.isEqual(dueDate))) {
            dispatchTaskAlert(task, "1 day", dueDate, today);
        }
    }

    private void dispatchTaskAlert(Task task, String timeframeLabel, LocalDate dueDate, LocalDate today) {
        Long userId = task.getIdUserAssigned();
        Long taskId = task.getIdTask();
        String priority = task.getPriority() != null ? task.getPriority().toUpperCase() : "NORMAL";
        boolean isHighPriority = "HIGH".equalsIgnoreCase(priority);

        String labelTag = "(" + timeframeLabel + ")";
        String cacheKey = "task:" + taskId + ":" + timeframeLabel;

        // 1. Memory cache check
        if (sentAlertsCache.contains(cacheKey)) {
            return;
        }

        // 2. Database check
        String labelPattern = "%" + labelTag + "%";
        if (notificationRepository.existsReminderAlert(userId, taskId, labelPattern)) {
            sentAlertsCache.add(cacheKey);
            return;
        }

        log.info("Dispatching task alert [{}] - Priority: {} - User: {} (Task ID: {})",
                timeframeLabel, priority, userId, taskId);

        sentAlertsCache.add(cacheKey);

        String formattedDate = dueDate.format(DATE_FORMATTER);
        String notifTitle = isHighPriority
                ? "🚨 High Priority Task " + labelTag + ": " + task.getTitle()
                : "Task " + labelTag + ": " + task.getTitle();

        String notifDesc = (task.getDescription() != null && !task.getDescription().isBlank())
                ? task.getDescription() + " - Due date: " + formattedDate
                : "Due in " + timeframeLabel + " (" + formattedDate + ")";

        // 3. Create notification in database (bell icon / WebSocket)
        try {
            notificationService.create(userId, notifTitle, notifDesc, "task", taskId);
        } catch (Exception e) {
            log.error("Error saving task notification {}: {}", taskId, e.getMessage());
            sentAlertsCache.remove(cacheKey);
            return;
        }

        // 4. Si es HIGH PRIORITY -> Enviar correo electrónico
        if (isHighPriority) {
            try {
                User user = userRepository.findById(userId).orElse(null);
                if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
                    emailService.sendTaskAlertEmail(user.getEmail(), task.getTitle(), task.getDescription(),
                            formattedDate, timeframeLabel, priority);
                }
            } catch (Exception e) {
                log.error("Error enviando correo de alerta crítica para tarea {} a usuario {}: {}",
                        taskId, userId, e.getMessage());
            }
        }
    }
}
