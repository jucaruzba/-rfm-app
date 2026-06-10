package com.rfm.application.service;

import java.time.LocalDate;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rfm.application.model.dto.CreateFolderDTO;
import com.rfm.application.model.dto.TaskDTO;
import com.rfm.application.model.dto.TaskRequest;
import com.rfm.application.model.entity.Node;
import com.rfm.application.model.entity.Task;
import com.rfm.application.model.entity.Company;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.NodeRepository;
import com.rfm.application.repository.TaskRepository;
import com.rfm.application.repository.CompanyRepository;
import com.rfm.application.repository.UserRepository;

import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TaskService {

	private final TaskRepository taskRepository;
	private final NodeService nodeService;
	private final NodeRepository nodeRepository;
	private final CompanyRepository companyRepository;
	private final UserRepository userRepository;
	private final NotificationService notificationService;

	@Transactional
	public TaskDTO create(TaskRequest request) {
		Node taskFolderRoot;

		if (request.idCompany() != null) {
			taskFolderRoot = nodeRepository.findByIdCompanyAndName(request.idCompany(), "TASK")
					.orElseThrow(() -> new RuntimeException(
							"TASK root folder not found for company: " + request.idCompany()));
		} else {
			taskFolderRoot = nodeRepository.findByNameAndIdCompanyIsNull("GTASKS")
					.orElseThrow(() -> new RuntimeException("Global root node for TASK not found"));
		}

		String cleanTitle = request.title().toUpperCase().replaceAll("[^A-Z0-9]", "_");
		if (cleanTitle.length() > 30)
			cleanTitle = cleanTitle.substring(0, 30);
		String folderName = cleanTitle + "_" + (1000 + new Random().nextInt(9000));

		Node taskNode = nodeService.createFolder(new CreateFolderDTO(taskFolderRoot.getIdNode(), folderName,
				"Folder for task: " + request.title(), request.idCompany()));

		Task task = Task.builder().title(request.title()).description(request.description())
				.startDate(request.startDate()).endDate(request.endDate()).idCompany(request.idCompany())
				.externalReferenceName(request.externalReferenceName()).idUserAssigned(request.idUserAssigned())
				.idNode(taskNode.getIdNode()).status("PENDING").build();

		Task savedTask = taskRepository.save(task);

		if (savedTask.getIdUserAssigned() != null) {
			notificationService.create(
					savedTask.getIdUserAssigned(),
					"New task assigned",
					"You have been assigned the task: " + savedTask.getTitle(),
					"task",
					savedTask.getIdTask()
			);
		}

		return mapToDTO(savedTask);
	}

	@Transactional
	public TaskDTO update(Long id, TaskRequest request) {
		Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task does not exist"));

		boolean userAssignmentChanged = !java.util.Objects.equals(task.getIdUserAssigned(), request.idUserAssigned());

		task.setTitle(request.title());
		task.setDescription(request.description());
		task.setStatus(request.status());
		task.setStartDate(request.startDate());
		task.setEndDate(request.endDate());
		task.setExternalReferenceName(request.externalReferenceName());
		task.setIdCompany(request.idCompany());
		task.setIdUserAssigned(request.idUserAssigned());

		Task savedTask = taskRepository.save(task);

		if (userAssignmentChanged && request.idUserAssigned() != null) {
			notificationService.create(
					request.idUserAssigned(),
					"Task assigned",
					"You have been assigned the task: " + savedTask.getTitle(),
					"task",
					savedTask.getIdTask()
			);
		}

		return mapToDTO(savedTask);
	}

	public TaskDTO findById(Long id) {
		return taskRepository.findById(id).map(this::mapToDTO)
				.orElseThrow(() -> new RuntimeException("Task does not exist"));
	}

	public Page<TaskDTO> findWithFilters(Long idCompany, String status, Long idUser, LocalDate start, LocalDate end,
			Pageable pageable) {
		Page<Task> taskPage = taskRepository.findWithFilters(idCompany, status, idUser, start, end, pageable);

		return taskPage.map(this::mapToDTO);
	}

	public List<TaskDTO> findFilters(Long idCompany, String status, Long idUser, LocalDate start, LocalDate end) {
		List<Task> tasks = taskRepository.findFilters(idCompany, status, idUser, start, end);

		return tasks.stream().map(this::mapToDTO).collect(Collectors.toList());
	}

	@Transactional
	public TaskDTO updateStatus(Long id, String status) {
		Task task = taskRepository.findById(id).orElseThrow(() -> new RuntimeException("Task not found"));
		task.setStatus(status);
		return mapToDTO(taskRepository.save(task));
	}

	private TaskDTO mapToDTO(Task task) {
		String nameCompany = null;
		// Avoid NullPointerException if idCompany is null
		if (task.getIdCompany() != null) {
			nameCompany = companyRepository.findById(task.getIdCompany()).map(Company::getName)
					.orElse("Unknown Company");
		} else {
			nameCompany = "Global / No Company";
		}

		String nameUser = null;
		if (task.getIdUserAssigned() != null) {
			nameUser = userRepository.findById(task.getIdUserAssigned()).map(User::getUsername).orElse("Unknown User");
		}

		return TaskDTO.builder().idTask(task.getIdTask()).title(task.getTitle()).description(task.getDescription())
				.status(task.getStatus()).startDate(task.getStartDate()).endDate(task.getEndDate())
				.idCompany(task.getIdCompany()).nameCompany(nameCompany)
				.externalReferenceName(task.getExternalReferenceName()).idUserAssigned(task.getIdUserAssigned())
				.nameUser(nameUser).idNode(task.getIdNode()).build();
	}
}