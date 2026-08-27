package com.rfm.application.service;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Random;
import java.util.UUID;
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
import com.rfm.application.repository.NotificationRepository;
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
	private final NotificationRepository notificationRepository;

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

		// Generate a shared series_id for all occurrences if this is a recurring task
		String seriesId = (repeatType != RepeatType.NONE) ? UUID.randomUUID().toString() : null;

		LocalDate startDate = request.startDate();
		LocalDate endDate = request.endDate() != null ? request.endDate() : startDate;

		Task task = Task.builder()
				.title(request.title())
				.description(request.description())
				.startDate(startDate)
				.endDate(endDate)
				.idCompany(request.idCompany())
				.externalReferenceName(request.externalReferenceName())
				.idUserAssigned(request.idUserAssigned())
				.idNode(taskNode.getIdNode())
				.status("PENDING")
				.repeatType(repeatType)
				.repeatEndDate(null)
				.parentTaskId(null)
				.priority(priority)
				.seriesId(seriesId)
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
				.seriesId(completedTask.getSeriesId()) // Propagate the shared series identifier
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

		LocalDate startDate = request.startDate();
		LocalDate endDate = request.endDate() != null ? request.endDate() : startDate;

		task.setTitle(request.title());
		task.setDescription(request.description());
		task.setStatus(request.status());
		task.setStartDate(startDate);
		task.setEndDate(endDate);
		task.setExternalReferenceName(request.externalReferenceName());
		task.setIdCompany(request.idCompany());
		task.setIdUserAssigned(request.idUserAssigned());
		if (request.repeatType() != null) {
			task.setRepeatType(request.repeatType());
			if (request.repeatType() != RepeatType.NONE && task.getSeriesId() == null) {
				task.setSeriesId(UUID.randomUUID().toString());
			}
		}
		task.setRepeatEndDate(null);
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
		if (id != null && id < 0) {
			long pos = -id;
			long epochDay = pos % 10000000L;
			long parentTaskId = pos / 10000000L;
			LocalDate occStart = LocalDate.ofEpochDay(epochDay);

			Task parent = taskRepository.findById(parentTaskId)
					.orElseThrow(() -> new RuntimeException("Parent task not found for virtual occurrence"));

			long durationDays = (parent.getEndDate() != null && parent.getStartDate() != null)
					? java.time.temporal.ChronoUnit.DAYS.between(parent.getStartDate(), parent.getEndDate())
					: 0;
			LocalDate occEnd = (parent.getEndDate() != null) ? occStart.plusDays(durationDays) : null;

			TaskDTO parentDto = mapToDTO(parent);
			return TaskDTO.builder()
					.idTask(id)
					.title(parentDto.title())
					.description(parentDto.description())
					.status("PENDING")
					.startDate(occStart)
					.endDate(occEnd)
					.idCompany(parentDto.idCompany())
					.nameCompany(parentDto.nameCompany())
					.externalReferenceName(parentDto.externalReferenceName())
					.idUserAssigned(parentDto.idUserAssigned())
					.nameUser(parentDto.nameUser())
					.idNode(parentDto.idNode())
					.repeatType(parentDto.repeatType())
					.repeatEndDate(parentDto.repeatEndDate())
					.parentTaskId(parentTaskId)
					.priority(parentDto.priority())
					.seriesId(parentDto.seriesId())
					.build();
		}

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
		List<TaskDTO> resultList = new ArrayList<>(tasks.stream().map(this::mapToDTO).toList());

		// Proyección de ocurrencias virtuales de tareas recurrentes para rango de calendario
		if (start != null && end != null) {
			List<Task> rootRecurring = taskRepository.findRootRecurringTasks(idCompany, idUser);
			for (Task root : rootRecurring) {
				if (root.getStartDate() == null || root.getRepeatType() == null || root.getRepeatType() == RepeatType.NONE) {
					continue;
				}
				if (titlePattern != null && root.getTitle() != null && !root.getTitle().toLowerCase().contains(title.trim().toLowerCase())) {
					continue;
				}

				Long parentId = root.getIdTask();
				long durationDays = (root.getEndDate() != null && root.getStartDate() != null)
						? java.time.temporal.ChronoUnit.DAYS.between(root.getStartDate(), root.getEndDate())
						: 0;

				LocalDate occStart = root.getStartDate();
				LocalDate limitEnd = root.getRepeatEndDate();

				while (occStart != null && !occStart.isAfter(end)) {
					if (limitEnd != null && occStart.isAfter(limitEnd)) {
						break;
					}

					if (!occStart.isBefore(start)) {
						final LocalDate currentOccDate = occStart;
						// Evitar duplicar si ya existe en BD para esta serie en esta fecha
						boolean alreadyInDb = resultList.stream().anyMatch(dto -> 
							(parentId.equals(dto.parentTaskId()) || parentId.equals(dto.idTask())) &&
							currentOccDate.equals(dto.startDate())
						);

						if (!alreadyInDb) {
							// Generar ID virtual determinista negativo
							long virtualId = -(parentId * 10000000L + currentOccDate.toEpochDay());
							LocalDate occEnd = (root.getEndDate() != null) ? currentOccDate.plusDays(durationDays) : null;

							TaskDTO virtualDto = TaskDTO.builder()
									.idTask(virtualId)
									.title(root.getTitle())
									.description(root.getDescription())
									.status("PENDING")
									.startDate(currentOccDate)
									.endDate(occEnd)
									.idCompany(root.getIdCompany())
									.nameCompany(root.getIdCompany() != null ? companyRepository.findById(root.getIdCompany()).map(Company::getName).orElse(null) : "Global / No Company")
									.externalReferenceName(root.getExternalReferenceName())
									.idUserAssigned(root.getIdUserAssigned())
									.nameUser(root.getIdUserAssigned() != null ? userRepository.findById(root.getIdUserAssigned()).map(User::getUsername).orElse(null) : null)
									.idNode(root.getIdNode())
									.repeatType(root.getRepeatType())
									.repeatEndDate(root.getRepeatEndDate())
									.parentTaskId(parentId)
									.priority(root.getPriority() != null ? root.getPriority() : "NORMAL")
									.seriesId(root.getSeriesId())
									.build();

							resultList.add(virtualDto);
						}
					}

					occStart = calculateNextDate(occStart, root.getRepeatType());
				}
			}
		}

		// Filtrar por status si se especificó y no es ALL
		if (status != null && !status.isBlank() && !"ALL".equalsIgnoreCase(status)) {
			resultList = resultList.stream().filter(t -> status.equalsIgnoreCase(t.status())).collect(Collectors.toList());
		}

		// Ordenar por fecha de inicio
		resultList.sort((a, b) -> {
			if (a.startDate() == null) return 1;
			if (b.startDate() == null) return -1;
			return a.startDate().compareTo(b.startDate());
		});

		return resultList;
	}

	@Transactional
	public TaskDTO updateStatus(Long id, String status) {
		if (id != null && id < 0) {
			// Persistir ocurrencia virtual al completarse o cambiar de estado
			long pos = -id;
			long epochDay = pos % 10000000L;
			long parentTaskId = pos / 10000000L;
			LocalDate occStart = LocalDate.ofEpochDay(epochDay);

			Task parent = taskRepository.findById(parentTaskId)
					.orElseThrow(() -> new RuntimeException("Parent task not found for virtual occurrence"));

			// Verificar si ya existe una tarea persistida para esta serie en esta fecha
			List<Task> series = taskRepository.findAllInSeries(parentTaskId);
			Task existing = series.stream().filter(t -> occStart.equals(t.getStartDate())).findFirst().orElse(null);
			if (existing != null) {
				return updateStatus(existing.getIdTask(), status);
			}

			long durationDays = (parent.getEndDate() != null && parent.getStartDate() != null)
					? java.time.temporal.ChronoUnit.DAYS.between(parent.getStartDate(), parent.getEndDate())
					: 0;
			LocalDate occEnd = (parent.getEndDate() != null) ? occStart.plusDays(durationDays) : null;

			Task newChild = Task.builder()
					.title(parent.getTitle())
					.description(parent.getDescription())
					.startDate(occStart)
					.endDate(occEnd)
					.idCompany(parent.getIdCompany())
					.externalReferenceName(parent.getExternalReferenceName())
					.idUserAssigned(parent.getIdUserAssigned())
					.idNode(parent.getIdNode())
					.status(status)
					.repeatType(parent.getRepeatType())
					.repeatEndDate(parent.getRepeatEndDate())
					.parentTaskId(parentTaskId)
					.priority(parent.getPriority() != null ? parent.getPriority() : "NORMAL")
					.seriesId(parent.getSeriesId())
					.build();

			Task saved = taskRepository.save(newChild);
			if ("COMPLETED".equalsIgnoreCase(status)) {
				handleRollingRecurrenceOnComplete(saved);
			}
			return mapToDTO(saved);
		}

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
			List<Long> idsToDelete;

			if (task.getSeriesId() != null) {
				// ✅ New approach: use series_id to find all future occurrences in O(1)
				LocalDate filterDate = task.getStartDate() != null ? task.getStartDate() : LocalDate.now();
				idsToDelete = taskRepository
						.findBySeriesIdAndStartDateGreaterThanEqual(task.getSeriesId(), filterDate)
						.stream().map(Task::getIdTask).collect(Collectors.toList());
			} else {
				// Fallback: legacy parent-child approach for tasks created before series_id
				Long parentId = task.getParentTaskId() != null ? task.getParentTaskId() : task.getIdTask();
				LocalDate filterDate = task.getStartDate() != null ? task.getStartDate() : LocalDate.now();
				idsToDelete = taskRepository.findFutureInSeries(parentId, filterDate)
						.stream().map(Task::getIdTask).collect(Collectors.toList());
			}

			// Always include the current task
			if (!idsToDelete.contains(id)) {
				idsToDelete.add(id);
			}

			log.info("Deleting {} tasks from series (seriesId={})", idsToDelete.size(), task.getSeriesId());

			// Delete each task fresh from DB to avoid stale entity issues
			for (Long taskId : idsToDelete) {
				taskRepository.findById(taskId).ifPresent(this::deleteTaskAndRelated);
			}
		} else {
			deleteTaskAndRelated(task);
		}
	}

	/**
	 * Deletes a single task along with all its related data:
	 * comments, reminders, notifications, and the associated node (folder + files on NAS).
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

		// 3. Delete notifications pointing to this task
		List<com.rfm.application.model.entity.Notification> notifications = notificationRepository.findByReferenceTypeAndReferenceId("task", taskId);
		if (!notifications.isEmpty()) {
			notificationRepository.deleteAll(notifications);
		}

		// 4. Delete the node (folder) and all its content recursively (files + subfolders on NAS)
		if (task.getIdNode() != null) {
			try {
				nodeService.deleteNodeRecursively(task.getIdNode());
			} catch (Exception e) {
				log.warn("Could not fully delete node {} for task {}: {}", task.getIdNode(), taskId, e.getMessage());
			}
		}

		// 5. Delete the task itself
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
				.seriesId(task.getSeriesId())
				.build();
	}
}