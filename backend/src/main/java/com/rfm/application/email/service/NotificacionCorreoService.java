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
        
}
