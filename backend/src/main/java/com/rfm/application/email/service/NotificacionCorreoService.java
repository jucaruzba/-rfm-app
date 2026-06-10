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
        
}
