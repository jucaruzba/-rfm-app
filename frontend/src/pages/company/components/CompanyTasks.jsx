import TasksPage from "../../admin/components/task/TaskPage";

/**
 * CompanyTasks renders the global TasksPage component scoped to the current company workspace.
 * The companyId route parameter automatically filters all tasks and sets default company on task creation.
 */
const CompanyTasks = () => {
  return <TasksPage />;
};

export default CompanyTasks;
