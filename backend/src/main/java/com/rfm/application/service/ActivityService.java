package com.rfm.application.service;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;
import java.util.Random;

import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.ActivityDTO;
import com.rfm.application.model.dto.ActivityRequest;
import com.rfm.application.model.dto.CreateFolderDTO;
import com.rfm.application.model.entity.Activity;
import com.rfm.application.model.entity.Node;
import com.rfm.application.repository.ActivityCommentRepository;
import com.rfm.application.repository.ActivityRepository;
import com.rfm.application.repository.NodeRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ActivityService {

    private final ActivityRepository activityRepository;
    private final NodeService nodeService;
    private final NodeRepository nodeRepository;
    private final ActivityCommentRepository commentRepository;

    @Transactional
    public ActivityDTO create(ActivityRequest request) {
        Node activityFolderRoot;

        if (request.idCompany() != null) {
            activityFolderRoot = nodeRepository.findByIdCompanyAndName(request.idCompany(), "ACTIVITIES")
                    .orElseThrow(() -> new RuntimeException("ACTIVITIES root folder not found for company"));
        } else {
            activityFolderRoot = nodeRepository.findByNameAndIdCompanyIsNull("GACTIVITIES")
                    .orElseThrow(() -> new RuntimeException("Global root node not found"));
        }

        String cleanTitle = request.title().toUpperCase().replaceAll("[^A-Z0-9]", "_");
        if (cleanTitle.length() > 30) cleanTitle = cleanTitle.substring(0, 30);
        String folderName = cleanTitle + "_" + (1000 + new Random().nextInt(9000));

        Node activityNode = nodeService.createFolder(
            new CreateFolderDTO(
                activityFolderRoot.getIdNode(),
                folderName,
                "Folder for activity: " + request.title(),
                request.idCompany() 
            )
        );

        Activity activity = Activity.builder()
                .title(request.title())
                .description(request.description())
                .eventDate(request.eventDate())
                .idCompany(request.idCompany())
                .externalReferenceName(request.externalReferenceName())
                .idNode(activityNode.getIdNode())
                .build();

        return mapToDTO(activityRepository.save(activity));
    }

    public List<ActivityDTO> findByCompanyAndDateRange(Long idCompany, LocalDateTime start, LocalDateTime end) {
        return activityRepository.findAllByFilters(idCompany, start, end)
                .stream().map(this::mapToDTO).toList();
    }

    private ActivityDTO mapToDTO(Activity a) {
        return ActivityDTO.builder()
                .idActivity(a.getIdActivity())
                .title(a.getTitle())
                .description(a.getDescription())
                .eventDate(a.getEventDate())
                .idCompany(a.getIdCompany())
                .externalReferenceName(a.getExternalReferenceName())
                .idNode(a.getIdNode())
                .build();
    }
    
    @Transactional
    public ActivityDTO update(Long id, ActivityRequest request) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found with ID: " + id));
        activity.setIdCompany(request.idCompany());
        activity.setTitle(request.title());
        activity.setDescription(request.description());
        activity.setEventDate(request.eventDate());
        activity.setExternalReferenceName(request.externalReferenceName());

        return mapToDTO(activityRepository.save(activity));
    }

    public ActivityDTO findById(Long id) {
        return activityRepository.findById(id)
                .map(this::mapToDTO)
                .orElseThrow(() -> new RuntimeException("Activity not found with ID: " + id));
    }
    
    /**
     * Deletes an activity and PURGES all associated resources:
     * Comments, node records, and physical files on the NAS.
     */
    @Transactional
    public void delete(Long id) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Activity not found with ID: " + id));

        commentRepository.deleteAllByIdActivity(id);

        if (activity.getIdNode() != null) {
            deleteNodeRecursive(activity.getIdNode());
        }

        activityRepository.delete(activity);
    }

    /**
     * Navigates through the folder structure deleting physical and logical content.
     */
    private void deleteNodeRecursive(Long idNode) {
        List<Node> children = nodeRepository.findByIdParent(idNode);
        
        for (Node child : children) {
            deleteNodeRecursive(child.getIdNode());
        }
        nodeRepository.findById(idNode).ifPresent(node -> {
            deletePhysicalPath(node.getRealPath());
            nodeRepository.delete(node);
        });
    }

    /**
     * Uses Java NIO to delete files and directories on disk (NAS).
     */
    private void deletePhysicalPath(String realPath) {
        if (realPath == null || realPath.isEmpty()) return;

        try {
            Path path = Paths.get(realPath);
            if (Files.exists(path)) {
                Files.walk(path)
                    .sorted(Comparator.reverseOrder()) 
                    .map(Path::toFile)
                    .forEach(java.io.File::delete);
            }
        } catch (IOException e) {
            System.err.println("Critical error purging NAS: " + e.getMessage());
        }
    }
}