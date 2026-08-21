package com.rfm.application.email.service;
import java.io.IOException;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.net.URL;
import java.util.Map;

import javax.imageio.ImageIO;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;
import org.thymeleaf.TemplateEngine;
import org.thymeleaf.context.Context;

import com.rfm.application.model.dto.EmailDTO;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import jakarta.activation.DataSource;
import jakarta.mail.util.ByteArrayDataSource;
import lombok.NoArgsConstructor;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
@RequiredArgsConstructor
public class NotificacionCorreoService {

	private final TemplateEngine templateEngine;
	
    @Autowired
    private JavaMailSender correoJ;
    
    @Value("${spring.mail.username}")
    private String origen;

    /**
     * Procesa cualquier plantilla HTML de templates/ usando un mapa de datos.
     */
    public String processTemplate(String templateName, Map<String, Object> variables) {
        Context context = new Context();
        if (variables != null) {
            context.setVariables(variables);
        }
        return templateEngine.process(templateName, context);
    }

    public void envioPassNueva(EmailDTO dto) throws MessagingException, IOException {

        log.info("-");
        log.info("INICIO DE ENVIO DE CORREO !!!");

        
        MimeMessage message = correoJ.createMimeMessage();
        MimeMessageHelper helper = new MimeMessageHelper(message, true);

        // Cargar imagen del logo
        //URL url = getClass().getClassLoader().getResource("img/logo.png");

        //BufferedImage image = ImageIO.read(url);

        ByteArrayOutputStream byteArrayOutputStream = new ByteArrayOutputStream();
        //ImageIO.write(image, "png", byteArrayOutputStream);

        try {
            helper.setTo(dto.getCorreoDestinatario());
            helper.setSubject(dto.getAsunto());
            helper.setText(dto.getMensajeHtml(), true);
            helper.setFrom(origen);

            byte[] signatureBytes = byteArrayOutputStream.toByteArray();

            DataSource dataSource = new ByteArrayDataSource(signatureBytes, "image/png");
            helper.addInline("logo", dataSource);

            correoJ.send(message);

            log.info("-");
            log.info("EL CORREO FUE ENVIADO EXITOSAMENTE !!!");
            log.info("-");

        } catch (MessagingException e) {

            log.error("ERROR AL ENVIAR EL CORREO : ", e.getMessage());
        }
    }

    public void sendReminderEmail(String toEmail, String reminderTitle, String reminderDescription, String formattedDate, String timeRemainingLabel) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("No se pudo enviar correo de recordatorio: dirección de correo vacía");
            return;
        }

        log.info("Enviando correo de recordatorio a: {}", toEmail);
        try {
            MimeMessage message = correoJ.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("Recordatorio (" + timeRemainingLabel + "): " + reminderTitle);
            helper.setFrom(origen != null && !origen.isBlank() ? origen : "noreply@rfm.com");

            String descContent = (reminderDescription != null && !reminderDescription.isBlank())
                    ? "<p style=\"color: #555; margin: 10px 0;\">" + reminderDescription + "</p>"
                    : "";

            String html = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #eaeaea; border-radius: 12px; background-color: #ffffff;\">"
                    + "<div style=\"background-color: #001F3F; padding: 16px; border-radius: 8px; margin-bottom: 20px; text-align: center;\">"
                    + "<h2 style=\"color: #ffffff; margin: 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;\">Notificación de Recordatorio</h2>"
                    + "</div>"
                    + "<p style=\"font-size: 15px; color: #333;\">Tienes un recordatorio próximo programado para vencer en <strong>" + timeRemainingLabel + "</strong>:</p>"
                    + "<div style=\"background-color: #f4f7fa; padding: 18px; border-left: 4px solid #0056b3; border-radius: 6px; margin: 20px 0;\">"
                    + "<h3 style=\"margin-top: 0; color: #001F3F; font-size: 18px;\">" + reminderTitle + "</h3>"
                    + descContent
                    + "<p style=\"margin-bottom: 0; font-size: 14px; color: #444;\"><strong>Fecha y hora programada:</strong> " + formattedDate + "</p>"
                    + "</div>"
                    + "<p style=\"color: #888; font-size: 12px; margin-top: 24px; text-align: center; border-top: 1px solid #eee; padding-top: 12px;\">Este es un mensaje automático generado por RFM Management Application.</p>"
                    + "</div>";

            helper.setText(html, true);
            correoJ.send(message);
            log.info("Correo de recordatorio enviado exitosamente a {}", toEmail);
        } catch (Exception e) {
            log.error("Error al enviar correo de recordatorio a {}: {}", toEmail, e.getMessage());
        }
    }

    public void sendTaskAlertEmail(String toEmail, String taskTitle, String taskDescription, String dueDateStr, String timeRemainingLabel, String priority) {
        if (toEmail == null || toEmail.isBlank()) {
            log.warn("Could not send task alert email: empty recipient email");
            return;
        }

        log.info("Sending critical task alert email [HIGH] to: {}", toEmail);
        try {
            MimeMessage message = correoJ.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setTo(toEmail);
            helper.setSubject("🚨 [HIGH PRIORITY] Task Due in " + timeRemainingLabel + ": " + taskTitle);
            helper.setFrom(origen != null && !origen.isBlank() ? origen : "noreply@rfm.com");

            String descContent = (taskDescription != null && !taskDescription.isBlank())
                    ? "<p style=\"color: #555; margin: 10px 0; font-size: 14px;\">" + taskDescription + "</p>"
                    : "";

            String html = "<div style=\"font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #ffccd5; border-radius: 12px; background-color: #ffffff;\">"
                    + "<div style=\"background-color: #dc2626; padding: 18px; border-radius: 8px; margin-bottom: 20px; text-align: center;\">"
                    + "<span style=\"background-color: #ffffff; color: #dc2626; font-size: 11px; font-weight: bold; padding: 3px 8px; border-radius: 4px; text-transform: uppercase; letter-spacing: 1px;\">High Priority</span>"
                    + "<h2 style=\"color: #ffffff; margin: 10px 0 0 0; font-size: 20px; text-transform: uppercase; letter-spacing: 1px;\">Critical Task Alert</h2>"
                    + "</div>"
                    + "<p style=\"font-size: 15px; color: #333;\">Attention: You have a <strong>HIGH PRIORITY</strong> task assigned that is due in <strong>" + timeRemainingLabel + "</strong>:</p>"
                    + "<div style=\"background-color: #fff5f5; padding: 18px; border-left: 5px solid #dc2626; border-radius: 6px; margin: 20px 0;\">"
                    + "<h3 style=\"margin-top: 0; color: #001F3F; font-size: 18px;\">" + taskTitle + "</h3>"
                    + descContent
                    + "<p style=\"margin-bottom: 0; font-size: 14px; color: #991b1b;\"><strong>Scheduled Due Date:</strong> " + dueDateStr + "</p>"
                    + "</div>"
                    + "<p style=\"color: #666; font-size: 13px;\">Please log in to the management platform to review and complete this operational directive on time.</p>"
                    + "<p style=\"color: #888; font-size: 12px; margin-top: 24px; text-align: center; border-top: 1px solid #eee; padding-top: 12px;\">Automated operational notification — RFM Management Application.</p>"
                    + "</div>";

            helper.setText(html, true);
            correoJ.send(message);
            log.info("Critical task alert email successfully sent to {}", toEmail);
        } catch (Exception e) {
            log.error("Error sending critical task alert email to {}: {}", toEmail, e.getMessage());
        }
    }
}
