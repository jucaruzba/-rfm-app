package com.rfm.application.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import com.rfm.application.email.service.NotificacionCorreoService;
import com.rfm.application.enums.RepeatType;
import com.rfm.application.model.dto.CreateFolderDTO;
import com.rfm.application.model.dto.TaskDTO;
import com.rfm.application.model.dto.TaskRequest;
import com.rfm.application.model.entity.Node;
import com.rfm.application.model.entity.Task;
import com.rfm.application.model.entity.Company;
import com.rfm.application.model.entity.User;
import com.rfm.application.repository.NodeRepository;
import com.rfm.application.repository.ReminderRepository;
import com.rfm.application.repository.TaskCommentRepository;
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
	private final TaskCommentRepository taskCommentRepository;
	private final NotificacionCorreoService emailService;
	private final ReminderRepository reminderRepository;

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

		// Rolling recurrence: únicamente creamos la instancia activa inicial.
		// Las instancias siguientes se crean automáticamente cuando esta tarea se marque como COMPLETED.

		sendTaskAssignmentNotification(savedTask, true);

		return mapToDTO(savedTask);
	}

	private void sendTaskAssignmentNotification(Task task, boolean isNew) {
		if (task.getIdUserAssigned() == null) return;
		String priority = task.getPriority() != null ? task.getPriority().toUpperCase() : "NORMAL";

		// LOW -> Sin alerta, solo se ve en el sistema
		if ("LOW".equalsIgnoreCase(priority)) {
			return;
		}

		// NORMAL / HIGH -> Campana (Notification en DB)
		String notifTitle = isNew ? "New task assigned" : "Task assigned";
		try {
			notificationService.create(
					task.getIdUserAssigned(),
					notifTitle,
					"You have been assigned the task: " + task.getTitle(),
					"task",
					task.getIdTask()
			);
		} catch (Exception e) {
			log.error("Error creating notification for task {}: {}", task.getIdTask(), e.getMessage());
		}

		// HIGH -> Campana + Email
		if ("HIGH".equalsIgnoreCase(priority)) {
			try {
				User user = userRepository.findById(task.getIdUserAssigned()).orElse(null);
				if (user != null && user.getEmail() != null && !user.getEmail().isBlank()) {
					String dueDateStr = task.getEndDate() != null ? task.getEndDate().toString() : (task.getStartDate() != null ? task.getStartDate().toString() : "N/A");
					emailService.sendTaskAlertEmail(user.getEmail(), task.getTitle(), task.getDescription(), dueDateStr, "Assigned", priority);
				}
			} catch (Exception e) {
				log.error("Error sending initial HIGH priority task assignment email: {}", e.getMessage());
			}
		}
	}

	public void handleRollingRecurrenceOnComplete(Task completedTask) {
		if (completedTask.getRepeatType() == null || completedTask.getRepeatType() == RepeatType.NONE) {
			return;
		}

		LocalDate currentStart = completedTask.getStartDate();
		if (currentStart == null) return;

		LocalDate nextStart = calculateNextDate(currentStart, completedTask.getRepeatType());
		if (nextStart == null) return;

		LocalDate repeatEndDate = completedTask.getRepeatEndDate();
		if (repeatEndDate != null && nextStart.isAfter(repeatEndDate)) {
			log.info("Repeat end date {} reached for task {}. No further occurrences created.", repeatEndDate, completedTask.getIdTask());
			return;
		}

		Long parentId = completedTask.getParentTaskId() != null ? completedTask.getParentTaskId() : completedTask.getIdTask();

		// Verificar que no exista ya la siguiente ocurrencia para evitar duplicados
		List<Task> existingFuture = taskRepository.findFutureInSeries(parentId, nextStart);
		boolean alreadyExists = existingFuture.stream().anyMatch(t -> nextStart.equals(t.getStartDate()) && !t.getIdTask().equals(completedTask.getIdTask()));
		if (alreadyExists) {
			log.info("Next occurrence on {} already exists for series {}", nextStart, parentId);
			return;
		}

		long durationDays = (completedTask.getEndDate() != null && completedTask.getStartDate() != null)
				? java.time.temporal.ChronoUnit.DAYS.between(completedTask.getStartDate(), completedTask.getEndDate())
				: 0;
		LocalDate nextEnd = (completedTask.getEndDate() != null) ? nextStart.plusDays(durationDays) : null;

		Node taskFolderRoot;
		if (completedTask.getIdCompany() != null) {
			taskFolderRoot = nodeRepository.findByIdCompanyAndName(completedTask.getIdCompany(), "TASK")
					.orElse(null);
		} else {
			taskFolderRoot = nodeRepository.findByNameAndIdCompanyIsNull("GTASKS")
					.orElse(null);
		}

		Long nodeId = completedTask.getIdNode();
		if (taskFolderRoot != null) {
			try {
				String cleanTitle = completedTask.getTitle().toUpperCase().replaceAll("[^A-Z0-9]", "_");
				if (cleanTitle.length() > 30) cleanTitle = cleanTitle.substring(0, 30);
				String folderName = cleanTitle + "_" + (1000 + new Random().nextInt(9000));
				Node childNode = nodeService.createFolder(new CreateFolderDTO(taskFolderRoot.getIdNode(), folderName,
						"Folder for recurring task: " + completedTask.getTitle(), completedTask.getIdCompany()));
				if (childNode != null) {
					nodeId = childNode.getIdNode();
				}
			} catch (Exception e) {
				log.warn("Could not create specific folder for next recurring occurrence: {}", e.getMessage());
			}
		}

		Task nextTask = Task.builder()
				.title(completedTask.getTitle())
				.description(completedTask.getDescription())
				.startDate(nextStart)
				.endDate(nextEnd)
				.idCompany(completedTask.getIdCompany())
				.externalReferenceName(completedTask.getExternalReferenceName())
				.idUserAssigned(completedTask.getIdUserAssigned())
				.idNode(nodeId)
				.status("PENDING")
				.repeatType(completedTask.getRepeatType())
				.repeatEndDate(completedTask.getRepeatEndDate())
				.parentTaskId(parentId)
				.priority(completedTask.getPriority() != null ? completedTask.getPriority() : "NORMAL")
				.build();

		Task savedNext = taskRepository.save(nextTask);
		log.info("Created rolling next occurrence {} for task series {}", savedNext.getIdTask(), parentId);

		sendTaskAssignmentNotification(savedNext, true);
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
		String oldStatus = task.getStatus();

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

		// Rolling recurrence check on status update to COMPLETED
		if ("COMPLETED".equalsIgnoreCase(savedTask.getStatus()) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
			handleRollingRecurrenceOnComplete(savedTask);
		}

		if (userAssignmentChanged && request.idUserAssigned() != null) {
			sendTaskAssignmentNotification(savedTask, false);
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
		String oldStatus = task.getStatus();
		task.setStatus(status);
		Task saved = taskRepository.save(task);

		if ("COMPLETED".equalsIgnoreCase(status) && !"COMPLETED".equalsIgnoreCase(oldStatus)) {
			handleRollingRecurrenceOnComplete(saved);
		}

		return mapToDTO(saved);
	}

	@Transactional
	public void delete(Long id, boolean deleteFuture) {
		Task task = taskRepository.findById(id)
				.orElseThrow(() -> new RuntimeException("Task not found with id: " + id));

		if (deleteFuture) {
			Long parentId = task.getParentTaskId() != null ? task.getParentTaskId() : task.getIdTask();
			LocalDate filterDate = task.getStartDate() != null ? task.getStartDate() : LocalDate.now();
			List<Task> futureTasks = taskRepository.findFutureInSeries(parentId, filterDate);
			for (Task t : futureTasks) {
				deleteTaskAndRelated(t);
			}
			// Ensure the current task is also deleted if it still exists
			if (taskRepository.existsById(id)) {
				deleteTaskAndRelated(task);
			}
		} else {
			deleteTaskAndRelated(task);
		}
	}

	/**
	 * Deletes a single task along with all its related data:
	 * comments, reminders, and the associated node (folder + files on NAS).
	 */
	private void deleteTaskAndRelated(Task task) {
		Long taskId = task.getIdTask();

		// 1. Delete task comments
		taskCommentRepository.deleteAllByIdActivity(taskId);

		// 2. Delete reminders associated with this task (by idObject = taskId)
		List<com.rfm.application.model.entity.Reminder> reminders = reminderRepository.findByIdObject(taskId);
		if (!reminders.isEmpty()) {
			reminderRepository.deleteAll(reminders);
		}

		// 3. Delete the node (folder) and all its content recursively (files + subfolders on NAS)
		if (task.getIdNode() != null) {
			try {
				nodeService.deleteNodeRecursively(task.getIdNode());
			} catch (Exception e) {
				log.warn("Could not fully delete node {} for task {}: {}", task.getIdNode(), taskId, e.getMessage());
			}
		}

		// 4. Delete the task itself
		taskRepository.delete(task);
	}

	private TaskDTO mapToDTO(Task task) {
		String nameCompany = null;
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