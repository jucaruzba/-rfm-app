package com.rfm.application.scheduler;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Set;
import java.util.concurrent.ConcurrentHashMap;

import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

import com.rfm.application.email.service.NotificacionCorreoService;
import com.rfm.application.model.entity.Reminder;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.NotificationRepository;
import com.rfm.application.repository.ReminderRepository;
import com.rfm.application.repository.UserRepository;
import com.rfm.application.service.NotificationService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReminderScheduler {

    private final ReminderRepository reminderRepository;
    private final NotificationRepository notificationRepository;
    private final NotificationService notificationService;
    private final UserRepository userRepository;
    private final NotificacionCorreoService emailService;

    // Cache en memoria para prevenir envíos duplicados durante el ciclo de vida de la app
    private final Set<String> sentAlertsCache = ConcurrentHashMap.newKeySet();

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    /**
     * Revisa periódicamente los recordatorios activos y envía notificaciones
     * tanto a la tabla de notificaciones como al correo electrónico del usuario
     * en los intervalos requeridos: 1 semana, 3 días, 1 día y 2 horas antes.
     * Cada alerta de ciclo se envía exactamente UNA SOLA VEZ.
     */
    @Scheduled(fixedRate = 60000) // Se ejecuta cada minuto
    public void processUpcomingReminderAlerts() {
        LocalDateTime now = LocalDateTime.now();
        List<Reminder> allReminders = reminderRepository.findAll();

        List<Reminder> activeReminders = allReminders.stream()
                .filter(r -> Boolean.FALSE.equals(r.getIsCompleted()) || r.getIsCompleted() == null)
                .filter(r -> r.getReminderDate() != null && r.getReminderDate().isAfter(now))
                .toList();

        for (Reminder reminder : activeReminders) {
            checkAndSendMilestone(reminder, now);
        }
    }

    private void checkAndSendMilestone(Reminder reminder, LocalDateTime now) {
        LocalDateTime target = reminder.getReminderDate();
        Long userId = reminder.getIdUser();
        Long reminderId = reminder.getIdReminder();
        String formattedDate = target.format(DATE_FORMATTER);

        // Milestone 1: 1 semana antes (-7 días hasta -3 días)
        LocalDateTime oneWeekBefore = target.minusWeeks(1);
        LocalDateTime threeDaysBefore = target.minusDays(3);
        if ((now.isEqual(oneWeekBefore) || now.isAfter(oneWeekBefore)) && now.isBefore(threeDaysBefore)) {
            dispatchAlert(reminder, userId, reminderId, reminder.getTitle(), reminder.getDescription(),
                    formattedDate, "1 semana", now);
        }

        // Milestone 2: 3 días antes (-3 días hasta -1 día)
        LocalDateTime oneDayBefore = target.minusDays(1);
        if ((now.isEqual(threeDaysBefore) || now.isAfter(threeDaysBefore)) && now.isBefore(oneDayBefore)) {
            dispatchAlert(reminder, userId, reminderId, reminder.getTitle(), reminder.getDescription(),
                    formattedDate, "3 días", now);
        }

        // Milestone 3: 1 día antes (-24 horas hasta -2 horas)
        LocalDateTime twoHoursBefore = target.minusHours(2);
        if ((now.isEqual(oneDayBefore) || now.isAfter(oneDayBefore)) && now.isBefore(twoHoursBefore)) {
            dispatchAlert(reminder, userId, reminderId, reminder.getTitle(), reminder.getDescription(),
                    formattedDate, "1 día", now);
        }

        // Milestone 4: 2 horas antes (-2 horas hasta la hora del evento)
        if ((now.isEqual(twoHoursBefore) || now.isAfter(twoHoursBefore)) && now.isBefore(target)) {
            dispatchAlert(reminder, userId, reminderId, reminder.getTitle(), reminder.getDescription(),
                    formattedDate, "2 horas", now);
        }
    }

    private void dispatchAlert(Reminder reminder, Long userId, Long reminderId, String title, String description,
                              String formattedDate, String timeframeLabel, LocalDateTime now) {
        String labelTag = "(" + timeframeLabel + ")";
        String cacheKey = reminderId + ":" + timeframeLabel;

        // 1. Verificación en memoria (rápida)
        if (sentAlertsCache.contains(cacheKey)) {
            return;
        }

        // 2. Verificación en base de datos (persistente)
        String labelPattern = "%" + labelTag + "%";
        if (notificationRepository.existsReminderAlert(userId, reminderId, labelPattern)) {
            sentAlertsCache.add(cacheKey);
            return; // Ya fue enviada previamente en la base de datos
        }

        log.info("Despachando alerta única de recordatorio [{}] para usuario {} (ID recordatorio: {})",
                timeframeLabel, userId, reminderId);

        // Bloquear en caché de inmediato
        sentAlertsCache.add(cacheKey);

        // 3. Crear notificación en la tabla notifications (reference_type 'pending' compatible con Postgres CHECK)
        String notifTitle = "Recordatorio " + labelTag + ": " + title;
        String notifDesc = (description != null && !description.isBlank())
                ? description + " - Fecha: " + formattedDate
                : "Vence en " + timeframeLabel + " (" + formattedDate + ")";

        try {
            notificationService.create(userId, notifTitle, notifDesc, "pending", reminderId);
        } catch (Exception e) {
            log.error("Error guardando notificación para recordatorio {}: {}", reminderId, e.getMessage());
            sentAlertsCache.remove(cacheKey);
            return; // Si falló al guardar en DB, NO enviar email para evitar desincronización
        }

        // 4. Actualizar fecha de último recordatorio despachado en entidad
        try {
            reminder.setLastReminderDate(now);
            reminderRepository.save(reminder);
        } catch (Exception e) {
            log.warn("No se pudo actualizar last_reminder_date para recordatorio {}: {}", reminderId, e.getMessage());
        }

        // 5. Enviar correo electrónico al usuario asignado (exactamente una vez)
        try {
            User user = userRepository.findById(userId).orElse(null);
            if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
                emailService.sendReminderEmail(user.getEmail(), title, description, formattedDate, timeframeLabel);
            }
        } catch (Exception e) {
            log.error("Error enviando correo de recordatorio {} a usuario {}: {}", reminderId, userId, e.getMessage());
        }
    }
}
