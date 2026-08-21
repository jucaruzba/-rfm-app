package com.rfm.application.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rfm.application.enums.RepeatType;
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
import lombok.extern.slf4j.Slf4j;

@Slf4j
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

		RepeatType repeatType = request.repeatType() != null ? request.repeatType() : RepeatType.NONE;
		String priority = (request.priority() != null && !request.priority().isBlank())
				? request.priority().toUpperCase()
				: "NORMAL";

		Task task = Task.builder()
				.title(request.title())
				.description(request.description())
				.startDate(request.startDate())
				.endDate(request.endDate())
				.idCompany(request.idCompany())
				.externalReferenceName(request.externalReferenceName())
				.idUserAssigned(request.idUserAssigned())
				.idNode(taskNode.getIdNode())
				.status("PENDING")
				.repeatType(repeatType)
				.repeatEndDate(request.repeatEndDate())
				.parentTaskId(null)
				.priority(priority)
				.build();

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

		// Si es una tarea con repetición, crear las instancias futuras
		if (repeatType != RepeatType.NONE && request.repeatEndDate() != null && request.startDate() != null) {
			createAllFutureTasks(savedTask, taskFolderRoot);
		}

		return mapToDTO(savedTask);
	}

	private void createAllFutureTasks(Task parent, Node taskFolderRoot) {
		try {
			LocalDate currentStart = parent.getStartDate();
			LocalDate endDate = parent.getRepeatEndDate();
			long durationDays = (parent.getEndDate() != null && parent.getStartDate() != null)
					? java.time.temporal.ChronoUnit.DAYS.between(parent.getStartDate(), parent.getEndDate())
					: 0;

			List<Task> futureTasks = new ArrayList<>();
			int count = 0;

			while (currentStart.isBefore(endDate) || currentStart.isEqual(endDate)) {
				LocalDate nextStart = calculateNextDate(currentStart, parent.getRepeatType());
				if (nextStart == null || nextStart.isAfter(endDate)) {
					break;
				}

				LocalDate nextEnd = (parent.getEndDate() != null) ? nextStart.plusDays(durationDays) : null;

				String cleanTitle = parent.getTitle().toUpperCase().replaceAll("[^A-Z0-9]", "_");
				if (cleanTitle.length() > 30)
					cleanTitle = cleanTitle.substring(0, 30);
				String folderName = cleanTitle + "_" + (1000 + new Random().nextInt(9000));

				Node childNode = nodeService.createFolder(new CreateFolderDTO(taskFolderRoot.getIdNode(), folderName,
						"Folder for recurring task: " + parent.getTitle(), parent.getIdCompany()));

				Task childTask = Task.builder()
						.title(parent.getTitle())
						.description(parent.getDescription())
						.startDate(nextStart)
						.endDate(nextEnd)
						.idCompany(parent.getIdCompany())
						.externalReferenceName(parent.getExternalReferenceName())
						.idUserAssigned(parent.getIdUserAssigned())
						.idNode(childNode.getIdNode())
						.status("PENDING")
						.repeatType(parent.getRepeatType())
						.repeatEndDate(parent.getRepeatEndDate())
						.parentTaskId(parent.getIdTask())
						.priority(parent.getPriority())
						.build();

				futureTasks.add(childTask);
				currentStart = nextStart;
				count++;

				if (count >= 365) {
					log.warn("Límite máximo de 365 tareas recurrentes alcanzado para {}", parent.getIdTask());
					break;
				}
			}

			if (!futureTasks.isEmpty()) {
				taskRepository.saveAll(futureTasks);
				log.info("Creadas {} tareas recurrentes para tarea padre {}", futureTasks.size(), parent.getIdTask());
			}
		} catch (Exception e) {
			log.error("Error creando tareas recurrentes para tarea padre {}: {}", parent.getIdTask(), e.getMessage(), e);
		}
	}

	private LocalDate calculateNextDate(LocalDate currentDate, RepeatType repeatType) {
		if (currentDate == null || repeatType == null) return null;
		return switch (repeatType) {
			case DAILY -> currentDate.plusDays(1);
			case WEEKLY -> currentDate.plusWeeks(1);
			case MONTHLY -> currentDate.plusMonths(1);
			case QUARTERLY -> currentDate.plusMonths(3);
			case YEARLY -> currentDate.plusYears(1);
			default -> null;
		};
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
		if (request.repeatType() != null) {
			task.setRepeatType(request.repeatType());
		}
		if (request.repeatEndDate() != null) {
			task.setRepeatEndDate(request.repeatEndDate());
		}
		if (request.priority() != null && !request.priority().isBlank()) {
			task.setPriority(request.priority().toUpperCase());
		}

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

	public Page<TaskDTO> findWithFilters(Long idCompany, String status, Long idUser, String title, LocalDate start, LocalDate end,
			Pageable pageable) {
		String titlePattern = (title != null && !title.trim().isEmpty()) ? "%" + title.trim() + "%" : null;
		Page<Task> taskPage = taskRepository.findWithFilters(idCompany, status, idUser, titlePattern, start, end, pageable);

		return taskPage.map(this::mapToDTO);
	}

	public List<TaskDTO> findFilters(Long idCompany, String status, Long idUser, String title, LocalDate start, LocalDate end) {
		String titlePattern = (title != null && !title.trim().isEmpty()) ? "%" + title.trim() + "%" : null;
		List<Task> tasks = taskRepository.findFilters(idCompany, status, idUser, titlePattern, start, end);

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
				.nameUser(nameUser).idNode(task.getIdNode())
				.repeatType(task.getRepeatType())
				.repeatEndDate(task.getRepeatEndDate())
				.parentTaskId(task.getParentTaskId())
				.priority(task.getPriority() != null ? task.getPriority() : "NORMAL")
				.build();
	}
}